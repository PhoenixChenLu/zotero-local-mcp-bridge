import { describe, expect, it } from "vitest";

import { ZoteroBridgeError } from "../../../src/shared/errors.js";

describe("ZoteroBridgeError", () => {
  it("carries a stable error code and safe details", () => {
    const error = new ZoteroBridgeError("PROFILE_NOT_TEST", "Profile is not marked as test", {
      profileMode: "real"
    });

    expect(error.code).toBe("PROFILE_NOT_TEST");
    expect(error.message).toBe("Profile is not marked as test");
    expect(error.details).toEqual({ profileMode: "real" });
  });
});
