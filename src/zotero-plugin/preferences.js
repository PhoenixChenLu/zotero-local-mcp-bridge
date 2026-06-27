/* global Zotero, document, window */

(function () {
  var prefPrefix = "extensions.zotero-codex-bridge.";
  var bytesPerGb = 1024 * 1024 * 1024;

  function getPref(name, fallback) {
    try {
      var value = Zotero.Prefs.get(prefPrefix + name);
      return value === undefined ? fallback : value;
    } catch {
      return fallback;
    }
  }

  function setPref(name, value) {
    Zotero.Prefs.set(prefPrefix + name, value);
  }

  function setElementValue(id, value) {
    var element = document.getElementById(id);
    if (element) {
      element.value = value;
    }
  }

  function init() {
    setElementValue("zcb-operation-mode", getPref("operationMode", "readonly"));
    setElementValue("zcb-real-profile-ttl", getPref("realProfileUnlockTtlMinutes", 30));
    document.getElementById("zcb-file-backup-enabled").checked = !!getPref("fileBackupEnabled", true);
    setElementValue("zcb-backup-retention-days", getPref("backupRetentionDays", 30));
    setElementValue("zcb-backup-max-gb", Math.round(getPref("backupMaxLocalBytes", 10 * bytesPerGb) / bytesPerGb));
    document.getElementById("zcb-backup-time-limit").checked = !!getPref("backupEnableTimeLimit", true);
    document.getElementById("zcb-backup-space-limit").checked = !!getPref("backupEnableSpaceLimit", true);
    setElementValue("zcb-default-attachment-mode", getPref("defaultAttachmentMode", "copy"));
    document.getElementById("zcb-attachment-duplicate-check").checked = !!getPref("attachmentDuplicateCheckEnabled", true);

    var runtimeRoot = window.ZoteroCodexBridgeSettings && window.ZoteroCodexBridgeSettings.runtimeRoot || "";
    setElementValue("zcb-runtime-root", runtimeRoot);
    setElementValue("zcb-audit-path", runtimeRoot ? runtimeRoot + "\\runtime\\logs\\audit" : "");
    setElementValue("zcb-backup-path", runtimeRoot ? runtimeRoot + "\\runtime\\backups\\zotero-operations" : "");

    document.getElementById("zcb-operation-mode").addEventListener("command", function (event) {
      setPref("operationMode", event.target.value);
    });
    document.getElementById("zcb-real-profile-ttl").addEventListener("change", function (event) {
      setPref("realProfileUnlockTtlMinutes", Math.max(1, Math.min(120, Number(event.target.value) || 30)));
    });
    document.getElementById("zcb-file-backup-enabled").addEventListener("command", function (event) {
      setPref("fileBackupEnabled", !!event.target.checked);
    });
    document.getElementById("zcb-backup-retention-days").addEventListener("change", function (event) {
      setPref("backupRetentionDays", Math.max(1, Number(event.target.value) || 30));
    });
    document.getElementById("zcb-backup-max-gb").addEventListener("change", function (event) {
      setPref("backupMaxLocalBytes", Math.max(1, Number(event.target.value) || 10) * bytesPerGb);
    });
    document.getElementById("zcb-backup-time-limit").addEventListener("command", function (event) {
      setPref("backupEnableTimeLimit", !!event.target.checked);
    });
    document.getElementById("zcb-backup-space-limit").addEventListener("command", function (event) {
      setPref("backupEnableSpaceLimit", !!event.target.checked);
    });
    document.getElementById("zcb-default-attachment-mode").addEventListener("command", function (event) {
      setPref("defaultAttachmentMode", event.target.value);
    });
    document.getElementById("zcb-attachment-duplicate-check").addEventListener("command", function (event) {
      setPref("attachmentDuplicateCheckEnabled", !!event.target.checked);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
}());
