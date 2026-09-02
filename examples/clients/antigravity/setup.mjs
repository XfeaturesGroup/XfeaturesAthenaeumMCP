#!/usr/bin/env node
// Wires Xfeatures Athenaeum into Google Antigravity's MCP config.
//
// Antigravity has two properties that make this more than a JSON template:
//   1. Its mcp_config.json accepts only literal header values -- no
//      ${ENV_VAR} substitution -- so the bearer token has to be written into
//      the file itself, not referenced.
//   2. `athenaeum login` issues a token that expires in about an hour with
//      no refresh (see the CLI's "Known limitations"). So this script is
//      meant to be re-run after every `athenaeum login`, not just once.
//
// Usage:
//   node setup.mjs            installs the CLI if missing, then either
//                              tells you to run `athenaeum login` or writes
//                              the current token into Antigravity's config.
//
// Nothing here talks to the network except the CLI install step, and this
// script never performs the OAuth login itself -- that step opens a browser
// and must be done by a human. See PROMPT.md if an AI agent is driving this.

import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir, platform } from "node:os";
import { dirname, join } from "node:path";

const CREDENTIALS_PATH = join(homedir(), ".athenaeum", "credentials.json");
const MCP_CONFIG_PATH = join(homedir(), ".gemini", "config", "mcp_config.json");
const ATHENAEUM_URL = "https://athenaeum.xfeatures.net/mcp";

function athenaeumOnPath() {
  const probe = spawnSync("athenaeum", ["whoami"], { stdio: "ignore", shell: platform() === "win32" });
  return probe.error?.code !== "ENOENT";
}

function installCli() {
  console.log("Installing @xfeaturesgroup/athenaeum-cli globally...");
  const install = spawnSync("npm", ["install", "-g", "@xfeaturesgroup/athenaeum-cli"], {
    stdio: "inherit",
    shell: platform() === "win32"
  });
  if (install.status === 0) return;

  console.log(
    "\nnpm install failed (there may not be a published release yet) -- building from source instead."
  );
  const workdir = join(homedir(), ".athenaeum-cli-src");
  if (!existsSync(workdir)) {
    execFileSync("git", [
      "clone",
      "https://github.com/XfeaturesGroup/XfeaturesAthenaeumCLI.git",
      workdir
    ], { stdio: "inherit" });
  }
  execFileSync("npm", ["install"], { cwd: workdir, stdio: "inherit", shell: platform() === "win32" });
  execFileSync("npm", ["run", "build"], { cwd: workdir, stdio: "inherit", shell: platform() === "win32" });
  execFileSync("npm", ["link"], { cwd: workdir, stdio: "inherit", shell: platform() === "win32" });
}

function readCredentials() {
  if (!existsSync(CREDENTIALS_PATH)) return null;
  return JSON.parse(readFileSync(CREDENTIALS_PATH, "utf8"));
}

function writeMcpConfig(accessToken) {
  mkdirSync(dirname(MCP_CONFIG_PATH), { recursive: true });
  let config = {};
  if (existsSync(MCP_CONFIG_PATH)) {
    const raw = readFileSync(MCP_CONFIG_PATH, "utf8").trim();
    if (raw.length > 0) config = JSON.parse(raw);
  }
  config.mcpServers ??= {};
  config.mcpServers.athenaeum = {
    serverUrl: ATHENAEUM_URL,
    headers: { Authorization: `Bearer ${accessToken}` }
  };
  // Plain fs.writeFileSync with "utf8" writes no BOM. Do not switch this to
  // a shell redirect or PowerShell Set-Content -Encoding utf8 -- both add a
  // BOM on Windows, and Antigravity's JSON parser rejects a BOM-prefixed
  // mcp_config.json with a bare "Failed to load MCP servers".
  writeFileSync(MCP_CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

if (!athenaeumOnPath()) {
  installCli();
}

const credentials = readCredentials();
if (!credentials) {
  console.log(
    [
      "",
      "The Athenaeum CLI is installed but you are not signed in yet.",
      "This step opens your browser and needs a human -- run it yourself, then re-run this script:",
      "",
      "  athenaeum login",
      "  node setup.mjs",
      "",
      "On Windows, if the auto-opened tab shows 'Authorization Error: Missing required",
      "OAuth parameters', the OS URL-open step truncated the link at an '&'. Copy the",
      "full 'If it doesn't open automatically, visit: ...' URL the CLI printed to the",
      "terminal and paste that into the browser instead."
    ].join("\n")
  );
  process.exit(0);
}

if (credentials.expiresAt * 1000 < Date.now()) {
  console.log("Stored token has expired. Run `athenaeum login` again, then re-run this script.");
  process.exit(1);
}

writeMcpConfig(credentials.accessToken);
const expires = new Date(credentials.expiresAt * 1000);
console.log(
  [
    `Wrote athenaeum into ${MCP_CONFIG_PATH}.`,
    `Token expires at ${expires.toLocaleString()}.`,
    "Reconnect the MCP server in Antigravity now (refresh in the MCP panel, or restart Antigravity).",
    "When the token expires: athenaeum login, then node setup.mjs again."
  ].join("\n")
);
