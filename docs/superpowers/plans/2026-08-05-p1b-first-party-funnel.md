# P1B First-Party Funnel Implementation Plan

> **Execution note:** Implement server-confirmed financial stages first-class, keep analytics writes best-effort, and never store birth or contact data in funnel records.

**Goal:** Give the owner a privacy-safe 7/28-day decision loop from acquisition through paid reading completion, while giving each result reader exactly one relevant next action.

**Architecture:** Add a bounded `FunnelEvent` append-only model plus a small payment attribution snapshot. A validated same-origin endpoint accepts only early client stages with a session-scoped anonymous ID; trusted server paths write chart result, account, checkout, paid, and reading-complete stages. The admin read model deduplicates actors, groups by source/tool, and renders accessible text-first funnel bars and tables. The existing chart retention panel becomes a single contextual result CTA.

**Stack:** Next.js 16 App Router, Prisma/Postgres, React server components, Vitest, existing GA4/Google Ads instrumentation.

---

## Task 1: Define the privacy and persistence contract

**Files:**
- Modify: `prisma/schema.prisma`
- Add: `prisma/migrations/*_add_funnel_events/migration.sql`
- Add: `docs/analytics/first-party-funnel.md`
- Add: `src/lib/funnel-events.ts`
- Add: `src/lib/funnel-events.test.ts`

1. Write failing tests for the event-name allowlist, source/tool/path normalization, UUID/session bounds, event-specific categorical fields, and forbidden PII/arbitrary keys.
2. Add `FunnelEvent` with optional user/chart relations, a unique dedupe key, bounded categorical columns, and reporting indexes.
3. Add a bounded `PaymentOrder.attribution` JSON snapshot; no raw referrer or contact fields.
4. Implement best-effort writes and 180-day retention pruning without allowing analytics failures to fail product/payment actions.
5. Document the event dictionary, retention, forbidden data, and owner decisions each metric informs.

## Task 2: Add the first-party client boundary

**Files:**
- Add: `src/app/api/analytics/funnel/route.ts`
- Add: `src/app/api/analytics/funnel/route.test.ts`
- Add: `src/lib/first-party-funnel-client.ts`
- Modify: `src/lib/client-analytics.ts`
- Modify: `src/components/google-ads-event-reporter.tsx`
- Modify: `src/components/google-analytics.tsx`

1. Write failing route tests for invalid body, event allowlist, no PII, authenticated user binding, rate limiting, and best-effort `202` behavior.
2. Generate an anonymous UUID in `sessionStorage`, naturally rotating with the browser session.
3. Report landing/tool-view/submit/result/save-intent events using only normalized source, landing class, tool, placement and result band.
4. Keep GA4/Ads behavior unchanged; first-party transport is a separate same-origin best-effort call.
5. Ensure the endpoint never accepts user ID, email, name, birth fields, raw URL/referrer, arbitrary params, or client-provided financial completion.

## Task 3: Write trusted server stages and payment attribution

**Files:**
- Modify: `src/app/actions.ts`
- Modify: authentication completion paths
- Modify: `src/lib/reading-checkout.ts`
- Modify: `src/lib/payos.ts`
- Modify: `src/app/api/readings/[id]/process/route.ts`
- Modify: related tests

1. Add failing tests for server-side `result`, `account`, `checkout`, `paid`, and `reading_complete` writes.
2. Snapshot normalized chart attribution into direct/quick-reading orders and record checkout only after an order exists.
3. Record `paid` only after the existing verified/idempotent settlement succeeds.
4. Record reading completion only after content is persisted as `COMPLETED`.
5. Use stable dedupe keys for chart, order, and reading stages.

## Task 4: Build the 7/28-day admin read side

**Files:**
- Modify: `src/lib/data/contracts.ts`
- Modify: `src/lib/data/admin.ts`
- Modify: `src/lib/data.ts`
- Add: `src/components/admin-funnel-panel.tsx`
- Add: `src/components/admin-funnel-panel.test.tsx`
- Modify: `src/app/admin/page.tsx`
- Modify: `src/app/globals.css`

1. Write failing aggregation tests for distinct actors, sequential conversion rates, source/tool grouping, anonymous versus identified counts, and stale pending orders.
2. Query 28 days once and derive both 7-day and 28-day reports.
3. Render an accessible linear funnel with visible counts/rates and source/tool tables; do not expose session IDs, chart IDs, IPs, or raw attribution.
4. Add URL-based 7/28-day switching with no client bundle and preserve existing admin authorization.
5. Keep mobile tables horizontally safe and all text/controls at accessible sizes.

## Task 5: Make the result CTA contextual

**Files:**
- Modify: `src/components/chart-retention-panel.tsx`
- Modify: `src/components/chart-retention-panel.test.ts`
- Modify: `src/app/la-so/[id]/page.tsx`
- Modify: `src/app/globals.css`

1. Replace the current multi-choice return panel with one next step after the useful result.
2. Guest: sign in/save; identified owner: open the relevant FULL reading offer; paid owner: resume the existing reading.
3. Add bounded `save_intent` click measurement without adding a paywall before free content.
4. Verify focus, touch target, contrast, mobile layout and no duplicate primary CTA inside the block.

## Task 6: Verify and commit P1B

1. Regenerate Prisma client and run migration/schema validation.
2. Run focused funnel, auth, checkout, settlement, reading, admin and result-page tests.
3. Run `npm run lint`, full `npm test`, `npm audit --audit-level=high`, and `npm run build`.
4. Run `git diff --check`, confirm no generated/local artifacts or PII fixtures are staged, then commit P1B separately.

