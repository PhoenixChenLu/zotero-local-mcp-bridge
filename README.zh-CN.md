<div align="center">

# Zotero Local MCP Bridge

通过 Zotero 插件内置 MCP 端点，让本地智能体安全管理本地 Zotero 文库。

<p align="center">
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/badge/License-AGPL--3.0--or--later-blue.svg"></a>
  <a href="src/zotero-plugin/manifest.json"><img alt="Version" src="https://img.shields.io/badge/version-0.1.60-4c78a8.svg"></a>
  <a href="https://www.zotero.org/"><img alt="Zotero" src="https://img.shields.io/badge/Zotero-9.x-cc2936.svg"></a>
  <a href="#工作机制"><img alt="MCP" src="https://img.shields.io/badge/MCP-plugin--hosted-2e7d32.svg"></a>
  <a href="#工作范围"><img alt="Local First" src="https://img.shields.io/badge/local--first-loopback--only-2e7d32.svg"></a>
  <a href="https://github.com/PhoenixChenLu/zotero-local-mcp-bridge/pulls"><img alt="PRs welcome" src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg"></a>
  <a href="skills/zotero-local-mcp-bridge-zh-cn/SKILL.md"><img alt="Codex ready" src="https://img.shields.io/badge/Codex-ready-111827.svg"></a>
  <a href="skills/zotero-local-mcp-bridge-zh-cn/SKILL.md"><img alt="OpenCode ready" src="https://img.shields.io/badge/OpenCode-ready-111827.svg"></a>
  <a href="skills/zotero-local-mcp-bridge-zh-cn/SKILL.md"><img alt="Claude Code ready" src="https://img.shields.io/badge/Claude%20Code-ready-111827.svg"></a>
</p>

AGPL-3.0-or-later · 插件版本 0.1.60 · Zotero 9.x · 插件内置 MCP · 本地回环访问

**简体中文** · [English](README.md)

[能做什么](#能做什么) · [不能做什么](#不能做什么) · [工作范围](#工作范围) · [工作机制](#工作机制) · [快速开始](#快速开始) · [使用示例](#使用示例) · [支持作者](#支持作者) · [开源协议](#开源协议)

</div>

---

## ✨ 能做什么

Zotero Local MCP Bridge 让支持 MCP 的智能体通过 Zotero 本身管理本地 Zotero 文库。它不是绕过 Zotero 的数据库脚本，而是一个运行在 Zotero 插件内部的本地 MCP 入口。

| 范围 | 能力 |
|---|---|
| 📚 条目与分类 | 读取、搜索、创建、编辑条目；批量检查 DOI 是否已入库；批量管理条目与顶层分类或子分类的成员关系 |
| 📎 附件 | 添加、移动、重命名、读取附件；单个或批量导入 PDF/EPUB 并调用 Zotero 内置元数据识别和附件自动重命名 |
| 📝 标注与引用 | 读取、创建和更新受支持的 PDF 标注；通过 Zotero 生成引用和参考文献 |
| 🔁 导入导出 | 支持 BibTeX、RIS、CSL JSON 的导入和导出 |
| 🔎 搜索 | 支持基础搜索、高级搜索、保存搜索读取和维护 |
| 🛡️ 安全流程 | 所有写操作强制 dry-run；支持批准、审计、文件级备份和撤销 |
| 🧩 重复项 | 支持重复项发现和受控合并 |

> [!NOTE]
> 写操作不会直接执行。智能体会先拿到 dry-run 计划、警告、受影响目标和确认信息；在需要批准的模式下，必须得到用户批准后才会执行。

---

## 🚫 不能做什么

| 不支持 | 原因 |
|---|---|
| 管理联网 Zotero 文库 | 本项目不通过 Zotero Web API 写入，也不管理远程 Zotero 账号 |
| 使用 `ZOTERO_API_KEY` | 本项目不要求、不读取、不保存 Zotero API key |
| 直接写 `zotero.sqlite` | 所有变更都应通过 Zotero 内部 API 完成 |
| 暴露任意 JavaScript eval | 普通管理能力必须来自插件内部命令表 |
| 管理 group library | 当前公开范围只覆盖本地用户文库 |
| 永久删除或清空 trash | 当前仅支持 Zotero trash 或受控合并，不做不可恢复擦除 |
| 直接删除既有附件文件 | 附件文件操作必须受 backup/undo 和安全边界约束 |

---

## 📍 工作范围

本插件面向同一台机器上的 Zotero Desktop 和本地 MCP 客户端。MCP 端点注册在 Zotero 自带本地 connector server 上，只走本地回环地址。

| 项目 | 当前设定 |
|---|---|
| 运行位置 | Zotero 插件内部 |
| 访问地址 | `http://127.0.0.1:23119/zotero-local-mcp-bridge/mcp` |
| 文库范围 | 本地用户文库 |
| 写入方式 | Zotero 内部 API |
| 网络模型 | 本地回环，不使用云端写入 |
| 审计与备份 | 必须位于 Zotero profile、Zotero data directory、linked attachment root 和附件目录之外 |

运行模式在 `设置 -> Zotero Local MCP Bridge` 中配置：

| 模式 | 行为 |
|---|---|
| `readonly` | 拒绝所有写入 |
| `askforapprove` | dry-run 后由智能体向用户请求批准 |
| `yolo` | 普通写操作可在计划允许时自动执行；高风险或未来不可恢复操作仍需明确确认 |

---

## ⚙️ 工作机制

```text
支持 MCP 的智能体
  -> MCP 工具调用
  -> Zotero 本地 connector server
  -> Zotero Local MCP Bridge 插件端点
  -> 插件命令表
  -> Zotero 内部 API
```

MCP 端点由 Zotero 插件内部提供：

```text
http://127.0.0.1:23119/zotero-local-mcp-bridge/mcp
```

不需要另外启动 Node、Python 或 sidecar MCP 进程。启动 Zotero 就会启动插件端点，关闭 Zotero 就会停止它。发布版本只暴露 MCP 工具，不再暴露旧的私有 command endpoint。

对于 Codex 和 Claude Code 这类支持 Streamable HTTP MCP 的客户端，直接连接这个端点即可。对于 OpenCode 或其他支持 stdio 但不支持 Streamable HTTP 的客户端，可以使用独立的 stdio adapter；adapter 作为智能体侧兼容层运行，不放入 XPI，也不接触 Zotero 数据库。

---

## 🚀 快速开始

### 1. 下载发布文件

从 [GitHub Releases](https://github.com/PhoenixChenLu/zotero-local-mcp-bridge/releases) 下载：

| 文件 | 用途 |
|---|---|
| `zotero-local-mcp-bridge.xpi` | Zotero 插件 |
| `zotero-local-mcp-bridge-<version>.mcpb` | 适用于 macOS 和 Windows 的 Claude Desktop MCP 安装包 |
| 中文 skill | 给中文智能体使用 |
| 英文 skill | 给英文智能体使用 |

### 2. 安装 Zotero 插件

打开 Zotero 插件管理器：

```text
工具 -> 插件
```

将下载的 `zotero-local-mcp-bridge.xpi` 拖入插件管理器窗口，按提示确认安装。安装完成后重启 Zotero。

### 3. 设置运行模式

打开：

```text
设置 -> Zotero Local MCP Bridge
```

首次使用建议选择 `readonly` 或 `askforapprove`。确认你理解 dry-run、批准、审计和备份后，再考虑使用 `yolo`。

### 4. 连接 MCP 客户端

智能体可以通过 stdio 或 Streamable HTTP 接入。macOS 或 Windows 上的 Claude Desktop 用户还可以安装已经打包的 MCPB adapter。

#### 方式 A：stdio MCP

安装 npm adapter：

```bash
npm install -g zotero-local-mcp-bridge-stdio-adapter
```

然后在智能体里配置 stdio MCP：

```toml
[mcp_servers.zotero-local-mcp-bridge]
command = "zotero-local-mcp-bridge-stdio"
args = []
startup_timeout_sec = 20
tool_timeout_sec = 120
```

通用 stdio MCP 配置：

```json
{
  "mcpServers": {
    "zotero-local-mcp-bridge": {
      "type": "stdio",
      "command": "zotero-local-mcp-bridge-stdio",
      "args": []
    }
  }
}
```

也可以不全局安装，直接用 `npx`：

```json
{
  "mcpServers": {
    "zotero-local-mcp-bridge": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "zotero-local-mcp-bridge-stdio-adapter"]
    }
  }
}
```

stdio adapter 是兼容层，会在智能体会话中由智能体启动，并把 stdio MCP 请求转发到 Zotero 插件 HTTP MCP endpoint。它不是 Zotero 插件本体，也不会随 Zotero 启动。

编辑智能体配置前，先验证已安装插件和 MCP endpoint：

```bash
zotero-local-mcp-bridge-stdio doctor
```

该一次性命令会检查 MCP 初始化和工具发现，然后输出检测到的插件版本、工具数量以及可复制的 Codex、Claude Code 和 OpenCode 配置。它不会修改智能体配置文件。

Codex、Claude Code、OpenCode、Claude Desktop 的接入方式及当前 ChatGPT 限制见[客户端兼容性矩阵](docs/clients/compatibility.md)。

#### 方式 B：HTTP MCP

如果你的智能体支持 Streamable HTTP / HTTP MCP，可以不安装 npm 包，直接连接 Zotero 插件端点：

```text
http://127.0.0.1:23119/zotero-local-mcp-bridge/mcp
```

Codex 示例：

```toml
[mcp_servers.zotero-local-mcp-bridge]
url = "http://127.0.0.1:23119/zotero-local-mcp-bridge/mcp"
startup_timeout_sec = 10
tool_timeout_sec = 120
```

Claude Code 示例：

```bash
claude mcp add --transport http zotero-local-mcp-bridge http://127.0.0.1:23119/zotero-local-mcp-bridge/mcp
```

#### 方式 C：Claude Desktop MCPB

在 macOS 或 Windows 的 Claude Desktop 中安装 `zotero-local-mcp-bridge-<version>.mcpb`。MCPB 只包含 stdio 兼容层，不包含 Zotero 插件；需要先安装 XPI，并在使用期间保持 Zotero 运行。详见 [Claude Desktop 接入说明](docs/clients/claude-desktop.md)。

### 5. 安装对应 skill

| 语言 | skill |
|---|---|
| 中文 | [skills/zotero-local-mcp-bridge-zh-cn/SKILL.md](skills/zotero-local-mcp-bridge-zh-cn/SKILL.md) |
| English | [skills/zotero-local-mcp-bridge/SKILL.md](skills/zotero-local-mcp-bridge/SKILL.md) |

告诉智能体通过 Zotero Local MCP Bridge 使用 Zotero。需要批准时，智能体应只用简短语句说明即将执行的操作，并等待用户批准。

### 6. 执行第一个只读查询

向智能体提出：

```text
列出我的 Zotero 分类树，不要进行任何修改。
```

智能体应使用 `libraryScope=local-user` 调用 `zotero_collection_get_tree`。该查询不需要写入批准。

---

## 🧪 使用示例

| 你可以这样要求智能体 | 预期行为 |
|---|---|
| 列出我的 Zotero 分类树 | 只读查询，不触发写入确认 |
| 检查这批 DOI 哪些已经在库中 | 一次批量查询，返回命中条目、可复用的条目 key 和未命中 DOI |
| 把这批已入库条目加入“当前项目 / 待读文献” | 对整个批次执行一次 dry-run、一次必要的批准和一次写入，跳过已有成员 |
| 在“当前项目”下新建“待读文献”子分类 | 先 dry-run，再请求批准 |
| 给这个条目添加这个 PDF 附件 | 先解析条目和文件路径，再 dry-run 附件操作 |
| 导入这个 PDF 并自动识别文献信息 | 先 dry-run，再调用 Zotero 内置识别流程创建父条目并按偏好重命名附件 |
| 批量导入这些 PDF 并自动识别文献信息 | 使用批量识别工具，一次 dry-run、一次批准、一次执行 |
| 把选中条目导出为 BibTeX | 只读导出，不需要写入确认 |
| 用指定样式生成参考文献 | 通过 Zotero citation formatter 输出 |

批准模式下，单个写操作会通过 Agent 像这样交互：

```text
即将给“当前项目”新建名为“待读文献”的子分类，需要批准执行。
```

多个待批准操作会使用编号表格，让用户可以批准全部，也可以通过编号批准其中一部分：

```text
以下操作需要批准：

| 编号 | 操作 |
|---:|---|
| 1 | 删除“旧项目”下的“临时分类”（移入 Zotero trash） |
| 2 | 合并重复条目“Smith 2024”和“Smith 2024 copy” |
| 3 | 将“Zotero MCP 设计笔记”添加到“当前项目 / 待读文献” |
```

可回复“全部批准执行”，或回复“批准 1 和 3，拒绝 2”。

如果本项目对你的工作有帮助，可以[为仓库添加 Star](https://github.com/PhoenixChenLu/zotero-local-mcp-bridge)，或提交包含可复现信息的[问题反馈](https://github.com/PhoenixChenLu/zotero-local-mcp-bridge/issues)。

---

## ❤️ 支持作者

<div align="center">
  <a id="ko-fi-support" href="https://ko-fi.com/phoenixchen"><img alt="Ko-fi" src="https://img.shields.io/badge/Ko--fi-Support%20Author-ff5e5b?logo=kofi&logoColor=white"></a>
  <a id="afdian-support" href="https://afdian.com/a/PhoenixChen"><img alt="爱发电" src="https://img.shields.io/badge/%E7%88%B1%E5%8F%91%E7%94%B5-%E6%94%AF%E6%8C%81%E4%BD%9C%E8%80%85-946ce6"></a>
</div>

---

## 📄 开源协议

Zotero Local MCP Bridge 使用 AGPL-3.0-or-later 协议。见 [LICENSE](LICENSE)。
