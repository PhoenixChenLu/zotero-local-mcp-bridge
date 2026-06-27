import { describe, expect, it } from "vitest";

import {
  COMMAND_DEFINITIONS,
  FIRST_VERSION_COMMAND_NAMES,
  MAX_BATCH_OBJECTS,
  assertBatchLimit,
  isWriteCommand
} from "../../../src/shared/commands.js";

describe("shared command definitions", () => {
  it("declares every first-version Zotero management command", () => {
    expect(FIRST_VERSION_COMMAND_NAMES).toEqual([
      "collection.create",
      "collection.rename",
      "collection.move",
      "collection.getTree",
      "collection.getItems",
      "collection.addItems",
      "collection.removeItems",
      "item.get",
      "item.search",
      "item.updateTags",
      "note.createChild",
      "attachment.get",
      "attachment.getForItem",
      "attachment.addFile",
      "attachment.moveToItem",
      "attachment.rename",
      "attachment.runZoteroRename",
      "attachment.undoAdded",
      "attachment.renamePreferences.get",
      "attachment.renamePreferences.set",
      "backup.settings.get",
      "backup.settings.set",
      "backup.snapshot.list",
      "backup.snapshot.restore",
      "backup.snapshot.prune",
      "audit.list",
      "safety.getProfileStatus",
      "safety.unlockRealProfile",
      "safety.lockRealProfile"
    ]);
  });

  it("marks all mutating commands as write commands", () => {
    expect(isWriteCommand("collection.getTree")).toBe(false);
    expect(isWriteCommand("item.get")).toBe(false);
    expect(isWriteCommand("item.search")).toBe(false);
    expect(isWriteCommand("attachment.get")).toBe(false);
    expect(isWriteCommand("attachment.renamePreferences.get")).toBe(false);
    expect(isWriteCommand("backup.snapshot.list")).toBe(false);
    expect(isWriteCommand("audit.list")).toBe(false);
    expect(isWriteCommand("safety.getProfileStatus")).toBe(false);
    expect(isWriteCommand("collection.create")).toBe(true);
    expect(isWriteCommand("attachment.addFile")).toBe(true);
    expect(isWriteCommand("attachment.undoAdded")).toBe(true);
    expect(isWriteCommand("attachment.renamePreferences.set")).toBe(true);
    expect(isWriteCommand("backup.snapshot.restore")).toBe(true);
    expect(isWriteCommand("backup.snapshot.prune")).toBe(true);
    expect(isWriteCommand("safety.unlockRealProfile")).toBe(true);
    expect(isWriteCommand("safety.lockRealProfile")).toBe(true);
  });

  it("enforces the first-version batch limit", () => {
    expect(MAX_BATCH_OBJECTS).toBe(50);
    expect(() => assertBatchLimit(50)).not.toThrow();
    expect(() => assertBatchLimit(51)).toThrow("Batch size 51 exceeds limit 50");
  });

  it("does not use ambiguous generic key field names", () => {
    for (const definition of COMMAND_DEFINITIONS) {
      expect(definition.inputFields).not.toContain("key");
    }
  });
});
