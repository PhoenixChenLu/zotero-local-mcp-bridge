export const GIB = 1024 * 1024 * 1024;

export type BackupPolicy = {
  retentionDays: number;
  maxLocalBytes: number;
  enableTimeLimit: boolean;
  enableSpaceLimit: boolean;
};

export const DEFAULT_BACKUP_POLICY: BackupPolicy = {
  retentionDays: 30,
  maxLocalBytes: 10 * GIB,
  enableTimeLimit: true,
  enableSpaceLimit: true
};

export type UndoOperation = {
  operationId: string;
  commandName: string;
  reversible: boolean;
  backupRequired: boolean;
  expiresWithBackup: boolean;
};

export function shouldApplySpaceLimitFirst(policy: BackupPolicy): boolean {
  return policy.enableSpaceLimit && policy.enableTimeLimit;
}
