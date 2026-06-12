# Agent Quickstart

Purpose: this is the first low-token context file for any new AI agent. Read this after `AGENTS.md`, then jump to one playbook section instead of scanning the whole repo.

## Product In One Screen

- App: `La so tinh hoa`, Vietnamese tu vi web app for adults 30-60.
- Primary URL: `https://lasotinhhoa.vn`.
- Main funnel: free chart creation -> saved chart -> paid/coin readings.
- Product marketing context: `.agents/product-marketing.md`.
- Trust model: clear Vietnamese copy, no exaggerated fortune promises, money/policy surfaces hidden from guests unless needed for public compliance.
- Stack: Next.js 16 App Router, React 19, TypeScript, Tailwind v4, Prisma 7/Postgres, PayOS/VietQR, Vitest, ESLint, VPS self-hosting with Nginx and PM2.

## Read Only What You Need

- UI/header/mobile/form: `docs/agent/playbooks.md#ui--ux`
- Chart/date engine: `docs/agent/playbooks.md#chart-engine` or `#date-fortune-engine`
- Auth/coins/payment: `docs/agent/playbooks.md#auth-coins-payments`
- SEO/CMS/articles/sitemap: `docs/agent/playbooks.md#seo--cms`
- SEO Autopilot/Codex Automation: `docs/agent/seo-autopilot.md`
- Daily traffic workflow: `docs/agent/traffic-autopilot.md`
- Google Ads/tracking: `docs/agent/playbooks.md#google-ads--conversion-tracking` and `docs/google-ads.md`
- Deploy/prod/env: `docs/agent/playbooks.md#deployment--production`
- Verification commands: `docs/agent/verification.md`
- Long-handoff prompt: `docs/agent/handoff.md`

## Hot Files

- Routes: `src/app/**`
- Server actions: `src/app/actions.ts`
- Header/footer/account UI: `src/components/site-header.tsx`, `src/components/mobile-site-menu.tsx`, `src/components/user-header-badge.tsx`, `src/components/site-footer.tsx`
- Chart engine: `src/lib/chart.ts`, `src/lib/lunar.ts`, `src/lib/chart.fixtures.ts`
- Date engine: `src/lib/date-fortune.ts`
- Auth/session: `src/lib/auth.ts`, `src/app/api/me/route.ts`
- Payments/coins: `src/lib/pricing.ts`, `src/lib/payos.ts`, `src/app/api/payments/**`, `src/app/api/webhooks/payos/route.ts`
- SEO/CMS: `src/lib/seo.ts`, `src/lib/metadata.ts`, `src/app/sitemap.ts`, `src/app/robots.ts`, `src/app/kien-thuc-tu-vi/**`
- SEO Autopilot: `scripts/seo/seo-autopilot-snapshot.mjs`, `scripts/seo/seo-autopilot-core.mjs`, `docs/agent/seo-autopilot.md`
- Traffic Autopilot: `scripts/traffic/traffic-autopilot.mjs`, `docs/agent/traffic-autopilot.md`
- DB schema: `prisma/schema.prisma`, `prisma/migrations/**`

## Non-Negotiable Invariants

- Do not bypass coin/payment gates unless the user explicitly asks for a temporary free mode.
- Do not credit coins from a PayOS return URL. Credits happen after verified webhook/order state.
- `CoinLedger` is the audit trail; `User.coinBalance` is a cache updated in the same transaction.
- Personal chart pages are private/noindex by default.
- AI readings must use chart JSON from the engine; do not recalculate chart logic in prompts/UI.
- Chart/date engine changes need focused fixtures/tests.
- Guest users must not see money-only policy/support links such as refund/topup policy in public footer/contact/sitemap.
- Logged-in users need visible account actions, including logout, saved charts, and coin balance/topup. Payment/refund policy belongs in the footer for logged-in users, not the account menu.

## Current Operational Notes

- Use port `4000` for local app checks.
- Production is on the VPS at `/opt/lasotinhhoa/current`, served by Nginx at `https://lasotinhhoa.vn`, and run by PM2 process `lasotinhhoa` on `127.0.0.1:4100`.
- The database is still the remote PostgreSQL URL from env until a VPS-local DB migration is explicitly requested.
- In Codex on this Windows workspace, `npm` may use Node 18. Next.js 16 needs Node >=20.9. Prefer the bundled Node path from `docs/agent/verification.md` when checks fail with Node/runtime errors.
- Google Ads env values are not committed. Required public envs are documented in `docs/google-ads.md`.
- Purchase conversion must wait for `/api/payments/status?orderCode=...` to return `verified: true`.

## Default Done Checklist

Before final:

1. Check dirty state and avoid unrelated changes.
2. Run the smallest verification ladder from `docs/agent/verification.md`.
3. For UI, verify mobile and desktop behavior when practical.
4. For payment/auth/SEO/indexing, state exactly what was and was not verified.
5. If docs, routes, payment rules, env, or agent workflow changed, update `docs/agent/*`.
