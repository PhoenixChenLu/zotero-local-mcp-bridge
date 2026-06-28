# 任务上下文

创建时间：2026-06-27 12:28:20

我将使用 plan-led-delivery-logbook 工作流来完成这个任务。

本日志接替 [Zotero本地写入MCP项目实施计划日志.md](Zotero本地写入MCP项目实施计划日志.md)。旧日志只保留为第一阶段内部验收历史，不再继续更新；后续以开源公开发布、Zotero 插件公开分发、MCP server 公开发布和最终尽量完整覆盖 Zotero 本地管理能力为目标。

## 2026-06-28 项目重命名

用户确认本项目不应继续以 Codex 作为项目名，因为插件和 MCP server 提供的是通用本机 MCP/HTTP 受控接口，并非只能由 Codex 使用。自本节起，项目公开名称迁移为 **Zotero Local MCP Bridge**，技术 slug 迁移为 `zotero-local-mcp-bridge`。

本次迁移范围：

- 插件显示名：`Zotero Local MCP Bridge`。
- npm/package slug：`zotero-local-mcp-bridge`。
- Zotero 插件 ID：`zotero-local-mcp-bridge@example.com`。
- XPI 文件名：`dist/zotero-local-mcp-bridge.xpi`。
- 本机 endpoint：`/zotero-local-mcp-bridge/health` 与 `/zotero-local-mcp-bridge/command`。
- 鉴权 header：`x-zotero-local-mcp-bridge-token`。
- Zotero preference 前缀：`extensions.zotero-local-mcp-bridge.*`。
- 默认 runtime 目录名：`zotero-local-mcp-bridge`。
- 测试 profile marker：`.zotero-local-mcp-bridge-test-profile`；重命名迁移期兼容旧 marker `.zotero-codex-bridge-test-profile`，避免现有测试 profile 立即失效。

本次不修改外层磁盘目录名 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge`，也不改写旧日志中的历史 runtime 证据。旧日志内出现的旧 endpoint、旧 XPI 名称和旧测试 item 标题保留为历史记录。

Codex 仍保留为主要客户端之一，后续 Codex 专用 skill 继续作为发布后阶段；但插件和 MCP server 的公开定位改为通用本机 MCP bridge。

## 2026-06-28 执行顺序修订：多国语言适配

用户确认在项目改名后，下一阶段不直接进入 Codex skill 或公开发布边缘文件，而是先把插件设置界面做成可随 Zotero UI 语言变化的多国语言界面。

新的近期顺序：先完成当前插件设置界面基础功能与命名迁移收尾；随后进入多国语言与本地化适配阶段；多国语言适配完成并通过自动验证、XPI 静态检查和 Zotero UI 手工验收后，再进入 Codex 专用 skill、公开发布边缘文件、Zotero 插件公开分发和 MCP server 公开发布准备。

多国语言适配的标准方向：以 Zotero/Firefox Fluent `.ftl` 机制为目标方案；插件设置页应使用 `data-l10n-id` / `data-l10n-attrs`，避免硬编码英文 UI 文案；语言跟随 Zotero 应用 UI 语言，而不是直接读取 Windows 系统语言；每个 supported locale 必须有独立 `.ftl` 源文件，构建阶段不允许使用英文 fallback。

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
   - 发布版硬性要求：MCP server 生命周期必须随 Zotero 启停，由 Zotero 插件启动、监督和停止；不能要求普通用户另行依赖 MCP client、CLI、shell 或后台服务手动启动。
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
- 删除/merge duplicates 已进入受控 trash/merge 阶段；仍禁止永久 erase、清空 Zotero trash 或直接删除既有附件文件。

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
- 结束时间：2026-06-27 22:22
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
  - MCP server 可通过 `npx <package>` 或 CLI 启动用于开发、调试和 registry smoke test。
  - 发布版默认用户路径中，MCP server 必须由 Zotero 插件随 Zotero 启动并随 Zotero 停止；CLI/npx 不作为普通用户必需步骤。
  - `server.json` 与 `package.json#mcpName` 一致。
  - MCP server 启动时检查 Zotero 插件版本、token、endpoint。
- 测试命令：
  - `npm run build`
  - 本机 stdio smoke test。
  - `npx` 本地 pack smoke test。
- 通过标准：
  - npm package 可本地打包并运行。
  - MCP Registry metadata 无本机路径。
  - 文档明确先安装 Zotero 插件；插件负责启动/停止 MCP sidecar；外部 CLI 只作为诊断/开发入口。

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
  - 插件内部测试版号提升到 `0.1.36`，README 与规格文档同步当前命令范围。
- 测试结果：
  - 2026-06-27 自动验证已通过：`npm run test`、`npm run build`、`npm run typecheck`、`npm run lint`、`npm run build:zotero-plugin`。
  - 新增/更新单元测试覆盖共享命令清单、MCP dry-run target、插件命令适配器和 XPI 静态包内容。
  - 2026-06-27 用户安装 `0.1.32` 后 health 通过，但认证后的 command endpoint 返回 500 空响应；定位为认证后 command context 缺少顶层兜底，且可选偏好读取过于脆弱。
  - 已修复为 `0.1.36`：`getProfileMode()` 与 runtime root 偏好读取改为安全读取，command context 读取失败时返回 JSON 错误；测试/开发 XPI 构建时注入本项目 runtime root，release 构建仍保持 `runtimeRoot: null`；真实主库 unlock state 路径改为 `PathUtils.join` 分段拼接，避免 Zotero 9 对带 `/` 的片段报 `NS_ERROR_FILE_UNRECOGNIZED_PATH`；偏好缺失且 test marker 存在时自动识别为 `profileMode: "test"`。
  - 2026-06-27 安装 `0.1.36` 测试 XPI 后运行时验收通过：`/health` 返回 `zotero-codex-bridge ok 0.1.36 ... test`；`safety.getProfileStatus` 返回 `profileMode: "test"`、`testProfileMarkerPresent: true`，审计与 backup 路径均在本项目 `runtime/` 下。
  - 运行时 dry-run/execute 验收通过：创建 collection `DE7C3P63`；创建 document `MSGY6MTQ`、book `E5ZTMNPD`、journalArticle `7Z7D6JFT`；执行 `item.updateFields` 将 document 标题、date、extra 更新并读回成功；执行 `item.updateCreators` 将 book creators 更新为 institutional author + editor 并读回成功；执行 `item.setCollections` 后 `collection.getItems` 返回 `MSGY6MTQ`、`E5ZTMNPD`、`7Z7D6JFT`。
  - 审计验证：`audit.list` 可读取 `runtime/logs/audit/2026-06-27.jsonl`，包含上述 dry-run、execute 与一次脚本取值错误导致的 `ZOTERO_ITEM_KEY_REQUIRED` 失败记录；失败记录未写入空 key，后续 retry 成功。
- 备注：步骤 9 已完成 item 创建和通用元数据编辑核心闭环。当前实现通过 Zotero 内部 `setField` 支持各 itemType 的有效字段，通过 `setCreators` 支持 creator 更新；后续若发现特定 Zotero 字段或 itemType 需要特殊适配，应作为兼容性扩展测试补充，而不是阻塞步骤 10。

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
- 开始时间：2026-06-27
- 结束时间：2026-06-27 20:48
- 操作内容：
  - 第一切片实现只读导出命令：`export.bibtex`、`export.ris`、`export.cslJson`。
  - 同一测试版继续实现导入写命令：`import.bibtex`、`import.ris`、`import.cslJson`，均标记为 `profileWrite` 并强制 dry-run/confirmation。
  - 使用 Zotero 9.0.5 local API 源码中的 `Zotero.Translate.Export` 路径执行导出；导入路径先实现为 translator 内部常见的 `Zotero.loadTranslator("import")` + `setString()`，runtime 证明插件环境不暴露该入口后，0.1.38 改为官方 Connector import endpoint 使用的 `new Zotero.Translate.Import()` + `translate({ libraryID, collections, forceTagType, saveOptions })`。
  - dry-run 不调用 import translator，避免预览阶段写库；BibTeX/RIS 仅估算条目数，CSL JSON 使用 `JSON.parse()` 校验和估算条目数。
  - 共享命令清单、插件运行时、README、spec 和 API source audit 已同步。
- 测试结果：
  - 自动验证通过：`npm run test`、`npm run typecheck`、`npm run lint`、`npm run build`、`npm run build:zotero-plugin`、`npm run build:zotero-plugin:test`。
  - XPI 静态检查通过：`dist/zotero-codex-bridge.xpi` manifest 为 `0.1.37`；包内包含 `import.bibtex`、`import.ris`、`import.cslJson`、`export.bibtex`、`export.ris`、`export.cslJson` endpoint 分支，以及 `Zotero.loadTranslator("import")` 和 `new Zotero.Translate.Export()`。
  - 安全边界搜索通过：仅命中文档中的禁止项和历史调查记录，未发现源码实现或依赖配置引入 `ZOTERO_API_KEY`、`api.zotero.org`、`zotero.sqlite`、`sqlite write` 或任意 JS eval。
  - runtime 导出验收通过：安装 `0.1.37` 后，`export.bibtex`、`export.ris`、`export.cslJson` 对既有测试条目返回非空内容。
  - runtime 导入验收发现 `0.1.37` 缺陷：`import.bibtex` execute 返回 `ITEM_IMPORT_UNSUPPORTED`，原因是 Zotero 9.0.5 插件运行态不暴露 `Zotero.loadTranslator`。
  - 0.1.38 修正：导入实现改用 `new Zotero.Translate.Import()`，collection 直接转换为 Zotero collection id 传给 `translate()`。
  - 0.1.38 runtime 导入验收通过：`import.bibtex`、`import.ris`、`import.cslJson` 均完成 dry-run + confirmation + execute，各导入 1 个条目。
  - runtime 导入结果：目标 collection `VZ3P3YEL`；BibTeX item `IH8MPEN8`，RIS item `YYV6EX7A`，CSL JSON item `JUQANXNE`。
  - runtime 回读通过：`collection.getItems` 包含上述 3 个导入条目；导入条目可再次通过 `export.bibtex`、`export.ris`、`export.cslJson` 导出非空内容。
- 备注：第一片导入全部按新增 item 处理，不做 duplicate merge、已有 item 更新或删除；这些属于后续高风险/高级导入策略。

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
- 开始时间：2026-06-27
- 结束时间：2026-06-27 21:03
- 操作内容：
  - 第一片实现 `annotation.list`、`annotation.create`、`annotation.update`；暂不实现删除，继续遵守第一版不删除 Zotero 对象的硬边界。
  - 第一片只支持 PDF attachment；EPUB/HTML annotation、image/ink annotation、自动推导 PDF 坐标均后置。
  - `annotation.create` / `annotation.update` 均作为 profile write 命令接入 dry-run + confirmation。
  - 依据 Zotero 9.0.5 `item.js` annotation item 对象层 API：`getAnnotations()`、`new Zotero.Item("annotation")`、annotation 字段 setter 和 `saveTx()`。
- 测试结果：
  - 自动验证通过：`npm run test`、`npm run typecheck`、`npm run lint`、`npm run build`、`npm run build:zotero-plugin`、`npm run build:zotero-plugin:test`。
  - 安全边界搜索通过：仅命中文档中的禁止项和历史调查记录，未发现源码实现或依赖配置引入 `ZOTERO_API_KEY`、`api.zotero.org`、`zotero.sqlite`、`sqlite write` 或任意 JS eval。
  - runtime `annotation.list` 通过：安装 `0.1.39` 后，PDF attachment `FQ8474SV` 初始 annotation 数为 0。
  - runtime `annotation.create` 通过：创建 highlight annotation `W6RH6YKC`，`annotationText`、`annotationComment`、`annotationColor`、`annotationPageLabel`、`annotationSortIndex` 和 `annotationPosition` 均可读回；create planId 为 `plan_mqwcsmpj_a8slvgqtwk`。
  - runtime `annotation.update` 通过：更新 annotation `W6RH6YKC` 的 comment 和 color，`annotation.list` 读回 comment 为 `Updated by Zotero Codex Bridge runtime validation 0.1.39`、color 为 `#ff6666`；update planId 为 `plan_mqwct2jf_5na0m16yncn`。
- 备注：这是最终完整 Zotero 功能面缺口之一；第一片不自动生成 PDF 坐标，调用方必须提供 Zotero reader 可识别的 `annotationPosition` JSON 和 PDF `annotationSortIndex`。

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
- 开始时间：2026-06-27
- 结束时间：2026-06-28 03:34:53 +08:00
- 操作内容：
  - 第一片实现 `search.advanced`、`savedSearch.list`、`savedSearch.get`、`savedSearch.create`、`savedSearch.update`、`citation.format`。
  - `search.advanced` 直接接受 Zotero Search 条件三元组 `{ condition, operator, value }`，避免重造搜索 DSL。
  - `savedSearch.create` / `savedSearch.update` 作为 profile write 命令接入 dry-run + confirmation。
  - `citation.format` 复用 Zotero citeproc 输出 HTML，第一片只使用本地已安装 style，不自动联网安装 style。
- 测试结果：
  - 自动验证通过：`npm run test`、`npm run lint`、`npm run typecheck`、`npm run build`、`npm run build:zotero-plugin:test`、`npm run build:zotero-plugin`。
  - runtime `search.advanced` 通过：安装 `0.1.40` 后，`quicksearch-titleCreatorYear contains Codex Bridge` 返回 8 个本地条目 key。
  - runtime `citation.format` 通过：bibliography 和 citation 均返回 Zotero citeproc HTML。
  - runtime `savedSearch.create` 通过：dry-run planId `plan_mqwddcng_5p4j6l4koxr`，execute 创建 saved search `STD4ECMX`。
  - runtime `savedSearch.update` 在 `0.1.40` 暴露缺陷：execute 能返回成功，但 Zotero 保存搜索条件未被替换，而是与旧条件叠加。原因是直接赋值 `search.conditions = {}` 不会清空 Zotero `Search` 内部条件；依据 Zotero 9.0.5 `search.js` 的 `fromJSON()` 实现，`0.1.41` 改为 `getConditions()` 后逐个 `removeCondition()`，再重新 `addCondition()`。
  - runtime `savedSearch.update` 回归通过：安装 `0.1.41` 后，先回读被 `0.1.40` 污染的 `STD4ECMX`，确认旧状态为 23 条条件；随后 dry-run planId `plan_mqwg7q5k_u968wdc4eva`，execute 成功；再次回读后名称为 `Codex Bridge Saved Search 0.1.41 Replaced`，条件只剩 `title contains Runtime` 和 `noChildren true` 两条，旧条件已被清除。
- 备注：这是最终完整 Zotero 功能面缺口之一；第一片先覆盖本地 user library，不支持 group library。步骤 12 已完成高级搜索、保存搜索和引用输出的第一批 runtime 验收。

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
- 开始时间：2026-06-27
- 结束时间：进行中
- 操作内容：
  - 根据用户要求修改边界：项目目标是功能尽可能齐全，因此删除、trash 与 merge duplicates 不再作为永久禁区；但仍必须作为高风险能力受控开放。
  - 新增共享命令：`item.trash`、`collection.trash`、`attachment.trash`、`duplicates.find`、`duplicates.merge`。
  - MCP dry-run 将 trash 与 `duplicates.merge` 标记为 `high` risk，并支持提取 `masterZoteroItemKey`、`duplicateZoteroItemKeys`、`attachmentKeys`。
  - 插件运行时新增 direct HTTP 分支：
    - `item.trash`：最多 50 个 item key，调用 `Zotero.Items.trashTx()`，不永久 erase。
    - `attachment.trash`：最多 50 个 attachment key，调用 `Zotero.Items.trashTx()`，不删除 storage 文件。
    - `collection.trash`：默认只 trash collection/subcollection，不 trash descendant items；显式 `trashDescendentItems: true` 时才移动 descendant items 到 Zotero trash。
    - `duplicates.find`：使用 `Zotero.Duplicates` 返回 duplicate sets。
    - `duplicates.merge`：使用 `Zotero.Items.merge(master, duplicateItems)`，dry-run 返回字段冲突、master、duplicates、attachment/collection/tag 影响和恢复限制。
  - 更新 `AGENTS.md`、`README.md`、`docs/spec-zotero-local-write-mcp.md`、`docs/production-profile-unlock.md`，将旧“禁止删除/merge”边界改为“允许受控 trash/merge，禁止永久 erase、清空 trash、直接删除既有附件文件”。
  - 更新 `docs/zotero-api-source-audit.md`，记录 Zotero 9.0.5 源码依据：`Items.trashTx()`、`Collection.prototype.trash()`、`Zotero.Duplicates`、`Zotero.Items.merge()` / `mergeItems.mjs`。
- 测试结果：
  - 针对性单元测试已通过：`npm run test -- tests/unit/shared/commands.test.ts tests/unit/mcp-server/toolRegistry.test.ts tests/unit/zotero-plugin/pluginPackage.test.ts`。
  - 完整自动验证已通过：`npm run test`、`npm run lint`、`npm run typecheck`、`npm run build`、`npm run build:zotero-plugin`、`npm run build:zotero-plugin:test`。
  - 安全边界搜索通过：未发现源码实现或依赖配置引入 `ZOTERO_API_KEY`、`api.zotero.org`、`zotero.sqlite`、`sqlite write` 或任意 JS eval。
  - XPI 静态检查通过：测试版 `dist/zotero-codex-bridge.xpi` manifest 为 `0.1.42`，包含 `item.trash`、`attachment.trash`、`collection.trash`、`duplicates.find`、`duplicates.merge` 分支。
  - 2026-06-27 用户安装 `0.1.42` 测试 XPI 后 runtime 验收通过：`/health` 返回 `zotero-codex-bridge ok 0.1.42 ... test`；项目本地 `runtime/auth/bridge-token` 鉴权通过，旧手工 token 被正确拒绝。
  - runtime dry-run/execute 验收通过：
    - `item.trash`：创建临时 item `WIARCVMP`，dry-run 风险等级为 `high`，execute 后 `item.get` 回读 `deleted: true`。
    - `attachment.trash`：创建临时 attachment `U5YZTNSI`，execute 后用 `item.get` 对 attachment key 回读 `deleted: true`；未执行永久文件删除。
    - `collection.trash`：创建临时 collection `YLYGU6AK`，execute 后不再出现在普通 `collection.getTree` 中。
    - `duplicates.merge`：临时 master `ZHLYXJVN` 与 duplicate `J8Z6XIQT` dry-run 风险等级为 `high`，execute 成功；master 回读包含 `dc:replaces`，duplicate 回读 `deleted: true`。
  - runtime 观察：单纯同题名但 DOI 不同的临时条目不会被 `duplicates.find` 识别为 duplicate set；这符合 Zotero 更保守的重复判定预期。
  - 2026-06-27 补充 `duplicates.find` 专项样本验收：创建相同 title、author、year 与相同 DOI 的临时条目 `P7JBYRDJ`、`C8KWB43B`，`duplicates.find` 返回 `setCount: 1`，`data.sets[0].zoteroItemKeys` 同时包含这两个 key。
  - 清理验证通过：旧残留 `BIKHXZ2L`、`7W7R6GFW`、`4R5DU7Z5` 和本次专项样本 `P7JBYRDJ`、`C8KWB43B`、`BGGT9EWG` 均已通过本插件 `item.trash` / `collection.trash` 移动到 Zotero trash；回读 `collection.getTree` 不再包含这些临时 collection。
- 备注：本步骤第一片已完成 Zotero trash、duplicates find 和 duplicates merge 的 test profile runtime 验收；仍不实现永久删除、清空 trash、group library 或直接文件删除。

### 步骤 14 - 插件设置界面规格与实现

计划：
- 目标文件：
  - 新建 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\plugin-settings-ui-spec.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\spec-zotero-local-write-mcp.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\...`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\unit\zotero-plugin\...`
- 符号变更：
  - 新增设置 schema/defaults。
  - 新增或扩展 Zotero 插件 preferences/options UI。
  - 将运行模式、backup/undo、确认策略、附件默认策略接入写命令 guard。
- 预期行为：
  - 设置界面只提供 `readonly`、`askforapprove`、`yolo` 三种运行模式。
  - dry-run 固定开启，不允许关闭。
  - audit 固定开启，不允许关闭。
  - backup/undo 默认开启，允许关闭文件级 backup/undo，并显示恢复能力下降提示。
  - backup root 允许自定义，但必须拒绝 Zotero profile、Zotero Data Directory、linked attachment root 和附件目录。
  - `askforapprove` 下普通高风险操作需要 `CONFIRM`；极高危或不可恢复操作需要输入具体命令名。
  - `yolo` 下普通写操作和普通高风险操作可免人工确认，但极高危或不可恢复操作仍必须主动确认。
  - 批量上限固定 50，暂不提供 UI 调整。
- 测试命令：
  - `npm run test`
  - `npm run lint`
  - `npm run typecheck`
  - `npm run build`
  - `npm run build:zotero-plugin:test`
  - Zotero test profile 手工验证设置界面显示、保存和命令 guard 生效。
- 通过标准：
  - `readonly` 下写命令被拒绝。
  - `askforapprove` 和 `yolo` 的确认策略符合 `docs/plugin-settings-ui-spec.md`。
  - 设置修改写入 audit。
  - release/test XPI 均不携带本机测试 token 或测试数据。

执行：
- 开始时间：2026-06-28
- 结束时间：未开始
- 操作内容：
  - 使用 `$spec-driven-development` 完成 SPECIFY 阶段，记录用户确认的设置界面策略。
  - 已明确运行模式为 `readonly`、`askforapprove`、`yolo`。
  - 已明确 `yolo` 对极高危或不可恢复操作仍必须主动确认。
  - 已新增设置界面规格文档并同步主 spec。
  - 完成第一片实现：
    - 新增共享设置默认值与模式校验：`src/shared/settings.ts`。
    - 新增 Zotero preferences 资源：`prefs.js`、`preferences.xhtml`、`preferences.js`、`preferences.css`。
    - `startup(data)` 注册 `Zotero.PreferencePanes.register(...)`。
    - `safety.getProfileStatus` 返回 `operationMode`、`runMode`、`dryRunRequired`、`auditEnabled`、`runtimeRoot`。
    - 写命令 guard 增加 `readonly` 拦截；`readonly` 下 profile write 命令返回 `OPERATION_MODE_READONLY`。
    - XPI 打包脚本将设置界面资源纳入 `dist/zotero-codex-bridge.xpi`。
    - 内部测试版本提升到 `0.1.43`。

- 2026-06-28：
  - 用户安装 `0.1.43` 后确认 Zotero 主设置左侧出现 `Zotero Codex Bridge`，但点击后右侧仍停留在 Advanced 内容，设置详情没有加载。
  - 复核 Zotero 官方 Zotero 7 插件开发文档后，确认 `PreferencePanes.register` 的 `src` 应为不含 `DOCTYPE` 的 XUL/XHTML fragment，CSS 应优先通过 `stylesheets` 注册；自定义插件 pref 读写应使用 Zotero global preference 形态。
  - 将设置页修复为官方建议的 fragment 结构，去掉 XML 声明、内嵌 stylesheet link 和旧式 `caption`，改用 `groupbox` + `label/html:h2`。
  - `preferences.js` 改为 `Zotero.Prefs.get/set(..., true)` 并保留旧读法回退；`bootstrap.js` 的运行模式读取也使用 global pref 优先、旧读法回退。
  - 启动时将测试包注入的 runtime root 写入 `extensions.zotero-codex-bridge.runtimeRoot`，设置页从该 pref 显示 runtime/audit/backup 路径。
  - 内部测试版本提升到 `0.1.44`。

- 2026-06-28：
  - 用户安装 `0.1.44` 后 health 返回正常，但设置页仍无内容；debug output 显示 `preferences.js` 抛出 `Zotero Codex Bridge preference control missing: zcb-operation-mode`。
  - 根因：`PreferencePanes.register` 的 `scripts` 会在 fragment 控件可查询前执行，原脚本在加载时立即 `init()`，导致 `document.getElementById("zcb-operation-mode")` 为空。
  - 修复：将 `preferences.js` 改为只暴露 `globalThis.ZoteroCodexBridgePreferences.init()`，由 `preferences.xhtml` 根 `vbox onload` 调用；增加 `data-zcb-initialized` 防止重复绑定事件。
  - 内部测试版本提升到 `0.1.45`。

- 2026-06-28：
  - 用户确认 `0.1.45` 设置页可见，但 Paths 区不符合 Zotero 原生 `Advanced -> Files and Folders` 的三联控件形态。
  - 将 `Runtime root`、`Audit directory`、`Backup directory` 改为 `Directory label + folder icon path field + Choose... button`。
  - 设置页使用 Zotero FilePicker 选择文件夹，并将结果写入 `runtimeRoot`、`auditRoot`、`backupRoot` pref。
  - 插件后端新增 `BRIDGE_AUDIT_ROOT_PREFERENCE` 和 `BRIDGE_BACKUP_ROOT_PREFERENCE`，`auditRootPath()` 与 `backupRootPath()` 优先读取用户选择路径，未设置时继续回退到 runtime root 下的默认派生目录。
  - 后端增加路径防线：`auditRoot` / `backupRoot` 如果指向 Zotero profile、Zotero Data Directory、storage 或 linked attachment root，则忽略该 pref 并回退到默认 runtime 内路径。
  - 内部测试版本提升到 `0.1.46`。
- 测试结果：
  - 自动验证通过：`npm run test`、`npm run lint`、`npm run typecheck`、`npm run build`、`npm run build:zotero-plugin:test`。

- 2026-06-28：
  - 用户安装 `0.1.46` 后确认设置页可见，但 Paths 区三个 `Choose...` 按钮点击没有反应，路径栏过长，并且未显示测试包默认 runtime root。
  - 根因：
    - 设置页按钮只监听 `command`，在 Zotero 9 偏好页 fragment 中普通点击不稳定触发。
    - 构建脚本只向 `bootstrap.js` 注入 `__ZOTERO_CODEX_BRIDGE_RUNTIME_ROOT__`，未向 `preferences.js` 注入，设置页无法自行显示默认测试根目录。
    - 路径三联控件宽度沿用了过大的文本栏尺寸，长路径会撑开布局。
  - 修复：
    - `preferences.js` 的异步按钮监听器同时监听 `command` 与 `click`，并增加 `data-zcb-busy` 防重复触发。
    - `scripts/buildZoteroPlugin.mjs` 对 `preferences.js` 与 `bootstrap.js` 共用占位符替换逻辑；release 包注入 `null`，test/dev 包注入项目 runtime root。
    - 设置页初始化时如果 `runtimeRoot` pref 为空，会把测试包注入的 runtime root 写入 pref，并刷新 runtime/audit/backup 默认路径。
    - 路径栏宽度收窄，长路径使用省略显示。
  - 内部测试版本提升到 `0.1.47`。
- 测试结果：
  - `npm run test`：通过，19 个测试文件、81 个测试全部通过。
  - `npm run lint`：通过。
  - `npm run typecheck`：通过。
  - `npm run build`：通过。
  - `npm run build:zotero-plugin:test`：通过，已生成 `dist/zotero-codex-bridge.xpi`。
  - 包内 smoke check：`manifest.json` 版本为 `0.1.47`；`preferences.js` 含测试包注入 runtime root、`click` 监听、`persistInjectedRuntimeRootIfNeeded()` 和 FilePicker folder mode fallback；`preferences.css` 含 `width: 27em`、`min-width: 0`、`text-overflow: ellipsis`。
  - 安全边界搜索通过：仅命中文档中的禁止项和历史调查记录，未发现源码实现或依赖配置引入 `ZOTERO_API_KEY`、`api.zotero.org`、`zotero.sqlite`、`sqlite write` 或任意 JS eval。

- 2026-06-28：
  - 用户安装 `0.1.47` 后反馈：
    - Paths 区控件尺寸仍未贴近 Zotero Advanced 原生 Files and Folders。
    - `Choose...` 按钮仍无反应。
    - 底部 readonly/yolo 说明颜色和位置不对，且应改为 Run mode 旁的问号提示。
  - 用户提供 debug output，关键错误为：`ReferenceError: ZoteroCodexBridgePreferences is not defined`，触发点为 Zotero preference fragment 的 `onload`。
  - 根因：
    - Zotero 插件 preference pane 的 `scripts` 会加载到 sandbox scope 中，fragment 内联 `onload/oncommand` 不能可靠访问 sandbox 中定义的 `ZoteroCodexBridgePreferences`。
    - `0.1.47` 依赖 `onload="ZoteroCodexBridgePreferences.init()"`，导致设置页初始化没有执行，按钮事件也没有绑定。
  - 修复：
    - 移除 `preferences.xhtml` 的内联 `onload` 和路径按钮内联 `oncommand`。
    - `preferences.js` 改为脚本加载后 `scheduleInit(0)` 轮询等待 `zotero-codex-bridge-preferences` DOM 插入，再执行初始化和事件绑定。
    - Paths 区改为 Zotero 原生近似结构：`html:input type="text" readonly class="directory-path zcb-path-control"`，文件夹图标改用 `moz-icon://` 背景，而不是自绘黑色大块。
    - Run mode 说明从底部说明块移动到旁侧圆形 `?` tooltip，并删除底部橙色 `zcb-warning` 说明。
    - FilePicker `displayDirectory` 改为官方源码同类写法：直接传当前路径字符串。
  - 内部测试版本提升到 `0.1.48`。
- 测试结果：
  - `npm run test`：通过，19 个测试文件、81 个测试全部通过。
  - `npm run lint`：通过。
  - `npm run typecheck`：通过。
  - `npm run build`：通过。
  - `npm run build:zotero-plugin:test`：通过，已生成 `dist/zotero-codex-bridge.xpi`。
  - 包内 smoke check：`manifest.json` 版本为 `0.1.48`；`preferences.xhtml` 不再含 `onload/oncommand`，含 `directory-path zcb-path-control` 和 Run mode tooltip；`preferences.js` 含测试包注入 runtime root、`scheduleInit(0)`、`click` 监听、`setPathElementValue()` 和 `displayDirectory = currentPath`。

- 2026-06-28：
  - 用户安装 `0.1.48` 后确认路径选择问题已解决，但 Run mode 后的问号无论悬浮还是点击都没有反应。
  - 修复：
    - 将问号按钮从 `tooltip="zcb-run-mode-tooltip"` 改为 XUL 更稳的 `tooltiptext="..."`。
    - 增加 `zcb-run-mode-help-text` 说明行，默认隐藏。
    - `preferences.js` 新增 `addToggleHelpListener()`，问号按钮同时监听 `command` 与 `click`，点击后显示/隐藏说明行，作为原生 tooltip 不显示时的可靠兜底。
    - 说明行使用普通说明色与自动换行，不再使用警告色。
  - 内部测试版本提升到 `0.1.49`。
- 测试结果：
  - `npm run test`：通过，19 个测试文件、81 个测试全部通过。
  - `npm run lint`：通过。
  - `npm run typecheck`：通过。
  - `npm run build`：通过。
  - `npm run build:zotero-plugin:test`：通过，已生成 `dist/zotero-codex-bridge.xpi`。
  - 包内 smoke check：`manifest.json` 版本为 `0.1.49`；`preferences.xhtml` 含 `tooltiptext`、`zcb-run-mode-help` 和 `zcb-run-mode-help-text`；`preferences.js` 含 `addToggleHelpListener("zcb-run-mode-help", "zcb-run-mode-help-text")`。

- 2026-06-28：
  - 用户安装 `0.1.49` 后确认路径选择问题已解决，但 Run mode 后的问号悬浮和点击仍没有任何效果，并提供 debug output。
  - 核对 debug output：
    - `0.1.49` 安装与启动正常，未看到 `zcb-run-mode-help` 相关异常。
    - 历史 `ReferenceError: ZoteroCodexBridgePreferences is not defined` 来自旧版内联 `onload`，不是 `0.1.49` 新错误。
    - 日志中仍出现 `NS_ERROR_XPC_BAD_CONVERT_JS ... nsIFilePicker.init`，指向路径选择 native fallback；用户已确认路径选择可用，暂按遗留/兜底路径错误单独记录，后续如复现再处理。
  - 源码与资料核对：
    - Zotero 7 官方开发文档说明插件 preference pane 通过 `Zotero.PreferencePanes.register({ src, scripts, stylesheets })` 注册，`src` 是 XUL/XHTML fragment。
    - 本机 Zotero 9.0.5 源码的偏好页使用普通 `description`、`button oncommand` 和 `directory-path`，没有发现内置偏好页使用问号按钮 + 鼠标旁复杂 tooltip 的稳定范例。
  - 根因判断：
    - `0.1.49` 问号按钮同时监听 `command` 与 `click`；XUL button 一次鼠标点击可能同时触发两个事件，说明行会显示后立刻隐藏，表现为“没有任何效果”。
    - 仅依赖 XUL `tooltiptext` 不足以作为可验收交互。
  - 修复：
    - `addToggleHelpListener()` 增加 `mouseenter` 显示、`mouseleave` 非固定状态隐藏。
    - 点击/command 改为固定/取消固定说明行，并加入 100ms 去重，避免一次点击双触发抵消。
  - 内部测试版本提升到 `0.1.50`。
- 测试结果：
  - `npm run test`：通过，19 个测试文件、81 个测试全部通过。
  - `npm run lint`：通过。
  - `npm run typecheck`：通过。
  - `npm run build`：通过。
  - `npm run build:zotero-plugin:test`：通过，已生成 `dist/zotero-codex-bridge.xpi`。
  - 包内 smoke check：`manifest.json` 版本为 `0.1.50`；`preferences.js` 含 `mouseenter`、`mouseleave`、`lastToggleAt` 和 `addToggleHelpListener("zcb-run-mode-help", "zcb-run-mode-help-text")`。

- 2026-06-28：
  - 用户确认 `0.1.50` 问号说明重复：鼠标移入会在下方显示说明，点击也会切换下方说明，同时悬浮一段时间还会出现原生鼠标 tooltip。
  - 修复：
    - 移除原生 `tooltiptext`，避免与自定义说明重复。
    - 移除下方 `zcb-run-mode-help-text` 说明行。
    - 改为单一 `zcb-run-mode-help-popover`，位于问号按钮旁；悬浮显示，移出隐藏，点击固定/取消固定。
  - 内部测试版本提升到 `0.1.51`。
- 测试结果：
  - `npm run test`：通过，19 个测试文件、81 个测试全部通过。
  - `npm run lint`：通过。
  - `npm run typecheck`：通过。
  - `npm run build`：通过。
  - `npm run build:zotero-plugin:test`：通过，已生成 `dist/zotero-codex-bridge.xpi`。
  - 包内 smoke check：`manifest.json` 版本为 `0.1.51`；`preferences.xhtml` 仅含 `zcb-run-mode-help-popover`，不再含 `tooltiptext` 或 `zcb-run-mode-help-text`；`preferences.js` 仍含 hover/click 固定逻辑。

- 2026-06-28：
  - 用户要求不要使用额外组件显示模式，改回 `0.1.51` 前的悬浮窗口模式；目标行为：
    - 鼠标悬停超过一定时间自动显示。
    - 悬停未达到自动显示时间时，主动点击也能触发显示。
    - 鼠标离开问号范围自动取消显示。
  - 修复：
    - 移除 HTML `zcb-run-mode-help-popover`。
    - 改为 XUL `<tooltip id="zcb-run-mode-tooltip">`，问号按钮通过 `tooltip="zcb-run-mode-tooltip"` 触发平台悬浮窗口。
    - `preferences.js` 将 `addToggleHelpListener()` 改为 `addTooltipHelpListener()`：点击/command 调用 `tooltip.openPopup(button, "after_start", 0, 0, false, false)` 主动显示；`mouseleave` 调用 `tooltip.hidePopup()` 关闭。
    - 保留 100ms 事件去重，避免 XUL button 的 `command` 和 `click` 双触发。
  - 内部测试版本提升到 `0.1.52`。
- 测试结果：
  - `npm run test`：通过，19 个测试文件、81 个测试全部通过。
  - `npm run lint`：通过。
  - `npm run typecheck`：通过。
  - `npm run build`：通过。
  - `npm run build:zotero-plugin:test`：通过，已生成 `dist/zotero-codex-bridge.xpi`。
  - 包内 smoke check：`manifest.json` 版本为 `0.1.52`；`preferences.xhtml` 含 `tooltip="zcb-run-mode-tooltip"` 和 XUL `<tooltip>`，不含 `tooltiptext` 或 `zcb-run-mode-help-popover`；`preferences.js` 含 `addTooltipHelpListener()`、`openPopup()` 和 `hidePopup()`。

- 2026-06-28：
  - 用户截图显示 `Backup space limit` 默认显示为 `-2 GB`。
  - 根因：
    - `prefs.js` 将默认 `backupMaxLocalBytes` 写为 `10737418240`（10GB 字节数）。
    - Zotero/Firefox preference 整数存储存在 32 位限制，该值溢出为负数，设置页再除以 1GB 后显示为 `-2`。
  - 修复：
    - 新增设置页专用 pref：`extensions.zotero-codex-bridge.backupMaxLocalGb = 10`。
    - 设置页优先读取 `backupMaxLocalGb`；仅当其不存在且旧 `backupMaxLocalBytes` 是合法正数时才兼容读取 bytes。
    - 如果旧 `backupMaxLocalBytes` 已经是负数或非法值，设置页回退显示 `10`。
    - 用户修改该项时，写入 `backupMaxLocalGb`，并将兼容用的 `backupMaxLocalBytes` 写为字符串形式，避免再次走 32 位整数溢出。
  - 内部测试版本提升到 `0.1.53`。
- 测试结果：
  - `npm run test`：通过，19 个测试文件、81 个测试全部通过。
  - `npm run lint`：通过。
  - `npm run typecheck`：通过。
  - `npm run build`：通过。
  - `npm run build:zotero-plugin:test`：通过，已生成 `dist/zotero-codex-bridge.xpi`。
  - 包内 smoke check：`manifest.json` 版本为 `0.1.53`；`prefs.js` 含 `backupMaxLocalGb = 10`，不再含 `backupMaxLocalBytes = 10737418240`；`preferences.js` 含旧负数兼容回退逻辑。
  - XPI 内容检查通过：`manifest.json`、`bootstrap.js`、`prefs.js`、`preferences.xhtml`、`preferences.js`、`preferences.css` 均在包内。

- 2026-06-28：
  - 用户反馈 `Runtime root` 默认文件夹位置再次不显示。
  - 根因：release XPI 中 `__ZOTERO_LOCAL_MCP_BRIDGE_RUNTIME_ROOT__` 会被替换为 `null`；设置页此前只读取已保存的 `runtimeRoot` pref 或测试包注入值，未自行计算生产默认 runtime root，因此 release 包或 pref 为空时路径栏会显示空。
  - 修复：
    - `preferences.js` 新增 `resolveDefaultRuntimeRoot()`，按插件运行时同类规则解析默认 runtime root：Windows 优先 `%APPDATA%`，其次 `%LOCALAPPDATA%` / home；macOS 使用 `~/Library/Application Support/zotero-local-mcp-bridge`；Linux 使用 `XDG_STATE_HOME` / `XDG_DATA_HOME` / `~/.local/share`。
    - `getRuntimeRoot()` 改为优先读取用户 pref，其次测试包注入路径，最后回退到 `resolveDefaultRuntimeRoot()`。
    - `joinPath()` 优先使用 Zotero/Firefox `PathUtils.join`，无 `PathUtils` 时再使用本地拼接。
    - 内部测试版本提升到 `0.1.54`。
  - 测试结果：
    - `npm run test -- tests/unit/zotero-plugin/pluginPackage.test.ts`：通过。
    - `npm run lint`：通过。
    - `npm run typecheck`：通过。
    - `npm run build`：通过。
    - `npm run build:zotero-plugin:test`：通过，已生成 `dist/zotero-local-mcp-bridge.xpi`。
    - 包内 smoke check：`bootstrap.js` 版本为 `0.1.54`；测试包含 `runtimeRoot: "H:\\ProgramDocument\\MixLanguage\\Zotero-codex-bridge"`；`preferences.js` 含 `resolveDefaultRuntimeRoot()`、`APPDATA`、`LOCALAPPDATA` 和 `zotero-local-mcp-bridge` 默认目录逻辑。
- 备注：用户在 2026-06-28 指出功能虽已具备，但关键可选项未出现在插件设置界面；因此本步骤插入到公开发布和 Codex skill 之前。

### 步骤 14A - 插件设置界面多国语言与本地化适配

执行优先级：当前下一阶段。必须先于 Codex 专用 skill、公开发布边缘文件、Zotero 插件公开分发和 MCP server 公开发布准备。

计划：
- 目标文件：
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\preferences.xhtml`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\preferences.js`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\scripts\buildZoteroPlugin.mjs`
  - 新增 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\locale\en-US\zotero-local-mcp-bridge.ftl`
  - 新增 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\locale\zh-CN\zotero-local-mcp-bridge.ftl`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\unit\zotero-plugin\pluginPackage.test.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\plugin-settings-ui-spec.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\README.md`
- 符号变更：
  - 不改变 MCP tool schema。
  - 不改变 Zotero 写操作命令表。
  - 不改变 endpoint、auth header、pref key 或 runtime path。
  - 仅修改设置界面展示文本与打包资源。
- 预期行为：
  - 设置页文本跟随 Zotero 应用 UI 语言，而不是直接读取 Windows 系统语言。
  - 设置页不再硬编码主要英文 UI 文案。
  - 支持本机 Zotero 9.0.5 源码中列出的全部 locale。
  - XPI 包内包含本地化资源。
  - 构建阶段不允许使用英文 fallback；缺少任一 supported locale 源文件时必须失败。
- 测试命令：
  - `npm run test`
  - `npm run lint`
  - `npm run typecheck`
  - `npm run build`
  - `npm run build:zotero-plugin:test`
  - XPI 包内检查：`tar -tf dist\zotero-local-mcp-bridge.xpi`
  - 人工在 Zotero 设置中切换语言或用至少中英文环境验证设置页文本。
- 通过标准：
  - 自动验证全部通过。
  - 设置页能显示中英文文本。
  - 设置页控件行为不因本地化而回退。
  - 仍不引入 Web API 写入、SQLite 写入或任意 JS eval。

执行：
- 开始时间：2026-06-28
- 结束时间：2026-06-28
- 操作内容：
  - 从本机 Zotero 9.0.5 `A:\Program Files\Zotero\app\omni.ja` 中读取 `chrome/locale/*/zotero/preferences.ftl`，确认 Zotero 当前打包 48 个 locale：`af-ZA`、`ar`、`bg-BG`、`br`、`ca-AD`、`cs-CZ`、`da-DK`、`de`、`el-GR`、`en-GB`、`en-US`、`es-ES`、`et-EE`、`eu-ES`、`fa`、`fi-FI`、`fr-FR`、`gl-ES`、`he-IL`、`hr-HR`、`hu-HU`、`id-ID`、`is-IS`、`it-IT`、`ja-JP`、`km`、`ko-KR`、`lt-LT`、`mn-MN`、`nb-NO`、`nl-NL`、`nn-NO`、`pl-PL`、`pt-BR`、`pt-PT`、`ro-RO`、`ru-RU`、`sk-SK`、`sl-SI`、`sr-RS`、`sv-SE`、`ta`、`th-TH`、`tr-TR`、`uk-UA`、`vi-VN`、`zh-CN`、`zh-TW`。
  - 本机 Zotero 源码依据：偏好页加载器插入 pane 后调用 `document.l10n.translateFragment(pane.container)`；内置偏好页使用 `data-l10n-id` / `data-l10n-attrs`。
  - 新增 `src/zotero-plugin/locale/supportedLocales.json`，固化上述 48 个 locale。
  - 新增 `src/zotero-plugin/locale/en-US/zotero-local-mcp-bridge.ftl`、`zh-CN`、`zh-TW`。
  - `preferences.xhtml` 改为通过 `<linkset><html:link rel="localization" href="zotero-local-mcp-bridge.ftl"/></linkset>` 引入 Fluent 资源，并将主要 UI 文案改为 `data-l10n-id`。
  - `scripts/buildZoteroPlugin.mjs` 在打包时为所有 supported locale 生成 `locale/<locale>/zotero-local-mcp-bridge.ftl`；缺少任一 locale 源文件时直接失败，不再回退到 `en-US`。
  - 更新 `tests/unit/zotero-plugin/pluginPackage.test.ts`，要求 XPI 包含所有 48 个 locale 的 Fluent 资源，并检查每个 supported locale 都存在源文件。
  - 更新 `docs/plugin-settings-ui-spec.md`、`README.md`、`docs/spec-zotero-local-write-mcp.md`，记录本地化策略。
  - 2026-06-28 追加修订：根据用户明确要求“不要使用 Fallback，直接生成所有语言的本地化文件”，为全部 48 个 locale 生成 `src/zotero-plugin/locale/<locale>/zotero-local-mcp-bridge.ftl` 源文件；非 `en-US` locale 均不再与 `en-US` 完全相同。
  - 2026-06-28 追加修订：根据用户明确要求“手动编辑各个语言的语言包，不要使用机器翻译接口”，人工统一运行模式术语：`YOLO`、`Dry-run`、`TTL` 保留为技术术语，`readonly`、`askforapprove` 改为各语言可读标签；48 个 locale 均更新运行模式标签和说明文本。
  - 2026-06-28 追加修订：补齐 `af-ZA`、`ar`、`bg-BG`、`de`、`el-GR`、`fr-FR`、`gl-ES`、`he-IL`、`hr-HR`、`hu-HU` 中明显仍为英文或半英文的核心设置项；修正 `da-DK`、`ta` 的 `Runtime root` 残留英文标签。
  - 2026-06-28 追加修订：完成全部 48 个 locale 的完整可见文案人工校订。校订范围覆盖 description、运行模式、只读/请求批准/YOLO 标签、运行模式说明、真实主库解锁 TTL、备份/撤销、备份保留与空间限制、附件默认模式、附件重复检查、路径标题、runtime/audit/backup 目录和选择目录按钮。
  - 2026-06-28 追加修订：术语策略统一为产品名 `Zotero Local MCP Bridge` 保持不翻译；`Zotero`、`MCP`、`Dry-run`、`TTL`、`YOLO` 保留；`readonly`、`askforapprove` 不再作为用户可见枚举名出现，而按各语言习惯翻译。
- 测试结果：
  - `npm run test -- tests/unit/zotero-plugin/pluginPackage.test.ts`：通过，6 个测试全部通过。
  - 完整自动验证通过：`npm run test`、`npm run lint`、`npm run typecheck`、`npm run build`、`npm run build:zotero-plugin`、`npm run build:zotero-plugin:test`。
  - XPI 静态检查通过：`dist/zotero-local-mcp-bridge.xpi` 内包含 48 个 `locale/<locale>/zotero-local-mcp-bridge.ftl`；`preferences.xhtml` 包含 `<html:link rel="localization" href="zotero-local-mcp-bridge.ftl"/>`；`zh-CN` 包含中文设置文案。
  - 2026-06-28 追加验证通过：`tests/unit/zotero-plugin/pluginPackage.test.ts` 已要求每个 supported locale 都有源目录和 `.ftl` 文件、非 `en-US` 文件不得与 `en-US` 完全相同、`scripts/buildZoteroPlugin.mjs` 不得包含 `fallback`，并要求缺失 locale 资源时报错。
  - 2026-06-28 XPI 抽样检查通过：包内 locale 文件数为 48；`fr-FR` 可读到 `Mode d'exécution`，`ja-JP` 可读到 `実行モード`，`zh-CN` 可读到 `运行模式`。
  - 2026-06-28 追加验证通过：非英语 locale 不再命中本轮检查的英文基准短语残留；运行模式旧枚举名不再作为可见文本残留，仅保留在 Fluent key 名中。
  - 2026-06-28 追加验证通过：`npm run test -- tests/unit/zotero-plugin/pluginPackage.test.ts` 通过，6 个测试全部通过；`npm run build:zotero-plugin:test` 通过。
  - 2026-06-28 追加验证通过：全部 48 个 `zotero-local-mcp-bridge.ftl` 文件均包含 28 个 Fluent message；非英语 locale 不再命中 `Configure local bridge`、`Run mode`、`Real-profile unlock`、`File backup`、`Backup retention`、`Runtime root` 等英文基准短语；旧枚举词 `readonly`、`askforapprove`、`yolo` 不再作为可见标签或说明文本出现。
  - 2026-06-28 追加验证通过：完整人工校订后，`npm run test -- tests/unit/zotero-plugin/pluginPackage.test.ts` 通过，6 个测试全部通过；`npm run build:zotero-plugin:test` 通过。
  - 2026-06-28 完整验证通过：`npm run test` 通过，19 个测试文件、82 个测试用例全部通过；`npm run lint` 通过；`npm run typecheck` 通过；`npm run build` 通过；`npm run build:zotero-plugin` 通过；`npm run build:zotero-plugin:test` 顺序执行通过。
  - 2026-06-28 XPI 静态检查通过：release XPI 内包含 48 个 `locale/<locale>/zotero-local-mcp-bridge.ftl`；`preferences.xhtml` 正确声明 `zotero-local-mcp-bridge.ftl` localization；抽样 `zh-CN`、`fr-FR`、`ja-JP`、`et-EE` 可读到校订后的本地化文本。
  - 2026-06-28 验证偏差记录：首次并行执行 `npm run build:zotero-plugin` 与 `npm run build:zotero-plugin:test` 时，两个任务同时清理同一个 `dist/zotero-plugin` 目录，在 Windows 上触发 `EPERM rmdir`；改为顺序执行后两者均通过。
- 备注：本步骤来自 2026-06-28 用户明确要求，“多国语言适配设置”为下一阶段任务。全部 48 个 locale 已完成本轮完整人工校订。release XPI 中仍包含 test profile marker 常量和默认测试目录名常量，这是当前 profile guard 代码的一部分，不包含本机绝对路径、测试 token 或测试数据；发布候选验收阶段需再次复核是否需要移出 release 包。

### 步骤 15 - 通用 Agent / MCP 使用 Skill

计划：
- 目标文件：
  - 新增或修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\agent-skill.md`
  - 新增 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\skills\zotero-local-mcp-bridge\SKILL.md`
  - 新增 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\skills\zotero-local-mcp-bridge\agents\openai.yaml`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\mcp-publication.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\README.md`
- 符号变更：
  - 无项目代码符号。
  - 定义通用 MCP Agent 工作流：health、read、dry-run、execute、audit、backup、undo、stop conditions。
  - Codex 仅作为第一个适配小节，不作为核心协议边界。
- 预期行为：
  - 任意支持 MCP 的 agent 使用该 skill/规范时，都应通过 MCP tool 与本项目交互。
  - Agent 不应直接调用 Zotero 插件 HTTP command endpoint；除 health check 或诊断外，直接 HTTP 调用视为绕过 MCP 安全层。
  - Agent 使用该 skill 时不会绕过 dry-run 和 confirmation。
  - 对删除、merge、真实主库写入、高风险批量操作会停止并要求用户确认。
  - skill 明确不使用 Zotero Web API，不直接写 `zotero.sqlite`，不暴露任意 JS eval。
  - Codex 适配说明只记录 Codex 的 skill 安装路径、MCP tool 调用习惯、用户确认交互方式和停止条件。
- 测试命令：
  - 3 到 5 个通用 agent prompt 在 test profile 中演练。
  - 至少 2 个 Codex 适配 prompt 演练。
  - 检查每次写操作都有 audit。
- 通过标准：
  - 通用 skill 可稳定引导 collection、item、attachment、tag、note、backup/undo 工作流。
  - 高风险操作按 stop conditions 停止。
  - Codex 适配部分不复制核心协议，只引用通用 Agent/MCP 规则。

执行：
- 开始时间：2026-06-28
- 结束时间：进行中
- 操作内容：
  - 2026-06-28 根据用户要求生成通用 Agent / MCP 使用 skill，初版曾生成到本机 `.codex` 安装目录。
  - 2026-06-28 根据用户要求修订：发布源不得放在 `.codex` 用户目录；已将可发布 skill 生成到仓库内 `skills/zotero-local-mcp-bridge/`，包含 `SKILL.md` 与 `agents/openai.yaml`。
  - 2026-06-28 删除本机 `.codex\skills\zotero-local-mcp-bridge` 安装副本，避免将用户目录误作发布源。
  - 2026-06-28 通过 `skill-creator` 初始化 skill 元数据，并保留可发布的 `agents/openai.yaml`。
  - 2026-06-28 新增项目内源文档 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\agent-skill.md`，记录通用 skill 的项目版本说明。
  - skill 内容明确：正式工作流必须通过 MCP tool；禁止 agent 直接调用 Zotero 插件 command HTTP endpoint，除 health/debug 诊断外；禁止 Zotero Web API 写入、直接写 `zotero.sqlite`、任意 JS eval 和 group library。
  - skill 内容覆盖：启动检查、读操作、写操作 dry-run/execute、确认规则、真实主库写入、附件规则、导入导出/引用/annotation、批量行为、响应格式和 Codex 适配说明。
  - 2026-06-28 根据用户反馈补充：上一版 skill 只有安全工作流，缺少支持命令格式和操作方法说明；现已新增 `MCP Call Format`、完整 `Supported Commands` 表格，列出 command、生成的 MCP tool 名、读写属性和 input 字段，并同步更新 `docs/agent-skill.md` 的命令格式与命令分组。
  - 2026-06-28 根据用户反馈补充：新增 `Plugin Settings And Permission Blocks`，明确 Zotero 设置入口为 `Zotero Settings -> Zotero Local MCP Bridge`；规定 `readonly` 阻止写入、真实主库锁定、backup/undo 关闭、backup/runtime 路径不合法、附件重复检查阻断、批量超限等场景下 agent 必须停止并提示用户修改插件设置或显式确认，不能自动提权或绕过设置。
- 测试结果：
  - 初版本机安装副本曾通过 `quick_validate.py` 验证，输出 `Skill is valid!`。
  - 2026-06-28 补充命令格式后再次运行 `quick_validate.py`：初版安装副本验证通过，输出 `Skill is valid!`。
  - 2026-06-28 仓库内发布版验证通过：`python C:/Users/chenl/.codex/skills/.system/skill-creator/scripts/quick_validate.py H:/ProgramDocument/MixLanguage/Zotero-codex-bridge/skills/zotero-local-mcp-bridge` 输出 `Skill is valid!`。
  - 2026-06-28 补充插件设置和权限阻断说明后再次运行仓库内发布版 `quick_validate.py`：通过，输出 `Skill is valid!`。
- 备注：2026-06-28 根据用户判断修订：由于本项目通过 MCP server 中转，skill 应定义为通用 Agent / MCP 使用规范，而不是 Codex 专用 skill。Codex 只作为首个适配目标。步骤 14A 已完成验证。本步骤仍需后续补充 README / MCP publication 文档链接，并用真实 prompt 做 test profile 演练。

### 步骤 15A - 发布边缘文件与个人赞助渠道

计划：
- 目标文件：
  - 新增 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\LICENSE`
  - 新增 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\SECURITY.md`
  - 新增 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\PRIVACY.md`
  - 新增 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\CHANGELOG.md`
  - 新增 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\.github\FUNDING.yml`
  - 新增 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\.github\workflows\ci.yml`
  - 新增 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\server.json`
  - 新增 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\sponsorship.md`
  - 新增 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\mcp-publication.md`
  - 新增 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\zotero-plugin-publication.md`
  - 新增 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\compatibility-matrix.md`
  - 新增 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\roadmap-complete-zotero-coverage.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\README.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\release-readiness.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\package.json`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\package-lock.json`
- 符号变更：
  - 无代码符号。
  - `package.json` 和 `package-lock.json` 增加 `AGPL-3.0-or-later` license 元数据。
  - 发布边缘文档记录 Ko-fi 与爱发电为计划赞助渠道，不使用 Open Source Collective 等 fiscal host。
- 预期行为：
  - 仓库具备公开发布前需要审查的许可证、安全、隐私、变更日志、CI、Funding、MCP metadata、Zotero 插件发布、兼容矩阵和路线图文件。
  - Funding 文件在真实 Ko-fi / 爱发电页面建立前不发布假链接。
  - README 明确当前赞助渠道计划和边缘文件位置。
- 测试命令：
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test`
  - `npm run build`
  - `npm run build:zotero-plugin:release`
  - `rg "YOUR_|placeholder|TODO|TBD" README.md docs SECURITY.md PRIVACY.md CHANGELOG.md server.json .github package.json`
- 通过标准：
  - 自动验证通过。
  - 边缘文件不含本机 token、测试 profile 数据或不存在的赞助链接。
  - 如 Funding 文件因为缺少真实账号 URL 只能保持注释模板，应在备注中明确这是用户账号信息缺口，不是代码阻塞。

执行：
- 开始时间：2026-06-28 14:21:39
- 结束时间：2026-06-28 14:23:58
- 操作内容：
  - 新增 `LICENSE`，声明 `AGPL-3.0-or-later`。
  - 新增 `SECURITY.md`、`PRIVACY.md`、`CHANGELOG.md`。
  - 新增 `.github/FUNDING.yml` 注释模板；因用户尚未提供真实 Ko-fi / 爱发电主页，不写入不存在的赞助链接。
  - 新增 `.github/workflows/ci.yml`，在 Windows + Node 22 上运行 typecheck、lint、test、build 和 release XPI 打包。
  - 新增 `server.json` 作为 MCP publication metadata 草案。
  - 新增 `docs/sponsorship.md`、`docs/mcp-publication.md`、`docs/zotero-plugin-publication.md`、`docs/compatibility-matrix.md`、`docs/roadmap-complete-zotero-coverage.md`。
  - 更新 `README.md` 和 `docs/release-readiness.md`，记录 AGPL、Ko-fi / 爱发电、当前不使用 fiscal host，以及已生成的边缘文件。
  - 更新 `package.json` 与 `package-lock.json` 的 license 元数据。
- 测试结果：通过。
  - `rg "YOUR_|placeholder|TODO|TBD" README.md docs SECURITY.md PRIVACY.md CHANGELOG.md server.json .github package.json`：无命中。
  - `npm run typecheck`：通过。
  - `npm run lint`：通过。
  - `npm run test`：通过，19 个测试文件、82 个测试用例全部通过。
  - `npm run build`：通过。
  - `npm run build:zotero-plugin:release`：通过，生成 `dist\zotero-local-mcp-bridge.xpi`。
  - `node` JSON 解析检查 `server.json`、`package.json`、`package-lock.json`：通过。
  - release XPI 展开静态检查：未命中 `H:\ProgramDocument`、`manual-probe-token`、`__ZOTERO_LOCAL_MCP_BRIDGE_AUTH_TOKEN__`、`__ZOTERO_LOCAL_MCP_BRIDGE_PROJECT_ROOT__`。
  - `.github/FUNDING.yml` 当前只包含注释模板；未启用不存在的 Ko-fi 或爱发电链接。
- 备注：本步骤根据用户 2026-06-28 确认“准备使用 Ko-fi 和爱发电作为赞助渠道”插入。真实赞助 URL 需要用户在 Ko-fi / 爱发电页面建立后提供，再启用 `.github/FUNDING.yml`。`LICENSE` 当前包含 AGPL-3.0-or-later 声明、FSF 规范文本链接和 SPDX 标识；发布候选验收时可替换为完整 FSF license 全文以提升 GitHub 许可证识别稳定性。

### 步骤 15B - 用户向 README 与开源边缘文件重写

计划：
- 目标文件：
  - 重写 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\README.md`
  - 新增 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\README.zh-CN.md`
  - 重写 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\CHANGELOG.md`
  - 重写 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\release-readiness.md`
  - 新增 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\CONTRIBUTING.md`
  - 新增 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\CODE_OF_CONDUCT.md`
  - 新增 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\SUPPORT.md`
  - 新增 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\.github\pull_request_template.md`
  - 新增 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\.github\ISSUE_TEMPLATE\bug_report.yml`
  - 新增 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\.github\ISSUE_TEMPLATE\feature_request.yml`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\package.json`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\package-lock.json`
- 符号变更：
  - 无代码符号。
  - README 从历史/计划混合说明改为用户入口：一句话定位、语言切换、快速开始、安全模型、能力表、文档索引、开发命令、支持和许可证。
  - `README.md` 使用英文，`README.zh-CN.md` 使用中文，避免主 README 中英混搭。
  - package metadata 补充 homepage、repository、bugs 和 keywords。
- 预期行为：
  - README 面向使用者，不再承载项目历史、内部步骤、runtime 里程碑或计划日志。
  - 边缘文件形成普通开源项目结构：贡献指南、行为准则、支持说明、issue/PR 模板、发布检查清单。
  - 开发过程和历史证据继续留在 `TaskDocs/`，不放在 README。
- 测试命令：
  - `rg "[\p{Han}]" README.md`
  - `node -e "for (const f of ['package.json','package-lock.json','server.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('json ok')"`
  - `npm install --package-lock-only`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test`
  - `npm run build`
  - `npm run build:zotero-plugin:release`
  - release XPI 静态检查本机路径和测试 token。
- 通过标准：
  - 英文 README 不含中文字符。
  - JSON 文件可解析。
  - npm lockfile 与 package metadata 同步。
  - 自动验证全部通过。
  - release XPI 不含本机路径、测试 token 或构建占位符。

执行：
- 开始时间：2026-06-28 14:58:51
- 结束时间：2026-06-28 14:58:51
- 操作内容：
  - 参考用户指定的公开项目 README 结构方向，将 `README.md` 重写为纯英文用户入口。
  - 新增 `README.zh-CN.md`，提供中文用户入口，并与英文 README 互相链接。
  - 将项目历史、执行顺序和内部里程碑从 README 移除；此类内容继续保留在 `TaskDocs/`。
  - 重写 `CHANGELOG.md`，改为用户可读的 pre-release changelog。
  - 重写 `docs/release-readiness.md`，改为发布检查清单。
  - 新增 `CONTRIBUTING.md`、`CODE_OF_CONDUCT.md`、`SUPPORT.md`、GitHub PR 模板和 bug/feature issue forms。
  - 更新 `package.json` 和 `package-lock.json` 的公开 metadata。
- 测试结果：通过。
  - `rg "[\p{Han}]" README.md`：无中文字符命中。
  - `node` JSON 解析检查 `package.json`、`package-lock.json`、`server.json`：通过。
  - `npm install --package-lock-only`：通过，0 vulnerabilities。
  - `npm run typecheck`：通过。
  - `npm run lint`：通过。
  - `npm run test`：通过，19 个测试文件、82 个测试用例全部通过。
  - `npm run build`：通过。
  - `npm run build:zotero-plugin:release`：通过。
  - release XPI 展开静态检查：未命中 `H:\ProgramDocument`、`manual-probe-token`、`__ZOTERO_LOCAL_MCP_BRIDGE_AUTH_TOKEN__`、`__ZOTERO_LOCAL_MCP_BRIDGE_PROJECT_ROOT__`。
- 备注：本步骤回应用户指出“README 是给使用者看的，不要放项目历史，不要中英混搭”。参考项目只用于结构启发，不复制其内容。

### 步骤 15C - 安全的一键安装助手

计划：
- 目标文件：
  - 新增 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\scripts\install.mjs`
  - 新增 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\installation.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\package.json`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\package-lock.json`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\eslint.config.js`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\README.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\README.zh-CN.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\zotero-plugin-publication.md`
- 符号变更：
  - 新增 npm script `install:local`。
  - 新增 Node 安装助手 `scripts/install.mjs`，支持 `--build`、`--xpi <path>`、`--open-xpi`、`--no-open-folder`、`--zotero <path>`。
  - ESLint 仅对 `scripts/**/*.mjs` 声明 Node 全局变量，不放宽 TypeScript 源码规则。
- 预期行为：
  - 本地用户可运行 `npm run install:local -- --build` 完成 release XPI 构建、打开 XPI 目录并获取 health check 命令。
  - 安装助手不静默写入 Zotero profile，不绕过 Zotero 插件管理器；最终插件安装仍由用户在 Zotero 中确认。
  - README 和安装文档明确说明该边界。
- 测试命令：
  - `node scripts/install.mjs --help`
  - `node scripts/install.mjs --no-open-folder`
  - `npm run install:local -- --build --no-open-folder`
  - `npm install --package-lock-only`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test`
  - `npm run build`
  - `npm run build:zotero-plugin:release`
  - release XPI 静态检查本机路径和测试 token。
- 通过标准：
  - 安装助手帮助输出和无 UI 路径可执行。
  - 一键构建路径可执行。
  - 自动验证通过。
  - release XPI 不含本机路径、测试 token 或构建占位符。

执行：
- 开始时间：2026-06-28 15:16:56
- 结束时间：2026-06-28 15:16:56
- 操作内容：
  - 新增 `scripts/install.mjs`。
  - 新增 `docs/installation.md`。
  - `package.json` 新增 `install:local` script，`package-lock.json` 同步。
  - README 英文和中文版本新增本地安装助手说明。
  - `docs/zotero-plugin-publication.md` 增加 CLI helper 发布说明。
  - `eslint.config.js` 增加 `scripts/**/*.mjs` 的 Node 全局变量配置。
- 测试结果：通过。
  - `node scripts/install.mjs --help`：通过，输出用法和参数。
  - `node scripts/install.mjs --no-open-folder`：通过，输出安装步骤和 health check。
  - `npm run install:local -- --build --no-open-folder`：通过，自动运行 release XPI 构建并输出安装步骤。
  - `npm install --package-lock-only`：通过，0 vulnerabilities。
  - `npm run typecheck`：通过。
  - `npm run lint`：通过。
  - `npm run test`：通过，19 个测试文件、82 个测试用例全部通过。
  - `npm run build`：通过。
  - `npm run build:zotero-plugin:release`：通过。
  - release XPI 展开静态检查：未命中 `H:\ProgramDocument`、`manual-probe-token`、`__ZOTERO_LOCAL_MCP_BRIDGE_AUTH_TOKEN__`、`__ZOTERO_LOCAL_MCP_BRIDGE_PROJECT_ROOT__`。
- 备注：本步骤没有实现静默安装到 Zotero profile。原因是 Zotero 插件具备高权限，公开安装路径应保留 Zotero 插件管理器中的用户确认和重启边界。后续 npm 公开发布后，可把该助手升级为 `zotero-local-mcp-bridge install`，但仍不应绕过 Zotero 的插件安装确认。

### 步骤 15D - README 与用户向文档切换为正式发布口径

计划：
- 目标文件：
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\README.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\README.zh-CN.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\installation.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\mcp-publication.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\zotero-plugin-publication.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\release-readiness.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\compatibility-matrix.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\SUPPORT.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\CHANGELOG.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\CONTRIBUTING.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\.github\ISSUE_TEMPLATE\bug_report.yml`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\package.json`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\package-lock.json`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\scripts\install.mjs`
- 符号变更：
  - 移除 public npm scripts `build:zotero-plugin:test` 和 `build:zotero-plugin:dev`。
  - 安装助手 health check User-Agent 不再硬编码内部版本号。
  - README / 中文 README 改为正式 release XPI、release install helper、read-only first 的用户口径。
- 预期行为：
  - 用户向 README 和安装文档不再出现 test XPI、test profile、`npm run build:zotero-plugin:test`、内部版本号 `0.1.54`。
  - package scripts 中只保留公开发布构建入口 `build:zotero-plugin` / `build:zotero-plugin:release`。
  - 开发验证命令仍可在贡献指南和 CI 中存在，但不作为用户安装路径。
- 测试命令：
  - `rg "build:zotero-plugin:test|build:zotero-plugin:dev|test profile|Test profile|测试 profile|测试 XPI|test XPI|0\.1\.54|0\.1\.x" README.md README.zh-CN.md docs/installation.md docs/zotero-plugin-publication.md docs/mcp-publication.md docs/release-readiness.md SUPPORT.md CHANGELOG.md CONTRIBUTING.md package.json`
  - `npm install --package-lock-only`
  - `node scripts/install.mjs --help`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test`
  - `npm run build`
  - `npm run build:zotero-plugin:release`
  - `npm run install:local -- --build --no-open-folder`
  - release XPI 静态检查本机路径和测试 token。
- 通过标准：
  - 用户向文档检查无命中。
  - lockfile 同步。
  - 自动验证通过。
  - 安装助手 release 路径可执行。
  - release XPI 不含本机路径、测试 token 或构建占位符。

执行：
- 开始时间：2026-06-28 15:21:27
- 结束时间：2026-06-28 15:21:27
- 操作内容：
  - README 和中文 README 从“测试 XPI / 测试 profile”安装路径改为“下载 release XPI / 本地 release 安装助手”路径。
  - `docs/installation.md` 改为 release install 优先。
  - `scripts/install.mjs` health check User-Agent 改为 `ZoteroLocalMcpBridge`。
  - `package.json` 移除公开 npm scripts `build:zotero-plugin:test` 和 `build:zotero-plugin:dev`；`package-lock.json` 同步。
  - 公开发布、支持、兼容矩阵、changelog 和 issue form 文案改为 clean/existing profile、verified、release candidate 等正式发布口径。
- 测试结果：通过。
  - 用户向文档检查命令无命中。
  - `npm install --package-lock-only`：通过，0 vulnerabilities。
  - `node scripts/install.mjs --help`：通过。
  - `npm run typecheck`：通过。
  - `npm run lint`：通过。
  - `npm run test`：通过，19 个测试文件、82 个测试用例全部通过。
  - `npm run build`：通过。
  - `npm run build:zotero-plugin:release`：通过。
  - `npm run install:local -- --build --no-open-folder`：通过，自动运行 release XPI 构建并输出正式 health check。
  - release XPI 展开静态检查：未命中 `H:\ProgramDocument`、`manual-probe-token`、`__ZOTERO_LOCAL_MCP_BRIDGE_AUTH_TOKEN__`、`__ZOTERO_LOCAL_MCP_BRIDGE_PROJECT_ROOT__`。
- 备注：内部规格、源码审计和集成验收文档仍保留历史测试 profile 信息，作为开发/验收资料；用户向 README、安装文档和发布边缘文件已切换为正式发布口径。

### 步骤 15E - 三种安装方式与 MCP 生命周期说明

计划：
- 目标文件：
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\installation.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\README.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\README.zh-CN.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\mcp-publication.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\zotero-plugin-publication.md`
- 符号变更：
  - 无代码符号。
  - 文档定义三种正式安装路径：
    1. `npm install -g zotero-local-mcp-bridge` 后运行 `zotero-local-mcp-bridge setup` 或 `zotero-local-mcp-bridge setup [agent]`。
    2. clone 项目后本地 build，生成 XPI、skill 文件和 MCP server build，并提醒用户手动安装 XPI/skill。
    3. GitHub Release 直接发布构建好的 XPI、skill archive、MCP server artifact/checksums。
  - 当时明确 MCP server 不集成在 XPI 中；XPI 只包含 Zotero 插件文件和 locale 资源。
  - 当时曾记录 Zotero 只负责插件生命周期、MCP server 由 MCP client 或 CLI 启停；该口径已于 2026-06-28 被步骤 15G 废弃，最终发布版必须由 Zotero 插件管理 MCP sidecar 启停。
- 预期行为：
  - 用户能从 README 和 installation 文档理解三种安装方式。
  - 用户不会误以为 MCP server 会随着 Zotero 自动启动或退出。
  - setup 命令的目标是引导和配置，不静默安装高权限 Zotero 插件。
- 测试命令：
  - 历史命令，已由步骤 15G 修订取代：原先检查三种安装方式与“独立 MCP 生命周期”的文档口径；不再作为后续验收标准。
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test`
  - `npm run build`
  - `npm run install:local -- --build --no-open-folder`
- 通过标准：
  - 文档命中三种安装方式和生命周期说明。
  - 自动验证通过。
  - 安装助手仍可执行 release 构建路径。

执行：
- 开始时间：2026-06-28 15:42:07
- 结束时间：2026-06-28 15:42:07
- 操作内容：
  - 重写 `docs/installation.md`，新增 Option 1/2/3：npm global setup、clone and build、GitHub release artifacts。
  - README 英文和中文版本补充三种安装路径，并说明 MCP server 不在 XPI 中。
  - `docs/mcp-publication.md` 补充 MCP server 是单独 Node.js 进程、计划 `setup` / `setup codex` 命令。
  - `docs/zotero-plugin-publication.md` 补充 release artifact 应包含 XPI、skill archive、MCP server package，并说明 setup 仍不能绕过 Zotero 插件管理器。
  - 使用 CodeGraph 确认当前结构：`ZoteroPluginClient` 位于 `src/mcp-server/zoteroPluginClient.ts`，MCP server 通过 HTTP 调用本地 Zotero 插件 endpoint；当前 XPI 包内容只有 `manifest/bootstrap/preferences/locale`，不含 MCP server。
- 测试结果：通过。
  - 文档检查命令命中 README、中文 README、installation、MCP publication 和 Zotero plugin publication 中的三种安装方式与生命周期说明。
  - `npm run typecheck`：通过。
  - `npm run lint`：通过。
  - `npm run test`：通过，19 个测试文件、82 个测试用例全部通过。
  - `npm run build`：通过。
  - `npm run install:local -- --build --no-open-folder`：通过，自动运行 release XPI 构建并输出正式 health check。
- 备注：当前实现还没有公开 npm `bin` 命令 `zotero-local-mcp-bridge setup`；本步骤先固定发布安装设计和用户文档。后续步骤应实现 CLI `bin`、skill archive 打包、agent-specific skill 安装和 MCP client 配置写入。
- 2026-06-28 修订备注：本步骤中“Zotero 只负责插件生命周期、MCP server 由 MCP client 或 CLI 启停”的口径已被步骤 15G 废弃；最终发布版要求 MCP 随 Zotero 启停。

### 步骤 15F - 实现真实 MCP stdio server

计划：
- 目标文件：
  - 新增 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\mcp-server\stdioServer.ts`
  - 新增 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\mcp-server\cli.ts`
  - 新增 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\unit\mcp-server\stdioServer.test.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\mcp-server\index.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\package.json`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\server.json`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\README.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\README.zh-CN.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\installation.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\mcp-publication.md`
- 符号变更：
  - 新增 `createDefaultMcpToolRegistry`
  - 新增 `createZoteroMcpServer`
  - 新增 `registerZoteroTools`
  - 新增 `runZoteroMcpStdioServer`
  - 新增 `callRegistryTool`
  - 新增 npm bin：`zotero-local-mcp-bridge`
  - 新增 npm scripts：`mcp`、`mcp:health`、`mcp:tools`
- 预期行为：
  - MCP client 可通过标准 stdio MCP 协议启动 server。
  - `tools/list` 返回现有 Zotero 命令表映射出的 MCP tools。
  - `tools/call` 能调用现有 `McpToolRegistry`。
  - 读命令直接转发到 Zotero 插件 HTTP endpoint。
  - 写命令默认返回 dry-run plan；execute 必须带匹配的 `planId` 和 `confirmationToken`。
  - server 使用本项目既有 token store 与 audit logger，不直接暴露 Zotero 插件内部 HTTP command endpoint 给 Agent。
- 测试命令：
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test`
  - `npm run build`
  - `node dist/src/mcp-server/cli.js tools`
  - stdio JSON-RPC smoke：`initialize` + `tools/list`
  - stdio JSON-RPC smoke：`tools/call` 调用 `zotero_collection_create` 并确认返回 dry-run plan
- 通过标准：
  - 自动测试通过。
  - MCP stdio handshake 返回 `serverInfo.name = "zotero-local-mcp-bridge"`。
  - `tools/list` 返回 Zotero MCP tools。
  - 写命令 dry-run 返回 `operation` 和 confirmation token。

执行：
- 开始时间：2026-06-28 15:55:00
- 结束时间：2026-06-28 16:02:00
- 操作内容：
  - 安装 `@modelcontextprotocol/sdk` 和 `zod` 依赖。
  - 新增真实 stdio MCP server，将 `McpToolRegistry.listTools()` 中的每个命令注册为一个 MCP tool。
  - 新增 CLI：`mcp` 启动 stdio server，`tools` 输出命令表，`health` 检查 Zotero 插件，`setup` 输出非静默安装说明。
  - 修复源码运行时 token 选择：如果当前工作目录存在 `runtime/auth/bridge-token` 且没有显式 `ZOTERO_LOCAL_MCP_BRIDGE_RUNTIME_DIR`，CLI 自动使用当前仓库作为 runtime root；正式全局安装仍默认使用系统 runtime。
  - `server.json` 的启动命令改为 `zotero-local-mcp-bridge mcp`。
  - README、中文 README、安装文档和 MCP 发布文档补充真实 MCP 启动方式。
  - 通过 CodeGraph 和 GitNexus 确认接入点为低风险：`McpToolRegistry` 只影响导出和单元测试，未改变插件内部命令实现。
- 测试结果：通过。
  - `npm run typecheck`：通过。
  - `npm run lint`：通过。
  - `npm run test`：通过，20 个测试文件、85 个测试用例全部通过。
  - `npm run build`：通过。
  - `node dist/src/mcp-server/cli.js tools`：通过，输出完整 Zotero MCP tool 描述列表。
  - stdio JSON-RPC `initialize` + `tools/list`：通过，返回 serverInfo 与 tools。
  - stdio JSON-RPC `tools/call zotero_collection_create`：通过，返回 `mode: "dry-run"`、`operation: "collection.create"` 和 confirmation token。
  - `node dist/src/mcp-server/cli.js health`：通过，返回 `zotero-local-mcp-bridge ok 0.1.54 zotero-local-mcp-bridge@example.com test`。
  - stdio JSON-RPC `tools/call zotero_collection_getTree`：通过，返回 `mode: "execute"`、`ok: true`、`commandName: "collection.getTree"`，当前测试 profile collection 数量为 4。
- 备注：
  - 当前 MCP server 是独立 Node.js 进程，可由 MCP client 或 CLI 启停，已满足协议层验证，但这只是开发/调试能力，不满足最终发布目标。
  - 2026-06-28 用户明确修订：最终发布版必须做到 MCP 随 Zotero 启停，不能依赖 MCP client、CLI、shell 或用户手动启动后台服务；因此下一步必须进入步骤 15G。
  - `setup [agent]` 的自动化安装能力仍是后续增强；当前 `setup` 只输出安全安装指引。

### 步骤 15G - MCP 生命周期绑定 Zotero 启停

2026-06-28 架构修订：
- 用户明确要求发布版必须无 CLI/终端弹窗，且插件不应再暴露私有 command HTTP 接口。
- 本步骤技术路线从“Zotero 托管 Node/Python sidecar”修订为“**插件内直接实现 HTTP MCP endpoint**”。
- 新默认入口为 Zotero connector server 上的 `/zotero-local-mcp-bridge/mcp`，复用 Zotero 自带 `127.0.0.1:23119`，不再额外占用 `23120`。
- 发布版默认不再注册 `/zotero-local-mcp-bridge/command`；外部调用方只能通过 MCP JSON-RPC `initialize`、`tools/list`、`tools/call` 访问插件内部命令表。
- 现有 `src/mcp-server/*` stdio/sidecar 路线仅作为历史开发验证资产，待插件内 MCP endpoint 完成自动测试和 Zotero runtime 验收后删除或迁移为可选兼容包；不得作为默认发布路径。
- 技术栈约束改为跨平台 Zotero 插件 JS + Zotero connector server endpoint；不得引入 Windows-only 隐藏 CLI 作为默认方案。

计划：
- 目标文件：
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\bootstrap.js`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\preferences.xhtml`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\preferences.js`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\prefs.js`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin\locale\*\zotero-local-mcp-bridge.ftl`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\mcp-server\cli.ts`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\scripts\install.mjs`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\scripts\buildZoteroPlugin.mjs`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\installation.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\docs\mcp-publication.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\README.md`
  - 修改 `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\README.zh-CN.md`
- 架构要求：
  - 发布版普通用户路径中，MCP endpoint 必须由 Zotero 插件自身注册到 Zotero connector server，随 Zotero 启停自然存在或消失。
  - 不允许把“打开一个终端运行 `zotero-local-mcp-bridge mcp`”作为普通用户必须步骤。
  - 不允许默认启动 Node/Python/Rust sidecar；sidecar/stdio 只能作为历史开发验证或后续可选兼容包。
  - 插件不得公开私有 `/command` HTTP 接口；插件内 MCP adapter 可在进程内复用命令表和原 dry-run/confirmation 逻辑。
  - 插件内 MCP endpoint 必须至少支持 MCP JSON-RPC `initialize`、`tools/list`、`tools/call`。
  - sidecar runtime、日志、token、audit、backup 仍必须保持在 bridge runtime 下，不能写入 Zotero profile、Zotero data、linked attachment root 或附件目录。
  - 设置界面不再显示 sidecar 进程状态；后续应显示 MCP endpoint 状态、MCP path、Zotero connector server 端口说明和最近 MCP 调用错误。
- 符号变更：
  - 计划新增插件侧 MCP endpoint，例如 `registerMcpEndpoint`、`handleMcpEndpointRequest`、`handleMcpJsonRpc`、`handleMcpToolCall`。
  - 计划停用默认 `startMcpSidecar` / `stopMcpSidecar` 路径，并在后续清理 `src/mcp-server/httpServer.ts` 等 sidecar 文件。
  - 计划移除构建脚本中 Node path、MCP CLI path、sidecar port 注入。
- 预期行为：
  - 用户启动 Zotero 后，不需要打开终端，MCP client 即可连接 `http://127.0.0.1:23119/zotero-local-mcp-bridge/mcp`。
  - 用户退出 Zotero 后，MCP endpoint 自然不可用，且没有 sidecar 进程残留问题。
  - 插件禁用或卸载后，MCP endpoint 不再注册。
  - MCP `tools/list` 返回插件命令表映射出的 tools。
  - MCP `tools/call` 对写命令仍强制 dry-run + confirmation。
- 测试命令：
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test`
  - `npm run build`
  - `npm run build:zotero-plugin`
  - Zotero 手工验收：启动 Zotero 后 `initialize` 和 `tools/list` 可通过 `/zotero-local-mcp-bridge/mcp` 返回。
  - Zotero 手工验收：退出 Zotero 后 `/zotero-local-mcp-bridge/mcp` 不可用，且无 Node/Python sidecar 进程。
  - Zotero 手工验收：插件禁用后 MCP endpoint 不可用。
  - MCP smoke：不手动启动 CLI，直接由 MCP HTTP client 调用 tools/list、读命令和写命令 dry-run/execute。
- 通过标准：
  - 发布版安装说明不再要求普通用户手动运行 MCP server。
  - 插件只注册 MCP endpoint，不注册私有 command endpoint。
  - 不额外监听 `23120`，不启动 sidecar，MCP 复用 Zotero connector server 的 `23119`。
  - MCP tools/list、读命令、写命令 dry-run/execute 均在插件内 MCP endpoint 模式下通过。

执行：
- 开始时间：2026-06-28 16:07:00
- 结束时间：进行中
- 操作内容：
  - 2026-06-28 修订：用户否决默认 sidecar 路线，原因是发布版必须无 CLI/终端弹窗，且项目应跨 Windows/macOS/Linux；本步骤改为插件内 HTTP MCP endpoint。
  - 修改 `src/zotero-plugin/bootstrap.js`：
    - 新增 `/zotero-local-mcp-bridge/mcp` 路径。
    - 启动时只注册 MCP endpoint，不再注册 `/command`，也不再默认启动 MCP sidecar。
    - 新增 MCP JSON-RPC adapter，支持 `initialize`、`notifications/initialized`、`tools/list`、`tools/call`。
    - `tools/call` 将 `zotero_*` tool name 转换为插件内部 command name，并在进程内调用原 command handler，复用现有 dry-run/confirmation、profile guard、audit 和 backup 逻辑。
  - 清理默认 sidecar 暴露面：
    - 从插件 bootstrap 删除 `startMcpSidecar`、`stopMcpSidecar`、sidecar port 和 Node/CLI path 注入字段。
    - 从 `scripts/buildZoteroPlugin.mjs` 移除 Node path、MCP CLI path 和 `23120` 构建注入。
    - 从 `package.json` 移除公开 `bin` 和 `mcp`/`mcp:health`/`mcp:tools` scripts。
    - 删除旧 `server.json` stdio metadata 草案，避免发布路径继续声明旧 MCP server。
  - 同步 README、中文 README、installation、MCP publication、release readiness、compatibility matrix、production paths、plugin publication notes 和 spec，全部改为插件内 HTTP MCP endpoint 路线。
  - 新增 `src/mcp-server/httpServer.ts`，在现有 MCP tool registry 之上增加 Streamable HTTP sidecar transport：
    - 默认监听 `127.0.0.1:23120`。
    - MCP endpoint：`/mcp`。
    - sidecar health endpoint：`/health`。
    - sidecar 状态写入 bridge runtime 下的 `runtime/mcp-sidecar/status.json`。
  - 修改 `src/mcp-server/cli.ts`：
    - 新增 `http` / `sidecar` 命令。
    - 新增 `--port=` 和 `--runtime-root=` 参数。
    - 保留 `mcp` stdio 命令作为开发/registry smoke test 入口。
  - 修改 `src/mcp-server/index.ts` 导出 HTTP sidecar。
  - 修改 `src/zotero-plugin/bootstrap.js`：
    - 新增 MCP sidecar 状态对象。
    - `startup()` 后自动调用 `startMcpSidecar()`。
    - `shutdown()` 和 `uninstall()` 中调用 `stopMcpSidecar()`。
    - 通过 `nsIProcess` 启动 Node sidecar：`node <cli.js> http --runtime-root=<runtimeRoot> --port=<port>`。
    - sidecar 结束或失败时记录状态、pid、startedAt/stoppedAt、lastError。
  - 修改 `scripts/buildZoteroPlugin.mjs`：
    - test/dev XPI 注入当前 `process.execPath`、`dist/src/mcp-server/cli.js` 和端口 `23120`。
    - release XPI 仍保持 `null`，后续需要正式发布 sidecar 定位和打包策略。
- 测试结果：部分通过，等待 Zotero 内手工验收。
  - `npm run typecheck`：通过。
  - `npm run lint`：通过。
  - `npm run build`：通过。
  - 独立 HTTP sidecar smoke：通过，`GET http://127.0.0.1:23120/health` 返回 `ok: true`。
  - Streamable HTTP MCP `initialize` smoke：通过，返回 `serverInfo.name = "zotero-local-mcp-bridge"`。
  - 带 `--runtime-root=<projectRoot>` 的模拟插件启动命令：通过。
  - `node scripts/buildZoteroPlugin.mjs --mode=test`：通过，生成带 Node/CLI/port 注入的 `dist/zotero-local-mcp-bridge.xpi`。
  - XPI 静态检查：通过，test XPI 中 `bootstrap.js` 已注入当前 Node 路径、MCP CLI 路径和 `23120` 端口。
  - `npm run test`：通过，20 个测试文件、85 个测试用例全部通过。
  - 2026-06-28 插件内 MCP endpoint 修订后重新验证：
    - `npm run typecheck`：通过。
    - `npm run lint`：通过。
    - `npm run test`：通过，20 个测试文件、85 个测试用例全部通过。
    - `npm run build`：通过。
    - `npm run build:zotero-plugin:release`：通过。
    - release XPI 静态检查：仅命中 `mcpPath: "/zotero-local-mcp-bridge/mcp"`；未命中 `/zotero-local-mcp-bridge/command`、`23120`、`startMcpSidecar`、`MCP_CLI`、`MCP_PORT`、`NODE_PATH`。
  - 2026-06-28 17:12 插件内 MCP endpoint runtime smoke：
    - 用户重装当时版本后，`initialize`：200。
    - `tools/list`：200。
    - 旧 `/zotero-local-mcp-bridge/command`：404，符合“只暴露 MCP endpoint”的预期。
    - 后续自动 probe 发现旧 tool name 仍保留 camelCase，例如 `zotero_collection_getTree`；本轮修订为 snake_case，例如 `zotero_collection_get_tree`。
    - `collection.create` dry-run 在 `readonly` 运行模式下返回 `OPERATION_MODE_READONLY`，符合安全策略；这不是 MCP 失败，而是设置策略生效。
  - 2026-06-28 17:12 历史 MCP 路线删除与重新验证：
    - 删除 `src/mcp-server/` 下 stdio、HTTP sidecar、CLI、tool registry、ZoteroPluginClient、token/audit/backup/undo helper 等历史 Node MCP server 代码。
    - 删除 `tests/unit/mcp-server/` 下历史 Node MCP server 单元测试。
    - 从 `package.json` 和 `package-lock.json` 移除 `@modelcontextprotocol/sdk` 与 `zod` 依赖。
    - 更新 README、中文 README、installation、MCP publication、compatibility matrix、agent skill、settings UI spec 和主 spec，将当前公开接口固定为插件内 HTTP MCP endpoint。
    - `npm run typecheck`：通过。
    - `npm run lint`：通过。
    - `npm run test`：通过，14 个测试文件、56 个测试用例全部通过；减少的 6 个测试文件来自已删除的历史 Node MCP server 路线。
    - `npm run build`：通过。
    - `npm run build:zotero-plugin:release`：通过。
    - release XPI 静态检查：仅命中 `/zotero-local-mcp-bridge/mcp`、`extractMcpCommandInput` 和 snake_case 映射逻辑；未命中 `/command`、`23120`、`startMcpSidecar`、`MCP_CLI`、`MCP_PORT`、`NODE_PATH`。
    - 源码树检查：`src/mcp-server/` 和 `tests/unit/mcp-server/` 已不存在。
  - 2026-06-28 17:15 版本提升与最终打包：
    - 插件版本提升到 `0.1.55`，避免用户重装时与已安装 `0.1.54` 混淆。
    - 同步修正 `src/zotero-plugin/bootstrap.ts` 中旧 `healthPath` / `commandPath` 元数据，改为 `mcpPath`。
    - `npm run typecheck`：通过。
    - `npm run lint`：通过。
    - `npm run test`：通过，14 个测试文件、56 个测试用例全部通过。
    - `npm run build`：通过。
    - `npm run build:zotero-plugin:release`：通过。
    - `dist/zotero-local-mcp-bridge.xpi` manifest 显示版本 `0.1.55`。
    - XPI 静态检查：命中 `mcpPath: "/zotero-local-mcp-bridge/mcp"`、版本 `0.1.55` 和 snake_case 映射逻辑；未命中旧 `/command`、`23120`、sidecar 启动和 Node/CLI 注入占位符。
  - 2026-06-28 17:21 用户重装 `0.1.55` 后 runtime smoke：
    - MCP `initialize`：200，返回 `serverInfo.name = "zotero-local-mcp-bridge"`、`serverInfo.version = "0.1.55"`。
    - MCP `tools/list`：200，返回 snake_case tool 名称，例如 `zotero_collection_get_tree`、`zotero_saved_search_create`、`zotero_attachment_add_file`、`zotero_import_csl_json`。
    - MCP `tools/call zotero_safety_get_profile_status`：通过，返回 `profileMode = "test"`、`operationMode = "readonly"`、`testProfileMarkerPresent = true`。
    - MCP `tools/call zotero_collection_get_tree`：通过，读取到 4 个 collection。
    - MCP `tools/call zotero_item_search`：通过，返回空列表；命令协议和 direct arguments 转发正常。
    - MCP `tools/call zotero_collection_create` direct arguments dry-run：到达内部命令表，并因当前 `readonly` 运行模式返回 `OPERATION_MODE_READONLY`；这符合安全策略。
    - 旧驼峰 tool `zotero_collection_getTree`：返回 unknown tool，符合 snake_case 固化预期。
    - 旧 `/zotero-local-mcp-bridge/command`：404，符合只暴露 MCP endpoint 预期。
    - MCP endpoint 非 `application/json` 请求：415，符合内容类型门禁。
  - 2026-06-28 17:23 用户将 Run mode 改为 `askforapprove` 后补测写命令 dry-run：
    - MCP `tools/call zotero_safety_get_profile_status`：通过，返回 `operationMode = "askforapprove"`、`profileMode = "test"`、`testProfileMarkerPresent = true`。
    - MCP `tools/call zotero_collection_create` 使用 direct arguments 传入 `libraryScope`、`name`、`profileMode`、`mode = "dry-run"`。
    - 结果：`ok = true`、`mode = "dry-run"`、`operation = "collection.create"`、`riskLevel = "low"`。
    - 返回 `planId = plan_mqxl09k1_62vc4dkgeqp` 与 `confirmation.token = confirm_mqxl09k1_2d4rf5yro2k`。
    - 本次只验证 dry-run plan 生成，未执行 execute，因此没有创建新的 collection。
  - 2026-06-28 19:04 生成三运行模式全接口 runtime matrix 测试资产：
    - 新增 `scripts/mcpRuntimeModeMatrix.mjs`。
    - 新增 `tests/integration/mcpRuntimeModeMatrix.md`。
    - 新增 npm 脚本 `test:mcp-runtime-matrix`。
    - 覆盖目标：`tools/list` 暴露的所有当前 MCP tools，包括 collection、item、search、saved search、citation、import/export、annotation、note、attachment、backup、audit、safety、duplicates。
    - 三模式设计：
      - `readonly`：read tools 应成功；profile write tools 应返回 `OPERATION_MODE_READONLY`。
      - `askforapprove`：read tools 应成功；write tools 只跑 `mode = "dry-run"`，必须返回 `planId` 和 `confirmation.token`。
      - `yolo`：read tools 应成功；write tools 仍只跑 dry-run，验证 dry-run 不可关闭。
    - 默认不执行任何 `mode = "execute"`；预留 `--execute-low-risk` 参数，但当前会直接失败退出，避免误执行真实写入。
    - 脚本会校验 `profileMode = "test"`、`testProfileMarkerPresent = true`、当前 `operationMode` 与 `--mode` 一致。
    - 本轮按用户要求只生成测试，不运行测试。
  - 2026-06-28 20:15 用户运行矩阵后修复脚本 fixture 问题：
    - 用户首次运行 `--mode=readonly` 时失败：`Expected operationMode=readonly, got askforapprove`。这是 Zotero 设置尚未切到 readonly；用户切换后 readonly 矩阵通过：48 passed、0 failed、5 skipped。
    - `askforapprove` 与 `yolo` 初次各有 2 个失败：
      - `collection.move`：脚本传入 `parentCollectionKey: false`，而插件要求 parent key 为非空字符串；修复为从 `collection.getTree` 自动选择另一个 collection 作为 parent。
      - `backup.snapshot.restore`：脚本使用旧默认 `backup_mqv64zm5_tbuyy69wpl`，但当前 runtime backup root 下 `backup.snapshot.list` 返回空；修复为运行时从 `backup.snapshot.list` 自动发现 snapshot，发现不到则 skipped。
    - 同步更新 `tests/integration/mcpRuntimeModeMatrix.md`，记录自动 fixture 发现逻辑。
    - `node --check scripts/mcpRuntimeModeMatrix.mjs`：通过。
    - 在当前 `yolo` 模式下重新运行 `npm run test:mcp-runtime-matrix -- --mode=yolo`：通过，45 passed、0 failed、8 skipped；未执行任何 execute。
    - 补充修复 ESLint 对 Node 全局 `fetch` 的识别问题；`npm run lint`：通过。
  - 2026-06-28 20:43 明确并实现 Agent 层 `askforapprove`：
    - 用户确认 `askforapprove` 应是 Agent/MCP client 层面的确认，不是 Zotero 插件内部弹窗。
    - 插件 dry-run plan 新增 `agentApproval` 元数据，包含 `layer: "agent"`、`operationMode`、`required`、`requiredText`、`mayAutoExecute` 和说明文本。
    - `askforapprove` 下所有写 dry-run 返回 `agentApproval.required = true`；普通高风险写操作返回 `requiredText = "CONFIRM"`。
    - `yolo` 下当前普通写操作和普通高风险写操作返回 `agentApproval.required = false`、`mayAutoExecute = true`；未来 `critical` 操作仍强制用户确认并要求输入具体命令名。
    - 修正 `backup.snapshot.restore` 与 `backup.snapshot.prune` 的 dry-run riskLevel 为 `high`，使 Agent 层确认策略与高风险分类一致。
    - `scripts/mcpRuntimeModeMatrix.mjs` 增加 `agentApproval` 断言；后续 runtime matrix 将验证 Agent 层确认策略。
    - 同步更新 `docs/spec-zotero-local-write-mcp.md`、`docs/plugin-settings-ui-spec.md`、`docs/agent-skill.md`、`skills/zotero-local-mcp-bridge/SKILL.md`、README 和中文 README。
    - 插件版本提升到 `0.1.56`，已生成新的 `dist/zotero-local-mcp-bridge.xpi`。
    - 自动验证：`node --check scripts/mcpRuntimeModeMatrix.mjs`、`npm run lint`、`npm run typecheck`、`npm run test`、`npm run build`、`npm run build:zotero-plugin:release` 全部通过。
    - XPI 静态检查：manifest 版本为 `0.1.56`，包内 `bootstrap.js` 含 `createAgentApprovalPolicy`、`operationMode === "askforapprove"` 和 `requiredText = "CONFIRM"`。
- 待验收：
  - 用户安装 `0.1.56` 后，按 `tests/integration/mcpRuntimeModeMatrix.md` 重新在 `askforapprove`、`yolo` 与 `readonly` 模式下运行 `npm run test:mcp-runtime-matrix -- --mode=<mode>`，确认 runtime plan 中 `agentApproval` 策略同样 0 failed。
  - 后续如需进入 release candidate gate，再单独执行一次低风险写命令 execute + cleanup 验收；本轮已完成 MCP endpoint、snake_case tools/list、读命令、写命令 dry-run 与安全负向测试。
- 备注：本步骤是 2026-06-28 用户新增的发布硬门禁。步骤 15F 的 stdio server 和 15G 早期 sidecar 实验已降级为历史验证路线；本轮已经从当前源码与发布路径删除。

### 步骤 16 - 发布候选验收与公开发布

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
- 备注：根据 2026-06-28 执行顺序修订，本步骤后置到插件设置界面、多国语言适配、发布准备和 skill 之后。

## 最终结果

当前结果：

- 本日志已接替旧的内部第一阶段实施日志。
- 第一阶段 `0.1.31` 已验证的能力被记录为历史基线。
- 公开发布目标已拆分为 Zotero 插件公开分发与 MCP server 公开发布两条线，但发布准备已根据 2026-06-27 修订后置。
- 旧日志未完成内容已搬迁到本日志：
  - 真实主库解锁流程：步骤 4。
  - 插件设置界面：步骤 14。
  - 通用 Agent / MCP 使用 skill：步骤 15。
  - 文档发布与安全说明：步骤 2、5、6、7、16。
  - 完整 Zotero 功能面：步骤 9-13。
- 最终功能缺口已明确纳入计划：
  - item 创建/完整元数据编辑。
  - BibTeX/RIS/CSL 等导入导出。
  - PDF annotation 读取/写入。
  - 高级搜索、保存搜索、引用格式输出等更完整 Zotero 能力。
  - 插件设置界面。
  - 插件设置界面多国语言适配。
  - 真实主库解锁流程。
  - 通用 Agent / MCP 使用 skill。
  - 删除/merge duplicates 已完成受控 trash/find/merge 第一批 runtime 验收；仍缺少公开发布安全文档。
- 当前硬性执行顺序中的五组核心功能已经完成第一批 runtime 验收：item 创建/完整元数据编辑、BibTeX/RIS/CSL 导入导出、PDF annotation 读取/写入、高级搜索/保存搜索/引用格式输出、受控 trash/merge。

下一步：

- 先运行三模式全接口 runtime matrix；通过后再规划低风险 execute + cleanup 的最小 runtime 验收，并继续整理发布候选清单、安装说明、skill artifact 打包和跨平台兼容矩阵验证。
- 验收通过后进入发布候选前的剩余整理：安装说明最终化、skill artifact 打包、跨平台兼容矩阵验证和 release checklist。
