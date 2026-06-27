import type { CommandName } from "./commands.js";

export type AuditEventStatus = "dry-run" | "executed" | "failed" | "undo-created" | "undo-executed";

export type AuditJsonValue =
  | string
  | number
  | boolean
  | null
  | AuditJsonValue[]
  | { [key: string]: AuditJsonValue };

export type AuditEvent = {
  requestId: string;
  planId?: string;
  commandName: CommandName;
  status: AuditEventStatus;
  timestamp: string;
  summary: string;
  affected: {
    zoteroItemKeys: string[];
    collectionKeys: string[];
    attachmentKeys: string[];
    filePaths: string[];
    tags: string[];
  };
  error?: {
    code: string;
    message: string;
  };
  paramsSummary?: Record<string, AuditJsonValue>;
  before?: Record<string, AuditJsonValue>;
  after?: Record<string, AuditJsonValue>;
};
