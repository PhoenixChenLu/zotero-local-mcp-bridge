# 任务上下文

创建时间：2026-06-27 12:28:20

我将使用 plan-led-delivery-logbook 工作流来完成这个任务。

本日志接替 [Zotero本地写入MCP项目实施计划日志.md](Zotero本地写入MCP项目实施计划日志.md)。旧日志只保留为第一阶段内部验收历史，不再继续更新；后续以开源公开发布、Zotero 插件公开分发、MCP server 公开发布和最终尽量完整覆盖 Zotero 本地管理能力为目标。

## 项目来源与历史进程

本项目源于对现有 Zotero MCP 生态的调查。公开项目中常见方案要么依赖 Zotero Web API 写入，要么直接读取或写入 `zotero.sqlite`，要么没有通过 Zotero 插件内部命令表执行写操作，均不满足本项目边界。用户明确要求：

- 必须通过 Zotero 插件内部命令实现。
- 不使用 Zotero Web API 写入。
- 不要求、保存或读取 `ZOTERO_API_KEY`。
- 不直接写 `zotero.sqlite`。
- 不暴露任意 JavaScript eval。
- 第一阶段只使用隔离测试 profile，不能连接真实主库写操作。

第一阶段已经形成 `0.1.31` 内部验收版本，并在 `ZoteroCodexBridgeTest` 中完成 runtime 验收。已具备：

- collection/subcollection 创建、重命名、移动、读取 tree。
- collection item membership 添加/移除。
- item 读取、搜索、tag 更新。
- child note 创建。
- attachment copy 写入、linked file 写入、单附件读取、item 附件列表读取、附件移动、附件 title/file rename、Zotero 内置自动重命名。
- attachment rename preferences 读写。
- audit list 与项目本地 JSONL 审计。
- backup settings、snapshot list、strict same-path restore、retention prune。
- attachment.undoAdded，用 Zotero trash 撤销本插件刚添加的附件，不永久删除。
- 本机 connector server endpoint、token 鉴权、dry-run + confirmation、test profile marker 守卫。

第一阶段的核心验收数据记录在：

- `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\TaskDocs\Zotero本地写入MCP项目实施计划日志.md`
- `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\integration\zoteroTestProfile.md`
- `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\integration\manualAcceptance.md`
- `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\integration\zoteroPluginDevelopmentInstall.md`

## 开源公开发布目标

本阶段目标不是继续做一次本机测试包，而是把项目推进到可以公开审阅、安装、升级、卸载和长期维护的发布形态。

公开发布目标分为两条线：

1. Zotero 插件公开分发。
   - Zotero 当前没有可直接上传的官方插件库；官方插件目录仍属于计划中能力。
   - 现实公开路径应是 GitHub release、项目主页、Zotero Forums 公告、稳定 update manifest。
   - 插件必须去除本机测试路径假设，提供生产配置、隐私说明、安全说明、更新通道和兼容矩阵。

2. MCP server 公开发布。
   - MCP server 需要以 npm 包或等价 artifact 发布。
   - 需要 `mcpName`、`server.json`、stdio 启动入口、安装说明、registry metadata。
   - MCP Registry 只发布 metadata，不托管 artifact，因此必须先完成 npm/package 发布。

发布版必须让普通用户可以理解：

- 插件能对本地 Zotero 执行写操作。
- 写操作仍必须 dry-run + confirmation。
- 默认应以只读或安全模式启动。
- 真实主库写入必须有显式解锁和清晰风险提示。
- 删除、merge duplicates、高风险批量操作必须分阶段、强确认、可审计、可恢复。

## 最终功能目标

最终版本中要包含第一阶段尚未满足的功能：

- 还没有 item 创建/完整元数据编辑。
- 还没有 BibTeX/RIS/CSL 等导入导出。
- 还没有 PDF annotation 读取/写入。
- 还没有高级搜索、保存搜索、引用格式输出等更完整 Zotero 能力。
- 还没有真实主库解锁流程。
- 还没有 Codex 专用 skill。
- 还没有删除/merge duplicates，这些是第一版明确暂不做。

这些能力必须在不破坏项目硬边界的前提下逐步实现：所有真实写操作仍必须通过 Zotero 插件内部命令表执行，不使用 Web API 写入，不直接写 SQLite，不暴露任意 JS eval，不支持 group library，除非后续单独设计 group library 阶段。

## 范围与非目标

范围：

- 将当前 `0.1.31` 内部测试版迁移为开源公开发布路线图。
- 搬迁旧日志中的未完成内容：Codex skill、真实主库解锁、文档发布、公开包、MCP registry、最终完整 Zotero 功能面。
- 定义发布前的产品化、安全、配置、兼容性、CI、打包、文档、验收、版本策略。
- 定义后续功能阶段：item 创建/编辑、导入导出、annotation、高级搜索、引用输出、真实删除和 merge duplicates。

非目标：

- 本轮不开始实现代码。
- 本轮不修改真实 Zotero 主库。
- 本轮不发布 npm 包、GitHub release 或 MCP registry entry。
- 本轮不创建 Codex skill 文件。

## 2026-06-27 执行顺序修订

用户明确调整后续优先级：从现在起，项目下一阶段不先做发布边缘文件、公开分发准备或 Codex skill，而是先补齐核心 Zotero 功能面。

新的硬性顺序如下：

1. **item 创建和完整元数据编辑。**
2. **BibTeX / RIS / CSL 导入导出。**
3. **PDF annotation 读取/写入。**
4. **高级搜索、保存搜索、引用格式输出。**
5. 上述四组功能全部完成，并且通过单元测试、构建、lint、XPI 打包和 Zotero test profile runtime 验收后，才开始：
   - Zotero 插件公开分发包。
   - MCP server npm 包与 MCP Registry 准备。
   - CI、许可证、变更日志、安全/隐私等边缘发布文件。
   - 兼容矩阵与跨平台发布验收。
   - Codex 专用 skill。
   - 发布候选验收与公开发布。

因此，本日志中原步骤 5-8、14-15 暂时变为**后置阶段**；实际下一步从原步骤 9 开始执行。后续更新时可以保留原编号以减少历史迁移成本，但执行顺序以本节为准。
- 本轮不解除第一阶段 test profile 写入限制。

## 涉及文件与符号

现有关键文件：

- `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\README.md`
- `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\AGENTS.md`
- `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\package.json`
- `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\shared\commands.ts`
- `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\bootstrap.js`
- `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\manifest.json`
- `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\mcp-server\toolRegistry.ts`
- `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\spec-zotero-local-write-mcp.md`
- `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\zotero-api-source-audit.md`
- `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\integration\zoteroTestProfile.md`

计划新增或重构的文件：

- `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\release-readiness.md`
- `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\security.md`
- `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\privacy.md`
- `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\production-profile-unlock.md`
- `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\mcp-publication.md`
- `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\zotero-plugin-publication.md`
- `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\compatibility-matrix.md`
- `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\roadmap-complete-zotero-coverage.md`
- `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\server.json`
- `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\.github\workflows\ci.yml`
- `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\SECURITY.md`
- `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\PRIVACY.md`
- `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\CHANGELOG.md`
- `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\LICENSE`

核心符号或模块意图：

- `ProfileGuard` / `profileMode`：从 test-only 扩展为 production-safe unlock。
- `CommandName` / `COMMAND_DEFINITIONS`：扩展 item、import/export、annotation、citation、delete、merge 等命令。
- `DryRunPlan` / `ConfirmationStore`：保留写操作强制确认，并为高风险操作增强确认等级。
- `AuditLogger` / plugin audit：支持生产配置目录和可导出审计。
- `BackupManager` / plugin backup snapshot：支持真实主库下的可配置备份路径、空间限制、恢复和清理。
- `ZoteroPluginClient` / MCP tools：对外公开稳定 tool schema。
- `server.json` / `mcpName`：MCP Registry metadata。
- `bootstrap.js` / `manifest.json`：公开 XPI 包、update manifest、生产配置。

## 实施步骤

### 步骤 1 - 旧日志冻结与新日志接管

计划：
- 目标文件：
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\TaskDocs\Zotero本地写入MCP项目实施计划日志.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\TaskDocs\任务总览.md`
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\TaskDocs\Zotero本地写入MCP开源公开发布计划日志.md`
- 符号变更：
  - 无代码符号。
  - 文档状态从“内部第一阶段实施日志”迁移到“开源公开发布计划日志”。
- 预期行为：
  - 旧日志顶部明确标注弃用、不再更新，并链接本日志。
  - 任务总览将本日志列为当前主线。
  - 旧日志未完成内容在本日志中有对应计划步骤。
- 测试命令：
  - `rg "不再更新|开源公开发布计划日志" TaskDocs`
  - 人工检查 TaskDocs 链接可读。
- 通过标准：
  - 旧日志和任务总览均能跳转到本日志。
  - 旧日志中未完成的 Codex skill、真实主库解锁、最终功能面已搬入本日志。

执行：
- 开始时间：2026-06-27 12:28:20
- 结束时间：2026-06-27 12:28:20
- 操作内容：
  - 新建本日志。
  - 在 `TaskDocs\Zotero本地写入MCP项目实施计划日志.md` 顶部标注已冻结、不再更新，并链接本日志。
  - 更新 `TaskDocs\任务总览.md`，将旧日志标为历史，将本日志列为当前主线。
  - 将旧日志未完成的真实主库解锁、Codex skill、发布文档、公开包、MCP registry 和完整 Zotero 功能面搬迁到本日志。
- 测试结果：通过。
  - `rg "已冻结|不再更新|开源公开发布计划日志|最终功能缺口|步骤 1 - 旧日志冻结" TaskDocs`：命中新日志、旧日志和任务总览中的迁移标记。
  - 人工检查旧日志顶部冻结说明和任务总览链接。
- 备注：本步骤只做文档迁移，不改源码。

### 步骤 2 - 发布版需求冻结与安全边界审查

计划：
- 目标文件：
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\release-readiness.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\spec-zotero-local-write-mcp.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\README.md`
- 符号变更：
  - 无代码符号。
  - 明确 public release gate：默认只读、写入解锁、dry-run、backup、audit、undo、真实主库保护。
- 预期行为：
  - 内部测试版需求和公开发布版需求分离。
  - 发布版必须明确哪些能力默认关闭、哪些能力需要显式确认、哪些能力仍不发布。
- 测试命令：
  - `rg "ZOTERO_API_KEY|api\\.zotero\\.org|zotero\\.sqlite|任意 JS eval" README.md docs TaskDocs`
  - 人工检查 release gate 无空项。
- 通过标准：
  - 文档明确不使用 Web API 写入、不直接写 SQLite、不暴露 eval。
  - 文档明确公开发布前不得依赖测试 profile 和本机项目路径。

执行：
- 开始时间：2026-06-27 13:16:14
- 结束时间：2026-06-27 13:23:58
- 操作内容：
  - 新建 `docs/release-readiness.md`，明确公开发布分发路径、release gate、默认安全模式、真实主库解锁条件、dry-run/confirmation、backup/audit/undo、不可写入路径等硬性边界。
  - 更新 `docs/spec-zotero-local-write-mcp.md`：新增“内部测试版与公开发布版需求边界”，加入公开发布硬性门禁、默认只读/安全锁定、真实主库解锁规则与发布时禁止项。
  - 更新 `README.md`：新增公开发布就绪性说明，标明当前 `0.1.31` 仍为内部测试发布、当前不可直接公开发布的原因清单。
  - 在 `TaskDocs/Zotero本地写入MCP开源公开发布计划日志.md` 记录该步骤为已完成，作为后续步骤依赖的边界基线。
- 测试结果：
  - 执行安全文本校验命令：`rg "ZOTERO_API_KEY|api\.zotero\.org|zotero\.sqlite|任意 JS eval" README.md docs TaskDocs`
  - 执行范围：`README.md`、`docs/*.md`、`TaskDocs/*.md`。
  - 结果：命中行中均未出现新增的 `api.zotero.org`/`ZOTERO_API_KEY`/`zotero.sqlite`/`任意 JS eval` 违规用语；`release-readiness.md` 未含未完成占位符。
  - 人工复核：0.1.31 不能直接公开发布的原因与最终功能缺口清单在新文档和 README 中保持一致。
- 备注：本步骤仅为文档冻结与边界审查，未修改任何源码。

### 步骤 3 - 去除本机测试路径与生产配置目录

计划：
- 目标文件：
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\bootstrap.js`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\scripts\buildZoteroPlugin.mjs`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\mcp-server\authTokenStore.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\mcp-server\auditLogger.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\mcp-server\backupManager.ts`
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\production-paths.md`
- 符号变更：
  - 新增或重构 `RuntimePaths` / `ProjectRootResolver` / `ConfigDirectoryResolver`。
  - 插件侧不再依赖构建时写入的 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge`。
  - auth token、audit、backup 使用用户级配置目录或用户显式配置目录。
- 预期行为：
  - 发布包安装到任意机器后可生成自己的 token、audit、backup 位置。
  - 审计和备份仍不得写入 Zotero profile、Zotero data directory、linked attachment root 或附件目录。
- 测试命令：
  - `npm run test`
  - `npm run build`
  - `npm run build:zotero-plugin`
  - XPI 展开搜索 `rg "H:\\\\ProgramDocument|__ZOTERO_CODEX_BRIDGE_PROJECT_ROOT__"`
- 通过标准：
  - XPI 中不包含本机绝对路径。
  - runtime 路径解析在 Windows/macOS/Linux 文档化。

执行：
- 开始时间：2026-06-27 17:06:12
- 结束时间：2026-06-27 17:24:49
- 操作内容：
  - 移除插件与服务端硬编码测试机路径：
    - `src/zotero-plugin/bootstrap.js` 不再内置 `ZoteroCodexBridge.projectRoot`。
    - `scripts/buildZoteroPlugin.mjs` 去除对构建机 `projectRoot` 的强绑定，默认不替换本机绝对路径。
    - 修复 `bootstrap` 初始化与 auth 入口稳定性：
      - `src/zotero-plugin/bootstrap.js` 不再在对象初始化时调用 `resolveBridgeRuntimeRoot()`，改为 `runtimeRoot: null`，避免 `ZoteroCodexBridge` 未完成初始化时读属性导致异常。
      - `command` 入口将 `getExpectedAuthToken()` 的异常映射为 JSON 响应（`error.status || 503`），错误码保持 `COMMAND_AUTH_TOKEN_MISSING`/`COMMAND_AUTH_TOKEN_INVALID`。
    - 统一 Windows 运行时根目录优先级：插件解析改为 `APPDATA` > `LOCALAPPDATA`，与 MCP server `runtimePaths` 默认保持一致。
  - 进一步对齐构建脚本发布/测试模式：
    - `scripts/buildZoteroPlugin.mjs` 明确支持 `--mode=release|test|dev`，并默认走 `release`。
    - 新增 `npm run build:zotero-plugin:release`、`npm run build:zotero-plugin:test`、`npm run build:zotero-plugin:dev`。
    - 保留 `npm run build:zotero-plugin` 作为 release 默认别名。
  - 新增 `src/mcp-server/runtimePaths.ts`，统一 `runtime` 根目录解析：
    - 优先读取 `ZOTERO_CODEX_BRIDGE_RUNTIME_DIR`。
    - Windows 默认 `%APPDATA%\zotero-codex-bridge`。
    - macOS 默认 `~/Library/Application Support/zotero-codex-bridge`。
    - Linux 默认 `${XDG_STATE_HOME || XDG_DATA_HOME || ~/.local/share}/zotero-codex-bridge`。
  - `authTokenStore`、`auditLogger`、`backupManager` 改为按 runtime 根目录拼接存储路径：
    - `runtime/auth/bridge-token`
    - `runtime/logs/audit`
    - `runtime/backups/zotero-operations`
  - `src/zotero-plugin/bootstrap.js` 修改 `backupRootPath()` 与 `auditRootPath()`，新增运行时 token 读取逻辑（`runtime/auth/bridge-token`），并保留 `expectedAuthToken` 注入入口用于 dev/test。
  - 新建 `docs/production-paths.md`，补充生产/开发路径差异、Windows/macOS/Linux 位置与禁写目录红线。
  - 测试改造：
    - `tests/unit/mcp-server/authTokenStore.test.ts`：增加运行时目录覆盖与 env 配置验证。
    - `tests/unit/mcp-server/backupManager.test.ts`：更新 backup/audit 路径断言到 runtime 子树。
    - `tests/unit/mcp-server/toolRegistry.test.ts`：`AuditLogger` 构造改为 runtime 目录注入。
    - `tests/unit/zotero-plugin/pluginPackage.test.ts`：更新 XPI 路径断言为 runtime 路径，不再校验 build 机绝对路径。
- 追加执行：修正上一步遗留的步骤3风险点：
  - 对齐 `bootstrap` 运行时目录解析顺序，确保 Windows 与 MCP server 一致，避免本机安装环境 `LOCALAPPDATA` 优先导致发布版与测试构建行为偏移。
  - 明确 `build:zotero-plugin` 的脚本边界，避免本地测试 token 被 `build:zotero-plugin`（默认发布）误消费，同时保留 `--test/--dev` 注入本地 token 的开发路径。
- 追加执行：修正单测污染风险（不改动 MCP 运行时 token）：
  - `tests/unit/zotero-plugin/pluginPackage.test.ts` 的 release/test 构建测试开始前保存 `runtime/auth/bridge-token` 原始内容。
  - 测试结束在 `finally` 中恢复原 token；若原先不存在则删除新建文件，避免污染开发验收环境。
  - 同时在 `finally` 中重建一次 release XPI，确保测试收尾状态保持发布产物口径，避免携带随机测试 token 残留。
- 测试结果：
  - `npm run test -- tests/unit/zotero-plugin/pluginPackage.test.ts tests/unit/mcp-server/backupManager.test.ts tests/unit/mcp-server/authTokenStore.test.ts tests/unit/mcp-server/toolRegistry.test.ts tests/unit/mcp-server/runtimePaths.test.ts`
  - `npm run test -- tests/unit/zotero-plugin/pluginPackage.test.ts`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
  - `npm run build:zotero-plugin`
  - `npm run build:zotero-plugin:test`（验证测试构建会注入 token）
  - `rg "H:\\\\ProgramDocument|__ZOTERO_CODEX_BRIDGE_PROJECT_ROOT__|__ZOTERO_CODEX_BRIDGE_AUTH_TOKEN__" dist/zotero-codex-bridge.xpi`（通过）
  - `npm run build:zotero-plugin` 与 `tar -xOf dist\\zotero-codex-bridge.xpi bootstrap.js` 再次确认不含本机路径/占位符
- 备注：仅完成步骤 3 前置路径治理，不涉及步骤 4（真实主库解锁）实现。

### 步骤 4 - 真实主库解锁流程

计划：
- 目标文件：
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\bootstrap.js`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\profileGuard.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\shared\commands.ts`
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\production-profile-unlock.md`
  - 新建或修改相关 unit tests。
- 符号变更：
  - 新增 `profileMode: "readonly" | "test" | "real-locked" | "real-unlocked"` 或等价模式。
  - 新增 `safety.unlockRealProfile` / `safety.lockRealProfile` 受控命令。
  - 新增 profile fingerprint、用户确认记录、可撤销锁定。
- 预期行为：
  - 公开发布版默认只读。
  - 真实主库写入必须由用户在本机显式解锁。
  - 解锁不允许静默发生，不允许 MCP 远程自动开启。
  - 解锁状态、风险提示、备份策略、审计路径必须可见。
- 测试命令：
  - `npm run test -- tests/unit`
  - 使用测试 profile 模拟 locked/unlocked 状态。
  - 安全搜索确认无 Web API 和 SQLite 写入。
- 通过标准：
  - 未解锁真实 profile 时所有写操作拒绝。
  - 解锁后仍强制 dry-run + confirmation。
  - 可重新 lock，lock 后写操作再次拒绝。

执行：
- 开始时间：2026-06-27 14:13:02 +08:00
- 结束时间：进行中
- 操作内容：
  - Spark 子代理先写入了 Step 4 半成品；主线程审查发现 `typecheck` 失败、`commandRegistry` 运行时函数被错误地作为 type-only import、旧测试仍使用 `profileMode: "real"`、`docs/production-profile-unlock.md` 缺失。
  - 主线程接手后修复 `src/shared/commands.ts`、`src/zotero-plugin/commandRegistry.ts`、`tests/unit/zotero-plugin/profileGuard.test.ts`、`tests/unit/zotero-plugin/commandRegistry.test.ts`。
  - 修复 `src/zotero-plugin/bootstrap.js` 真实运行路径：不再信任 Zotero pref 直接进入 `real-unlocked`；有效解锁必须同时满足 TTL 与当前 profile fingerprint；`safety.unlockRealProfile` / `safety.lockRealProfile` 进入插件写命令审计分类。
  - 更新 `tests/unit/zotero-plugin/pluginPackage.test.ts`，覆盖 safety 命令已接入、fingerprint 校验存在、`real-unlocked` pref 不可绕过状态文件。
  - 新建 `docs/production-profile-unlock.md`，记录 profile mode、unlock 输入、runtime 状态文件、审计/恢复和剩余发布工作。
  - 更新 `README.md` 与 `docs/spec-zotero-local-write-mcp.md`，把真实主库解锁表述从“完全未实现”调整为“底层安全状态模型已开始实现，公开发布验收仍未完成”。
- 测试结果：
  - `npm run typecheck`：通过。
  - `npm run test -- tests/unit/zotero-plugin/profileGuard.test.ts tests/unit/zotero-plugin/commandRegistry.test.ts tests/unit/zotero-plugin/pluginPackage.test.ts`：通过，3 个测试文件、18 个测试通过。
  - `npm run test`：通过，18 个测试文件、73 个测试通过。
  - `npm run lint`：通过。
  - `npm run build`：通过。
  - `npm run build:zotero-plugin`：通过，生成 release mode XPI。
  - XPI 禁止内容检查：未发现 `H:\ProgramDocument`、auth token placeholder、project root placeholder、内嵌 token 或内嵌 runtime root。
  - 安全边界搜索：仅命中文档中的禁止项和历史调查记录，未发现源码实现或依赖配置引入 `ZOTERO_API_KEY`、`api.zotero.org`、`zotero.sqlite`、`sqlite write` 或任意 JS eval。
- 备注：这是 Step 4 第一批实现，不要求用户切换真实主库，不执行真实主库手工验收。仍需补全 MCP 层 lock/unlock UX、跨平台 profile fingerprint 验收、公开发布说明和完整回归。

### 步骤 5 - Zotero 插件公开分发包

计划：
- 目标文件：
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\manifest.json`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\scripts\buildZoteroPlugin.mjs`
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\updates.json`
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\zotero-plugin-publication.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\README.md`
- 符号变更：
  - manifest `update_url` 从 `example.com` 改为真实发布 URL。
  - 打包脚本输出 release XPI、sha256、版本 manifest。
- 预期行为：
  - 用户可以从 GitHub Release 下载 XPI。
  - Zotero 可以通过 update manifest 检查更新。
  - 文档明确 Zotero 当前无官方插件库可上传，公开发布走 GitHub release / Zotero Forums / 项目主页。
- 测试命令：
  - `npm run build:zotero-plugin`
  - `tar -tf dist\zotero-codex-bridge.xpi`
  - 校验 `manifest.json`、`bootstrap.js`、`updates.json`。
- 通过标准：
  - XPI 可安装。
  - update manifest JSON 格式正确。
  - release 包不包含本机路径、测试 token 或测试数据。

执行：
- 开始时间：未开始
- 结束时间：未开始
- 操作内容：未开始
- 测试结果：未开始
- 备注：根据 2026-06-27 执行顺序修订，本步骤后置；必须等 item 创建/完整元数据编辑、BibTeX/RIS/CSL 导入导出、PDF annotation 读取/写入、高级搜索/保存搜索/引用格式输出全部完成并通过测试后再开始。

### 步骤 6 - MCP server npm 包与 MCP Registry 准备

计划：
- 目标文件：
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\package.json`
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\server.json`
  - 新建或修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\mcp-server\cli.ts`
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\mcp-publication.md`
- 符号变更：
  - 新增 npm bin 入口，例如 `zotero-codex-bridge-mcp`。
  - 新增 `mcpName`，例如 `io.github.<owner>/zotero-codex-bridge`。
  - 新增 stdio transport 启动入口和健康检查。
- 预期行为：
  - MCP server 可通过 `npx <package>` 启动。
  - `server.json` 与 `package.json#mcpName` 一致。
  - MCP server 启动时检查 Zotero 插件版本、token、endpoint。
- 测试命令：
  - `npm run build`
  - 本机 stdio smoke test。
  - `npx` 本地 pack smoke test。
- 通过标准：
  - npm package 可本地打包并运行。
  - MCP Registry metadata 无本机路径。
  - 文档明确先安装 Zotero 插件再配置 MCP server。

执行：
- 开始时间：未开始
- 结束时间：未开始
- 操作内容：未开始
- 测试结果：未开始
- 备注：根据 2026-06-27 执行顺序修订，本步骤后置；必须等核心 Zotero 功能面补齐并通过测试后再开始。

### 步骤 7 - CI、许可证、变更日志与安全文档

计划：
- 目标文件：
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\.github\workflows\ci.yml`
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\LICENSE`
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\CHANGELOG.md`
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\SECURITY.md`
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\PRIVACY.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\README.md`
- 符号变更：
  - 无代码符号。
  - CI 执行 test/build/typecheck/lint/build:zotero-plugin。
- 预期行为：
  - 公开仓库具备基础工程可信度。
  - 用户能理解本地文件路径、条目标题、附件路径可能进入审计日志。
  - 安全报告流程明确。
- 测试命令：
  - `npm run test`
  - `npm run build`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build:zotero-plugin`
- 通过标准：
  - CI 本地等价命令全部通过。
  - 文档没有空白占位。

执行：
- 开始时间：未开始
- 结束时间：未开始
- 操作内容：未开始
- 测试结果：未开始
- 备注：根据 2026-06-27 执行顺序修订，本步骤后置；不要在核心 Zotero 功能面完成前先投入发布边缘文件。

### 步骤 8 - 兼容矩阵与跨平台验收

计划：
- 目标文件：
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\compatibility-matrix.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\integration\manualAcceptance.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\integration\zoteroPluginDevelopmentInstall.md`
- 符号变更：
  - 无代码符号。
  - 验收矩阵覆盖 Zotero 7/8/9、Windows/macOS/Linux。
- 预期行为：
  - 公开 release 不再只声称 Zotero 9.0.5 Windows 可用。
  - 每个系统记录安装、health、read、dry-run、execute、backup、undo。
- 测试命令：
  - 每个平台运行手工验收 checklist。
  - 每个平台执行 package install smoke test。
- 通过标准：
  - 至少明确支持矩阵和未支持矩阵。
  - 不把未验证平台标为已支持。

执行：
- 开始时间：未开始
- 结束时间：未开始
- 操作内容：未开始
- 测试结果：未开始
- 备注：根据 2026-06-27 执行顺序修订，本步骤后置；跨平台发布验收必须等核心 Zotero 功能面稳定后再做。

### 步骤 9 - item 创建与完整元数据编辑

执行优先级：当前下一步。根据 2026-06-27 执行顺序修订，本步骤必须先于公开发布准备、边缘文档和 Codex skill。

计划：
- 目标文件：
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\shared\commands.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\bootstrap.js`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\mcp-server\toolRegistry.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\zotero-api-source-audit.md`
  - 新建或修改相关 tests。
- 符号变更：
  - 新增 `item.create`、`item.updateFields`、`item.updateCreators`、`item.setCollections` 或等价细分命令。
  - 新增 item type / field validation。
- 预期行为：
  - 支持创建 Zotero regular item。
  - 支持完整元数据编辑，严格区分 Zotero item key 与 BibTeX key。
  - 所有写入 dry-run + confirmation + audit + undo/backup 元数据。
- 测试命令：
  - `npm run test`
  - Zotero test profile runtime：创建 document/book/journalArticle，编辑 title/date/creators/extra。
- 通过标准：
  - UI 中可见创建和编辑结果。
  - 错误 itemType/field 被拒绝。
  - 不直接写 SQLite。

执行：
- 开始时间：2026-06-27
- 结束时间：进行中
- 操作内容：
  - 新增共享命令 `item.create`、`item.updateFields`、`item.updateCreators`、`item.setCollections`，均标记为 `profileWrite`。
  - MCP dry-run target 解析增加 `collectionKeys` 与 `tags`，使 item 创建计划能返回 collection/tag 目标。
  - 插件运行时新增 `item.create`、`item.updateFields`、`item.updateCreators`、`item.setCollections` 的 dry-run/execute 分支。
  - 通过 Zotero 内部 API `new Zotero.Item(...)`、`item.setField(...)`、`item.setCreators(...)`、`item.addToCollection(...)`、`item.removeFromCollection(...)` 执行写入，不使用 Web API、不直写 SQLite。
  - 插件内部测试版号提升到 `0.1.33`，README 与规格文档同步当前命令范围。
- 测试结果：
  - 2026-06-27 自动验证已通过：`npm run test`、`npm run build`、`npm run typecheck`、`npm run lint`、`npm run build:zotero-plugin`。
  - 新增/更新单元测试覆盖共享命令清单、MCP dry-run target、插件命令适配器和 XPI 静态包内容。
  - 2026-06-27 用户安装 `0.1.32` 后 health 通过，但认证后的 command endpoint 返回 500 空响应；定位为认证后 command context 缺少顶层兜底，且可选偏好读取过于脆弱。
  - 已修复为 `0.1.33`：`getProfileMode()` 与 runtime root 偏好读取改为安全读取，command context 读取失败时返回 JSON 错误；仍需安装 `0.1.33` 测试 XPI 后验证创建 document/book/journalArticle、编辑 title/date/creators/extra、设置 collections。
- 备注：本批完成 item 创建与元数据编辑第一组命令的自动验证；“完整元数据编辑”仍需 runtime 验收和更广字段覆盖后才能关闭步骤 9。

### 步骤 10 - BibTeX/RIS/CSL 导入导出

执行优先级：核心功能第二步。必须在 item 创建和完整元数据编辑完成并通过测试后开始。

计划：
- 目标文件：
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\shared\commands.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\bootstrap.js`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\zotero-api-source-audit.md`
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\fixtures\import-export\`
- 符号变更：
  - 新增 `import.bibtex`、`import.ris`、`export.bibtex`、`export.ris`、`export.cslJson` 或等价命令。
  - 新增 import dry-run，返回将创建/更新/跳过的条目计划。
- 预期行为：
  - 支持 BibTeX/RIS/CSL JSON 方向的公开用户常用导入导出。
  - 导入写入必须 dry-run + confirmation。
  - 导出为只读命令，不写 Zotero。
- 测试命令：
  - `npm run test`
  - runtime 导入 fixture、导出后内容比对。
- 通过标准：
  - 导入结果在 Zotero UI 可见。
  - 导出结果格式可被 Zotero 或通用工具识别。
  - 错误格式返回明确错误。

执行：
- 开始时间：未开始
- 结束时间：未开始
- 操作内容：未开始
- 测试结果：未开始
- 备注：这是最终完整 Zotero 功能面缺口之一。

### 步骤 11 - PDF annotation 读取与写入

执行优先级：核心功能第三步。必须在导入导出完成并通过测试后开始。

计划：
- 目标文件：
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\shared\commands.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\bootstrap.js`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\zotero-api-source-audit.md`
  - 新建 annotation fixtures 和 tests。
- 符号变更：
  - 新增 `annotation.list`、`annotation.create`、`annotation.update`、`annotation.deleteCreated` 或等价命令。
  - 明确 PDF annotation 与 Zotero note/annotation item 的映射。
- 预期行为：
  - 可读取 PDF annotation。
  - 可创建或更新 annotation，写入必须 dry-run + confirmation。
  - 删除仍按高风险操作单独阶段控制。
- 测试命令：
  - `npm run test`
  - runtime 使用带 annotation 的 PDF fixture 验收。
- 通过标准：
  - Zotero UI / PDF reader 中可见 annotation 变化。
  - annotation 读取字段完整且稳定。
  - 不破坏 PDF 文件或 Zotero 存储。

执行：
- 开始时间：未开始
- 结束时间：未开始
- 操作内容：未开始
- 测试结果：未开始
- 备注：这是最终完整 Zotero 功能面缺口之一。

### 步骤 12 - 高级搜索、保存搜索与引用输出

执行优先级：核心功能第四步。必须在 PDF annotation 读取/写入完成并通过测试后开始；完成后才允许进入发布准备、边缘文件和 Codex skill。

计划：
- 目标文件：
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\shared\commands.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\bootstrap.js`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\zotero-api-source-audit.md`
  - 修改相关 tests。
- 符号变更：
  - 新增 `search.advanced`、`savedSearch.create`、`savedSearch.update`、`savedSearch.get`、`citation.format` 或等价命令。
- 预期行为：
  - 支持比 `item.search` 更完整的 Zotero search 条件。
  - 支持保存搜索管理。
  - 支持按 CSL style 输出引用或 bibliography。
- 测试命令：
  - `npm run test`
  - runtime 创建保存搜索、读取结果、输出引用文本。
- 通过标准：
  - 搜索结果与 Zotero UI 一致。
  - citation 输出稳定并记录 style id。
  - 写入保存搜索仍 dry-run + confirmation。

执行：
- 开始时间：未开始
- 结束时间：未开始
- 操作内容：未开始
- 测试结果：未开始
- 备注：这是最终完整 Zotero 功能面缺口之一。

### 步骤 13 - 删除、trash 与 merge duplicates

计划：
- 目标文件：
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\shared\commands.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\bootstrap.js`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\security.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\production-profile-unlock.md`
  - 新建高风险操作 tests。
- 符号变更：
  - 新增 `item.trash`、`collection.trash`、`attachment.trash`、`duplicates.find`、`duplicates.merge` 或等价命令。
  - 新增高风险 confirmation 等级、backup 强制要求、恢复说明。
- 预期行为：
  - 删除类操作先进入 trash，不永久 erase。
  - merge duplicates 必须强 dry-run，列出字段冲突、保留项、被合并项和恢复限制。
  - 默认关闭，只有真实主库解锁后另行开启。
- 测试命令：
  - 隔离 profile runtime。
  - audit/backup/undo 检查。
- 通过标准：
  - 无任何永久删除路径默认开启。
  - merge 失败时保留可审计状态。
  - 文档明确风险和不可逆边界。

执行：
- 开始时间：未开始
- 结束时间：未开始
- 操作内容：未开始
- 测试结果：未开始
- 备注：第一版明确暂不做，公开发布完整版本阶段才进入。

### 步骤 14 - Codex 专用 skill

计划：
- 目标文件：
  - 候选 `C:\Users\chenl\.codex\skills\zotero-local-manager\SKILL.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\mcp-publication.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\README.md`
- 符号变更：
  - 无项目代码符号。
  - 定义 Codex 工作流：health、read、dry-run、execute、audit、backup、undo、stop conditions。
- 预期行为：
  - Codex 使用该 skill 时不会绕过 dry-run 和 confirmation。
  - 对删除、merge、真实主库写入、高风险批量操作会停止并要求用户确认。
  - skill 明确不使用 Zotero Web API 和 SQLite。
- 测试命令：
  - 3 到 5 个真实 prompt 在 test profile 中演练。
  - 检查每次写操作都有 audit。
- 通过标准：
  - skill 可稳定引导 collection、item、attachment、tag、note、backup/undo 工作流。
  - 高风险操作按 stop conditions 停止。

执行：
- 开始时间：未开始
- 结束时间：未开始
- 操作内容：未开始
- 测试结果：未开始
- 备注：用户已明确暂时不进入 skill 编辑阶段；根据 2026-06-27 执行顺序修订，skill 必须等 item 创建/编辑、导入导出、annotation、高级搜索/保存搜索/引用输出全部完成并通过测试后再开始。

### 步骤 15 - 发布候选验收与公开发布

计划：
- 目标文件：
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\CHANGELOG.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\README.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\release-readiness.md`
  - 生成 release artifacts：XPI、npm package、checksums、server.json。
- 符号变更：
  - 版本号提升到公开 release 语义版本，例如 `0.2.0-beta.1` 或 `1.0.0`。
- 预期行为：
  - 发布候选版本可被用户独立安装和配置。
  - GitHub Release、npm package、MCP registry metadata 准备完成。
  - Zotero Forums 发布说明草稿完成。
- 测试命令：
  - `npm run test`
  - `npm run build`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build:zotero-plugin`
  - package smoke test。
  - release checklist 手工验收。
- 通过标准：
  - 所有自动验证通过。
  - release artifacts 不含本机路径、测试 profile、测试 token、测试数据。
  - 文档明确当前支持和不支持范围。

执行：
- 开始时间：未开始
- 结束时间：未开始
- 操作内容：未开始
- 测试结果：未开始
- 备注：根据 2026-06-27 执行顺序修订，本步骤后置到核心 Zotero 功能面、发布准备和 skill 之后。

## 最终结果

当前结果：

- 本日志已接替旧的内部第一阶段实施日志。
- 第一阶段 `0.1.31` 已验证的能力被记录为历史基线。
- 公开发布目标已拆分为 Zotero 插件公开分发与 MCP server 公开发布两条线，但发布准备已根据 2026-06-27 修订后置。
- 旧日志未完成内容已搬迁到本日志：
  - 真实主库解锁流程：步骤 4。
  - Codex 专用 skill：步骤 14。
  - 文档发布与安全说明：步骤 2、5、6、7、15。
  - 完整 Zotero 功能面：步骤 9-13。
- 最终功能缺口已明确纳入计划：
  - item 创建/完整元数据编辑。
  - BibTeX/RIS/CSL 等导入导出。
  - PDF annotation 读取/写入。
  - 高级搜索、保存搜索、引用格式输出等更完整 Zotero 能力。
  - 真实主库解锁流程。
  - Codex 专用 skill。
  - 删除/merge duplicates。
- 当前硬性执行顺序：先完成 item 创建/完整元数据编辑、BibTeX/RIS/CSL 导入导出、PDF annotation 读取/写入、高级搜索/保存搜索/引用格式输出；这些全部完成并通过测试后，才开始发布边缘文件、公开分发准备和 Codex skill。

下一步：

- 步骤 9：item 创建和完整元数据编辑。
- 步骤 10：BibTeX / RIS / CSL 导入导出。
- 步骤 11：PDF annotation 读取/写入。
- 步骤 12：高级搜索、保存搜索、引用格式输出。
- 只有上述四组功能完成并通过测试后，才开始公开发布边缘文件、发布准备和 Codex skill。
