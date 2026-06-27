import os from "node:os";
import path from "node:path";

export const BRIDGE_RUNTIME_DIR_ENV = "ZOTERO_CODEX_BRIDGE_RUNTIME_DIR";
export const BRIDGE_RUNTIME_DIR_NAME = "zotero-codex-bridge";
export const AUTH_TOKEN_RELATIVE_PATH = path.join("runtime", "auth", "bridge-token");
export const AUDIT_LOG_RELATIVE_PATH = path.join("runtime", "logs", "audit");
export const BACKUP_RELATIVE_PATH = path.join("runtime", "backups", "zotero-operations");

export type RuntimePathOptions = {
  runtimeRoot?: string;
  projectRoot?: string;
};

export function resolveRuntimeRootDirectory(options: RuntimePathOptions = {}): string {
  if (options.runtimeRoot) {
    return path.resolve(options.runtimeRoot);
  }

  if (options.projectRoot) {
    return path.resolve(options.projectRoot);
  }

  const envRuntimeRoot = process.env[BRIDGE_RUNTIME_DIR_ENV];
  if (envRuntimeRoot) {
    return path.resolve(envRuntimeRoot);
  }

  return defaultSystemRuntimeRoot();
}

export function resolveAuthTokenPath(options: RuntimePathOptions = {}): string {
  return path.join(resolveRuntimeRootDirectory(options), AUTH_TOKEN_RELATIVE_PATH);
}

export function resolveAuditLogPath(options: RuntimePathOptions = {}): string {
  return path.join(resolveRuntimeRootDirectory(options), AUDIT_LOG_RELATIVE_PATH);
}

export function resolveBackupRootPath(options: RuntimePathOptions = {}): string {
  return path.join(resolveRuntimeRootDirectory(options), BACKUP_RELATIVE_PATH);
}

function defaultSystemRuntimeRoot(): string {
  const home = os.homedir();
  if (process.platform === "win32") {
    return path.join(process.env.APPDATA || path.join(home, "AppData", "Roaming"), BRIDGE_RUNTIME_DIR_NAME);
  }

  if (process.platform === "darwin") {
    return path.join(home, "Library", "Application Support", BRIDGE_RUNTIME_DIR_NAME);
  }

  const xdgStateHome = process.env.XDG_STATE_HOME || process.env.XDG_DATA_HOME || path.join(home, ".local", "share");
  return path.join(xdgStateHome, BRIDGE_RUNTIME_DIR_NAME);
}
