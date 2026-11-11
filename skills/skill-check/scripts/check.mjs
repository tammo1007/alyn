#!/usr/bin/env node
/**
 * Runs the six Alyn Score quality checks on a skill folder.
 *   node scripts/check.mjs <path-to-skill-folder-or-SKILL.md>
 * Prints a table and exits 0. The repo-level checks (license file, README with cover or homepage)
 * look in the skill folder and up to three parent folders.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const WEIGHTS = { trigger: 25, description: 15, depth: 25, resources: 15, license: 10, docs: 10 };
const TRIGGER = /\b(use (it |this( skill)? )?(when|for|whenever|if|before|after)|when (the )?user|triggers? (on|when)|invoke when|activate when|use to)\b/i;

const arg = process.argv[2];
if (!arg) {
  console.error("Usage: node check.mjs <skill folder or SKILL.md>");
  process.exit(1);
}
let file = resolve(arg);
if (statSync(file).isDirectory()) file = join(file, "SKILL.md");
if (!existsSync(file)) {
  console.error(`No SKILL.md at ${file}`);
  process.exit(1);
}
const dir = dirname(file);
const text = readFileSync(file, "utf8");
const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
const front = m ? m[1] : "";
const body = m ? m[2] : text;
const field = (k) => {
  const r = front.match(new RegExp(`^${k}:\\s*(?:[>|][-+]?\\s*\\n)?([\\s\\S]*?)(?=\\n[a-zA-Z_-]+:|$)`, "m"));
  return r ? r[1].replace(/\s*\n\s*/g, " ").replace(/^["']|["']$/g, "").trim() : "";
};
const name = field("name") || dirname(file).split(/[\\/]/).pop();
const description = field("description");

const files = readdirSync(dir).filter((f) => !f.startsWith("."));
const parents = [dir, dirname(dir), dirname(dirname(dir)), dirname(dirname(dirname(dir)))];
const anyUp = (test) => parents.some((p) => existsSync(p) && readdirSync(p).some(test));
const readme = parents.map((p) => ["README.md", "readme.md"].map((f) => join(p, f)).find(existsSync)).find(Boolean);
const readmeText = readme ? readFileSync(readme, "utf8") : "";

const results = {
  trigger: [TRIGGER.test(description), TRIGGER.test(description) ? "says when to use it" : "description never says when to use it"],
  description: [description.length >= 80 && description.length <= 1024, `${description.length} characters (80 to 1,024)`],
  depth: [body.length >= 1500 && body.length <= 40000, `${body.length.toLocaleString("en-US")} characters in the body (1,500 to 40,000)`],
  resources: [files.includes("scripts") || files.includes("references") || files.length > 1, files.length > 1 ? `ships ${files.length - 1} more file(s) or folder(s)` : "only SKILL.md"],
  license: [!!field("license") || anyUp((f) => /^licen[sc]e/i.test(f)), field("license") ? `license: ${field("license")}` : anyUp((f) => /^licen[sc]e/i.test(f)) ? "LICENSE file found" : "no license"],
  docs: [!!readme && (/!\[[^\]]*\]\(|<img\s/i.test(readmeText) || /https?:\/\//.test(readmeText)), readme ? "README found" : "no README in the skill or repo"],
};

const score = Object.entries(results).reduce((s, [k, [ok]]) => s + (ok ? WEIGHTS[k] : 0), 0);
console.log(`Skill check: ${name}   Quality ${score}/100\n`);
for (const [k, [ok, why]] of Object.entries(results)) console.log(`${k.padEnd(13)} ${ok ? "✓" : "✗"}  ${why}`);
const missing = Object.entries(results).filter(([, [ok]]) => !ok).sort((a, b) => WEIGHTS[b[0]] - WEIGHTS[a[0]]);
if (missing.length) {
  console.log("\nFix first:");
  missing.forEach(([k], i) => console.log(`${i + 1}. ${k} (+${WEIGHTS[k]})`));
}
