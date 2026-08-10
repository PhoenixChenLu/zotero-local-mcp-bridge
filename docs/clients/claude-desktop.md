# Claude Desktop

On macOS or Windows, install the `.mcpb` release asset in Claude Desktop. The bundle includes the local stdio adapter and its production dependencies.

The MCPB does not install the Zotero plugin. Install `zotero-local-mcp-bridge.xpi` in Zotero first, restart Zotero, and keep Zotero running while using the tools.

To build the bundle from source:

```bash
npm ci
npm run build:mcp-bundle
```

The generated package is written to `dist/zotero-local-mcp-bridge-<version>.mcpb`.
