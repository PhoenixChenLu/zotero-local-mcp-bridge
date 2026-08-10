/* global Zotero, document, window, ChromeUtils, Components, PathUtils, navigator, __ZOTERO_LOCAL_MCP_BRIDGE_RUNTIME_ROOT__ */

(function () {
  var prefPrefix = "extensions.zotero-local-mcp-bridge.";
  var bytesPerGb = 1024 * 1024 * 1024;
  var injectedRuntimeRoot = __ZOTERO_LOCAL_MCP_BRIDGE_RUNTIME_ROOT__;

  function getPref(name, fallback) {
    var fullName = prefPrefix + name;
    try {
      var value = Zotero.Prefs.get(fullName, true);
      return value === undefined ? fallback : value;
    } catch {
      try {
        var legacyValue = Zotero.Prefs.get(fullName);
        return legacyValue === undefined ? fallback : legacyValue;
      } catch {
        return fallback;
      }
    }
  }

  function setPref(name, value) {
    Zotero.Prefs.set(prefPrefix + name, value, true);
  }

  function getElement(id) {
    var element = document.getElementById(id);
    if (!element) {
      throw new Error("Zotero Local MCP Bridge preference control missing: " + id);
    }
    return element;
  }

  function setElementValue(id, value) {
    var element = getElement(id);
    element.value = value;
    element.title = value || "";
  }

  function setPathElementValue(id, value) {
    var element = getElement(id);
    element.value = value;
    element.title = value || "";
    if (value && typeof Zotero !== "undefined" && Zotero.File && Zotero.File.pathToFileURI) {
      element.style.backgroundImage = "url(moz-icon://" + Zotero.File.pathToFileURI(value) + "?size=16)";
    } else {
      element.style.backgroundImage = "";
    }
  }

  function setElementChecked(id, value) {
    getElement(id).checked = !!value;
  }

  function addCommandListener(id, handler) {
    getElement(id).addEventListener("command", function () {
      handler(getElement(id));
    });
  }

  function addChangeListener(id, handler) {
    getElement(id).addEventListener("change", function () {
      handler(getElement(id));
    });
  }

  function addAsyncCommandListener(id, handler) {
    var element = getElement(id);
    var run = function () {
      if (element.getAttribute("data-zcb-busy") === "true") {
        return;
      }
      element.setAttribute("data-zcb-busy", "true");
      Promise.resolve(handler(element)).catch(function (error) {
        reportError(error);
      }).finally(function () {
        element.removeAttribute("data-zcb-busy");
      });
    };
    element.addEventListener("command", run);
    element.addEventListener("click", run);
  }

  function addTooltipHelpListener(id, tooltipId) {
    var button = getElement(id);
    var tooltip = getElement(tooltipId);
    var lastToggleAt = 0;
    var show = function () {
      if (tooltip.openPopup) {
        tooltip.openPopup(button, "after_start", 0, 0, false, false);
      }
    };
    var hide = function () {
      if (tooltip.hidePopup) {
        tooltip.hidePopup();
      }
    };
    var showFromClick = function () {
      var now = Date.now();
      if (now - lastToggleAt < 100) {
        return;
      }
      lastToggleAt = now;
      show();
    };
    button.addEventListener("command", showFromClick);
    button.addEventListener("click", showFromClick);
    button.addEventListener("mouseleave", hide);
  }

  function reportError(error) {
    var message = error && error.message ? error.message : String(error);
    if (typeof Zotero !== "undefined" && Zotero.logError) {
      Zotero.logError(error);
    } else if (typeof Zotero !== "undefined" && Zotero.debug) {
      Zotero.debug("Zotero Local MCP Bridge preferences error: " + message);
    }
  }

  function joinPath(root, parts) {
    if (typeof PathUtils !== "undefined" && PathUtils.join) {
      return PathUtils.join.apply(PathUtils, [root || ""].concat(parts));
    }

    var value = root || "";
    for (var i = 0; i < parts.length; i += 1) {
      value = value.replace(/[\\/]+$/, "") + "\\" + parts[i];
    }
    return value;
  }

  function getEnvironmentValue(name) {
    if (typeof Components === "undefined" || !Components.interfaces || !Components.classes) {
      return "";
    }

    try {
      return Components.classes["@mozilla.org/process/environment;1"].getService(Components.interfaces.nsIEnvironment).get(name) || "";
    } catch {
      return "";
    }
  }

  function isLikelyWindowsPlatform() {
    if (typeof navigator === "object" && typeof navigator.platform === "string") {
      return /^win/i.test(navigator.platform);
    }
    return !!getEnvironmentValue("APPDATA") || !!getEnvironmentValue("LOCALAPPDATA");
  }

  function resolveDefaultAppDataRoot() {
    var home = getEnvironmentValue("HOME") || getEnvironmentValue("USERPROFILE");
    if (isLikelyWindowsPlatform()) {
      var appData = getEnvironmentValue("APPDATA");
      var localAppData = getEnvironmentValue("LOCALAPPDATA");
      return joinPath(appData || localAppData || home || "", ["zotero-local-mcp-bridge"]);
    }

    if (typeof navigator === "object" && typeof navigator.platform === "string" && /^mac/i.test(navigator.platform)) {
      return joinPath(home || "", ["Library", "Application Support", "zotero-local-mcp-bridge"]);
    }

    var xdgState = getEnvironmentValue("XDG_STATE_HOME") || getEnvironmentValue("XDG_DATA_HOME") || (home ? joinPath(home, [".local", "share"]) : "");
    return joinPath(xdgState, ["zotero-local-mcp-bridge"]);
  }

  function resolveDefaultRuntimeRoot() {
    return joinPath(resolveDefaultAppDataRoot(), ["runtime"]);
  }

  function getRuntimeRoot() {
    var runtimeRoot = getPref("runtimeRoot", "");
    if (runtimeRoot) {
      return runtimeRoot;
    }
    if (typeof injectedRuntimeRoot === "string" && injectedRuntimeRoot.length > 0) {
      return injectedRuntimeRoot;
    }
    return resolveDefaultRuntimeRoot();
  }

  function persistInjectedRuntimeRootIfNeeded() {
    if (!getPref("runtimeRoot", "") && typeof injectedRuntimeRoot === "string" && injectedRuntimeRoot.length > 0) {
      setPref("runtimeRoot", injectedRuntimeRoot);
    }
  }

  function getAuditRoot() {
    return getPref("auditRoot", joinPath(resolveDefaultAppDataRoot(), ["audit"]));
  }

  function getBackupRoot() {
    return getPref("backupRoot", joinPath(resolveDefaultAppDataRoot(), ["backup"]));
  }

  function getBackupMaxLocalGb() {
    var gbValue = Number(getPref("backupMaxLocalGb", 10));
    if (Number.isFinite(gbValue) && gbValue >= 1) {
      return Math.round(gbValue);
    }

    var bytesValue = Number(getPref("backupMaxLocalBytes", 10 * bytesPerGb));
    if (Number.isFinite(bytesValue) && bytesValue >= bytesPerGb) {
      return Math.round(bytesValue / bytesPerGb);
    }

    return 10;
  }

  function refreshPathFields() {
    var runtimeRoot = getRuntimeRoot();
    setPathElementValue("zcb-runtime-root", runtimeRoot);
    setPathElementValue("zcb-audit-path", getAuditRoot(runtimeRoot));
    setPathElementValue("zcb-backup-path", getBackupRoot(runtimeRoot));
  }

  function setDisplayDirectory(picker, currentPath) {
    if (!currentPath) {
      return;
    }

    try {
      picker.displayDirectory = currentPath;
    } catch {
      // The picker can still open without an initial directory.
    }
  }

  function filePathFromPickerFile(file) {
    if (!file) {
      return "";
    }
    if (typeof file === "string") {
      return file;
    }
    return file.path || "";
  }

  function filePickerFolderMode(picker, module) {
    if (module && module.FilePicker && module.FilePicker.modeGetFolder !== undefined) {
      return module.FilePicker.modeGetFolder;
    }
    if (picker && picker.modeGetFolder !== undefined) {
      return picker.modeGetFolder;
    }
    if (typeof Components !== "undefined") {
      return Components.interfaces.nsIFilePicker.modeGetFolder;
    }
    return 2;
  }

  async function pickDirectory(title, currentPath) {
    var selected = await pickDirectoryWithZoteroFilePicker(title, currentPath);
    if (selected) {
      return selected;
    }
    return pickDirectoryWithNativeFilePicker(title, currentPath);
  }

  async function pickDirectoryWithZoteroFilePicker(title, currentPath) {
    if (typeof ChromeUtils === "undefined" || !ChromeUtils.importESModule) {
      return "";
    }

    try {
      var module = ChromeUtils.importESModule("chrome://zotero/content/modules/filePicker.mjs");
      var picker = new module.FilePicker();
      picker.init(window, title, filePickerFolderMode(picker, module));
      if (picker.appendFilters && picker.filterAll !== undefined) {
        picker.appendFilters(picker.filterAll);
      }
      setDisplayDirectory(picker, currentPath);
      var result = await picker.show();
      if (result === picker.returnOK && picker.file) {
        return filePathFromPickerFile(picker.file);
      }
    } catch (error) {
      reportError(error);
    }

    return "";
  }

  async function pickDirectoryWithNativeFilePicker(title, currentPath) {
    if (typeof Components === "undefined") {
      return "";
    }

    try {
      var picker = Components.classes["@mozilla.org/filepicker;1"]
        .createInstance(Components.interfaces.nsIFilePicker);
      picker.init(window, title, Components.interfaces.nsIFilePicker.modeGetFolder);
      if (picker.appendFilters && picker.filterAll !== undefined) {
        picker.appendFilters(picker.filterAll);
      }
      setDisplayDirectory(picker, currentPath);
      var result = picker.show();
      if (result && typeof result.then === "function") {
        result = await result;
      }
      if (result === picker.returnOK && picker.file) {
        return filePathFromPickerFile(picker.file);
      }
    } catch (error) {
      reportError(error);
    }

    return "";
  }

  async function chooseDirectory(prefName, fieldId, title) {
    var selectedPath = await pickDirectory(title, getElement(fieldId).value);
    if (!selectedPath) {
      return;
    }

    setPref(prefName, selectedPath);
    refreshPathFields();
  }

  function getSafetyCenterService() {
    if (!Zotero.ZoteroLocalMcpBridgeSafetyCenter) {
      throw new Error("Zotero Local MCP Bridge Safety Center service is unavailable");
    }
    return Zotero.ZoteroLocalMcpBridgeSafetyCenter;
  }

  function clearChildren(element) {
    while (element.firstChild) {
      element.firstChild.remove();
    }
  }

  function createXulElement(name, className) {
    var element = document.createXULElement
      ? document.createXULElement(name)
      : document.createElement(name);
    if (className) {
      element.setAttribute("class", className);
    }
    return element;
  }

  function createValueLabel(value, className) {
    var label = createXulElement("label", className);
    label.setAttribute("value", value || "");
    label.setAttribute("crop", "end");
    label.setAttribute("tooltiptext", value || "");
    return label;
  }

  function setLocalizedId(element, id) {
    element.setAttribute("data-l10n-id", id);
    if (document.l10n && document.l10n.translateElements) {
      document.l10n.translateElements([element]);
    }
  }

  function formatSafetyTargets(targets) {
    return [
      "items " + targets.zoteroItemCount,
      "collections " + targets.collectionCount,
      "attachments " + targets.attachmentCount,
      "files " + targets.fileCount,
      "tags " + targets.tagCount
    ].join(" · ");
  }

  function formatBytes(bytes) {
    if (!bytes) {
      return "0 B";
    }
    var units = ["B", "KB", "MB", "GB"];
    var value = Number(bytes);
    var unitIndex = 0;
    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex += 1;
    }
    return value.toFixed(unitIndex === 0 ? 0 : 1) + " " + units[unitIndex];
  }

  function addSafetyAction(button, action) {
    button.addEventListener("command", function () {
      if (button.getAttribute("data-zcb-busy") === "true") {
        return;
      }
      button.setAttribute("data-zcb-busy", "true");
      Promise.resolve(action()).then(loadSafetyCenter).catch(showSafetyCenterError).finally(function () {
        button.removeAttribute("data-zcb-busy");
      });
    });
  }

  function renderPendingPlans(plans) {
    var container = getElement("zcb-pending-plans");
    clearChildren(container);
    getElement("zcb-pending-plans-empty").hidden = plans.length > 0;
    plans.forEach(function (plan) {
      var row = createXulElement("hbox", "zcb-safety-entry");
      row.setAttribute("align", "center");
      var main = createXulElement("vbox", "zcb-safety-entry-main");
      main.setAttribute("flex", "1");
      main.appendChild(createValueLabel(plan.operation + " · " + plan.riskLevel + " · " + new Date(plan.expiresAt).toLocaleString()));
      main.appendChild(createValueLabel(formatSafetyTargets(plan.targets) + " · warnings " + plan.warnings.length, "zcb-safety-entry-detail"));
      row.appendChild(main);

      var actions = createXulElement("hbox", "zcb-safety-actions");
      var reject = createXulElement("button");
      setLocalizedId(reject, "zotero-local-mcp-bridge-reject");
      addSafetyAction(reject, function () {
        return getSafetyCenterService().rejectPendingPlan(plan.planId);
      });
      actions.appendChild(reject);
      row.appendChild(actions);
      container.appendChild(row);
    });
  }

  function renderAuditEvents(events) {
    var container = getElement("zcb-audit-events");
    clearChildren(container);
    getElement("zcb-audit-events-empty").hidden = events.length > 0;
    events.forEach(function (event) {
      var row = createXulElement("vbox", "zcb-safety-entry");
      row.appendChild(createValueLabel(event.commandName + " · " + event.status + " · " + new Date(event.timestamp).toLocaleString()));
      row.appendChild(createValueLabel(formatSafetyTargets(event.affected), "zcb-safety-entry-detail"));
      container.appendChild(row);
    });
  }

  function renderUndoEntries(backup) {
    var entries = backup.undoEntries || [];
    var container = getElement("zcb-undo-entries");
    clearChildren(container);
    getElement("zcb-backup-summary").setAttribute("value", backup.snapshotCount + " · " + formatBytes(backup.totalBytes));
    getElement("zcb-undo-entries-empty").hidden = entries.length > 0;
    entries.forEach(function (entry) {
      var row = createXulElement("vbox", "zcb-safety-entry");
      row.appendChild(createValueLabel((entry.filename || entry.backupId) + " · " + formatBytes(entry.bytes)));
      row.appendChild(createValueLabel(entry.commandName + " · " + new Date(entry.createdAt).toLocaleString(), "zcb-safety-entry-detail"));
      container.appendChild(row);
    });
  }

  function showSafetyCenterError(error) {
    var element = getElement("zcb-safety-error");
    element.setAttribute("value", error && error.message ? error.message : String(error));
    element.hidden = false;
    reportError(error);
  }

  async function loadSafetyCenter() {
    var errorElement = getElement("zcb-safety-error");
    errorElement.hidden = true;
    var snapshot = await getSafetyCenterService().getSnapshot();
    renderPendingPlans(snapshot.pendingPlans || []);
    renderAuditEvents(snapshot.auditEvents || []);
    renderUndoEntries(snapshot.backup || { undoEntries: [] });
    if (snapshot.auditError || (snapshot.backup && snapshot.backup.error)) {
      showSafetyCenterError(new Error(snapshot.auditError || snapshot.backup.error));
    }
  }

  function init() {
    var root = getElement("zotero-local-mcp-bridge-preferences");
    if (root.getAttribute("data-zcb-initialized") === "true") {
      return;
    }
    root.setAttribute("data-zcb-initialized", "true");
    persistInjectedRuntimeRootIfNeeded();

    setElementValue("zcb-operation-mode", getPref("operationMode", "readonly"));
    setElementChecked("zcb-file-backup-enabled", getPref("fileBackupEnabled", true));
    setElementValue("zcb-backup-retention-days", getPref("backupRetentionDays", 30));
    setElementValue("zcb-backup-max-gb", getBackupMaxLocalGb());
    setElementChecked("zcb-backup-time-limit", getPref("backupEnableTimeLimit", true));
    setElementChecked("zcb-backup-space-limit", getPref("backupEnableSpaceLimit", true));
    setElementValue("zcb-default-attachment-mode", getPref("defaultAttachmentMode", "copy"));
    setElementChecked("zcb-attachment-duplicate-check", getPref("attachmentDuplicateCheckEnabled", true));

    refreshPathFields();

    addCommandListener("zcb-operation-mode", function (element) {
      setPref("operationMode", element.value);
      loadSafetyCenter().catch(showSafetyCenterError);
    });
    addTooltipHelpListener("zcb-run-mode-help", "zcb-run-mode-tooltip");
    addCommandListener("zcb-file-backup-enabled", function (element) {
      setPref("fileBackupEnabled", !!element.checked);
    });
    addChangeListener("zcb-backup-retention-days", function (element) {
      setPref("backupRetentionDays", Math.max(1, Number(element.value) || 30));
    });
    addChangeListener("zcb-backup-max-gb", function (element) {
      var gbValue = Math.max(1, Number(element.value) || 10);
      setPref("backupMaxLocalGb", gbValue);
      setPref("backupMaxLocalBytes", String(gbValue * bytesPerGb));
    });
    addCommandListener("zcb-backup-time-limit", function (element) {
      setPref("backupEnableTimeLimit", !!element.checked);
    });
    addCommandListener("zcb-backup-space-limit", function (element) {
      setPref("backupEnableSpaceLimit", !!element.checked);
    });
    addCommandListener("zcb-default-attachment-mode", function (element) {
      setPref("defaultAttachmentMode", element.value);
    });
    addCommandListener("zcb-attachment-duplicate-check", function (element) {
      setPref("attachmentDuplicateCheckEnabled", !!element.checked);
    });
    addAsyncCommandListener("zcb-runtime-root-choose", function () {
      return chooseDirectory("runtimeRoot", "zcb-runtime-root", "Choose Zotero Local MCP Bridge Runtime Root");
    });
    addAsyncCommandListener("zcb-audit-path-choose", function () {
      return chooseDirectory("auditRoot", "zcb-audit-path", "Choose Zotero Local MCP Bridge Audit Directory");
    });
    addAsyncCommandListener("zcb-backup-path-choose", function () {
      return chooseDirectory("backupRoot", "zcb-backup-path", "Choose Zotero Local MCP Bridge Backup Directory");
    });
    addAsyncCommandListener("zcb-safety-refresh", loadSafetyCenter);
    loadSafetyCenter().catch(showSafetyCenterError);
  }

  function scheduleInit(attempt) {
    if (document.getElementById("zotero-local-mcp-bridge-preferences")) {
      init();
      return;
    }
    if (attempt < 100) {
      window.setTimeout(function () {
        scheduleInit(attempt + 1);
      }, 50);
    }
  }

  globalThis.ZoteroLocalMcpBridgePreferences = {
    init: init,
    chooseRuntimeRoot: function () {
      return chooseDirectory("runtimeRoot", "zcb-runtime-root", "Choose Zotero Local MCP Bridge Runtime Root");
    },
    chooseAuditRoot: function () {
      return chooseDirectory("auditRoot", "zcb-audit-path", "Choose Zotero Local MCP Bridge Audit Directory");
    },
    chooseBackupRoot: function () {
      return chooseDirectory("backupRoot", "zcb-backup-path", "Choose Zotero Local MCP Bridge Backup Directory");
    },
    loadSafetyCenter: loadSafetyCenter
  };

  scheduleInit(0);
}());
