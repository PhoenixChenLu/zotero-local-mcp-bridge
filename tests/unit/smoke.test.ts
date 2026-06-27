import { describe, expect, it } from "vitest";

import { projectName } from "../../src/shared/index.js";

describe("project scaffold", () => {
  it("exposes the shared package identity", () => {
    expect(projectName).toBe("zotero-codex-bridge");
  });
});
