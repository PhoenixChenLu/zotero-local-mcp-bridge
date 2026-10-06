import { createHash } from "node:crypto";
import { rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  createReleaseAssetNames,
  createSha256Manifest,
  createUpdateManifest
} from "../../../scripts/buildReleaseAssets.mjs";

describe("release asset builder", () => {
  it("generates update metadata from the current plugin manifest", () => {
    const update = createUpdateManifest({
      version: "0.1.61",
      homepage_url: "https://github.com/PhoenixChenLu/zotero-local-mcp-bridge",
      applications: { zotero: {
        id: "zotero-local-mcp-bridge@example.com",
        strict_min_version: "7.0",
        strict_max_version: "10.0.*"
      } }
    });
    expect(update.addons["zotero-local-mcp-bridge@example.com"].updates).toEqual([{
      version: "0.1.61",
      update_link: "https://github.com/PhoenixChenLu/zotero-local-mcp-bridge/releases/download/v0.1.61/zotero-local-mcp-bridge.xpi",
      applications: { zotero: { strict_min_version: "7.0", strict_max_version: "10.0.*" } }
    }]);
  });
  it("defines the complete public release set", () => {
    expect(createReleaseAssetNames("0.1.61")).toEqual([
      "zotero-local-mcp-bridge.xpi",
      "updates.json",
      "zotero-local-mcp-bridge-0.1.61.mcpb",
      "zotero-local-mcp-bridge-stdio-adapter-0.1.61.tgz",
      "zotero-local-mcp-bridge-skill-en-v0.1.61.zip",
      "zotero-local-mcp-bridge-skill-zh-cn-v0.1.61.zip",
      "release-notes-v0.1.61.md"
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
