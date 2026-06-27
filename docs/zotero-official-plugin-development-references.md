# Zotero Official Plugin Development References

创建时间：2026-06-26

本文件记录本项目后续 Zotero 插件开发必须优先参考的官方资料和本机 Zotero 9.0.5 源码结论。后续不要再凭猜测修改插件入口或 connector endpoint。

## Official Sources

- Zotero plugin development:
  - https://www.zotero.org/support/dev/client_coding/plugin_development
- Zotero 7+ developer notes:
  - https://www.zotero.org/support/dev/zotero_7_for_developers
- Zotero connector HTTP server:
  - https://www.zotero.org/support/dev/client_coding/connector_http_server
- Official sample plugin:
  - https://github.com/zotero/make-it-red

## Local Copies

- Official sample plugin clone:
  - `references/official/zotero/make-it-red/`
- Zotero 9.0.5 server source extracted from local installation:
  - `references/official/zotero/zotero-9.0.5-server/server.js`
  - `references/official/zotero/zotero-9.0.5-server/server_connector.js`
  - `references/official/zotero/zotero-9.0.5-server/server_localAPI.js`

The local server files came from:

```text
A:\Program Files\Zotero\app\omni.ja
```

## Confirmed Plugin Package Requirements

The official `make-it-red` sample uses:

- `manifest.json`
- `bootstrap.js`
- `applications.zotero.id`
- `applications.zotero.update_url`
- `applications.zotero.strict_min_version`
- `applications.zotero.strict_max_version`

Zotero 9.0.5 rejected this project XPI until `applications.zotero.update_url` was added.

## Confirmed Bootstrap Requirements

The official `make-it-red` sample defines these bootstrap methods:

- `install`
- `startup`
- `onMainWindowLoad`
- `onMainWindowUnload`
- `shutdown`
- `uninstall`

Zotero 9.0.5 logs warnings when `onMainWindowLoad` or `onMainWindowUnload` are missing. They should be present even if they are no-op methods.

## Confirmed Connector Server Endpoint API

From `references/official/zotero/zotero-9.0.5-server/server.js`:

- Endpoints are registered in `Zotero.Server.Endpoints`.
- The request handler instantiates endpoint classes with `new this.endpoint()`.
- Browser-like requests are blocked when `User-Agent` starts with `Mozilla/` unless the endpoint opts in or the request has Zotero-specific headers.
- For single-parameter endpoint `init(req)`, Zotero passes an object with request data and accepts:
  - integer status code
  - `[statusCode, contentType, body]`
  - Promise resolving to either form
- For two-parameter endpoint `init(data, sendResponseCallback)`, Zotero passes decoded data and a callback.

The official `/connector/ping` endpoint in `server_connector.js` is the closest minimal GET example:

```js
Zotero.Server.Connector.Ping = function () {};
Zotero.Server.Endpoints["/connector/ping"] = Zotero.Server.Connector.Ping;
Zotero.Server.Connector.Ping.prototype = {
  supportedMethods: ["GET", "POST"],
  supportedDataTypes: ["application/json", "text/plain"],
  permitBookmarklet: true,

  init: async function (req) {
    if (req.method == 'GET') {
      return [200, "text/html", "<!DOCTYPE html><html><body>Zotero is running</body></html>"];
    }
  }
};
```

For this project, the next health endpoint revision should follow this shape:

```js
var endpoint = Zotero.Server.Endpoints["/zotero-codex-bridge/health"] = function () {};
endpoint.prototype = {
  supportedMethods: ["GET"],
  init: async function (req) {
    return [200, "text/plain", "zotero-codex-bridge ok"];
  }
};
```

## Health Check Request Requirement

PowerShell's default User-Agent starts with `Mozilla/` and is blocked by Zotero connector server as unsafe web content.

Use a non-browser User-Agent:

```powershell
Invoke-WebRequest `
  -Uri http://127.0.0.1:23119/zotero-codex-bridge/health `
  -UserAgent "ZoteroCodexBridge/0.1.x" `
  -UseBasicParsing
```

## Implementation Rule

Do not continue changing plugin bootstrap or connector endpoint code until the change is traceable to one of:

- Zotero official documentation.
- Official `zotero/make-it-red` sample.
- Local Zotero 9.0.5 source copied under `references/official/zotero/zotero-9.0.5-server/`.
