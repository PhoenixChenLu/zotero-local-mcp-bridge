# 运行时路径策略（生产模式）

## 目标

- 插件与 MCP server 安装后，不应依赖构建机路径（例如 `H:\ProgramDocument\...`）。
- `auth token`、`audit`、`backup` 统一落在用户可解析的运行时配置目录。
- 允许通过环境变量/偏好覆盖目录，以便管理员或高级用户控制数据位置。
- 严格禁止写入：Zotero profile 目录、Zotero data directory、linked attachment root、`storage`。

## 环境与平台路径

默认运行时根目录为：

- Windows：`%APPDATA%\zotero-codex-bridge`
- macOS：`~/Library/Application Support/zotero-codex-bridge`
- Linux（含其他类 Unix）：`${XDG_STATE_HOME || XDG_DATA_HOME || ~/.local/share}/zotero-codex-bridge`

MCP 侧解析优先级：

1. `ZOTERO_CODEX_BRIDGE_RUNTIME_DIR`（显式配置，最高优先）
2. 平台默认运行时目录（上文）

Bootstrap（插件）解析顺序：

1. 插件打包配置显式 `runtimeRoot`（开发/测试可注入）
2. `ZOTERO_CODEX_BRIDGE_RUNTIME_DIR`（用户环境变量）
3. Zotero prefs `extensions.zotero-codex-bridge.runtimeRoot`（高级用户可设）
4. 平台默认运行时目录（Windows 优先 APPDATA，其次 LOCALAPPDATA）

## 相对子路径

在运行时根目录下固定使用：

- `runtime/auth/bridge-token`：桥接鉴权 token
- `runtime/backups/zotero-operations`：附件备份快照
- `runtime/logs/audit`：审计日志（JSONL）

## 开发与测试模式差异

- **开发/测试打包**：构建脚本可注入固定 token（便于本地脚本测试）。
- **生产发布**：不在 XPI 中写入项目路径；token 默认从运行时目录读取 `runtime/auth/bridge-token`。
- 两种模式都通过同一套相对子路径组织运行数据，避免目录语义漂移。

## 禁止写入目录（红线）

无论环境与模式如何，下列目录不能作为 `auth`、`audit`、`backup` 的目标：

- Zotero profile 目录（如 `.zotero` profile dir）
- Zotero data directory（包括 storage）
- linked attachment root
- `storage` 内部附件文件夹

## 验证要点

- 构建产物展开后不应再出现构建机绝对路径（如 `H:\ProgramDocument\...`）。
- 打包产物内不应出现 `__ZOTERO_CODEX_BRIDGE_PROJECT_ROOT__`/`__ZOTERO_CODEX_BRIDGE_AUTH_TOKEN__`。
- `auth`、`audit`、`backup` 写入路径均应在上述运行时根目录与固定子路径之内。
