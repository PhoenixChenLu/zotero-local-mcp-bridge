# Privacy Policy

Zotero Local MCP Bridge is local-first software. It is designed to let a local
MCP client manage a local Zotero library through a local Zotero plugin.

## Network Use

The bridge does not use Zotero Web API writes and does not require a Zotero API
key. Normal operation communicates between the local MCP server and the local
Zotero plugin endpoint on `127.0.0.1`.

The project may use package managers, GitHub releases, or update metadata during
installation and updates, depending on how the user installs it.

## Local Data

The bridge can process Zotero item metadata, collection names, tags, notes,
attachment metadata, annotation data, and local file paths when the user or MCP
agent requests those operations.

Audit logs and backup snapshots are local files under the configured bridge
runtime directory. They may include item keys, collection keys, attachment keys,
file names, and absolute local file paths.

## Data Not Collected

The project does not operate a hosted service for collecting user libraries,
attachments, notes, or annotations.

## User Responsibilities

Do not share audit logs, backup snapshots, command payloads, or screenshots if
they contain private library data or local file paths.
