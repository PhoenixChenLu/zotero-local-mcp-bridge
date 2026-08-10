import { execFile } from "node:child_process";
import { access, cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const scriptPath = fileURLToPath(import.meta.url);
const defaultProjectRoot = path.resolve(path.dirname(scriptPath), "..");

export function createMcpBundleManifest(version) {
  return {
    manifest_version: "0.3",
    name: "zotero-local-mcp-bridge",
    display_name: "Zotero Local MCP Bridge",
    version,
    description: "Connect Claude Desktop to the local Zotero Local MCP Bridge plugin endpoint.",
    long_description: "A local stdio compatibility bundle for the MCP endpoint hosted inside the Zotero Local MCP Bridge plugin. Zotero Desktop and the Zotero plugin must be installed separately.",
    author: {
      name: "PhoenixChenLu",
      url: "https://github.com/PhoenixChenLu"
    },
    repository: {
      type: "git",
      url: "https://github.com/PhoenixChenLu/zotero-local-mcp-bridge.git"
    },
    homepage: "https://github.com/PhoenixChenLu/zotero-local-mcp-bridge",
    documentation: "https://github.com/PhoenixChenLu/zotero-local-mcp-bridge#quick-start",
    support: "https://github.com/PhoenixChenLu/zotero-local-mcp-bridge/issues",
    license: "AGPL-3.0-or-later",
    keywords: ["zotero", "mcp", "research", "local-first"],
    tools_generated: true,
    server: {
      type: "node",
      entry_point: "server/index.js",
      mcp_config: {
        command: "node",
        args: ["${__dirname}/server/index.js"]
      }
    },
    compatibility: {
      platforms: ["darwin", "win32"],
      runtimes: {
        node: ">=22.0.0"
      }
    }
  };
}

export function listProductionPackagePaths(lockfile) {
  return Object.entries(lockfile.packages || {})
    .filter(([packagePath, metadata]) => packagePath.startsWith("node_modules/") && metadata.dev !== true)
    .map(([packagePath]) => packagePath)
    .sort();
}

export function mcpBundleFilename(version) {
  return `zotero-local-mcp-bridge-${version}.mcpb`;
}

export async function buildMcpBundle(options = {}) {
  const projectRoot = options.projectRoot || defaultProjectRoot;
  const adapterPackage = JSON.parse(await readFile(path.join(projectRoot, "packages", "stdio-adapter", "package.json"), "utf8"));
  const lockfile = JSON.parse(await readFile(path.join(projectRoot, "package-lock.json"), "utf8"));
  const stagingDir = path.join(projectRoot, "dist", "mcp-bundle");
  const serverDir = path.join(stagingDir, "server");
  const archivePath = path.join(projectRoot, "dist", mcpBundleFilename(adapterPackage.version));
  const adapterEntry = path.join(projectRoot, "packages", "stdio-adapter", "dist", "index.js");

  await access(adapterEntry);
  await rm(stagingDir, { recursive: true, force: true });
  await rm(archivePath, { force: true });
  await mkdir(serverDir, { recursive: true });

  await writeFile(
    path.join(stagingDir, "manifest.json"),
    `${JSON.stringify(createMcpBundleManifest(adapterPackage.version), null, 2)}\n`,
    "utf8"
  );
  await writeFile(
    path.join(serverDir, "package.json"),
    `${JSON.stringify({ name: "zotero-local-mcp-bridge-mcpb-server", version: adapterPackage.version, private: true, type: "module" }, null, 2)}\n`,
    "utf8"
  );
  await cp(adapterEntry, path.join(serverDir, "index.js"));
  await cp(path.join(projectRoot, "packages", "mcp-bundle", "README.md"), path.join(stagingDir, "README.md"));
  await cp(path.join(projectRoot, "LICENSE"), path.join(stagingDir, "LICENSE"));

  for (const packagePath of listProductionPackagePaths(lockfile)) {
    const source = path.join(projectRoot, packagePath);
    if (!(await pathExists(source))) {
      continue;
    }
    await cp(source, path.join(serverDir, packagePath), { recursive: true });
  }

  await zipArchive(stagingDir, archivePath);
  return { archivePath, stagingDir, version: adapterPackage.version };
}

async function zipArchive(stagingDir, archivePath) {
  const entries = ["manifest.json", "server", "README.md", "LICENSE"];
  try {
    await execFileAsync("zip", ["-r", archivePath, ...entries], {
      cwd: stagingDir,
      windowsHide: true
    });
    return;
  } catch (error) {
    if (!isNodeError(error) || error.code !== "ENOENT" || process.platform !== "win32") {
      throw error;
    }
  }

  const script = path.join(stagingDir, "__compress-mcpb.ps1");
  await writeFile(
    script,
    [
      "param([string] $destination, [Parameter(ValueFromRemainingArguments = $true)] [string[]] $paths)",
      "Compress-Archive -LiteralPath $paths -DestinationPath $destination -Force"
    ].join("\n"),
    "utf8"
  );
  try {
    await execFileAsync("powershell", ["-NoProfile", "-NonInteractive", "-File", script, archivePath, ...entries], {
      cwd: stagingDir,
      windowsHide: true
    });
  } finally {
    await rm(script, { force: true });
  }
}

async function pathExists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

function isNodeError(error) {
  return error instanceof Error && "code" in error;
}

if (path.resolve(process.argv[1] || "") === scriptPath) {
  buildMcpBundle()
    .then((result) => console.log(`Built MCP Bundle ${result.version}: ${result.archivePath}`))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    });
}
