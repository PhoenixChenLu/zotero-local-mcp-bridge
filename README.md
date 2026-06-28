# Zotero Local MCP Bridge

**A local-first MCP bridge for safe Zotero automation.**

[![License: AGPL-3.0-or-later](https://img.shields.io/badge/License-AGPL--3.0--or--later-blue.svg)](LICENSE)
[![Node.js >=22](https://img.shields.io/badge/Node.js-%3E%3D22-339933.svg)](package.json)
[![Zotero](https://img.shields.io/badge/Zotero-9.x-CC2936.svg)](docs/compatibility-matrix.md)
[![Local First](https://img.shields.io/badge/local--first-no%20cloud%20writes-2E7D32.svg)](#safety-model)

[简体中文](README.zh-CN.md) · English

Zotero Local MCP Bridge lets local AI agents manage a local Zotero library
through a Zotero plugin-hosted HTTP MCP endpoint. It is built for controlled research
workflows where reads, writes, imports, exports, annotations, attachments,
backup, audit, and undo need clear safety boundaries.

## What It Does

- Reads and searches local Zotero items, collections, saved searches,
  attachments, annotations, and audit history.
- Creates and edits items, creators, fields, tags, notes, collections, and
  collection membership.
- Imports and exports BibTeX, RIS, and CSL JSON.
- Formats citations and bibliographies through Zotero.
- Adds, moves, renames, and inspects attachments.
- Calls Zotero's built-in attachment rename logic.
- Lists, creates, and updates supported PDF annotations.
- Runs write operations through mandatory dry-run and confirmation.
- Keeps local audit logs and file-level backup snapshots outside Zotero data
  folders.

## How It Works

```text
Agent
  -> MCP tool
  -> Zotero plugin HTTP MCP endpoint
  -> plugin command table
  -> Zotero internal APIs
```

The Zotero plugin registers the MCP endpoint on Zotero's own local connector
server:

```text
http://127.0.0.1:23119/zotero-local-mcp-bridge/mcp
```

The plugin does not expose a separate public command endpoint in the release
path, and it does not start a Node/Python sidecar by default.

## Get Started

### 1. Install the Zotero plugin

Download the latest release XPI from GitHub Releases:

```text
zotero-local-mcp-bridge.xpi
```

Install it in Zotero:

```text
Tools -> Plugins -> Install Add-on From File
```

Restart Zotero after installation.

There are three supported install paths:

1. npm global setup: `npm install -g zotero-local-mcp-bridge` then
   `zotero-local-mcp-bridge setup`
2. clone and build from source
3. download release artifacts directly

If you are installing from a cloned repository, use the local installer helper:

```powershell
npm install
npm run install:local -- --build
```

The helper builds the release XPI and opens the XPI folder. It does not silently
modify Zotero profiles. See
[Installation](docs/installation.md).

### 2. Check the MCP endpoint

After restarting Zotero, send a JSON-RPC initialize request to the plugin-hosted
MCP endpoint:

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

### 3. Connect your MCP client

Configure your MCP client for Streamable HTTP / HTTP JSON-RPC at the plugin
endpoint above. Users do not need to keep a terminal command or manually started
background service running.

The server exposes one MCP tool per Zotero command, for example
`zotero_collection_get_tree` and `zotero_item_create`. Write tools return a
dry-run plan by default; execution requires the returned `planId` and
`confirmationToken`.

The publishable agent skill is in:

```text
skills/zotero-local-mcp-bridge/
```

Use that skill with any MCP-capable agent that can connect to this server.

## Safety Model

Zotero Local MCP Bridge is intentionally conservative.

- No Zotero Web API writes.
- No `ZOTERO_API_KEY`.
- No direct `zotero.sqlite` writes.
- No arbitrary JavaScript eval as a normal management tool.
- No group library support in the first public version.
- Every write operation must run dry-run before execute.
- Execute requires a valid `planId` and `confirmationToken`.
- Audit logs and backups must stay outside Zotero profile, data, linked-root,
  and attachment directories.
- Delete-like operations are limited to Zotero trash or controlled merge flows;
  permanent erase and empty-trash operations are not supported.

Run modes:

| Mode | Behavior |
| --- | --- |
| Read-only | Blocks all writes |
| Ask for approval | Requires Agent/MCP client approval after dry-run; Zotero does not pop up an ordinary write confirmation dialog |
| YOLO | Allows Agent/MCP client auto-execute after dry-run when `plan.agentApproval.mayAutoExecute` is true; unrecoverable operations still require explicit confirmation |

Configure these in:

```text
Zotero Settings -> Zotero Local MCP Bridge
```

## Supported Commands

| Area | Examples |
| --- | --- |
| Collections | create, rename, move, tree, items, add/remove items, trash |
| Items | get, search, create, update fields, update creators, set collections, tags, trash |
| Search | advanced search, saved search list/get/create/update |
| Citation | citation and bibliography formatting |
| Import/export | BibTeX, RIS, CSL JSON |
| Annotations | list, create, update supported PDF annotations |
| Notes | create child note |
| Attachments | get, add file, move, rename, Zotero rename, undo added, trash |
| Backup | settings, snapshot list, restore, prune |
| Audit | list audit events |
| Safety | profile status, unlock real profile, lock real profile |
| Duplicates | find, controlled merge |

See [the agent skill](skills/zotero-local-mcp-bridge/SKILL.md) for field-level
command formats.

## Documentation

- [Agent skill](skills/zotero-local-mcp-bridge/SKILL.md)
- [Installation](docs/installation.md)
- [MCP publication notes](docs/mcp-publication.md)
- [Zotero plugin publication notes](docs/zotero-plugin-publication.md)
- [Compatibility matrix](docs/compatibility-matrix.md)
- [Privacy policy](PRIVACY.md)
- [Security policy](SECURITY.md)
- [Roadmap](docs/roadmap-complete-zotero-coverage.md)
- [Sponsorship](docs/sponsorship.md)

## Development Commands

```powershell
npm run typecheck
npm run lint
npm run build
npm run build:zotero-plugin:release
```

## Requirements

- Node.js 22 or newer.
- Zotero 9.x is the current primary target.
- Start in read-only mode and review dry-run plans before enabling writes.

## Support

Planned personal sponsorship channels:

- Ko-fi
- Afdian

The real links will be enabled after the maintainer creates those pages. The
project is not currently using a fiscal host.

## License

AGPL-3.0-or-later. See [LICENSE](LICENSE).
