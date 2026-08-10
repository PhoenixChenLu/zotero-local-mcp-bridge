# Literature Review Workflow

Use this workflow to organize literature-review evidence in a local Zotero user library. It coordinates existing MCP tools; it does not make Zotero perform literature search or scholarly synthesis.

## Responsibility Boundary

The agent searches and evaluates literature, extracts DOI values and bibliographic facts, decides inclusion criteria, reads available full text, and writes the synthesis. Zotero Local MCP Bridge checks local records, organizes collections, imports files, stores notes and annotations, and formats citations.

Do not invent records, DOI values, attachment paths, annotations, or citation results. Do not treat an attached file as proof that its full text was read.

## Ordered Flow

1. Read `zotero_command_catalog`, then resolve or create the target project collection.
2. Search external literature with an appropriate research source. Keep source provenance outside Zotero until records are validated.
3. Send up to 50 DOI values to `item.findByDois` in one read call.
4. Send `matchedItemKeys` to `collection.addItems` in one dry-run, one required approval, and one execute.
5. Import missing citation records with the matching BibTeX, RIS, or CSL JSON batch content. Use one write plan per format, not one per paper.
6. Import local PDF/EPUB files with `pdf.addAndRecognizeBatch` when Zotero recognition is appropriate. Keep unmatched and failed files explicit.
7. Read item metadata and attachments. Add child notes or supported PDF annotations only from evidence actually inspected.
8. Use `citation.format` or an export command for the final citation handoff.
9. Read `audit.list` and report completed, skipped, unmatched, and failed records.

## Batch Rules

- Preserve the plugin limit of 50 objects per batch.
- Do not loop over single-item write tools when a batch tool covers the same operation.
- Keep dry-run input byte-for-byte equivalent to execute input.
- If one batch partially fails, report every completed and failed member before deciding whether a new dry-run is justified.
