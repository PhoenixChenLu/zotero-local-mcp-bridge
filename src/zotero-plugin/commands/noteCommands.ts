import type { CommandRegistry } from "../commandRegistry.js";

export type NoteContentFormat = "text" | "html" | "rich-text";

export type ChildNoteCreateInput = {
  zoteroItemKey: string;
  content: string;
  contentFormat: NoteContentFormat;
};

export type ZoteroNoteAdapter = {
  createChildNote(input: ChildNoteCreateInput): Promise<{
    zoteroItemKey: string;
    noteKey: string;
    contentFormat: NoteContentFormat;
  }>;
};

export async function createChildNote(
  adapter: ZoteroNoteAdapter,
  input: ChildNoteCreateInput
): Promise<{
  zoteroItemKey: string;
  noteKey: string;
  contentFormat: NoteContentFormat;
}> {
  return adapter.createChildNote(input);
}

export function registerNoteCommands(registry: CommandRegistry, adapter: ZoteroNoteAdapter): void {
  registry.register("note.createChild", (input) => createChildNote(adapter, input as ChildNoteCreateInput));
}
