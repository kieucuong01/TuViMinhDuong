# P1C Evidence-Led SEO And AEO Implementation Plan

**Goal:** Improve the highest-confidence indexed opportunity without creating duplicate intent, expanding lifetime inventory, or adding speculative AI-only surfaces.

**Evidence:** Search Console for 2026-07-06 through 2026-08-02 reports `/xem-ngay` at 74 impressions, 1 click, 1.35% CTR, and average position 11.85. Its visible queries include “cách chọn ngày tốt theo tuổi”, “ngày đẹp theo tuổi”, “xem ngày hợp tuổi”, and “xem ngày tốt xấu theo tuổi”. The live snapshot is healthy with 221 sitemap URLs and 75 production knowledge articles. A one-article publisher dry-run merges 61 repo articles with 75 live articles into 92 distinct slugs and blocks because no safe new intent remains.

## Task 1: Lock the indexed-page refresh contract

- Add a focused source test for the `/xem-ngay` title, description, H1, answer-first opening, canonical preservation, and contextual internal links.
- Keep the existing route and canonical unchanged.

## Task 2: Refresh `/xem-ngay` for the observed intent

- Lead with a direct answer to how a reader chooses a suitable date by age and task.
- Refresh title and meta description around “xem ngày tốt theo tuổi” and “ngày đẹp cho từng việc” without keyword stuffing.
- Add compact opening links to the three purpose tools and the existing explanatory article.
- Preserve the calculation engine, FAQ/schema, form behavior, and non-deterministic safety language.

## Task 3: Record the bounded growth decision

- Add a dated evidence report with the GSC baseline, live technical baseline, blocked publisher result, 14–28 day measurement target, lifetime-inventory freeze, and AI-referral checks.
- Do not publish a duplicate article, add another lifetime year range, create `llms-full.txt`, or add write-capable agent endpoints.

## Task 4: Verify and checkpoint P1C

- Run the focused SEO/page/AI discovery tests and targeted lint.
- Re-run SEO Autopilot and the one-article dry-run to confirm live evidence and duplicate blocking.
- Run full lint, tests, and production build because a public indexed route changed.
- Run `git diff --check`, review scope, and commit P1C separately.

## Results (2026-08-05)

- Search Console and the live snapshot were available; the `/xem-ngay` refresh is based on finalized query/page evidence rather than inference.
- Updated the route title, description, WebPage schema summary, answer-first H1 opening, and four opening internal links while preserving `/xem-ngay` and the date engine.
- Recorded the 221-URL sitemap, 75 live knowledge articles, 92 merged article slugs, and 113-URL lifetime cluster baseline (hub plus 112 detail pages).
- The one-article publisher dry-run correctly blocked with no safe new distinct intent, so P1C published no duplicate or filler article.
- Focused SEO/content/AI tests passed: 6 files and 74 tests. Full lint passed; full suite passed: 154 files and 814 tests; production build generated 552 pages.
