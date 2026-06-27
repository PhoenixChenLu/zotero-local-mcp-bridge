import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { BRIDGE_AUTH_HEADER } from "../../../src/shared/auth.js";
import { AuthTokenStore } from "../../../src/mcp-server/authTokenStore.js";
import { ZoteroPluginClient } from "../../../src/mcp-server/zoteroPluginClient.js";

describe("AuthTokenStore", () => {
  it("creates and reuses auth token under the explicit runtime root", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "zotero-bridge-auth-"));
    try {
      const store = new AuthTokenStore({ runtimeRoot: root });

      const first = await store.getOrCreateToken();
      const second = await store.getOrCreateToken();

      expect(first.value).toBe(second.value);
      expect(first.filePath.startsWith(root)).toBe(true);
      expect(first.filePath).toContain(path.join("runtime", "auth", "bridge-token"));
      expect(first.value.length).toBeGreaterThanOrEqual(32);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("falls back to env-runtime directory when no runtime root is provided", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "zotero-bridge-auth-env-"));
    const original = process.env.ZOTERO_CODEX_BRIDGE_RUNTIME_DIR;
    process.env.ZOTERO_CODEX_BRIDGE_RUNTIME_DIR = root;
    try {
      const store = new AuthTokenStore({});

      const token = await store.getOrCreateToken();

      expect(token.filePath.startsWith(root)).toBe(true);
      expect(token.filePath).toContain(path.join("runtime", "auth", "bridge-token"));
      expect(token.value).toMatch(/^[A-Za-z0-9_-]{32,}$/);
    } finally {
      if (original === undefined) {
        delete process.env.ZOTERO_CODEX_BRIDGE_RUNTIME_DIR;
      } else {
        process.env.ZOTERO_CODEX_BRIDGE_RUNTIME_DIR = original;
      }
      await rm(root, { recursive: true, force: true });
    }
  });

  it("adds auth headers to command requests", async () => {
    const originalFetch = globalThis.fetch;
    let headers: Headers | undefined;
    globalThis.fetch = async (_input, init) => {
      headers = new Headers(init?.headers);
      return Response.json({
        ok: true,
        commandName: "collection.getTree",
        requestId: "req_1",
        affected: {
          zoteroItemKeys: [],
          collectionKeys: [],
          attachmentKeys: [],
          tags: []
        },
        data: {}
      });
    };

    try {
      const client = new ZoteroPluginClient({ authToken: "test-token" });
      await client.execute({ name: "collection.getTree", input: { libraryScope: "local-user" } });

      expect(headers?.get(BRIDGE_AUTH_HEADER)).toBe("test-token");
      expect(headers?.get("content-type")).toBe("application/json");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
