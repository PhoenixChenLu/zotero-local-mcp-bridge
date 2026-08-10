# 文献综述示例

用户要求：“把这批 DOI 记录和 PDF 整理到‘当前项目 / 纳入研究’，并准备文献综述所需记录。”

## 预期工具顺序

1. `zotero_command_catalog`
2. `zotero_collection_get_tree`
3. `zotero_item_find_by_dois`，一次最多传入 50 个 DOI
4. `zotero_collection_add_items`：使用 `matchedItemKeys`，一次 dry-run、一次必要批准和一次 execute
5. 对确认缺失的引用记录使用对应格式的批量导入工具
6. `zotero_pdf_add_and_recognize_batch`：对本地 PDF/EPUB 执行一次 dry-run、一次必要批准和一次 execute
7. 使用 `zotero_item_get` 和 `zotero_attachment_get_for_item` 核验结果
8. 仅对智能体实际检查过的证据使用 `zotero_note_create_child`
9. 使用 `zotero_citation_format` 或导出工具交付引用
10. `zotero_audit_list`

分别报告已命中、已导入、已识别、已跳过、未命中和失败记录。不能把存在附件等同于已经阅读全文。
