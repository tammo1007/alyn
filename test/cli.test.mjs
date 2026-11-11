import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const bin = new URL("../cli/bin/alyn.mjs", import.meta.url).pathname;
const pkg = JSON.parse(readFileSync(new URL("../cli/package.json", import.meta.url), "utf8"));
const run = (...args) => spawnSync(process.execPath, [bin, ...args], { encoding: "utf8", env: { ...process.env, NO_COLOR: "1", ALYN_TELEMETRY: "0" } });

test("--version prints the package version", () => {
  const r = run("--version");
  assert.equal(r.status, 0);
  assert.equal(r.stdout.trim(), pkg.version);
});

test("help lists every command with the published package name", () => {
  const r = run("help");
  assert.equal(r.status, 0);
  for (const cmd of ["add <skill>", "bundle:", "@handle/list", "find", "mcp"]) assert.match(r.stdout, new RegExp(cmd.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.doesNotMatch(r.stdout, /npx alyn (?!-)/, "commands must use npx alyn-cli");
});

test("package exposes the alyn binary and ships only what it needs", () => {
  assert.equal(pkg.name, "alyn-cli");
  assert.equal(pkg.bin.alyn, "bin/alyn.mjs");
  assert.ok(pkg.files.includes("bin"));
});
