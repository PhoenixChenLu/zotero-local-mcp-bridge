import { describe, expect, it } from "vitest";

import { CommandRegistry } from "../../../src/zotero-plugin/commandRegistry.js";

describe("CommandRegistry", () => {
  it("rejects unknown commands", async () => {
    const registry = new CommandRegistry({ profileMode: "test", testProfileMarkerPresent: true });

    await expect(
      registry.execute({
        name: "unknown.command",
        requestId: "req_1",
        input: {}
      })
    ).rejects.toThrow("Unknown command: unknown.command");
  });

  it("rejects Zotero profile write commands while real profile is locked", async () => {
    const registry = new CommandRegistry({ profileMode: "real-locked" });
    registry.register("collection.create", async () => ({ collectionKey: "ABC12345" }));

    await expect(
      registry.execute({
        name: "collection.create",
        requestId: "req_2",
        input: { libraryScope: "local-user", name: "Drafts" }
      })
    ).rejects.toThrow("Real-profile write commands are locked");
  });

  it("executes registered read commands", async () => {
    const registry = new CommandRegistry({ profileMode: "real-locked" });
    registry.register("collection.getTree", async () => ({ collections: [] }));

    await expect(
      registry.execute({
        name: "collection.getTree",
        requestId: "req_3",
        input: { libraryScope: "local-user" }
      })
    ).resolves.toMatchObject({
      ok: true,
      commandName: "collection.getTree",
      requestId: "req_3",
      data: { collections: [] }
    });
  });

  it("executes Zotero profile write commands when real profile is unlocked", async () => {
    const registry = new CommandRegistry({ profileMode: "real-unlocked" });
    registry.register("collection.create", async () => ({ collectionKey: "ABC12345" }));

    await expect(
      registry.execute({
        name: "collection.create",
        requestId: "req_4",
        input: { libraryScope: "local-user", name: "Drafts" }
      })
    ).resolves.toMatchObject({
      ok: true,
      commandName: "collection.create",
      requestId: "req_4",
      data: { collectionKey: "ABC12345" }
    });
  });

  it("does not block safety state commands while real profile is locked", async () => {
    const registry = new CommandRegistry({ profileMode: "real-locked" });
    registry.register("safety.lockRealProfile", async () => ({ profileMode: "real-locked" }));

    await expect(
      registry.execute({
        name: "safety.lockRealProfile",
        requestId: "req_5",
        input: {}
      })
    ).resolves.toMatchObject({
      ok: true,
      commandName: "safety.lockRealProfile",
      requestId: "req_5",
      data: { profileMode: "real-locked" }
    });
  });
});
