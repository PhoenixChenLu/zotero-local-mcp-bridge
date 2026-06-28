import { describe, expect, it } from "vitest";

import { ZoteroBridgeError } from "../../../src/shared/errors.js";
import {
  TEST_PROFILE_MARKER_FILE,
  ensureProfileWrite,
  ensureTestProfile
} from "../../../src/zotero-plugin/profileGuard.js";

describe("ensureTestProfile", () => {
  it("allows writes when profileMode is test and the profile marker exists", () => {
    expect(() => ensureTestProfile("test", { markerPresent: true })).not.toThrow();
  });

  it("rejects writes when profileMode is real-locked", () => {
    expect(() => ensureTestProfile("real-locked", { markerPresent: true })).toThrow(
      "Profile must be marked as test before write commands can run"
    );
  });

  it("rejects writes when the test profile marker is missing", () => {
    expect(() => ensureTestProfile("test", { markerPresent: false })).toThrow(
      `Test profile marker file is required before write commands can run: ${TEST_PROFILE_MARKER_FILE}`
    );
  });
});

describe("ensureProfileWrite", () => {
  it("allows write commands for test profile with marker", () => {
    expect(() => ensureProfileWrite("test", { markerPresent: true })).not.toThrow();
  });

  it("rejects write commands for readonly profile mode", () => {
    expectBridgeError(() => ensureProfileWrite("readonly", { markerPresent: true }), "PROFILE_REAL_LOCKED");
  });

  it("rejects write commands for locked real profile mode", () => {
    expectBridgeError(() => ensureProfileWrite("real-locked", { markerPresent: true }), "PROFILE_REAL_LOCKED");
  });

  it("allows write commands for real-unlocked profile mode", () => {
    expect(() => ensureProfileWrite("real-unlocked", { markerPresent: true })).not.toThrow();
  });

  it("rejects test profile writes when marker is missing", () => {
    expectBridgeError(() => ensureProfileWrite("test", { markerPresent: false }), "TEST_PROFILE_MARKER_MISSING");
  });
});

describe("ensureTestProfile edge", () => {
  it("returns stable marker file path reference", () => {
    expect(TEST_PROFILE_MARKER_FILE).toBe(".zotero-local-mcp-bridge-test-profile");
  });
});

function expectBridgeError(action: () => void, code: string): void {
  try {
    action();
  } catch (error) {
    expect(error).toBeInstanceOf(ZoteroBridgeError);
    expect((error as ZoteroBridgeError).code).toBe(code);
    return;
  }

  throw new Error(`Expected ZoteroBridgeError ${code}`);
}
