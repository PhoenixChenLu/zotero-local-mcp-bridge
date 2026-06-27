# Spec: Zotero Codex Bridge 插件设置界面

创建时间：2026-06-28

## Objective

为 Zotero 插件增加可视化设置界面，使用户能在 Zotero 内部配置本项目的安全模式、确认策略、backup/undo、附件默认行为和运行时路径。设置界面必须让公开发布版可以被独立安装和理解，避免用户只能通过源码、环境变量或手工文件修改来控制关键行为。

成功状态：

- 用户能在 Zotero 插件设置界面中看到当前安全模式、runtime/audit/backup 路径和关键策略。
- 所有写操作仍必须经过插件内部命令表、dry-run、audit 和现有 endpoint 守卫。
- 设置界面不引入 Zotero Web API 写入、不直接写 `zotero.sqlite`、不向普通管理流程暴露任意 JavaScript eval。

## Tech Stack

- Zotero 插件设置界面：Zotero 9 插件 preferences/options UI。
- 持久化：优先使用 Zotero extension preferences 存储用户设置；运行时 token、audit、backup、unlock state 继续保存在 bridge runtime 目录。
- 命令执行：设置修改如果影响写入安全边界，必须通过受控命令或等价内部 guard 记录 audit。

## Commands

设置界面实现与验证仍使用项目标准命令：

```powershell
npm run test
npm run lint
npm run typecheck
npm run build
npm run build:zotero-plugin:test
```

运行时验证：

```powershell
Invoke-WebRequest `
  -Uri http://127.0.0.1:23119/zotero-codex-bridge/health `
  -UserAgent "ZoteroCodexBridge/<version>" `
  -UseBasicParsing
```

## Project Structure

预期涉及文件：

```text
src/zotero-plugin/          # Zotero 插件 UI、preferences、设置读取与 guard
src/shared/                 # 设置 schema、默认值、风险等级类型
src/mcp-server/             # MCP 调用侧读取/尊重设置策略
tests/unit/zotero-plugin/   # 设置 schema、默认值、UI 包内容静态测试
tests/integration/          # 设置界面手工验收步骤
docs/                       # 设置界面规格与公开文档
TaskDocs/                   # 计划日志
```

## Settings Model

### 运行模式

只提供三个用户可理解的模式：

- `readonly`
  - 默认公开发布安全模式。
  - 禁止任何写操作。
  - 允许读取、搜索、导出、查看 audit、查看 backup 设置等只读命令。
  - 即使请求携带 confirmation，也拒绝执行写命令。

- `askforapprove`
  - 推荐的日常可写模式。
  - 所有写操作必须先 dry-run。
  - 普通写操作在 dry-run 后需要确认。
  - 普通高风险操作需要用户输入 `CONFIRM`。
  - 极高危或不可恢复操作需要用户输入具体命令名，例如未来的 `trash.empty`。
  - 当前第一版仍不提供永久删除、清空 Zotero trash 或直接删除既有附件文件。

- `yolo`
  - 面向明确接受自动执行风险的高级用户。
  - dry-run 仍然强制存在，不允许关闭。
  - 普通写操作和普通高风险操作可自动使用 dry-run 产生的 confirmation 执行。
  - 极高危或不可恢复操作仍必须主动确认，不允许完全静默执行。
  - 当前第一版仍不提供永久删除、清空 Zotero trash 或直接删除既有附件文件。

### TTL

TTL 表示临时授权有效期，不是 backup 保存时间，也不是 audit 保存时间。

- 真实主库写入授权 TTL 默认 30 分钟。
- TTL 到期后，真实主库可写授权失效，需要重新批准。
- 单个 dry-run plan / confirmation token 继续使用更短有效期，默认 10 分钟。
- TTL 不应影响 test profile 的基础验收能力。

### Dry-run 与确认

- dry-run 固定开启，不提供关闭选项。
- 执行类写命令必须校验未过期 `planId`、`confirmationToken` 和 input hash。
- `askforapprove` 下：
  - 普通写操作需要确认。
  - 普通高风险操作需要 `CONFIRM`。
  - 极高危或不可恢复操作需要输入具体命令名。
- `yolo` 下：
  - 普通写操作和普通高风险操作不弹出人工确认。
  - 极高危或不可恢复操作仍要求主动确认。
- `readonly` 下：
  - 所有写操作直接拒绝。

### Backup / Undo

- 文件级 backup/undo 默认开启。
- 用户可以关闭文件级 backup/undo，但 UI 必须明确提示：关闭后附件文件级恢复不再保证，只保留审计与元数据级恢复线索。
- audit 不允许关闭。
- backup root 默认位于 bridge runtime 下的 `runtime/backups/zotero-operations/`。
- 用户允许自定义 backup root。
- backup root 必须通过路径安全校验，拒绝以下位置：
  - Zotero profile
  - Zotero Data Directory
  - Zotero linked attachment root
  - 任意具体附件目录
- 保留策略：
  - 按时间保留默认 30 天。
  - 按空间上限默认 10GB。
  - 时间限制和空间限制可以分别启用。
  - 两者都启用时，先执行空间限制，再执行时间限制。

### 附件策略

- 默认附件模式：复制到 Zotero storage。
- 用户可以切换默认 linked file。
- 第一版允许的附件类型至少包括 PDF、DOC、DOCX、CSV、XLS、XLSX、常见图片文件、HTML。
- 附件文件重命名和 Zotero 内置自动重命名必须继续 dry-run。
- 附件写入前的重复检测默认开启。

### 删除 / Trash / Merge

- collection trash 默认只移动 collection/subcollection 到 Zotero trash，不移动 descendant items。
- `trashDescendentItems` 默认关闭。
- `item.trash`、`attachment.trash`、`collection.trash` 属于普通高风险操作。
- `duplicates.merge` 属于普通高风险操作。
- 第一版 UI 不提供永久删除、清空 Zotero trash、直接删除既有附件文件。
- 未来如果加入不可恢复操作，`askforapprove` 和 `yolo` 都必须主动确认，且确认短语为具体命令名。

### Audit

- audit 固定开启，不允许关闭。
- 必须记录 dry-run、execute、失败命令和设置修改。
- audit root 默认位于 bridge runtime 下的 `runtime/logs/audit/`。
- 设置界面可以提供“打开 audit 文件夹”入口。

### 批量操作

- 批量上限固定 50，暂不提供 UI 调整。
- 批量写操作默认尽量执行所有可执行项，不因单项失败中途停止。
- 执行完成后必须汇总成功项、失败项、错误详情、audit 路径和已完成部分可用的 undo 操作清单。

## Testing Strategy

- Unit tests:
  - 默认设置 schema。
  - 三种运行模式对写命令的 guard 行为。
  - backup root 路径安全校验。
  - 高风险/极高危确认策略。
- Static XPI tests:
  - 设置界面资源被打入 XPI。
  - release build 不含本机测试路径、测试 token 或测试 profile 数据。
- Runtime tests:
  - Zotero 设置界面能显示和保存设置。
  - 修改设置后 command endpoint 行为立即或重启后按规格生效。
  - 设置修改写入 audit。

## Boundaries

- Always:
  - dry-run 固定开启。
  - audit 固定开启。
  - 设置修改影响安全边界时必须被审计。
  - backup root 自定义路径必须做安全校验。

- Ask first:
  - 新增不可恢复操作。
  - 允许 UI 调整批量上限。
  - 允许 yolo 跳过极高危确认。

- Never:
  - 设置界面提供关闭 dry-run 的选项。
  - 设置界面提供关闭 audit 的选项。
  - 第一版提供永久删除、清空 Zotero trash 或直接删除既有附件文件。
  - 将 runtime、audit、backup、undo 写入 Zotero profile、Zotero Data Directory、linked attachment root 或附件目录。

## Success Criteria

- 设置界面显示 `readonly`、`askforapprove`、`yolo` 三种模式。
- `readonly` 下写命令被拒绝。
- `askforapprove` 下普通高风险操作要求 `CONFIRM`，未来极高危操作要求具体命令名。
- `yolo` 下普通写操作和普通高风险操作可免人工确认，但极高危操作仍主动确认。
- dry-run 与 audit 均不可关闭。
- backup/undo 可关闭，关闭时 UI 显示明确风险提示。
- backup root 可自定义并通过路径安全校验。
- backup 策略支持 30 天和 10GB 默认值，空间限制优先于时间限制。
- 批量上限固定 50。

## Open Questions

- 设置界面是否需要提供“一键打开 runtime 根目录”。
- 设置修改是否通过新增 MCP/插件命令执行，还是只在 Zotero preferences UI 内部写 pref 并记录 audit。
- 极高危操作的枚举需要在未来真正加入永久删除/清空 trash 前再次确认。
