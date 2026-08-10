# Codex

Prefer the plugin-hosted Streamable HTTP endpoint:

```toml
[mcp_servers.zotero-local-mcp-bridge]
url = "http://127.0.0.1:23119/zotero-local-mcp-bridge/mcp"
startup_timeout_sec = 10
tool_timeout_sec = 120
```

Alternatively, install `zotero-local-mcp-bridge-stdio-adapter` and configure its executable as a stdio MCP server.

Verify the connection before editing configuration:

```bash
zotero-local-mcp-bridge-stdio doctor
```
