import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";

const root = new URL("../skills/", import.meta.url).pathname;
const skills = readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);

test("there are skills to check", () => assert.ok(skills.length >= 2));

for (const name of skills) {
  test(`${name}: frontmatter name matches the folder`, () => {
    const text = readFileSync(`${root}${name}/SKILL.md`, "utf8");
    assert.match(text, /^---\n/);
    assert.match(text, new RegExp(`^name: ${name}$`, "m"));
    assert.match(text, /^description: .{80,1024}$/m);
    assert.match(text, /^license: MIT$/m);
    const body = text.split(/^---$/m).slice(2).join("---");
    assert.ok(body.length >= 1500, `${name} body is only ${body.length} characters`);
    assert.match(text.split(/^---$/m)[1], /\b(use (it )?when|when the user)\b/i, "description must say when to use it");
  });

}
