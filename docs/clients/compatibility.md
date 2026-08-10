# Client Compatibility

Zotero Local MCP Bridge supports both Streamable HTTP and stdio MCP clients. The Zotero plugin must be installed separately for every option.

| Client | HTTP MCP | stdio MCP | Recommended connection |
|---|---:|---:|---|
| Codex | Yes | Yes | HTTP |
| Claude Code | Yes | Yes | HTTP |
| OpenCode V2 | Yes | Yes | stdio |
| Claude Desktop on macOS/Windows | Through MCPB | Through MCPB | MCPB |
| ChatGPT | No direct local-loopback configuration | No | Not supported by the current local-only architecture |

The `.mcpb` package contains the stdio compatibility adapter and its runtime dependencies. It does not contain or install the Zotero XPI.

- [Codex](codex.md)
- [Claude Code](claude-code.md)
- [OpenCode](opencode.md)
- [Claude Desktop](claude-desktop.md)
