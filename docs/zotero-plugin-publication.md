# Zotero Plugin Publication Notes

This document records the planned public Zotero plugin publication path.

## Distribution

Zotero currently does not provide a simple official upload flow equivalent to a
general plugin marketplace for this project. The planned public path is:

- GitHub Release with `dist/zotero-local-mcp-bridge.xpi`
- skill archive with `skills/zotero-local-mcp-bridge/`
- release notes and checksums
- project README installation instructions
- Zotero Forums announcement
- update manifest after the first stable public artifact

Do not claim that the plugin is available from an official Zotero plugin store
unless that distribution path exists for this project.

## Release Artifact

Build command:

```powershell
npm run build:zotero-plugin:release
```

Expected artifact:

```text
dist/zotero-local-mcp-bridge.xpi
```

The release XPI must not contain local validation tokens, local absolute paths,
or local profile data.

## Manual Checks

- Install the release XPI in a clean Zotero profile.
- Verify settings page renders.
- Verify default mode is safe for real profiles.
- Verify MCP `initialize` and `tools/list` respond locally.
- Verify read commands work without write unlock.
- Verify a write command requires dry-run and confirmation.
- Verify audit and backup paths are outside Zotero profile/data/attachment
  directories.

## CLI Helper

The local repository helper is:

```powershell
npm run install:local -- --build
```

It builds the XPI, opens the XPI folder, and may print the MCP initialize check.
It does not silently modify a Zotero profile or bypass Zotero's plugin manager.

The public npm helper should expose:

```powershell
zotero-local-mcp-bridge setup
zotero-local-mcp-bridge setup codex
```

The setup command can prepare the XPI, MCP endpoint configuration, and selected
agent skill installation. It should keep Zotero plugin installation as a manual
Zotero UI confirmation step.

## Forum Announcement Content

The first announcement should clearly say this is a local MCP bridge capable of
Zotero writes, explain the safety model, and ask users to start in read-only
mode before enabling writes.
