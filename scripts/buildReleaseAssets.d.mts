export function createReleaseAssetNames(version: string): string[];
export function createSha256Manifest(filePaths: string[]): Promise<string>;
export function buildReleaseAssets(options?: { projectRoot?: string }): Promise<{
  version: string;
  assets: string[];
  checksumPath: string;
}>;
