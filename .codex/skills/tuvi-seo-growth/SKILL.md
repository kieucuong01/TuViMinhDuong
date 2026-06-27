---
name: tuvi-seo-growth
description: Use for autonomous SEO/content growth work on lasotinhhoa.vn and the Tu vi app, including audits, article planning, content updates, metadata, sitemap/canonical checks, and Codex Automation reports.
---

# Tu vi SEO Growth

## Read first

1. `AGENTS.md`
2. `docs/agent/quickstart.md`
3. `docs/agent/playbooks.md#seo--cms`
4. `docs/agent/seo-autopilot.md`

## Autonomy

The user allows SEO Autopilot to choose and implement safe SEO/content improvements, then report after completion.

Default throughput: publish or materially refresh **1 high-quality SEO article per day**. Do not turn this into thin daily output. If quality, evidence, or verification is insufficient, report the blocker instead of publishing filler.

Safe without asking:

- article drafts and refreshes under `/kien-thuc-tu-vi/[slug]`
- local article cover and thumbnail assets under `public/articles/<slug>.webp` plus matching `coverAlt`
- metadata, canonical, JSON-LD, FAQ, internal links, article CTA improvements
- sitemap/robots consistency fixes
- safe performance improvements for public SEO pages
- tests, build, live smoke, commit, push, deploy for SEO/content-only changes

Ask before:

- deleting many URLs or changing URL structure
- changing domain, brand positioning, payment/auth/database/chart engine/date engine
- spending money or using paid APIs
- publishing guaranteed health, finance, marriage, career, or fate claims
- deploying when verification fails

## Standard run

```powershell
$env:PATH="C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;$env:PATH"
npm run seo:autopilot
```

For scheduled automation runs that should leave durable artifacts:

```powershell
npm run seo:autopilot:execute
```

For daily publisher runs, prefer the single-task, summary-output command to save tokens:

```powershell
npm run seo:autopilot:publisher
```

For a one-time cluster explicitly authorized by the user:

```powershell
npm run seo:autopilot:cluster
```

Cluster mode may select 2-5 articles only. Every slug must have a distinct reader intent, article-specific data blocks and cover, and the complete selection must pass one atomic verification and release.

For an external technical SEO regression audit, use Lighthouse CI only when useful:

```powershell
npm run seo:lighthouse
```

For the daily traffic coordinator that repurposes SEO work into organic distribution, internal links, and measurement without duplicating publisher runs:

```powershell
npm run traffic:autopilot
```

Traffic work should read `.agents/product-marketing.md` and apply the imported `coreyhaines31/marketingskills` subset only as lightweight frameworks: content-strategy, social, community-marketing, free-tools, CRO, analytics, and AI SEO. Current traffic phase is organic short-video first: one TikTok/YouTube Shorts/Facebook Reels pack per day, ads later. Keep the daily limit to one primary task.

Then choose the highest-impact safe SEO task, implement it, verify, and report:

- use `plan.nextAction` and `plan.brief` from the command output as the default decision
- scheduled publisher runs should act on one selected article/refresh only; an explicit user-authorized cluster run may act on 2-5 distinct articles
- daily traffic runs should execute at most one primary follow-up task and must not rerun the daily publisher unless that automation failed or is disabled
- Lighthouse CI is weekly/manual; do not run it for every publisher task unless public SEO layout, metadata, structured data, or page experience changed
- publisher runs should treat `single_article_publish` as one production article/refresh; `cluster_article_publish` is allowed only with explicit user authorization; Sunday strategy may inspect `weekly_content_batch` but should not publish it
- for normal daily publisher runs, the same slug is not a skip reason by itself; if the planner selects the same slug again, ship a material refresh rather than a no-op report
- each article must follow `brief.targetCharacterRange`, `brief.internalLinkPolicy`, `brief.googleQualityPolicy`, and the funnel stage in `plan.weeklyContentPlan`
- if live evidence contradicts the generated plan, choose the safer higher-impact SEO task and explain why

- what changed
- why it was chosen
- tests/build/live checks
- expected SEO impact
- next priority

Content quality rules:

- Write people-first content for a real reader question, not content made only for rankings.
- Use at least 5 contextual internal links and at least one useful conversion path to `/#lap-la-so` when relevant.
- For new publisher articles, create a local raster cover asset that reads as a believable real photo or photo-editorial scene tied to the article topic. Prefer `.webp`, keep the visual language aligned with the site, prefer no text on the image, and if text is necessary it must be proper Vietnamese with diacritics.
- Treat vector-like, symbolic, icon-only, abstract, or flat illustrative covers as failed output for fresh production SEO articles. If the image still looks like a stand-in concept instead of a real scene, replace it before release.
- Do not stuff exact-match anchors, copy competitor content, create doorway pages, or mass-produce low-value articles.
- For programmatic SEO topics, require unique value beyond prose: at least two structured data/tool blocks, an expert causal-analysis frame, and an interactive chart-form CTA. If the topic cannot support that, publish fewer articles or create a draft/report only.
- Do not return a short duplicate-run skip just because GSC, SEMrush, sitemap, and content inventory look unchanged. On publisher runs, convert that situation into a concrete article refresh unless a real blocker prevents safe release.
- Treat character ranges as anti-thin-content safeguards, not as Google ranking requirements.
