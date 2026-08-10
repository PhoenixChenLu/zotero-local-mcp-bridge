# Zotero Local MCP Bridge <version>

## Highlights

- Adds a read-only Safety Center to Zotero settings for reviewing or cancelling pending dry-run plans and inspecting recent write activity, backups, and available undo snapshots.
- Adds `zotero-local-mcp-bridge-stdio doctor` for endpoint, protocol, plugin-version, and tool-discovery diagnostics.
- Adds a Claude Desktop MCPB package and configuration guides for Codex, Claude Code, OpenCode, and Claude Desktop.
- Adds an English and Chinese literature-review workflow to the bundled Skills.
- Binds every execute request to the command that created its dry-run plan, preventing confirmation reuse across commands.
- Improves public issue, pull-request, funding, release, and cross-platform CI metadata.

## Upgrade notes

- Reinstall `zotero-local-mcp-bridge.xpi` and restart Zotero to use the Safety Center and command-binding hardening.
- Update the npm stdio adapter to `<version>` to use `doctor`.
- Replace an existing Skill installation with the matching English or Chinese Skill archive to use the literature-review workflow.
- Claude Desktop users may install the MCPB, but must still install the Zotero XPI separately.

## Release assets

- `zotero-local-mcp-bridge.xpi`
- `zotero-local-mcp-bridge-<version>.mcpb`
- `zotero-local-mcp-bridge-stdio-adapter-<version>.tgz`
- English and Chinese skill archives
- `checksums-v<version>.txt`

The MCPB contains the Claude Desktop stdio compatibility layer, not the Zotero XPI. Install the XPI separately.

## Verification

- Unit tests: 86 passed.
- TypeScript typecheck, ESLint, release asset build, and Git diff whitespace validation passed locally.
- Windows `doctor` reached Zotero 9.0.5 through MCP 2025-06-18 and discovered 55 tools.
- Zotero 9.0.5 live testing passed for Safety Center status/reject behavior, readonly blocking, agent-side ask-for-approval execution, command-bound plans, AppData paths, and audit records. The final 0.1.60 XPI was reinstalled successfully; the user waived an additional manual UI pass after the approval action was removed.
- Windows, macOS, and Linux CI must pass before publication. Claude Desktop MCPB installation and live Zotero validation on macOS/Linux remain pending and are not claimed as verified.
