#!/usr/bin/env node

import { pathToFileURL } from "node:url";

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolRequest,
  type CallToolResult,
  type ListToolsRequest,
  type ListToolsResult
} from "@modelcontextprotocol/sdk/types.js";

export const defaultZoteroLocalMcpBridgeEndpoint = "http://127.0.0.1:23119/zotero-local-mcp-bridge/mcp";
export const adapterVersion = "0.1.60";

export interface AdapterOptions {
  endpoint: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export type CliAction = "adapter" | "doctor" | "help" | "version";

export type DoctorFailureCategory = "endpoint-unavailable" | "protocol-error" | "tools-unavailable";

export type DoctorResult = {
  ok: boolean;
  endpoint: string;
  serverName?: string;
  serverVersion?: string;
  protocolVersion?: string;
  toolCount?: number;
  category?: DoctorFailureCategory;
  message?: string;
};

export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: unknown;
}

interface JsonRpcSuccess<T> {
  jsonrpc: "2.0";
  id: string | number;
  result: T;
}

interface JsonRpcFailure {
  jsonrpc: "2.0";
  id: string | number | null;
  error: {
    code: number;
    message: string;
    data?: unknown;
  };
}

type JsonRpcResponse<T> = JsonRpcSuccess<T> | JsonRpcFailure;

export function shouldShowHelp(args: readonly string[]): boolean {
  return args.includes("--help") || args.includes("-h");
}

export function shouldShowVersion(args: readonly string[]): boolean {
  return args.includes("--version") || args.includes("-v");
}

export function resolveCliAction(args: readonly string[]): CliAction {
  if (shouldShowHelp(args)) {
    return "help";
  }
  if (shouldShowVersion(args)) {
    return "version";
  }
  if (args.includes("doctor")) {
    return "doctor";
  }
  return "adapter";
}

export function getHelpText(): string {
  return [
    "Zotero Local MCP Bridge stdio adapter",
    "",
    "Usage:",
    "  zotero-local-mcp-bridge-stdio [--endpoint <url>]",
    "  zotero-local-mcp-bridge-stdio doctor [--endpoint <url>]",
    "",
    "Options:",
    "  --endpoint <url>  Zotero plugin HTTP MCP endpoint.",
    "                  Default: " + defaultZoteroLocalMcpBridgeEndpoint,
    "  -h, --help       Show this help message.",
    "  -v, --version    Show the adapter version.",
    "",
    "Environment:",
    "  ZOTERO_LOCAL_MCP_BRIDGE_ENDPOINT  Override the default endpoint.",
    "",
    "This adapter forwards stdio MCP requests to the Zotero Local MCP Bridge",
    "HTTP MCP endpoint hosted inside Zotero Desktop. Start Zotero and enable",
    "the plugin before using this adapter from an MCP client."
  ].join("\n");
}

export function resolveEndpoint(args: readonly string[], env: NodeJS.ProcessEnv = process.env): string {
  const endpointFlagIndex = args.indexOf("--endpoint");
  if (endpointFlagIndex >= 0) {
    const endpoint = args[endpointFlagIndex + 1];
    if (!endpoint) {
      throw new Error("--endpoint requires a URL");
    }
    return endpoint;
  }

  const equalsFlag = args.find((arg) => arg.startsWith("--endpoint="));
  if (equalsFlag) {
    const endpoint = equalsFlag.slice("--endpoint=".length);
    if (!endpoint) {
      throw new Error("--endpoint requires a URL");
    }
    return endpoint;
  }

  return env.ZOTERO_LOCAL_MCP_BRIDGE_ENDPOINT || defaultZoteroLocalMcpBridgeEndpoint;
}

export async function callZoteroHttpMcp<T>(options: AdapterOptions, payload: JsonRpcRequest): Promise<T> {
  const fetchImpl = options.fetchImpl || fetch;
  let response: Response;

  try {
    response = await fetchImpl(options.endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "accept": "application/json"
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(options.timeoutMs ?? 10_000)
    });
  } catch (error) {
    throw new Error(`Zotero Local MCP Bridge is unavailable at ${options.endpoint}. Start Zotero Desktop and enable the plugin. ${formatError(error)}`);
  }

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Zotero Local MCP Bridge HTTP ${response.status}: ${text || response.statusText}`);
  }

  let parsed: JsonRpcResponse<T>;
  try {
    parsed = JSON.parse(text) as JsonRpcResponse<T>;
  } catch (error) {
    throw new Error(`Zotero Local MCP Bridge returned invalid JSON. ${formatError(error)}`);
  }

  if ("error" in parsed) {
    throw new Error(`Zotero Local MCP Bridge MCP error ${parsed.error.code}: ${parsed.error.message}`);
  }

  return parsed.result;
}

export async function runDoctor(options: AdapterOptions): Promise<DoctorResult> {
  let initializeResult: {
    protocolVersion?: string;
    serverInfo?: { name?: string; version?: string };
  };
  try {
    initializeResult = await callZoteroHttpMcp(options, {
      jsonrpc: "2.0",
      id: "doctor-initialize",
      method: "initialize",
      params: {
        protocolVersion: "2025-06-18",
        capabilities: {},
        clientInfo: {
          name: "zotero-local-mcp-bridge-doctor",
          version: adapterVersion
        }
      }
    });
  } catch (error) {
    const message = formatError(error);
    return {
      ok: false,
      endpoint: options.endpoint,
      category: message.includes("is unavailable") ? "endpoint-unavailable" : "protocol-error",
      message
    };
  }

  if (!initializeResult.protocolVersion || !initializeResult.serverInfo?.name) {
    return {
      ok: false,
      endpoint: options.endpoint,
      category: "protocol-error",
      message: "MCP initialize response is missing protocolVersion or serverInfo"
    };
  }

  try {
    const toolsResult = await callZoteroHttpMcp<ListToolsResult>(options, {
      jsonrpc: "2.0",
      id: "doctor-tools-list",
      method: "tools/list",
      params: {}
    });
    const toolCount = Array.isArray(toolsResult.tools) ? toolsResult.tools.length : 0;
    if (toolCount === 0) {
      return {
        ok: false,
        endpoint: options.endpoint,
        serverName: initializeResult.serverInfo.name,
        serverVersion: initializeResult.serverInfo.version,
        protocolVersion: initializeResult.protocolVersion,
        toolCount,
        category: "tools-unavailable",
        message: "MCP endpoint initialized successfully but exposed no tools"
      };
    }
    return {
      ok: true,
      endpoint: options.endpoint,
      serverName: initializeResult.serverInfo.name,
      serverVersion: initializeResult.serverInfo.version,
      protocolVersion: initializeResult.protocolVersion,
      toolCount
    };
  } catch (error) {
    return {
      ok: false,
      endpoint: options.endpoint,
      serverName: initializeResult.serverInfo.name,
      serverVersion: initializeResult.serverInfo.version,
      protocolVersion: initializeResult.protocolVersion,
      category: "tools-unavailable",
      message: formatError(error)
    };
  }
}

export function getClientConfigSnippets(endpoint: string): {
  codex: string;
  claudeCode: string;
  openCode: string;
} {
  return {
    codex: [
      "[mcp_servers.zotero-local-mcp-bridge]",
      `url = ${JSON.stringify(endpoint)}`,
      "startup_timeout_sec = 10",
      "tool_timeout_sec = 120"
    ].join("\n"),
    claudeCode: `claude mcp add --transport http zotero-local-mcp-bridge ${endpoint}`,
    openCode: JSON.stringify({
      $schema: "https://opencode.ai/config.json",
      mcp: {
        servers: {
          "zotero-local-mcp-bridge": {
            type: "local",
            command: [
              "zotero-local-mcp-bridge-stdio",
              ...(endpoint === defaultZoteroLocalMcpBridgeEndpoint ? [] : ["--endpoint", endpoint])
            ]
          }
        }
      }
    }, null, 2)
  };
}

export function formatDoctorReport(result: DoctorResult): string {
  if (!result.ok) {
    return [
      "Zotero Local MCP Bridge doctor: FAIL",
      `Endpoint: ${result.endpoint}`,
      `Category: ${result.category || "unknown"}`,
      `Problem: ${result.message || "Unknown doctor failure"}`,
      "Next: start Zotero Desktop, confirm the plugin is enabled, then rerun doctor."
    ].join("\n");
  }

  const snippets = getClientConfigSnippets(result.endpoint);
  return [
    "Zotero Local MCP Bridge doctor: PASS",
    `Endpoint: ${result.endpoint}`,
    `Server: ${result.serverName || "unknown"} ${result.serverVersion || "unknown"}`,
    `Protocol: ${result.protocolVersion || "unknown"}`,
    `Tools: ${result.toolCount || 0} tools`,
    "",
    "Codex (HTTP):",
    snippets.codex,
    "",
    "Claude Code (HTTP):",
    snippets.claudeCode,
    "",
    "OpenCode (stdio):",
    snippets.openCode
  ].join("\n");
}

export async function listTools(options: AdapterOptions, request: ListToolsRequest): Promise<ListToolsResult> {
  return callZoteroHttpMcp<ListToolsResult>(options, {
    jsonrpc: "2.0",
    id: "adapter-tools-list",
    method: "tools/list",
    params: request.params
  });
}

export async function callTool(options: AdapterOptions, request: CallToolRequest): Promise<CallToolResult> {
  return callZoteroHttpMcp<CallToolResult>(options, {
    jsonrpc: "2.0",
    id: "adapter-tools-call",
    method: "tools/call",
    params: request.params
  });
}

export function createAdapterServer(options: AdapterOptions): Server {
  const server = new Server(
    {
      name: "zotero-local-mcp-bridge-stdio-adapter",
      version: adapterVersion
    },
    {
      capabilities: {
        tools: {}
      },
      instructions: "Forward stdio MCP requests to the Zotero Local MCP Bridge HTTP endpoint hosted by Zotero Desktop."
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, (request) => listTools(options, request));
  server.setRequestHandler(CallToolRequestSchema, (request) => callTool(options, request));

  return server;
}

export async function runAdapter(args: readonly string[] = process.argv.slice(2), env: NodeJS.ProcessEnv = process.env): Promise<void> {
  const action = resolveCliAction(args);
  if (action === "help") {
    console.log(getHelpText());
    return;
  }

  if (action === "version") {
    console.log(adapterVersion);
    return;
  }

  const endpoint = resolveEndpoint(args, env);
  if (action === "doctor") {
    const result = await runDoctor({ endpoint });
    console.log(formatDoctorReport(result));
    if (!result.ok) {
      process.exitCode = 1;
    }
    return;
  }

  const server = createAdapterServer({ endpoint });
  await server.connect(new StdioServerTransport());
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function isDirectRun(importUrl: string, entryPath: string | undefined): boolean {
  if (!entryPath) {
    return false;
  }

  return (
    importUrl === pathToFileURL(entryPath).href ||
    entryPath.endsWith("zotero-local-mcp-bridge-stdio") ||
    entryPath.endsWith("zotero-local-mcp-bridge-stdio.cmd") ||
    entryPath.endsWith("zotero-local-mcp-bridge-stdio.ps1")
  );
}

if (isDirectRun(import.meta.url, process.argv[1])) {
  runAdapter().catch((error: unknown) => {
    console.error(formatError(error));
    process.exit(1);
  });
}
