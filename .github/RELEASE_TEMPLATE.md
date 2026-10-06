# Zotero Local MCP Bridge <version>

## Highlights

- Extends the supported version range to Zotero 10.0.x, verified on Windows with Zotero 10.0.3.
- Adds the Zotero 10 local HTTP safety header to stdio adapter requests.
- Normalizes removed or deprecated Zotero search conditions to their Zotero 10 equivalents.
- Fixes attachment duplicate detection so same-name files are distinguished by normalized path and content hash, and wires the duplicate-check preference into runtime behavior.
- Preserves case-sensitive attachment paths on macOS and Linux to avoid false duplicate matches.

## Upgrade notes

- Reinstall `zotero-local-mcp-bridge.xpi` and restart Zotero to enable the plugin on Zotero 10.
- Update the npm stdio adapter to `<version>` for the Zotero 10 local HTTP request header.
- Replace an existing Skill installation with the matching English or Chinese Skill archive for updated search-condition guidance.
- Claude Desktop users may install the MCPB, but must still install the Zotero XPI separately.

## Release assets

- `zotero-local-mcp-bridge.xpi`
- `zotero-local-mcp-bridge-<version>.mcpb`
- `zotero-local-mcp-bridge-stdio-adapter-<version>.tgz`
- English and Chinese skill archives
- `checksums-v<version>.txt`

The MCPB contains the Claude Desktop stdio compatibility layer, not the Zotero XPI. Install the XPI separately.

## Verification

- Unit tests: 94 passed.
- TypeScript typecheck, ESLint, release asset build, and Git diff whitespace validation passed locally.
- Windows `doctor` reached Zotero 10.0.3 through MCP 2025-06-18 and discovered all 55 tools.
- Zotero 10.0.3 live testing passed for endpoint startup, read operations, legacy search-condition migration, dry-run planning, controlled collection creation, and recoverable collection trashing.
- The reported same-name Markdown attachment scenario passed live dry-run validation: different files return `add`, while the existing attachment path returns `skip`.
- Windows, macOS, and Linux CI must pass before publication. Claude Desktop MCPB installation and live Zotero validation on macOS/Linux remain pending and are not claimed as verified.
