#!/usr/bin/env node
/**
 * Bump cursor-collections submodule to upstream tracking branch, refresh .cursor symlinks,
 * optionally rebuild eversis-collections MCP.
 *
 * Run from repository root:
 *   node scripts/sync-cursor-collections.mjs
 * Or from scripts/:
 *   npm run sync:collections
 *
 * Flags:
 *   --check-only  Only run link-cursor-collections.sh; exit 1 if git working tree is dirty.
 *   --build-mcp   After sync, npm install && npm run build in eversis-collections-mcp.
 *   --start-mcp   After sync (and optional --build-mcp), run npm run start in MCP dir (foreground stdio server).
 */

import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SUBMODULE = "third-party/github-collections";
const SUBMODULE_PATH = path.join(ROOT, SUBMODULE);
const LINK_SCRIPT = path.join(ROOT, "scripts", "link-cursor-collections.sh");
const MCP_DIR = path.join(SUBMODULE_PATH, "mcp", "eversis-collections-mcp");

const args = process.argv.slice(2);
const checkOnly = args.includes("--check-only");
const buildMcp = args.includes("--build-mcp");
const startMcp = args.includes("--start-mcp");

function run(command, commandArgs, options = {}) {
  const result = spawnSync(command, commandArgs, {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env,
    ...options,
  });
  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }
  const code = result.status ?? 1;
  if (code !== 0) {
    process.exit(code);
  }
}

function submoduleHead() {
  const gitDir = path.join(SUBMODULE_PATH, ".git");
  if (!fs.existsSync(gitDir)) {
    return "(submodule not checked out)";
  }
  const r = spawnSync("git", ["rev-parse", "HEAD"], {
    cwd: SUBMODULE_PATH,
    encoding: "utf8",
  });
  return r.status === 0 ? r.stdout.trim() : "(unknown)";
}

function printStatusSummary() {
  console.log("");
  console.log("--- git status ---");
  spawnSync("git", ["status", "--short"], { cwd: ROOT, stdio: "inherit" });
}

function assertCleanWorkingTree() {
  const r = spawnSync("git", ["status", "--porcelain"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  if (r.status !== 0) {
    console.error("error: git status --porcelain failed");
    process.exit(1);
  }
  if (r.stdout.trim() !== "") {
    console.error("error: working tree is dirty after link (commit or revert changes)");
    printStatusSummary();
    process.exit(1);
  }
  console.log("check-only: working tree clean");
}

function mcpDistEntry() {
  return path.join(MCP_DIR, "dist", "index.js");
}

function assertMcpPackagePresent() {
  if (!fs.existsSync(path.join(MCP_DIR, "package.json"))) {
    console.error(`error: MCP package missing: ${MCP_DIR}`);
    process.exit(1);
  }
}

function startMcpServer() {
  assertMcpPackagePresent();
  const distJs = mcpDistEntry();
  if (!fs.existsSync(distJs)) {
    console.error(
      "error: eversis-collections-mcp is not built (missing dist/index.js). Run:\n" +
        "  node scripts/sync-cursor-collections.mjs --build-mcp\n" +
        "or:\n" +
        "  node scripts/sync-cursor-collections.mjs --build-mcp --start-mcp",
    );
    process.exit(1);
  }
  console.log("");
  console.log("Starting eversis-collections-mcp (npm run start); Ctrl+C to stop.");
  const child = spawn("npm", ["run", "start"], {
    cwd: MCP_DIR,
    stdio: "inherit",
    env: process.env,
  });
  child.on("exit", (code, signal) => {
    process.exit(code ?? (signal ? 1 : 0));
  });
  child.on("error", (err) => {
    console.error(err);
    process.exit(1);
  });
}

if (checkOnly && (buildMcp || startMcp)) {
  console.error(
    "error: --check-only cannot be used with --build-mcp or --start-mcp",
  );
  process.exit(1);
}

process.chdir(ROOT);

if (checkOnly) {
  console.log("check-only: running link script only");
  run("bash", [LINK_SCRIPT]);
  assertCleanWorkingTree();
  process.exit(0);
}

console.log(`submodule HEAD (before): ${submoduleHead()}`);

run("git", ["submodule", "update", "--init", "--recursive"]);
run("git", [
  "submodule",
  "update",
  "--remote",
  SUBMODULE,
]);

console.log(`submodule HEAD (after):  ${submoduleHead()}`);

run("bash", [LINK_SCRIPT]);

if (buildMcp) {
  assertMcpPackagePresent();
  console.log("building eversis-collections-mcp...");
  run("npm", ["install"], { cwd: MCP_DIR });
  run("npm", ["run", "build"], { cwd: MCP_DIR });
}

printStatusSummary();

if (startMcp) {
  startMcpServer();
} else {
  console.log("");
  console.log(
    "Next: review changes, then commit third-party/github-collections and .cursor/ if updated.",
  );
}
