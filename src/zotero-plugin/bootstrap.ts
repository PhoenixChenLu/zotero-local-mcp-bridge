export const pluginId = "zotero-codex-bridge@example.com";
export const pluginVersion = "0.1.31";

export const defaultHttpBinding = {
  host: "127.0.0.1",
  port: 23119,
  healthPath: "/zotero-codex-bridge/health",
  commandPath: "/zotero-codex-bridge/command"
} as const;
