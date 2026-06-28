---
name: zotero-local-mcp-bridge-zh-cn
description: 通过 Zotero Local MCP Bridge 安全管理本地 Zotero 文库。适用于智能体需要通过 MCP 工具读取、搜索、创建、更新、导入导出、标注、添加附件、管理分类、条目、标签、笔记、查看审计日志或执行备份、撤销工作流的场景。此技能要求使用插件自带 MCP 工具层，并禁止 Zotero Web API 写入、直接写 zotero.sqlite、任意 Zotero JavaScript eval 和直接调用插件私有命令 HTTP 接口。
---

# Zotero Local MCP Bridge

通过插件自带 MCP 端点使用 Zotero。不要直接调用 Zotero 插件的私有命令端点。MCP 层负责工具发现、JSON-RPC 调用形态、dry-run、确认、审计、备份、撤销和面向智能体的工具结构。Zotero 插件负责 MCP 端点、内部命令表和 Zotero 内部 API 执行。

## 必须使用的路径

常规工作必须使用这个路径：

```text
智能体 -> MCP 工具 -> Zotero 插件 HTTP MCP 端点 -> 插件命令表 -> Zotero 内部 API
```

不要从智能体直接调用 `/zotero-local-mcp-bridge/command`。当前发布构建不会暴露这个私有端点。只有在 MCP 端点本身出故障时，才允许为了诊断直接检查 MCP 端点。

禁止使用：

- Zotero Web API 执行写入。
- 直接读取或写入 `zotero.sqlite`。
- 为普通管理任务执行任意 Zotero JavaScript eval。
- group library 操作。
- 永久删除、清空 trash 或直接删除既有附件文件，除非未来项目版本明确新增这些命令。

## 启动检查

修改 Zotero 状态之前：

1. 确认插件自带 MCP 端点已暴露 Zotero 工具。
2. 如果存在健康检查或状态工具，优先使用；否则使用文档化的 MCP 读取或状态工具。
3. 可用时检查 `safety.getProfileStatus`。
4. 确认用户正在操作预期的本地用户文库或测试配置文件。
5. 如果无法连接 Zotero，要求用户打开 Zotero，并确认插件已安装且启用。

工具名由命令名生成：`zotero_` 加上把点分段和 camelCase 命令段转换为 snake_case 后的名称。始终使用 MCP 客户端实际暴露的工具列表，不要凭记忆编造工具名。

示例：

- `collection.getTree` -> `zotero_collection_get_tree`
- `item.search` -> `zotero_item_search`
- `attachment.addFile` -> `zotero_attachment_add_file`
- `backup.snapshot.list` -> `zotero_backup_snapshot_list`

## MCP 调用格式

读取命令直接使用其输入字段执行。

写入命令必须先 dry-run：

```json
{
  "zoteroItemKey": "ABCD1234",
  "fields": {
    "title": "Updated title"
  },
  "mode": "dry-run"
}
```

然后用完全不变的输入和 dry-run 返回的确认信息执行：

```json
{
  "zoteroItemKey": "ABCD1234",
  "fields": {
    "title": "Updated title"
  },
  "mode": "execute",
  "confirmation": {
    "planId": "<planId>",
    "confirmationToken": "<confirmationToken>"
  }
}
```

把命令输入字段直接作为 MCP 工具参数传入，可附加顶层 `mode` 和 `confirmation`。旧版 `input` 包装形式可能仍然兼容，但新调用方应使用直接参数。

## 支持的命令

以下表格是操作格式的第一参考。`R` 表示只读。`W` 表示写入，必须先 dry-run 再 execute。

| 命令 | MCP 工具 | 读写 | 输入字段 |
|---|---|---:|---|
| `collection.create` | `zotero_collection_create` | W | `libraryScope`, `name`, `parentCollectionKey` |
| `collection.rename` | `zotero_collection_rename` | W | `collectionKey`, `name` |
| `collection.move` | `zotero_collection_move` | W | `collectionKey`, `parentCollectionKey` |
| `collection.getTree` | `zotero_collection_get_tree` | R | `libraryScope` |
| `collection.getItems` | `zotero_collection_get_items` | R | `collectionKey` |
| `collection.addItems` | `zotero_collection_add_items` | W | `collectionKey`, `zoteroItemKeys` |
| `collection.removeItems` | `zotero_collection_remove_items` | W | `collectionKey`, `zoteroItemKeys` |
| `collection.trash` | `zotero_collection_trash` | W | `collectionKey`, `trashDescendentItems` |
| `item.get` | `zotero_item_get` | R | `zoteroItemKey` |
| `item.search` | `zotero_item_search` | R | `query`, `itemType`, `collectionKey`, `tag`, `limit` |
| `item.create` | `zotero_item_create` | W | `libraryScope`, `itemType`, `fields`, `creators`, `collectionKeys`, `tags` |
| `item.updateFields` | `zotero_item_update_fields` | W | `zoteroItemKey`, `fields` |
| `item.updateCreators` | `zotero_item_update_creators` | W | `zoteroItemKey`, `creators` |
| `item.setCollections` | `zotero_item_set_collections` | W | `zoteroItemKey`, `collectionKeys` |
| `item.updateTags` | `zotero_item_update_tags` | W | `zoteroItemKey`, `addTags`, `removeTags` |
| `item.trash` | `zotero_item_trash` | W | `zoteroItemKeys` |
| `search.advanced` | `zotero_search_advanced` | R | `conditions`, `joinMode`, `includeChildren`, `includeDeleted`, `limit` |
| `savedSearch.list` | `zotero_saved_search_list` | R | 无 |
| `savedSearch.get` | `zotero_saved_search_get` | R | `savedSearchKey` |
| `savedSearch.create` | `zotero_saved_search_create` | W | `name`, `conditions`, `joinMode` |
| `savedSearch.update` | `zotero_saved_search_update` | W | `savedSearchKey`, `name`, `conditions`, `joinMode` |
| `citation.format` | `zotero_citation_format` | R | `zoteroItemKeys`, `style`, `locale`, `mode`, `linkwrap` |
| `import.bibtex` | `zotero_import_bibtex` | W | `content`, `collectionKeys`, `tags` |
| `import.ris` | `zotero_import_ris` | W | `content`, `collectionKeys`, `tags` |
| `import.cslJson` | `zotero_import_csl_json` | W | `content`, `collectionKeys`, `tags` |
| `export.bibtex` | `zotero_export_bibtex` | R | `zoteroItemKeys` |
| `export.ris` | `zotero_export_ris` | R | `zoteroItemKeys` |
| `export.cslJson` | `zotero_export_csl_json` | R | `zoteroItemKeys` |
| `annotation.list` | `zotero_annotation_list` | R | `attachmentKey`, `includeTrashed` |
| `annotation.create` | `zotero_annotation_create` | W | `attachmentKey`, `annotationType`, `annotationText`, `annotationComment`, `annotationColor`, `annotationPageLabel`, `annotationSortIndex`, `annotationPosition` |
| `annotation.update` | `zotero_annotation_update` | W | `annotationKey`, `annotationText`, `annotationComment`, `annotationColor`, `annotationPageLabel`, `annotationSortIndex`, `annotationPosition` |
| `note.createChild` | `zotero_note_create_child` | W | `zoteroItemKey`, `content`, `contentFormat` |
| `attachment.get` | `zotero_attachment_get` | R | `attachmentKey` |
| `attachment.getForItem` | `zotero_attachment_get_for_item` | R | `zoteroItemKey` |
| `attachment.addFile` | `zotero_attachment_add_file` | W | `zoteroItemKey`, `filePath`, `attachmentMode` |
| `attachment.moveToItem` | `zotero_attachment_move_to_item` | W | `attachmentKey`, `targetZoteroItemKey` |
| `attachment.rename` | `zotero_attachment_rename` | W | `attachmentKey`, `title`, `renameFile` |
| `attachment.runZoteroRename` | `zotero_attachment_run_zotero_rename` | W | `attachmentKey` |
| `attachment.undoAdded` | `zotero_attachment_undo_added` | W | `attachmentKey` |
| `attachment.trash` | `zotero_attachment_trash` | W | `attachmentKeys` |
| `attachment.renamePreferences.get` | `zotero_attachment_rename_preferences_get` | R | 无 |
| `attachment.renamePreferences.set` | `zotero_attachment_rename_preferences_set` | W | `preferences` |
| `backup.settings.get` | `zotero_backup_settings_get` | R | 无 |
| `backup.settings.set` | `zotero_backup_settings_set` | W | `policy` |
| `backup.snapshot.list` | `zotero_backup_snapshot_list` | R | `limit` |
| `backup.snapshot.restore` | `zotero_backup_snapshot_restore` | W | `backupId` |
| `backup.snapshot.prune` | `zotero_backup_snapshot_prune` | W | 无 |
| `duplicates.find` | `zotero_duplicates_find` | R | `limit` |
| `duplicates.merge` | `zotero_duplicates_merge` | W | `masterZoteroItemKey`, `duplicateZoteroItemKeys` |
| `audit.list` | `zotero_audit_list` | R | `limit` |
| `safety.getProfileStatus` | `zotero_safety_get_profile_status` | R | 无 |
| `safety.unlockRealProfile` | `zotero_safety_unlock_real_profile` | W | `profileFingerprint`, `confirmationText`, `ttlMinutes` |
| `safety.lockRealProfile` | `zotero_safety_lock_real_profile` | W | 无 |

## 读取操作

只读操作可以直接通过 MCP 工具执行。写入前应使用它们检查状态。

常用读取分组：

- 分类：`collection.getTree`、`collection.getItems`
- 条目：`item.get`、`item.search`、`search.advanced`
- 保存搜索：`savedSearch.list`、`savedSearch.get`
- 引用和导出：`citation.format`、`export.bibtex`、`export.ris`、`export.cslJson`
- 标注：`annotation.list`
- 附件：`attachment.get`、`attachment.getForItem`
- 偏好和历史：`attachment.renamePreferences.get`、`backup.settings.get`、`backup.snapshot.list`、`audit.list`、`duplicates.find`、`safety.getProfileStatus`

当用户用标题、分类、标签或文件的模糊名称描述目标时，先用读取工具解析为 Zotero key。不要猜测 key。

## 写入操作

所有写入都必须遵循这个顺序：

1. 以 dry-run 模式调用 MCP 工具。
2. 阅读返回的计划、警告、受影响目标、`planId`、`confirmationToken` 和 `plan.agentApproval`。
3. 当 `plan.agentApproval.required` 为 true 时，向用户给出简短批准请求；除非用户要求细节，否则不要展示计划编号、令牌、哈希或完整目标列表。
4. 只有在 `planId`、`confirmationToken` 匹配且输入完全不变时才 execute。
5. 报告结果、返回的审计位置和撤销计划。

绝不能第一次调用就直接 execute 写入。

写入包括：

- 分类：创建、重命名、移动、添加或移除条目、移入 trash
- 条目：创建、更新字段、作者、所属分类、标签、移入 trash
- 导入：BibTeX、RIS、CSL JSON
- 保存搜索：创建、更新
- 标注：创建、更新
- 笔记：创建子笔记
- 附件：添加文件、移动到条目、重命名、运行 Zotero 重命名、撤销已添加附件、移入 trash、设置重命名偏好
- 备份：设置、恢复快照、清理快照
- 重复项：合并
- 安全：解锁或锁定真实配置文件

## 确认规则

遵守当前运行模式：

- **只读**：拒绝所有写入，即使用户要求强制执行。
- **请求批准**：这是智能体层批准模式。每次写入 dry-run 后都必须要求用户批准。普通 MCP 写入不会在 Zotero 中弹出内置确认对话框。
- **YOLO**：如果 `plan.agentApproval.mayAutoExecute` 为 true，普通写入可以在 dry-run 后继续；但未来不可恢复操作仍必须停下来要求明确确认。

高风险操作必须停下来要求用户确认：

- `item.trash`
- `attachment.trash`
- `collection.trash`
- `duplicates.merge`
- `backup.snapshot.restore`
- `backup.snapshot.prune`
- `safety.unlockRealProfile`

在请求批准模式中，如果 `plan.agentApproval.requiredText` 是 `CONFIRM`，高风险操作必须要求用户回复 `CONFIRM`。未来任何不可恢复操作都必须要求输入精确命令名。

## 批准交互协议

批准提示必须简短，并聚焦即将执行的动作。用用户能理解的语言说明会发生什么，不要直接展示 MCP 原始字段。

单个待批准操作使用一句话：

```text
即将给“<父分类>”新建名为“<子分类>”的子分类，需要批准执行。
```

其他单个操作示例：

```text
即将把“<条目>”添加到“<分类>”中，需要批准执行。
即将将“<附件>”移动到“<条目>”下，需要批准执行。
即将删除“<分类>”下的“<子分类>”（移入 Zotero trash，不永久删除），需要批准执行。
```

高风险操作追加要求的确认文本：

```text
这是高风险操作。如批准，请回复 CONFIRM。
```

多个待批准操作使用紧凑表格，并给每个操作稳定编号：

```text
以下操作需要批准：

| 编号 | 操作 |
|---:|---|
| 1 | 删除“<分类>”下的“<子分类>”（移入 Zotero trash） |
| 2 | 合并重复条目“<主条目>”和“<重复条目>” |
| 3 | 将“<条目>”添加到“<分类> / <子分类>” |

可回复“全部批准执行”，或回复“批准 1 和 3，拒绝 2”。
```

接受这些用户回复：

- `全部批准执行`：执行列出的全部操作。
- `批准 1 和 3`：只执行列出的编号；其他待处理操作保持不执行。
- `拒绝 2`：拒绝该操作；如果其他操作仍不明确，再询问一次剩余编号。
- `取消` / `全部拒绝`：不执行任何操作。
- `CONFIRM`：仅当单个高风险操作的 `plan.agentApproval.requiredText` 是 `CONFIRM` 时，才视为批准。
- 精确命令名：对于未来不可恢复操作，只有完全匹配 `plan.agentApproval.requiredText` 才视为批准。

执行子集时，对每个被批准的操作使用原始 dry-run 输入和确认信息。除非计划过期、用户改变请求，或当前 Zotero 状态必须为安全重新读取，否则不要重新生成 dry-run。

默认隐藏技术细节，但保留可追溯性。只有用户要求细节、正在调试，或出现安全拦截时，才展示 `planId`、`confirmationToken`、`inputHash`、原始 JSON、完整 affected key 列表或审计内部信息。

执行后简短报告结果：

```text
已执行 1 和 3；2 已拒绝，未执行。
```

如果任何被批准的操作失败，报告失败操作编号和原因，然后停止，不要直接重试。

## 插件设置和权限拦截

面向用户的设置位于 Zotero：

```text
Zotero Settings -> Zotero Local MCP Bridge
```

当操作被策略拦截，或用户需要改变安全姿态时，使用这个设置页面。不要替用户静默修改安全设置。

重要设置：

- **运行模式**：
  - `readonly`：阻止所有写入。
  - `askforapprove`：写入需要 dry-run 和用户批准。
  - `yolo`：普通写入在允许时可 dry-run 后执行，但不可恢复操作仍需要明确确认。
- **真实配置文件解锁 TTL**：控制明确解锁后真实配置文件写入权限保持多长时间。
- **文件备份 / 撤销**：控制附件操作是否具备文件级备份能力。
- **备份保存时间和空间限制**：控制备份清理策略。
- **默认附件模式**：复制到 Zotero storage 或 linked file。
- **附件重复检查**：添加附件前检查重复文件路径。

权限被拦截时，停止并给出具体设置动作：

| 拦截条件 | 智能体行为 | 面向用户的说明 |
|---|---|---|
| 运行模式是 `readonly`，用户请求写入 | 不执行，也不重试。 | 要求用户打开 Zotero Settings -> Zotero Local MCP Bridge，把运行模式改为 `askforapprove` 或 `yolo`。 |
| 用户要求绕过 dry-run | 拒绝。 | 说明 dry-run 是强制的，不能关闭。 |
| 写入需要批准 | dry-run 后停止。 | 要求用户批准 dry-run 计划；高风险操作按要求请求 `CONFIRM`。 |
| 真实配置文件已锁定 | 不写入。 | 说明真实配置文件已锁定。若用户明确要求真实配置文件写入，使用 `safety.unlockRealProfile` 并遵守 TTL。 |
| 真实配置文件解锁过期 | 重新检查状态并停止。 | 只有用户仍然需要真实配置文件写入时，才要求再次解锁。 |
| 附件文件操作前备份或撤销被关闭 | 不假定存在文件级恢复能力。 | 提醒文件级撤销可能不可用；建议用户在插件设置中启用文件备份 / 撤销。 |
| 备份目录或运行目录无效或不安全 | 不继续有文件风险的写入。 | 要求用户在 Zotero Settings -> Zotero Local MCP Bridge 中修复路径。路径不能位于 Zotero 配置文件、Zotero 数据目录、linked attachment root 或附件目录内部。 |
| 附件重复检查拦截或警告 | 停止并总结重复项。 | 询问用户是复用既有附件、选择其他文件，还是调整附件重复检查行为。 |
| 批量超过限制 | 只有语义安全且用户同意时才拆分。 | 说明当前批量限制是 50。 |

智能体可通过 MCP 检查的设置：

- `safety.getProfileStatus`
- `backup.settings.get`
- `attachment.renamePreferences.get`
- `audit.list`

智能体只有在用户明确请求并经过 dry-run/confirmation 后，才可通过 MCP 修改的设置：

- `backup.settings.set`
- `attachment.renamePreferences.set`
- `safety.unlockRealProfile`
- `safety.lockRealProfile`

不要自动把 `readonly` 升级为 `askforapprove` 或 `yolo`。不要自动关闭备份、撤销或重复检查。

## 真实配置文件写入

除非用户明确请求真实配置文件写入，否则默认使用测试配置文件或只读行为。

真实配置文件写入之前：

1. 运行 `safety.getProfileStatus`。
2. 说明当前配置文件模式和目标配置文件。
3. 只有用户明确请求真实配置文件写入权限时，才使用 `safety.unlockRealProfile`。
4. 遵守 unlock TTL。
5. 工作流完成或用户要求时，使用 `safety.lockRealProfile` 再次锁定。

不要静默解锁真实配置文件。

## 附件规则

附件是核心功能，风险更高，因为涉及文件路径和文件内容。

附件写入之前：

- 解析父 Zotero 条目 key。
- 如果 MCP 客户端可以检查本地文件，确认文件路径存在。
- 除非用户明确选择 copy 或 linked file，否则使用已配置的默认附件模式。
- 对添加、移动、重命名和 Zotero 自动重命名保持 dry-run 和确认流程。
- 对 linked files，提醒用户移动原始文件路径会导致附件失效。

不要把审计日志或备份写入 Zotero 配置文件、Zotero 数据目录、linked attachment root 或附件目录。

## 导入、导出、引用和标注

- 使用导入工具处理 BibTeX、RIS 和 CSL JSON 内容。导入是写入，必须 dry-run 加确认。
- 使用导出工具处理 BibTeX、RIS 和 CSL JSON。导出是读取。
- 使用 `citation.format` 生成 citation 或 bibliography。
- annotation 写入前使用 `annotation.list`，避免重复或错位 annotation。
- 不要删除 annotations，除非未来命令明确支持。

## 批量行为

批量操作受 MCP 或项目设置限制，当前最多 50 个对象。如果批量部分失败，报告：

- 已完成 items。
- 失败 items。
- 错误信息。
- 审计结果。
- 已完成操作返回的撤销计划。

不要盲目重试失败写入。先重新读取状态。

## 回复模式

读取结果：

```text
找到 <count> 条匹配的 Zotero 记录。主要结果：...
```

写入 dry-run：

```text
即将<用一句话描述操作>，需要批准执行。
```

写入 execute：

```text
已执行：<用一句话描述完成的操作>。
```

被拦截时：

```text
已拦截：<具体保护规则>。下一步需要：<打开 Zotero Settings -> Zotero Local MCP Bridge/修改运行模式/提供确认/使用测试配置文件/解锁真实配置文件/修复备份路径>。
```

## Codex 适配说明

在 Codex 中使用本技能时：

- 优先使用当前线程暴露的 MCP 工具。
- 普通 Zotero 命令不要使用 PowerShell 或直接 HTTP。
- 只有 MCP 设置本身出故障时，才用 PowerShell 诊断 MCP 端点。
- 执行高风险写入前，在对话中完成面向用户的确认。
- 如果用户要求绕过 dry-run，拒绝并说明 dry-run 是强制的。
