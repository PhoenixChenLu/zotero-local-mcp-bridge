# Release Readiness

This checklist defines what must be true before Zotero Local MCP Bridge is
published for general users.

## Release Channels

### Zotero Plugin

- GitHub Release publishes `dist/zotero-local-mcp-bridge.xpi`.
- Release notes describe supported Zotero versions and known limits.
- Checksums are published with the artifact.
- Installation instructions point to the release artifact.
- Update metadata is published only after the release path is stable.
- Zotero Forums announcement does not claim an official plugin-store listing.

### MCP Endpoint

- Plugin-hosted HTTP MCP endpoint is documented.
- MCP client configuration points to `/zotero-local-mcp-bridge/mcp`.
- Agent skill path is documented.
- MCP Registry feasibility for locally hosted HTTP MCP endpoints is verified.

## Required Validation

Run before a release candidate:

```powershell
npm ci
npm run typecheck
npm run lint
npm run test
npm run build
npm run build:zotero-plugin:release
```

Release artifact checks:

- XPI contains no local auth token.
- XPI contains no local absolute project path.
- XPI contains no local validation profile data.
- XPI contains localization resources.
- `package.json` and `package-lock.json` parse as JSON.
- Funding links are real or disabled.
- XPI contains `/zotero-local-mcp-bridge/mcp`.
- XPI does not register `/zotero-local-mcp-bridge/command`.
- XPI does not include sidecar placeholders or port `23120`.

## Runtime Acceptance

Use a clean Zotero profile for release candidate checks:

- Plugin installs successfully.
- Settings page renders.
- MCP `initialize` responds locally.
- MCP `tools/list` returns Zotero tools.
- Read commands work without write unlock.
- Write commands require dry-run and confirmation.
- Audit files are written outside Zotero profile/data/attachment folders.
- Backup files are written outside Zotero profile/data/attachment folders.
- Read-only mode blocks all writes.
- Ask-for-approval mode requires explicit approval.
- YOLO mode still stops for unrecoverable operations.

## Safety Requirements

- No Zotero Web API writes.
- No `ZOTERO_API_KEY`.
- No direct `zotero.sqlite` writes.
- No arbitrary JavaScript eval as a normal MCP tool.
- No group library support in the first public release.
- No permanent erase, empty-trash, or direct deletion of existing attachment
  files.
- Every write path uses plugin-defined commands.
- Every write path supports dry-run before execute.

## Documentation Requirements

- `README.md` is user-facing and installation-oriented.
- `README.zh-CN.md` provides a Chinese user entry point.
- `SECURITY.md` explains vulnerability reporting and safety boundaries.
- `PRIVACY.md` explains local data handling.
- `CHANGELOG.md` contains user-facing release notes.
- `CONTRIBUTING.md` explains development checks.
- `docs/compatibility-matrix.md` lists verified environments.
- `docs/roadmap-complete-zotero-coverage.md` lists remaining scope.

## Sponsorship

The planned sponsorship channels are Ko-fi and Afdian. They should remain
disabled in `.github/FUNDING.yml` until the maintainer creates real pages.
