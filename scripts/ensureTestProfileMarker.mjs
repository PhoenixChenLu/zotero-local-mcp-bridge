import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const profileDir = path.resolve("ZoteroProfile");
const markerPath = path.join(profileDir, ".zotero-codex-bridge-test-profile");

await mkdir(profileDir, { recursive: true });

if (!existsSync(markerPath)) {
  await writeFile(
    markerPath,
    [
      "This file marks ZoteroCodexBridgeTest as the local test profile for zotero-codex-bridge.",
      "Do not copy this marker into a real Zotero profile.",
      ""
    ].join("\n"),
    "utf8"
  );
}
