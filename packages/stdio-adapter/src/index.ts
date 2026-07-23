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
export const adapterVersion = "0.1.59";

export interface AdapterOptions {
  endpoint: string;
  fetchImpl?: typeof fetch;
}

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

export function getHelpText(): string {
  return [
    "Zotero Local MCP Bridge stdio adapter",
    "",
    "Usage:",
    "  zotero-local-mcp-bridge-stdio [--endpoint <url>]",
    "",
    "Options:",
    "  --endpoint <url>  Zotero plugin HTTP MCP endpoint.",
    "                  Default: " + defaultZoteroLocalMcpBridgeEndpoint,
    "  -h, --help      Show this help message.",
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
      body: JSON.stringify(payload)
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
  if (shouldShowHelp(args)) {
    console.log(getHelpText());
    return;
  }

  if (shouldShowVersion(args)) {
    console.log(adapterVersion);
    return;
  }

  const endpoint = resolveEndpoint(args, env);
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
