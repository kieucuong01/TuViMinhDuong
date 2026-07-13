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
- On mobile, keep navigation in the header: menu button on the left for `Lá số`, `Xem ngày`, `Kiến thức`; logo centered; account trigger on the right. Do not reintroduce a bottom nav unless the user explicitly asks.
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
- Build free, paid, preview, and assistant copy from the shared chart evidence profile; the LLM interprets engine output and never recalculates star placement.
- Reading-related LLM calls use DeepSeek first, Groq second, then the deterministic chart-based fallback. Keep provider keys server-side.
- The guest mini-report targets 450-550 Vietnamese words and must connect each important claim to supplied chart evidence.
- Chart AI chat requires a completed `FULL/all` reading for the same user/chart and is limited to three persisted questions.
- If changing a rule, add a named fixture or assertion that explains the convention.
- UI may be modern, but core labels should keep Vietnamese tử vi terminology.
- AI/fallback reading output must keep this fixed order: `Tổng quan`, `Điểm mạnh`, `Điều cần lưu ý`, `Công việc`, `Tài chính`, `Tình cảm`, `Sức khỏe`, `Vận hạn năm`.
- Reading sections should be short, scannable, and practical for mobile readers age 30-60.

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
- `src/components/user-header-badge.tsx`
- `src/app/api/payments/payos/checkout/route.ts`
- `src/app/api/payments/status/route.ts`
- `src/app/api/webhooks/payos/route.ts`
- `prisma/schema.prisma`

Rules:

- Admin can view paid content; guests and normal users should see paywall prompts.
- `CoinLedger` is the truth; `User.coinBalance` is a cache updated in the same transaction.
- PayOS webhook must be idempotent and signature checked when real env is present.
- Do not credit coins from a return URL alone.
- Do not fire purchase conversion from a return URL alone. It must wait for verified paid order state.
- Guests should not see money-only support/policy links in public footer/contact/sitemap.
- Logged-in users should see coin balance, saved charts, logout, and topup from the account menu. Payment/refund policy belongs in the footer for logged-in users.
- Prefer modal or inline payment entry so users do not lose chart/report context.

Done:

- Not enough coins blocks paid content with a clear next action.
- Repeated webhooks do not double-credit.
- Existing unlocked readings can be viewed without charging again.
- Guest public pages do not expose refund/topup policy links unless explicitly intended.
- Logout remains visible on mobile and desktop account menus.

## SEO / CMS

Trigger: article pages, admin CMS, metadata, sitemap, robots, brand/domain, OG image, content seed.

Read first:

- `docs/agent/seo-autopilot.md` for autonomous SEO growth runs
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
- For SEO Autopilot runs, start with `npm run seo:autopilot` and use the snapshot to pick the safest highest-impact task.
- Include natural visible copy first; metadata and schema support it, not the reverse.
- New or materially refreshed SEO articles should ship with a local cover asset under `public/articles/`, preferably a raster `.webp` that reads as a believable real photo or photo-editorial scene related to the topic.
- Match article thumbnails to the existing site language: warm gold/ink palette, calm premium tone, practical astrology context, and no generic stock-collage feel. Reuse the same asset for `coverImage` and `ogImage` unless there is a specific reason not to.
- Do not accept symbolic/vector-like covers for fresh production SEO articles. If the image still reads as iconography, abstract placeholder art, or a staged flat illustration, replace it before release.
- Keep personal chart pages `noindex` unless explicitly changed.
- Keep authenticated/money-only policy routes out of public sitemap unless the user asks otherwise.
- Seed evergreen articles should create an internal link cluster back to `/#lap-la-so`, `/xem-ngay`, and related knowledge articles.
- Use FAQ schema only when the page has visible FAQ content.
- When brand/domain changes, update visible UI, metadata base, canonical, sitemap, robots, JSON-LD, favicon/logo assets, and seeded content references.
- SEO score is editorial guidance, not a Google ranking promise.

Done:

- Metadata, canonical, OG/Twitter, sitemap, robots, and JSON-LD stay consistent.
- The published article has a real local thumbnail or cover asset, descriptive alt text, and the same visual can safely represent the page in list cards and social sharing.
- Article pages remain fast and readable on mobile.

## Google Ads / Conversion Tracking

Trigger: Google Ads env, Tag Assistant, gtag, conversion labels, `/lap-la-so`, purchase tracking, ad landing QA.

Read first:

- `docs/google-ads.md`
- `src/components/google-analytics.tsx`
- `src/components/google-ads-event-reporter.tsx`
- `src/lib/google-ads.ts`
- `src/lib/env.ts`
- `src/app/api/payments/status/route.ts`
- `src/app/lap-la-so/page.tsx`

Rules:

- Never invent `AW-...` IDs or conversion labels. They must come from the user's Google Ads account or production env.
- Do not commit `.env*`; `.env.example` may document variable names only.
- `create_chart` fires after chart creation redirect with `created=1`.
- `begin_checkout` marks checkout intent only.
- `purchase` fires only after `/api/payments/status` verifies the order belongs to the current user and is `PAID`.
- Demo payment status can be used only for safe smoke/demo behavior.
- Landing copy must avoid guaranteed-future or exaggerated claims.

Done:

- Tracking source has dedupe keys for repeat visits.
- Google Ads env names are documented.
- `npm run smoke:google-ads` can catch missing tag/config after deploy when real env values are supplied.
- Manual Tag Assistant smoke confirms the expected AW tag and conversions.

## Deployment / Production

Trigger: VPS deploy, Nginx, PM2, DATABASE_URL, AUTH_SECRET, migrations, seed admin, live smoke test.

Read first:

- `README.md`
- `prisma/schema.prisma`
- `prisma/migrations/**`
- `scripts/seed-production.mjs`
- `src/lib/env.ts`
- `src/lib/db.ts`
- `docs/agent/verification.md`

Rules:

- Production URL is `https://lasotinhhoa.vn`.
- Production app path is `/opt/lasotinhhoa/current`; releases should update that symlink or directory deliberately.
- Preferred SSH entrypoint from this workspace is `ssh tuvi-vps`; keep strict host-key checking and use the dedicated key in the local SSH config instead of password-only SSH.
- PM2 process name is `lasotinhhoa`; internal app port is `127.0.0.1:4100`.
- Nginx owns public HTTP/HTTPS and reverse proxies to the internal app port. Avoid port collisions with the other VPS app on `127.0.0.1:5000`.
- Production DB is PostgreSQL, not local demo fallback.
- DB currently remains remote through `DATABASE_URL`; do not assume a VPS-local database exists until the migration is requested.
- Required envs: `DATABASE_URL`, `NEXT_PUBLIC_APP_URL`, `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
- PayOS and Google OAuth only work when their envs exist.
- Run migrations before trusting production data flows.
- The safe release shape is: after `git push origin master`, SSH to the VPS, update `/opt/lasotinhhoa/source` with `git fetch` and `git reset --hard <sha>`, create `/opt/lasotinhhoa/releases/<timestamp>-<sha>` from that exact commit, copy the production `.env*` files from the current release, run `npm ci` and `npm run build`, then switch `/opt/lasotinhhoa/current` to the new release.
- For post-deploy health, use `pm2 status`, `pm2 logs lasotinhhoa`, Nginx logs, live HTTP checks, and `npm run perf:smoke`.
- Restart PM2 from the active release directory so the process cwd and `.next` build match the deployed release.
- After restart, verify `pm2 describe lasotinhhoa` points `exec cwd` and script path at the new release. If PM2 still points at an older release, recreate the process from `/opt/lasotinhhoa/current` and `pm2 save` instead of trusting a plain restart.

Done:

- Admin login works.
- Create chart, persist chart, read after restart/deploy.
- CMS article save/read works.
- Payment smoke path is tested with a safe/mock or real PayOS flow as appropriate.
- Live route smoke returns 200 for `/`, `/lap-la-so`, `/kien-thuc-tu-vi`, the changed article URL, `/sitemap.xml`, and `/api/me`.

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
- For production speed checks, run `PERF_BASE_URL=https://lasotinhhoa.vn npm run perf:smoke` and pass `PERF_CHART_PATH` for a real chart page when available.

Done:

- Build passes.
- Above-the-fold content loads without relying on heavy client JS.
- Analytics is deferred so it does not block first render, and no obsolete hosted-platform analytics package is mounted in the root layout.
