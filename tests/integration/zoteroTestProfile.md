# Zotero Test Profile

本文件记录 `ZoteroCodexBridgeTest` 测试 profile 的验收前置条件。只有全部检查通过后，才允许执行任何真实 Zotero 写入。

## Profile

- Profile name: `ZoteroCodexBridgeTest`
- Required mode: `profileMode: "test"`
- Required marker file: `ZoteroProfile/.zotero-codex-bridge-test-profile`
- Profile directory: `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\ZoteroProfile`
- Linked attachment root directory: `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\ZoteroVault`
- Data Directory: `H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\ZoteroData`
- Library scope: local user library only
- Sync: disabled or not signed in
- Group libraries: not used

## Data Directory Check

在 Zotero 测试 profile 中打开：

```text
Edit -> Settings -> Advanced -> Files and Folders
```

已记录测试 profile 的文件夹设置：

```text
Linked Attachment Base Directory:
H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\ZoteroVault

Data Directory:
H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\ZoteroData
```

通过条件：

- `ZoteroProfile/.zotero-codex-bridge-test-profile` 存在。
- `npm run test` 会先执行 `npm run ensure:test-profile-marker`，如果 marker 缺失会自动创建。
- Data Directory 不等于真实 Zotero 主库目录。
- Data Directory 不在真实 Zotero profile 或真实附件 storage 目录内。
- Linked Attachment Base Directory 不等于真实附件根目录。
- `ZoteroProfile/`、`ZoteroVault/`、`ZoteroData/` 都是本项目下的测试数据目录，不属于项目源码。
- `ZoteroProfile/`、`ZoteroVault/`、`ZoteroData/` 必须被 `.gitignore` 和 ESLint ignore 排除。
- 审计日志仍写入本项目 `logs/audit/`。
- backup 仍写入本项目 `backups/zotero-operations/`。

## Seed Items

手工在测试 profile 中创建两个普通条目，用于验收 collection、tag、note、attachment 和 attachment move：

```text
Item A title: Zotero Codex Bridge Test Item A
Item B title: Zotero Codex Bridge Test Item B
```

验收时记录它们的 Zotero item key：

```text
Item A zoteroItemKey: 7N4QZKCM
Item B zoteroItemKey: K7P8J5XF
```

记录时间：2026-06-26 19:32:46

说明：上述 key 来自 `collection.getItems` 对 `Codex Bridge Acceptance` (`L6UP7MHT`) 的 runtime 读取结果。当前插件只返回 item key，不返回 title；本轮按用户创建 Item A、Item B 并放入 collection 后的返回顺序记录。后续实现 item 详情读取命令后可用 title 再次核验映射。

## Seed Attachments

运行时验收中已给 Item A 添加一个 copy 附件，随后移动到 Item B：

```text
Sample PDF attachmentKey: FQ8474SV
Current parent item: Item B (K7P8J5XF)
Original parent item: Item A (7N4QZKCM)
Source fixture: H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\fixtures\attachments\sample-paper.pdf
Stored file: H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\ZoteroData\storage\FQ8474SV\sample-paper.pdf
Attachment mode: copy
```

记录时间：2026-06-26 22:43:20

`0.1.20` runtime 验收后，附件标题和文件名已更新：

```text
Sample PDF attachmentKey: FQ8474SV
Current parent item: Item B (K7P8J5XF)
Current title: Codex Bridge Runtime PDF File Rename 0.1.20
Current filename: Zotero Codex Bridge Test Item B.pdf
Current stored file: H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\ZoteroData\storage\FQ8474SV\Zotero Codex Bridge Test Item B.pdf
```

记录时间：2026-06-26 23:39:03

`0.1.24` runtime 验收中为 `attachment.undoAdded` 单独添加并撤销了一个临时 copy 附件：

```text
Undo probe attachmentKey: BGHZTWLZ
Parent item before undo: Item A (7N4QZKCM)
Source temp file: H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\runtime\temp\undo-sample-0.1.24-1782491849285.pdf
Stored file before undo: H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\ZoteroData\storage\BGHZTWLZ\undo-sample-0.1.24-1782491849285.pdf
Current state: moved to Zotero trash by attachment.undoAdded; not permanently erased
Undo dry-run/execute planId: plan_mqv5miqg_6luitvz1hs5
```

记录时间：2026-06-27 00:37:31

`0.1.26` runtime 验收中用 `FQ8474SV` 验证了文件重命名前 backup snapshot：

```text
Sample PDF attachmentKey: FQ8474SV
Current parent item: Item B (K7P8J5XF)
Current filename after validation: Zotero Codex Bridge Test Item B.pdf

Manual rename probe title: Codex Bridge Backup Snapshot Probe 0.1.26
Manual rename intermediate filename: Codex Bridge Backup Snapshot Probe 0.1.26.pdf
Manual rename backup file: H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\backups\zotero-operations\files\2026-06-26\backup_mqv64zm5_tbuyy69wpl\Zotero Codex Bridge Test Item B.pdf
Manual rename backup manifest: H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\backups\zotero-operations\files\2026-06-26\backup_mqv64zm5_tbuyy69wpl\manifest.json

Zotero auto rename final filename: Zotero Codex Bridge Test Item B.pdf
Zotero auto rename backup file: H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\backups\zotero-operations\files\2026-06-26\backup_mqv64zwi_31azl716npb\Codex Bridge Backup Snapshot Probe 0.1.26.pdf
Zotero auto rename backup manifest: H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\backups\zotero-operations\files\2026-06-26\backup_mqv64zwi_31azl716npb\manifest.json
```

记录时间：2026-06-27 00:52:08

`0.1.28` runtime 验收中用 `backup_mqv64zm5_tbuyy69wpl` 验证了严格同路径 restore：

```text
Restore backupId: backup_mqv64zm5_tbuyy69wpl
Restored attachmentKey: FQ8474SV
Parent item: Item B (K7P8J5XF)
Target file path: H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\ZoteroData\storage\FQ8474SV\Zotero Codex Bridge Test Item B.pdf
Dry-run/execute planId: plan_mqv778zc_36cpcv1o0oz
Snapshot state after restore: backup file and manifest remain present
```

记录时间：2026-06-27 01:21:49

`0.1.29` runtime 验收中验证了 backup snapshot prune：

```text
Default-policy prune planId: plan_mqv7jnkw_zecqi5l4218
Default-policy prune deleteCount: 0

Temporary prune fixture backupId: backup_prune_probe_029
Temporary prune fixture path: H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\backups\zotero-operations\files\2000-01-01\backup_prune_probe_029
Temporary prune fixture delete planId: plan_mqv7nfcb_yoaob9uqr1m
Temporary prune fixture delete reason: time-limit
Temporary prune fixture state after execute: deleted

Retained snapshot: backup_mqv64zm5_tbuyy69wpl
Retained snapshot: backup_mqv64zwi_31azl716npb
```

记录时间：2026-06-27 01:34:27

`0.1.30` runtime 验收中用 `item.get` 核验了 Item A/Item B key 映射：

```text
Item A zoteroItemKey: 7N4QZKCM
Item A title: Zotero Codex Bridge Test Item A
Item A itemType: document
Item A noteKeys: GGQPGKYF

Item B zoteroItemKey: K7P8J5XF
Item B title: Zotero Codex Bridge Test Item B
Item B itemType: document
Item B attachmentKeys: FQ8474SV
```

记录时间：2026-06-27 11:53:50

`0.1.31` runtime 验收中验证了 `item.search`、`attachment.get` 和 linked attachment 写入/undo：

```text
item.search query: Zotero Codex Bridge Test Item
item.search collectionKey: L6UP7MHT
item.search itemType: document
item.search result titles: Zotero Codex Bridge Test Item A | Zotero Codex Bridge Test Item B

attachment.get attachmentKey: FQ8474SV
attachment.get parent: Item B (K7P8J5XF)
attachment.get attachmentMode: copy

Linked probe attachmentKey: EJENB9Q3
Linked probe parent before undo: Item A (7N4QZKCM)
Linked probe source file: H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\fixtures\attachments\sample-page.html
Linked probe attachmentMode: linked
Linked probe add dry-run/execute planId: plan_mqvubuvp_re44670dr1g
Linked probe undo dry-run/execute planId: plan_mqvubvq1_ng6knfvgtpq
Linked probe state after undo: moved to Zotero trash by attachment.undoAdded; Item A default attachment list no longer contains EJENB9Q3
```

记录时间：2026-06-27 12:10:00

## Stop Conditions

遇到以下情况立即停止，不执行写操作：

- 当前 profile 不是 `ZoteroCodexBridgeTest`。
- 插件报告 `profileMode` 不是 `test`。
- Zotero UI 中出现真实主库数据。
- dry-run 未返回 `planId` 或 `confirmationToken`。
- execute 请求绕过 dry-run。
- 审计或 backup 路径指向 Zotero profile、Zotero data directory 或附件目录。
