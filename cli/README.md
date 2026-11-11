# alyn-cli

Install the best AI skills for Claude Code, Cursor, Codex and 70+ agents in one command.

```bash
npx alyn-cli add unslop                 # one skill
npx alyn-cli add bundle:design          # a curated bundle
npx alyn-cli add @handle/playlist       # a creator's skill playlist
npx alyn-cli add obra/superpowers       # every skill in a pack
npx alyn-cli find "make my landing page look less AI-generated"
npx alyn-cli mcp                        # connect Alyn MCP
```

Flags after the skill go to the open skills CLI: `-a <agent>` (claude-code, cursor, codex, ...), `-g` (global), `-y`.

Alyn counts one anonymous install per skill to rank skills by real usage. Opt out with `ALYN_TELEMETRY=0` or `DO_NOT_TRACK=1`.

Browse all skills at [alyn.dev](https://alyn.dev).
