import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  BRIDGE_RUNTIME_DIR_ENV,
  resolveAuthTokenPath,
  resolveAuditLogPath,
  resolveBackupRootPath,
  resolveRuntimeRootDirectory
} from "../../../src/mcp-server/runtimePaths.js";

describe("runtime paths", () => {
  it("uses explicit runtimeRoot when provided", () => {
    const root = "C:\\bridge\\runtime";
    expect(resolveRuntimeRootDirectory({ runtimeRoot: root })).toBe(path.resolve(root));
    expect(resolveAuthTokenPath({ runtimeRoot: root })).toBe(path.join(path.resolve(root), "runtime", "auth", "bridge-token"));
    expect(resolveAuditLogPath({ runtimeRoot: root })).toBe(path.join(path.resolve(root), "runtime", "logs", "audit"));
    expect(resolveBackupRootPath({ runtimeRoot: root })).toBe(path.join(path.resolve(root), "runtime", "backups", "zotero-operations"));
  });

  it("falls back to BRIDGE_RUNTIME_DIR env when no override is provided", () => {
    const original = process.env[BRIDGE_RUNTIME_DIR_ENV];
    process.env[BRIDGE_RUNTIME_DIR_ENV] = "/tmp/zotero-bridge";

    try {
      expect(resolveRuntimeRootDirectory({})).toBe(path.resolve("/tmp/zotero-bridge"));
    } finally {
      if (original === undefined) {
        delete process.env[BRIDGE_RUNTIME_DIR_ENV];
      } else {
        process.env[BRIDGE_RUNTIME_DIR_ENV] = original;
      }
    }
  });
});
