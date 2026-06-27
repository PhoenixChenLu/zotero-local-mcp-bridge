import type { CommandRegistry } from "../commandRegistry.js";

export type AttachmentRenamePreferences = {
  autoRenameFiles: boolean;
  autoRenameLinkedFiles?: boolean;
  autoRenameFileTypes?: string;
  attachmentRenameTemplate?: string;
};

export type AttachmentRenamePreferenceSetInput = {
  preferences: AttachmentRenamePreferences;
};

export type ZoteroAttachmentPreferenceAdapter = {
  getAttachmentRenamePreferences(): Promise<AttachmentRenamePreferences>;
  setAttachmentRenamePreferences(input: AttachmentRenamePreferenceSetInput): Promise<{
    oldPreferences: AttachmentRenamePreferences;
    newPreferences: AttachmentRenamePreferences;
  }>;
};

export async function getAttachmentRenamePreferences(
  adapter: ZoteroAttachmentPreferenceAdapter
): Promise<AttachmentRenamePreferences> {
  return adapter.getAttachmentRenamePreferences();
}

export async function setAttachmentRenamePreferences(
  adapter: ZoteroAttachmentPreferenceAdapter,
  input: AttachmentRenamePreferenceSetInput
): Promise<{
  oldPreferences: AttachmentRenamePreferences;
  newPreferences: AttachmentRenamePreferences;
}> {
  return adapter.setAttachmentRenamePreferences(input);
}

export function registerAttachmentPreferenceCommands(
  registry: CommandRegistry,
  adapter: ZoteroAttachmentPreferenceAdapter
): void {
  registry.register("attachment.renamePreferences.get", () => getAttachmentRenamePreferences(adapter));
  registry.register("attachment.renamePreferences.set", (input) =>
    setAttachmentRenamePreferences(adapter, input as AttachmentRenamePreferenceSetInput)
  );
}
