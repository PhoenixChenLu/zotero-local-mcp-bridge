# Zotero Local MCP Bridge Agent Skill

This document describes the general agent skill. The publishable skill package lives in this repository at:

```text
skills\zotero-local-mcp-bridge\SKILL.md
```

## Purpose

The skill is a general MCP agent operating protocol, not a Codex-only workflow. Any agent using this project should communicate through the MCP tools, while Codex is only the first adapter target.

Normal path:

```text
Agent -> MCP tool -> Zotero plugin HTTP MCP endpoint -> plugin command table -> Zotero internal API
```

The agent must not directly call any private Zotero plugin command HTTP endpoint. The release path exposes MCP JSON-RPC only at `/zotero-local-mcp-bridge/mcp`.

## Command Format

MCP tool names are generated from internal command names as `zotero_` plus dot-separated and camelCase command segments converted to snake_case:

```text
collection.getTree -> zotero_collection_get_tree
savedSearch.create -> zotero_saved_search_create
attachment.addFile -> zotero_attachment_add_file
backup.snapshot.restore -> zotero_backup_snapshot_restore
```

Write operations use dry-run then execute:

```json
{
  "commandName": "item.updateFields",
  "input": {
    "zoteroItemKey": "ABCD1234",
    "fields": {
      "title": "Updated title"
    }
  },
  "mode": "dry-run"
}
```

```json
{
  "commandName": "item.updateFields",
  "input": {
    "zoteroItemKey": "ABCD1234",
    "fields": {
      "title": "Updated title"
    }
  },
  "mode": "execute",
  "confirmation": {
    "planId": "<planId>",
    "confirmationToken": "<confirmationToken>"
  }
}
```

If an MCP client exposes one tool per command, pass the same `input`, `mode`, and `confirmation` fields to that tool and follow the client schema.

## Supported Command Groups

- Collections: `collection.create`, `collection.rename`, `collection.move`, `collection.getTree`, `collection.getItems`, `collection.addItems`, `collection.removeItems`, `collection.trash`.
- Items: `item.get`, `item.search`, `item.create`, `item.updateFields`, `item.updateCreators`, `item.setCollections`, `item.updateTags`, `item.trash`.
- Search and citations: `search.advanced`, `savedSearch.list`, `savedSearch.get`, `savedSearch.create`, `savedSearch.update`, `citation.format`.
- Import/export: `import.bibtex`, `import.ris`, `import.cslJson`, `export.bibtex`, `export.ris`, `export.cslJson`.
- Annotations and notes: `annotation.list`, `annotation.create`, `annotation.update`, `note.createChild`.
- Attachments: `attachment.get`, `attachment.getForItem`, `attachment.addFile`, `attachment.moveToItem`, `attachment.rename`, `attachment.runZoteroRename`, `attachment.undoAdded`, `attachment.trash`, `attachment.renamePreferences.get`, `attachment.renamePreferences.set`.
- Backup and audit: `backup.settings.get`, `backup.settings.set`, `backup.snapshot.list`, `backup.snapshot.restore`, `backup.snapshot.prune`, `audit.list`.
- Duplicates and safety: `duplicates.find`, `duplicates.merge`, `safety.getProfileStatus`, `safety.unlockRealProfile`, `safety.lockRealProfile`.

For the full field-level table, use the publishable skill at `skills\zotero-local-mcp-bridge\SKILL.md`.

## Hard Rules

- Use MCP tools for ordinary Zotero operations.
- Do not use Zotero Web API writes.
- Do not directly read or write `zotero.sqlite`.
- Do not expose arbitrary Zotero JavaScript eval.
- Do not support group library operations in the first public version.
- Do not permanently delete items, empty Zotero trash, or directly delete existing attachment files.
- Resolve Zotero item/collection/attachment keys with read tools before writing.
- Run dry-run before every write.
- Execute writes only with matching `planId`, `confirmationToken`, and unchanged input.

## Write Workflow

1. Read current Zotero state.
2. Call the MCP write tool in dry-run mode.
3. Review plan, targets, warnings, risk, confirmation, and `plan.agentApproval`.
4. Ask the user when `plan.agentApproval.required` is true.
5. Execute through MCP only.
6. Report affected keys, audit result, and undo plans.

`askforapprove` is an Agent-layer approval mode. Zotero does not show a built-in confirmation dialog for ordinary MCP writes. The Agent must present the dry-run plan in the chat/client UI, wait for user approval, and only then call execute with the unchanged input plus `planId` and `confirmationToken`.

## Plugin Settings And Permission Blocks

User-facing safety settings are in:

```text
Zotero Settings -> Zotero Local MCP Bridge
```

When a write is blocked by `readonly`, the agent must not retry or bypass it. Tell the user to change Run mode to `Ask for approval` or `YOLO` in the Zotero plugin settings if they want writes enabled.

When the real profile is locked, the agent must not write. It may use `safety.unlockRealProfile` only after the user explicitly requests real-profile writes and accepts the TTL-bound unlock.

When file backup/undo is disabled or the backup path is invalid, the agent must warn before attachment file operations and ask the user to enable or fix File backup / undo in plugin settings. Backup and audit paths must not point into Zotero profile, Zotero data directory, linked attachment root, or attachment folders.

Agents may inspect settings with `safety.getProfileStatus`, `backup.settings.get`, `attachment.renamePreferences.get`, and `audit.list`. Agents may modify `backup.settings.set`, `attachment.renamePreferences.set`, `safety.unlockRealProfile`, and `safety.lockRealProfile` only after explicit user request and the normal dry-run/confirmation flow.

High-risk operations must stop for confirmation:

- `item.trash`
- `attachment.trash`
- `collection.trash`
- `duplicates.merge`
- `backup.snapshot.restore`
- `backup.snapshot.prune`
- `safety.unlockRealProfile`

## Capability Groups

- Collections and subcollections.
- Item creation and metadata editing.
- Tags, notes, and item/collection membership.
- BibTeX, RIS, and CSL JSON import/export.
- Citation formatting.
- PDF annotation listing, creation, and update.
- Attachment add, move, rename, Zotero auto-rename, and undo-added.
- Backup settings, snapshot listing, restore, and prune.
- Audit listing.
- Duplicate find and controlled merge.
- Safety profile status, real-profile unlock, and lock.

## Codex Adapter

Codex should load the installed skill and use MCP tools exposed in the current thread. Shell commands and direct HTTP calls are acceptable only for diagnostics, such as sending an MCP `initialize` or `tools/list` request to verify whether Zotero and the plugin endpoint are alive when MCP setup is broken.
