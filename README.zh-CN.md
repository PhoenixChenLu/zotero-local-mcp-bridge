# Zotero Local MCP Bridge

**本地优先的 Zotero 管理 MCP 桥接工具。**

[![License: AGPL-3.0-or-later](https://img.shields.io/badge/License-AGPL--3.0--or--later-blue.svg)](LICENSE)
[![Node.js >=22](https://img.shields.io/badge/Node.js-%3E%3D22-339933.svg)](package.json)
[![Zotero](https://img.shields.io/badge/Zotero-9.x-CC2936.svg)](docs/compatibility-matrix.md)
[![Local First](https://img.shields.io/badge/local--first-no%20cloud%20writes-2E7D32.svg)](#安全模型)

简体中文 · [English](README.md)

Zotero Local MCP Bridge 让本地 AI Agent 通过 Zotero 插件内置的 HTTP MCP endpoint 管理本地 Zotero 文库。它面向研究写作自动化场景，重点是受控读写、导入导出、附件管理、PDF annotation、审计、备份和撤销。

## 它能做什么

- 读取和搜索本地 Zotero 条目、collection、保存搜索、附件、annotation 和审计记录。
- 创建和编辑 item、creator、字段、tag、note、collection 和 collection membership。
- 导入和导出 BibTeX、RIS、CSL JSON。
- 通过 Zotero 生成 citation 和 bibliography。
- 添加、移动、重命名和读取附件。
- 调用 Zotero 内置附件自动重命名能力。
- 读取、创建和更新受支持的 PDF annotation。
- 所有写操作强制经过 dry-run 和 confirmation。
- 在 Zotero 数据目录之外保存审计日志和文件级 backup snapshot。

## 工作方式

```text
Agent
  -> MCP tool
  -> Zotero 插件 HTTP MCP endpoint
  -> 插件内部命令表
  -> Zotero 内部 API
```

Zotero 插件把 MCP endpoint 注册到 Zotero 自带的本地 connector server 上：

```text
http://127.0.0.1:23119/zotero-local-mcp-bridge/mcp
```

发布路径不再暴露独立 command endpoint，也不默认启动 Node/Python sidecar。

## 快速开始

### 1. 安装 Zotero 插件

从 GitHub Releases 下载最新版 XPI：

```text
zotero-local-mcp-bridge.xpi
```

在 Zotero 中安装：

```text
Tools -> Plugins -> Install Add-on From File
```

安装后重启 Zotero。

如果你从源码仓库安装，可以使用本地安装助手：

```powershell
npm install
npm run install:local -- --build
```

它会构建 release XPI 并打开 XPI 所在文件夹，但不会静默修改 Zotero profile。详见 [安装说明](docs/installation.md)。

正式发布准备三种安装方式：

1. npm 全局安装：`npm install -g zotero-local-mcp-bridge` 后运行 `zotero-local-mcp-bridge setup`
2. clone 源码并本地构建
3. 直接下载 GitHub Release 中的 XPI 和 skill artifact

### 2. 检查 MCP endpoint 是否启动

重启 Zotero 后，向插件内 MCP endpoint 发送 JSON-RPC initialize 请求：

```powershell
Invoke-WebRequest `
  -Uri http://127.0.0.1:23119/zotero-local-mcp-bridge/mcp `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"jsonrpc":"2.0","id":"init","method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"manual-probe","version":"0.0.0"}}}' `
  -UserAgent "ZoteroLocalMcpBridge" `
  -UseBasicParsing
```

预期返回包含：

```text
"serverInfo":{"name":"zotero-local-mcp-bridge"
```

### 3. 连接 MCP 客户端

在 MCP 客户端中配置 Streamable HTTP / HTTP JSON-RPC，地址使用上面的插件内 MCP endpoint。用户不需要额外保持终端命令或手动后台服务运行。

server 会把每个 Zotero 命令暴露为一个 MCP tool，例如
`zotero_collection_get_tree` 和 `zotero_item_create`。写入类 tool 默认返回
dry-run plan；真正执行时必须传回该 plan 的 `planId` 和
`confirmationToken`。

可发布的通用 Agent skill 位于：

```text
skills/zotero-local-mcp-bridge/
```

任何支持 MCP 的 Agent 都应通过这个 skill 了解调用规则。

## 安全模型

Zotero Local MCP Bridge 默认保守。

- 不使用 Zotero Web API 写入。
- 不需要 `ZOTERO_API_KEY`。
- 不直接写 `zotero.sqlite`。
- 不把任意 JavaScript eval 暴露为普通管理工具。
- 第一版不支持 group library。
- 所有写操作必须先 dry-run，再 execute。
- execute 必须提供有效 `planId` 和 `confirmationToken`。
- 审计日志和 backup 不能写入 Zotero profile、Zotero data directory、linked attachment root 或附件目录。
- 删除类能力只允许进入 Zotero trash 或受控 merge；不支持永久 erase 或清空 trash。

运行模式：

| 模式 | 行为 |
| --- | --- |
| 只读 | 拒绝所有写操作 |
| 请求批准 | dry-run 后由 Agent/MCP client 向用户请求批准；Zotero 不会为普通写操作弹出确认框 |
| YOLO | 当 `plan.agentApproval.mayAutoExecute` 为 true 时，Agent/MCP client 可在 dry-run 后自动 execute；不可恢复操作仍需显式确认 |

在 Zotero 中配置：

```text
Zotero Settings -> Zotero Local MCP Bridge
```

## 支持的命令范围

| 领域 | 示例能力 |
| --- | --- |
| Collections | 创建、重命名、移动、读取 tree、读取 items、添加/移除 items、trash |
| Items | 读取、搜索、创建、更新字段、更新 creators、设置 collections、tag、trash |
| Search | 高级搜索、保存搜索 list/get/create/update |
| Citation | citation 和 bibliography 输出 |
| Import/export | BibTeX、RIS、CSL JSON |
| Annotations | 读取、创建、更新受支持的 PDF annotation |
| Notes | 创建 child note |
| Attachments | 读取、添加文件、移动、重命名、Zotero rename、撤销新增、trash |
| Backup | 设置、snapshot list、restore、prune |
| Audit | 读取审计事件 |
| Safety | profile status、解锁真实 profile、锁定真实 profile |
| Duplicates | 查找重复项、受控 merge |

字段级命令格式见 [Agent skill](skills/zotero-local-mcp-bridge/SKILL.md)。

## 文档

- [Agent skill](skills/zotero-local-mcp-bridge/SKILL.md)
- [安装说明](docs/installation.md)
- [MCP 发布说明](docs/mcp-publication.md)
- [Zotero 插件发布说明](docs/zotero-plugin-publication.md)
- [兼容矩阵](docs/compatibility-matrix.md)
- [隐私说明](PRIVACY.md)
- [安全策略](SECURITY.md)
- [路线图](docs/roadmap-complete-zotero-coverage.md)
- [赞助说明](docs/sponsorship.md)

## 开发命令

```powershell
npm run typecheck
npm run lint
npm run build
npm run build:zotero-plugin:release
```

## 环境要求

- Node.js 22 或更新版本。
- 当前主要目标运行时是 Zotero 9.x。
- 建议先使用只读模式，并在启用写操作前审查 dry-run 计划。

## 赞助

计划使用的个人赞助渠道：

- Ko-fi
- 爱发电

真实链接会在维护者创建对应页面后启用。本项目当前不使用 fiscal host。

## 许可证

AGPL-3.0-or-later。见 [LICENSE](LICENSE)。
