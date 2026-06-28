# Security Policy

## Supported Versions

This project is still pre-release. Security fixes target the current development
branch until the first public beta is tagged.

## Reporting a Vulnerability

Please report vulnerabilities through a private GitHub security advisory when
the repository is public. If advisories are not available yet, contact the
maintainer privately before opening a public issue.

Do not include private Zotero data, local auth tokens, absolute attachment paths,
or audit/backup files in a public report.

## Security Boundaries

- Zotero Web API writes are not used.
- `ZOTERO_API_KEY` is not required, saved, or read.
- `zotero.sqlite` is not written directly.
- Arbitrary JavaScript eval is not exposed as a normal MCP tool.
- Group libraries are not supported.
- All write operations must go through plugin-defined commands.
- Write execution requires dry-run plus a valid `planId` and
  `confirmationToken`.
- Audit and backup files must not be written inside a Zotero profile, Zotero data
  directory, linked attachment root, or attachment directory.

## High-Risk Operations

Deletion-like features are limited to Zotero trash or explicitly controlled
merge operations. Permanent erase, emptying Zotero trash, and direct deletion of
existing attachment files are not release-supported operations.
