import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const root = new URL("../skills/", import.meta.url).pathname;
const checker = new URL("../skills/skill-check/scripts/check.mjs", import.meta.url).pathname;
const skills = readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);

test("there are skills to check", () => assert.ok(skills.length >= 3));

for (const name of skills) {
  test(`${name}: frontmatter name matches the folder`, () => {
    const text = readFileSync(`${root}${name}/SKILL.md`, "utf8");
    assert.match(text, /^---\n/);
    assert.match(text, new RegExp(`^name: ${name}$`, "m"));
    assert.match(text, /^description: .{80,1024}$/m);
    assert.match(text, /^license: MIT$/m);
  });

  test(`${name}: passes the Alyn quality checks it can`, () => {
    const r = spawnSync(process.execPath, [checker, `${root}${name}`], { encoding: "utf8" });
    assert.equal(r.status, 0, r.stderr);
    const score = Number(/Quality (\d+)\/100/.exec(r.stdout)?.[1]);
    assert.ok(score >= 85, `${name} scored ${score}\n${r.stdout}`);
    for (const check of ["trigger", "description", "depth", "license", "docs"]) assert.match(r.stdout, new RegExp(`${check}\\s+✓`));
  });
}
