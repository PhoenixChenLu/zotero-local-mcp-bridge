import type { ProfileMode } from "../shared/commands.js";
import { ZoteroBridgeError } from "../shared/errors.js";

export const TEST_PROFILE_MARKER_FILE = ".zotero-local-mcp-bridge-test-profile";

export type TestProfileGuardOptions = {
  markerPresent: boolean;
};

export function ensureTestProfile(profileMode: ProfileMode, options: TestProfileGuardOptions): void {
  if (profileMode !== "test") {
    throw new ZoteroBridgeError(
      "PROFILE_NOT_TEST",
      "Profile must be marked as test before write commands can run",
      { profileMode }
    );
  }

  if (!options.markerPresent) {
    throw new ZoteroBridgeError(
      "TEST_PROFILE_MARKER_MISSING",
      `Test profile marker file is required before write commands can run: ${TEST_PROFILE_MARKER_FILE}`,
      { markerFile: TEST_PROFILE_MARKER_FILE }
    );
  }
}

export type ProfileWriteGuardOptions = TestProfileGuardOptions;

export function ensureProfileWrite(profileMode: ProfileMode, options: ProfileWriteGuardOptions): void {
  if (profileMode === "readonly" || profileMode === "real-locked") {
    throw new ZoteroBridgeError(
      "PROFILE_REAL_LOCKED",
      "Real-profile write commands are locked. Use safety.unlockRealProfile to unlock with confirmation",
      { profileMode }
    );
  }

  if (profileMode === "real-unlocked") {
    return;
  }

  if (profileMode === "test") {
    if (!options.markerPresent) {
      throw new ZoteroBridgeError(
        "TEST_PROFILE_MARKER_MISSING",
        `Test profile marker file is required before write commands can run: ${TEST_PROFILE_MARKER_FILE}`,
        { markerFile: TEST_PROFILE_MARKER_FILE }
      );
    }
    return;
  }

  throw new ZoteroBridgeError(
    "PROFILE_NOT_TEST",
    "Profile must be marked as test or explicitly unlocked for real-profile writes",
    { profileMode }
  );
}
