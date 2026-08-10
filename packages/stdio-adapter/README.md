# Zotero Local MCP Bridge stdio adapter

This package exposes a stdio MCP server that forwards MCP requests to the Zotero Local MCP Bridge HTTP endpoint hosted inside Zotero Desktop.

It is intended for MCP clients that do not support Streamable HTTP directly.

## Diagnose the connection

Start Zotero Desktop, enable the Zotero Local MCP Bridge plugin, and run:

```bash
zotero-local-mcp-bridge-stdio doctor
```

The command exits after checking the HTTP endpoint, MCP initialization, and tool discovery. A successful report includes the plugin version, MCP protocol version, tool count, and ready-to-copy configuration for Codex, Claude Code, and OpenCode. It does not modify agent configuration files.

## Default endpoint

```text
http://127.0.0.1:23119/zotero-local-mcp-bridge/mcp
```

Override it with:

```bash
zotero-local-mcp-bridge-stdio --endpoint http://127.0.0.1:23119/zotero-local-mcp-bridge/mcp
```

or:

```bash
ZOTERO_LOCAL_MCP_BRIDGE_ENDPOINT=http://127.0.0.1:23119/zotero-local-mcp-bridge/mcp zotero-local-mcp-bridge-stdio
```

The adapter does not access Zotero directly, does not write `zotero.sqlite`, and does not use the Zotero Web API.
