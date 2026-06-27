import {
  DEFAULT_BACKUP_POLICY,
  type BackupPolicy,
  shouldApplySpaceLimitFirst
} from "../shared/backup.js";
import { resolveBackupRootPath, type RuntimePathOptions } from "./runtimePaths.js";

export type BackupEntry = {
  id: string;
  path: string;
  bytes: number;
  createdAt: string;
};

export type BackupRetentionReason = "space-limit" | "time-limit";

export type BackupRetentionPlan = {
  deleteIds: string[];
  reasonsById: Record<string, BackupRetentionReason>;
};

export type BackupManagerOptions = RuntimePathOptions & {
  policy?: BackupPolicy;
  now?: Date;
};

export class BackupManager {
  readonly backupRoot: string;
  readonly policy: BackupPolicy;

  private readonly now: Date;

  constructor(options: BackupManagerOptions) {
    this.backupRoot = resolveBackupRootPath(options);
    this.policy = options.policy ?? DEFAULT_BACKUP_POLICY;
    this.now = options.now ?? new Date();
  }

  planRetentionPrune(entries: readonly BackupEntry[]): BackupRetentionPlan {
    const deleteIds: string[] = [];
    const reasonsById: Record<string, BackupRetentionReason> = {};
    const retained = [...entries];

    const markForDeletion = (id: string, reason: BackupRetentionReason): void => {
      if (id in reasonsById) {
        return;
      }

      deleteIds.push(id);
      reasonsById[id] = reason;
    };

    if (shouldApplySpaceLimitFirst(this.policy) || (this.policy.enableSpaceLimit && !this.policy.enableTimeLimit)) {
      let totalBytes = retained.reduce((sum, backup) => sum + backup.bytes, 0);
      const oldestFirst = [...retained].sort((left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt));

      for (const backup of oldestFirst) {
        if (totalBytes <= this.policy.maxLocalBytes) {
          break;
        }

        markForDeletion(backup.id, "space-limit");
        totalBytes -= backup.bytes;
      }
    }

    if (this.policy.enableTimeLimit) {
      const cutoff = this.now.getTime() - this.policy.retentionDays * 24 * 60 * 60 * 1000;

      for (const backup of retained) {
        if (Date.parse(backup.createdAt) < cutoff) {
          markForDeletion(backup.id, "time-limit");
        }
      }
    }

    return { deleteIds, reasonsById };
  }
}
