import { createHash } from "node:crypto";
import { rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  createReleaseAssetNames,
  createSha256Manifest
} from "../../../scripts/buildReleaseAssets.mjs";

describe("release asset builder", () => {
  it("defines the complete public release set", () => {
    expect(createReleaseAssetNames("0.1.60")).toEqual([
      "zotero-local-mcp-bridge.xpi",
      "updates.json",
      "zotero-local-mcp-bridge-0.1.60.mcpb",
      "zotero-local-mcp-bridge-stdio-adapter-0.1.60.tgz",
      "zotero-local-mcp-bridge-skill-en-v0.1.60.zip",
      "zotero-local-mcp-bridge-skill-zh-cn-v0.1.60.zip",
      "release-notes-v0.1.60.md"
    ]);
  });

  it("creates stable SHA-256 lines without absolute paths", async () => {
    const file = path.resolve("dist", "release-assets-test.txt");
    await writeFile(file, "release", "utf8");
    const expected = createHash("sha256").update("release").digest("hex");

    const manifest = await createSha256Manifest([file]);

    expect(manifest).toBe(`${expected}  release-assets-test.txt\n`);
    expect(manifest).not.toContain(path.dirname(file));
    await rm(file, { force: true });
  });
});
