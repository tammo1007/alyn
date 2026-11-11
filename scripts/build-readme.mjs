#!/usr/bin/env node
/**
 * Rewrites README.md from live Alyn data (https://alyn.dev/api/readme.json).
 * Runs every Monday through .github/workflows/readme.yml. If the API is unreachable the README
 * stays as it is, so a bad week never breaks the repo.
 *   node scripts/build-readme.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";

const API = (process.env.ALYN_API || "https://alyn.dev").replace(/\/$/, "");
const SITE = "https://alyn.dev";
const REPO = "tammo1007/alyn";

const res = await fetch(`${API}/api/readme.json`, { headers: { "user-agent": "alyn-readme" } }).catch(() => null);
if (!res || !res.ok) {
  console.log(`Alyn API not reachable (${res?.status ?? "network"}). README left unchanged.`);
  process.exit(0);
}
const d = await res.json();

const compact = (n) => (n == null ? "" : n >= 1e6 ? `${(n / 1e6).toFixed(1).replace(/\.0$/, "")}M` : n >= 1e5 ? `${Math.round(n / 1e3)}k` : n >= 1e3 ? `${(n / 1e3).toFixed(1).replace(/\.0$/, "")}k` : String(n));
const title = (s) => s.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const esc = (s) => String(s ?? "").replace(/\s*[\u2014\u2013]\s*/g, ", ").replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
const short = (s, n = 110) => {
  const t = esc(s).replace(/…$/, "");
  return t.length <= n ? t : `${t.slice(0, n).replace(/\s+\S*$/, "")}…`;
};
const date = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
const anchor = (s) => s.toLowerCase().replace(/[^a-z0-9 -]/g, "").replace(/ /g, "-");
const week = date(d.week);
const updated = new Date(d.generated).toISOString().slice(0, 10);

const momentum = (s) => (s.starsThisWeek != null ? `+${compact(s.starsThisWeek)} this week` : s.starsPerDay ? `${compact(s.starsPerDay)}/day` : "");

const top10 = d.top10
  .map((s, i) => {
    const by = s.pack ? `${esc(s.author)} · ${esc(s.pack)}` : esc(s.author);
    return `| ${i + 1} | [**${title(s.name)}**](${s.url})<br><sub>${short(s.description, 90)}</sub> | ${by} | ★ ${compact(s.stars)}<br><sub>${momentum(s)}</sub> | \`${s.install}\` |`;
  })
  .join("\n");

const toc = d.categories.map((c) => `[${c.name}](#${anchor(c.name)})`).join(" · ");

// Each skill appears in one category only, so the list stays varied.
const used = new Set(d.top10.map((s) => s.slug));
const categories = d.categories
  .map((c) => {
    const picks = c.skills.filter((s) => !used.has(s.slug)).slice(0, 3);
    for (const s of picks) used.add(s.slug);
    return { ...c, skills: picks };
  })
  .filter((c) => c.skills.length)
  .map((c) => {
    const rows = c.skills.map((s) => `- [**${title(s.name)}**](${s.url}) by ${esc(s.author)} · ★ ${compact(s.stars)}<br>${short(s.description)}<br>\`${s.install}\``).join("\n");
    return `### ${c.name}\n\n${rows}\n\n<sub>[All ${c.name.toLowerCase()} skills →](${c.url})</sub>`;
  })
  .join("\n\n");

const bundles = d.bundles.map((b) => `| [**${esc(b.name)}**](${b.url}) | ${esc(b.tagline)} | ${b.count} | \`${b.install}\` |`).join("\n");

const freshList = (d.fresh ?? []).filter((s) => !d.top10.some((t) => t.slug === s.slug)).slice(0, 5);
const fresh = freshList.length
  ? `\n## New this week\n\n${freshList.map((s) => `- [**${title(s.name)}**](${s.url}) by ${esc(s.author)}: ${short(s.description, 100)}`).join("\n")}\n`
  : "";

const md = `<p align="center">
  <a href="${SITE}"><img src="${SITE}/og/weekly.jpg" alt="Alyn: the top AI skills this week" width="100%"></a>
</p>

<h1 align="center">Alyn: the best AI skills, ranked every week</h1>

<p align="center">
  <a href="${SITE}"><b>alyn.dev</b></a> ·
  <a href="#top-10-ai-skills-this-week">Top 10</a> ·
  <a href="#best-ai-skills-by-category">By category</a> ·
  <a href="#bundles">Bundles</a> ·
  <a href="mcp/README.md">Alyn MCP</a> ·
  <a href="cli/README.md">CLI</a>
</p>

<p align="center">
  <a href="https://github.com/${REPO}/stargazers"><img src="https://img.shields.io/github/stars/${REPO}?style=flat&color=3b5bfd&label=stars" alt="GitHub stars"></a>
  <a href="https://www.npmjs.com/package/alyn-cli"><img src="https://img.shields.io/npm/v/alyn-cli?color=3b5bfd&label=alyn-cli" alt="npm"></a>
  <img src="https://img.shields.io/badge/updated-${updated.replace(/-/g, "--")}-3b5bfd" alt="Updated ${updated}">
  <img src="https://img.shields.io/badge/skills-${d.stats.skills}-3b5bfd" alt="${d.stats.skills} skills">
</p>

The best AI skills for **Claude Code, Cursor, Codex and 70+ agents**, picked from ${d.stats.skills.toLocaleString("en-US")} open source skills by ${d.stats.creators} creators. Ranked by GitHub stars, real installs and the quality of each SKILL.md. **This list rewrites itself every Monday.**

## Install any skill in one line

\`\`\`bash
npx alyn-cli add unslop              # one skill
npx alyn-cli add bundle:design       # a complete setup
npx alyn-cli find "write a PRD"      # find the best skill for a task
\`\`\`

Or connect [**Alyn MCP**](mcp/README.md) once and let your agent pick the right skill for every task:

\`\`\`bash
claude mcp add --transport http alyn-mcp ${SITE}/mcp
\`\`\`

## Top 10 AI skills this week

<sub>Week of ${week}. Ranked by new GitHub stars, installs through Alyn and the Alyn Score. One skill per pack. [How it works →](${SITE}/top-10-ai-skills-this-week)</sub>

| # | Skill | By | Stars | Install |
| --- | --- | --- | --- | --- |
${top10}
${fresh}
## Best AI skills by category

<sub>${toc}</sub>

${categories}

## Bundles

Complete setups for one kind of work, installed in one command.

| Bundle | What it does | Skills | Install |
| --- | --- | --- | --- |
${bundles}

## Alyn skills

Skills from this repo that make your agent better at skills.

| Skill | What it does | Install |
| --- | --- | --- |
| [**find-skill**](skills/find-skill/SKILL.md) | Before improvising, the agent asks Alyn for the best existing skill for the task. | \`npx skills add ${REPO} --skill find-skill\` |
| [**skill-check**](skills/skill-check/SKILL.md) | Checks a SKILL.md against the six quality checks of the [Alyn Score](${SITE}/alyn-score) and fixes it. | \`npx skills add ${REPO} --skill skill-check\` |
| [**alyn-setup**](skills/alyn-setup/SKILL.md) | Sets up a full skill stack for your kind of work with one of the bundles above. | \`npx skills add ${REPO} --skill alyn-setup\` |

All three at once: \`npx skills add ${REPO}\`

## How Alyn ranks skills

Every skill gets an [Alyn Score](${SITE}/alyn-score) from 0 to 100: 45% popularity (stars and installs), 25% quality (six checks on the SKILL.md), 15% momentum (new stars) and 15% freshness. Data syncs from GitHub every night.

## Add your skill

Alyn finds public skills on GitHub on its own. Missing one? [Submit it on alyn.dev](${SITE}/submit). This README is generated, so there is nothing to change here by pull request.

---

<p align="center">
  <sub>If Alyn saves you time, <a href="https://github.com/${REPO}">a star</a> helps other builders find it.<br>
  Generated from <a href="${SITE}">alyn.dev</a> on ${updated}. Skills belong to their authors.</sub>
</p>
`;

const before = (() => {
  try {
    return readFileSync("README.md", "utf8");
  } catch {
    return "";
  }
})();
// Ignore the date-only lines so an unchanged list does not create a commit.
const strip = (s) => s.replace(/updated-[\d-]+-|Updated \d{4}-\d{2}-\d{2}|on \d{4}-\d{2}-\d{2}\./g, "");
if (strip(before) === strip(md)) {
  console.log("No changes in the ranking.");
} else {
  writeFileSync("README.md", md);
  console.log(`README.md written: week of ${week}, ${d.top10.length} top skills, ${d.categories.length} categories.`);
}
