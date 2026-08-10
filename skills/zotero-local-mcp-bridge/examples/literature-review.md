# Literature Review Example

User request: "Organize these DOI records and PDFs under Current Project / Included Studies, then prepare the records for a literature review."

## Expected tool sequence

1. `zotero_command_catalog`
2. `zotero_collection_get_tree`
3. `zotero_item_find_by_dois` with up to 50 DOI values
4. `zotero_collection_add_items`: one dry-run, one required approval, and one execute using `matchedItemKeys`
5. A matching batch import tool for validated unmatched citation records
6. `zotero_pdf_add_and_recognize_batch`: one dry-run, one required approval, and one execute for local PDF/EPUB files
7. `zotero_item_get` and `zotero_attachment_get_for_item` for verification
8. `zotero_note_create_child` only for evidence the agent actually inspected
9. `zotero_citation_format` or an export tool
10. `zotero_audit_list`

Report matched, imported, recognized, skipped, unmatched, and failed records separately. Do not treat an attached file as proof that its full text was read.
