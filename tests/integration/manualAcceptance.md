# Manual Acceptance

本文件用于在 Zotero Local MCP Bridge 隔离测试 profile 中逐项验收第一版闭环。所有写操作必须先 dry-run，再 execute。

## 0. Preflight

- [ ] Zotero 已启动，当前 profile 是 `ZoteroLocalMcpBridgeTest`，或迁移期既有的 `ZoteroCodexBridgeTest`。
- [ ] `ZoteroProfile/.zotero-local-mcp-bridge-test-profile` 存在。
- [ ] `tests/integration/zoteroTestProfile.md` 中的 `ZoteroProfile/`、`ZoteroVault/`、`ZoteroData/` 已填写并确认不是真实主库或真实附件根目录。
- [ ] `ZoteroProfile/`、`ZoteroVault/`、`ZoteroData/` 已被 `.gitignore` 和 ESLint ignore 排除。
- [ ] `npm run build:zotero-plugin` 已生成 `dist/zotero-local-mcp-bridge.xpi`。
- [ ] `dist/zotero-local-mcp-bridge.xpi` 已安装到隔离测试 profile。
- [ ] 安装后已重启 Zotero。
- [ ] PowerShell 使用非浏览器 User-Agent 能访问 `http://127.0.0.1:23119/zotero-local-mcp-bridge/health`。
- [ ] health endpoint 返回 `zotero-local-mcp-bridge ok 0.1.31 zotero-local-mcp-bridge@example.com test`。
- [ ] `profileMode` 为 `test`。
- [ ] 插件 HTTP 绑定为 `127.0.0.1:23119`。
- [ ] 已完成 `tests/integration/zoteroPluginDevelopmentInstall.md` 中的开发加载或 XPI 安装路径确认。
- [ ] `/zotero-local-mcp-bridge/command` 已实现本机请求鉴权，未带鉴权的 command 请求会被拒绝。
- [ ] 带本机 token 的 `/zotero-local-mcp-bridge/command` 可以执行只读 `collection.getTree`。
- [ ] token 错误的 `/zotero-local-mcp-bridge/command` 返回 `COMMAND_AUTH_INVALID`。
- [ ] `collection.create` 未带 confirmation execute 时返回 `CONFIRMATION_REQUIRED`。
- [ ] `collection.create` dry-run 返回 `planId` 和 `confirmationToken`。
- [ ] MCP server 可以列出第一版受控 tools。
- [ ] 未暴露任意 JavaScript eval tool。

## 1. Collection And Subcollection

- [ ] dry-run `collection.create` 创建顶层 collection：`Local MCP Bridge Acceptance`
- [ ] execute 后 Zotero UI 可见顶层 collection。
- [ ] dry-run `collection.create` 创建 subcollection：`Attachments`
- [ ] execute 后 Zotero UI 可见 subcollection。
- [ ] dry-run `collection.rename` 将 subcollection 改名为 `Attachments Renamed`
- [ ] execute 后 Zotero UI 可见新名称。
- [ ] dry-run `collection.move` 将 subcollection 移动为顶层 collection。
- [ ] execute 后 `collection.getTree` 与 Zotero UI 层级一致。

## 2. Item Membership

- [ ] 只读 `item.get` 能分别按 Item A 和 Item B 的 `zoteroItemKey` 读取 title、itemType、creators、tags、collectionKeys、attachmentKeys 和 noteKeys。
- [ ] `item.get` 返回的 title 与 `tests/integration/zoteroTestProfile.md` 中记录的 Item A/Item B 映射一致。
- [ ] 只读 `item.search` 能按 title/query 找到 Item A 和 Item B。
- [ ] `item.search` 支持 `collectionKey`、`itemType`、`tag` 和 `limit` 筛选，且 `limit` 最大为 50。
- [ ] dry-run `collection.addItems` 将 Item A 加入测试 collection。
- [ ] `collection.addItems` dry-run 返回 `planId`、`confirmationToken`、目标 `collectionKey`、目标 `zoteroItemKeys` 和将被加入的 item keys。
- [ ] execute 后 `collection.getItems` 能读到 Item A。
- [ ] dry-run `collection.removeItems` 将 Item A 移出测试 collection。
- [ ] `collection.removeItems` dry-run 返回 `planId`、`confirmationToken`、目标 `collectionKey`、目标 `zoteroItemKeys` 和将被移出的 item keys。
- [ ] execute 后 item 未被删除，只是不再属于该 collection。

## 3. Tags And Child Notes

- [ ] dry-run `item.updateTags` 给 Item A 添加 `codex-bridge-test`。
- [ ] `item.updateTags` dry-run 返回 `planId`、`confirmationToken`、目标 `zoteroItemKey` 和将添加的 tag。
- [ ] execute 后 Zotero UI 可见 tag。
- [ ] dry-run `item.updateTags` 移除 `codex-bridge-test`。
- [ ] `item.updateTags` dry-run 返回 `planId`、`confirmationToken`、目标 `zoteroItemKey` 和将移除的 tag。
- [ ] execute 后 Zotero UI 不再显示该 tag。
- [ ] dry-run `note.createChild` 给 Item A 创建 child note。
- [ ] `note.createChild` dry-run 返回 `planId`、`confirmationToken`、目标 `zoteroItemKey`、`contentFormat` 和 `noteHtmlPreview`。
- [ ] execute 后 Zotero UI 中 Item A 下可见 child note。
- [ ] execute 返回 `noteKey`，且 `affected.zoteroItemKeys` 包含 Item A key 和新 note key。

## 4. Attachments

使用 `tests/fixtures/attachments/` 中的 fixtures，以及用户额外准备的 DOC/DOCX/XLS/XLSX 文件。

- [ ] 只读 `attachment.getForItem` 可读取 Item A 当前附件列表。
- [ ] `attachment.getForItem` 返回 `attachmentKey`、title、filename、contentType、linkMode、attachmentMode 和可解析 file path；无附件时返回空数组。
- [ ] 只读 `attachment.get` 可按 `attachmentKey` 读取单个附件详情，并返回 parent item key。
- [ ] dry-run `attachment.addFile` 添加 `sample-paper.pdf`，默认 copy。
- [ ] `attachment.addFile` dry-run 返回 `planId`、`confirmationToken`、目标 `zoteroItemKey`、文件路径、filename、attachmentMode 和 action。
- [ ] execute 后 Zotero UI 可见 copied attachment。
- [ ] dry-run `attachment.addFile` 添加 `sample-page.html`，模式为 linked file。
- [ ] dry-run warning 明确提示 linked file 路径失效风险。
- [ ] execute 后 Zotero UI 可见 linked attachment。
- [ ] dry-run `attachment.moveToItem` 将刚创建的 attachment 从 Item A 移动到 Item B。
- [ ] `attachment.moveToItem` dry-run 返回旧 parent item key、新 parent item key、目标 attachment key 和 action。
- [ ] execute 后 Zotero UI 中 parent item 变化正确。
- [ ] dry-run `attachment.rename` 修改 attachment title，`renameFile` 先设为 `false`。
- [ ] `attachment.rename` dry-run 返回旧 title、新 title、旧 filename、目标 filename 和 action。
- [ ] execute 后 Zotero UI 可见新 title。
- [ ] dry-run + execute `attachment.rename`，`renameFile: true` 时文件名同步使用 Zotero 内置 `renameAttachmentFile()`，不覆盖既有文件；execute 返回 `backup.available = true`，且 `backup.backupFilePath`、`backup.manifestPath` 位于本项目 `backups/zotero-operations/files/`。
- [ ] dry-run `attachment.runZoteroRename` 调用 Zotero 内置附件自动重命名。
- [ ] execute 后文件名符合 Zotero 当前偏好，并返回文件重命名前的项目本地 backup snapshot。
- [ ] `attachment.renamePreferences.get` 读取 `autoRenameFiles`、`autoRenameLinkedFiles`、`autoRenameFileTypes` 和 `attachmentRenameTemplate`。
- [ ] dry-run + execute `attachment.renamePreferences.set` 修改偏好，并记录旧值和新值。

## 5. Backup, Audit, Undo

- [ ] 每次 execute 后 `logs/audit/` 产生 JSONL 审计记录。
- [ ] 审计记录包含 request id、plan id、tool、参数摘要、旧值、新值、结果或错误。
- [ ] `audit.list` 可读取最近 direct HTTP 写命令审计记录。
- [ ] `backup.settings.get` 读取默认或已保存策略，路径指向本项目 `backups/zotero-operations/settings.json`。
- [ ] attachment 文件重命名前的 backup snapshot 只写入本项目 `backups/zotero-operations/files/`，不写入 Zotero profile、Zotero data directory、linked attachment root 或附件目录。
- [ ] `backup.snapshot.list` 可读取项目本地 snapshot manifest，至少能看到最近的附件文件重命名前 snapshot。
- [ ] `backup.snapshot.restore` 必须 dry-run + execute，且只允许恢复到同一个 attachment 当前文件路径；路径不匹配时拒绝。
- [ ] `backup.snapshot.prune` 必须 dry-run + execute，默认策略下不应删除最近 snapshot；如产生删除计划，只能删除本项目 `backups/zotero-operations/files/` 下的 snapshot 目录。
- [ ] dry-run + execute `backup.settings.set` 修改策略，并记录旧值、新值和 plan id。
- [ ] backup 文件只写入 `backups/zotero-operations/`。
- [ ] undo 清单包含已完成操作。
- [ ] 对本插件刚添加且有 `attachment.addFile` 审计证据的 attachment 执行 `attachment.undoAdded`。
- [ ] undo 后 Zotero UI 默认列表中该 attachment 被移除，Zotero trash 中可见；storage 文件未被 `eraseTx()` 永久删除。
- [ ] backup 被清理后，undo 明确提示不保证附件文件级恢复。

## 6. Safety

- [ ] 未使用 Zotero Web API。
- [ ] 未要求或保存 `ZOTERO_API_KEY`。
- [ ] 未直接写 `zotero.sqlite`。
- [ ] 未触碰 group library。
- [ ] 尝试以 `profileMode: "real"` 执行写命令时被拒绝。
- [ ] 审计日志和 backup 均未写入 Zotero profile、Zotero data directory 或附件目录。
