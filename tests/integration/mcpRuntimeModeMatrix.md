# MCP Runtime Mode Matrix

本文件记录 `scripts/mcpRuntimeModeMatrix.mjs` 的用途和运行边界。该脚本用于在 Zotero 插件内 HTTP MCP endpoint 上，对所有已暴露 MCP tools 做三种 Run mode 的运行时矩阵验收。

本轮只生成测试资产，不运行。

## 覆盖范围

脚本会先调用：

- `initialize`
- `tools/list`
- `zotero_safety_get_profile_status`

随后覆盖 `tools/list` 暴露出的全部当前接口：

- collection
- item
- search
- saved search
- citation
- import/export
- annotation
- note
- attachment
- backup
- audit
- safety
- duplicates

工具名按当前发布规范使用 snake_case，例如：

```text
collection.getTree -> zotero_collection_get_tree
savedSearch.create -> zotero_saved_search_create
attachment.addFile -> zotero_attachment_add_file
import.cslJson -> zotero_import_csl_json
```

脚本会额外检查：`tools/list` 中暴露的每个 tool 都必须有矩阵 case；矩阵 case 中的每个 tool 也必须真实存在于 `tools/list`。

## 三种运行模式

每次运行前，手动在 Zotero 中设置：

```text
Zotero Settings -> Zotero Local MCP Bridge -> Run mode
```

然后分别运行：

```powershell
npm run test:mcp-runtime-matrix -- --mode=readonly
npm run test:mcp-runtime-matrix -- --mode=askforapprove
npm run test:mcp-runtime-matrix -- --mode=yolo
```

脚本会读取 `safety.getProfileStatus` 并确认当前 `operationMode` 与传入 `--mode` 一致。如果不一致，立即失败，避免误测。

## 预期行为

### readonly

- Read tools：应正常返回 `ok: true`。
- Profile write tools：应返回 `ok: false` 且错误码为 `OPERATION_MODE_READONLY`。
- Safety state write tools 默认跳过。

### askforapprove

- Read tools：应正常返回 `ok: true`。
- Write tools：只执行 `mode: "dry-run"`，应返回：
  - `ok: true`
  - `data.mode = "dry-run"`
  - `data.plan.planId`
  - `data.plan.confirmation.token`
  - `data.plan.agentApproval.layer = "agent"`
  - `data.plan.agentApproval.required = true`
  - 普通高风险 case 还应返回 `data.plan.agentApproval.requiredText = "CONFIRM"`
- 不执行真实 `execute`。
- 本模式的确认提示发生在 Agent/MCP client 层；矩阵测试不期待 Zotero 弹出确认框。

### yolo

- Read tools：应正常返回 `ok: true`。
- Write tools：仍只执行 `mode: "dry-run"`，验证 dry-run 仍强制存在。
- Write tools 的 dry-run plan 应返回 `data.plan.agentApproval.layer = "agent"`、`required = false`、`mayAutoExecute = true`。
- 不执行真实 `execute`。

## 默认不会执行真实写入

脚本当前不会执行任何 `mode: "execute"`。

保留参数：

```powershell
--execute-low-risk
```

当前该参数会直接失败退出。后续如果要增加 execute + cleanup 验收，必须先单独设计可恢复策略，再启用该参数。

## Fixture 与环境变量

脚本默认使用 `tests/integration/zoteroTestProfile.md` 中已记录的测试 key，并会在运行时自动补全一部分 fixture：

- 从 `collection.getTree` 自动选择一个不同于 `ZLMB_COLLECTION_KEY` 的 collection，作为 `collection.move` dry-run 的 parent。
- 从 `savedSearch.list` 自动选择第一个 saved search，作为 `savedSearch.get` 和 `savedSearch.update` fixture。
- 从 `backup.snapshot.list` 自动选择第一个 snapshot，作为 `backup.snapshot.restore` fixture。

如果没有可用对象，对应 case 会在 `askforapprove` / `yolo` 下标记为 skipped。

```text
ZLMB_ITEM_A_KEY = 7N4QZKCM
ZLMB_ITEM_B_KEY = K7P8J5XF
ZLMB_COLLECTION_KEY = L6UP7MHT
ZLMB_IMPORT_COLLECTION_KEY = VZ3P3YEL
ZLMB_ATTACHMENT_KEY = FQ8474SV
ZLMB_ANNOTATION_KEY = W6RH6YKC
```

可选环境变量：

```text
ZLMB_SAVED_SEARCH_KEY
ZLMB_PARENT_COLLECTION_KEY
ZLMB_BACKUP_ID
ZLMB_UNDO_ATTACHMENT_KEY
ZLMB_TRASH_ATTACHMENT_KEYS
ZLMB_TRASH_ITEM_KEYS
ZLMB_TRASH_COLLECTION_KEY
ZLMB_DUPLICATE_MASTER_KEY
ZLMB_DUPLICATE_ITEM_KEYS
ZLMB_PDF_FIXTURE
ZLMB_HTML_FIXTURE
ZOTERO_LOCAL_MCP_BRIDGE_MCP_ENDPOINT
```

缺少可选 fixture 时：

- `readonly` 模式下，普通 profile write tool 仍可验证 readonly block，因为写权限检查早于具体参数校验。
- `askforapprove` / `yolo` 模式下，缺少 fixture 的 case 会标记为 skipped，避免用占位 key 生成误导性失败。

如希望缺少 fixture 也让脚本失败：

```powershell
npm run test:mcp-runtime-matrix -- --mode=askforapprove --fail-on-skipped
```

## JSON 输出

```powershell
npm run test:mcp-runtime-matrix -- --mode=readonly --json
```

该模式适合后续 CI 或日志归档。

## Stop Conditions

出现以下情况立即停止，不继续验收：

- Zotero 未启动或 MCP endpoint 不可达。
- 插件版本不是当前测试目标。
- `profileMode` 不是 `test`。
- `testProfileMarkerPresent` 不是 `true`。
- 当前 Run mode 与 `--mode` 不一致。
- `tools/list` 暴露了脚本未覆盖的新 tool。
- 任何 write tool 在 `askforapprove` / `yolo` 的 dry-run 中没有返回 `planId`、`confirmation.token` 和预期 `agentApproval` 策略。
