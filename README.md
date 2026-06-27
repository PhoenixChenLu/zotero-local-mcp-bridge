# Zotero Codex Bridge

本项目是一个本地优先的 Zotero 管理 MCP bridge，目标是让 Codex 在安全边界内管理本机 Zotero 测试 profile 中的 collections、items、tags、notes 和 attachments。

第一阶段只允许 `ZoteroCodexBridgeTest` 测试 profile。真实主库写入、删除、merge duplicates、group library、Zotero Web API 写入和直接写 SQLite 都不在第一版范围内。

## Current Status

- TypeScript 工程、shared schema、插件命令注册层、MCP server dry-run/confirmation/audit/backup/undo/tool registry 已建立。
- 测试 profile 已记录为：
  - Profile directory: `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\ZoteroProfile`
  - Linked attachment root: `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\ZoteroVault`
  - Data Directory: `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\ZoteroData`
- `ZoteroProfile/`、`ZoteroVault/`、`ZoteroData/` 是本地测试数据目录，不是项目源码。
- 真实 Zotero 插件安装、MCP inspector/Codex MCP 连接测试和 Zotero UI 手工验收仍在后续阶段。
- 当前版本为**内部测试版（0.1.39）**，尚未满足公开发布硬门禁；公开发布就绪评估见 `docs/release-readiness.md`。

## Public Release Readiness (Step 2)

- `0.1.39` 当前不直接公开发布的原因：
  - 仍以测试 profile 与固定测试约束为前提，尚未切换到发布默认的只读/安全锁定启动模型。
  - 公开分发链路未完成：未形成可复用的公开插件发布链路与 MCP artifact + registry 元数据齐备链路。
  - 未完成公开发布硬门禁文档化后的一次性对齐（真实主库解锁、路径隔离、审计/backup 可观测、发布阻塞项列表）。
- 当前公开发布目标路径（已明确）：
  - Zotero 插件：GitHub Release / 项目主页 / Zotero Forums / `update manifest`（当前没有官方 Zotero 插件库直接上传入口）。
  - MCP server：npm 包或等价 artifact + `mcpName` + `server.json` + MCP Registry metadata（Registry 仅托管元数据，不托管 artifact）。
- 公开未实现的功能缺口（仍未覆盖）：
  - item 创建与元数据编辑已有第一批命令，但仍需 runtime 验收和更完整字段覆盖
  - BibTeX / RIS / CSL 导入导出
  - PDF annotation 读取与写入
  - 高级搜索、保存搜索、引用格式输出
  - 真实主库解锁的公开发布验收与用户文档（底层安全状态模型已开始实现）
  - Codex 专用 skill
  - 删除与 merge duplicates

## Safety Boundaries

Always:

- 所有 Zotero 写操作必须通过 Zotero 插件内部预定义命令表执行。
- 所有写操作必须先 dry-run，再使用未过期 `planId` 和 `confirmationToken` 执行。
- 第一阶段写操作必须同时满足 `profileMode: "test"` 和 `ZoteroProfile/.zotero-codex-bridge-test-profile` marker 存在。
- 公开发布路径中的真实主库默认 `real-locked`；临时解锁流程见 `docs/production-profile-unlock.md`。
- 审计日志只写入 bridge runtime 下的 `runtime/logs/audit/`。
- backup 只写入 bridge runtime 下的 `runtime/backups/zotero-operations/`。
- 单次批量写操作最多 50 个对象。

Never:

- 不使用 Zotero Web API 写入。
- 不要求、保存或读取 `ZOTERO_API_KEY`。
- 不直接写 `zotero.sqlite`。
- 不向普通 MCP tool 暴露任意 JavaScript eval。
- 第一版不删除 item、collection 或既有 attachment 文件。
- 第一版不支持 group library。

## Commands

```powershell
npm install
npm run build
npm run typecheck
npm run test
npm run lint
npm run build:zotero-plugin:release
npm run build:zotero-plugin
```

`npm run test` 会先执行 `npm run ensure:test-profile-marker`。如果 `ZoteroProfile/.zotero-codex-bridge-test-profile` 缺失，脚本会自动创建该 marker；它不会修改 Zotero profile 内其它文件。

`npm run build:zotero-plugin` 现在固定使用发布模式（不注入本地测试 token）：

```text
dist/zotero-codex-bridge.xpi
```

该 XPI 为公开发布前产物；本地测试请使用：

```powershell
npm run build:zotero-plugin:test
npm run build:zotero-plugin:dev
```

如需开发目录下快速本地联调，可以使用：

```powershell
npm run build:zotero-plugin:dev
```

`npm run build:zotero-plugin`、`npm run build:zotero-plugin:release` 为发布 artifact 路径；测试环境如需已注入 token 的 XPI，请使用 `npm run build:zotero-plugin:test` 或 `npm run build:zotero-plugin:dev`。

## Install Test XPI

1. 确认 Zotero 当前 profile 是 `ZoteroCodexBridgeTest`。
2. 运行：

```powershell
npm run build:zotero-plugin:test
```

3. 在 Zotero 中打开：

```text
Tools -> Plugins
```

4. 将 `dist/zotero-codex-bridge.xpi` 拖入 Plugins 窗口，或从齿轮菜单选择从文件安装。
5. 重启 Zotero。
6. 在 `ZoteroCodexBridgeTest` 中继续 `tests/integration/manualAcceptance.md`。

当前 XPI 注册 Zotero connector server health endpoint，用于验证插件已经在 Zotero 内启动：

```text
http://127.0.0.1:23119/zotero-codex-bridge/health
```

Zotero connector server 会拦截 browser-like User-Agent。PowerShell 默认 User-Agent 会被 Zotero 记录为 `Preventing request from browser` 并取消响应。测试时必须显式设置非浏览器 User-Agent：

```powershell
Invoke-WebRequest `
  -Uri http://127.0.0.1:23119/zotero-codex-bridge/health `
  -UserAgent "ZoteroCodexBridge/0.1.39" `
  -UseBasicParsing
```

成功时返回纯文本：`zotero-codex-bridge ok 0.1.39 zotero-codex-bridge@example.com test`。当前 command endpoint 已接入只读 `collection.getTree`、`collection.getItems`、`item.get`、`item.search`、`export.bibtex`、`export.ris`、`export.cslJson`、`annotation.list`、`attachment.get`、`attachment.getForItem`、`attachment.renamePreferences.get`、`backup.settings.get`、`backup.snapshot.list`、`audit.list`、`safety.getProfileStatus`，以及第一批 collection create/rename/move/addItems/removeItems、`item.create`、`item.updateFields`、`item.updateCreators`、`item.setCollections`、`item.updateTags`、`import.bibtex`、`import.ris`、`import.cslJson`、`annotation.create`、`annotation.update`、`note.createChild`、`attachment.addFile`、`attachment.moveToItem`、`attachment.rename`、`attachment.runZoteroRename`、`attachment.undoAdded`、`attachment.renamePreferences.set`、`backup.settings.set`、`backup.snapshot.restore`、`backup.snapshot.prune`、`safety.unlockRealProfile` 和 `safety.lockRealProfile` dry-run/execute 闭环。写命令必须先 dry-run，再带未过期的 `planId` 和 `confirmationToken` execute。direct HTTP 写命令会在 bridge runtime 的 `runtime/logs/audit/` 记录 JSONL 审计事件；`attachment.rename` 和 `attachment.runZoteroRename` 在执行文件重名前会把原附件文件快照写入 bridge runtime 的 `runtime/backups/zotero-operations/files/`。

## Key Files

- `docs/spec-zotero-local-write-mcp.md`: 项目规格和边界。
- `docs/production-profile-unlock.md`: 真实主库临时解锁安全模型。
- `docs/zotero-official-plugin-development-references.md`: Zotero 官方插件开发资料和本机 9.0.5 源码摘录。
- `docs/zotero-official-plan-review.md`: 基于官方资料重新审视后的计划修订结论。
- `docs/zotero-api-source-audit.md`: 第一批真实 Zotero API 接入前的源码依据审计。
- `TaskDocs/Zotero本地写入MCP项目实施计划日志.md`: 实施计划、执行证据和偏差记录。
- `tests/integration/zoteroTestProfile.md`: 测试 profile 路径和验收前置条件。
- `tests/integration/zoteroPluginDevelopmentInstall.md`: Zotero 测试 profile 中的 XPI 安装和官方 source-load 开发加载路径。
- `tests/integration/manualAcceptance.md`: 手工验收清单。
- `src/shared/`: shared schema、dry-run、audit、backup、error 类型。
- `src/zotero-plugin/`: Zotero 插件侧命令注册与 adapter 层。
- `src/mcp-server/`: MCP server dry-run、confirmation、audit、backup、undo 和 tool registry。
