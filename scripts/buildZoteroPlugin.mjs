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
const xpiPath = path.join(distDir, "zotero-local-mcp-bridge.xpi");
const legacyXpiPath = path.join(distDir, "zotero-codex-bridge.xpi");
const tokenPath = path.join(projectRoot, "runtime", "auth", "bridge-token");
const pluginStaticFiles = ["manifest.json", "prefs.js", "preferences.xhtml", "preferences.js", "preferences.css"];
const localeResourceName = "zotero-local-mcp-bridge.ftl";
const localeSourceDir = path.join(projectRoot, "src", "zotero-plugin", "locale");

await rm(stagingDir, { recursive: true, force: true });
await rm(xpiPath, { force: true });
await rm(legacyXpiPath, { force: true });
await mkdir(stagingDir, { recursive: true });

for (const filename of pluginStaticFiles) {
  await cp(path.join(projectRoot, "src", "zotero-plugin", filename), path.join(stagingDir, filename));
}

await writeFile(
  path.join(stagingDir, "preferences.js"),
  await replaceBuildPlaceholders(await readFile(path.join(projectRoot, "src", "zotero-plugin", "preferences.js"), "utf8")),
  "utf8"
);

await writeFile(
  path.join(stagingDir, "bootstrap.js"),
  await replaceBuildPlaceholders(await readFile(path.join(projectRoot, "src", "zotero-plugin", "bootstrap.js"), "utf8")),
  "utf8"
);

await stageLocaleFiles();
await zipArchive(stagingDir, xpiPath);

async function replaceBuildPlaceholders(source) {
  return source
    .replaceAll(
      "__ZOTERO_LOCAL_MCP_BRIDGE_AUTH_TOKEN__",
      testMode ? formatJsStringLiteral(await getOrCreateAuthToken()) : "null"
    )
    .replaceAll(
      "__ZOTERO_LOCAL_MCP_BRIDGE_RUNTIME_ROOT__",
      testMode ? formatJsStringLiteral(projectRoot) : "null"
    );
}

async function zipArchive(sourceDir, destinationPath) {
  await execFileAsync("zip", ["-r", destinationPath, "manifest.json", "bootstrap.js", "prefs.js", "preferences.xhtml", "preferences.js", "preferences.css", "locale"], {
    cwd: sourceDir,
    windowsHide: true
  });
}

async function stageLocaleFiles() {
  const supportedLocales = JSON.parse(await readFile(path.join(localeSourceDir, "supportedLocales.json"), "utf8"));

  for (const locale of supportedLocales) {
    const localeDir = path.join(stagingDir, "locale", locale);
    await mkdir(localeDir, { recursive: true });
    await writeFile(path.join(localeDir, localeResourceName), await readLocaleResource(locale), "utf8");
  }
}

async function readLocaleResource(locale) {
  try {
    return await readFile(path.join(localeSourceDir, locale, localeResourceName), "utf8");
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      throw new Error(`Missing Zotero Local MCP Bridge localization resource for ${locale}`);
    }
    throw error;
  }
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
