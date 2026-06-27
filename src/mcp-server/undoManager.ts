import type { CommandName } from "../shared/commands.js";

export type UndoReverseCommand = {
  name: string;
  input: Record<string, unknown>;
};

export type UndoPlanInput = {
  operationId: string;
  commandName: CommandName;
  reversible?: boolean;
  backupId?: string;
  backupAvailable: boolean;
  reverseCommand?: UndoReverseCommand;
  warnings?: string[];
};

export type UndoPlan = {
  operationId: string;
  commandName: CommandName;
  reversible: boolean;
  backupId?: string;
  backupAvailable: boolean;
  fileRestoreAvailable: boolean;
  reverseCommand?: UndoReverseCommand;
  warnings: string[];
};

export class UndoManager {
  createUndoPlan(input: UndoPlanInput): UndoPlan {
    const reversible = input.reversible ?? true;
    const fileRestoreAvailable = input.backupId === undefined || input.backupAvailable;
    const backupWarnings = fileRestoreAvailable
      ? []
      : ["Linked backup is unavailable; file-level restore is not guaranteed."];

    return {
      operationId: input.operationId,
      commandName: input.commandName,
      reversible,
      backupId: input.backupId,
      backupAvailable: input.backupAvailable,
      fileRestoreAvailable,
      reverseCommand: input.reverseCommand,
      warnings: [...(input.warnings ?? []), ...backupWarnings]
    };
  }
}
