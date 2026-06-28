# MCP Publication Notes

This document records the public MCP interface for Zotero Local MCP Bridge.

## Package Boundary

The public agent-facing interface is the Zotero plugin-hosted HTTP MCP endpoint:

```text
http://127.0.0.1:23119/zotero-local-mcp-bridge/mcp
```

The endpoint is registered inside Zotero's own connector server and follows the
Zotero application lifecycle. Starting Zotero makes the endpoint available;
quitting Zotero or disabling the plugin removes it.

The release path does not expose a separate `/command` endpoint and does not
start a Node/Python sidecar.

## Transport

- transport: HTTP / Streamable HTTP compatible JSON-RPC
- host: `127.0.0.1`
- port: Zotero connector server port, normally `23119`
- path: `/zotero-local-mcp-bridge/mcp`

Required JSON-RPC methods:

- `initialize`
- `notifications/initialized`
- `tools/list`
- `tools/call`

`tools/list` returns one MCP tool per internal Zotero command. Write tools return
a dry-run plan by default and require matching confirmation for
`mode: "execute"`.

## Registry And Client Notes

MCP registries and clients differ in HTTP transport support. Before public
publication, verify that the target registry metadata can describe an HTTP MCP
server that is hosted by a locally installed Zotero plugin.

Clients that only support stdio are out of scope for the current release path.
This project publishes the Zotero plugin-hosted HTTP MCP endpoint as the single
supported MCP interface.

## Release Lifecycle Gate

Public release is blocked until all of the following are true:

- Starting Zotero exposes `/zotero-local-mcp-bridge/mcp`.
- Exiting Zotero removes the endpoint.
- Disabling or uninstalling the plugin removes the endpoint.
- `/zotero-local-mcp-bridge/command` is not registered.
- No sidecar process is started.
- No additional port such as `23120` is opened.
- MCP `initialize`, `tools/list`, read tool calls, write dry-run, and write
  execute with confirmation all pass in a clean Zotero profile.

## Agent Skill

The publishable agent skill lives in:

```text
skills/zotero-local-mcp-bridge/
```

The skill is generic MCP guidance. Codex is the first supported agent adapter,
but the protocol is not Codex-specific.

## Required Release Checks

- `npm ci`
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run build:zotero-plugin:release`
- XPI static check for `/zotero-local-mcp-bridge/mcp`
- XPI static check that `/command`, `23120`, and sidecar placeholders are absent
- Zotero runtime MCP initialize and tools/list smoke test
- Write-command dry-run and confirmation smoke check in a clean Zotero profile
