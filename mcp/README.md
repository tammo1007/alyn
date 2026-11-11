# Alyn MCP

Alyn MCP is a free, remote MCP server that gives your agent the whole [Alyn](https://alyn.dev) skill catalog. Your agent describes the task, Alyn returns the skills that fit best, and the agent loads one and follows it. Nothing to install per skill, no account, no API key.

**Server URL:** `https://alyn.dev/mcp` (Streamable HTTP)

## Connect

### Claude Code

```bash
claude mcp add --transport http alyn-mcp https://alyn.dev/mcp
```

Add `--scope user` to use it in every project. Check it with `claude mcp list`.

### Claude (web, desktop, mobile)

1. Open **Settings > Connectors**.
2. Choose **Add custom connector**.
3. Name it `Alyn MCP` and paste `https://alyn.dev/mcp`.
4. Turn it on in a chat from the tools menu.

### Cursor

`~/.cursor/mcp.json`

```json
{
  "mcpServers": {
    "alyn-mcp": { "url": "https://alyn.dev/mcp" }
  }
}
```

### Codex

```bash
codex mcp add alyn-mcp --url https://alyn.dev/mcp
```

Or in `~/.codex/config.toml`:

```toml
[mcp_servers.alyn-mcp]
url = "https://alyn.dev/mcp"
```

### VS Code with GitHub Copilot

`.vscode/mcp.json`

```json
{
  "servers": {
    "alyn-mcp": { "type": "http", "url": "https://alyn.dev/mcp" }
  }
}
```

### Any other MCP client

```json
{
  "mcpServers": {
    "alyn-mcp": { "type": "http", "url": "https://alyn.dev/mcp" }
  }
}
```

The CLI prints all of these too: `npx alyn-cli mcp`.

## Tools

| Tool | What it does |
| --- | --- |
| `find_skills` | Describe the task in plain words. Returns the 2 or 3 skills that fit best, ranked by quality and real usage. |
| `load_skill` | Loads the full SKILL.md into the session. The agent follows it right away. |
| `install_skill` | Returns the one command that installs the skill for your agent, to keep it. |
| `get_bundle` | Curated setups like Design, Engineering or Founder, installable at once. |
| `skill_info` | Author, license, live stars and installs, files and the rest of the pack. |
| `top_skills` | The highest-ranked skills overall or per category. |

## Try it

Once connected, ask your agent something like:

> Find the best skill to make this pricing page look less AI-generated and use it.

## Privacy

Alyn sees the short task description your agent sends to `find_skills` and which skills it loads. No code, no files. This is used to rank skills by real usage.

More: [alyn.dev/alyn-mcp](https://alyn.dev/alyn-mcp)
