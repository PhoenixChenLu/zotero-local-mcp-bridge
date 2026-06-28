import type { ZoteroLocalCommandResult } from "../shared/commands.js";
import { validateCommandAuth, type HeaderMap } from "../shared/auth.js";
import { ZoteroBridgeError } from "../shared/errors.js";
import type { CommandRegistry, PluginCommandRequest } from "./commandRegistry.js";

export const DEFAULT_PLUGIN_HTTP_HOST = "127.0.0.1";
export const DEFAULT_PLUGIN_HTTP_PORT = 23119;
export const PLUGIN_HTTP_HEALTH_PATH = "/zotero-local-mcp-bridge/health";
export const PLUGIN_HTTP_COMMAND_PATH = "/zotero-local-mcp-bridge/command";

export type HttpJsonResponse = {
  status: number;
  body:
    | ZoteroLocalCommandResult
    | {
        ok: false;
        commandName: string;
        requestId: string;
        affected: ZoteroLocalCommandResult["affected"];
        error: {
          code: string;
          message: string;
        };
      };
};

export type HttpCommandServerOptions = {
  authToken?: string;
};

export type PluginHttpRequest = {
  method: string;
  contentType?: string;
  headers: HeaderMap;
  body: unknown;
};

export class HttpCommandServer {
  private readonly registry: CommandRegistry;
  private readonly authToken?: string;

  public constructor(registry: CommandRegistry, options: HttpCommandServerOptions = {}) {
    this.registry = registry;
    this.authToken = options.authToken;
  }

  public async handleHttpRequest(request: PluginHttpRequest): Promise<HttpJsonResponse> {
    try {
      validateMethod(request.method);
      validateContentType(request.contentType);
      if (this.authToken) {
        validateCommandAuth(request.headers, this.authToken);
      }
      return await this.handleJsonRequest(asPluginCommandRequest(request.body));
    } catch (error) {
      const bridgeError = toBridgeError(error);
      return {
        status: statusForErrorCode(bridgeError.code),
        body: errorResponse(asPartialCommandRequest(request.body), bridgeError)
      };
    }
  }

  public async handleJsonRequest(request: PluginCommandRequest): Promise<HttpJsonResponse> {
    try {
      const result = await this.registry.execute(request);
      return {
        status: 200,
        body: result
      };
    } catch (error) {
      const bridgeError = toBridgeError(error);
      return {
        status: statusForErrorCode(bridgeError.code),
        body: errorResponse(request, bridgeError)
      };
    }
  }
}

function validateMethod(method: string): void {
  if (method.toUpperCase() !== "POST") {
    throw new ZoteroBridgeError("COMMAND_METHOD_NOT_ALLOWED", "Command endpoint only accepts POST");
  }
}

function validateContentType(contentType: string | undefined): void {
  if (!contentType?.toLowerCase().startsWith("application/json")) {
    throw new ZoteroBridgeError("COMMAND_CONTENT_TYPE_UNSUPPORTED", "Command endpoint only accepts application/json");
  }
}

function asPluginCommandRequest(body: unknown): PluginCommandRequest {
  if (!isRecord(body) || typeof body.name !== "string" || typeof body.requestId !== "string") {
    throw new ZoteroBridgeError("COMMAND_REQUEST_INVALID", "Command request body is invalid");
  }

  return {
    name: body.name,
    requestId: body.requestId,
    input: body.input
  };
}

function asPartialCommandRequest(body: unknown): Pick<PluginCommandRequest, "name" | "requestId"> {
  if (!isRecord(body)) {
    return { name: "unknown", requestId: "unknown" };
  }

  return {
    name: typeof body.name === "string" ? body.name : "unknown",
    requestId: typeof body.requestId === "string" ? body.requestId : "unknown"
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function errorResponse(
  request: Pick<PluginCommandRequest, "name" | "requestId">,
  bridgeError: ZoteroBridgeError
): Exclude<HttpJsonResponse["body"], ZoteroLocalCommandResult> {
  return {
    ok: false,
    commandName: request.name,
    requestId: request.requestId,
    affected: {
      zoteroItemKeys: [],
      collectionKeys: [],
      attachmentKeys: [],
      tags: []
    },
    error: {
      code: bridgeError.code,
      message: bridgeError.message
    }
  };
}

function toBridgeError(error: unknown): ZoteroBridgeError {
  if (error instanceof ZoteroBridgeError) {
    return error;
  }

  const message = error instanceof Error ? error.message : String(error);
  return new ZoteroBridgeError("PLUGIN_COMMAND_FAILED", message);
}

function statusForErrorCode(code: string): number {
  if (code === "COMMAND_AUTH_REQUIRED") {
    return 401;
  }

  if (code === "COMMAND_AUTH_INVALID" || code === "PROFILE_NOT_TEST") {
    return 403;
  }

  if (code === "COMMAND_CONTENT_TYPE_UNSUPPORTED") {
    return 415;
  }

  if (code === "COMMAND_METHOD_NOT_ALLOWED") {
    return 405;
  }

  if (code === "UNKNOWN_COMMAND" || code === "COMMAND_NOT_REGISTERED") {
    return 400;
  }

  return 500;
}
