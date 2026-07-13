# SEO Autopilot

## Search Console Phase

- Dự án đang trong giai đoạn khởi động nên tập trung **content SEO** trong 2 tháng đầu.
- Trong giai đoạn này, workflow tự động **skip Search Console** và chỉ tối ưu nội dung, sitemap, metadata và luồng nội bộ sang `/#lap-la-so`.
- Mặc định: `SEO_GSC_LAUNCH_DATE=2026-06-14` và `SEO_GSC_GRACE_DAYS=60`.
- Trước khi ra mắt chính thức vượt qua giai đoạn này, có thể giữ/điều chỉnh bằng `SEO_GSC_SKIP_UNTIL` (ví dụ `2026-08-14`).

This workflow lets Codex Automation operate as the SEO Growth Agent for `https://lasotinhhoa.vn`.

## Mission

Increase qualified organic traffic for the Tu vi site and move readers toward the chart creation flow. The agent may decide what SEO/content/performance work is most valuable, implement safe changes, verify them, and report what changed.

The default daily-publisher target is **1 high-quality new article per day**. If the agent cannot produce useful people-first content on a given day because of quality, evidence, queue, or verification blockers, it must report the blocker instead of publishing thin content or silently refreshing an old page.

## Autonomy Scope

The agent may do these without asking first:

- Audit `robots.txt`, `sitemap.xml`, canonical URLs, metadata, H1s, JSON-LD, and article readability.
- Pick SEO topics from missing clusters or Search Console opportunities.
- Draft or update evergreen articles under `/kien-thuc-tu-vi/[slug]`.
- Create or refresh local article cover assets under `public/articles/<slug>.webp` plus matching `coverAlt` and `ogImage`.
- Improve titles, meta descriptions, internal links, FAQ content, Article/Breadcrumb/FAQ schema, and conversion CTAs.
- Run targeted tests, ESLint on touched files, `npm run build`, and live HTTP checks.
- Commit, push, and deploy SEO/content-only changes after verification passes.

The agent must stop and ask before:

- Deleting multiple URLs or retiring an indexed content cluster.
- Changing the public URL structure, domain, canonical domain, or major brand positioning.
- Editing payment, auth, database schema, chart/date engine rules, or paid-reading gates.
- Spending money on ads, paid APIs, or bulk external tools.
- Publishing claims that guarantee outcomes in health, finance, marriage, career, or fate.
- Deploying when tests or build fail.

## Standard Command

Run this first when deciding what to do:

```powershell
$env:PATH="C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;$env:PATH"
npm run seo:autopilot
```

The planner also reads the SEMrush keyword export when available. Default lookup order:

- `SEO_KEYWORD_CSV_PATH`
- `data/seo/semrush_la_so_keywords.csv`
- `D:\DU AN CA NHAN WEBSITE\tsh\semrush_la_so_keywords.csv`

The CSV is used as keyword intelligence, not as an instruction to create one page per keyword. The planner groups keywords by search intent, calculates cluster volume/KD, excludes stale year queries, competitor-navigation queries, and mass birth-year doorway risks, then chooses a pillar/support article path.

The command returns JSON with:

- live snapshot
- technical status
- sitemap URL count
- sampled page metadata
- warnings
- content inventory from `src/lib/content.ts`
- next autonomous action
- weekly content batch with 3 publish-ready briefs
- keyword funnel stage, target character range, internal-link policy, and measurement plan for each article
- keyword intelligence from SEMrush when available: source file, rows read, top clusters, pillar funnel, excluded keyword groups, and do-not-publish patterns
- Search Console feedback when OAuth secrets are available: 28-day clicks, impressions, CTR, average position, top pages, top queries, and refresh opportunities

If live network access is blocked, continue with repo-local checks and say that live snapshot was unavailable.

Search Console defaults:

- Tạm thời: đặt mặc định theo chế độ khởi động
  - `SEO_GSC_LAUNCH_DATE=2026-06-14`
  - `SEO_GSC_GRACE_DAYS=60`
  - `SEO_GSC_SKIP_UNTIL=2026-08-14` nếu cần khóa cứng theo ngày.

- OAuth client path: `SEO_GSC_CLIENT_PATH`, then `%USERPROFILE%\.codex\secrets\lasotinhhoa-gsc-oauth-client.json`, then `%USERPROFILE%\.codex\secrets\bandothanso-gsc-oauth-client.json`
- OAuth token path: `SEO_GSC_TOKEN_PATH`, then `%USERPROFILE%\.codex\secrets\lasotinhhoa-gsc-token.json`, then `%USERPROFILE%\.codex\secrets\bandothanso-gsc-token.json`
- Site property: `SEO_GSC_SITE_URL`, otherwise `https://lasotinhhoa.vn/`
- Skip GSC when needed: `node scripts/seo/seo-autopilot-plan.mjs --skip-search-console`

Trusted external tooling:

- Google Search Central is the policy source for people-first content, spam/doorway risks, structured data, and page experience decisions.
- Lighthouse CI from `GoogleChrome/lighthouse-ci` is the technical regression tool. Use `npm run seo:lighthouse` manually or through the weekly GitHub workflow when checking live SEO/accessibility/best-practice regressions.
- Do not install generic SEO keyword-spinning plugins. New third-party tools must be reputable, scoped, and useful beyond what Search Console, SEMrush export, sitemap checks, and Lighthouse already provide.

Run this when the automation should create durable artifacts for the next work cycle:

```powershell
$env:PATH="C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;$env:PATH"
npm run seo:autopilot:execute
```

For the daily publisher run that should consider and write only the next production new article, use the token-conscious single-task command:

```powershell
$env:PATH="C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;$env:PATH"
npm run seo:autopilot:publisher
```

For a one-time user-authorized cluster release, use the explicit bounded command:

```powershell
npm run seo:autopilot:cluster
```

Cluster mode is never inferred from the weekly plan. It requires explicit user authorization, selects 2-5 distinct intents, and treats the selected articles as one atomic verification and release unit.

This writes:

- `docs/seo-autopilot/drafts/<slug>.md`
- `docs/seo-autopilot/reports/<date>-<slug>.md`
- `docs/seo-autopilot/state.json`

For daily traffic growth beyond publishing, use the lightweight Traffic Autopilot coordinator after the daily publisher:

```powershell
$env:PATH="C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;$env:PATH"
npm run traffic:autopilot
```

Traffic Autopilot does not create extra articles, auto-post, or spend money. It chooses one daily follow-up action such as social-ready copy, internal-link flow, CTA cleanup, publisher follow-up, or weekly measurement. See `docs/agent/traffic-autopilot.md`.

For a local Windows heartbeat outside Codex Automation, run:

```powershell
scripts/seo/install-windows-seo-autopilot-task.ps1
```

That installs `LaSoTinhHoa_SEO_Autopilot`, which runs `scripts/seo/run-seo-autopilot.ps1` every Monday at 08:00 as a planning heartbeat. This only creates SEO Autopilot artifacts; Codex Automation is still the preferred runner for making code/content changes and deploying them.

## Daily Publisher Automation Prompt

Use this prompt for Codex Automation:

```text
You are SEO Autopilot for lasotinhhoa.vn.

Goal: improve qualified organic traffic and route readers toward free chart creation.

Start by reading AGENTS.md, docs/agent/quickstart.md, docs/agent/playbooks.md#seo--cms, docs/agent/playbooks.md#deployment--production, docs/agent/verification.md, and docs/agent/seo-autopilot.md.

Then:
1. Ensure the repo is on `master` and inspect the dirty state before editing.
2. Read `docs/seo-autopilot/state.json` first. Use the newest Sunday weekly handoff if present, then run `npm run seo:autopilot:publisher` for daily runs or `npm run seo:autopilot:execute` only for the Sunday strategy batch.
3. Inspect only the generated draft/report, `docs/seo-autopilot/state.json`, and the repo SEO/content files needed for the selected task.
4. During the launch warm-up window, do not block daily decisions on Search Console. If GSC is skipped, continue with SEMrush, sitemap, live snapshot, and content-inventory evidence and report that GSC was skipped.
5. Scheduled publisher runs ship exactly one selected new article under `/kien-thuc-tu-vi/[slug]`. If the selected slug already exists or the draft quality is not release-ready, the automation must continue to the next distinct CSV-backed topic instead of refreshing the old slug. A one-time cluster of 2-5 articles is allowed only when the user explicitly authorizes it and the run uses `npm run seo:autopilot:cluster`.
6. Treat the draft as input, not as finished output. If the selected article is thin, weakly linked, generic, or missing data blocks, record every failing gate condition, repair all content/metadata/link/data/cover issues in production files during the same run, and rerun the gate. Allow at most 3 substantive repair passes for one candidate without lowering thresholds; after that, reject the candidate and continue to the next distinct SEMrush-backed topic. Never publish a failed draft as a warning or placeholder.
7. Each article must match the funnel brief and include the target character range, at least 5 contextual internal links, at least 1 conversion link to `/#lap-la-so`, at least 2 related knowledge links, at least 2 unique-value data blocks, an expert causal-analysis frame, a compact interactive CTA to `/#lap-la-so`, and visible FAQ only when FAQ schema is used.
8. Create or refresh a local article cover asset for the published slug. The final publish state should prefer a raster `.webp` cover under `public/articles/<slug>.webp` that reads as a believable real photo or photo-editorial scene tied to the article topic, matches the warm premium site style, and is suitable for both list-card thumbnail and social sharing. Prefer no text on the image; if the cover includes visible text, it must be proper Vietnamese with diacritics. Use descriptive `coverAlt`, and keep `coverImage` and `ogImage` aligned unless there is a concrete reason not to.
9. Treat symbolic illustration as a release blocker for fresh production SEO articles. Do not ship a cover that still reads like vector art, iconography, abstract symbolism, generic placeholder art, or text-only SVG unless the user explicitly approves a draft-only exception.
10. Visually inspect the local cover before release. If it does not look like a believable real-world scene, replace it during the same run instead of rationalizing it as “realistic enough”.
11. Skip only for a real blocker: failed verification, duplicate cluster intent, no safe new-topic runway, or content quality that remains unsafe after the 3-pass repair loop. For normal scheduled publisher runs, an existing slug is not publishable output. If the planner selects the same slug again, reject it and continue to the next distinct SEMrush-backed topic instead of refreshing the old article. In cluster mode, one failing article blocks the atomic release unless it is explicitly removed from scope with a documented reason.
12. Do not touch payment, auth, DB schema, chart/date engine rules, or large URL structure.
13. Run targeted tests and targeted ESLint for touched files. When article content or cover assets changed, include `src/lib/content.test.ts` and `src/lib/article-cover-assets.test.ts`. Run `npm test` and `npm run build` only when production content/code changed and before commit/deploy.
14. If verification passes, commit only relevant SEO/content changes, push `origin master`, and deploy through the VPS release path over `ssh tuvi-vps`: update `/opt/lasotinhhoa/source` with `git fetch` and `git reset --hard <sha>`, create a new release dir under `/opt/lasotinhhoa/releases`, copy production `.env*`, `npm ci`, `npm run build`, switch `/opt/lasotinhhoa/current`, restart PM2 `lasotinhhoa`, then verify `pm2 describe lasotinhhoa` points at the new release. If PM2 still points at the old release, recreate the process from `/opt/lasotinhhoa/current` and `pm2 save`.
15. Smoke `https://lasotinhhoa.vn`, `https://lasotinhhoa.vn/kien-thuc-tu-vi`, and the published URL. A publisher run is not complete when it leaves only markdown draft artifacts.
16. Report the production URL or skip reason, article title, funnel keyword, main internal links, cover asset path, evidence used, tests/build/deploy/live smoke results, and what to measure next week: impressions, clicks, CTR, average position.

Keep content useful for Vietnamese adults 30-60. Avoid generic AI filler, exaggerated claims, and hidden SEO notes in public copy. Follow Google Search Central's people-first guidance and spam policies: do not create scaled low-value content to manipulate ranking.
```

## Programmatic SEO Quality Gate

Programmatic SEO is allowed only when the generated page has real unique value beyond prose. Do not create separate near-duplicate pages by swapping variables such as star names, palace names, birth years, or synonym keywords into the same template.

Every automatically drafted article must include:

- Data enrichment: at least two structured blocks, such as score/risk tables, companion-star modifiers, palace context, chart-input logic, or source notes from the app's calculation/data layer.
- Expert prompt frame: analysis must follow causal logic from star/palace nature -> condition/modifier -> likely expression -> limit of interpretation -> practical next step.
- Interactive element: include a concise CTA asking readers to enter birth date/time at `/#lap-la-so` to check whether the discussed pattern appears in their own chart and whether modifiers change the reading.
- A local cover asset plan: subject, composition, and file target under `public/articles/` so the daily publisher does not finish with text-only output.

Stop or downgrade to draft/report-only when the topic would produce thin advice, doorway variants, or a page that cannot add data/tool value.

### `/tra-cuu` pSEO operating procedure

The `/tra-cuu` system is separate from `/kien-thuc-tu-vi`. Do not canonicalize lookup pages back to knowledge articles and do not create a second pSEO stack. The current source of truth is:

- `src/lib/pseo-registry.ts`: entities, matrix drafts, deterministic scores, default metadata and fallback content.
- `src/lib/pseo-curated.ts`: curated/manual publish list and legacy curated content.
- `src/lib/pseo-manual-batch-*.ts|json`: hand-written published batches.
- `src/lib/pseo-audit.ts`: publish/audit gate for thin content, unsafe claims, duplicated body, repeated title/meta patterns, internal links and CTA.
- `src/lib/pseo-data.ts`: published-only data access used by routes and sitemaps.
- `scripts/seed-pseo.ts`: production DB seed; must run before production `next build`.

Publication rules:

- Publish fewer pages with stronger content. Do not expand the matrix just to increase URL count.
- Every published leaf must have star-specific, palace-specific and combination-specific value. A page that only swaps star/palace names is a blocker.
- Body similarity across published lookup pages must stay below the audit guard (`duplicate-template`, currently `>= 0.64` by 7-shingle Jaccard). If the guard fails, rewrite or enrich the pages; do not loosen the threshold without measuring the new maximum similarity and documenting why.
- Title/meta formulas are also audited (`repeated-serp-pattern`). Avoid repeated SERP snippets such as `X cung Y: ý nghĩa và cách đọc` across many URLs. Metadata must express the distinct intent of both the star and the palace.
- Keep safety language for health, finance, marriage, career and fate claims. Lookup pages may suggest questions and patterns, not guaranteed outcomes.
- Every published leaf needs at least 5 internal links, a visible `/#lap-la-so` conversion path, structured blocks, FAQ when FAQ schema is present, and no links to draft-only leaf pages.

Sitemap and indexing:

- Submit `https://lasotinhhoa.vn/sitemap-index.xml` in Google Search Console. The per-star sitemaps under `/tra-cuu/sitemap/[star]` are for crawling/debugging and are referenced by the sitemap index; normally do not submit each child sitemap manually.
- `site:lasotinhhoa.vn` is only a rough SERP sampling tool, not an index-count source of truth. Use Search Console Pages/Sitemaps/URL Inspection for index status and duplicate/canonical diagnostics.
- Draft pages must return 404 publicly and must not appear in pSEO sitemaps.
- Existing indexed URLs should not be removed, redirected, or canonicalized away without Search Console evidence and a separate review.

Verification for `/tra-cuu` changes:

```powershell
$env:PATH="C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;$env:PATH"
node .\node_modules\vitest\vitest.mjs run src\lib\pseo.test.ts src\lib\pseo-sitemap.test.ts src\app\tra-cuu\pseo-routes.test.ts src\components\pseo-pages-ui.test.tsx
```

Before production release, run the normal guarded release path:

```powershell
npm run release:production -- "<message>"
```

That path is expected to run lint, full tests, build, `npm run pseo:seed`, production build, PM2 restart and public smoke. If the worktree contains unrelated dirty files, stash them before release and restore them after deployment because the release script stages with `git add --all`.

## Token And Work Budget

Automation should avoid repeated heavy work. Use the smallest useful loop:

- Publisher runs use `npm run seo:autopilot:publisher`, which limits planning to one selected task and prints summary JSON instead of the full plan.
- Explicit user-authorized cluster runs use `npm run seo:autopilot:cluster`, cap selection at five distinct intents, and share one test/build/commit/deploy sequence.
- Sunday strategy may use the full batch planner because it is the handoff for the week.
- Read `docs/seo-autopilot/state.json` before rerunning the publisher so the automation can detect when the planner selected the same slug again and move on to the next distinct topic instead of regenerating the same draft blindly.
- Lighthouse CI is weekly/manual only. Do not run it inside every publisher automation unless the task changed public SEO layout, metadata, structured data, or page experience.
- Do not run `npm test`, `npm run build`, deploy, or live smoke when no repo/content files changed.
- Prefer targeted tests and targeted ESLint for touched files; run full build only before release.
- When repo/content files did change for the selected slug, the automation must keep iterating on that one article: fix each reported quality-gate failure, rerun the gate, and use at most 3 substantive repair passes before rejecting the candidate. Do not stop at a draft-only handoff just because the first draft is weak, and do not weaken the gate to manufacture a pass.
- When a new article changed the cover asset, verify the local image through `src/lib/article-cover-assets.test.ts` and keep the output suitable for card thumbnails and OG sharing.
- If GSC, SEMrush, sitemap, and content inventory are unchanged from the latest `docs/seo-autopilot/state.json`, do not stop at a short report by default. Continue to the next distinct topic candidate and publish a new article instead of refreshing the previous slug. Report a skip only when a real blocker prevents a safe new publish.
- Use `ssh tuvi-vps` as the default production entrypoint from this Windows machine; do not fall back to password-only SSH unless the user explicitly rotates the key path.
- Keep useful repetition: weekly measurement, GSC opportunity checks, and one daily new-publish slot are worth keeping because they catch trend changes without silently recycling the same page.

## Suggested Schedule

- Daily 21:00: publish exactly one new SEO article when quality and verification pass.
- Daily 21:20: turn the newly published URL into one TikTok/YouTube Shorts/Facebook Reels pack.
- Sunday 20:30: measurement report, refresh recommendations, and next-week 7-slot priorities.

Each scheduled publish automation should create exactly one new production article. A repeated slug is not permission to refresh; it means the planner must move to the next distinct topic from the CSV/topic queue or report a real blocker if no safe new topic remains. A one-time batch is allowed only when the user explicitly asks, uses cluster mode, and every selected page has distinct intent and article-specific value.

## Level 5 SEO Agent Workflow

Use this workflow for autonomous SEO operations:

1. Daily/weekly audit: run `npm run seo:autopilot` or `npm run seo:autopilot:execute`, inspect live snapshot, sitemap, article inventory, SEMrush keyword clusters, and Search Console feedback when the warm-up phase is over.
2. Strategy selection: choose one intent cluster, not one raw keyword. Normal scheduled runs select one page; an explicit cluster run may select 2-5 non-overlapping pages from that cluster.
3. Google-safe filtering: skip stale year pages, competitor-navigation pages, mass birth-year pages, and near-duplicate variants such as separate pages for `lập`, `lấy`, `tạo`, `tra`, `vẽ`, `kẻ` when they answer the same user need.
4. Content decision: pick one of three safe actions: publish a distinct new article, improve the next new candidate until it is release-ready, or stop with a blocker if no safe new topic remains. For the daily publisher automation, the run must end with one real new production article unless a hard blocker stops release. Cluster mode must reject pages that differ only by swapped star, palace, year, or synonym.
5. Production writing: write useful Vietnamese copy for adults 30-60, add contextual internal links, visible FAQ only when useful, at least one natural conversion path to `/#lap-la-so`, and a matching local cover asset that feels like a real scene or realistic editorial illustration for the topic.
6. Verification: run targeted tests plus `npm test` and `npm run build` before commit/deploy, including article cover asset checks when the image changed.
7. Release: commit, push `master`, deploy the VPS production release over `ssh tuvi-vps`, verify PM2 is running from the new release, and smoke test the live home, hub, and changed article URL.
8. Measurement: in the first 2 months, theo dõi live snapshot + nội dung + hành vi nội bộ; sau khi mở Search Console sẽ bổ sung đo tiếp bằng impressions/clicks/CTR/average position và indexed status.

This workflow is intentionally not fully hands-off when verification fails. A failed test/build/deploy is a hard stop, not permission to force a production release.

## Article SEO Standards

Google does not require a fixed word count. Use these ranges as editorial safeguards against thin content, not as ranking tricks:

- broad informational / 14 chinh tinh article: 6,500-9,500 Vietnamese characters
- complex "cach cuc" article: 7,000-10,000 Vietnamese characters
- conversion-support preparation article: 4,500-7,000 Vietnamese characters
- 12-cung support article: 5,500-8,500 Vietnamese characters

Every article must include:

- one clear search intent
- one primary keyword and natural variants
- title, meta title, meta description, canonical URL
- clear H2 sections matching the outline
- one local thumbnail or cover asset suitable for both article cards and OG sharing, with descriptive `coverAlt`
- at least 5 contextual internal links
- no more than 2 exact-match anchors for the same keyword
- at least one useful conversion path to `/#lap-la-so` when relevant
- at least two links to related knowledge pages
- visible FAQ if FAQ schema is used
- safety language for health, finance, marriage, career, and fate claims

Do not publish:

- copied competitor content
- keyword-stuffed paragraphs
- doorway pages made only for search variants
- low-value AI mass content
- claims that guarantee outcomes
- articles written only to hit a word count
- new production articles that still lack a real local cover asset or rely on a generic placeholder visual

Policy basis:

- Google Search Central: `https://developers.google.com/search/docs/fundamentals/creating-helpful-content`
- Google SEO Starter Guide: `https://developers.google.com/search/docs/fundamentals/seo-starter-guide`
- Google Search spam policies: `https://developers.google.com/search/docs/essentials/spam-policies`

## Keyword Funnel Strategy

Default weekly queue:

1. Top funnel: broad informational topic that can earn impressions.
2. Middle funnel: topic that helps readers understand how to interpret a chart.
3. Conversion-support: topic that naturally leads to creating a chart or checking a personal case.
4. Repeat the funnel mix across seven daily slots while avoiding duplicate intent and thin pages.

Measure weekly:

- Search Console impressions, clicks, CTR, average position
- indexed URL count and sitemap coverage
- article route 200/canonical status
- internal clicks toward `/#lap-la-so`, `/xem-ngay`, or paid-reading flows when analytics is available

Improve iteratively:

- If impressions grow but CTR is weak: refresh title/meta and opening.
- If position stalls with relevant impressions: expand useful sections, add FAQ, improve internal links.
- If traffic arrives but does not continue to chart creation: strengthen CTA placement and related links.
- If a topic underperforms after indexing: link to it from stronger pages or fold it into a better cluster.
- If Search Console is unavailable: keep the SEMrush/live-snapshot plan but report the credential/API blocker instead of pretending performance data was reviewed.

## Report Template

```text
SEO Autopilot Report

Status: OK / Warning / Blocked

Changed:
- ...

Reason:
- ...

Verification:
- npm run seo:autopilot: ...
- targeted tests: ...
- targeted ESLint: ...
- npm run build: ...
- live checks: ...

Cover asset:
- ...

Expected SEO impact:
- ...

Next priority:
- ...
```

## Current Best First Moves

The live site already has working robots, sitemap, canonical metadata, and JSON-LD on sampled pages. The highest leverage is usually content depth and topical coverage:

- Build the 14 chinh tinh cluster: `sao-tu-vi`, `sao-thien-co`, `sao-thai-duong`, and related star articles.
- Expand evergreen "how to read a chart" content into specific questions users search.
- Refresh articles that have impressions but weak CTR once Search Console data is available.
- Strengthen internal links from every article back to `/#lap-la-so`, `/xem-ngay`, and related knowledge pages.

## Command Output Contract

`npm run seo:autopilot` returns:

```json
{
  "snapshot": {
    "status": "warning",
    "sitemapUrlCount": 29,
    "warnings": ["4 pages have no JSON-LD"]
  },
  "contentInventory": {
    "seedArticleCount": 24,
    "existingSlugs": ["la-so-tu-vi-la-gi"]
  },
  "plan": {
    "mode": "auto-safe",
    "nextAction": {
      "type": "weekly_content_batch",
      "slugs": ["sao-tu-vi", "sao-thien-co", "sao-thai-duong"],
      "approvalRequired": false
    },
    "weeklyContentPlan": {
      "articlesPerWeek": 7,
      "strategy": "topic-cluster-funnel",
      "articles": [
        {
          "slug": "sao-tu-vi",
          "funnelStage": "top",
          "brief": {
            "targetCharacterRange": { "min": 6500, "max": 9500 },
            "internalLinkPolicy": { "minInternalLinks": 5 }
          }
        }
      ]
    }
  }
}
```

If the action is `single_article_publish`, publisher automation should create only that one new production article. If the selected slug already exists, the planner should reject it and continue to the next distinct topic before publishing. If the action is `cluster_article_publish`, the user has explicitly authorized 2-5 distinct articles and the complete cluster must pass one atomic verification/release gate. If the action is `weekly_content_batch`, the Sunday strategy prepares a queue only and must not publish it.
