# P0-P2 Priority Roadmap Design

## Goal

Execute the approved whole-project audit backlog in strict priority order without
mixing unrelated user work or weakening the existing chart, payment, indexing,
privacy, and attribution contracts.

The roadmap is complete only when all three priority levels are implemented and
verified:

1. P0 restores a releasable checkout.
2. P1 removes the current performance bottleneck and gives the product a usable
   growth decision loop through conversion reporting, bounded SEO work, and CI.
3. P2 removes stale payment state, hardens abuse controls and CSP, and reduces
   the highest-risk code concentration without a broad rewrite.

## Approved Delivery Approach

Three delivery shapes were considered:

1. **Sequential independent slices (selected):** finish and verify P0, then each
   P1 slice, then P2. This limits regressions and gives every change a measurable
   before/after state.
2. **One big release:** change cache, analytics, SEO, CI, payments, security, and
   architecture together. This has the shortest calendar path but makes failures
   and metric changes difficult to attribute.
3. **Growth-only shortcut:** skip checkout/cache/security debt and ship only SEO
   and CRO. This risks building traffic on an unreliable operational base.

The user explicitly chose the first approach by requesting execution from P0 to
P1 to P2. No visual design decision is required for this architecture-led work;
rendered UI changes will use the existing design system and receive browser QA.

## Global Invariants

- Preserve current public URLs, self-canonicals, sitemap coverage, `llms.txt`,
  chart attribution, and the free-chart-to-paid-reading funnel.
- Do not change astrology calculations or introduce guaranteed finance, fate,
  health, marriage, or career claims.
- Do not bypass authentication, ownership, coin, or verified PayOS gates.
- Purchase tracking remains dependent on server-verified `PaymentOrder.PAID`.
- Analytics never receives names, birth data, email, phone, free text, chart/user
  identifiers, or full URLs.
- Existing uncommitted cover and test work is preserved and completed or isolated;
  it is never swept into an unrelated commit.
- Every production-facing slice uses Node 24 and the repository verification
  ladder. Deployment is a separate, explicit release step after the complete
  implementation is green.

## Slice 0: Releasable Checkout

### Scope

- Remove the unmatched brace in `src/lib/lifetime-tuvi-articles.test.ts`.
- Audit all current dirty lifetime-cover and test changes as one coherent unit.
- Verify that every new SVG/WebP pair has the expected dimensions, file size,
  descriptive alt contract, and article reference.
- Keep Graphify outputs and local skill copies outside product commits.

### Success Contract

- Focused lifetime, cover, CMS, chart ownership, and content tests pass.
- Full lint and Vitest pass from the current checkout.
- `git diff --check` is clean and the intended P0 diff is explainable file by file.

## Slice 1A: Article Cache And Content Read Model

### Problem

`listArticles()` merges and caches the complete seed/CMS article bodies. Sitemap,
knowledge hubs, related-article rendering, and static-parameter generation consume
that multi-megabyte result even when they only need metadata. Next.js refuses to
cache values over 2 MB, producing repeated runtime warnings and avoidable work.

### Architecture

- Introduce one public article-summary/read-model contract containing only the
  fields needed for lists, sitemap, related links, and static params.
- Keep full article bodies available only through a per-slug read path.
- Merge seed and CMS precedence consistently in both summary and detail readers.
- Replace consumers of `listArticles()` with the narrowest reader that satisfies
  their interface. Admin full-content operations keep their existing behavior.
- Cache summaries and individual article details separately. No cached value may
  approach the Next.js 2 MB ceiling.

### Error Handling

Database failures retain the current seed fallback. Missing/deleted articles stay
absent from public output. A summary/detail disagreement is treated as a test
failure, not silently tolerated.

### Success Contract

- Sitemap, home, hub, legacy route, knowledge route, and lifetime route retain
  their current URL and metadata behavior.
- Build and runtime smoke produce no `items over 2MB can not be cached` warning.
- Public warmed TTFB does not regress from the audit baseline.

## Slice 1B: Decision-Grade Conversion Funnel

### Data Model

Add a privacy-safe first-party event sink for decision-grade funnel events that
cannot be reliably reconstructed from GA4 alone. The record stores:

- bounded event name;
- anonymous session identifier generated client-side and rotated with the session;
- authenticated user ID only when already signed in;
- chart ID only for server-side ownership joins and never in GA4;
- normalized acquisition source, landing path class, tool, and categorical event
  dimensions;
- timestamp.

No birth profile, name, email, phone, report text, raw referrer URL, or arbitrary
parameter bag is stored. Retention is bounded and documented.

### Event Flow

The canonical funnel is:

`landing -> tool_view -> submit -> result -> save/register intent -> account -> checkout -> paid -> reading_complete`

- Existing GA4 organic-tool events remain for product analytics.
- Server-confirmed account, checkout, paid, and reading-complete events are written
  from trusted server paths.
- Payment attribution is copied from the owned chart/session into a bounded order
  attribution snapshot so revenue can be grouped by source without trusting client
  purchase events.
- Writes are best-effort for non-financial analytics: an analytics failure must not
  block chart creation or payment settlement.

### Admin Read Side

Add a 7/28-day funnel panel grouped by source and tool. It shows counts and stage
conversion rates, separates anonymous from identified usage, and reports stale
pending orders separately from paid revenue. It never displays raw IP addresses or
anonymous session IDs.

### Result-Page Conversion UX

Use one contextual next-step block after the user has received a useful result:

- guest: save/sign in and keep the result;
- identified user: continue to the most relevant deeper reading;
- paid owner: resume the existing reading.

The block reuses the existing calm copy and payment components. It does not add a
landing-page paywall or shorten free results.

## Slice 1C: Evidence-Led SEO And AEO

### Existing Pages

- Refresh `/xem-ngay` title, description, answer-first opening, and internal links
  only when the current Search Console query/page evidence is still available.
- Preserve the route and canonical.

### New Content

Run the repository SEO planner after Slice 1A. Publish the approved distinct topic
queue one article at a time, starting with the highest-confidence core-star intent.
Each article must pass the existing people-first, unique-data, internal-link, cover,
FAQ/schema, and conversion-CTA gates. The daily publisher remains the mechanism;
this roadmap does not authorize a thin bulk cluster.

### Lifetime Inventory

Do not add another birth-year range during this roadmap. Measure the current 113
URLs for 14-28 days, then use Search Console indexing/impression evidence before
expanding or consolidating.

### AI Discovery

Keep current `llms.txt`, JSON-LD, author, methodology, and editorial-policy surfaces.
Measure whether AI referrals begin landing directly on compatibility, wealth, and
age tools. Add answer blocks or internal links only where the route-specific query
evidence shows a gap; do not add speculative `llms-full.txt` or write-capable agent
endpoints.

## Slice 1D: Continuous Integration Guardrails

Add a GitHub Actions workflow for pull requests and pushes to `master`:

- Node 22 or later with `npm ci`;
- `npm run lint`;
- `npm test`;
- `npm run build`;
- dependency audit at high/critical severity.

Keep the existing weekly Lighthouse workflow. Add a scheduled/manual E2E job for
the non-mutating core journeys; PayOS smoke must use mocks or a dedicated safe test
mode and must never create a real production charge from CI.

## Slice 2A: Payment State Hygiene

- Add a read-only reconciliation job that queries PayOS for old pending orders and
  moves only provider-confirmed terminal orders to `CANCELLED`, `EXPIRED`, or
  `FAILED` using idempotent transitions.
- Never infer `PAID`; settlement still requires the existing verified PayOS proof.
- Add admin age buckets and reconciliation outcome counts.
- Provide a dry-run mode and tests for paid-order immutability, ownership, amount,
  retry, and provider-failure cases.

## Slice 2B: Abuse And Browser Security Hardening

- Replace process-local authentication rate-limit buckets with a database-backed
  fixed-window store that works across restarts and multiple workers.
- Bound storage with expiry cleanup and keep normalized-IP keys irreversible by
  storing an HMAC digest rather than raw IP.
- Keep login and magic-link limits behaviorally compatible.
- Remove CSP `unsafe-eval` after confirming Next.js production and Google tags do
  not require it. Treat removal of `unsafe-inline` as a separate nonce-based future
  project unless it can be proven without widening scope.

## Slice 2C: Targeted Modularity

Do not perform a broad rewrite. Extract only boundaries already touched by the
roadmap:

- article summary/detail merge and cache policy out of the oversized content path;
- analytics event validation/write/read aggregation into dedicated modules;
- payment reconciliation policy out of route handlers;
- admin funnel presentation into a focused component.

`getDb()`, `getCurrentUser()`, and the chart engine remain stable public boundaries.
No import-cycle cleanup project is needed because the current graph has no detected
cycles.

## Verification Strategy

Every behavior change follows RED -> GREEN with focused Vitest coverage. Each slice
then runs the smallest relevant lint/build/browser gate. The final completion audit
requires:

- full lint, all Vitest tests, production build, and high-severity dependency audit;
- local mobile/desktop browser QA for affected public/admin UI;
- safe payment reconciliation dry-run and mocked terminal-state tests;
- production-like cache smoke proving the over-2-MB warning is gone;
- SEO planner and live discovery checks without publishing duplicate intent;
- clean Git scope with generated/local artifacts excluded.

Production deploy is not implied by implementation alone. If release is requested,
use the repository `npm run ship` path and prove local/origin/deployed SHA identity,
PM2 release cwd, public routes, sitemap, and the affected browser flows.

