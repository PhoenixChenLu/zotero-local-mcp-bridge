import { describe, expect, it } from "vitest";

import { CommandRegistry } from "../../../src/zotero-plugin/commandRegistry.js";
import { HttpCommandServer } from "../../../src/zotero-plugin/httpCommandServer.js";

describe("HttpCommandServer", () => {
  it("routes JSON command requests through the registry", async () => {
    const registry = new CommandRegistry({ profileMode: "test", testProfileMarkerPresent: true });
    registry.register("audit.list", async () => ({ events: [] }));
    const server = new HttpCommandServer(registry);

    await expect(
      server.handleJsonRequest({
        name: "audit.list",
        requestId: "req_4",
        input: { limit: 10 }
      })
    ).resolves.toMatchObject({
      status: 200,
      body: {
        ok: true,
        commandName: "audit.list",
        requestId: "req_4",
        data: { events: [] }
      }
    });
  });

  it("returns structured errors", async () => {
    const server = new HttpCommandServer(new CommandRegistry({ profileMode: "test", testProfileMarkerPresent: true }));

    await expect(
      server.handleJsonRequest({
        name: "missing.command",
        requestId: "req_5",
        input: {}
      })
    ).resolves.toMatchObject({
      status: 400,
      body: {
        ok: false,
        commandName: "missing.command",
        requestId: "req_5",
        error: {
          code: "UNKNOWN_COMMAND"
        }
      }
    });
  });
});
