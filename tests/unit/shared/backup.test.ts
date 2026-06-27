import { describe, expect, it } from "vitest";

import {
  DEFAULT_BACKUP_POLICY,
  GIB,
  shouldApplySpaceLimitFirst
} from "../../../src/shared/backup.js";

describe("backup policy", () => {
  it("defaults to thirty days and ten GiB", () => {
    expect(DEFAULT_BACKUP_POLICY.retentionDays).toBe(30);
    expect(DEFAULT_BACKUP_POLICY.maxLocalBytes).toBe(10 * GIB);
  });

  it("prioritizes space cleanup when both retention limits are enabled", () => {
    expect(
      shouldApplySpaceLimitFirst({
        retentionDays: 30,
        maxLocalBytes: 10 * GIB,
        enableTimeLimit: true,
        enableSpaceLimit: true
      })
    ).toBe(true);
  });
});
