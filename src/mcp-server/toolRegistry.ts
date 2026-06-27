import {
  COMMAND_DEFINITIONS,
  type CommandDefinition,
  type CommandName,
  isWriteCommand,
  type ZoteroLocalCommandResult
} from "../shared/commands.js";
import type { AuditLogger, AuditWriteResult } from "./auditLogger.js";
import type { CreatedDryRunPlan } from "./dryRunPlanner.js";
import { DryRunPlanner, hashInput } from "./dryRunPlanner.js";
import { ConfirmationStore } from "./confirmationStore.js";
import { ZoteroBridgeError } from "../shared/errors.js";
import type { UndoPlan } from "./undoManager.js";
import { UndoManager } from "./undoManager.js";
import { createLocalCommand, type ZoteroPluginClient } from "./zoteroPluginClient.js";

export type McpToolMode = "dry-run" | "execute";

export type McpToolDescriptor = {
  name: string;
  commandName: CommandName;
  write: boolean;
  inputFields: readonly string[];
};

export type McpToolCall = {
  commandName: CommandName;
  input: unknown;
  mode?: McpToolMode;
  confirmation?: {
    planId: string;
    confirmationToken: string;
  };
};

export type McpToolDryRunResult = {
  mode: "dry-run";
  plan: CreatedDryRunPlan;
};

export type McpToolExecuteResult = {
  mode: "execute";
  pluginResult: ZoteroLocalCommandResult;
  audit?: AuditWriteResult;
  undoPlans: UndoPlan[];
};

export type McpToolCallResult = McpToolDryRunResult | McpToolExecuteResult;

export type McpToolRegistryOptions = {
  pluginClient: ZoteroPluginClient;
  dryRunPlanner?: DryRunPlanner;
  confirmationStore?: ConfirmationStore;
  auditLogger?: AuditLogger;
  undoManager?: UndoManager;
  now?: () => Date;
};

export class McpToolRegistry {
  private readonly pluginClient: ZoteroPluginClient;
  private readonly dryRunPlanner: DryRunPlanner;
  private readonly confirmationStore: ConfirmationStore;
  private readonly auditLogger?: AuditLogger;
  private readonly undoManager: UndoManager;
  private readonly now: () => Date;

  constructor(options: McpToolRegistryOptions) {
    this.pluginClient = options.pluginClient;
    this.dryRunPlanner = options.dryRunPlanner ?? new DryRunPlanner();
    this.confirmationStore = options.confirmationStore ?? new ConfirmationStore();
    this.auditLogger = options.auditLogger;
    this.undoManager = options.undoManager ?? new UndoManager();
    this.now = options.now ?? (() => new Date());
  }

  listTools(): McpToolDescriptor[] {
    return COMMAND_DEFINITIONS.map((definition) => toToolDescriptor(definition));
  }

  async callTool(call: McpToolCall): Promise<McpToolCallResult> {
    if (!isWriteCommand(call.commandName)) {
      const pluginResult = await this.pluginClient.execute(createLocalCommand(call.commandName, call.input));
      return { mode: "execute", pluginResult, undoPlans: [] };
    }

    if (call.mode !== "execute") {
      const plan = this.dryRunPlanner.createPlan({
        operation: call.commandName,
        input: call.input,
        riskLevel: riskForCommand(call.commandName),
        resolvedTargets: resolveTargets(call.input),
        warnings: warningsForInput(call.input),
        requiresBackup: true
      });
      this.confirmationStore.save({
        planId: plan.planId,
        inputHash: plan.inputHash,
        confirmationToken: plan.confirmation.token,
        expiresAt: plan.confirmation.expiresAt
      });
      return { mode: "dry-run", plan };
    }

    if (!call.confirmation) {
      throw new ZoteroBridgeError("CONFIRMATION_REQUIRED", "Write execute requires dry-run confirmation");
    }

    this.confirmationStore.validateForExecute({
      planId: call.confirmation.planId,
      inputHash: hashInput(call.input),
      confirmationToken: call.confirmation.confirmationToken
    });

    try {
      const pluginResult = await this.pluginClient.execute(createLocalCommand(call.commandName, call.input));
      const audit = await this.writeAudit({
        call,
        planId: call.confirmation.planId,
        status: "executed",
        pluginResult
      });
      return {
        mode: "execute",
        pluginResult,
        audit,
        undoPlans: this.createUndoPlans(call.commandName, pluginResult)
      };
    } catch (error) {
      await this.writeAudit({
        call,
        planId: call.confirmation.planId,
        status: "failed",
        error
      });
      throw error;
    }
  }

  private async writeAudit(input: {
    call: McpToolCall;
    planId: string;
    status: "executed" | "failed";
    pluginResult?: ZoteroLocalCommandResult;
    error?: unknown;
  }): Promise<AuditWriteResult | undefined> {
    if (!this.auditLogger) {
      return undefined;
    }

    const affected = input.pluginResult?.affected ?? {
      zoteroItemKeys: [],
      collectionKeys: [],
      attachmentKeys: [],
      tags: []
    };
    const error = input.error instanceof ZoteroBridgeError
      ? input.error
      : input.error instanceof Error
        ? new ZoteroBridgeError("PLUGIN_COMMAND_FAILED", input.error.message)
        : undefined;

    return this.auditLogger.write({
      requestId: input.pluginResult?.requestId ?? `mcp_${input.planId}`,
      planId: input.planId,
      commandName: input.call.commandName,
      status: input.status,
      timestamp: this.now().toISOString(),
      summary: `${input.status} ${input.call.commandName}`,
      affected: {
        zoteroItemKeys: affected.zoteroItemKeys,
        collectionKeys: affected.collectionKeys,
        attachmentKeys: affected.attachmentKeys,
        filePaths: resolveTargets(input.call.input).filePaths,
        tags: affected.tags
      },
      error: error ? { code: error.code, message: error.message } : undefined,
      paramsSummary: summarizeParams(input.call.input),
      after: input.pluginResult?.data && typeof input.pluginResult.data === "object"
        ? (input.pluginResult.data as Record<string, never>)
        : undefined
    });
  }

  private createUndoPlans(commandName: CommandName, pluginResult: ZoteroLocalCommandResult): UndoPlan[] {
    if (commandName === "collection.create") {
      return pluginResult.affected.collectionKeys.map((collectionKey) =>
        this.undoManager.createUndoPlan({
          operationId: `${pluginResult.requestId}:${collectionKey}`,
          commandName,
          reversible: false,
          backupAvailable: true,
          warnings: ["Collection deletion is disabled in the first release, so this operation is not automatically undoable."],
          reverseCommand: {
            name: "collection.deleteCreated.disabled",
            input: { collectionKey }
          }
        })
      );
    }

    return [];
  }
}

function toToolDescriptor(definition: CommandDefinition): McpToolDescriptor {
  return {
    name: `zotero_${definition.name.replaceAll(".", "_")}`,
    commandName: definition.name,
    write: definition.write,
    inputFields: definition.inputFields
  };
}

function riskForCommand(commandName: CommandName): CreatedDryRunPlan["riskLevel"] {
  if (commandName.startsWith("attachment.")) {
    return "medium";
  }

  return "low";
}

function resolveTargets(input: unknown): CreatedDryRunPlan["resolvedTargets"] {
  const object = asObject(input);
  return {
    zoteroItemKeys: stringsFrom(object, "zoteroItemKey", "zoteroItemKeys", "targetZoteroItemKey"),
    collectionKeys: stringsFrom(object, "collectionKey", "parentCollectionKey"),
    attachmentKeys: stringsFrom(object, "attachmentKey"),
    filePaths: stringsFrom(object, "filePath"),
    tags: stringsFrom(object, "addTags", "removeTags")
  };
}

function warningsForInput(input: unknown): string[] {
  const object = asObject(input);
  if (object.attachmentMode === "linked") {
    return ["Linked files can break if the original path is moved or deleted."];
  }

  return [];
}

function summarizeParams(input: unknown): Record<string, string | number | boolean | null> {
  const object = asObject(input);
  return Object.fromEntries(
    Object.entries(object)
      .filter(([, value]) => ["string", "number", "boolean"].includes(typeof value) || value === null)
      .map(([key, value]) => [key, value as string | number | boolean | null])
  );
}

function asObject(input: unknown): Record<string, unknown> {
  return input && typeof input === "object" && !Array.isArray(input) ? (input as Record<string, unknown>) : {};
}

function stringsFrom(object: Record<string, unknown>, ...keys: string[]): string[] {
  return keys.flatMap((key) => {
    const value = object[key];
    if (typeof value === "string" && value.length > 0) {
      return [value];
    }

    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === "string" && item.length > 0);
    }

    return [];
  });
}
