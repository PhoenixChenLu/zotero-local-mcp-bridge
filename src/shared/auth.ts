import { ZoteroBridgeError } from "./errors.js";

export const BRIDGE_AUTH_HEADER = "x-zotero-codex-bridge-token";
export const BRIDGE_AUTH_TOKEN_BYTES = 32;

export type BridgeAuthToken = {
  value: string;
  filePath: string;
};

export type HeaderMap = Record<string, string | undefined>;

export function createAuthHeaders(token: string): HeaderMap {
  return {
    [BRIDGE_AUTH_HEADER]: token
  };
}

export function isValidBridgeAuthToken(token: string): boolean {
  return /^[A-Za-z0-9_-]{32,}$/.test(token);
}

export function validateCommandAuth(headers: HeaderMap, expectedToken: string): void {
  const actualToken = getHeader(headers, BRIDGE_AUTH_HEADER);
  if (!actualToken) {
    throw new ZoteroBridgeError("COMMAND_AUTH_REQUIRED", "Command endpoint requires local auth token");
  }

  if (actualToken !== expectedToken) {
    throw new ZoteroBridgeError("COMMAND_AUTH_INVALID", "Command endpoint auth token is invalid");
  }
}

function getHeader(headers: HeaderMap, name: string): string | undefined {
  const direct = headers[name];
  if (direct) {
    return direct;
  }

  const lowerName = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === lowerName) {
      return value;
    }
  }

  return undefined;
}
