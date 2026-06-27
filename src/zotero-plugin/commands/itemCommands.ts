import type { CommandRegistry } from "../commandRegistry.js";

export type ItemFieldMap = Record<string, string | number | boolean | null>;

export type ItemCreator = {
  creatorType: string;
  firstName?: string;
  lastName?: string;
  name?: string;
};

export type ItemCreateInput = {
  libraryScope: "local-user";
  itemType: string;
  fields?: ItemFieldMap;
  creators?: ItemCreator[];
  collectionKeys?: string[];
  tags?: string[];
};

export type ItemFieldsUpdateInput = {
  zoteroItemKey: string;
  fields: ItemFieldMap;
};

export type ItemCreatorsUpdateInput = {
  zoteroItemKey: string;
  creators: ItemCreator[];
};

export type ItemCollectionsSetInput = {
  zoteroItemKey: string;
  collectionKeys: string[];
};

export type ItemTagUpdateInput = {
  zoteroItemKey: string;
  addTags: string[];
  removeTags: string[];
};

export type ZoteroItemAdapter = {
  createItem(input: ItemCreateInput): Promise<{
    zoteroItemKey: string;
    itemType: string;
  }>;
  updateItemFields(input: ItemFieldsUpdateInput): Promise<{
    zoteroItemKey: string;
    fields: ItemFieldMap;
  }>;
  updateItemCreators(input: ItemCreatorsUpdateInput): Promise<{
    zoteroItemKey: string;
    creators: ItemCreator[];
  }>;
  setItemCollections(input: ItemCollectionsSetInput): Promise<{
    zoteroItemKey: string;
    collectionKeys: string[];
  }>;
  updateItemTags(input: ItemTagUpdateInput): Promise<{
    zoteroItemKey: string;
    addedTags: string[];
    removedTags: string[];
  }>;
};

export async function createItem(
  adapter: ZoteroItemAdapter,
  input: ItemCreateInput
): Promise<{
  zoteroItemKey: string;
  itemType: string;
}> {
  return adapter.createItem(input);
}

export async function updateItemFields(
  adapter: ZoteroItemAdapter,
  input: ItemFieldsUpdateInput
): Promise<{
  zoteroItemKey: string;
  fields: ItemFieldMap;
}> {
  return adapter.updateItemFields(input);
}

export async function updateItemCreators(
  adapter: ZoteroItemAdapter,
  input: ItemCreatorsUpdateInput
): Promise<{
  zoteroItemKey: string;
  creators: ItemCreator[];
}> {
  return adapter.updateItemCreators(input);
}

export async function setItemCollections(
  adapter: ZoteroItemAdapter,
  input: ItemCollectionsSetInput
): Promise<{
  zoteroItemKey: string;
  collectionKeys: string[];
}> {
  return adapter.setItemCollections(input);
}

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
  registry.register("item.create", (input) => createItem(adapter, input as ItemCreateInput));
  registry.register("item.updateFields", (input) => updateItemFields(adapter, input as ItemFieldsUpdateInput));
  registry.register("item.updateCreators", (input) => updateItemCreators(adapter, input as ItemCreatorsUpdateInput));
  registry.register("item.setCollections", (input) => setItemCollections(adapter, input as ItemCollectionsSetInput));
  registry.register("item.updateTags", (input) => updateItemTags(adapter, input as ItemTagUpdateInput));
}
