# Installation

Zotero Local MCP Bridge is installed primarily as a Zotero plugin. The release
runtime is a plugin-hosted HTTP MCP endpoint, not a separate sidecar process.

Default MCP endpoint:

```text
http://127.0.0.1:23119/zotero-local-mcp-bridge/mcp
```

It reuses Zotero's own local connector server port. The project does not listen
on `23120` and does not start a Node/Python sidecar in the default release path.

## Option 1: npm Global Setup

Planned public npm install:

```powershell
npm install -g zotero-local-mcp-bridge
zotero-local-mcp-bridge setup
```

The setup command may prepare release artifacts, print the MCP endpoint, and
install selected Agent skills after explicit approval. It must not silently
install the Zotero plugin into a profile.

## Option 2: Clone And Build

From a cloned repository:

```powershell
npm install
npm run build
npm run build:zotero-plugin:release
npm run install:local -- --no-open-folder
```

Generated files:

```text
dist/zotero-local-mcp-bridge.xpi
skills/zotero-local-mcp-bridge/
```

Then:

1. Open Zotero.
2. Open `Tools -> Plugins -> Install Add-on From File`.
3. Select `dist/zotero-local-mcp-bridge.xpi`.
4. Restart Zotero.
5. Configure an MCP client that supports HTTP / Streamable HTTP to use the
   plugin endpoint.
6. Install the skill into your agent, or point the agent at
   `skills/zotero-local-mcp-bridge/`.

## Option 3: GitHub Release Artifacts

Each public release should provide:

```text
zotero-local-mcp-bridge.xpi
zotero-local-mcp-bridge-skill.zip
checksums
```

User flow:

1. Download the XPI from the release.
2. Install the XPI in Zotero manually.
3. Download the skill archive and install it into the target agent.
4. Restart Zotero.
5. Run the MCP initialize check.

## MCP Initialize Check

After restarting Zotero:

```powershell
Invoke-WebRequest `
  -Uri http://127.0.0.1:23119/zotero-local-mcp-bridge/mcp `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"jsonrpc":"2.0","id":"init","method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"manual-probe","version":"0.0.0"}}}' `
  -UserAgent "ZoteroLocalMcpBridge" `
  -UseBasicParsing
```

Expected response includes:

```text
"serverInfo":{"name":"zotero-local-mcp-bridge"
```

## Tools List Check

```powershell
Invoke-WebRequest `
  -Uri http://127.0.0.1:23119/zotero-local-mcp-bridge/mcp `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"jsonrpc":"2.0","id":"tools","method":"tools/list","params":{}}' `
  -UserAgent "ZoteroLocalMcpBridge" `
  -UseBasicParsing
```

Expected response includes Zotero tools such as:

```text
zotero_collection_get_tree
zotero_item_create
```

## Process Lifecycle

| Component | Runs where | Starts with Zotero | Stops with Zotero |
| --- | --- | ---: | ---: |
| Zotero plugin | Zotero process | Yes | Yes |
| MCP endpoint | Zotero connector server | Yes | Yes |
| Agent skill | Agent configuration/files | No | No |

There is no default sidecar process, so no terminal window should appear and no
extra process should remain after Zotero exits.

## Why Not Silent Plugin Install

Zotero plugins can access Zotero data and local files. A public installer should
not silently place a high-privilege plugin into a user profile or bypass Zotero's
plugin manager. The safe install flow keeps the final plugin approval inside
Zotero.
