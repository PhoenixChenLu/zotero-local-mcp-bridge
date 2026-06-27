# 任务上下文

创建时间：2026-06-25 22:40:21

我将使用 plan-led-delivery-logbook 工作流来完成这个任务。

## 范围与非目标

范围：

- 核实“现有生态是否已经支持 Zotero 本地写和管理 MCP”的调查结论。
- 使用 spec-driven-development 将项目需求具体化。
- 生成本项目第一版任务计划，并把计划和证据记录在 `TaskDocs/`。

非目标：

- 本轮不写 Zotero 插件代码。
- 本轮不启动或修改 Zotero Desktop。
- 本轮不直接修改、移动或版本控制 `L:\PaperVault\zotero-data`。
- 本轮不导入、删除、移动真实 Zotero item。

## 涉及文件与符号

目标文件：

- 新建：`H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\zotero-mcp-ecosystem-investigation.md`
- 新建：`H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\spec-zotero-local-write-mcp.md`
- 新建：`H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\TaskDocs\任务总览.md`
- 新建：`H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\TaskDocs\Zotero本地写入MCP项目规划日志.md`

符号级别意图：

- 本轮为文档规划任务，不修改代码符号。
- 后续实现阶段才会定义 Zotero 插件、MCP server、tool schema 和测试符号。

## 实施步骤

### 步骤 1 - 本地项目边界读取

计划：

- 目标文件：`H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\README.md`、`H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\AGENTS.md`、`H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\zotero-plugin-assessment.md`
- 符号变更：无。
- 预期行为：确认本项目是独立 PaperVault 项目，`zotero-data/` 为 Zotero 托管状态，当前 `@zotero` 插件按 read-oriented 能力处理。
- 测试命令：`Get-Content` 读取上述文件；`git status --short` 检查仓库状态。
- 通过标准：能明确本轮文档落点，不触碰 `zotero-data/`。

执行：

- 开始时间：2026-06-25 22:40:21
- 结束时间：2026-06-25 22:40:21
- 操作内容：读取 `README.md`、`AGENTS.md`、`docs/zotero-plugin-assessment.md`，列出仓库根目录，检查 Git 状态。
- 测试结果：通过。仓库已有 `docs/`、`notes/`、`references/`、`exports/`、`papers/`、`zotero-data/`；所有项目文件当前为未跟踪状态；`zotero-data/` 明确为 Zotero 托管。
- 备注：本轮只新增文档和任务计划。

### 步骤 2 - 公开生态调查

计划：

- 目标文件：`H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\zotero-mcp-ecosystem-investigation.md`
- 符号变更：无。
- 预期行为：核实 GitHub、Zotero 官方文档、Zotero Forums、公开 MCP 聚合页中是否已有 Zotero 写入或管理方案。
- 测试命令：使用 web/firecrawl 搜索并打开相关来源。
- 通过标准：至少覆盖官方 API/插件生态、local API 限制、Zotero JS API、本地/远程 MCP 项目，并给出修正后的调查结论。

执行：

- 开始时间：2026-06-25 22:40:21
- 结束时间：2026-06-25 22:40:21
- 操作内容：检索并阅读 Zotero 官方插件文档、Zotero Web API write requests、Zotero JavaScript API、Zotero local API write access 讨论、`54yyyu/zotero-mcp`、`cookjohn/zotero-mcp`、`cli-anything-zotero`、MCP for Zotero 论坛发布。
- 测试结果：通过。调查结论已写入 `docs/zotero-mcp-ecosystem-investigation.md`。
- 备注：原调查结论需要修正为“已有相关项目，但仍缺少完全匹配本机 Windows + Codex + 可审计本地写入工作流的已验证方案”。

### 步骤 3 - 初始需求规格化

计划：

- 目标文件：`H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\spec-zotero-local-write-mcp.md`
- 符号变更：无。
- 预期行为：按 spec-driven-development 写出 Objective、Tech Stack、Commands、Project Structure、Code Style、Testing Strategy、Boundaries、Success Criteria、Open Questions。
- 测试命令：人工检查规格文件是否覆盖上述章节且无 `TBD`/`TODO` 占位符。
- 通过标准：规格文件能支持下一轮架构决策和实现拆分。

执行：

- 开始时间：2026-06-25 22:40:21
- 结束时间：2026-06-25 22:40:21
- 操作内容：新建初始规格文件，明确本项目定位、边界、命令、结构、测试策略和成功标准。
- 测试结果：通过。规格文件已创建，无 `TBD`/`TODO` 占位符。
- 备注：MCP transport、是否 fork 现有项目、测试 Zotero profile 仍列为开放问题，需用户确认后进入实现。

### 步骤 4 - 任务计划落地

计划：

- 目标文件：`H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\TaskDocs\任务总览.md`、`H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\TaskDocs\Zotero本地写入MCP项目规划日志.md`
- 符号变更：无。
- 预期行为：建立 plan-led-delivery-logbook 活文档入口，记录已执行调查、规格和后续任务计划。
- 测试命令：`Test-Path` 检查文件存在；`rg "TBD|TODO" TaskDocs docs` 检查占位符；`git status --short` 查看新增文件。
- 通过标准：`TaskDocs/任务总览.md` 链接到具体任务日志，具体任务日志包含计划、执行、测试和结果。

执行：

- 开始时间：2026-06-25 22:40:21
- 结束时间：2026-06-25 22:40:21
- 操作内容：新建 `TaskDocs/任务总览.md` 和本日志文件。
- 测试结果：通过。`Test-Path` 确认 4 个新增文档均存在；`git status --short` 显示新增 `TaskDocs/` 和 `docs/`；`rg "TBD|TODO" TaskDocs docs` 只命中日志中记录检查命令和检查标准的文字，不存在未填占位内容。
- 备注：验证未触碰 `zotero-data/`。

## 后续任务计划

### 阶段 1 - 现有方案实测与架构决策

计划：

- 目标文件：`H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\zotero-mcp-ecosystem-investigation.md`、`H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\spec-zotero-local-write-mcp.md`
- 符号变更：无。
- 预期行为：在隔离测试 Zotero profile 中分别验证 `cookjohn/zotero-mcp`、`54yyyu/zotero-mcp`、`cli-anything-zotero` 的安装、Codex 连接、写操作、dry-run/审计能力。
- 测试命令：
  - `git clone <candidate>`
  - `npm install`
  - `npm run build`
  - `pip install <candidate>`
  - Codex MCP 连接测试命令按候选项目文档补充。
- 通过标准：形成 fork/适配/自研决策表，明确一个主路径和一个备选路径。

执行：

- 开始时间：未开始。
- 结束时间：未开始。
- 操作内容：未开始。
- 测试结果：未开始。
- 备注：执行前需确认是否允许在本机安装候选项目依赖，以及是否创建 Zotero 测试 profile。

### 阶段 2 - 最小可行 tool schema 设计

计划：

- 目标文件：`H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\spec-zotero-local-write-mcp.md`、后续 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\shared\`
- 符号变更：定义 `zotero_collection_create`、`zotero_collection_add_items`、`zotero_item_update_tags`、`zotero_item_get`、`zotero_audit_list` 等最小 tool schema。
- 预期行为：所有写 tool 默认 `dryRun=true`，返回 planned changes；只有显式 `dryRun=false` 才执行写入。
- 测试命令：schema unit tests，MCP contract tests。
- 通过标准：schema 可表达最小闭环写操作，且所有 key 类型明确。

执行：

- 开始时间：未开始。
- 结束时间：未开始。
- 操作内容：未开始。
- 测试结果：未开始。
- 备注：阶段 1 决策后再进入。

### 阶段 3 - Zotero 插件最小闭环

计划：

- 目标文件：后续 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\`
- 符号变更：实现插件侧 collection/tag/item 写操作 adapter、参数校验、审计事件输出。
- 预期行为：插件能在测试 profile 中创建 collection、添加/移除 tag、把 item 加入 collection。
- 测试命令：`npm run build`、Zotero 测试 profile 手工验收。
- 通过标准：Zotero UI 中能看到操作结果，审计日志有完整记录。

执行：

- 开始时间：未开始。
- 结束时间：未开始。
- 操作内容：未开始。
- 测试结果：未开始。
- 备注：不得使用真实主库做首次写入测试。

### 阶段 4 - 外部 MCP server 与 Codex 接入

计划：

- 目标文件：后续 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\mcp-server\`
- 符号变更：实现 MCP server tool handlers、transport、插件通信 client、错误码映射。
- 预期行为：Codex 能通过本机 MCP 调用 dry-run 和执行流程。
- 测试命令：MCP inspector 或 Codex MCP 本机连接测试；`npm run test`。
- 通过标准：Codex 可列出 tools、调用 dry-run、在测试 profile 中执行最小写操作。

执行：

- 开始时间：未开始。
- 结束时间：未开始。
- 操作内容：未开始。
- 测试结果：未开始。
- 备注：transport 选择需先确认 Codex 当前支持能力。

### 阶段 5 - Skill 与文档集成

计划：

- 目标文件：后续 skill 文件、`README.md`、`AGENTS.md`、`docs/`
- 符号变更：无或后续按 skill 结构定义。
- 预期行为：Codex 有稳定中文调用流程，能区分查询、dry-run、写入确认、审计检查。
- 测试命令：按真实示例 prompt 进行端到端试运行。
- 通过标准：用户能用自然语言安全完成 Zotero 管理任务，并可查看每次写入证据。

执行：

- 开始时间：未开始。
- 结束时间：未开始。
- 操作内容：未开始。
- 测试结果：未开始。
- 备注：实现完成前不宣称可管理真实主库。

## 最终结果

本轮已完成：

- 修正公开生态调查结论。
- 生成初始需求规格。
- 建立 `TaskDocs/` 任务总览和本任务日志。
- 追加 `cli-anything-zotero` 深入调查：确认其当前主线更接近 CLI/SDK-first，本地写操作大量通过 Zotero JS Bridge 完成，但 MCP 线冻结在 `v0.9.5`，且 `item move-to-collection` 仍强制 experimental SQLite 直写。

本轮未完成：

- 未进行候选项目本机实测。
- 未创建 Zotero 测试 profile。
- 未开始插件或 MCP server 代码实现。

## 追加调查 - cli-anything-zotero

### 步骤 5 - cli-anything-zotero 功能核查

计划：

- 目标文件：`H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\zotero-mcp-ecosystem-investigation.md`
- 符号变更：无。
- 预期行为：核查 `cli-anything-zotero` 是否满足本项目“本地操控 Zotero collection/item/tag/metadata，并可供 Codex 使用”的需求。
- 测试命令：
  - `git clone --depth 1 https://github.com/PiaoyangGuohai1/cli-anything-zotero.git <temp>`
  - `rg "collection create|add-to-collection|move-to-collection|remove-item|rename|delete|JS Bridge|experimental|sqlite" -n .`
  - 读取 `docs/COMMANDS.md`、`ZOTERO.md`、`cli_anything/zotero/zotero_cli.py`、`cli_anything/zotero/core/jsbridge.py`、`cli_anything/zotero/core/experimental.py`、`cli_anything/zotero/plugin/zotero-cli-bridge/bootstrap.js`
- 通过标准：能明确列出功能覆盖、后端路径、MCP 维护状态和与本项目边界冲突的点。

执行：

- 开始时间：2026-06-25 22:40:21
- 结束时间：2026-06-25 22:40:21
- 操作内容：将候选项目浅克隆到 `C:\Users\chenl\AppData\Local\Temp\cli-anything-zotero-investigation`；检查 README、命令文档和核心源码。
- 测试结果：通过。已确认 `collection create`、`item add-to-collection`、`collection remove-item`、`collection rename`、`collection delete` 当前可走 JS Bridge；`item move-to-collection` 强制 experimental SQLite；MCP 支持冻结在 `v0.9.5`，当前主线推荐 `zotero-cli`。
- 备注：该项目适合作为近期候选基座，但不能直接视为完整满足本项目长期 MCP 与审计要求。
