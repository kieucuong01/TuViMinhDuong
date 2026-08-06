# Graphify code map for @ls / Lá Số Tinh Hoa

Purpose: give AI agents a low-token map of the @ls codebase without committing large generated graph artifacts.

## Current baseline

| Field | Value |
|---|---:|
| Source repo | `/opt/lasotinhhoa/source` |
| Graph freshness | Check `GRAPH_REPORT.md` in the durable artifact |
| Graphify mode | `extract --code-only` |
| Token/API cost | `0 input · 0 output` |
| Nodes | `3082` |
| Edges | `6738` |
| Communities | `214` |
| Durable artifact | `/opt/lasotinhhoa/var/graphify/latest/` |

Generated files are intentionally outside the git repo:

```text
/opt/lasotinhhoa/var/graphify/latest/
├── graphify-out/graph.json
├── graphify-out/GRAPH_REPORT.md
├── graphify-out/graph.html
├── diagnose-multigraph.json
└── god-nodes-top10.json
```

## Top architecture hubs from the current graph

| Node | Degree |
|---|---:|
| `getDb()` | 96 |
| `getCurrentUser()` | 57 |
| `generateTuViChart()` | 52 |
| `webPageJsonLd()` | 41 |
| `scripts` | 40 |
| `routeMetadata()` | 33 |
| `TuViChart` | 32 |
| `AdminPage()` | 31 |
| `getOperationSettings()` | 29 |
| `analyzeDate()` | 25 |

Use these as starting points when debugging or planning: DB access, auth/session, chart generation, SEO metadata, admin, settings, and date-fortune flows.

## How agents should use this

1. Start with `AGENTS.md` and `docs/agent/quickstart.md`.
2. For architecture questions, read this note, then inspect:
   - `/opt/lasotinhhoa/var/graphify/latest/graphify-out/GRAPH_REPORT.md`
   - `/opt/lasotinhhoa/var/graphify/latest/god-nodes-top10.json`
   - `/opt/lasotinhhoa/var/graphify/latest/diagnose-multigraph.json`
3. Use `graph.json` only for focused machine queries or path analysis; avoid loading the whole JSON into chat context.
4. Do not treat Graphify output as proof that code is correct. It is a navigation aid; still run targeted tests and live checks.

## Refresh command

Run from repo root. Keep output outside commits unless anh Cường explicitly asks otherwise.

```bash
python3 -m venv /tmp/graphify-ls-venv
/tmp/graphify-ls-venv/bin/python -m pip install -U pip graphifyy
cd /opt/lasotinhhoa/source
OUT="/opt/lasotinhhoa/var/graphify/runs/$(git rev-parse --short=12 HEAD)-$(date -u +%Y%m%dT%H%M%SZ)"
sudo mkdir -p "$OUT"
/tmp/graphify-ls-venv/bin/graphify extract . --code-only --out "$OUT" --force
/tmp/graphify-ls-venv/bin/graphify cluster-only "$OUT" --no-label
/tmp/graphify-ls-venv/bin/graphify diagnose multigraph --graph "$OUT/graphify-out/graph.json" --json | sudo tee "$OUT/diagnose-multigraph.json" >/dev/null
/tmp/graphify-ls-venv/bin/graphify god-nodes --graph "$OUT/graphify-out/graph.json" --top 10 --json | sudo tee "$OUT/god-nodes-top10.json" >/dev/null
sudo ln -sfn "$OUT" /opt/lasotinhhoa/var/graphify/latest
sudo chmod -R a+rX /opt/lasotinhhoa/var/graphify
```

## Guardrails

- Prefer `--code-only` unless semantic docs/media extraction is explicitly needed.
- Do not enable `--watch`, hooks, or cron automation by default.
- Do not commit `graphify-out/`, `src/graphify-out/`, `.codex/skills/graphify/`, or local Graphify venvs/tools.
- If Graphify warns SQL files are skipped, install optional SQL parser only for schema-focused work: `graphifyy[sql]`.
- Treat warnings as graph-quality diagnostics first, not automatic application bugs.
