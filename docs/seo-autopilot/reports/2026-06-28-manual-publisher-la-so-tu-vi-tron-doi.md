# SEO Autopilot Report
Generated: 2026-06-28T05:49:00+07:00
Base URL: https://lasotinhhoa.vn
Status: ok
Mode: manual-publish-override
Sitemap URLs: 48
Seed articles: 37

## Reason
- Publisher rerun after the duplicate-slug fix still selected an already-published support article `tao-la-so-tu-vi`.
- The current user explicitly asked for a new article, not another refresh.
- Manual override published the new slug `la-so-tu-vi-tron-doi` with a production-safe evergreen angle from the existing keyword funnel.

## Published URL
- `https://lasotinhhoa.vn/kien-thuc-tu-vi/la-so-tu-vi-tron-doi`

## Evidence
- SEMrush source: `D:\DU AN CA NHAN WEBSITE\tsh\semrush_la_so_keywords.csv` (`396` rows)
- Search Console: skipped under the launch warm-up window
- Live production snapshot and sitemap were available during the run

## Verification
- Targeted ESLint: `src/lib/content.ts`, `src/lib/content.test.ts`, `src/lib/seo-autopilot-core.test.ts`
- Syntax check: `node --check scripts/seo/seo-autopilot-core.mjs`
- Targeted Vitest: `src/lib/content-audit.test.ts`, `src/lib/content.test.ts`, `src/lib/article-cover-assets.test.ts`, `src/lib/seo-autopilot-core.test.ts`
- `npm test`
- `npm run build`
- Production smoke: `/`, `/kien-thuc-tu-vi`, `/kien-thuc-tu-vi/la-so-tu-vi-tron-doi`, `/sitemap.xml`

## Cover asset
- `/articles/la-so-tu-vi-tron-doi.webp`

## Next priority
- Measure impressions, clicks, CTR, and average position for `la-so-tu-vi-tron-doi`
- Improve the planner so already-published support articles are surfaced as refreshes only when a truly new candidate is unavailable
