import { describe, expect, it } from "vitest";

import { BRIDGE_AUTH_HEADER } from "../../../src/shared/auth.js";
import { CommandRegistry } from "../../../src/zotero-plugin/commandRegistry.js";
import { HttpCommandServer } from "../../../src/zotero-plugin/httpCommandServer.js";

describe("Http command auth", () => {
  it("rejects command requests without auth", async () => {
    const server = new HttpCommandServer(new CommandRegistry({ profileMode: "test", testProfileMarkerPresent: true }), {
      authToken: "valid-token"
    });

    await expect(
      server.handleHttpRequest({
        method: "POST",
        contentType: "application/json",
        headers: {},
        body: {
          name: "audit.list",
          requestId: "req_1",
          input: {}
        }
      })
    ).resolves.toMatchObject({
      status: 401,
      body: {
        error: {
          code: "COMMAND_AUTH_REQUIRED"
        }
      }
    });
  });

  it("rejects command requests with invalid auth", async () => {
    const server = new HttpCommandServer(new CommandRegistry({ profileMode: "test", testProfileMarkerPresent: true }), {
      authToken: "valid-token"
    });

    await expect(
      server.handleHttpRequest({
        method: "POST",
        contentType: "application/json",
        headers: { [BRIDGE_AUTH_HEADER]: "wrong-token" },
        body: {
          name: "audit.list",
          requestId: "req_2",
          input: {}
        }
      })
    ).resolves.toMatchObject({
      status: 403,
      body: {
        error: {
          code: "COMMAND_AUTH_INVALID"
        }
      }
    });
  });

  it("rejects command requests with non-json content type", async () => {
    const server = new HttpCommandServer(new CommandRegistry({ profileMode: "test", testProfileMarkerPresent: true }), {
      authToken: "valid-token"
    });

    await expect(
      server.handleHttpRequest({
        method: "POST",
        contentType: "text/plain",
        headers: { [BRIDGE_AUTH_HEADER]: "valid-token" },
        body: "not json"
      })
    ).resolves.toMatchObject({
      status: 415,
      body: {
        error: {
          code: "COMMAND_CONTENT_TYPE_UNSUPPORTED"
        }
      }
    });
  });

  it("routes valid authenticated JSON command requests through the registry", async () => {
    const registry = new CommandRegistry({ profileMode: "test", testProfileMarkerPresent: true });
    registry.register("audit.list", async () => ({ events: [] }));
    const server = new HttpCommandServer(registry, { authToken: "valid-token" });

    await expect(
      server.handleHttpRequest({
        method: "POST",
        contentType: "application/json",
        headers: { [BRIDGE_AUTH_HEADER]: "valid-token" },
        body: {
          name: "audit.list",
          requestId: "req_4",
          input: { limit: 10 }
        }
      })
    ).resolves.toMatchObject({
      status: 200,
      body: {
        ok: true,
        commandName: "audit.list"
      }
    });
  });
});
