# SEO Strategy Handoff - Week of 2026-06-10

Generated as a mid-week strategy run because the Sunday strategy automation was not active yet.

## Status

- Base URL: `https://lasotinhhoa.vn`
- Live snapshot: warning
- Sitemap URLs: 29
- Seed articles: 23
- Keyword source: `D:\DU AN CA NHAN WEBSITE\tsh\semrush_la_so_keywords.csv`
- Keyword rows read: 396
- Main warning: 4 sampled pages have no JSON-LD

## Strategic Focus

Prioritize the `lá số tử vi` funnel before expanding back into isolated star/cung articles.

The SEMrush export shows the strongest qualified demand in these intent clusters:

- Core `lá số tử vi`: 244 keywords, volume 597130, avg KD 59, pillar `la-so-tu-vi-la-gi`
- `lập/lấy/tạo lá số`: 89 keywords, volume 134170, avg KD 54, pillar `lap-la-so-tu-vi-chuan`
- `bát tự/tứ trụ`: 15 keywords, volume 22370, avg KD 28, pillar `la-so-bat-tu-va-tu-vi`
- `xem/giải/luận/đọc lá số`: 97 keywords, volume 27230, avg KD 47, pillar `cach-doc-la-so-tu-vi-cho-nguoi-moi`
- `chiêm tinh lá số`: 6 keywords, volume 31360, avg KD 56, pillar `chiem-tinh-la-so-va-tu-vi`
- `miễn phí/online`: 25 keywords, volume 12990, avg KD 54, pillar `la-so-tu-vi-mien-phi`

## This Week Publishing Queue

Because this strategy was run on Wednesday 2026-06-10, the nightly publisher should take the first unpublished item, not skip ahead by weekday label.

1. Wednesday 2026-06-10 21:00: publish `tao-la-so-tu-vi`
   - Funnel stage: conversion-support
   - Focus keyword: `tạo lá số tử vi`
   - Target characters: 4500-7000
   - Draft: `docs/seo-autopilot/drafts/tao-la-so-tu-vi.md`
   - Required links: `/#lap-la-so`, `la-so-tu-vi-la-gi`, `cach-doc-la-so-tu-vi-cho-nguoi-moi`, `12-cung-trong-la-so-tu-vi`, `sao-chinh-tinh-tu-vi`, `gio-sinh-trong-tu-vi`

2. Thursday 2026-06-11 21:00: publish `lap-la-so-tu-vi-chuan`
   - Funnel stage: conversion-support
   - Focus keyword: `lập lá số tử vi chuẩn`
   - Target characters: 4500-7000
   - Draft: `docs/seo-autopilot/drafts/lap-la-so-tu-vi-chuan.md`

3. Friday 2026-06-12 21:00: publish `la-so-bat-tu-va-tu-vi`
   - Funnel stage: middle
   - Focus keyword: `lá số bát tự`
   - Target characters: 5500-8500
   - Draft: `docs/seo-autopilot/drafts/la-so-bat-tu-va-tu-vi.md`

4. Saturday 2026-06-13 21:00: refresh `la-so-tu-vi-la-gi`
   - Goal: strengthen the primary pillar and add contextual links to the new support articles that were published earlier in the week.
   - If one of the support articles failed verification and was not published, use Saturday to publish the next unpublished item instead.

## Google-Safe Guardrails

Do not publish:

- Separate pages for `lập`, `lấy`, `tạo`, `tra`, `vẽ`, `kẻ` when they answer the same search intent.
- Old-year pages such as `lá số tử vi 2022`, `2023`, `2024` unless rewritten as a genuinely evergreen guide.
- Competitor/navigation pages targeting `tuvivietnam`, `xemtuong`, `cao anh`, or similar brand queries.
- Mass age/year pages where only the year changes.
- Thin AI pages, copied pages, or keyword-stuffed paragraphs.

## Publishing Requirements

Each nightly publish run must:

- Write into the production content system, not only draft markdown.
- Publish at `/kien-thuc-tu-vi/[slug]`.
- Include at least 5 contextual internal links.
- Include at least 1 conversion link to `/#lap-la-so`.
- Include at least 2 links to related knowledge articles.
- Keep claims careful: no guaranteed health, finance, marriage, career, or fate outcomes.
- Run `npm test` and `npm run build`.
- Deploy only if verification passes.

## Measurement Next Week

Track in Search Console and analytics:

- impressions
- clicks
- CTR
- average position
- indexed status
- internal clicks toward `/#lap-la-so`
- article-to-chart creation continuation
