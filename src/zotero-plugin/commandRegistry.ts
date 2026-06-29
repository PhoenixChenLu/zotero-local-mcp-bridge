import type {
  CommandName,
  ProfileMode,
  ZoteroLocalCommandResult
} from "../shared/commands.js";
import {
  FIRST_VERSION_COMMAND_NAMES,
  isProfileWriteCommand
} from "../shared/commands.js";
import { ZoteroBridgeError } from "../shared/errors.js";
import { ensureProfileWrite } from "./profileGuard.js";

export type PluginCommandRequest<TInput = unknown> = {
  name: string;
  requestId: string;
  input: TInput;
};

export type PluginCommandHandler<TInput = unknown, TData = unknown> = (
  input: TInput,
  request: PluginCommandRequest<TInput>
) => Promise<TData> | TData;

export type CommandRegistryOptions = {
  profileMode: ProfileMode;
  testProfileMarkerPresent?: boolean;
};

export class CommandRegistry {
  private readonly handlers = new Map<CommandName, PluginCommandHandler>();
  private readonly profileMode: ProfileMode;
  private readonly testProfileMarkerPresent: boolean;

  public constructor(options: CommandRegistryOptions) {
    this.profileMode = options.profileMode;
    this.testProfileMarkerPresent = options.testProfileMarkerPresent ?? false;
  }

  public register<TInput, TData>(
    commandName: CommandName,
    handler: PluginCommandHandler<TInput, TData>
  ): void {
    this.handlers.set(commandName, handler as PluginCommandHandler);
  }

  public async execute(request: PluginCommandRequest): Promise<ZoteroLocalCommandResult> {
    if (!isKnownCommand(request.name)) {
      throw new ZoteroBridgeError("UNKNOWN_COMMAND", `Unknown command: ${request.name}`, {
        commandName: request.name
      });
    }

    if (isProfileWriteCommand(request.name)) {
      ensureProfileWrite(this.profileMode, { markerPresent: this.testProfileMarkerPresent });
    }

    const handler = this.handlers.get(request.name);
    if (!handler) {
      throw new ZoteroBridgeError("COMMAND_NOT_REGISTERED", `Command is not registered: ${request.name}`, {
        commandName: request.name
      });
    }

    const data = await handler(request.input, request);

    return {
      ok: true,
      commandName: request.name,
      requestId: request.requestId,
      affected: {
        zoteroItemKeys: [],
        collectionKeys: [],
        attachmentKeys: [],
        tags: []
      },
      data
    };
  }
}

function isKnownCommand(commandName: string): commandName is CommandName {
  return FIRST_VERSION_COMMAND_NAMES.includes(commandName as CommandName);
}
