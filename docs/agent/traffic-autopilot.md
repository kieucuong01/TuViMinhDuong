# Traffic Autopilot

This is the lightweight daily traffic workflow for `https://lasotinhhoa.vn`.

The goal is qualified traffic, not activity volume. The system should perform one useful 80/20 action per day and reuse the existing SEO Autopilot instead of creating duplicate work.

## Daily Command

```powershell
$env:PATH="C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;$env:PATH"
npm run traffic:autopilot
```

The command prints a deterministic JSON plan with:

- one primary task
- selected article URL
- product-marketing context status
- imported marketing framework sources
- social/community snippets
- internal-link or CTA task
- hard stops
- suggested verification/report template

It does not call network APIs, auto-post to social platforms, or spend money.

## Imported Marketing Skills

The workflow imports the useful subset of `coreyhaines31/marketingskills` instead of the whole library:

- `product-marketing`
- `content-strategy`
- `social`
- `community-marketing`
- `free-tools`
- `cro`
- `analytics`
- `ai-seo`

These skills are used as operating frameworks, not as permission to add heavy tooling. The daily planner surfaces them in `marketingFrameworks` so automation can apply the right lens while still doing only one primary task.

Read `.agents/product-marketing.md` before traffic decisions. It defines the audience, conversion action, voice, claims to avoid, and measurement focus for La so tinh hoa.

## 80/20 Channel Mix

Primary channel: SEO content compounding.

- Keep the existing Mon/Wed/Fri publisher as the content engine.
- Keep Sunday strategy for measurement and next-week priorities.
- Do not publish more pages just because the daily workflow ran.
- Prefer refreshing titles, metadata, internal links, CTA placement, and articles with Search Console evidence before creating new pages.

Secondary channel: organic social distribution.

- Turn one useful article into a Facebook/Zalo/community post, a short-video outline, and a compact CTA back to chart creation.
- Post only where the topic is welcome and discussion is real.
- Do not auto-post without approved channel credentials and posting rules.
- Do not promise guaranteed fate, marriage, finance, career, or health outcomes.

Support channel: internal-link flow.

- Add 1-2 contextual links from related articles or hub pages when the relationship is genuinely useful.
- Keep anchors natural. Do not stuff exact-match phrases.
- Every relevant article should offer a concise path to `/#lap-la-so`.

Free-tool channel: only when it is clearly high leverage.

- Prefer simple utilities adjacent to chart creation, such as a checklist, analyzer, or preview that gives immediate value.
- Skip tools that require heavy maintenance or duplicate the existing chart/date engines.
- A free-tool task must have a natural path back to `/#lap-la-so` or saved-chart usage.

Paid channel: manual only.

- Paid ads are not part of the autonomous daily workflow.
- Require explicit budget, target, tracking labels, and approval before changing ads or running paid traffic.

## Cadence

- Monday, Wednesday, Friday: SEO publisher runs separately at 21:00 Ho Chi Minh time. Traffic Autopilot should follow up, distribute, or measure. It must not rerun the publisher unless the dedicated automation failed or was disabled.
- Tuesday, Thursday, Saturday: create one organic distribution package from an existing or newly published article.
- Sunday: review weekly strategy, Search Console opportunities, and Lighthouse-style technical regression signals. Act on one insight only.

## Hard Stops

Stop and ask before:

- auto-posting to Facebook, Zalo, forums, email lists, or messaging channels
- spending money on ads, paid APIs, paid SEO tools, or boosted posts
- changing payment, auth, coin gate, database schema, chart engine, or date engine
- mass-generating pages by swapping star names, palace names, birth years, or keyword variants
- publishing claims that guarantee personal outcomes
- deploying when tests/build fail

## Automation Prompt

Use this prompt for the daily Codex Automation:

```text
You are Traffic Autopilot for lasotinhhoa.vn.

Goal: grow qualified traffic without spam, thin content, duplicated publisher work, or unnecessary token spend.

Start by reading AGENTS.md, docs/agent/quickstart.md, .agents/product-marketing.md, docs/agent/seo-autopilot.md, and docs/agent/traffic-autopilot.md.

Then:
1. Run `npm run traffic:autopilot`.
2. Execute only the one primary task in the JSON plan if it is safe and useful.
3. On Mon/Wed/Fri, do not rerun `npm run seo:autopilot:publisher` because the dedicated publisher automation already handles it at 21:00. Only run it if that automation failed or was disabled.
4. Apply the imported `coreyhaines31/marketingskills` frameworks from the plan: product context first, content must be searchable/shareable, social should repurpose content atoms, community should provide value before promotion, CRO should keep one clear CTA, and analytics should name what to measure.
5. On social/community days, produce ready-to-post copy or update one useful internal-link/CTA flow. Do not auto-post externally.
6. On Sunday, use the weekly strategy and measurement signals to choose one action. Run Lighthouse CI only when useful, not daily.
7. Do not touch payment, auth, DB schema, coin gates, chart engine, or date engine.
8. If no useful change is available, report a skip with the reason instead of inventing work.
9. Verify touched files with targeted tests/checks. Run build only before release-worthy repo changes.
10. Report status, evidence, output link/file, verification, and next 24h priority.
```

## Policy Basis

- Google Search Central people-first content: `https://developers.google.com/search/docs/fundamentals/creating-helpful-content`
- Google Search spam policies: `https://developers.google.com/search/docs/essentials/spam-policies`
- Google structured data guidance: `https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data`
- Lighthouse CI: `https://github.com/GoogleChrome/lighthouse-ci`
