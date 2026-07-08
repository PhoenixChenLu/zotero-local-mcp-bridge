export const MAX_BATCH_OBJECTS = 50;

export type ProfileMode = "readonly" | "test" | "real-locked" | "real-unlocked";

export type CommandName =
  | "collection.create"
  | "collection.rename"
  | "collection.move"
  | "collection.getTree"
  | "collection.getItems"
  | "collection.addItems"
  | "collection.removeItems"
  | "item.get"
  | "item.search"
  | "search.advanced"
  | "savedSearch.list"
  | "savedSearch.get"
  | "savedSearch.create"
  | "savedSearch.update"
  | "citation.format"
  | "item.create"
  | "item.updateFields"
  | "item.updateCreators"
  | "item.setCollections"
  | "item.updateTags"
  | "item.trash"
  | "import.bibtex"
  | "import.ris"
  | "import.cslJson"
  | "export.bibtex"
  | "export.ris"
  | "export.cslJson"
  | "annotation.list"
  | "annotation.create"
  | "annotation.update"
  | "note.createChild"
  | "attachment.get"
  | "attachment.getForItem"
  | "attachment.addFile"
  | "pdf.addAndRecognize"
  | "pdf.addAndRecognizeBatch"
  | "attachment.recognizeMetadata"
  | "attachment.moveToItem"
  | "attachment.rename"
  | "attachment.runZoteroRename"
  | "attachment.undoAdded"
  | "attachment.trash"
  | "attachment.renamePreferences.get"
  | "attachment.renamePreferences.set"
  | "backup.settings.get"
  | "backup.settings.set"
  | "backup.snapshot.list"
  | "backup.snapshot.restore"
  | "backup.snapshot.prune"
  | "collection.trash"
  | "duplicates.find"
  | "duplicates.merge"
  | "audit.list";

export type CommandDefinition = {
  name: CommandName;
  write: boolean;
  inputFields: readonly string[];
  /** Commands that mutate the Zotero profile/library (including test profile writes). */
  profileWrite?: true;
};

export const COMMAND_DEFINITIONS = [
  { name: "collection.create", write: true, profileWrite: true, inputFields: ["libraryScope", "name", "parentCollectionKey"] },
  { name: "collection.rename", write: true, profileWrite: true, inputFields: ["collectionKey", "name"] },
  { name: "collection.move", write: true, profileWrite: true, inputFields: ["collectionKey", "parentCollectionKey"] },
  { name: "collection.getTree", write: false, inputFields: ["libraryScope"] },
  { name: "collection.getItems", write: false, inputFields: ["collectionKey"] },
  { name: "collection.addItems", write: true, profileWrite: true, inputFields: ["collectionKey", "zoteroItemKeys"] },
  { name: "collection.removeItems", write: true, profileWrite: true, inputFields: ["collectionKey", "zoteroItemKeys"] },
  { name: "item.get", write: false, inputFields: ["zoteroItemKey"] },
  { name: "item.search", write: false, inputFields: ["query", "itemType", "collectionKey", "tag", "limit"] },
  { name: "search.advanced", write: false, inputFields: ["conditions", "joinMode", "includeChildren", "includeDeleted", "limit"] },
  { name: "savedSearch.list", write: false, inputFields: [] },
  { name: "savedSearch.get", write: false, inputFields: ["savedSearchKey"] },
  { name: "savedSearch.create", write: true, profileWrite: true, inputFields: ["name", "conditions", "joinMode"] },
  { name: "savedSearch.update", write: true, profileWrite: true, inputFields: ["savedSearchKey", "name", "conditions", "joinMode"] },
  { name: "citation.format", write: false, inputFields: ["zoteroItemKeys", "style", "locale", "mode", "linkwrap"] },
  { name: "item.create", write: true, profileWrite: true, inputFields: ["libraryScope", "itemType", "fields", "creators", "collectionKeys", "tags"] },
  { name: "item.updateFields", write: true, profileWrite: true, inputFields: ["zoteroItemKey", "fields"] },
  { name: "item.updateCreators", write: true, profileWrite: true, inputFields: ["zoteroItemKey", "creators"] },
  { name: "item.setCollections", write: true, profileWrite: true, inputFields: ["zoteroItemKey", "collectionKeys"] },
  { name: "item.updateTags", write: true, profileWrite: true, inputFields: ["zoteroItemKey", "addTags", "removeTags"] },
  { name: "item.trash", write: true, profileWrite: true, inputFields: ["zoteroItemKeys"] },
  { name: "import.bibtex", write: true, profileWrite: true, inputFields: ["content", "collectionKeys", "tags"] },
  { name: "import.ris", write: true, profileWrite: true, inputFields: ["content", "collectionKeys", "tags"] },
  { name: "import.cslJson", write: true, profileWrite: true, inputFields: ["content", "collectionKeys", "tags"] },
  { name: "export.bibtex", write: false, inputFields: ["zoteroItemKeys"] },
  { name: "export.ris", write: false, inputFields: ["zoteroItemKeys"] },
  { name: "export.cslJson", write: false, inputFields: ["zoteroItemKeys"] },
  { name: "annotation.list", write: false, inputFields: ["attachmentKey", "includeTrashed"] },
  { name: "annotation.create", write: true, profileWrite: true, inputFields: ["attachmentKey", "annotationType", "annotationText", "annotationComment", "annotationColor", "annotationPageLabel", "annotationSortIndex", "annotationPosition"] },
  { name: "annotation.update", write: true, profileWrite: true, inputFields: ["annotationKey", "annotationText", "annotationComment", "annotationColor", "annotationPageLabel", "annotationSortIndex", "annotationPosition"] },
  { name: "note.createChild", write: true, profileWrite: true, inputFields: ["zoteroItemKey", "content", "contentFormat"] },
  { name: "attachment.get", write: false, inputFields: ["attachmentKey"] },
  { name: "attachment.getForItem", write: false, inputFields: ["zoteroItemKey"] },
  { name: "attachment.addFile", write: true, profileWrite: true, inputFields: ["zoteroItemKey", "filePath", "attachmentMode"] },
  { name: "pdf.addAndRecognize", write: true, profileWrite: true, inputFields: ["filePath", "attachmentMode", "collectionKeys"] },
  { name: "pdf.addAndRecognizeBatch", write: true, profileWrite: true, inputFields: ["filePaths", "attachmentMode", "collectionKeys"] },
  { name: "attachment.recognizeMetadata", write: true, profileWrite: true, inputFields: ["attachmentKey"] },
  { name: "attachment.moveToItem", write: true, profileWrite: true, inputFields: ["attachmentKey", "targetZoteroItemKey"] },
  { name: "attachment.rename", write: true, profileWrite: true, inputFields: ["attachmentKey", "title", "renameFile"] },
  { name: "attachment.runZoteroRename", write: true, profileWrite: true, inputFields: ["attachmentKey"] },
  { name: "attachment.undoAdded", write: true, profileWrite: true, inputFields: ["attachmentKey"] },
  { name: "attachment.trash", write: true, profileWrite: true, inputFields: ["attachmentKeys"] },
  { name: "attachment.renamePreferences.get", write: false, inputFields: [] },
  { name: "attachment.renamePreferences.set", write: true, profileWrite: true, inputFields: ["preferences"] },
  { name: "backup.settings.get", write: false, inputFields: [] },
  { name: "backup.settings.set", write: true, profileWrite: true, inputFields: ["policy"] },
  { name: "backup.snapshot.list", write: false, inputFields: ["limit"] },
  { name: "backup.snapshot.restore", write: true, profileWrite: true, inputFields: ["backupId"] },
  { name: "backup.snapshot.prune", write: true, profileWrite: true, inputFields: [] },
  { name: "collection.trash", write: true, profileWrite: true, inputFields: ["collectionKey", "trashDescendentItems"] },
  { name: "duplicates.find", write: false, inputFields: ["limit"] },
  { name: "duplicates.merge", write: true, profileWrite: true, inputFields: ["masterZoteroItemKey", "duplicateZoteroItemKeys"] },
  { name: "audit.list", write: false, inputFields: ["limit"] }
] as const satisfies readonly CommandDefinition[];

export const FIRST_VERSION_COMMAND_NAMES = COMMAND_DEFINITIONS.map((definition) => definition.name);

export function isWriteCommand(commandName: CommandName): boolean {
  return getDefinition(commandName)?.write ?? false;
}

export function isProfileWriteCommand(commandName: CommandName): boolean {
  return !!getDefinition(commandName)?.profileWrite;
}

export function getCommandDefinition(commandName: CommandName): CommandDefinition | undefined {
  return getDefinition(commandName);
}

function getDefinition(commandName: CommandName): CommandDefinition | undefined {
  return COMMAND_DEFINITIONS.find((definition) => definition.name === commandName);
}

export function assertBatchLimit(count: number): void {
  if (!Number.isInteger(count) || count < 0) {
    throw new Error(`Batch size must be a non-negative integer: ${count}`);
  }

  if (count > MAX_BATCH_OBJECTS) {
    throw new Error(`Batch size ${count} exceeds limit ${MAX_BATCH_OBJECTS}`);
  }
}

export type ZoteroLocalCommand<TInput = unknown> = {
  name: CommandName;
  input: TInput;
};

export type ZoteroLocalCommandResult<TData = unknown> = {
  ok: boolean;
  commandName: CommandName;
  requestId: string;
  affected: {
    zoteroItemKeys: string[];
    collectionKeys: string[];
    attachmentKeys: string[];
    tags: string[];
  };
  data?: TData;
  error?: {
    code: string;
    message: string;
  };
};
