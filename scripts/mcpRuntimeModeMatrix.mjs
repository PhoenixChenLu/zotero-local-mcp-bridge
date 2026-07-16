#!/usr/bin/env node
/* global fetch */

const DEFAULT_ENDPOINT = "http://127.0.0.1:23119/zotero-local-mcp-bridge/mcp";
const DEFAULT_PROTOCOL_VERSION = "2025-06-18";

const args = parseArgs(process.argv.slice(2));
const expectedMode = args.mode || process.env.ZOTERO_LOCAL_MCP_BRIDGE_EXPECTED_MODE;
const endpoint = args.endpoint || process.env.ZOTERO_LOCAL_MCP_BRIDGE_MCP_ENDPOINT || DEFAULT_ENDPOINT;
const outputJson = args.json || false;
const failOnSkipped = args.failOnSkipped || false;
const includeSafetyWrites = args.includeSafetyWrites || false;
const executeLowRisk = args.executeLowRisk || false;

if (!expectedMode || !["readonly", "askforapprove", "yolo"].includes(expectedMode)) {
  fatal("Usage: node scripts/mcpRuntimeModeMatrix.mjs --mode=readonly|askforapprove|yolo [--json] [--fail-on-skipped]");
}

if (executeLowRisk) {
  fatal("--execute-low-risk is reserved for a future cleanup-safe execute pass and is intentionally not implemented yet");
}

const fixtures = createFixtures();
let cases = [];

const results = [];

try {
  await runMatrix();
  const failed = results.filter((result) => result.status === "failed");
  const skipped = results.filter((result) => result.status === "skipped");

  if (outputJson) {
    console.log(JSON.stringify({ endpoint, expectedMode, results, summary: summarize(results) }, null, 2));
  } else {
    printHumanSummary(results);
  }

  if (failed.length > 0 || (failOnSkipped && skipped.length > 0)) {
    process.exitCode = 1;
  }
} catch (error) {
  fatal(error && error.stack ? error.stack : String(error));
}

async function runMatrix() {
  const initialize = await rpc("initialize", {
    protocolVersion: DEFAULT_PROTOCOL_VERSION,
    capabilities: {},
    clientInfo: {
      name: "zotero-local-mcp-bridge-runtime-mode-matrix",
      version: "0.0.0"
    }
  }, "init");
  assert(!initialize.error, "MCP initialize failed: " + JSON.stringify(initialize.error));

  const toolsList = await rpc("tools/list", {}, "tools");
  assert(!toolsList.error, "MCP tools/list failed: " + JSON.stringify(toolsList.error));
  const tools = toolsList.result && Array.isArray(toolsList.result.tools) ? toolsList.result.tools : [];
  const toolNames = new Set(tools.map((tool) => tool.name));

  const status = await callTool("zotero_safety_get_profile_status", {}, "profile_status");
  const statusPayload = extractToolPayload(status);
  assert(statusPayload.ok, "safety.getProfileStatus failed: " + JSON.stringify(statusPayload.error));
  assert(
    statusPayload.data && statusPayload.data.operationMode === expectedMode,
    `Expected operationMode=${expectedMode}, got ${statusPayload.data && statusPayload.data.operationMode}`
  );
  assert(statusPayload.data.profileMode === "test", `Expected profileMode=test, got ${statusPayload.data.profileMode}`);
  assert(statusPayload.data.testProfileMarkerPresent === true, "Test profile marker is not present");

  await hydrateFixtures(fixtures);
  cases = createMatrixCases(fixtures);

  const matrixToolNames = new Set(cases.map((testCase) => testCase.tool));
  for (const tool of tools) {
    if (!matrixToolNames.has(tool.name)) {
      results.push({
        command: tool.title || tool.name,
        tool: tool.name,
        status: "failed",
        reason: "Tool is exposed by tools/list but has no matrix case"
      });
    }
  }

  for (const testCase of cases) {
    if (!toolNames.has(testCase.tool)) {
      results.push({
        command: testCase.command,
        tool: testCase.tool,
        status: "failed",
        reason: "Matrix case tool is not exposed by tools/list"
      });
      continue;
    }

    const skipReason = shouldSkip(testCase, expectedMode, fixtures);
    if (skipReason) {
      results.push({
        command: testCase.command,
        tool: testCase.tool,
        status: "skipped",
        reason: skipReason
      });
      continue;
    }

    await runCase(testCase);
  }
}

async function runCase(testCase) {
  const requestId = testCase.command.replace(/[^a-zA-Z0-9]+/g, "_");

  if (testCase.kind === "read") {
    const response = await callTool(testCase.tool, clone(testCase.arguments), requestId);
    const payload = extractToolPayload(response);
    if (payload.ok) {
      results.push({ command: testCase.command, tool: testCase.tool, status: "passed", mode: expectedMode });
    } else {
      results.push({
        command: testCase.command,
        tool: testCase.tool,
        status: "failed",
        mode: expectedMode,
        reason: payload.error ? `${payload.error.code}: ${payload.error.message}` : "Read command returned ok=false"
      });
    }
    return;
  }

  if (testCase.kind === "safety-write") {
    results.push({
      command: testCase.command,
      tool: testCase.tool,
      status: "skipped",
      reason: "Safety state write commands are not run by the default matrix"
    });
    return;
  }

  const dryRunArguments = {
    ...clone(testCase.arguments),
    mode: "dry-run"
  };
  const response = await callTool(testCase.tool, dryRunArguments, requestId);
  const payload = extractToolPayload(response);

  if (expectedMode === "readonly") {
    if (payload.ok === false && payload.error && payload.error.code === "OPERATION_MODE_READONLY") {
      results.push({ command: testCase.command, tool: testCase.tool, status: "passed", mode: expectedMode });
    } else {
      results.push({
        command: testCase.command,
        tool: testCase.tool,
        status: "failed",
        mode: expectedMode,
        reason: "Readonly mode did not block write command with OPERATION_MODE_READONLY",
        response: payload
      });
    }
    return;
  }

  if (
    payload.ok === true
    && payload.data
    && payload.data.mode === "dry-run"
    && payload.data.plan
    && typeof payload.data.plan.planId === "string"
    && payload.data.plan.confirmation
    && typeof payload.data.plan.confirmation.token === "string"
    && hasExpectedAgentApproval(payload.data.plan, testCase)
  ) {
    results.push({
      command: testCase.command,
      tool: testCase.tool,
      status: "passed",
      mode: expectedMode,
      planId: payload.data.plan.planId
    });
    return;
  }

  results.push({
    command: testCase.command,
    tool: testCase.tool,
    status: "failed",
    mode: expectedMode,
    reason: "Write dry-run did not return planId, confirmation token, and expected agent approval policy",
    response: payload
  });
}

function hasExpectedAgentApproval(plan, testCase) {
  if (!plan.agentApproval || plan.agentApproval.layer !== "agent") {
    return false;
  }
  if (plan.agentApproval.operationMode !== expectedMode) {
    return false;
  }
  if (expectedMode === "askforapprove") {
    if (plan.agentApproval.required !== true || plan.agentApproval.mayAutoExecute !== false) {
      return false;
    }
    return testCase.highRisk
      ? plan.agentApproval.requiredText === "CONFIRM"
      : plan.agentApproval.requiredText === null;
  }
  if (expectedMode === "yolo") {
    return plan.agentApproval.required === false
      && plan.agentApproval.mayAutoExecute === true
      && plan.agentApproval.requiredText === null;
  }
  return true;
}

async function rpc(method, params, id) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "user-agent": "ZoteroLocalMcpBridgeRuntimeModeMatrix"
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id,
      method,
      params
    })
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${method}: ${text}`);
  }
  return JSON.parse(text);
}

async function callTool(name, toolArguments, id) {
  return rpc("tools/call", { name, arguments: toolArguments }, id);
}

function extractToolPayload(response) {
  if (response.error) {
    return {
      ok: false,
      error: {
        code: `JSON_RPC_${response.error.code}`,
        message: response.error.message
      }
    };
  }
  if (response.result && response.result.structuredContent) {
    return response.result.structuredContent;
  }
  const text = response.result && response.result.content && response.result.content[0]
    ? response.result.content[0].text
    : "";
  return text ? JSON.parse(text) : {};
}

function createFixtures() {
  const root = process.cwd();
  const itemA = env("ZLMB_ITEM_A_KEY", "7N4QZKCM");
  const itemB = env("ZLMB_ITEM_B_KEY", "K7P8J5XF");
  const collection = env("ZLMB_COLLECTION_KEY", "L6UP7MHT");
  const importCollection = env("ZLMB_IMPORT_COLLECTION_KEY", "VZ3P3YEL");
  const attachment = env("ZLMB_ATTACHMENT_KEY", "FQ8474SV");
  const annotation = env("ZLMB_ANNOTATION_KEY", "W6RH6YKC");
  const backup = process.env.ZLMB_BACKUP_ID;

  return {
    root,
    itemA,
    itemB,
    collection,
    importCollection,
    attachment,
    annotation,
    backup,
    parentCollectionKey: process.env.ZLMB_PARENT_COLLECTION_KEY,
    savedSearch: process.env.ZLMB_SAVED_SEARCH_KEY,
    undoAttachment: process.env.ZLMB_UNDO_ATTACHMENT_KEY,
    duplicateMaster: process.env.ZLMB_DUPLICATE_MASTER_KEY,
    duplicateItems: splitEnvList("ZLMB_DUPLICATE_ITEM_KEYS"),
    trashAttachmentKeys: splitEnvList("ZLMB_TRASH_ATTACHMENT_KEYS"),
    trashItemKeys: splitEnvList("ZLMB_TRASH_ITEM_KEYS"),
    trashCollectionKey: process.env.ZLMB_TRASH_COLLECTION_KEY,
    pdfFixture: env("ZLMB_PDF_FIXTURE", `${root}\\tests\\fixtures\\attachments\\sample-paper.pdf`),
    htmlFixture: env("ZLMB_HTML_FIXTURE", `${root}\\tests\\fixtures\\attachments\\sample-page.html`)
  };
}

async function hydrateFixtures(currentFixtures) {
  if (!currentFixtures.parentCollectionKey) {
    const response = await callTool("zotero_collection_get_tree", { libraryScope: "local-user" }, "fixture_collections");
    const payload = extractToolPayload(response);
    const collections = payload.data && Array.isArray(payload.data.collections) ? payload.data.collections : [];
    const parent = collections.find((collection) => collection.collectionKey && collection.collectionKey !== currentFixtures.collection);
    if (parent) {
      currentFixtures.parentCollectionKey = parent.collectionKey;
    }
  }

  if (!currentFixtures.savedSearch) {
    const response = await callTool("zotero_saved_search_list", {}, "fixture_saved_searches");
    const payload = extractToolPayload(response);
    const savedSearches = payload.data && Array.isArray(payload.data.savedSearches) ? payload.data.savedSearches : [];
    if (savedSearches[0] && savedSearches[0].savedSearchKey) {
      currentFixtures.savedSearch = savedSearches[0].savedSearchKey;
    }
  }

  if (!currentFixtures.backup) {
    const response = await callTool("zotero_backup_snapshot_list", { limit: 20 }, "fixture_backups");
    const payload = extractToolPayload(response);
    const snapshots = payload.data && Array.isArray(payload.data.snapshots) ? payload.data.snapshots : [];
    if (snapshots[0] && snapshots[0].backupId) {
      currentFixtures.backup = snapshots[0].backupId;
    }
  }
}

function createMatrixCases(f) {
  return [
    read("collection.getTree", "zotero_collection_get_tree", { libraryScope: "local-user" }),
    read("collection.getItems", "zotero_collection_get_items", { collectionKey: f.collection }),
    read("item.get", "zotero_item_get", { zoteroItemKey: f.itemA }),
    read("item.search", "zotero_item_search", { query: "Zotero Local MCP Bridge", itemType: "document", limit: 10 }),
    read("item.findByDois", "zotero_item_find_by_dois", { dois: ["https://doi.org/10.0000/zotero-local-mcp-bridge-matrix-not-found"] }),
    read("search.advanced", "zotero_search_advanced", {
      conditions: [{ condition: "title", operator: "contains", value: "Zotero" }],
      joinMode: "all",
      limit: 10
    }),
    read("savedSearch.list", "zotero_saved_search_list", {}),
    read("savedSearch.get", "zotero_saved_search_get", { savedSearchKey: f.savedSearch }, { requires: ["savedSearch"] }),
    read("citation.format", "zotero_citation_format", {
      zoteroItemKeys: [f.itemA],
      style: "http://www.zotero.org/styles/chicago-note-bibliography",
      mode: "bibliography"
    }),
    read("export.bibtex", "zotero_export_bibtex", { zoteroItemKeys: [f.itemA] }),
    read("export.ris", "zotero_export_ris", { zoteroItemKeys: [f.itemA] }),
    read("export.cslJson", "zotero_export_csl_json", { zoteroItemKeys: [f.itemA] }),
    read("annotation.list", "zotero_annotation_list", { attachmentKey: f.attachment, includeTrashed: false }),
    read("attachment.get", "zotero_attachment_get", { attachmentKey: f.attachment }),
    read("attachment.getForItem", "zotero_attachment_get_for_item", { zoteroItemKey: f.itemB }),
    read("attachment.renamePreferences.get", "zotero_attachment_rename_preferences_get", {}),
    read("backup.settings.get", "zotero_backup_settings_get", {}),
    read("backup.snapshot.list", "zotero_backup_snapshot_list", { limit: 10 }),
    read("duplicates.find", "zotero_duplicates_find", { limit: 10 }),
    read("audit.list", "zotero_audit_list", { limit: 10 }),
    read("safety.getProfileStatus", "zotero_safety_get_profile_status", {}),

    write("collection.create", "zotero_collection_create", {
      libraryScope: "local-user",
      name: `MCP Matrix Dry Run ${stamp()}`
    }),
    write("collection.rename", "zotero_collection_rename", {
      collectionKey: f.collection,
      name: `MCP Matrix Rename Dry Run ${stamp()}`
    }),
    write("collection.move", "zotero_collection_move", {
      collectionKey: f.collection,
      parentCollectionKey: f.parentCollectionKey || "PLACEHOLDER_PARENT_COLLECTION_KEY_FOR_READONLY_ONLY"
    }, { requiresWhenWritable: ["parentCollectionKey"] }),
    write("collection.addItems", "zotero_collection_add_items", {
      collectionKey: f.collection,
      zoteroItemKeys: [f.itemA]
    }),
    write("collection.removeItems", "zotero_collection_remove_items", {
      collectionKey: f.collection,
      zoteroItemKeys: [f.itemA]
    }),
    write("collection.trash", "zotero_collection_trash", {
      collectionKey: f.trashCollectionKey || "PLACEHOLDER_COLLECTION_KEY_FOR_READONLY_ONLY",
      trashDescendentItems: false
    }, { highRisk: true, requiresWhenWritable: ["trashCollectionKey"] }),
    write("item.create", "zotero_item_create", {
      libraryScope: "local-user",
      itemType: "document",
      fields: { title: `MCP Matrix Item Dry Run ${stamp()}` },
      collectionKeys: [f.collection],
      tags: ["mcp-matrix-dry-run"]
    }),
    write("item.updateFields", "zotero_item_update_fields", {
      zoteroItemKey: f.itemA,
      fields: { title: "Zotero Local MCP Bridge Test Item A" }
    }),
    write("item.updateCreators", "zotero_item_update_creators", {
      zoteroItemKey: f.itemA,
      creators: [{ creatorType: "author", firstName: "MCP", lastName: "Matrix" }]
    }),
    write("item.setCollections", "zotero_item_set_collections", {
      zoteroItemKey: f.itemA,
      collectionKeys: [f.collection]
    }),
    write("item.updateTags", "zotero_item_update_tags", {
      zoteroItemKey: f.itemA,
      addTags: ["mcp-matrix-dry-run"],
      removeTags: []
    }),
    write("item.trash", "zotero_item_trash", {
      zoteroItemKeys: f.trashItemKeys.length > 0 ? f.trashItemKeys : ["PLACEHOLDER_ITEM_KEY_FOR_READONLY_ONLY"]
    }, { highRisk: true, requiresWhenWritable: ["trashItemKeys"] }),
    write("savedSearch.create", "zotero_saved_search_create", {
      name: `MCP Matrix Saved Search Dry Run ${stamp()}`,
      conditions: [{ condition: "title", operator: "contains", value: "Zotero" }],
      joinMode: "all"
    }),
    write("savedSearch.update", "zotero_saved_search_update", {
      savedSearchKey: f.savedSearch,
      name: `MCP Matrix Saved Search Update Dry Run ${stamp()}`,
      conditions: [{ condition: "title", operator: "contains", value: "Zotero" }],
      joinMode: "all"
    }, { requires: ["savedSearch"] }),
    write("import.bibtex", "zotero_import_bibtex", {
      content: `@article{mcp_matrix_${stamp()}, title={MCP Matrix BibTeX Dry Run}, author={Bridge, Zotero}, year={2026}}`,
      collectionKeys: [f.importCollection],
      tags: ["mcp-matrix-dry-run"]
    }),
    write("import.ris", "zotero_import_ris", {
      content: "TY  - JOUR\nTI  - MCP Matrix RIS Dry Run\nAU  - Bridge, Zotero\nPY  - 2026\nER  -\n",
      collectionKeys: [f.importCollection],
      tags: ["mcp-matrix-dry-run"]
    }),
    write("import.cslJson", "zotero_import_csl_json", {
      content: JSON.stringify([{ type: "article-journal", title: "MCP Matrix CSL JSON Dry Run", issued: { "date-parts": [[2026]] } }]),
      collectionKeys: [f.importCollection],
      tags: ["mcp-matrix-dry-run"]
    }),
    write("annotation.create", "zotero_annotation_create", {
      attachmentKey: f.attachment,
      annotationType: "highlight",
      annotationText: "MCP Matrix annotation dry run",
      annotationComment: "dry-run only",
      annotationColor: "#ffd400",
      annotationPageLabel: "1",
      annotationSortIndex: "00000|000000|00000",
      annotationPosition: { pageIndex: 0, rects: [[72, 72, 180, 90]] }
    }),
    write("annotation.update", "zotero_annotation_update", {
      annotationKey: f.annotation,
      annotationComment: "MCP Matrix annotation update dry run",
      annotationColor: "#ff6666"
    }),
    write("note.createChild", "zotero_note_create_child", {
      zoteroItemKey: f.itemA,
      content: "MCP Matrix child note dry run",
      contentFormat: "text"
    }),
    write("attachment.addFile", "zotero_attachment_add_file", {
      zoteroItemKey: f.itemA,
      filePath: f.pdfFixture,
      attachmentMode: "copy"
    }),
    write("attachment.moveToItem", "zotero_attachment_move_to_item", {
      attachmentKey: f.attachment,
      targetZoteroItemKey: f.itemA
    }),
    write("attachment.rename", "zotero_attachment_rename", {
      attachmentKey: f.attachment,
      title: `MCP Matrix Attachment Rename Dry Run ${stamp()}`,
      renameFile: false
    }),
    write("attachment.runZoteroRename", "zotero_attachment_run_zotero_rename", {
      attachmentKey: f.attachment
    }),
    write("attachment.undoAdded", "zotero_attachment_undo_added", {
      attachmentKey: f.undoAttachment || "PLACEHOLDER_ATTACHMENT_KEY_FOR_READONLY_ONLY"
    }, { requiresWhenWritable: ["undoAttachment"] }),
    write("attachment.trash", "zotero_attachment_trash", {
      attachmentKeys: f.trashAttachmentKeys.length > 0 ? f.trashAttachmentKeys : ["PLACEHOLDER_ATTACHMENT_KEY_FOR_READONLY_ONLY"]
    }, { highRisk: true, requiresWhenWritable: ["trashAttachmentKeys"] }),
    write("attachment.renamePreferences.set", "zotero_attachment_rename_preferences_set", {
      preferences: { autoRenameFiles: true }
    }),
    write("backup.settings.set", "zotero_backup_settings_set", {
      policy: { retentionDays: 30, maxLocalBytes: 10737418240, enableTimeLimit: true, enableSpaceLimit: true }
    }),
    write("backup.snapshot.restore", "zotero_backup_snapshot_restore", {
      backupId: f.backup || "PLACEHOLDER_BACKUP_ID_FOR_READONLY_ONLY"
    }, { highRisk: true, requiresWhenWritable: ["backup"] }),
    write("backup.snapshot.prune", "zotero_backup_snapshot_prune", {}, { highRisk: true }),
    write("duplicates.merge", "zotero_duplicates_merge", {
      masterZoteroItemKey: f.duplicateMaster,
      duplicateZoteroItemKeys: f.duplicateItems
    }, { highRisk: true, requires: ["duplicateMaster", "duplicateItems"] }),
    safetyWrite("safety.unlockRealProfile", "zotero_safety_unlock_real_profile", {
      profileFingerprint: "PLACEHOLDER_REAL_PROFILE_FINGERPRINT",
      confirmationText: "I understand and authorize temporary real-library write access",
      ttlMinutes: 30
    }),
    safetyWrite("safety.lockRealProfile", "zotero_safety_lock_real_profile", {})
  ];
}

function read(command, tool, toolArguments, options = {}) {
  return { command, tool, arguments: toolArguments, kind: "read", ...options };
}

function write(command, tool, toolArguments, options = {}) {
  return { command, tool, arguments: { ...toolArguments, profileMode: "test" }, kind: "write", ...options };
}

function safetyWrite(command, tool, toolArguments, options = {}) {
  return { command, tool, arguments: toolArguments, kind: "safety-write", ...options };
}

function shouldSkip(testCase, mode, fixtures) {
  if (testCase.kind === "safety-write" && !includeSafetyWrites) {
    return "Safety state write command; pass --include-safety-writes only for explicit safety testing";
  }

  const required = mode === "readonly"
    ? testCase.requires || []
    : [...(testCase.requires || []), ...(testCase.requiresWhenWritable || [])];
  const missing = required.filter((name) => {
    const value = fixtures[name];
    return value === undefined || value === "" || (Array.isArray(value) && value.length === 0);
  });
  return missing.length > 0 ? `Missing fixture(s): ${missing.join(", ")}` : "";
}

function parseArgs(rawArgs) {
  const parsed = {};
  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];
    if (arg === "--json") parsed.json = true;
    else if (arg === "--fail-on-skipped") parsed.failOnSkipped = true;
    else if (arg === "--include-safety-writes") parsed.includeSafetyWrites = true;
    else if (arg === "--execute-low-risk") parsed.executeLowRisk = true;
    else if (arg.startsWith("--mode=")) parsed.mode = arg.slice("--mode=".length);
    else if (arg === "--mode") parsed.mode = rawArgs[++index];
    else if (arg.startsWith("--endpoint=")) parsed.endpoint = arg.slice("--endpoint=".length);
    else if (arg === "--endpoint") parsed.endpoint = rawArgs[++index];
  }
  return parsed;
}

function env(name, fallback) {
  return process.env[name] && process.env[name].trim().length > 0 ? process.env[name].trim() : fallback;
}

function splitEnvList(name) {
  return process.env[name]
    ? process.env[name].split(",").map((part) => part.trim()).filter(Boolean)
    : [];
}

function stamp() {
  return new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function summarize(items) {
  return items.reduce((summary, item) => {
    summary[item.status] = (summary[item.status] || 0) + 1;
    return summary;
  }, {});
}

function printHumanSummary(items) {
  const summary = summarize(items);
  console.log(`MCP runtime mode matrix: mode=${expectedMode}`);
  console.log(`passed=${summary.passed || 0} failed=${summary.failed || 0} skipped=${summary.skipped || 0}`);
  for (const item of items) {
    const suffix = item.reason ? ` - ${item.reason}` : item.planId ? ` - ${item.planId}` : "";
    console.log(`${item.status.toUpperCase()}: ${item.tool} (${item.command})${suffix}`);
  }
}

function fatal(message) {
  console.error(message);
  process.exit(1);
}
