# Zotero Official Guidance Plan Review

创建时间：2026-06-26

本文件基于 Zotero 官方插件开发资料、官方 `zotero/make-it-red` 示例，以及本机 Zotero 9.0.5 server 源码，对当前项目计划做一次重新审视。结论不是推翻现有目标，而是必须在继续真实写命令接入前修订若干前置步骤。

## Sources

- Zotero plugin development:
  - https://www.zotero.org/support/dev/client_coding/plugin_development
- Zotero 7+ developer notes:
  - https://www.zotero.org/support/dev/zotero_7_for_developers
- Zotero connector HTTP server:
  - https://www.zotero.org/support/dev/client_coding/connector_http_server
- Official sample plugin:
  - https://github.com/zotero/make-it-red
- Local Zotero 9.0.5 connector server source:
  - `references/official/zotero/zotero-9.0.5-server/server.js`
  - `references/official/zotero/zotero-9.0.5-server/server_connector.js`
  - `references/official/zotero/zotero-9.0.5-server/server_localAPI.js`

## Findings

### 1. XPI-only inner loop is not ideal

当前计划把 `dist/zotero-codex-bridge.xpi` 作为进入 Zotero 验收前的主要路径。XPI packaging 仍然必要，但官方插件开发资料更适合开发期使用 extension proxy/source directory 方式加载源码，减少每次修改都重新打包、拖入、重启和版本号递增造成的噪声。

修订：

- 保留 `npm run build:zotero-plugin` 作为安装包和回归验收路径。
- 在步骤 10A 之后新增开发安装路径：使用 Zotero profile 的 extension proxy 指向本项目插件开发目录。
- 每次涉及 bootstrap/manifest 变更时，记录是否需要重启 Zotero 或清理启动缓存。

### 2. Command endpoint security must move from open question to gate

Zotero connector server 是本机 HTTP server。虽然 Zotero 9.0.5 server 源码会拦截 browser-like User-Agent，但 command endpoint 未来会承载真实写操作，不能只依赖 User-Agent 或浏览器拦截行为。

修订：

- 在任何真实写命令接入 `/zotero-codex-bridge/command` 前，必须先实现 command endpoint 鉴权。
- 最低要求：本项目生成的本机 secret、请求签名或等价 token；token 不写入 Zotero profile、Zotero data directory 或附件目录。
- health endpoint 可保持无敏感信息的 GET；command endpoint 不允许 `allowRequestsFromUnsafeWebContent`。
- command endpoint 必须只接受 `application/json`，拒绝非 JSON content type 和未知 origin/browser-like 请求。

### 3. Internal Zotero write APIs need source audit before implementation

当前计划中的 collection、item、note、attachment adapter 是合理的边界层，但具体 Zotero 内部 API 不能继续凭经验假设。附件写入、附件移动、附件自动重命名尤其依赖 Zotero 内部实现细节。

修订：

- 在每个真实 Zotero 写 adapter 实现前，新增来源审计小步骤。
- 审计材料优先级：官方文档、官方示例、本机 Zotero 9.0.5 源码、Zotero 内置 translator/attachment 相关源码。
- 每个 adapter 文档必须记录实际调用的 Zotero API、事务边界、失败模式、是否需要 UI/main-window context。

### 4. Bootstrap lifecycle shape is now corrected

官方 sample 包含 `install`、`startup`、`onMainWindowLoad`、`onMainWindowUnload`、`shutdown`、`uninstall`。当前 `0.1.5` 已补齐 no-op window hooks，这一点符合官方形态。

保留：

- 无 UI 逻辑时，window hooks 可以保持 no-op。
- 后续如果新增 preference pane 或 UI 菜单，必须在 window hooks 中添加和移除。

### 5. Health response and MCP client contract must match

按 Zotero 9.0.5 `/connector/ping` 同形实现后，health endpoint 返回纯文本。MCP client 不能继续按 JSON 解析 health response。

修订：

- `ZoteroPluginClient.health()` 返回 plain text。
- JSON contract 只用于 `/zotero-codex-bridge/command`。

### 6. Compatibility target should be explicit

原成功标准写成“可安装到 Zotero 7 测试 profile”，但当前用户实际环境是 Zotero 9.0.5。官方文档覆盖 Zotero 7+，本项目当前应以 Zotero 9.0.5 为第一验收目标。

修订：

- 第一阶段验收目标：Zotero 9.0.5 64-bit on Windows。
- Zotero 7/8 兼容性作为后续兼容矩阵，不作为当前阻塞项。
- `strict_max_version: "9.0.*"` 是当前测试包策略；发布前需要真实 update manifest，而不是 `example.com` 占位。

### 7. Plugin runtime source of truth must be clarified

当前项目同时有 `bootstrap.ts` 和手写 `bootstrap.js`，而 XPI 实际打包 `bootstrap.js`。这在早期可接受，但后续容易出现 TS 常量与 JS 运行时代码不一致。

修订：

- 短期：明确 `src/zotero-plugin/bootstrap.js` 是 Zotero runtime source of truth，`bootstrap.ts` 只保存共享常量。
- 中期：增加构建步骤或测试，确保 manifest version、bootstrap version、README health string 同步。

## Revised Next Gates

继续进入真实 Zotero 写命令前，必须依次完成：

1. 验证当前测试 XPI 的 health endpoint 在 `ZoteroCodexBridgeTest` 中实际返回 OK。
2. 增加开发期 extension proxy/source-load 路径，减少重复 XPI 安装。
3. 为 `/zotero-codex-bridge/command` 设计并实现本机请求鉴权。
4. 对第一批真实 Zotero API 写 adapter 做源码审计，先从 collection tree 和 collection create 开始。
5. 只在上述步骤通过后，接入第一个真实写命令的 dry-run/execute 闭环。
