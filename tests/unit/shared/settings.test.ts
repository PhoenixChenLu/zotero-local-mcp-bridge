import { describe, expect, it } from "vitest";

import { DEFAULT_BRIDGE_SETTINGS, isBridgeOperationMode } from "../../../src/shared/settings.js";

describe("bridge settings defaults", () => {
  it("defaults to readonly with mandatory dry-run and audit", () => {
    expect(DEFAULT_BRIDGE_SETTINGS.operationMode).toBe("readonly");
    expect(DEFAULT_BRIDGE_SETTINGS.dryRunRequired).toBe(true);
    expect(DEFAULT_BRIDGE_SETTINGS.auditEnabled).toBe(true);
    expect(DEFAULT_BRIDGE_SETTINGS.batchLimit).toBe(50);
  });

  it("validates the three supported operation modes", () => {
    expect(isBridgeOperationMode("readonly")).toBe(true);
    expect(isBridgeOperationMode("askforapprove")).toBe(true);
    expect(isBridgeOperationMode("yolo")).toBe(true);
    expect(isBridgeOperationMode("real-unlocked")).toBe(false);
    expect(isBridgeOperationMode("test")).toBe(false);
  });

  it("sets backup and attachment defaults from the settings UI spec", () => {
    expect(DEFAULT_BRIDGE_SETTINGS.fileBackupEnabled).toBe(true);
    expect(DEFAULT_BRIDGE_SETTINGS.backupRetentionDays).toBe(30);
    expect(DEFAULT_BRIDGE_SETTINGS.backupMaxLocalBytes).toBe(10 * 1024 * 1024 * 1024);
    expect(DEFAULT_BRIDGE_SETTINGS.backupEnableSpaceLimit).toBe(true);
    expect(DEFAULT_BRIDGE_SETTINGS.backupEnableTimeLimit).toBe(true);
    expect(DEFAULT_BRIDGE_SETTINGS.defaultAttachmentMode).toBe("copy");
    expect(DEFAULT_BRIDGE_SETTINGS.attachmentDuplicateCheckEnabled).toBe(true);
    expect(DEFAULT_BRIDGE_SETTINGS.trashDescendentItemsByDefault).toBe(false);
  });
});
