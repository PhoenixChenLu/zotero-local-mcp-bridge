import type { CommandRegistry } from "../commandRegistry.js";

export type ItemTagUpdateInput = {
  zoteroItemKey: string;
  addTags: string[];
  removeTags: string[];
};

export type ZoteroItemAdapter = {
  updateItemTags(input: ItemTagUpdateInput): Promise<{
    zoteroItemKey: string;
    addedTags: string[];
    removedTags: string[];
  }>;
};

export async function updateItemTags(
  adapter: ZoteroItemAdapter,
  input: ItemTagUpdateInput
): Promise<{
  zoteroItemKey: string;
  addedTags: string[];
  removedTags: string[];
}> {
  return adapter.updateItemTags(input);
}

export function registerItemCommands(registry: CommandRegistry, adapter: ZoteroItemAdapter): void {
  registry.register("item.updateTags", (input) => updateItemTags(adapter, input as ItemTagUpdateInput));
}
