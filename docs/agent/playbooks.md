# Agent Playbooks

Use the smallest playbook that matches the task. Each playbook lists what to read first and what "done" usually means.

## UI / UX

Trigger: homepage, header, account UX, forms, buttons, mobile, loading states, chart readability.

Read first:

- `src/app/page.tsx`
- `src/components/site-header.tsx`
- `src/components/chart-form.tsx`
- `src/components/chart-board.tsx`
- `src/app/globals.css`

Rules:

- Optimize for 30-60 year old readers: larger text, clear labels, obvious buttons, fewer decorative badges.
- Keep homepage form-first. New users should be able to create a chart without reading a long hero.
- Use orange/gold CTAs for money actions, but do not cover report content.
- On mobile, sticky CTAs belong near the bottom with enough safe padding and must not cover tabs/chat/widgets.
- For server-action forms, use `LoadingSubmitButton` or `data-loading-message` so the global toast can show progress.

Done:

- Desktop and mobile layouts do not overlap.
- Touch targets are at least about 48px high for primary actions.
- Loading feedback appears for slow form submits and route-like actions.

## Chart Engine

Trigger: can chi, cung, sao, mien/vuong/dac/ham, tuan/triet, dai/tieu/nguyet/nhat van, fixtures.

Read first:

- `src/lib/chart.ts`
- `src/lib/lunar.ts`
- `src/lib/chart.fixtures.ts`
- `src/lib/chart.test.ts`
- `src/lib/chart.fixtures.test.ts`
- `src/components/chart-board.tsx`

Rules:

- Treat this as the most sensitive domain logic. Do not "make it look right" without updating engine data and tests.
- Preserve structured chart JSON for readings.
- If changing a rule, add a named fixture or assertion that explains the convention.
- UI may be modern, but core labels should keep Vietnamese tử vi terminology.

Done:

- Fixture tests pass.
- Important chart fields are visible on desktop and in mobile accordion groups.
- AI evidence can see star states and selected yearly stars.

## Date Fortune Engine

Trigger: `/xem-ngay`, daily fortune card, trực, hoàng đạo/hắc đạo, sao tốt/xấu, activity advice.

Read first:

- `src/lib/date-fortune.ts`
- `src/lib/date-fortune.test.ts`
- `src/components/date-view.tsx`
- `src/components/day-fortune-card.tsx`
- `src/app/xem-ngay/page.tsx`

Rules:

- Avoid hard-coded daily copy unless it is fallback display text.
- Keep the explanation short and practical: good/bad score, reason, suitable activities.
- If adding a new rule family, add tests for at least one known date.

Done:

- Date calculations are deterministic.
- UI makes the selected day, score, and "nên/kỵ" advice easy to scan.

## Auth, Coins, Payments

Trigger: login/register, admin access, PayOS, VietQR, coin balance, paywall, reading unlock.

Read first:

- `src/lib/auth.ts`
- `src/lib/pricing.ts`
- `src/lib/payos.ts`
- `src/lib/data.ts`
- `src/app/api/payments/payos/checkout/route.ts`
- `src/app/api/webhooks/payos/route.ts`
- `prisma/schema.prisma`

Rules:

- Admin can view paid content; guests and normal users should see paywall prompts.
- `CoinLedger` is the truth; `User.coinBalance` is a cache updated in the same transaction.
- PayOS webhook must be idempotent and signature checked when real env is present.
- Do not credit coins from a return URL alone.
- Prefer modal or inline payment entry so users do not lose chart/report context.

Done:

- Not enough coins blocks paid content with a clear next action.
- Repeated webhooks do not double-credit.
- Existing unlocked readings can be viewed without charging again.

## SEO / CMS

Trigger: article pages, admin CMS, metadata, sitemap, robots, brand/domain, OG image, content seed.

Read first:

- `src/lib/seo.ts`
- `src/lib/metadata.ts`
- `src/app/layout.tsx`
- `src/app/sitemap.ts`
- `src/app/robots.ts`
- `src/app/kien-thuc-tu-vi/page.tsx`
- `src/app/kien-thuc-tu-vi/[slug]/page.tsx`
- `src/app/admin/page.tsx`

Rules:

- Public article URLs are `/kien-thuc-tu-vi/[slug]`.
- Include natural visible copy first; metadata and schema support it, not the reverse.
- Keep personal chart pages `noindex` unless explicitly changed.
- When brand/domain changes, update visible UI, metadata base, canonical, sitemap, robots, JSON-LD, favicon/logo assets, and seeded content references.
- SEO score is editorial guidance, not a Google ranking promise.

Done:

- Metadata, canonical, OG/Twitter, sitemap, robots, and JSON-LD stay consistent.
- Article pages remain fast and readable on mobile.

## Deployment / Production

Trigger: Vercel, DATABASE_URL, AUTH_SECRET, migrations, seed admin, live smoke test.

Read first:

- `README.md`
- `prisma/schema.prisma`
- `prisma/migrations/**`
- `scripts/seed-production.mjs`
- `src/lib/env.ts`
- `src/lib/db.ts`

Rules:

- Production DB is PostgreSQL, not local demo fallback.
- Required envs: `DATABASE_URL`, `NEXT_PUBLIC_APP_URL`, `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
- PayOS and Google OAuth only work when their envs exist.
- Run migrations before trusting production data flows.

Done:

- Admin login works.
- Create chart, persist chart, read after restart/deploy.
- CMS article save/read works.
- Payment smoke path is tested with a safe/mock or real PayOS flow as appropriate.

## Performance

Trigger: slow page load, bundle concerns, Lighthouse, Core Web Vitals, heavy components.

Read first:

- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/components/deferred-assistant-widget.tsx`
- `src/components/deferred-social-proof.tsx`
- `src/lib/metadata.ts`
- `next.config.ts`

Rules:

- Keep Server Components by default.
- Defer non-critical widgets and animation-heavy UI.
- Use `next/image` for real images when practical.
- Avoid client components around static content unless interaction requires it.
- Run `npm run build`; use `npm run analyze` only when bundle analysis is needed.

Done:

- Build passes.
- Above-the-fold content loads without relying on heavy client JS.
