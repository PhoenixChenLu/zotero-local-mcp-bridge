import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  COMMAND_DEFINITIONS,
  type CommandName,
  type ZoteroLocalCommand,
  type ZoteroLocalCommandResult
} from "../../../src/shared/commands.js";
import { ZoteroBridgeError } from "../../../src/shared/errors.js";
import { AuditLogger } from "../../../src/mcp-server/auditLogger.js";
import { McpToolRegistry } from "../../../src/mcp-server/toolRegistry.js";
import { ZoteroPluginClient, type ZoteroPluginTransport } from "../../../src/mcp-server/zoteroPluginClient.js";

function okResult(commandName: CommandName): ZoteroLocalCommandResult {
  return {
    ok: true,
    commandName,
    requestId: "req_1",
    affected: {
      zoteroItemKeys: [],
      collectionKeys: [],
      attachmentKeys: [],
      tags: []
    },
    data: { commandName }
  };
}

describe("ZoteroPluginClient", () => {
  it("defaults to the Zotero connector server endpoint", () => {
    const client = new ZoteroPluginClient({ transport: async (command) => okResult(command.name) });

    expect(client.commandEndpoint).toBe("http://127.0.0.1:23119/zotero-codex-bridge/command");
    expect(client.healthCheckEndpoint).toBe("http://127.0.0.1:23119/zotero-codex-bridge/health");
  });

  it("reads the plugin health endpoint as plain text", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () =>
    new Response("zotero-codex-bridge ok 0.1.31 zotero-codex-bridge@example.com test", {
        status: 200,
        headers: { "content-type": "text/plain" }
      });

    try {
      const client = new ZoteroPluginClient();

      await expect(client.health()).resolves.toBe(
        "zotero-codex-bridge ok 0.1.31 zotero-codex-bridge@example.com test"
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("sends commands through an injected local transport", async () => {
    const sent: ZoteroLocalCommand[] = [];
    const transport: ZoteroPluginTransport = async (command) => {
      sent.push(command);
      return okResult(command.name);
    };
    const client = new ZoteroPluginClient({ transport });

    const result = await client.execute({
      name: "collection.getTree",
      input: { libraryScope: "local" }
    });

    expect(sent).toEqual([{ name: "collection.getTree", input: { libraryScope: "local" } }]);
    expect(result.ok).toBe(true);
  });
});

describe("McpToolRegistry", () => {
  it("lists every first-version command without exposing arbitrary JavaScript", () => {
    const registry = new McpToolRegistry({ pluginClient: new ZoteroPluginClient({ transport: async (command) => okResult(command.name) }) });

    const tools = registry.listTools();

    expect(tools.map((tool) => tool.commandName)).toEqual(COMMAND_DEFINITIONS.map((definition) => definition.name));
    expect(tools.some((tool) => tool.name.toLowerCase().includes("eval"))).toBe(false);
  });

  it("forwards read commands directly to the plugin client", async () => {
    const sent: ZoteroLocalCommand[] = [];
    const registry = new McpToolRegistry({
      pluginClient: new ZoteroPluginClient({
        transport: async (command) => {
          sent.push(command);
          return okResult(command.name);
        }
      })
    });

    const result = await registry.callTool({
      commandName: "collection.getTree",
      input: { libraryScope: "local" }
    });

    expect(result.mode).toBe("execute");
    expect(sent).toEqual([{ name: "collection.getTree", input: { libraryScope: "local" } }]);
  });

  it("returns dry-run plans by default for write commands", async () => {
    const registry = new McpToolRegistry({ pluginClient: new ZoteroPluginClient({ transport: async (command) => okResult(command.name) }) });

    const result = await registry.callTool({
      commandName: "attachment.addFile",
      input: { zoteroItemKey: "ITEM1", filePath: "H:\\fixtures\\paper.pdf", attachmentMode: "copy" }
    });

    expect(result.mode).toBe("dry-run");
    if (result.mode !== "dry-run") {
      throw new Error("Expected dry-run result");
    }

    expect(result.plan.operation).toBe("attachment.addFile");
    expect(result.plan.resolvedTargets.zoteroItemKeys).toEqual(["ITEM1"]);
    expect(result.plan.resolvedTargets.filePaths).toEqual(["H:\\fixtures\\paper.pdf"]);
    expect(result.plan.requiresBackup).toBe(true);
    expect(result.plan.confirmation.token.startsWith("confirm_")).toBe(true);
  });

  it("includes item create collection and tag targets in dry-run plans", async () => {
    const registry = new McpToolRegistry({ pluginClient: new ZoteroPluginClient({ transport: async (command) => okResult(command.name) }) });

    const result = await registry.callTool({
      commandName: "item.create",
      input: {
        libraryScope: "local-user",
        itemType: "book",
        fields: { title: "Created by Codex Bridge" },
        collectionKeys: ["COLL1", "COLL2"],
        tags: ["imported", "review"]
      }
    });

    expect(result.mode).toBe("dry-run");
    if (result.mode !== "dry-run") {
      throw new Error("Expected dry-run result");
    }

    expect(result.plan.operation).toBe("item.create");
    expect(result.plan.resolvedTargets.collectionKeys).toEqual(["COLL1", "COLL2"]);
    expect(result.plan.resolvedTargets.tags).toEqual(["imported", "review"]);
    expect(result.plan.requiresBackup).toBe(true);
  });

  it("rejects write execute calls without a confirmation token", async () => {
    const registry = new McpToolRegistry({ pluginClient: new ZoteroPluginClient({ transport: async (command) => okResult(command.name) }) });

    await expect(
      registry.callTool({
        commandName: "collection.create",
        input: { libraryScope: "local", name: "A" },
        mode: "execute"
      })
    ).rejects.toMatchObject(new ZoteroBridgeError("CONFIRMATION_REQUIRED", "Write execute requires dry-run confirmation"));
  });

  it("executes write commands only after matching dry-run confirmation", async () => {
    const sent: ZoteroLocalCommand[] = [];
    const registry = new McpToolRegistry({
      pluginClient: new ZoteroPluginClient({
        transport: async (command) => {
          sent.push(command);
          return okResult(command.name);
        }
      })
    });
    const input = { collectionKey: "COLL1", name: "Renamed" };
    const dryRun = await registry.callTool({
      commandName: "collection.rename",
      input
    });
    if (dryRun.mode !== "dry-run") {
      throw new Error("Expected dry-run result");
    }

    const executed = await registry.callTool({
      commandName: "collection.rename",
      input,
      mode: "execute",
      confirmation: {
        planId: dryRun.plan.planId,
        confirmationToken: dryRun.plan.confirmation.token
      }
    });

    expect(executed.mode).toBe("execute");
    expect(sent).toEqual([{ name: "collection.rename", input }]);
  });

  it("writes audit and returns a disabled undo plan for collection.create execute", async () => {
    const projectRoot = await mkdtemp(path.join(tmpdir(), "zotero-bridge-audit-tool-"));
    try {
      const registry = new McpToolRegistry({
        auditLogger: new AuditLogger({ runtimeRoot: projectRoot }),
        now: () => new Date("2026-06-26T12:00:00.000Z"),
        pluginClient: new ZoteroPluginClient({
          transport: async (command) => ({
            ok: true,
            commandName: command.name,
            requestId: "req_create",
            affected: {
              zoteroItemKeys: [],
              collectionKeys: ["COLL_CREATED"],
              attachmentKeys: [],
              tags: []
            },
            data: { collectionKey: "COLL_CREATED", name: "Created" }
          })
        })
      });
      const input = { libraryScope: "local-user", name: "Created" };
      const dryRun = await registry.callTool({ commandName: "collection.create", input });
      if (dryRun.mode !== "dry-run") {
        throw new Error("Expected dry-run result");
      }

      const executed = await registry.callTool({
        commandName: "collection.create",
        input,
        mode: "execute",
        confirmation: {
          planId: dryRun.plan.planId,
          confirmationToken: dryRun.plan.confirmation.token
        }
      });

      expect(executed.mode).toBe("execute");
      if (executed.mode !== "execute") {
        throw new Error("Expected execute result");
      }
      expect(executed.audit?.filePath).toContain(path.join("logs", "audit", "2026-06-26.jsonl"));
      expect(executed.undoPlans).toHaveLength(1);
      expect(executed.undoPlans[0]).toMatchObject({
        commandName: "collection.create",
        reversible: false,
        reverseCommand: {
          name: "collection.deleteCreated.disabled",
          input: { collectionKey: "COLL_CREATED" }
        }
      });

      const auditLine = (await readFile(executed.audit!.filePath, "utf8")).trim();
      expect(JSON.parse(auditLine)).toMatchObject({
        requestId: "req_create",
        commandName: "collection.create",
        status: "executed",
        affected: {
          collectionKeys: ["COLL_CREATED"]
        },
        paramsSummary: {
          libraryScope: "local-user",
          name: "Created"
        }
      });
    } finally {
      await rm(projectRoot, { recursive: true, force: true });
    }
  });
});
