import { describe, expect, it } from "vitest";

import { createChildNote, registerNoteCommands, type ZoteroNoteAdapter } from "../../../src/zotero-plugin/commands/noteCommands.js";
import {
  createItem,
  registerItemCommands,
  setItemCollections,
  updateItemCreators,
  updateItemFields,
  updateItemTags,
  type ZoteroItemAdapter
} from "../../../src/zotero-plugin/commands/itemCommands.js";
import { CommandRegistry } from "../../../src/zotero-plugin/commandRegistry.js";

describe("tag and note commands", () => {
  it("creates items through the item adapter", async () => {
    await expect(
      createItem(fakeItemAdapter(), {
        libraryScope: "local-user",
        itemType: "book",
        fields: { title: "Created" },
        creators: [{ creatorType: "author", firstName: "Ada", lastName: "Lovelace" }],
        collectionKeys: ["COLL1"],
        tags: ["review"]
      })
    ).resolves.toEqual({
      zoteroItemKey: "ITEM_CREATED",
      itemType: "book"
    });
  });

  it("updates item fields, creators, and collections through the item adapter", async () => {
    await expect(
      updateItemFields(fakeItemAdapter(), {
        zoteroItemKey: "ITEM1",
        fields: { title: "Updated" }
      })
    ).resolves.toEqual({
      zoteroItemKey: "ITEM1",
      fields: { title: "Updated" }
    });

    await expect(
      updateItemCreators(fakeItemAdapter(), {
        zoteroItemKey: "ITEM1",
        creators: [{ creatorType: "author", name: "OpenAI" }]
      })
    ).resolves.toEqual({
      zoteroItemKey: "ITEM1",
      creators: [{ creatorType: "author", name: "OpenAI" }]
    });

    await expect(
      setItemCollections(fakeItemAdapter(), {
        zoteroItemKey: "ITEM1",
        collectionKeys: ["COLL1"]
      })
    ).resolves.toEqual({
      zoteroItemKey: "ITEM1",
      collectionKeys: ["COLL1"]
    });
  });

  it("updates item tags through the item adapter", async () => {
    await expect(
      updateItemTags(fakeItemAdapter(), {
        zoteroItemKey: "ITEM1",
        addTags: ["reviewed"],
        removeTags: ["todo"]
      })
    ).resolves.toEqual({
      zoteroItemKey: "ITEM1",
      addedTags: ["reviewed"],
      removedTags: ["todo"]
    });
  });

  it("creates child notes through the note adapter", async () => {
    await expect(
      createChildNote(fakeNoteAdapter(), {
        zoteroItemKey: "ITEM1",
        content: "<p>Finding</p>",
        contentFormat: "html"
      })
    ).resolves.toEqual({
      zoteroItemKey: "ITEM1",
      noteKey: "NOTE1",
      contentFormat: "html"
    });
  });

  it("registers item and note commands", async () => {
    const registry = new CommandRegistry({ profileMode: "test", testProfileMarkerPresent: true });
    registerItemCommands(registry, fakeItemAdapter());
    registerNoteCommands(registry, fakeNoteAdapter());

    await expect(
      registry.execute({
        name: "item.create",
        requestId: "req_item",
        input: {
          libraryScope: "local-user",
          itemType: "document"
        }
      })
    ).resolves.toMatchObject({
      ok: true,
      commandName: "item.create",
      data: {
        zoteroItemKey: "ITEM_CREATED",
        itemType: "document"
      }
    });

    await expect(
      registry.execute({
        name: "note.createChild",
        requestId: "req_note",
        input: {
          zoteroItemKey: "ITEM1",
          content: "Plain note",
          contentFormat: "text"
        }
      })
    ).resolves.toMatchObject({
      ok: true,
      commandName: "note.createChild",
      data: {
        zoteroItemKey: "ITEM1",
        noteKey: "NOTE1",
        contentFormat: "text"
      }
    });
  });
});

function fakeItemAdapter(): ZoteroItemAdapter {
  return {
    async createItem(input) {
      return {
        zoteroItemKey: "ITEM_CREATED",
        itemType: input.itemType
      };
    },
    async updateItemFields(input) {
      return {
        zoteroItemKey: input.zoteroItemKey,
        fields: input.fields
      };
    },
    async updateItemCreators(input) {
      return {
        zoteroItemKey: input.zoteroItemKey,
        creators: input.creators
      };
    },
    async setItemCollections(input) {
      return {
        zoteroItemKey: input.zoteroItemKey,
        collectionKeys: input.collectionKeys
      };
    },
    async updateItemTags(input) {
      return {
        zoteroItemKey: input.zoteroItemKey,
        addedTags: input.addTags,
        removedTags: input.removeTags
      };
    }
  };
}

function fakeNoteAdapter(): ZoteroNoteAdapter {
  return {
    async createChildNote(input) {
      return {
        zoteroItemKey: input.zoteroItemKey,
        noteKey: "NOTE1",
        contentFormat: input.contentFormat
      };
    }
  };
}
