export type PackageLock = {
  packages?: Record<string, { version?: string; dev?: boolean; optional?: boolean }>;
};

export function createMcpBundleManifest(version: string): Record<string, unknown>;
export function listProductionPackagePaths(lockfile: PackageLock): string[];
export function mcpBundleFilename(version: string): string;
export function buildMcpBundle(options?: { projectRoot?: string }): Promise<{
  archivePath: string;
  stagingDir: string;
  version: string;
}>;
