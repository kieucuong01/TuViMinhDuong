# SEO Autopilot Report
Generated: 2026-07-11T14:22:47.762Z
Base URL: https://lasotinhhoa.vn
Status: blocked
Mode: auto-safe
Sitemap URLs: 71
Seed articles: 46

## Summary
- Daily publisher did not publish a new article.
- Blocker confirmed: after excluding published slugs and overlapping intents, the remaining SEMrush-backed candidates are malformed or low-confidence queries and cannot pass the production quality gate safely.

## Evidence Used
- `docs/seo-autopilot/state.json`
- Latest Sunday handoff: `docs/seo-autopilot/reports/2026-07-06-weekly-content-batch.md`
- `D:\DU AN CA NHAN WEBSITE\tsh\semrush_la_so_keywords.csv` (396 rows)
- Live snapshot from `npm run seo:autopilot:publisher`
- Current content inventory from `src/lib/content.ts`
- Live smoke checks for `/`, `/kien-thuc-tu-vi`, and `/sitemap.xml`

## Rejected Topic
- Generated candidate: `cung-hoang-deo-la-gi`
- Raw keyword evidence: `lá số cung hoång deo` (volume 30, KD 47)
- Rejection reason: malformed keyword text, unclear reader intent, and no safe way to expand it into a people-first article without publishing filler or doorway-style content.

## Remaining SEMrush-backed Runway
- `cung-hoang-deo-la-gi`
- `cung-phu-the-xau-la-gi`
- `co-cung-phu-the-dep-la-gi`
- `yeu-menh-la-gi`

These are the only non-published opportunities returned by the current planner after deduping existing slugs. They are not release-safe because the source queries are malformed or too weak to support a distinct, high-quality article.

## Search Console
- Skipped intentionally under launch warm-up policy in `docs/agent/seo-autopilot.md`.

## Technical Snapshot
- Live snapshot status: `warning`
- Warning: `4 pages have no JSON-LD`

## Live Smoke
- `https://lasotinhhoa.vn` -> `200`
- `https://lasotinhhoa.vn/kien-thuc-tu-vi` -> `200`
- `https://lasotinhhoa.vn/sitemap.xml` -> `200`

## Verification
- `npm run seo:autopilot:publisher` -> completed, selected only malformed SEMrush candidate
- No content tests, ESLint, full `npm test`, build, commit, push, deploy, or article-url smoke were run because no production-safe article was created

## Next Step
- Refresh or clean the SEMrush export before the next daily publisher run so the planner can surface a real new-topic candidate instead of malformed long-tail rows.
