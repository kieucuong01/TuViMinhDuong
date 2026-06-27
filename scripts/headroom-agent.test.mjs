import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const launcherPath = "scripts/headroom-agent.ps1";
const smokePath = "scripts/headroom-smoke.py";
const guidePath = "docs/agent/headroom.md";
const mcpPath = ".mcp.json";

test("provides a safe hybrid Headroom launcher for Codex and Claude", () => {
  assert.ok(existsSync(launcherPath), `${launcherPath} must exist`);
  const source = readFileSync(launcherPath, "utf8");

  for (const action of ["doctor", "mcp", "claude", "stats", "smoke"]) {
    assert.match(source, new RegExp(`"${action}"`), `launcher must support ${action}`);
  }
  assert.match(source, /HEADROOM_TELEMETRY\s*=\s*"off"/);
  assert.match(source, /HEADROOM_MEMORY_PROJECT_ROOT\s*=\s*\$repoRoot/);
  assert.match(source, /\$doctorExitCode\s+-ge\s+2/);
  assert.match(source, /wrap[\s\S]*claude[\s\S]*--memory/);
  assert.match(source, /headroom-smoke\.py/);
  assert.doesNotMatch(source, /wrap[\s\S]*codex/i);
  assert.doesNotMatch(source, /(OPENAI|ANTHROPIC)_API_KEY\s*=/);
});

test("smoke script uses MCP-like tool output and requires positive savings", () => {
  assert.ok(existsSync(smokePath), `${smokePath} must exist`);
  const source = readFileSync(smokePath, "utf8");

  assert.match(source, /range\(1,\s*5201\)/, "smoke payload must be large enough to avoid Headroom protected-output no-op");
  assert.match(source, /"type":\s*"tool_result"/, "smoke payload should match Anthropic MCP tool-output compression shape");
  assert.match(source, /tokensSaved"\]\s*>\s*0/);
  assert.match(source, /fatalPreserved/);
});

test("documents project-scoped MCP and the Codex proxy limitation", () => {
  assert.ok(existsSync(guidePath), `${guidePath} must exist`);
  assert.ok(existsSync(mcpPath), `${mcpPath} must exist`);

  const guide = readFileSync(guidePath, "utf8");
  const mcp = JSON.parse(readFileSync(mcpPath, "utf8"));
  const packageJson = JSON.parse(readFileSync("package.json", "utf8"));

  assert.match(guide, /WebSocket/i);
  assert.match(guide, /headroom_compress/);
  assert.match(guide, /HEADROOM_TELEMETRY=off/);
  assert.ok(mcp.mcpServers?.headroom, "Claude project MCP must include headroom");
  assert.equal(packageJson.scripts["agent:headroom:doctor"], "powershell -NoProfile -ExecutionPolicy Bypass -File scripts/headroom-agent.ps1 doctor");
  assert.equal(packageJson.scripts["agent:headroom:smoke"], "powershell -NoProfile -ExecutionPolicy Bypass -File scripts/headroom-agent.ps1 smoke");
  assert.equal(packageJson.scripts["agent:headroom:claude"], "powershell -NoProfile -ExecutionPolicy Bypass -File scripts/headroom-agent.ps1 claude");
});

test("parses with Windows PowerShell 5.1 default file decoding", () => {
  const absolutePath = resolve(launcherPath).replaceAll("'", "''");
  const parsed = spawnSync(
    "powershell",
    [
      "-NoProfile",
      "-Command",
      `$ErrorActionPreference='Stop'; $null=[scriptblock]::Create((Get-Content -LiteralPath '${absolutePath}' -Raw))`,
    ],
    { encoding: "utf8" },
  );

  assert.equal(parsed.status, 0, parsed.stderr || parsed.stdout);
});
