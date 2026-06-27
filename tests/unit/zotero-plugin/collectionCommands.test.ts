import { describe, expect, it } from "vitest";

import {
  addItemsToCollection,
  createCollection,
  moveCollection,
  registerCollectionCommands,
  type ZoteroCollectionAdapter
} from "../../../src/zotero-plugin/commands/collectionCommands.js";
import { CommandRegistry } from "../../../src/zotero-plugin/commandRegistry.js";

describe("collection commands", () => {
  it("creates a top-level collection or subcollection through the adapter", async () => {
    const adapter = fakeCollectionAdapter();

    await expect(
      createCollection(adapter, {
        libraryScope: "local-user",
        name: "Methods",
        parentCollectionKey: "PARENT1"
      })
    ).resolves.toEqual({
      collectionKey: "NEWCOLL1",
      name: "Methods",
      parentCollectionKey: "PARENT1"
    });
  });

  it("moves any single collection to a new parent", async () => {
    const adapter = fakeCollectionAdapter();

    await expect(
      moveCollection(adapter, {
        collectionKey: "CHILD1",
        parentCollectionKey: "PARENT2"
      })
    ).resolves.toEqual({
      collectionKey: "CHILD1",
      name: "Moved",
      parentCollectionKey: "PARENT2"
    });
  });

  it("enforces the batch limit when adding items to a collection", async () => {
    const adapter = fakeCollectionAdapter();
    const zoteroItemKeys = Array.from({ length: 51 }, (_, index) => `ITEM${index}`);

    await expect(
      addItemsToCollection(adapter, {
        collectionKey: "COLL1",
        zoteroItemKeys
      })
    ).rejects.toThrow("Batch size 51 exceeds limit 50");
  });

  it("registers collection handlers in the command registry", async () => {
    const registry = new CommandRegistry({ profileMode: "test", testProfileMarkerPresent: true });
    registerCollectionCommands(registry, fakeCollectionAdapter());

    await expect(
      registry.execute({
        name: "collection.addItems",
        requestId: "req_collection",
        input: {
          collectionKey: "COLL1",
          zoteroItemKeys: ["ITEM1", "ITEM2"]
        }
      })
    ).resolves.toMatchObject({
      ok: true,
      commandName: "collection.addItems",
      data: {
        collectionKey: "COLL1",
        addedItemKeys: ["ITEM1", "ITEM2"]
      }
    });
  });
});

function fakeCollectionAdapter(): ZoteroCollectionAdapter {
  return {
    async createCollection(input) {
      return {
        collectionKey: "NEWCOLL1",
        name: input.name,
        parentCollectionKey: input.parentCollectionKey
      };
    },
    async renameCollection(input) {
      return {
        collectionKey: input.collectionKey,
        name: input.name
      };
    },
    async moveCollection(input) {
      return {
        collectionKey: input.collectionKey,
        name: "Moved",
        parentCollectionKey: input.parentCollectionKey
      };
    },
    async getCollectionTree() {
      return { collections: [] };
    },
    async getCollectionItems(input) {
      return { collectionKey: input.collectionKey, zoteroItemKeys: [] };
    },
    async addItemsToCollection(input) {
      return { collectionKey: input.collectionKey, addedItemKeys: input.zoteroItemKeys };
    },
    async removeItemsFromCollection(input) {
      return { collectionKey: input.collectionKey, removedItemKeys: input.zoteroItemKeys };
    }
  };
}
