import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const script = new URL("../scripts/build-readme.mjs", import.meta.url).pathname;
const fixture = new URL("./fixture-readme.json", import.meta.url).pathname;

function build() {
  const dir = mkdtempSync(join(tmpdir(), "alyn-readme-"));
  const r = spawnSync(process.execPath, [script], { cwd: dir, encoding: "utf8", env: { ...process.env, ALYN_DATA: fixture } });
  assert.equal(r.status, 0, r.stderr);
  return readFileSync(join(dir, "README.md"), "utf8");
}

test("README leads with what Alyn does, then the weekly lists", () => {
  const md = build();
  const order = ['<h1 align="center">Alyn</h1>', "## Why skills matter", "## Connect Alyn MCP", "## Alyn CLI", "## Alyn skills", "## Bundles", "## Top 10 AI skills this week", "## Best AI skills by category"];
  let last = -1;
  for (const h of order) {
    const i = md.indexOf(h);
    assert.ok(i > last, `${h} missing or out of order`);
    last = i;
  }
});

test("README has ten ranked skills with install commands", () => {
  const md = build();
  const section = md.split("## Top 10 AI skills this week")[1].split("## Best AI skills by category")[0];
  assert.equal((section.match(/`npx alyn-cli add /g) ?? []).length, 10);
});

test("no skill appears twice across the top 10 and the categories", () => {
  const md = build();
  const slugs = [...md.matchAll(/`npx alyn-cli add ([\w.-]+)`/g)].map((m) => m[1]);
  assert.equal(new Set(slugs).size, slugs.length);
});

test("README contains no em or en dashes", () => {
  assert.doesNotMatch(build(), /[—–]/);
});
