export const BRIDGE_OPERATION_MODES = ["readonly", "askforapprove", "yolo"] as const;

export type BridgeOperationMode = (typeof BRIDGE_OPERATION_MODES)[number];

export const DEFAULT_BRIDGE_SETTINGS = {
  operationMode: "readonly" as BridgeOperationMode,
  realProfileUnlockTtlMinutes: 30,
  dryRunRequired: true,
  auditEnabled: true,
  fileBackupEnabled: true,
  backupRetentionDays: 30,
  backupMaxLocalBytes: 10 * 1024 * 1024 * 1024,
  backupEnableTimeLimit: true,
  backupEnableSpaceLimit: true,
  defaultAttachmentMode: "copy",
  attachmentDuplicateCheckEnabled: true,
  trashDescendentItemsByDefault: false,
  batchLimit: 50
} as const;

export function isBridgeOperationMode(value: unknown): value is BridgeOperationMode {
  return typeof value === "string" && BRIDGE_OPERATION_MODES.includes(value as BridgeOperationMode);
}
