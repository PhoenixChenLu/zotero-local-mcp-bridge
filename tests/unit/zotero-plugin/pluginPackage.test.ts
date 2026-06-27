import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const xpiPath = path.resolve("dist", "zotero-codex-bridge.xpi");
const runtimeAuthTokenPath = path.resolve("runtime", "auth", "bridge-token");

describe("Zotero plugin package", () => {
  it("declares compatibility with Zotero 9", async () => {
    const manifest = JSON.parse(await readFile(path.resolve("src", "zotero-plugin", "manifest.json"), "utf8")) as {
      applications: {
        zotero: {
          id: string;
          update_url: string;
          strict_min_version: string;
          strict_max_version: string;
        };
      };
    };

    expect(manifest.applications.zotero.id).toBe("zotero-codex-bridge@example.com");
    expect(manifest.applications.zotero.update_url).toBe(
      "https://example.com/zotero-codex-bridge-local-test/updates.json"
    );
    expect(manifest.applications.zotero.strict_min_version).toBe("7.0");
    expect(manifest.applications.zotero.strict_max_version).toBe("9.0.*");
  });

  it("registers Zotero connector server health and command endpoints", async () => {
    const bootstrap = await readFile(path.resolve("src", "zotero-plugin", "bootstrap.js"), "utf8");

    expect(bootstrap).toContain('version: "0.1.32"');
    expect(bootstrap).toContain('"zotero-codex-bridge ok " + ZoteroCodexBridge.version');
    expect(bootstrap).toContain('healthPath: "/zotero-codex-bridge/health"');
    expect(bootstrap).toContain('commandPath: "/zotero-codex-bridge/command"');
    expect(bootstrap).toContain('"text/plain"');
    expect(bootstrap).toContain('commandName === "collection.getTree"');
    expect(bootstrap).toContain('commandName === "collection.create"');
    expect(bootstrap).toContain('commandName === "collection.rename"');
    expect(bootstrap).toContain('commandName === "collection.move"');
    expect(bootstrap).toContain('commandName === "collection.getItems"');
    expect(bootstrap).toContain('commandName === "collection.addItems"');
    expect(bootstrap).toContain('commandName === "collection.removeItems"');
    expect(bootstrap).toContain('commandName === "item.get"');
    expect(bootstrap).toContain('commandName === "item.search"');
    expect(bootstrap).toContain('commandName === "item.create"');
    expect(bootstrap).toContain('commandName === "item.updateFields"');
    expect(bootstrap).toContain('commandName === "item.updateCreators"');
    expect(bootstrap).toContain('commandName === "item.setCollections"');
    expect(bootstrap).toContain('commandName === "item.updateTags"');
    expect(bootstrap).toContain('commandName === "note.createChild"');
    expect(bootstrap).toContain('commandName === "attachment.get"');
    expect(bootstrap).toContain('commandName === "attachment.getForItem"');
    expect(bootstrap).toContain('commandName === "attachment.addFile"');
    expect(bootstrap).toContain('commandName === "attachment.moveToItem"');
    expect(bootstrap).toContain('commandName === "attachment.rename"');
    expect(bootstrap).toContain('commandName === "attachment.runZoteroRename"');
    expect(bootstrap).toContain('commandName === "attachment.undoAdded"');
    expect(bootstrap).toContain('commandName === "attachment.renamePreferences.get"');
    expect(bootstrap).toContain('commandName === "attachment.renamePreferences.set"');
    expect(bootstrap).toContain('commandName === "backup.settings.get"');
    expect(bootstrap).toContain('commandName === "backup.settings.set"');
    expect(bootstrap).toContain('commandName === "backup.snapshot.list"');
    expect(bootstrap).toContain('commandName === "backup.snapshot.restore"');
    expect(bootstrap).toContain('commandName === "backup.snapshot.prune"');
    expect(bootstrap).toContain('commandName === "audit.list"');
    expect(bootstrap).toContain('commandName === "safety.getProfileStatus"');
    expect(bootstrap).toContain('commandName === "safety.unlockRealProfile"');
    expect(bootstrap).toContain('commandName === "safety.lockRealProfile"');
    expect(bootstrap).toContain('REAL_PROFILE_UNLOCK_CONFIRMATION');
    expect(bootstrap).toContain('"PROFILE_UNLOCK_FINGERPRINT_MISMATCH"');
    expect(bootstrap).toContain('"PROFILE_UNLOCK_CONFIRMATION_REQUIRED"');
    expect(bootstrap).toContain('isProfileUnlockActive(state, resolveProfileFingerprint())');
    expect(bootstrap).toContain('state.profileFingerprint !== profileFingerprint');
    expect(bootstrap).not.toContain('if (preferenceMode === "real-unlocked")');
    expect(bootstrap).toContain("events: entries");
    expect(bootstrap).toContain("createBackupFileSnapshot");
    expect(bootstrap).toContain("readBackupSnapshotList");
    expect(bootstrap).toContain("normalizeBackupSnapshotRecord");
    expect(bootstrap).toContain("executeBackupSnapshotRestore");
    expect(bootstrap).toContain("normalizeBackupSnapshotRestoreInput");
    expect(bootstrap).toContain("executeBackupSnapshotPrune");
    expect(bootstrap).toContain("planBackupSnapshotPrune");
    expect(bootstrap).toContain("BACKUP_SNAPSHOT_PRUNE_PATH_INVALID");
    expect(bootstrap).toContain("readItemDetails");
    expect(bootstrap).toContain("searchItems");
    expect(bootstrap).toContain("readAttachmentDetails");
    expect(bootstrap).toContain("item.toJSON");
    expect(bootstrap).toContain("new Zotero.Item(normalized.itemType)");
    expect(bootstrap).toContain("item.setField(fieldName, fields[fieldName])");
    expect(bootstrap).toContain("item.setCreators(creators, { strict: true })");
    expect(bootstrap).toContain("normalizeItemCreateInput");
    expect(bootstrap).toContain("normalizeItemUpdateFieldsInput");
    expect(bootstrap).toContain("normalizeItemUpdateCreatorsInput");
    expect(bootstrap).toContain("normalizeItemSetCollectionsInput");
    expect(bootstrap).toContain("getCollections(true)");
    expect(bootstrap).toContain("backupFilesRootPath");
    expect(bootstrap).toContain("IOUtils.copy");
    expect(bootstrap).toContain('PathUtils.join(resolveBridgeRuntimeRoot(), "runtime", "backups", "zotero-operations")');
    expect(bootstrap).toContain('"settings.json"');
    expect(bootstrap).toContain("normalizeBackupPolicy");
    expect(bootstrap).toContain('new Zotero.Item("note")');
    expect(bootstrap).toContain("Zotero.Attachments.importFromFile");
    expect(bootstrap).toContain("Zotero.Attachments.linkFromFile");
    expect(bootstrap).toContain("Zotero.Items.trashTx");
    expect(bootstrap).toContain("findBridgeAttachmentAddAudit");
    expect(bootstrap).toContain("attachment.parentKey = normalized.targetZoteroItemKey");
    expect(bootstrap).toContain('return PathUtils.join(appData || localAppData || home || "", "zotero-codex-bridge");');
    expect(bootstrap).toContain("var localAppData = getEnvironmentValue(\"LOCALAPPDATA\");");
    expect(bootstrap).toContain('var appData = getEnvironmentValue("APPDATA");');
    expect(bootstrap).toContain("renameAttachmentFile");
    expect(bootstrap).toContain("shouldAutoRenameAttachment");
    expect(bootstrap).toContain("getFileBaseNameFromItem");
    expect(bootstrap).toContain('Zotero.Prefs.set("autoRenameFiles"');
    expect(bootstrap).toContain("Zotero.SyncedSettings.set");
    expect(bootstrap).toContain("Zotero.File.putContentsAsync");
    expect(bootstrap).toContain("Zotero.File.getContentsAsync");
    expect(bootstrap).toContain("Zotero.File.createDirectoryIfMissingAsync");
    expect(bootstrap).toContain('PathUtils.join(resolveBridgeRuntimeRoot(), "runtime", "logs", "audit")');
    expect(bootstrap).toContain('attachment.setField("title", normalized.title)');
    expect(bootstrap).toContain("note.setNote");
    expect(bootstrap).toContain("noteHtmlPreview");
    expect(bootstrap).toContain("getAttachments(false)");
    expect(bootstrap).toContain("getFilePathAsync");
    expect(bootstrap).toContain("CONFIRMATION_REQUIRED");
    expect(bootstrap).toContain("Zotero.Collections.getByLibrary");
    expect(bootstrap).toContain("return [");
    expect(bootstrap).toContain("Zotero.Server.Endpoints[ZoteroCodexBridge.healthPath]");
    expect(bootstrap).toContain("function onMainWindowLoad");
    expect(bootstrap).toContain("function onMainWindowUnload");
    expect(bootstrap).toContain("runtimeRoot: null");
    expect(bootstrap).not.toContain("runtimeRoot: resolveBridgeRuntimeRoot()");
    expect(bootstrap).toContain("var expectedAuthToken;");
    expect(bootstrap).toContain("try {");
    expect(bootstrap).toContain("expectedAuthToken = await getExpectedAuthToken();");
    expect(bootstrap).toContain('throw commandError("COMMAND_AUTH_TOKEN_MISSING"');
    expect(bootstrap).toContain('throw commandError("COMMAND_AUTH_TOKEN_INVALID"');
    expect(bootstrap).toContain('code: error.code || "COMMAND_AUTH_TOKEN_MISSING"');
    expect(bootstrap).toContain("return jsonCommandResponse(error.status || 503, \"unknown\", \"unknown\", undefined, {");
  });

  it("builds an installable XPI with manifest and bootstrap entry", async () => {
    await rm(xpiPath, { force: true });

    await execFileAsync(process.execPath, ["scripts/buildZoteroPlugin.mjs"], { windowsHide: true });

    expect(existsSync(xpiPath)).toBe(true);

    const { stdout } = await execFileAsync("tar", ["-tf", xpiPath], { windowsHide: true });
    expect(stdout).toContain("manifest.json");
    expect(stdout).toContain("bootstrap.js");

    const bootstrap = await execFileAsync("tar", ["-xOf", xpiPath, "bootstrap.js"], { windowsHide: true });
    expect(bootstrap.stdout).not.toContain("__ZOTERO_CODEX_BRIDGE_AUTH_TOKEN__");
    expect(bootstrap.stdout).not.toContain("__ZOTERO_CODEX_BRIDGE_PROJECT_ROOT__");
    expect(bootstrap.stdout).not.toContain("H:\\\\ProgramDocument\\\\MixLanguage\\\\Zotero-codex-bridge");
  });

  it("keeps release build artifact free of embedded local tokens", async () => {
    const hadOriginalToken = existsSync(runtimeAuthTokenPath);
    const originalToken = hadOriginalToken ? await readFile(runtimeAuthTokenPath, "utf8") : undefined;

    try {
      await rm(runtimeAuthTokenPath, { force: true });
      await mkdir(path.dirname(runtimeAuthTokenPath), { recursive: true });
      const tokenForTestBuild = randomBytes(32).toString("base64url");
      await writeFile(runtimeAuthTokenPath, `${tokenForTestBuild}\n`, "utf8");

      await execFileAsync(process.execPath, ["scripts/buildZoteroPlugin.mjs"], { windowsHide: true });
      const releaseBootstrap = await execFileAsync("tar", ["-xOf", xpiPath, "bootstrap.js"], { windowsHide: true });
      expect(releaseBootstrap.stdout).toContain("expectedAuthToken: null");
      expect(releaseBootstrap.stdout).not.toContain(tokenForTestBuild);
      expect(releaseBootstrap.stdout).not.toContain("__ZOTERO_CODEX_BRIDGE_AUTH_TOKEN__");

      await execFileAsync(process.execPath, ["scripts/buildZoteroPlugin.mjs", "--test"], { windowsHide: true });
      const testBootstrap = await execFileAsync("tar", ["-xOf", xpiPath, "bootstrap.js"], { windowsHide: true });
      expect(testBootstrap.stdout).toContain(`expectedAuthToken: "${tokenForTestBuild}"`);
      expect(testBootstrap.stdout).not.toContain("expectedAuthToken: null");
      expect(testBootstrap.stdout).not.toContain("__ZOTERO_CODEX_BRIDGE_AUTH_TOKEN__");

      await execFileAsync(process.execPath, ["scripts/buildZoteroPlugin.mjs"], { windowsHide: true });
      const rebuiltReleaseBootstrap = await execFileAsync("tar", ["-xOf", xpiPath, "bootstrap.js"], { windowsHide: true });
      expect(rebuiltReleaseBootstrap.stdout).toContain("expectedAuthToken: null");
      expect(rebuiltReleaseBootstrap.stdout).not.toContain(tokenForTestBuild);
    } finally {
      if (originalToken !== undefined) {
        await mkdir(path.dirname(runtimeAuthTokenPath), { recursive: true });
        await writeFile(runtimeAuthTokenPath, originalToken, "utf8");
      } else {
        await rm(runtimeAuthTokenPath, { force: true });
      }

      await execFileAsync(process.execPath, ["scripts/buildZoteroPlugin.mjs"], { windowsHide: true });
    }
  });
});
