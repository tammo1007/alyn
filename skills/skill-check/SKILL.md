---
name: skill-check
description: Reviews a SKILL.md against the six quality checks of the Alyn Score and suggests concrete fixes. Use when the user writes, edits or publishes an agent skill, asks "is my skill good", wants more installs or a better ranking on Alyn or skills.sh, or before releasing a skill pack on GitHub.
license: MIT
---

# Skill check

Checks a skill the way [Alyn](https://alyn.dev/alyn-score) scores it, then helps fix what is missing. The Alyn Score combines popularity, momentum and freshness with six quality checks on the SKILL.md itself. Popularity takes time. The quality checks can be fixed today.

## Steps

1. Find the skill. Ask for the path if it is not obvious. A skill is a folder with a `SKILL.md` that starts with YAML frontmatter (`name`, `description`).
2. If you can run Node, run the bundled checker first: `node scripts/check.mjs <skill folder>` (path relative to this skill). It measures everything below exactly the way Alyn does.
3. Otherwise read the SKILL.md, list the other files in the folder and run the six checks by hand. For each one report pass or fail with one line of evidence.
4. Show the result as a short table, then the fixes in order of weight.
5. Offer to apply the fixes. Rewrite only what the user agrees to.

## The six checks

| Check | Weight | Passes when |
| --- | --- | --- |
| Trigger | 25% | The description says **when** to use the skill, with words like "Use when", "Use for", "when the user", "Use before" or "Triggers on". |
| Description | 15% | The description is between 80 and 1,024 characters. |
| Depth | 25% | The body (everything after the frontmatter) has between 1,500 and 40,000 characters. |
| Resources | 15% | The skill ships more than the SKILL.md: a `scripts/` folder, a `references/` folder, or other files. |
| License | 10% | The frontmatter has a `license` field, or the repository has a LICENSE file. |
| Docs | 10% | The repository has a README with a cover image or a homepage link. |

Quality score = the sum of the weights that pass.

## How to fix each one

- **Trigger:** Agents decide from the description alone whether to load a skill. Name the situations: "Use when the user asks for X, mentions Y, or before Z." Mention the words people actually type.
- **Description:** Under 80 characters is too vague to trigger reliably. Over 1,024 gets cut off by some agents. Say what it does, then when to use it.
- **Depth:** Under 1,500 characters usually means the agent gets a slogan instead of a method. Add the steps, the decisions and an example. Over 40,000 wastes context: move details into `references/` and link to them.
- **Resources:** Put deterministic work into `scripts/` (validation, conversion, file generation) and long background into `references/`. The SKILL.md tells the agent when to use each.
- **License:** Add `license: MIT` (or your license) to the frontmatter and a LICENSE file to the repo, so companies are allowed to use it.
- **Docs:** A README with a short description, an install command and a screenshot or cover image. Link a homepage in the GitHub repo settings.

## Also check, without score impact

- `name` is lowercase with hyphens and matches the folder name.
- The body talks to the agent ("Do X"), not about the skill ("This skill does X").
- No secrets, tokens or personal paths in the files.
- One clear job per skill. Split skills that do three unrelated things.

## Output format

```
Skill check: <name>   Quality <score>/100

Trigger       ✓  "Use when the user asks for slides..."
Description   ✓  412 characters
Depth         ✗  640 characters in the body (needs 1,500+)
Resources     ✗  only SKILL.md
License       ✓  MIT in frontmatter
Docs          ✓  README with cover

Top fixes
1. Depth (+25): add the step-by-step method and one worked example.
2. Resources (+15): move the color tables into references/palette.md.
```

After the fixes, the user can submit the skill at https://alyn.dev/submit.
