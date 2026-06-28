#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const defaultXpiPath = resolve(repoRoot, "dist", "zotero-local-mcp-bridge.xpi");

function parseArgs(argv) {
  const args = {
    build: false,
    openFolder: true,
    openXpi: false,
    xpiPath: defaultXpiPath,
    zoteroPath: "",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--build") {
      args.build = true;
    } else if (arg === "--no-open-folder") {
      args.openFolder = false;
    } else if (arg === "--open-xpi") {
      args.openXpi = true;
    } else if (arg === "--xpi") {
      args.xpiPath = resolve(argv[index + 1] ?? "");
      index += 1;
    } else if (arg === "--zotero") {
      args.zoteroPath = resolve(argv[index + 1] ?? "");
      index += 1;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    shell: process.platform === "win32",
    stdio: "inherit",
    ...options,
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed`);
  }
}

function openPath(targetPath) {
  if (process.platform === "win32") {
    run("powershell", [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-Command",
      "Start-Process -LiteralPath $args[0]",
      targetPath,
    ]);
    return;
  }

  if (process.platform === "darwin") {
    run("open", [targetPath]);
    return;
  }

  run("xdg-open", [targetPath]);
}

function launchZotero(zoteroPath) {
  if (!zoteroPath) {
    return;
  }
  if (!existsSync(zoteroPath)) {
    throw new Error(`Zotero executable not found: ${zoteroPath}`);
  }
  openPath(zoteroPath);
}

function printHelp() {
  console.log(`Zotero Local MCP Bridge installer helper

Usage:
  npm run install:local -- [options]

Options:
  --build              Build release XPI before opening the installer folder
  --xpi <path>         Use a specific XPI path
  --open-xpi           Ask the OS to open the XPI file directly
  --no-open-folder     Do not open the folder containing the XPI
  --zotero <path>      Launch a specific Zotero executable
  -h, --help           Show this help
`);
}

function printNextSteps(xpiPath) {
  console.log("");
  console.log("Next steps:");
  console.log("1. Open Zotero.");
  console.log("2. Go to Tools -> Plugins.");
  console.log("3. Install the XPI file:");
  console.log(`   ${xpiPath}`);
  console.log("4. Restart Zotero.");
  console.log("5. Check the plugin-hosted MCP endpoint:");
  console.log("");
  console.log("   Invoke-WebRequest `");
  console.log("     -Uri http://127.0.0.1:23119/zotero-local-mcp-bridge/mcp `");
  console.log("     -Method POST `");
  console.log('     -ContentType "application/json" `');
  console.log('     -Body \'{"jsonrpc":"2.0","id":"init","method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"manual-probe","version":"0.0.0"}}}\' `');
  console.log('     -UserAgent "ZoteroLocalMcpBridge" `');
  console.log("     -UseBasicParsing");
  console.log("");
  console.log("This helper does not silently modify Zotero profiles. Zotero plugin installation should remain a user-approved action.");
}

try {
  const args = parseArgs(process.argv.slice(2));

  if (args.build) {
    run("npm", ["run", "build:zotero-plugin:release"]);
  }

  if (!existsSync(args.xpiPath)) {
    throw new Error(`XPI file not found: ${args.xpiPath}. Run with --build or build it first.`);
  }

  launchZotero(args.zoteroPath);

  if (args.openXpi) {
    openPath(args.xpiPath);
  } else if (args.openFolder) {
    openPath(dirname(args.xpiPath));
  }

  printNextSteps(args.xpiPath);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
