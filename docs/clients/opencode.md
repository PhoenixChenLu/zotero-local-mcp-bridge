# OpenCode

Install the stdio adapter:

```bash
npm install -g zotero-local-mcp-bridge-stdio-adapter
```

Use the OpenCode V2 configuration structure:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "servers": {
      "zotero-local-mcp-bridge": {
        "type": "local",
        "command": ["zotero-local-mcp-bridge-stdio"]
      }
    }
  }
}
```

Run `zotero-local-mcp-bridge-stdio doctor` while Zotero is open to verify the endpoint and tool discovery.
