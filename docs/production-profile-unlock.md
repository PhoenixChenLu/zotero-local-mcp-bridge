# Production Profile Unlock

This document defines the public-release safety model for writing to a real local Zotero library.

## Current Status

The project now has the first implementation slice for production profile safety:

- `profileMode` distinguishes `readonly`, `test`, `real-locked`, and `real-unlocked`.
- ordinary Zotero profile write commands are blocked in `readonly` and `real-locked`.
- `test` writes still require the test profile marker.
- `real-unlocked` writes are allowed by the command guard, but still require the existing dry-run and confirmation flow.
- `safety.getProfileStatus`, `safety.unlockRealProfile`, and `safety.lockRealProfile` are registered as explicit safety commands.

This is not yet a public-release approval for real-library use. Cross-platform manual acceptance, release packaging, public documentation, and user-facing setup guidance remain open tasks.

## Profile Modes

- `readonly`: public-safe mode that does not allow Zotero profile writes.
- `test`: internal acceptance mode. Writes require `.zotero-local-mcp-bridge-test-profile`.
- `real-locked`: real-profile mode with writes locked. This is the default public-release stance.
- `real-unlocked`: temporary real-profile write mode after explicit local unlock.

## Unlock Requirements

`safety.unlockRealProfile` must receive:

- the current `profileFingerprint` returned by `safety.getProfileStatus`.
- exact `confirmationText`: `I understand and authorize temporary real-library write access`.
- optional `ttlMinutes`, capped by the plugin.

The plugin stores unlock state under the bridge runtime directory:

```text
runtime/safety/real-profile-state.json
```

The unlock state is valid only when:

- the stored profile fingerprint matches the current Zotero profile fingerprint.
- the unlock has not expired.
- the profile mode is not `readonly` or `test`.

`safety.lockRealProfile` clears the unlock state and can be run while the real profile is already locked.

## Non-Negotiable Boundaries

- Unlock state is never written to the Zotero profile, Zotero data directory, linked attachment root, or Zotero attachment storage.
- Unlocking does not bypass dry-run and execute confirmation for ordinary write commands.
- Unlocking does not enable group libraries, permanent deletion, empty-trash operations, direct attachment-file deletion, or direct SQLite writes. Trash and duplicate-merge commands remain high-risk dry-run/confirmation operations.
- Unlocking does not introduce Zotero Web API writes or direct `zotero.sqlite` writes.

## Audit And Recovery

Safety state changes are classified as write commands for audit purposes in the plugin runtime.

The status command returns the active audit and backup roots so users can verify where operational records will be written before unlocking.

## Remaining Release Work

- Add public-facing setup instructions for configuring `profileMode`.
- Add cross-platform acceptance tests for profile directory fingerprinting.
- Add release package checks for update manifests and registry metadata.
- Decide whether `safety.lockRealProfile` should bypass MCP dry-run at the MCP registry layer while still being audited.
