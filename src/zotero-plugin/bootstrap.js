/* eslint-disable @typescript-eslint/no-unused-vars */
/* global IOUtils, PathUtils, Zotero, Components, __ZOTERO_LOCAL_MCP_BRIDGE_AUTH_TOKEN__, __ZOTERO_LOCAL_MCP_BRIDGE_RUNTIME_ROOT__, navigator */

var ZoteroLocalMcpBridge = {
  id: "zotero-local-mcp-bridge@example.com",
  version: "0.1.56",
  mcpPath: "/zotero-local-mcp-bridge/mcp",
  authHeader: "x-zotero-local-mcp-bridge-token",
  expectedAuthToken: __ZOTERO_LOCAL_MCP_BRIDGE_AUTH_TOKEN__,
  runtimeRoot: __ZOTERO_LOCAL_MCP_BRIDGE_RUNTIME_ROOT__,
  dryRunTtlMs: 30 * 60 * 1000,
  confirmations: {},
  started: false,
  registeredPaths: []
};

var cachedExpectedAuthToken;

var TEST_PROFILE_MARKER_FILE = ".zotero-local-mcp-bridge-test-profile";
var LEGACY_TEST_PROFILE_MARKER_FILE = ".zotero-codex-bridge-test-profile";
var REAL_PROFILE_UNLOCK_DEFAULT_TTL_MINUTES = 30;
var REAL_PROFILE_UNLOCK_MAX_TTL_MINUTES = 120;
var REAL_PROFILE_UNLOCK_CONFIRMATION = "I understand and authorize temporary real-library write access";
var REAL_PROFILE_PREFERENCE_MODE = "extensions.zotero-local-mcp-bridge.profileMode";
var REAL_PROFILE_DEFAULT_MODE = "real-locked";
var REAL_PROFILE_STATE_PATH_PARTS = ["runtime", "safety", "real-profile-state.json"];
var BRIDGE_RUNTIME_ROOT_PREFERENCE = "extensions.zotero-local-mcp-bridge.runtimeRoot";
var BRIDGE_AUDIT_ROOT_PREFERENCE = "extensions.zotero-local-mcp-bridge.auditRoot";
var BRIDGE_BACKUP_ROOT_PREFERENCE = "extensions.zotero-local-mcp-bridge.backupRoot";
var BRIDGE_OPERATION_MODE_PREFERENCE = "extensions.zotero-local-mcp-bridge.operationMode";
var BRIDGE_OPERATION_MODE_DEFAULT = "readonly";
var BRIDGE_OPERATION_MODES = {
  readonly: true,
  askforapprove: true,
  yolo: true
};
var EXPORT_TRANSLATOR_IDS = {
  bibtex: "9cb70025-a888-4a29-a210-93ec52da40d4",
  ris: "32d59d2d-b65a-4da4-b0a3-bdd3cfb979e7",
  cslJson: "bc03b4fe-436d-4a1f-ba59-de4d2d7a63f7"
};

var ZoteroLocalMcpBridgeSafetyStateCommands = {
  "safety.unlockRealProfile": true,
  "safety.lockRealProfile": true
};

var ZoteroLocalMcpBridgeDefaultBackupPolicy = {
  retentionDays: 30,
  maxLocalBytes: 10 * 1024 * 1024 * 1024,
  enableTimeLimit: true,
  enableSpaceLimit: true
};

var ZoteroLocalMcpBridgeProfileWriteCommands = {
  "collection.create": true,
  "collection.rename": true,
  "collection.move": true,
  "collection.addItems": true,
  "collection.removeItems": true,
  "collection.trash": true,
  "item.create": true,
  "item.updateFields": true,
  "item.updateCreators": true,
  "item.setCollections": true,
  "item.updateTags": true,
  "item.trash": true,
  "savedSearch.create": true,
  "savedSearch.update": true,
  "duplicates.merge": true,
  "import.bibtex": true,
  "import.ris": true,
  "import.cslJson": true,
  "annotation.create": true,
  "annotation.update": true,
  "note.createChild": true,
  "attachment.addFile": true,
  "attachment.moveToItem": true,
  "attachment.rename": true,
  "attachment.runZoteroRename": true,
  "attachment.undoAdded": true,
  "attachment.trash": true,
  "attachment.renamePreferences.set": true,
  "backup.settings.set": true,
  "backup.snapshot.restore": true,
  "backup.snapshot.prune": true
};

var ZoteroLocalMcpBridgeWriteCommands = {
  "collection.create": true,
  "collection.rename": true,
  "collection.move": true,
  "collection.addItems": true,
  "collection.removeItems": true,
  "collection.trash": true,
  "item.create": true,
  "item.updateFields": true,
  "item.updateCreators": true,
  "item.setCollections": true,
  "item.updateTags": true,
  "item.trash": true,
  "savedSearch.create": true,
  "savedSearch.update": true,
  "duplicates.merge": true,
  "import.bibtex": true,
  "import.ris": true,
  "import.cslJson": true,
  "annotation.create": true,
  "annotation.update": true,
  "note.createChild": true,
  "attachment.addFile": true,
  "attachment.moveToItem": true,
  "attachment.rename": true,
  "attachment.runZoteroRename": true,
  "attachment.undoAdded": true,
  "attachment.trash": true,
  "attachment.renamePreferences.set": true,
  "backup.settings.set": true,
  "backup.snapshot.restore": true,
  "backup.snapshot.prune": true,
  "safety.unlockRealProfile": true,
  "safety.lockRealProfile": true
};

var ZoteroLocalMcpBridgeCommandNames = [
  "collection.create",
  "collection.rename",
  "collection.move",
  "collection.getTree",
  "collection.getItems",
  "collection.addItems",
  "collection.removeItems",
  "item.get",
  "item.search",
  "search.advanced",
  "savedSearch.list",
  "savedSearch.get",
  "savedSearch.create",
  "savedSearch.update",
  "citation.format",
  "item.create",
  "item.updateFields",
  "item.updateCreators",
  "item.setCollections",
  "item.updateTags",
  "item.trash",
  "import.bibtex",
  "import.ris",
  "import.cslJson",
  "export.bibtex",
  "export.ris",
  "export.cslJson",
  "annotation.list",
  "annotation.create",
  "annotation.update",
  "note.createChild",
  "attachment.get",
  "attachment.getForItem",
  "attachment.addFile",
  "attachment.moveToItem",
  "attachment.rename",
  "attachment.runZoteroRename",
  "attachment.undoAdded",
  "attachment.trash",
  "attachment.renamePreferences.get",
  "attachment.renamePreferences.set",
  "backup.settings.get",
  "backup.settings.set",
  "backup.snapshot.list",
  "backup.snapshot.restore",
  "backup.snapshot.prune",
  "collection.trash",
  "duplicates.find",
  "duplicates.merge",
  "audit.list",
  "safety.getProfileStatus",
  "safety.unlockRealProfile",
  "safety.lockRealProfile"
];

function log(message) {
  if (typeof Zotero !== "undefined" && Zotero.debug) {
    Zotero.debug(`Zotero Local MCP Bridge: ${message}`);
  }
}

function install() {
  log("installed");
}

function startup(data) {
  ZoteroLocalMcpBridge.started = true;
  persistRuntimeRootPreference();
  registerPreferencePane(data || {});
  registerMcpEndpoint();
  log("started");
}

function onMainWindowLoad({ window }) {
  log("main window loaded");
}

function onMainWindowUnload({ window }) {
  log("main window unloaded");
}

function shutdown() {
  unregisterEndpoints();
  ZoteroLocalMcpBridge.started = false;
  log("stopped");
}

function uninstall() {
  log("uninstalled");
}

function registerPreferencePane(data) {
  if (typeof Zotero === "undefined" || !Zotero.PreferencePanes || !Zotero.PreferencePanes.register) {
    log("preference pane unavailable");
    return;
  }

  if (!data.rootURI) {
    log("preference pane rootURI unavailable");
    return;
  }

  Zotero.PreferencePanes.register({
    pluginID: ZoteroLocalMcpBridge.id,
    src: data.rootURI + "preferences.xhtml",
    scripts: [data.rootURI + "preferences.js"],
    stylesheets: [data.rootURI + "preferences.css"]
  });
  log("preference pane registered");
}

function registerMcpEndpoint() {
  if (typeof Zotero === "undefined" || !Zotero.Server || !Zotero.Server.Endpoints) {
    log("server unavailable for MCP endpoint");
    return;
  }

  var endpoint = Zotero.Server.Endpoints[ZoteroLocalMcpBridge.mcpPath] = function () {};
  endpoint.prototype = {
    supportedMethods: ["POST"],
    init: handleMcpEndpointRequest
  };
  ZoteroLocalMcpBridge.registeredPaths.push(ZoteroLocalMcpBridge.mcpPath);
}

async function handleMcpEndpointRequest(req) {
  log(`MCP endpoint ${req.method}`);
  if ((req.method || "POST").toUpperCase() !== "POST") {
    return mcpHttpResponse(405, {
      jsonrpc: "2.0",
      id: null,
      error: {
        code: -32600,
        message: "MCP endpoint only accepts POST"
      }
    });
  }

  var contentType = getHeader(req.headers || {}, "content-type");
  if (!contentType || contentType.indexOf("application/json") !== 0) {
    return mcpHttpResponse(415, {
      jsonrpc: "2.0",
      id: null,
      error: {
        code: -32600,
        message: "MCP endpoint only accepts application/json"
      }
    });
  }

  var payload;
  try {
    payload = getRequestJson(req);
  } catch (error) {
    return mcpHttpResponse(400, {
      jsonrpc: "2.0",
      id: null,
      error: {
        code: -32700,
        message: error.message || "MCP request body is not valid JSON"
      }
    });
  }

  if (Array.isArray(payload)) {
    var batchResults = [];
    for (var i = 0; i < payload.length; i += 1) {
      var batchResult = await handleMcpJsonRpc(payload[i]);
      if (batchResult) {
        batchResults.push(batchResult);
      }
    }
    return mcpHttpResponse(batchResults.length > 0 ? 200 : 202, batchResults);
  }

  var result = await handleMcpJsonRpc(payload);
  if (!result) {
    return [202, "application/json", ""];
  }
  return mcpHttpResponse(200, result);
}

async function handleMcpJsonRpc(payload) {
  var id = payload && Object.prototype.hasOwnProperty.call(payload, "id") ? payload.id : null;
  if (!payload || payload.jsonrpc !== "2.0" || typeof payload.method !== "string") {
    return mcpJsonRpcError(id, -32600, "Invalid MCP JSON-RPC request");
  }

  try {
    if (payload.method === "initialize") {
      return mcpJsonRpcResult(id, {
        protocolVersion: payload.params && payload.params.protocolVersion ? payload.params.protocolVersion : "2025-06-18",
        capabilities: {
          tools: {
            listChanged: false
          }
        },
        serverInfo: {
          name: "zotero-local-mcp-bridge",
          version: ZoteroLocalMcpBridge.version
        }
      });
    }

    if (payload.method === "notifications/initialized") {
      return null;
    }

    if (payload.method === "tools/list") {
      return mcpJsonRpcResult(id, {
        tools: createMcpToolDescriptors()
      });
    }

    if (payload.method === "tools/call") {
      return mcpJsonRpcResult(id, await handleMcpToolCall(payload.params || {}, id));
    }

    return mcpJsonRpcError(id, -32601, "Unsupported MCP method: " + payload.method);
  } catch (error) {
    return mcpJsonRpcError(
      id,
      -32603,
      error && error.message ? error.message : "Internal MCP endpoint error",
      error && error.code ? { code: error.code } : undefined
    );
  }
}

async function handleMcpToolCall(params, requestId) {
  var toolName = params.name;
  if (typeof toolName !== "string" || toolName.length === 0) {
    throw commandError("MCP_TOOL_NAME_REQUIRED", "MCP tools/call requires params.name", 400);
  }

  var commandName = commandNameFromMcpToolName(toolName);
  if (!commandName) {
    throw commandError("MCP_TOOL_UNKNOWN", "Unknown Zotero Local MCP Bridge tool: " + toolName, 404);
  }

  var args = params.arguments && typeof params.arguments === "object" ? params.arguments : {};
  var commandInput = args.input && typeof args.input === "object"
    ? args.input
    : extractMcpCommandInput(args);
  var commandPayload = {
    name: commandName,
    requestId: typeof requestId === "string" || typeof requestId === "number" ? "mcp_" + requestId : "mcp_request",
    input: commandInput,
    mode: args.mode,
    confirmation: args.confirmation
  };
  var commandResponse = await executeInternalCommandPayload(commandPayload);
  var isError = !commandResponse.ok;
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(commandResponse, null, 2)
      }
    ],
    structuredContent: commandResponse,
    isError: isError
  };
}

async function executeInternalCommandPayload(commandPayload) {
  var response = await handleCommandEndpointRequest({
    internal: true,
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    data: commandPayload
  });
  if (!Array.isArray(response) || typeof response[2] !== "string") {
    throw commandError("INTERNAL_COMMAND_RESPONSE_INVALID", "Internal command handler returned an invalid response", 500);
  }
  return JSON.parse(response[2]);
}

function createMcpToolDescriptors() {
  return ZoteroLocalMcpBridgeCommandNames.map(function (commandName) {
    return {
      name: mcpToolNameFromCommandName(commandName),
      title: commandName,
      description: describeMcpTool(commandName),
      inputSchema: createMcpToolInputSchema(),
      annotations: {
        readOnlyHint: !isWriteCommandName(commandName),
        destructiveHint: isHighRiskMcpCommand(commandName),
        idempotentHint: !isWriteCommandName(commandName),
        openWorldHint: false
      }
    };
  });
}

function createMcpToolInputSchema() {
  return {
    type: "object",
    properties: {
      input: {
        type: "object",
        additionalProperties: true
      },
      mode: {
        type: "string",
        enum: ["dry-run", "execute"]
      },
      confirmation: {
        type: "object",
        properties: {
          planId: { type: "string" },
          confirmationToken: { type: "string" }
        },
        required: ["planId", "confirmationToken"],
        additionalProperties: false
      }
    },
    additionalProperties: true
  };
}

function describeMcpTool(commandName) {
  if (isWriteCommandName(commandName)) {
    return "Write command for Zotero Local MCP Bridge. Call without mode or with mode=dry-run first; execute requires the returned planId and confirmationToken.";
  }
  return "Read command for Zotero Local MCP Bridge. Executes through the Zotero plugin internal command table.";
}

function mcpToolNameFromCommandName(commandName) {
  return "zotero_" + commandName.replace(/([a-z0-9])([A-Z])/g, "$1_$2").replace(/\./g, "_").toLowerCase();
}

function commandNameFromMcpToolName(toolName) {
  for (var i = 0; i < ZoteroLocalMcpBridgeCommandNames.length; i += 1) {
    var commandName = ZoteroLocalMcpBridgeCommandNames[i];
    if (mcpToolNameFromCommandName(commandName) === toolName) {
      return commandName;
    }
  }
  return "";
}

function extractMcpCommandInput(args) {
  var input = {};
  Object.keys(args).forEach(function (key) {
    if (key !== "mode" && key !== "confirmation") {
      input[key] = args[key];
    }
  });
  return input;
}

function isHighRiskMcpCommand(commandName) {
  return commandName.indexOf(".trash") > 0
    || commandName === "duplicates.merge"
    || commandName === "backup.snapshot.restore"
    || commandName === "backup.snapshot.prune"
    || commandName === "safety.unlockRealProfile";
}

function mcpJsonRpcResult(id, result) {
  if (id === null || id === undefined) {
    return null;
  }
  return {
    jsonrpc: "2.0",
    id: id,
    result: result
  };
}

function mcpJsonRpcError(id, code, message, data) {
  return {
    jsonrpc: "2.0",
    id: id === undefined ? null : id,
    error: {
      code: code,
      message: message,
      data: data
    }
  };
}

function mcpHttpResponse(status, body) {
  return [
    status,
    "application/json",
    typeof body === "string" ? body : JSON.stringify(body)
  ];
}

async function handleCommandEndpointRequest(req) {
      log(`command endpoint ${req.method}`);
      var internalCommand = req.internal === true;
      var contentType = getHeader(req.headers || {}, "content-type");
      var authToken = getHeader(req.headers || {}, ZoteroLocalMcpBridge.authHeader);

      if (!contentType || contentType.indexOf("application/json") !== 0) {
        return [
          415,
          "application/json",
          JSON.stringify({
            ok: false,
            commandName: "unknown",
            requestId: "unknown",
            affected: emptyAffected(),
            error: {
              code: "COMMAND_CONTENT_TYPE_UNSUPPORTED",
              message: "Command endpoint only accepts application/json"
            }
          })
        ];
      }

      if (!internalCommand && !authToken) {
        return jsonCommandResponse(401, "unknown", "unknown", undefined, {
          code: "COMMAND_AUTH_REQUIRED",
          message: "Command endpoint requires local auth token"
        });
      }

      if (!internalCommand) {
        var expectedAuthToken;
        try {
          expectedAuthToken = await getExpectedAuthToken();
        } catch (error) {
          return jsonCommandResponse(error.status || 503, "unknown", "unknown", undefined, {
            code: error.code || "COMMAND_AUTH_TOKEN_MISSING",
            message: error.message || "Bridge auth token is missing from runtime config directory"
          });
        }
        if (authToken !== expectedAuthToken) {
          return jsonCommandResponse(403, "unknown", "unknown", undefined, {
            code: "COMMAND_AUTH_INVALID",
            message: "Command endpoint auth token is invalid"
          });
        }
      }

      var payload;
      try {
        payload = getRequestJson(req);
      } catch (error) {
        return jsonCommandResponse(400, "unknown", "unknown", undefined, {
          code: "COMMAND_JSON_INVALID",
          message: error.message || "Command request body is not valid JSON"
        });
      }

      var commandName = payload.name || "unknown";
      var requestId = payload.requestId || "unknown";
      var profileMode;
      var operationMode;
      var testProfileMarkerPresent;
      try {
        profileMode = await getProfileMode();
        operationMode = getBridgeOperationMode();
        testProfileMarkerPresent = await isTestProfileMarkerPresent();
      } catch (error) {
        return jsonCommandResponse(error.status || 500, commandName, requestId, undefined, {
          code: error.code || "COMMAND_CONTEXT_FAILED",
          message: error.message || "Failed to read Zotero Local MCP Bridge command context"
        });
      }

      if (ZoteroLocalMcpBridgeProfileWriteCommands[commandName] && !ZoteroLocalMcpBridgeSafetyStateCommands[commandName]) {
        try {
          assertOperationWritePermission(operationMode, commandName);
          assertProfileWritePermission(profileMode, testProfileMarkerPresent, commandName);
        } catch (error) {
          return jsonCommandResponse(error.status || 403, commandName, requestId, undefined, {
            code: error.code || "WRITE_FORBIDDEN",
            message: error.message || "Write guard blocked this command"
          });
        }
      }

      if (commandName === "safety.getProfileStatus") {
        try {
          return jsonCommandResponse(
            200,
            commandName,
            requestId,
            await getProfileStatusResponse({
              profileMode: profileMode,
              operationMode: operationMode,
              testProfileMarkerPresent: testProfileMarkerPresent
            })
          );
        } catch (error) {
          return jsonCommandResponse(error.status || 500, commandName, requestId, undefined, {
            code: error.code || "SAFETY_PROFILE_STATUS_FAILED",
            message: error.message || "Failed to read profile safety status"
          });
        }
      }

      if (commandName === "safety.unlockRealProfile") {
        try {
          var unlockResult = await executeSafetyUnlockRealProfile(payload.input || {});
          return jsonCommandResponse(200, commandName, requestId, unlockResult);
        } catch (error) {
          return jsonCommandResponse(error.status || 400, commandName, requestId, undefined, commandErrorResponse(error, "REAL_PROFILE_UNLOCK_FAILED", "Failed to unlock real-profile write access"));
        }
      }

      if (commandName === "safety.lockRealProfile") {
        try {
          var lockResult = await executeSafetyLockRealProfile();
          return jsonCommandResponse(200, commandName, requestId, lockResult);
        } catch (error) {
          return jsonCommandResponse(error.status || 500, commandName, requestId, undefined, {
            code: error.code || "REAL_PROFILE_LOCK_FAILED",
            message: error.message || "Failed to lock real-profile access"
          });
        }
      }

      if (commandName === "collection.getTree") {
        try {
          return jsonCommandResponse(200, commandName, requestId, readCollectionTree());
        } catch (error) {
          return jsonCommandResponse(500, commandName, requestId, undefined, {
            code: "COLLECTION_TREE_READ_FAILED",
            message: error.message || "Failed to read Zotero collection tree"
          });
        }
      }

      if (commandName === "collection.create") {
        try {
          if (payload.mode === "execute") {
            var created = await executeCollectionCreate(payload.input || {}, payload.confirmation);
            return jsonCommandResponse(
              200,
              commandName,
              requestId,
              created,
              undefined,
              { collectionKeys: [created.collectionKey] },
              payload.confirmation.planId
            );
          }

          return jsonCommandResponse(200, commandName, requestId, createCollectionCreateDryRun(payload.input || {}));
        } catch (error) {
          return jsonCommandResponse(error.status || 400, commandName, requestId, undefined, {
            code: error.code || "COLLECTION_CREATE_FAILED",
            message: error.message || "Failed to create Zotero collection"
          });
        }
      }

      if (commandName === "collection.rename") {
        try {
          if (payload.mode === "execute") {
            var renamed = await executeCollectionRename(payload.input || {}, payload.confirmation);
            return jsonCommandResponse(
              200,
              commandName,
              requestId,
              renamed,
              undefined,
              { collectionKeys: [renamed.collectionKey] },
              payload.confirmation.planId
            );
          }

          return jsonCommandResponse(200, commandName, requestId, createCollectionRenameDryRun(payload.input || {}));
        } catch (error) {
          return jsonCommandResponse(error.status || 400, commandName, requestId, undefined, {
            code: error.code || "COLLECTION_RENAME_FAILED",
            message: error.message || "Failed to rename Zotero collection"
          });
        }
      }

      if (commandName === "collection.move") {
        try {
          if (payload.mode === "execute") {
            var moved = await executeCollectionMove(payload.input || {}, payload.confirmation);
            return jsonCommandResponse(
              200,
              commandName,
              requestId,
              moved,
              undefined,
              { collectionKeys: [moved.collectionKey] },
              payload.confirmation.planId
            );
          }

          return jsonCommandResponse(200, commandName, requestId, createCollectionMoveDryRun(payload.input || {}));
        } catch (error) {
          return jsonCommandResponse(error.status || 400, commandName, requestId, undefined, {
            code: error.code || "COLLECTION_MOVE_FAILED",
            message: error.message || "Failed to move Zotero collection"
          });
        }
      }

      if (commandName === "collection.getItems") {
        try {
          return jsonCommandResponse(200, commandName, requestId, readCollectionItems(payload.input || {}));
        } catch (error) {
          return jsonCommandResponse(error.status || 400, commandName, requestId, undefined, {
            code: error.code || "COLLECTION_ITEMS_READ_FAILED",
            message: error.message || "Failed to read Zotero collection items"
          });
        }
      }

      if (commandName === "collection.addItems") {
        try {
          if (payload.mode === "execute") {
            var added = await executeCollectionAddItems(payload.input || {}, payload.confirmation);
            return jsonCommandResponse(
              200,
              commandName,
              requestId,
              added,
              undefined,
              { collectionKeys: [added.collectionKey], zoteroItemKeys: added.addedItemKeys },
              payload.confirmation.planId
            );
          }

          return jsonCommandResponse(200, commandName, requestId, createCollectionAddItemsDryRun(payload.input || {}));
        } catch (error) {
          return jsonCommandResponse(error.status || 400, commandName, requestId, undefined, {
            code: error.code || "COLLECTION_ADD_ITEMS_FAILED",
            message: error.message || "Failed to add items to Zotero collection"
          });
        }
      }

      if (commandName === "collection.removeItems") {
        try {
          if (payload.mode === "execute") {
            var removed = await executeCollectionRemoveItems(payload.input || {}, payload.confirmation);
            return jsonCommandResponse(
              200,
              commandName,
              requestId,
              removed,
              undefined,
              { collectionKeys: [removed.collectionKey], zoteroItemKeys: removed.removedItemKeys },
              payload.confirmation.planId
            );
          }

          return jsonCommandResponse(200, commandName, requestId, createCollectionRemoveItemsDryRun(payload.input || {}));
        } catch (error) {
          return jsonCommandResponse(error.status || 400, commandName, requestId, undefined, {
            code: error.code || "COLLECTION_REMOVE_ITEMS_FAILED",
            message: error.message || "Failed to remove items from Zotero collection"
          });
        }
      }

      if (commandName === "collection.trash") {
        try {
          if (payload.mode === "execute") {
            var trashedCollection = await executeCollectionTrash(payload.input || {}, payload.confirmation);
            return jsonCommandResponse(
              200,
              commandName,
              requestId,
              trashedCollection,
              undefined,
              {
                collectionKeys: trashedCollection.collectionKeys,
                zoteroItemKeys: trashedCollection.trashedDescendentItemKeys
              },
              payload.confirmation.planId
            );
          }

          return jsonCommandResponse(200, commandName, requestId, createCollectionTrashDryRun(payload.input || {}));
        } catch (error) {
          return jsonCommandResponse(error.status || 400, commandName, requestId, undefined, {
            code: error.code || "COLLECTION_TRASH_FAILED",
            message: error.message || "Failed to move Zotero collection to trash"
          });
        }
      }

      if (commandName === "item.get") {
        try {
          var itemDetails = readItemDetails(payload.input || {});
          return jsonCommandResponse(
            200,
            commandName,
            requestId,
            itemDetails,
            undefined,
            {
              zoteroItemKeys: [itemDetails.zoteroItemKey],
              collectionKeys: itemDetails.collectionKeys,
              attachmentKeys: itemDetails.attachmentKeys
            }
          );
        } catch (error) {
          return jsonCommandResponse(error.status || 400, commandName, requestId, undefined, {
            code: error.code || "ITEM_READ_FAILED",
            message: error.message || "Failed to read Zotero item"
          });
        }
      }

      if (commandName === "item.search") {
        try {
          var itemSearch = await searchItems(payload.input || {});
          return jsonCommandResponse(
            200,
            commandName,
            requestId,
            itemSearch,
            undefined,
            {
              zoteroItemKeys: itemSearch.items.map(function (item) { return item.zoteroItemKey; }),
              collectionKeys: itemSearch.collectionKey ? [itemSearch.collectionKey] : []
            }
          );
        } catch (error) {
          return jsonCommandResponse(error.status || 400, commandName, requestId, undefined, {
            code: error.code || "ITEM_SEARCH_FAILED",
            message: error.message || "Failed to search Zotero items"
          });
        }
      }

      if (commandName === "search.advanced") {
        try {
          var advancedSearch = await runAdvancedSearch(payload.input || {});
          return jsonCommandResponse(
            200,
            commandName,
            requestId,
            advancedSearch,
            undefined,
            {
              zoteroItemKeys: advancedSearch.items.map(function (item) { return item.zoteroItemKey; })
            }
          );
        } catch (error) {
          return jsonCommandResponse(error.status || 400, commandName, requestId, undefined, {
            code: error.code || "SEARCH_ADVANCED_FAILED",
            message: error.message || "Failed to run Zotero advanced search"
          });
        }
      }

      if (commandName === "savedSearch.list") {
        try {
          var savedSearches = await listSavedSearches(payload.input || {});
          return jsonCommandResponse(200, commandName, requestId, savedSearches, undefined, {
            zoteroItemKeys: savedSearches.savedSearches.map(function (search) { return search.savedSearchKey; })
          });
        } catch (error) {
          return jsonCommandResponse(error.status || 400, commandName, requestId, undefined, {
            code: error.code || "SAVED_SEARCH_LIST_FAILED",
            message: error.message || "Failed to list Zotero saved searches"
          });
        }
      }

      if (commandName === "savedSearch.get") {
        try {
          var savedSearch = getSavedSearchDetails(payload.input || {});
          return jsonCommandResponse(200, commandName, requestId, savedSearch, undefined, {
            zoteroItemKeys: [savedSearch.savedSearchKey]
          });
        } catch (error) {
          return jsonCommandResponse(error.status || 400, commandName, requestId, undefined, {
            code: error.code || "SAVED_SEARCH_GET_FAILED",
            message: error.message || "Failed to get Zotero saved search"
          });
        }
      }

      if (commandName === "savedSearch.create") {
        try {
          if (payload.mode === "execute") {
            var createdSearch = await executeSavedSearchCreate(payload.input || {}, payload.confirmation);
            return jsonCommandResponse(200, commandName, requestId, createdSearch, undefined, {
              zoteroItemKeys: [createdSearch.savedSearchKey]
            }, payload.confirmation.planId);
          }

          return jsonCommandResponse(200, commandName, requestId, createSavedSearchCreateDryRun(payload.input || {}));
        } catch (error) {
          return jsonCommandResponse(error.status || 400, commandName, requestId, undefined, {
            code: error.code || "SAVED_SEARCH_CREATE_FAILED",
            message: error.message || "Failed to create Zotero saved search"
          });
        }
      }

      if (commandName === "savedSearch.update") {
        try {
          if (payload.mode === "execute") {
            var updatedSearch = await executeSavedSearchUpdate(payload.input || {}, payload.confirmation);
            return jsonCommandResponse(200, commandName, requestId, updatedSearch, undefined, {
              zoteroItemKeys: [updatedSearch.savedSearchKey]
            }, payload.confirmation.planId);
          }

          return jsonCommandResponse(200, commandName, requestId, createSavedSearchUpdateDryRun(payload.input || {}));
        } catch (error) {
          return jsonCommandResponse(error.status || 400, commandName, requestId, undefined, {
            code: error.code || "SAVED_SEARCH_UPDATE_FAILED",
            message: error.message || "Failed to update Zotero saved search"
          });
        }
      }

      if (commandName === "citation.format") {
        try {
          var citationResult = await formatCitation(payload.input || {});
          return jsonCommandResponse(200, commandName, requestId, citationResult, undefined, {
            zoteroItemKeys: citationResult.zoteroItemKeys
          });
        } catch (error) {
          return jsonCommandResponse(error.status || 400, commandName, requestId, undefined, {
            code: error.code || "CITATION_FORMAT_FAILED",
            message: error.message || "Failed to format Zotero citation"
          });
        }
      }

      if (commandName === "duplicates.find") {
        try {
          var duplicateSets = await findDuplicateItems(payload.input || {});
          return jsonCommandResponse(200, commandName, requestId, duplicateSets, undefined, {
            zoteroItemKeys: duplicateSets.sets.reduce(function (keys, set) {
              return keys.concat(set.zoteroItemKeys);
            }, [])
          });
        } catch (error) {
          return jsonCommandResponse(error.status || 400, commandName, requestId, undefined, {
            code: error.code || "DUPLICATES_FIND_FAILED",
            message: error.message || "Failed to find Zotero duplicate items"
          });
        }
      }

      if (commandName === "duplicates.merge") {
        try {
          if (payload.mode === "execute") {
            var mergeResult = await executeDuplicatesMerge(payload.input || {}, payload.confirmation);
            return jsonCommandResponse(
              200,
              commandName,
              requestId,
              mergeResult,
              undefined,
              {
                zoteroItemKeys: [mergeResult.masterZoteroItemKey].concat(mergeResult.mergedZoteroItemKeys),
                attachmentKeys: mergeResult.attachmentKeys
              },
              payload.confirmation.planId
            );
          }

          return jsonCommandResponse(200, commandName, requestId, await createDuplicatesMergeDryRun(payload.input || {}));
        } catch (error) {
          return jsonCommandResponse(error.status || 400, commandName, requestId, undefined, {
            code: error.code || "DUPLICATES_MERGE_FAILED",
            message: error.message || "Failed to merge Zotero duplicate items"
          });
        }
      }

      if (commandName === "export.bibtex" || commandName === "export.ris" || commandName === "export.cslJson") {
        try {
          var exportResult = await exportItemsWithTranslator(commandName, payload.input || {});
          return jsonCommandResponse(
            200,
            commandName,
            requestId,
            exportResult,
            undefined,
            {
              zoteroItemKeys: exportResult.zoteroItemKeys
            }
          );
        } catch (error) {
          return jsonCommandResponse(error.status || 400, commandName, requestId, undefined, {
            code: error.code || "ITEM_EXPORT_FAILED",
            message: error.message || "Failed to export Zotero items"
          });
        }
      }

      if (commandName === "import.bibtex" || commandName === "import.ris" || commandName === "import.cslJson") {
        try {
          if (payload.mode === "execute") {
            var imported = await executeImportWithTranslator(commandName, payload.input || {}, payload.confirmation);
            return jsonCommandResponse(
              200,
              commandName,
              requestId,
              imported,
              undefined,
              {
                zoteroItemKeys: imported.zoteroItemKeys,
                collectionKeys: imported.collectionKeys,
                tags: imported.tags
              },
              payload.confirmation.planId
            );
          }

          return jsonCommandResponse(200, commandName, requestId, createImportDryRun(commandName, payload.input || {}));
        } catch (error) {
          return jsonCommandResponse(error.status || 400, commandName, requestId, undefined, {
            code: error.code || "ITEM_IMPORT_FAILED",
            message: error.message || "Failed to import Zotero items"
          });
        }
      }

      if (commandName === "item.create") {
        try {
          if (payload.mode === "execute") {
            var createdItem = await executeItemCreate(payload.input || {}, payload.confirmation);
            return jsonCommandResponse(
              200,
              commandName,
              requestId,
              createdItem,
              undefined,
              {
                zoteroItemKeys: [createdItem.zoteroItemKey],
                collectionKeys: createdItem.collectionKeys || [],
                tags: createdItem.tags || []
              },
              payload.confirmation.planId
            );
          }

          return jsonCommandResponse(200, commandName, requestId, createItemCreateDryRun(payload.input || {}));
        } catch (error) {
          return jsonCommandResponse(error.status || 400, commandName, requestId, undefined, {
            code: error.code || "ITEM_CREATE_FAILED",
            message: error.message || "Failed to create Zotero item"
          });
        }
      }

      if (commandName === "item.updateFields") {
        try {
          if (payload.mode === "execute") {
            var fieldsUpdated = await executeItemUpdateFields(payload.input || {}, payload.confirmation);
            return jsonCommandResponse(
              200,
              commandName,
              requestId,
              fieldsUpdated,
              undefined,
              { zoteroItemKeys: [fieldsUpdated.zoteroItemKey] },
              payload.confirmation.planId
            );
          }

          return jsonCommandResponse(200, commandName, requestId, createItemUpdateFieldsDryRun(payload.input || {}));
        } catch (error) {
          return jsonCommandResponse(error.status || 400, commandName, requestId, undefined, {
            code: error.code || "ITEM_UPDATE_FIELDS_FAILED",
            message: error.message || "Failed to update Zotero item fields"
          });
        }
      }

      if (commandName === "item.updateCreators") {
        try {
          if (payload.mode === "execute") {
            var creatorsUpdated = await executeItemUpdateCreators(payload.input || {}, payload.confirmation);
            return jsonCommandResponse(
              200,
              commandName,
              requestId,
              creatorsUpdated,
              undefined,
              { zoteroItemKeys: [creatorsUpdated.zoteroItemKey] },
              payload.confirmation.planId
            );
          }

          return jsonCommandResponse(200, commandName, requestId, createItemUpdateCreatorsDryRun(payload.input || {}));
        } catch (error) {
          return jsonCommandResponse(error.status || 400, commandName, requestId, undefined, {
            code: error.code || "ITEM_UPDATE_CREATORS_FAILED",
            message: error.message || "Failed to update Zotero item creators"
          });
        }
      }

      if (commandName === "item.setCollections") {
        try {
          if (payload.mode === "execute") {
            var collectionsUpdated = await executeItemSetCollections(payload.input || {}, payload.confirmation);
            return jsonCommandResponse(
              200,
              commandName,
              requestId,
              collectionsUpdated,
              undefined,
              {
                zoteroItemKeys: [collectionsUpdated.zoteroItemKey],
                collectionKeys: collectionsUpdated.collectionKeys
              },
              payload.confirmation.planId
            );
          }

          return jsonCommandResponse(200, commandName, requestId, createItemSetCollectionsDryRun(payload.input || {}));
        } catch (error) {
          return jsonCommandResponse(error.status || 400, commandName, requestId, undefined, {
            code: error.code || "ITEM_SET_COLLECTIONS_FAILED",
            message: error.message || "Failed to set Zotero item collections"
          });
        }
      }

      if (commandName === "item.updateTags") {
        try {
          if (payload.mode === "execute") {
            var updated = await executeItemUpdateTags(payload.input || {}, payload.confirmation);
            return jsonCommandResponse(
              200,
              commandName,
              requestId,
              updated,
              undefined,
              { zoteroItemKeys: [updated.zoteroItemKey], tags: updated.addedTags.concat(updated.removedTags) },
              payload.confirmation.planId
            );
          }

          return jsonCommandResponse(200, commandName, requestId, createItemUpdateTagsDryRun(payload.input || {}));
        } catch (error) {
          return jsonCommandResponse(error.status || 400, commandName, requestId, undefined, {
            code: error.code || "ITEM_UPDATE_TAGS_FAILED",
            message: error.message || "Failed to update Zotero item tags"
          });
        }
      }

      if (commandName === "item.trash") {
        try {
          if (payload.mode === "execute") {
            var trashedItems = await executeItemTrash(payload.input || {}, payload.confirmation);
            return jsonCommandResponse(
              200,
              commandName,
              requestId,
              trashedItems,
              undefined,
              { zoteroItemKeys: trashedItems.trashedZoteroItemKeys },
              payload.confirmation.planId
            );
          }

          return jsonCommandResponse(200, commandName, requestId, createItemTrashDryRun(payload.input || {}));
        } catch (error) {
          return jsonCommandResponse(error.status || 400, commandName, requestId, undefined, {
            code: error.code || "ITEM_TRASH_FAILED",
            message: error.message || "Failed to move Zotero items to trash"
          });
        }
      }

      if (commandName === "annotation.list") {
        try {
          var annotationList = readAttachmentAnnotations(payload.input || {});
          return jsonCommandResponse(
            200,
            commandName,
            requestId,
            annotationList,
            undefined,
            {
              zoteroItemKeys: annotationList.annotations.map(function (annotation) { return annotation.annotationKey; }),
              attachmentKeys: [annotationList.attachmentKey]
            }
          );
        } catch (error) {
          return jsonCommandResponse(error.status || 400, commandName, requestId, undefined, {
            code: error.code || "ANNOTATION_LIST_FAILED",
            message: error.message || "Failed to read Zotero attachment annotations"
          });
        }
      }

      if (commandName === "annotation.create") {
        try {
          if (payload.mode === "execute") {
            var createdAnnotation = await executeAnnotationCreate(payload.input || {}, payload.confirmation);
            return jsonCommandResponse(
              200,
              commandName,
              requestId,
              createdAnnotation,
              undefined,
              {
                zoteroItemKeys: [createdAnnotation.annotationKey],
                attachmentKeys: [createdAnnotation.attachmentKey]
              },
              payload.confirmation.planId
            );
          }

          return jsonCommandResponse(200, commandName, requestId, createAnnotationCreateDryRun(payload.input || {}));
        } catch (error) {
          return jsonCommandResponse(error.status || 400, commandName, requestId, undefined, {
            code: error.code || "ANNOTATION_CREATE_FAILED",
            message: error.message || "Failed to create Zotero annotation"
          });
        }
      }

      if (commandName === "annotation.update") {
        try {
          if (payload.mode === "execute") {
            var updatedAnnotation = await executeAnnotationUpdate(payload.input || {}, payload.confirmation);
            return jsonCommandResponse(
              200,
              commandName,
              requestId,
              updatedAnnotation,
              undefined,
              {
                zoteroItemKeys: [updatedAnnotation.annotationKey],
                attachmentKeys: [updatedAnnotation.attachmentKey]
              },
              payload.confirmation.planId
            );
          }

          return jsonCommandResponse(200, commandName, requestId, createAnnotationUpdateDryRun(payload.input || {}));
        } catch (error) {
          return jsonCommandResponse(error.status || 400, commandName, requestId, undefined, {
            code: error.code || "ANNOTATION_UPDATE_FAILED",
            message: error.message || "Failed to update Zotero annotation"
          });
        }
      }

      if (commandName === "note.createChild") {
        try {
          if (payload.mode === "execute") {
            var note = await executeChildNoteCreate(payload.input || {}, payload.confirmation);
            return jsonCommandResponse(
              200,
              commandName,
              requestId,
              note,
              undefined,
              { zoteroItemKeys: [note.zoteroItemKey, note.noteKey] },
              payload.confirmation.planId
            );
          }

          return jsonCommandResponse(200, commandName, requestId, createChildNoteDryRun(payload.input || {}));
        } catch (error) {
          return jsonCommandResponse(error.status || 400, commandName, requestId, undefined, {
            code: error.code || "NOTE_CREATE_CHILD_FAILED",
            message: error.message || "Failed to create Zotero child note"
          });
        }
      }

      if (commandName === "attachment.get") {
        try {
          var attachmentDetails = await readAttachmentDetails(payload.input || {});
          return jsonCommandResponse(
            200,
            commandName,
            requestId,
            attachmentDetails,
            undefined,
            {
              zoteroItemKeys: attachmentDetails.parentZoteroItemKey ? [attachmentDetails.parentZoteroItemKey] : [],
              attachmentKeys: [attachmentDetails.attachmentKey]
            }
          );
        } catch (error) {
          return jsonCommandResponse(error.status || 400, commandName, requestId, undefined, {
            code: error.code || "ATTACHMENT_READ_FAILED",
            message: error.message || "Failed to read Zotero attachment"
          });
        }
      }

      if (commandName === "attachment.getForItem") {
        try {
          var attachments = await readItemAttachments(payload.input || {});
          return jsonCommandResponse(
            200,
            commandName,
            requestId,
            attachments,
            undefined,
            { zoteroItemKeys: [attachments.zoteroItemKey], attachmentKeys: attachments.attachments.map(function (attachment) { return attachment.attachmentKey; }) }
          );
        } catch (error) {
          return jsonCommandResponse(error.status || 400, commandName, requestId, undefined, {
            code: error.code || "ATTACHMENTS_READ_FAILED",
            message: error.message || "Failed to read Zotero item attachments"
          });
        }
      }

      if (commandName === "attachment.addFile") {
        try {
          if (payload.mode === "execute") {
            var attachment = await executeAttachmentAddFile(payload.input || {}, payload.confirmation);
            return jsonCommandResponse(
              200,
              commandName,
              requestId,
              attachment,
              undefined,
              {
                zoteroItemKeys: [attachment.zoteroItemKey],
                attachmentKeys: attachment.attachmentKey ? [attachment.attachmentKey] : []
              },
              payload.confirmation.planId
            );
          }

          return jsonCommandResponse(200, commandName, requestId, await createAttachmentAddFileDryRun(payload.input || {}));
        } catch (error) {
          return jsonCommandResponse(error.status || 400, commandName, requestId, undefined, {
            code: error.code || "ATTACHMENT_ADD_FILE_FAILED",
            message: error.message || "Failed to add Zotero attachment file"
          });
        }
      }

      if (commandName === "attachment.moveToItem") {
        try {
          if (payload.mode === "execute") {
            var movedAttachment = await executeAttachmentMoveToItem(payload.input || {}, payload.confirmation);
            return jsonCommandResponse(
              200,
              commandName,
              requestId,
              movedAttachment,
              undefined,
              {
                zoteroItemKeys: [movedAttachment.previousZoteroItemKey, movedAttachment.targetZoteroItemKey],
                attachmentKeys: [movedAttachment.attachmentKey]
              },
              payload.confirmation.planId
            );
          }

          return jsonCommandResponse(200, commandName, requestId, createAttachmentMoveDryRun(payload.input || {}));
        } catch (error) {
          return jsonCommandResponse(error.status || 400, commandName, requestId, undefined, {
            code: error.code || "ATTACHMENT_MOVE_FAILED",
            message: error.message || "Failed to move Zotero attachment"
          });
        }
      }

      if (commandName === "attachment.rename") {
        try {
          if (payload.mode === "execute") {
            var renamedAttachment = await executeAttachmentRename(payload.input || {}, payload.confirmation);
            return jsonCommandResponse(
              200,
              commandName,
              requestId,
              renamedAttachment,
              undefined,
              {
                zoteroItemKeys: renamedAttachment.parentZoteroItemKey ? [renamedAttachment.parentZoteroItemKey] : [],
                attachmentKeys: [renamedAttachment.attachmentKey]
              },
              payload.confirmation.planId
            );
          }

          return jsonCommandResponse(200, commandName, requestId, await createAttachmentRenameDryRun(payload.input || {}));
        } catch (error) {
          return jsonCommandResponse(error.status || 400, commandName, requestId, undefined, {
            code: error.code || "ATTACHMENT_RENAME_FAILED",
            message: error.message || "Failed to rename Zotero attachment"
          });
        }
      }

      if (commandName === "attachment.runZoteroRename") {
        try {
          if (payload.mode === "execute") {
            var autoRenamedAttachment = await executeAttachmentRunZoteroRename(payload.input || {}, payload.confirmation);
            return jsonCommandResponse(
              200,
              commandName,
              requestId,
              autoRenamedAttachment,
              undefined,
              {
                zoteroItemKeys: autoRenamedAttachment.parentZoteroItemKey ? [autoRenamedAttachment.parentZoteroItemKey] : [],
                attachmentKeys: [autoRenamedAttachment.attachmentKey]
              },
              payload.confirmation.planId
            );
          }

          return jsonCommandResponse(200, commandName, requestId, await createAttachmentRunZoteroRenameDryRun(payload.input || {}));
        } catch (error) {
          return jsonCommandResponse(error.status || 400, commandName, requestId, undefined, {
            code: error.code || "ATTACHMENT_ZOTERO_RENAME_FAILED",
            message: error.message || "Failed to run Zotero attachment rename"
          });
        }
      }

      if (commandName === "attachment.undoAdded") {
        try {
          if (payload.mode === "execute") {
            var undoneAttachment = await executeAttachmentUndoAdded(payload.input || {}, payload.confirmation);
            return jsonCommandResponse(
              200,
              commandName,
              requestId,
              undoneAttachment,
              undefined,
              {
                zoteroItemKeys: undoneAttachment.parentZoteroItemKey ? [undoneAttachment.parentZoteroItemKey] : [],
                attachmentKeys: [undoneAttachment.attachmentKey]
              },
              payload.confirmation.planId
            );
          }

          return jsonCommandResponse(200, commandName, requestId, await createAttachmentUndoAddedDryRun(payload.input || {}));
        } catch (error) {
          return jsonCommandResponse(error.status || 400, commandName, requestId, undefined, {
            code: error.code || "ATTACHMENT_UNDO_ADDED_FAILED",
            message: error.message || "Failed to undo Zotero attachment added by this bridge"
          });
        }
      }

      if (commandName === "attachment.trash") {
        try {
          if (payload.mode === "execute") {
            var trashedAttachments = await executeAttachmentTrash(payload.input || {}, payload.confirmation);
            return jsonCommandResponse(
              200,
              commandName,
              requestId,
              trashedAttachments,
              undefined,
              {
                zoteroItemKeys: trashedAttachments.parentZoteroItemKeys,
                attachmentKeys: trashedAttachments.trashedAttachmentKeys
              },
              payload.confirmation.planId
            );
          }

          return jsonCommandResponse(200, commandName, requestId, await createAttachmentTrashDryRun(payload.input || {}));
        } catch (error) {
          return jsonCommandResponse(error.status || 400, commandName, requestId, undefined, {
            code: error.code || "ATTACHMENT_TRASH_FAILED",
            message: error.message || "Failed to move Zotero attachments to trash"
          });
        }
      }

      if (commandName === "attachment.renamePreferences.get") {
        try {
          return jsonCommandResponse(200, commandName, requestId, readAttachmentRenamePreferences());
        } catch (error) {
          return jsonCommandResponse(error.status || 400, commandName, requestId, undefined, {
            code: error.code || "ATTACHMENT_RENAME_PREFERENCES_READ_FAILED",
            message: error.message || "Failed to read Zotero attachment rename preferences"
          });
        }
      }

      if (commandName === "attachment.renamePreferences.set") {
        try {
          if (payload.mode === "execute") {
            var updatedPreferences = await executeAttachmentRenamePreferencesSet(payload.input || {}, payload.confirmation);
            return jsonCommandResponse(200, commandName, requestId, updatedPreferences, undefined, undefined, payload.confirmation.planId);
          }

          return jsonCommandResponse(200, commandName, requestId, createAttachmentRenamePreferencesSetDryRun(payload.input || {}));
        } catch (error) {
          return jsonCommandResponse(error.status || 400, commandName, requestId, undefined, {
            code: error.code || "ATTACHMENT_RENAME_PREFERENCES_SET_FAILED",
            message: error.message || "Failed to set Zotero attachment rename preferences"
          });
        }
      }

      if (commandName === "backup.settings.get") {
        try {
          return jsonCommandResponse(200, commandName, requestId, await readBackupSettings());
        } catch (error) {
          return jsonCommandResponse(error.status || 400, commandName, requestId, undefined, {
            code: error.code || "BACKUP_SETTINGS_READ_FAILED",
            message: error.message || "Failed to read Zotero Local MCP Bridge backup settings"
          });
        }
      }

      if (commandName === "backup.settings.set") {
        try {
          if (payload.mode === "execute") {
            var updatedBackupSettings = await executeBackupSettingsSet(payload.input || {}, payload.confirmation);
            return jsonCommandResponse(200, commandName, requestId, updatedBackupSettings, undefined, undefined, payload.confirmation.planId);
          }

          return jsonCommandResponse(200, commandName, requestId, await createBackupSettingsSetDryRun(payload.input || {}));
        } catch (error) {
          return jsonCommandResponse(error.status || 400, commandName, requestId, undefined, {
            code: error.code || "BACKUP_SETTINGS_SET_FAILED",
            message: error.message || "Failed to set Zotero Local MCP Bridge backup settings"
          });
        }
      }

      if (commandName === "backup.snapshot.list") {
        try {
          return jsonCommandResponse(200, commandName, requestId, await readBackupSnapshotList(payload.input || {}));
        } catch (error) {
          return jsonCommandResponse(error.status || 400, commandName, requestId, undefined, {
            code: error.code || "BACKUP_SNAPSHOT_LIST_FAILED",
            message: error.message || "Failed to read Zotero Local MCP Bridge backup snapshots"
          });
        }
      }

      if (commandName === "backup.snapshot.restore") {
        try {
          if (payload.mode === "execute") {
            var restoredSnapshot = await executeBackupSnapshotRestore(payload.input || {}, payload.confirmation);
            return jsonCommandResponse(
              200,
              commandName,
              requestId,
              restoredSnapshot,
              undefined,
              {
                zoteroItemKeys: restoredSnapshot.parentZoteroItemKey ? [restoredSnapshot.parentZoteroItemKey] : [],
                attachmentKeys: restoredSnapshot.attachmentKey ? [restoredSnapshot.attachmentKey] : []
              },
              payload.confirmation.planId
            );
          }

          return jsonCommandResponse(200, commandName, requestId, await createBackupSnapshotRestoreDryRun(payload.input || {}));
        } catch (error) {
          return jsonCommandResponse(error.status || 400, commandName, requestId, undefined, {
            code: error.code || "BACKUP_SNAPSHOT_RESTORE_FAILED",
            message: error.message || "Failed to restore Zotero Local MCP Bridge backup snapshot"
          });
        }
      }

      if (commandName === "backup.snapshot.prune") {
        try {
          if (payload.mode === "execute") {
            var prunedSnapshots = await executeBackupSnapshotPrune(payload.input || {}, payload.confirmation);
            return jsonCommandResponse(200, commandName, requestId, prunedSnapshots, undefined, undefined, payload.confirmation.planId);
          }

          return jsonCommandResponse(200, commandName, requestId, await createBackupSnapshotPruneDryRun(payload.input || {}));
        } catch (error) {
          return jsonCommandResponse(error.status || 400, commandName, requestId, undefined, {
            code: error.code || "BACKUP_SNAPSHOT_PRUNE_FAILED",
            message: error.message || "Failed to prune Zotero Local MCP Bridge backup snapshots"
          });
        }
      }

      if (commandName === "audit.list") {
        try {
          return jsonCommandResponse(200, commandName, requestId, await readAuditList(payload.input || {}));
        } catch (error) {
          return jsonCommandResponse(error.status || 400, commandName, requestId, undefined, {
            code: error.code || "AUDIT_LIST_FAILED",
            message: error.message || "Failed to read Zotero Local MCP Bridge audit log"
          });
        }
      }

      return jsonCommandResponse(501, commandName, requestId, undefined, {
        code: "COMMAND_ENDPOINT_NOT_IMPLEMENTED",
        message: "Only collection getTree/getItems/create/rename/move/addItems/removeItems, item get/search/updateTags, advanced search, saved search, citation formatting, import/export, annotation list/create/update, note.createChild, attachment get/getForItem/add/move/rename/runZoteroRename/undoAdded, attachment rename preferences, backup settings/snapshot list/restore/prune, audit.list, and safety.getProfileStatus/unlockRealProfile/lockRealProfile are connected in this runtime build"
      });
    
}

function getRequestJson(req) {
  if (req.data && typeof req.data === "object") {
    return req.data;
  }

  if (typeof req.data === "string" && req.data.length > 0) {
    return JSON.parse(req.data);
  }

  throw new Error("Command request body is missing");
}

function assertProfileWritePermission(profileMode, testProfileMarkerPresent, commandName) {
  if (profileMode === "readonly" || profileMode === "real-locked") {
    throw commandError(
      "PROFILE_REAL_LOCKED",
      `Command ${commandName} is blocked because real-profile writes are locked`,
      403
    );
  }

  if (profileMode === "test" && !testProfileMarkerPresent) {
    throw commandError(
      "TEST_PROFILE_MARKER_MISSING",
      "Test profile marker file is required before write commands can run: " + TEST_PROFILE_MARKER_FILE,
      403
    );
  }
}

function assertOperationWritePermission(operationMode, commandName) {
  if (operationMode === "readonly") {
    throw commandError(
      "OPERATION_MODE_READONLY",
      "Command " + commandName + " is blocked because operation mode is readonly",
      403
    );
  }
}

async function getProfileStatusResponse(context) {
  var profileMode = context.profileMode || REAL_PROFILE_DEFAULT_MODE;
  var operationMode = context.operationMode || getBridgeOperationMode();
  var state = await readRealProfileUnlockState();
  var profileFingerprint = resolveProfileFingerprint();
  var unlockExpiresAt = state.expiresAt || null;
  var unlockTtlMinutes = state.ttlMinutes || null;
  var unlockActive = state.unlocked && isProfileUnlockActive(state, profileFingerprint);
  if (profileMode === "real-unlocked" && !unlockActive) {
    unlockActive = false;
  }

  return {
    profileMode: profileMode,
    operationMode: operationMode,
    runMode: operationMode,
    dryRunRequired: true,
    auditEnabled: true,
    testProfileMarkerPresent: !!context.testProfileMarkerPresent,
    isRealUnlocked: unlockActive,
    profileFingerprint: profileFingerprint,
    unlockExpiresAt: unlockExpiresAt,
    unlockTtlMinutes: unlockTtlMinutes,
    auditPath: auditRootPath(),
    backupPath: backupRootPath(),
    runtimeRoot: resolveBridgeRuntimeRoot()
  };
}

async function executeSafetyUnlockRealProfile(input) {
  var normalized = normalizeSafetyUnlockInput(input);
  var actualFingerprint = resolveProfileFingerprint();
  if (normalized.profileFingerprint !== actualFingerprint) {
    throw realProfileUnlockError(
      "PROFILE_UNLOCK_FINGERPRINT_MISMATCH",
      "Profile fingerprint does not match the current profile",
      409,
      {
        expectedProfileFingerprint: actualFingerprint,
        providedProfileFingerprint: normalized.profileFingerprint
      }
    );
  }

  var profileMode = await getProfileMode();
  if (profileMode === "readonly") {
    throw realProfileUnlockError("PROFILE_UNLOCK_FORBIDDEN", "Readonly mode cannot be unlocked for real-profile writes", 403, {
      profileMode: profileMode
    });
  }

  if (profileMode === "test") {
    throw realProfileUnlockError("PROFILE_UNLOCK_FORBIDDEN", "Test mode does not require real-profile unlock", 409, {
      profileMode: profileMode
    });
  }

  var ttlMinutes = normalized.ttlMinutes;
  var nowMs = Date.now();
  var expiresAt = new Date(nowMs + ttlMinutes * 60 * 1000).toISOString();

  await saveRealProfileUnlockState({
    unlocked: true,
    profileFingerprint: actualFingerprint,
    unlockedAt: new Date(nowMs).toISOString(),
    expiresAt: expiresAt,
    ttlMinutes: ttlMinutes,
    confirmationText: normalized.confirmationText
  });

  return {
    profileMode: "real-unlocked",
    profileFingerprint: actualFingerprint,
    unlockExpiresAt: expiresAt,
    ttlMinutes: ttlMinutes,
    auditPath: auditRootPath(),
    backupPath: backupRootPath()
  };
}

async function executeSafetyLockRealProfile() {
  await saveRealProfileUnlockState({
    unlocked: false,
    profileFingerprint: resolveProfileFingerprint(),
    unlockedAt: null,
    expiresAt: null,
    ttlMinutes: null,
    confirmationText: null
  });

  return {
    profileMode: "real-locked",
    profileFingerprint: resolveProfileFingerprint(),
    auditPath: auditRootPath(),
    backupPath: backupRootPath()
  };
}

function normalizeSafetyUnlockInput(input) {
  if (!input || typeof input !== "object") {
    throw realProfileUnlockError("REAL_PROFILE_UNLOCK_INPUT_INVALID", "safety.unlockRealProfile input must be an object", 400);
  }

  var profileFingerprint = trimString(input.profileFingerprint);
  if (!profileFingerprint) {
    throw realProfileUnlockError("REAL_PROFILE_UNLOCK_FINGERPRINT_REQUIRED", "safety.unlockRealProfile requires profileFingerprint", 400, {
      expectedProfileFingerprint: resolveProfileFingerprint()
    });
  }

  if (typeof input.confirmationText !== "string" || input.confirmationText !== REAL_PROFILE_UNLOCK_CONFIRMATION) {
    throw realProfileUnlockError("PROFILE_UNLOCK_CONFIRMATION_REQUIRED", "safety.unlockRealProfile requires exact confirmation text", 400, {
      requiredField: "confirmationText",
      requiredText: REAL_PROFILE_UNLOCK_CONFIRMATION
    });
  }

  var ttlMinutes;
  if (input.ttlMinutes === undefined || input.ttlMinutes === null) {
    ttlMinutes = REAL_PROFILE_UNLOCK_DEFAULT_TTL_MINUTES;
  } else if (!Number.isInteger(input.ttlMinutes) || input.ttlMinutes < 1) {
    throw realProfileUnlockError("REAL_PROFILE_UNLOCK_TTL_INVALID", "ttlMinutes must be a positive integer", 400, {
      requiredField: "ttlMinutes"
    });
  } else if (input.ttlMinutes > REAL_PROFILE_UNLOCK_MAX_TTL_MINUTES) {
    throw realProfileUnlockError(
      "REAL_PROFILE_UNLOCK_TTL_OUT_OF_RANGE",
      "ttlMinutes must be between 1 and " + REAL_PROFILE_UNLOCK_MAX_TTL_MINUTES,
      400
    );
  } else {
    ttlMinutes = input.ttlMinutes;
  }

  return {
    profileFingerprint: profileFingerprint,
    confirmationText: input.confirmationText,
    ttlMinutes: ttlMinutes
  };
}

function realProfileUnlockError(code, message, status, details) {
  return commandError(
    code,
    message,
    status,
    Object.assign(
      {
        commandName: "safety.unlockRealProfile",
        requiredText: REAL_PROFILE_UNLOCK_CONFIRMATION,
        ttlMinutesDefault: REAL_PROFILE_UNLOCK_DEFAULT_TTL_MINUTES,
        ttlMinutesMin: 1,
        ttlMinutesMax: REAL_PROFILE_UNLOCK_MAX_TTL_MINUTES
      },
      details || {}
    )
  );
}

function trimString(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

async function getProfileMode() {
  var pref = getPreferenceValue(REAL_PROFILE_PREFERENCE_MODE);
  var preferenceMode = pref === "readonly" || pref === "test" || pref === "real-locked" || pref === "real-unlocked"
    ? pref
    : undefined;

  if (preferenceMode === "readonly" || preferenceMode === "test") {
    return preferenceMode;
  }

  if (!preferenceMode && await isTestProfileMarkerPresent()) {
    return "test";
  }

  var state = await readRealProfileUnlockState();
  if (state && state.unlocked && isProfileUnlockActive(state, resolveProfileFingerprint())) {
    return "real-unlocked";
  }

  return "real-locked";
}

function getBridgeOperationMode() {
  var value = getPreferenceValue(BRIDGE_OPERATION_MODE_PREFERENCE);
  return BRIDGE_OPERATION_MODES[value] ? value : BRIDGE_OPERATION_MODE_DEFAULT;
}

function isProfileUnlockActive(state, profileFingerprint) {
  if (!state || !state.unlocked || !state.expiresAt) {
    return false;
  }

  if (profileFingerprint && state.profileFingerprint !== profileFingerprint) {
    return false;
  }

  var expiresAt = Date.parse(state.expiresAt);
  if (!Number.isFinite(expiresAt)) {
    return false;
  }

  return expiresAt > Date.now();
}

async function readRealProfileUnlockState() {
  var statePath = resolveRealProfileStatePath();
  if (!(await fileExists(statePath))) {
    return { unlocked: false };
  }

  try {
    var contents = await Zotero.File.getContentsAsync(statePath);
    var parsed = JSON.parse(contents || "{}");
    if (!parsed || typeof parsed !== "object") {
      return { unlocked: false, parseError: true };
    }
    return {
      unlocked: !!parsed.unlocked,
      profileFingerprint: typeof parsed.profileFingerprint === "string" ? parsed.profileFingerprint : "",
      unlockedAt: typeof parsed.unlockedAt === "string" ? parsed.unlockedAt : "",
      expiresAt: typeof parsed.expiresAt === "string" ? parsed.expiresAt : "",
      ttlMinutes: Number.isInteger(parsed.ttlMinutes) ? parsed.ttlMinutes : null
    };
  } catch (error) {
    return { unlocked: false, parseError: true };
  }
}

async function saveRealProfileUnlockState(state) {
  var statePath = resolveRealProfileStatePath();
  var dir = PathUtils.parent(statePath);
  await Zotero.File.createDirectoryIfMissingAsync(dir);
  await Zotero.File.putContentsAsync(statePath, JSON.stringify(state, null, 2) + "\n");
}

function resolveRealProfileStatePath() {
  return PathUtils.join.apply(PathUtils, [resolveBridgeRuntimeRoot()].concat(REAL_PROFILE_STATE_PATH_PARTS));
}

async function isTestProfileMarkerPresent() {
  var profileDir = resolveProfileDirectory();
  if (!profileDir) {
    return false;
  }

  return await fileExists(PathUtils.join(profileDir, TEST_PROFILE_MARKER_FILE)) ||
    await fileExists(PathUtils.join(profileDir, LEGACY_TEST_PROFILE_MARKER_FILE));
}

function resolveProfileDirectory() {
  if (typeof Components === "object" &&
    Components.classes &&
    Components.interfaces &&
    Components.classes["@mozilla.org/file/directory_service;1"] &&
    Components.interfaces.nsIProperties &&
    Components.interfaces.nsIFile) {
    try {
      return Components.classes["@mozilla.org/file/directory_service;1"]
        .getService(Components.interfaces.nsIProperties)
        .get("ProfD", Components.interfaces.nsIFile)
        .path;
    } catch (error) {
      // Continue to fallback probes below.
    }
  }

  if (typeof Zotero === "object" && Zotero && typeof Zotero.Profile === "object" && Zotero.Profile !== null) {
    if (typeof Zotero.Profile.dir === "string") {
      return Zotero.Profile.dir;
    }
    if (typeof Zotero.Profile.directory === "string") {
      return Zotero.Profile.directory;
    }
    if (typeof Zotero.Profile.path === "string") {
      return Zotero.Profile.path;
    }
  }

  return "";
}

function resolveProfileFingerprint() {
  return "fp_" + fnv1a(normalizeFilePath(resolveProfileDirectory()).toLowerCase());
}

function readCollectionTree() {
  if (!Zotero.Libraries || !Zotero.Collections) {
    throw new Error("Zotero collection APIs are unavailable");
  }

  var collections = Zotero.Collections.getByLibrary(
    Zotero.Libraries.userLibraryID,
    true,
    false
  );

  return {
    collections: collections.map(function (collection) {
      var record = {
        collectionKey: collection.key,
        name: collection.name
      };

      if (collection.parentKey) {
        record.parentCollectionKey = collection.parentKey;
      }

      return record;
    })
  };
}

function readCollectionItems(input) {
  var collection = normalizeCollectionTarget(input.collectionKey);
  return {
    collectionKey: collection.key,
    zoteroItemKeys: collection.getChildItems(false, false).map(function (item) {
      return item.key;
    })
  };
}

async function exportItemsWithTranslator(commandName, input) {
  var normalized = normalizeExportItemsInput(commandName, input);
  var content = await runZoteroItemExport(normalized.items, normalized.translatorID);
  return {
    format: normalized.format,
    translatorID: normalized.translatorID,
    zoteroItemKeys: normalized.zoteroItemKeys,
    content: content
  };
}

function normalizeExportItemsInput(commandName, input) {
  if (!input || typeof input !== "object") {
    throw commandError("COMMAND_INPUT_INVALID", commandName + " input must be an object", 400);
  }

  if (!Array.isArray(input.zoteroItemKeys) || input.zoteroItemKeys.length === 0) {
    throw commandError("ZOTERO_ITEM_KEYS_REQUIRED", commandName + " requires a non-empty zoteroItemKeys array", 400);
  }

  if (input.zoteroItemKeys.length > 50) {
    throw commandError("BATCH_LIMIT_EXCEEDED", "Export item count exceeds limit 50", 400);
  }

  var format = commandName === "export.bibtex"
    ? "bibtex"
    : commandName === "export.ris"
      ? "ris"
      : "cslJson";
  var itemKeys = [];
  var items = [];
  for (var i = 0; i < input.zoteroItemKeys.length; i += 1) {
    var itemKey = input.zoteroItemKeys[i];
    if (typeof itemKey !== "string" || itemKey.trim().length === 0) {
      throw commandError("ZOTERO_ITEM_KEY_INVALID", "zoteroItemKeys must contain non-empty strings", 400);
    }

    var item = normalizeItemTarget(itemKey.trim());
    if (item.isAnnotation && item.isAnnotation()) {
      throw commandError("ITEM_EXPORT_UNSUPPORTED", "Annotation items cannot be exported by this command", 400);
    }

    itemKeys.push(item.key);
    items.push(item);
  }

  return {
    format: format,
    translatorID: EXPORT_TRANSLATOR_IDS[format],
    zoteroItemKeys: itemKeys,
    items: items
  };
}

function runZoteroItemExport(items, translatorID) {
  if (!Zotero.Translate || !Zotero.Translate.Export) {
    throw commandError("ITEM_EXPORT_UNSUPPORTED", "This Zotero runtime does not expose Zotero.Translate.Export", 500);
  }

  return new Promise(function (resolve, reject) {
    var translation = new Zotero.Translate.Export();
    translation.setItems(items.slice());
    translation.setTranslator(translatorID);
    translation.setHandler("done", function () {
      resolve(translation.string || "");
    });
    translation.setHandler("error", function (_, error) {
      reject(commandError("ITEM_EXPORT_FAILED", error && error.message ? error.message : "Zotero export translator failed", 500));
    });
    translation.translate();
  });
}

function createImportDryRun(commandName, input) {
  var normalized = normalizeImportItemsInput(commandName, input);
  return createWriteDryRunPlan(
    commandName,
    normalized,
    {
      zoteroItemKeys: [],
      collectionKeys: normalized.collectionKeys,
      attachmentKeys: [],
      filePaths: [],
      tags: normalized.tags
    },
    [],
    { items: [] },
    {
      format: normalized.format,
      estimatedItemCount: normalized.estimatedItemCount,
      action: "create",
      collectionKeys: normalized.collectionKeys,
      tags: normalized.tags
    }
  );
}

async function executeImportWithTranslator(commandName, input, confirmation) {
  assertConfirmationPresent(confirmation);
  var normalized = normalizeImportItemsInput(commandName, input);
  validateStoredConfirmation(normalized, confirmation);

  var importedItems = await runZoteroItemImport(normalized.content, normalized.translatorID, normalized.collectionKeys);
  var postProcessedItems = [];
  for (var i = 0; i < importedItems.length; i += 1) {
    var item = resolveImportedZoteroItem(importedItems[i]);
    if (!item) {
      continue;
    }

    if (normalized.collectionKeys.length > 0) {
      item.setCollections(normalized.collectionKeys);
    }
    for (var tagIndex = 0; tagIndex < normalized.tags.length; tagIndex += 1) {
      item.addTag(normalized.tags[tagIndex]);
    }
    if (normalized.collectionKeys.length > 0 || normalized.tags.length > 0) {
      await item.saveTx();
    }
    postProcessedItems.push(item);
  }

  return {
    format: normalized.format,
    translatorID: normalized.translatorID,
    importedItemCount: postProcessedItems.length,
    zoteroItemKeys: postProcessedItems.map(function (item) { return item.key; }),
    collectionKeys: normalized.collectionKeys,
    tags: normalized.tags,
    items: postProcessedItems.map(function (item) {
      return readItemDetails({ zoteroItemKey: item.key });
    })
  };
}

function normalizeImportItemsInput(commandName, input) {
  if (!input || typeof input !== "object") {
    throw commandError("COMMAND_INPUT_INVALID", commandName + " input must be an object", 400);
  }

  if (typeof input.content !== "string" || input.content.trim().length === 0) {
    throw commandError("IMPORT_CONTENT_REQUIRED", commandName + " requires non-empty content", 400);
  }

  var format = commandName === "import.bibtex"
    ? "bibtex"
    : commandName === "import.ris"
      ? "ris"
      : "cslJson";
  var collectionKeys = normalizeCollectionKeyArray(input.collectionKeys || [], "collectionKeys");
  var tags = normalizeTagArray(input.tags || [], "tags");
  if (collectionKeys.length + tags.length > 50) {
    throw commandError("BATCH_LIMIT_EXCEEDED", "Import related object count exceeds limit 50", 400);
  }

  return {
    content: input.content,
    format: format,
    translatorID: EXPORT_TRANSLATOR_IDS[format],
    estimatedItemCount: estimateImportItemCount(format, input.content),
    collectionKeys: collectionKeys,
    tags: tags
  };
}

function estimateImportItemCount(format, content) {
  if (format === "bibtex") {
    var bibtexMatches = content.match(/@[A-Za-z]+\s*[({]/g);
    return bibtexMatches ? bibtexMatches.length : 0;
  }

  if (format === "ris") {
    var risMatches = content.match(/^ER\s*-/gm);
    return risMatches ? risMatches.length : 0;
  }

  try {
    var parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed.length : 1;
  } catch (error) {
    throw commandError("IMPORT_CONTENT_INVALID", "CSL JSON content must be valid JSON", 400);
  }
}

async function runZoteroItemImport(content, translatorID, collectionKeys) {
  if (!Zotero.Translate || !Zotero.Translate.Import) {
    throw commandError("ITEM_IMPORT_UNSUPPORTED", "This Zotero runtime does not expose Zotero.Translate.Import", 500);
  }

  var collectionIDs = [];
  for (var index = 0; index < collectionKeys.length; index += 1) {
    collectionIDs.push(getLocalUserCollection(collectionKeys[index]).id);
  }

  try {
    var translation = new Zotero.Translate.Import();
    translation.setString(content);
    translation.setTranslator(translatorID);
    return await translation.translate({
      libraryID: Zotero.Libraries.userLibraryID,
      collections: collectionIDs.length ? collectionIDs : null,
      forceTagType: 1,
      saveOptions: {
        skipSelect: false
      }
    });
  } catch (error) {
    throw commandError("ITEM_IMPORT_FAILED", error && error.message ? error.message : "Zotero import translator failed", 500);
  }
}

function resolveImportedZoteroItem(item) {
  if (!item) {
    return null;
  }

  if (item.key) {
    return getLocalUserItem(item.key);
  }

  if (item.id && Zotero.Items && Zotero.Items.get) {
    var zoteroItem = Zotero.Items.get(item.id);
    if (zoteroItem && zoteroItem.libraryID === Zotero.Libraries.userLibraryID) {
      return zoteroItem;
    }
  }

  return null;
}

function readItemDetails(input) {
  var item = normalizeItemTarget(input.zoteroItemKey);
  var nativeJson = {};
  if (item.toJSON) {
    nativeJson = item.toJSON({ skipStorageProperties: true });
  }

  var collectionKeys = [];
  if (Array.isArray(nativeJson.collections)) {
    collectionKeys = nativeJson.collections.slice();
  } else if (
    item.isTopLevelItem &&
    item.isTopLevelItem() &&
    item.getCollections &&
    Zotero.Collections &&
    Zotero.Collections.getLibraryAndKeyFromID
  ) {
    collectionKeys = item.getCollections(true).map(function (collectionID) {
      var libraryAndKey = Zotero.Collections.getLibraryAndKeyFromID(collectionID);
      return libraryAndKey.key;
    }).filter(function (collectionKey) {
      return !!collectionKey;
    });
  }

  var attachmentKeys = [];
  if (!item.isAttachment || !item.isAttachment()) {
    attachmentKeys = item.getAttachments(false).map(function (attachmentID) {
      var attachment = Zotero.Items.get(attachmentID);
      return attachment && attachment.key;
    }).filter(function (attachmentKey) {
      return !!attachmentKey;
    });
  }

  var noteKeys = [];
  if (!item.isNote || !item.isNote()) {
    noteKeys = item.getNotes(false).map(function (noteID) {
      var note = Zotero.Items.get(noteID);
      return note && note.key;
    }).filter(function (noteKey) {
      return !!noteKey;
    });
  }

  return {
    zoteroItemKey: item.key,
    itemType: item.itemType || nativeJson.itemType,
    title: item.getField ? item.getField("title") : nativeJson.title,
    firstCreator: item.getField ? item.getField("firstCreator", true) : undefined,
    year: item.getField ? item.getField("year") : undefined,
    creators: nativeJson.creators || [],
    tags: readItemTags(item),
    collectionKeys: collectionKeys,
    attachmentKeys: attachmentKeys,
    noteKeys: noteKeys,
    isRegularItem: item.isRegularItem ? item.isRegularItem() : false,
    isAttachment: item.isAttachment ? item.isAttachment() : false,
    isNote: item.isNote ? item.isNote() : false,
    item: nativeJson
  };
}

async function searchItems(input) {
  var normalized = normalizeItemSearchInput(input);
  var allItems = await Zotero.Items.getAll(Zotero.Libraries.userLibraryID, true, false, false);
  var collection = normalized.collectionKey ? normalizeCollectionTarget(normalized.collectionKey) : undefined;
  var results = [];

  for (var i = 0; i < allItems.length; i += 1) {
    var item = allItems[i];
    if (!item || !item.isRegularItem || !item.isRegularItem()) {
      continue;
    }

    if (normalized.itemType && item.itemType !== normalized.itemType) {
      continue;
    }

    if (collection && !item.inCollection(collection.id)) {
      continue;
    }

    if (normalized.tag && !item.hasTag(normalized.tag)) {
      continue;
    }

    var summary = itemSummaryRecord(item);
    if (normalized.query && !itemSummaryMatchesQuery(summary, normalized.query)) {
      continue;
    }

    results.push(summary);
    if (results.length >= normalized.limit) {
      break;
    }
  }

  return {
    query: normalized.query || undefined,
    itemType: normalized.itemType || undefined,
    collectionKey: normalized.collectionKey || undefined,
    tag: normalized.tag || undefined,
    limit: normalized.limit,
    items: results
  };
}

function normalizeItemSearchInput(input) {
  if (!input || typeof input !== "object") {
    input = {};
  }

  var query = normalizeOptionalString(input.query, "query");
  var itemType = normalizeOptionalString(input.itemType, "itemType");
  var collectionKey = normalizeOptionalString(input.collectionKey, "collectionKey");
  var tag = normalizeOptionalString(input.tag, "tag");
  var limit = input.limit === undefined ? 25 : input.limit;
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    throw commandError("ITEM_SEARCH_LIMIT_INVALID", "item.search limit must be an integer from 1 to 50", 400);
  }

  return {
    query: query,
    itemType: itemType,
    collectionKey: collectionKey,
    tag: tag,
    limit: limit
  };
}

function normalizeOptionalString(value, fieldName) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  if (typeof value !== "string") {
    throw commandError("COMMAND_INPUT_INVALID", fieldName + " must be a string when provided", 400);
  }
  var trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function itemSummaryRecord(item) {
  var collectionKeys = [];
  var nativeJson = item.toJSON ? item.toJSON({ skipStorageProperties: true }) : {};
  if (Array.isArray(nativeJson.collections)) {
    collectionKeys = nativeJson.collections.slice();
  }

  return {
    zoteroItemKey: item.key,
    itemType: item.itemType || nativeJson.itemType,
    title: item.getField ? item.getField("title") : nativeJson.title,
    firstCreator: item.getField ? item.getField("firstCreator", true) : undefined,
    year: item.getField ? item.getField("year") : undefined,
    tags: readItemTags(item),
    collectionKeys: collectionKeys
  };
}

function itemSummaryMatchesQuery(summary, query) {
  var needle = query.toLowerCase();
  var haystack = [
    summary.zoteroItemKey,
    summary.itemType,
    summary.title,
    summary.firstCreator,
    summary.year
  ].concat(summary.tags || []).join(" ").toLowerCase();
  return haystack.indexOf(needle) !== -1;
}

async function runAdvancedSearch(input) {
  var normalized = normalizeAdvancedSearchInput(input);
  var search = buildZoteroSearch(normalized);
  var resultIDs = await search.search();
  var uniqueIDs = [];
  var seen = {};
  for (var i = 0; i < resultIDs.length; i += 1) {
    if (!seen[resultIDs[i]]) {
      seen[resultIDs[i]] = true;
      uniqueIDs.push(resultIDs[i]);
    }
    if (uniqueIDs.length >= normalized.limit) {
      break;
    }
  }

  var items = await Zotero.Items.getAsync(uniqueIDs);
  return {
    conditions: normalized.conditions,
    joinMode: normalized.joinMode,
    includeChildren: normalized.includeChildren,
    includeDeleted: normalized.includeDeleted,
    limit: normalized.limit,
    items: items.filter(function (item) {
      return item && item.key;
    }).map(function (item) {
      return itemSummaryRecord(item);
    })
  };
}

async function listSavedSearches(input) {
  var limit = normalizeBoundedInteger(input && input.limit !== undefined ? input.limit : 50, 1, 200, "savedSearch.list limit", "SAVED_SEARCH_LIST_LIMIT_INVALID");
  var searches = await Zotero.Searches.getAll(Zotero.Libraries.userLibraryID);
  return {
    limit: limit,
    savedSearches: searches.slice(0, limit).map(function (search) {
      return savedSearchRecord(search);
    })
  };
}

function getSavedSearchDetails(input) {
  var search = normalizeSavedSearchTarget(input.savedSearchKey);
  return savedSearchRecord(search);
}

function createSavedSearchCreateDryRun(input) {
  var normalized = normalizeSavedSearchCreateInput(input);
  return createWriteDryRunPlan(
    "savedSearch.create",
    normalized,
    {
      zoteroItemKeys: [],
      collectionKeys: [],
      attachmentKeys: [],
      filePaths: [],
      tags: []
    },
    [],
    undefined,
    {
      action: "create",
      name: normalized.name,
      conditions: normalized.conditions,
      joinMode: normalized.joinMode
    }
  );
}

async function executeSavedSearchCreate(input, confirmation) {
  assertConfirmationPresent(confirmation);
  var normalized = normalizeSavedSearchCreateInput(input);
  validateStoredConfirmation(normalized, confirmation);

  var search = new Zotero.Search();
  search.libraryID = Zotero.Libraries.userLibraryID;
  search.name = normalized.name;
  applySearchConditions(search, normalized);
  await search.saveTx();
  return savedSearchRecord(search);
}

function createSavedSearchUpdateDryRun(input) {
  var normalized = normalizeSavedSearchUpdateInput(input);
  return createWriteDryRunPlan(
    "savedSearch.update",
    stripRuntimeFields(normalized),
    {
      zoteroItemKeys: [normalized.savedSearchKey],
      collectionKeys: [],
      attachmentKeys: [],
      filePaths: [],
      tags: []
    },
    [],
    savedSearchRecord(normalized.search),
    {
      action: "update",
      savedSearchKey: normalized.savedSearchKey,
      name: normalized.name,
      conditions: normalized.conditions,
      joinMode: normalized.joinMode
    }
  );
}

async function executeSavedSearchUpdate(input, confirmation) {
  assertConfirmationPresent(confirmation);
  var normalized = normalizeSavedSearchUpdateInput(input);
  validateStoredConfirmation(stripRuntimeFields(normalized), confirmation);

  var search = normalized.search;
  if (normalized.name) {
    search.name = normalized.name;
  }
  if (normalized.conditions) {
    Object.keys(search.getConditions()).forEach(function (conditionID) {
      search.removeCondition(conditionID);
    });
    applySearchConditions(search, {
      conditions: normalized.conditions,
      joinMode: normalized.joinMode
    });
  }
  await search.saveTx();
  return savedSearchRecord(search);
}

async function formatCitation(input) {
  var normalized = normalizeCitationFormatInput(input);
  var items = normalized.zoteroItemKeys.map(function (zoteroItemKey) {
    return getLocalUserItem(zoteroItemKey);
  }).filter(function (item) {
    return item && item.isRegularItem && item.isRegularItem();
  });
  if (items.length === 0) {
    throw commandError("CITATION_ITEMS_EMPTY", "citation.format requires at least one regular Zotero item", 400);
  }

  var style = resolveCitationStyle(normalized.style);
  var cslEngine = style.getCiteProc(normalized.locale, "html", { cache: true });
  cslEngine.opt.development_extensions.wrap_url_and_doi = normalized.linkwrap;
  var html = Zotero.Cite.makeFormattedBibliographyOrCitationList(cslEngine, items, "html", normalized.mode === "citation");
  return {
    zoteroItemKeys: items.map(function (item) { return item.key; }),
    style: normalized.style,
    locale: normalized.locale,
    mode: normalized.mode,
    format: "html",
    html: html
  };
}

function normalizeAdvancedSearchInput(input) {
  if (!input || typeof input !== "object") {
    input = {};
  }
  return {
    conditions: normalizeSearchConditions(input.conditions || []),
    joinMode: normalizeJoinMode(input.joinMode),
    includeChildren: input.includeChildren === true,
    includeDeleted: input.includeDeleted === true,
    limit: normalizeBoundedInteger(input.limit === undefined ? 25 : input.limit, 1, 50, "search.advanced limit", "SEARCH_ADVANCED_LIMIT_INVALID")
  };
}

function normalizeSavedSearchCreateInput(input) {
  if (!input || typeof input !== "object") {
    throw commandError("COMMAND_INPUT_INVALID", "savedSearch.create input must be an object", 400);
  }
  var name = normalizeRequiredString(input.name, "name");
  return {
    name: name,
    conditions: normalizeSearchConditions(input.conditions || []),
    joinMode: normalizeJoinMode(input.joinMode)
  };
}

function normalizeSavedSearchUpdateInput(input) {
  if (!input || typeof input !== "object") {
    throw commandError("COMMAND_INPUT_INVALID", "savedSearch.update input must be an object", 400);
  }
  var search = normalizeSavedSearchTarget(input.savedSearchKey);
  var normalized = {
    savedSearchKey: search.key,
    search: search,
    name: normalizeOptionalString(input.name, "name"),
    joinMode: normalizeJoinMode(input.joinMode)
  };
  if (Object.prototype.hasOwnProperty.call(input, "conditions")) {
    normalized.conditions = normalizeSearchConditions(input.conditions || []);
  }
  if (!normalized.name && !normalized.conditions) {
    throw commandError("SAVED_SEARCH_UPDATE_EMPTY", "savedSearch.update requires name or conditions", 400);
  }
  return normalized;
}

function normalizeCitationFormatInput(input) {
  if (!input || typeof input !== "object") {
    throw commandError("COMMAND_INPUT_INVALID", "citation.format input must be an object", 400);
  }
  var zoteroItemKeys = normalizeCitationItemKeys(input.zoteroItemKeys || []);
  if (zoteroItemKeys.length === 0) {
    throw commandError("CITATION_ITEM_KEYS_REQUIRED", "citation.format requires zoteroItemKeys", 400);
  }
  var mode = input.mode || "bibliography";
  if (mode !== "bibliography" && mode !== "citation") {
    throw commandError("CITATION_MODE_INVALID", "citation.format mode must be bibliography or citation", 400);
  }
  return {
    zoteroItemKeys: zoteroItemKeys,
    style: normalizeOptionalString(input.style, "style") || "chicago-shortened-notes-bibliography",
    locale: normalizeOptionalString(input.locale, "locale") || "en-US",
    mode: mode,
    linkwrap: input.linkwrap === true
  };
}

function normalizeSearchConditions(conditions) {
  if (!Array.isArray(conditions)) {
    throw commandError("SEARCH_CONDITIONS_INVALID", "conditions must be an array", 400);
  }
  if (conditions.length > 50) {
    throw commandError("BATCH_LIMIT_EXCEEDED", "Search conditions exceed limit 50", 400);
  }
  return conditions.map(function (condition) {
    if (!condition || typeof condition !== "object") {
      throw commandError("SEARCH_CONDITION_INVALID", "Each search condition must be an object", 400);
    }
    return {
      condition: normalizeRequiredString(condition.condition, "condition"),
      operator: normalizeRequiredString(condition.operator, "operator"),
      value: condition.value === undefined || condition.value === null ? undefined : String(condition.value)
    };
  });
}

function normalizeJoinMode(joinMode) {
  if (joinMode === undefined || joinMode === null || joinMode === "") {
    return "all";
  }
  if (joinMode !== "all" && joinMode !== "any") {
    throw commandError("SEARCH_JOIN_MODE_INVALID", "joinMode must be all or any", 400);
  }
  return joinMode;
}

function normalizeRequiredString(value, fieldName) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw commandError("COMMAND_INPUT_INVALID", fieldName + " must be a non-empty string", 400);
  }
  return value.trim();
}

function normalizeBoundedInteger(value, min, max, label, errorCode) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw commandError(errorCode || "INTEGER_LIMIT_INVALID", label + " must be an integer from " + min + " to " + max, 400);
  }
  return value;
}

function normalizeCitationItemKeys(value) {
  if (!Array.isArray(value)) {
    throw commandError("CITATION_ITEM_KEYS_INVALID", "zoteroItemKeys must be an array", 400);
  }
  if (value.length > 50) {
    throw commandError("BATCH_LIMIT_EXCEEDED", "Batch size " + value.length + " exceeds limit 50", 400);
  }
  var itemKeys = [];
  for (var i = 0; i < value.length; i += 1) {
    if (typeof value[i] !== "string" || value[i].trim().length === 0) {
      throw commandError("ZOTERO_ITEM_KEY_INVALID", "zoteroItemKeys must contain non-empty strings", 400);
    }
    itemKeys.push(getLocalUserItem(value[i].trim()).key);
  }
  return itemKeys;
}

function buildZoteroSearch(normalized) {
  var search = new Zotero.Search();
  search.libraryID = Zotero.Libraries.userLibraryID;
  if (normalized.includeChildren) {
    search.addCondition("includeChildren", "true");
  } else {
    search.addCondition("noChildren", "true");
  }
  if (normalized.includeDeleted) {
    search.addCondition("includeDeleted", "true");
  }
  applySearchConditions(search, normalized);
  return search;
}

function applySearchConditions(search, normalized) {
  if (normalized.joinMode === "any") {
    search.addCondition("joinMode", "any");
  }
  normalized.conditions.forEach(function (condition) {
    search.addCondition(condition.condition, condition.operator, condition.value);
  });
}

function normalizeSavedSearchTarget(savedSearchKey) {
  if (typeof savedSearchKey !== "string" || savedSearchKey.trim().length === 0) {
    throw commandError("SAVED_SEARCH_KEY_REQUIRED", "A savedSearchKey is required", 400);
  }
  var search = Zotero.Searches.getByLibraryAndKey(Zotero.Libraries.userLibraryID, savedSearchKey.trim());
  if (!search) {
    throw commandError("SAVED_SEARCH_NOT_FOUND", "Saved search was not found in local user library", 404);
  }
  return search;
}

function savedSearchRecord(search) {
  return {
    savedSearchKey: search.key,
    name: search.name,
    conditions: searchConditionsRecord(search)
  };
}

function searchConditionsRecord(search) {
  return Object.keys(search.conditions || {}).map(function (conditionKey) {
    var condition = search.conditions[conditionKey];
    return {
      condition: condition.condition,
      operator: condition.operator,
      value: condition.value
    };
  });
}

function resolveCitationStyle(styleIDOrURL) {
  var style = Zotero.Styles.get(styleIDOrURL);
  if (!style && styleIDOrURL.indexOf(":") === -1) {
    style = Zotero.Styles.get("http://www.zotero.org/styles/" + styleIDOrURL);
  }
  if (!style) {
    throw commandError("CITATION_STYLE_NOT_FOUND", "Citation style is not installed locally: " + styleIDOrURL, 400);
  }
  return style;
}

async function findDuplicateItems(input) {
  var limit = normalizeBoundedInteger(input && input.limit !== undefined ? input.limit : 20, 1, 100, "duplicates.find limit", "DUPLICATES_FIND_LIMIT_INVALID");
  var duplicates = new Zotero.Duplicates(Zotero.Libraries.userLibraryID);
  var search = await duplicates.getSearchObject();
  var itemIDs = await search.search();
  var seenSets = {};
  var sets = [];

  for (var i = 0; i < itemIDs.length && sets.length < limit; i += 1) {
    var setIDs = duplicates.getSetItemsByItemID(itemIDs[i]).sort(function (a, b) {
      return a - b;
    });
    if (setIDs.length < 2) {
      continue;
    }
    var setKey = setIDs.join(",");
    if (seenSets[setKey]) {
      continue;
    }
    seenSets[setKey] = true;
    var items = [];
    var keys = [];
    for (var j = 0; j < setIDs.length; j += 1) {
      var item = Zotero.Items.get(setIDs[j]);
      if (item && item.libraryID === Zotero.Libraries.userLibraryID && item.key && !(item.isInTrash && item.isInTrash())) {
        keys.push(item.key);
        items.push(itemSummaryRecord(item));
      }
    }
    if (keys.length >= 2) {
      sets.push({
        setId: "duplicate_set_" + sets.length,
        zoteroItemKeys: keys,
        items: items
      });
    }
  }

  return {
    limit: limit,
    setCount: sets.length,
    sets: sets
  };
}

async function createDuplicatesMergeDryRun(input) {
  var normalized = await normalizeDuplicatesMergeInput(input);
  return createWriteDryRunPlan(
    "duplicates.merge",
    stripRuntimeFields(normalized),
    {
      zoteroItemKeys: [normalized.masterZoteroItemKey].concat(normalized.duplicateZoteroItemKeys),
      collectionKeys: normalized.affectedCollectionKeys,
      attachmentKeys: normalized.affectedAttachmentKeys,
      filePaths: [],
      tags: normalized.affectedTags
    },
    [{
      code: "DUPLICATES_MERGE_HIGH_RISK",
      message: "Zotero will merge duplicate metadata, move notes/attachments/tags/collections to the master item, and move duplicate items to trash"
    }],
    {
      master: normalized.master,
      duplicates: normalized.duplicates,
      fieldConflicts: normalized.fieldConflicts
    },
    {
      action: "merge",
      masterZoteroItemKey: normalized.masterZoteroItemKey,
      mergedZoteroItemKeys: normalized.duplicateZoteroItemKeys,
      restoration: "Restore merged duplicate items from Zotero trash when possible; metadata conflict choices are not automatically reversible by this bridge"
    },
    "high"
  );
}

async function executeDuplicatesMerge(input, confirmation) {
  assertConfirmationPresent(confirmation);
  var normalized = await normalizeDuplicatesMergeInput(input);
  validateStoredConfirmation(stripRuntimeFields(normalized), confirmation);

  var master = getLocalUserItem(normalized.masterZoteroItemKey);
  var duplicateItems = normalized.duplicateZoteroItemKeys.map(function (itemKey) {
    return getLocalUserItem(itemKey);
  });
  await Zotero.Items.merge(master, duplicateItems);
  var mergedRecord = readItemDetails({ zoteroItemKey: normalized.masterZoteroItemKey });

  return {
    masterZoteroItemKey: normalized.masterZoteroItemKey,
    mergedZoteroItemKeys: normalized.duplicateZoteroItemKeys,
    attachmentKeys: uniqueStrings((mergedRecord.attachmentKeys || []).concat(normalized.affectedAttachmentKeys)),
    collectionKeys: uniqueStrings((mergedRecord.collectionKeys || []).concat(normalized.affectedCollectionKeys)),
    tags: uniqueStrings((mergedRecord.tags || []).concat(normalized.affectedTags)),
    master: mergedRecord,
    trashedDuplicateItems: true,
    erased: false
  };
}

async function normalizeDuplicatesMergeInput(input) {
  if (!input || typeof input !== "object") {
    throw commandError("COMMAND_INPUT_INVALID", "duplicates.merge input must be an object", 400);
  }

  var master = normalizeItemTarget(input.masterZoteroItemKey);
  if (!master.isRegularItem || !master.isRegularItem()) {
    throw commandError("DUPLICATES_MASTER_INVALID", "duplicates.merge master must be a regular Zotero item", 400);
  }
  if (master.isInTrash && master.isInTrash()) {
    throw commandError("DUPLICATES_MASTER_TRASHED", "duplicates.merge master is already in Zotero trash", 409);
  }

  var duplicateKeys = normalizeStringArray(input.duplicateZoteroItemKeys, "duplicateZoteroItemKeys", "DUPLICATE_ITEM_KEYS_REQUIRED");
  var seen = {};
  var duplicateItems = [];
  for (var i = 0; i < duplicateKeys.length; i += 1) {
    var item = normalizeItemTarget(duplicateKeys[i]);
    if (item.key === master.key) {
      throw commandError("DUPLICATES_MERGE_SELF", "duplicateZoteroItemKeys must not include the master item", 400);
    }
    if (seen[item.key]) {
      continue;
    }
    if (!item.isRegularItem || !item.isRegularItem()) {
      throw commandError("DUPLICATES_ITEM_INVALID", "duplicates.merge only supports regular Zotero items", 400);
    }
    if (item.libraryID !== master.libraryID) {
      throw commandError("DUPLICATES_LIBRARY_MISMATCH", "All duplicate items must be in the same library", 400);
    }
    if (item.isInTrash && item.isInTrash()) {
      throw commandError("DUPLICATES_ITEM_TRASHED", "Duplicate item is already in Zotero trash: " + item.key, 409);
    }
    seen[item.key] = true;
    duplicateItems.push(item);
  }

  if (duplicateItems.length === 0) {
    throw commandError("DUPLICATE_ITEM_KEYS_REQUIRED", "duplicates.merge requires at least one duplicate item", 400);
  }
  if (duplicateItems.length + 1 > 50) {
    throw commandError("BATCH_LIMIT_EXCEEDED", "duplicates.merge item count exceeds limit 50", 400);
  }

  return {
    masterZoteroItemKey: master.key,
    duplicateZoteroItemKeys: duplicateItems.map(function (item) { return item.key; }),
    master: itemSummaryRecord(master),
    duplicates: duplicateItems.map(function (item) { return itemSummaryRecord(item); }),
    fieldConflicts: duplicateFieldConflicts(master, duplicateItems),
    affectedAttachmentKeys: duplicateItems.reduce(function (keys, item) {
      return keys.concat(item.getAttachments(true).map(function (attachmentID) {
        var attachment = Zotero.Items.get(attachmentID);
        return attachment && attachment.key ? attachment.key : undefined;
      }).filter(Boolean));
    }, []),
    affectedCollectionKeys: uniqueStrings(master.getCollections().concat(duplicateItems.reduce(function (keys, item) {
      return keys.concat(item.getCollections());
    }, [])).map(function (collectionID) {
      var collection = Zotero.Collections.get(collectionID);
      return collection && collection.key ? collection.key : undefined;
    }).filter(Boolean)),
    affectedTags: uniqueStrings(master.getTags().concat(duplicateItems.reduce(function (tags, item) {
      return tags.concat(item.getTags());
    }, [])).map(function (tag) {
      return tag.tag;
    }).filter(Boolean))
  };
}

function duplicateFieldConflicts(master, duplicateItems) {
  var fields = ["title", "date", "DOI", "url", "publicationTitle", "publisher", "ISBN", "ISSN"];
  var conflicts = [];
  fields.forEach(function (fieldName) {
    var values = {};
    var masterValue = getItemFieldValue(master, fieldName);
    if (masterValue) {
      values[master.key] = masterValue;
    }
    duplicateItems.forEach(function (item) {
      var value = getItemFieldValue(item, fieldName);
      if (value) {
        values[item.key] = value;
      }
    });
    if (uniqueStrings(Object.keys(values).map(function (key) { return values[key]; })).length > 1) {
      conflicts.push({
        fieldName: fieldName,
        valuesByZoteroItemKey: values
      });
    }
  });
  return conflicts;
}

function getItemFieldValue(item, fieldName) {
  try {
    var value = item.getField(fieldName);
    return typeof value === "string" ? value.trim() : "";
  } catch (error) {
    return "";
  }
}

function createCollectionCreateDryRun(input) {
  var normalized = normalizeCollectionCreateInput(input);
  var resolvedTargets = {
    zoteroItemKeys: [],
    collectionKeys: normalized.parentCollectionKey ? [normalized.parentCollectionKey] : [],
    attachmentKeys: [],
    filePaths: [],
    tags: []
  };

  return createWriteDryRunPlan("collection.create", normalized, resolvedTargets, [], undefined, {
    name: normalized.name,
    parentCollectionKey: normalized.parentCollectionKey || false
  });
}

function createWriteDryRunPlan(operation, normalizedInput, resolvedTargets, warnings, before, after, riskLevel) {
  var resolvedRiskLevel = riskLevel || "low";
  var operationMode = getBridgeOperationMode();
  var inputHash = hashInput(normalizedInput);
  var expiresAt = new Date(Date.now() + ZoteroLocalMcpBridge.dryRunTtlMs).toISOString();
  var planId = "plan_" + randomId();
  var confirmationToken = "confirm_" + randomId();

  ZoteroLocalMcpBridge.confirmations[planId] = {
    inputHash: inputHash,
    confirmationToken: confirmationToken,
    expiresAt: expiresAt
  };

  return {
    mode: "dry-run",
    plan: {
      planId: planId,
      operation: operation,
      riskLevel: resolvedRiskLevel,
      inputHash: inputHash,
      resolvedTargets: resolvedTargets,
      warnings: warnings || [],
      requiresBackup: true,
      expiresAt: expiresAt,
      agentApproval: createAgentApprovalPolicy(operationMode, operation, resolvedRiskLevel),
      confirmation: {
        token: confirmationToken,
        expiresAt: expiresAt
      }
    },
    before: before,
    after: after
  };
}

function createAgentApprovalPolicy(operationMode, operation, riskLevel) {
  var requiresUserApproval = operationMode === "askforapprove";
  var requiredText = null;

  if (requiresUserApproval && riskLevel === "high") {
    requiredText = "CONFIRM";
  }

  if (riskLevel === "critical") {
    requiresUserApproval = true;
    requiredText = operation;
  }

  return {
    layer: "agent",
    operationMode: operationMode,
    required: requiresUserApproval,
    requiredText: requiredText,
    mayAutoExecute: !requiresUserApproval,
    reason: requiresUserApproval
      ? "Agent must ask the user before execute and pass the returned planId and confirmationToken unchanged."
      : "Agent may continue to execute after dry-run according to its own policy, but execute still requires planId and confirmationToken."
  };
}

async function executeCollectionCreate(input, confirmation) {
  assertConfirmationPresent(confirmation);
  var normalized = normalizeCollectionCreateInput(input);
  validateStoredConfirmation(normalized, confirmation);

  var collection = new Zotero.Collection();
  collection.libraryID = Zotero.Libraries.userLibraryID;
  collection.name = normalized.name;
  if (normalized.parentCollectionKey) {
    collection.parentKey = normalized.parentCollectionKey;
  }

  await collection.saveTx();

  return {
    collectionKey: collection.key,
    name: collection.name,
    parentCollectionKey: collection.parentKey || undefined
  };
}

function normalizeCollectionCreateInput(input) {
  if (!input || typeof input !== "object") {
    throw commandError("COMMAND_INPUT_INVALID", "collection.create input must be an object", 400);
  }

  if (input.libraryScope !== "local-user") {
    throw commandError("LIBRARY_SCOPE_UNSUPPORTED", "collection.create only supports local-user libraryScope", 400);
  }

  if (typeof input.name !== "string" || input.name.trim().length === 0) {
    throw commandError("COLLECTION_NAME_REQUIRED", "collection.create requires a non-empty name", 400);
  }

  var normalized = {
    libraryScope: "local-user",
    name: input.name.trim()
  };

  if (input.parentCollectionKey !== undefined) {
    if (typeof input.parentCollectionKey !== "string" || input.parentCollectionKey.trim().length === 0) {
      throw commandError("PARENT_COLLECTION_KEY_INVALID", "parentCollectionKey must be a non-empty string", 400);
    }

    var parentKey = input.parentCollectionKey.trim();
    var parent = Zotero.Collections.getByLibraryAndKey(Zotero.Libraries.userLibraryID, parentKey);
    if (!parent) {
      throw commandError("PARENT_COLLECTION_NOT_FOUND", "Parent collection was not found in local user library", 404);
    }

    normalized.parentCollectionKey = parentKey;
  }

  return normalized;
}

function createCollectionRenameDryRun(input) {
  var normalized = normalizeCollectionRenameInput(input);
  return createWriteDryRunPlan(
    "collection.rename",
    stripRuntimeFields(normalized),
    {
      zoteroItemKeys: [],
      collectionKeys: [normalized.collectionKey],
      attachmentKeys: [],
      filePaths: [],
      tags: []
    },
    [],
    { name: normalized.currentName },
    { name: normalized.name }
  );
}

async function executeCollectionRename(input, confirmation) {
  assertConfirmationPresent(confirmation);
  var normalized = normalizeCollectionRenameInput(input);
  validateStoredConfirmation(stripRuntimeFields(normalized), confirmation);

  var collection = getLocalUserCollection(normalized.collectionKey);
  collection.name = normalized.name;
  await collection.saveTx();

  return collectionRecord(collection);
}

function normalizeCollectionRenameInput(input) {
  if (!input || typeof input !== "object") {
    throw commandError("COMMAND_INPUT_INVALID", "collection.rename input must be an object", 400);
  }

  var collection = normalizeCollectionTarget(input.collectionKey);
  if (typeof input.name !== "string" || input.name.trim().length === 0) {
    throw commandError("COLLECTION_NAME_REQUIRED", "collection.rename requires a non-empty name", 400);
  }

  return {
    collectionKey: collection.key,
    name: input.name.trim(),
    currentName: collection.name
  };
}

function createCollectionMoveDryRun(input) {
  var normalized = normalizeCollectionMoveInput(input);
  return createWriteDryRunPlan(
    "collection.move",
    stripRuntimeFields(normalized),
    {
      zoteroItemKeys: [],
      collectionKeys: normalized.parentCollectionKey
        ? [normalized.collectionKey, normalized.parentCollectionKey]
        : [normalized.collectionKey],
      attachmentKeys: [],
      filePaths: [],
      tags: []
    },
    [],
    { parentCollectionKey: normalized.currentParentCollectionKey || false },
    { parentCollectionKey: normalized.parentCollectionKey || false }
  );
}

async function executeCollectionMove(input, confirmation) {
  assertConfirmationPresent(confirmation);
  var normalized = normalizeCollectionMoveInput(input);
  validateStoredConfirmation(stripRuntimeFields(normalized), confirmation);

  var collection = getLocalUserCollection(normalized.collectionKey);
  collection.parentKey = normalized.parentCollectionKey || false;
  await collection.saveTx();

  return collectionRecord(collection);
}

function normalizeCollectionMoveInput(input) {
  if (!input || typeof input !== "object") {
    throw commandError("COMMAND_INPUT_INVALID", "collection.move input must be an object", 400);
  }

  var collection = normalizeCollectionTarget(input.collectionKey);
  var normalized = {
    collectionKey: collection.key,
    currentParentCollectionKey: collection.parentKey || undefined
  };

  if (input.parentCollectionKey !== undefined && input.parentCollectionKey !== null) {
    if (typeof input.parentCollectionKey !== "string" || input.parentCollectionKey.trim().length === 0) {
      throw commandError("PARENT_COLLECTION_KEY_INVALID", "parentCollectionKey must be a non-empty string", 400);
    }

    var parentKey = input.parentCollectionKey.trim();
    if (parentKey === collection.key) {
      throw commandError("PARENT_COLLECTION_INVALID", "A collection cannot be moved under itself", 400);
    }

    var parent = Zotero.Collections.getByLibraryAndKey(Zotero.Libraries.userLibraryID, parentKey);
    if (!parent) {
      throw commandError("PARENT_COLLECTION_NOT_FOUND", "Parent collection was not found in local user library", 404);
    }

    normalized.parentCollectionKey = parentKey;
  }

  return normalized;
}

function createCollectionAddItemsDryRun(input) {
  var normalized = normalizeCollectionItemMembershipInput(input, "collection.addItems");
  return createWriteDryRunPlan(
    "collection.addItems",
    stripRuntimeFields(normalized),
    {
      zoteroItemKeys: normalized.zoteroItemKeys,
      collectionKeys: [normalized.collectionKey],
      attachmentKeys: [],
      filePaths: [],
      tags: []
    },
    [],
    { existingItemKeys: normalized.existingItemKeys },
    { addedItemKeys: normalized.toChangeItemKeys }
  );
}

async function executeCollectionAddItems(input, confirmation) {
  assertConfirmationPresent(confirmation);
  var normalized = normalizeCollectionItemMembershipInput(input, "collection.addItems");
  validateStoredConfirmation(stripRuntimeFields(normalized), confirmation);

  var collection = getLocalUserCollection(normalized.collectionKey);
  var addedItemKeys = [];
  for (var i = 0; i < normalized.zoteroItemKeys.length; i += 1) {
    var item = getLocalUserItem(normalized.zoteroItemKeys[i]);
    if (item.inCollection(collection.id)) {
      continue;
    }
    item.addToCollection(collection.id);
    await item.saveTx({ skipDateModifiedUpdate: true });
    addedItemKeys.push(item.key);
  }

  return {
    collectionKey: collection.key,
    addedItemKeys: addedItemKeys
  };
}

function createCollectionRemoveItemsDryRun(input) {
  var normalized = normalizeCollectionItemMembershipInput(input, "collection.removeItems");
  return createWriteDryRunPlan(
    "collection.removeItems",
    stripRuntimeFields(normalized),
    {
      zoteroItemKeys: normalized.zoteroItemKeys,
      collectionKeys: [normalized.collectionKey],
      attachmentKeys: [],
      filePaths: [],
      tags: []
    },
    [],
    { existingItemKeys: normalized.existingItemKeys },
    { removedItemKeys: normalized.toChangeItemKeys }
  );
}

async function executeCollectionRemoveItems(input, confirmation) {
  assertConfirmationPresent(confirmation);
  var normalized = normalizeCollectionItemMembershipInput(input, "collection.removeItems");
  validateStoredConfirmation(stripRuntimeFields(normalized), confirmation);

  var collection = getLocalUserCollection(normalized.collectionKey);
  var removedItemKeys = [];
  for (var i = 0; i < normalized.zoteroItemKeys.length; i += 1) {
    var item = getLocalUserItem(normalized.zoteroItemKeys[i]);
    if (!item.inCollection(collection.id)) {
      continue;
    }
    item.removeFromCollection(collection.id);
    await item.saveTx({ skipDateModifiedUpdate: true });
    removedItemKeys.push(item.key);
  }

  return {
    collectionKey: collection.key,
    removedItemKeys: removedItemKeys
  };
}

function normalizeCollectionItemMembershipInput(input, operation) {
  if (!input || typeof input !== "object") {
    throw commandError("COMMAND_INPUT_INVALID", operation + " input must be an object", 400);
  }

  var collection = normalizeCollectionTarget(input.collectionKey);
  if (!Array.isArray(input.zoteroItemKeys) || input.zoteroItemKeys.length === 0) {
    throw commandError("ZOTERO_ITEM_KEYS_REQUIRED", operation + " requires a non-empty zoteroItemKeys array", 400);
  }

  if (input.zoteroItemKeys.length > 50) {
    throw commandError("BATCH_LIMIT_EXCEEDED", "Batch size " + input.zoteroItemKeys.length + " exceeds limit 50", 400);
  }

  var itemKeys = [];
  var existingItemKeys = [];
  var toChangeItemKeys = [];
  for (var i = 0; i < input.zoteroItemKeys.length; i += 1) {
    var itemKey = input.zoteroItemKeys[i];
    if (typeof itemKey !== "string" || itemKey.trim().length === 0) {
      throw commandError("ZOTERO_ITEM_KEY_INVALID", "zoteroItemKeys must contain non-empty strings", 400);
    }

    var item = getLocalUserItem(itemKey.trim());
    itemKeys.push(item.key);
    if (item.inCollection(collection.id)) {
      existingItemKeys.push(item.key);
      if (operation === "collection.removeItems") {
        toChangeItemKeys.push(item.key);
      }
    } else if (operation === "collection.addItems") {
      toChangeItemKeys.push(item.key);
    }
  }

  return {
    collectionKey: collection.key,
    zoteroItemKeys: itemKeys,
    existingItemKeys: existingItemKeys,
    toChangeItemKeys: toChangeItemKeys
  };
}

function createCollectionTrashDryRun(input) {
  var normalized = normalizeCollectionTrashInput(input);
  return createWriteDryRunPlan(
    "collection.trash",
    stripRuntimeFields(normalized),
    {
      zoteroItemKeys: normalized.trashDescendentItems ? normalized.descendentItemKeys : [],
      collectionKeys: [normalized.collectionKey].concat(normalized.descendentCollectionKeys),
      attachmentKeys: [],
      filePaths: [],
      tags: []
    },
    [{
      code: normalized.trashDescendentItems ? "COLLECTION_TRASH_WITH_ITEMS" : "COLLECTION_TRASH_COLLECTIONS_ONLY",
      message: normalized.trashDescendentItems
        ? "Collection and descendant items will be moved to Zotero trash; no permanent erase is performed"
        : "Collection and descendant collections will be moved to Zotero trash; contained items are not trashed"
    }],
    {
      collectionKey: normalized.collectionKey,
      name: normalized.currentName,
      parentCollectionKey: normalized.currentParentCollectionKey,
      descendentCollectionKeys: normalized.descendentCollectionKeys,
      descendentItemKeys: normalized.descendentItemKeys
    },
    {
      action: "trash",
      trashDescendentItems: normalized.trashDescendentItems,
      collectionKeys: [normalized.collectionKey].concat(normalized.descendentCollectionKeys),
      trashedDescendentItemKeys: normalized.trashDescendentItems ? normalized.descendentItemKeys : []
    },
    "high"
  );
}

async function executeCollectionTrash(input, confirmation) {
  assertConfirmationPresent(confirmation);
  var normalized = normalizeCollectionTrashInput(input);
  validateStoredConfirmation(stripRuntimeFields(normalized), confirmation);

  var collection = getLocalUserCollection(normalized.collectionKey);
  collection.deleted = true;
  await collection.saveTx({
    deleteItems: normalized.trashDescendentItems
  });

  return {
    collectionKey: normalized.collectionKey,
    collectionKeys: [normalized.collectionKey].concat(normalized.descendentCollectionKeys),
    trashedDescendentItemKeys: normalized.trashDescendentItems ? normalized.descendentItemKeys : [],
    trashed: true,
    erased: false,
    trashDescendentItems: normalized.trashDescendentItems
  };
}

function normalizeCollectionTrashInput(input) {
  if (!input || typeof input !== "object") {
    throw commandError("COMMAND_INPUT_INVALID", "collection.trash input must be an object", 400);
  }

  var collection = normalizeCollectionTarget(input.collectionKey);
  if (collection.deleted) {
    throw commandError("COLLECTION_ALREADY_TRASHED", "Collection is already in Zotero trash", 409);
  }

  var descendentCollectionKeys = [];
  var descendentItemKeys = [];
  var descendents = collection.getDescendents(false, null, false);
  for (var i = 0; i < descendents.length; i += 1) {
    if (descendents[i].type === "collection") {
      var childCollection = Zotero.Collections.get(descendents[i].id);
      if (childCollection && childCollection.key) {
        descendentCollectionKeys.push(childCollection.key);
      }
    } else {
      var childItem = Zotero.Items.get(descendents[i].id);
      if (childItem && childItem.key && !(childItem.isInTrash && childItem.isInTrash())) {
        descendentItemKeys.push(childItem.key);
      }
    }
  }

  return {
    collectionKey: collection.key,
    trashDescendentItems: input.trashDescendentItems === true,
    currentName: collection.name,
    currentParentCollectionKey: collection.parentKey || undefined,
    descendentCollectionKeys: uniqueStrings(descendentCollectionKeys),
    descendentItemKeys: uniqueStrings(descendentItemKeys)
  };
}

function createItemCreateDryRun(input) {
  var normalized = normalizeItemCreateInput(input);
  return createWriteDryRunPlan(
    "item.create",
    stripRuntimeFields(normalized),
    {
      zoteroItemKeys: [],
      collectionKeys: normalized.collectionKeys,
      attachmentKeys: [],
      filePaths: [],
      tags: normalized.tags
    },
    [],
    { item: null },
    {
      itemType: normalized.itemType,
      fields: normalized.fields,
      creators: normalized.creators,
      collectionKeys: normalized.collectionKeys,
      tags: normalized.tags
    }
  );
}

async function executeItemCreate(input, confirmation) {
  assertConfirmationPresent(confirmation);
  var normalized = normalizeItemCreateInput(input);
  validateStoredConfirmation(stripRuntimeFields(normalized), confirmation);

  var item = new Zotero.Item(normalized.itemType);
  item.libraryID = Zotero.Libraries.userLibraryID;
  applyItemFields(item, normalized.fields);
  applyItemCreators(item, normalized.creators);
  item.setCollections(normalized.collectionKeys);
  for (var i = 0; i < normalized.tags.length; i += 1) {
    item.addTag(normalized.tags[i]);
  }
  await item.saveTx();

  return readItemDetails({ zoteroItemKey: item.key });
}

function createItemUpdateFieldsDryRun(input) {
  var normalized = normalizeItemUpdateFieldsInput(input);
  return createWriteDryRunPlan(
    "item.updateFields",
    stripRuntimeFields(normalized),
    {
      zoteroItemKeys: [normalized.zoteroItemKey],
      collectionKeys: [],
      attachmentKeys: [],
      filePaths: [],
      tags: []
    },
    [],
    { fields: normalized.currentFields },
    { fields: normalized.fields }
  );
}

async function executeItemUpdateFields(input, confirmation) {
  assertConfirmationPresent(confirmation);
  var normalized = normalizeItemUpdateFieldsInput(input);
  validateStoredConfirmation(stripRuntimeFields(normalized), confirmation);

  var item = getLocalUserItem(normalized.zoteroItemKey);
  applyItemFields(item, normalized.fields);
  await item.saveTx();

  return readItemDetails({ zoteroItemKey: item.key });
}

function createItemUpdateCreatorsDryRun(input) {
  var normalized = normalizeItemUpdateCreatorsInput(input);
  return createWriteDryRunPlan(
    "item.updateCreators",
    stripRuntimeFields(normalized),
    {
      zoteroItemKeys: [normalized.zoteroItemKey],
      collectionKeys: [],
      attachmentKeys: [],
      filePaths: [],
      tags: []
    },
    [],
    { creators: normalized.currentCreators },
    { creators: normalized.creators }
  );
}

async function executeItemUpdateCreators(input, confirmation) {
  assertConfirmationPresent(confirmation);
  var normalized = normalizeItemUpdateCreatorsInput(input);
  validateStoredConfirmation(stripRuntimeFields(normalized), confirmation);

  var item = getLocalUserItem(normalized.zoteroItemKey);
  applyItemCreators(item, normalized.creators);
  await item.saveTx();

  return readItemDetails({ zoteroItemKey: item.key });
}

function createItemSetCollectionsDryRun(input) {
  var normalized = normalizeItemSetCollectionsInput(input);
  return createWriteDryRunPlan(
    "item.setCollections",
    stripRuntimeFields(normalized),
    {
      zoteroItemKeys: [normalized.zoteroItemKey],
      collectionKeys: normalized.collectionKeys,
      attachmentKeys: [],
      filePaths: [],
      tags: []
    },
    [],
    { collectionKeys: normalized.currentCollectionKeys },
    {
      collectionKeys: normalized.collectionKeys,
      addedCollectionKeys: normalized.collectionKeysToAdd,
      removedCollectionKeys: normalized.collectionKeysToRemove
    }
  );
}

async function executeItemSetCollections(input, confirmation) {
  assertConfirmationPresent(confirmation);
  var normalized = normalizeItemSetCollectionsInput(input);
  validateStoredConfirmation(stripRuntimeFields(normalized), confirmation);

  var item = getLocalUserItem(normalized.zoteroItemKey);
  item.setCollections(normalized.collectionKeys);
  await item.saveTx({ skipDateModifiedUpdate: true });

  return readItemDetails({ zoteroItemKey: item.key });
}

function normalizeItemCreateInput(input) {
  if (!input || typeof input !== "object") {
    throw commandError("COMMAND_INPUT_INVALID", "item.create input must be an object", 400);
  }

  if (input.libraryScope !== "local-user") {
    throw commandError("LIBRARY_SCOPE_UNSUPPORTED", "Only libraryScope local-user is supported", 400);
  }

  var itemType = normalizeItemType(input.itemType);
  var item = new Zotero.Item(itemType);
  item.libraryID = Zotero.Libraries.userLibraryID;
  var fields = normalizeItemFieldMap(input.fields || {}, item, "item.create");
  var creators = normalizeCreatorArray(input.creators || [], "creators");
  var collectionKeys = normalizeCollectionKeyArray(input.collectionKeys || [], "collectionKeys");
  var tags = normalizeTagArray(input.tags || [], "tags");
  if (collectionKeys.length + tags.length + creators.length > 50) {
    throw commandError("BATCH_LIMIT_EXCEEDED", "item.create related object count exceeds limit 50", 400);
  }

  return {
    libraryScope: "local-user",
    itemType: itemType,
    fields: fields,
    creators: creators,
    collectionKeys: collectionKeys,
    tags: tags
  };
}

function normalizeItemUpdateFieldsInput(input) {
  if (!input || typeof input !== "object") {
    throw commandError("COMMAND_INPUT_INVALID", "item.updateFields input must be an object", 400);
  }

  var item = normalizeItemTarget(input.zoteroItemKey);
  var fields = normalizeItemFieldMap(input.fields, item, "item.updateFields");
  if (Object.keys(fields).length === 0) {
    throw commandError("ITEM_FIELDS_REQUIRED", "item.updateFields requires at least one field", 400);
  }

  return {
    zoteroItemKey: item.key,
    fields: fields,
    currentFields: readItemFieldSnapshot(item, Object.keys(fields))
  };
}

function normalizeItemUpdateCreatorsInput(input) {
  if (!input || typeof input !== "object") {
    throw commandError("COMMAND_INPUT_INVALID", "item.updateCreators input must be an object", 400);
  }

  var item = normalizeItemTarget(input.zoteroItemKey);
  var creators = normalizeCreatorArray(input.creators, "creators");
  return {
    zoteroItemKey: item.key,
    creators: creators,
    currentCreators: item.getCreatorsJSON ? item.getCreatorsJSON() : []
  };
}

function normalizeItemSetCollectionsInput(input) {
  if (!input || typeof input !== "object") {
    throw commandError("COMMAND_INPUT_INVALID", "item.setCollections input must be an object", 400);
  }

  var item = normalizeItemTarget(input.zoteroItemKey);
  var collectionKeys = normalizeCollectionKeyArray(input.collectionKeys, "collectionKeys");
  var currentCollectionKeys = readItemCollectionKeys(item);
  var currentSet = objectSet(currentCollectionKeys);
  var nextSet = objectSet(collectionKeys);

  return {
    zoteroItemKey: item.key,
    collectionKeys: collectionKeys,
    currentCollectionKeys: currentCollectionKeys,
    collectionKeysToAdd: collectionKeys.filter(function (collectionKey) {
      return !currentSet[collectionKey];
    }),
    collectionKeysToRemove: currentCollectionKeys.filter(function (collectionKey) {
      return !nextSet[collectionKey];
    })
  };
}

function normalizeItemType(itemType) {
  if (typeof itemType !== "string" || itemType.trim().length === 0) {
    throw commandError("ITEM_TYPE_REQUIRED", "itemType must be a non-empty string", 400);
  }

  var normalized = itemType.trim();
  if (!Zotero.ItemTypes || !Zotero.ItemTypes.getID || !Zotero.ItemTypes.getID(normalized)) {
    throw commandError("ITEM_TYPE_UNSUPPORTED", "Zotero item type is not supported: " + normalized, 400);
  }

  return normalized;
}

function normalizeItemFieldMap(fields, item, operation) {
  if (!fields || typeof fields !== "object" || Array.isArray(fields)) {
    throw commandError("ITEM_FIELDS_INVALID", operation + " fields must be an object", 400);
  }

  var normalized = {};
  Object.keys(fields).forEach(function (fieldName) {
    if (!isEditableItemFieldName(fieldName)) {
      throw commandError("ITEM_FIELD_RESERVED", "Field cannot be edited through fields: " + fieldName, 400);
    }

    var value = fields[fieldName];
    if (!isPrimitiveItemFieldValue(value)) {
      throw commandError("ITEM_FIELD_VALUE_INVALID", "Field value must be string, number, boolean, or null: " + fieldName, 400);
    }

    assertItemFieldValidForType(item, fieldName);
    normalized[fieldName] = value === null ? "" : String(value);
  });

  return normalized;
}

function isEditableItemFieldName(fieldName) {
  var reserved = {
    key: true,
    itemKey: true,
    zoteroItemKey: true,
    itemType: true,
    creators: true,
    collections: true,
    collectionKeys: true,
    tags: true,
    attachments: true,
    notes: true,
    relations: true
  };
  return typeof fieldName === "string" && fieldName.trim().length > 0 && !reserved[fieldName];
}

function isPrimitiveItemFieldValue(value) {
  return value === null || ["string", "number", "boolean"].indexOf(typeof value) !== -1;
}

function assertItemFieldValidForType(item, fieldName) {
  if (!Zotero.ItemFields || !Zotero.ItemFields.getID || !Zotero.ItemFields.isValidForType) {
    return;
  }

  var fieldID = Zotero.ItemFields.getID(fieldName);
  if (!fieldID) {
    throw commandError("ITEM_FIELD_UNKNOWN", "Unknown Zotero item field: " + fieldName, 400);
  }

  var itemTypeID = item.itemTypeID || Zotero.ItemTypes.getID(item.itemType);
  var typeFieldID = Zotero.ItemFields.getFieldIDFromTypeAndBase
    ? Zotero.ItemFields.getFieldIDFromTypeAndBase(itemTypeID, fieldID) || fieldID
    : fieldID;
  if (!Zotero.ItemFields.isValidForType(typeFieldID, itemTypeID)) {
    throw commandError("ITEM_FIELD_UNSUPPORTED_FOR_TYPE", "Field " + fieldName + " is not valid for item type " + item.itemType, 400);
  }
}

function normalizeCreatorArray(creators, fieldName) {
  if (!Array.isArray(creators)) {
    throw commandError("ITEM_CREATORS_INVALID", fieldName + " must be an array", 400);
  }

  if (creators.length > 50) {
    throw commandError("BATCH_LIMIT_EXCEEDED", "Creator count exceeds limit 50", 400);
  }

  return creators.map(function (creator) {
    if (!creator || typeof creator !== "object" || Array.isArray(creator)) {
      throw commandError("ITEM_CREATOR_INVALID", fieldName + " must contain creator objects", 400);
    }

    if (typeof creator.creatorType !== "string" || creator.creatorType.trim().length === 0) {
      throw commandError("ITEM_CREATOR_TYPE_REQUIRED", "creatorType must be a non-empty string", 400);
    }

    var normalized = {
      creatorType: creator.creatorType.trim()
    };
    if (typeof creator.name === "string" && creator.name.trim().length > 0) {
      normalized.name = creator.name.trim();
      return normalized;
    }

    var firstName = typeof creator.firstName === "string" ? creator.firstName.trim() : "";
    var lastName = typeof creator.lastName === "string" ? creator.lastName.trim() : "";
    if (!firstName && !lastName) {
      throw commandError("ITEM_CREATOR_NAME_REQUIRED", "Creator must include name or firstName/lastName", 400);
    }

    normalized.firstName = firstName;
    normalized.lastName = lastName;
    return normalized;
  });
}

function normalizeCollectionKeyArray(value, fieldName) {
  if (!Array.isArray(value)) {
    throw commandError("COLLECTION_KEYS_INVALID", fieldName + " must be an array", 400);
  }

  if (value.length > 50) {
    throw commandError("BATCH_LIMIT_EXCEEDED", fieldName + " count exceeds limit 50", 400);
  }

  var seen = {};
  var collectionKeys = [];
  value.forEach(function (collectionKey) {
    if (typeof collectionKey !== "string" || collectionKey.trim().length === 0) {
      throw commandError("COLLECTION_KEY_INVALID", fieldName + " must contain non-empty strings", 400);
    }

    var normalized = collectionKey.trim();
    getLocalUserCollection(normalized);
    if (!seen[normalized]) {
      seen[normalized] = true;
      collectionKeys.push(normalized);
    }
  });

  return collectionKeys;
}

function applyItemFields(item, fields) {
  Object.keys(fields).forEach(function (fieldName) {
    item.setField(fieldName, fields[fieldName]);
  });
}

function applyItemCreators(item, creators) {
  item.setCreators(creators, { strict: true });
}

function readItemFieldSnapshot(item, fieldNames) {
  var snapshot = {};
  fieldNames.forEach(function (fieldName) {
    snapshot[fieldName] = item.getField ? item.getField(fieldName) : undefined;
  });
  return snapshot;
}

function readItemCollectionKeys(item) {
  return readItemDetails({ zoteroItemKey: item.key }).collectionKeys;
}

function objectSet(values) {
  var set = {};
  values.forEach(function (value) {
    set[value] = true;
  });
  return set;
}

function createItemUpdateTagsDryRun(input) {
  var normalized = normalizeItemUpdateTagsInput(input);
  return createWriteDryRunPlan(
    "item.updateTags",
    stripRuntimeFields(normalized),
    {
      zoteroItemKeys: [normalized.zoteroItemKey],
      collectionKeys: [],
      attachmentKeys: [],
      filePaths: [],
      tags: normalized.addTags.concat(normalized.removeTags)
    },
    [],
    { tags: normalized.currentTags },
    {
      addedTags: normalized.tagsToAdd,
      removedTags: normalized.tagsToRemove
    }
  );
}

async function executeItemUpdateTags(input, confirmation) {
  assertConfirmationPresent(confirmation);
  var normalized = normalizeItemUpdateTagsInput(input);
  validateStoredConfirmation(stripRuntimeFields(normalized), confirmation);

  var item = getLocalUserItem(normalized.zoteroItemKey);
  var addedTags = [];
  var removedTags = [];

  for (var i = 0; i < normalized.removeTags.length; i += 1) {
    var tagToRemove = normalized.removeTags[i];
    if (item.hasTag(tagToRemove) && item.removeTag(tagToRemove)) {
      removedTags.push(tagToRemove);
    }
  }

  for (var j = 0; j < normalized.addTags.length; j += 1) {
    var tagToAdd = normalized.addTags[j];
    if (!item.hasTag(tagToAdd) && item.addTag(tagToAdd)) {
      addedTags.push(tagToAdd);
    }
  }

  if (addedTags.length > 0 || removedTags.length > 0) {
    await item.saveTx();
  }

  return {
    zoteroItemKey: item.key,
    addedTags: addedTags,
    removedTags: removedTags,
    tags: readItemTags(item)
  };
}

function normalizeItemUpdateTagsInput(input) {
  if (!input || typeof input !== "object") {
    throw commandError("COMMAND_INPUT_INVALID", "item.updateTags input must be an object", 400);
  }

  var item = normalizeItemTarget(input.zoteroItemKey);
  var addTags = normalizeTagArray(input.addTags || [], "addTags");
  var removeTags = normalizeTagArray(input.removeTags || [], "removeTags");
  if (addTags.length === 0 && removeTags.length === 0) {
    throw commandError("TAGS_REQUIRED", "item.updateTags requires at least one tag to add or remove", 400);
  }

  if (addTags.length + removeTags.length > 50) {
    throw commandError("BATCH_LIMIT_EXCEEDED", "Tag update count exceeds limit 50", 400);
  }

  var removeTagSet = {};
  removeTags.forEach(function (tag) {
    removeTagSet[tag] = true;
  });
  addTags.forEach(function (tag) {
    if (removeTagSet[tag]) {
      throw commandError("TAG_UPDATE_CONFLICT", "A tag cannot be added and removed in the same request", 400);
    }
  });

  var currentTags = readItemTags(item);
  var currentTagSet = {};
  currentTags.forEach(function (tag) {
    currentTagSet[tag] = true;
  });

  return {
    zoteroItemKey: item.key,
    addTags: addTags,
    removeTags: removeTags,
    currentTags: currentTags,
    tagsToAdd: addTags.filter(function (tag) {
      return !currentTagSet[tag];
    }),
    tagsToRemove: removeTags.filter(function (tag) {
      return currentTagSet[tag];
    })
  };
}

function createItemTrashDryRun(input) {
  var normalized = normalizeItemTrashInput(input);
  return createWriteDryRunPlan(
    "item.trash",
    stripRuntimeFields(normalized),
    {
      zoteroItemKeys: normalized.zoteroItemKeys,
      collectionKeys: [],
      attachmentKeys: normalized.attachmentKeys,
      filePaths: [],
      tags: []
    },
    [{
      code: "ITEM_TRASH_ONLY",
      message: "Items will be moved to Zotero trash and not permanently erased"
    }],
    { items: normalized.items },
    {
      action: "trash",
      zoteroItemKeys: normalized.zoteroItemKeys,
      attachmentKeys: normalized.attachmentKeys
    },
    "high"
  );
}

async function executeItemTrash(input, confirmation) {
  assertConfirmationPresent(confirmation);
  var normalized = normalizeItemTrashInput(input);
  validateStoredConfirmation(stripRuntimeFields(normalized), confirmation);

  await Zotero.Items.trashTx(normalized.itemIDs);
  return {
    trashedZoteroItemKeys: normalized.zoteroItemKeys,
    attachmentKeys: normalized.attachmentKeys,
    trashed: true,
    erased: false
  };
}

function normalizeItemTrashInput(input) {
  if (!input || typeof input !== "object") {
    throw commandError("COMMAND_INPUT_INVALID", "item.trash input must be an object", 400);
  }

  var itemKeys = normalizeStringArray(input.zoteroItemKeys, "zoteroItemKeys", "ZOTERO_ITEM_KEYS_REQUIRED");
  var itemIDs = [];
  var items = [];
  var attachmentKeys = [];
  for (var i = 0; i < itemKeys.length; i += 1) {
    var item = normalizeItemTarget(itemKeys[i]);
    if (item.isAttachment && item.isAttachment()) {
      throw commandError("ITEM_TRASH_ATTACHMENT_UNSUPPORTED", "Use attachment.trash for attachment items", 400);
    }
    if (item.isInTrash && item.isInTrash()) {
      throw commandError("ITEM_ALREADY_TRASHED", "Item is already in Zotero trash: " + item.key, 409);
    }
    itemIDs.push(item.id);
    items.push(itemSummaryRecord(item));
    if (item.isRegularItem && item.isRegularItem()) {
      attachmentKeys = attachmentKeys.concat(item.getAttachments(false).map(function (attachmentID) {
        var attachment = Zotero.Items.get(attachmentID);
        return attachment && attachment.key ? attachment.key : undefined;
      }).filter(Boolean));
    }
  }

  return {
    zoteroItemKeys: itemKeys,
    itemIDs: itemIDs,
    items: items,
    attachmentKeys: uniqueStrings(attachmentKeys)
  };
}

function normalizeTagArray(value, fieldName) {
  if (!Array.isArray(value)) {
    throw commandError("TAGS_INVALID", fieldName + " must be an array", 400);
  }

  var seen = {};
  var tags = [];
  value.forEach(function (tag) {
    if (typeof tag !== "string" || tag.trim().length === 0) {
      throw commandError("TAG_INVALID", fieldName + " must contain non-empty strings", 400);
    }

    var normalized = tag.trim();
    if (!seen[normalized]) {
      seen[normalized] = true;
      tags.push(normalized);
    }
  });

  return tags;
}

function normalizeStringArray(value, fieldName, missingCode) {
  if (!Array.isArray(value) || value.length === 0) {
    throw commandError(missingCode, fieldName + " must be a non-empty array", 400);
  }

  if (value.length > 50) {
    throw commandError("BATCH_LIMIT_EXCEEDED", fieldName + " count exceeds limit 50", 400);
  }

  var strings = [];
  value.forEach(function (item) {
    if (typeof item !== "string" || item.trim().length === 0) {
      throw commandError("STRING_ARRAY_INVALID", fieldName + " must contain non-empty strings", 400);
    }
    strings.push(item.trim());
  });
  return uniqueStrings(strings);
}

function uniqueStrings(values) {
  var seen = {};
  var result = [];
  values.forEach(function (value) {
    if (typeof value === "string" && value.length > 0 && !seen[value]) {
      seen[value] = true;
      result.push(value);
    }
  });
  return result;
}

function normalizeItemTarget(itemKey) {
  if (typeof itemKey !== "string" || itemKey.trim().length === 0) {
    throw commandError("ZOTERO_ITEM_KEY_REQUIRED", "A zoteroItemKey is required", 400);
  }

  return getLocalUserItem(itemKey.trim());
}

function normalizeAttachmentTarget(attachmentKey) {
  if (typeof attachmentKey !== "string" || attachmentKey.trim().length === 0) {
    throw commandError("ATTACHMENT_KEY_REQUIRED", "An attachmentKey is required", 400);
  }

  return getLocalUserAttachment(attachmentKey.trim());
}

function getLocalUserAttachment(attachmentKey) {
  var attachment = Zotero.Items.getByLibraryAndKey(Zotero.Libraries.userLibraryID, attachmentKey);
  if (!attachment || !attachment.isAttachment()) {
    throw commandError("ATTACHMENT_NOT_FOUND", "Attachment was not found in local user library", 404);
  }

  return attachment;
}

function readItemTags(item) {
  return item.getTags().map(function (tagData) {
    return tagData.tag;
  });
}

async function readItemAttachments(input) {
  var parentItem = normalizeItemTarget(input.zoteroItemKey);
  if (!parentItem.isRegularItem()) {
    throw commandError("PARENT_ITEM_INVALID", "Attachments can only be read under regular Zotero items", 400);
  }

  var attachmentIDs = parentItem.getAttachments(false);
  var attachments = [];
  for (var i = 0; i < attachmentIDs.length; i += 1) {
    var attachment = Zotero.Items.get(attachmentIDs[i]);
    if (attachment && attachment.isAttachment()) {
      attachments.push(await attachmentRecord(attachment));
    }
  }

  return {
    zoteroItemKey: parentItem.key,
    attachments: attachments
  };
}

async function readAttachmentDetails(input) {
  var attachment = normalizeAttachmentTarget(input.attachmentKey);
  var record = await attachmentRecord(attachment);
  record.parentZoteroItemKey = attachment.parentKey || undefined;
  record.isFileAttachment = attachment.isFileAttachment ? attachment.isFileAttachment() : false;
  return record;
}

async function createAttachmentAddFileDryRun(input) {
  var normalized = await normalizeAttachmentAddFileInput(input);
  var warnings = [];
  if (normalized.attachmentMode === "linked") {
    warnings.push({
      code: "LINKED_FILE_PATH_RISK",
      message: "Linked files remain outside Zotero storage; moving, renaming, or deleting the source file will break the attachment"
    });
  }
  if (normalized.duplicateAttachmentKeys.length > 0) {
    warnings.push({
      code: "ATTACHMENT_DUPLICATE_SKIPPED",
      message: "A matching attachment already exists under this item; execute will skip by default"
    });
  }

  return createWriteDryRunPlan(
    "attachment.addFile",
    stripRuntimeFields(normalized),
    {
      zoteroItemKeys: [normalized.zoteroItemKey],
      collectionKeys: [],
      attachmentKeys: normalized.duplicateAttachmentKeys,
      filePaths: [normalized.filePath],
      tags: []
    },
    warnings,
    { existingAttachmentKeys: normalized.duplicateAttachmentKeys },
    {
      action: normalized.duplicateAttachmentKeys.length > 0 ? "skip" : "add",
      zoteroItemKey: normalized.zoteroItemKey,
      filePath: normalized.filePath,
      filename: normalized.filename,
      attachmentMode: normalized.attachmentMode
    }
  );
}

async function executeAttachmentAddFile(input, confirmation) {
  assertConfirmationPresent(confirmation);
  var normalized = await normalizeAttachmentAddFileInput(input);
  validateStoredConfirmation(stripRuntimeFields(normalized), confirmation);

  if (normalized.duplicateAttachmentKeys.length > 0) {
    return {
      zoteroItemKey: normalized.zoteroItemKey,
      attachmentKey: undefined,
      filePath: normalized.filePath,
      filename: normalized.filename,
      attachmentMode: normalized.attachmentMode,
      skipped: true,
      reason: "duplicate"
    };
  }

  var parentItem = getLocalUserItem(normalized.zoteroItemKey);
  var attachment;
  if (normalized.attachmentMode === "linked") {
    attachment = await Zotero.Attachments.linkFromFile({
      file: normalized.filePath,
      parentItemID: parentItem.id
    });
  } else {
    attachment = await Zotero.Attachments.importFromFile({
      file: normalized.filePath,
      parentItemID: parentItem.id
    });
  }

  var record = await attachmentRecord(attachment);
  return {
    zoteroItemKey: parentItem.key,
    attachmentKey: attachment.key,
    filePath: record.filePath || normalized.filePath,
    filename: record.filename || normalized.filename,
    attachmentMode: normalized.attachmentMode,
    skipped: false,
    attachment: record
  };
}

function createAttachmentMoveDryRun(input) {
  var normalized = normalizeAttachmentMoveInput(input);
  return createWriteDryRunPlan(
    "attachment.moveToItem",
    stripRuntimeFields(normalized),
    {
      zoteroItemKeys: [normalized.previousZoteroItemKey, normalized.targetZoteroItemKey],
      collectionKeys: [],
      attachmentKeys: [normalized.attachmentKey],
      filePaths: [],
      tags: []
    },
    [],
    { parentZoteroItemKey: normalized.previousZoteroItemKey },
    {
      parentZoteroItemKey: normalized.targetZoteroItemKey,
      action: normalized.previousZoteroItemKey === normalized.targetZoteroItemKey ? "skip" : "move"
    }
  );
}

async function executeAttachmentMoveToItem(input, confirmation) {
  assertConfirmationPresent(confirmation);
  var normalized = normalizeAttachmentMoveInput(input);
  validateStoredConfirmation(stripRuntimeFields(normalized), confirmation);

  var attachment = getLocalUserAttachment(normalized.attachmentKey);
  if (normalized.previousZoteroItemKey === normalized.targetZoteroItemKey) {
    return {
      attachmentKey: attachment.key,
      previousZoteroItemKey: normalized.previousZoteroItemKey,
      targetZoteroItemKey: normalized.targetZoteroItemKey,
      skipped: true,
      reason: "already-target-parent"
    };
  }

  attachment.parentKey = normalized.targetZoteroItemKey;
  await attachment.saveTx();

  return {
    attachmentKey: attachment.key,
    previousZoteroItemKey: normalized.previousZoteroItemKey,
    targetZoteroItemKey: normalized.targetZoteroItemKey,
    skipped: false
  };
}

async function createAttachmentUndoAddedDryRun(input) {
  var normalized = await normalizeAttachmentUndoAddedInput(input);
  return createWriteDryRunPlan(
    "attachment.undoAdded",
    stripRuntimeFields(normalized),
    {
      zoteroItemKeys: normalized.parentZoteroItemKey ? [normalized.parentZoteroItemKey] : [],
      collectionKeys: [],
      attachmentKeys: [normalized.attachmentKey],
      filePaths: normalized.currentFilePath ? [normalized.currentFilePath] : [],
      tags: []
    },
    [{
      code: "ATTACHMENT_TRASH_ONLY",
      message: "Undo moves the bridge-created attachment to Zotero trash and does not erase attachment files"
    }],
    {
      attachmentKey: normalized.attachmentKey,
      title: normalized.currentTitle,
      filename: normalized.currentFilename,
      filePath: normalized.currentFilePath,
      parentZoteroItemKey: normalized.parentZoteroItemKey,
      sourceAuditRequestId: normalized.sourceAuditRequestId,
      sourceAuditPlanId: normalized.sourceAuditPlanId
    },
    {
      action: "trash",
      attachmentKey: normalized.attachmentKey
    }
  );
}

async function executeAttachmentUndoAdded(input, confirmation) {
  assertConfirmationPresent(confirmation);
  var normalized = await normalizeAttachmentUndoAddedInput(input);
  validateStoredConfirmation(stripRuntimeFields(normalized), confirmation);

  var attachment = getLocalUserAttachment(normalized.attachmentKey);
  await Zotero.Items.trashTx([attachment.id]);

  return {
    attachmentKey: normalized.attachmentKey,
    parentZoteroItemKey: normalized.parentZoteroItemKey,
    title: normalized.currentTitle,
    filename: normalized.currentFilename,
    filePath: normalized.currentFilePath,
    trashed: true,
    erased: false,
    sourceAuditRequestId: normalized.sourceAuditRequestId,
    sourceAuditPlanId: normalized.sourceAuditPlanId
  };
}

async function createAttachmentTrashDryRun(input) {
  var normalized = await normalizeAttachmentTrashInput(input);
  return createWriteDryRunPlan(
    "attachment.trash",
    stripRuntimeFields(normalized),
    {
      zoteroItemKeys: normalized.parentZoteroItemKeys,
      collectionKeys: [],
      attachmentKeys: normalized.attachmentKeys,
      filePaths: normalized.filePaths,
      tags: []
    },
    [{
      code: "ATTACHMENT_TRASH_ONLY",
      message: "Attachments will be moved to Zotero trash and attachment files will not be permanently erased"
    }],
    { attachments: normalized.attachments },
    {
      action: "trash",
      attachmentKeys: normalized.attachmentKeys
    },
    "high"
  );
}

async function executeAttachmentTrash(input, confirmation) {
  assertConfirmationPresent(confirmation);
  var normalized = await normalizeAttachmentTrashInput(input);
  validateStoredConfirmation(stripRuntimeFields(normalized), confirmation);

  await Zotero.Items.trashTx(normalized.attachmentIDs);
  return {
    trashedAttachmentKeys: normalized.attachmentKeys,
    parentZoteroItemKeys: normalized.parentZoteroItemKeys,
    filePaths: normalized.filePaths,
    trashed: true,
    erased: false
  };
}

async function normalizeAttachmentTrashInput(input) {
  if (!input || typeof input !== "object") {
    throw commandError("COMMAND_INPUT_INVALID", "attachment.trash input must be an object", 400);
  }

  var attachmentKeys = normalizeStringArray(input.attachmentKeys, "attachmentKeys", "ATTACHMENT_KEYS_REQUIRED");
  var attachmentIDs = [];
  var parentZoteroItemKeys = [];
  var filePaths = [];
  var attachments = [];
  for (var i = 0; i < attachmentKeys.length; i += 1) {
    var attachment = normalizeAttachmentTarget(attachmentKeys[i]);
    if (attachment.isInTrash && attachment.isInTrash()) {
      throw commandError("ATTACHMENT_ALREADY_TRASHED", "Attachment is already in Zotero trash: " + attachment.key, 409);
    }
    var record = await attachmentRecord(attachment);
    attachmentIDs.push(attachment.id);
    if (attachment.parentKey) {
      parentZoteroItemKeys.push(attachment.parentKey);
    }
    if (record.filePath) {
      filePaths.push(record.filePath);
    }
    attachments.push(record);
  }

  return {
    attachmentKeys: attachmentKeys,
    attachmentIDs: attachmentIDs,
    parentZoteroItemKeys: uniqueStrings(parentZoteroItemKeys),
    filePaths: uniqueStrings(filePaths),
    attachments: attachments
  };
}

async function createAttachmentRenameDryRun(input) {
  var normalized = await normalizeAttachmentRenameInput(input);
  return createWriteDryRunPlan(
    "attachment.rename",
    stripRuntimeFields(normalized),
    {
      zoteroItemKeys: normalized.parentZoteroItemKey ? [normalized.parentZoteroItemKey] : [],
      collectionKeys: [],
      attachmentKeys: [normalized.attachmentKey],
      filePaths: normalized.currentFilePath ? [normalized.currentFilePath] : [],
      tags: []
    },
    [],
    {
      title: normalized.currentTitle,
      filename: normalized.currentFilename,
      filePath: normalized.currentFilePath
    },
    {
      title: normalized.title,
      filename: normalized.renameFile ? normalized.targetFilename : normalized.currentFilename,
      action: normalized.titleChanged || normalized.filenameChanged ? "rename" : "skip"
    }
  );
}

async function executeAttachmentRename(input, confirmation) {
  assertConfirmationPresent(confirmation);
  var normalized = await normalizeAttachmentRenameInput(input);
  validateStoredConfirmation(stripRuntimeFields(normalized), confirmation);

  var attachment = getLocalUserAttachment(normalized.attachmentKey);
  if (!normalized.titleChanged && !normalized.filenameChanged) {
    return {
      attachmentKey: attachment.key,
      parentZoteroItemKey: normalized.parentZoteroItemKey,
      title: normalized.currentTitle,
      filename: normalized.currentFilename,
      skipped: true,
      reason: "no-change"
    };
  }

  var fileRenameResult = undefined;
  var fileRenameOut = {};
  var backup = undefined;
  if (normalized.filenameChanged) {
    backup = await createBackupFileSnapshot("attachment.rename", {
      attachmentKey: normalized.attachmentKey,
      parentZoteroItemKey: normalized.parentZoteroItemKey,
      filePath: normalized.currentFilePath,
      filename: normalized.currentFilename
    });
    fileRenameResult = await attachment.renameAttachmentFile(
      normalized.targetFilename,
      { overwrite: false, unique: true, updateTitle: false, out: fileRenameOut }
    );
    if (fileRenameResult === false) {
      throw commandError("ATTACHMENT_FILE_NOT_FOUND", "Attachment file was not found for filename rename", 404);
    }
    if (fileRenameResult === -1) {
      throw commandError("ATTACHMENT_FILE_DESTINATION_EXISTS", "Attachment filename destination already exists", 409);
    }
    if (fileRenameResult === -2) {
      throw commandError("ATTACHMENT_FILE_RENAME_FAILED", "Zotero failed to rename the attachment file", 500);
    }
  }

  if (normalized.titleChanged) {
    attachment.setField("title", normalized.title);
    await attachment.saveTx();
  }

  var record = await attachmentRecord(attachment);
  return {
    attachmentKey: attachment.key,
    parentZoteroItemKey: normalized.parentZoteroItemKey,
    previousTitle: normalized.currentTitle,
    title: record.title,
    previousFilename: normalized.currentFilename,
    filename: record.filename,
    renameFile: normalized.renameFile,
    fileRenameResult: fileRenameResult,
    fileRenameOut: fileRenameOut,
    backup: backup,
    skipped: false,
    attachment: record
  };
}

async function normalizeAttachmentRenameInput(input) {
  if (!input || typeof input !== "object") {
    throw commandError("COMMAND_INPUT_INVALID", "attachment.rename input must be an object", 400);
  }

  var attachment = normalizeAttachmentTarget(input.attachmentKey);
  var title = input.title;
  if (typeof title !== "string" || title.trim().length === 0) {
    throw commandError("ATTACHMENT_TITLE_REQUIRED", "attachment.rename requires a non-empty title", 400);
  }

  var renameFile = input.renameFile === undefined ? false : input.renameFile;
  if (typeof renameFile !== "boolean") {
    throw commandError("ATTACHMENT_RENAME_FILE_INVALID", "renameFile must be a boolean when provided", 400);
  }

  if (renameFile && !attachment.isFileAttachment()) {
    throw commandError("ATTACHMENT_FILE_RENAME_UNSUPPORTED", "Only file attachments can have their file name renamed", 400);
  }

  var currentFilePath = undefined;
  try {
    currentFilePath = await attachment.getFilePathAsync();
  } catch (error) {
    currentFilePath = undefined;
  }

  var currentTitle = attachment.getField ? attachment.getField("title") : undefined;
  var currentFilename = attachment.attachmentFilename || undefined;
  var targetFilename = renameFile ? makeAttachmentRenameFilename(title.trim(), currentFilename) : currentFilename;
  if (renameFile && !currentFilePath) {
    throw commandError("ATTACHMENT_FILE_NOT_FOUND", "Attachment file path is required when renameFile is true", 404);
  }

  return {
    attachmentKey: attachment.key,
    parentZoteroItemKey: attachment.parentKey || undefined,
    title: title.trim(),
    renameFile: renameFile,
    currentTitle: currentTitle || undefined,
    currentFilename: currentFilename,
    currentFilePath: currentFilePath || undefined,
    targetFilename: targetFilename,
    titleChanged: (currentTitle || "") !== title.trim(),
    filenameChanged: renameFile && currentFilename !== targetFilename
  };
}

function makeAttachmentRenameFilename(title, currentFilename) {
  var validBase = title;
  if (Zotero.File && Zotero.File.getValidFileName) {
    validBase = Zotero.File.getValidFileName(title);
  } else {
    validBase = title.replace(/[<>:"/\\|?*]/g, " ").replace(/\s+/g, " ").trim();
  }
  if (!validBase) {
    throw commandError("ATTACHMENT_FILENAME_INVALID", "No valid characters remain for attachment filename", 400);
  }

  if (!currentFilename) {
    return validBase;
  }

  var extension = "";
  var lastDot = currentFilename.lastIndexOf(".");
  if (lastDot > 0 && lastDot < currentFilename.length - 1) {
    extension = currentFilename.slice(lastDot);
  }
  if (extension && validBase.toLowerCase().endsWith(extension.toLowerCase())) {
    return validBase;
  }
  return validBase + extension;
}

async function createAttachmentRunZoteroRenameDryRun(input) {
  var normalized = await normalizeAttachmentRunZoteroRenameInput(input);
  return createWriteDryRunPlan(
    "attachment.runZoteroRename",
    stripRuntimeFields(normalized),
    {
      zoteroItemKeys: normalized.parentZoteroItemKey ? [normalized.parentZoteroItemKey] : [],
      collectionKeys: [],
      attachmentKeys: [normalized.attachmentKey],
      filePaths: normalized.currentFilePath ? [normalized.currentFilePath] : [],
      tags: []
    },
    normalized.allowed ? [] : [{
      code: "ATTACHMENT_AUTO_RENAME_NOT_ALLOWED",
      message: "Zotero current attachment rename preferences do not allow this attachment to be renamed"
    }],
    {
      filename: normalized.currentFilename,
      filePath: normalized.currentFilePath,
      preferences: normalized.renamePreferencesSnapshot
    },
    {
      filename: normalized.targetFilename,
      action: normalized.allowed && normalized.currentFilename !== normalized.targetFilename ? "rename" : "skip"
    }
  );
}

async function executeAttachmentRunZoteroRename(input, confirmation) {
  assertConfirmationPresent(confirmation);
  var normalized = await normalizeAttachmentRunZoteroRenameInput(input);
  validateStoredConfirmation(stripRuntimeFields(normalized), confirmation);

  var attachment = getLocalUserAttachment(normalized.attachmentKey);
  if (!normalized.allowed) {
    return {
      attachmentKey: attachment.key,
      parentZoteroItemKey: normalized.parentZoteroItemKey,
      filename: normalized.currentFilename,
      skipped: true,
      reason: "auto-rename-not-allowed",
      preferences: normalized.renamePreferencesSnapshot
    };
  }

  if (normalized.currentFilename === normalized.targetFilename) {
    return {
      attachmentKey: attachment.key,
      parentZoteroItemKey: normalized.parentZoteroItemKey,
      filename: normalized.currentFilename,
      skipped: true,
      reason: "no-change",
      preferences: normalized.renamePreferencesSnapshot
    };
  }

  var backup = await createBackupFileSnapshot("attachment.runZoteroRename", {
    attachmentKey: normalized.attachmentKey,
    parentZoteroItemKey: normalized.parentZoteroItemKey,
    filePath: normalized.currentFilePath,
    filename: normalized.currentFilename
  });
  var fileRenameOut = {};
  var fileRenameResult = await attachment.renameAttachmentFile(
    normalized.targetFilename,
    { overwrite: false, unique: true, updateTitle: false, out: fileRenameOut }
  );
  if (fileRenameResult === false) {
    throw commandError("ATTACHMENT_FILE_NOT_FOUND", "Attachment file was not found for Zotero rename", 404);
  }
  if (fileRenameResult === -1) {
    throw commandError("ATTACHMENT_FILE_DESTINATION_EXISTS", "Attachment filename destination already exists", 409);
  }
  if (fileRenameResult === -2) {
    throw commandError("ATTACHMENT_FILE_RENAME_FAILED", "Zotero failed to rename the attachment file", 500);
  }

  var record = await attachmentRecord(attachment);
  return {
    attachmentKey: attachment.key,
    parentZoteroItemKey: normalized.parentZoteroItemKey,
    previousFilename: normalized.currentFilename,
    filename: record.filename,
    fileRenameResult: fileRenameResult,
    fileRenameOut: fileRenameOut,
    backup: backup,
    skipped: false,
    attachment: record
  };
}

async function normalizeAttachmentRunZoteroRenameInput(input) {
  if (!input || typeof input !== "object") {
    throw commandError("COMMAND_INPUT_INVALID", "attachment.runZoteroRename input must be an object", 400);
  }

  var attachment = normalizeAttachmentTarget(input.attachmentKey);
  if (!attachment.isFileAttachment()) {
    throw commandError("ATTACHMENT_FILE_RENAME_UNSUPPORTED", "Only file attachments can use Zotero file rename", 400);
  }
  if (!attachment.parentKey) {
    throw commandError("ATTACHMENT_PARENT_REQUIRED", "Zotero attachment rename requires a parent item", 400);
  }

  var currentFilePath = undefined;
  try {
    currentFilePath = await attachment.getFilePathAsync();
  } catch (error) {
    currentFilePath = undefined;
  }
  if (!currentFilePath) {
    throw commandError("ATTACHMENT_FILE_NOT_FOUND", "Attachment file path is required for Zotero rename", 404);
  }

  var parentItem = getLocalUserItem(attachment.parentKey);
  var currentFilename = attachment.attachmentFilename || pathFilename(currentFilePath);
  var allowed = Zotero.Attachments.shouldAutoRenameAttachment(attachment);
  return {
    attachmentKey: attachment.key,
    parentZoteroItemKey: parentItem.key,
    currentFilename: currentFilename,
    currentFilePath: currentFilePath,
    targetFilename: allowed ? makeZoteroAutoRenameFilename(attachment, parentItem, currentFilename) : currentFilename,
    allowed: allowed,
    renamePreferencesSnapshot: readAttachmentRenamePreferences()
  };
}

function makeZoteroAutoRenameFilename(attachment, parentItem, currentFilename) {
  var attachmentTitle = attachment.getField ? attachment.getField("title") : currentFilename;
  var baseName = Zotero.Attachments.getFileBaseNameFromItem(parentItem, {
    attachmentTitle: attachmentTitle || currentFilename
  });
  return makeAttachmentRenameFilename(baseName, currentFilename);
}

function readAttachmentRenamePreferences() {
  var libraryID = Zotero.Libraries.userLibraryID;
  return {
    autoRenameFiles: !!Zotero.Prefs.get("autoRenameFiles"),
    autoRenameLinkedFiles: !!Zotero.Prefs.get("autoRenameFiles.linked"),
    autoRenameFileTypes: String(Zotero.Prefs.get("autoRenameFiles.fileTypes") || ""),
    attachmentRenameTemplate: Zotero.SyncedSettings.get(libraryID, "attachmentRenameTemplate") || undefined
  };
}

function createAttachmentRenamePreferencesSetDryRun(input) {
  var normalized = normalizeAttachmentRenamePreferencesSetInput(input);
  return createWriteDryRunPlan(
    "attachment.renamePreferences.set",
    stripRuntimeFields(normalized),
    {
      zoteroItemKeys: [],
      collectionKeys: [],
      attachmentKeys: [],
      filePaths: [],
      tags: []
    },
    [],
    normalized.currentPreferences,
    normalized.newPreferences
  );
}

async function executeAttachmentRenamePreferencesSet(input, confirmation) {
  assertConfirmationPresent(confirmation);
  var normalized = normalizeAttachmentRenamePreferencesSetInput(input);
  validateStoredConfirmation(stripRuntimeFields(normalized), confirmation);

  if (Object.prototype.hasOwnProperty.call(normalized.preferences, "autoRenameFiles")) {
    Zotero.Prefs.set("autoRenameFiles", normalized.preferences.autoRenameFiles);
  }
  if (Object.prototype.hasOwnProperty.call(normalized.preferences, "autoRenameLinkedFiles")) {
    Zotero.Prefs.set("autoRenameFiles.linked", normalized.preferences.autoRenameLinkedFiles);
  }
  if (Object.prototype.hasOwnProperty.call(normalized.preferences, "autoRenameFileTypes")) {
    Zotero.Prefs.set("autoRenameFiles.fileTypes", normalized.preferences.autoRenameFileTypes);
  }
  if (Object.prototype.hasOwnProperty.call(normalized.preferences, "attachmentRenameTemplate")) {
    await Zotero.SyncedSettings.set(
      Zotero.Libraries.userLibraryID,
      "attachmentRenameTemplate",
      normalized.preferences.attachmentRenameTemplate
    );
  }

  return {
    oldPreferences: normalized.currentPreferences,
    newPreferences: readAttachmentRenamePreferences()
  };
}

function normalizeAttachmentRenamePreferencesSetInput(input) {
  if (!input || typeof input !== "object") {
    throw commandError("COMMAND_INPUT_INVALID", "attachment.renamePreferences.set input must be an object", 400);
  }
  if (!input.preferences || typeof input.preferences !== "object") {
    throw commandError("ATTACHMENT_RENAME_PREFERENCES_REQUIRED", "preferences object is required", 400);
  }

  var preferences = {};
  var supported = [
    "autoRenameFiles",
    "autoRenameLinkedFiles",
    "autoRenameFileTypes",
    "attachmentRenameTemplate"
  ];
  var provided = 0;
  supported.forEach(function (key) {
    if (Object.prototype.hasOwnProperty.call(input.preferences, key)) {
      provided += 1;
      preferences[key] = input.preferences[key];
    }
  });
  if (provided === 0) {
    throw commandError("ATTACHMENT_RENAME_PREFERENCES_EMPTY", "At least one supported preference must be provided", 400);
  }

  if (Object.prototype.hasOwnProperty.call(preferences, "autoRenameFiles") && typeof preferences.autoRenameFiles !== "boolean") {
    throw commandError("ATTACHMENT_RENAME_PREFERENCE_INVALID", "autoRenameFiles must be boolean", 400);
  }
  if (Object.prototype.hasOwnProperty.call(preferences, "autoRenameLinkedFiles") && typeof preferences.autoRenameLinkedFiles !== "boolean") {
    throw commandError("ATTACHMENT_RENAME_PREFERENCE_INVALID", "autoRenameLinkedFiles must be boolean", 400);
  }
  if (Object.prototype.hasOwnProperty.call(preferences, "autoRenameFileTypes")) {
    if (typeof preferences.autoRenameFileTypes !== "string" || preferences.autoRenameFileTypes.trim().length === 0) {
      throw commandError("ATTACHMENT_RENAME_PREFERENCE_INVALID", "autoRenameFileTypes must be a non-empty string", 400);
    }
    preferences.autoRenameFileTypes = preferences.autoRenameFileTypes.trim();
  }
  if (Object.prototype.hasOwnProperty.call(preferences, "attachmentRenameTemplate")) {
    if (typeof preferences.attachmentRenameTemplate !== "string" || preferences.attachmentRenameTemplate.trim().length === 0) {
      throw commandError("ATTACHMENT_RENAME_PREFERENCE_INVALID", "attachmentRenameTemplate must be a non-empty string", 400);
    }
    preferences.attachmentRenameTemplate = preferences.attachmentRenameTemplate.trim();
  }

  var currentPreferences = readAttachmentRenamePreferences();
  return {
    preferences: preferences,
    currentPreferences: currentPreferences,
    newPreferences: mergeObjects(currentPreferences, preferences)
  };
}

function mergeObjects(base, override) {
  var result = {};
  Object.keys(base).forEach(function (key) {
    result[key] = base[key];
  });
  Object.keys(override).forEach(function (key) {
    result[key] = override[key];
  });
  return result;
}

function normalizeAttachmentMoveInput(input) {
  if (!input || typeof input !== "object") {
    throw commandError("COMMAND_INPUT_INVALID", "attachment.moveToItem input must be an object", 400);
  }

  var attachment = normalizeAttachmentTarget(input.attachmentKey);
  var targetItem = normalizeItemTarget(input.targetZoteroItemKey);
  if (!targetItem.isRegularItem()) {
    throw commandError("TARGET_ITEM_INVALID", "targetZoteroItemKey must point to a regular Zotero item", 400);
  }

  if (!attachment.parentKey) {
    throw commandError("ATTACHMENT_PARENT_REQUIRED", "Only child attachments with a parent item can be moved in the first version", 400);
  }

  return {
    attachmentKey: attachment.key,
    previousZoteroItemKey: attachment.parentKey,
    targetZoteroItemKey: targetItem.key
  };
}

async function normalizeAttachmentUndoAddedInput(input) {
  if (!input || typeof input !== "object") {
    throw commandError("COMMAND_INPUT_INVALID", "attachment.undoAdded input must be an object", 400);
  }

  var attachment = normalizeAttachmentTarget(input.attachmentKey);
  if (attachment.deleted || (attachment.isInTrash && attachment.isInTrash())) {
    throw commandError("ATTACHMENT_ALREADY_TRASHED", "Attachment is already in Zotero trash", 409);
  }

  var creationAudit = await findBridgeAttachmentAddAudit(attachment.key);
  if (!creationAudit) {
    throw commandError(
      "ATTACHMENT_UNDO_NOT_BRIDGE_CREATED",
      "Attachment cannot be undone because this project has no successful attachment.addFile audit record for it",
      403
    );
  }

  var record = await attachmentRecord(attachment);
  return {
    attachmentKey: attachment.key,
    parentZoteroItemKey: attachment.parentKey || undefined,
    currentTitle: record.title,
    currentFilename: record.filename,
    currentFilePath: record.filePath,
    sourceAuditRequestId: creationAudit.requestId,
    sourceAuditPlanId: creationAudit.planId,
    sourceAuditTimestamp: creationAudit.timestamp
  };
}

async function normalizeAttachmentAddFileInput(input) {
  if (!input || typeof input !== "object") {
    throw commandError("COMMAND_INPUT_INVALID", "attachment.addFile input must be an object", 400);
  }

  var parentItem = normalizeItemTarget(input.zoteroItemKey);
  if (!parentItem.isRegularItem()) {
    throw commandError("PARENT_ITEM_INVALID", "Attachments can only be added under regular Zotero items", 400);
  }

  if (typeof input.filePath !== "string" || input.filePath.trim().length === 0) {
    throw commandError("ATTACHMENT_FILE_PATH_REQUIRED", "attachment.addFile requires a non-empty filePath", 400);
  }

  var attachmentMode = input.attachmentMode || "copy";
  if (attachmentMode !== "copy" && attachmentMode !== "linked") {
    throw commandError("ATTACHMENT_MODE_INVALID", "attachmentMode must be copy or linked", 400);
  }

  var filePath = normalizeFilePath(input.filePath);
  var filename = pathFilename(filePath);
  validateAttachmentExtension(filename);
  if (!(await fileExists(filePath))) {
    throw commandError("ATTACHMENT_FILE_NOT_FOUND", "Attachment source file was not found", 404);
  }

  return {
    zoteroItemKey: parentItem.key,
    filePath: filePath,
    filename: filename,
    attachmentMode: attachmentMode,
    duplicateAttachmentKeys: await findDuplicateAttachments(parentItem, filePath, filename, attachmentMode)
  };
}

function normalizeFilePath(filePath) {
  return filePath.trim();
}

function pathFilename(filePath) {
  if (typeof PathUtils !== "undefined" && PathUtils.filename) {
    return PathUtils.filename(filePath);
  }
  var normalized = filePath.replace(/\\/g, "/");
  return normalized.split("/").pop();
}

function validateAttachmentExtension(filename) {
  var lower = filename.toLowerCase();
  var allowedExtensions = [
    ".pdf",
    ".doc",
    ".docx",
    ".csv",
    ".xls",
    ".xlsx",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".bmp",
    ".webp",
    ".svg",
    ".tif",
    ".tiff",
    ".html",
    ".htm"
  ];
  for (var i = 0; i < allowedExtensions.length; i += 1) {
    if (lower.endsWith(allowedExtensions[i])) {
      return;
    }
  }
  throw commandError("ATTACHMENT_FILE_TYPE_UNSUPPORTED", "Attachment file extension is not supported in the first version", 400);
}

async function fileExists(filePath) {
  if (typeof IOUtils !== "undefined" && IOUtils.exists) {
    return IOUtils.exists(filePath);
  }
  var file = Zotero.File.pathToFile(filePath);
  return file && file.exists();
}

async function findDuplicateAttachments(parentItem, filePath, filename, attachmentMode) {
  var duplicateKeys = [];
  var attachmentIDs = parentItem.getAttachments(false);
  for (var i = 0; i < attachmentIDs.length; i += 1) {
    var attachment = Zotero.Items.get(attachmentIDs[i]);
    if (!attachment || !attachment.isAttachment()) {
      continue;
    }

    if (attachment.attachmentFilename === filename) {
      duplicateKeys.push(attachment.key);
      continue;
    }

    if (attachmentMode === "linked") {
      try {
        var existingPath = await attachment.getFilePathAsync();
        if (existingPath && normalizeFilePath(existingPath).toLowerCase() === filePath.toLowerCase()) {
          duplicateKeys.push(attachment.key);
        }
      } catch (error) {
        // Ignore unreadable attachment paths during duplicate detection.
      }
    }
  }
  return uniqueStrings(duplicateKeys);
}

async function attachmentRecord(attachment) {
  var filePath = false;
  try {
    filePath = await attachment.getFilePathAsync();
  } catch (error) {
    filePath = false;
  }

  var title = attachment.getField ? attachment.getField("title") : undefined;
  var record = {
    attachmentKey: attachment.key,
    title: title || undefined,
    filename: attachment.attachmentFilename || undefined,
    contentType: attachment.attachmentContentType || undefined,
    linkMode: attachment.attachmentLinkMode,
    attachmentMode: attachmentModeName(attachment.attachmentLinkMode),
    filePath: filePath || undefined
  };

  return record;
}

function attachmentModeName(linkMode) {
  if (linkMode === Zotero.Attachments.LINK_MODE_IMPORTED_FILE) {
    return "copy";
  }
  if (linkMode === Zotero.Attachments.LINK_MODE_LINKED_FILE) {
    return "linked";
  }
  if (linkMode === Zotero.Attachments.LINK_MODE_IMPORTED_URL) {
    return "imported-url";
  }
  if (linkMode === Zotero.Attachments.LINK_MODE_LINKED_URL) {
    return "linked-url";
  }
  if (linkMode === Zotero.Attachments.LINK_MODE_EMBEDDED_IMAGE) {
    return "embedded-image";
  }
  return "unknown";
}

function readAttachmentAnnotations(input) {
  var attachment = normalizeAnnotationAttachmentTarget(input.attachmentKey);
  var includeTrashed = input.includeTrashed === true;
  var annotations = attachment.getAnnotations(includeTrashed).map(function (annotation) {
    return annotationRecord(annotation);
  });

  return {
    attachmentKey: attachment.key,
    parentZoteroItemKey: attachment.parentKey || undefined,
    includeTrashed: includeTrashed,
    annotations: annotations
  };
}

function createAnnotationCreateDryRun(input) {
  var normalized = normalizeAnnotationCreateInput(input);
  return createWriteDryRunPlan(
    "annotation.create",
    stripRuntimeFields(normalized),
    {
      zoteroItemKeys: [],
      collectionKeys: [],
      attachmentKeys: [normalized.attachmentKey],
      filePaths: [],
      tags: []
    },
    [],
    undefined,
    {
      action: "create",
      attachmentKey: normalized.attachmentKey,
      annotationType: normalized.annotationType,
      annotationColor: normalized.annotationColor,
      annotationPageLabel: normalized.annotationPageLabel,
      annotationSortIndex: normalized.annotationSortIndex,
      annotationPosition: normalized.annotationPosition
    }
  );
}

async function executeAnnotationCreate(input, confirmation) {
  assertConfirmationPresent(confirmation);
  var normalized = normalizeAnnotationCreateInput(input);
  validateStoredConfirmation(stripRuntimeFields(normalized), confirmation);

  var attachment = normalizeAnnotationAttachmentTarget(normalized.attachmentKey);
  var annotation = new Zotero.Item("annotation");
  annotation.libraryID = Zotero.Libraries.userLibraryID;
  annotation.parentKey = attachment.key;
  applyAnnotationFields(annotation, normalized, true);
  await annotation.saveTx();

  return annotationRecord(annotation);
}

function createAnnotationUpdateDryRun(input) {
  var normalized = normalizeAnnotationUpdateInput(input);
  return createWriteDryRunPlan(
    "annotation.update",
    stripRuntimeFields(normalized),
    {
      zoteroItemKeys: [normalized.annotationKey],
      collectionKeys: [],
      attachmentKeys: [normalized.attachmentKey],
      filePaths: [],
      tags: []
    },
    [],
    annotationRecord(normalized.annotation),
    {
      action: "update",
      annotationKey: normalized.annotationKey,
      attachmentKey: normalized.attachmentKey,
      fields: normalized.fields
    }
  );
}

async function executeAnnotationUpdate(input, confirmation) {
  assertConfirmationPresent(confirmation);
  var normalized = normalizeAnnotationUpdateInput(input);
  validateStoredConfirmation(stripRuntimeFields(normalized), confirmation);

  applyAnnotationFields(normalized.annotation, normalized, false);
  await normalized.annotation.saveTx();

  return annotationRecord(normalized.annotation);
}

function normalizeAnnotationCreateInput(input) {
  if (!input || typeof input !== "object") {
    throw commandError("COMMAND_INPUT_INVALID", "annotation.create input must be an object", 400);
  }

  var attachment = normalizeAnnotationAttachmentTarget(input.attachmentKey);
  var annotationType = normalizeAnnotationType(input.annotationType);
  var annotationText = normalizeAnnotationText(input.annotationText, annotationType);
  var annotationComment = normalizeOptionalAnnotationString(input.annotationComment, "annotationComment");
  var annotationColor = normalizeAnnotationColor(input.annotationColor);
  var annotationPageLabel = normalizeOptionalAnnotationString(input.annotationPageLabel, "annotationPageLabel");
  var annotationSortIndex = normalizeAnnotationSortIndex(input.annotationSortIndex);
  var annotationPosition = normalizeAnnotationPosition(input.annotationPosition);

  return {
    attachmentKey: attachment.key,
    annotationType: annotationType,
    annotationText: annotationText,
    annotationComment: annotationComment,
    annotationColor: annotationColor,
    annotationPageLabel: annotationPageLabel,
    annotationSortIndex: annotationSortIndex,
    annotationPosition: annotationPosition
  };
}

function normalizeAnnotationUpdateInput(input) {
  if (!input || typeof input !== "object") {
    throw commandError("COMMAND_INPUT_INVALID", "annotation.update input must be an object", 400);
  }

  var annotation = normalizeAnnotationTarget(input.annotationKey);
  var attachment = normalizeAnnotationAttachmentTarget(annotation.parentKey);
  var fields = {};
  var normalized = {
    annotationKey: annotation.key,
    attachmentKey: attachment.key,
    annotation: annotation,
    fields: fields
  };

  if (Object.prototype.hasOwnProperty.call(input, "annotationText")) {
    fields.annotationText = normalizeAnnotationText(input.annotationText, annotation.annotationType);
    normalized.annotationText = fields.annotationText;
  }
  if (Object.prototype.hasOwnProperty.call(input, "annotationComment")) {
    fields.annotationComment = normalizeOptionalAnnotationString(input.annotationComment, "annotationComment");
    normalized.annotationComment = fields.annotationComment;
  }
  if (Object.prototype.hasOwnProperty.call(input, "annotationColor")) {
    fields.annotationColor = normalizeAnnotationColor(input.annotationColor);
    normalized.annotationColor = fields.annotationColor;
  }
  if (Object.prototype.hasOwnProperty.call(input, "annotationPageLabel")) {
    fields.annotationPageLabel = normalizeOptionalAnnotationString(input.annotationPageLabel, "annotationPageLabel");
    normalized.annotationPageLabel = fields.annotationPageLabel;
  }
  if (Object.prototype.hasOwnProperty.call(input, "annotationSortIndex")) {
    fields.annotationSortIndex = normalizeAnnotationSortIndex(input.annotationSortIndex);
    normalized.annotationSortIndex = fields.annotationSortIndex;
  }
  if (Object.prototype.hasOwnProperty.call(input, "annotationPosition")) {
    fields.annotationPosition = normalizeAnnotationPosition(input.annotationPosition);
    normalized.annotationPosition = fields.annotationPosition;
  }

  if (Object.keys(fields).length === 0) {
    throw commandError("ANNOTATION_UPDATE_EMPTY", "annotation.update requires at least one annotation field", 400);
  }

  return normalized;
}

function normalizeAnnotationAttachmentTarget(attachmentKey) {
  var attachment = normalizeAttachmentTarget(attachmentKey);
  if (!attachment.isFileAttachment || !attachment.isFileAttachment()) {
    throw commandError("ANNOTATION_PARENT_INVALID", "Annotations can only be managed under file attachments", 400);
  }
  if (!attachment.isPDFAttachment || !attachment.isPDFAttachment()) {
    throw commandError("ANNOTATION_PARENT_NOT_PDF", "The first annotation implementation only supports PDF attachments", 400);
  }
  if (!attachment.attachmentReaderType) {
    throw commandError("ANNOTATION_PARENT_NOT_READABLE", "Attachment is not readable by the Zotero reader", 400);
  }
  return attachment;
}

function normalizeAnnotationTarget(annotationKey) {
  if (typeof annotationKey !== "string" || annotationKey.trim().length === 0) {
    throw commandError("ANNOTATION_KEY_REQUIRED", "An annotationKey is required", 400);
  }

  var annotation = Zotero.Items.getByLibraryAndKey(Zotero.Libraries.userLibraryID, annotationKey.trim());
  if (!annotation || !annotation.isAnnotation || !annotation.isAnnotation()) {
    throw commandError("ANNOTATION_NOT_FOUND", "Annotation was not found in local user library", 404);
  }

  return annotation;
}

function normalizeAnnotationType(annotationType) {
  if (typeof annotationType !== "string") {
    throw commandError("ANNOTATION_TYPE_REQUIRED", "annotationType is required", 400);
  }
  var normalized = annotationType.trim();
  if (["highlight", "underline", "note", "text"].indexOf(normalized) === -1) {
    throw commandError("ANNOTATION_TYPE_UNSUPPORTED", "annotationType must be highlight, underline, note, or text", 400);
  }
  return normalized;
}

function normalizeAnnotationText(annotationText, annotationType) {
  if (annotationText === undefined || annotationText === null) {
    if (annotationType === "highlight" || annotationType === "underline") {
      throw commandError("ANNOTATION_TEXT_REQUIRED", "annotationText is required for highlight and underline annotations", 400);
    }
    return undefined;
  }
  if (typeof annotationText !== "string") {
    throw commandError("ANNOTATION_TEXT_INVALID", "annotationText must be a string", 400);
  }
  var normalized = annotationText.trim();
  if ((annotationType === "highlight" || annotationType === "underline") && normalized.length === 0) {
    throw commandError("ANNOTATION_TEXT_REQUIRED", "annotationText is required for highlight and underline annotations", 400);
  }
  if (annotationType !== "highlight" && annotationType !== "underline" && normalized.length > 0) {
    throw commandError("ANNOTATION_TEXT_UNSUPPORTED", "annotationText can only be set for highlight and underline annotations", 400);
  }
  return normalized.length > 0 ? normalized : undefined;
}

function normalizeOptionalAnnotationString(value, fieldName) {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== "string") {
    throw commandError("ANNOTATION_FIELD_INVALID", fieldName + " must be a string", 400);
  }
  var normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function normalizeAnnotationColor(value) {
  var color = value === undefined || value === null ? "#ffd400" : value;
  if (typeof color !== "string" || !/^#[a-f0-9]{6}$/i.test(color.trim())) {
    throw commandError("ANNOTATION_COLOR_INVALID", "annotationColor must be a #rrggbb hex color", 400);
  }
  return color.trim().toLowerCase();
}

function normalizeAnnotationSortIndex(value) {
  if (typeof value !== "string" || !/^\d{5}\|\d{6}\|\d{5}$/.test(value.trim())) {
    throw commandError("ANNOTATION_SORT_INDEX_INVALID", "PDF annotationSortIndex must match 00000|000000|00000", 400);
  }
  return value.trim();
}

function normalizeAnnotationPosition(value) {
  if (value === undefined || value === null) {
    throw commandError("ANNOTATION_POSITION_REQUIRED", "annotationPosition is required", 400);
  }

  var position = typeof value === "string" ? value.trim() : JSON.stringify(value);
  if (position.length === 0) {
    throw commandError("ANNOTATION_POSITION_REQUIRED", "annotationPosition is required", 400);
  }

  try {
    JSON.parse(position);
  } catch (error) {
    throw commandError("ANNOTATION_POSITION_INVALID", "annotationPosition must be valid JSON", 400);
  }

  return position;
}

function applyAnnotationFields(annotation, normalized, isCreate) {
  if (isCreate) {
    annotation.annotationType = normalized.annotationType;
    annotation.annotationIsExternal = false;
  }
  if (Object.prototype.hasOwnProperty.call(normalized, "annotationText") && normalized.annotationText !== undefined) {
    annotation.annotationText = normalized.annotationText;
  }
  if (Object.prototype.hasOwnProperty.call(normalized, "annotationComment")) {
    annotation.annotationComment = normalized.annotationComment;
  }
  if (Object.prototype.hasOwnProperty.call(normalized, "annotationColor")) {
    annotation.annotationColor = normalized.annotationColor;
  }
  if (Object.prototype.hasOwnProperty.call(normalized, "annotationPageLabel")) {
    annotation.annotationPageLabel = normalized.annotationPageLabel;
  }
  if (Object.prototype.hasOwnProperty.call(normalized, "annotationSortIndex")) {
    annotation.annotationSortIndex = normalized.annotationSortIndex;
  }
  if (Object.prototype.hasOwnProperty.call(normalized, "annotationPosition")) {
    annotation.annotationPosition = normalized.annotationPosition;
  }
}

function annotationRecord(annotation) {
  var parent = annotation.parentItem;
  return {
    annotationKey: annotation.key,
    attachmentKey: annotation.parentKey || undefined,
    parentZoteroItemKey: parent && parent.parentKey ? parent.parentKey : undefined,
    annotationType: annotation.annotationType,
    annotationText: annotation.annotationText || "",
    annotationComment: annotation.annotationComment || "",
    annotationColor: annotation.annotationColor || "",
    annotationPageLabel: annotation.annotationPageLabel || "",
    annotationSortIndex: annotation.annotationSortIndex || "",
    annotationPosition: annotation.annotationPosition || "",
    annotationIsExternal: annotation.annotationIsExternal === true
  };
}

function createChildNoteDryRun(input) {
  var normalized = normalizeChildNoteCreateInput(input);
  return createWriteDryRunPlan(
    "note.createChild",
    stripRuntimeFields(normalized),
    {
      zoteroItemKeys: [normalized.zoteroItemKey],
      collectionKeys: [],
      attachmentKeys: [],
      filePaths: [],
      tags: []
    },
    [],
    undefined,
    {
      parentZoteroItemKey: normalized.zoteroItemKey,
      contentFormat: normalized.contentFormat,
      noteHtmlPreview: normalized.noteHtml.length > 500 ? normalized.noteHtml.slice(0, 500) : normalized.noteHtml
    }
  );
}

async function executeChildNoteCreate(input, confirmation) {
  assertConfirmationPresent(confirmation);
  var normalized = normalizeChildNoteCreateInput(input);
  validateStoredConfirmation(stripRuntimeFields(normalized), confirmation);

  var parentItem = getLocalUserItem(normalized.zoteroItemKey);
  if (!parentItem.isRegularItem()) {
    throw commandError("PARENT_ITEM_INVALID", "Child notes can only be created under regular Zotero items", 400);
  }

  var note = new Zotero.Item("note");
  note.libraryID = Zotero.Libraries.userLibraryID;
  note.parentKey = parentItem.key;
  note.setNote(normalized.noteHtml);
  await note.saveTx();

  return {
    zoteroItemKey: parentItem.key,
    noteKey: note.key,
    contentFormat: normalized.contentFormat
  };
}

function normalizeChildNoteCreateInput(input) {
  if (!input || typeof input !== "object") {
    throw commandError("COMMAND_INPUT_INVALID", "note.createChild input must be an object", 400);
  }

  var parentItem = normalizeItemTarget(input.zoteroItemKey);
  if (!parentItem.isRegularItem()) {
    throw commandError("PARENT_ITEM_INVALID", "Child notes can only be created under regular Zotero items", 400);
  }

  if (typeof input.content !== "string" || input.content.trim().length === 0) {
    throw commandError("NOTE_CONTENT_REQUIRED", "note.createChild requires non-empty content", 400);
  }

  var contentFormat = input.contentFormat || "text";
  if (contentFormat !== "text" && contentFormat !== "html" && contentFormat !== "rich-text") {
    throw commandError("NOTE_CONTENT_FORMAT_INVALID", "contentFormat must be text, html, or rich-text", 400);
  }

  return {
    zoteroItemKey: parentItem.key,
    content: input.content,
    contentFormat: contentFormat,
    noteHtml: normalizeNoteContent(input.content, contentFormat)
  };
}

function normalizeNoteContent(content, contentFormat) {
  if (contentFormat === "text") {
    return "<p>" + escapeHtml(content).replace(/\r\n|\r|\n/g, "</p><p>") + "</p>";
  }

  return content;
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalizeCollectionTarget(collectionKey) {
  if (typeof collectionKey !== "string" || collectionKey.trim().length === 0) {
    throw commandError("COLLECTION_KEY_REQUIRED", "A collection key is required", 400);
  }

  return getLocalUserCollection(collectionKey.trim());
}

function getLocalUserCollection(collectionKey) {
  var collection = Zotero.Collections.getByLibraryAndKey(Zotero.Libraries.userLibraryID, collectionKey);
  if (!collection) {
    throw commandError("COLLECTION_NOT_FOUND", "Collection was not found in local user library", 404);
  }

  return collection;
}

function getLocalUserItem(itemKey) {
  var item = Zotero.Items.getByLibraryAndKey(Zotero.Libraries.userLibraryID, itemKey);
  if (!item) {
    throw commandError("ZOTERO_ITEM_NOT_FOUND", "Item was not found in local user library", 404);
  }

  return item;
}

function collectionRecord(collection) {
  return {
    collectionKey: collection.key,
    name: collection.name,
    parentCollectionKey: collection.parentKey || undefined
  };
}

function stripRuntimeFields(input) {
  var stripped = {};
  var runtimeFields = {
    existingItemKeys: true,
    toChangeItemKeys: true,
    collectionKeysToAdd: true,
    collectionKeysToRemove: true,
    tagsToAdd: true,
    tagsToRemove: true,
    noteHtml: true,
    duplicateAttachmentKeys: true,
    parentZoteroItemKey: true,
    targetFilename: true,
    titleChanged: true,
    filenameChanged: true,
    allowed: true,
    renamePreferencesSnapshot: true,
    newPreferences: true,
    sourceAuditRequestId: true,
    sourceAuditPlanId: true,
    sourceAuditTimestamp: true,
    annotation: true,
    fields: true,
    search: true,
    itemIDs: true,
    items: true,
    attachmentIDs: true,
    attachments: true,
    collectionKeysToTrash: true,
    descendentCollectionKeys: true,
    descendentItemKeys: true,
    parentZoteroItemKeys: true,
    master: true,
    duplicates: true,
    fieldConflicts: true,
    affectedAttachmentKeys: true,
    affectedCollectionKeys: true,
    affectedTags: true
  };
  Object.keys(input).forEach(function (key) {
    if (key.indexOf("current") !== 0 && !runtimeFields[key]) {
      stripped[key] = input[key];
    }
  });
  return stripped;
}

function validateStoredConfirmation(input, confirmation) {
  var stored = ZoteroLocalMcpBridge.confirmations[confirmation.planId];
  if (!stored) {
    throw commandError("PLAN_NOT_FOUND", "Dry-run plan was not found", 404);
  }

  if (new Date(stored.expiresAt).getTime() < Date.now()) {
    delete ZoteroLocalMcpBridge.confirmations[confirmation.planId];
    throw commandError("PLAN_EXPIRED", "Dry-run plan has expired", 410);
  }

  if (stored.inputHash !== hashInput(input)) {
    throw commandError("PLAN_INPUT_CHANGED", "Dry-run input hash does not match execute input", 409);
  }

  if (stored.confirmationToken !== confirmation.confirmationToken) {
    throw commandError("CONFIRMATION_TOKEN_INVALID", "Confirmation token is invalid", 403);
  }

  delete ZoteroLocalMcpBridge.confirmations[confirmation.planId];
}

function assertConfirmationPresent(confirmation) {
  if (!confirmation || typeof confirmation !== "object") {
    throw commandError("CONFIRMATION_REQUIRED", "Write execute requires dry-run confirmation", 400);
  }
}

function hashInput(input) {
  return fnv1a(stableStringify(input));
}

function stableStringify(value) {
  return JSON.stringify(sortJson(value));
}

function sortJson(value) {
  if (Array.isArray(value)) {
    return value.map(function (item) {
      return sortJson(item);
    });
  }

  if (value && typeof value === "object") {
    var result = {};
    Object.keys(value).sort().forEach(function (key) {
      result[key] = sortJson(value[key]);
    });
    return result;
  }

  return value;
}

function fnv1a(value) {
  var hash = 0x811c9dc5;
  for (var i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = (hash >>> 0) * 0x01000193;
  }
  return ("00000000" + (hash >>> 0).toString(16)).slice(-8);
}

function randomId() {
  var random = Math.random().toString(36).slice(2);
  return Date.now().toString(36) + "_" + random;
}

function commandError(code, message, status, details) {
  var error = new Error(message);
  error.code = code;
  error.status = status;
  if (details && typeof details === "object") {
    error.details = stripUndefined(details);
  }
  return error;
}

function commandErrorResponse(error, fallbackCode, fallbackMessage) {
  var response = {
    code: error && error.code ? error.code : fallbackCode,
    message: error && error.message ? error.message : fallbackMessage
  };

  if (error && error.details && typeof error.details === "object") {
    Object.keys(error.details).forEach(function (key) {
      response[key] = error.details[key];
    });
  }

  return response;
}

async function readBackupSettings() {
  var filePath = backupSettingsFilePath();
  if (!(await fileExists(filePath))) {
    return {
      policy: cloneBackupPolicy(ZoteroLocalMcpBridgeDefaultBackupPolicy),
      filePath: filePath,
      defaultsUsed: true
    };
  }

  var contents = await Zotero.File.getContentsAsync(filePath);
  var parsed;
  try {
    parsed = JSON.parse(contents);
  } catch (error) {
    throw commandError("BACKUP_SETTINGS_JSON_INVALID", "Backup settings file is not valid JSON", 400);
  }

  return {
    policy: normalizeBackupPolicy(parsed.policy || parsed),
    filePath: filePath,
    defaultsUsed: false
  };
}

async function createBackupSettingsSetDryRun(input) {
  var normalized = normalizeBackupSettingsSetInput(input);
  var current = await readBackupSettings();
  var filePath = backupSettingsFilePath();
  return createWriteDryRunPlan(
    "backup.settings.set",
    normalized,
    {
      zoteroItemKeys: [],
      collectionKeys: [],
      attachmentKeys: [],
      filePaths: [filePath],
      tags: []
    },
    [],
    {
      policy: current.policy,
      filePath: filePath
    },
    {
      policy: normalized.policy,
      filePath: filePath
    }
  );
}

async function executeBackupSettingsSet(input, confirmation) {
  assertConfirmationPresent(confirmation);
  var normalized = normalizeBackupSettingsSetInput(input);
  validateStoredConfirmation(normalized, confirmation);

  var current = await readBackupSettings();
  var filePath = backupSettingsFilePath();
  await Zotero.File.createDirectoryIfMissingAsync(backupRootPath());
  await Zotero.File.putContentsAsync(filePath, JSON.stringify({
    policy: normalized.policy,
    updatedAt: new Date().toISOString(),
    updatedBy: ZoteroLocalMcpBridge.id
  }, null, 2) + "\n");

  return {
    oldPolicy: current.policy,
    newPolicy: normalized.policy,
    filePath: filePath
  };
}

function normalizeBackupSettingsSetInput(input) {
  if (!input || typeof input !== "object") {
    throw commandError("BACKUP_SETTINGS_INPUT_INVALID", "backup.settings.set input must be an object", 400);
  }

  return {
    policy: normalizeBackupPolicy(input.policy)
  };
}

function normalizeBackupPolicy(policy) {
  if (!policy || typeof policy !== "object") {
    throw commandError("BACKUP_POLICY_REQUIRED", "backup.settings.set requires a policy object", 400);
  }

  var normalized = {
    retentionDays: normalizePositiveInteger(policy.retentionDays, "retentionDays"),
    maxLocalBytes: normalizeNonNegativeInteger(policy.maxLocalBytes, "maxLocalBytes"),
    enableTimeLimit: normalizeBoolean(policy.enableTimeLimit, "enableTimeLimit"),
    enableSpaceLimit: normalizeBoolean(policy.enableSpaceLimit, "enableSpaceLimit")
  };

  if (normalized.enableSpaceLimit && normalized.maxLocalBytes < 1024 * 1024) {
    throw commandError("BACKUP_POLICY_MAX_SPACE_TOO_SMALL", "maxLocalBytes must be at least 1 MiB when space limit is enabled", 400);
  }

  return normalized;
}

function normalizePositiveInteger(value, fieldName) {
  if (!Number.isInteger(value) || value < 1) {
    throw commandError("BACKUP_POLICY_FIELD_INVALID", fieldName + " must be a positive integer", 400);
  }
  return value;
}

function normalizeNonNegativeInteger(value, fieldName) {
  if (!Number.isInteger(value) || value < 0) {
    throw commandError("BACKUP_POLICY_FIELD_INVALID", fieldName + " must be a non-negative integer", 400);
  }
  return value;
}

function normalizeBoolean(value, fieldName) {
  if (typeof value !== "boolean") {
    throw commandError("BACKUP_POLICY_FIELD_INVALID", fieldName + " must be a boolean", 400);
  }
  return value;
}

function cloneBackupPolicy(policy) {
  return {
    retentionDays: policy.retentionDays,
    maxLocalBytes: policy.maxLocalBytes,
    enableTimeLimit: policy.enableTimeLimit,
    enableSpaceLimit: policy.enableSpaceLimit
  };
}

function isLikelyWindowsPlatform() {
  return typeof navigator === "object" &&
    typeof navigator.platform === "string" &&
    /^win/i.test(navigator.platform);
}

function resolveBridgeRuntimeRoot() {
  if (typeof ZoteroLocalMcpBridge === "object" &&
    ZoteroLocalMcpBridge &&
    typeof ZoteroLocalMcpBridge.runtimeRoot === "string" &&
    ZoteroLocalMcpBridge.runtimeRoot.trim().length > 0) {
    return ZoteroLocalMcpBridge.runtimeRoot;
  }

  var explicitEnv = getEnvironmentValue("ZOTERO_LOCAL_MCP_BRIDGE_RUNTIME_DIR");
  if (explicitEnv) {
    return explicitEnv;
  }

  var explicitPreference = getPreferenceValue(BRIDGE_RUNTIME_ROOT_PREFERENCE);
  if (explicitPreference && typeof explicitPreference === "string" && explicitPreference.trim().length > 0) {
    return explicitPreference;
  }

  var home = getEnvironmentValue("HOME") || getEnvironmentValue("USERPROFILE");
  if (isLikelyWindowsPlatform()) {
    var localAppData = getEnvironmentValue("LOCALAPPDATA");
    var appData = getEnvironmentValue("APPDATA");
    return PathUtils.join(appData || localAppData || home || "", "zotero-local-mcp-bridge");
  }

  if (typeof navigator === "object" && typeof navigator.platform === "string" && /^mac/i.test(navigator.platform)) {
    return PathUtils.join(home || "", "Library", "Application Support", "zotero-local-mcp-bridge");
  }

  var xdgState = getEnvironmentValue("XDG_STATE_HOME") || getEnvironmentValue("XDG_DATA_HOME") || (home ? PathUtils.join(home, ".local", "share") : "");
  return PathUtils.join(xdgState, "zotero-local-mcp-bridge");
}

function resolveAuthTokenPath() {
  return PathUtils.join(resolveBridgeRuntimeRoot(), "runtime", "auth", "bridge-token");
}

async function getExpectedAuthToken() {
  if (cachedExpectedAuthToken) {
    return cachedExpectedAuthToken;
  }

  if (typeof ZoteroLocalMcpBridge.expectedAuthToken === "string" && ZoteroLocalMcpBridge.expectedAuthToken.length >= 32) {
    cachedExpectedAuthToken = String(ZoteroLocalMcpBridge.expectedAuthToken);
    return cachedExpectedAuthToken;
  }

  var tokenPath = resolveAuthTokenPath();
  var token;
  try {
    token = await Zotero.File.getContentsAsync(tokenPath);
  } catch (error) {
    throw commandError("COMMAND_AUTH_TOKEN_MISSING", "Bridge auth token is missing from runtime config directory", 503);
  }

  var trimmed = String(token || "").trim();
  if (!trimmed || !/^[A-Za-z0-9_-]{32,}$/.test(trimmed)) {
    throw commandError("COMMAND_AUTH_TOKEN_INVALID", "Bridge auth token in runtime config directory is malformed", 503);
  }

  cachedExpectedAuthToken = trimmed;
  return trimmed;
}

function getEnvironmentValue(name) {
  if (typeof Components === "undefined" || !Components.interfaces || !Components.classes) {
    return undefined;
  }

  try {
    return Components.classes["@mozilla.org/process/environment;1"].getService(Components.interfaces.nsIEnvironment).get(name);
  } catch (error) {
    return undefined;
  }
}

function getPreferenceValue(name) {
  if (typeof Zotero === "undefined" || !Zotero.Prefs || !Zotero.Prefs.get) {
    return undefined;
  }

  try {
    var globalValue = Zotero.Prefs.get(name, true);
    if (globalValue !== undefined) {
      return globalValue;
    }
  } catch (error) {
    // Fall back to the older single-argument form below.
  }

  try {
    return Zotero.Prefs.get(name);
  } catch (error) {
    return undefined;
  }
}

function setPreferenceValue(name, value) {
  if (typeof Zotero === "undefined" || !Zotero.Prefs || !Zotero.Prefs.set) {
    return;
  }

  try {
    Zotero.Prefs.set(name, value, true);
  } catch (error) {
    try {
      Zotero.Prefs.set(name, value);
    } catch (fallbackError) {
      log("preference write failed for " + name);
    }
  }
}

function persistRuntimeRootPreference() {
  if (typeof ZoteroLocalMcpBridge.runtimeRoot !== "string" || ZoteroLocalMcpBridge.runtimeRoot.trim().length === 0) {
    return;
  }

  setPreferenceValue(BRIDGE_RUNTIME_ROOT_PREFERENCE, ZoteroLocalMcpBridge.runtimeRoot);
}

function backupRootPath() {
  var explicitPreference = getPreferenceValue(BRIDGE_BACKUP_ROOT_PREFERENCE);
  if (isAllowedBridgeOutputRoot(explicitPreference)) {
    return explicitPreference.trim();
  } else if (typeof explicitPreference === "string" && explicitPreference.trim().length > 0) {
    log("ignored unsafe backupRoot preference");
  }

  return PathUtils.join(resolveBridgeRuntimeRoot(), "runtime", "backups", "zotero-operations");
}

function backupSettingsFilePath() {
  return PathUtils.join(backupRootPath(), "settings.json");
}

function backupFilesRootPath() {
  return PathUtils.join(backupRootPath(), "files");
}

async function createBackupFileSnapshot(commandName, input) {
  if (!input.filePath) {
    return {
      available: false,
      reason: "file-path-missing"
    };
  }

  if (!(await fileExists(input.filePath))) {
    throw commandError("BACKUP_SOURCE_FILE_NOT_FOUND", "Backup source file was not found", 404);
  }

  var createdAt = new Date().toISOString();
  var backupId = "backup_" + randomId();
  var snapshotDir = PathUtils.join(backupFilesRootPath(), createdAt.slice(0, 10), backupId);
  var filename = sanitizeBackupFilename(input.filename || pathFilename(input.filePath));
  var backupFilePath = PathUtils.join(snapshotDir, filename);
  var manifestPath = PathUtils.join(snapshotDir, "manifest.json");

  await Zotero.File.createDirectoryIfMissingAsync(snapshotDir);
  await copyFileForBackup(input.filePath, backupFilePath);

  var bytes = undefined;
  try {
    if (typeof IOUtils !== "undefined" && IOUtils.stat) {
      var stat = await IOUtils.stat(backupFilePath);
      bytes = stat.size;
    }
  } catch (error) {
    bytes = undefined;
  }

  var manifest = {
    backupId: backupId,
    commandName: commandName,
    createdAt: createdAt,
    createdBy: ZoteroLocalMcpBridge.id,
    attachmentKey: input.attachmentKey,
    parentZoteroItemKey: input.parentZoteroItemKey,
    sourceFilePath: input.filePath,
    backupFilePath: backupFilePath,
    manifestPath: manifestPath,
    filename: filename,
    bytes: bytes
  };

  await Zotero.File.putContentsAsync(manifestPath, JSON.stringify(stripUndefined(manifest), null, 2) + "\n");

  return {
    backupId: backupId,
    available: true,
    createdAt: createdAt,
    sourceFilePath: input.filePath,
    backupFilePath: backupFilePath,
    manifestPath: manifestPath,
    filename: filename,
    bytes: bytes
  };
}

async function readBackupSnapshotList(input) {
  var limit = normalizeListLimit(input.limit, "backup.snapshot.list");
  var snapshotRoot = backupFilesRootPath();
  if (!(await fileExists(snapshotRoot))) {
    return {
      backupRoot: backupRootPath(),
      snapshotRoot: snapshotRoot,
      snapshots: []
    };
  }

  if (typeof IOUtils === "undefined" || !IOUtils.getChildren) {
    throw commandError("BACKUP_SNAPSHOT_LIST_UNSUPPORTED", "This Zotero runtime does not expose IOUtils.getChildren for backup snapshot listing", 500);
  }

  var snapshots = [];
  var dateDirs = await IOUtils.getChildren(snapshotRoot);
  for (var i = 0; i < dateDirs.length; i += 1) {
    var backupDirs = [];
    try {
      backupDirs = await IOUtils.getChildren(dateDirs[i]);
    } catch (error) {
      continue;
    }

    for (var j = 0; j < backupDirs.length; j += 1) {
      var manifestPath = PathUtils.join(backupDirs[j], "manifest.json");
      if (!(await fileExists(manifestPath))) {
        continue;
      }

      try {
        var manifest = JSON.parse(await Zotero.File.getContentsAsync(manifestPath));
        snapshots.push(normalizeBackupSnapshotRecord(manifest, manifestPath));
      } catch (error) {
        snapshots.push({
          backupId: pathFilename(backupDirs[j]),
          manifestPath: manifestPath,
          manifestReadable: false,
          error: error.message || String(error)
        });
      }
    }
  }

  snapshots.sort(function (left, right) {
    return Date.parse(right.createdAt || "") - Date.parse(left.createdAt || "");
  });

  return {
    backupRoot: backupRootPath(),
    snapshotRoot: snapshotRoot,
    snapshots: snapshots.slice(0, limit)
  };
}

function normalizeBackupSnapshotRecord(manifest, manifestPath) {
  return {
    backupId: manifest.backupId,
    commandName: manifest.commandName,
    createdAt: manifest.createdAt,
    createdBy: manifest.createdBy,
    attachmentKey: manifest.attachmentKey,
    parentZoteroItemKey: manifest.parentZoteroItemKey,
    sourceFilePath: manifest.sourceFilePath,
    backupFilePath: manifest.backupFilePath,
    manifestPath: manifest.manifestPath || manifestPath,
    filename: manifest.filename,
    bytes: manifest.bytes,
    manifestReadable: true
  };
}

async function createBackupSnapshotRestoreDryRun(input) {
  var normalized = await normalizeBackupSnapshotRestoreInput(input);
  return createWriteDryRunPlan(
    "backup.snapshot.restore",
    stripRuntimeFields(normalized),
    {
      zoteroItemKeys: normalized.parentZoteroItemKey ? [normalized.parentZoteroItemKey] : [],
      collectionKeys: [],
      attachmentKeys: normalized.attachmentKey ? [normalized.attachmentKey] : [],
      filePaths: [normalized.backupFilePath, normalized.targetFilePath],
      tags: []
    },
    [],
    {
      backupId: normalized.backupId,
      backupFilePath: normalized.backupFilePath,
      targetFilePath: normalized.targetFilePath,
      attachmentKey: normalized.attachmentKey,
      currentFilename: normalized.currentFilename
    },
    {
      action: "restore-file",
      targetFilePath: normalized.targetFilePath,
      sourceBackupFilePath: normalized.backupFilePath
    },
    "high"
  );
}

async function executeBackupSnapshotRestore(input, confirmation) {
  assertConfirmationPresent(confirmation);
  var normalized = await normalizeBackupSnapshotRestoreInput(input);
  validateStoredConfirmation(stripRuntimeFields(normalized), confirmation);

  await copyFileForBackup(normalized.backupFilePath, normalized.targetFilePath);

  return {
    backupId: normalized.backupId,
    restored: true,
    attachmentKey: normalized.attachmentKey,
    parentZoteroItemKey: normalized.parentZoteroItemKey,
    backupFilePath: normalized.backupFilePath,
    targetFilePath: normalized.targetFilePath,
    manifestPath: normalized.manifestPath,
    filename: normalized.currentFilename,
    bytes: normalized.bytes
  };
}

async function normalizeBackupSnapshotRestoreInput(input) {
  if (!input || typeof input !== "object") {
    throw commandError("BACKUP_SNAPSHOT_RESTORE_INPUT_INVALID", "backup.snapshot.restore input must be an object", 400);
  }
  if (typeof input.backupId !== "string" || input.backupId.trim().length === 0) {
    throw commandError("BACKUP_ID_REQUIRED", "backup.snapshot.restore requires a backupId", 400);
  }

  var snapshot = await findBackupSnapshotById(input.backupId.trim());
  if (!snapshot) {
    throw commandError("BACKUP_SNAPSHOT_NOT_FOUND", "Backup snapshot was not found", 404);
  }
  if (!snapshot.manifestReadable) {
    throw commandError("BACKUP_SNAPSHOT_MANIFEST_INVALID", "Backup snapshot manifest could not be read", 400);
  }
  if (!snapshot.attachmentKey) {
    throw commandError("BACKUP_SNAPSHOT_ATTACHMENT_REQUIRED", "Backup snapshot manifest is missing attachmentKey", 400);
  }
  if (!snapshot.backupFilePath || !(await fileExists(snapshot.backupFilePath))) {
    throw commandError("BACKUP_FILE_NOT_FOUND", "Backup snapshot file was not found", 404);
  }
  if (!snapshot.sourceFilePath) {
    throw commandError("BACKUP_SOURCE_PATH_REQUIRED", "Backup snapshot manifest is missing sourceFilePath", 400);
  }

  var attachment = normalizeAttachmentTarget(snapshot.attachmentKey);
  if (!attachment.isFileAttachment()) {
    throw commandError("BACKUP_RESTORE_ATTACHMENT_INVALID", "Backup restore requires a file attachment", 400);
  }
  if (attachment.deleted || (attachment.isInTrash && attachment.isInTrash())) {
    throw commandError("BACKUP_RESTORE_ATTACHMENT_TRASHED", "Backup restore cannot target a trashed attachment", 409);
  }

  var targetFilePath = await attachment.getFilePathAsync();
  if (!targetFilePath) {
    throw commandError("BACKUP_RESTORE_TARGET_MISSING", "Current attachment file path could not be resolved", 404);
  }
  if (normalizeFilePath(targetFilePath).toLowerCase() !== normalizeFilePath(snapshot.sourceFilePath).toLowerCase()) {
    throw commandError("BACKUP_RESTORE_TARGET_CHANGED", "Current attachment file path differs from the backup snapshot source path", 409);
  }

  var parentZoteroItemKey = undefined;
  if (attachment.parentKey) {
    parentZoteroItemKey = getLocalUserItem(attachment.parentKey).key;
  }

  return {
    backupId: snapshot.backupId,
    attachmentKey: attachment.key,
    parentZoteroItemKey: parentZoteroItemKey,
    backupFilePath: snapshot.backupFilePath,
    targetFilePath: targetFilePath,
    manifestPath: snapshot.manifestPath,
    currentFilename: attachment.attachmentFilename || pathFilename(targetFilePath),
    sourceFilePath: snapshot.sourceFilePath,
    bytes: snapshot.bytes
  };
}

async function findBackupSnapshotById(backupId) {
  var snapshots = await readBackupSnapshotList({ limit: 100 });
  for (var i = 0; i < snapshots.snapshots.length; i += 1) {
    if (snapshots.snapshots[i].backupId === backupId) {
      return snapshots.snapshots[i];
    }
  }
  return undefined;
}

async function createBackupSnapshotPruneDryRun(input) {
  var normalized = await normalizeBackupSnapshotPruneInput(input);
  return createWriteDryRunPlan(
    "backup.snapshot.prune",
    stripRuntimeFields(normalized),
    {
      zoteroItemKeys: [],
      collectionKeys: [],
      attachmentKeys: normalized.deleteSnapshots.map(function (snapshot) { return snapshot.attachmentKey; }).filter(Boolean),
      filePaths: normalized.deleteSnapshots.map(function (snapshot) { return snapshot.snapshotDir; }),
      tags: []
    },
    normalized.deleteSnapshots.length > 0 ? [{
      code: "BACKUP_SNAPSHOT_PRUNE_WILL_DELETE",
      message: "backup.snapshot.prune execute will delete project-local backup snapshot directories"
    }] : [],
    {
      policy: normalized.policy,
      snapshotCount: normalized.snapshotCount,
      totalBytes: normalized.totalBytes
    },
    {
      deleteCount: normalized.deleteSnapshots.length,
      deleteSnapshots: normalized.deleteSnapshots,
      freedBytes: normalized.freedBytes
    },
    "high"
  );
}

async function executeBackupSnapshotPrune(input, confirmation) {
  assertConfirmationPresent(confirmation);
  var normalized = await normalizeBackupSnapshotPruneInput(input);
  validateStoredConfirmation(stripRuntimeFields(normalized), confirmation);

  var deletedSnapshots = [];
  for (var i = 0; i < normalized.deleteSnapshots.length; i += 1) {
    var snapshot = normalized.deleteSnapshots[i];
    await removeBackupSnapshotDir(snapshot.snapshotDir);
    deletedSnapshots.push(snapshot);
  }

  return {
    policy: normalized.policy,
    snapshotCount: normalized.snapshotCount,
    deleteCount: deletedSnapshots.length,
    deletedSnapshots: deletedSnapshots,
    freedBytes: deletedSnapshots.reduce(function (sum, snapshot) {
      return sum + (snapshot.bytes || 0);
    }, 0)
  };
}

async function normalizeBackupSnapshotPruneInput(input) {
  if (!input || typeof input !== "object") {
    throw commandError("BACKUP_SNAPSHOT_PRUNE_INPUT_INVALID", "backup.snapshot.prune input must be an object", 400);
  }

  var settings = await readBackupSettings();
  var policy = settings.policy;
  var snapshots = (await readBackupSnapshotList({ limit: 100 })).snapshots
    .filter(function (snapshot) { return snapshot.manifestReadable; })
    .map(function (snapshot) {
      return addSnapshotPruneFields(snapshot);
    });
  var plan = planBackupSnapshotPrune(snapshots, policy);

  return {
    policy: policy,
    snapshotCount: snapshots.length,
    totalBytes: snapshots.reduce(function (sum, snapshot) { return sum + (snapshot.bytes || 0); }, 0),
    deleteSnapshots: plan.deleteSnapshots,
    freedBytes: plan.freedBytes
  };
}

function addSnapshotPruneFields(snapshot) {
  var snapshotDir = snapshot.manifestPath ? PathUtils.parent(snapshot.manifestPath) : undefined;
  return {
    backupId: snapshot.backupId,
    commandName: snapshot.commandName,
    createdAt: snapshot.createdAt,
    attachmentKey: snapshot.attachmentKey,
    backupFilePath: snapshot.backupFilePath,
    manifestPath: snapshot.manifestPath,
    snapshotDir: snapshotDir,
    bytes: snapshot.bytes || 0
  };
}

function planBackupSnapshotPrune(snapshots, policy) {
  var deleteById = {};
  var deleteSnapshots = [];
  var markDelete = function (snapshot, reason) {
    if (!snapshot.backupId || deleteById[snapshot.backupId]) {
      return;
    }
    deleteById[snapshot.backupId] = true;
    var record = cloneSnapshotPruneRecord(snapshot);
    record.reason = reason;
    deleteSnapshots.push(record);
  };

  if (policy.enableSpaceLimit) {
    var totalBytes = snapshots.reduce(function (sum, snapshot) { return sum + (snapshot.bytes || 0); }, 0);
    var oldestFirst = snapshots.slice().sort(function (left, right) {
      return Date.parse(left.createdAt || "") - Date.parse(right.createdAt || "");
    });
    for (var i = 0; i < oldestFirst.length && totalBytes > policy.maxLocalBytes; i += 1) {
      markDelete(oldestFirst[i], "space-limit");
      totalBytes -= oldestFirst[i].bytes || 0;
    }
  }

  if (policy.enableTimeLimit) {
    var cutoff = Date.now() - policy.retentionDays * 24 * 60 * 60 * 1000;
    snapshots.forEach(function (snapshot) {
      if (Date.parse(snapshot.createdAt || "") < cutoff) {
        markDelete(snapshot, "time-limit");
      }
    });
  }

  return {
    deleteSnapshots: deleteSnapshots,
    freedBytes: deleteSnapshots.reduce(function (sum, snapshot) { return sum + (snapshot.bytes || 0); }, 0)
  };
}

function cloneSnapshotPruneRecord(snapshot) {
  return {
    backupId: snapshot.backupId,
    commandName: snapshot.commandName,
    createdAt: snapshot.createdAt,
    attachmentKey: snapshot.attachmentKey,
    backupFilePath: snapshot.backupFilePath,
    manifestPath: snapshot.manifestPath,
    snapshotDir: snapshot.snapshotDir,
    bytes: snapshot.bytes || 0
  };
}

async function removeBackupSnapshotDir(snapshotDir) {
  if (!snapshotDir || !isPathInside(snapshotDir, backupFilesRootPath())) {
    throw commandError("BACKUP_SNAPSHOT_PRUNE_PATH_INVALID", "Refusing to delete a path outside the project backup snapshot root", 403);
  }
  if (typeof IOUtils === "undefined" || !IOUtils.remove) {
    throw commandError("BACKUP_SNAPSHOT_PRUNE_UNSUPPORTED", "This Zotero runtime does not expose IOUtils.remove for backup snapshot pruning", 500);
  }
  await IOUtils.remove(snapshotDir, { recursive: true, ignoreAbsent: true });
}

function isPathInside(candidatePath, rootPath) {
  var candidate = String(candidatePath).replace(/\\/g, "/").toLowerCase();
  var root = String(rootPath).replace(/\\/g, "/").toLowerCase();
  if (!root.endsWith("/")) {
    root += "/";
  }
  return candidate.indexOf(root) === 0;
}

async function copyFileForBackup(sourceFilePath, backupFilePath) {
  if (typeof IOUtils !== "undefined" && IOUtils.copy) {
    await IOUtils.copy(sourceFilePath, backupFilePath);
    return;
  }

  throw commandError("BACKUP_COPY_UNSUPPORTED", "This Zotero runtime does not expose IOUtils.copy for backup snapshots", 500);
}

function sanitizeBackupFilename(filename) {
  var value = String(filename || "attachment-file");
  var sanitized = "";
  var forbidden = '<>:"/\\|?*';
  for (var i = 0; i < value.length && sanitized.length < 180; i += 1) {
    var character = value.charAt(i);
    sanitized += character.charCodeAt(0) < 32 || forbidden.indexOf(character) !== -1 ? "_" : character;
  }
  return sanitized || "attachment-file";
}

function jsonCommandResponse(status, commandName, requestId, data, error, affected, auditPlanId) {
  var mergedAffected = mergeAffected(affected);
  var body = {
    ok: !error,
    commandName: commandName,
    requestId: requestId,
    affected: mergedAffected,
    data: data,
    error: error
  };

  schedulePluginAudit(commandName, requestId, status, data, error, mergedAffected, auditPlanId);

  return [
    status,
    "application/json",
    JSON.stringify(body)
  ];
}

function schedulePluginAudit(commandName, requestId, statusCode, data, error, affected, auditPlanId) {
  if (!isWriteCommandName(commandName)) {
    return;
  }

  var auditStatus = error ? "failed" : data && data.mode === "dry-run" ? "dry-run" : "executed";
  var event = {
    requestId: requestId,
    planId: auditPlanId || (data && data.plan ? data.plan.planId : undefined),
    commandName: commandName,
    status: auditStatus,
    timestamp: new Date().toISOString(),
    summary: commandName + " " + auditStatus,
    affected: {
      zoteroItemKeys: affected.zoteroItemKeys || [],
      collectionKeys: affected.collectionKeys || [],
      attachmentKeys: affected.attachmentKeys || [],
      filePaths: collectAuditFilePaths(data),
      tags: affected.tags || []
    },
    statusCode: statusCode,
    before: data && data.before ? toAuditJsonObject(data.before) : undefined,
    after: data && data.after ? toAuditJsonObject(data.after) : data && data.mode !== "dry-run" ? toAuditJsonObject(data) : undefined,
    error: error ? {
      code: error.code || "PLUGIN_COMMAND_FAILED",
      message: error.message || "Plugin command failed"
    } : undefined
  };

  writePluginAuditEvent(event).catch(function (auditError) {
    log("audit write failed: " + (auditError.message || auditError));
  });
}

async function writePluginAuditEvent(event) {
  var auditDir = auditRootPath();
  await Zotero.File.createDirectoryIfMissingAsync(auditDir);
  var filePath = auditFilePathForDate(event.timestamp.slice(0, 10));
  var existing = "";
  if (await fileExists(filePath)) {
    existing = await Zotero.File.getContentsAsync(filePath);
  }
  await Zotero.File.putContentsAsync(filePath, existing + JSON.stringify(stripUndefined(event)) + "\n");
}

async function readAuditList(input) {
  var limit = normalizeAuditLimit(input.limit);
  var date = normalizeAuditDate(input.date);
  var filePath = auditFilePathForDate(date);
  if (!(await fileExists(filePath))) {
    return {
      filePath: filePath,
      events: [],
      entries: []
    };
  }

  var contents = await Zotero.File.getContentsAsync(filePath);
  var lines = contents.split(/\r?\n/).filter(function (line) {
    return line.trim().length > 0;
  });
  var entries = lines.slice(Math.max(0, lines.length - limit)).map(function (line) {
    return JSON.parse(line);
  });

  return {
    filePath: filePath,
    events: entries,
    entries: entries
  };
}

function auditRootPath() {
  var explicitPreference = getPreferenceValue(BRIDGE_AUDIT_ROOT_PREFERENCE);
  if (isAllowedBridgeOutputRoot(explicitPreference)) {
    return explicitPreference.trim();
  } else if (typeof explicitPreference === "string" && explicitPreference.trim().length > 0) {
    log("ignored unsafe auditRoot preference");
  }

  return PathUtils.join(resolveBridgeRuntimeRoot(), "runtime", "logs", "audit");
}

function isAllowedBridgeOutputRoot(candidatePath) {
  if (typeof candidatePath !== "string" || candidatePath.trim().length === 0) {
    return false;
  }

  var candidate = normalizePathForComparison(candidatePath);
  var unsafeRoots = getUnsafeBridgeOutputRoots().map(normalizePathForComparison).filter(Boolean);
  for (var i = 0; i < unsafeRoots.length; i += 1) {
    if (candidate === unsafeRoots[i] || candidate.indexOf(unsafeRoots[i] + "/") === 0) {
      return false;
    }
  }
  return true;
}

function getUnsafeBridgeOutputRoots() {
  var roots = [
    PathUtils.join(resolveBridgeRuntimeRoot(), "ZoteroProfile"),
    PathUtils.join(resolveBridgeRuntimeRoot(), "ZoteroData"),
    PathUtils.join(resolveBridgeRuntimeRoot(), "ZoteroVault")
  ];

  try {
    if (Zotero.DataDirectory && Zotero.DataDirectory.dir) {
      roots.push(Zotero.DataDirectory.dir);
      roots.push(PathUtils.join(Zotero.DataDirectory.dir, "storage"));
    }
  } catch (error) {
    // Best-effort safety root detection.
  }

  try {
    var linkedAttachmentRoot = Zotero.Prefs.get("baseAttachmentPath", true) || Zotero.Prefs.get("baseAttachmentPath");
    if (typeof linkedAttachmentRoot === "string" && linkedAttachmentRoot.trim().length > 0) {
      roots.push(linkedAttachmentRoot);
    }
  } catch (error) {
    // Best-effort safety root detection.
  }

  return roots;
}

function normalizePathForComparison(value) {
  if (typeof value !== "string") {
    return "";
  }
  var normalized = value.trim().replace(/\\/g, "/").replace(/\/+$/, "").toLowerCase();
  return normalized;
}

function auditFilePathForDate(date) {
  return PathUtils.join(auditRootPath(), date + ".jsonl");
}

function normalizeAuditLimit(limit) {
  return normalizeListLimit(limit, "audit.list", "AUDIT_LIMIT_INVALID");
}

function normalizeListLimit(limit, commandName, errorCode) {
  if (limit === undefined || limit === null) {
    return 20;
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw commandError(errorCode || "LIST_LIMIT_INVALID", commandName + " limit must be an integer from 1 to 100", 400);
  }
  return limit;
}

function normalizeAuditDate(date) {
  if (date === undefined || date === null) {
    return new Date().toISOString().slice(0, 10);
  }
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw commandError("AUDIT_DATE_INVALID", "audit.list date must use YYYY-MM-DD format", 400);
  }
  return date;
}

async function findBridgeAttachmentAddAudit(attachmentKey) {
  var dates = recentAuditDates();
  for (var i = 0; i < dates.length; i += 1) {
    var filePath = auditFilePathForDate(dates[i]);
    if (!(await fileExists(filePath))) {
      continue;
    }

    var contents = await Zotero.File.getContentsAsync(filePath);
    var lines = contents.split(/\r?\n/).filter(function (line) {
      return line.trim().length > 0;
    });
    for (var j = lines.length - 1; j >= 0; j -= 1) {
      var event;
      try {
        event = JSON.parse(lines[j]);
      } catch (error) {
        continue;
      }
      if (isAttachmentAddAuditForKey(event, attachmentKey)) {
        return {
          requestId: event.requestId,
          planId: event.planId,
          timestamp: event.timestamp
        };
      }
    }
  }

  return false;
}

function recentAuditDates() {
  var dates = [];
  for (var i = 0; i < 2; i += 1) {
    var date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    if (dates.indexOf(date) === -1) {
      dates.push(date);
    }
  }
  return dates;
}

function isAttachmentAddAuditForKey(event, attachmentKey) {
  if (!event || event.commandName !== "attachment.addFile" || event.status !== "executed") {
    return false;
  }

  var affectedKeys = event.affected && Array.isArray(event.affected.attachmentKeys)
    ? event.affected.attachmentKeys
    : [];
  if (affectedKeys.indexOf(attachmentKey) !== -1) {
    return true;
  }

  return !!(
    event.after &&
    (
      event.after.attachmentKey === attachmentKey ||
      (event.after.attachment && event.after.attachment.attachmentKey === attachmentKey)
    )
  );
}

function isWriteCommandName(commandName) {
  return !!ZoteroLocalMcpBridgeWriteCommands[commandName];
}

function collectAuditFilePaths(value) {
  var paths = [];
  collectAuditFilePathsRecursive(value, paths);
  return paths.filter(function (filePath, index) {
    return paths.indexOf(filePath) === index;
  });
}

function collectAuditFilePathsRecursive(value, paths) {
  if (!value || typeof value !== "object") {
    return;
  }
  if (typeof value.filePath === "string") {
    paths.push(value.filePath);
  }
  Object.keys(value).forEach(function (key) {
    collectAuditFilePathsRecursive(value[key], paths);
  });
}

function toAuditJsonObject(value) {
  return JSON.parse(JSON.stringify(stripUndefined(value)));
}

function stripUndefined(value) {
  if (Array.isArray(value)) {
    return value.map(stripUndefined);
  }
  if (value && typeof value === "object") {
    var result = {};
    Object.keys(value).forEach(function (key) {
      if (value[key] !== undefined) {
        result[key] = stripUndefined(value[key]);
      }
    });
    return result;
  }
  return value;
}

function mergeAffected(affected) {
  var empty = emptyAffected();
  if (!affected) {
    return empty;
  }

  return {
    zoteroItemKeys: affected.zoteroItemKeys || empty.zoteroItemKeys,
    collectionKeys: affected.collectionKeys || empty.collectionKeys,
    attachmentKeys: affected.attachmentKeys || empty.attachmentKeys,
    tags: affected.tags || empty.tags
  };
}

function getHeader(headers, name) {
  if (headers[name]) {
    return headers[name];
  }

  var lowerName = name.toLowerCase();
  for (var key in headers) {
    if (Object.prototype.hasOwnProperty.call(headers, key) && key.toLowerCase() === lowerName) {
      return headers[key];
    }
  }

  return undefined;
}

function emptyAffected() {
  return {
    zoteroItemKeys: [],
    collectionKeys: [],
    attachmentKeys: [],
    tags: []
  };
}

async function unregisterEndpoints() {
  if (typeof Zotero === "undefined" || !Zotero.Server || !Zotero.Server.Endpoints) {
    return;
  }

  for (var i = 0; i < ZoteroLocalMcpBridge.registeredPaths.length; i += 1) {
    delete Zotero.Server.Endpoints[ZoteroLocalMcpBridge.registeredPaths[i]];
  }
  ZoteroLocalMcpBridge.registeredPaths = [];
}

