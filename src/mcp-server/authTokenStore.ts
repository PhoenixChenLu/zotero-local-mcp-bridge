import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { BridgeAuthToken } from "../shared/auth.js";
import { BRIDGE_AUTH_TOKEN_BYTES, isValidBridgeAuthToken } from "../shared/auth.js";
import { ZoteroBridgeError } from "../shared/errors.js";
import { resolveAuthTokenPath, type RuntimePathOptions } from "./runtimePaths.js";

export type AuthTokenStoreOptions = RuntimePathOptions & {
  tokenFilePath?: string;
};

export class AuthTokenStore {
  private readonly tokenFilePath: string;

  public constructor(options: AuthTokenStoreOptions = {}) {
    this.tokenFilePath = options.tokenFilePath ? path.resolve(options.tokenFilePath) : resolveAuthTokenPath(options);
  }

  public async getOrCreateToken(): Promise<BridgeAuthToken> {
    const existing = await this.readToken();
    if (existing) {
      return {
        value: existing,
        filePath: this.tokenFilePath
      };
    }

    const token = randomBytes(BRIDGE_AUTH_TOKEN_BYTES).toString("base64url");
    await mkdir(path.dirname(this.tokenFilePath), { recursive: true });
    await writeFile(this.tokenFilePath, `${token}\n`, { encoding: "utf8", flag: "wx" });

    return {
      value: token,
      filePath: this.tokenFilePath
    };
  }

  private async readToken(): Promise<string | undefined> {
    try {
      const token = (await readFile(this.tokenFilePath, "utf8")).trim();
      if (!isValidBridgeAuthToken(token)) {
        throw new ZoteroBridgeError("COMMAND_AUTH_TOKEN_INVALID", "Stored command auth token is malformed");
      }
      return token;
    } catch (error) {
      if (isNodeError(error) && error.code === "ENOENT") {
        return undefined;
      }
      throw error;
    }
  }
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
