import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";

import {
  createMcpBundleManifest,
  listProductionPackagePaths,
  mcpBundleFilename
} from "../../../scripts/buildMcpBundle.mjs";

describe("buildMcpBundle", () => {
  it("creates a current MCPB 0.3 manifest for the bundled stdio adapter", () => {
    expect(createMcpBundleManifest("0.1.59")).toMatchObject({
      manifest_version: "0.3",
      name: "zotero-local-mcp-bridge",
      display_name: "Zotero Local MCP Bridge",
      version: "0.1.59",
      license: "AGPL-3.0-or-later",
      tools_generated: true,
      server: {
        type: "node",
        entry_point: "server/index.js",
        mcp_config: {
          command: "node",
          args: ["${__dirname}/server/index.js"]
        }
      },
      compatibility: {
        platforms: ["darwin", "win32"],
        runtimes: { node: ">=22.0.0" }
      }
    });
  });

  it("selects installed production packages from package-lock metadata", () => {
    const lock = {
      packages: {
        "": {},
        "node_modules/@modelcontextprotocol/sdk": { version: "1.29.0" },
        "node_modules/zod": { version: "4.4.3" },
        "node_modules/vitest": { version: "3.2.6", dev: true },
        "node_modules/optional-missing": { version: "1.0.0", optional: true }
      }
    };

    expect(listProductionPackagePaths(lock)).toEqual([
      "node_modules/@modelcontextprotocol/sdk",
      "node_modules/optional-missing",
      "node_modules/zod"
    ]);
  });

  it("uses a versioned mcpb release asset name", () => {
    expect(mcpBundleFilename("0.1.59")).toBe("zotero-local-mcp-bridge-0.1.59.mcpb");
  });

  it("keeps the source manifest synchronized with the generated manifest", async () => {
    const sourceManifest = JSON.parse(await readFile("packages/mcp-bundle/manifest.json", "utf8"));
    expect(sourceManifest).toEqual(createMcpBundleManifest("0.1.60"));
  });
});
