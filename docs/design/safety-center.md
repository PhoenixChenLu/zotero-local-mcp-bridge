# Safety Center

The Safety Center is a read-only observability and emergency-cancellation surface inside the existing Zotero preference pane. It does not create a second command protocol, approve operations, or bypass MCP safety checks.

## Data boundary

The plugin runtime exposes a window-local service through `Zotero.ZoteroLocalMcpBridgeSafetyCenter`. The preference script can:

- load a sanitized snapshot;
- reject one pending dry-run plan.

Snapshots contain operation names, risk levels, expiration times, target counts, warnings, compact audit events, backup counts, backup bytes, and backup-based undo availability. Raw confirmation tokens, normalized command input, complete file paths, audit before/after payloads, and backup file paths never enter the preference document.

## Control invariants

The Safety Center never executes a pending plan. User approval remains exclusively in the agent conversation, and execution remains exclusively in the MCP command workflow. The agent must pass the original plan ID and confirmation token so execute can validate the input hash, token, TTL, run mode, profile guard, and command-specific rules.

- `readonly`: write commands are blocked by the MCP runtime; pending plans can only be inspected or rejected.
- `askforapprove`: the agent asks the user for approval; the Safety Center can only inspect or reject the pending plan.
- `yolo`: the agent follows the configured automatic-execution policy; the Safety Center can only inspect or reject any pending plan.
- Expired plans are removed before every snapshot or action.

Rejecting a plan is an emergency cancel action: it deletes only the in-memory confirmation record and makes that plan unusable. It does not alter Zotero data.

## Undo boundary

The first Safety Center version presents valid backup snapshots as available file-level undo entries. Restoring a snapshot remains a high-risk write operation and is not executed directly from the status list. Agents must use the existing `backup.snapshot.restore` dry-run and execute workflow.
