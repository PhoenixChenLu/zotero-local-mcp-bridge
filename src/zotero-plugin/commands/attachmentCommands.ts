import type { CommandRegistry } from "../commandRegistry.js";

export type AttachmentMode = "copy" | "linked";

export type AttachmentRecord = {
  attachmentKey: string;
  title?: string;
  filePath?: string;
  attachmentMode?: AttachmentMode;
};

export type AttachmentAddFileInput = {
  zoteroItemKey: string;
  filePath: string;
  attachmentMode?: AttachmentMode;
};

export type AttachmentMoveInput = {
  attachmentKey: string;
  targetZoteroItemKey: string;
};

export type AttachmentRenameInput = {
  attachmentKey: string;
  title: string;
  renameFile?: boolean;
};

export type AttachmentKeyInput = {
  attachmentKey: string;
};

export type ZoteroAttachmentAdapter = {
  getItemAttachments(input: { zoteroItemKey: string }): Promise<{
    zoteroItemKey: string;
    attachments: AttachmentRecord[];
  }>;
  addFileAttachment(input: Required<AttachmentAddFileInput>): Promise<{
    zoteroItemKey: string;
    attachmentKey: string;
    filePath: string;
    attachmentMode: AttachmentMode;
    warnings: string[];
  }>;
  moveAttachmentToItem(input: AttachmentMoveInput): Promise<AttachmentMoveInput>;
  renameAttachment(input: AttachmentRenameInput): Promise<{
    attachmentKey: string;
    title: string;
    renamedFileName?: string;
  }>;
  runZoteroAttachmentRename(input: AttachmentKeyInput): Promise<{
    attachmentKey: string;
    renamedFileName: string;
  }>;
  undoAddedAttachment(input: AttachmentKeyInput): Promise<{
    attachmentKey: string;
    removed: boolean;
  }>;
};

export async function getItemAttachments(
  adapter: ZoteroAttachmentAdapter,
  input: { zoteroItemKey: string }
): Promise<{ zoteroItemKey: string; attachments: AttachmentRecord[] }> {
  return adapter.getItemAttachments(input);
}

export async function addFileAttachment(
  adapter: ZoteroAttachmentAdapter,
  input: AttachmentAddFileInput
): Promise<{
  zoteroItemKey: string;
  attachmentKey: string;
  filePath: string;
  attachmentMode: AttachmentMode;
  warnings: string[];
}> {
  return adapter.addFileAttachment({
    ...input,
    attachmentMode: input.attachmentMode ?? "copy"
  });
}

export async function moveAttachmentToItem(
  adapter: ZoteroAttachmentAdapter,
  input: AttachmentMoveInput
): Promise<AttachmentMoveInput> {
  return adapter.moveAttachmentToItem(input);
}

export async function renameAttachment(
  adapter: ZoteroAttachmentAdapter,
  input: AttachmentRenameInput
): Promise<{ attachmentKey: string; title: string; renamedFileName?: string }> {
  return adapter.renameAttachment(input);
}

export async function runZoteroAttachmentRename(
  adapter: ZoteroAttachmentAdapter,
  input: AttachmentKeyInput
): Promise<{ attachmentKey: string; renamedFileName: string }> {
  return adapter.runZoteroAttachmentRename(input);
}

export async function undoAddedAttachment(
  adapter: ZoteroAttachmentAdapter,
  input: AttachmentKeyInput
): Promise<{ attachmentKey: string; removed: boolean }> {
  return adapter.undoAddedAttachment(input);
}

export function registerAttachmentCommands(registry: CommandRegistry, adapter: ZoteroAttachmentAdapter): void {
  registry.register("attachment.getForItem", (input) =>
    getItemAttachments(adapter, input as { zoteroItemKey: string })
  );
  registry.register("attachment.addFile", (input) => addFileAttachment(adapter, input as AttachmentAddFileInput));
  registry.register("attachment.moveToItem", (input) => moveAttachmentToItem(adapter, input as AttachmentMoveInput));
  registry.register("attachment.rename", (input) => renameAttachment(adapter, input as AttachmentRenameInput));
  registry.register("attachment.runZoteroRename", (input) =>
    runZoteroAttachmentRename(adapter, input as AttachmentKeyInput)
  );
  registry.register("attachment.undoAdded", (input) => undoAddedAttachment(adapter, input as AttachmentKeyInput));
}
