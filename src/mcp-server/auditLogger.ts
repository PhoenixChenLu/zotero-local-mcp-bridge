import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

import type { AuditEvent } from "../shared/audit.js";
import { resolveAuditLogPath, type RuntimePathOptions } from "./runtimePaths.js";

export type AuditLoggerOptions = RuntimePathOptions;

export type AuditWriteResult = {
  filePath: string;
};

export class AuditLogger {
  readonly auditRoot: string;

  constructor(options: AuditLoggerOptions) {
    this.auditRoot = resolveAuditLogPath(options);
  }

  async write(event: AuditEvent): Promise<AuditWriteResult> {
    await mkdir(this.auditRoot, { recursive: true });
    const filePath = path.join(this.auditRoot, `${event.timestamp.slice(0, 10)}.jsonl`);
    await appendFile(filePath, `${JSON.stringify(event)}\n`, "utf8");
    return { filePath };
  }
}
