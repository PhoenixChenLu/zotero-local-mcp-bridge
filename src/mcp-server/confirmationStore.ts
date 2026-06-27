import { ZoteroBridgeError } from "../shared/errors.js";

export type ConfirmationStoreOptions = {
  now?: () => Date;
};

export type StoredConfirmation = {
  planId: string;
  inputHash: string;
  confirmationToken: string;
  expiresAt: string;
};

export type ExecuteConfirmation = {
  planId: string;
  inputHash: string;
  confirmationToken: string;
};

export class ConfirmationStore {
  private readonly confirmations = new Map<string, StoredConfirmation>();
  private readonly now: () => Date;

  public constructor(options: ConfirmationStoreOptions = {}) {
    this.now = options.now ?? (() => new Date());
  }

  public save(confirmation: StoredConfirmation): void {
    this.confirmations.set(confirmation.planId, confirmation);
  }

  public validateForExecute(executeConfirmation: ExecuteConfirmation): void {
    const stored = this.confirmations.get(executeConfirmation.planId);
    if (!stored) {
      throw new ZoteroBridgeError("PLAN_NOT_FOUND", "Dry-run plan was not found", {
        planId: executeConfirmation.planId
      });
    }

    if (new Date(stored.expiresAt).getTime() < this.now().getTime()) {
      throw new ZoteroBridgeError("PLAN_EXPIRED", "Dry-run plan has expired", {
        planId: executeConfirmation.planId,
        expiresAt: stored.expiresAt
      });
    }

    if (stored.inputHash !== executeConfirmation.inputHash) {
      throw new ZoteroBridgeError("PLAN_INPUT_CHANGED", "Dry-run input hash does not match execute input", {
        planId: executeConfirmation.planId
      });
    }

    if (stored.confirmationToken !== executeConfirmation.confirmationToken) {
      throw new ZoteroBridgeError("CONFIRMATION_TOKEN_INVALID", "Confirmation token is invalid", {
        planId: executeConfirmation.planId
      });
    }
  }
}
