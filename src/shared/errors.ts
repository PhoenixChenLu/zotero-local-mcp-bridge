export class ZoteroBridgeError extends Error {
  public readonly code: string;
  public readonly details: Record<string, unknown> | undefined;

  public constructor(code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "ZoteroBridgeError";
    this.code = code;
    this.details = details;
  }
}
