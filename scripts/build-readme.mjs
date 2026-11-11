#!/usr/bin/env node
/**
 * Builds README.md from live Alyn data.
 *
 *   node scripts/build-readme.mjs                 # fetch https://alyn.dev/api/readme.json
 *   ALYN_DATA=data.json node scripts/build-readme.mjs   # use a local file (tests)
 *
 * Runs every Monday through .github/workflows/readme.yml. If the data cannot be loaded the
 * README stays as it is, so a bad week never breaks the repo. Writes README.md in the current
 * working directory.
 */
import { readFileSync, writeFileSync } from "node:fs";

const SITE = "https://alyn.dev";
const REPO = "tammo1007/alyn";
const API = (process.env.ALYN_API || SITE).replace(/\/$/, "");

// ---------------------------------------------------------------------------------------------
// Data

async function load() {
  if (process.env.ALYN_DATA) return JSON.parse(readFileSync(process.env.ALYN_DATA, "utf8"));
  const res = await fetch(`${API}/api/readme.json`, { headers: { "user-agent": "alyn-readme" } }).catch(() => null);
  if (!res?.ok) return null;
  return res.json();
}

// ---------------------------------------------------------------------------------------------
// Formatting helpers

const compact = (n) => {
  if (n == null) return "";
  if (n >= 1e6) return `${(n / 1e6).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1e5) return `${Math.round(n / 1e3)}k`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
};
const ACRONYMS = { ai: "AI", ui: "UI", ux: "UX", api: "API", seo: "SEO", geo: "GEO", aso: "ASO", pdf: "PDF", prd: "PRD", mcp: "MCP", gtm: "GTM", cro: "CRO", ios: "iOS", css: "CSS", sql: "SQL", llm: "LLM", cli: "CLI", ci: "CI", qa: "QA", d3: "D3", tdd: "TDD", wcag: "WCAG", sxo: "SXO" };
const title = (s) =>
  s
    .replace(/[-_]+/g, " ")
    .replace(/\b\w+/g, (w) => ACRONYMS[w.toLowerCase()] ?? w[0].toUpperCase() + w.slice(1));
/** Single line, table-safe, no em or en dashes. */
const esc = (s) =>
  String(s ?? "")
    .replace(/\s*[\u2014\u2013]\s*/g, ", ")
    .replace(/\|/g, "\\|")
    .replace(/\s+/g, " ")
    .trim();
const short = (s, n = 110) => {
  const t = esc(s).replace(/…$/, "");
  return t.length <= n ? t : `${t.slice(0, n).replace(/\s+\S*$/, "")}…`;
};
const longDate = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
const thousands = (n) => n.toLocaleString("en-US");

// ---------------------------------------------------------------------------------------------
// Sections that change every week

function topTen(d) {
  const rows = d.top10.map((s, i) => {
    const by = s.pack ? `${esc(s.author)}<br><sub>${esc(s.pack)}</sub>` : esc(s.author);
    const trend = s.starsThisWeek != null ? `+${compact(s.starsThisWeek)} this week` : s.starsPerDay ? `${compact(s.starsPerDay)}/day` : "";
    return `| ${i + 1} | [**${title(s.name)}**](${s.url})<br><sub>${short(s.description, 90)}</sub> | ${by} | ★ ${compact(s.stars)}<br><sub>${trend}</sub> | \`${s.install}\` |`;
  });
  return `| # | Skill | By | Stars | Install |
| :-: | --- | --- | --- | --- |
${rows.join("\n")}`;
}

/** Best three per category; every skill appears once across the whole README. */
function byCategory(d) {
  const used = new Set(d.top10.map((s) => s.slug));
  return d.categories
    .map((c) => {
      const picks = c.skills.filter((s) => !used.has(s.slug)).slice(0, 3);
      for (const s of picks) used.add(s.slug);
      return { ...c, skills: picks };
    })
    .filter((c) => c.skills.length)
    .map((c) => {
      const rows = c.skills.map((s) => `| [**${title(s.name)}**](${s.url}) | ${short(s.description, 100)} | ${esc(s.author)} | ★ ${compact(s.stars)} | \`${s.install}\` |`);
      return `<details>
<summary><b>${c.name}</b> · ${c.skills.map((s) => title(s.name)).join(", ")}</summary>
<br>

| Skill | What it does | By | Stars | Install |
| --- | --- | --- | --- | --- |
${rows.join("\n")}

[All ${c.name.toLowerCase()} skills on Alyn →](${c.url})

</details>`;
    })
    .join("\n");
}

function bundles(d) {
  return `| Bundle | For | Skills | Install |
| --- | --- | :-: | --- |
${d.bundles.map((b) => `| [**${esc(b.name)}**](${b.url}) | ${esc(b.tagline)} | ${b.count} | \`${b.install}\` |`).join("\n")}`;
}

// ---------------------------------------------------------------------------------------------
// The README

function render(d) {
  const updated = new Date(d.generated).toISOString().slice(0, 10);
  const skills = thousands(d.stats.skills);

  return `<p align="center">
  <a href="${SITE}"><img src=".github/cover.jpg" alt="Alyn: find the best free AI skills for your coding agent" width="100%"></a>
</p>

<h1 align="center">Alyn</h1>

<p align="center"><b>The right skill for every task, in every agent.</b></p>

<p align="center">
  <a href="https://www.npmjs.com/package/alyn-cli"><img src="https://img.shields.io/npm/v/alyn-cli?color=2b47f0&label=alyn-cli" alt="npm version"></a>
  <a href="https://github.com/${REPO}/actions/workflows/ci.yml"><img src="https://github.com/${REPO}/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="mcp/README.md"><img src="https://img.shields.io/badge/MCP-alyn.dev%2Fmcp-2b47f0" alt="Alyn MCP"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-2b47f0" alt="MIT license"></a>
</p>

<p align="center">
  <a href="${SITE}">Website</a> ·
  <a href="#connect-alyn-mcp">Connect</a> ·
  <a href="#alyn-cli">CLI</a> ·
  <a href="#alyn-skills">Skills</a> ·
  <a href="#top-10-ai-skills-this-week">This week</a>
</p>

<br>

There are thousands of agent skills on GitHub, and most agents never use the right one. **Alyn fixes that.** Connect it once to Claude Code, Cursor, Codex or any MCP client. For every task, your agent asks Alyn which skill fits, loads it and follows it. No browsing, no copying folders around.

Alyn knows **${skills} open source skills** by **${d.stats.creators} creators** and ranks them by GitHub stars, real installs and the quality of each SKILL.md. The data refreshes every night, and this README every Monday.

## Why skills matter

> **A small model with the right skill beats a big model without one.**
> On [SkillsBench](https://arxiv.org/abs/2602.12670), Claude Haiku 4.5 with skills solved 27.7% of tasks. Claude Opus 4.5 without skills solved 22.0%. Given skills, Opus itself jumped to 45.3%. Curated skills added 16.2 points on average.

So the skill matters as much as the model. Alyn makes sure your agent has the best one for the job, and lets you run cheaper models for more of your work.

## Connect Alyn MCP

One remote MCP server, no account, no API key.

\`\`\`bash
claude mcp add --transport http alyn-mcp ${SITE}/mcp
\`\`\`

| Agent | How |
| --- | --- |
| Claude Code | The command above |
| Claude (web, desktop, mobile) | Settings › Connectors › Add custom connector › \`${SITE}/mcp\` |
| Cursor | Add \`"alyn-mcp": { "url": "${SITE}/mcp" }\` to \`~/.cursor/mcp.json\` |
| Codex | \`codex mcp add alyn-mcp --url ${SITE}/mcp\` |
| VS Code, Windsurf, any MCP client | [Setup for every client](mcp/README.md) |

Then just work as usual:

> *Make this pricing page look less AI-generated.*

<p align="center"><code>your task</code> → <code>find_skills</code> → <code>best skill</code> → <code>load_skill</code> → <b>done</b></p>

The agent calls \`find_skills\`, picks the best match and loads it for the current session. To keep a skill for good, it calls \`install_skill\`. [All tools →](mcp/README.md#tools)

## Alyn CLI

Install skills, bundles or whole packs into any agent in one line.

\`\`\`bash
npx alyn-cli find "write a PRD"      # the best skills for a task
npx alyn-cli add unslop              # one skill
npx alyn-cli add bundle:design       # a complete setup
npx alyn-cli add obra/superpowers    # every skill in a pack
\`\`\`

Detects Claude Code, Cursor, Codex and 70+ other agents. [CLI docs →](cli/README.md)

## Alyn skills

Three skills that make any agent better at using skills.

| Skill | What it does |
| --- | --- |
| [**find-skill**](skills/find-skill/SKILL.md) | Before improvising, the agent asks Alyn for the best existing skill for the task. |
| [**skill-check**](skills/skill-check/SKILL.md) | Reviews a SKILL.md against the six quality checks of the [Alyn Score](${SITE}/alyn-score) and fixes it. Ships a checker script. |
| [**alyn-setup**](skills/alyn-setup/SKILL.md) | Sets up a complete skill stack for your kind of work with one of the bundles below. |

\`\`\`bash
npx skills add ${REPO}
\`\`\`

## Bundles

Complete setups for one kind of work, curated by Alyn.

${bundles(d)}

## Top 10 AI skills this week

<sub>Week of ${longDate(d.week)}. Ranked by new GitHub stars, installs through Alyn and the Alyn Score, one skill per pack. [Live ranking →](${SITE}/top-10-ai-skills-this-week)</sub>

${topTen(d)}

## Best AI skills by category

<sub>The three highest-scoring skills in every category. Click to open.</sub>

${byCategory(d)}

## How Alyn ranks skills

Every skill gets an [Alyn Score](${SITE}/alyn-score) from 0 to 100:

| Signal | Weight | Measured by |
| --- | :-: | --- |
| Popularity | 45% | GitHub stars and real installs |
| Quality | 25% | Six checks on the SKILL.md: trigger, description, depth, resources, license, docs |
| Momentum | 15% | Star growth over the last 7 days |
| Freshness | 15% | Last push to the repository |

## Repository

| Path | Contents |
| --- | --- |
| [\`cli/\`](cli) | The \`alyn-cli\` npm package |
| [\`mcp/\`](mcp) | Alyn MCP setup for every client and the tool reference |
| [\`skills/\`](skills) | The Alyn skills |
| [\`scripts/\`](scripts) | The generator for this README |
| [\`test/\`](test) | Tests for the CLI, the skills and the README |

This README is generated from [alyn.dev](${SITE}). To add a skill to Alyn, [submit it on the website](${SITE}/submit). Skills listed here belong to their authors.

<br>

<p align="center">
  <sub>If Alyn saves you time, a ⭐ helps other builders find it.<br>
  MIT licensed. Last updated ${updated}.</sub>
</p>
`;
}

// ---------------------------------------------------------------------------------------------

const data = await load();
if (!data) {
  console.log("Alyn data not reachable. README left unchanged.");
  process.exit(0);
}

const next = render(data);
let current = "";
try {
  current = readFileSync("README.md", "utf8");
} catch {
  /* first run */
}
// The date line alone is not a reason to commit.
const withoutDate = (s) => s.replace(/Last updated \d{4}-\d{2}-\d{2}\./, "");
if (withoutDate(current) === withoutDate(next)) {
  console.log("README is up to date.");
} else {
  writeFileSync("README.md", next);
  console.log(`README.md written: week of ${longDate(data.week)}, ${data.categories.length} categories.`);
}
