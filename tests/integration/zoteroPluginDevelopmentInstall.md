# Zotero Plugin Development Install

本文件记录 `ZoteroCodexBridgeTest` 中插件开发加载路径。依据 Zotero 官方插件开发文档的 “Setting Up a Plugin Development Environment” 小节，以及官方 sample `zotero/make-it-red` README。

官方来源：

- https://www.zotero.org/support/dev/client_coding/plugin_development#setting_up_a_plugin_development_environment
- `references/official/zotero/make-it-red/README.md`

## Current XPI Path

当前仓库 `dist\zotero-codex-bridge.xpi` 同时承载发布与测试产物，取决于构建脚本参数：

```text
H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\dist\zotero-codex-bridge.xpi
```

命令推荐：

```powershell
# 发布模式（默认）：不注入本地测试 token
npm run build:zotero-plugin      # = npm run build:zotero-plugin:release

# 本地测试模式：注入 runtime/auth/bridge-token
npm run build:zotero-plugin:test
npm run build:zotero-plugin:dev
```

## Development Source-Load Path

开发期可以让 Zotero 直接从源码目录加载插件，减少重复打包和拖入 XPI。

前置条件：

- Zotero 已关闭。
- 当前 profile 是 `ZoteroCodexBridgeTest`。
- Profile directory 是：

```text
H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\ZoteroProfile
```

建议的 source-load 目录是插件源码根目录，也就是包含 `manifest.json` 和 `bootstrap.js` 的目录：

```text
H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin
```

在测试 profile 的 `extensions` 目录下创建 extension proxy 文件：

```text
H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\ZoteroProfile\extensions\zotero-codex-bridge@example.com
```

文件内容为一行绝对路径：

```text
H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\src\zotero-plugin
```

第一次启用 source-load 时，按官方文档要求，打开：

```text
H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\ZoteroProfile\prefs.js
```

删除包含以下偏好名的行：

```text
extensions.lastAppBuildId
extensions.lastAppVersion
```

然后重新启动 Zotero。

## Debug Startup

开发调试时建议从命令行启动 Zotero，并指定测试 profile：

```powershell
& "A:\Program Files\Zotero\zotero.exe" -P "ZoteroCodexBridgeTest" -purgecaches -ZoteroDebugText -jsconsole
```

说明：

- `-P "ZoteroCodexBridgeTest"` 指定测试 profile。
- `-purgecaches` 强制 Zotero 重新读取缓存文件；官方文档说明 Zotero 7 后可能不再总是必要，但本项目调试 bootstrap/manifest 时保留该参数。
- `-ZoteroDebugText` 和 `-jsconsole` 用于查看插件启动和 endpoint 注册错误。

## Health Check

启动后运行：

```powershell
Invoke-WebRequest `
  -Uri http://127.0.0.1:23119/zotero-codex-bridge/health `
  -UserAgent "ZoteroCodexBridge/0.1.31" `
  -UseBasicParsing
```

预期返回：

```text
zotero-codex-bridge ok 0.1.31 zotero-codex-bridge@example.com test
```

## Command Endpoint Probe

未带 token 的 command 请求必须被拒绝：

```powershell
Invoke-WebRequest `
  -Uri http://127.0.0.1:23119/zotero-codex-bridge/command `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"name":"audit.list","requestId":"req_auth_test","input":{}}' `
  -UserAgent "ZoteroCodexBridge/0.1.31" `
  -SkipHttpErrorCheck `
  -UseBasicParsing
```

预期：`StatusCode` 为 `401`，响应 JSON 中 `error.code` 为 `COMMAND_AUTH_REQUIRED`。

错误 token 的 command 请求必须被拒绝：

```powershell
Invoke-WebRequest `
  -Uri http://127.0.0.1:23119/zotero-codex-bridge/command `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"x-zotero-codex-bridge-token"="wrong-token"} `
  -Body '{"name":"collection.getTree","requestId":"req_auth_invalid","input":{"libraryScope":"local-user"}}' `
  -UserAgent "ZoteroCodexBridge/0.1.31" `
  -SkipHttpErrorCheck `
  -UseBasicParsing
```

预期：`StatusCode` 为 `403`，响应 JSON 中 `error.code` 为 `COMMAND_AUTH_INVALID`。

带 token 的只读 collection tree 探针应返回 200：

```powershell
$token = (Get-Content "H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\runtime\auth\bridge-token" -Raw).Trim()

Invoke-WebRequest `
  -Uri http://127.0.0.1:23119/zotero-codex-bridge/command `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"x-zotero-codex-bridge-token"=$token} `
  -Body '{"name":"collection.getTree","requestId":"req_collection_tree","input":{"libraryScope":"local-user"}}' `
  -UserAgent "ZoteroCodexBridge/0.1.31" `
  -UseBasicParsing
```

预期：`StatusCode` 为 `200`，响应 JSON 中 `ok` 为 `true`，`commandName` 为 `collection.getTree`，`data.collections` 为数组。

`collection.create` 必须先 dry-run：

```powershell
$token = (Get-Content "H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\runtime\auth\bridge-token" -Raw).Trim()

$dryRun = Invoke-RestMethod `
  -Uri http://127.0.0.1:23119/zotero-codex-bridge/command `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"x-zotero-codex-bridge-token"=$token} `
  -Body '{"name":"collection.create","requestId":"req_collection_create_dry","input":{"libraryScope":"local-user","name":"Codex Bridge Acceptance 0.1.31"}}' `
  -UserAgent "ZoteroCodexBridge/0.1.31"

$dryRun.data.plan.planId
$dryRun.data.plan.confirmation.token
```

预期：返回 `ok: true`，`data.mode` 为 `dry-run`，并包含 `planId` 与 `confirmation.token`。

dry-run 后再 execute：

```powershell
$executeBody = @{
  name = "collection.create"
  requestId = "req_collection_create_execute"
  mode = "execute"
  input = @{
    libraryScope = "local-user"
    name = "Codex Bridge Acceptance 0.1.31"
  }
  confirmation = @{
    planId = $dryRun.data.plan.planId
    confirmationToken = $dryRun.data.plan.confirmation.token
  }
} | ConvertTo-Json -Depth 8 -Compress

$execute = Invoke-RestMethod `
  -Uri http://127.0.0.1:23119/zotero-codex-bridge/command `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"x-zotero-codex-bridge-token"=$token} `
  -Body $executeBody `
  -UserAgent "ZoteroCodexBridge/0.1.31"
```

预期：返回 `ok: true`，`data.collectionKey` 有值，并且 Zotero UI 可见 `Codex Bridge Acceptance 0.1.31`。

`collection.rename` 必须先 dry-run：

```powershell
$collectionKey = $execute.data.collectionKey

$renameDryRun = Invoke-RestMethod `
  -Uri http://127.0.0.1:23119/zotero-codex-bridge/command `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"x-zotero-codex-bridge-token"=$token} `
  -Body (@{
    name = "collection.rename"
    requestId = "req_collection_rename_dry"
    input = @{
      collectionKey = $collectionKey
      name = "Codex Bridge Acceptance 0.1.31 Renamed"
    }
  } | ConvertTo-Json -Depth 8 -Compress) `
  -UserAgent "ZoteroCodexBridge/0.1.31"

$renameExecuteBody = @{
  name = "collection.rename"
  requestId = "req_collection_rename_execute"
  mode = "execute"
  input = @{
    collectionKey = $collectionKey
    name = "Codex Bridge Acceptance 0.1.31 Renamed"
  }
  confirmation = @{
    planId = $renameDryRun.data.plan.planId
    confirmationToken = $renameDryRun.data.plan.confirmation.token
  }
} | ConvertTo-Json -Depth 8 -Compress

$execute = Invoke-RestMethod `
  -Uri http://127.0.0.1:23119/zotero-codex-bridge/command `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"x-zotero-codex-bridge-token"=$token} `
  -Body $renameExecuteBody `
  -UserAgent "ZoteroCodexBridge/0.1.31"
```

预期：返回 `ok: true`，Zotero UI 可见新名称。

`collection.move` 可将 collection 移动到顶层或指定 parent。以下命令将刚创建的 collection 移动到顶层：

```powershell
$moveDryRun = Invoke-RestMethod `
  -Uri http://127.0.0.1:23119/zotero-codex-bridge/command `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"x-zotero-codex-bridge-token"=$token} `
  -Body (@{
    name = "collection.move"
    requestId = "req_collection_move_dry"
    input = @{
      collectionKey = $collectionKey
    }
  } | ConvertTo-Json -Depth 8 -Compress) `
  -UserAgent "ZoteroCodexBridge/0.1.31"

$moveExecuteBody = @{
  name = "collection.move"
  requestId = "req_collection_move_execute"
  mode = "execute"
  input = @{
    collectionKey = $collectionKey
  }
  confirmation = @{
    planId = $moveDryRun.data.plan.planId
    confirmationToken = $moveDryRun.data.plan.confirmation.token
  }
} | ConvertTo-Json -Depth 8 -Compress

Invoke-RestMethod `
  -Uri http://127.0.0.1:23119/zotero-codex-bridge/command `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"x-zotero-codex-bridge-token"=$token} `
  -Body $moveExecuteBody `
  -UserAgent "ZoteroCodexBridge/0.1.31"
```

预期：返回 `ok: true`，`data.parentCollectionKey` 为空。

`collection.getItems` 可读取 collection 内 item：

```powershell
$items = Invoke-RestMethod `
  -Uri http://127.0.0.1:23119/zotero-codex-bridge/command `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"x-zotero-codex-bridge-token"=$token} `
  -Body (@{
    name = "collection.getItems"
    requestId = "req_collection_get_items"
    input = @{
      collectionKey = $collectionKey
    }
  } | ConvertTo-Json -Depth 8 -Compress) `
  -UserAgent "ZoteroCodexBridge/0.1.31"

$items.data.zoteroItemKeys
```

`item.get` 是只读命令，可按 item key 读取条目详情。用它核验 Item A/Item B 的 key 与 title 映射：

```powershell
$itemAKey = "7N4QZKCM"
$itemBKey = "K7P8J5XF"

$itemA = Invoke-RestMethod `
  -Uri http://127.0.0.1:23119/zotero-codex-bridge/command `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"x-zotero-codex-bridge-token"=$token} `
  -Body (@{
    name = "item.get"
    requestId = "req_item_get_a"
    input = @{
      zoteroItemKey = $itemAKey
    }
  } | ConvertTo-Json -Depth 8 -Compress) `
  -UserAgent "ZoteroCodexBridge/0.1.31"

$itemB = Invoke-RestMethod `
  -Uri http://127.0.0.1:23119/zotero-codex-bridge/command `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"x-zotero-codex-bridge-token"=$token} `
  -Body (@{
    name = "item.get"
    requestId = "req_item_get_b"
    input = @{
      zoteroItemKey = $itemBKey
    }
  } | ConvertTo-Json -Depth 8 -Compress) `
  -UserAgent "ZoteroCodexBridge/0.1.31"

$itemA.data | Select-Object zoteroItemKey,itemType,title,collectionKeys,attachmentKeys,noteKeys
$itemB.data | Select-Object zoteroItemKey,itemType,title,collectionKeys,attachmentKeys,noteKeys
```

预期：返回 `ok: true`，title 分别为 `Zotero Codex Bridge Test Item A` 和 `Zotero Codex Bridge Test Item B`。

`item.search` 是只读命令，可按 title/query、collection、itemType、tag 搜索本地 user library 顶层条目：

```powershell
$itemSearch = Invoke-RestMethod `
  -Uri http://127.0.0.1:23119/zotero-codex-bridge/command `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"x-zotero-codex-bridge-token"=$token} `
  -Body (@{
    name = "item.search"
    requestId = "req_item_search"
    input = @{
      query = "Zotero Codex Bridge Test Item"
      collectionKey = $collectionKey
      itemType = "document"
      limit = 10
    }
  } | ConvertTo-Json -Depth 8 -Compress) `
  -UserAgent "ZoteroCodexBridge/0.1.31"

$itemSearch.data.items | Select-Object zoteroItemKey,itemType,title,collectionKeys
```

预期：返回 `ok: true`，`data.items` 至少包含 Item A 和 Item B。

`collection.addItems` 必须先 dry-run。运行前先在 `tests/integration/zoteroTestProfile.md` 记录 Item A 的 `zoteroItemKey`：

```powershell
$itemAKey = "7N4QZKCM"

$addItemsDryRun = Invoke-RestMethod `
  -Uri http://127.0.0.1:23119/zotero-codex-bridge/command `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"x-zotero-codex-bridge-token"=$token} `
  -Body (@{
    name = "collection.addItems"
    requestId = "req_collection_add_items_dry"
    input = @{
      collectionKey = $collectionKey
      zoteroItemKeys = @($itemAKey)
    }
  } | ConvertTo-Json -Depth 8 -Compress) `
  -UserAgent "ZoteroCodexBridge/0.1.31"

$addItemsExecuteBody = @{
  name = "collection.addItems"
  requestId = "req_collection_add_items_execute"
  mode = "execute"
  input = @{
    collectionKey = $collectionKey
    zoteroItemKeys = @($itemAKey)
  }
  confirmation = @{
    planId = $addItemsDryRun.data.plan.planId
    confirmationToken = $addItemsDryRun.data.plan.confirmation.token
  }
} | ConvertTo-Json -Depth 8 -Compress

Invoke-RestMethod `
  -Uri http://127.0.0.1:23119/zotero-codex-bridge/command `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"x-zotero-codex-bridge-token"=$token} `
  -Body $addItemsExecuteBody `
  -UserAgent "ZoteroCodexBridge/0.1.31"
```

预期：返回 `ok: true`，`data.addedItemKeys` 包含 Item A key，随后 `collection.getItems` 能读到 Item A。

`collection.removeItems` 同样必须先 dry-run：

```powershell
$removeItemsDryRun = Invoke-RestMethod `
  -Uri http://127.0.0.1:23119/zotero-codex-bridge/command `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"x-zotero-codex-bridge-token"=$token} `
  -Body (@{
    name = "collection.removeItems"
    requestId = "req_collection_remove_items_dry"
    input = @{
      collectionKey = $collectionKey
      zoteroItemKeys = @($itemAKey)
    }
  } | ConvertTo-Json -Depth 8 -Compress) `
  -UserAgent "ZoteroCodexBridge/0.1.31"

$removeItemsExecuteBody = @{
  name = "collection.removeItems"
  requestId = "req_collection_remove_items_execute"
  mode = "execute"
  input = @{
    collectionKey = $collectionKey
    zoteroItemKeys = @($itemAKey)
  }
  confirmation = @{
    planId = $removeItemsDryRun.data.plan.planId
    confirmationToken = $removeItemsDryRun.data.plan.confirmation.token
  }
} | ConvertTo-Json -Depth 8 -Compress

Invoke-RestMethod `
  -Uri http://127.0.0.1:23119/zotero-codex-bridge/command `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"x-zotero-codex-bridge-token"=$token} `
  -Body $removeItemsExecuteBody `
  -UserAgent "ZoteroCodexBridge/0.1.31"
```

预期：返回 `ok: true`，`data.removedItemKeys` 包含 Item A key，Zotero UI 中 Item A 未被删除，只是不再属于该 collection。

`item.updateTags` 必须先 dry-run。以下命令给 Item A 添加测试 tag：

```powershell
$tagAddDryRun = Invoke-RestMethod `
  -Uri http://127.0.0.1:23119/zotero-codex-bridge/command `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"x-zotero-codex-bridge-token"=$token} `
  -Body (@{
    name = "item.updateTags"
    requestId = "req_item_update_tags_add_dry"
    input = @{
      zoteroItemKey = $itemAKey
      addTags = @("codex-bridge-test")
      removeTags = @()
    }
  } | ConvertTo-Json -Depth 8 -Compress) `
  -UserAgent "ZoteroCodexBridge/0.1.31"

$tagAddExecuteBody = @{
  name = "item.updateTags"
  requestId = "req_item_update_tags_add_execute"
  mode = "execute"
  input = @{
    zoteroItemKey = $itemAKey
    addTags = @("codex-bridge-test")
    removeTags = @()
  }
  confirmation = @{
    planId = $tagAddDryRun.data.plan.planId
    confirmationToken = $tagAddDryRun.data.plan.confirmation.token
  }
} | ConvertTo-Json -Depth 8 -Compress

Invoke-RestMethod `
  -Uri http://127.0.0.1:23119/zotero-codex-bridge/command `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"x-zotero-codex-bridge-token"=$token} `
  -Body $tagAddExecuteBody `
  -UserAgent "ZoteroCodexBridge/0.1.31"
```

预期：返回 `ok: true`，`data.addedTags` 包含 `codex-bridge-test`，Zotero UI 中 Item A 可见该 tag。

以下命令移除测试 tag：

```powershell
$tagRemoveDryRun = Invoke-RestMethod `
  -Uri http://127.0.0.1:23119/zotero-codex-bridge/command `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"x-zotero-codex-bridge-token"=$token} `
  -Body (@{
    name = "item.updateTags"
    requestId = "req_item_update_tags_remove_dry"
    input = @{
      zoteroItemKey = $itemAKey
      addTags = @()
      removeTags = @("codex-bridge-test")
    }
  } | ConvertTo-Json -Depth 8 -Compress) `
  -UserAgent "ZoteroCodexBridge/0.1.31"

$tagRemoveExecuteBody = @{
  name = "item.updateTags"
  requestId = "req_item_update_tags_remove_execute"
  mode = "execute"
  input = @{
    zoteroItemKey = $itemAKey
    addTags = @()
    removeTags = @("codex-bridge-test")
  }
  confirmation = @{
    planId = $tagRemoveDryRun.data.plan.planId
    confirmationToken = $tagRemoveDryRun.data.plan.confirmation.token
  }
} | ConvertTo-Json -Depth 8 -Compress

Invoke-RestMethod `
  -Uri http://127.0.0.1:23119/zotero-codex-bridge/command `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"x-zotero-codex-bridge-token"=$token} `
  -Body $tagRemoveExecuteBody `
  -UserAgent "ZoteroCodexBridge/0.1.31"
```

预期：返回 `ok: true`，`data.removedTags` 包含 `codex-bridge-test`，Zotero UI 中 Item A 不再显示该 tag。

`note.createChild` 必须先 dry-run。以下命令给 Item A 创建 child note：

```powershell
$noteDryRun = Invoke-RestMethod `
  -Uri http://127.0.0.1:23119/zotero-codex-bridge/command `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"x-zotero-codex-bridge-token"=$token} `
  -Body (@{
    name = "note.createChild"
    requestId = "req_note_create_child_dry"
    input = @{
      zoteroItemKey = $itemAKey
      content = "Codex bridge child note runtime test"
      contentFormat = "text"
    }
  } | ConvertTo-Json -Depth 8 -Compress) `
  -UserAgent "ZoteroCodexBridge/0.1.31"

$noteDryRun.data.plan.planId
$noteDryRun.data.plan.confirmation.token
$noteDryRun.data.after.noteHtmlPreview
```

预期：返回 `ok: true`，`data.mode` 为 `dry-run`，`data.after.parentZoteroItemKey` 等于 Item A key，`data.after.contentFormat` 为 `text`，并包含 HTML preview。

dry-run 后再 execute：

```powershell
$noteExecuteBody = @{
  name = "note.createChild"
  requestId = "req_note_create_child_execute"
  mode = "execute"
  input = @{
    zoteroItemKey = $itemAKey
    content = "Codex bridge child note runtime test"
    contentFormat = "text"
  }
  confirmation = @{
    planId = $noteDryRun.data.plan.planId
    confirmationToken = $noteDryRun.data.plan.confirmation.token
  }
} | ConvertTo-Json -Depth 8 -Compress

$noteExecute = Invoke-RestMethod `
  -Uri http://127.0.0.1:23119/zotero-codex-bridge/command `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"x-zotero-codex-bridge-token"=$token} `
  -Body $noteExecuteBody `
  -UserAgent "ZoteroCodexBridge/0.1.31"

$noteExecute.data.noteKey
```

预期：返回 `ok: true`，`data.noteKey` 有值，Zotero UI 中 Item A 下可见 child note。

`attachment.getForItem` 是只读命令，可读取 Item A 下的附件列表：

```powershell
$attachments = Invoke-RestMethod `
  -Uri http://127.0.0.1:23119/zotero-codex-bridge/command `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"x-zotero-codex-bridge-token"=$token} `
  -Body (@{
    name = "attachment.getForItem"
    requestId = "req_attachment_get_for_item"
    input = @{
      zoteroItemKey = $itemAKey
    }
  } | ConvertTo-Json -Depth 8 -Compress) `
  -UserAgent "ZoteroCodexBridge/0.1.31"

$attachments.data.attachments
```

预期：返回 `ok: true`，`data.zoteroItemKey` 等于 Item A key，`data.attachments` 是数组；如果 Item A 暂无附件则为空数组。

`attachment.get` 是只读命令，可按 attachment key 读取单个附件详情。当前测试附件为 `FQ8474SV`：

```powershell
$attachmentKey = "FQ8474SV"

$attachmentGet = Invoke-RestMethod `
  -Uri http://127.0.0.1:23119/zotero-codex-bridge/command `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"x-zotero-codex-bridge-token"=$token} `
  -Body (@{
    name = "attachment.get"
    requestId = "req_attachment_get"
    input = @{
      attachmentKey = $attachmentKey
    }
  } | ConvertTo-Json -Depth 8 -Compress) `
  -UserAgent "ZoteroCodexBridge/0.1.31"

$attachmentGet.data | Select-Object attachmentKey,parentZoteroItemKey,title,filename,contentType,attachmentMode,filePath
```

预期：返回 `ok: true`，`data.attachmentKey` 为 `FQ8474SV`，`data.parentZoteroItemKey` 为 Item B key。

`attachment.addFile` 必须先 dry-run。以下命令把 fixture PDF 以 copy 模式添加到 Item A：

```powershell
$samplePdfPath = "H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\fixtures\attachments\sample-paper.pdf"

$attachmentAddDryRun = Invoke-RestMethod `
  -Uri http://127.0.0.1:23119/zotero-codex-bridge/command `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"x-zotero-codex-bridge-token"=$token} `
  -Body (@{
    name = "attachment.addFile"
    requestId = "req_attachment_add_file_copy_dry"
    input = @{
      zoteroItemKey = $itemAKey
      filePath = $samplePdfPath
      attachmentMode = "copy"
    }
  } | ConvertTo-Json -Depth 8 -Compress) `
  -UserAgent "ZoteroCodexBridge/0.1.31"

$attachmentAddDryRun.data.plan.planId
$attachmentAddDryRun.data.plan.confirmation.token
$attachmentAddDryRun.data.after
```

预期：返回 `ok: true`，`data.mode` 为 `dry-run`，`data.after.action` 为 `add` 或重复时为 `skip`。

dry-run 后再 execute：

```powershell
$attachmentAddExecuteBody = @{
  name = "attachment.addFile"
  requestId = "req_attachment_add_file_copy_execute"
  mode = "execute"
  input = @{
    zoteroItemKey = $itemAKey
    filePath = $samplePdfPath
    attachmentMode = "copy"
  }
  confirmation = @{
    planId = $attachmentAddDryRun.data.plan.planId
    confirmationToken = $attachmentAddDryRun.data.plan.confirmation.token
  }
} | ConvertTo-Json -Depth 8 -Compress

$attachmentAddExecute = Invoke-RestMethod `
  -Uri http://127.0.0.1:23119/zotero-codex-bridge/command `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"x-zotero-codex-bridge-token"=$token} `
  -Body $attachmentAddExecuteBody `
  -UserAgent "ZoteroCodexBridge/0.1.31"

$attachmentAddExecute.data.attachmentKey
```

预期：首次执行返回 `ok: true`、`data.skipped: false`、`data.attachmentKey` 有值，随后 `attachment.getForItem` 能读到该附件；重复执行默认返回 skipped。

`attachment.moveToItem` 必须先 dry-run。以下命令将 sample PDF 附件从 Item A 移动到 Item B：

```powershell
$samplePdfAttachmentKey = "FQ8474SV"
$itemBKey = "K7P8J5XF"

$attachmentMoveDryRun = Invoke-RestMethod `
  -Uri http://127.0.0.1:23119/zotero-codex-bridge/command `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"x-zotero-codex-bridge-token"=$token} `
  -Body (@{
    name = "attachment.moveToItem"
    requestId = "req_attachment_move_to_item_dry"
    input = @{
      attachmentKey = $samplePdfAttachmentKey
      targetZoteroItemKey = $itemBKey
    }
  } | ConvertTo-Json -Depth 8 -Compress) `
  -UserAgent "ZoteroCodexBridge/0.1.31"

$attachmentMoveDryRun.data.before
$attachmentMoveDryRun.data.after
```

预期：返回 `ok: true`，`data.mode` 为 `dry-run`，`data.after.action` 为 `move` 或已经在目标下时为 `skip`。

dry-run 后再 execute：

```powershell
$attachmentMoveExecuteBody = @{
  name = "attachment.moveToItem"
  requestId = "req_attachment_move_to_item_execute"
  mode = "execute"
  input = @{
    attachmentKey = $samplePdfAttachmentKey
    targetZoteroItemKey = $itemBKey
  }
  confirmation = @{
    planId = $attachmentMoveDryRun.data.plan.planId
    confirmationToken = $attachmentMoveDryRun.data.plan.confirmation.token
  }
} | ConvertTo-Json -Depth 8 -Compress

$attachmentMoveExecute = Invoke-RestMethod `
  -Uri http://127.0.0.1:23119/zotero-codex-bridge/command `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"x-zotero-codex-bridge-token"=$token} `
  -Body $attachmentMoveExecuteBody `
  -UserAgent "ZoteroCodexBridge/0.1.31"

$attachmentMoveExecute.data
```

预期：返回 `ok: true`，`data.skipped` 为 `false`，随后 Item A 的 `attachment.getForItem` 不再包含该附件，Item B 的 `attachment.getForItem` 包含该附件。

`attachment.rename` 必须先 dry-run。以下命令只修改 sample PDF 的 Zotero attachment title，不同步文件名：

```powershell
$samplePdfAttachmentKey = "FQ8474SV"

$attachmentRenameDryRun = Invoke-RestMethod `
  -Uri http://127.0.0.1:23119/zotero-codex-bridge/command `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"x-zotero-codex-bridge-token"=$token} `
  -Body (@{
    name = "attachment.rename"
    requestId = "req_attachment_rename_dry"
    input = @{
      attachmentKey = $samplePdfAttachmentKey
      title = "Codex Bridge Runtime PDF"
      renameFile = $false
    }
  } | ConvertTo-Json -Depth 8 -Compress) `
  -UserAgent "ZoteroCodexBridge/0.1.31"

$attachmentRenameDryRun.data.before
$attachmentRenameDryRun.data.after
```

预期：返回 `ok: true`，`data.mode` 为 `dry-run`，`data.after.title` 为 `Codex Bridge Runtime PDF`，`data.after.action` 为 `rename` 或已相同时为 `skip`。

dry-run 后再 execute：

```powershell
$attachmentRenameExecuteBody = @{
  name = "attachment.rename"
  requestId = "req_attachment_rename_execute"
  mode = "execute"
  input = @{
    attachmentKey = $samplePdfAttachmentKey
    title = "Codex Bridge Runtime PDF"
    renameFile = $false
  }
  confirmation = @{
    planId = $attachmentRenameDryRun.data.plan.planId
    confirmationToken = $attachmentRenameDryRun.data.plan.confirmation.token
  }
} | ConvertTo-Json -Depth 8 -Compress

$attachmentRenameExecute = Invoke-RestMethod `
  -Uri http://127.0.0.1:23119/zotero-codex-bridge/command `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"x-zotero-codex-bridge-token"=$token} `
  -Body $attachmentRenameExecuteBody `
  -UserAgent "ZoteroCodexBridge/0.1.31"

$attachmentRenameExecute.data
```

预期：返回 `ok: true`，`data.title` 为 `Codex Bridge Runtime PDF`。随后用 Item B 的 `attachment.getForItem` 复核该 attachment 的 title。

继续测试 `renameFile: true`。这会同步 sample PDF 的文件名，使用 Zotero 内置 `renameAttachmentFile()`，不覆盖既有文件：

```powershell
$attachmentRenameFileDryRun = Invoke-RestMethod `
  -Uri http://127.0.0.1:23119/zotero-codex-bridge/command `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"x-zotero-codex-bridge-token"=$token} `
  -Body (@{
    name = "attachment.rename"
    requestId = "req_attachment_rename_file_dry"
    input = @{
      attachmentKey = $samplePdfAttachmentKey
      title = "Codex Bridge Runtime PDF File Rename"
      renameFile = $true
    }
  } | ConvertTo-Json -Depth 8 -Compress) `
  -UserAgent "ZoteroCodexBridge/0.1.31"

$attachmentRenameFileDryRun.data.before
$attachmentRenameFileDryRun.data.after

$attachmentRenameFileExecute = Invoke-RestMethod `
  -Uri http://127.0.0.1:23119/zotero-codex-bridge/command `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"x-zotero-codex-bridge-token"=$token} `
  -Body (@{
    name = "attachment.rename"
    requestId = "req_attachment_rename_file_execute"
    mode = "execute"
    input = @{
      attachmentKey = $samplePdfAttachmentKey
      title = "Codex Bridge Runtime PDF File Rename"
      renameFile = $true
    }
    confirmation = @{
      planId = $attachmentRenameFileDryRun.data.plan.planId
      confirmationToken = $attachmentRenameFileDryRun.data.plan.confirmation.token
    }
  } | ConvertTo-Json -Depth 8 -Compress) `
  -UserAgent "ZoteroCodexBridge/0.1.31"

$attachmentRenameFileExecute.data
$attachmentRenameFileExecute.data.backup
Test-Path $attachmentRenameFileExecute.data.backup.backupFilePath
Test-Path $attachmentRenameFileExecute.data.backup.manifestPath
```

预期：返回 `ok: true`；如果目标文件名与当前文件名不同，`data.backup.available` 为 `true`，`data.backup.backupFilePath` 和 `data.backup.manifestPath` 均存在，并位于本项目 `backups\zotero-operations\files\`。

读取 Zotero 附件自动重命名偏好：

```powershell
$renamePrefs = Invoke-RestMethod `
  -Uri http://127.0.0.1:23119/zotero-codex-bridge/command `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"x-zotero-codex-bridge-token"=$token} `
  -Body '{"name":"attachment.renamePreferences.get","requestId":"req_attachment_rename_prefs_get","input":{}}' `
  -UserAgent "ZoteroCodexBridge/0.1.31"

$renamePrefs.data
```

预期：返回 `autoRenameFiles`、`autoRenameLinkedFiles`、`autoRenameFileTypes`，如当前 library 有模板则返回 `attachmentRenameTemplate`。

修改自动重命名偏好必须先 dry-run，再 execute。下面的测试会启用普通文件自动重命名，禁用 linked file 自动重命名，并保留常见 PDF/HTML/图片类型：

```powershell
$renamePrefsSetInput = @{
  preferences = @{
    autoRenameFiles = $true
    autoRenameLinkedFiles = $false
    autoRenameFileTypes = "application/pdf,text/html,image/"
  }
}

$renamePrefsDryRun = Invoke-RestMethod `
  -Uri http://127.0.0.1:23119/zotero-codex-bridge/command `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"x-zotero-codex-bridge-token"=$token} `
  -Body (@{
    name = "attachment.renamePreferences.set"
    requestId = "req_attachment_rename_prefs_set_dry"
    input = $renamePrefsSetInput
  } | ConvertTo-Json -Depth 8 -Compress) `
  -UserAgent "ZoteroCodexBridge/0.1.31"

$renamePrefsDryRun.data.before
$renamePrefsDryRun.data.after

$renamePrefsExecute = Invoke-RestMethod `
  -Uri http://127.0.0.1:23119/zotero-codex-bridge/command `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"x-zotero-codex-bridge-token"=$token} `
  -Body (@{
    name = "attachment.renamePreferences.set"
    requestId = "req_attachment_rename_prefs_set_execute"
    mode = "execute"
    input = $renamePrefsSetInput
    confirmation = @{
      planId = $renamePrefsDryRun.data.plan.planId
      confirmationToken = $renamePrefsDryRun.data.plan.confirmation.token
    }
  } | ConvertTo-Json -Depth 8 -Compress) `
  -UserAgent "ZoteroCodexBridge/0.1.31"

$renamePrefsExecute.data
```

预期：返回 `oldPreferences` 和 `newPreferences`，并且 `newPreferences.autoRenameFiles` 为 `true`。

最后调用 Zotero 内置自动重命名。该命令完全遵循当前 Zotero 偏好；如果偏好或文件类型不允许，会返回 skip：

```powershell
$zoteroRenameDryRun = Invoke-RestMethod `
  -Uri http://127.0.0.1:23119/zotero-codex-bridge/command `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"x-zotero-codex-bridge-token"=$token} `
  -Body (@{
    name = "attachment.runZoteroRename"
    requestId = "req_attachment_run_zotero_rename_dry"
    input = @{
      attachmentKey = $samplePdfAttachmentKey
    }
  } | ConvertTo-Json -Depth 8 -Compress) `
  -UserAgent "ZoteroCodexBridge/0.1.31"

$zoteroRenameDryRun.data.before
$zoteroRenameDryRun.data.after

$zoteroRenameExecute = Invoke-RestMethod `
  -Uri http://127.0.0.1:23119/zotero-codex-bridge/command `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"x-zotero-codex-bridge-token"=$token} `
  -Body (@{
    name = "attachment.runZoteroRename"
    requestId = "req_attachment_run_zotero_rename_execute"
    mode = "execute"
    input = @{
      attachmentKey = $samplePdfAttachmentKey
    }
    confirmation = @{
      planId = $zoteroRenameDryRun.data.plan.planId
      confirmationToken = $zoteroRenameDryRun.data.plan.confirmation.token
    }
  } | ConvertTo-Json -Depth 8 -Compress) `
  -UserAgent "ZoteroCodexBridge/0.1.31"

$zoteroRenameExecute.data
$zoteroRenameExecute.data.backup
if ($zoteroRenameExecute.data.skipped -eq $false) {
  Test-Path $zoteroRenameExecute.data.backup.backupFilePath
  Test-Path $zoteroRenameExecute.data.backup.manifestPath
}
```

预期：返回 `ok: true`；若 Zotero 偏好允许且目标文件名不同，`data.skipped` 为 `false`，并返回 `backup.available = true`，backup 文件和 manifest 均存在；否则返回明确的 skip reason。

读取 backup 设置：

```powershell
$backupSettings = Invoke-RestMethod `
  -Uri http://127.0.0.1:23119/zotero-codex-bridge/command `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"x-zotero-codex-bridge-token"=$token} `
  -Body '{"name":"backup.settings.get","requestId":"req_backup_settings_get","input":{}}' `
  -UserAgent "ZoteroCodexBridge/0.1.31"

$backupSettings.data
```

预期：返回 `ok: true`，`data.policy.retentionDays` 默认为 `30`，`data.policy.maxLocalBytes` 默认为 `10737418240`，`data.filePath` 指向本项目 `backups\zotero-operations\settings.json`。

读取 backup snapshot 列表：

```powershell
$backupSnapshots = Invoke-RestMethod `
  -Uri http://127.0.0.1:23119/zotero-codex-bridge/command `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"x-zotero-codex-bridge-token"=$token} `
  -Body '{"name":"backup.snapshot.list","requestId":"req_backup_snapshot_list","input":{"limit":10}}' `
  -UserAgent "ZoteroCodexBridge/0.1.31"

$backupSnapshots.data.snapshotRoot
$backupSnapshots.data.snapshots | Select-Object -First 3
```

预期：返回 `ok: true`，`data.snapshotRoot` 指向本项目 `backups\zotero-operations\files`，`data.snapshots` 能列出最近 snapshot manifest；如果尚未执行文件重命名 snapshot，则数组为空。

恢复 backup snapshot 必须先 dry-run。第一版只允许恢复到同一个 attachment 当前文件路径；如果当前文件路径已和 manifest 的 `sourceFilePath` 不一致，会拒绝：

```powershell
$restoreBackupId = $backupSnapshots.data.snapshots |
  Where-Object { $_.commandName -eq "attachment.rename" } |
  Select-Object -First 1 -ExpandProperty backupId

$backupRestoreDryRun = Invoke-RestMethod `
  -Uri http://127.0.0.1:23119/zotero-codex-bridge/command `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"x-zotero-codex-bridge-token"=$token} `
  -Body (@{
    name = "backup.snapshot.restore"
    requestId = "req_backup_snapshot_restore_dry"
    input = @{ backupId = $restoreBackupId }
  } | ConvertTo-Json -Depth 8 -Compress) `
  -UserAgent "ZoteroCodexBridge/0.1.31"

$backupRestoreExecute = Invoke-RestMethod `
  -Uri http://127.0.0.1:23119/zotero-codex-bridge/command `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"x-zotero-codex-bridge-token"=$token} `
  -Body (@{
    name = "backup.snapshot.restore"
    requestId = "req_backup_snapshot_restore_execute"
    mode = "execute"
    input = @{ backupId = $restoreBackupId }
    confirmation = @{
      planId = $backupRestoreDryRun.data.plan.planId
      confirmationToken = $backupRestoreDryRun.data.plan.confirmation.token
    }
  } | ConvertTo-Json -Depth 8 -Compress) `
  -UserAgent "ZoteroCodexBridge/0.1.31"

$backupRestoreExecute.data
```

预期：路径匹配时返回 `ok: true`、`data.restored = true`，并保留 snapshot 文件；路径不匹配时返回 `BACKUP_RESTORE_TARGET_CHANGED`。

清理 backup snapshot 必须先 dry-run。默认策略下，刚生成的 snapshot 不应被删除：

```powershell
$backupPruneDryRun = Invoke-RestMethod `
  -Uri http://127.0.0.1:23119/zotero-codex-bridge/command `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"x-zotero-codex-bridge-token"=$token} `
  -Body '{"name":"backup.snapshot.prune","requestId":"req_backup_snapshot_prune_dry","input":{}}' `
  -UserAgent "ZoteroCodexBridge/0.1.31"

$backupPruneDryRun.data.after

$backupPruneExecute = Invoke-RestMethod `
  -Uri http://127.0.0.1:23119/zotero-codex-bridge/command `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"x-zotero-codex-bridge-token"=$token} `
  -Body (@{
    name = "backup.snapshot.prune"
    requestId = "req_backup_snapshot_prune_execute"
    mode = "execute"
    input = @{}
    confirmation = @{
      planId = $backupPruneDryRun.data.plan.planId
      confirmationToken = $backupPruneDryRun.data.plan.confirmation.token
    }
  } | ConvertTo-Json -Depth 8 -Compress) `
  -UserAgent "ZoteroCodexBridge/0.1.31"

$backupPruneExecute.data
```

预期：默认策略下最近 snapshot 的 `deleteCount` 为 `0`，execute 不删除现有 snapshot；如果策略产生删除计划，只允许删除本项目 `backups\zotero-operations\files\` 下的 snapshot 目录。

修改 backup 设置必须先 dry-run：

```powershell
$backupSettingsDryRun = Invoke-RestMethod `
  -Uri http://127.0.0.1:23119/zotero-codex-bridge/command `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"x-zotero-codex-bridge-token"=$token} `
  -Body (@{
    name = "backup.settings.set"
    requestId = "req_backup_settings_set_dry"
    input = @{
      policy = @{
        retentionDays = 30
        maxLocalBytes = 10737418240
        enableTimeLimit = $true
        enableSpaceLimit = $true
      }
    }
  } | ConvertTo-Json -Depth 8 -Compress) `
  -UserAgent "ZoteroCodexBridge/0.1.31"

$backupSettingsDryRun.data.before
$backupSettingsDryRun.data.after

$backupSettingsExecuteBody = @{
  name = "backup.settings.set"
  requestId = "req_backup_settings_set_execute"
  mode = "execute"
  input = @{
    policy = @{
      retentionDays = 30
      maxLocalBytes = 10737418240
      enableTimeLimit = $true
      enableSpaceLimit = $true
    }
  }
  confirmation = @{
    planId = $backupSettingsDryRun.data.plan.planId
    confirmationToken = $backupSettingsDryRun.data.plan.confirmation.token
  }
} | ConvertTo-Json -Depth 8 -Compress

$backupSettingsExecute = Invoke-RestMethod `
  -Uri http://127.0.0.1:23119/zotero-codex-bridge/command `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"x-zotero-codex-bridge-token"=$token} `
  -Body $backupSettingsExecuteBody `
  -UserAgent "ZoteroCodexBridge/0.1.31"

$backupSettingsExecute.data
```

预期：返回 `ok: true`，写入 `backups\zotero-operations\settings.json`，审计记录中 `backup.settings.set` 的 dry-run 和 executed 记录使用同一个 `planId`。

撤销本插件刚添加的附件必须先有 `attachment.addFile` executed 审计证据。建议为 undo 单独添加一个临时 fixture 附件，然后撤销该新附件：

```powershell
$undoFixturePath = "H:\ProgramDocument\MixLanguage\Zotero-codex-bridge\tests\fixtures\attachments\sample-paper.pdf"

$undoAddDryRun = Invoke-RestMethod `
  -Uri http://127.0.0.1:23119/zotero-codex-bridge/command `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"x-zotero-codex-bridge-token"=$token} `
  -Body (@{
    name = "attachment.addFile"
    requestId = "req_attachment_undo_seed_add_dry"
    input = @{
      zoteroItemKey = $itemAKey
      filePath = $undoFixturePath
      attachmentMode = "copy"
    }
  } | ConvertTo-Json -Depth 8 -Compress) `
  -UserAgent "ZoteroCodexBridge/0.1.31"

$undoAddExecuteBody = @{
  name = "attachment.addFile"
  requestId = "req_attachment_undo_seed_add_execute"
  mode = "execute"
  input = @{
    zoteroItemKey = $itemAKey
    filePath = $undoFixturePath
    attachmentMode = "copy"
  }
  confirmation = @{
    planId = $undoAddDryRun.data.plan.planId
    confirmationToken = $undoAddDryRun.data.plan.confirmation.token
  }
} | ConvertTo-Json -Depth 8 -Compress

$undoSeed = Invoke-RestMethod `
  -Uri http://127.0.0.1:23119/zotero-codex-bridge/command `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"x-zotero-codex-bridge-token"=$token} `
  -Body $undoAddExecuteBody `
  -UserAgent "ZoteroCodexBridge/0.1.31"

Start-Sleep -Milliseconds 1200
$undoAttachmentKey = $undoSeed.data.attachmentKey

$undoDryRun = Invoke-RestMethod `
  -Uri http://127.0.0.1:23119/zotero-codex-bridge/command `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"x-zotero-codex-bridge-token"=$token} `
  -Body (@{
    name = "attachment.undoAdded"
    requestId = "req_attachment_undo_added_dry"
    input = @{
      attachmentKey = $undoAttachmentKey
    }
  } | ConvertTo-Json -Depth 8 -Compress) `
  -UserAgent "ZoteroCodexBridge/0.1.31"

$undoExecuteBody = @{
  name = "attachment.undoAdded"
  requestId = "req_attachment_undo_added_execute"
  mode = "execute"
  input = @{
    attachmentKey = $undoAttachmentKey
  }
  confirmation = @{
    planId = $undoDryRun.data.plan.planId
    confirmationToken = $undoDryRun.data.plan.confirmation.token
  }
} | ConvertTo-Json -Depth 8 -Compress

$undoExecute = Invoke-RestMethod `
  -Uri http://127.0.0.1:23119/zotero-codex-bridge/command `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"x-zotero-codex-bridge-token"=$token} `
  -Body $undoExecuteBody `
  -UserAgent "ZoteroCodexBridge/0.1.31"

$undoDryRun.data.before
$undoExecute.data
```

预期：`attachment.undoAdded` dry-run 返回 `action: trash`；execute 返回 `trashed: true`、`erased: false`。该命令只把附件移入 Zotero trash，不清空 trash，不永久删除 storage 文件。

验证 `duplicates.find` 时应使用更接近 Zotero duplicate 判定的样本：两条 `journalArticle` 至少应具有相同 title、author、year 与相同 DOI。仅同题名但 DOI 不同的条目可能不会被 Zotero 识别为 duplicate set。

```powershell
$duplicatesFind = Invoke-RestMethod `
  -Uri http://127.0.0.1:23119/zotero-codex-bridge/command `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"x-zotero-codex-bridge-token"=$token} `
  -Body '{"name":"duplicates.find","requestId":"req_duplicates_find_same_doi","input":{"limit":50}}' `
  -UserAgent "ZoteroCodexBridge/0.1.43"

$duplicatesFind.data.setCount
$duplicatesFind.data.sets | Select-Object setId,zoteroItemKeys
```

预期：返回 `ok: true`，`data.setCount` 至少为 `1`，并且某个 `data.sets[*].zoteroItemKeys` 同时包含两条相同 DOI 测试 item。验收结束后必须用 `item.trash` 和 `collection.trash` 清理专项样本，避免正常库残留。

读取 direct HTTP 写命令审计记录：

```powershell
$auditList = Invoke-RestMethod `
  -Uri http://127.0.0.1:23119/zotero-codex-bridge/command `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"x-zotero-codex-bridge-token"=$token} `
  -Body '{"name":"audit.list","requestId":"req_audit_list","input":{"limit":10}}' `
  -UserAgent "ZoteroCodexBridge/0.1.31"

$auditList.data.filePath
$auditList.data.entries | Select-Object commandName,status,requestId,planId
```

预期：返回 `ok: true`，`data.filePath` 指向本项目 `logs\audit\YYYY-MM-DD.jsonl`，`entries` 包含最近 direct HTTP 写命令的 dry-run 或 executed 审计记录。

## Stop Conditions

遇到以下情况立即停止，不执行真实写命令：

- Zotero 当前 profile 不是 `ZoteroCodexBridgeTest`。
- Debug Output 未显示 `Zotero Codex Bridge: started`。
- health endpoint 未返回预期文本。
- command endpoint 鉴权尚未实现。
- `ZoteroProfile/`、`ZoteroVault/` 或 `ZoteroData/` 指向真实主库或真实附件目录。
