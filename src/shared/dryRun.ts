import { randomUUID } from "node:crypto";

import type { CommandName } from "./commands.js";

export const DEFAULT_DRY_RUN_TTL_MS = 10 * 60 * 1000;

export type DryRunRiskLevel = "low" | "medium" | "high";

export type DryRunPlan = {
  planId: string;
  operation: CommandName;
  riskLevel: DryRunRiskLevel;
  inputHash: string;
  resolvedTargets: {
    zoteroItemKeys: string[];
    collectionKeys: string[];
    attachmentKeys: string[];
    filePaths: string[];
    tags: string[];
  };
  warnings: string[];
  requiresBackup: boolean;
  expiresAt: string;
};

export type ConfirmationToken = {
  planId: string;
  token: string;
  expiresAt: string;
};

export function createDryRunPlanId(): string {
  return `plan_${randomUUID()}`;
}

export function isDryRunPlanExpired(expiresAt: string, now = new Date()): boolean {
  return new Date(expiresAt).getTime() < now.getTime();
}
