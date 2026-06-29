---
name: zotero-local-mcp-bridge
description: Safely manage a local Zotero library through the Zotero Local MCP Bridge. Use when an agent needs to read, search, create, update, import/export, annotate, attach files, manage collections/items/tags/notes, inspect audit logs, or run backup/undo workflows in Zotero via MCP tools. This skill requires the plugin-hosted MCP tool layer and forbids Zotero Web API writes, direct zotero.sqlite writes, arbitrary Zotero JavaScript eval, and direct plugin command HTTP calls.
---

# Zotero Local MCP Bridge

Use Zotero through the plugin-hosted MCP endpoint. Do not call private Zotero plugin command endpoints directly. The MCP layer owns tool discovery, JSON-RPC call shape, dry-run, confirmation, audit, backup, undo, and agent-facing tool schemas. The Zotero plugin owns the MCP endpoint, the internal command table, and Zotero internal API execution.

## Required Path

Use this path for normal work:

```text
Agent -> MCP tool -> Zotero plugin HTTP MCP endpoint -> plugin command table -> Zotero internal API
```

Do not call `/zotero-local-mcp-bridge/command` directly from the agent. Current release builds do not expose that private endpoint. Direct HTTP diagnostics are allowed only when the MCP endpoint itself is broken.

Never use:

- Zotero Web API for writes.
- Direct `zotero.sqlite` reads or writes.
- Arbitrary Zotero JavaScript eval for ordinary management.
- Group library operations.
- Permanent delete, empty trash, or direct deletion of existing attachment files unless a future project version explicitly adds those commands.

## Startup Checks

Before changing Zotero state:

1. Confirm the plugin-hosted MCP endpoint exposes Zotero tools.
2. Prefer a health or status tool when available; otherwise use the documented MCP read/status tool.
3. Confirm the user is operating on the intended local user library.
4. If Zotero is not reachable, ask the user to open Zotero and ensure the plugin is installed and enabled.

If the current agent can read this skill but the tool list does not include `zotero_*` MCP tools, do not continue Zotero operations. Explain that the MCP endpoint has not been registered as a tool source:

- Codex / Claude Code: register `http://127.0.0.1:23119/zotero-local-mcp-bridge/mcp` directly.
- OpenCode / stdio-only clients: use `zotero-local-mcp-bridge-stdio-adapter` as the compatibility layer.

The stdio adapter only forwards protocol traffic and is started by the agent session. It is not the Zotero plugin itself, does not start with Zotero, and does not access the Zotero database directly.

Tool names are generated from command names as `zotero_` plus dot-separated and camelCase command segments converted to snake_case. Always use the tool list actually exposed by the MCP client instead of inventing names from memory.

Examples:

- `collection.getTree` -> `zotero_collection_get_tree`
- `item.search` -> `zotero_item_search`
- `attachment.addFile` -> `zotero_attachment_add_file`
- `backup.snapshot.list` -> `zotero_backup_snapshot_list`

## MCP Call Format

Read commands execute directly with their input fields.

Write commands use dry-run first:

```json
{
  "zoteroItemKey": "ABCD1234",
  "fields": {
    "title": "Updated title"
  },
  "mode": "dry-run"
}
```

Then execute with unchanged input and the dry-run confirmation:

```json
{
  "zoteroItemKey": "ABCD1234",
  "fields": {
    "title": "Updated title"
  },
  "mode": "execute",
  "confirmation": {
    "planId": "<planId>",
    "confirmationToken": "<confirmationToken>"
  }
}
```

Pass command input fields directly as MCP tool arguments, with optional top-level `mode` and `confirmation`. A legacy `input` wrapper may be accepted for compatibility, but new callers should use direct arguments.

## Supported Commands

Use this table as the first reference for operation format. `R` means read-only. `W` means write and requires dry-run before execute.

| Command | MCP tool | R/W | Input fields |
|---|---|---:|---|
| `collection.create` | `zotero_collection_create` | W | `libraryScope`, `name`, `parentCollectionKey` |
| `collection.rename` | `zotero_collection_rename` | W | `collectionKey`, `name` |
| `collection.move` | `zotero_collection_move` | W | `collectionKey`, `parentCollectionKey` |
| `collection.getTree` | `zotero_collection_get_tree` | R | `libraryScope` |
| `collection.getItems` | `zotero_collection_get_items` | R | `collectionKey` |
| `collection.addItems` | `zotero_collection_add_items` | W | `collectionKey`, `zoteroItemKeys` |
| `collection.removeItems` | `zotero_collection_remove_items` | W | `collectionKey`, `zoteroItemKeys` |
| `collection.trash` | `zotero_collection_trash` | W | `collectionKey`, `trashDescendentItems` |
| `item.get` | `zotero_item_get` | R | `zoteroItemKey` |
| `item.search` | `zotero_item_search` | R | `query`, `itemType`, `collectionKey`, `tag`, `limit` |
| `item.create` | `zotero_item_create` | W | `libraryScope`, `itemType`, `fields`, `creators`, `collectionKeys`, `tags` |
| `item.updateFields` | `zotero_item_update_fields` | W | `zoteroItemKey`, `fields` |
| `item.updateCreators` | `zotero_item_update_creators` | W | `zoteroItemKey`, `creators` |
| `item.setCollections` | `zotero_item_set_collections` | W | `zoteroItemKey`, `collectionKeys` |
| `item.updateTags` | `zotero_item_update_tags` | W | `zoteroItemKey`, `addTags`, `removeTags` |
| `item.trash` | `zotero_item_trash` | W | `zoteroItemKeys` |
| `search.advanced` | `zotero_search_advanced` | R | `conditions`, `joinMode`, `includeChildren`, `includeDeleted`, `limit` |
| `savedSearch.list` | `zotero_saved_search_list` | R | none |
| `savedSearch.get` | `zotero_saved_search_get` | R | `savedSearchKey` |
| `savedSearch.create` | `zotero_saved_search_create` | W | `name`, `conditions`, `joinMode` |
| `savedSearch.update` | `zotero_saved_search_update` | W | `savedSearchKey`, `name`, `conditions`, `joinMode` |
| `citation.format` | `zotero_citation_format` | R | `zoteroItemKeys`, `style`, `locale`, `mode`, `linkwrap` |
| `import.bibtex` | `zotero_import_bibtex` | W | `content`, `collectionKeys`, `tags` |
| `import.ris` | `zotero_import_ris` | W | `content`, `collectionKeys`, `tags` |
| `import.cslJson` | `zotero_import_csl_json` | W | `content`, `collectionKeys`, `tags` |
| `export.bibtex` | `zotero_export_bibtex` | R | `zoteroItemKeys` |
| `export.ris` | `zotero_export_ris` | R | `zoteroItemKeys` |
| `export.cslJson` | `zotero_export_csl_json` | R | `zoteroItemKeys` |
| `annotation.list` | `zotero_annotation_list` | R | `attachmentKey`, `includeTrashed` |
| `annotation.create` | `zotero_annotation_create` | W | `attachmentKey`, `annotationType`, `annotationText`, `annotationComment`, `annotationColor`, `annotationPageLabel`, `annotationSortIndex`, `annotationPosition` |
| `annotation.update` | `zotero_annotation_update` | W | `annotationKey`, `annotationText`, `annotationComment`, `annotationColor`, `annotationPageLabel`, `annotationSortIndex`, `annotationPosition` |
| `note.createChild` | `zotero_note_create_child` | W | `zoteroItemKey`, `content`, `contentFormat` |
| `attachment.get` | `zotero_attachment_get` | R | `attachmentKey` |
| `attachment.getForItem` | `zotero_attachment_get_for_item` | R | `zoteroItemKey` |
| `attachment.addFile` | `zotero_attachment_add_file` | W | `zoteroItemKey`, `filePath`, `attachmentMode` |
| `attachment.moveToItem` | `zotero_attachment_move_to_item` | W | `attachmentKey`, `targetZoteroItemKey` |
| `attachment.rename` | `zotero_attachment_rename` | W | `attachmentKey`, `title`, `renameFile` |
| `attachment.runZoteroRename` | `zotero_attachment_run_zotero_rename` | W | `attachmentKey` |
| `attachment.undoAdded` | `zotero_attachment_undo_added` | W | `attachmentKey` |
| `attachment.trash` | `zotero_attachment_trash` | W | `attachmentKeys` |
| `attachment.renamePreferences.get` | `zotero_attachment_rename_preferences_get` | R | none |
| `attachment.renamePreferences.set` | `zotero_attachment_rename_preferences_set` | W | `preferences` |
| `backup.settings.get` | `zotero_backup_settings_get` | R | none |
| `backup.settings.set` | `zotero_backup_settings_set` | W | `policy` |
| `backup.snapshot.list` | `zotero_backup_snapshot_list` | R | `limit` |
| `backup.snapshot.restore` | `zotero_backup_snapshot_restore` | W | `backupId` |
| `backup.snapshot.prune` | `zotero_backup_snapshot_prune` | W | none |
| `duplicates.find` | `zotero_duplicates_find` | R | `limit` |
| `duplicates.merge` | `zotero_duplicates_merge` | W | `masterZoteroItemKey`, `duplicateZoteroItemKeys` |
| `audit.list` | `zotero_audit_list` | R | `limit` |

## Read Operations

Read-only operations may be executed directly through MCP tools. Use them to inspect state before writing.

Useful read groups:

- Collections: `collection.getTree`, `collection.getItems`
- Items: `item.get`, `item.search`, `search.advanced`
- Saved searches: `savedSearch.list`, `savedSearch.get`
- Citations and exports: `citation.format`, `export.bibtex`, `export.ris`, `export.cslJson`
- Annotations: `annotation.list`
- Attachments: `attachment.get`, `attachment.getForItem`
- Preferences and history: `attachment.renamePreferences.get`, `backup.settings.get`, `backup.snapshot.list`, `audit.list`, `duplicates.find`

When a user names a title, collection, tag, or file loosely, first resolve it to Zotero keys with read tools. Do not guess keys.

## Write Operations

All writes must follow this sequence:

1. Call the MCP tool in dry-run mode.
2. Read the returned plan, warnings, affected targets, `planId`, `confirmationToken`, and `plan.agentApproval`.
3. Present a short approval request when `plan.agentApproval.required` is true; do not dump plan IDs, tokens, hashes, or full target lists unless the user asks for details.
4. Execute only with the matching `planId`, `confirmationToken`, and unchanged input.
5. Report the result, audit location if returned, and any undo plans.

Never execute a write directly on the first call.

Writes include:

- Collections: create, rename, move, add/remove items, trash
- Items: create, update fields/creators/collections/tags, trash
- Imports: BibTeX, RIS, CSL JSON
- Saved searches: create, update
- Annotations: create, update
- Notes: create child note
- Attachments: add file, move to item, rename, run Zotero rename, undo added, trash, set rename preferences
- Backup: set settings, restore snapshot, prune snapshots
- Duplicates: merge

## Confirmation Rules

Respect the current run mode:

- **Read-only**: refuse all writes, even if the user asks to force them.
- **Ask for approval**: this is an Agent-layer approval mode. Require user approval after dry-run for every write. Zotero does not show a built-in confirmation dialog for ordinary MCP writes.
- **YOLO**: ordinary writes may proceed after dry-run if `plan.agentApproval.mayAutoExecute` is true, but unrecoverable future operations must still stop for explicit confirmation.

High-risk operations must stop for user confirmation:

- `item.trash`
- `attachment.trash`
- `collection.trash`
- `duplicates.merge`
- `backup.snapshot.restore`
- `backup.snapshot.prune`

For high-risk operations in ask-for-approval mode, ask for `CONFIRM` when `plan.agentApproval.requiredText` is `CONFIRM`. For any future unrecoverable operation, require the exact command name as confirmation.

## Approval Interaction Protocol

Keep approval prompts brief and action-focused. State what will happen in user language, not in raw MCP fields.

For one pending operation, use one sentence:

```text
I am about to create a subcollection named "<child collection>" under "<parent collection>". Approve execution?
```

Other single-operation examples:

```text
I am about to add "<item>" to "<collection>". Approve execution?
I am about to move "<attachment>" under "<item>". Approve execution?
I am about to move "<subcollection>" under "<collection>" to Zotero trash. This is not permanent deletion. Approve execution?
```

For high-risk operations, append the required confirmation text:

```text
This is a high-risk operation. To approve, reply CONFIRM.
```

For multiple pending operations, use a compact table with stable operation numbers:

```text
The following operations need approval:

| No. | Operation |
|---:|---|
| 1 | Move subcollection "<subcollection>" under "<collection>" to Zotero trash |
| 2 | Merge duplicate items "<master item>" and "<duplicate item>" |
| 3 | Add "<item>" to "<collection> / <subcollection>" |

Reply "approve all", or reply "approve 1 and 3, reject 2".
```

Accept these user replies:

- `approve all`: execute every listed operation.
- `approve 1 and 3`: execute only the listed operation numbers; leave all other pending operations unexecuted.
- `reject 2`: reject that operation; if other operations remain ambiguous, ask once for the remaining numbers.
- `cancel` / `reject all`: execute nothing.
- `CONFIRM`: for a single high-risk operation, treat as approval only when `plan.agentApproval.requiredText` is `CONFIRM`.
- Exact command name: for future unrecoverable operations, treat as approval only when it exactly matches `plan.agentApproval.requiredText`.

When executing a subset, use the original dry-run input and confirmation for each approved operation. Do not regenerate a dry-run unless the plan expired, the user changes the requested operation, or the current Zotero state must be re-read for safety.

Keep technical details available but hidden by default. Show `planId`, `confirmationToken`, `inputHash`, raw JSON, full affected key lists, or audit internals only when the user asks for details, when debugging, or when a safety block occurs.

After execution, report concise results:

```text
Executed 1 and 3; rejected 2 and did not execute it.
```

If any approved operation fails, report the failed operation number and reason, then stop before retrying.

## Plugin Settings And Permission Blocks

The user-facing settings live in Zotero:

```text
Zotero Settings -> Zotero Local MCP Bridge
```

Use this settings page when an operation is blocked by policy or when a user needs to change safety posture. Do not silently change safety settings for the user.

Important settings:

- **Run mode**:
  - `readonly`: blocks all writes.
  - `askforapprove`: writes require dry-run and approval.
  - `yolo`: ordinary writes may execute after dry-run when allowed, but unrecoverable operations still require explicit confirmation.
- **File backup / undo**: controls file-level backup availability for attachment operations.
- **Backup retention and space limit**: controls backup cleanup policy.
- **Default attachment mode**: copy to Zotero storage or linked file.
- **Attachment duplicate check**: checks duplicate file paths before adding attachments.

When permission is blocked, stop and give a concrete setting action:

| Blocked condition | Agent behavior | User-facing instruction |
|---|---|---|
| Run mode is `readonly` and the user requests a write | Do not execute or retry. | Ask the user to open Zotero Settings -> Zotero Local MCP Bridge and change Run mode to `Ask for approval` or `YOLO` if they want writes enabled. |
| User asks to bypass dry-run | Refuse. | Explain that dry-run is mandatory and cannot be disabled. |
| Write requires approval | Stop after dry-run. | Ask the user to approve the dry-run plan; for high-risk operations ask for `CONFIRM` if required. |
| Backup/undo is disabled before attachment file operations | Do not assume file-level recovery is available. | Warn that file-level undo may not be available; ask the user to enable File backup / undo in plugin settings for safer attachment writes. |
| Backup directory or runtime path is invalid or unsafe | Do not proceed with file-risk writes. | Ask the user to fix the path in Zotero Settings -> Zotero Local MCP Bridge. Paths must not point inside Zotero profile, Zotero data directory, linked attachment root, or attachment folders. |
| Attachment duplicate check blocks or warns | Stop and summarize duplicates. | Ask the user whether to reuse existing attachment, choose another file, or adjust attachment duplicate behavior in settings. |
| Batch exceeds limit | Split only if semantically safe and user agrees. | Explain that the current batch limit is 50. |

Settings that an agent may inspect through MCP:

- `backup.settings.get`
- `attachment.renamePreferences.get`
- `audit.list`

Settings that an agent may modify through MCP only after explicit user request and dry-run/confirmation:

- `backup.settings.set`
- `attachment.renamePreferences.set`

Do not automatically escalate from `readonly` to `askforapprove` or `yolo`. Do not automatically disable backup/undo or duplicate checks.

## Attachment Rules

Attachments are core functionality and higher risk because file paths and file contents are involved.

Before attachment writes:

- Resolve the parent Zotero item key.
- Confirm the file path exists if the MCP client can inspect local files.
- Prefer the configured default attachment mode unless the user explicitly chooses copy or linked file.
- Preserve dry-run and confirmation for add, move, rename, and Zotero auto-rename.
- For linked files, warn that moving the original file path can break the attachment.

Do not write audit logs or backups into Zotero profile, Zotero data directory, linked attachment root, or an attachment directory.

## Import, Export, Citation, And Annotation

- Use import tools for BibTeX, RIS, and CSL JSON content. Imports are writes and require dry-run plus confirmation.
- Use export tools for BibTeX, RIS, and CSL JSON. Exports are reads.
- Use `citation.format` for citation or bibliography output.
- Use `annotation.list` before annotation writes to avoid duplicate or misplaced annotations.
- Do not delete annotations unless a future command explicitly supports it.

## Batch Behavior

Batch operations are capped by MCP/project settings, currently 50 objects. If a batch partially fails, report:

- Completed items.
- Failed items.
- Error messages.
- Audit result.
- Undo plans returned for completed operations.

Do not retry failed writes blindly. Re-read state first.

## Response Pattern

For a read:

```text
I found <count> matching Zotero records. Key results: ...
```

For a write dry-run:

```text
I am about to <describe the operation in one sentence>. Approve execution?
```

For a write execute:

```text
Executed: <describe the completed operation in one sentence>.
```

For blocked work:

```text
Blocked: <specific guard>. Required next action: <open Zotero Settings -> Zotero Local MCP Bridge/change Run mode/provide confirmation/fix backup path>.
```

## Codex Adapter Notes

When using this skill in Codex:

- Prefer MCP tools exposed to the current thread.
- Do not use PowerShell or direct HTTP for ordinary Zotero commands.
- Use PowerShell only for diagnostics such as probing the MCP endpoint when MCP setup itself is broken.
- Keep user-facing confirmations in the conversation before executing high-risk writes.
- If the user asks to bypass dry-run, refuse and explain that dry-run is mandatory.
