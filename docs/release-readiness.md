# 发布就绪与安全边界审查（步骤 2）

日期：2026-06-27

本文件用于冻结公开发布版需求，限定“内部测试版”和“公开发布版”的差异，作为 `0.1.x` 向公开版本推进的硬门槛。目标是让后续开发能用同一份标准做验收，不再沿用测试版默认行为。

## 一、公开发布与内部测试分离

### 1. 内部测试版（当前 0.1.31）

- 默认 profile：`ZoteroCodexBridgeTest`。
- 必须存在本地 marker：`ZoteroProfile/.zotero-codex-bridge-test-profile`。
- 运行时约束：`profileMode: "test"`。
- 运行环境：`README`、`spec` 与集成文档明确为“测试 profile 约束”。
- 写入目标：`logs/audit` 与 `backups/zotero-operations` 使用项目目录下路径。

### 2. 公开发布版（目标行为）

- 默认不写主库、默认只读/安全锁定启动。
- 所有写操作默认被拦截，只有在安全解锁并显式确认后才放行。
- 写入流程必须由 dry-run + plan + confirmationToken + execute 组成。
- 审计和 backup 为公开发布中的硬性可观测性要求。
- 审计、backup、undo 一律不允许落到 Zotero profile、Zotero data directory、linked attachment root、附件目录。
- 仍禁止：
  - Zotero Web API 写入
  - 直接写 `zotero.sqlite`
  - 暴露任意 JS eval
  - 使用/保存 `ZOTERO_API_KEY`

## 二、发布分发路径（现实可执行）

### Zotero 插件公开分发

项目当前没有可直接上传到 Zotero 官方插件库的官方入口。现实可执行路径为：

1. GitHub Release（发布 XPI 与 Release Note）
2. 项目主页（源代码、安装说明、兼容矩阵、变更说明）
3. Zotero Forums 公告（发布说明与社区入口）
4. `update manifest`（供 zotero 的更新能力消费）

> 任何公开说明文档必须避免宣称已有官方插件库提交路径，避免误导用户。

### MCP 公开发布路径

- MCP server 公开发布需要可分发 artifact（例如 npm 包）作为启动单元。
- 必须提供：
  - `mcpName`
  - `server.json`
  - stdio 安装与启动命令文档
  - MCP Registry metadata
- MCP Registry 不托管 artifact，仅托管元数据；因此不能把可执行发布物视为已发布，只能通过 npm 等包分发渠道完成 artifact 分发。

## 三、公开发布硬性 gate（Release Gate）

### 必须满足

1. **去除测试 profile 依赖**
   - 文档、脚本和运行路径不得默认绑定 `H:\ProgramDocument\...` 等本机路径。
   - 禁止在文档或默认配置中写死当前工作区路径。
2. **默认安全模式**
   - 默认 profile 模式为只读或安全锁定（real-locked/safe）。
   - `execute` 级别写入必须要求 `planId + confirmationToken`。
3. **确认链路完整**
   - dry-run 返回包含受影响对象与路径。
   - execute 前必须校验 plan 未过期并校验输入 hash。
   - 需保留 confirmation 风险语义（高风险操作更严格）。
4. **备份与审计**
   - 备份策略与审计路径必须存在且可见。
   - backup/audit/undo 三者联动：支持回滚提示和恢复依据。
5. **路径隔离**
   - 审计文件不写入 Zotero profile、Zotero data directory、linked attachment root 或附件目录。
   - backup snapshot 不写入以上高敏感目录。
6. **硬禁用项**
   - 禁止 Web API 写入
   - 禁止直接写 `zotero.sqlite`
   - 禁止暴露任意 JS eval
   - 禁止依赖 `ZOTERO_API_KEY`
7. **真实主库保护**
   - 真实主库写入默认禁用。
   - 明确提供解锁动作与风险提示。
   - 解锁状态变更必须可见，并可回退到锁定状态。

## 四、0.1.31 不能直接公开发布的原因

`0.1.31` 仍定位内部测试版，仅满足第一阶段测试闭环，未通过公开发布 gate：

- 仍是以 `ZoteroCodexBridgeTest` 与测试 profile marker 为主要流程前提。
- 真实发布路径未落地（无 npm registry 分发链路、无成熟 MCP 发布元数据链路、无官方插件库入口）。
- 缺少公开版本默认只读/安全锁定与真实主库显式解锁的完整交付机制。
- 部分运行说明与安装说明仍偏向本地开发流，不满足公开文档中的安装与升级体验要求。
- 若直接公开，会把第一阶段边界误导为可用于真实主库生产场景。

## 五、当前功能缺口（公开版本待实现）

- item 创建与完整元数据编辑（创建、更新、字段级更新、creator 管理）
- BibTeX / RIS / CSL 导入导出
- PDF annotation 读取与写入
- 高级搜索、保存搜索、引用格式输出
- 真实主库解锁能力（含显式解锁流程、风险回显与回退）
- Codex 专用 skill
- 删除与 merge duplicates

## 六、文档与审核一致性要求

- `docs/spec-zotero-local-write-mcp.md`：边界、模式、写入流程与安全限制必须同步。
- `README.md`：公开发布可读性说明、当前版本状态、原因说明需同步。
- `TaskDocs/Zotero本地写入MCP开源公开发布计划日志.md`：步骤 2 必须标注为已完成，并记录门禁证据。
- 任何新增文档不得出现待办占位符，以免影响冻结状态。
