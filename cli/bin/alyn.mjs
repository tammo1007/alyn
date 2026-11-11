#!/usr/bin/env node
/**
 * alyn: install the best AI skills in one command.
 *   npx alyn-cli add <skill>          install a skill (e.g. unslop, pdf, brainstorming)
 *   npx alyn-cli add bundle:<id>      install a curated bundle (design, engineering, founder, ...)
 *   npx alyn-cli add @handle/playlist install a creator's skill playlist
 *   npx alyn-cli add owner/repo       install every skill from a repo
 *   npx alyn-cli find "<task>"        find the best skills for a task
 *   npx alyn-cli mcp                  show how to connect Alyn MCP
 * Flags after the skill go to the skills CLI: -a <agent>, -g (global), -y.
 * Telemetry: one anonymous install count per skill. Disable with ALYN_TELEMETRY=0 or DO_NOT_TRACK=1.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const VERSION = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).version;
const API = (process.env.ALYN_API || "https://alyn.dev").replace(/\/$/, "");
const telemetry = process.env.ALYN_TELEMETRY !== "0" && process.env.DO_NOT_TRACK !== "1";
const [cmd, target, ...rest] = process.argv.slice(2);

const c = { dim: (s) => `\x1b[2m${s}\x1b[0m`, blue: (s) => `\x1b[34m${s}\x1b[0m`, bold: (s) => `\x1b[1m${s}\x1b[0m`, green: (s) => `\x1b[32m${s}\x1b[0m` };
const agentFlag = () => {
  const i = rest.findIndex((x) => x === "-a" || x === "--agent");
  return i >= 0 ? rest[i + 1] : undefined;
};

async function get(path) {
  const res = await fetch(`${API}${path}`, { headers: { "user-agent": `alyn-cli/${VERSION}` } });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

function skillsAdd(repo, skillName) {
  const args = ["-y", "skills@latest", "add", repo, ...(skillName ? ["--skill", skillName] : []), ...rest];
  console.log(c.dim(`→ npx ${args.join(" ")}`));
  const r = spawnSync("npx", args, { stdio: "inherit", shell: process.platform === "win32" });
  return r.status === 0;
}

async function report(slug) {
  if (!telemetry) return;
  try {
    await fetch(`${API}/api/install`, { method: "POST", headers: { "content-type": "application/json", "user-agent": `alyn-cli/${VERSION}` }, body: JSON.stringify({ slug, agent: agentFlag(), cli: VERSION }) });
  } catch {
    /* offline is fine */
  }
}

/** After the first successful install only: one friendly line asking for a GitHub star. Never again after that. */
function starHintOnce() {
  try {
    if (!process.stdout.isTTY || process.env.CI || process.env.ALYN_NO_STAR_HINT) return;
    const dir = join(process.env.XDG_CONFIG_HOME || join(homedir(), ".config"), "alyn");
    const flag = join(dir, "star-hint-shown");
    if (existsSync(flag)) return;
    mkdirSync(dir, { recursive: true });
    writeFileSync(flag, new Date().toISOString());
    console.log(`\n  ${c.dim("Like Alyn? Star it:")} ${c.blue("https://github.com/tammo1007/alyn")}`);
  } catch {
    /* read-only home: skip quietly */
  }
}

async function add() {
  if (!target) return help(1);
  const { status, body } = await get(`/api/resolve?q=${encodeURIComponent(target)}`);
  if (body.type === "bundle") {
    console.log(`${c.bold(body.name)}: installing ${body.skills.length} skills\n`);
    for (const s of body.skills) {
      console.log(c.blue(`● ${s.name}`));
      if (skillsAdd(s.repo, s.name)) await report(s.slug);
    }
    if (body.playlist && telemetry) {
      try {
        await fetch(`${API}/api/install`, { method: "POST", headers: { "content-type": "application/json", "user-agent": `alyn-cli/${VERSION}` }, body: JSON.stringify({ playlist: body.playlist, agent: agentFlag(), cli: VERSION }) });
      } catch {
        /* offline is fine */
      }
    }
    console.log(c.green(`\n✓ ${body.name} installed. Start a new agent session to use it.`));
    starHintOnce();
    return;
  }
  if (body.type === "skill") {
    if (skillsAdd(body.repo, body.multi ? body.name : undefined)) {
      await report(body.slug);
      console.log(c.green(`\n✓ ${body.name} installed. Start a new agent session to use it.`));
      console.log(c.dim(`  ${API}/skills/${body.slug}`));
      starHintOnce();
    } else process.exitCode = 1;
    return;
  }
  if (body.type === "repo") return void skillsAdd(body.repo);
  console.log(`No skill called “${target}”.${status === 404 && body.suggestions?.length ? " Did you mean:" : ""}`);
  for (const s of body.suggestions ?? []) console.log(`  ${c.bold(s.slug)}  ${c.dim(s.description.slice(0, 80))}`);
  process.exitCode = 1;
}

async function find() {
  const q = [target, ...rest].filter(Boolean).join(" ");
  const { body } = await get(`/api/search?q=${encodeURIComponent(q)}`);
  for (const s of body.skills ?? []) {
    console.log(`${c.bold(s.slug)} ${c.dim(`by ${s.owner} · ★ ${s.stars.toLocaleString("en-US")}`)}\n  ${s.description.slice(0, 140)}\n  ${c.blue(`npx alyn-cli add ${s.slug}`)}\n`);
  }
}

function mcp() {
  console.log(`${c.bold("Alyn MCP: connect once, get the right skill in every session.")}\n
Claude Code:  ${c.blue(`claude mcp add --transport http alyn-mcp ${API}/mcp`)}
Codex:        ${c.blue(`codex mcp add alyn-mcp --url ${API}/mcp`)}
Cursor / others (mcp.json):
${c.dim(JSON.stringify({ mcpServers: { "alyn-mcp": { url: `${API}/mcp` } } }, null, 2))}
More: ${API}/alyn-mcp`);
}

function help(code = 0) {
  console.log(`${c.bold("alyn")} ${VERSION}: the best AI skills for your coding agent

  npx alyn-cli add <skill>        install a skill, e.g. ${c.blue("npx alyn-cli add unslop")}
  npx alyn-cli add bundle:<id>    install a bundle, e.g. ${c.blue("npx alyn-cli add bundle:design")}
  npx alyn-cli add @handle/list   install a creator's skill playlist
  npx alyn-cli find "<task>"      find skills for a task
  npx alyn-cli mcp                connect Alyn MCP to your agent

  Flags are passed to the skills CLI: -a <agent> (claude-code, cursor, codex, ...), -g (global), -y`);
  process.exitCode = code;
}

const run = { add, install: add, i: add, find, search: find, mcp, help: () => help(0), "--help": () => help(0), "-h": () => help(0), "--version": () => console.log(VERSION) }[cmd];
if (!run) help(cmd ? 1 : 0);
else await run();
