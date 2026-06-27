import type { CommandName, ZoteroLocalCommand, ZoteroLocalCommandResult } from "../shared/commands.js";
import { createAuthHeaders } from "../shared/auth.js";
import { ZoteroBridgeError } from "../shared/errors.js";
import {
  DEFAULT_PLUGIN_HTTP_HOST,
  DEFAULT_PLUGIN_HTTP_PORT,
  PLUGIN_HTTP_COMMAND_PATH,
  PLUGIN_HTTP_HEALTH_PATH
} from "../zotero-plugin/httpCommandServer.js";

export type ZoteroPluginTransport = (command: ZoteroLocalCommand) => Promise<ZoteroLocalCommandResult>;

export type ZoteroPluginClientOptions = {
  endpoint?: string;
  healthEndpoint?: string;
  authToken?: string;
  transport?: ZoteroPluginTransport;
};

export class ZoteroPluginClient {
  private readonly endpoint: string;
  private readonly healthEndpoint: string;
  private readonly authToken?: string;
  private readonly transport?: ZoteroPluginTransport;

  constructor(options: ZoteroPluginClientOptions = {}) {
    const origin = `http://${DEFAULT_PLUGIN_HTTP_HOST}:${DEFAULT_PLUGIN_HTTP_PORT}`;
    this.endpoint = options.endpoint ?? `${origin}${PLUGIN_HTTP_COMMAND_PATH}`;
    this.healthEndpoint = options.healthEndpoint ?? `${origin}${PLUGIN_HTTP_HEALTH_PATH}`;
    this.authToken = options.authToken;
    this.transport = options.transport;
  }

  get commandEndpoint(): string {
    return this.endpoint;
  }

  get healthCheckEndpoint(): string {
    return this.healthEndpoint;
  }

  async health(): Promise<string> {
    const response = await fetch(this.healthEndpoint);
    const body = await response.text();
    if (!response.ok) {
      throw new ZoteroBridgeError("PLUGIN_HEALTH_CHECK_FAILED", `Plugin health check failed with ${response.status}`);
    }

    return body;
  }

  async execute<TInput>(command: ZoteroLocalCommand<TInput>): Promise<ZoteroLocalCommandResult> {
    if (this.transport) {
      return this.transport(command);
    }

    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(this.authToken ? createAuthHeaders(this.authToken) : {})
      },
      body: JSON.stringify(command)
    });
    const body = (await response.json()) as ZoteroLocalCommandResult;

    if (!response.ok || !body.ok) {
      throw new ZoteroBridgeError(
        body.error?.code ?? "PLUGIN_HTTP_COMMAND_FAILED",
        body.error?.message ?? `Plugin command ${command.name} failed`
      );
    }

    return body;
  }
}

export function createLocalCommand<TInput>(name: CommandName, input: TInput): ZoteroLocalCommand<TInput> {
  return { name, input };
}
