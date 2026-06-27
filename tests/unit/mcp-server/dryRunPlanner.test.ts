import { describe, expect, it } from "vitest";

import { DryRunPlanner } from "../../../src/mcp-server/dryRunPlanner.js";
import { ConfirmationStore } from "../../../src/mcp-server/confirmationStore.js";

describe("dry-run and confirmation flow", () => {
  it("creates a dry-run plan with automatic confirmation token", () => {
    const planner = new DryRunPlanner({
      now: () => new Date("2026-06-26T00:00:00.000Z")
    });

    const plan = planner.createPlan({
      operation: "collection.create",
      input: { libraryScope: "local-user", name: "Drafts" },
      riskLevel: "low",
      resolvedTargets: emptyTargets(),
      warnings: [],
      requiresBackup: false
    });

    expect(plan.planId).toMatch(/^plan_[a-f0-9-]{36}$/);
    expect(plan.confirmation.token).toMatch(/^confirm_[a-f0-9-]{36}$/);
    expect(plan.expiresAt).toBe("2026-06-26T00:10:00.000Z");
  });

  it("accepts matching unexpired confirmation tokens", () => {
    const store = new ConfirmationStore({
      now: () => new Date("2026-06-26T00:05:00.000Z")
    });
    store.save({
      planId: "plan_1",
      inputHash: "hash_1",
      confirmationToken: "confirm_1",
      expiresAt: "2026-06-26T00:10:00.000Z"
    });

    expect(() =>
      store.validateForExecute({
        planId: "plan_1",
        inputHash: "hash_1",
        confirmationToken: "confirm_1"
      })
    ).not.toThrow();
  });

  it("rejects expired or mismatched confirmations", () => {
    const store = new ConfirmationStore({
      now: () => new Date("2026-06-26T00:11:00.000Z")
    });
    store.save({
      planId: "plan_1",
      inputHash: "hash_1",
      confirmationToken: "confirm_1",
      expiresAt: "2026-06-26T00:10:00.000Z"
    });

    expect(() =>
      store.validateForExecute({
        planId: "plan_1",
        inputHash: "hash_1",
        confirmationToken: "confirm_1"
      })
    ).toThrow("Dry-run plan has expired");
  });

  it("rejects changed inputs", () => {
    const store = new ConfirmationStore({
      now: () => new Date("2026-06-26T00:05:00.000Z")
    });
    store.save({
      planId: "plan_1",
      inputHash: "hash_1",
      confirmationToken: "confirm_1",
      expiresAt: "2026-06-26T00:10:00.000Z"
    });

    expect(() =>
      store.validateForExecute({
        planId: "plan_1",
        inputHash: "hash_2",
        confirmationToken: "confirm_1"
      })
    ).toThrow("Dry-run input hash does not match execute input");
  });
});

function emptyTargets() {
  return {
    zoteroItemKeys: [],
    collectionKeys: [],
    attachmentKeys: [],
    filePaths: [],
    tags: []
  };
}
