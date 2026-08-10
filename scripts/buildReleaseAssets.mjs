import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { buildMcpBundle } from "./buildMcpBundle.mjs";

const execFileAsync = promisify(execFile);
const scriptPath = fileURLToPath(import.meta.url);
const defaultProjectRoot = path.resolve(path.dirname(scriptPath), "..");

export function createReleaseAssetNames(version) {
  return [
    "zotero-local-mcp-bridge.xpi",
    "updates.json",
    `zotero-local-mcp-bridge-${version}.mcpb`,
    `zotero-local-mcp-bridge-stdio-adapter-${version}.tgz`,
    `zotero-local-mcp-bridge-skill-en-v${version}.zip`,
    `zotero-local-mcp-bridge-skill-zh-cn-v${version}.zip`,
    `release-notes-v${version}.md`
  ];
}

export async function createSha256Manifest(filePaths) {
  const lines = [];
  for (const filePath of filePaths) {
    const digest = createHash("sha256").update(await readFile(filePath)).digest("hex");
    lines.push(`${digest}  ${path.basename(filePath)}`);
  }
  return `${lines.join("\n")}\n`;
}

export async function buildReleaseAssets(options = {}) {
  const projectRoot = options.projectRoot || defaultProjectRoot;
  const adapterPackage = JSON.parse(await readFile(path.join(projectRoot, "packages", "stdio-adapter", "package.json"), "utf8"));
  const version = adapterPackage.version;
  const distDir = path.join(projectRoot, "dist");
  const assetNames = createReleaseAssetNames(version);

  await execNode(projectRoot, "scripts/buildZoteroPlugin.mjs", "--mode=release");
  await execNpm(projectRoot, "run", "build:stdio-adapter");
  await buildMcpBundle({ projectRoot });

  const tarballPath = path.join(distDir, assetNames[3]);
  await rm(tarballPath, { force: true });
  await execNpm(projectRoot, "pack", "./packages/stdio-adapter", "--pack-destination", "dist", "--json");

  await zipDirectory(
    path.join(projectRoot, "skills"),
    "zotero-local-mcp-bridge",
    path.join(distDir, assetNames[4])
  );
  await zipDirectory(
    path.join(projectRoot, "skills"),
    "zotero-local-mcp-bridge-zh-cn",
    path.join(distDir, assetNames[5])
  );

  const releaseTemplate = await readFile(path.join(projectRoot, ".github", "RELEASE_TEMPLATE.md"), "utf8");
  await writeFile(path.join(distDir, assetNames[6]), releaseTemplate.replaceAll("<version>", version), "utf8");

  const assets = assetNames.map((name) => path.join(distDir, name));
  const checksumPath = path.join(distDir, `checksums-v${version}.txt`);
  await writeFile(checksumPath, await createSha256Manifest(assets), "utf8");
  return { version, assets, checksumPath };
}

async function execNode(projectRoot, ...args) {
  await execFileAsync(process.execPath, args, { cwd: projectRoot, windowsHide: true });
}

async function execNpm(projectRoot, ...args) {
  if (process.platform === "win32") {
    await execFileAsync(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", "npm", ...args], {
      cwd: projectRoot,
      windowsHide: true
    });
    return;
  }
  await execFileAsync("npm", args, { cwd: projectRoot, windowsHide: true });
}

async function zipDirectory(parentDir, directoryName, destination) {
  await rm(destination, { force: true });
  try {
    await execFileAsync("zip", ["-r", destination, directoryName], { cwd: parentDir, windowsHide: true });
    return;
  } catch (error) {
    if (!isNodeError(error) || error.code !== "ENOENT" || process.platform !== "win32") {
      throw error;
    }
  }

  await execFileAsync(
    "powershell",
    [
      "-NoProfile",
      "-NonInteractive",
      "-Command",
      "Compress-Archive -LiteralPath $args[0] -DestinationPath $args[1] -Force",
      path.join(parentDir, directoryName),
      destination
    ],
    { cwd: parentDir, windowsHide: true }
  );
}

function isNodeError(error) {
  return error instanceof Error && "code" in error;
}

if (path.resolve(process.argv[1] || "") === scriptPath) {
  buildReleaseAssets()
    .then((result) => console.log(`Built ${result.assets.length + 1} release assets for ${result.version}`))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    });
}
