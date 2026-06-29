---
name: headroom-default
description: Use automatically in this repo when Codex works with large logs, JSON payloads, database rows, build/test output, audit results, or any long tool output where Headroom MCP compression can reduce context tokens. Also use near task completion when reporting Headroom token savings.
---

# Headroom Default

## Default behavior

Use Headroom without waiting for the user to ask when an output is large enough to waste context.

Prefer Headroom for:

- build, lint, test, deploy, PM2, or server logs over about 120 lines
- JSON arrays or API/database result sets over about 10 KB
- SQL/query result previews with many rows
- crawler, audit, sitemap, SEO, analytics, or telemetry dumps
- repeated stack traces or repeated tool output

Do not use Headroom for short code snippets, small diffs, exact file reads, or short `rg` output. Direct inspection is faster and more accurate there.

## Codex workflow

For Codex Desktop/CLI, keep the normal OpenAI connection and use the registered MCP tools on demand:

- `headroom_compress` before analyzing large output
- `headroom_retrieve` only when exact original evidence is needed
- `headroom_stats` near the end of a task when savings are relevant

After compressing, analyze the compressed result first. Retrieve the original only for exact line-level evidence, error text, or commands that need verbatim output.

## Claude Code workflow

For Claude Code, prefer the project wrapper when starting a session:

```powershell
npm run agent:headroom:claude
```

The project `.mcp.json` also registers the same Headroom MCP server for Claude Code.

## Reporting

When Headroom is used materially, include the saved-token evidence in the final answer. Use the stats tool or repo script:

```powershell
npm run agent:headroom:stats
```

Report the relevant field:

- MCP usage: `summary.mcp.tokens_removed`
- proxy usage: `summary.compression.total_tokens_removed`
- total proxy dashboard: `tokens.saved`
