import { describe, expect, it } from "vitest";

import {
  DEFAULT_DRY_RUN_TTL_MS,
  createDryRunPlanId,
  isDryRunPlanExpired
} from "../../../src/shared/dryRun.js";

describe("dry-run plan helpers", () => {
  it("uses a ten minute default plan lifetime", () => {
    expect(DEFAULT_DRY_RUN_TTL_MS).toBe(10 * 60 * 1000);
  });

  it("creates plan ids with a stable prefix", () => {
    expect(createDryRunPlanId()).toMatch(/^plan_[a-f0-9-]{36}$/);
  });

  it("detects expired plans", () => {
    const now = new Date("2026-06-26T00:00:00.000Z");
    expect(isDryRunPlanExpired("2026-06-26T00:10:00.000Z", now)).toBe(false);
    expect(isDryRunPlanExpired("2026-06-25T23:59:59.000Z", now)).toBe(true);
  });
});
