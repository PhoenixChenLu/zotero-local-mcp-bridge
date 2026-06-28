# Roadmap Toward Complete Zotero Coverage

The long-term goal is broad Zotero local management coverage through a safe MCP
interface. Coverage must expand without weakening the hard boundaries: no Zotero
Web API writes, no direct SQLite writes, no arbitrary JavaScript eval, no group
library support until separately designed, and all writes through plugin-defined
commands.

## Implemented First-Pass Areas

- Collection and subcollection management.
- Item read/search, creation, metadata updates, creators, tags, and collection
  membership.
- Notes and child notes.
- Attachment add, move, rename, Zotero rename, duplicate checks, read, trash,
  and undo for plugin-added attachments.
- BibTeX, RIS, and CSL JSON import/export.
- PDF annotation list/create/update for the first supported PDF annotation
  types.
- Advanced search, saved search, citation formatting.
- Audit, backup snapshot, restore, prune, and settings.
- Controlled trash and duplicate merge first pass.
- Plugin settings UI and localization.
- Generic Agent/MCP skill.

## Remaining Coverage

- Deeper item-type field compatibility matrix.
- More import conflict strategies: update existing item, skip duplicates by
  identifier, and user-guided merge.
- EPUB/HTML annotations, image/ink annotations, annotation deletion, and safer
  coordinate helpers.
- More citation output formats and style discovery.
- More complete saved-search condition validation.
- Real-profile public unlock documentation and validation.
- Release-grade delete/merge documentation and high-risk confirmation UX.
- Cross-platform compatibility matrix.
- Public npm and XPI distribution workflow.
- Dedicated agent prompt examples and acceptance tests.
