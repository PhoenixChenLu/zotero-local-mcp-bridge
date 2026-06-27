import { describe, expect, it } from "vitest";

import {
  addFileAttachment,
  moveAttachmentToItem,
  registerAttachmentCommands,
  runZoteroAttachmentRename,
  type ZoteroAttachmentAdapter
} from "../../../src/zotero-plugin/commands/attachmentCommands.js";
import {
  getAttachmentRenamePreferences,
  registerAttachmentPreferenceCommands,
  setAttachmentRenamePreferences,
  type ZoteroAttachmentPreferenceAdapter
} from "../../../src/zotero-plugin/commands/attachmentPreferenceCommands.js";
import { CommandRegistry } from "../../../src/zotero-plugin/commandRegistry.js";

describe("attachment commands", () => {
  it("adds file attachments with copy mode by default", async () => {
    await expect(
      addFileAttachment(fakeAttachmentAdapter(), {
        zoteroItemKey: "ITEM1",
        filePath: "C:\\papers\\a.pdf"
      })
    ).resolves.toMatchObject({
      zoteroItemKey: "ITEM1",
      attachmentKey: "ATTACH1",
      attachmentMode: "copy"
    });
  });

  it("passes linked file mode without path restrictions", async () => {
    await expect(
      addFileAttachment(fakeAttachmentAdapter(), {
        zoteroItemKey: "ITEM1",
        filePath: "D:\\external\\a.pdf",
        attachmentMode: "linked"
      })
    ).resolves.toMatchObject({
      attachmentMode: "linked",
      warnings: ["Linked files can break if the external path is moved, renamed, or deleted."]
    });
  });

  it("moves attachments to a new parent item", async () => {
    await expect(
      moveAttachmentToItem(fakeAttachmentAdapter(), {
        attachmentKey: "ATTACH1",
        targetZoteroItemKey: "ITEM2"
      })
    ).resolves.toEqual({
      attachmentKey: "ATTACH1",
      targetZoteroItemKey: "ITEM2"
    });
  });

  it("runs Zotero attachment rename through the adapter", async () => {
    await expect(
      runZoteroAttachmentRename(fakeAttachmentAdapter(), {
        attachmentKey: "ATTACH1"
      })
    ).resolves.toEqual({
      attachmentKey: "ATTACH1",
      renamedFileName: "renamed.pdf"
    });
  });

  it("registers undo for bridge-added attachments", async () => {
    const registry = new CommandRegistry({ profileMode: "test", testProfileMarkerPresent: true });
    registerAttachmentCommands(registry, fakeAttachmentAdapter());

    await expect(
      registry.execute({
        name: "attachment.undoAdded",
        requestId: "req_attachment_undo",
        input: { attachmentKey: "ATTACH1" }
      })
    ).resolves.toMatchObject({
      ok: true,
      data: {
        attachmentKey: "ATTACH1",
        removed: true
      }
    });
  });

  it("reads and writes attachment rename preferences", async () => {
    const adapter = fakePreferenceAdapter();

    await expect(getAttachmentRenamePreferences(adapter)).resolves.toEqual({
      autoRenameFiles: true,
      autoRenameLinkedFiles: false,
      autoRenameFileTypes: "application/pdf",
      attachmentRenameTemplate: "{{ title }}"
    });

    await expect(
      setAttachmentRenamePreferences(adapter, {
        preferences: {
          autoRenameFiles: false,
          autoRenameLinkedFiles: true,
          autoRenameFileTypes: "application/pdf,text/html",
          attachmentRenameTemplate: "{{ creators }} - {{ title }}"
        }
      })
    ).resolves.toEqual({
      oldPreferences: {
        autoRenameFiles: true,
        autoRenameLinkedFiles: false,
        autoRenameFileTypes: "application/pdf",
        attachmentRenameTemplate: "{{ title }}"
      },
      newPreferences: {
        autoRenameFiles: false,
        autoRenameLinkedFiles: true,
        autoRenameFileTypes: "application/pdf,text/html",
        attachmentRenameTemplate: "{{ creators }} - {{ title }}"
      }
    });
  });

  it("registers attachment commands", async () => {
    const registry = new CommandRegistry({ profileMode: "test", testProfileMarkerPresent: true });
    registerAttachmentCommands(registry, fakeAttachmentAdapter());
    registerAttachmentPreferenceCommands(registry, fakePreferenceAdapter());

    await expect(
      registry.execute({
        name: "attachment.getForItem",
        requestId: "req_attachment",
        input: { zoteroItemKey: "ITEM1" }
      })
    ).resolves.toMatchObject({
      ok: true,
      data: {
        zoteroItemKey: "ITEM1",
        attachments: []
      }
    });
  });
});

function fakeAttachmentAdapter(): ZoteroAttachmentAdapter {
  return {
    async getItemAttachments(input) {
      return { zoteroItemKey: input.zoteroItemKey, attachments: [] };
    },
    async addFileAttachment(input) {
      return {
        zoteroItemKey: input.zoteroItemKey,
        attachmentKey: "ATTACH1",
        filePath: input.filePath,
        attachmentMode: input.attachmentMode ?? "copy",
        warnings:
          input.attachmentMode === "linked"
            ? ["Linked files can break if the external path is moved, renamed, or deleted."]
            : []
      };
    },
    async moveAttachmentToItem(input) {
      return input;
    },
    async renameAttachment(input) {
      return { attachmentKey: input.attachmentKey, title: input.title, renamedFileName: input.title };
    },
    async runZoteroAttachmentRename(input) {
      return { attachmentKey: input.attachmentKey, renamedFileName: "renamed.pdf" };
    },
    async undoAddedAttachment(input) {
      return { attachmentKey: input.attachmentKey, removed: true };
    }
  };
}

function fakePreferenceAdapter(): ZoteroAttachmentPreferenceAdapter {
  return {
    async getAttachmentRenamePreferences() {
      return {
        autoRenameFiles: true,
        autoRenameLinkedFiles: false,
        autoRenameFileTypes: "application/pdf",
        attachmentRenameTemplate: "{{ title }}"
      };
    },
    async setAttachmentRenamePreferences(input) {
      return {
        oldPreferences: {
          autoRenameFiles: true,
          autoRenameLinkedFiles: false,
          autoRenameFileTypes: "application/pdf",
          attachmentRenameTemplate: "{{ title }}"
        },
        newPreferences: input.preferences
      };
    }
  };
}
