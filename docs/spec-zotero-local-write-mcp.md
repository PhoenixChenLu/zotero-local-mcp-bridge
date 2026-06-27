# Spec: Zotero 本地写入与管理 MCP

创建时间：2026-06-25 22:40:21
修订时间：2026-06-26

## Objective

构建一个让 Codex 能够安全管理本机 Zotero user library 的本地工具链。核心用户是本机研究写作工作流中的 Codex 使用者，需要在不使用 Zotero Web API、不直接改写 `zotero-data/`、不混淆 Zotero item key 与 BibTeX key、不破坏 Zotero 作为主系统边界的前提下，完成 collection、subcollection、item、tag、note、attachment 等 Zotero 管理操作。

第一版目标是建立简洁、干净、可扩展的最小闭环：

- 通过 Zotero 插件内部预定义命令表执行所有写操作。
- 外部 MCP server 只暴露受控 tool schema，不向普通管理流程暴露任意 Zotero JS eval。
- 支持本地 user library 的 collection/subcollection 创建、层级移动、重命名、查询与 item 归档关系管理。
- 支持 item 加入/移出 collection、tag 添加/移除、创建 child note。
- 支持附件写入、附件移动、附件重命名、调用 Zotero 内置附件自动重命名能力。
- 第一版禁止删除、merge duplicates、直接写 SQLite、Web API 写入和 group library。

最终方向是尽量完整覆盖 Zotero 本地管理能力，但必须分阶段开放高风险写操作。

## Tech Stack

- Zotero：Zotero 7 或更新版本。
- Zotero 插件：TypeScript/JavaScript，XPI 打包，运行在 Zotero privileged plugin context。
- 插件通信：采用本机 HTTP。可以研究 `introfini/mcp-server-zotero-dev` 的 Zotero 插件内部执行思路，但本项目不直接照搬或引用其 RDP 实现；目标是更小、更专注、更容易审计。
- 插件 HTTP 入口优先注册到 Zotero connector server，默认本机地址为 `127.0.0.1:23119`，endpoint 命名空间为 `/zotero-codex-bridge/*`。这是 Zotero 插件内部注册的本机 endpoint，不是 Zotero Web API。
- Zotero 运行时第一验收目标为用户当前测试环境：Zotero 9.0.5 64-bit on Windows。Zotero 7/8 兼容性后续进入兼容矩阵，不作为第一阶段阻塞项。
- 插件开发期优先增加 extension proxy/source-load 路径以减少重复打包安装；`dist/zotero-codex-bridge.xpi` 仍作为安装包和回归验收路径。
- MCP server：优先 Node.js/TypeScript。
- MCP transport：优先 stdio 外部 server；后续根据 Codex 本机 MCP 支持能力修订。
- 文档与计划：`docs/` 与 `TaskDocs/`。

## Commands

当前脚手架阶段已建立可执行命令。

```powershell
# 查看仓库文件
rg --files

# 检查 Git 状态；当前目录未初始化 Git 时该命令会失败
git status --short

# 安装依赖
npm install

# 构建 TypeScript
npm run build

# 类型检查
npm run typecheck

# 运行测试
npm run test

# 运行 lint
npm run lint

# 打包 Zotero 测试插件
npm run build:zotero-plugin
```

## Project Structure

当前规划文档结构：

```text
H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\
├── docs\
│   ├── zotero-mcp-ecosystem-investigation.md
│   └── spec-zotero-local-write-mcp.md
└── TaskDocs\
    ├── 任务总览.md
    └── Zotero本地写入MCP项目规划日志.md
```

后续实现阶段建议新增：

```text
src\
├── zotero-plugin\             # Zotero 内部插件，持有命令表和实际 Zotero API 写入逻辑
├── mcp-server\                # 外部 MCP server，负责 tool schema、参数校验、审计和调用插件命令
└── shared\                    # 共享 schema、类型和错误码
tests\
├── unit\
├── integration\
└── fixtures\
logs\
└── audit\                     # 本项目审计日志；不得写入 Zotero 数据目录
```

当前测试 profile 目录：

```text
ZoteroProfile\                  # ZoteroCodexBridgeTest profile，测试数据，不是源码
ZoteroVault\                    # 已链接附件根目录，测试数据，不是源码
ZoteroData\                     # Zotero Data Directory，测试数据，不是源码
```

这些目录必须被 `.gitignore` 和 ESLint ignore 排除。

## Command Table Model

所有写操作必须在 Zotero 插件内部定义命令表。外部 MCP server 不能把任意 JS 代码传入插件执行。

示例结构：

```ts
type ZoteroLocalCommand =
  | {
      name: "collection.create";
      input: {
        libraryScope: "local-user";
        name: string;
        parentCollectionKey?: string;
      };
    }
  | {
      name: "collection.move";
      input: {
        collectionKey: string;
        parentCollectionKey?: string;
      };
    }
  | {
      name: "collection.addItems";
      input: {
        collectionKey: string;
        zoteroItemKeys: string[];
      };
    }
  | {
      name: "item.updateTags";
      input: {
        zoteroItemKey: string;
        addTags: string[];
        removeTags: string[];
      };
    };

type ZoteroLocalCommandResult<T> = {
  ok: boolean;
  commandName: ZoteroLocalCommand["name"];
  requestId: string;
  affected: {
    zoteroItemKeys: string[];
    collectionKeys: string[];
    tags: string[];
  };
  data?: T;
  error?: {
    code: string;
    message: string;
  };
};
```

约定：

- command 名称使用命名空间点号，例如 `collection.create`、`collection.addItems`、`item.updateTags`。
- MCP tool 名称使用下划线，例如 `zotero_collection_create`、`zotero_collection_add_items`。
- key 字段必须显式命名：`zoteroItemKey`、`bibtexKey`、`collectionKey`，禁止笼统使用 `key`。
- 第一版只支持 `libraryScope: "local-user"`。
- 插件命令表是唯一允许执行写操作的位置。

## First Version Scope

第一版必须支持：

- `zotero_collection_create`：创建顶层 collection 或 subcollection。
- `zotero_collection_rename`：重命名 collection/subcollection。
- `zotero_collection_move`：移动 collection 到另一个 parent，或移动为顶层 collection。
- `zotero_collection_get_tree`：读取 collection/subcollection 层级树。
- `zotero_collection_get_items`：读取 collection 内 item。
- `zotero_collection_add_items`：把 item 加入 collection/subcollection。
- `zotero_collection_remove_items`：把 item 从 collection/subcollection 移除，不删除 item。
- `zotero_item_get`：按 Zotero item key 读取本地 user library 条目详情，包括 itemType、title、creators、tags、collectionKeys、attachmentKeys、noteKeys 和 Zotero 原生 JSON 摘要。
- `zotero_item_search`：在本地 user library 中按 query、itemType、collectionKey、tag 搜索顶层普通条目，返回最多 50 条摘要。
- `zotero_item_create`：在本地 user library 创建普通 item，支持 itemType、fields、creators、collectionKeys 和 tags。
- `zotero_item_update_fields`：按 Zotero item key 更新 item 字段元数据，不修改 creators、collections、tags、attachments 或 notes。
- `zotero_item_update_creators`：按 Zotero item key 替换 creator 列表。
- `zotero_item_set_collections`：按 Zotero item key 设置 item 所属 collection 列表，不删除 item 或 collection。
- `zotero_item_update_tags`：添加或移除 tag。
- `zotero_note_create_child`：为 item 创建 child note。
- `zotero_attachment_get`：按 attachment key 读取附件详情、parent item key、文件路径、content type、linkMode 和 attachmentMode。
- `zotero_item_get_attachments`：读取 item 下的附件信息。
- `zotero_attachment_add_file`：给 item 添加本地文件作为附件。
- `zotero_attachment_move_to_item`：把附件移动到另一个 parent item。
- `zotero_attachment_rename`：重命名附件标题，并按确认策略同步文件名。
- `zotero_attachment_run_zotero_rename`：调用 Zotero 内置能力按 metadata 自动重命名附件文件。
- `zotero_attachment_rename_preferences_get`：读取 Zotero 附件自动重命名相关偏好。
- `zotero_attachment_rename_preferences_set`：修改 Zotero 附件自动重命名相关偏好。
- `zotero_backup_settings_get`：读取本项目 backup 保留策略。
- `zotero_backup_settings_set`：修改本项目 backup 保留策略。
- `zotero_backup_snapshot_list`：读取本项目 backup snapshot manifest 列表。
- `zotero_backup_snapshot_restore`：从指定 backup snapshot 将文件内容恢复到同一个 attachment 当前文件路径。
- `zotero_backup_snapshot_prune`：按当前 backup 保留策略清理本项目 backup snapshot。
- `zotero_audit_list`：查看本项目审计日志。

## Internal Test vs Public Release Requirements

第一阶段 `0.1.31` 的目标是内部闭环；本节定义发布冻结时的轨道差异：

- **内部测试版（当前状态）**
  - 运行前提是 `profileMode: "test"` + `ZoteroProfile/.zotero-codex-bridge-test-profile`。
  - 默认假设用户在 `ZoteroCodexBridgeTest` 测试 profile 进行验收。
  - 运行文档允许出现本机测试路径示例。
  - 目标是验证核心命令闭环、dry-run/confirmation、audit/backups、undo、命令注册和测试 profile 安全防线。

- **公开发布版（目标）**
  - 默认运行在只读或安全锁定模式，不允许直接写真实主库。
  - 真实主库写入必须经过显式解锁流程并展示明确风险提示。
  - 公开文档必须不依赖固定本机路径，不写死 `H:\ProgramDocument\...` 或当前工作区绝对路径。
  - 所有写操作必须通过 dry-run + `planId` + 未过期 `confirmationToken` + execute。
  - 写入后必须可被审计，并在可用时给出 undo/回滚/恢复线索。
  - 公开分发路径需区分：
    - Zotero 插件：GitHub release + 项目主页 + Zotero Forums + update manifest（无官方 Zotero 插件库直接上传入口）。
    - MCP server：npm 包或等价 artifact + `mcpName` + `server.json` + MCP Registry metadata。

### Release Gate（公开发布硬门禁）

- **默认安全行为**：公开发布必须默认只读/安全锁定；任何真实主库写操作必须显式解锁。
- **确认链路**：任何执行类写命令必须先 dry-run，必须返回可执行差异；执行必须校验未过期 `planId` 和 `confirmationToken`。
- **真实主库防护**：公开版禁止在未解锁情况下连接并改写真实主库。
- **真实主库临时解锁**：`profileMode` 区分 `readonly`、`test`、`real-locked`、`real-unlocked`；真实主库解锁必须校验当前 profile fingerprint、精确确认文本和过期时间，状态文件写入 bridge runtime 目录。
- **路径隔离**：禁止将审计、backup、undo 写入 Zotero profile、Zotero data directory、linked attachment root、附件目录。
- **禁止项（Must not）**：
  - 不使用 Zotero Web API 写入。
  - 不要求、保存或读取 `ZOTERO_API_KEY`。
  - 不直接写 `zotero.sqlite`。
  - 不向 MCP tool 暴露任意 JavaScript eval。
- **输出能力范围**：
  - 2026-06-27 起，公开发布准备、边缘发布文件与 Codex 专用 skill 全部后置。
  - 在进入发布准备前，必须先完成并测试通过：item 创建/完整元数据编辑、BibTeX/RIS/CSL 导入导出、PDF annotation 读取/写入、高级搜索/保存搜索/引用格式输出。
  - 删除、trash、merge duplicates 仍作为后续高风险阶段，不阻塞上述四组核心功能的下一步开发。
- **分发边界**：
  - MCP Registry 仅声明与元数据；不会托管 artifact。
  - 插件更新依赖 update manifest 与 release artifact 的可追溯公开发布逻辑。

第一版必须为所有写操作强制提供 dry-run 能力，尤其是 collection/subcollection 层级变更、item 加入/移出 collection、tag 修改、child note 创建、附件写入、附件移动、附件重命名、Zotero 内置附件自动重命名等操作。dry-run 至少返回将影响的 item、collection、tag、note、attachment、file path 基本信息；dry-run 的精确字段、差异格式和确认流程需要在下一轮规格细化时专门确认。

附件范围：

- 第一版至少支持 PDF、DOC、DOCX、CSV、XLS、XLSX、常见图片文件、HTML。
- 附件添加默认复制文件进 Zotero storage。
- 必须提供用户可配置开关，用于修改默认附件添加策略：复制进 Zotero storage 或 linked file。
- linked file 默认不限制路径，但 dry-run 和确认结果必须提示 linked file 风险：外部文件被移动、重命名或删除后，Zotero 附件会失效。
- 附件添加遇到同名文件或重复绝对路径时，默认跳过并报告；用户可显式选择 duplicate 或 replace。第一版不做自动 replace。
- 第一版 `replace` 只作为 dry-run 提示和后续扩展选项，不执行既有 attachment 替换；真正 replace 放到后续阶段。
- Zotero 内置附件自动重命名必须完全遵循 Zotero 当前偏好设置；本项目可以提供读取和修改相关偏好的受控接口，但不在单次重命名命令中传入临时命名模板。
- 修改 Zotero 附件自动重命名偏好属于写操作，必须 dry-run + confirmation，并在审计日志中记录旧值和新值。
- 第一版允许 undo 移除本插件刚添加的 attachment。
- 审计日志允许记录附件文件名和绝对文件路径。
- 第一版单次批量操作上限为 50 个对象。
- 第一阶段强制禁止连接真实主库执行写操作，必须使用测试 profile；公开发布路径已开始实现 `real-locked` / `real-unlocked` 安全模型，但真实主库验收和用户文档仍需单独完成。
- 测试 profile 写入必须包含 `profileMode: "test"` 标记；未设置为 `test` 且未处于有效 `real-unlocked` 状态时拒绝普通 Zotero 写操作。

backup 保留策略：

- backup 默认保留 30 天。
- 用户可以设置最小保存时间。
- 用户可以设置最大本地空间占用，例如 10GB。
- 第一版默认最大本地空间占用为 10GB。
- 时间限制和空间限制可分别启用。
- 如果两个限制都启用，优先执行空间限制清理，再执行时间限制清理。
- backup 和审计文件都必须保存在本项目目录，不得写入 Zotero profile、Zotero data directory 或附件目录。
- undo 能力与 backup 保留策略联动；backup 被清理后，只保证保留元数据级反向操作，不保证附件文件级恢复。
- `0.1.26` 起，`attachment.rename` 和 `attachment.runZoteroRename` 在执行附件文件重名前创建项目本地文件快照，路径为 `backups/zotero-operations/files/`；`0.1.28` 已接入严格同路径 restore。
- `0.1.29` 起，`backup.snapshot.prune` 按当前 backup 保留策略生成 dry-run 删除计划，并只允许删除项目 `backups/zotero-operations/files/` 下的 snapshot 目录。

confirmation 与批量执行：

- 所有写操作必须先 dry-run。
- 执行写操作必须提供未过期的 `planId` 和 `confirmationToken`。
- `confirmationToken` 采用自动 token 机制，不要求用户输入固定确认短语。
- dry-run plan 默认 10 分钟后过期，后续可配置。
- 批量写操作默认尽量执行所有可执行项，不因单项失败中途停止。
- 批量完成后必须汇总成功项、失败项、错误详情、审计记录路径，并返回已完成部分可用的 undo 操作清单。

HTTP command endpoint 安全门槛：

- `/zotero-codex-bridge/health` 只返回无敏感信息，可作为无鉴权诊断 endpoint。
- `/zotero-codex-bridge/command` 在接入任何真实写命令前，必须实现本机请求鉴权，例如本项目生成和保存的 secret、请求签名或等价 token。
- command endpoint 不允许 `allowRequestsFromUnsafeWebContent`。
- command endpoint 必须拒绝非 `application/json` 请求、未知命令、缺少鉴权的请求和不符合 dry-run/confirmation 流程的 execute 请求。
- 鉴权 secret、审计日志和 backup 均不得写入 Zotero profile、Zotero data directory、linked attachment root 或附件目录。

## Code Style

TypeScript 风格示例：

```ts
type LocalUserLibraryScope = "local-user";

type CollectionCreateInput = {
  libraryScope: LocalUserLibraryScope;
  name: string;
  parentCollectionKey?: string;
};

async function createCollection(input: CollectionCreateInput): Promise<{
  collectionKey: string;
  name: string;
  parentCollectionKey?: string;
}> {
  validateCollectionName(input.name);

  const collection = new Zotero.Collection();
  collection.libraryID = Zotero.Libraries.userLibraryID;
  collection.name = input.name;

  if (input.parentCollectionKey) {
    const parent = resolveCollectionByKey(input.parentCollectionKey);
    collection.parentID = parent.id;
  }

  await collection.saveTx();

  return {
    collectionKey: collection.key,
    name: collection.name,
    parentCollectionKey: input.parentCollectionKey,
  };
}
```

约定：

- 插件侧函数名以 Zotero 领域动词命名，例如 `createCollection`、`moveCollection`、`addItemsToCollection`。
- MCP server 负责输入 schema 校验、审计日志和错误码映射。
- 插件侧负责 Zotero API 校验、事务执行和 Zotero 对象解析。
- 不为第一版引入通用脚本执行接口。
- 不把高风险能力隐藏在通用参数里，例如 `deleteItems: true`。

## Testing Strategy

- Unit tests：验证 schema、参数校验、命令表分发、错误码映射、审计日志格式。
- Plugin unit tests：在可测试边界内验证命令输入转换和 Zotero API adapter。
- Zotero API source audit：每个真实 Zotero 写 adapter 实现前，必须先记录依据的官方文档、官方示例或本机 Zotero 9.0.5 源码位置；附件写入、附件移动和 Zotero 内置自动重命名必须单独审计。
- Plugin packaging tests：先生成可安装的 `dist/zotero-codex-bridge.xpi`，再进入真实 Zotero UI 验收。
- Integration tests：在隔离 Zotero test profile 中验证 collection/subcollection/item/tag/note 最小闭环。
- MCP contract tests：验证 MCP tool schema、stdio transport、错误响应和审计记录。
- Manual acceptance tests：在测试 Zotero profile 中创建 collection tree、移动 subcollection、加入/移出 item、打 tag、创建 child note，并确认 Zotero UI 与读取结果一致。
- Safety tests：确认不会直接写 `zotero.sqlite`，不会使用 Zotero Web API，不支持 group library，不在 Zotero 数据目录写审计日志。
- 测试 Zotero profile 由用户手动建立；进入集成测试或首次真实写入前，必须提醒用户先建立并确认测试 profile。
- 测试 Zotero profile 必须带有本项目 marker 文件：`ZoteroProfile/.zotero-codex-bridge-test-profile`。第一阶段写操作必须同时满足 `profileMode: "test"` 和 marker 存在。
- Attachment tests：在测试 profile 中验证复制附件、linked file 附件、附件 parent 移动、附件标题重命名、Zotero 内置附件自动重命名、undo 移除本插件刚创建的附件。
- Batch tests：验证批量操作在单项失败时继续执行剩余对象，最终报告成功、失败、审计和 undo 清单。
- Backup retention tests：验证时间限制、空间限制和两者同时启用时的清理优先级。
- Profile protection tests：验证第一阶段拒绝真实主库写操作。

## Boundaries

- Always：
  - 所有真实写操作都由 Zotero 插件内部命令表执行。
  - 只支持本地 user library。
  - 审计日志写入本项目目录，例如 `logs/audit/`。
  - 区分 Zotero item key、BibTeX key、collection key。
  - 首次写入测试必须使用用户手动建立并确认的 Zotero test profile。
  - 测试 profile 必须存在 `ZoteroProfile/.zotero-codex-bridge-test-profile` marker，禁止把该 marker 复制到真实主库。
  - collection/subcollection 相关操作必须保持层级语义清晰。
  - collection move 第一版允许任意单个 collection 改 parent，包括移动为顶层 collection。
  - 所有写操作必须先 dry-run，再通过确认执行。
  - 单次批量操作最多 50 个对象。
  - 批量写操作默认尽量执行全部可执行项，最后汇总失败和 undo 清单。
  - 第一阶段必须拒绝真实主库写操作。

- Ask first：
  - 引入新依赖。
  - 改变插件通信机制。
  - 增加自动下载 PDF、联网补全附件等能力。
  - 增加真实删除、trash、merge duplicates、批量重构 collection tree。
  - 从参考 `introfini/mcp-server-zotero-dev` 的思路升级为复用其代码或依赖。

- Never：
  - 使用 Zotero Web API 写入。
  - 要求或保存 `ZOTERO_API_KEY`。
  - 直接写 `zotero.sqlite`。
  - 第一版删除 item、删除 collection、删除既有 attachment 文件、merge duplicates。
  - 支持 group library。
  - 把审计日志写入 Zotero profile、Zotero data directory 或附件目录。
  - 向普通管理 MCP tool 暴露任意 Zotero JS eval。

## Success Criteria

第一版完成时必须满足：

- 能生成可安装到 Zotero 9.0.5 测试 profile 的 `dist/zotero-codex-bridge.xpi`。
- Zotero 插件可安装到测试 profile，并注册内部命令表。
- MCP server 可连接插件并列出受控 Zotero 管理 tools。
- 能在测试 profile 中创建顶层 collection 和 subcollection。
- 能任意移动单个 collection 的 parent、重命名 subcollection，并读取正确 collection tree。
- 能把 item 加入/移出 collection 或 subcollection，且不删除 item。
- 能为 item 添加/移除 tag。
- 能为 item 创建 child note。
- 能给 item 添加本地附件，默认复制进 Zotero storage，并支持配置默认 linked file 策略。
- 能移动 attachment parent、重命名 attachment、调用 Zotero 内置附件自动重命名能力。
- 能 undo 移除本插件刚添加的 attachment。
- 所有执行记录写入本项目审计日志。
- 代码中没有 Web API 写入路径、`ZOTERO_API_KEY` 依赖或 SQLite 写入路径。
- README、AGENTS.md、TaskDocs 与本 spec 保持一致。

## Open Questions

- 本机 HTTP command endpoint 的鉴权机制具体格式：secret 文件路径、签名算法、过期时间和轮换机制。
- dry-run 的精确需求：覆盖哪些写操作、返回哪些字段、是否需要差异格式、如何从 dry-run 确认到 execute。
- 测试 Zotero profile 由用户手动建立；进入集成测试前需要提醒用户创建并确认 profile。
- child note 第一版支持尽可能多的 Zotero 允许格式；仍需核查 Zotero 内部 API 对纯文本、HTML、富文本、annotation/note 结构的实际支持边界。
- 附件 linked file 模式不限制路径；仍需细化提示文案和审计字段。
- backup 设置接口字段已在第一阶段固定为 `retentionDays`、`maxLocalBytes`、`enableTimeLimit`、`enableSpaceLimit`；文件重命名前 snapshot、严格同路径 restore、默认策略下 prune 无删除项路径和受控临时旧 snapshot 删除路径均已接入。
- confirmation token 的生成方式和过期时间配置。
- 真实主库写入权限后续开放时的解锁流程。
- Codex skill 的数量与职责边界，待主要 MCP 接口稳定后再设计。
