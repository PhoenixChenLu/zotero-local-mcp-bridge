import { randomBytes } from "node:crypto";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import process from "node:process";

const execFileAsync = promisify(execFile);

const projectRoot = process.cwd();
const mode = parseMode(process.argv.slice(2));
const testMode = isLocalTestMode(mode);
const distDir = path.join(projectRoot, "dist");
const stagingDir = path.join(distDir, "zotero-plugin");
const xpiPath = path.join(distDir, "zotero-codex-bridge.xpi");
const tokenPath = path.join(projectRoot, "runtime", "auth", "bridge-token");

await rm(stagingDir, { recursive: true, force: true });
await rm(xpiPath, { force: true });
await mkdir(stagingDir, { recursive: true });

await cp(path.join(projectRoot, "src", "zotero-plugin", "manifest.json"), path.join(stagingDir, "manifest.json"));
await writeFile(
  path.join(stagingDir, "bootstrap.js"),
  (await readFile(path.join(projectRoot, "src", "zotero-plugin", "bootstrap.js"), "utf8"))
    .replaceAll(
      "__ZOTERO_CODEX_BRIDGE_AUTH_TOKEN__",
      testMode ? formatJsStringLiteral(await getOrCreateAuthToken()) : "null"
    )
    .replaceAll(
      "__ZOTERO_CODEX_BRIDGE_RUNTIME_ROOT__",
      testMode ? formatJsStringLiteral(projectRoot) : "null"
    ),
  "utf8"
);

await zipArchive(stagingDir, xpiPath);

async function zipArchive(sourceDir, destinationPath) {
  await execFileAsync("zip", ["-r", destinationPath, "manifest.json", "bootstrap.js"], {
    cwd: sourceDir,
    windowsHide: true
  });
}

async function getOrCreateAuthToken() {
  try {
    const existing = (await readFile(tokenPath, "utf8")).trim();
    if (!/^[A-Za-z0-9_-]{32,}$/.test(existing)) {
      throw new Error(`Stored auth token is malformed: ${tokenPath}`);
    }
    return existing;
  } catch (error) {
    if (!isNodeError(error) || error.code !== "ENOENT") {
      throw error;
    }
  }

  const token = randomBytes(32).toString("base64url");
  await mkdir(path.dirname(tokenPath), { recursive: true });
  await writeFile(tokenPath, `${token}\n`, { encoding: "utf8", flag: "wx" });
  return token;
}

function isNodeError(error) {
  return error instanceof Error && "code" in error;
}

function parseMode(args) {
  const modeArg = args.find((arg) => arg === "--test" || arg === "--dev" || arg.startsWith("--mode="));
  if (modeArg === "--test" || modeArg === "--dev") {
    return modeArg.slice(2);
  }
  if (!modeArg) {
    return "release";
  }
  const explicitMode = modeArg.split("=")[1] ?? "";
  if (!["release", "test", "dev"].includes(explicitMode)) {
    throw new Error(`Unsupported mode: ${modeArg}. Use --mode=release, --mode=dev, or --mode=test`);
  }
  return explicitMode;
}

function isLocalTestMode(mode) {
  return mode === "dev" || mode === "test";
}

function escapeJsString(value) {
  return value.replaceAll("\\", "\\\\");
}

function formatJsStringLiteral(value) {
  return `"${escapeJsString(value)}"`;
}
