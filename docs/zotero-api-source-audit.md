# Zotero API Source Audit

更新时间：2026-06-26 23:05:00

本文件记录真实 Zotero 插件命令接入前使用的 Zotero 内部 API 依据。审计范围覆盖本项目第一批 collection read/create/rename/move、item membership、item metadata、item tag、BibTeX/RIS/CSL JSON 导入导出、child note、attachment read、attachment add file、attachment move、attachment rename、Zotero 内置附件自动重命名与附件重命名偏好设计。

## 适用边界

- 只操作 local user library。
- 不使用 Zotero Web API 写入。
- 不直接写 `zotero.sqlite`。
- 不支持 group library。
- 写命令必须在本项目 dry-run、confirmation、audit、backup/undo 链路完整后才允许接入运行时 endpoint。

## Source Snapshot

本次审计基于本机 Zotero 9.0.5 安装包中的源码快照：

- `references/official/zotero/zotero-9.0.5-client/xpcom/data/libraries.js`
- `references/official/zotero/zotero-9.0.5-client/xpcom/data/collections.js`
- `references/official/zotero/zotero-9.0.5-client/xpcom/data/collection.js`
- `references/official/zotero/zotero-9.0.5-client/xpcom/data/item.js`
- `references/official/zotero/zotero-9.0.5-client/xpcom/data/items.js`
- `references/official/zotero/zotero-9.0.5-client/xpcom/data/dataObject.js`
- `references/official/zotero/zotero-9.0.5-client/xpcom/attachments.js`
- `references/official/zotero/zotero-9.0.5-server/server_localAPI.js`
- `references/official/zotero/zotero-9.0.5-client/xpcom/server/server_localAPI.js`
- `ZoteroData/translators/BibTeX.js`
- `ZoteroData/translators/RIS.js`
- `ZoteroData/translators/CSL JSON.js`

## `collection.getTree`

计划使用：

```js
const collections = Zotero.Collections.getByLibrary(
  Zotero.Libraries.userLibraryID,
  true,
  false
);
```

源码依据：

- `libraries.js:28-33` 定义 `Zotero.Libraries.userLibraryID`，用于取得当前 user library 的 library id。
- `collections.js:71-72` 定义 `Zotero.Collections.getByLibrary(libraryID, recursive, includeTrashed)`。
- `collections.js:89-114` 的 `_getByContainer()` 在传入 `libraryID` 时筛选顶层 collection，并在 `recursive` 为 true 时递归返回子 collection。
- `server_localAPI.js:139` 在 local API 请求未指定 library 时默认使用 `Zotero.Libraries.userLibraryID`。
- `server_localAPI.js:525-533` 的 local API collection listing 同样使用 `Zotero.Collections.getByLibrary()` 或 `getByParent()` 读取 collections。

映射规则：

- `collectionKey` 取 `collection.key`。
- `name` 取 `collection.name`。
- `parentCollectionKey` 取 `collection.parentKey`，没有 parent 时省略。
- `deleted` collection 不包含在第一版结果中，对应 `includeTrashed=false`。

结论：

- `collection.getTree` 是只读命令，可以作为第一批 runtime 探针接入。
- 该路径固定使用 `Zotero.Libraries.userLibraryID`，不触碰 group library。
- 不需要 window context。

## `collection.create`

计划使用：

```js
const collection = new Zotero.Collection();
collection.libraryID = Zotero.Libraries.userLibraryID;
collection.name = input.name;
if (input.parentCollectionKey) {
  collection.parentKey = input.parentCollectionKey;
}
await collection.saveTx();
```

源码依据：

- `collection.js:26-34` 定义 `Zotero.Collection(params = {})`，并允许 `name`、`libraryID`、`parentID`、`parentKey` 赋值。
- `collection.js:76-80` 标记旧 `.parent` 属性已废弃，要求改用 `.parentID` 或 `.parentKey`。
- `collection.js:250-283` 的 `_initSave()` 会拒绝空名称、校验 parent collection 是否存在，并阻止把 collection 设置成自己或自己的后代。
- `collection.js:289-317` 的 `_saveData()` 通过 Zotero 自身保存流程插入或更新 `collections` 表。
- `collection.js:320-329` 在 parentKey 变更后更新 Zotero collection cache。
- `dataObject.js:1012-1015` 定义 `saveTx()`，它设置 `options.tx=true` 后调用 `save()`。
- `dataObject.js:1019-1022` 在未设置 libraryID 时默认使用 `Zotero.Libraries.userLibraryID`；本项目仍会显式设置 user library，避免歧义。

预校验规则：

- `input.libraryScope` 必须为 `"local-user"`。
- `input.name.trim()` 不能为空。
- 如果传入 `parentCollectionKey`，先使用 `Zotero.Collections.getByLibraryAndKey(Zotero.Libraries.userLibraryID, parentCollectionKey)` 预检查 parent 是否存在，再交给 Zotero `_initSave()` 做最终校验。

结论：

- `collection.create` 必须通过 Zotero 内部对象模型和 `saveTx()`，不能直接写 SQLite。
- 运行时接入前必须先完成 token 值校验、dry-run、confirmation、audit 和 backup/undo 链路。
- `0.1.9` 起测试包接入 `collection.create` 的 dry-run/execute 二阶段闭环；execute 必须带本机 token、未过期 `planId`、匹配 input hash 的 `confirmationToken`。

## `collection.rename`

计划使用：

```js
const collection = Zotero.Collections.getByLibraryAndKey(
  Zotero.Libraries.userLibraryID,
  input.collectionKey
);
collection.name = input.name;
await collection.saveTx();
```

源码依据：

- `collection.js:54-64` 定义 `libraryID`、`key`、`name` 等 collection 属性。
- `collection.js:250-283` 的 `_initSave()` 会复用 collection 保存前校验，包括名称不能为空。
- `collection.js:289-317` 的 `_saveData()` 对已有 collection 执行 update。
- `dataObject.js:1012-1015` 的 `saveTx()` 负责事务包装。
- `dataObjects.js:320-338` 提供 `getByLibraryAndKey()` / `getByLibraryAndKeyAsync()` 用于按 local user library 和 key 查找对象。

预校验规则：

- `collectionKey` 必须是非空字符串，并且必须在 `Zotero.Libraries.userLibraryID` 中存在。
- `name.trim()` 必须非空。
- dry-run 记录旧 name 和新 name；execute 前校验 input hash 和 confirmation。

结论：

- `collection.rename` 可以通过 Zotero 内部对象模型更新 `name` 并调用 `saveTx()`。
- 不需要直接写 SQLite，不需要 window context。

## `collection.move`

计划使用：

```js
const collection = Zotero.Collections.getByLibraryAndKey(
  Zotero.Libraries.userLibraryID,
  input.collectionKey
);
collection.parentKey = input.parentCollectionKey || false;
await collection.saveTx();
```

源码依据：

- `collection.js:76-80` 明确旧 `.parent` 属性已废弃，应使用 `.parentID` 或 `.parentKey`。
- `dataObject.js:285-310` 的 `parentKey` setter 会把空 parent 规范为 `false` 并标记字段变化。
- `collection.js:250-283` 的 `_initSave()` 会校验新 parent 是否存在，并阻止把 collection 移动到自身或后代下面。
- `collection.js:320-329` 会在 parentKey 变更后更新 collection cache。
- `dataObject.js:1012-1015` 的 `saveTx()` 负责事务包装。

预校验规则：

- `collectionKey` 必须在 local user library 中存在。
- `parentCollectionKey` 省略或为 `null` 时表示移动到顶层。
- `parentCollectionKey` 非空时必须在 local user library 中存在，且不能等于 `collectionKey`。
- dry-run 记录旧 parent 和新 parent；execute 前校验 input hash 和 confirmation。

结论：

- `collection.move` 可以通过 `parentKey` + `saveTx()` 实现顶层移动和 subcollection 移动。
- 更复杂的循环/后代校验最终交给 Zotero `_initSave()`，本项目只做前置友好错误。

## `collection.getItems` / `collection.addItems` / `collection.removeItems`

读取计划使用：

```js
const collection = Zotero.Collections.getByLibraryAndKey(
  Zotero.Libraries.userLibraryID,
  input.collectionKey
);
const items = collection.getChildItems(false, false);
```

写入计划使用：

```js
const item = Zotero.Items.getByLibraryAndKey(
  Zotero.Libraries.userLibraryID,
  input.zoteroItemKey
);
item.addToCollection(collection.id);
await item.saveTx({ skipDateModifiedUpdate: true });
```

移除计划使用：

```js
item.removeFromCollection(collection.id);
await item.saveTx({ skipDateModifiedUpdate: true });
```

源码依据：

- `collection.js:225-245` 定义 `Collection.prototype.getChildItems(asIDs, includeTrashed)`，可返回 collection 的 child item 对象或 id。
- `collection.js:407-427` 的 `Collection.prototype.addItems()` 内部通过 item 的 `addToCollection()` 后保存 item；本项目第一批 runtime 为了逐项返回成功 key，采用相同 item membership primitive。
- `collection.js:452-470` 的 `Collection.prototype.removeItems()` 明确移出 collection 不会删除 item，并通过 item 的 `removeFromCollection()` 保存 membership 变更。
- `item.js:4688-4707` 定义 `Item.prototype.addToCollection(collectionIDOrKey)`，但注释和实现要求后续保存 item。
- `item.js:4717-4736` 定义 `Item.prototype.removeFromCollection(collectionIDOrKey)`，同样要求后续保存 item。
- `item.js:4743-4745` 定义 `Item.prototype.inCollection(collectionID)`，用于 dry-run 计算当前 membership 和实际需要改变的 item keys。
- `items.js:860-874` 从 `collectionItems` 装载 item 的 `_collections` 数据，说明 membership 由 Zotero 对象层维护。

预校验规则：

- `collectionKey` 必须在 local user library 中存在。
- `zoteroItemKeys` 必须是非空数组，单次最多 50 个。
- 每个 `zoteroItemKey` 必须在 local user library 中存在。
- dry-run 的 confirmation input hash 只绑定用户输入语义：`collectionKey` 和规范化后的 `zoteroItemKeys`；`existingItemKeys`、`toChangeItemKeys` 等运行时状态只进入 before/after 和 resolved target，不进入 hash。
- execute 必须先验证 confirmation，再重复解析当前 Zotero 状态；已在目标 collection 内的 item 加入时跳过，已不在 collection 内的 item 移除时跳过。

结论：

- `collection.getItems` 是只读命令，可以直接返回 collection 当前 child item keys。
- `collection.addItems` 和 `collection.removeItems` 可以通过 Zotero item 对象层改变 collection membership，不直接写 SQLite，不删除 item。
- runtime 验收需要测试 profile 中先存在普通 Item A/Item B，并记录 Zotero item key。

## `item.updateTags`

添加计划使用：

```js
const item = Zotero.Items.getByLibraryAndKey(
  Zotero.Libraries.userLibraryID,
  input.zoteroItemKey
);
item.addTag(tagName);
await item.saveTx();
```

移除计划使用：

```js
item.removeTag(tagName);
await item.saveTx();
```

源码依据：

- `item.js:4434-4438` 定义 `Item.prototype.getTags()`，返回 item 当前 tags 的 API JSON 形式副本。
- `item.js:4447-4450` 定义 `Item.prototype.hasTag(tagName)`，用于 dry-run 计算当前 tag 状态和 execute 时跳过无变化操作。
- `item.js:4477-4514` 定义 `Item.prototype.setTags(tags)`，负责规范化 tags 并标记 tags 字段变化。
- `item.js:4518-4542` 定义 `Item.prototype.addTag(name, type)`，内部读取现有 tags，必要时追加 tag 并调用 `setTags()`；返回值表示是否发生变化。
- `item.js:4589-4598` 定义 `Item.prototype.removeTag(tagName)`，内部过滤 tag 并调用 `setTags()`；返回值表示是否发生变化。
- `item.js:4549` 和 `item.js:4584` 附近注释说明 tag 替换/移除后需要单独 `save()` 才会更新数据库；本项目使用 `saveTx()`。

预校验规则：

- `zoteroItemKey` 必须在 local user library 中存在。
- `addTags` 和 `removeTags` 必须是数组；省略时按空数组处理。
- tag 必须是非空字符串，trim 后去重。
- 单次 add/remove tag 总数最多 50。
- 同一 tag 不允许在一次请求中同时 add 和 remove。
- dry-run 的 confirmation input hash 只绑定 `zoteroItemKey`、规范化后的 `addTags` 和 `removeTags`；`currentTags`、`tagsToAdd`、`tagsToRemove` 是运行时状态，不进入 hash。

结论：

- `item.updateTags` 可以通过 Zotero item 对象层的 `addTag()`、`removeTag()` 和 `saveTx()` 实现，不直接写 SQLite。
- execute 添加已存在 tag 或移除不存在 tag 时跳过，返回实际 `addedTags` 和 `removedTags`。

## `export.bibtex` / `export.ris` / `export.cslJson`

导出计划使用：

```js
const translation = new Zotero.Translate.Export();
translation.setItems(items.slice());
translation.setTranslator(translatorID);
translation.setHandler("done", () => resolve(translation.string));
translation.setHandler("error", (_, error) => reject(error));
translation.translate();
```

源码依据：

- `server_localAPI.js:985-1009` 定义 local API 内部 `exportItems(itemOrItems, translatorID)`，使用 `new Zotero.Translate.Export()`、`setItems()`、`setTranslator()`、`setHandler("done")`、`setHandler("error")` 和 `translate()` 将 Zotero item 导出为字符串。
- `server_localAPI.js:996-997` 在导出前过滤 annotation item；本项目第一片导出命令遇到 annotation item 时返回明确错误，后续 annotation 专项步骤再处理 annotation 数据。
- `ZoteroData/translators/BibTeX.js:2-3` 声明 BibTeX translatorID `9cb70025-a888-4a29-a210-93ec52da40d4` 与 label `BibTeX`。
- `ZoteroData/translators/RIS.js:2-3` 声明 RIS translatorID `32d59d2d-b65a-4da4-b0a3-bdd3cfb979e7` 与 label `RIS`。
- `ZoteroData/translators/CSL JSON.js:2-3` 声明 CSL JSON translatorID `bc03b4fe-436d-4a1f-ba59-de4d2d7a63f7` 与 label `CSL JSON`。

预校验规则：

- `zoteroItemKeys` 必须是非空数组，单次最多 50 个。
- 每个 `zoteroItemKey` 必须在 local user library 中存在。
- 不接受 annotation item；PDF annotation 读取/写入将在后续步骤 11 单独设计。
- 导出命令是只读命令，不需要 dry-run 或 confirmation，不写 Zotero profile、不写文件。

结论：

- BibTeX/RIS/CSL JSON 导出可以直接复用 Zotero 内置 translator，不由本项目手写格式化器。
- 该路径不使用 Zotero Web API，不直接写 SQLite，不触碰 group library。

## `import.bibtex` / `import.ris` / `import.cslJson`

导入计划使用：

```js
const translation = new Zotero.Translate.Import();
translation.setString(content);
translation.setTranslator(translatorID);
const importedItems = await translation.translate({
  libraryID: Zotero.Libraries.userLibraryID,
  collections: collectionIDs.length ? collectionIDs : null,
  forceTagType: 1,
  saveOptions: {
    skipSelect: false
  }
});
```

源码依据：

- `references/official/zotero/zotero-9.0.5-server/server_connector.js:806-836` 定义 Connector import endpoint，使用 `new Zotero.Translate.Import()`、`setString()`、`setTranslator()` 和 `translate({ libraryID, collections, forceTagType, saveOptions })` 导入字符串内容。
- Zotero 9.0.5 插件运行态未暴露 `Zotero.loadTranslator`；因此本项目不采用 translator 内部常见的 `Zotero.loadTranslator("import")` 写法。
- `ZoteroData/translators/NewsBank.js`、`AMS MathSciNet.js`、`Clinical Key.js` 仍作为输入格式和 translatorID 可处理 BibTeX/RIS/CSL JSON 字符串的旁证，而非插件端 API 入口依据。
- BibTeX/RIS/CSL JSON translatorID 与导出小节相同，均来自本地 translator metadata。

预校验规则：

- `content` 必须是非空字符串。
- `collectionKeys` 和 `tags` 可选，省略时为空数组；合计最多 50 个目标对象。
- `collectionKeys` 必须指向 local user library 中存在的 collection。
- dry-run 不调用 Zotero translator，避免在预览阶段写库；BibTeX/RIS 使用轻量格式计数估算 item 数，CSL JSON 使用 `JSON.parse()` 校验并估算数组长度。
- execute 必须先通过 dry-run confirmation；导入结果作为新增 item 处理，第一片不做重复检测、merge 或更新已有 item。

结论：

- BibTeX/RIS/CSL JSON 导入可以复用 Zotero 内置 import translator，不由本项目手写解析器。
- 导入是 profile write 命令，必须走 test profile 或后续真实主库显式解锁；不使用 Zotero Web API，不直接写 SQLite。

## `annotation.list` / `annotation.create` / `annotation.update`

读取计划使用：

```js
const attachment = Zotero.Items.getByLibraryAndKey(Zotero.Libraries.userLibraryID, attachmentKey);
const annotations = attachment.getAnnotations(includeTrashed);
```

写入计划使用：

```js
const annotation = new Zotero.Item("annotation");
annotation.libraryID = Zotero.Libraries.userLibraryID;
annotation.parentKey = attachment.key;
annotation.annotationType = "highlight";
annotation.annotationText = text;
annotation.annotationColor = color;
annotation.annotationPageLabel = pageLabel;
annotation.annotationSortIndex = sortIndex;
annotation.annotationPosition = positionJson;
annotation.annotationIsExternal = false;
await annotation.saveTx();
```

源码依据：

- `references/official/zotero/zotero-9.0.5-client/xpcom/data/item.js:2000-2076` 定义 annotation 保存逻辑，要求 annotation item 必须有父 item，父 item 必须是 file attachment，并且必须是 Zotero reader 可读取的 PDF、EPUB 或 HTML snapshot。
- `item.js:4195-4320` 定义 annotation 属性 setter：`annotationType`、`annotationText`、`annotationComment`、`annotationColor`、`annotationPageLabel`、`annotationSortIndex`、`annotationPosition`、`annotationIsExternal`。
- `item.js:4257-4277` 对 PDF `annotationSortIndex` 使用 `00000|000000|00000` 格式校验。
- `item.js:4326-4405` 定义 `isAnnotation()`、`numAnnotations()` 和 `getAnnotations(includeTrashed, asIDs)`。
- `item.js:5798-5809` 在 `toJSON()` 中输出 annotation 字段。

预校验规则：

- 第一片只支持 PDF attachment，不支持 EPUB/HTML annotation 写入。
- 第一片只支持 `highlight`、`underline`、`note`、`text`；暂不写入 `image` 或 `ink` annotation，因为它们涉及 cache image / ink path 数据。
- `annotation.create` 和 `annotation.update` 均为 profile write 命令，必须 dry-run + confirmation。
- `annotationPosition` 接受 JSON 字符串或 JSON 对象，但必须能被 `JSON.parse()` 解析；本项目不在第一片自动推导 PDF 坐标。
- 第一片不实现 annotation 删除，继续遵守第一版不删除 Zotero 对象的边界。

结论：

- PDF annotation 读取与基本写入可以通过 Zotero item 对象层实现，不直接写 SQLite。
- annotation 写入仍需 runtime 验证 PDF reader 可见性；如果 Zotero reader 对 position JSON 有更严格格式要求，应以 runtime 失败证据修订输入契约。

## `search.advanced` / `savedSearch.*` / `citation.format`

高级搜索计划使用：

```js
const search = new Zotero.Search();
search.libraryID = Zotero.Libraries.userLibraryID;
search.addCondition("noChildren", "true");
search.addCondition(condition, operator, value);
const ids = await search.search();
```

保存搜索计划使用：

```js
const search = new Zotero.Search();
search.libraryID = Zotero.Libraries.userLibraryID;
search.name = name;
search.addCondition(condition, operator, value);
await search.saveTx();
```

引用输出计划使用：

```js
const style = Zotero.Styles.get(styleIDOrURL);
const cslEngine = style.getCiteProc(locale, "html", { cache: true });
const html = Zotero.Cite.makeFormattedBibliographyOrCitationList(cslEngine, items, "html", asCitationList);
```

源码依据：

- `references/official/zotero/zotero-9.0.5-client/xpcom/server/server_localAPI.js:593-665` 使用 `new Zotero.Search()`、`libraryID`、`addCondition()`、`setScope()` 和 `search.search()` 处理 local API items/search 查询。
- `server_localAPI.js:1015-1055` 定义 local API search syntax 的条件构建和调试 JSON 输出。
- `server_localAPI.js:835-855` 使用 `Zotero.Searches.getAll(libraryID)` 和 `Zotero.Searches.getByLibraryAndKey(libraryID, searchKey)` 读取保存搜索。
- `server_localAPI.js:944-983` 定义 `citeprocToHTML()`，通过 `Zotero.Styles.get()`、`style.getCiteProc()` 和 `Zotero.Cite.makeFormattedBibliographyOrCitationList()` 输出 bibliography/citation HTML。

预校验规则：

- `search.advanced` 第一片接受 Zotero Search 条件三元组 `{ condition, operator, value }`，不尝试重新定义一套搜索 DSL。
- `savedSearch.create` / `savedSearch.update` 是 profile write 命令，必须 dry-run + confirmation。
- `citation.format` 只处理 regular item；attachment、note、annotation 不生成引用输出。
- `citation.format` 第一片只使用本地已安装 CSL style，不在命令中自动联网安装 style。

结论：

- 高级搜索、保存搜索和引用输出均可复用 Zotero 内部对象层和 citeproc，不使用 Zotero Web API，不直接写 SQLite。

## `note.createChild`

创建计划使用：

```js
const parentItem = Zotero.Items.getByLibraryAndKey(
  Zotero.Libraries.userLibraryID,
  input.zoteroItemKey
);
const note = new Zotero.Item("note");
note.libraryID = Zotero.Libraries.userLibraryID;
note.parentKey = parentItem.key;
note.setNote(noteHtml);
await note.saveTx();
```

源码依据：

- `item.js:2201-2203` 定义 `Item.prototype.isRegularItem()`，用于确认 child note parent 是普通 Zotero item。
- `item.js:2257-2259` 定义 `Item.prototype.isNote()`，说明 note 是 Zotero item 对象模型中的一种 item。
- `item.js:2297-2306` 定义 `Item.prototype.getNoteTitle()`，说明 note 内容由 Zotero item note 字段生成标题。
- `item.js:2341-2351` 定义 `Item.prototype.getNote()`，读取 note 字段内容。
- `item.js:2364-2374` 定义 `Item.prototype.setNote(text)`，设置 note 内容并标记字段变化。
- `item.js:2409-2418` 定义 `Item.prototype.getNotes()`，从 regular item 读取 child note ids。
- `item.js:1603-1635` 的保存前校验会要求 parent item 存在，且 note/attachment 的 parent 不能是非 regular item。
- `item.js:1902-1915` 的保存流程会维护 `itemNotes` parent 关系并刷新 parent item。
- `dataObject.js:298-310` 定义 `parentKey` setter，会把 parent key 解析为 parent id 并标记字段变化。
- `dataObject.js:1012-1015` 定义 `saveTx()`，用于事务化保存 Zotero data object。

预校验规则：

- `zoteroItemKey` 必须在 local user library 中存在。
- parent item 必须是 `isRegularItem()`。
- `content` 必须是非空字符串。
- `contentFormat` 允许 `"text"`、`"html"` 或 `"rich-text"`；省略时按 `"text"` 处理。
- `"text"` 会转成转义后的段落 HTML：换行切分为多个 `<p>`；`"html"` 和 `"rich-text"` 直接交给 Zotero `setNote()`。
- dry-run 的 confirmation input hash 只绑定 `zoteroItemKey`、原始 `content` 和 `contentFormat`；`noteHtml` 与 `noteHtmlPreview` 属于运行时派生字段，不进入 hash。

结论：

- `note.createChild` 可以通过 `new Zotero.Item("note")`、`parentKey`、`setNote()` 和 `saveTx()` 实现，不直接写 SQLite。
- 第一版只创建 regular item 下的 child note，不支持独立 note、annotation note 或 group library note。

## `attachment.getForItem`

读取计划使用：

```js
const parentItem = Zotero.Items.getByLibraryAndKey(
  Zotero.Libraries.userLibraryID,
  input.zoteroItemKey
);
const attachmentIDs = parentItem.getAttachments(false);
const attachment = Zotero.Items.get(attachmentID);
const filePath = await attachment.getFilePathAsync();
```

源码依据：

- `attachments.js:26-34` 定义 `Zotero.Attachments` 和附件 link mode 常量，包括 imported file、linked file、imported URL、linked URL 和 embedded image。
- `item.js:2460-2462` 定义 `Item.prototype.isAttachment()`。
- `item.js:2467-2478` 定义 `Item.prototype.isImportedAttachment()`。
- `item.js:2507-2512` 定义 `Item.prototype.isFileAttachment()`。
- `item.js:2517-2519` 定义 `Item.prototype.isLinkedFileAttachment()`。
- `item.js:2734-2765` 定义 `Item.prototype.getFilePathAsync()`，用于解析附件真实文件路径。
- `item.js:3325-3358` 定义 `attachmentFilename` getter/setter，其中 getter 可读取 imported 或 linked file 的文件名。
- `item.js:3368-3432` 定义 `attachmentPath` getter/setter，并说明 linked file 在 user library 中可使用 base directory relative path。
- `item.js:3969-4000` 定义 `Item.prototype.getAttachments(includeTrashed)`，返回 parent item 的 child attachment item ids，并可排除 trashed attachments。
- `item.js:4140-4173` 定义 `setAutoAttachmentTitle()`，说明 attachment title 与 filename/content type 的关系；本步骤只读 title，不修改。

预校验规则：

- `zoteroItemKey` 必须在 local user library 中存在。
- parent item 必须是 `isRegularItem()`；不在 attachment item 上调用 `getAttachments()`。
- 读取时传入 `includeTrashed=false`，不返回已删除附件。
- 每个 attachment 返回 `attachmentKey`、title、filename、contentType、linkMode、attachmentMode 和可解析 file path；`getFilePathAsync()` 失败或文件不存在时省略 file path。

结论：

- `attachment.getForItem` 是只读命令，可以通过 Zotero item 对象层的 `getAttachments(false)`、`Zotero.Items.get()` 和 `getFilePathAsync()` 实现。
- 本步骤不创建、移动、重命名或删除附件，不需要 dry-run 或 confirmation。
- `attachments.js` 中的 `importFromFile()`、`linkFromFile()`、`shouldAutoRenameFile()` 和重命名偏好源码已下载到本地，供后续附件写入步骤单独审计。

## `attachment.addFile`

复制附件计划使用：

```js
const attachment = await Zotero.Attachments.importFromFile({
  file: input.filePath,
  parentItemID: parentItem.id
});
```

linked file 附件计划使用：

```js
const attachment = await Zotero.Attachments.linkFromFile({
  file: input.filePath,
  parentItemID: parentItem.id
});
```

源码依据：

- `attachments.js:45-58` 定义 `importFromFile(options)` 的入参和返回值。
- `attachments.js:90-115` 中 `importFromFile()` 创建 `new Zotero.Item('attachment')`、设置 parent item、设置 imported file link mode，并创建 Zotero storage 目录。
- `attachments.js:120-125` 中 `importFromFile()` 将源文件 copy/move 到 storage 唯一路径。
- `attachments.js:175-182` 定义 `linkFromFile(options)` 的入参和返回值。
- `attachments.js:197-206` 中 `linkFromFile()` 使用 `LINK_MODE_LINKED_FILE` 加入附件数据库记录。
- `item.js:3368-3432` 的 `attachmentPath` setter 说明 linked file 仅允许 user library，并会按 base directory 偏好保存相对路径。
- `attachments.js:2776-2799` 定义 `getBaseDirectoryRelativePath()`。
- `attachments.js:2808-2825` 定义 `resolveRelativePath()`。

预校验规则：

- `zoteroItemKey` 必须在 local user library 中存在，且 parent item 必须是 regular item。
- `filePath` 必须是非空字符串，且文件必须存在。
- `attachmentMode` 默认为 `"copy"`，可显式传入 `"linked"`。
- 第一版允许扩展名：PDF、DOC、DOCX、CSV、XLS、XLSX、常见图片、HTML/HTM。
- dry-run 对 linked file 返回路径失效风险 warning。
- dry-run 检查 parent 下同名附件；linked file 额外检查已解析绝对路径重复。重复时 execute 默认 skip，不执行 replace。
- dry-run 的 confirmation input hash 只绑定 `zoteroItemKey`、规范化 `filePath`、`filename` 和 `attachmentMode`；重复附件 key 属于运行时状态，不进入 hash。

结论：

- `attachment.addFile` 可以通过 Zotero 官方附件对象 API `importFromFile()` 和 `linkFromFile()` 实现，不直接写 SQLite。
- 第一阶段仅执行新增附件；重复时 skip，不替换既有附件，不删除文件。

## `attachment.moveToItem`

移动计划使用：

```js
const attachment = Zotero.Items.getByLibraryAndKey(
  Zotero.Libraries.userLibraryID,
  input.attachmentKey
);
attachment.parentKey = targetItem.key;
await attachment.saveTx();
```

源码依据：

- `item.js:2460-2462` 定义 `Item.prototype.isAttachment()`，用于确认目标 key 指向 attachment item。
- `dataObject.js:94-100` 定义 `parentKey` 属性。
- `dataObject.js:298-310` 的 `parentKey` setter 会设置 parent key 并标记字段变化。
- `item.js:1603-1635` 的保存前校验要求 attachment 的 parent item 存在且类型合法。
- `item.js:1864-1878` 的保存逻辑处理已有 attachment parentKey 变更。
- `item.js:1982-1983` 在 attachment data 变更后清理 parent item 的 cached child attachments。
- `dataObject.js:1012-1015` 定义 `saveTx()`。

预校验规则：

- `attachmentKey` 必须指向 local user library 中的 attachment。
- `targetZoteroItemKey` 必须指向 local user library 中的 regular item。
- 第一版只移动已有 child attachment；独立 attachment 不在本步骤处理。
- dry-run 记录旧 parent item key 和新 parent item key。
- execute 时如果 attachment 已经在目标 parent 下，则 skip。

结论：

- `attachment.moveToItem` 可以通过 attachment item 对象层的 `parentKey` + `saveTx()` 实现，不直接写 SQLite。
- 该操作不删除附件文件，不新建附件文件，只改变 Zotero parent item 关系。

## `attachment.rename`

标题重命名计划使用：

```js
attachment.setField("title", input.title);
await attachment.saveTx();
```

可选文件名同步计划使用：

```js
await attachment.renameAttachmentFile(targetFilename, {
  overwrite: false,
  unique: true,
  updateTitle: false,
  out
});
```

源码依据：

- `item.js:2949-3009` 定义 `Zotero.Item.prototype.renameAttachmentFile(newName, options)`，内部通过 `getFilePathAsync()` 找到现有文件，调用 `Zotero.File.rename()`，再通过 `relinkAttachmentFile(destPath)` 更新 attachment 文件路径。
- `item.js:3017-3109` 定义 `relinkAttachmentFile(path, skipItemUpdate)`，根据 stored/linked attachment 模式更新 `attachmentPath` 并调用 `saveTx()`，同时触发 attachment 状态刷新。
- `item.js:3325-3358` 定义 `attachmentFilename` getter/setter；getter 可用于 stored 和 linked file，setter 只允许 stored file，因此本项目不直接设置该属性来重命名 linked file。
- `item.js:4140-4173` 定义 `setAutoAttachmentTitle()`，说明 Zotero 内部标题与 filename 可以分离处理；本项目的人工标题重命名不调用自动标题逻辑。

预校验规则：

- `attachmentKey` 必须指向 local user library 中的 attachment。
- `title` 必须是非空字符串。
- 默认只修改 attachment title。
- `renameFile: true` 时 attachment 必须是 file attachment，并且 `getFilePathAsync()` 能返回现有文件路径。
- 文件名同步使用当前 filename 的扩展名，并使用 `Zotero.File.getValidFileName()` 过滤标题生成文件名。
- 文件名同步使用 `overwrite: false` 与 `unique: true`，不替换既有文件。

结论：

- `attachment.rename` 可以通过 attachment item 对象层 `setField("title")` + `saveTx()` 实现标题重命名。
- 文件名同步可以调用 Zotero 内置 `renameAttachmentFile()`，避免本项目直接移动文件或直接改写 SQLite。

## `attachment.runZoteroRename`

自动重命名计划使用：

```js
const allowed = Zotero.Attachments.shouldAutoRenameAttachment(attachment);
const baseName = Zotero.Attachments.getFileBaseNameFromItem(parentItem, {
  attachmentTitle
});
await attachment.renameAttachmentFile(targetFilename, {
  overwrite: false,
  unique: true,
  updateTitle: false,
  out
});
```

源码依据：

- `attachments.js:2287-2303` 定义 `getFileBaseNameFromItem()`，会读取 local user library 的 `attachmentRenameTemplate` synced setting，并基于 parent item metadata 生成附件文件名基名。
- `attachments.js:2593-2607` 定义 `isAutoRenameFilesEnabledForLibrary()`，user library 场景使用 `Zotero.Prefs.get('autoRenameFiles')` 判断自动重命名是否启用。
- `attachments.js:2609-2622` 定义 `shouldAutoRenameFile()`，会对 linked file 额外读取 `Zotero.Prefs.get('autoRenameFiles.linked')`。
- `attachments.js:2632-2652` 定义 `isRenameAllowedForType()`，使用 `Zotero.Prefs.get('autoRenameFiles.fileTypes')` 约束自动重命名适用的 content type。
- `attachments.js:2675-2680` 定义 `shouldAutoRenameAttachment()`，将 attachment library、link mode、filename、content type 等条件合并成最终是否允许自动重命名的判断。
- `item.js:2949-3009` 的 `renameAttachmentFile()` 负责实际文件名变更并更新 attachment 路径。

预校验规则：

- `attachmentKey` 必须指向 local user library 中的 file attachment。
- attachment 必须有 regular parent item；自动命名基于 parent item metadata。
- dry-run 返回当前 filename、目标 filename、当前 Zotero 重命名偏好快照和 action。
- execute 前必须验证 dry-run confirmation；偏好不允许或目标文件名未变化时返回 skip。
- 实际文件重命名仍调用 `renameAttachmentFile()`，使用 `overwrite: false` 与 `unique: true`。

结论：

- `attachment.runZoteroRename` 可以复用 Zotero 内置自动命名判断和文件重命名 primitive。
- 本项目只负责 dry-run、confirmation、审计和结果包装，不直接移动文件、不直接写 SQLite、不在单次命令中覆盖临时模板。

## `attachment.renamePreferences.get/set`

读取计划使用：

```js
Zotero.Prefs.get("autoRenameFiles");
Zotero.Prefs.get("autoRenameFiles.linked");
Zotero.Prefs.get("autoRenameFiles.fileTypes");
Zotero.SyncedSettings.get(Zotero.Libraries.userLibraryID, "attachmentRenameTemplate");
```

写入计划使用：

```js
Zotero.Prefs.set("autoRenameFiles", value);
Zotero.Prefs.set("autoRenameFiles.linked", value);
Zotero.Prefs.set("autoRenameFiles.fileTypes", value);
await Zotero.SyncedSettings.set(
  Zotero.Libraries.userLibraryID,
  "attachmentRenameTemplate",
  value
);
```

源码依据：

- `attachments.js:2287-2303` 的 `getFileBaseNameFromItem()` 读取 `attachmentRenameTemplate` synced setting，说明模板是 Zotero 内置自动重命名路径的输入。
- `attachments.js:2593-2652` 明确 `autoRenameFiles`、`autoRenameFiles.linked`、`autoRenameFiles.fileTypes` 三个偏好共同决定自动重命名是否适用。
- `item.js:3682` 和 `item.js:3704` 附近的 item 代码调用 `Zotero.SyncedSettings.set(...)` 保存 library scoped synced setting，说明该 API 是 Zotero 内部用于写入 synced setting 的路径。

预校验规则：

- `attachment.renamePreferences.get` 是只读命令，不需要 dry-run 或 confirmation。
- `attachment.renamePreferences.set` 是写操作，必须 dry-run + confirmation。
- 支持字段为 `autoRenameFiles`、`autoRenameLinkedFiles`、`autoRenameFileTypes`、`attachmentRenameTemplate`。
- boolean 字段必须为 boolean；字符串字段必须非空并 trim。
- dry-run 返回旧偏好和新偏好；execute 返回实际写入后的偏好。

结论：

- 附件重命名偏好可以通过 Zotero 内部偏好与 synced setting API 受控读写。
- 该能力会影响后续 Zotero 自动重命名行为，因此必须保留 dry-run、confirmation 和审计记录。

## `attachment.undoAdded`

撤销计划使用：

```js
await Zotero.Items.trashTx([attachment.id]);
```

源码依据：

- `items.js:983-1055` 定义 `Zotero.Items.trash(ids)`，它在事务内标记 item 为 deleted、写入 Zotero trash 状态、刷新 parent child items，并触发 `trash`/`refresh` notifier。
- `items.js:1058-1061` 定义 `Zotero.Items.trashTx(ids)`，它通过 `Zotero.DB.executeTransaction()` 包装 `trash(ids)`。
- `item.js:1757-1803` 的保存逻辑说明 deleted/trash 状态写入 `deletedItems`，并刷新 trash 与 parent child item 状态。
- `item.js:2236-2244` 定义 `Item.prototype.isInTrash()`，child attachment 会继承 parent trash 状态。
- `dataObject.js:1316-1319` 定义 `eraseTx()` 是永久 erase 包装；第一版 undo 不使用该路径。

预校验规则：

- `attachmentKey` 必须指向 local user library 中未在 trash 的 attachment。
- 本项目 audit JSONL 中必须存在成功的 `attachment.addFile` executed 记录，且 `affected.attachmentKeys` 或 `after.attachmentKey` 指向同一 `attachmentKey`。
- 找不到创建审计证据时拒绝 undo，避免对用户既有附件执行撤销。
- dry-run 返回 attachment title、parent item key、file path、source audit requestId/planId 和 action `trash`。
- execute 前必须验证 dry-run confirmation；execute 后只移入 Zotero trash，不清空 trash，不调用 `eraseTx()`，不永久删除 storage 文件。

结论：

- `attachment.undoAdded` 可以通过 Zotero 内部 `Items.trashTx()` 实现受控撤销，不直接写 SQLite。
- 该命令只对本项目可证明创建的附件开放；普通既有附件、缺少审计证据的附件和已在 trash 的附件均拒绝。

## `item.trash` / `attachment.trash`

执行计划使用：

```js
await Zotero.Items.trashTx(itemIDs);
```

源码依据：

- Zotero 9.0.5 `items.js:983-1055` 定义 `Zotero.Items.trash(ids)`，在 Zotero transaction 内设置 deleted/trash 状态，写入 `deletedItems`，刷新 parent child items，并触发 `trash`/`refresh` notifier。
- Zotero 9.0.5 `items.js:1058-1061` 定义 `Zotero.Items.trashTx(ids)`，用 `Zotero.DB.executeTransaction()` 包装 `trash(ids)`。
- Zotero 9.0.5 `dataObject.js:1316-1319` 定义 `eraseTx()` 是永久 erase 包装；本项目 `item.trash` / `attachment.trash` 不调用该路径。

预校验规则：

- `item.trash` 接受 `zoteroItemKeys`，最多 50 个；不接受 attachment item，attachment 必须使用 `attachment.trash`。
- `attachment.trash` 接受 `attachmentKeys`，最多 50 个。
- 目标必须在 local user library 且未处于 trash。
- dry-run 返回目标 key、摘要、相关 attachment/file path 和高风险提示。
- execute 必须验证 dry-run confirmation；只移入 Zotero trash，不清空 trash，不永久删除 storage 文件。

结论：

- item 与 attachment 的受控删除第一片应定义为 Zotero trash 操作，而非永久删除。
- 该能力满足“通过 Zotero 插件内部命令实现”，不使用 Web API，不直接写 SQLite。

## `collection.trash`

执行计划使用：

```js
collection.deleted = true;
await collection.saveTx({ deleteItems: false });
```

源码依据：

- Zotero 9.0.5 `collection.js:593-663` 定义 `Collection.prototype.trash(env)`，会将 collection 和 descendant collections 写入 `deletedCollections`。
- `collection.js:616-634` 显示只有传入 `deleteItems` 时才会额外 trash/delete descendant items；本项目默认 `trashDescendentItems: false`。
- `collection.js:670-678` 与 `_eraseData` 说明永久 erase 会在 trash 之后继续完全删除；本项目不调用 `_eraseData()` 或 `eraseTx()`。

预校验规则：

- `collectionKey` 必须指向 local user library 中未在 trash 的 collection。
- 默认只 trash collection/subcollection，不 trash descendant items。
- 只有显式 `trashDescendentItems: true` 时才移动 descendant items 到 Zotero trash。
- dry-run 必须列出 descendant collection keys 和可能受影响的 item keys。

结论：

- collection 删除第一片应走 Zotero collection trash 状态，不永久 erase。
- descendant item 删除必须显式开启，避免把“删除 collection”误解为“删除条目”。

## `duplicates.find` / `duplicates.merge`

查找计划使用：

```js
var duplicates = new Zotero.Duplicates(Zotero.Libraries.userLibraryID);
var search = await duplicates.getSearchObject();
var itemIDs = await search.search();
```

合并计划使用：

```js
await Zotero.Items.merge(masterItem, duplicateItems);
```

源码依据：

- Zotero 9.0.5 `duplicates.js:26-94` 定义 `Zotero.Duplicates`、`getSearchObject()` 和 `getSetItemsByItemID()`，用于得到 duplicates view 对应的搜索和同组 item。
- Zotero 9.0.5 `items.js:975-980` 定义兼容包装 `Zotero.Items.merge(item, otherItems)`，内部导入 `mergeItems.mjs`。
- Zotero 9.0.5 `mergeItems.mjs:3-76` 定义 `mergeItems(item, otherItems)`，在 transaction 中移动 notes、relations、collections、tags 和 attachments，并将非 master item 标记为 deleted/trash。
- `mergeItems.mjs:18` 要求被合并 items 位于同一 library。

预校验规则：

- 第一片只支持 local user library 的 regular item。
- `duplicates.find` 是只读命令，返回 duplicate set、item keys 和摘要。
- `duplicates.merge` 必须指定 `masterZoteroItemKey` 和 `duplicateZoteroItemKeys`。
- master 和 duplicates 不能在 trash，不能跨 library，不能包含 attachment 或非 regular item。
- dry-run 必须列出 master、被合并项、字段冲突、attachment/collection/tag 影响和恢复限制。
- execute 必须验证 dry-run confirmation；合并后非 master item 进入 Zotero trash，不做永久 erase。

结论：

- duplicate merge 可以复用 Zotero 官方内部 merge API。
- 本项目不自行重造合并算法，只负责命令表、dry-run、confirmation、审计和结果包装。
