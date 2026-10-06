import { readFile } from "node:fs/promises";
import path from "node:path";

import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

type ExistingAttachment = {
  id: number;
  key: string;
  filename: string;
  filePath: string;
};

type DuplicateRuntime = {
  findDuplicateAttachments(
    parentItem: { getAttachments(includeTrashed: boolean): number[] },
    filePath: string
  ): Promise<string[]>;
};

describe("attachment duplicate detection", () => {
  let runtime: DuplicateRuntime;
  let attachments: ExistingAttachment[];
  let duplicateCheckEnabled: boolean;
  let hashes: Record<string, string | false>;
  let md5Async: ReturnType<typeof vi.fn>;
  const platform = { isWin: true, isMac: false };

  beforeAll(async () => {
    const bootstrap = await readFile(path.resolve("src", "zotero-plugin", "bootstrap.js"), "utf8");
    const start = bootstrap.indexOf("function normalizeFilePath");
    const end = bootstrap.indexOf("async function attachmentRecord", start);
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);

    const source = bootstrap.slice(start, end);
    const factory = new Function(
      "Zotero",
      "PathUtils",
      "IOUtils",
      "getPreferenceValue",
      "BRIDGE_ATTACHMENT_DUPLICATE_CHECK_PREFERENCE",
      "uniqueStrings",
      `${source}; return { findDuplicateAttachments };`
    ) as (...args: unknown[]) => DuplicateRuntime;

    md5Async = vi.fn(async (filePath: string) => hashes[filePath]);
    runtime = factory(
      {
        get isWin() { return platform.isWin; },
        get isMac() { return platform.isMac; },
        Items: {
          get: (id: number) => {
            const record = attachments.find((attachment) => attachment.id === id);
            return record && {
              key: record.key,
              attachmentFilename: record.filename,
              isAttachment: () => true,
              getFilePathAsync: async () => record.filePath
            };
          }
        },
        Utilities: { Internal: { md5Async } },
        File: { pathToFile: () => ({ exists: () => true }) },
        Prefs: {}
      },
      {
        filename: (filePath: string) => filePath.replace(/\\/g, "/").split("/").pop(),
        normalize: (filePath: string) => (platform.isWin ? path.win32 : path.posix).normalize(filePath)
      },
      {},
      () => duplicateCheckEnabled,
      "extensions.zotero-local-mcp-bridge.attachmentDuplicateCheckEnabled",
      (values: string[]) => [...new Set(values)]
    );
  });

  beforeEach(() => {
    attachments = [];
    duplicateCheckEnabled = true;
    hashes = {};
    md5Async.mockClear();
    platform.isWin = true;
    platform.isMac = false;
  });

  it("allows same-name files from different paths when their content differs", async () => {
    attachments = [{ id: 1, key: "ATTACH01", filename: "full.md", filePath: "C:\\paper\\full.md" }];
    hashes = {
      "C:\\paper\\full.md": "existing-hash",
      "D:\\supplement\\full.md": "incoming-hash"
    };

    await expect(findDuplicates("D:\\supplement\\full.md")).resolves.toEqual([]);
  });

  it("skips an attachment that resolves to the same path", async () => {
    attachments = [{ id: 1, key: "ATTACH01", filename: "renamed.md", filePath: "C:\\Paper\\.\\full.md" }];

    await expect(findDuplicates("c:\\paper\\full.md")).resolves.toEqual(["ATTACH01"]);
    expect(md5Async).not.toHaveBeenCalled();
  });

  it("skips files with identical content even when their paths and names differ", async () => {
    attachments = [{ id: 1, key: "ATTACH01", filename: "main.md", filePath: "C:\\paper\\main.md" }];
    hashes = {
      "C:\\paper\\main.md": "same-hash",
      "D:\\supplement\\full.md": "same-hash"
    };

    await expect(findDuplicates("D:\\supplement\\full.md")).resolves.toEqual(["ATTACH01"]);
  });

  it("does not run path or hash duplicate checks when the preference is disabled", async () => {
    duplicateCheckEnabled = false;
    attachments = [{ id: 1, key: "ATTACH01", filename: "full.md", filePath: "C:\\paper\\full.md" }];
    hashes = {
      "C:\\paper\\full.md": "same-hash",
      "D:\\supplement\\full.md": "same-hash"
    };

    await expect(findDuplicates("D:\\supplement\\full.md")).resolves.toEqual([]);
    expect(md5Async).not.toHaveBeenCalled();
  });

  it.each(["macos", "linux"])("preserves case for distinct files on %s", async (os) => {
    platform.isWin = false;
    platform.isMac = os === "macos";
    attachments = [{ id: 1, key: "ATTACH01", filename: "full.md", filePath: "/Paper/full.md" }];
    hashes = { "/Paper/full.md": "main-hash", "/paper/full.md": "supplement-hash" };

    await expect(findDuplicates("/paper/full.md")).resolves.toEqual([]);
  });

  it("preserves literal backslashes in POSIX filenames", async () => {
    platform.isWin = false;
    attachments = [{ id: 1, key: "ATTACH01", filename: "full.md", filePath: "/paper\\full.md" }];
    hashes = { "/paper\\full.md": "main-hash", "/paper/full.md": "supplement-hash" };

    await expect(findDuplicates("/paper/full.md")).resolves.toEqual([]);
  });

  function findDuplicates(filePath: string) {
    return runtime.findDuplicateAttachments(
      { getAttachments: () => attachments.map((attachment) => attachment.id) },
      filePath
    );
  }
});
