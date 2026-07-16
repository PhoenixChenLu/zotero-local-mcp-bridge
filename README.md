<div align="center">

# Zotero Local MCP Bridge

Use a Zotero plugin-hosted MCP endpoint to let local agents manage a local Zotero library safely.

<p align="center">
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/badge/License-AGPL--3.0--or--later-blue.svg"></a>
  <a href="src/zotero-plugin/manifest.json"><img alt="Version" src="https://img.shields.io/badge/version-0.1.58-4c78a8.svg"></a>
  <a href="https://www.zotero.org/"><img alt="Zotero" src="https://img.shields.io/badge/Zotero-9.x-cc2936.svg"></a>
  <a href="#how-it-works"><img alt="MCP" src="https://img.shields.io/badge/MCP-plugin--hosted-2e7d32.svg"></a>
  <a href="#scope"><img alt="Local First" src="https://img.shields.io/badge/local--first-loopback--only-2e7d32.svg"></a>
  <a href="https://github.com/PhoenixChenLu/zotero-local-mcp-bridge/pulls"><img alt="PRs welcome" src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg"></a>
  <a href="skills/zotero-local-mcp-bridge/SKILL.md"><img alt="Codex ready" src="https://img.shields.io/badge/Codex-ready-111827.svg"></a>
  <a href="skills/zotero-local-mcp-bridge/SKILL.md"><img alt="OpenCode ready" src="https://img.shields.io/badge/OpenCode-ready-111827.svg"></a>
  <a href="skills/zotero-local-mcp-bridge/SKILL.md"><img alt="Claude Code ready" src="https://img.shields.io/badge/Claude%20Code-ready-111827.svg"></a>
</p>

AGPL-3.0-or-later · Plugin version 0.1.58 · Zotero 9.x · Plugin-hosted MCP · Local loopback access

[简体中文](README.zh-CN.md) · **English**

[What It Does](#what-it-does) · [What It Does Not Do](#what-it-does-not-do) · [Scope](#scope) · [How It Works](#how-it-works) · [Quick Start](#quick-start) · [Examples](#examples) · [Support Author](#support-author) · [License](#license)

</div>

---

## ✨ What It Does

Zotero Local MCP Bridge lets MCP-capable agents manage a local Zotero library through Zotero itself. It is not a database script that bypasses Zotero. It is a local MCP entrypoint running inside the Zotero plugin.

| Area | Capability |
|---|---|
| 📚 Items and collections | Read, search, create, and edit items; batch-check whether DOI records already exist; batch-manage membership in top-level collections or subcollections |
| 📎 Attachments | Add, move, rename, and inspect attachments; import single or multiple PDF/EPUB files and call Zotero's built-in metadata recognition and attachment rename logic |
| 📝 Annotations and citations | Read, create, and update supported PDF annotations; format citations and bibliographies through Zotero |
| 🔁 Import and export | Import and export BibTeX, RIS, and CSL JSON |
| 🔎 Search | Use basic search, advanced search, and saved search read/update workflows |
| 🛡️ Safety workflow | Enforce dry-run for all writes; support approval, audit, file-level backup, and undo |
| 🧩 Duplicates | Find duplicates and run controlled duplicate merge flows |

> [!NOTE]
> Writes do not execute immediately. The agent first receives a dry-run plan, warnings, affected targets, and confirmation data. In approval modes, execution must wait for user approval.

---

## 🚫 What It Does Not Do

| Not supported | Reason |
|---|---|
| Managing online Zotero libraries | This project does not write through the Zotero Web API or manage remote Zotero accounts |
| Using `ZOTERO_API_KEY` | This project does not request, read, or store a Zotero API key |
| Writing directly to `zotero.sqlite` | Changes should go through Zotero internal APIs |
| Exposing arbitrary JavaScript eval | Ordinary management must come from the plugin command table |
| Managing group libraries | The current public scope covers local user libraries only |
| Permanent deletion or empty trash | Current delete-like flows use Zotero trash or controlled merge, not unrecoverable erase |
| Directly deleting existing attachment files | Attachment file operations must respect backup/undo and safety boundaries |

---

## 📍 Scope

This plugin is designed for Zotero Desktop and a local MCP client on the same machine. The MCP endpoint is registered on Zotero's local connector server and uses local loopback access only.

| Item | Current setting |
|---|---|
| Runtime location | Inside the Zotero plugin |
| Endpoint | `http://127.0.0.1:23119/zotero-local-mcp-bridge/mcp` |
| Library scope | Local user library |
| Write path | Zotero internal APIs |
| Network model | Local loopback, no cloud writes |
| Audit and backup | Must stay outside the Zotero profile, Zotero data directory, linked attachment root, and attachment directories |

Run mode is configured in `Settings -> Zotero Local MCP Bridge`:

| Mode | Behavior |
|---|---|
| `readonly` | Blocks all writes |
| `askforapprove` | The agent asks the user for approval after dry-run |
| `yolo` | Ordinary writes may auto-execute when the plan allows it; high-risk or future unrecoverable operations still require explicit confirmation |

---

## ⚙️ How It Works

```text
MCP-capable agent
  -> MCP tool call
  -> Zotero local connector server
  -> Zotero Local MCP Bridge plugin endpoint
  -> plugin command table
  -> Zotero internal API
```

The MCP endpoint is hosted inside the Zotero plugin:

```text
http://127.0.0.1:23119/zotero-local-mcp-bridge/mcp
```

There is no separate Node, Python, or sidecar MCP process to start. Starting Zotero starts the plugin endpoint. Closing Zotero stops it. The release build exposes MCP tools, not the old private command endpoint.

Codex and Claude Code can connect to the Streamable HTTP MCP endpoint directly. OpenCode and other clients with stdio support but no Streamable HTTP support can use the standalone stdio adapter. The adapter runs on the agent side, stays outside the XPI, and never touches the Zotero database.

---

## 🚀 Quick Start

### 1. Download Release Files

Download from [GitHub Releases](https://github.com/PhoenixChenLu/zotero-local-mcp-bridge/releases):

| File | Purpose |
|---|---|
| `zotero-local-mcp-bridge.xpi` | Zotero plugin |
| English skill | For English-speaking agents |
| Chinese skill | For Chinese-speaking agents |

### 2. Install The Zotero Plugin

Open the Zotero plugin manager:

```text
Tools -> Plugins
```

Drag `zotero-local-mcp-bridge.xpi` into the plugin manager window, confirm installation when prompted, and restart Zotero.

### 3. Choose Run Mode

Open:

```text
Settings -> Zotero Local MCP Bridge
```

For first use, start with `readonly` or `askforapprove`. Use `yolo` only after you understand dry-run, approval, audit, and backup behavior.

### 4. Connect The MCP Client

There are two ways to connect. Prefer the stdio adapter because most agents support stdio MCP reliably. If your agent supports HTTP MCP directly, you can skip the npm package and connect to the Zotero plugin endpoint.

#### Option A: stdio MCP

Install the npm adapter:

```bash
npm install -g zotero-local-mcp-bridge-stdio-adapter
```

Then configure stdio MCP in your agent:

```toml
[mcp_servers.zotero-local-mcp-bridge]
command = "zotero-local-mcp-bridge-stdio"
args = []
startup_timeout_sec = 20
tool_timeout_sec = 120
```

Generic stdio MCP configuration:

```json
{
  "mcpServers": {
    "zotero-local-mcp-bridge": {
      "type": "stdio",
      "command": "zotero-local-mcp-bridge-stdio",
      "args": []
    }
  }
}
```

You can also use `npx` without a global install:

```json
{
  "mcpServers": {
    "zotero-local-mcp-bridge": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "zotero-local-mcp-bridge-stdio-adapter"]
    }
  }
}
```

The stdio adapter is a compatibility layer started by the agent session. It forwards stdio MCP requests to the Zotero plugin HTTP MCP endpoint. It is not the Zotero plugin itself and does not start with Zotero.

#### Option B: HTTP MCP

If your agent supports Streamable HTTP / HTTP MCP, you can skip the npm package and connect directly to the Zotero plugin endpoint:

```text
http://127.0.0.1:23119/zotero-local-mcp-bridge/mcp
```

Codex example:

```toml
[mcp_servers.zotero-local-mcp-bridge]
url = "http://127.0.0.1:23119/zotero-local-mcp-bridge/mcp"
startup_timeout_sec = 10
tool_timeout_sec = 120
```

Claude Code example:

```bash
claude mcp add --transport http zotero-local-mcp-bridge http://127.0.0.1:23119/zotero-local-mcp-bridge/mcp
```

### 5. Install The Matching Skill

| Language | Skill |
|---|---|
| English | [skills/zotero-local-mcp-bridge/SKILL.md](skills/zotero-local-mcp-bridge/SKILL.md) |
| Chinese | [skills/zotero-local-mcp-bridge-zh-cn/SKILL.md](skills/zotero-local-mcp-bridge-zh-cn/SKILL.md) |

Tell the agent to use Zotero through Zotero Local MCP Bridge. When approval is required, the agent should briefly describe the pending operation and wait for user approval.

---

## 🧪 Examples

| Ask the agent to | Expected behavior |
|---|---|
| List my Zotero collection tree | Read-only query, no write confirmation |
| Check which DOI values already exist in my library | Run one batch lookup and return matching items, reusable item keys, and unmatched DOI values |
| Add these existing items to "Current Project / Reading Queue" | Use one dry-run, one approval when required, and one batch write while skipping existing members |
| Create a "Reading Queue" subcollection under "Current Project" | Dry-run first, then ask for approval |
| Add this PDF attachment to this item | Resolve the item and file path, then dry-run the attachment operation |
| Import this PDF and retrieve metadata automatically | Dry-run first, then use Zotero's built-in recognition flow to create the parent item and rename the attachment according to preferences |
| Import these PDFs and retrieve metadata automatically | Use the batch recognition tool with one dry-run, one approval, and one execute |
| Export selected items as BibTeX | Read-only export, no write confirmation |
| Format a bibliography with a chosen style | Use Zotero's citation formatter |

In approval mode, a single write operation should interact through the agent like this:

```text
I am about to create a subcollection named "Reading Queue" under "Current Project". Approve execution?
```

Multiple pending operations use a numbered table, so the user can approve all operations or approve only selected numbers:

```text
The following operations need approval:

| No. | Operation |
|---:|---|
| 1 | Move subcollection "Temporary" under "Old Project" to Zotero trash |
| 2 | Merge duplicate items "Smith 2024" and "Smith 2024 copy" |
| 3 | Add "Zotero MCP design notes" to "Current Project / Reading Queue" |
```

The user can reply "approve all", or reply "approve 1 and 3, reject 2".

---

## ❤️ Support Author

<div align="center">
  <a id="ko-fi-support" href="https://ko-fi.com/phoenixchen"><img alt="Ko-fi" src="https://img.shields.io/badge/Ko--fi-Support%20Author-ff5e5b?logo=kofi&logoColor=white"></a>
  <a id="afdian-support" href="https://afdian.com/a/PhoenixChen"><img alt="Afdian" src="https://img.shields.io/badge/Afdian-Support%20Author-946ce6"></a>
</div>

---

## 📄 License

Zotero Local MCP Bridge is licensed under AGPL-3.0-or-later. See [LICENSE](LICENSE).
