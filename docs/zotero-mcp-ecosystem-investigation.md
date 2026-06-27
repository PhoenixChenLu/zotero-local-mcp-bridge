# Zotero MCP 写入能力生态调查

调查时间：2026-06-25 22:40:21

## 结论

用户原始判断“GitHub、Codex 插件、公开 MCP、Zotero 插件市场都没有能够实现本地 Zotero 仓库写和管理操作的仓库”需要修正。

更准确的结论是：

- 已经存在多个 Zotero MCP 或 Zotero-agent 项目，其中部分项目声称支持创建 collections、更新 metadata、管理 tags、创建 notes、导入 items、附件处理等写操作。
- Zotero 官方没有维护一个当前可检索的插件目录；官方文档说明插件主要在 Zotero Forums 发布，官方插件目录仍是计划中。
- Zotero Web API 明确支持写操作，但需要有写权限的 API key，属于在线库/API 路径，不等同于无云依赖的本地库管理。
- Zotero local API 当前以只读能力为主；公开开发讨论中仍有“local API write access is not yet supported”的线索。
- 直接在 Zotero 内部插件中使用 Zotero JavaScript API 是实现本地写操作的合理路径，但该 API 文档不完整，需要依赖 Zotero 源码、插件模板和实测。
- 因此，本项目仍有必要，但定位不应是“从零填补不存在的生态空白”，而应是“面向 Windows + 本地 Zotero + Codex 的可审计、可回滚、权限受控的 Zotero 写入/管理 MCP 项目”。

## 关键证据

### Zotero 官方插件生态

Zotero 官方文档说明，社区开发了很多插件，但官方当前不提供可用插件列表，插件多在论坛发布，官方插件目录仍在计划中。

来源：
- https://www.zotero.org/support/plugins

影响：
- “Zotero 插件市场没有找到合适插件”不能作为强证据，因为官方目前没有完整市场或目录。
- 需要把论坛、GitHub、MCP 聚合站、包管理器一起纳入调查。

### Zotero Web API 写能力

Zotero Web API 文档明确包含 write methods，并要求 API key 对目标 library 有写权限。

来源：
- https://www.zotero.org/support/dev/web_api/v3/write_requests

影响：
- 通过 Zotero Web API 可以写在线库。
- 但这条路线依赖 Zotero API key、同步、云端权限和网络，不等同于“本机 Zotero 插件直接管理本地库”。

### Zotero local API 写能力限制

Zotero dev 讨论中提到 Zotero 7 local API write access 尚未支持。

来源：
- https://groups.google.com/g/zotero-dev/c/xiUvjyYkQk4

影响：
- 只靠 `127.0.0.1:23119` local API 很可能无法完成本项目所需的完整写操作。
- 当前 `@zotero` 插件能读本地库、导出引用、读附件索引全文，但不能被假设为 collection/item/tag 管理工具。

### Zotero JavaScript API

Zotero 官方文档说明 Web API 可读写在线库，也可以通过 local JavaScript API 访问本地 Zotero client；同时文档承认 JavaScript API 不完整，需要查看源码。

来源：
- https://www.zotero.org/support/dev/client_coding/javascript_api

影响：
- 自写 Zotero 内部插件，通过 privileged Zotero JS API 执行本地写操作，是本项目最可靠的技术方向。
- 需要在插件侧实现写入事务、dry-run、回滚记录和操作审计，而不是外部脚本直接改 `zotero.sqlite`。

## 已发现的相关项目

### 54yyyu/zotero-mcp

项目地址：
- https://github.com/54yyyu/zotero-mcp

观察：
- README 声称支持 search、full text、annotations、创建/更新 notes、添加 DOI/URL/local file、创建和管理 collections、更新 metadata、批量 tags、合并 duplicates 等。
- README 同时说明 local read-only 使用只需要 `ZOTERO_LOCAL=true`；如要写入，需要 `ZOTERO_API_KEY` 和 `ZOTERO_LIBRARY_ID`，因为 local API 快但只读，写入走 Zotero Web API。

初步判断：
- 功能丰富，生态成熟度较高。
- 不满足“完全本地、无 API key、通过 Zotero 插件内部 JS 写入本地库”的核心偏好。
- 可作为功能清单和 MCP tool schema 参考，但不宜直接等同于本项目目标。

### cookjohn/zotero-mcp

项目地址：
- https://github.com/cookjohn/zotero-mcp

观察：
- README 描述为 Zotero 插件 + MCP，近期架构变为 Zotero 插件内集成 MCP server，通过 Streamable HTTP 与 AI client 通信。
- README 声称支持 write operations，包括创建 notes、管理 tags、更新 metadata、创建 items 和 attach PDFs。

初步判断：
- 这是最接近用户原计划的已有方案之一。
- 与用户计划不同点：当前 README 描述为插件内集成 MCP server，而用户计划是 Zotero 内部插件 + 外部独立 MCP server 通信。
- 需要后续实测 Windows、Codex MCP 连接、权限边界、写入 dry-run、错误恢复和维护状态，才能决定 fork、适配还是自研。

### cli-anything-zotero

项目页：
- https://mcpservers.org/servers/piaoyangguohai1/cli-anything-zotero
- https://github.com/PiaoyangGuohai1/cli-anything-zotero

观察：
- README 与 MCP 聚合页声称该项目通过一个 Zotero JS Bridge 插件暴露 privileged JavaScript endpoint，让外部 `zotero-cli` 操作本地 Zotero。
- 当前主线是 CLI/SDK-first；MCP 支持冻结在 `v0.9.5`，从 `v1.0.0` 开始不再维护新 MCP 功能线。
- 安装方式是 `pip install cli-anything-zotero`，再运行 `zotero-cli app install-plugin` 生成并安装 Zotero `.xpi` bridge 插件。
- 公开命令覆盖：
  - app：状态、启动、启用 local API、安装/检查 JS Bridge。
  - collection：list/find/tree/get/items/use-selected/create/stats/find-pdfs/remove-item/rename/delete。
  - item：find/list/get/children/attachments/notes/file/context/export/citation/bibliography/search-fulltext/search-annotations/annotations/duplicates/update/tag/attach/find-pdf/delete/add-to-collection/move-to-collection。
  - import：DOI、PMID、RIS/BibTeX file、JSON。
  - export：BibTeX/BibLaTeX 等。
  - note/tag/search/style/session/docx/js/sync 等辅助命令。
- 源码检查确认，当前主线中 `collection create` 默认优先走 JS Bridge，只有显式 `--experimental` 才走 SQLite 直写。
- 源码检查确认，`item add-to-collection` 默认走 JS Bridge，也保留显式 `--experimental` SQLite 路径。
- 源码检查确认，`collection remove-item`、`collection rename`、`collection delete` 走 JS Bridge。
- 源码检查确认，`item move-to-collection` 仍强制 `--experimental`，通过 SQLite 直写执行；要求 Zotero 关闭。
- 项目文档承认 experimental SQLite write model 的安全规则：必须 `--experimental`、Zotero 必须关闭、写前备份、单事务、失败回滚、仅支持 local user library。

初步判断：
- 这是目前最接近用户需求的候选项目。
- 它已经基本满足“本地读写 Zotero、无需 Zotero Web API key、可管理 collection/item/tag/note/metadata、可由 Codex 通过命令行调用”的需求。
- 它不完全满足“正式维护的 MCP server”需求，因为 MCP 线已冻结；更现实的近期用法是 Codex 直接调用 `zotero-cli`，或本项目基于其 CLI/SDK 自行包一层 MCP。
- 它也不完全满足“所有 collection 管理都通过 Zotero 插件内部 API”的严格要求：`move-to-collection` 仍是 experimental SQLite 直写；虽然有备份和事务，但这与本项目“不要直接改 `zotero.sqlite`”的长期边界冲突。
- 如果接受“短期 CLI 方案 + 只使用 JS Bridge/官方 connector/local API 命令，禁用 experimental SQLite 命令”，它可以成为本项目第一阶段的实用基座。
- 如果必须实现完整、安全、可审计的 collection 重构，本项目仍需要补齐或替换 `move-to-collection` 等功能，使其走 Zotero JS API，并增加 dry-run、权限策略和审计日志。

功能覆盖矩阵：

| 需求 | 覆盖情况 | 证据/备注 |
|---|---|---|
| 本地 Zotero 操作，不依赖 Web API key | 基本满足 | JS Bridge 插件 + `zotero-cli`，写操作本地执行。 |
| collection 列表/查找/树/详情/items | 满足 | SQLite 读。 |
| 创建 collection | 满足 | 当前源码默认 JS Bridge；`--experimental` 可走 SQLite。 |
| item 加入 collection | 满足 | 当前源码默认 JS Bridge；`--experimental` 可走 SQLite。 |
| item 从 collection 移除 | 满足 | JS Bridge。 |
| collection 重命名/移动 parent | 基本满足 | JS Bridge；需实测 parent 移动细节和错误处理。 |
| 删除 collection | 满足但高风险 | JS Bridge；需要用户确认，支持 `--delete-items` 风险更高。 |
| item 在 collection 之间 move/refile | 部分满足 | 当前命令强制 experimental SQLite；不符合长期安全边界。 |
| tag 添加/移除 | 满足 | JS Bridge。 |
| metadata 更新 | 满足 | JS Bridge。 |
| note add/read | 基本满足 | child note 支持；standalone note 不支持。 |
| 导入 DOI/PMID/RIS/BibTeX/JSON | 基本满足 | DOI/PMID 走 JS Bridge；file/json 多走 connector。 |
| PDF attach/find/search annotations/full text | 基本满足 | attach/find/search 多走 JS Bridge；任意既有 item 附件上传能力需实测。 |
| 任意 Zotero JS 执行 | 满足但高风险 | `zotero-cli js` 直接执行 privileged JS。 |
| MCP 直接接入 | 不完全满足 | MCP 支持冻结在 `v0.9.5`，主线推荐 CLI/SDK。 |
| dry-run | 不满足或不系统 | 文档没有看到通用 dry-run 机制。 |
| 审计日志 | 不满足或不系统 | 有命令输出和 session helper，但不是本项目要求的写入审计日志。 |
| 权限分层 | 不满足或不系统 | JS Bridge 暴露 eval endpoint，能力很强，需要本项目外层限制。 |
| 不直接写 `zotero.sqlite` | 部分冲突 | 常规读大量使用 SQLite；部分 experimental 写直接修改 SQLite。 |

### MCP for Zotero 远程服务

论坛发布：
- https://forums.zotero.org/discussion/130133/mcp-for-zotero-connect-your-library-to-claude-chatgpt-and-other-ai-assistants

观察：
- 通过 Zotero API key 和远程 MCP endpoint 连接，论坛说明支持 search、add items、create collections、update metadata、add tags、export citations 等。
- 后续讨论显示曾有 Windows 路径、API key/user ID、ChatGPT 连接等配置问题，后来作者更新了配置说明。

初步判断：
- 可证明公开生态中已有“Zotero 写 + MCP”服务。
- 不符合本项目对本机可控、低外泄面、Zotero 本地库直接管理的目标。

## 本项目建议定位

### 项目目标

构建一个本机优先的 Zotero 管理桥接系统：

1. Zotero 内部插件负责执行所有需要 Zotero 权限的读写操作。
2. 外部 MCP server 负责向 Codex 暴露稳定 tool schema、权限策略、dry-run、日志和错误处理。
3. Codex skill 负责将用户意图转成安全的 MCP 调用流程，并明确区分 Zotero item key、BibTeX key、collection key 和本地附件路径。

### 不做的事

- 不直接修改 `L:\PaperVault\zotero-data\zotero.sqlite`。
- 不把 PDF 附件复制到 `papers/` 作为主库。
- 不默认依赖 Zotero Web API 写入作为唯一方案。
- 不默认向 LLM 暴露全文、附件路径或整个 library dump。
- 不把现有 `@zotero` read-oriented 插件当成管理写入插件。

### 需要优先验证的差距

- cookjohn/zotero-mcp 是否已经满足 Windows + Codex + 本地写入 + dry-run 审计。
- cli-anything-zotero 的 JS Bridge 是否可作为本项目插件通信层参考。
- Zotero 插件内 HTTP/Streamable HTTP server 与外部 MCP server 两种架构的安全边界差异。
- Codex 当前 MCP client 对 stdio、SSE、Streamable HTTP 的本机连接支持情况。
- Zotero 事务写入失败时的恢复策略和可审计日志格式。
