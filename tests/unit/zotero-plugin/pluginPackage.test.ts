import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const xpiPath = path.resolve("dist", "zotero-local-mcp-bridge.xpi");
const runtimeAuthTokenPath = path.resolve("runtime", "auth", "bridge-token");
const supportedLocalesPath = path.resolve("src", "zotero-plugin", "locale", "supportedLocales.json");
const fluentResourceName = "zotero-local-mcp-bridge.ftl";
const escapedRuntimeRootForBundle = path.resolve(".").replace(/\\/g, "\\\\");

describe.sequential("Zotero plugin package", () => {
  it("declares compatibility with Zotero 9", async () => {
    const manifest = JSON.parse(await readFile(path.resolve("src", "zotero-plugin", "manifest.json"), "utf8")) as {
      homepage_url: string;
      applications: {
        zotero: {
          id: string;
          update_url: string;
          strict_min_version: string;
          strict_max_version: string;
        };
      };
    };

    expect(manifest.applications.zotero.id).toBe("zotero-local-mcp-bridge@example.com");
    expect(manifest.homepage_url).toBe("https://github.com/PhoenixChenLu/zotero-local-mcp-bridge");
    expect(manifest.applications.zotero.update_url).toBe(
      "https://github.com/PhoenixChenLu/zotero-local-mcp-bridge/releases/latest/download/updates.json"
    );
    expect(manifest.applications.zotero.strict_min_version).toBe("7.0");
    expect(manifest.applications.zotero.strict_max_version).toBe("9.*");
  });

  it("registers only the plugin-hosted Zotero connector MCP endpoint", async () => {
    const bootstrap = await readFile(path.resolve("src", "zotero-plugin", "bootstrap.js"), "utf8");

    expect(bootstrap).toContain('version: "0.1.60"');
    expect(bootstrap).toContain("Zotero.PreferencePanes.register");
    expect(bootstrap).toContain('src: data.rootURI + "preferences.xhtml"');
    expect(bootstrap).toContain('scripts: [data.rootURI + "preferences.js"]');
    expect(bootstrap).toContain('stylesheets: [data.rootURI + "preferences.css"]');
    expect(bootstrap).toContain('BRIDGE_OPERATION_MODE_DEFAULT = "readonly"');
    expect(bootstrap).toContain('BRIDGE_RUNTIME_ROOT_PREFERENCE = "extensions.zotero-local-mcp-bridge.runtimeRoot"');
    expect(bootstrap).toContain('BRIDGE_AUDIT_ROOT_PREFERENCE = "extensions.zotero-local-mcp-bridge.auditRoot"');
    expect(bootstrap).toContain('BRIDGE_BACKUP_ROOT_PREFERENCE = "extensions.zotero-local-mcp-bridge.backupRoot"');
    expect(bootstrap).toContain("isAllowedBridgeOutputRoot(explicitPreference)");
    expect(bootstrap).toContain('PathUtils.join(resolveBridgeRuntimeRoot(), "ZoteroData")');
    expect(bootstrap).toContain('PathUtils.join(Zotero.DataDirectory.dir, "storage")');
    expect(bootstrap).toContain("persistRuntimeRootPreference()");
    expect(bootstrap).toContain("Zotero.Prefs.set(name, value, true)");
    expect(bootstrap).toContain("function getBridgeOperationMode");
    expect(bootstrap).toContain("assertOperationWritePermission(operationMode, commandName)");
    expect(bootstrap).toContain('"OPERATION_MODE_READONLY"');
    expect(bootstrap).toContain("operationMode: operationMode");
    expect(bootstrap).toContain("function createAgentApprovalPolicy");
    expect(bootstrap).toContain("function assertConfirmationOperation");
    expect(bootstrap).toContain("assertConfirmationOperation(commandName, payload.confirmation)");
    expect(bootstrap).toContain('"PLAN_OPERATION_MISMATCH"');
    expect(bootstrap).toContain("function readSafetyCenterSnapshot");
    expect(bootstrap).not.toContain("function approveSafetyCenterPlan");
    expect(bootstrap).toContain("function rejectSafetyCenterPlan");
    expect(bootstrap).toContain("Zotero.ZoteroLocalMcpBridgeSafetyCenter");
    expect(bootstrap).toContain("normalizedInput: normalizedInput");
    expect(bootstrap).toContain("resolvedTargets: resolvedTargets");
    expect(bootstrap).toContain('layer: "agent"');
    expect(bootstrap).toContain('operationMode === "askforapprove"');
    expect(bootstrap).toContain('requiredText = "CONFIRM"');
    expect(bootstrap).toContain("requiredText = operation");
    expect(bootstrap).toContain('mcpPath: "/zotero-local-mcp-bridge/mcp"');
    expect(bootstrap).toContain("function registerMcpEndpoint");
    expect(bootstrap).toContain("function handleMcpEndpointRequest");
    expect(bootstrap).toContain("function handleMcpJsonRpc");
    expect(bootstrap).toContain("function handleMcpToolCall");
    expect(bootstrap).toContain('payload.method === "initialize"');
    expect(bootstrap).toContain('payload.method === "tools/list"');
    expect(bootstrap).toContain('payload.method === "tools/call"');
    expect(bootstrap).toContain("createMcpToolDescriptors()");
    expect(bootstrap).toContain('"zotero_command_catalog"');
    expect(bootstrap).toContain("createMcpCommandCatalog()");
    expect(bootstrap).toContain("createMcpToolInputSchema(commandName)");
    expect(bootstrap).toContain("ZoteroLocalMcpBridgeMcpCommandMetadata");
    expect(bootstrap).toContain('enum: ["local-user"]');
    expect(bootstrap).toContain('"Update Zotero item metadata fields');
    expect(bootstrap).toContain('metadataUpdate: "Use zotero_item_update_fields');
    expect(bootstrap).toContain('libraryScope === "user"');
    expect(bootstrap).toContain("normalizeLocalUserLibraryScope(input.libraryScope");
    expect(bootstrap).toContain("executeInternalCommandPayload(commandPayload)");
    expect(bootstrap).toContain("extractMcpCommandInput(args, commandName)");
    expect(bootstrap).toContain("mode: isWriteCommandName(commandName) ? args.mode : undefined");
    expect(bootstrap).toContain('replace(/([a-z0-9])([A-Z])/g, "$1_$2")');
    expect(bootstrap).toContain("Zotero.Server.Endpoints[ZoteroLocalMcpBridge.mcpPath]");
    expect(bootstrap).not.toContain('healthPath: "/zotero-local-mcp-bridge/health"');
    expect(bootstrap).not.toContain('commandPath: "/zotero-local-mcp-bridge/command"');
    expect(bootstrap).not.toContain("function registerHealthEndpoint");
    expect(bootstrap).not.toContain("function registerCommandEndpoint");
    expect(bootstrap).not.toContain("Zotero.Server.Endpoints[ZoteroLocalMcpBridge.healthPath]");
    expect(bootstrap).not.toContain("Zotero.Server.Endpoints[ZoteroLocalMcpBridge.commandPath]");
    expect(bootstrap).not.toContain("startMcpSidecar");
    expect(bootstrap).not.toContain("stopMcpSidecar");
    expect(bootstrap).not.toContain("23120");
    expect(bootstrap).toContain('commandName === "collection.getTree"');
    expect(bootstrap).toContain('commandName === "collection.create"');
    expect(bootstrap).toContain('commandName === "collection.rename"');
    expect(bootstrap).toContain('commandName === "collection.move"');
    expect(bootstrap).toContain('commandName === "collection.getItems"');
    expect(bootstrap).toContain('commandName === "collection.addItems"');
    expect(bootstrap).toContain('commandName === "collection.removeItems"');
    expect(bootstrap).toContain('commandName === "collection.trash"');
    expect(bootstrap).toContain('commandName === "item.get"');
    expect(bootstrap).toContain('commandName === "item.search"');
    expect(bootstrap).toContain('commandName === "item.findByDois"');
    expect(bootstrap).toContain('commandName === "search.advanced"');
    expect(bootstrap).toContain('commandName === "savedSearch.list"');
    expect(bootstrap).toContain('commandName === "savedSearch.get"');
    expect(bootstrap).toContain('commandName === "savedSearch.create"');
    expect(bootstrap).toContain('commandName === "savedSearch.update"');
    expect(bootstrap).toContain('commandName === "citation.format"');
    expect(bootstrap).toContain('commandName === "duplicates.find"');
    expect(bootstrap).toContain('commandName === "duplicates.merge"');
    expect(bootstrap).toContain('commandName === "import.bibtex"');
    expect(bootstrap).toContain('commandName === "import.ris"');
    expect(bootstrap).toContain('commandName === "import.cslJson"');
    expect(bootstrap).toContain('commandName === "export.bibtex"');
    expect(bootstrap).toContain('commandName === "export.ris"');
    expect(bootstrap).toContain('commandName === "export.cslJson"');
    expect(bootstrap).toContain('commandName === "annotation.list"');
    expect(bootstrap).toContain('commandName === "annotation.create"');
    expect(bootstrap).toContain('commandName === "annotation.update"');
    expect(bootstrap).toContain('commandName === "item.create"');
    expect(bootstrap).toContain('commandName === "item.updateFields"');
    expect(bootstrap).toContain('commandName === "item.updateCreators"');
    expect(bootstrap).toContain('commandName === "item.setCollections"');
    expect(bootstrap).toContain('commandName === "item.updateTags"');
    expect(bootstrap).toContain('commandName === "item.trash"');
    expect(bootstrap).toContain('commandName === "note.createChild"');
    expect(bootstrap).toContain('commandName === "attachment.get"');
    expect(bootstrap).toContain('commandName === "attachment.getForItem"');
    expect(bootstrap).toContain('commandName === "attachment.addFile"');
    expect(bootstrap).toContain('commandName === "pdf.addAndRecognize"');
    expect(bootstrap).toContain('commandName === "pdf.addAndRecognizeBatch"');
    expect(bootstrap).toContain('commandName === "attachment.recognizeMetadata"');
    expect(bootstrap).toContain('commandName === "attachment.moveToItem"');
    expect(bootstrap).toContain('commandName === "attachment.rename"');
    expect(bootstrap).toContain('commandName === "attachment.runZoteroRename"');
    expect(bootstrap).toContain('commandName === "attachment.undoAdded"');
    expect(bootstrap).toContain('commandName === "attachment.trash"');
    expect(bootstrap).toContain('commandName === "attachment.renamePreferences.get"');
    expect(bootstrap).toContain('commandName === "attachment.renamePreferences.set"');
    expect(bootstrap).toContain('commandName === "backup.settings.get"');
    expect(bootstrap).toContain('commandName === "backup.settings.set"');
    expect(bootstrap).toContain('commandName === "backup.snapshot.list"');
    expect(bootstrap).toContain('commandName === "backup.snapshot.restore"');
    expect(bootstrap).toContain('commandName === "backup.snapshot.prune"');
    expect(bootstrap).toContain('commandName === "audit.list"');
    expect(bootstrap).toContain('REAL_PROFILE_DEFAULT_MODE = "real-unlocked"');
    expect(bootstrap).toContain("return REAL_PROFILE_DEFAULT_MODE");
    expect(bootstrap).not.toContain('commandName === "safety.getProfileStatus"');
    expect(bootstrap).not.toContain('"safety.unlockRealProfile",');
    expect(bootstrap).not.toContain('"safety.lockRealProfile",');
    expect(bootstrap).not.toContain('REAL_PROFILE_UNLOCK_CONFIRMATION');
    expect(bootstrap).not.toContain('"PROFILE_UNLOCK_FINGERPRINT_MISMATCH"');
    expect(bootstrap).not.toContain('"PROFILE_UNLOCK_CONFIRMATION_REQUIRED"');
    expect(bootstrap).not.toContain("function realProfileUnlockError");
    expect(bootstrap).toContain("function commandErrorResponse");
    expect(bootstrap).not.toContain("function isProfileUnlockActive");
    expect(bootstrap).not.toContain("function readRealProfileUnlockState");
    expect(bootstrap).not.toContain("function saveRealProfileUnlockState");
    expect(bootstrap).toContain('"COMMAND_CONTEXT_FAILED"');
    expect(bootstrap).toContain("function getPreferenceValue");
    expect(bootstrap).toContain("getPreferenceValue(REAL_PROFILE_PREFERENCE_MODE)");
    expect(bootstrap).toContain("await isTestProfileMarkerPresent()");
    expect(bootstrap).toContain('return "test"');
    expect(bootstrap).toContain('LEGACY_TEST_PROFILE_MARKER_FILE = ".zotero-codex-bridge-test-profile"');
    expect(bootstrap).toContain("getPreferenceValue(BRIDGE_RUNTIME_ROOT_PREFERENCE)");
    expect(bootstrap).not.toContain("REAL_PROFILE_STATE_PATH_PARTS");
    expect(bootstrap).not.toContain('if (preferenceMode === "real-unlocked")');
    expect(bootstrap).toContain("events: entries");
    expect(bootstrap).toContain("createBackupFileSnapshot");
    expect(bootstrap).toContain("readBackupSnapshotList");
    expect(bootstrap).toContain("normalizeBackupSnapshotRecord");
    expect(bootstrap).toContain("executeBackupSnapshotRestore");
    expect(bootstrap).toContain("normalizeBackupSnapshotRestoreInput");
    expect(bootstrap).toContain("executeBackupSnapshotPrune");
    expect(bootstrap).toContain("planBackupSnapshotPrune");
    expect(bootstrap).toContain("BACKUP_SNAPSHOT_PRUNE_PATH_INVALID");
    expect(bootstrap).toContain("readItemDetails");
    expect(bootstrap).toContain("searchItems");
    expect(bootstrap).toContain("findItemsByDois");
    expect(bootstrap).toContain("normalizeDoiLookupInput");
    expect(bootstrap).toContain("normalizeDoiValue");
    expect(bootstrap).toContain('fields: ["dois"]');
    expect(bootstrap).toContain('fieldName === "dois"');
    expect(bootstrap).toContain("matchedItemKeys");
    expect(bootstrap).toContain("unmatchedDois");
    expect(bootstrap).toContain("runAdvancedSearch");
    expect(bootstrap).toContain("new Zotero.Search()");
    expect(bootstrap).toContain("Zotero.Searches.getByLibraryAndKey");
    expect(bootstrap).toContain("Zotero.Cite.makeFormattedBibliographyOrCitationList");
    expect(bootstrap).toContain("executeImportWithTranslator");
    expect(bootstrap).toContain("new Zotero.Translate.Import()");
    expect(bootstrap).toContain("estimateImportItemCount");
    expect(bootstrap).toContain("exportItemsWithTranslator");
    expect(bootstrap).toContain("new Zotero.Translate.Export()");
    expect(bootstrap).toContain('new Zotero.Item("annotation")');
    expect(bootstrap).toContain("attachment.getAnnotations(includeTrashed)");
    expect(bootstrap).toContain("annotation.annotationPosition = normalized.annotationPosition");
    expect(bootstrap).toContain('bibtex: "9cb70025-a888-4a29-a210-93ec52da40d4"');
    expect(bootstrap).toContain('ris: "32d59d2d-b65a-4da4-b0a3-bdd3cfb979e7"');
    expect(bootstrap).toContain('cslJson: "bc03b4fe-436d-4a1f-ba59-de4d2d7a63f7"');
    expect(bootstrap).toContain("readAttachmentDetails");
    expect(bootstrap).toContain("item.toJSON");
    expect(bootstrap).toContain("new Zotero.Item(normalized.itemType)");
    expect(bootstrap).toContain("item.setField(fieldName, fields[fieldName])");
    expect(bootstrap).toContain("item.setCreators(creators, { strict: true })");
    expect(bootstrap).toContain("normalizeItemCreateInput");
    expect(bootstrap).toContain("normalizeItemUpdateFieldsInput");
    expect(bootstrap).toContain("normalizeItemUpdateCreatorsInput");
    expect(bootstrap).toContain("normalizeItemSetCollectionsInput");
    expect(bootstrap).toContain("getCollections(true)");
    expect(bootstrap).toContain("backupFilesRootPath");
    expect(bootstrap).toContain("IOUtils.copy");
    expect(bootstrap).toContain('PathUtils.join(resolveBridgeDefaultAppDataRoot(), "backup")');
    expect(bootstrap).toContain('"settings.json"');
    expect(bootstrap).toContain("normalizeBackupPolicy");
    expect(bootstrap).toContain('new Zotero.Item("note")');
    expect(bootstrap).toContain("Zotero.Attachments.importFromFile");
    expect(bootstrap).toContain("Zotero.Attachments.linkFromFile");
    expect(bootstrap).toContain('".md"');
    expect(bootstrap).toContain('".markdown"');
    expect(bootstrap).toContain("Zotero.RecognizeDocument.recognizeItems");
    expect(bootstrap).toContain("Zotero.RecognizeDocument.canRecognize");
    expect(bootstrap).toContain('commandName === "pdf.addAndRecognize"');
    expect(bootstrap).toContain('commandName === "pdf.addAndRecognizeBatch"');
    expect(bootstrap).toContain("createPdfAddAndRecognizeBatchDryRun");
    expect(bootstrap).toContain("executePdfAddAndRecognizeBatch");
    expect(bootstrap).toContain("normalizePdfAddAndRecognizeBatchInput");
    expect(bootstrap).toContain('"pdf.addAndRecognizeBatch"');
    expect(bootstrap).toContain('"filePaths"');
    expect(bootstrap).toContain('commandName === "attachment.recognizeMetadata"');
    expect(bootstrap).toContain("Zotero.Items.trashTx");
    expect(bootstrap).toContain("Zotero.Duplicates");
    expect(bootstrap).toContain("Zotero.Items.merge");
    expect(bootstrap).toContain("collection.deleted = true");
    expect(bootstrap).toContain("findBridgeAttachmentAddAudit");
    expect(bootstrap).toContain("attachment.parentKey = normalized.targetZoteroItemKey");
    expect(bootstrap).toContain('return PathUtils.join(appData || localAppData || home || "", "zotero-local-mcp-bridge");');
    expect(bootstrap).toContain("var localAppData = getEnvironmentValue(\"LOCALAPPDATA\");");
    expect(bootstrap).toContain('var appData = getEnvironmentValue("APPDATA");');
    expect(bootstrap).toContain('typeof Zotero.isWin === "boolean"');
    expect(bootstrap).toContain('typeof Zotero.isMac === "boolean"');
    expect(bootstrap).toContain('return !!getEnvironmentValue("APPDATA") || !!getEnvironmentValue("LOCALAPPDATA")');
    expect(bootstrap).toContain("renameAttachmentFile");
    expect(bootstrap).toContain("shouldAutoRenameAttachment");
    expect(bootstrap).toContain("getFileBaseNameFromItem");
    expect(bootstrap).toContain('Zotero.Prefs.set("autoRenameFiles"');
    expect(bootstrap).toContain("Zotero.SyncedSettings.set");
    expect(bootstrap).toContain("Zotero.File.putContentsAsync");
    expect(bootstrap).toContain("Zotero.File.getContentsAsync");
    expect(bootstrap).toContain("Zotero.File.createDirectoryIfMissingAsync");
    expect(bootstrap).toContain('PathUtils.join(resolveBridgeDefaultAppDataRoot(), "runtime")');
    expect(bootstrap).toContain('PathUtils.join(resolveBridgeRuntimeRoot(), "auth", "bridge-token")');
    expect(bootstrap).toContain('PathUtils.join(resolveBridgeDefaultAppDataRoot(), "audit")');
    expect(bootstrap).toContain('attachment.setField("title", normalized.title)');
    expect(bootstrap).toContain("note.setNote");
    expect(bootstrap).toContain("noteHtmlPreview");
    expect(bootstrap).toContain("getAttachments(false)");
    expect(bootstrap).toContain("getFilePathAsync");
    expect(bootstrap).toContain("CONFIRMATION_REQUIRED");
    expect(bootstrap).toContain("Zotero.Collections.getByLibrary");
    expect(bootstrap).toContain("return [");
    expect(bootstrap).toContain("function onMainWindowLoad");
    expect(bootstrap).toContain("function onMainWindowUnload");
    expect(bootstrap).toContain("runtimeRoot: __ZOTERO_LOCAL_MCP_BRIDGE_RUNTIME_ROOT__");
    expect(bootstrap).not.toContain("runtimeRoot: resolveBridgeRuntimeRoot(),");
    expect(bootstrap).toContain("var expectedAuthToken;");
    expect(bootstrap).toContain("try {");
    expect(bootstrap).toContain("expectedAuthToken = await getExpectedAuthToken();");
    expect(bootstrap).toContain('throw commandError("COMMAND_AUTH_TOKEN_MISSING"');
    expect(bootstrap).toContain('throw commandError("COMMAND_AUTH_TOKEN_INVALID"');
    expect(bootstrap).toContain('code: error.code || "COMMAND_AUTH_TOKEN_MISSING"');
    expect(bootstrap).toContain("return jsonCommandResponse(error.status || 503, \"unknown\", \"unknown\", undefined, {");
  });

  it("builds an installable XPI with manifest and bootstrap entry", async () => {
    await rm(xpiPath, { force: true });

    await execFileAsync(process.execPath, ["scripts/buildZoteroPlugin.mjs"], { windowsHide: true });

    expect(existsSync(xpiPath)).toBe(true);

    const { stdout } = await execFileAsync("tar", ["-tf", xpiPath], { windowsHide: true });
    expect(stdout).toContain("manifest.json");
    expect(stdout).toContain("bootstrap.js");
    expect(stdout).toContain("prefs.js");
    expect(stdout).toContain("preferences.xhtml");
    expect(stdout).toContain("preferences.js");
    expect(stdout).toContain("preferences.css");
    expect(stdout).toContain(`locale/en-US/${fluentResourceName}`);
    expect(stdout).toContain(`locale/zh-CN/${fluentResourceName}`);

    const bootstrap = await execFileAsync("tar", ["-xOf", xpiPath, "bootstrap.js"], { windowsHide: true });
    expect(bootstrap.stdout).not.toContain("__ZOTERO_LOCAL_MCP_BRIDGE_AUTH_TOKEN__");
    expect(bootstrap.stdout).not.toContain("__ZOTERO_LOCAL_MCP_BRIDGE_RUNTIME_ROOT__");
    expect(bootstrap.stdout).not.toContain(`runtimeRoot: "${escapedRuntimeRootForBundle}"`);
  }, 30000);

  it("defines settings UI resources and defaults", async () => {
    const prefs = await readFile(path.resolve("src", "zotero-plugin", "prefs.js"), "utf8");
    const preferences = await readFile(path.resolve("src", "zotero-plugin", "preferences.xhtml"), "utf8");
    const script = await readFile(path.resolve("src", "zotero-plugin", "preferences.js"), "utf8");

    expect(prefs).toContain('pref("extensions.zotero-local-mcp-bridge.operationMode", "readonly")');
    expect(prefs).not.toContain("realProfileUnlockTtlMinutes");
    expect(prefs).toContain('pref("extensions.zotero-local-mcp-bridge.fileBackupEnabled", true)');
    expect(prefs).toContain('pref("extensions.zotero-local-mcp-bridge.backupMaxLocalGb", 10)');
    expect(prefs).not.toContain('pref("extensions.zotero-local-mcp-bridge.backupMaxLocalBytes", 10737418240)');
    expect(preferences).toContain('value="readonly"');
    expect(preferences).toContain('value="askforapprove"');
    expect(preferences).toContain('value="yolo"');
    expect(preferences).not.toContain("zcb-real-profile-ttl");
    expect(script).not.toContain("realProfileUnlockTtlMinutes");
    expect(preferences).not.toContain("Dry-run and audit are always enabled");
    expect(preferences).not.toContain("Enable file-level backup and undo");
    expect(preferences).not.toContain("Copy to Zotero storage");
    expect(preferences).not.toContain("<?xml");
    expect(preferences).not.toContain("<caption");
    expect(preferences).toContain('rel="localization"');
    expect(preferences).toContain(`href="${fluentResourceName}"`);
    expect(preferences).toContain('data-l10n-id="zotero-local-mcp-bridge-title"');
    expect(preferences).not.toContain("<html:h2>Zotero Local MCP Bridge</html:h2>");
    expect(preferences).not.toContain('label="Enable file-level backup and undo"');
    expect(preferences).not.toContain('label="Choose..."');
    expect(preferences).not.toContain('onload="ZoteroLocalMcpBridgePreferences.init()"');
    expect(preferences).toContain('id="zcb-run-mode-help"');
    expect(preferences).toContain('class="zcb-help-button"');
    expect(preferences).toContain('tooltip="zcb-run-mode-tooltip"');
    expect(preferences).toContain('id="zcb-run-mode-tooltip"');
    expect(preferences).toContain('class="zcb-tooltip-description"');
    expect(preferences).not.toContain('id="zcb-run-mode-help-popover"');
    expect(preferences).not.toContain('class="zcb-help-popover"');
    expect(preferences).not.toContain('tooltiptext="readonly blocks all write commands');
    expect(preferences).not.toContain('id="zcb-run-mode-help-text"');
    expect(preferences).toContain('id="zcb-runtime-root-choose"');
    expect(preferences).toContain('id="zcb-audit-path-choose"');
    expect(preferences).toContain('id="zcb-backup-path-choose"');
    expect(preferences).toContain('id="zcb-safety-center"');
    expect(preferences).toContain('id="zcb-safety-refresh"');
    expect(preferences).toContain('id="zcb-pending-plans"');
    expect(preferences).toContain('id="zcb-audit-events"');
    expect(preferences).toContain('id="zcb-undo-entries"');
    expect(preferences).toContain('id="zcb-backup-summary"');
    expect(preferences).toContain('class="directory-path zcb-path-control"');
    expect(preferences).not.toContain('class="zcb-folder-icon"');
    expect(preferences).not.toContain("ZoteroLocalMcpBridgePreferences.chooseRuntimeRoot()");
    expect(preferences).toContain('data-l10n-id="zotero-local-mcp-bridge-choose-directory"');
    expect(script).toContain("Zotero.Prefs.get(fullName, true)");
    expect(script).toContain("Zotero.Prefs.set(prefPrefix + name, value, true)");
    expect(script).toContain("var injectedRuntimeRoot = __ZOTERO_LOCAL_MCP_BRIDGE_RUNTIME_ROOT__");
    expect(script).toContain("persistInjectedRuntimeRootIfNeeded()");
    expect(script).toContain('getPref("runtimeRoot", "")');
    expect(script).toContain("function resolveDefaultRuntimeRoot");
    expect(script).toContain("function resolveDefaultAppDataRoot");
    expect(script).toContain('getEnvironmentValue("APPDATA")');
    expect(script).toContain('getEnvironmentValue("LOCALAPPDATA")');
    expect(script).toContain('["zotero-local-mcp-bridge"]');
    expect(script).toContain('joinPath(resolveDefaultAppDataRoot(), ["runtime"])');
    expect(script).toContain('joinPath(resolveDefaultAppDataRoot(), ["audit"])');
    expect(script).toContain('joinPath(resolveDefaultAppDataRoot(), ["backup"])');
    expect(script).not.toContain('["runtime", "logs", "audit"]');
    expect(script).not.toContain('["runtime", "backups", "zotero-operations"]');
    expect(script).toContain('chooseDirectory("runtimeRoot"');
    expect(script).toContain('chooseDirectory("auditRoot"');
    expect(script).toContain('chooseDirectory("backupRoot"');
    expect(script).toContain('element.addEventListener("click", run)');
    expect(script).toContain("function addTooltipHelpListener");
    expect(script).toContain('addTooltipHelpListener("zcb-run-mode-help", "zcb-run-mode-tooltip")');
    expect(script).toContain('tooltip.openPopup(button, "after_start", 0, 0, false, false)');
    expect(script).not.toContain('button.addEventListener("mouseenter", show)');
    expect(script).toContain('button.addEventListener("mouseleave", hide)');
    expect(script).toContain("now - lastToggleAt < 100");
    expect(script).toContain("function filePickerFolderMode");
    expect(script).toContain("function scheduleInit");
    expect(script).toContain("scheduleInit(0)");
    expect(script).toContain("setPathElementValue");
    expect(script).toContain("Components.interfaces.nsIFilePicker.modeGetFolder");
    expect(script).toContain('ChromeUtils.importESModule("chrome://zotero/content/modules/filePicker.mjs")');
    expect(script).toContain("globalThis.ZoteroLocalMcpBridgePreferences");
    expect(script).toContain("function loadSafetyCenter");
    expect(script).toContain("function renderPendingPlans");
    expect(script).toContain("function renderAuditEvents");
    expect(script).toContain("function renderUndoEntries");
    expect(script).not.toContain("approvePendingPlan");
    expect(script).toContain("rejectPendingPlan");
    expect(script).not.toContain("plan.agentApproval.requiredText");
    expect(script).not.toContain("DOMContentLoaded");
    expect(script).toContain('setPref("operationMode"');
    expect(script).toContain("function getBackupMaxLocalGb");
    expect(script).toContain('getPref("backupMaxLocalGb", 10)');
    expect(script).toContain('setPref("backupMaxLocalBytes"');
    expect(script).toContain("String(gbValue * bytesPerGb)");
    expect(script).toContain('setPref("defaultAttachmentMode"');
  });

  it("packages Fluent localization resources for every Zotero locale", async () => {
    const supportedLocales = JSON.parse(await readFile(supportedLocalesPath, "utf8")) as string[];
    expect(supportedLocales).toEqual([
      "af-ZA", "ar", "bg-BG", "br", "ca-AD", "cs-CZ", "da-DK", "de", "el-GR", "en-GB", "en-US", "es-ES",
      "et-EE", "eu-ES", "fa", "fi-FI", "fr-FR", "gl-ES", "he-IL", "hr-HR", "hu-HU", "id-ID", "is-IS",
      "it-IT", "ja-JP", "km", "ko-KR", "lt-LT", "mn-MN", "nb-NO", "nl-NL", "nn-NO", "pl-PL", "pt-BR",
      "pt-PT", "ro-RO", "ru-RU", "sk-SK", "sl-SI", "sr-RS", "sv-SE", "ta", "th-TH", "tr-TR", "uk-UA",
      "vi-VN", "zh-CN", "zh-TW"
    ]);

    const sourceLocales = await readdir(path.resolve("src", "zotero-plugin", "locale"), { withFileTypes: true });
    const sourceLocaleNames = sourceLocales.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
    expect(sourceLocaleNames).toEqual([...supportedLocales].sort());

    const enUs = await readFile(path.resolve("src", "zotero-plugin", "locale", "en-US", fluentResourceName), "utf8");
    for (const locale of supportedLocales) {
      const localeSourcePath = path.resolve("src", "zotero-plugin", "locale", locale, fluentResourceName);
      const localeSource = await readFile(localeSourcePath, "utf8");
      expect(localeSource).toContain("zotero-local-mcp-bridge-run-mode =");
      expect(localeSource).toContain("zotero-local-mcp-bridge-choose-directory =");
      expect(localeSource).toContain("zotero-local-mcp-bridge-safety-center-title =");
      expect(localeSource).toContain("zotero-local-mcp-bridge-safety-refresh =");
      expect(localeSource).toContain("zotero-local-mcp-bridge-pending-plans =");
      expect(localeSource).toContain("zotero-local-mcp-bridge-recent-activity =");
      expect(localeSource).toContain("zotero-local-mcp-bridge-undo-available =");
      expect(localeSource).not.toContain("zotero-local-mcp-bridge-approve =");
      expect(localeSource).toContain("zotero-local-mcp-bridge-reject =");
      if (locale !== "en-US") {
        expect(localeSource).not.toBe(enUs);
      }
    }

    const buildScript = await readFile(path.resolve("scripts", "buildZoteroPlugin.mjs"), "utf8");
    expect(buildScript).toContain("Missing Zotero Local MCP Bridge localization resource");
    expect(buildScript).not.toContain("fallbackLocale");

    await execFileAsync(process.execPath, ["scripts/buildZoteroPlugin.mjs"], { windowsHide: true });
    const { stdout } = await execFileAsync("tar", ["-tf", xpiPath], { windowsHide: true });
    for (const locale of supportedLocales) {
      expect(stdout).toContain(`locale/${locale}/${fluentResourceName}`);
    }

    const zhCn = await execFileAsync("tar", ["-xOf", xpiPath, `locale/zh-CN/${fluentResourceName}`], {
      windowsHide: true
    });
    expect(zhCn.stdout).toContain("zotero-local-mcp-bridge-title = Zotero Local MCP Bridge");
    expect(zhCn.stdout).toContain("zotero-local-mcp-bridge-run-mode =");
    expect(zhCn.stdout).toContain(".value = 运行模式");

    const frFr = await execFileAsync("tar", ["-xOf", xpiPath, `locale/fr-FR/${fluentResourceName}`], {
      windowsHide: true
    });
    expect(frFr.stdout).toContain("zotero-local-mcp-bridge-run-mode =");
    expect(frFr.stdout).toContain(".value = Mode d'exécution");
  }, 30000);

  it("keeps release build artifact free of embedded local tokens", async () => {
    const hadOriginalToken = existsSync(runtimeAuthTokenPath);
    const originalToken = hadOriginalToken ? await readFile(runtimeAuthTokenPath, "utf8") : undefined;

    try {
      await rm(runtimeAuthTokenPath, { force: true });
      await mkdir(path.dirname(runtimeAuthTokenPath), { recursive: true });
      const tokenForTestBuild = randomBytes(32).toString("base64url");
      await writeFile(runtimeAuthTokenPath, `${tokenForTestBuild}\n`, "utf8");

      await execFileAsync(process.execPath, ["scripts/buildZoteroPlugin.mjs"], { windowsHide: true });
      const releaseBootstrap = await execFileAsync("tar", ["-xOf", xpiPath, "bootstrap.js"], { windowsHide: true });
      const releasePreferences = await execFileAsync("tar", ["-xOf", xpiPath, "preferences.js"], { windowsHide: true });
      expect(releaseBootstrap.stdout).toContain("expectedAuthToken: null");
      expect(releaseBootstrap.stdout).toContain("runtimeRoot: null");
      expect(releaseBootstrap.stdout).not.toContain(tokenForTestBuild);
      expect(releaseBootstrap.stdout).not.toContain("__ZOTERO_LOCAL_MCP_BRIDGE_AUTH_TOKEN__");
      expect(releaseBootstrap.stdout).not.toContain("__ZOTERO_LOCAL_MCP_BRIDGE_RUNTIME_ROOT__");
      expect(releasePreferences.stdout).toContain("var injectedRuntimeRoot = null");
      expect(releasePreferences.stdout).not.toContain("__ZOTERO_LOCAL_MCP_BRIDGE_RUNTIME_ROOT__");

      await execFileAsync(process.execPath, ["scripts/buildZoteroPlugin.mjs", "--test"], { windowsHide: true });
      const testBootstrap = await execFileAsync("tar", ["-xOf", xpiPath, "bootstrap.js"], { windowsHide: true });
      const testPreferences = await execFileAsync("tar", ["-xOf", xpiPath, "preferences.js"], { windowsHide: true });
      expect(testBootstrap.stdout).toContain(`expectedAuthToken: "${tokenForTestBuild}"`);
      expect(testBootstrap.stdout).toContain(`runtimeRoot: "${escapedRuntimeRootForBundle}"`);
      expect(testBootstrap.stdout).not.toContain("expectedAuthToken: null");
      expect(testBootstrap.stdout).not.toContain("__ZOTERO_LOCAL_MCP_BRIDGE_AUTH_TOKEN__");
      expect(testBootstrap.stdout).not.toContain("__ZOTERO_LOCAL_MCP_BRIDGE_RUNTIME_ROOT__");
      expect(testPreferences.stdout).toContain(`var injectedRuntimeRoot = "${escapedRuntimeRootForBundle}"`);
      expect(testPreferences.stdout).not.toContain("__ZOTERO_LOCAL_MCP_BRIDGE_RUNTIME_ROOT__");

      await execFileAsync(process.execPath, ["scripts/buildZoteroPlugin.mjs"], { windowsHide: true });
      const rebuiltReleaseBootstrap = await execFileAsync("tar", ["-xOf", xpiPath, "bootstrap.js"], { windowsHide: true });
      expect(rebuiltReleaseBootstrap.stdout).toContain("expectedAuthToken: null");
      expect(rebuiltReleaseBootstrap.stdout).not.toContain(tokenForTestBuild);
    } finally {
      if (originalToken !== undefined) {
        await mkdir(path.dirname(runtimeAuthTokenPath), { recursive: true });
        await writeFile(runtimeAuthTokenPath, originalToken, "utf8");
      } else {
        await rm(runtimeAuthTokenPath, { force: true });
      }

      await execFileAsync(process.execPath, ["scripts/buildZoteroPlugin.mjs"], { windowsHide: true });
    }
  }, 30000);
});

