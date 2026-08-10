import { describe, expect, it } from "vitest";

import {
  callTool,
  callZoteroHttpMcp,
  defaultZoteroLocalMcpBridgeEndpoint,
  formatDoctorReport,
  getHelpText,
  getClientConfigSnippets,
  isDirectRun,
  listTools,
  resolveCliAction,
  resolveEndpoint,
  runDoctor,
  shouldShowHelp,
  shouldShowVersion,
  type AdapterOptions
} from "../../../packages/stdio-adapter/src/index.js";

describe("stdio adapter", () => {
  it("resolves endpoint from args, env, and default", () => {
    expect(resolveEndpoint(["--endpoint", "http://localhost:1/mcp"], {})).toBe("http://localhost:1/mcp");
    expect(resolveEndpoint(["--endpoint=http://localhost:2/mcp"], {})).toBe("http://localhost:2/mcp");
    expect(resolveEndpoint([], { ZOTERO_LOCAL_MCP_BRIDGE_ENDPOINT: "http://localhost:3/mcp" })).toBe(
      "http://localhost:3/mcp"
    );
    expect(resolveEndpoint([], {})).toBe(defaultZoteroLocalMcpBridgeEndpoint);
    expect(() => resolveEndpoint(["--endpoint"], {})).toThrow("--endpoint requires a URL");
  });

  it("prints help for CLI verification without starting MCP stdio", () => {
    expect(shouldShowHelp(["--help"])).toBe(true);
    expect(shouldShowHelp(["-h"])).toBe(true);
    expect(shouldShowHelp(["--endpoint", "http://localhost/mcp"])).toBe(false);
    expect(getHelpText()).toContain("zotero-local-mcp-bridge-stdio [--endpoint <url>]");
    expect(getHelpText()).toContain(defaultZoteroLocalMcpBridgeEndpoint);
    expect(getHelpText()).toContain("ZOTERO_LOCAL_MCP_BRIDGE_ENDPOINT");
  });

  it("prints version for CLI verification without starting MCP stdio", () => {
    expect(shouldShowVersion(["--version"])).toBe(true);
    expect(shouldShowVersion(["-v"])).toBe(true);
    expect(shouldShowVersion(["--endpoint", "http://localhost/mcp"])).toBe(false);
  });

  it("resolves doctor as a one-shot CLI action", () => {
    expect(resolveCliAction([])).toBe("adapter");
    expect(resolveCliAction(["doctor"])).toBe("doctor");
    expect(resolveCliAction(["doctor", "--endpoint", "http://localhost/mcp"])).toBe("doctor");
    expect(resolveCliAction(["--help"])).toBe("help");
    expect(resolveCliAction(["--version"])).toBe("version");
    expect(getHelpText()).toContain("zotero-local-mcp-bridge-stdio doctor");
  });

  it("runs MCP initialize and tools/list during doctor without starting stdio", async () => {
    const methods: string[] = [];
    const result = await runDoctor({
      endpoint: "http://localhost/mcp",
      fetchImpl: async (_input, init) => {
        const body = JSON.parse(String(init?.body));
        methods.push(body.method);
        if (body.method === "initialize") {
          return new Response(JSON.stringify({
            jsonrpc: "2.0",
            id: body.id,
            result: {
              protocolVersion: "2025-06-18",
              capabilities: { tools: {} },
              serverInfo: { name: "zotero-local-mcp-bridge", version: "0.1.59" }
            }
          }), { status: 200 });
        }
        return new Response(JSON.stringify({
          jsonrpc: "2.0",
          id: body.id,
          result: { tools: [{ name: "zotero_collection_get_tree", description: "List collections", inputSchema: { type: "object" } }] }
        }), { status: 200 });
      }
    });

    expect(methods).toEqual(["initialize", "tools/list"]);
    expect(result).toMatchObject({
      ok: true,
      serverName: "zotero-local-mcp-bridge",
      serverVersion: "0.1.59",
      protocolVersion: "2025-06-18",
      toolCount: 1
    });
  });

  it("classifies endpoint and tool discovery failures", async () => {
    const unavailable = await runDoctor({
      endpoint: "http://localhost/mcp",
      fetchImpl: async () => {
        throw new Error("ECONNREFUSED");
      }
    });
    expect(unavailable).toMatchObject({ ok: false, category: "endpoint-unavailable" });

    const noTools = await runDoctor({
      endpoint: "http://localhost/mcp",
      fetchImpl: async (_input, init) => {
        const body = JSON.parse(String(init?.body));
        const result = body.method === "initialize"
          ? { protocolVersion: "2025-06-18", capabilities: {}, serverInfo: { name: "bridge", version: "0.1.59" } }
          : { tools: [] };
        return new Response(JSON.stringify({ jsonrpc: "2.0", id: body.id, result }), { status: 200 });
      }
    });
    expect(noTools).toMatchObject({ ok: false, category: "tools-unavailable", toolCount: 0 });
  });

  it("formats doctor output with actionable client configuration snippets", () => {
    const snippets = getClientConfigSnippets("http://localhost/mcp");
    expect(snippets.codex).toContain('url = "http://localhost/mcp"');
    expect(snippets.claudeCode).toContain("claude mcp add --transport http");
    expect(JSON.parse(snippets.openCode)).toEqual({
      $schema: "https://opencode.ai/config.json",
      mcp: {
        servers: {
          "zotero-local-mcp-bridge": {
            type: "local",
            command: ["zotero-local-mcp-bridge-stdio", "--endpoint", "http://localhost/mcp"]
          }
        }
      }
    });

    const output = formatDoctorReport({
      ok: true,
      endpoint: "http://localhost/mcp",
      serverName: "zotero-local-mcp-bridge",
      serverVersion: "0.1.59",
      protocolVersion: "2025-06-18",
      toolCount: 52
    });
    expect(output).toContain("PASS");
    expect(output).toContain("52 tools");
    expect(output).toContain("Codex (HTTP)");
    expect(output).toContain("OpenCode (stdio)");
  });

  it("detects direct CLI execution across real files and npm shims", () => {
    const entryPath = "C:\\Users\\Researcher\\App Data\\zotero adapter\\index.js";
    expect(isDirectRun(new URL(`file:///${entryPath.replaceAll("\\", "/").replaceAll(" ", "%20")}`).href, entryPath)).toBe(
      true
    );
    expect(isDirectRun("file:///other/index.js", "C:\\Users\\Researcher\\AppData\\Roaming\\npm\\zotero-local-mcp-bridge-stdio.cmd")).toBe(
      true
    );
    expect(isDirectRun("file:///other/index.js", undefined)).toBe(false);
  });

  it("forwards JSON-RPC requests to the Zotero HTTP MCP endpoint", async () => {
    const requests: unknown[] = [];
    const options: AdapterOptions = {
      endpoint: "http://127.0.0.1:23119/zotero-local-mcp-bridge/mcp",
      fetchImpl: async (_input, init) => {
        requests.push(JSON.parse(String(init?.body)));
        return new Response(JSON.stringify({ jsonrpc: "2.0", id: "x", result: { tools: [] } }), { status: 200 });
      }
    };

    await expect(callZoteroHttpMcp(options, { jsonrpc: "2.0", id: "x", method: "tools/list" })).resolves.toEqual({
      tools: []
    });
    expect(requests).toEqual([{ jsonrpc: "2.0", id: "x", method: "tools/list" }]);
  });

  it("maps list and call tool requests without changing tool payloads", async () => {
    const requests: unknown[] = [];
    const options: AdapterOptions = {
      endpoint: "http://localhost/mcp",
      fetchImpl: async (_input, init) => {
        const body = JSON.parse(String(init?.body));
        requests.push(body);
        if (body.method === "tools/list") {
          return new Response(JSON.stringify({ jsonrpc: "2.0", id: body.id, result: { tools: [] } }), { status: 200 });
        }
        return new Response(
          JSON.stringify({
            jsonrpc: "2.0",
            id: body.id,
            result: {
              content: [{ type: "text", text: "ok" }]
            }
          }),
          { status: 200 }
        );
      }
    };

    await listTools(options, {
      method: "tools/list",
      params: {}
    });
    await callTool(options, {
      method: "tools/call",
      params: {
        name: "zotero_audit_list",
        arguments: {}
      }
    });

    expect(requests).toEqual([
      {
        jsonrpc: "2.0",
        id: "adapter-tools-list",
        method: "tools/list",
        params: {}
      },
      {
        jsonrpc: "2.0",
        id: "adapter-tools-call",
        method: "tools/call",
        params: {
          name: "zotero_audit_list",
          arguments: {}
        }
      }
    ]);
  });

  it("returns clear errors when Zotero HTTP MCP is unavailable or returns MCP errors", async () => {
    await expect(
      callZoteroHttpMcp(
        {
          endpoint: "http://localhost/mcp",
          fetchImpl: async () => {
            throw new Error("ECONNREFUSED");
          }
        },
        { jsonrpc: "2.0", id: "x", method: "tools/list" }
      )
    ).rejects.toThrow("Start Zotero Desktop and enable the plugin");

    await expect(
      callZoteroHttpMcp(
        {
          endpoint: "http://localhost/mcp",
          fetchImpl: async () => new Response(JSON.stringify({ jsonrpc: "2.0", id: "x", error: { code: -32601, message: "Nope" } }), { status: 200 })
        },
        { jsonrpc: "2.0", id: "x", method: "tools/list" }
      )
    ).rejects.toThrow("MCP error -32601: Nope");
  });
});
