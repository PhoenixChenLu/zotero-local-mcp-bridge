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
      "item.findByDois",
      "search.advanced",
      "savedSearch.list",
      "savedSearch.get",
      "savedSearch.create",
      "savedSearch.update",
      "citation.format",
      "item.create",
      "item.updateFields",
      "item.updateCreators",
      "item.setCollections",
      "item.updateTags",
      "item.trash",
      "import.bibtex",
      "import.ris",
      "import.cslJson",
      "export.bibtex",
      "export.ris",
      "export.cslJson",
      "annotation.list",
      "annotation.create",
      "annotation.update",
      "note.createChild",
      "attachment.get",
      "attachment.getForItem",
      "attachment.addFile",
      "pdf.addAndRecognize",
      "pdf.addAndRecognizeBatch",
      "attachment.recognizeMetadata",
      "attachment.moveToItem",
      "attachment.rename",
      "attachment.runZoteroRename",
      "attachment.undoAdded",
      "attachment.trash",
      "attachment.renamePreferences.get",
      "attachment.renamePreferences.set",
      "backup.settings.get",
      "backup.settings.set",
      "backup.snapshot.list",
      "backup.snapshot.restore",
      "backup.snapshot.prune",
      "collection.trash",
      "duplicates.find",
      "duplicates.merge",
      "audit.list"
    ]);
  });

  it("marks all mutating commands as write commands", () => {
    expect(isWriteCommand("collection.getTree")).toBe(false);
    expect(isWriteCommand("item.get")).toBe(false);
    expect(isWriteCommand("item.search")).toBe(false);
    expect(isWriteCommand("item.findByDois")).toBe(false);
    expect(isWriteCommand("search.advanced")).toBe(false);
    expect(isWriteCommand("savedSearch.list")).toBe(false);
    expect(isWriteCommand("savedSearch.get")).toBe(false);
    expect(isWriteCommand("citation.format")).toBe(false);
    expect(isWriteCommand("export.bibtex")).toBe(false);
    expect(isWriteCommand("export.ris")).toBe(false);
    expect(isWriteCommand("export.cslJson")).toBe(false);
    expect(isWriteCommand("annotation.list")).toBe(false);
    expect(isWriteCommand("attachment.get")).toBe(false);
    expect(isWriteCommand("attachment.renamePreferences.get")).toBe(false);
    expect(isWriteCommand("backup.snapshot.list")).toBe(false);
    expect(isWriteCommand("duplicates.find")).toBe(false);
    expect(isWriteCommand("audit.list")).toBe(false);
    expect(isWriteCommand("collection.create")).toBe(true);
    expect(isWriteCommand("attachment.addFile")).toBe(true);
    expect(isWriteCommand("pdf.addAndRecognize")).toBe(true);
    expect(isWriteCommand("pdf.addAndRecognizeBatch")).toBe(true);
    expect(isWriteCommand("attachment.recognizeMetadata")).toBe(true);
    expect(isWriteCommand("attachment.undoAdded")).toBe(true);
    expect(isWriteCommand("attachment.renamePreferences.set")).toBe(true);
    expect(isWriteCommand("backup.snapshot.restore")).toBe(true);
    expect(isWriteCommand("backup.snapshot.prune")).toBe(true);
    expect(isWriteCommand("item.create")).toBe(true);
    expect(isWriteCommand("item.updateFields")).toBe(true);
    expect(isWriteCommand("item.updateCreators")).toBe(true);
    expect(isWriteCommand("item.setCollections")).toBe(true);
    expect(isWriteCommand("item.trash")).toBe(true);
    expect(isWriteCommand("savedSearch.create")).toBe(true);
    expect(isWriteCommand("savedSearch.update")).toBe(true);
    expect(isWriteCommand("import.bibtex")).toBe(true);
    expect(isWriteCommand("import.ris")).toBe(true);
    expect(isWriteCommand("import.cslJson")).toBe(true);
    expect(isWriteCommand("annotation.create")).toBe(true);
    expect(isWriteCommand("annotation.update")).toBe(true);
    expect(isWriteCommand("attachment.trash")).toBe(true);
    expect(isWriteCommand("collection.trash")).toBe(true);
    expect(isWriteCommand("duplicates.merge")).toBe(true);
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
