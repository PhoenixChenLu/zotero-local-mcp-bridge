import { assertBatchLimit } from "../../shared/commands.js";
import type { CommandRegistry } from "../commandRegistry.js";

export type CollectionRecord = {
  collectionKey: string;
  name: string;
  parentCollectionKey?: string;
};

export type CollectionCreateInput = {
  libraryScope: "local-user";
  name: string;
  parentCollectionKey?: string;
};

export type CollectionRenameInput = {
  collectionKey: string;
  name: string;
};

export type CollectionMoveInput = {
  collectionKey: string;
  parentCollectionKey?: string;
};

export type CollectionItemsInput = {
  collectionKey: string;
};

export type CollectionItemMembershipInput = {
  collectionKey: string;
  zoteroItemKeys: string[];
};

export type ZoteroCollectionAdapter = {
  createCollection(input: CollectionCreateInput): Promise<CollectionRecord>;
  renameCollection(input: CollectionRenameInput): Promise<CollectionRecord>;
  moveCollection(input: CollectionMoveInput): Promise<CollectionRecord>;
  getCollectionTree(input: { libraryScope: "local-user" }): Promise<{ collections: CollectionRecord[] }>;
  getCollectionItems(input: CollectionItemsInput): Promise<{ collectionKey: string; zoteroItemKeys: string[] }>;
  addItemsToCollection(input: CollectionItemMembershipInput): Promise<{ collectionKey: string; addedItemKeys: string[] }>;
  removeItemsFromCollection(input: CollectionItemMembershipInput): Promise<{ collectionKey: string; removedItemKeys: string[] }>;
};

export async function createCollection(
  adapter: ZoteroCollectionAdapter,
  input: CollectionCreateInput
): Promise<CollectionRecord> {
  return adapter.createCollection(input);
}

export async function renameCollection(
  adapter: ZoteroCollectionAdapter,
  input: CollectionRenameInput
): Promise<CollectionRecord> {
  return adapter.renameCollection(input);
}

export async function moveCollection(
  adapter: ZoteroCollectionAdapter,
  input: CollectionMoveInput
): Promise<CollectionRecord> {
  return adapter.moveCollection(input);
}

export async function getCollectionTree(
  adapter: ZoteroCollectionAdapter
): Promise<{ collections: CollectionRecord[] }> {
  return adapter.getCollectionTree({ libraryScope: "local-user" });
}

export async function getCollectionItems(
  adapter: ZoteroCollectionAdapter,
  input: CollectionItemsInput
): Promise<{ collectionKey: string; zoteroItemKeys: string[] }> {
  return adapter.getCollectionItems(input);
}

export async function addItemsToCollection(
  adapter: ZoteroCollectionAdapter,
  input: CollectionItemMembershipInput
): Promise<{ collectionKey: string; addedItemKeys: string[] }> {
  assertBatchLimit(input.zoteroItemKeys.length);
  return adapter.addItemsToCollection(input);
}

export async function removeItemsFromCollection(
  adapter: ZoteroCollectionAdapter,
  input: CollectionItemMembershipInput
): Promise<{ collectionKey: string; removedItemKeys: string[] }> {
  assertBatchLimit(input.zoteroItemKeys.length);
  return adapter.removeItemsFromCollection(input);
}

export function registerCollectionCommands(
  registry: CommandRegistry,
  adapter: ZoteroCollectionAdapter
): void {
  registry.register("collection.create", (input) => createCollection(adapter, input as CollectionCreateInput));
  registry.register("collection.rename", (input) => renameCollection(adapter, input as CollectionRenameInput));
  registry.register("collection.move", (input) => moveCollection(adapter, input as CollectionMoveInput));
  registry.register("collection.getTree", () => getCollectionTree(adapter));
  registry.register("collection.getItems", (input) => getCollectionItems(adapter, input as CollectionItemsInput));
  registry.register("collection.addItems", (input) =>
    addItemsToCollection(adapter, input as CollectionItemMembershipInput)
  );
  registry.register("collection.removeItems", (input) =>
    removeItemsFromCollection(adapter, input as CollectionItemMembershipInput)
  );
}
