import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { DEFAULT_BACKUP_POLICY } from "../../../src/shared/backup.js";
import { AuditLogger } from "../../../src/mcp-server/auditLogger.js";
import { BackupManager, type BackupEntry } from "../../../src/mcp-server/backupManager.js";
import { UndoManager } from "../../../src/mcp-server/undoManager.js";

const tempDirs: string[] = [];

async function makeProjectRoot(): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), "zotero-codex-bridge-"));
  tempDirs.push(root);
  return root;
}

function entry(id: string, bytes: number, daysAgo: number): BackupEntry {
  const createdAt = new Date(Date.UTC(2026, 5, 26) - daysAgo * 24 * 60 * 60 * 1000).toISOString();
  return {
    id,
    path: path.join("backups", "zotero-operations", id),
    bytes,
    createdAt
  };
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("BackupManager", () => {
  it("keeps backup files under the runtime backup root", async () => {
    const projectRoot = await makeProjectRoot();
    const manager = new BackupManager({ runtimeRoot: projectRoot });

    expect(manager.backupRoot).toBe(path.join(projectRoot, "runtime", "backups", "zotero-operations"));
  });

  it("plans time-based pruning after the retention window", () => {
    const manager = new BackupManager({
      runtimeRoot: "H:\\Project",
      now: new Date(Date.UTC(2026, 5, 26)),
      policy: { ...DEFAULT_BACKUP_POLICY, enableSpaceLimit: false, retentionDays: 30 }
    });

    const prune = manager.planRetentionPrune([entry("old", 100, 31), entry("fresh", 100, 30)]);

    expect(prune.deleteIds).toEqual(["old"]);
    expect(prune.reasonsById.old).toBe("time-limit");
  });

  it("plans space-based pruning from oldest to newest", () => {
    const manager = new BackupManager({
      runtimeRoot: "H:\\Project",
      now: new Date(Date.UTC(2026, 5, 26)),
      policy: {
        ...DEFAULT_BACKUP_POLICY,
        enableTimeLimit: false,
        enableSpaceLimit: true,
        maxLocalBytes: 250
      }
    });

    const prune = manager.planRetentionPrune([entry("oldest", 100, 10), entry("middle", 100, 5), entry("newest", 100, 1)]);

    expect(prune.deleteIds).toEqual(["oldest"]);
    expect(prune.reasonsById.oldest).toBe("space-limit");
  });

  it("applies space cleanup before time cleanup when both limits are enabled", () => {
    const manager = new BackupManager({
      runtimeRoot: "H:\\Project",
      now: new Date(Date.UTC(2026, 5, 26)),
      policy: {
        ...DEFAULT_BACKUP_POLICY,
        enableTimeLimit: true,
        enableSpaceLimit: true,
        retentionDays: 30,
        maxLocalBytes: 250
      }
    });

    const prune = manager.planRetentionPrune([
      entry("very-old", 100, 45),
      entry("old", 100, 31),
      entry("fresh", 100, 1)
    ]);

    expect(prune.deleteIds).toEqual(["very-old", "old"]);
    expect(prune.reasonsById).toEqual({
      "very-old": "space-limit",
      old: "time-limit"
    });
  });
});

describe("AuditLogger", () => {
  it("writes JSONL audit events under the runtime audit root", async () => {
    const projectRoot = await makeProjectRoot();
    const logger = new AuditLogger({ runtimeRoot: projectRoot });

    const written = await logger.write({
      requestId: "req_1",
      planId: "plan_1",
      commandName: "attachment.addFile",
      status: "executed",
      timestamp: "2026-06-26T04:00:00.000Z",
      summary: "add attachment",
      affected: {
        zoteroItemKeys: ["ITEM1"],
        collectionKeys: [],
        attachmentKeys: ["ATT1"],
        filePaths: ["H:\\fixtures\\paper.pdf"],
        tags: []
      },
      paramsSummary: { zoteroItemKey: "ITEM1", fileName: "paper.pdf" },
      before: { attachmentCount: 0 },
      after: { attachmentCount: 1 }
    });

    expect(written.filePath.startsWith(path.join(projectRoot, "runtime", "logs", "audit"))).toBe(true);
    const lines = (await readFile(written.filePath, "utf8")).trim().split("\n");
    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0]!)).toMatchObject({
      requestId: "req_1",
      planId: "plan_1",
      commandName: "attachment.addFile",
      paramsSummary: { zoteroItemKey: "ITEM1", fileName: "paper.pdf" },
      before: { attachmentCount: 0 },
      after: { attachmentCount: 1 }
    });
  });
});

describe("UndoManager", () => {
  it("marks file restore unavailable when the linked backup is pruned", () => {
    const manager = new UndoManager();
    const plan = manager.createUndoPlan({
      operationId: "op_1",
      commandName: "attachment.addFile",
      backupId: "backup_1",
      backupAvailable: false,
      reverseCommand: {
        name: "attachment.undoAddedFile",
        input: { attachmentKey: "ATT1" }
      }
    });

    expect(plan.reversible).toBe(true);
    expect(plan.backupAvailable).toBe(false);
    expect(plan.fileRestoreAvailable).toBe(false);
    expect(plan.warnings).toContain("Linked backup is unavailable; file-level restore is not guaranteed.");
  });
});
