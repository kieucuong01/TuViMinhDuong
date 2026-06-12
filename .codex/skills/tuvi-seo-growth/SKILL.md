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
- publisher runs should act on one selected article/refresh only; Sunday strategy can inspect the full 7-slot weekly plan
- daily traffic runs should execute at most one primary follow-up task and must not rerun the daily publisher unless that automation failed or is disabled
- Lighthouse CI is weekly/manual; do not run it for every publisher task unless public SEO layout, metadata, structured data, or page experience changed
- if `nextAction.type` is `weekly_content_batch`, create or update up to 3 seeded articles, then verify
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
- Do not stuff exact-match anchors, copy competitor content, create doorway pages, or mass-produce low-value articles.
- For programmatic SEO topics, require unique value beyond prose: at least two structured data/tool blocks, an expert causal-analysis frame, and an interactive chart-form CTA. If the topic cannot support that, publish fewer articles or create a draft/report only.
- Treat character ranges as anti-thin-content safeguards, not as Google ranking requirements.
