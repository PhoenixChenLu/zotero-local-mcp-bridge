# 任务上下文

创建时间：2026-06-26 00:01:03

> 状态：已冻结，不再更新。
>
> 本日志保留为 `0.1.31` 第一阶段内部测试 profile 验收历史。后续以开源公开发布和最终完整 Zotero 功能覆盖为目标的计划、执行、测试和偏差记录，统一迁移到 [Zotero本地写入MCP开源公开发布计划日志.md](Zotero本地写入MCP开源公开发布计划日志.md)。
>
> 冻结时间：2026-06-27 12:28:20。

我将使用 plan-led-delivery-logbook 工作流来完成这个任务。

本日志是 `Zotero-codex-bridge` 项目的文件级实施计划活文档。当前只生成计划，不开始代码实现。进入每个实施步骤前，应先复核 `docs/spec-zotero-local-write-mcp.md`，并在本日志中补充执行时间、测试证据、偏差与修订。

## 范围与非目标

范围：

- 将已审查的规格拆成文件级实施步骤。
- 覆盖 Zotero 插件、外部 MCP server、shared schema、dry-run、confirmation、audit、backup、undo、附件、测试 profile、文档和后续 Codex skill。
- 为每一步记录目标文件、符号级意图、预期行为、测试命令和通过标准。

非目标：

- 本轮不写源代码。
- 本轮不安装或启动 Zotero。
- 本轮不创建 Zotero test profile。
- 本轮不执行任何 Zotero 写操作。
- 本轮不修改真实 Zotero 主库或 `zotero-data/`。

## 涉及文件与符号

已有文件：

- `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\spec-zotero-local-write-mcp.md`
- `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\zotero-mcp-ecosystem-investigation.md`
- `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\TaskDocs\任务总览.md`
- `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\TaskDocs\Zotero本地写入MCP项目规划日志.md`

计划新增文件与目录：

- `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\package.json`
- `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tsconfig.json`
- `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\shared\`
- `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\`
- `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\mcp-server\`
- `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\unit\`
- `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\integration\`
- `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\fixtures\`
- `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\logs\audit\`
- `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\backups\zotero-operations\`
- `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\README.md`
- `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\AGENTS.md`

核心符号意图：

- Shared schema：`ZoteroLocalCommand`、`ZoteroLocalCommandResult`、`DryRunPlan`、`ConfirmationToken`、`AuditEvent`、`BackupPolicy`、`UndoOperation`、`ProfileMode`。
- Zotero 插件：`CommandRegistry`、`HttpCommandServer`、`ProfileGuard`、`CollectionCommands`、`ItemCommands`、`NoteCommands`、`AttachmentCommands`、`PreferenceCommands`。
- MCP server：`McpToolRegistry`、`DryRunPlanner`、`ConfirmationStore`、`AuditLogger`、`BackupManager`、`UndoManager`、`ZoteroPluginClient`。
- 测试：schema unit tests、MCP contract tests、插件命令 adapter tests、Zotero test profile manual acceptance。

## 实施步骤

### 步骤 1 - 项目脚手架与基础命令

计划：
- 目标文件：
  - ~~新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\package.json`~~
  - ~~新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tsconfig.json`~~
  - ~~新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\shared\`~~
  - ~~新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\`~~
  - ~~新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\mcp-server\`~~
  - ~~新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\unit\`~~
  - 目标文件（修订后）：
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\package.json`
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\package-lock.json`
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tsconfig.json`
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\eslint.config.js`
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\vitest.config.ts`
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\.gitignore`
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\shared\`
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\`
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\mcp-server\`
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\unit\`
- 符号变更：
  - 建立 TypeScript monorepo 风格基础结构。
  - 定义初始 npm scripts：`build`、`test`、`lint`、`typecheck`。
- 预期行为：
  - 仓库具备可构建、可测试、可扩展的 TypeScript 工程基础。
  - `docs/spec-zotero-local-write-mcp.md` 中的计划命令被替换为实际可执行命令。
- 测试命令：
  - `npm install`
  - `npm run build`
  - `npm run typecheck`
  - `npm run test`
- 通过标准：
  - 所有命令可执行。
  - 未引入 Zotero Web API、`ZOTERO_API_KEY` 或 SQLite 写入依赖。

执行：
- 开始时间：2026-06-26 11:51:00
- 结束时间：2026-06-26 11:51:46
- 操作内容：
  - 确认当前目录不是 Git 仓库，`git status --short` 返回 `fatal: not a git repository`。
  - 确认 Node.js `v22.22.2`、npm `10.9.7`。
  - 新建 TypeScript、Vitest、ESLint 脚手架配置。
  - 新建 `src\shared\index.ts`、`src\mcp-server\index.ts`、`src\zotero-plugin\index.ts` 和 `tests\unit\smoke.test.ts`。
  - 运行 `npm install` 生成 `package-lock.json`。
  - 新建 `.gitignore`，忽略 `node_modules/`、`dist/`、coverage、环境变量、审计日志和 backup 产物。
- 测试结果：通过。
  - `npm install`：通过，新增 155 个包，审计 156 个包，0 个漏洞。
  - `npm run build`：通过。
  - `npm run typecheck`：通过。
  - `npm run test`：通过，`tests/unit/smoke.test.ts` 1 个测试通过。
  - `npm run lint`：通过。
- 备注：由于当前目录未初始化 Git，本步骤无法按 git 工作流创建提交；后续如需提交历史，应先由用户确认是否在本迁移目录执行 `git init`。

### 步骤 2 - Shared schema 与边界模型

计划：
- 目标文件：
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\shared\commands.ts`
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\shared\dryRun.ts`
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\shared\audit.ts`
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\shared\backup.ts`
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\shared\errors.ts`
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\unit\shared\`
- 符号变更：
  - 定义 `ZoteroLocalCommand`、`ZoteroLocalCommandResult`、`DryRunPlan`、`ConfirmationToken`、`AuditEvent`、`BackupPolicy`、`UndoOperation`、`ZoteroBridgeError`。
  - 定义第一版命令枚举，覆盖 collection、item、note、attachment、backup、audit、preference。
- 预期行为：
  - 插件和 MCP server 使用同一套命令输入、输出、错误码和审计类型。
  - 所有 key 字段显式区分 `zoteroItemKey`、`bibtexKey`、`collectionKey`、`attachmentKey`。
- 测试命令：
  - `npm run test -- tests/unit/shared`
  - `npm run typecheck`
- 通过标准：
  - schema 测试覆盖命令名称、必填字段、批量上限 50、profileMode、dry-run plan 过期字段。
  - 类型层面不存在通用 `key` 字段承载不同 Zotero key 的情况。

执行：
- 开始时间：2026-06-26 11:52:50
- 结束时间：2026-06-26 11:53:54
- 操作内容：
  - 先新增 `tests\unit\shared\commands.test.ts`、`dryRun.test.ts`、`backup.test.ts`、`errors.test.ts`。
  - RED 证据：首次运行 `npm run test -- tests/unit/shared` 失败，4 个测试套件因 `src\shared\commands.js`、`dryRun.js`、`backup.js`、`errors.js` 不存在而失败。
  - 新增 `src\shared\commands.ts`、`dryRun.ts`、`audit.ts`、`backup.ts`、`errors.ts`。
  - 更新 `src\shared\index.ts` 导出 shared 模块。
- 测试结果：通过。
  - `npm run test -- tests/unit/shared`：通过，4 个测试文件、10 个测试通过。
  - `npm run test`：通过，5 个测试文件、11 个测试通过。
  - `npm run build`：通过。
  - `npm run typecheck`：通过。
  - `npm run lint`：通过。
- 备注：本步骤完成 shared schema 与边界模型的第一版，覆盖第一版命令清单、写命令判定、批量上限 50、dry-run plan id、10 分钟过期、backup 30 天和 10GiB 默认策略、稳定错误类型。

### 步骤 3 - Zotero 插件 HTTP 命令通道

计划：
- 目标文件：
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\manifest.json`
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\bootstrap.ts`
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\httpCommandServer.ts`
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\commandRegistry.ts`
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\profileGuard.ts`
- 符号变更：
  - 新增 `HttpCommandServer`，监听本机 HTTP 请求。
  - 新增 `CommandRegistry`，只允许调用插件内部预定义命令。
  - 新增 `ProfileGuard`，要求 `profileMode: "test"` 才允许写操作。
- 预期行为：
  - 外部 MCP server 只能通过 HTTP 调用命令表，不能传入任意 Zotero JS。
  - 第一阶段未标记 test profile 时拒绝所有写命令。
- 测试命令：
  - `npm run test -- tests/unit/zotero-plugin`
  - `npm run build`
- 通过标准：
  - HTTP handler 拒绝未知命令。
  - HTTP handler 拒绝缺少 confirmation 的 execute 请求。
  - 代码中没有 RDP 依赖、Web API 写入或 SQLite 写入路径。

执行：
- 开始时间：2026-06-26 11:54:40
- 结束时间：2026-06-26 11:56:00
- 操作内容：
  - 先新增 `tests\unit\zotero-plugin\profileGuard.test.ts`、`commandRegistry.test.ts`、`httpCommandServer.test.ts`。
  - RED 证据：首次运行 `npm run test -- tests/unit/zotero-plugin` 失败，3 个测试套件因 `src\zotero-plugin\profileGuard.js`、`commandRegistry.js`、`httpCommandServer.js` 不存在而失败。
  - 新增 `src\zotero-plugin\profileGuard.ts`、`commandRegistry.ts`、`httpCommandServer.ts`、`bootstrap.ts`、`manifest.json`。
  - 更新 `src\zotero-plugin\index.ts` 导出插件通道模块。
  - 选择插件 HTTP 默认绑定 `127.0.0.1:23120`，避开 Zotero local API 常见端口 `23119`。
  - 修订记录（2026-06-26 17:35:00）：上述 `23120` 绑定是早期错误假设。经 Zotero 官方 connector server 文档和本机 9.0.5 源码复核，当前插件入口改为注册到 Zotero connector server：`127.0.0.1:23119/zotero-codex-bridge/*`。
  - 首次并行验证中 `npm run build` 和 `npm run typecheck` 失败，原因是未知命令错误响应中的 `commandName` 可能是任意字符串，而 shared 成功结果要求 `CommandName`。
  - 修正 `HttpJsonResponse` 类型，使成功响应保持严格 `ZoteroLocalCommandResult`，错误响应允许 `commandName: string`。
- 测试结果：通过。
  - `npm run test -- tests/unit/zotero-plugin`：通过，3 个测试文件、7 个测试通过。
  - `npm run test`：通过，8 个测试文件、18 个测试通过。
  - `npm run build`：通过。
  - `npm run typecheck`：通过。
  - `npm run lint`：通过。
- 备注：本步骤实现的是可单元测试的插件命令通道核心；真实 Zotero HTTP server 绑定仍需在 Zotero 插件运行环境中接入和验证。~~鉴权与请求签名仍保留为后续实现参数。~~ 修订后：command endpoint 鉴权是接入任何真实写命令前的硬门槛，不再后置。

### 步骤 4 - Collection 与 item membership 命令

计划：
- 目标文件：
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\commands\collectionCommands.ts`
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\commands\itemCommands.ts`
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\unit\zotero-plugin\collectionCommands.test.ts`
- 符号变更：
  - 新增 `createCollection`、`renameCollection`、`moveCollection`、`getCollectionTree`、`getCollectionItems`、`addItemsToCollection`、`removeItemsFromCollection`。
- 预期行为：
  - 支持顶层 collection 与 subcollection。
  - 支持任意单个 collection 改 parent。
  - 支持 item 加入或移出 collection，不删除 item。
- 测试命令：
  - `npm run test -- tests/unit/zotero-plugin/collectionCommands.test.ts`
  - 在 Zotero test profile 中手工验收 collection tree。
- 通过标准：
  - collection tree 读取结果与 Zotero UI 一致。
  - 移动、重命名、加入、移出操作都有 dry-run、execute、audit、undo 元数据。

执行：
- 开始时间：2026-06-26 11:56:45
- 结束时间：2026-06-26 11:57:41
- 操作内容：
  - 先新增 `tests\unit\zotero-plugin\collectionCommands.test.ts`。
  - RED 证据：首次运行 `npm run test -- tests/unit/zotero-plugin/collectionCommands.test.ts` 失败，原因是 `src\zotero-plugin\commands\collectionCommands.js` 不存在。
  - 新增 `src\zotero-plugin\commands\collectionCommands.ts`，实现 collection adapter 命令层、批量上限检查和命令注册。
  - 新增 `src\zotero-plugin\commands\itemCommands.ts`，先定义 item tag adapter 输入和接口，为步骤 5 做准备。
  - 更新 `src\zotero-plugin\index.ts` 导出 command 模块。
- 测试结果：通过。
  - `npm run test -- tests/unit/zotero-plugin/collectionCommands.test.ts`：通过，1 个测试文件、4 个测试通过。
  - `npm run test`：通过，9 个测试文件、22 个测试通过。
  - `npm run build`：通过。
  - `npm run typecheck`：通过。
  - `npm run lint`：通过。
- 备注：本步骤完成 collection 与 item membership 的单元层命令封装；尚未连接 Zotero 内部 API，也未执行 Zotero UI 手工验收。进入手工验收前提醒用户建立并确认 Zotero test profile。

### 步骤 5 - Tag 与 child note 命令

计划：
- 目标文件：
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\commands\tagCommands.ts`
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\commands\noteCommands.ts`
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\unit\zotero-plugin\noteCommands.test.ts`
- 符号变更：
  - 新增 `updateItemTags`、`createChildNote`。
  - child note 支持尽可能多的 Zotero 允许内容格式，优先核查纯文本、HTML 和富文本边界。
- 预期行为：
  - item tag 可以添加和移除。
  - child note 可以创建在指定 item 下。
  - 修改 tags 和创建 note 都必须经过 dry-run 和 confirmation。
- 测试命令：
  - `npm run test -- tests/unit/zotero-plugin/noteCommands.test.ts`
  - 在 Zotero test profile 中手工验收 tags 与 notes。
- 通过标准：
  - Zotero UI 可见 tag 与 child note 结果。
  - 审计日志记录旧值、新值、note parent item、note key。

执行：
- 开始时间：2026-06-26 11:58:10
- 结束时间：2026-06-26 11:58:56
- 操作内容：
  - 先新增 `tests\unit\zotero-plugin\noteCommands.test.ts`，覆盖 tag 更新、child note 创建和命令注册。
  - RED 证据：首次运行 `npm run test -- tests/unit/zotero-plugin/noteCommands.test.ts` 失败，原因是 `src\zotero-plugin\commands\noteCommands.js` 不存在。
  - 更新 `src\zotero-plugin\commands\itemCommands.ts`，新增 `updateItemTags` 和 `registerItemCommands`。
  - 新增 `src\zotero-plugin\commands\noteCommands.ts`，定义 `NoteContentFormat`、`ChildNoteCreateInput`、`ZoteroNoteAdapter`、`createChildNote` 和 `registerNoteCommands`。
  - 更新 `src\zotero-plugin\index.ts` 导出 note 命令模块。
- 测试结果：通过。
  - `npm run test -- tests/unit/zotero-plugin/noteCommands.test.ts`：通过，1 个测试文件、3 个测试通过。
  - `npm run test`：通过，10 个测试文件、25 个测试通过。
  - `npm run build`：通过。
  - `npm run typecheck`：通过。
  - `npm run lint`：通过。
- 备注：本步骤完成 tag 与 child note 的单元适配层；child note 的真实 Zotero 格式边界仍需在 Zotero test profile 中实测后回写 spec。

### 步骤 6 - 附件核心命令

计划：
- 目标文件：
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\commands\attachmentCommands.ts`
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\commands\attachmentPreferenceCommands.ts`
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\unit\zotero-plugin\attachmentCommands.test.ts`
- 符号变更：
  - 新增 `getItemAttachments`、`addFileAttachment`、`moveAttachmentToItem`、`renameAttachment`、`runZoteroAttachmentRename`、`getAttachmentRenamePreferences`、`setAttachmentRenamePreferences`。
- 预期行为：
  - 支持 PDF、DOC、DOCX、CSV、XLS、XLSX、常见图片、HTML。
  - 默认复制文件进 Zotero storage。
  - 支持配置默认 linked file 策略。
  - linked file 不限制路径，但 dry-run 必须提示路径失效风险。
  - 重复或同名附件默认跳过；`replace` 第一版只作为 dry-run 提示，不执行。
  - Zotero 内置自动重命名完全遵循 Zotero 当前偏好；偏好修改也走 dry-run 和 confirmation。
- 测试命令：
  - `npm run test -- tests/unit/zotero-plugin/attachmentCommands.test.ts`
  - 在 Zotero test profile 中手工验收复制附件、linked file、移动 parent、重命名、自动重命名。
- 通过标准：
  - 附件写入和移动结果在 Zotero UI 中可见。
  - 自动重命名符合 Zotero 当前偏好。
  - 审计日志记录绝对路径、文件名、附件 key、parent item key。
  - undo 可移除本插件刚添加的 attachment。

执行：
- 开始时间：2026-06-26 11:59:30
- 结束时间：2026-06-26 12:00:51
- 操作内容：
  - 先新增 `tests\unit\zotero-plugin\attachmentCommands.test.ts`，覆盖复制附件默认值、linked file 风险提示透传、附件 parent 移动、Zotero 内置自动重命名、附件重命名偏好读写和命令注册。
  - RED 证据：首次运行 `npm run test -- tests/unit/zotero-plugin/attachmentCommands.test.ts` 失败，原因是 `src\zotero-plugin\commands\attachmentCommands.js` 不存在。
  - 新增 `src\zotero-plugin\commands\attachmentCommands.ts`，定义附件 adapter 命令层。
  - 新增 `src\zotero-plugin\commands\attachmentPreferenceCommands.ts`，定义附件重命名偏好 adapter 命令层。
  - 更新 `src\zotero-plugin\index.ts` 导出附件命令模块。
  - 首次全量验证中 `npm run lint` 失败，原因是 `attachmentCommands.test.ts` 中有未使用 import。
  - 移除未使用 import 后重新验证。
- 测试结果：通过。
  - `npm run test -- tests/unit/zotero-plugin/attachmentCommands.test.ts`：通过，1 个测试文件、6 个测试通过。
  - `npm run test`：通过，11 个测试文件、31 个测试通过。
  - `npm run build`：通过。
  - `npm run typecheck`：通过。
  - `npm run lint`：通过。
- 备注：本步骤完成附件核心命令的单元适配层；尚未执行真实 Zotero 附件写入、移动、重命名或 UI 验收。进入真实附件验收前必须提醒用户建立并确认 Zotero test profile。

### 步骤 7 - Dry-run 与 confirmation 子系统

计划：
- 目标文件：
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\mcp-server\dryRunPlanner.ts`
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\mcp-server\confirmationStore.ts`
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\unit\mcp-server\dryRunPlanner.test.ts`
- 符号变更：
  - 新增 `DryRunPlanner`、`ConfirmationStore`、`createPlan`、`confirmPlan`、`validatePlanForExecute`。
  - `confirmationToken` 使用自动 token 机制。
  - dry-run plan 默认 10 分钟过期。
- 预期行为：
  - 所有写操作必须先生成 dry-run plan。
  - execute 必须提供未过期 `planId` 和 `confirmationToken`。
  - 输入 hash 或目标状态不匹配时拒绝执行。
- 测试命令：
  - `npm run test -- tests/unit/mcp-server/dryRunPlanner.test.ts`
- 通过标准：
  - 未 dry-run 的 execute 被拒绝。
  - 过期 plan 被拒绝。
  - 修改输入后的 execute 被拒绝。
  - dry-run 返回 item、collection、tag、note、attachment、file path 基本信息。

执行：
- 开始时间：2026-06-26 12:01:25
- 结束时间：2026-06-26 12:02:21
- 操作内容：
  - 先新增 `tests\unit\mcp-server\dryRunPlanner.test.ts`，覆盖 dry-run plan 创建、自动 confirmation token、过期拒绝、输入 hash 变更拒绝。
  - RED 证据：首次运行 `npm run test -- tests/unit/mcp-server/dryRunPlanner.test.ts` 失败，原因是 `src\mcp-server\dryRunPlanner.js` 不存在。
  - 新增 `src\mcp-server\dryRunPlanner.ts`，实现 `DryRunPlanner`、稳定输入 hash、默认 10 分钟 plan 过期和自动 `confirm_` token。
  - 新增 `src\mcp-server\confirmationStore.ts`，实现 confirmation 保存与 execute 校验。
  - 更新 `src\mcp-server\index.ts` 导出 dry-run 和 confirmation 模块。
- 测试结果：通过。
  - `npm run test -- tests/unit/mcp-server/dryRunPlanner.test.ts`：通过，1 个测试文件、4 个测试通过。
  - `npm run test`：通过，12 个测试文件、35 个测试通过。
  - `npm run build`：通过。
  - `npm run typecheck`：通过。
  - `npm run lint`：通过。
- 备注：本步骤完成 dry-run 与 confirmation 的核心门控模型；后续 MCP tool 执行层必须调用 `ConfirmationStore.validateForExecute` 后才能执行写命令。

### 步骤 8 - Audit、backup 与 undo 子系统

计划：
- 目标文件：
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\mcp-server\auditLogger.ts`
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\mcp-server\backupManager.ts`
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\mcp-server\undoManager.ts`
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\logs\audit\.gitkeep`
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\backups\zotero-operations\.gitkeep`
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\unit\mcp-server\backupManager.test.ts`
- 符号变更：
  - 新增 `AuditLogger`、`BackupManager`、`UndoManager`、`BackupRetentionPolicy`、`UndoPlan`。
  - 默认 backup 保留 30 天，默认最大空间 10GB。
  - 两个限制都启用时，先空间限制，再时间限制。
- 预期行为：
  - 审计日志写在本项目目录。
  - backup 写在本项目目录。
  - undo 与 backup 保留策略联动；backup 清理后不保证附件文件级恢复。
- 测试命令：
  - `npm run test -- tests/unit/mcp-server/backupManager.test.ts`
- 通过标准：
  - backup retention 测试覆盖时间限制、空间限制、双限制优先级。
  - audit 记录 request id、plan id、tool、参数摘要、旧值、新值、结果、错误。
  - 不向 Zotero profile、Zotero data directory 或附件目录写日志。

执行：
- 开始时间：2026-06-26 12:04:20
- 结束时间：2026-06-26 12:06:20
- 操作内容：
  - 先新增 `tests\unit\mcp-server\backupManager.test.ts`，覆盖 backup project root、时间清理、空间清理、双限制优先级、audit JSONL 写入和 undo 与 backup 联动。
  - RED 证据：首次运行 `npm run test -- tests/unit/mcp-server/backupManager.test.ts` 失败，原因是 `src\mcp-server\auditLogger.js` 不存在。
  - 新增 `src\mcp-server\backupManager.ts`，实现 `BackupManager` 和 `planRetentionPrune`，双限制启用时先按空间清理，再按时间清理。
  - 新增 `src\mcp-server\auditLogger.ts`，实现项目内 `logs\audit\YYYY-MM-DD.jsonl` 追加写入。
  - 新增 `src\mcp-server\undoManager.ts`，实现 `UndoPlan` 生成，并在关联 backup 不可用时标记文件级恢复不可保证。
  - 更新 `src\shared\audit.ts`，为审计事件补充 `paramsSummary`、`before`、`after` 字段。
  - 新增 `logs\audit\.gitkeep` 和 `backups\zotero-operations\.gitkeep`，保留项目内日志与备份目录边界。
- 测试结果：通过。
  - `npm run test -- tests/unit/mcp-server/backupManager.test.ts`：通过，1 个测试文件、6 个测试通过。
  - `npm run test`：通过，13 个测试文件、41 个测试通过。
  - `npm run build`：通过。
  - `npm run typecheck`：通过。
  - `npm run lint`：通过。
  - `rg "ZOTERO_API_KEY|api\.zotero\.org|zotero\.sqlite|sqlite write|任意 JS eval" src tests package.json -g '!node_modules/**' -g '!dist/**'`：无命中，命令以 1 退出表示未匹配。
- 备注：本步骤只实现项目内 audit/backup/undo 基础子系统，尚未对真实 Zotero 文件或 profile 执行任何写入。

### 步骤 9 - MCP server tool registry 与插件 client

计划：
- 目标文件：
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\mcp-server\index.ts`
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\mcp-server\toolRegistry.ts`
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\mcp-server\zoteroPluginClient.ts`
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\unit\mcp-server\toolRegistry.test.ts`
- 符号变更：
  - 新增 `McpToolRegistry`、`ZoteroPluginClient`。
  - 暴露受控 MCP tools：collection、item、tag、note、attachment、audit、backup、preferences。
- 预期行为：
  - MCP client 可以列出第一版所有工具。
  - MCP server 通过本机 HTTP 调用插件命令表。
  - MCP server 不暴露任意 JS eval。
- 测试命令：
  - `npm run test -- tests/unit/mcp-server/toolRegistry.test.ts`
  - MCP inspector 或 Codex MCP 本机连接测试。
- 通过标准：
  - tool schema 与 shared schema 一致。
  - 写 tool 默认先 dry-run。
  - execute 必须带 confirmation。
  - 代码中没有 Web API 写入路径、`ZOTERO_API_KEY` 依赖或 SQLite 写入路径。

执行：
- 开始时间：2026-06-26 12:06:35
- 结束时间：2026-06-26 12:08:50
- 操作内容：
  - 先新增 `tests\unit\mcp-server\toolRegistry.test.ts`，覆盖插件 client 本机传输、第一版工具列表、读命令直接转发、写命令默认 dry-run、缺少 confirmation 拒绝 execute、匹配 confirmation 后执行。
  - RED 证据：首次运行 `npm run test -- tests/unit/mcp-server/toolRegistry.test.ts` 失败，原因是 `src\mcp-server\toolRegistry.js` 不存在。
  - 新增 `src\mcp-server\zoteroPluginClient.ts`，实现可注入 transport 的本机插件 client；默认 endpoint 为 `http://127.0.0.1:23120/command`。
  - 修订记录（2026-06-26 17:35:00）：上述默认 endpoint 已废弃。当前默认 command endpoint 为 `http://127.0.0.1:23119/zotero-codex-bridge/command`，health endpoint 为 `http://127.0.0.1:23119/zotero-codex-bridge/health`。
  - 新增 `src\mcp-server\toolRegistry.ts`，实现 `McpToolRegistry`、`listTools`、`callTool`、写命令 dry-run 默认门控和 execute confirmation 校验。
  - 更新 `src\mcp-server\index.ts` 导出 tool registry 与 plugin client。
  - 首次类型检查失败，原因是测试未按 `mode` 缩窄 dry-run 结果类型，以及 `asObject` 需要显式收窄为 `Record<string, unknown>`；修正后通过。
- 测试结果：通过。
  - `npm run test -- tests/unit/mcp-server/toolRegistry.test.ts`：通过，1 个测试文件、6 个测试通过。
  - `npm run test`：通过，14 个测试文件、47 个测试通过。
  - `npm run build`：通过。
  - `npm run typecheck`：通过。
  - `npm run lint`：通过。
  - `rg "ZOTERO_API_KEY|api\.zotero\.org|zotero\.sqlite|sqlite write|任意 JS eval" src tests package.json -g '!node_modules/**' -g '!dist/**'`：无命中，命令以 1 退出表示未匹配。
- 备注：本步骤完成 MCP server 单元层工具注册和本机插件 client；真实 MCP inspector/Codex MCP 连接测试尚未执行，需等 Zotero test profile 和插件运行环境准备好。

### 步骤 10 - 集成测试与 test profile 验收

修订：
- 2026-06-26：用户指出真实 Zotero 验收前必须先生成可安装的测试版 XPI。原步骤 10 拆分为：
  - 步骤 10A：Zotero 插件 XPI 打包与开发安装准备。
  - 步骤 10B：集成测试与 test profile 验收。

### 步骤 10A - Zotero 插件 XPI 打包与开发安装准备

计划：
- 目标文件：
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\scripts\buildZoteroPlugin.mjs`
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\bootstrap.js`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\manifest.json`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\package.json`
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\unit\zotero-plugin\pluginPackage.test.ts`
- 符号变更：
  - 新增 `npm run build:zotero-plugin`，生成 `dist\zotero-codex-bridge.xpi`。
  - XPI 至少包含 `manifest.json` 和 Zotero bootstrap 入口。
- 预期行为：
  - 用户可以把 `dist\zotero-codex-bridge.xpi` 安装到 `ZoteroCodexBridgeTest`。
  - 插件安装后只做最小 bootstrap 加载，不执行真实 Zotero 写操作。
- 测试命令：
  - `npm run build:zotero-plugin`
  - `npm run test -- tests/unit/zotero-plugin/pluginPackage.test.ts`
- 通过标准：
  - XPI 文件存在。
  - XPI 内包含 `manifest.json` 和 `bootstrap.js`。
  - manifest id 为 `zotero-codex-bridge@example.com`。
  - 不引入 Web API、SQLite 写入或任意 JS eval。

执行：
- 开始时间：2026-06-26 12:48:30
- 结束时间：2026-06-26 12:52:00
- 操作内容：
  - 新增 `tests\unit\zotero-plugin\pluginPackage.test.ts`，先以 RED 方式验证插件打包命令和 XPI 内容。
  - RED 证据：首次运行 `npm run test -- tests/unit/zotero-plugin/pluginPackage.test.ts` 失败，打包脚本尚不存在。
  - 新增 `src\zotero-plugin\bootstrap.js`，提供 Zotero bootstrap 生命周期入口 `install`、`startup`、`shutdown`、`uninstall`。
  - 新增 `scripts\buildZoteroPlugin.mjs`，将 `manifest.json` 和 `bootstrap.js` 打包为 `dist\zotero-codex-bridge.xpi`。
  - 更新 `package.json`，新增 `npm run build:zotero-plugin`。
  - 更新 `README.md` 和 `tests\integration\manualAcceptance.md`，补充测试 XPI 安装步骤。
- 测试结果：通过。
  - `npm run build:zotero-plugin`：通过，生成 `dist\zotero-codex-bridge.xpi`。
  - `npm run test -- tests/unit/zotero-plugin/pluginPackage.test.ts`：通过，1 个测试通过。
  - `npm run test`：通过，15 个测试文件、49 个测试通过。
  - `npm run build`：通过。
  - `npm run lint`：通过。
  - `tar -tf dist\zotero-codex-bridge.xpi`：包含 `bootstrap.js` 和 `manifest.json`。
- 备注：当前 XPI 是最小 bootstrap 包，可用于安装和加载验证；真实 HTTP 命令 server 还未接入 Zotero 运行时，因此尚不能执行 Zotero 写操作。

修订：
- 2026-06-26：用户反馈 Zotero 9.0.5 安装 XPI 时提示 “could not be installed / incompatible”。根据 Zotero 9 插件兼容性问题，将 `manifest.json` 中 `strict_max_version` 从 `9.*` 改为 `9.99.99`，并补充单元测试锁定 Zotero 9 兼容声明。
- 2026-06-26：第一次修复后用户反馈 Zotero 9.0.5 仍提示 incompatible。继续对照 Zotero 官方示例，将扩展 id 改为标准 email-like 形式 `zotero-codex-bridge@example.com`，并将 `strict_max_version` 改为匹配当前 Zotero 9.0.x 的 `9.0.*`。
- 2026-06-26：用户提供 Zotero Debug Output，真实错误为 `Reading manifest: applications.zotero.update_url not provided`。按 Zotero 官方示例补充 `applications.zotero.update_url`，并在包装测试中锁定该字段。
- 2026-06-26：用户确认插件已安装并重启 Zotero。继续执行时核对 Zotero 官方 connector server 文档，决定将插件本机 HTTP 入口注册到 Zotero connector server：`127.0.0.1:23119/zotero-codex-bridge/*`。这是 Zotero 插件内部注册的本机 endpoint，不是 Zotero Web API。
- 2026-06-26：新增 health endpoint 和未实现 command endpoint 占位，XPI 版本提升到 `0.1.1`。`/zotero-codex-bridge/health` 返回插件 id、版本和 `profileMode: "test"`；`/zotero-codex-bridge/command` 暂时返回 `COMMAND_ENDPOINT_NOT_IMPLEMENTED`，防止误以为写命令已接入。
- 2026-06-26：更新 `src\mcp-server\zoteroPluginClient.ts` 和 `src\zotero-plugin\httpCommandServer.ts`，将默认 endpoint 从原设想的 `23120/command` 改为 Zotero connector server 的 `23119/zotero-codex-bridge/command`，并新增 health endpoint getter。
- 2026-06-26：同步更新 `README.md`、`tests\integration\manualAcceptance.md` 和 `docs\spec-zotero-local-write-mcp.md`，记录 health endpoint 验收步骤和通信入口修订。
- 验证：
  - `npm run build:zotero-plugin`：通过，生成 `dist\zotero-codex-bridge.xpi`。
  - `npm run test`：通过，15 个测试文件、52 个测试通过。
  - `npm run build`：通过。
  - `npm run typecheck`：通过。
  - `npm run lint`：通过。
  - 展开 XPI 检查：`manifest.json` 为版本 `0.1.1`；`bootstrap.js` 包含 `/zotero-codex-bridge/health`、`/zotero-codex-bridge/command` 和 `Zotero.Server.Endpoints[path]` 注册逻辑。
- 2026-06-26：用户安装 `0.1.2` 后 health endpoint 从 `No endpoint found` 变为 `ResponseEnded`，说明 endpoint 已注册但响应协议错误。将 endpoint `init` 从旧文档的 `sendResponseCallback` 方式改为 Zotero 9 行为更匹配的 return-array 形式，XPI 版本提升到 `0.1.3`，health 成功时返回纯文本 `zotero-codex-bridge ok 0.1.3 zotero-codex-bridge@example.com test`。
- 2026-06-26：用户提供 `0.1.3` Debug Output，Zotero 记录 `GET /zotero-codex-bridge/health` 后立即 `Preventing request from browser` 和 `Cancelling without sending a response`。结论：endpoint 已注册，失败原因是 PowerShell 默认 User-Agent 被 Zotero connector server 视为 browser-like 请求拦截。更新 README 和手工验收文档，要求 health check 显式设置非浏览器 User-Agent，例如 `ZoteroCodexBridge/0.1.3`。
- 2026-06-26：用户未重装插件直接用非浏览器 User-Agent 测试，Debug Output 显示请求已进入 connector server 且不再被 browser 拦截，但没有响应完成。结合 Zotero 9 endpoint 示例，将 return-array 第二项从 MIME 字符串改为 headers 对象 `{ "Content-Type": "text/plain" }`，XPI 版本提升到 `0.1.4`。
- 2026-06-26：用户指出继续猜测不可靠，要求先调查 Zotero 官方插件开发资料并整理到本地。已克隆官方 sample `zotero/make-it-red` 到 `references\official\zotero\make-it-red\`，并从本机 Zotero 9.0.5 `A:\Program Files\Zotero\app\omni.ja` 提取 `server.js`、`server_connector.js`、`server_localAPI.js` 到 `references\official\zotero\zotero-9.0.5-server\`。新增 `docs\zotero-official-plugin-development-references.md`，记录官方文档、官方 sample、本机 server 源码结论和后续实现规则。
- 2026-06-26：源码结论修正：Zotero 9 单参数 endpoint `init(req)` 官方形态返回 `[statusCode, contentType, body]`；二参数 endpoint 才使用 `sendResponseCallback`。此前 `0.1.4` 的 headers-object 返回格式并非必要，下一次代码修订应按 `/connector/ping` 官方同形实现 `init: async function (req) { return [200, "text/plain", body]; }`，并补 no-op `onMainWindowLoad` / `onMainWindowUnload`。
- 2026-06-26：按官方 `/connector/ping` 同形修订 `src\zotero-plugin\bootstrap.js`，XPI 版本提升到 `0.1.5`。health 与 command endpoint 均使用单参数 `init(req)`，返回 `[statusCode, "text/plain", body]`；补齐 `onMainWindowLoad` / `onMainWindowUnload` no-op 生命周期函数；`eslint.config.js` 新增 `references/**` ignore，避免官方参考源码被当作项目源码 lint。
- 验证：
  - `npm run test -- tests/unit/zotero-plugin/pluginPackage.test.ts`：通过，3 个测试通过。
  - `npm run lint`：通过。
  - `npm run build:zotero-plugin`：通过，生成 `dist\zotero-codex-bridge.xpi`。
  - 展开 XPI 检查：`manifest.json` 为版本 `0.1.5`；`bootstrap.js` 包含 `onMainWindowLoad`、`onMainWindowUnload`、`"text/plain"` 和 `zotero-codex-bridge ok 0.1.5 zotero-codex-bridge@example.com test`。

### 步骤 10B - 集成测试与 test profile 验收

修订：
- 2026-06-26 17:35:00：本步骤原本排在 XPI 安装之后立即执行完整手工验收。经官方规范复审，完整集成验收必须后移到以下前置门槛之后：health endpoint 运行时验证、开发期 source-load/extension proxy 路径、command endpoint 鉴权、第一批 Zotero 内部 API 源码审计。当前步骤只保留测试 profile 文档和 fixture 准备，不再作为下一步直接执行真实写命令的入口。

计划：
- 目标文件：
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\integration\zoteroTestProfile.md`
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\integration\manualAcceptance.md`
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\fixtures\attachments\`
- 符号变更：
  - 新增手工验收流程和固定测试附件 fixtures。
  - 记录用户手动建立 test profile 的检查点。
- 预期行为：
  - 在测试 profile 中完成 collection/subcollection、tag、note、attachment、backup、undo 的端到端验收。
  - 第一阶段拒绝真实主库写操作。
- 测试命令：
  - `npm run build`
  - `npm run test`
  - 手工启动 Zotero test profile 并执行 MCP dry-run 与 execute 验收步骤。
- 通过标准：
  - 所有 Success Criteria 在测试 profile 中通过。
  - 审计日志和 backup 文件位于本项目目录。
  - 真实主库写操作被拒绝。

执行：
- 开始时间：2026-06-26 12:28:00
- 结束时间：暂停，待步骤 10D-10G 完成后恢复完整集成验收
- 操作内容：
  - 用户确认已建立并启用 `ZoteroCodexBridgeTest` profile。
  - 新增 `tests\integration\zoteroTestProfile.md`，记录测试 profile 前置检查、Data Directory 记录点、seed item 要求和停止条件。
  - 新增 `tests\integration\manualAcceptance.md`，记录 collection/subcollection、item membership、tags、child notes、attachments、backup、audit、undo 和 safety 的手工验收清单。
  - 新增 `tests\fixtures\attachments\README.md`、`sample-paper.pdf`、`sample-data.csv`、`sample-page.html`、`sample-image.svg`，作为基础附件验收 fixtures。
  - 发现 `ZoteroProfile\prefs.js` 被 ESLint 当作源码扫描；更新 `.gitignore` 和 `eslint.config.js`，忽略 `ZoteroProfile\`，避免测试 profile 数据进入源码检查和版本边界。
  - 根据用户补充要求，新增测试 profile marker 规则：写操作除 `profileMode: "test"` 外，还要求 `ZoteroProfile\.zotero-codex-bridge-test-profile` 存在。
  - 先更新 `tests\unit\zotero-plugin\profileGuard.test.ts` 和相关 `CommandRegistry` 测试，RED 证据为 marker 缺失时未拒绝写操作。
  - 更新 `src\zotero-plugin\profileGuard.ts` 和 `src\zotero-plugin\commandRegistry.ts`，实现 marker 检查。
  - 新增本地 marker 文件 `ZoteroProfile\.zotero-codex-bridge-test-profile`。
  - 新增 `scripts\ensureTestProfileMarker.mjs`，并在 `package.json` 中添加 `pretest`，使 `npm run test` 前自动创建缺失的 test profile marker。
  - 更新 `docs\spec-zotero-local-write-mcp.md`、`tests\integration\zoteroTestProfile.md`、`tests\integration\manualAcceptance.md`，同步 marker 要求。
  - 用户确认已将 linked attachment 根目录设置为 `ZoteroVault\`，将 Zotero Data Directory 设置为 `ZoteroData\`。
  - 更新 `.gitignore` 和 `eslint.config.js`，将 `ZoteroVault\`、`ZoteroData\` 与 `ZoteroProfile\` 一并排除。
  - 更新 `tests\integration\zoteroTestProfile.md`，记录 `ZoteroProfile\`、`ZoteroVault\`、`ZoteroData\` 三个测试目录的绝对路径和验收条件。
  - 更新 `tests\integration\manualAcceptance.md`，要求手工验收前确认三个测试目录不是项目源码、真实主库或真实附件根目录。
- 测试结果：阶段性通过。
  - `npm run test -- tests/unit/zotero-plugin/profileGuard.test.ts tests/unit/zotero-plugin/commandRegistry.test.ts`：通过，2 个测试文件、6 个测试通过。
  - `npm run test`：通过，14 个测试文件、48 个测试通过。
  - `npm run build`：通过。
  - `npm run typecheck`：通过。
  - `npm run lint`：通过。
  - `npm run ensure:test-profile-marker`：通过。
  - `Test-Path "ZoteroProfile\.zotero-codex-bridge-test-profile"`：返回 `True`。
  - `rg "TODO|未填|填入" README.md AGENTS.md tests\integration docs TaskDocs -g '!ZoteroProfile/**' -g '!ZoteroVault/**' -g '!ZoteroData/**'`：仅命中历史日志中记录检查命令的文字，以及 `zoteroTestProfile.md` 中等待真实手工 seed item 后填写的 Item A/Item B zoteroItemKey。
- 备注：第 10B 步只完成测试 profile 文档、marker 和 fixture 准备。真实 Zotero 写入验收必须等待步骤 10D-10G 的新门槛完成；当前未对 Zotero 执行任何真实写操作。

### 步骤 10C - 官方规范复审与计划门槛修订

计划：
- 目标文件：
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\zotero-official-plan-review.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\spec-zotero-local-write-mcp.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\TaskDocs\任务总览.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\README.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\mcp-server\zoteroPluginClient.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\unit\mcp-server\toolRegistry.test.ts`
- 符号变更：
  - `ZoteroPluginClient.health()` 从 JSON 解析改为 plain text 解析，匹配 Zotero 9.0.5 `/connector/ping` 同形 health endpoint。
- 预期行为：
  - 官方资料不推翻“插件内部命令表 + 外部 MCP server”的总架构。
  - 真实写命令接入前增加硬门槛：health 运行时验证、开发期 extension proxy/source-load 路径、command endpoint 鉴权、第一批 Zotero 内部 API 源码审计。
  - 第一阶段验收目标明确为 Zotero 9.0.5 64-bit on Windows；Zotero 7/8 兼容性后续作为兼容矩阵处理。
- 测试命令：
  - `npm run test -- tests/unit/mcp-server/toolRegistry.test.ts`
  - `npm run test`
  - `npm run build`
  - `npm run typecheck`
  - `npm run lint`
- 通过标准：
  - 文档记录官方资料复审结论。
  - MCP health client 与插件 health endpoint response contract 一致。
  - 后续计划不再把 command endpoint 鉴权当作可后置 open question。

执行：
- 开始时间：2026-06-26 17:20:00
- 结束时间：2026-06-26 17:30:25
- 操作内容：
  - 新增 `docs\zotero-official-plan-review.md`，记录官方资料复审结论。
  - 更新 `docs\spec-zotero-local-write-mcp.md`，新增 Zotero 9.0.5 第一验收目标、开发期 extension proxy/source-load 路径、HTTP command endpoint 安全门槛、Zotero API source audit 要求。
  - 更新 `TaskDocs\任务总览.md` 和 `README.md`，链接官方资料复审文档。
  - 修正 `src\mcp-server\zoteroPluginClient.ts`，使 `health()` 解析 plain text 而不是 JSON。
  - 更新 `tests\unit\mcp-server\toolRegistry.test.ts`，覆盖 plain text health response。
- 测试结果：通过。
  - `npm run test -- tests/unit/mcp-server/toolRegistry.test.ts`：通过，8 个测试通过。
  - `npm run test`：通过，15 个测试文件、53 个测试通过。
  - `npm run build`：通过。
  - `npm run typecheck`：通过。
  - `npm run lint`：通过。
- 备注：复审结论是“现有总架构保留，但步骤顺序必须调整”。尤其是 command endpoint 鉴权和 Zotero 内部 API 源码审计必须发生在任何真实写命令接入之前。

### 步骤 10D - Health 运行时验证与开发加载路径

计划：
- 目标文件：
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\README.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\integration\manualAcceptance.md`
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\integration\zoteroPluginDevelopmentInstall.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\TaskDocs\Zotero本地写入MCP项目实施计划日志.md`
- 符号变更：
  - 无源码符号变更。
  - 文档新增 `ZoteroCodexBridgeTest` 中验证 `0.1.5` health endpoint 的步骤。
  - 文档新增官方开发期 source-load / extension proxy 路径，作为 XPI 安装之外的开发内循环。
- 预期行为：
  - 先证明当前插件能在 Zotero 9.0.5 测试 profile 中稳定加载并响应 health。
  - 后续 bootstrap/manifest 小改可以走 source-load / extension proxy，减少重复 XPI 拖入安装。
- 测试命令：
  - `npm run build:zotero-plugin`
  - 用户在 Zotero 9.0.5 测试 profile 中运行：
    ```powershell
    Invoke-WebRequest `
      -Uri http://127.0.0.1:23119/zotero-codex-bridge/health `
      -UserAgent "ZoteroCodexBridge/0.1.5" `
      -UseBasicParsing
    ```
- 通过标准：
  - health 返回 `zotero-codex-bridge ok 0.1.5 zotero-codex-bridge@example.com test`。
  - Debug Output 不再出现本插件 endpoint 的 `Preventing request from browser` 或 `ResponseEnded`。
  - 开发加载文档明确何时需要重启 Zotero 或重新安装 XPI。

执行：
- 开始时间：2026-06-26 17:30:25
- 结束时间：2026-06-26 17:34:59
- 操作内容：
  - 新增 `tests\integration\zoteroPluginDevelopmentInstall.md`，整理官方 source-load / extension proxy 开发加载路径。
  - 记录 XPI 回归安装路径、extension proxy 文件路径、`prefs.js` 缓存行清理要求、debug 启动命令和 health check 命令。
- 测试结果：阶段性通过。
  - 文档创建完成。
  - `npm run test`：通过，15 个测试文件、53 个测试通过。
  - `npm run build`：通过。
  - `npm run typecheck`：通过。
  - `npm run lint`：通过。
  - `npm run build:zotero-plugin`：通过。
  - `rg "ZOTERO_API_KEY|api\.zotero\.org|zotero\.sqlite|sqlite write|任意 JS eval" src package.json -g '!node_modules/**' -g '!dist/**'`：无命中，命令以 1 退出表示未匹配。
  - 用户在 `ZoteroCodexBridgeTest` 中执行 health check，返回 `StatusCode: 200`、`X-Zotero-Version: 9.0.5`、`X-Zotero-Connector-API-Version: 3`、`Content-Type: text/plain`。
  - health response body：`zotero-codex-bridge ok 0.1.5 zotero-codex-bridge@example.com test`。
- 备注：本步骤只验证插件运行时加载，不接入真实写命令；health 运行时验证已通过，下一步进入 10E command endpoint 鉴权。

### 步骤 10E - Command endpoint 鉴权前置实现

计划：
- 目标文件：
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\shared\auth.ts`
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\mcp-server\authTokenStore.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\mcp-server\zoteroPluginClient.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\bootstrap.js`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\httpCommandServer.ts`
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\unit\mcp-server\authTokenStore.test.ts`
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\unit\zotero-plugin\httpAuth.test.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\.gitignore`
- 符号变更：
  - 新增 `BridgeAuthToken`、`AuthTokenStore`、`createAuthHeaders()`、`validateCommandAuth()`。
  - `ZoteroPluginClient.execute()` 为 command 请求添加本机鉴权 header。
  - Zotero 插件 command endpoint 拒绝缺少鉴权、content type 非 JSON、方法不匹配或 unknown command 的请求。
- 预期行为：
  - `/zotero-codex-bridge/health` 继续无敏感信息、无写能力。
  - `/zotero-codex-bridge/command` 在任何真实命令接入前先具备鉴权门槛。
  - 鉴权 secret 只保存在本项目目录的 ignored runtime 文件中，不写入 Zotero profile、Zotero data directory、linked attachment root 或附件目录。
- 测试命令：
  - `npm run test -- tests/unit/mcp-server/authTokenStore.test.ts tests/unit/zotero-plugin/httpAuth.test.ts`
  - `npm run test`
  - `npm run build`
  - `npm run typecheck`
  - `npm run lint`
- 通过标准：
  - 未带鉴权的 command 请求被拒绝。
  - 非 JSON command 请求被拒绝。
  - 带有效鉴权的 command 请求可以到达 command registry。
  - `rg "ZOTERO_API_KEY|api\.zotero\.org|zotero\.sqlite|sqlite write|任意 JS eval" src package.json` 无命中。

执行：
- 开始时间：2026-06-26 17:35:00
- 结束时间：2026-06-26 17:39:54
- 操作内容：
  - 新增 `src\shared\auth.ts`，定义 `BRIDGE_AUTH_HEADER`、`BridgeAuthToken`、`createAuthHeaders()`、`validateCommandAuth()`。
  - 新增 `src\mcp-server\authTokenStore.ts`，将 command auth token 生成并保存到本项目 `runtime\auth\bridge-token`。
  - 更新 `.gitignore`，忽略 `runtime\auth\bridge-token`。
  - 更新 `src\mcp-server\zoteroPluginClient.ts`，command 请求在配置 `authToken` 时添加 `x-zotero-codex-bridge-token` header。
  - 更新 `src\zotero-plugin\httpCommandServer.ts`，新增 `handleHttpRequest()`，拒绝缺少鉴权、错误鉴权、非 JSON content type 和非 POST 请求。
  - 更新 `src\zotero-plugin\bootstrap.js`，packaged command endpoint 先拒绝非 JSON 和缺 token 请求；带 token 时仍返回 `COMMAND_ENDPOINT_NOT_IMPLEMENTED`，不接入真实命令。
  - 新增 `tests\unit\mcp-server\authTokenStore.test.ts` 和 `tests\unit\zotero-plugin\httpAuth.test.ts`。
  - 测试插件版本从 `0.1.5` 提升到 `0.1.6`，用于区分已加入 command auth 门槛的新 XPI。
- 测试结果：通过。
  - RED 证据：首次运行 `npm run test -- tests/unit/mcp-server/authTokenStore.test.ts tests/unit/zotero-plugin/httpAuth.test.ts` 失败，原因是 `src\shared\auth.js` 尚不存在。
  - `npm run test -- tests/unit/mcp-server/authTokenStore.test.ts tests/unit/zotero-plugin/httpAuth.test.ts`：通过，2 个测试文件、6 个测试通过。
  - `npm run test -- tests/unit/mcp-server/authTokenStore.test.ts tests/unit/zotero-plugin/httpAuth.test.ts tests/unit/mcp-server/toolRegistry.test.ts tests/unit/zotero-plugin/pluginPackage.test.ts`：首次并行验证时与另一个 Vitest 进程争用 `dist\zotero-codex-bridge.xpi`，`tar -tf` 短暂失败；顺序重跑通过，4 个测试文件、17 个测试通过。
  - `npm run test`：通过，17 个测试文件、59 个测试通过。
  - `npm run build`：通过。
  - `npm run typecheck`：通过。
  - `npm run lint`：通过。
  - `npm run build:zotero-plugin`：通过。
  - `rg "ZOTERO_API_KEY|api\.zotero\.org|zotero\.sqlite|sqlite write|任意 JS eval" src package.json -g '!node_modules/**' -g '!dist/**'`：无命中，命令以 1 退出表示未匹配。
  - 展开 XPI 检查：`manifest.json` 为版本 `0.1.6`；`bootstrap.js` 包含 `x-zotero-codex-bridge-token`、`COMMAND_CONTENT_TYPE_UNSUPPORTED`、`COMMAND_AUTH_REQUIRED` 和 `COMMAND_ENDPOINT_NOT_IMPLEMENTED`。
  - 用户在 `ZoteroCodexBridgeTest` 中安装并重启 `0.1.6` 后运行 health check，返回 `StatusCode: 200`、`X-Zotero-Version: 9.0.5`、`X-Zotero-Connector-API-Version: 3`、`Content-Type: text/plain`。
  - 用户运行未带 `x-zotero-codex-bridge-token` 的 `/zotero-codex-bridge/command` POST 请求，返回 `StatusCode: 401 Unauthorized`，响应 JSON 中包含 `error.code: COMMAND_AUTH_REQUIRED`。
- 备注：本步骤只建立 command endpoint 鉴权门槛，仍未接入任何真实 Zotero 写 adapter。packaged `bootstrap.js` 目前校验 token 是否存在并拒绝非 JSON；完整 token 值校验已在 TypeScript HTTP server 单元层实现，将在后续真实 command endpoint 接入时与插件 runtime token 读取一起落地。

### 步骤 10F - Zotero API source audit：collection read/create

计划：
- 目标文件：
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\zotero-api-source-audit.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\commands\collectionCommands.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\unit\zotero-plugin\collectionCommands.test.ts`
- 符号变更：
  - 无真实写实现前置符号变更。
  - 文档记录 `collection.getTree`、`collection.create` 计划使用的 Zotero 9.0.5 内部 API、事务边界、错误模式、是否需要 window context。
- 预期行为：
  - 在实现真实 collection 读写前，先有可审计的 Zotero API 调用依据。
  - 只审计 local user library，不涉及 group library。
- 测试命令：
  - `rg "collection.create|collection.getTree|Zotero.Collection|saveTx|Libraries.userLibraryID" docs src tests`
  - `npm run test -- tests/unit/zotero-plugin/collectionCommands.test.ts`
- 通过标准：
  - `docs\zotero-api-source-audit.md` 明确列出官方文档、官方示例或本机 Zotero 9.0.5 源码依据。
  - collection adapter 的单元测试仍通过。
  - 没有直接写 SQLite 或 Web API 路径。

执行：
- 开始时间：2026-06-26 17:55:30
- 结束时间：2026-06-26 17:57:20
- 操作内容：
  - 新增 `docs\zotero-api-source-audit.md`。
  - 审计 `references\official\zotero\zotero-9.0.5-client\xpcom\data\libraries.js` 中 `Zotero.Libraries.userLibraryID` 的来源。
  - 审计 `references\official\zotero\zotero-9.0.5-client\xpcom\data\collections.js` 中 `Zotero.Collections.getByLibrary()` 与递归 collection tree 读取逻辑。
  - 审计 `references\official\zotero\zotero-9.0.5-client\xpcom\data\collection.js` 中 `Zotero.Collection`、`parentKey`、`_initSave()`、`_saveData()` 的 create 保存路径。
  - 审计 `references\official\zotero\zotero-9.0.5-client\xpcom\data\dataObject.js` 中 `saveTx()` 和默认 user library 行为。
  - 审计 `references\official\zotero\zotero-9.0.5-server\server_localAPI.js` 中 local API collection listing 对 `getByLibrary()` 的使用。
- 测试结果：通过。
  - `docs\zotero-api-source-audit.md` 已明确记录 `collection.getTree` 和 `collection.create` 的 Zotero 9.0.5 内部 API 依据。
  - 结论：`collection.getTree` 可作为只读 runtime probe 接入；`collection.create` 必须等 token 值校验、dry-run、confirmation、audit、backup/undo 运行时链路完整后才能接入真实写入。
- 备注：本步骤只审计第一批 collection API；attachment API source audit 后续单独执行。

### 步骤 10G - 第一批真实插件命令接入：collection tree/create

计划：
- 目标文件：
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\bootstrap.js`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\commands\collectionCommands.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\mcp-server\toolRegistry.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\integration\manualAcceptance.md`
- 符号变更：
  - ~~将 `collection.getTree` 接入真实 Zotero 读取路径。~~
  - 将 `collection.getTree` 接入真实 Zotero 只读读取路径，作为 runtime probe。
  - ~~将 `collection.create` 作为第一批真实写命令接入 dry-run + confirmation + command auth 流程。~~
  - `collection.create` 暂不接入 packaged runtime endpoint；写入接入延后到 token 值校验、dry-run、confirmation、audit、backup/undo 链路在 Zotero runtime 内完整打通后。
- 预期行为：
  - `collection.getTree` 可在 `ZoteroCodexBridgeTest` 中读取 local user library collection tree。
  - ~~`collection.create` 必须先 dry-run，execute 必须带有效鉴权、未过期 `planId` 和匹配 `confirmationToken`。~~
  - `collection.create` 在 `0.1.7` 中仍返回未接入错误，不能创建 collection。
- 测试命令：
  - `npm run test`
  - `npm run build`
  - `npm run typecheck`
  - `npm run lint`
  - 在 `ZoteroCodexBridgeTest` 中执行手工验收：读取 collection tree，验证未带 token 的 command 请求返回 401，验证写命令仍未接入。
- 通过标准：
  - ~~Zotero UI 可见新建 collection。~~
  - `collection.getTree` 返回 JSON 数组，内容与当前 test profile collection tree 一致。
  - ~~审计日志写入 `logs/audit/`。~~
  - 本轮不执行写命令，因此不要求产生写入审计；后续写命令接入时恢复该标准。
  - 不写 Zotero profile、Zotero data directory、linked attachment root 或附件目录。
  - 真实主库写入仍被拒绝。

执行：
- 开始时间：2026-06-26 17:57:20
- 结束时间：2026-06-26 17:58:35
- 操作内容：
  - 将测试插件版本提升到 `0.1.7`。
  - 在 `src\zotero-plugin\bootstrap.js` 中为 authenticated command endpoint 接入只读 `collection.getTree`。
  - 未带 token 请求仍返回 `COMMAND_AUTH_REQUIRED`。
  - 非 `collection.getTree` 命令仍返回 `COMMAND_ENDPOINT_NOT_IMPLEMENTED`。
  - 更新 `README.md`、`tests\integration\manualAcceptance.md`、`tests\integration\zoteroPluginDevelopmentInstall.md` 和 `TaskDocs\任务总览.md`。
- 测试结果：通过。
  - `npm run test`：通过，17 个测试文件、59 个测试通过。
  - `npm run build`：通过。
  - `npm run typecheck`：通过。
  - `npm run lint`：通过。
  - `npm run build:zotero-plugin`：通过。
  - `tar -xOf dist\zotero-codex-bridge.xpi manifest.json`：版本为 `0.1.7`。
  - `tar -xOf dist\zotero-codex-bridge.xpi bootstrap.js | Select-String ...`：包内包含 `0.1.7`、`collection.getTree`、`Zotero.Collections.getByLibrary`、`COMMAND_AUTH_REQUIRED` 和 `COMMAND_ENDPOINT_NOT_IMPLEMENTED`。
  - `rg "ZOTERO_API_KEY|api\.zotero\.org|zotero\.sqlite|sqlite write|任意 JS eval" src tests package.json README.md AGENTS.md docs TaskDocs -g '!node_modules/**' -g '!dist/**' -g '!ZoteroProfile/**' -g '!ZoteroVault/**' -g '!ZoteroData/**'`：仅命中文档中的禁止项、调查记录和验证命令，未命中源码实现或依赖配置。
  - 用户在 `ZoteroCodexBridgeTest` 中安装并重启 `0.1.7` 后运行 health check，返回 `StatusCode: 200`，body 为 `zotero-codex-bridge ok 0.1.7 zotero-codex-bridge@example.com test`。
  - 用户带 `manual-probe-token` 调用 `collection.getTree`，返回 `StatusCode: 200`，响应 JSON 为 `ok: true`、`commandName: collection.getTree`、`data.collections: []`。
- 备注：按 10F 审计结论，本步骤先接入只读 probe，避免在 runtime token 值校验和 dry-run/confirmation 链路未完整前暴露写入口。

### 步骤 10H - Runtime token 值校验与 collection.create dry-run/execute 闭环

计划：
- 目标文件：
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\bootstrap.js`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\bootstrap.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\manifest.json`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\scripts\buildZoteroPlugin.mjs`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\unit\zotero-plugin\pluginPackage.test.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\unit\mcp-server\toolRegistry.test.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\integration\zoteroPluginDevelopmentInstall.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\integration\manualAcceptance.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\zotero-api-source-audit.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\README.md`
- 符号变更：
  - `bootstrap.js` 中新增 packaged runtime 的 `expectedAuthToken`、`confirmations`、`createCollectionCreateDryRun()`、`executeCollectionCreate()`、`validateStoredConfirmation()`、`hashInput()`。
  - `buildZoteroPlugin.mjs` 生成或复用 `runtime\auth\bridge-token`，并在打包时注入到 XPI。
  - `collection.create` 默认 dry-run；只有 `mode:"execute"` 且 confirmation 匹配时才调用 `Zotero.Collection.saveTx()`。
- 预期行为：
  - 缺 token 返回 `COMMAND_AUTH_REQUIRED`。
  - 错 token 返回 `COMMAND_AUTH_INVALID`。
  - `collection.create` 未带 confirmation execute 返回 `CONFIRMATION_REQUIRED`。
  - `collection.create` dry-run 返回 `planId`、`inputHash`、`confirmation.token`、过期时间和目标信息。
  - `collection.create` execute 使用同一 input 和 confirmation 后，在 `ZoteroCodexBridgeTest` 中创建顶层 collection。
- 测试命令：
  - `npm run test`
  - `npm run build`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build:zotero-plugin`
  - 展开 XPI 检查版本、token placeholder 已替换、`collection.create` 和 `CONFIRMATION_REQUIRED` 存在。
- 通过标准：
  - 全部自动验证通过。
  - `dist\zotero-codex-bridge.xpi` 版本为 `0.1.8`。
  - 包内不包含 `__ZOTERO_CODEX_BRIDGE_AUTH_TOKEN__` placeholder。
  - 不引入 Web API、SQLite 写入或任意 JS eval。

执行：
- 开始时间：2026-06-26 18:23:00
- 结束时间：2026-06-26 18:29:04
- 操作内容：
  - 已将测试插件版本提升到 `0.1.8`。
  - 已在 `bootstrap.js` 中加入 token 值校验和 `collection.create` dry-run/execute 二阶段闭环。
  - 已更新打包脚本，在构建 XPI 时复用或生成 `runtime\auth\bridge-token` 并替换包内 token placeholder。
  - 已更新手工验收文档，改为读取 `runtime\auth\bridge-token`，并增加错误 token、dry-run、execute 验证命令。
- 测试结果：通过。
  - `npm run test`：通过，17 个测试文件、59 个测试通过。
  - `npm run build`：通过。
  - `npm run typecheck`：通过。
  - `npm run lint`：通过。
  - `npm run build:zotero-plugin`：通过。
  - `tar -xOf dist\zotero-codex-bridge.xpi manifest.json`：版本为 `0.1.8`。
  - `tar -xOf dist\zotero-codex-bridge.xpi bootstrap.js | Select-String ...`：包内包含 `0.1.8`、`collection.create`、`CONFIRMATION_REQUIRED`、`COMMAND_AUTH_INVALID`、`Zotero.Collection` 和 `saveTx`。
  - `runtime\auth\bridge-token` 已生成在项目目录，文件大小 44 bytes，路径被 `.gitignore` 排除。
  - `rg "ZOTERO_API_KEY|api\.zotero\.org|zotero\.sqlite|sqlite write|任意 JS eval" src tests package.json README.md AGENTS.md docs TaskDocs -g '!node_modules/**' -g '!dist/**' -g '!ZoteroProfile/**' -g '!ZoteroVault/**' -g '!ZoteroData/**'`：仅命中文档中的禁止项、调查记录和验证命令，未命中源码实现或依赖配置。
- 备注：当前仍未接入 audit/backup/undo 文件写入；本步骤只让第一个真实 Zotero 写命令具备 token + dry-run + confirmation 最小闭环。由于尚未从官方源码确认可靠的 Zotero data directory/profile runtime API，本步骤不新增猜测式 profile path guard；真实写验收仍只允许用户手动确认的 `ZoteroCodexBridgeTest`。

### 步骤 10I - Runtime 验收补测与缺失 confirmation 错误语义修正

计划：
- 目标文件：
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\bootstrap.js`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\bootstrap.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\manifest.json`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\unit\zotero-plugin\pluginPackage.test.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\unit\mcp-server\toolRegistry.test.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\integration\zoteroPluginDevelopmentInstall.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\integration\manualAcceptance.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\README.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\TaskDocs\任务总览.md`
- 符号变更：
  - `bootstrap.js` 中 `executeCollectionCreate()` 不再把缺失 confirmation 转为空对象。
  - 测试插件版本从 `0.1.8` 提升到 `0.1.9`。
- 预期行为：
  - 用户已验证的 `0.1.8` health、token 校验、dry-run、execute 创建 collection 继续有效。
  - 未带 confirmation 的 `collection.create` execute 返回 `CONFIRMATION_REQUIRED`，而不是 `PLAN_NOT_FOUND`。
- 测试命令：
  - PowerShell runtime 验收：health、无 token、错 token、tree、dry-run、execute、缺 confirmation execute。
  - `npm run test`
  - `npm run build`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build:zotero-plugin`
- 通过标准：
  - `0.1.9` 自动验证通过。
  - `0.1.9` XPI 包内版本正确。
  - 缺失 confirmation 的错误语义符合 `CONFIRMATION_REQUIRED`。

执行：
- 开始时间：2026-06-26 18:33:00
- 结束时间：2026-06-26 18:35:07
- 操作内容：
  - 已使用 PowerShell 对已安装的 `0.1.8` 执行 runtime 验收：
    - health 返回 200，body 为 `zotero-codex-bridge ok 0.1.8 zotero-codex-bridge@example.com test`。
    - 未带 token 返回 401 `COMMAND_AUTH_REQUIRED`。
    - 错误 token 返回 403 `COMMAND_AUTH_INVALID`。
    - `collection.getTree` 在创建前返回空数组。
    - `collection.create` dry-run 返回 `planId`、`inputHash`、`confirmation.token`。
    - `collection.create` execute 成功创建 `Codex Bridge Acceptance`，collection key 为 `L6UP7MHT`。
    - 创建后 `collection.getTree` 返回 `Codex Bridge Acceptance`。
  - 补测发现：直接 execute 且缺失 confirmation 时未创建 collection，但返回 404 `PLAN_NOT_FOUND`，不符合预期错误语义。
  - 已修正 `bootstrap.js`，缺失 confirmation 不再被转成空对象。
  - 已将测试插件版本提升到 `0.1.9`，并同步用户验收文档。
- 测试结果：通过。
  - `npm run test`：通过，17 个测试文件、59 个测试通过。
  - `npm run build`：通过。
  - `npm run typecheck`：通过。
  - `npm run lint`：通过。
  - `npm run build:zotero-plugin`：通过。
  - `tar -xOf dist\zotero-codex-bridge.xpi manifest.json`：版本为 `0.1.9`。
  - `tar -xOf dist\zotero-codex-bridge.xpi bootstrap.js | Select-String ...`：包内包含 `0.1.9`、`collection.create`、`CONFIRMATION_REQUIRED`、`COMMAND_AUTH_INVALID` 和 `PLAN_NOT_FOUND`，未命中旧的 `payload.confirmation || {}` 形式。
- 备注：`0.1.8` 已真实创建测试 collection `Codex Bridge Acceptance`。`0.1.9` 需要重装后再复测缺 confirmation 失败路径；如继续执行 create，会再次创建同名 collection，后续测试建议改用 subcollection 或新名称以避免重复顶层 collection。

### 步骤 10J - MCP execute 审计写入与 collection.create undo 清单

计划：
- 目标文件：
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\mcp-server\toolRegistry.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\mcp-server\undoManager.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\unit\mcp-server\toolRegistry.test.ts`
- 符号变更：
  - `McpToolRegistry` 增加可选 `AuditLogger`、`UndoManager` 和 `now` 注入。
  - `McpToolExecuteResult` 增加 `audit` 和 `undoPlans`。
  - `UndoManager.createUndoPlan()` 支持 `reversible: false` 和可选 `reverseCommand`。
  - `collection.create` execute 成功后写 `logs\audit\YYYY-MM-DD.jsonl`，并返回不可自动执行的 undo plan。
- 预期行为：
  - 经 MCP tool registry 执行写命令时，成功和失败 execute 都写项目内 audit JSONL。
  - `collection.create` 返回 undo 清单，但由于第一阶段禁止 collection 删除，undo plan 标记为 `reversible: false`。
  - 审计日志不写入 Zotero profile、Zotero data directory、linked attachment root 或附件目录。
- 测试命令：
  - `npm run test -- tests/unit/mcp-server/toolRegistry.test.ts tests/unit/mcp-server/backupManager.test.ts`
  - `npm run test`
  - `npm run build`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build:zotero-plugin`
- 通过标准：
  - 新增测试验证 audit JSONL 路径在项目 `logs\audit\` 下。
  - 新增测试验证 `collection.create` undo plan 为不可自动 undo，并解释 collection 删除禁用。
  - 全量测试、构建、类型检查、lint 和 XPI 打包通过。

执行：
- 开始时间：2026-06-26 18:40:00
- 结束时间：2026-06-26 18:44:10
- 操作内容：
  - 更新 `src\mcp-server\toolRegistry.ts`，在写命令 execute 成功后写 audit，并在失败时写 failed audit 后继续抛出错误。
  - 更新 `src\mcp-server\undoManager.ts`，支持不可自动 reverse 的 undo plan。
  - 更新 `tests\unit\mcp-server\toolRegistry.test.ts`，覆盖 `collection.create` execute 后的 audit JSONL 和 `reversible: false` undo plan。
- 测试结果：通过。
  - `npm run test -- tests/unit/mcp-server/toolRegistry.test.ts tests/unit/mcp-server/backupManager.test.ts`：通过，2 个测试文件、15 个测试通过。
  - `npm run test`：通过，17 个测试文件、60 个测试通过。
  - `npm run build`：通过。
  - `npm run typecheck`：通过。
  - `npm run lint`：通过。
  - `npm run build:zotero-plugin`：通过。
  - `tar -xOf dist\zotero-codex-bridge.xpi manifest.json`：版本仍为 `0.1.9`。
  - `rg "ZOTERO_API_KEY|api\.zotero\.org|zotero\.sqlite|sqlite write|任意 JS eval" src tests package.json README.md AGENTS.md docs TaskDocs -g '!node_modules/**' -g '!dist/**' -g '!ZoteroProfile/**' -g '!ZoteroVault/**' -g '!ZoteroData/**'`：仅命中文档中的禁止项、调查记录和验证命令，未命中源码实现或依赖配置。
- 备注：本步骤接入的是 MCP 侧 audit/undo 返回链路；direct HTTP 调用 Zotero 插件 endpoint 仍不会直接写项目 audit 文件。真实插件侧 audit 文件写入需要后续可靠的项目路径/权限机制，不能猜测实现。

### 步骤 10K - collection.rename / collection.move runtime 接入

计划：
- 目标文件：
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\bootstrap.js`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\bootstrap.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\manifest.json`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\unit\zotero-plugin\pluginPackage.test.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\unit\mcp-server\toolRegistry.test.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\zotero-api-source-audit.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\integration\zoteroPluginDevelopmentInstall.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\integration\manualAcceptance.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\README.md`
- 符号变更：
  - `bootstrap.js` 新增 `collection.rename` 和 `collection.move` 的 dry-run/execute 分支。
  - 新增 `createCollectionRenameDryRun()`、`executeCollectionRename()`、`normalizeCollectionRenameInput()`。
  - 新增 `createCollectionMoveDryRun()`、`executeCollectionMove()`、`normalizeCollectionMoveInput()`。
  - 新增 `getLocalUserCollection()`、`collectionRecord()`、`stripRuntimeFields()` 等辅助函数。
  - 测试插件版本从 `0.1.9` 提升到 `0.1.10`。
- 预期行为：
  - `collection.rename` 必须先 dry-run，再带 confirmation execute。
  - `collection.move` 必须先 dry-run，再带 confirmation execute。
  - `collection.move` 支持移动到顶层，或移动到另一个 parent collection。
  - 所有 collection 操作仍固定 local user library，不触碰 group library。
- 测试命令：
  - `npm run test`
  - `npm run build`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build:zotero-plugin`
  - 展开 XPI 检查 `0.1.10`、`collection.rename`、`collection.move`。
  - 安全边界 `rg` 搜索。
- 通过标准：
  - 全量测试、构建、类型检查、lint 和 XPI 打包通过。
  - `dist\zotero-codex-bridge.xpi` 版本为 `0.1.10`。
  - 不引入 Web API、SQLite 写入或任意 JS eval。

执行：
- 开始时间：2026-06-26 18:48:00
- 结束时间：2026-06-26 18:56:40
- 操作内容：
  - 扩展 `bootstrap.js`，接入 `collection.rename` 和 `collection.move` 的 runtime dry-run/execute 流程。
  - 更新 `docs\zotero-api-source-audit.md`，补充 rename 使用 `collection.name + saveTx()`、move 使用 `collection.parentKey + saveTx()` 的 Zotero 9.0.5 源码依据。
  - 更新 `tests\integration\zoteroPluginDevelopmentInstall.md`，加入 0.1.10 的 create、rename、move 手工验收 PowerShell 命令。
  - 更新 `README.md` 和 `tests\integration\manualAcceptance.md` 的当前测试版本。
- 测试结果：通过。
  - `npm run typecheck`：通过。
  - `npm run lint`：通过。
  - `npm run test -- tests/unit/zotero-plugin/pluginPackage.test.ts`：通过，1 个测试文件、3 个测试通过。
  - `npm run test`：通过，17 个测试文件、60 个测试通过。
  - `npm run build`：通过。
  - `npm run build:zotero-plugin`：通过。
  - `tar -xOf dist\zotero-codex-bridge.xpi manifest.json`：版本为 `0.1.10`。
  - `tar -xOf dist\zotero-codex-bridge.xpi bootstrap.js | Select-String ...`：包内包含 `0.1.10`、`collection.rename`、`collection.move`、`COLLECTION_RENAME_FAILED` 和 `COLLECTION_MOVE_FAILED`。
  - `rg "ZOTERO_API_KEY|api\.zotero\.org|zotero\.sqlite|sqlite write|任意 JS eval" src tests package.json README.md AGENTS.md docs TaskDocs -g '!node_modules/**' -g '!dist/**' -g '!ZoteroProfile/**' -g '!ZoteroVault/**' -g '!ZoteroData/**'`：仅命中文档中的禁止项、调查记录和验证命令，未命中源码实现或依赖配置。
- 备注：本步骤生成了需要重新安装到 Zotero 的 `0.1.10` XPI。runtime 验收需要用户重装/重启后继续。

### 步骤 10L - 0.1.10 runtime 验收与写命令 confirmation 优先级修正

计划：
- 目标文件：
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\bootstrap.js`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\bootstrap.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\manifest.json`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\unit\zotero-plugin\pluginPackage.test.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\unit\mcp-server\toolRegistry.test.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\integration\zoteroPluginDevelopmentInstall.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\integration\manualAcceptance.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\README.md`
- 符号变更：
  - `bootstrap.js` 新增 `assertConfirmationPresent()`。
  - `executeCollectionCreate()`、`executeCollectionRename()`、`executeCollectionMove()` 在任何输入解析或 Zotero 查找前先校验 confirmation 是否存在。
  - 测试插件版本从 `0.1.10` 提升到 `0.1.11`。
- 预期行为：
  - `0.1.10` create/subcollection/rename/move runtime 行为已被验证。
  - `0.1.11` 中任何写命令直接 execute 且缺失 confirmation 时优先返回 `CONFIRMATION_REQUIRED`。
- 测试命令：
  - PowerShell runtime 验收 0.1.10：health、错误 token、create subcollection、rename、move。
  - `npm run test`
  - `npm run build`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build:zotero-plugin`
  - 展开 XPI 检查 `0.1.11` 和 `assertConfirmationPresent`。
- 通过标准：
  - 0.1.10 runtime create/rename/move 均成功。
  - 0.1.11 自动验证通过。
  - 0.1.11 XPI 包内版本正确。

执行：
- 开始时间：2026-06-26 18:58:00
- 结束时间：2026-06-26 19:02:10
- 操作内容：
  - 使用 PowerShell 验证已安装的 `0.1.10`：
    - health 返回 200，body 为 `zotero-codex-bridge ok 0.1.10 zotero-codex-bridge@example.com test`。
    - 错误 token 返回 403 `COMMAND_AUTH_INVALID`。
    - 以 `Codex Bridge Acceptance` 作为 parent 创建 subcollection `Codex Bridge Acceptance 0.1.10 Child`，新 collection key 为 `YANEHXAN`。
    - 将 `YANEHXAN` 重命名为 `Codex Bridge Acceptance 0.1.10 Renamed`。
    - 将 `YANEHXAN` 移动到顶层，最终 `collection.getTree` 中 `YANEHXAN` 无 parentCollectionKey。
  - 补测发现：`collection.rename` 缺失 confirmation 但 collection key 不存在时，0.1.10 先返回 `COLLECTION_NOT_FOUND`，没有优先返回 `CONFIRMATION_REQUIRED`。
  - 已修正 `bootstrap.js`，所有写命令 execute 在输入解析和 Zotero 查找前先执行 `assertConfirmationPresent()`。
  - 已将测试插件版本提升到 `0.1.11`。
- 测试结果：通过。
  - `npm run typecheck`：通过。
  - `npm run lint`：通过。
  - `npm run test -- tests/unit/zotero-plugin/pluginPackage.test.ts`：通过，1 个测试文件、3 个测试通过。
  - `npm run test`：通过，17 个测试文件、60 个测试通过。
  - `npm run build`：通过。
  - `npm run build:zotero-plugin`：通过。
  - `tar -xOf dist\zotero-codex-bridge.xpi manifest.json`：版本为 `0.1.11`。
  - `tar -xOf dist\zotero-codex-bridge.xpi bootstrap.js | Select-String ...`：包内包含 `0.1.11`、`CONFIRMATION_REQUIRED`、`assertConfirmationPresent`、`collection.rename` 和 `collection.move`。
  - `rg "ZOTERO_API_KEY|api\.zotero\.org|zotero\.sqlite|sqlite write|任意 JS eval" src tests package.json README.md AGENTS.md docs TaskDocs -g '!node_modules/**' -g '!dist/**' -g '!ZoteroProfile/**' -g '!ZoteroVault/**' -g '!ZoteroData/**'`：仅命中文档中的禁止项、调查记录和验证命令，未命中源码实现或依赖配置。
- 备注：本步骤生成了需要重新安装到 Zotero 的 `0.1.11` XPI。runtime 复测重点是缺失 confirmation 时优先返回 `CONFIRMATION_REQUIRED`。

### 步骤 10M - collection item membership runtime 接入

计划：
- 目标文件：
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\bootstrap.js`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\bootstrap.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\manifest.json`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\unit\zotero-plugin\pluginPackage.test.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\unit\mcp-server\toolRegistry.test.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\zotero-api-source-audit.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\integration\zoteroPluginDevelopmentInstall.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\integration\manualAcceptance.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\README.md`
- 符号变更：
  - `bootstrap.js` 新增 `collection.getItems`、`collection.addItems`、`collection.removeItems` runtime 分支。
  - 新增 `readCollectionItems()`、`createCollectionAddItemsDryRun()`、`executeCollectionAddItems()`、`createCollectionRemoveItemsDryRun()`、`executeCollectionRemoveItems()`。
  - 新增 `normalizeCollectionItemMembershipInput()` 和 `getLocalUserItem()`。
  - 修订 `stripRuntimeFields()`，确保 `existingItemKeys` 和 `toChangeItemKeys` 只进入 dry-run 差异，不进入 confirmation input hash。
  - 测试插件版本从 `0.1.11` 提升到 `0.1.12`。
- 预期行为：
  - `collection.getItems` 读取指定 collection 当前 item keys。
  - `collection.addItems` 和 `collection.removeItems` 必须先 dry-run，再带 confirmation execute。
  - 加入已存在 membership 的 item 时跳过；移除不存在 membership 的 item 时跳过；不删除 item。
  - 单次最多处理 50 个 `zoteroItemKeys`。
- 测试命令：
  - PowerShell runtime 复测 0.1.11：health、create/rename/move 缺 confirmation。
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test -- tests/unit/zotero-plugin/pluginPackage.test.ts tests/unit/mcp-server/toolRegistry.test.ts`
  - `npm run test`
  - `npm run build`
  - `npm run build:zotero-plugin`
  - 展开 XPI 检查 `0.1.12`、`collection.getItems`、`collection.addItems`、`collection.removeItems`。
  - 安全边界 `rg` 搜索。
- 通过标准：
  - 0.1.11 runtime confirmation 优先级复测通过。
  - 全量测试、构建、类型检查、lint 和 XPI 打包通过。
  - `dist\zotero-codex-bridge.xpi` 版本为 `0.1.12`。
  - 不引入 Web API、SQLite 写入或任意 JS eval。

执行：
- 开始时间：2026-06-26 19:08:50
- 结束时间：2026-06-26 19:11:30
- 操作内容：
  - 使用 PowerShell 验证已安装的 `0.1.11`：
    - health 返回 200，body 为 `zotero-codex-bridge ok 0.1.11 zotero-codex-bridge@example.com test`。
    - `collection.create`、`collection.rename`、`collection.move` 直接 execute 且缺失 confirmation 时均返回 400 `CONFIRMATION_REQUIRED`。
  - 扩展 `bootstrap.js`，接入 `collection.getItems`、`collection.addItems`、`collection.removeItems`。
  - 修正 membership dry-run 的 confirmation hash，只绑定用户输入语义，不绑定 `existingItemKeys`、`toChangeItemKeys` 等运行时状态。
  - 更新 `docs\zotero-api-source-audit.md`，补充 item membership 读取、加入、移除的 Zotero 9.0.5 源码依据。
  - 更新 `tests\integration\zoteroPluginDevelopmentInstall.md`，加入 getItems/addItems/removeItems 手工验收 PowerShell 命令，并修正 create execute 未赋值给 `$execute` 的文档错误。
  - 更新 `README.md`、`tests\integration\manualAcceptance.md`、插件 manifest 和测试期望版本到 `0.1.12`。
- 测试结果：通过。
  - `npm run typecheck`：通过。
  - `npm run lint`：通过。
  - `npm run test -- tests/unit/zotero-plugin/pluginPackage.test.ts tests/unit/mcp-server/toolRegistry.test.ts`：通过，2 个测试文件、12 个测试通过。
  - `npm run test`：通过，17 个测试文件、60 个测试通过。
  - `npm run build`：通过。
  - `npm run build:zotero-plugin`：通过。
  - `tar -xOf dist\zotero-codex-bridge.xpi manifest.json`：版本为 `0.1.12`。
  - `tar -xOf dist\zotero-codex-bridge.xpi bootstrap.js | Select-String ...`：包内包含 `0.1.12`、`collection.getItems`、`collection.addItems`、`collection.removeItems`、`existingItemKeys`、`toChangeItemKeys` 和 `CONFIRMATION_REQUIRED`。
  - `rg "ZOTERO_API_KEY|api\.zotero\.org|zotero\.sqlite|sqlite write|任意 JS eval" src tests package.json README.md AGENTS.md docs TaskDocs -g '!node_modules/**' -g '!dist/**' -g '!ZoteroProfile/**' -g '!ZoteroVault/**' -g '!ZoteroData/**'`：仅命中文档中的禁止项、调查记录和验证命令，未命中源码实现或依赖配置。
- 备注：`0.1.12` 已生成，但尚未安装到 Zotero。membership runtime 真实写入验收需要测试 profile 中先存在普通 Item A，并把 `zoteroItemKey` 记录到 `tests\integration\zoteroTestProfile.md`。
- 运行时补测：
  - 开始时间：2026-06-26 19:27:40
  - 结束时间：2026-06-26 19:27:40
  - 操作内容：
    - 用户确认已安装 `0.1.12` 后，使用 PowerShell 调用 health、`collection.getTree` 和 `collection.getItems`。
    - health 返回 200，body 为 `zotero-codex-bridge ok 0.1.12 zotero-codex-bridge@example.com test`。
    - `collection.getTree` 返回测试 collection：`L6UP7MHT` / `Codex Bridge Acceptance`，以及 `YANEHXAN` / `Codex Bridge Acceptance 0.1.10 Renamed`。
    - `collection.getItems` 读取 `L6UP7MHT` 成功，但 `zoteroItemKeys` 为空数组。
  - 测试结果：部分通过。
    - 通过：0.1.12 runtime 已加载，health、collection tree、collection item 读取路径可用。
    - 暂停：membership 写入验收需要测试 profile 中存在普通 Item A/Item B，并需要 Item A 的 `zoteroItemKey`；当前 `L6UP7MHT` 内无 item，无法继续执行 remove/add 闭环。
  - 备注：下一步需要用户在 Zotero UI 中创建或拖入测试条目，之后继续执行 `collection.addItems` / `collection.removeItems` dry-run + execute 验收。
- membership 写入闭环补测：
  - 开始时间：2026-06-26 19:32:46
  - 结束时间：2026-06-26 19:32:46
  - 操作内容：
    - 用户在 `Codex Bridge Acceptance` 中放入两个测试条目后，使用 `collection.getItems` 读取 `L6UP7MHT`。
    - 初始 item keys 为 `7N4QZKCM`、`K7P8J5XF`。
    - `collection.removeItems` 直接 execute 且缺失 confirmation 返回 400 `CONFIRMATION_REQUIRED`。
    - `collection.removeItems` dry-run 返回 `ok: true` 和 `planId`，随后使用 `confirmationToken` execute 成功，`removedItemKeys` 为 `7N4QZKCM`、`K7P8J5XF`。
    - remove 后 `collection.getItems` 返回空数组。
    - `collection.addItems` 直接 execute 且缺失 confirmation 返回 400 `CONFIRMATION_REQUIRED`。
    - `collection.addItems` dry-run 返回 `ok: true` 和 `planId`，随后使用 `confirmationToken` execute 成功，`addedItemKeys` 为 `7N4QZKCM`、`K7P8J5XF`。
    - add 后 `collection.getItems` 返回 `7N4QZKCM`、`K7P8J5XF`。
    - 更新 `tests\integration\zoteroTestProfile.md`，记录本轮 observed item keys。
  - 测试结果：通过。
    - 0.1.12 的 `collection.getItems`、`collection.removeItems`、`collection.addItems` runtime 写入闭环通过。
    - 两个写命令均验证缺失 confirmation 时拒绝 execute。
    - remove membership 未删除 item；add membership 可恢复 collection membership。
  - 备注：当前插件只返回 item key，不返回 item title；`tests\integration\zoteroTestProfile.md` 中 Item A/B key 映射按本轮返回顺序记录，后续 item detail 读取命令实现后再用 title 精确核验。

### 步骤 10N - item.updateTags runtime 接入

计划：
- 目标文件：
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\bootstrap.js`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\bootstrap.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\manifest.json`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\unit\zotero-plugin\pluginPackage.test.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\unit\mcp-server\toolRegistry.test.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\zotero-api-source-audit.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\integration\zoteroPluginDevelopmentInstall.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\integration\manualAcceptance.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\README.md`
- 符号变更：
  - `bootstrap.js` 新增 `item.updateTags` runtime 分支。
  - 新增 `createItemUpdateTagsDryRun()`、`executeItemUpdateTags()`、`normalizeItemUpdateTagsInput()`、`readItemTags()`。
  - 复用 `getLocalUserItem()` 和 `createWriteDryRunPlan()`。
  - 测试插件版本从 `0.1.12` 提升到 `0.1.13`。
- 预期行为：
  - `item.updateTags` 必须先 dry-run，再带 confirmation execute。
  - 支持给单个 local user item 添加和移除 tags。
  - 空 tag、重复 tag、同一请求中同时 add/remove 同一 tag 应被拒绝。
  - execute 添加已存在 tag 时跳过；移除不存在 tag 时跳过；返回实际 `addedTags` 和 `removedTags`。
- 测试命令：
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test -- tests/unit/zotero-plugin/pluginPackage.test.ts tests/unit/mcp-server/toolRegistry.test.ts`
  - `npm run test`
  - `npm run build`
  - `npm run build:zotero-plugin`
  - 展开 XPI 检查 `0.1.13` 和 `item.updateTags`。
  - 安全边界 `rg` 搜索。
- 通过标准：
  - 全量测试、构建、类型检查、lint 和 XPI 打包通过。
  - `dist\zotero-codex-bridge.xpi` 版本为 `0.1.13`。
  - 不引入 Web API、SQLite 写入或任意 JS eval。

执行：
- 开始时间：2026-06-26 19:33:35
- 结束时间：2026-06-26 19:37:26
- 操作内容：
  - 扩展 `src\zotero-plugin\bootstrap.js`，接入 `item.updateTags` 的 dry-run/execute runtime 分支。
  - 新增 tag 输入规范化、空 tag/冲突 tag/批量上限校验。
  - execute 通过 Zotero item 对象层 `hasTag()`、`addTag()`、`removeTag()` 和 `saveTx()` 修改 tag。
  - 更新 `docs\zotero-api-source-audit.md`，补充 `getTags()`、`hasTag()`、`setTags()`、`addTag()`、`removeTag()` 和 save 要求的 Zotero 9.0.5 源码依据。
  - 更新 `tests\integration\zoteroPluginDevelopmentInstall.md`，补充 `item.updateTags` 添加和移除 `codex-bridge-test` 的手工验收 PowerShell 命令，并修正 `collection.getItems` 示例字段为 `data.zoteroItemKeys`。
  - 更新 `README.md`、`tests\integration\manualAcceptance.md`、插件 manifest 和测试期望版本到 `0.1.13`。
- 测试结果：通过。
  - `npm run typecheck`：通过。
  - `npm run lint`：通过。
  - `npm run test -- tests/unit/zotero-plugin/pluginPackage.test.ts tests/unit/mcp-server/toolRegistry.test.ts`：通过，2 个测试文件、12 个测试通过。
  - `npm run test`：通过，17 个测试文件、60 个测试通过。
  - `npm run build`：通过。
  - `npm run build:zotero-plugin`：通过。
  - `tar -xOf dist\zotero-codex-bridge.xpi manifest.json`：版本为 `0.1.13`。
  - `tar -xOf dist\zotero-codex-bridge.xpi bootstrap.js | Select-String ...`：包内包含 `0.1.13`、`item.updateTags`、`addTag`、`removeTag`、`TAGS_REQUIRED`、`TAG_UPDATE_CONFLICT` 和 `CONFIRMATION_REQUIRED`。
  - `rg "ZOTERO_API_KEY|api\.zotero\.org|zotero\.sqlite|sqlite write|任意 JS eval" src tests package.json README.md AGENTS.md docs TaskDocs -g '!node_modules/**' -g '!dist/**' -g '!ZoteroProfile/**' -g '!ZoteroVault/**' -g '!ZoteroData/**'`：仅命中文档中的禁止项、调查记录和验证命令，未命中源码实现或依赖配置。
- 备注：`0.1.13` 已生成，但尚未安装到 Zotero。runtime 验收需要用户重装/重启 `0.1.13` 后，使用 `tests\integration\zoteroTestProfile.md` 中记录的 Item A key `7N4QZKCM`。
- 运行时补测：
  - 开始时间：2026-06-26 19:59:05
  - 结束时间：2026-06-26 19:59:05
  - 操作内容：
    - 用户确认已安装插件后，使用 PowerShell 调用 health 和 `item.updateTags`。
    - health 返回 200，但 body 为 `zotero-codex-bridge ok 0.1.12 zotero-codex-bridge@example.com test`，与预期 `0.1.13` 不一致。
    - `item.updateTags` 直接 execute 且缺失 confirmation 返回 400 `CONFIRMATION_REQUIRED`。
    - 同一 tag 同时 add/remove 返回 400 `TAG_UPDATE_CONFLICT`。
    - `item.updateTags` dry-run 添加 `codex-bridge-test` 返回 `ok: true` 和 `planId`，随后使用 `confirmationToken` execute 成功，`addedTags` 为 `codex-bridge-test`。
    - `item.updateTags` dry-run 移除 `codex-bridge-test` 返回 `ok: true` 和 `planId`，随后使用 `confirmationToken` execute 成功，`removedTags` 为 `codex-bridge-test`，最终 `tags` 为空数组。
  - 测试结果：部分通过。
    - 通过：`item.updateTags` 添加/移除 tag 的 runtime 写入闭环通过；confirmation 和冲突校验通过。
    - 失败：health endpoint 版本号仍返回 `0.1.12`。
  - 备注：复核源码和 XPI 后确认 `bootstrap.js` 的 health 响应文本仍硬编码 `0.1.12`，需要修复为动态读取 `ZoteroCodexBridge.version` 并重新打包。

### 步骤 10O - health endpoint 版本响应修复

计划：
- 目标文件：
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\bootstrap.js`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\bootstrap.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\manifest.json`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\unit\zotero-plugin\pluginPackage.test.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\unit\mcp-server\toolRegistry.test.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\README.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\integration\zoteroPluginDevelopmentInstall.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\integration\manualAcceptance.md`
- 符号变更：
  - `registerHealthEndpoint()` 的响应从硬编码版本改为 `"zotero-codex-bridge ok " + ZoteroCodexBridge.version + ...`。
  - 测试插件版本从 `0.1.13` 提升到 `0.1.14`。
- 预期行为：
  - 后续版本升级时 health endpoint 自动返回 `ZoteroCodexBridge.version`。
  - `item.updateTags` runtime 功能保持不变。
- 测试命令：
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test -- tests/unit/zotero-plugin/pluginPackage.test.ts tests/unit/mcp-server/toolRegistry.test.ts`
  - `npm run test`
  - `npm run build`
  - `npm run build:zotero-plugin`
  - 展开 XPI 检查 `0.1.14` 和动态 health 文本。
  - 安全边界 `rg` 搜索。
- 通过标准：
  - 全量测试、构建、类型检查、lint 和 XPI 打包通过。
  - `dist\zotero-codex-bridge.xpi` 版本为 `0.1.14`。
  - 包内 health 响应使用 `ZoteroCodexBridge.version`。
  - 不引入 Web API、SQLite 写入或任意 JS eval。

执行：
- 开始时间：2026-06-26 19:59:05
- 结束时间：2026-06-26 19:59:05
- 操作内容：
  - 修复 `src\zotero-plugin\bootstrap.js` 中 health endpoint 的硬编码版本文本。
  - 将插件 manifest、bootstrap 常量、测试期望和手工验收文档同步到 `0.1.14`。
- 测试结果：通过。
  - `npm run typecheck`：通过。
  - `npm run lint`：通过。
  - `npm run test -- tests/unit/zotero-plugin/pluginPackage.test.ts tests/unit/mcp-server/toolRegistry.test.ts`：通过，2 个测试文件、12 个测试通过。
  - `npm run test`：通过，17 个测试文件、60 个测试通过。
  - `npm run build`：通过。
  - `npm run build:zotero-plugin`：通过。
  - `tar -xOf dist\zotero-codex-bridge.xpi manifest.json`：版本为 `0.1.14`。
  - `tar -xOf dist\zotero-codex-bridge.xpi bootstrap.js | Select-String ...`：包内包含 `0.1.14`、`ZoteroCodexBridge.version`、`item.updateTags`、`addTag`、`removeTag` 和 `CONFIRMATION_REQUIRED`。
  - `rg "ZOTERO_API_KEY|api\.zotero\.org|zotero\.sqlite|sqlite write|任意 JS eval" src tests package.json README.md AGENTS.md docs TaskDocs -g '!node_modules/**' -g '!dist/**' -g '!ZoteroProfile/**' -g '!ZoteroVault/**' -g '!ZoteroData/**'`：仅命中文档中的禁止项、调查记录和验证命令，未命中源码实现或依赖配置。
- 备注：`0.1.14` 已生成，但尚未安装到 Zotero。下一步需要用户重装/重启后复测 health 返回 `0.1.14`；tag runtime 功能已在上一补测中通过。
- 运行时补测：
  - 开始时间：2026-06-26 20:01:10
  - 结束时间：2026-06-26 20:01:10
  - 操作内容：
    - 用户确认已安装 `0.1.14` 后，使用 PowerShell 调用 health endpoint。
    - health 返回 200，body 为 `zotero-codex-bridge ok 0.1.14 zotero-codex-bridge@example.com test`。
  - 测试结果：通过。
  - 备注：health 版本响应硬编码问题已修复。

### 步骤 10P - note.createChild runtime 接入

计划：
- 目标文件：
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\bootstrap.js`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\bootstrap.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\manifest.json`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\unit\zotero-plugin\pluginPackage.test.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\unit\mcp-server\toolRegistry.test.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\zotero-api-source-audit.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\integration\zoteroPluginDevelopmentInstall.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\integration\manualAcceptance.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\README.md`
- 符号变更：
  - `bootstrap.js` 新增 `note.createChild` runtime 分支。
  - 新增 `createChildNoteDryRun()`、`executeChildNoteCreate()`、`normalizeChildNoteCreateInput()`、`normalizeNoteContent()`。
  - 复用 `getLocalUserItem()`、`createWriteDryRunPlan()` 和 confirmation 校验。
  - 测试插件版本从 `0.1.14` 提升到 `0.1.15`。
- 预期行为：
  - `note.createChild` 必须先 dry-run，再带 confirmation execute。
  - 只允许在 local user regular item 下创建 child note。
  - `contentFormat: "text"` 转成安全 HTML note；`"html"` 和 `"rich-text"` 按传入 HTML/rich text 内容保存。
  - execute 返回 `noteKey`、parent `zoteroItemKey` 和 `contentFormat`。
- 测试命令：
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test -- tests/unit/zotero-plugin/pluginPackage.test.ts tests/unit/mcp-server/toolRegistry.test.ts`
  - `npm run test`
  - `npm run build`
  - `npm run build:zotero-plugin`
  - 展开 XPI 检查 `0.1.15` 和 `note.createChild`。
  - 安全边界 `rg` 搜索。
- 通过标准：
  - 全量测试、构建、类型检查、lint 和 XPI 打包通过。
  - `dist\zotero-codex-bridge.xpi` 版本为 `0.1.15`。
  - 不引入 Web API、SQLite 写入或任意 JS eval。

执行：
- 开始时间：2026-06-26 20:01:10
- 结束时间：2026-06-26 20:08:13
- 操作内容：
  - 扩展 `src\zotero-plugin\bootstrap.js`，接入 `note.createChild` 的 dry-run/execute runtime 分支。
  - 新增 child note 输入规范化、parent regular item 校验、`text` 内容转义为段落 HTML、`html`/`rich-text` 透传给 Zotero `setNote()`。
  - execute 通过 Zotero item 对象层 `new Zotero.Item("note")`、`parentKey`、`setNote()` 和 `saveTx()` 创建 child note。
  - 修订 `stripRuntimeFields()`，确保派生字段 `noteHtml` 不进入 confirmation input hash，只保留用户输入语义。
  - 更新 `docs\zotero-api-source-audit.md`，补充 `isRegularItem()`、`isNote()`、`getNote()`、`setNote()`、`getNotes()`、`parentKey` 和 `saveTx()` 的 Zotero 9.0.5 源码依据。
  - 更新 `tests\integration\zoteroPluginDevelopmentInstall.md`，补充 `note.createChild` dry-run 和 execute 的 PowerShell 验收命令。
  - 更新 `README.md`、`tests\integration\manualAcceptance.md`、插件 manifest 和测试期望版本到 `0.1.15`。
- 测试结果：通过。
  - `npm run typecheck`：通过。
  - `npm run lint`：通过。
  - `npm run test -- tests/unit/zotero-plugin/pluginPackage.test.ts tests/unit/mcp-server/toolRegistry.test.ts`：通过，2 个测试文件、12 个测试通过。
  - `npm run test`：通过，17 个测试文件、60 个测试通过。
  - `npm run build`：通过。
  - `npm run build:zotero-plugin`：通过。
  - `tar -xOf dist\zotero-codex-bridge.xpi manifest.json`：版本为 `0.1.15`。
  - `tar -xOf dist\zotero-codex-bridge.xpi bootstrap.js | Select-String ...`：包内包含 `0.1.15`、`note.createChild`、`new Zotero.Item("note")`、`setNote`、`noteHtmlPreview` 和 `CONFIRMATION_REQUIRED`。
  - `rg "ZOTERO_API_KEY|api\.zotero\.org|zotero\.sqlite|sqlite write|任意 JS eval" src tests package.json README.md AGENTS.md docs TaskDocs -g '!node_modules/**' -g '!dist/**' -g '!ZoteroProfile/**' -g '!ZoteroVault/**' -g '!ZoteroData/**'`：仅命中文档中的禁止项、调查记录和验证命令，未命中源码实现或依赖配置。
- 备注：`0.1.15` 已生成，但尚未安装到 Zotero。runtime 验收需要用户重装/重启 `0.1.15` 后，使用 Item A key `7N4QZKCM` 创建测试 child note。
  - 当前运行时探测：`Invoke-WebRequest .../health -UserAgent "ZoteroCodexBridge/0.1.15"` 返回 `zotero-codex-bridge ok 0.1.14 ...`，确认 Zotero 当前仍运行旧版插件，需要安装 `dist\zotero-codex-bridge.xpi` 后重启。
- 运行时补测：
  - 开始时间：2026-06-26 20:13:00
  - 结束时间：2026-06-26 20:13:02
  - 操作内容：
    - 用户确认已安装 `0.1.15` 后，使用 PowerShell 调用 health endpoint 和 `note.createChild`。
    - health 返回 200，body 为 `zotero-codex-bridge ok 0.1.15 zotero-codex-bridge@example.com test`。
    - `note.createChild` dry-run 返回 `ok: true`、`mode: dry-run`、`operation: note.createChild`、`parentZoteroItemKey: 7N4QZKCM`、`contentFormat: text`、`noteHtmlPreview: <p>Codex bridge child note runtime test 0.1.15</p>`。
    - 使用 dry-run 返回的 `planId` 和 `confirmationToken` execute 成功。
    - execute 返回 `ok: true`、parent item key `7N4QZKCM`、新 note key `GGQPGKYF`、`affected.zoteroItemKeys: 7N4QZKCM,GGQPGKYF`。
  - 测试结果：通过。
  - 备注：`note.createChild` 的 dry-run/confirmation/execute runtime 闭环通过；Zotero UI 中 child note 可见性仍可由用户手工复核。

### 步骤 10Q - attachment.getForItem runtime 接入

计划：
- 目标文件：
  - 新增 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\references\official\zotero\zotero-9.0.5-client\xpcom\attachments.js`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\bootstrap.js`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\bootstrap.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\manifest.json`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\unit\zotero-plugin\pluginPackage.test.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\unit\mcp-server\toolRegistry.test.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\zotero-api-source-audit.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\integration\zoteroPluginDevelopmentInstall.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\integration\manualAcceptance.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\README.md`
- 符号变更：
  - 下载 Zotero 9.0.5 tag 对应的官方 `attachments.js` 到本地 references。
  - `bootstrap.js` 新增 `attachment.getForItem` runtime 分支。
  - 新增 `readItemAttachments()`、`attachmentRecord()` 和 `attachmentModeName()`。
  - 测试插件版本从 `0.1.15` 提升到 `0.1.16`。
- 预期行为：
  - `attachment.getForItem` 是只读命令，不需要 dry-run 或 confirmation。
  - 只允许读取 local user regular item 下的 child attachments。
  - 返回每个 attachment 的 `attachmentKey`、title、filename、contentType、linkMode、attachmentMode 和可解析 file path。
- 测试命令：
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test -- tests/unit/zotero-plugin/pluginPackage.test.ts tests/unit/mcp-server/toolRegistry.test.ts`
  - `npm run test`
  - `npm run build`
  - `npm run build:zotero-plugin`
  - 展开 XPI 检查 `0.1.16` 和 `attachment.getForItem`。
  - 安全边界 `rg` 搜索。
- 通过标准：
  - 全量测试、构建、类型检查、lint 和 XPI 打包通过。
  - `dist\zotero-codex-bridge.xpi` 版本为 `0.1.16`。
  - 不引入 Web API、SQLite 写入或任意 JS eval。

执行：
- 开始时间：2026-06-26 22:19:07
- 结束时间：2026-06-26 22:21:52
- 操作内容：
  - 下载 Zotero 官方 GitHub `9.0.5` tag 的 `chrome/content/zotero/xpcom/attachments.js` 到 `references\official\zotero\zotero-9.0.5-client\xpcom\attachments.js`。
  - 更新 `docs\zotero-api-source-audit.md`，补充 `Zotero.Attachments` link mode、`getAttachments(false)`、`getFilePathAsync()`、`attachmentFilename`、`attachmentPath` 和自动重命名偏好相关源码依据。
  - 扩展 `src\zotero-plugin\bootstrap.js`，接入 `attachment.getForItem` 只读 runtime 分支。
  - 新增 `readItemAttachments()`、`attachmentRecord()` 和 `attachmentModeName()`，返回 attachment key、title、filename、contentType、linkMode、attachmentMode 和可解析 file path。
  - 更新 `README.md`、`tests\integration\zoteroPluginDevelopmentInstall.md`、`tests\integration\manualAcceptance.md`、插件 manifest 和测试期望版本到 `0.1.16`。
- 测试结果：通过。
  - `npm run typecheck`：通过。
  - `npm run lint`：通过。
  - `npm run test -- tests/unit/zotero-plugin/pluginPackage.test.ts tests/unit/mcp-server/toolRegistry.test.ts`：通过，2 个测试文件、12 个测试通过。
  - `npm run test`：通过，17 个测试文件、60 个测试通过。
  - `npm run build`：通过。
  - `npm run build:zotero-plugin`：通过。
  - `tar -xOf dist\zotero-codex-bridge.xpi manifest.json`：版本为 `0.1.16`。
  - `tar -xOf dist\zotero-codex-bridge.xpi bootstrap.js | Select-String ...`：包内包含 `0.1.16`、`attachment.getForItem`、`getAttachments(false)`、`getFilePathAsync`、`attachmentModeName`、`note.createChild` 和 `CONFIRMATION_REQUIRED`。
  - `rg "ZOTERO_API_KEY|api\.zotero\.org|zotero\.sqlite|sqlite write|任意 JS eval" src tests package.json README.md AGENTS.md docs TaskDocs -g '!node_modules/**' -g '!dist/**' -g '!ZoteroProfile/**' -g '!ZoteroVault/**' -g '!ZoteroData/**'`：仅命中文档中的禁止项、调查记录和验证命令，未命中源码实现或依赖配置。
- 备注：`0.1.16` 已生成，但尚未安装到 Zotero。runtime 验收需要用户重装/重启 `0.1.16` 后，使用 Item A key `7N4QZKCM` 读取附件列表。
  - 当前运行时探测：`Invoke-WebRequest .../health -UserAgent "ZoteroCodexBridge/0.1.16"` 返回 `zotero-codex-bridge ok 0.1.15 ...`，确认 Zotero 当前仍运行旧版插件，需要安装 `dist\zotero-codex-bridge.xpi` 后重启。
- 运行时补测：
  - 开始时间：2026-06-26 22:28:00
  - 结束时间：2026-06-26 22:28:01
  - 操作内容：
    - 用户确认已安装 `0.1.16` 后，使用 PowerShell 调用 health endpoint 和 `attachment.getForItem`。
    - health 返回 200，body 为 `zotero-codex-bridge ok 0.1.16 zotero-codex-bridge@example.com test`。
    - `attachment.getForItem` 返回 `ok: true`、`commandName: attachment.getForItem`、`data.zoteroItemKey: 7N4QZKCM`。
    - 当前 Item A 暂无附件，`data.attachments` 返回空数组，`AttachmentCount: 0`。
  - 测试结果：通过。
  - 备注：`attachment.getForItem` 的只读 runtime 闭环通过。

### 步骤 10R - attachment.addFile runtime 接入

计划：
- 目标文件：
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\bootstrap.js`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\bootstrap.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\manifest.json`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\unit\zotero-plugin\pluginPackage.test.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\unit\mcp-server\toolRegistry.test.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\zotero-api-source-audit.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\integration\zoteroPluginDevelopmentInstall.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\integration\manualAcceptance.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\README.md`
- 符号变更：
  - `bootstrap.js` 新增 `attachment.addFile` runtime 分支。
  - 新增 `createAttachmentAddFileDryRun()`、`executeAttachmentAddFile()`、`normalizeAttachmentAddFileInput()`、`validateAttachmentExtension()`、`findDuplicateAttachments()`。
  - 复制模式调用 `Zotero.Attachments.importFromFile()`；linked 模式调用 `Zotero.Attachments.linkFromFile()`。
  - 测试插件版本从 `0.1.16` 提升到 `0.1.17`。
- 预期行为：
  - `attachment.addFile` 必须先 dry-run，再带 confirmation execute。
  - 默认 `attachmentMode` 为 `copy`，可显式传入 `linked`。
  - 支持第一版允许的 pdf、doc/docx、csv、xls/xlsx、图片和 html/html-like 文件。
  - 同名或同路径重复时默认 skip 并报告，不执行 replace。
  - linked file dry-run 必须返回路径失效风险 warning。
- 测试命令：
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test -- tests/unit/zotero-plugin/pluginPackage.test.ts tests/unit/mcp-server/toolRegistry.test.ts`
  - `npm run test`
  - `npm run build`
  - `npm run build:zotero-plugin`
  - 展开 XPI 检查 `0.1.17` 和 `attachment.addFile`。
  - 安全边界 `rg` 搜索。
- 通过标准：
  - 全量测试、构建、类型检查、lint 和 XPI 打包通过。
  - `dist\zotero-codex-bridge.xpi` 版本为 `0.1.17`。
  - 不引入 Web API、SQLite 写入或任意 JS eval。

执行：
- 开始时间：2026-06-26 22:28:01
- 结束时间：2026-06-26 22:30:30
- 操作内容：
  - 扩展 `src\zotero-plugin\bootstrap.js`，接入 `attachment.addFile` 的 dry-run/execute runtime 分支。
  - 新增附件添加输入规范化、parent regular item 校验、文件存在检查、允许扩展名校验、重复附件检测和 linked file 风险 warning。
  - copy 模式 execute 调用 Zotero 官方 `Zotero.Attachments.importFromFile()`。
  - linked 模式 execute 调用 Zotero 官方 `Zotero.Attachments.linkFromFile()`。
  - 重复同名或同 linked path 时 execute 默认 skip，不执行 replace。
  - 更新 `docs\zotero-api-source-audit.md`，补充 `importFromFile()`、`linkFromFile()`、`attachmentPath`、base directory relative path 相关源码依据。
  - 更新 `README.md`、`tests\integration\zoteroPluginDevelopmentInstall.md`、`tests\integration\manualAcceptance.md`、插件 manifest 和测试期望版本到 `0.1.17`。
- 测试结果：通过。
  - `npm run typecheck`：通过。
  - `npm run lint`：通过。
  - `npm run test -- tests/unit/zotero-plugin/pluginPackage.test.ts tests/unit/mcp-server/toolRegistry.test.ts`：通过，2 个测试文件、12 个测试通过。
  - `npm run test`：通过，17 个测试文件、60 个测试通过。
  - `npm run build`：通过。
  - `npm run build:zotero-plugin`：通过。
  - `tar -xOf dist\zotero-codex-bridge.xpi manifest.json`：版本为 `0.1.17`。
  - `tar -xOf dist\zotero-codex-bridge.xpi bootstrap.js | Select-String ...`：包内包含 `0.1.17`、`attachment.addFile`、`importFromFile`、`linkFromFile`、`ATTACHMENT_DUPLICATE_SKIPPED`、`LINKED_FILE_PATH_RISK` 和 `CONFIRMATION_REQUIRED`。
  - `rg "ZOTERO_API_KEY|api\.zotero\.org|zotero\.sqlite|sqlite write|任意 JS eval" src tests package.json README.md AGENTS.md docs TaskDocs -g '!node_modules/**' -g '!dist/**' -g '!ZoteroProfile/**' -g '!ZoteroVault/**' -g '!ZoteroData/**'`：仅命中文档中的禁止项、调查记录和验证命令，未命中源码实现或依赖配置。
- 备注：`0.1.17` 已生成，但尚未安装到 Zotero。runtime 验收需要用户重装/重启 `0.1.17` 后，用 `tests\fixtures\attachments\sample-paper.pdf` 给 Item A 添加 copy 附件。
  - 当前运行时探测：`Invoke-WebRequest .../health -UserAgent "ZoteroCodexBridge/0.1.17"` 返回 `zotero-codex-bridge ok 0.1.16 ...`，确认 Zotero 当前仍运行旧版插件，需要安装 `dist\zotero-codex-bridge.xpi` 后重启。
- 运行时补测：
  - 开始时间：2026-06-26 22:36:00
  - 结束时间：2026-06-26 22:36:30
  - 操作内容：
    - 用户确认已安装 `0.1.17` 后，使用 PowerShell 调用 health endpoint、`attachment.addFile` 和 `attachment.getForItem`。
    - health 返回 200，body 为 `zotero-codex-bridge ok 0.1.17 zotero-codex-bridge@example.com test`。
    - `attachment.addFile` copy dry-run 返回 `ok: true`、`mode: dry-run`、`operation: attachment.addFile`、`action: add`，无 warning。
    - 使用 dry-run 返回的 `planId` 和 `confirmationToken` execute 成功。
    - execute 返回 `ok: true`、`skipped: false`、attachment key `FQ8474SV`、`attachmentMode: copy`、`filename: sample-paper.pdf`。
    - `attachment.getForItem` 复核 Item A 附件数为 1，附件 `FQ8474SV` 的 title 为 `PDF`、contentType 为 `application/pdf`、linkMode 为 `0`、filePath 为 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\ZoteroData\storage\FQ8474SV\sample-paper.pdf`。
    - 重复添加同一 fixture 的 dry-run 返回 `action: skip`、warning `ATTACHMENT_DUPLICATE_SKIPPED`、resolved attachment key `FQ8474SV`。
    - 重复添加 execute 返回 `skipped: true`、`reason: duplicate`，附件数量仍为 1。
  - 测试结果：通过。
- 备注：`attachment.addFile` copy 模式和重复 skip 行为 runtime 闭环通过；linked 模式后续可单独补测。

### 步骤 10S - attachment.moveToItem runtime 接入

计划：
- 目标文件：
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\bootstrap.js`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\bootstrap.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\manifest.json`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\unit\zotero-plugin\pluginPackage.test.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\unit\mcp-server\toolRegistry.test.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\zotero-api-source-audit.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\integration\zoteroPluginDevelopmentInstall.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\integration\manualAcceptance.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\README.md`
- 符号变更：
  - `bootstrap.js` 新增 `attachment.moveToItem` runtime 分支。
  - 新增 `createAttachmentMoveDryRun()`、`executeAttachmentMoveToItem()`、`normalizeAttachmentMoveInput()`、`normalizeAttachmentTarget()`。
  - execute 通过 attachment item 的 `parentKey` + `saveTx()` 移动 parent item。
  - 测试插件版本从 `0.1.17` 提升到 `0.1.18`。
- 预期行为：
  - `attachment.moveToItem` 必须先 dry-run，再带 confirmation execute。
  - 只允许移动 local user library 中的 attachment。
  - target item 必须是 regular item。
  - 移动不删除 attachment 文件，不创建新 attachment。
  - attachment 已在目标 item 下时 execute 跳过并报告 `skipped: true`。
- 测试命令：
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test -- tests/unit/zotero-plugin/pluginPackage.test.ts tests/unit/mcp-server/toolRegistry.test.ts`
  - `npm run test`
  - `npm run build`
  - `npm run build:zotero-plugin`
  - 展开 XPI 检查 `0.1.18` 和 `attachment.moveToItem`。
  - 安全边界 `rg` 搜索。
- 通过标准：
  - 全量测试、构建、类型检查、lint 和 XPI 打包通过。
  - `dist\zotero-codex-bridge.xpi` 版本为 `0.1.18`。
  - 不引入 Web API、SQLite 写入或任意 JS eval。

执行：
- 开始时间：2026-06-26 22:36:30
- 结束时间：2026-06-26 22:37:05
- 操作内容：
  - 扩展 `src\zotero-plugin\bootstrap.js`，接入 `attachment.moveToItem` 的 dry-run/execute runtime 分支。
  - 新增 attachment key 解析、target regular item 校验、child attachment parent 校验。
  - execute 通过 attachment item 对象层 `parentKey` + `saveTx()` 移动 parent item，不删除附件文件，不新建附件。
  - attachment 已经在目标 parent 下时 execute 返回 `skipped: true`。
  - 更新 `docs\zotero-api-source-audit.md`，补充 `parentKey`、attachment parent 保存和 cache 清理相关源码依据。
  - 更新 `README.md`、`tests\integration\zoteroPluginDevelopmentInstall.md`、`tests\integration\manualAcceptance.md`、插件 manifest 和测试期望版本到 `0.1.18`。
- 测试结果：通过。
  - `npm run typecheck`：通过。
  - `npm run lint`：通过。
  - `npm run test -- tests/unit/zotero-plugin/pluginPackage.test.ts tests/unit/mcp-server/toolRegistry.test.ts`：通过，2 个测试文件、12 个测试通过。
  - `npm run test`：通过，17 个测试文件、60 个测试通过。
  - `npm run build`：通过。
  - `npm run build:zotero-plugin`：通过。
  - `tar -xOf dist\zotero-codex-bridge.xpi manifest.json`：版本为 `0.1.18`。
  - `tar -xOf dist\zotero-codex-bridge.xpi bootstrap.js | Select-String ...`：包内包含 `0.1.18`、`attachment.moveToItem`、`parentKey = normalized.targetZoteroItemKey`、`already-target-parent`、`ATTACHMENT_NOT_FOUND` 和 `CONFIRMATION_REQUIRED`。
  - `rg "ZOTERO_API_KEY|api\.zotero\.org|zotero\.sqlite|sqlite write|任意 JS eval" src tests package.json README.md AGENTS.md docs TaskDocs -g '!node_modules/**' -g '!dist/**' -g '!ZoteroProfile/**' -g '!ZoteroVault/**' -g '!ZoteroData/**'`：仅命中文档中的禁止项、调查记录和验证命令，未命中源码实现或依赖配置。
- 备注：`0.1.18` 已生成，但尚未安装到 Zotero。runtime 验收需要用户重装/重启 `0.1.18` 后，将附件 `FQ8474SV` 从 Item A `7N4QZKCM` 移动到 Item B `K7P8J5XF`。
  - 当前运行时探测：`Invoke-WebRequest .../health -UserAgent "ZoteroCodexBridge/0.1.18"` 返回 `zotero-codex-bridge ok 0.1.17 ...`，确认 Zotero 当前仍运行旧版插件，需要安装 `dist\zotero-codex-bridge.xpi` 后重启。
- 运行时补测：
  - 开始时间：2026-06-26 22:43:00
  - 结束时间：2026-06-26 22:43:20
  - 操作内容：
    - 用户确认已安装 `0.1.18` 后，使用 PowerShell 调用 health endpoint、`attachment.moveToItem` 和 `attachment.getForItem`。
    - health 返回 200，body 为 `zotero-codex-bridge ok 0.1.18 zotero-codex-bridge@example.com test`。
    - `attachment.moveToItem` dry-run 返回 `ok: true`、`operation: attachment.moveToItem`、before parent `7N4QZKCM`、after parent `K7P8J5XF`、`action: move`。
    - 使用 dry-run 返回的 `planId` 和 `confirmationToken` execute 成功，返回 `skipped: false`、attachment key `FQ8474SV`、previous parent `7N4QZKCM`、target parent `K7P8J5XF`。
    - `attachment.getForItem` 复核 Item A 附件数为 0；Item B 附件数为 1，包含 `FQ8474SV`。
    - 再次 move 到 Item B 的 dry-run 返回 `action: skip`；execute 返回 `skipped: true`、`reason: already-target-parent`。
  - 测试结果：通过。
  - 备注：`attachment.moveToItem` runtime 移动和已在目标 parent 下的 skip 行为通过。

### 步骤 10T - attachment.rename runtime 接入

计划：
- 目标文件：
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\bootstrap.js`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\bootstrap.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\manifest.json`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\unit\zotero-plugin\pluginPackage.test.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\unit\mcp-server\toolRegistry.test.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\zotero-api-source-audit.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\integration\zoteroPluginDevelopmentInstall.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\integration\manualAcceptance.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\README.md`
- 符号变更：
  - `bootstrap.js` 新增 `attachment.rename` runtime 分支。
  - 新增 `createAttachmentRenameDryRun()`、`executeAttachmentRename()`、`normalizeAttachmentRenameInput()`、`makeAttachmentRenameFilename()`。
  - 标题重命名通过 attachment item 对象层 `setField("title", ...)` + `saveTx()` 实现。
  - 文件名同步通过 Zotero 官方 `attachment.renameAttachmentFile(newName, { overwrite: false, unique: true, updateTitle: false, out })` 实现，第一版不覆盖既有文件。
  - 测试插件版本从 `0.1.18` 提升到 `0.1.19`。
- 预期行为：
  - `attachment.rename` 必须先 dry-run，再带 confirmation execute。
  - `title` 必须是非空字符串。
  - 默认只重命名 Zotero attachment 标题；`renameFile: true` 时按当前扩展名同步文件名。
  - 文件名同步使用 Zotero 内部文件重命名 API，允许 unique 自动避让同名文件，不执行 overwrite。
  - title 和目标 filename 都未变化时 execute 返回 `skipped: true`。
- 测试命令：
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test -- tests/unit/zotero-plugin/pluginPackage.test.ts tests/unit/mcp-server/toolRegistry.test.ts`
  - `npm run test`
  - `npm run build`
  - `npm run build:zotero-plugin`
  - 展开 XPI 检查 `0.1.19`、`attachment.rename`、`renameAttachmentFile` 和 `setField("title"`。
  - 安全边界 `rg` 搜索。
- 通过标准：
  - 全量测试、构建、类型检查、lint 和 XPI 打包通过。
  - `dist\zotero-codex-bridge.xpi` 版本为 `0.1.19`。
  - 不引入 Web API、SQLite 写入或任意 JS eval。

执行：
- 开始时间：2026-06-26 22:44:30
- 结束时间：2026-06-26 22:47:48
- 操作内容：
  - 扩展 `src\zotero-plugin\bootstrap.js`，接入 `attachment.rename` 的 dry-run/execute runtime 分支。
  - 新增 attachment rename 输入规范化、标题非空校验、`renameFile` boolean 校验、当前 title/filename/filePath 读取和 no-change skip 判断。
  - 标题重命名通过 `attachment.setField("title", normalized.title)` + `saveTx()` 实现。
  - `renameFile: true` 时通过 Zotero 官方 `renameAttachmentFile(targetFilename, { overwrite: false, unique: true, updateTitle: false, out })` 同步文件名，不执行 overwrite。
  - 更新 `docs\zotero-api-source-audit.md`，补充 `renameAttachmentFile()`、`relinkAttachmentFile()`、`attachmentFilename` 和 `setAutoAttachmentTitle()` 源码依据。
  - 更新 `README.md`、`tests\integration\zoteroPluginDevelopmentInstall.md`、`tests\integration\manualAcceptance.md`、插件 manifest 和测试期望版本到 `0.1.19`。
- 测试结果：通过。
  - `npm run typecheck`：通过。
  - `npm run lint`：首次失败于 fallback 文件名过滤正则 `no-control-regex`，移除 fallback 正则中的控制字符范围后重跑通过。
  - `npm run test -- tests/unit/zotero-plugin/pluginPackage.test.ts tests/unit/mcp-server/toolRegistry.test.ts`：通过，2 个测试文件、12 个测试通过。
  - `npm run test`：通过，17 个测试文件、60 个测试通过。
  - `npm run build`：通过。
  - `npm run build:zotero-plugin`：通过。
  - `tar -xOf dist\zotero-codex-bridge.xpi manifest.json`：版本为 `0.1.19`。
  - `tar -xOf dist\zotero-codex-bridge.xpi bootstrap.js | Select-String ...`：包内包含 `0.1.19`、`attachment.rename`、`renameAttachmentFile`、`setField("title"` 和 `CONFIRMATION_REQUIRED`。
  - `rg "ZOTERO_API_KEY|api\.zotero\.org|zotero\.sqlite|sqlite write|任意 JS eval" src tests package.json README.md AGENTS.md docs TaskDocs -g '!node_modules/**' -g '!dist/**' -g '!ZoteroProfile/**' -g '!ZoteroVault/**' -g '!ZoteroData/**'`：仅命中文档中的禁止项、调查记录和验证命令，未命中源码实现或依赖配置。
- 备注：`0.1.19` 已生成，但尚未安装到 Zotero。当前运行时探测：`Invoke-WebRequest .../health -UserAgent "ZoteroCodexBridge/0.1.19"` 返回 `zotero-codex-bridge ok 0.1.18 ...`，确认 Zotero 当前仍运行旧版插件。runtime 验收需要用户安装 `dist\zotero-codex-bridge.xpi` 并重启 Zotero 后继续；验收优先使用既有 attachment `FQ8474SV`，先验证标题重命名，文件名同步后续可单独补测。

### 步骤 10U - 批量接入附件自动重命名与重命名偏好 runtime

计划：
- 目标文件：
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\bootstrap.js`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\bootstrap.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\manifest.json`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\commands\attachmentPreferenceCommands.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\unit\zotero-plugin\pluginPackage.test.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\unit\mcp-server\toolRegistry.test.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\zotero-api-source-audit.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\integration\zoteroPluginDevelopmentInstall.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\integration\manualAcceptance.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\README.md`
- 符号变更：
  - `bootstrap.js` 新增 `attachment.runZoteroRename` runtime 分支。
  - `bootstrap.js` 新增 `attachment.renamePreferences.get` runtime 分支。
  - `bootstrap.js` 新增 `attachment.renamePreferences.set` runtime dry-run/execute 分支。
  - 新增 `createAttachmentRunZoteroRenameDryRun()`、`executeAttachmentRunZoteroRename()`、`normalizeAttachmentRunZoteroRenameInput()`、`makeZoteroAutoRenameFilename()`。
  - 新增 `readAttachmentRenamePreferences()`、`createAttachmentRenamePreferencesSetDryRun()`、`executeAttachmentRenamePreferencesSet()`、`normalizeAttachmentRenamePreferencesSetInput()`。
  - 测试插件版本从 `0.1.19` 提升到 `0.1.20`，一次安装覆盖 `attachment.rename`、`attachment.runZoteroRename` 和重命名偏好读写。
- 预期行为：
  - `attachment.runZoteroRename` 必须先 dry-run，再带 confirmation execute。
  - `attachment.runZoteroRename` 完全遵循 Zotero 当前 `autoRenameFiles`、linked file 和 file type 偏好；偏好不允许时返回 skip。
  - 自动重命名使用 Zotero 内置 `shouldAutoRenameAttachment()`、`getFileBaseNameFromItem()` 和 `renameAttachmentFile()`，不直接移动文件或写 SQLite。
  - `attachment.renamePreferences.get` 返回 local user library 的自动重命名相关偏好。
  - `attachment.renamePreferences.set` 必须 dry-run + confirmation，支持修改 `autoRenameFiles`、`autoRenameLinkedFiles`、`autoRenameFileTypes` 和 `attachmentRenameTemplate`。
- 测试命令：
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test -- tests/unit/zotero-plugin/pluginPackage.test.ts tests/unit/mcp-server/toolRegistry.test.ts`
  - `npm run test`
  - `npm run build`
  - `npm run build:zotero-plugin`
  - 展开 XPI 检查 `0.1.20`、`attachment.runZoteroRename`、`attachment.renamePreferences.get`、`attachment.renamePreferences.set`、`shouldAutoRenameAttachment`、`getFileBaseNameFromItem` 和 `renameAttachmentFile`。
  - 安全边界 `rg` 搜索。
- 通过标准：
  - 全量测试、构建、类型检查、lint 和 XPI 打包通过。
  - `dist\zotero-codex-bridge.xpi` 版本为 `0.1.20`。
  - 不引入 Web API、SQLite 写入或任意 JS eval。

执行：
- 开始时间：2026-06-26 23:24:39
- 结束时间：2026-06-26 23:26:01
- 操作内容：
  - 扩展 `src\zotero-plugin\bootstrap.js`，接入 `attachment.runZoteroRename`、`attachment.renamePreferences.get` 和 `attachment.renamePreferences.set` runtime 分支。
  - 补齐 confirmation input hash 的 runtime 字段剥离，避免 `allowed`、`renamePreferencesSnapshot`、`newPreferences` 等运行时状态进入 dry-run/execute 匹配。
  - 更新插件版本、TypeScript 偏好类型、插件包测试、MCP health 测试、README、手工验收清单和安装验收脚本到 `0.1.20`。
  - 更新 `docs\zotero-api-source-audit.md`，记录 Zotero 内置自动重命名和附件重命名偏好读写的源码依据。
- 测试结果：通过。
  - `npm run typecheck`：通过。
  - `npm run lint`：通过。
  - `npm run test -- tests/unit/zotero-plugin/pluginPackage.test.ts tests/unit/mcp-server/toolRegistry.test.ts tests/unit/zotero-plugin/attachmentCommands.test.ts`：通过，3 个测试文件、18 个测试通过。
  - `npm run test`：通过，17 个测试文件、60 个测试通过。
  - `npm run build`：通过。
  - `npm run build:zotero-plugin`：通过。
  - `tar -xOf dist\zotero-codex-bridge.xpi manifest.json`：版本为 `0.1.20`。
  - `tar -xOf dist\zotero-codex-bridge.xpi bootstrap.js | Select-String ...`：包内包含 `0.1.20`、`attachment.runZoteroRename`、`attachment.renamePreferences.get`、`attachment.renamePreferences.set`、`shouldAutoRenameAttachment`、`getFileBaseNameFromItem`、`renameAttachmentFile`、`Zotero.Prefs.set`、`Zotero.SyncedSettings.set` 和 `CONFIRMATION_REQUIRED`。
  - `rg "ZOTERO_API_KEY|api\.zotero\.org|zotero\.sqlite|sqlite write|任意 JS eval" src tests package.json README.md AGENTS.md docs TaskDocs -g '!node_modules/**' -g '!dist/**' -g '!ZoteroProfile/**' -g '!ZoteroVault/**' -g '!ZoteroData/**'`：仅命中文档中的禁止项、调查记录和验证命令，未命中源码实现或依赖配置。
- 备注：`0.1.20` 已生成到 `dist\zotero-codex-bridge.xpi`，但尚未安装到 Zotero。当前运行时探测：`Invoke-WebRequest .../health -UserAgent "ZoteroCodexBridge/0.1.20"` 返回 `zotero-codex-bridge ok 0.1.18 ...`，确认 Zotero 当前仍运行旧版插件。下一步需要用户安装新版 XPI 并重启 Zotero 后，集中验收附件 title rename、`renameFile: true`、Zotero 内置自动重命名和偏好读写。
  - 运行时补测：
    - 开始时间：2026-06-26 23:32:00
    - 结束时间：2026-06-26 23:39:03
    - 操作内容：
      - 用户确认已安装 `0.1.20` 后，health endpoint 返回 `zotero-codex-bridge ok 0.1.20 zotero-codex-bridge@example.com test`。
      - `attachment.rename` title-only dry-run 返回 after title `Codex Bridge Runtime PDF 0.1.20`、filename `sample-paper.pdf`、action `rename`；execute 成功，`skipped: false`。
      - `attachment.rename` with `renameFile: true` dry-run 返回 target filename `Codex Bridge Runtime PDF File Rename 0.1.20.pdf`；execute 成功，`fileRenameResult: true`，stored file 更新到 `ZoteroData\storage\FQ8474SV\Codex Bridge Runtime PDF File Rename 0.1.20.pdf`。
      - `attachment.renamePreferences.get` 返回 `autoRenameFiles: true`、`autoRenameLinkedFiles: false`、`autoRenameFileTypes: application/pdf,application/epub+zip`。
      - `attachment.renamePreferences.set` dry-run/execute 成功，把 `autoRenameFileTypes` 更新为 `application/pdf,text/html,image/`。
      - `attachment.runZoteroRename` dry-run 返回 target filename `Zotero Codex Bridge Test Item B.pdf`、action `rename`；execute 成功，`fileRenameResult: true`，stored file 更新到 `ZoteroData\storage\FQ8474SV\Zotero Codex Bridge Test Item B.pdf`。
      - `attachment.getForItem` 复核 Item B 当前包含 attachment `FQ8474SV`，title 为 `Codex Bridge Runtime PDF File Rename 0.1.20`，filename 为 `Zotero Codex Bridge Test Item B.pdf`。
      - 缺少 confirmation 的 `attachment.runZoteroRename` execute 返回 HTTP 400 + `CONFIRMATION_REQUIRED`。
      - 缺少 confirmation 的 `attachment.renamePreferences.set` execute 返回 HTTP 400 + `CONFIRMATION_REQUIRED`。
    - 测试结果：通过。
    - 备注：`0.1.20` runtime 集中验收通过。当前偏好 `autoRenameFileTypes` 已在测试 profile 中被设置为 `application/pdf,text/html,image/`。

### 步骤 10V - direct HTTP 插件审计日志与 audit.list runtime 接入

计划：
- 目标文件：
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\bootstrap.js`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\bootstrap.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\manifest.json`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\scripts\buildZoteroPlugin.mjs`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\unit\zotero-plugin\pluginPackage.test.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\unit\mcp-server\toolRegistry.test.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\README.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\integration\zoteroPluginDevelopmentInstall.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\integration\manualAcceptance.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\TaskDocs\任务总览.md`
- 符号变更：
  - `bootstrap.js` 新增 `projectRoot` 打包注入占位符，用于把 audit JSONL 写入本项目 `logs\audit\`。
  - `bootstrap.js` 新增 `schedulePluginAudit()`、`writePluginAuditEvent()`、`readAuditList()`、`auditFilePathForDate()`、`isWriteCommandName()`。
  - `jsonCommandResponse()` 在 direct HTTP 写命令 dry-run、execute 成功、execute 失败时异步写入项目 audit JSONL。
  - `registerCommandEndpoint()` 新增 `audit.list` runtime 分支，读取项目内最近 audit 记录。
  - 测试插件版本从 `0.1.20` 提升到 `0.1.21`。
- 预期行为：
  - 通过 Zotero 插件 HTTP endpoint 直接执行的写命令也会写入本项目 `logs\audit\YYYY-MM-DD.jsonl`。
  - audit 事件包含 `requestId`、`planId`、`commandName`、`status`、timestamp、affected、before、after 或 error。
  - `audit.list` 是只读命令，不需要 dry-run 或 confirmation，支持 `limit`，默认返回最近 20 条。
  - audit 路径不在 Zotero profile、Zotero data directory、linked attachment root 或附件目录内。
- 测试命令：
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test -- tests/unit/zotero-plugin/pluginPackage.test.ts tests/unit/mcp-server/toolRegistry.test.ts`
  - `npm run test`
  - `npm run build`
  - `npm run build:zotero-plugin`
  - 展开 XPI 检查 `0.1.21`、`audit.list`、`logs`、`audit`、`Zotero.File.putContentsAsync`、`Zotero.File.getContentsAsync`、`Zotero.File.createDirectoryIfMissingAsync`、项目根目录占位符已被替换。
  - 安全边界 `rg` 搜索。
- 通过标准：
  - 全量测试、构建、类型检查、lint 和 XPI 打包通过。
  - `dist\zotero-codex-bridge.xpi` 版本为 `0.1.21`。
  - 包内不残留 `__ZOTERO_CODEX_BRIDGE_PROJECT_ROOT__`。
  - 不引入 Web API、SQLite 写入或任意 JS eval。

执行：
- 开始时间：2026-06-26 23:40:00
- 结束时间：2026-06-26 23:44:40
- 操作内容：
  - 将插件测试版本提升到 `0.1.21`。
  - 更新 `scripts\buildZoteroPlugin.mjs`，在打包时把项目根目录注入到 `bootstrap.js`，使插件 direct HTTP 路径能把审计 JSONL 写入本项目 `logs\audit\`。
  - 扩展 `src\zotero-plugin\bootstrap.js`，新增 direct HTTP 写命令的 `schedulePluginAudit()`、`writePluginAuditEvent()`、`readAuditList()` 等审计辅助函数。
  - `jsonCommandResponse()` 对写命令的 dry-run、execute 成功和失败响应异步写入 audit 事件。
  - `registerCommandEndpoint()` 新增只读 `audit.list` runtime 分支。
  - 更新 README、手工验收清单和安装验收文档，补充 `audit.list` 与 direct HTTP audit 验收步骤。
- 测试结果：通过。
  - `npm run typecheck`：通过。
  - `npm run lint`：通过。
  - `npm run test -- tests/unit/zotero-plugin/pluginPackage.test.ts tests/unit/mcp-server/toolRegistry.test.ts`：通过，2 个测试文件、12 个测试通过。
  - `npm run test`：通过，17 个测试文件、60 个测试通过。
  - `npm run build`：通过。
  - `npm run build:zotero-plugin`：通过。
  - `tar -xOf dist\zotero-codex-bridge.xpi manifest.json`：版本为 `0.1.21`。
  - `tar -xOf dist\zotero-codex-bridge.xpi bootstrap.js | Select-String ...`：包内包含 `0.1.21`、`audit.list`、`logs`、`audit`、`Zotero.File.putContentsAsync`、`Zotero.File.getContentsAsync`、`Zotero.File.createDirectoryIfMissingAsync` 和注入后的 `H:\\ProgramDocument\\MixLanguage\\Zotero-codex-bridge`，未残留 `__ZOTERO_CODEX_BRIDGE_PROJECT_ROOT__`。
  - `rg "ZOTERO_API_KEY|api\.zotero\.org|zotero\.sqlite|sqlite write|任意 JS eval" src tests package.json README.md AGENTS.md docs TaskDocs -g '!node_modules/**' -g '!dist/**' -g '!ZoteroProfile/**' -g '!ZoteroVault/**' -g '!ZoteroData/**'`：仅命中文档中的禁止项、调查记录和验证命令，未命中源码实现或依赖配置。
- 备注：`0.1.21` 已生成到 `dist\zotero-codex-bridge.xpi`，但尚未安装到 Zotero。当前运行时探测：`Invoke-WebRequest .../health -UserAgent "ZoteroCodexBridge/0.1.21"` 返回 `zotero-codex-bridge ok 0.1.20 ...`，确认 Zotero 当前仍运行旧版插件。下一步需要用户安装新版 XPI 并重启 Zotero 后，用低风险 dry-run 和 `audit.list` 验证 direct HTTP audit 写入。
  - 运行时补测：
    - 开始时间：2026-06-26 23:52:00
    - 结束时间：2026-06-26 23:55:24
    - 操作内容：
      - 用户确认已安装 `0.1.21` 后，health endpoint 返回 `zotero-codex-bridge ok 0.1.21 zotero-codex-bridge@example.com test`。
      - 使用低风险 no-op `attachment.rename` dry-run 触发 direct HTTP audit，返回 `mode: dry-run`、operation `attachment.rename`、planId `plan_mqv40cle_b2i1j8ffd1i`。
      - `audit.list` 返回 `ok: true`，`filePath` 为 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\logs\audit\2026-06-26.jsonl`，且该文件存在。
      - JSONL tail 包含 `req_1021_audit_dry` dry-run 审计记录，记录了 attachment file path、before 和 after。
      - 继续补测 no-op execute 与缺 confirmation 失败路径：execute 写入 `status: executed`，缺 confirmation 写入 `status: failed` 和 `CONFIRMATION_REQUIRED`。
    - 测试结果：部分通过。
    - 备注：`0.1.21` 的 direct HTTP audit 写入、`audit.list` 读取、dry-run/failed 状态均通过；但 execute 审计记录缺少对应 dry-run `planId`，不符合本步骤“audit 事件包含 planId”的通过标准，因此修订为 `0.1.22`。
  - 修订后计划：
    - 测试插件版本从 `0.1.21` 提升到 `0.1.22`。
    - `jsonCommandResponse()` 增加仅供 audit 使用的 `auditPlanId` 参数，不进入 HTTP response body。
    - 所有写命令 execute 分支将 `payload.confirmation.planId` 传给 audit 层。
    - `schedulePluginAudit()` 优先使用 execute 分支传入的 `auditPlanId`，dry-run 仍使用 `data.plan.planId`。
  - 修订后自动验证：
    - `npm run typecheck`：通过。
    - `npm run lint`：通过。
    - `npm run test -- tests/unit/zotero-plugin/pluginPackage.test.ts tests/unit/mcp-server/toolRegistry.test.ts`：通过，2 个测试文件、12 个测试通过。
    - `npm run test`：首次与 `npm run build:zotero-plugin` 并行运行时失败，原因是两个命令同时操作 `dist\zotero-codex-bridge.xpi`；顺序重跑后通过，17 个测试文件、60 个测试通过。
    - `npm run build`：通过。
    - `npm run build:zotero-plugin`：通过。
    - `tar -xOf dist\zotero-codex-bridge.xpi manifest.json`：版本为 `0.1.22`。
    - `tar -xOf dist\zotero-codex-bridge.xpi bootstrap.js | Select-String ...`：包内包含 `0.1.22`、`audit.list`、`planId: auditPlanId`、多个 `payload.confirmation.planId` 和注入后的项目根目录，未残留项目根占位符。
    - `rg "ZOTERO_API_KEY|api\.zotero\.org|zotero\.sqlite|sqlite write|任意 JS eval" src tests package.json README.md AGENTS.md docs TaskDocs -g '!node_modules/**' -g '!dist/**' -g '!ZoteroProfile/**' -g '!ZoteroVault/**' -g '!ZoteroData/**'`：仅命中文档中的禁止项、调查记录和验证命令，未命中源码实现或依赖配置。
    - 当前运行时探测：`Invoke-WebRequest .../health -UserAgent "ZoteroCodexBridge/0.1.22"` 返回 `zotero-codex-bridge ok 0.1.21 ...`，确认 Zotero 当前仍运行旧版插件。下一步需要用户安装 `0.1.22` 后复测 execute audit planId。
  - 修订后运行时复测：
    - 开始时间：2026-06-26 23:58:00
    - 结束时间：2026-06-26 23:59:06
    - 操作内容：
      - 用户确认已安装 `0.1.22` 后，health endpoint 返回 `zotero-codex-bridge ok 0.1.22 zotero-codex-bridge@example.com test`。
      - 使用低风险 no-op `attachment.rename` dry-run，返回 planId `plan_mqv48ved_mf3230i86xp`。
      - 使用同一 planId 和 confirmationToken execute，返回 `ok: true`、`skipped: true`。
      - `audit.list` 返回项目内 `logs\audit\2026-06-26.jsonl`。
      - dry-run 审计记录：`requestId=req_1022_audit_execute_dry`、`status=dry-run`、`planId=plan_mqv48ved_mf3230i86xp`。
      - execute 审计记录：`requestId=req_1022_audit_execute`、`status=executed`、`planId=plan_mqv48ved_mf3230i86xp`。
      - execute audit `planId` 与 dry-run `planId` 完全一致。
    - 测试结果：通过。
    - 备注：direct HTTP audit JSONL 与 `audit.list` runtime 验收完成，`0.1.22` 修复了 `0.1.21` 的 execute audit planId 缺口。

### 步骤 10W - backup.settings.get/set runtime 接入

计划：
- 目标文件：
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\bootstrap.js`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\bootstrap.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\manifest.json`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\unit\zotero-plugin\pluginPackage.test.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\unit\mcp-server\toolRegistry.test.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\README.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\integration\manualAcceptance.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\integration\zoteroPluginDevelopmentInstall.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\TaskDocs\任务总览.md`
- 符号变更：
  - `registerCommandEndpoint()` 新增 `backup.settings.get` 和 `backup.settings.set` direct HTTP 分支。
  - `bootstrap.js` 新增 `readBackupSettings()`、`createBackupSettingsSetDryRun()`、`executeBackupSettingsSet()`、`normalizeBackupPolicy()`、`backupSettingsFilePath()`。
  - `backup.settings.set` 复用现有 dry-run plan、confirmation token、input hash 和 audit JSONL 机制。
  - 测试插件版本从 `0.1.22` 提升到 `0.1.23`。
- 预期行为：
  - `backup.settings.get` 读取本项目 `backups\zotero-operations\settings.json`；文件不存在时返回默认策略：30 天、10GiB、时间限制启用、空间限制启用。
  - `backup.settings.set` 写入本项目 backup 设置文件，必须先 dry-run，再 execute confirmation。
  - audit JSONL 记录 backup 设置修改的 before/after 和 planId。
  - backup 设置文件不得写入 Zotero profile、Zotero data directory、linked attachment root 或附件 storage。
- 测试命令：
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test -- tests/unit/zotero-plugin/pluginPackage.test.ts tests/unit/mcp-server/toolRegistry.test.ts`
  - `npm run test`
  - `npm run build`
  - `npm run build:zotero-plugin`
  - 展开 XPI 检查 `0.1.23`、`backup.settings.get`、`backup.settings.set`、`backups\zotero-operations\settings.json`、`payload.confirmation.planId`、项目根目录注入。
  - 安全边界 `rg` 搜索。
- 通过标准：
  - 全量测试、构建、类型检查、lint 和 XPI 打包通过。
  - `dist\zotero-codex-bridge.xpi` 版本为 `0.1.23`。
  - 包内包含 backup settings runtime 分支和项目内 backup 路径，且不残留项目根目录占位符。
  - 不引入 Web API、SQLite 写入或任意 JS eval。

执行：
- 开始时间：2026-06-27 00:01:41
- 结束时间：2026-06-27 00:06:22
- 操作内容：
  - 将测试插件版本提升到 `0.1.23`。
  - 在 `src\zotero-plugin\bootstrap.js` 的 direct HTTP command endpoint 中新增 `backup.settings.get` 和 `backup.settings.set` 分支。
  - 新增 `readBackupSettings()`、`createBackupSettingsSetDryRun()`、`executeBackupSettingsSet()`、`normalizeBackupPolicy()`、`backupRootPath()`、`backupSettingsFilePath()`。
  - `backup.settings.get` 在 `backups\zotero-operations\settings.json` 不存在时返回默认 policy：`retentionDays: 30`、`maxLocalBytes: 10737418240`、`enableTimeLimit: true`、`enableSpaceLimit: true`。
  - `backup.settings.set` 复用现有 dry-run plan 和 confirmation token，execute 后写入本项目 `backups\zotero-operations\settings.json`。
  - 更新 README、手工验收清单、插件安装验证文档、spec open question 和任务总览。
- 测试结果：自动验证通过，runtime 验收待安装新版 XPI。
  - `npm run typecheck`：通过。
  - `npm run lint`：通过。
  - `npm run test -- tests/unit/zotero-plugin/pluginPackage.test.ts tests/unit/mcp-server/toolRegistry.test.ts`：通过，2 个测试文件、12 个测试通过。
  - `npm run test`：通过，17 个测试文件、60 个测试通过。
  - `npm run build`：通过。
  - `npm run build:zotero-plugin`：通过。
  - `tar -xOf dist\zotero-codex-bridge.xpi manifest.json`：版本为 `0.1.23`。
  - `tar -xOf dist\zotero-codex-bridge.xpi bootstrap.js` 检查：包内包含 `0.1.23`、`backup.settings.get`、`backup.settings.set`、`backups`、`zotero-operations`、`settings.json`、`payload.confirmation.planId` 和注入后的项目根目录，未残留 `__ZOTERO_CODEX_BRIDGE_PROJECT_ROOT__`。
  - `rg "ZOTERO_API_KEY|api\.zotero\.org|zotero\.sqlite|sqlite write|任意 JS eval" src tests package.json README.md AGENTS.md docs TaskDocs -g '!node_modules/**' -g '!dist/**' -g '!ZoteroProfile/**' -g '!ZoteroVault/**' -g '!ZoteroData/**'`：仅命中文档中的禁止项、调查记录和验证命令，未命中源码实现或依赖配置。
  - 当前运行时探测：`Invoke-WebRequest .../health -UserAgent "ZoteroCodexBridge/0.1.23"` 返回 `zotero-codex-bridge ok 0.1.22 ...`，确认 Zotero 当前仍运行旧版插件。
- 备注：本步骤只实现 backup policy 设置文件的 runtime 读写，不实现附件文件级 backup snapshot；后者与 undo 联动，后续单独步骤处理。下一步需要用户安装 `dist\zotero-codex-bridge.xpi` 并重启 Zotero 后，复测 `backup.settings.get/set` 和对应 audit 记录。
  - 运行时复测：
    - 开始时间：2026-06-27 00:20:00
    - 结束时间：2026-06-27 00:23:37
    - 操作内容：
      - 用户确认已安装 `0.1.23` 后，health endpoint 返回 `zotero-codex-bridge ok 0.1.23 zotero-codex-bridge@example.com test`。
      - 首次使用旧 `manual-probe-token` 调用 command endpoint 返回 `COMMAND_AUTH_INVALID`；随后改用项目本地 `runtime\auth\bridge-token`。
      - `backup.settings.get` 返回 `ok: true`，`defaultsUsed: true`，`filePath` 为 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\backups\zotero-operations\settings.json`。
      - `backup.settings.set` dry-run 返回 planId `plan_mqv54fht_b800dkohkzd`，before/after policy 均为默认 30 天、10GiB、时间限制启用、空间限制启用。
      - 使用同一 planId 和 confirmationToken execute 成功，写入 `backups\zotero-operations\settings.json`。
      - `audit.list` 返回项目内 `logs\audit\2026-06-26.jsonl`。
      - dry-run 审计记录：`requestId=req_1023_backup_set_dry`、`status=dry-run`、`planId=plan_mqv54fht_b800dkohkzd`。
      - execute 审计记录：`requestId=req_1023_backup_set_execute`、`status=executed`、`planId=plan_mqv54fht_b800dkohkzd`。
      - execute audit `planId` 与 dry-run `planId` 完全一致。
    - 测试结果：通过。
    - 备注：`0.1.23` 的 backup settings direct HTTP runtime 验收完成。后续手工或自动探针应读取 `runtime\auth\bridge-token`，不再使用旧的 `manual-probe-token`。

### 步骤 10X - attachment.undoAdded runtime 接入

计划：
- 目标文件：
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\shared\commands.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\commands\attachmentCommands.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\bootstrap.js`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\bootstrap.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\manifest.json`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\unit\shared\commands.test.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\unit\zotero-plugin\attachmentCommands.test.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\unit\zotero-plugin\pluginPackage.test.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\unit\mcp-server\toolRegistry.test.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\zotero-api-source-audit.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\README.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\integration\manualAcceptance.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\integration\zoteroPluginDevelopmentInstall.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\TaskDocs\任务总览.md`
- 符号变更：
  - shared command table 新增 `attachment.undoAdded`，写命令，输入字段为 `attachmentKey`。
  - adapter 注册层将已有 `undoAddedAttachment()` 注册到 `CommandRegistry`。
  - `bootstrap.js` 新增 `attachment.undoAdded` direct HTTP 分支、`createAttachmentUndoAddedDryRun()`、`executeAttachmentUndoAdded()`、`normalizeAttachmentUndoAddedInput()`、`findBridgeAttachmentAddAudit()`。
  - execute 只调用 `Zotero.Items.trashTx([attachment.id])` 将附件移入 Zotero trash，不调用 `eraseTx()`，不清空 trash，不删除附件 storage 文件。
  - 测试插件版本从 `0.1.23` 提升到 `0.1.24`。
- 预期行为：
  - 只有本项目 audit JSONL 中能找到成功 `attachment.addFile` 记录且 affected/data 指向同一 `attachmentKey` 时，`attachment.undoAdded` 才允许 dry-run。
  - 找不到创建审计证据时拒绝，避免对用户既有附件执行 undo。
  - dry-run 返回 attachment title、parent item key、file path、source audit requestId/planId 和 action `trash`。
  - execute 必须带同一 dry-run 的 `planId` 和 `confirmationToken`，成功后附件不再出现在 `attachment.getForItem` 默认结果中。
  - audit JSONL 记录 `attachment.undoAdded` 的 dry-run 和 executed，且 execute 记录携带 dry-run planId。
- 测试命令：
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test -- tests/unit/shared/commands.test.ts tests/unit/zotero-plugin/attachmentCommands.test.ts tests/unit/zotero-plugin/pluginPackage.test.ts tests/unit/mcp-server/toolRegistry.test.ts`
  - `npm run test`
  - `npm run build`
  - `npm run build:zotero-plugin`
  - 展开 XPI 检查 `0.1.24`、`attachment.undoAdded`、`Zotero.Items.trashTx`、`findBridgeAttachmentAddAudit`、`payload.confirmation.planId`。
  - 安全边界 `rg` 搜索。
- 通过标准：
  - 全量测试、构建、类型检查、lint 和 XPI 打包通过。
  - `dist\zotero-codex-bridge.xpi` 版本为 `0.1.24`。
  - 包内包含 undo runtime 分支和 Zotero trash API，且不包含 `eraseTx()` 作为 undo 路径。
  - 不引入 Web API、SQLite 写入或任意 JS eval。

执行：
- 开始时间：2026-06-27 00:25:20
- 结束时间：2026-06-27 00:37:31
- 操作内容：
  - `src\shared\commands.ts` 新增 `attachment.undoAdded` 写命令，输入字段为 `attachmentKey`。
  - `src\zotero-plugin\commands\attachmentCommands.ts` 注册已有 adapter 层 `undoAddedAttachment()`。
  - `src\zotero-plugin\bootstrap.js` 新增 direct HTTP `attachment.undoAdded` dry-run/execute 分支、审计证据检查和 Zotero trash 执行路径。
  - `executeAttachmentUndoAdded()` 只调用 `Zotero.Items.trashTx([attachment.id])`，不调用永久删除 `eraseTx()`，不清空 Zotero trash，不删除 storage 文件。
  - `docs\zotero-api-source-audit.md` 记录 Zotero 9.0.5 官方源码依据：`Zotero.Items.trashTx()` 是 transaction 包装的 trash 路径；`eraseTx()` 是永久删除路径，本步骤明确不用。
  - README、手工验收文档、开发安装文档和 package 版本断言同步到 `0.1.24`。
- 测试结果：
  - `npm run typecheck`：通过。
  - `npm run lint`：通过。
  - `npm run test -- tests/unit/shared/commands.test.ts tests/unit/zotero-plugin/attachmentCommands.test.ts tests/unit/zotero-plugin/pluginPackage.test.ts tests/unit/mcp-server/toolRegistry.test.ts`：通过，4 个测试文件、23 个测试。
  - `npm run test`：通过，17 个测试文件、61 个测试。
  - `npm run build`：通过。
  - `npm run build:zotero-plugin`：通过。
  - XPI 展开检查通过：`dist\zotero-codex-bridge.xpi` 中 `manifest.json` 版本为 `0.1.24`，`bootstrap.js` 包含 `attachment.undoAdded`、`Zotero.Items.trashTx`、`findBridgeAttachmentAddAudit`、`ATTACHMENT_UNDO_NOT_BRIDGE_CREATED` 和 `payload.confirmation.planId`。
  - XPI 包内不含 `__ZOTERO_CODEX_BRIDGE_PROJECT_ROOT__` 占位符，不含 `eraseTx` 字符串。
  - 安全边界搜索通过：仅命中文档中的禁止项说明，未发现源码实现或依赖配置引入 `ZOTERO_API_KEY`、`api.zotero.org`、`zotero.sqlite`、`sqlite write` 或任意 JS eval。
- runtime 验收：
  - 用户安装重启 `0.1.24` 后，health 返回 `zotero-codex-bridge ok 0.1.24 zotero-codex-bridge@example.com test`。
  - 使用项目 token 调用 `attachment.addFile`，以 copy 模式给 Item A `7N4QZKCM` 添加 runtime 临时 PDF，execute 成功，新附件 key 为 `BGHZTWLZ`，`skipped=false`。
  - 随后调用 `attachment.undoAdded` dry-run/execute，execute 返回 `ok=true`、`trashed=true`、`erased=false`。
  - 再调用 `attachment.getForItem` 读取 Item A，默认结果中不再包含附件 `BGHZTWLZ`。
  - 文件级审计 `logs\audit\2026-06-26.jsonl` 已写入 `req_undo_added_dry_024c` 和 `req_undo_added_exec_024c`，二者 planId 均为 `plan_mqv5miqg_6luitvz1hs5`。
  - 发现偏差：`audit.list` runtime 响应只暴露 `entries`，验收脚本按 `events` 查询时为空；后续步骤 10Y 修复为同时返回 `events` 和 `entries`。
- 备注：本步骤只实现对本插件新增附件的受控 trash undo；文件级 backup snapshot 和从 backup 恢复文件后续单独实现。

### 步骤 10Y - audit.list events 兼容字段修复

计划：
- 目标文件：
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\bootstrap.js`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\bootstrap.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\manifest.json`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\unit\zotero-plugin\pluginPackage.test.ts`
  - 同步 README 和 integration 文档版本号。
- 符号变更：
  - `readAuditList()` 返回值从只包含 `entries` 调整为同时包含 `events` 和 `entries`。
  - 测试插件版本从 `0.1.24` 提升到 `0.1.25`。
- 预期行为：
  - 既保留旧的 `entries` 字段，又让调用方可以按 shared/MCP 语义读取 `data.events`。
  - 不改变审计 JSONL 写入格式，不改变写命令行为。
- 测试命令：
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test -- tests/unit/zotero-plugin/pluginPackage.test.ts tests/unit/mcp-server/toolRegistry.test.ts`
  - `npm run test`
  - `npm run build`
  - `npm run build:zotero-plugin`
  - XPI 展开检查 `0.1.25`、`events: entries`、`attachment.undoAdded`、`Zotero.Items.trashTx`。
  - 安全边界 `rg` 搜索。
- 通过标准：
  - 全量测试、构建、类型检查、lint 和 XPI 打包通过。
  - `dist\zotero-codex-bridge.xpi` 版本为 `0.1.25`。
  - 不引入 Web API、SQLite 写入或任意 JS eval。

执行：
- 开始时间：2026-06-27 00:37:31
- 结束时间：2026-06-27 00:44:28
- 操作内容：
  - `readAuditList()` 返回对象新增 `events: entries`，保留 `entries: entries`。
  - 插件版本、README、integration 文档和相关测试期望同步到 `0.1.25`。
  - `pluginPackage.test.ts` 增加包内包含 `events: entries` 的断言。
- 测试结果：
  - `npm run typecheck`：通过。
  - `npm run lint`：通过。
  - `npm run test -- tests/unit/zotero-plugin/pluginPackage.test.ts tests/unit/mcp-server/toolRegistry.test.ts`：通过，2 个测试文件、12 个测试。
  - `npm run test`：通过，17 个测试文件、61 个测试。
  - `npm run build`：通过。
  - `npm run build:zotero-plugin`：通过。
  - XPI 展开检查通过：`manifest.json` 版本为 `0.1.25`，包内 `bootstrap.js` 包含 `events: entries`、`entries: entries`、`attachment.undoAdded` 和 `Zotero.Items.trashTx`；不含 `__ZOTERO_CODEX_BRIDGE_PROJECT_ROOT__` 占位符，不含 `eraseTx`。
  - 安全边界搜索通过：仅命中文档中的禁止项、调查记录和验证命令，未命中源码实现或依赖配置。
- runtime 验收：
  - 用户安装重启 `0.1.25` 后，health 返回 `zotero-codex-bridge ok 0.1.25 zotero-codex-bridge@example.com test`。
  - `audit.list` 请求 `date = 2026-06-26`、`limit = 100` 返回 200。
  - 返回体同时包含 `data.events` 和 `data.entries`。
  - `data.events` 共返回 15 条记录，其中能按 `requestId` 读到 `req_undo_added_dry_024c` 和 `req_undo_added_exec_024c` 两条 `attachment.undoAdded` 记录。
  - 两条记录状态分别为 `dry-run`、`executed`，planId 均为 `plan_mqv5miqg_6luitvz1hs5`。
- 备注：`audit.list` events 兼容字段 runtime 验收完成，可继续进入 backup 文件快照相关实现。

### 步骤 10Z - attachment 文件重命名前 backup snapshot

计划：
- 目标文件：
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\bootstrap.js`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\bootstrap.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\manifest.json`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\unit\zotero-plugin\pluginPackage.test.ts`
  - 同步 README、integration 文档和任务总览。
- 符号变更：
  - 新增插件侧文件快照 helper：在项目 `backups\zotero-operations\files\` 下创建 `backupId` 目录，复制原附件文件，并写入 `manifest.json`。
  - `attachment.rename` 在 `filenameChanged` 且执行 Zotero 文件重名前创建快照。
  - `attachment.runZoteroRename` 在执行 Zotero 文件重名前创建快照。
  - 测试插件版本从 `0.1.25` 提升到 `0.1.26`。
- 预期行为：
  - backup snapshot 只写入本项目 backup 目录，不写入 Zotero profile、Zotero data directory、linked attachment root 或附件目录。
  - 如果重命名前文件不存在，继续沿用既有 `ATTACHMENT_FILE_NOT_FOUND` 失败路径，不创建空 backup。
  - execute 返回中包含 `backup` 元数据，审计 JSONL 自动记录 backup file path 和 manifest path。
  - 本步骤不实现从 backup 恢复文件，也不执行 retention prune；这两个后续单独实现。
- 测试命令：
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test -- tests/unit/zotero-plugin/pluginPackage.test.ts`
  - `npm run test`
  - `npm run build`
  - `npm run build:zotero-plugin`
  - XPI 展开检查 `0.1.26`、`createBackupFileSnapshot`、`backups`、`manifest.json`。
  - 安全边界 `rg` 搜索。
- 通过标准：
  - 全量测试、构建、类型检查、lint 和 XPI 打包通过。
  - `dist\zotero-codex-bridge.xpi` 版本为 `0.1.26`。
  - 包内不含 `__ZOTERO_CODEX_BRIDGE_PROJECT_ROOT__` 占位符，不含 `eraseTx`。
  - 不引入 Web API、SQLite 写入或任意 JS eval。

执行：
- 开始时间：2026-06-27 00:44:28
- 结束时间：2026-06-27 00:52:08
- 操作内容：
  - `src\zotero-plugin\bootstrap.js` 新增 `createBackupFileSnapshot()`、`backupFilesRootPath()`、`copyFileForBackup()` 和 backup filename 清理函数。
  - `attachment.rename` 在 `filenameChanged` 且调用 Zotero `renameAttachmentFile()` 前复制当前附件文件到项目内 `backups\zotero-operations\files\<date>\<backupId>\`，并写入 `manifest.json`。
  - `attachment.runZoteroRename` 在调用 Zotero `renameAttachmentFile()` 前执行同样的文件快照。
  - execute 返回新增 `backup` 字段，包含 `backupId`、`backupFilePath`、`manifestPath`、`sourceFilePath`、`createdAt` 和 `available`。
  - `audit.list` 在审计文件不存在时也返回 `events: []`，保持响应形态一致。
  - README、spec、manual acceptance 和开发安装验收文档同步到 `0.1.26`。
- 测试结果：
  - `npm run typecheck`：通过。
  - `npm run lint`：初次因 control character 正则失败；已改为逐字符清理文件名后重跑通过。
  - `npm run test -- tests/unit/zotero-plugin/pluginPackage.test.ts`：通过，1 个测试文件、3 个测试。
  - `npm run test`：通过，17 个测试文件、61 个测试。
  - `npm run build`：通过。
  - `npm run build:zotero-plugin`：通过。
  - XPI 展开检查通过：`manifest.json` 版本为 `0.1.26`，包内包含 `createBackupFileSnapshot`、`backupFilesRootPath`、`IOUtils.copy`、`manifest.json` 和 `attachment.undoAdded`。
  - 包内不含 `__ZOTERO_CODEX_BRIDGE_PROJECT_ROOT__` 占位符，不含 `eraseTx`。
  - 安全边界搜索通过：仅命中文档中的禁止项、调查记录和验证命令，未命中源码实现或依赖配置。
- runtime 验收：
  - 用户安装重启 `0.1.26` 后，health 返回 `zotero-codex-bridge ok 0.1.26 zotero-codex-bridge@example.com test`。
  - 对附件 `FQ8474SV` 执行 `attachment.rename`，输入 `renameFile = true`、title 为 `Codex Bridge Backup Snapshot Probe 0.1.26`。
  - `attachment.rename` execute 返回 `ok=true`、`skipped=false`、文件名变为 `Codex Bridge Backup Snapshot Probe 0.1.26.pdf`。
  - `attachment.rename` 返回 `backup.available=true`，backup 文件和 manifest 均存在，路径位于 `backups\zotero-operations\files\2026-06-26\backup_mqv64zm5_tbuyy69wpl\`。
  - 随后对同一附件执行 `attachment.runZoteroRename`，execute 返回 `ok=true`、`skipped=false`、文件名恢复为 `Zotero Codex Bridge Test Item B.pdf`。
  - `attachment.runZoteroRename` 返回 `backup.available=true`，backup 文件和 manifest 均存在，路径位于 `backups\zotero-operations\files\2026-06-26\backup_mqv64zwi_31azl716npb\`。
  - `audit.list` 读取到 `req_attachment_backup_snapshot_rename_exec_026` 和 `req_attachment_backup_snapshot_auto_exec_026` 两条 executed 审计记录。
- 备注：rename 类操作的文件重命名前 backup snapshot runtime 验收完成。新增附件的 undo 当前是 trash，不做永久删除；从 backup 恢复文件与 retention prune 后续单独实现。

### 步骤 10AA - backup snapshot 只读列表

计划：
- 目标文件：
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\shared\commands.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\bootstrap.js`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\bootstrap.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\manifest.json`
  - 修改相关 unit tests、README、integration 文档和任务总览。
- 符号变更：
  - shared command table 新增只读命令 `backup.snapshot.list`。
  - 插件 direct HTTP endpoint 新增 `backup.snapshot.list` 分支。
  - 新增插件侧读取 `backups\zotero-operations\files\` 下 manifest 的 helper，返回最近 snapshot 列表。
  - 测试插件版本从 `0.1.26` 提升到 `0.1.27`。
- 预期行为：
  - 只读取本项目 backup snapshot 目录，不删除、不恢复、不写入任何文件。
  - 返回 `backupRoot`、`snapshotRoot`、`snapshots`，snapshot 至少包含 `backupId`、`commandName`、`createdAt`、`attachmentKey`、`sourceFilePath`、`backupFilePath`、`manifestPath`、`bytes`。
  - `limit` 默认为 20，允许 1 到 100。
  - 如果 snapshot 目录不存在，返回空数组。
- 测试命令：
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test -- tests/unit/shared/commands.test.ts tests/unit/zotero-plugin/pluginPackage.test.ts tests/unit/mcp-server/toolRegistry.test.ts`
  - `npm run test`
  - `npm run build`
  - `npm run build:zotero-plugin`
  - XPI 展开检查 `0.1.27`、`backup.snapshot.list`、`readBackupSnapshotList`。
  - 安全边界 `rg` 搜索。
- 通过标准：
  - 全量测试、构建、类型检查、lint 和 XPI 打包通过。
  - `dist\zotero-codex-bridge.xpi` 版本为 `0.1.27`。
  - runtime 验收能列出 `0.1.26` 生成的两个 backup snapshot。

执行：
- 开始时间：2026-06-27 00:52:08
- 结束时间：2026-06-27 01:00:27
- 操作内容：
  - `src\shared\commands.ts` 新增只读命令 `backup.snapshot.list`。
  - `src\zotero-plugin\bootstrap.js` 新增 direct HTTP `backup.snapshot.list` 分支。
  - 新增 `readBackupSnapshotList()` 与 `normalizeBackupSnapshotRecord()`，读取 `backups\zotero-operations\files\` 下 snapshot manifest。
  - `readBackupSnapshotList()` 使用 `IOUtils.getChildren` 枚举日期目录和 backupId 目录，只读取 `manifest.json`，不删除、不恢复、不写入。
  - README、spec、manual acceptance 和开发安装验收文档同步到 `0.1.27`。
- 测试结果：
  - `npm run typecheck`：通过。
  - `npm run lint`：通过。
  - `npm run test -- tests/unit/shared/commands.test.ts tests/unit/zotero-plugin/pluginPackage.test.ts tests/unit/mcp-server/toolRegistry.test.ts`：通过，3 个测试文件、16 个测试。
  - `npm run test`：通过，17 个测试文件、61 个测试。
  - `npm run build`：通过。
  - `npm run build:zotero-plugin`：通过。
  - XPI 展开检查通过：`manifest.json` 版本为 `0.1.27`，包内包含 `backup.snapshot.list`、`readBackupSnapshotList`、`normalizeBackupSnapshotRecord` 和 `IOUtils.getChildren`。
  - 包内不含 `__ZOTERO_CODEX_BRIDGE_PROJECT_ROOT__` 占位符，不含 `eraseTx`。
  - 安全边界搜索通过：仅命中文档中的禁止项、调查记录和验证命令，未命中源码实现或依赖配置。
- runtime 验收：
  - 用户安装重启 `0.1.27` 后，health 返回 `zotero-codex-bridge ok 0.1.27 zotero-codex-bridge@example.com test`。
  - `backup.snapshot.list` 返回 200，`snapshotRoot` 为 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\backups\zotero-operations\files`。
  - 返回 `snapshotCount = 2`，能匹配 `backup_mqv64zm5_tbuyy69wpl` 和 `backup_mqv64zwi_31azl716npb`。
  - 两个 snapshot 的 `commandName` 分别为 `attachment.rename` 和 `attachment.runZoteroRename`，`manifestReadable = true`。
- 备注：本步骤只读 snapshot，为后续 restore/prune 做基础；不做删除或恢复。

### 步骤 10AB - backup snapshot 受控文件恢复

计划：
- 目标文件：
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\shared\commands.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\bootstrap.js`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\bootstrap.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\manifest.json`
  - 修改相关 unit tests、README、integration 文档和任务总览。
- 符号变更：
  - shared command table 新增写命令 `backup.snapshot.restore`，输入 `backupId`。
  - 插件 direct HTTP endpoint 新增 dry-run/execute 二阶段分支。
  - 新增 snapshot manifest lookup、restore input normalize 和 `IOUtils.copy` 恢复 helper。
  - 测试插件版本从 `0.1.27` 提升到 `0.1.28`。
- 预期行为：
  - dry-run 读取指定 `backupId` 的 manifest，解析 attachmentKey、backupFilePath、sourceFilePath。
  - 只允许恢复到 manifest 指向的同一个 local user attachment 当前文件路径。
  - 当前 attachment 文件路径必须与 manifest 的 `sourceFilePath` 一致；不做跨路径恢复，不创建孤立文件。
  - execute 复制 `backupFilePath` 到当前 attachment 文件路径，返回 `restored=true`、backup 和 target 元数据。
  - 本步骤不删除 snapshot，不执行 retention prune。
- 测试命令：
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test -- tests/unit/shared/commands.test.ts tests/unit/zotero-plugin/pluginPackage.test.ts tests/unit/mcp-server/toolRegistry.test.ts`
  - `npm run test`
  - `npm run build`
  - `npm run build:zotero-plugin`
  - XPI 展开检查 `0.1.28`、`backup.snapshot.restore`、`executeBackupSnapshotRestore`。
  - 安全边界 `rg` 搜索。
- 通过标准：
  - 全量测试、构建、类型检查、lint 和 XPI 打包通过。
  - `dist\zotero-codex-bridge.xpi` 版本为 `0.1.28`。
  - runtime 验收可以对路径匹配的 snapshot 执行 dry-run/execute，并保持 snapshot 文件不被删除。

执行：
- 开始时间：2026-06-27 01:00:27
- 结束时间：2026-06-27 01:21:49
- 操作内容：
  - `src\shared\commands.ts` 新增写命令 `backup.snapshot.restore`。
  - `src\zotero-plugin\bootstrap.js` 将 `backup.snapshot.restore` 加入写命令表和 direct HTTP dry-run/execute 分支。
  - 新增 `createBackupSnapshotRestoreDryRun()`、`executeBackupSnapshotRestore()`、`normalizeBackupSnapshotRestoreInput()` 和 `findBackupSnapshotById()`。
  - restore 校验指定 `backupId` 的 manifest、backup 文件存在、目标 attachment 存在且未进 trash，并要求当前 attachment file path 与 manifest `sourceFilePath` 一致。
  - execute 使用 `IOUtils.copy` 将 `backupFilePath` 复制到当前 attachment 文件路径；不删除 snapshot，不执行 retention prune。
  - README、spec、manual acceptance 和开发安装验收文档同步到 `0.1.28`。
- 测试结果：
  - `npm run typecheck`：通过。
  - `npm run lint`：通过。
  - `npm run test -- tests/unit/shared/commands.test.ts tests/unit/zotero-plugin/pluginPackage.test.ts tests/unit/mcp-server/toolRegistry.test.ts`：通过，3 个测试文件、16 个测试。
  - `npm run test`：通过，17 个测试文件、61 个测试。
  - `npm run build`：通过。
  - `npm run build:zotero-plugin`：通过。
  - XPI 展开检查通过：`manifest.json` 版本为 `0.1.28`，包内包含 `backup.snapshot.restore`、`executeBackupSnapshotRestore`、`normalizeBackupSnapshotRestoreInput` 和 `BACKUP_RESTORE_TARGET_CHANGED`。
  - 包内不含 `__ZOTERO_CODEX_BRIDGE_PROJECT_ROOT__` 占位符，不含 `eraseTx`。
  - 安全边界搜索通过：仅命中文档中的禁止项、调查记录和验证命令，未命中源码实现或依赖配置。
- runtime 验收：
  - 用户安装重启 `0.1.28` 后，health 返回 `zotero-codex-bridge ok 0.1.28 zotero-codex-bridge@example.com test`。
  - 使用路径匹配的 snapshot `backup_mqv64zm5_tbuyy69wpl` 执行 `backup.snapshot.restore` dry-run/execute。
  - dry-run 返回 200，planId 为 `plan_mqv778zc_36cpcv1o0oz`，目标路径为 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\ZoteroData\storage\FQ8474SV\Zotero Codex Bridge Test Item B.pdf`。
  - execute 返回 200，`ok=true`、`restored=true`、`attachmentKey=FQ8474SV`、`parentZoteroItemKey=K7P8J5XF`。
  - execute 后目标附件文件存在，snapshot backup file 和 manifest 仍存在，未被删除。
  - `audit.list` 读取到 `req_backup_snapshot_restore_dry_028` 和 `req_backup_snapshot_restore_exec_028` 两条记录，状态为 `dry-run,executed`，planId 均为 `plan_mqv778zc_36cpcv1o0oz`。
- 备注：本步骤只实现严格同路径 restore；跨路径恢复和 retention prune 后续再做。

### 步骤 10AC - backup snapshot retention prune

计划：
- 目标文件：
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\shared\commands.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\bootstrap.js`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\bootstrap.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\manifest.json`
  - 修改相关 unit tests、README、integration 文档和任务总览。
- 符号变更：
  - shared command table 新增写命令 `backup.snapshot.prune`。
  - 插件 direct HTTP endpoint 新增 dry-run/execute 二阶段分支。
  - 新增基于当前 backup settings 的 snapshot prune 计划函数和执行函数。
  - 测试插件版本从 `0.1.28` 提升到 `0.1.29`。
- 预期行为：
  - dry-run 读取 `backup.settings.get` 当前策略和 snapshot manifest 列表，返回将删除的 snapshot、原因和释放字节数。
  - 如果同时启用空间和时间限制，先按空间限制选择删除项，再按时间限制选择删除项。
  - execute 必须带 dry-run confirmation，并且只删除 `backups\zotero-operations\files\` 下对应 snapshot 目录。
  - 当前 runtime 验收先使用默认策略验证无删除项路径，不删除现有两个 snapshot。
- 测试命令：
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test -- tests/unit/shared/commands.test.ts tests/unit/zotero-plugin/pluginPackage.test.ts tests/unit/mcp-server/toolRegistry.test.ts`
  - `npm run test`
  - `npm run build`
  - `npm run build:zotero-plugin`
  - XPI 展开检查 `0.1.29`、`backup.snapshot.prune`、`executeBackupSnapshotPrune`。
  - 安全边界 `rg` 搜索。
- 通过标准：
  - 全量测试、构建、类型检查、lint 和 XPI 打包通过。
  - `dist\zotero-codex-bridge.xpi` 版本为 `0.1.29`。
  - runtime 验收默认策略下返回 0 个删除项，现有 snapshot 仍存在。

执行：
- 开始时间：2026-06-27 01:23:09
- 结束时间：2026-06-27 01:31:36
- 操作内容：
  - `src\shared\commands.ts` 新增写命令 `backup.snapshot.prune`。
  - `src\zotero-plugin\bootstrap.js` 将 `backup.snapshot.prune` 加入写命令表和 direct HTTP dry-run/execute 分支。
  - 新增 `createBackupSnapshotPruneDryRun()`、`executeBackupSnapshotPrune()`、`normalizeBackupSnapshotPruneInput()`、`planBackupSnapshotPrune()` 和 snapshot 目录删除路径守卫。
  - prune 读取当前 backup settings 和 snapshot manifest，先按空间限制选择删除项，再按时间限制选择删除项。
  - execute 只允许删除 `backups\zotero-operations\files\` 下的 snapshot 目录；路径不在 snapshot root 下时拒绝。
  - README、spec、manual acceptance 和开发安装验收文档同步到 `0.1.29`。
- 测试结果：
  - `npm run typecheck`：通过。
  - `npm run lint`：通过。
  - `npm run test -- tests/unit/shared/commands.test.ts tests/unit/zotero-plugin/pluginPackage.test.ts tests/unit/mcp-server/toolRegistry.test.ts`：通过，3 个测试文件、16 个测试。
  - `npm run test`：通过，17 个测试文件、61 个测试。
  - `npm run build`：通过。
  - `npm run build:zotero-plugin`：通过。
  - XPI 展开检查通过：`manifest.json` 版本为 `0.1.29`，包内包含 `backup.snapshot.prune`、`executeBackupSnapshotPrune`、`planBackupSnapshotPrune`、`BACKUP_SNAPSHOT_PRUNE_PATH_INVALID` 和 `IOUtils.remove`。
  - 包内不含 `__ZOTERO_CODEX_BRIDGE_PROJECT_ROOT__` 占位符，不含 `eraseTx`。
  - 安全边界搜索通过：仅命中文档中的禁止项、调查记录和验证命令，未命中源码实现或依赖配置。
- runtime 验收：
  - 用户安装重启 `0.1.29` 后，health 返回 `zotero-codex-bridge ok 0.1.29 zotero-codex-bridge@example.com test`。
  - prune 前 `backup.snapshot.list` 返回 2 个 snapshot：`backup_mqv64zwi_31azl716npb` 和 `backup_mqv64zm5_tbuyy69wpl`。
  - `backup.snapshot.prune` dry-run 返回 200，planId 为 `plan_mqv7jnkw_zecqi5l4218`，`deleteCount=0`、`freedBytes=0`。
  - execute 返回 200，`ok=true`、`deleteCount=0`、`freedBytes=0`。
  - execute 后 `backup.snapshot.list` 仍返回同样 2 个 snapshot，`snapshotsUnchanged=true`。
  - `audit.list` 读取到 `req_backup_snapshot_prune_dry_029` 和 `req_backup_snapshot_prune_exec_029` 两条记录，状态为 `dry-run,executed`，planId 均为 `plan_mqv7jnkw_zecqi5l4218`。
- 备注：本步骤实现删除能力，但 runtime 验收只跑默认策略下无删除项路径；真实删除旧 snapshot 需要后续单独造旧数据或由用户确认。

### 步骤 10AD - backup snapshot prune 真实删除路径受控验收

计划：
- 目标文件：
  - 不修改源码。
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\TaskDocs\Zotero本地写入MCP项目实施计划日志.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\TaskDocs\任务总览.md`
- 符号变更：
  - 无。
- 预期行为：
  - 在项目 backup snapshot 目录下创建一个临时旧 snapshot fixture。
  - 使用当前 `backup.snapshot.prune` dry-run/execute 删除该临时旧 snapshot。
  - 现有 `backup_mqv64zm5_tbuyy69wpl` 和 `backup_mqv64zwi_31azl716npb` 不被删除。
  - 不触碰 Zotero profile、Zotero data directory、linked attachment root 或附件目录。
- 测试命令：
  - PowerShell 创建临时 fixture snapshot。
  - direct HTTP `backup.snapshot.list`
  - direct HTTP `backup.snapshot.prune` dry-run/execute
  - direct HTTP `audit.list`
- 通过标准：
  - dry-run 明确列出临时旧 snapshot，reason 为 `time-limit`。
  - execute 删除临时旧 snapshot 目录。
  - 两个真实验收 snapshot 仍存在。

执行：
- 开始时间：2026-06-27 01:31:36
- 结束时间：2026-06-27 01:34:27
- 操作内容：
  - 在项目 backup snapshot 目录创建临时旧 snapshot fixture：`backup_prune_probe_029`，路径为 `backups\zotero-operations\files\2000-01-01\backup_prune_probe_029\`。
  - prune 前 `backup.snapshot.list` 返回 3 个 snapshot，包含临时 fixture 和两个真实验收 snapshot。
  - 执行 `backup.snapshot.prune` dry-run/execute。
- 测试结果：
  - dry-run 返回 200，planId 为 `plan_mqv7nfcb_yoaob9uqr1m`，`deleteCount=1`。
  - dry-run 删除计划只包含 `backup_prune_probe_029`，reason 为 `time-limit`。
  - execute 返回 200，`ok=true`、`deleteCount=1`，删除项为 `backup_prune_probe_029`。
  - execute 后临时 fixture 目录不存在。
  - execute 后 `backup.snapshot.list` 返回 2 个 snapshot，仍包含 `backup_mqv64zwi_31azl716npb` 和 `backup_mqv64zm5_tbuyy69wpl`。
  - `audit.list` 读取到 `req_backup_snapshot_prune_delete_dry_029` 和 `req_backup_snapshot_prune_delete_exec_029` 两条记录，状态为 `dry-run,executed`，planId 均为 `plan_mqv7nfcb_yoaob9uqr1m`。
- 备注：本步骤只创建并删除临时 fixture snapshot，真实验收 snapshot 未删除。

### 步骤 10AE - item.get 只读条目详情

计划：
- 目标文件：
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\shared\commands.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\bootstrap.js`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\bootstrap.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\manifest.json`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\unit\shared\commands.test.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\unit\zotero-plugin\pluginPackage.test.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\unit\mcp-server\toolRegistry.test.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\README.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\spec-zotero-local-write-mcp.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\integration\manualAcceptance.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\integration\zoteroPluginDevelopmentInstall.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\TaskDocs\任务总览.md`
- 符号变更：
  - shared command table 新增只读命令 `item.get`。
  - 插件 direct HTTP endpoint 新增 `readItemDetails()`。
  - 测试插件版本从 `0.1.29` 提升到 `0.1.30`。
- 预期行为：
  - 外部可按 `zoteroItemKey` 读取本地 user library 条目的 `itemType`、title、creators、tags、collectionKeys、attachmentKeys、noteKeys 和 Zotero 原生 JSON 摘要。
  - 该命令是只读命令，不需要 dry-run 或 confirmation，不写 audit。
  - 查询不存在或非本地 user library item 时返回明确错误，不触碰 Web API 或 SQLite。
- 测试命令：
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test -- tests/unit/shared/commands.test.ts tests/unit/zotero-plugin/pluginPackage.test.ts tests/unit/mcp-server/toolRegistry.test.ts`
  - `npm run test`
  - `npm run build`
  - `npm run build:zotero-plugin`
  - XPI 展开检查 `0.1.30`、`item.get`、`readItemDetails`。
  - runtime health 与 `item.get` 读取 Item A/Item B title。
- 通过标准：
  - 自动验证和 XPI 打包通过。
  - `dist\zotero-codex-bridge.xpi` 版本为 `0.1.30`。
  - 用户安装重启后，`item.get` 能用 title 核验 Item A/Item B key 映射。

执行：
- 开始时间：2026-06-27 01:40:00
- 结束时间：2026-06-27 01:45:46
- 操作内容：
  - `src\shared\commands.ts` 新增只读命令 `item.get`，输入字段为 `zoteroItemKey`。
  - `src\zotero-plugin\bootstrap.js` 新增 direct HTTP `item.get` 分支和 `readItemDetails()`。
  - `readItemDetails()` 通过 Zotero runtime item 对象读取 `toJSON({ skipStorageProperties: true })`、title、firstCreator、year、tags、collectionKeys、attachmentKeys 和 noteKeys。
  - 插件版本提升到 `0.1.30`，同步 `bootstrap.ts`、`manifest.json`、README、spec、manual acceptance、开发安装验收文档和任务总览。
- 测试结果：
  - `npm run typecheck`：通过。
  - `npm run lint`：通过。
  - `npm run test -- tests/unit/shared/commands.test.ts tests/unit/zotero-plugin/pluginPackage.test.ts tests/unit/mcp-server/toolRegistry.test.ts`：通过，3 个测试文件、16 个测试。
  - `npm run test`：通过，17 个测试文件、61 个测试。
  - `npm run build`：通过。
  - `npm run build:zotero-plugin`：通过。
  - XPI 展开检查通过：`manifest.json` 版本为 `0.1.30`，包内包含 `commandName === "item.get"`、`readItemDetails` 和 `item.toJSON`。
  - 包内不含 `__ZOTERO_CODEX_BRIDGE_PROJECT_ROOT__` 占位符，不含 `__ZOTERO_CODEX_BRIDGE_AUTH_TOKEN__`，不含 `eraseTx`。
  - 安全边界搜索通过：仅命中文档中的禁止项、调查记录和验证命令，未命中源码实现或依赖配置。
- 备注：自动验证和 XPI 打包已完成；runtime 验收需要用户安装重启 `0.1.30` 后继续执行 `item.get` 读取 Item A/Item B title。
- runtime 验收：
  - 用户安装重启 `0.1.30` 后，health 返回 `zotero-codex-bridge ok 0.1.30 zotero-codex-bridge@example.com test`。
  - `item.get` 读取 Item A key `7N4QZKCM` 成功，title 为 `Zotero Codex Bridge Test Item A`，itemType 为 `document`，noteKeys 包含 `GGQPGKYF`。
  - `item.get` 读取 Item B key `K7P8J5XF` 成功，title 为 `Zotero Codex Bridge Test Item B`，itemType 为 `document`，attachmentKeys 包含 `FQ8474SV`。
  - Item A/Item B 的 key 映射已用 title 直接核验，不再依赖 `collection.getItems` 返回顺序推断。
- 备注：本步骤完成。

### 步骤 10AF - item.search 与 attachment.get 只读上下文补齐

计划：
- 目标文件：
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\shared\commands.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\bootstrap.js`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\bootstrap.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\manifest.json`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\unit\shared\commands.test.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\unit\zotero-plugin\pluginPackage.test.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\unit\mcp-server\toolRegistry.test.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\README.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\spec-zotero-local-write-mcp.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\integration\manualAcceptance.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\integration\zoteroPluginDevelopmentInstall.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\TaskDocs\任务总览.md`
- 符号变更：
  - shared command table 新增只读命令 `item.search` 和 `attachment.get`。
  - 插件 direct HTTP endpoint 新增 `searchItems()` 和 `readAttachmentDetails()`。
  - 测试插件版本从 `0.1.30` 提升到 `0.1.31`。
- 预期行为：
  - `item.search` 在本地 user library 中按 query、itemType、collectionKey、tag 做只读筛选，默认只返回 top-level regular items，limit 默认 25，最大 50。
  - `attachment.get` 按 attachmentKey 读取附件详情、parent item key、文件路径和附件模式。
  - 两个命令均为只读命令，不需要 dry-run 或 confirmation，不写 audit。
  - 不使用 Zotero Web API，不直接写 SQLite，不支持 group library。
- 测试命令：
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test -- tests/unit/shared/commands.test.ts tests/unit/zotero-plugin/pluginPackage.test.ts tests/unit/mcp-server/toolRegistry.test.ts`
  - `npm run test`
  - `npm run build`
  - `npm run build:zotero-plugin`
  - XPI 展开检查 `0.1.31`、`item.search`、`attachment.get`、`searchItems`、`readAttachmentDetails`。
  - runtime health、`item.search` 查询 Item A/Item B、`attachment.get` 查询 `FQ8474SV`。
- 通过标准：
  - 自动验证和 XPI 打包通过。
  - `dist\zotero-codex-bridge.xpi` 版本为 `0.1.31`。
  - 用户安装重启后，`item.search` 能按 title 找到测试条目，`attachment.get` 能读取当前测试附件详情。

执行：
- 开始时间：2026-06-27 11:54:00
- 结束时间：2026-06-27 11:59:21
- 操作内容：
  - `src\shared\commands.ts` 新增只读命令 `item.search` 和 `attachment.get`。
  - `src\zotero-plugin\bootstrap.js` 新增 direct HTTP `item.search` 和 `attachment.get` 分支。
  - 新增 `searchItems()`，通过 `Zotero.Items.getAll(Zotero.Libraries.userLibraryID, true, false, false)` 读取本地 user library 顶层 item，并按 query、itemType、collectionKey、tag、limit 筛选。
  - 新增 `readAttachmentDetails()`，复用 `attachmentRecord()` 按 attachmentKey 读取单附件详情并返回 parent item key。
  - 插件版本提升到 `0.1.31`，同步 `bootstrap.ts`、`manifest.json`、README、spec、manual acceptance、开发安装验收文档和任务总览。
- 测试结果：
  - `npm run typecheck`：通过。
  - `npm run lint`：通过。
  - `npm run test -- tests/unit/shared/commands.test.ts tests/unit/zotero-plugin/pluginPackage.test.ts tests/unit/mcp-server/toolRegistry.test.ts`：通过，3 个测试文件、16 个测试。
  - `npm run test`：通过，17 个测试文件、61 个测试。
  - `npm run build`：通过。
  - `npm run build:zotero-plugin`：通过。
  - XPI 展开检查通过：`manifest.json` 版本为 `0.1.31`，包内包含 `commandName === "item.search"`、`commandName === "attachment.get"`、`searchItems`、`readAttachmentDetails` 和 `Zotero.Items.getAll`。
  - 包内不含 `__ZOTERO_CODEX_BRIDGE_PROJECT_ROOT__` 占位符，不含 `__ZOTERO_CODEX_BRIDGE_AUTH_TOKEN__`，不含 `eraseTx`。
  - 安全边界搜索通过：仅命中文档中的禁止项、调查记录和验证命令，未命中源码实现或依赖配置。
- 备注：自动验证和 XPI 打包已完成；runtime 验收需要用户安装重启 `0.1.31` 后继续执行 `item.search` 和 `attachment.get`。
- runtime 验收：
  - 用户安装重启 `0.1.31` 后，health 返回 `zotero-codex-bridge ok 0.1.31 zotero-codex-bridge@example.com test`。
  - `item.search` 使用 query `Zotero Codex Bridge Test Item`、collectionKey `L6UP7MHT`、itemType `document` 返回 2 条结果：`Zotero Codex Bridge Test Item A` 和 `Zotero Codex Bridge Test Item B`。
  - `attachment.get` 读取 `FQ8474SV` 成功，parent 为 `K7P8J5XF`，filename 为 `Zotero Codex Bridge Test Item B.pdf`，attachmentMode 为 `copy`，filePath 指向测试 `ZoteroData\storage\FQ8474SV\`。
- 备注：本步骤完成。

### 步骤 10AG - linked attachment 写入与 undo runtime 验收

计划：
- 目标文件：
  - 不修改源码。
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\TaskDocs\Zotero本地写入MCP项目实施计划日志.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\TaskDocs\任务总览.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\integration\zoteroTestProfile.md`
- 符号变更：
  - 无。
- 预期行为：
  - 使用现有 `attachment.addFile` linked 模式给 Item A 添加 `tests\fixtures\attachments\sample-page.html`。
  - dry-run 必须返回 linked file 路径风险 warning。
  - execute 创建 linked attachment，`attachment.get` 返回 `attachmentMode: "linked"` 和原 fixture 路径。
  - 使用 `attachment.undoAdded` 将该临时 linked attachment 移入 Zotero trash；Item A 默认附件列表不再包含它。
- 测试命令：
  - direct HTTP `attachment.addFile` dry-run/execute。
  - direct HTTP `attachment.get`。
  - direct HTTP `attachment.undoAdded` dry-run/execute。
  - direct HTTP `attachment.getForItem`。
  - direct HTTP `audit.list`。
- 通过标准：
  - `attachment.addFile` dry-run 返回 `LINKED_FILE_PATH_RISK`。
  - execute 返回 linked attachment key。
  - undo 后 Item A 默认附件列表不包含该 key。
  - audit 记录 linked add 和 undo 的 dry-run/execute planId。

执行：
- 开始时间：2026-06-27 12:08:40
- 结束时间：2026-06-27 12:10:00
- 操作内容：
  - 使用 `attachment.addFile` linked 模式添加 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\fixtures\attachments\sample-page.html` 到 Item A `7N4QZKCM`。
  - 使用 `attachment.get` 读取新 linked attachment。
  - 使用 `attachment.undoAdded` 撤销该临时 linked attachment。
  - 使用 `attachment.getForItem` 复核 Item A 默认附件列表。
  - 使用 `audit.list` 复核审计记录。
- 测试结果：
  - `attachment.addFile` dry-run 通过，planId 为 `plan_mqvubuvp_re44670dr1g`，warning code 为 `LINKED_FILE_PATH_RISK`。
  - execute 通过，新 linked attachment key 为 `EJENB9Q3`。
  - `attachment.get` 读取 `EJENB9Q3` 通过，parent 为 `7N4QZKCM`，attachmentMode 为 `linked`，filePath 为 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\fixtures\attachments\sample-page.html`。
  - `attachment.undoAdded` dry-run 通过，planId 为 `plan_mqvubvq1_ng6knfvgtpq`。
  - `attachment.undoAdded` execute 通过。
  - undo 后 `attachment.getForItem` 读取 Item A，`EJENB9Q3` 出现次数为 0。
  - `audit.list` 读取到 `req_attachment_add_linked_dry_031`、`req_attachment_add_linked_exec_031`、`req_attachment_undo_linked_dry_031`、`req_attachment_undo_linked_exec_031`，状态分别为 `dry-run`、`executed`、`dry-run`、`executed`，planId 分别对应上述 add 和 undo plan。
- 备注：本步骤只创建并撤销临时 linked attachment；没有删除 fixture 源文件，没有触碰真实主库。

### 步骤 11 - 文档、AGENTS 与使用说明同步

计划：
- 目标文件：
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\README.md`
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\AGENTS.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\spec-zotero-local-write-mcp.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\TaskDocs\任务总览.md`
- 符号变更：
  - 无代码符号。
  - 文档记录安装、构建、测试、profileMode、dry-run、confirmation、backup、undo、安全边界。
- 预期行为：
  - 项目文档与实现命令、边界、验收流程保持一致。
  - `AGENTS.md` 明确禁止 Web API、`ZOTERO_API_KEY`、SQLite 写入、真实主库第一阶段写入、任意 JS eval。
- 测试命令：
  - `rg "ZOTERO_API_KEY|api.zotero.org|sqlite write|任意 JS eval" README.md AGENTS.md docs TaskDocs`
  - 人工检查 `README.md`、`AGENTS.md`、`docs\`、`TaskDocs\` 中不存在未填条目。
- 通过标准：
  - 文档无未填内容。
  - 文档边界与 spec 一致。
  - 任务总览链接到本实施计划日志。

执行：
- 开始时间：2026-06-26 12:40:40
- 结束时间：2026-06-26 12:42:20
- 操作内容：
  - 新增 `README.md`，记录项目定位、当前状态、安全边界、测试命令和关键文件。
  - 新增 `AGENTS.md`，记录 agent 执行边界、test profile 目录、写操作门控、开发流程和验证命令。
  - 更新 `TaskDocs\任务总览.md`，将状态从等待实现同步为步骤 1-9 已完成、第 10 步进行中、第 11 步文档同步中。
  - 更新 `docs\spec-zotero-local-write-mcp.md`，补充当前 `ZoteroProfile\`、`ZoteroVault\`、`ZoteroData\` 测试目录和排除要求。
- 测试结果：通过。
  - `npm run test`：通过，14 个测试文件、48 个测试通过。
  - `npm run build`：通过。
  - `npm run typecheck`：通过。
  - `npm run lint`：通过。
  - `rg "ZOTERO_API_KEY|api\.zotero\.org|zotero\.sqlite|sqlite write|任意 JS eval" src tests package.json README.md AGENTS.md -g '!node_modules/**' -g '!dist/**' -g '!ZoteroProfile/**' -g '!ZoteroVault/**' -g '!ZoteroData/**'`：仅命中 README、AGENTS 和手工验收文档中的禁止项说明，未命中源码实现或依赖配置。
- 备注：第 11 步文档已同步当前实现状态；`tests\integration\zoteroTestProfile.md` 中 Item A/Item B 的 Zotero item key 需要在后续真实 Zotero UI 手工 seed item 后填写。

### 步骤 12 - Codex skill 设计与集成

计划：
- 目标文件：
  - 后续 skill 目录由用户确认后确定。
  - 计划候选：`C:\Users\chenl\.codex\skills\zotero-local-manager\SKILL.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\spec-zotero-local-write-mcp.md`
- 符号变更：
  - 无项目代码符号。
  - 定义 Codex 侧工作流：查询、dry-run、确认、执行、审计检查、undo。
- 预期行为：
  - Codex 能以稳定中文流程调用 MCP tools。
  - Codex 不绕过 dry-run 和 confirmation。
  - Codex 不直接触碰 Zotero 主库或 Web API。
- 测试命令：
  - 使用 3 到 5 个真实 prompt 在 test profile 中演练。
  - 检查每次执行都有 audit 记录。
- 通过标准：
  - skill 调用流程覆盖 collection、attachment、tag、note 的典型管理任务。
  - skill 明确遇到删除、merge duplicates、真实主库写入时停止并要求用户确认后续阶段。

执行：
- 开始时间：未开始
- 结束时间：未开始
- 操作内容：未开始
- 测试结果：未开始
- 备注：按用户要求，skill 等绝大部分功能和接口稳定后再实现。

## 最终结果

当前结果：

- 已完成步骤 1-9 的 TypeScript 工程、shared schema、插件命令注册层、MCP dry-run/confirmation/audit/backup/undo/tool registry。
- 已完成步骤 10A 的 XPI 打包与 Zotero 9.0.5 bootstrap/connector endpoint 形态修正，当前测试包版本为 `0.1.15`。
- 已完成步骤 10B 的测试 profile 文档、marker 和 fixture 准备；完整 Zotero UI 手工验收因官方规范复审后移。
- 已完成步骤 10C 的官方规范复审与计划门槛修订。
- 步骤 10D 已完成：开发加载路径文档已建立，用户已在 `ZoteroCodexBridgeTest` 中确认 health endpoint 返回 200 OK。
- 本轮计划修订后的常规验证通过：`npm run test`、`npm run build`、`npm run typecheck`、`npm run lint`、`npm run build:zotero-plugin`。
- 已在 `0.1.7` 中接入只读 `collection.getTree` runtime probe。
- 已在 `0.1.8` 中接入 `collection.create` 的 token + dry-run + confirmation 最小写入闭环。
- 已在 `0.1.9` 中修正缺失 confirmation 的 execute 错误语义。
- 已在 `0.1.10` 中接入 `collection.rename` 和 `collection.move` 的 token + dry-run + confirmation 最小写入闭环。
- 已在 `0.1.11` 中将所有 collection 写命令 execute 的 confirmation 缺失校验提前到输入解析和 Zotero 查找之前。
- 已在 `0.1.12` 中接入 `collection.getItems`、`collection.addItems`、`collection.removeItems` 的 runtime 路径，并修正 membership dry-run confirmation hash。
- 已在 `0.1.13` 中接入并 runtime 验证 `item.updateTags` 的添加/移除 tag 闭环。
- 已在 `0.1.14` 中修复 health endpoint 版本响应硬编码问题，自动验证和 XPI 打包通过。
- 已在 `0.1.15` 中接入并 runtime 验证 `note.createChild` 的 dry-run/execute 闭环，新 note key 为 `GGQPGKYF`。
- 已在 `0.1.16` 中接入并 runtime 验证 `attachment.getForItem` 只读路径，Item A 当前附件数为 0。
- 已在 `0.1.17` 中接入并 runtime 验证 `attachment.addFile` copy dry-run/execute 闭环，新 attachment key 为 `FQ8474SV`；重复添加默认 skip 通过。
- 已在 `0.1.18` 中接入并 runtime 验证 `attachment.moveToItem` dry-run/execute 闭环，附件 `FQ8474SV` 已从 Item A 移动到 Item B。
- 已在 `0.1.20` 中打包并 runtime 验证 `attachment.rename`、`attachment.runZoteroRename`、`attachment.renamePreferences.get` 和 `attachment.renamePreferences.set`；附件 `FQ8474SV` 当前文件名为 `Zotero Codex Bridge Test Item B.pdf`。
- 已在 `0.1.22` 中 runtime 验证 direct HTTP 写命令审计 JSONL 和 `audit.list`，dry-run、execute、failed 审计路径可用，execute 审计记录能携带对应 dry-run `planId`。
- 已在 `0.1.23` 中 runtime 验证 `backup.settings.get/set`，项目本地 backup 设置文件读写、dry-run/execute 与 audit planId 对齐通过。
- 已在 `0.1.24` 中 runtime 验证 `attachment.undoAdded`，新增附件 `BGHZTWLZ` 被移入 Zotero trash，默认附件列表不再显示，且未永久 `eraseTx()` 删除。
- 已在 `0.1.25` 中完成 `audit.list` 返回 `events` 字段的自动验证和 runtime 验收，`data.events` 可读取 `attachment.undoAdded` 审计记录。
- 已在 `0.1.26` 中完成 attachment 文件重命名前 backup snapshot 的自动验证和 runtime 验收，`attachment.rename` 与 `attachment.runZoteroRename` 均能在重命名前生成项目本地 backup 文件和 manifest。
- 已在 `0.1.27` 中完成 `backup.snapshot.list` 自动验证和 runtime 验收，可列出 `0.1.26` 生成的两个 snapshot manifest。
- 已在 `0.1.28` 中完成 `backup.snapshot.restore` 自动验证和 runtime 验收，路径匹配 snapshot 可 dry-run/execute 恢复到同一 attachment 当前文件路径。
- 已在 `0.1.29` 中完成 `backup.snapshot.prune` 自动验证和 runtime 验收，默认策略下 deleteCount 为 0，现有 snapshot 未被删除。
- 已在 `0.1.30` 中完成只读 `item.get` 自动验证和 runtime 验收，已核验 Item A/Item B title 映射。
- 已在 `0.1.31` 中完成只读 `item.search` 和 `attachment.get` 自动验证和 runtime 验收，已搜索到 Item A/Item B 并读取 `FQ8474SV`。
- 已完成 linked file 模式 `attachment.addFile` runtime 验收，临时 linked attachment `EJENB9Q3` 已通过 `attachment.undoAdded` 移入 Zotero trash。
- 已在 `ZoteroCodexBridgeTest` 中真实创建测试 collection `Codex Bridge Acceptance`，collection key 为 `L6UP7MHT`。
- backup snapshot prune 的默认无删除项路径和受控真实删除旧 snapshot 路径均已通过；真实验收 snapshot 未删除。

下一步：

- 步骤 10E 已完成，用户已验证 `0.1.6` health 和未鉴权 command 401。
- 步骤 10F 已完成，collection read/create source audit 已记录。
- 步骤 10G 已完成本轮修订范围：用户已验证 `0.1.7` 只读 `collection.getTree`。
- 步骤 10H 已完成自动验证，用户已通过 PowerShell 验证 `0.1.8` 的 health、错误 token、只读 tree、`collection.create` dry-run 和 execute。
- 步骤 10I 已完成自动验证，下一步需要用户安装重启 `0.1.9` 后复测缺 confirmation execute 返回 `CONFIRMATION_REQUIRED`。
- 步骤 10J 已完成自动验证，MCP 侧 audit JSONL 与 collection.create undo 清单已接入。
- 步骤 10K 已完成自动验证，下一步需要用户安装重启 `0.1.10` 后验证 collection.create/rename/move runtime 行为。
- 步骤 10L 已完成自动验证和 runtime 复测，用户已通过 PowerShell 验证 `0.1.10` 的 create subcollection、rename、move；本轮已通过 PowerShell 验证已安装 `0.1.11` 的 create/rename/move 缺 confirmation 均优先返回 `CONFIRMATION_REQUIRED`。
- 步骤 10M 已完成自动验证和 runtime 写入验收，用户已安装 `0.1.12`，本轮验证 health、`collection.getTree`、`collection.getItems`、`collection.removeItems`、`collection.addItems` 均通过；两个测试 item keys 已记录到 `tests\integration\zoteroTestProfile.md`。
- 步骤 10N 已完成自动验证和 runtime 写入验收，`item.updateTags` 添加/移除 tag 通过；补测发现 health 仍返回 `0.1.12`。
- 步骤 10O 已完成自动验证和 runtime 复测，health 正确返回 `0.1.14`。
- 步骤 10P 已完成自动验证和 runtime 写入验收，`note.createChild` 创建 child note 通过；Zotero UI 可见性可由用户手工复核。
- 步骤 10Q 已完成自动验证和 runtime 只读验收，`attachment.getForItem` 读取 Item A 附件列表通过。
- 步骤 10R 已完成自动验证和 runtime 写入验收，`attachment.addFile` copy 模式添加 sample PDF 通过；linked 模式可在后续补测。
- 步骤 10S 已完成自动验证和 runtime 写入验收，`attachment.moveToItem` 移动 sample PDF 到 Item B 通过。
- 步骤 10U 已完成自动验证和 runtime 写入验收，`attachment.rename` title/file rename、`attachment.runZoteroRename`、`attachment.renamePreferences.get/set` 均通过。
- 步骤 10V 已完成自动验证和 runtime 验收，`0.1.22` direct HTTP audit JSONL 与 `audit.list` 通过。
- 步骤 10W 已完成自动验证和 runtime 验收，`0.1.23` direct HTTP backup settings 读写通过。
- 步骤 10X 已完成自动验证和 runtime 验收，`0.1.24` 的 `attachment.undoAdded` 行为通过；验收中发现 `audit.list` 返回字段兼容问题。
- 步骤 10Y 已完成自动验证和 runtime 验收，`audit.list` 的 `data.events` 可读取 `attachment.undoAdded` 审计记录。
- 步骤 10Z 已完成自动验证和 runtime 验收，`attachment.rename` 与 `attachment.runZoteroRename` 在文件重命名前生成项目本地 backup snapshot 通过。
- 步骤 10AA 已完成自动验证和 runtime 验收，`backup.snapshot.list` 能列出 `0.1.26` 生成的 snapshot manifest。
- 步骤 10AB 已完成自动验证和 runtime 验收，`backup.snapshot.restore` 严格同路径恢复通过。
- 步骤 10AC 已完成自动验证和 runtime 验收，默认策略下 `backup.snapshot.prune` 返回 0 个删除项且不删除现有 snapshot。
- 步骤 10AD 已完成 runtime 验收，`backup.snapshot.prune` 可删除临时旧 snapshot，且保留真实验收 snapshot。
- 步骤 10AE 已完成自动验证和 runtime 验收，`item.get` 可读取 Item A/Item B title。
- 步骤 10AF 已完成自动验证和 runtime 验收，`item.search` 和 `attachment.get` 通过。
- 步骤 10AG 已完成 runtime 验收，linked file add 与 undo 通过。
