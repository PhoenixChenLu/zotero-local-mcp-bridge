import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const profileDir = path.resolve("ZoteroProfile");
const markerPath = path.join(profileDir, ".zotero-local-mcp-bridge-test-profile");

await mkdir(profileDir, { recursive: true });

if (!existsSync(markerPath)) {
  await writeFile(
    markerPath,
    [
      "This file marks ZoteroLocalMcpBridgeTest as the local test profile for zotero-local-mcp-bridge.",
      "Do not copy this marker into a real Zotero profile.",
      ""
    ].join("\n"),
    "utf8"
  );
}
