import { describe, expect, it } from "vitest";

import { createChildNote, registerNoteCommands, type ZoteroNoteAdapter } from "../../../src/zotero-plugin/commands/noteCommands.js";
import { updateItemTags, registerItemCommands, type ZoteroItemAdapter } from "../../../src/zotero-plugin/commands/itemCommands.js";
import { CommandRegistry } from "../../../src/zotero-plugin/commandRegistry.js";

describe("tag and note commands", () => {
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
