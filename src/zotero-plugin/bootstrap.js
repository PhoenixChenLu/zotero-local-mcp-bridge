/* eslint-disable @typescript-eslint/no-unused-vars */
/* global IOUtils, PathUtils, Zotero, Components, __ZOTERO_CODEX_BRIDGE_AUTH_TOKEN__, __ZOTERO_CODEX_BRIDGE_RUNTIME_ROOT__, navigator */

var ZoteroCodexBridge = {
  id: "zotero-codex-bridge@example.com",
  version: "0.1.37",
  healthPath: "/zotero-codex-bridge/health",
  commandPath: "/zotero-codex-bridge/command",
  authHeader: "x-zotero-codex-bridge-token",
  expectedAuthToken: __ZOTERO_CODEX_BRIDGE_AUTH_TOKEN__,
  runtimeRoot: __ZOTERO_CODEX_BRIDGE_RUNTIME_ROOT__,
  dryRunTtlMs: 30 * 60 * 1000,
  confirmations: {},
  started: false,
  registeredPaths: []
};

var cachedExpectedAuthToken;

var TEST_PROFILE_MARKER_FILE = ".zotero-codex-bridge-test-profile";
var REAL_PROFILE_UNLOCK_DEFAULT_TTL_MINUTES = 30;
var REAL_PROFILE_UNLOCK_MAX_TTL_MINUTES = 120;
var REAL_PROFILE_UNLOCK_CONFIRMATION = "I understand and authorize temporary real-library write access";
var REAL_PROFILE_PREFERENCE_MODE = "extensions.zotero-codex-bridge.profileMode";
var REAL_PROFILE_DEFAULT_MODE = "real-locked";
var REAL_PROFILE_STATE_PATH_PARTS = ["runtime", "safety", "real-profile-state.json"];
var EXPORT_TRANSLATOR_IDS = {
  bibtex: "9cb70025-a888-4a29-a210-93ec52da40d4",
  ris: "32d59d2d-b65a-4da4-b0a3-bdd3cfb979e7",
  cslJson: "bc03b4fe-436d-4a1f-ba59-de4d2d7a63f7"
};

var ZoteroCodexBridgeSafetyStateCommands = {
  "safety.unlockRealProfile": true,
  "safety.lockRealProfile": true
};

var ZoteroCodexBridgeDefaultBackupPolicy = {
  retentionDays: 30,
  maxLocalBytes: 10 * 1024 * 1024 * 1024,
  enableTimeLimit: true,
  enableSpaceLimit: true
};

var ZoteroCodexBridgeProfileWriteCommands = {
  "collection.create": true,
  "collection.rename": true,
  "collection.move": true,
  "collection.addItems": true,
  "collection.removeItems": true,
  "item.create": true,
  "item.updateFields": true,
  "item.updateCreators": true,
  "item.setCollections": true,
  "item.updateTags": true,
  "import.bibtex": true,
  "import.ris": true,
  "import.cslJson": true,
  "note.createChild": true,
  "attachment.addFile": true,
  "attachment.moveToItem": true,
  "attachment.rename": true,
  "attachment.runZoteroRename": true,
  "attachment.undoAdded": true,
  "attachment.renamePreferences.set": true,
  "backup.settings.set": true,
  "backup.snapshot.restore": true,
  "backup.snapshot.prune": true
};

var ZoteroCodexBridgeWriteCommands = {
  "collection.create": true,
  "collection.rename": true,
  "collection.move": true,
  "collection.addItems": true,
  "collection.removeItems": true,
  "item.create": true,
  "item.updateFields": true,
  "item.updateCreators": true,
  "item.setCollections": true,
  "item.updateTags": true,
  "import.bibtex": true,
  "import.ris": true,
  "import.cslJson": true,
  "note.createChild": true,
  "attachment.addFile": true,
  "attachment.moveToItem": true,
  "attachment.rename": true,
  "attachment.runZoteroRename": true,
  "attachment.undoAdded": true,
  "attachment.renamePreferences.set": true,
  "backup.settings.set": true,
  "backup.snapshot.restore": true,
  "backup.snapshot.prune": true,
  "safety.unlockRealProfile": true,
  "safety.lockRealProfile": true
};

function log(message) {
  if (typeof Zotero !== "undefined" && Zotero.debug) {
    Zotero.debug(`Zotero Codex Bridge: ${message}`);
  }
}

function install() {
  log("installed");
}

function startup() {
  ZoteroCodexBridge.started = true;
  registerHealthEndpoint();
  registerCommandEndpoint();
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
  ZoteroCodexBridge.started = false;
  log("stopped");
}

function uninstall() {
  log("uninstalled");
}

function registerHealthEndpoint() {
  if (typeof Zotero === "undefined" || !Zotero.Server || !Zotero.Server.Endpoints) {
    log("server unavailable for health endpoint");
    return;
  }

  var endpoint = Zotero.Server.Endpoints[ZoteroCodexBridge.healthPath] = function () {};
  endpoint.prototype = {
    supportedMethods: ["GET"],
    init: async function (req) {
      log(`health endpoint ${req.method}`);
      return [
        200,
        "text/plain",
        "zotero-codex-bridge ok " + ZoteroCodexBridge.version + " zotero-codex-bridge@example.com test"
      ];
    }
  };
  ZoteroCodexBridge.registeredPaths.push(ZoteroCodexBridge.healthPath);
}

function registerCommandEndpoint() {
  if (typeof Zotero === "undefined" || !Zotero.Server || !Zotero.Server.Endpoints) {
    log("server unavailable for command endpoint");
    return;
  }

  var endpoint = Zotero.Server.Endpoints[ZoteroCodexBridge.commandPath] = function () {};
  endpoint.prototype = {
    supportedMethods: ["POST"],
    init: async function (req) {
      log(`command endpoint ${req.method}`);
      var contentType = getHeader(req.headers || {}, "content-type");
      var authToken = getHeader(req.headers || {}, ZoteroCodexBridge.authHeader);

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

      if (!authToken) {
        return jsonCommandResponse(401, "unknown", "unknown", undefined, {
          code: "COMMAND_AUTH_REQUIRED",
          message: "Command endpoint requires local auth token"
        });
      }

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
      var testProfileMarkerPresent;
      try {
        profileMode = await getProfileMode();
        testProfileMarkerPresent = await isTestProfileMarkerPresent();
      } catch (error) {
        return jsonCommandResponse(error.status || 500, commandName, requestId, undefined, {
          code: error.code || "COMMAND_CONTEXT_FAILED",
          message: error.message || "Failed to read Zotero Codex Bridge command context"
        });
      }

      if (ZoteroCodexBridgeProfileWriteCommands[commandName] && !ZoteroCodexBridgeSafetyStateCommands[commandName]) {
        try {
          assertProfileWritePermission(profileMode, testProfileMarkerPresent, commandName);
        } catch (error) {
          return jsonCommandResponse(error.status || 403, commandName, requestId, undefined, {
            code: error.code || "PROFILE_WRITE_FORBIDDEN",
            message: error.message || "Profile write guard blocked this command"
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
          return jsonCommandResponse(error.status || 400, commandName, requestId, undefined, {
            code: error.code || "REAL_PROFILE_UNLOCK_FAILED",
            message: error.message || "Failed to unlock real-profile write access"
          });
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
            message: error.message || "Failed to read Zotero Codex Bridge backup settings"
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
            message: error.message || "Failed to set Zotero Codex Bridge backup settings"
          });
        }
      }

      if (commandName === "backup.snapshot.list") {
        try {
          return jsonCommandResponse(200, commandName, requestId, await readBackupSnapshotList(payload.input || {}));
        } catch (error) {
          return jsonCommandResponse(error.status || 400, commandName, requestId, undefined, {
            code: error.code || "BACKUP_SNAPSHOT_LIST_FAILED",
            message: error.message || "Failed to read Zotero Codex Bridge backup snapshots"
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
            message: error.message || "Failed to restore Zotero Codex Bridge backup snapshot"
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
            message: error.message || "Failed to prune Zotero Codex Bridge backup snapshots"
          });
        }
      }

      if (commandName === "audit.list") {
        try {
          return jsonCommandResponse(200, commandName, requestId, await readAuditList(payload.input || {}));
        } catch (error) {
          return jsonCommandResponse(error.status || 400, commandName, requestId, undefined, {
            code: error.code || "AUDIT_LIST_FAILED",
            message: error.message || "Failed to read Zotero Codex Bridge audit log"
          });
        }
      }

      return jsonCommandResponse(501, commandName, requestId, undefined, {
        code: "COMMAND_ENDPOINT_NOT_IMPLEMENTED",
        message: "Only collection getTree/getItems/create/rename/move/addItems/removeItems, item get/search/updateTags, note.createChild, attachment get/getForItem/add/move/rename/runZoteroRename/undoAdded, attachment rename preferences, backup settings/snapshot list/restore/prune, audit.list, and safety.getProfileStatus/unlockRealProfile/lockRealProfile are connected in this runtime build"
      });
    }
  };
  ZoteroCodexBridge.registeredPaths.push(ZoteroCodexBridge.commandPath);
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

async function getProfileStatusResponse(context) {
  var profileMode = context.profileMode || REAL_PROFILE_DEFAULT_MODE;
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
    testProfileMarkerPresent: !!context.testProfileMarkerPresent,
    isRealUnlocked: unlockActive,
    profileFingerprint: profileFingerprint,
    unlockExpiresAt: unlockExpiresAt,
    unlockTtlMinutes: unlockTtlMinutes,
    auditPath: auditRootPath(),
    backupPath: backupRootPath()
  };
}

async function executeSafetyUnlockRealProfile(input) {
  var normalized = normalizeSafetyUnlockInput(input);
  var actualFingerprint = resolveProfileFingerprint();
  if (normalized.profileFingerprint !== actualFingerprint) {
    throw commandError("PROFILE_UNLOCK_FINGERPRINT_MISMATCH", "Profile fingerprint does not match the current profile", 409);
  }

  var profileMode = await getProfileMode();
  if (profileMode === "readonly") {
    throw commandError("PROFILE_UNLOCK_FORBIDDEN", "Readonly mode cannot be unlocked for real-profile writes", 403);
  }

  if (profileMode === "test") {
    throw commandError("PROFILE_UNLOCK_FORBIDDEN", "Test mode does not require real-profile unlock", 409);
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
    throw commandError("REAL_PROFILE_UNLOCK_INPUT_INVALID", "safety.unlockRealProfile input must be an object", 400);
  }

  var profileFingerprint = trimString(input.profileFingerprint);
  if (!profileFingerprint) {
    throw commandError("REAL_PROFILE_UNLOCK_FINGERPRINT_REQUIRED", "safety.unlockRealProfile requires profileFingerprint", 400);
  }

  if (typeof input.confirmationText !== "string" || input.confirmationText !== REAL_PROFILE_UNLOCK_CONFIRMATION) {
    throw commandError("PROFILE_UNLOCK_CONFIRMATION_REQUIRED", "safety.unlockRealProfile requires exact confirmation text", 400);
  }

  var ttlMinutes;
  if (input.ttlMinutes === undefined || input.ttlMinutes === null) {
    ttlMinutes = REAL_PROFILE_UNLOCK_DEFAULT_TTL_MINUTES;
  } else if (!Number.isInteger(input.ttlMinutes) || input.ttlMinutes < 1) {
    throw commandError("REAL_PROFILE_UNLOCK_TTL_INVALID", "ttlMinutes must be a positive integer", 400);
  } else if (input.ttlMinutes > REAL_PROFILE_UNLOCK_MAX_TTL_MINUTES) {
    throw commandError(
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

  return await fileExists(PathUtils.join(profileDir, TEST_PROFILE_MARKER_FILE));
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

  var importedItems = await runZoteroItemImport(normalized.content, normalized.translatorID);
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

function runZoteroItemImport(content, translatorID) {
  if (!Zotero.loadTranslator) {
    throw commandError("ITEM_IMPORT_UNSUPPORTED", "This Zotero runtime does not expose Zotero.loadTranslator", 500);
  }

  return new Promise(function (resolve, reject) {
    var importedItems = [];
    var translation = Zotero.loadTranslator("import");
    translation.setTranslator(translatorID);
    translation.setString(content);
    translation.setHandler("itemDone", function (_, item) {
      importedItems.push(item);
    });
    translation.setHandler("done", function () {
      resolve(importedItems);
    });
    translation.setHandler("error", function (_, error) {
      reject(commandError("ITEM_IMPORT_FAILED", error && error.message ? error.message : "Zotero import translator failed", 500));
    });
    translation.translate();
  });
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

function createWriteDryRunPlan(operation, normalizedInput, resolvedTargets, warnings, before, after) {
  var inputHash = hashInput(normalizedInput);
  var expiresAt = new Date(Date.now() + ZoteroCodexBridge.dryRunTtlMs).toISOString();
  var planId = "plan_" + randomId();
  var confirmationToken = "confirm_" + randomId();

  ZoteroCodexBridge.confirmations[planId] = {
    inputHash: inputHash,
    confirmationToken: confirmationToken,
    expiresAt: expiresAt
  };

  return {
    mode: "dry-run",
    plan: {
      planId: planId,
      operation: operation,
      riskLevel: "low",
      inputHash: inputHash,
      resolvedTargets: resolvedTargets,
      warnings: warnings || [],
      requiresBackup: true,
      expiresAt: expiresAt,
      confirmation: {
        token: confirmationToken,
        expiresAt: expiresAt
      }
    },
    before: before,
    after: after
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

function uniqueStrings(values) {
  var seen = {};
  var result = [];
  values.forEach(function (value) {
    if (!seen[value]) {
      seen[value] = true;
      result.push(value);
    }
  });
  return result;
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
    sourceAuditTimestamp: true
  };
  Object.keys(input).forEach(function (key) {
    if (key.indexOf("current") !== 0 && !runtimeFields[key]) {
      stripped[key] = input[key];
    }
  });
  return stripped;
}

function validateStoredConfirmation(input, confirmation) {
  var stored = ZoteroCodexBridge.confirmations[confirmation.planId];
  if (!stored) {
    throw commandError("PLAN_NOT_FOUND", "Dry-run plan was not found", 404);
  }

  if (new Date(stored.expiresAt).getTime() < Date.now()) {
    delete ZoteroCodexBridge.confirmations[confirmation.planId];
    throw commandError("PLAN_EXPIRED", "Dry-run plan has expired", 410);
  }

  if (stored.inputHash !== hashInput(input)) {
    throw commandError("PLAN_INPUT_CHANGED", "Dry-run input hash does not match execute input", 409);
  }

  if (stored.confirmationToken !== confirmation.confirmationToken) {
    throw commandError("CONFIRMATION_TOKEN_INVALID", "Confirmation token is invalid", 403);
  }

  delete ZoteroCodexBridge.confirmations[confirmation.planId];
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

function commandError(code, message, status) {
  var error = new Error(message);
  error.code = code;
  error.status = status;
  return error;
}

async function readBackupSettings() {
  var filePath = backupSettingsFilePath();
  if (!(await fileExists(filePath))) {
    return {
      policy: cloneBackupPolicy(ZoteroCodexBridgeDefaultBackupPolicy),
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
    updatedBy: ZoteroCodexBridge.id
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
  if (typeof ZoteroCodexBridge === "object" &&
    ZoteroCodexBridge &&
    typeof ZoteroCodexBridge.runtimeRoot === "string" &&
    ZoteroCodexBridge.runtimeRoot.trim().length > 0) {
    return ZoteroCodexBridge.runtimeRoot;
  }

  var explicitEnv = getEnvironmentValue("ZOTERO_CODEX_BRIDGE_RUNTIME_DIR");
  if (explicitEnv) {
    return explicitEnv;
  }

  var explicitPreference = getPreferenceValue("extensions.zotero-codex-bridge.runtimeRoot");
  if (explicitPreference && typeof explicitPreference === "string" && explicitPreference.trim().length > 0) {
    return explicitPreference;
  }

  var home = getEnvironmentValue("HOME") || getEnvironmentValue("USERPROFILE");
  if (isLikelyWindowsPlatform()) {
    var localAppData = getEnvironmentValue("LOCALAPPDATA");
    var appData = getEnvironmentValue("APPDATA");
    return PathUtils.join(appData || localAppData || home || "", "zotero-codex-bridge");
  }

  if (typeof navigator === "object" && typeof navigator.platform === "string" && /^mac/i.test(navigator.platform)) {
    return PathUtils.join(home || "", "Library", "Application Support", "zotero-codex-bridge");
  }

  var xdgState = getEnvironmentValue("XDG_STATE_HOME") || getEnvironmentValue("XDG_DATA_HOME") || (home ? PathUtils.join(home, ".local", "share") : "");
  return PathUtils.join(xdgState, "zotero-codex-bridge");
}

function resolveAuthTokenPath() {
  return PathUtils.join(resolveBridgeRuntimeRoot(), "runtime", "auth", "bridge-token");
}

async function getExpectedAuthToken() {
  if (cachedExpectedAuthToken) {
    return cachedExpectedAuthToken;
  }

  if (typeof ZoteroCodexBridge.expectedAuthToken === "string" && ZoteroCodexBridge.expectedAuthToken.length >= 32) {
    cachedExpectedAuthToken = String(ZoteroCodexBridge.expectedAuthToken);
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
    return Zotero.Prefs.get(name);
  } catch (error) {
    return undefined;
  }
}

function backupRootPath() {
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
    createdBy: ZoteroCodexBridge.id,
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
    }
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
    }
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
  return PathUtils.join(resolveBridgeRuntimeRoot(), "runtime", "logs", "audit");
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
  return !!ZoteroCodexBridgeWriteCommands[commandName];
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

function unregisterEndpoints() {
  if (typeof Zotero === "undefined" || !Zotero.Server || !Zotero.Server.Endpoints) {
    return;
  }

  for (var i = 0; i < ZoteroCodexBridge.registeredPaths.length; i += 1) {
    delete Zotero.Server.Endpoints[ZoteroCodexBridge.registeredPaths[i]];
  }
  ZoteroCodexBridge.registeredPaths = [];
}
