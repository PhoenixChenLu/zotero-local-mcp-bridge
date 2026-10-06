export function createReleaseAssetNames(version: string): string[];
export function createSha256Manifest(filePaths: string[]): Promise<string>;
export function createUpdateManifest(manifest: {
  version: string;
  homepage_url: string;
  applications: { zotero: {
    id: string;
    strict_min_version: string;
    strict_max_version: string;
  } };
}): {
  addons: Record<string, { updates: Array<{
    version: string;
    update_link: string;
    applications: { zotero: { strict_min_version: string; strict_max_version: string } };
  }> }>;
};
export function buildReleaseAssets(options?: { projectRoot?: string }): Promise<{
  version: string;
  assets: string[];
  checksumPath: string;
}>;
