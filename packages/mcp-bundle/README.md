# Zotero Local MCP Bridge MCP Bundle

This MCP Bundle installs the local stdio compatibility adapter for Claude Desktop. It forwards MCP requests to the endpoint hosted by the Zotero Local MCP Bridge plugin.

The bundle does not contain the Zotero plugin. Install `zotero-local-mcp-bridge.xpi` in Zotero Desktop first and keep Zotero running while using the MCP tools.

The adapter communicates only with the default loopback endpoint:

```text
http://127.0.0.1:23119/zotero-local-mcp-bridge/mcp
```

It does not access `zotero.sqlite` and does not use the Zotero Web API.
