# Compatibility Matrix

This matrix tracks verified and planned support. It is not a guarantee for
unverified combinations.

## Current Verified Environment

| Area | Status |
| --- | --- |
| Zotero 9.0.5 64-bit on Windows 11 | Primary verified runtime |
| Plugin-hosted HTTP MCP endpoint on Zotero connector server | Current primary MCP runtime |
| Zotero local user library | Supported |
| Zotero group library | Not supported |
| Zotero Web API writes | Not used |
| Direct SQLite writes | Not used |

## Planned Compatibility Checks

| Target | Status |
| --- | --- |
| Zotero 7.x | Planned |
| Zotero 8.x | Planned |
| Newer Zotero 9.x | Planned |
| Windows clean profile | Planned release gate |
| macOS clean profile | Planned release gate |
| Linux clean profile | Planned release gate |
| MCP client HTTP / Streamable HTTP connection | Planned release gate |

## Localization

The plugin settings UI packages Fluent resources for the 48 locales found in the
local Zotero 9.0.5 runtime. Language selection follows Zotero's application UI
language.
