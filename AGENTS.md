# Agent Instructions

本项目处于 Zotero 本地写入 MCP bridge 的第一阶段。执行任何任务前先阅读：

- `docs/spec-zotero-local-write-mcp.md`
- `TaskDocs/Zotero本地写入MCP项目实施计划日志.md`
- `tests/integration/zoteroTestProfile.md`

## Hard Boundaries

- 不使用 Zotero Web API 写入。
- 不要求、保存或读取 `ZOTERO_API_KEY`。
- 不直接写 `zotero.sqlite`。
- 不支持 group library。
- 不向普通管理 MCP tool 暴露任意 JavaScript eval。
- 第一阶段不连接真实主库执行写操作。
- 本阶段允许受控 `item.trash`、`collection.trash`、`attachment.trash` 和 `duplicates.merge`；禁止永久 `eraseTx()`、清空 Zotero trash 或直接删除既有附件文件。
- 不把审计日志或 backup 写入 Zotero profile、Zotero data directory、Zotero linked attachment root 或附件目录。

## Test Profile

第一阶段唯一允许的真实 Zotero 写入目标是用户手动建立的 `ZoteroCodexBridgeTest`。

本项目下的测试目录：

- `ZoteroProfile/`: Zotero 测试 profile 目录。
- `ZoteroVault/`: linked attachment root。
- `ZoteroData/`: Zotero Data Directory。

这些目录是测试数据，不是项目源码，必须保持在 `.gitignore` 和 ESLint ignore 中。

写操作必须同时满足：

- `profileMode: "test"`
- `ZoteroProfile/.zotero-codex-bridge-test-profile` 存在
- dry-run 先返回 `planId` 和 `confirmationToken`
- execute 使用未过期且 input hash 匹配的 confirmation

## Development Workflow

- 使用 `rg` 或 `rg --files` 查找文本和文件。
- 手工编辑文件使用 `apply_patch`。
- 每个实现步骤同步更新 `TaskDocs/Zotero本地写入MCP项目实施计划日志.md`。
- 涉及边界变化时同步更新 `docs/spec-zotero-local-write-mcp.md`、`README.md` 和本文件。
- 当前目录不是 Git 仓库时，不要声称已提交。

## Verification

常规验证：

```powershell
npm run test
npm run build
npm run typecheck
npm run lint
npm run build:zotero-plugin
```

安全边界搜索应排除测试数据目录：

```powershell
rg "ZOTERO_API_KEY|api\.zotero\.org|zotero\.sqlite|sqlite write|任意 JS eval" src tests package.json README.md AGENTS.md docs TaskDocs -g '!node_modules/**' -g '!dist/**' -g '!ZoteroProfile/**' -g '!ZoteroVault/**' -g '!ZoteroData/**'
```

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **Zotero-codex-bridge** (2682 symbols, 4967 relationships, 218 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/Zotero-codex-bridge/context` | Codebase overview, check index freshness |
| `gitnexus://repo/Zotero-codex-bridge/clusters` | All functional areas |
| `gitnexus://repo/Zotero-codex-bridge/processes` | All execution flows |
| `gitnexus://repo/Zotero-codex-bridge/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
