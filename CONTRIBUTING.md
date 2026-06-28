# Contributing

Thanks for helping improve Zotero Local MCP Bridge.

## Before You Start

This project controls local Zotero writes. Contributions must preserve the
safety model:

- no Zotero Web API writes
- no `ZOTERO_API_KEY`
- no direct `zotero.sqlite` writes
- no arbitrary JavaScript eval as a normal MCP tool
- no group library support unless a future design explicitly adds it
- every write command uses dry-run before execute

## Development Setup

```powershell
npm install
npm run typecheck
npm run lint
npm run test
npm run build
```

Build the plugin package:

```powershell
npm run build:zotero-plugin:release
```

## Pull Request Checklist

- Keep changes scoped.
- Update tests for behavior changes.
- Update documentation for user-visible behavior.
- Do not commit local Zotero profile, data, vault, runtime, audit, backup, or
  token files.
- Run the validation commands before opening a pull request.

## Documentation

README files are for users. Keep project history, internal execution logs, and
implementation evidence in `TaskDocs/` or focused docs under `docs/`.
