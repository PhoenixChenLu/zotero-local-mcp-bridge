import { createHash, randomUUID } from "node:crypto";

import type { CommandName } from "../shared/commands.js";
import { DEFAULT_DRY_RUN_TTL_MS, type DryRunPlan, type DryRunRiskLevel } from "../shared/dryRun.js";

export type DryRunPlannerOptions = {
  now?: () => Date;
  ttlMs?: number;
};

export type CreateDryRunPlanInput = {
  operation: CommandName;
  input: unknown;
  riskLevel: DryRunRiskLevel;
  resolvedTargets: DryRunPlan["resolvedTargets"];
  warnings: string[];
  requiresBackup: boolean;
};

export type CreatedDryRunPlan = DryRunPlan & {
  confirmation: {
    token: string;
    expiresAt: string;
  };
};

export class DryRunPlanner {
  private readonly now: () => Date;
  private readonly ttlMs: number;

  public constructor(options: DryRunPlannerOptions = {}) {
    this.now = options.now ?? (() => new Date());
    this.ttlMs = options.ttlMs ?? DEFAULT_DRY_RUN_TTL_MS;
  }

  public createPlan(input: CreateDryRunPlanInput): CreatedDryRunPlan {
    const expiresAt = new Date(this.now().getTime() + this.ttlMs).toISOString();

    return {
      planId: `plan_${randomUUID()}`,
      operation: input.operation,
      riskLevel: input.riskLevel,
      inputHash: hashInput(input.input),
      resolvedTargets: input.resolvedTargets,
      warnings: input.warnings,
      requiresBackup: input.requiresBackup,
      expiresAt,
      confirmation: {
        token: `confirm_${randomUUID()}`,
        expiresAt
      }
    };
  }
}

export function hashInput(input: unknown): string {
  return createHash("sha256").update(stableStringify(input)).digest("hex");
}

function stableStringify(value: unknown): string {
  return JSON.stringify(sortJson(value));
}

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sortJson(item));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, sortJson(nested)])
    );
  }

  return value;
}
