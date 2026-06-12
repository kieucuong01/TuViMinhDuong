<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes - APIs, conventions, and file structure may differ from your training data. Before changing Next.js APIs, routing, metadata, server actions, caching, or config, read the relevant guide in `node_modules/next/dist/docs/` and heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Agent Router

This repo is the production app for **Lá số tinh hoa** (`https://lasotinhhoa.vn`): a Vietnamese tử vi website with chart creation, paid readings, date fortune, CMS/SEO, PayOS/VietQR, and admin tooling. Production is self-hosted on the VPS, served by Nginx, and run by PM2 as process `lasotinhhoa` on internal port `4100`.

Use this file as the map, not the encyclopedia. Load only the docs and files needed for the current task.

## Read Order

1. Read this file.
2. Read [docs/agent/quickstart.md](docs/agent/quickstart.md) for the low-token project snapshot and task routing.
3. Read only the relevant section in [docs/agent/playbooks.md](docs/agent/playbooks.md).
4. Read [docs/agent/verification.md](docs/agent/verification.md) before claiming completion.
5. Read [docs/agent/README.md](docs/agent/README.md) only when the quickstart/playbook is not enough.
6. For handoff to another agent, use [docs/agent/handoff.md](docs/agent/handoff.md).

## Operating Rules

- Make surgical changes that trace directly to the user request.
- Prefer existing patterns in `src/app`, `src/components`, `src/lib`, and `prisma`.
- Keep public Vietnamese copy clear for adults 30-60: simple wording, large touch targets, no technical jargon.
- Do not change the chart/date engines casually. Add or update fixtures/tests when touching astrology logic.
- Do not bypass coin/payment gates unless the user explicitly asks for a temporary free mode.
- Keep SEO surfaces aligned when brand, domain, routes, or article rendering change.
- Do not route deploy, env, logs, or analytics work through old hosted-platform assumptions; use the VPS/PM2/Nginx production path documented in `docs/agent/playbooks.md`.
- Do not commit generated files, local env files, `.next`, logs, or unrelated dirty work.

## Fast File Map

- App routes: `src/app/**`
- Server actions: `src/app/actions.ts`
- UI components: `src/components/**`
- Tu vi engine: `src/lib/chart.ts`, `src/lib/lunar.ts`, `src/lib/chart.fixtures.ts`
- Date engine: `src/lib/date-fortune.ts`
- Auth/session: `src/lib/auth.ts`
- Database access/fallbacks: `src/lib/db.ts`, `src/lib/data.ts`
- Pricing/payments: `src/lib/pricing.ts`, `src/lib/payos.ts`, `src/app/api/payments/**`, `src/app/api/webhooks/**`
- SEO/CMS: `src/lib/seo.ts`, `src/lib/metadata.ts`, `src/app/sitemap.ts`, `src/app/robots.ts`, `src/app/kien-thuc-tu-vi/**`
- Prisma schema/migrations: `prisma/schema.prisma`, `prisma/migrations/**`

## Verification Ladder

Pick the smallest sufficient set, then say what ran:

```powershell
npm run lint
npm test
npm run build
```

For local browser verification, use port `4000` unless the user asks otherwise.
