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
- TikTok / YouTube Shorts / Facebook Reels video pack
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

- Keep the existing daily publisher as the content engine.
- Keep Sunday strategy for measurement and next-week priorities.
- Do not publish more pages just because the daily workflow ran.
- Prefer refreshing titles, metadata, internal links, CTA placement, and articles with Search Console evidence before creating new pages.

Current priority channel: organic short-form video.

- Turn one useful article or chart concept into a 20-35 second video.
- Cross-post a clean native version to TikTok, YouTube Shorts, and Facebook Reels.
- Use one script idea, then adapt caption/CTA/UTM per platform.
- Push viewers to the website for free chart creation, not straight to paid reading.
- Track `utm_source=tiktok`, `utm_source=youtube_shorts`, and `utm_source=facebook_reels`.
- Watch 3-second hold, average watch time, completion, profile/bio clicks, UTM sessions, chart creation starts, and chart creation completes.

Secondary channel: organic community distribution.

- Turn one useful article into a Facebook/Zalo/community discussion only when the topic is welcome.
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

Paid channel: phase next, manual only.

- Paid ads are not part of the current autonomous workflow.
- For now, use organic short-video results to identify winning hooks before spending.
- Require explicit budget, target, tracking labels, and approval before changing ads or running paid traffic.

## Cadence

- Daily 21:00: SEO publisher runs separately and creates or refreshes exactly one SEO article when quality and verification pass.
- Daily 21:20: Traffic Autopilot turns the newly published/refreshed URL into one TikTok/YouTube Shorts/Facebook Reels pack. It must not rerun the publisher unless the dedicated automation failed or was disabled.
- Sunday 20:30: weekly SEO strategy prepares the next seven daily SEO slots before the Sunday publisher run.

## Hard Stops

Stop and ask before:

- auto-posting to Facebook, Zalo, forums, email lists, or messaging channels
- spending money on ads, paid APIs, paid SEO tools, or boosted posts during the current shorts-first phase
- changing payment, auth, coin gate, database schema, chart engine, or date engine
- mass-generating pages by swapping star names, palace names, birth years, or keyword variants
- publishing claims that guarantee personal outcomes
- deploying when tests/build fail

## Automation Prompt

Use this prompt for the daily Codex Automation:

```text
You are Traffic Autopilot for lasotinhhoa.vn.

Goal: grow qualified traffic with organic short-form video first: TikTok, YouTube Shorts, and Facebook Reels. Ads are phase next.

Start by reading AGENTS.md, docs/agent/quickstart.md, .agents/product-marketing.md, docs/agent/seo-autopilot.md, and docs/agent/traffic-autopilot.md.

Then:
1. Run `npm run traffic:autopilot`.
2. Execute only the one primary task in the JSON plan if it is safe and useful.
3. Do not rerun `npm run seo:autopilot:publisher` because the dedicated daily publisher automation already handles it at 21:00. Only run it if that automation failed or was disabled.
4. Apply the imported `coreyhaines31/marketingskills` frameworks from the plan: product context first, content must be searchable/shareable, social should repurpose content atoms into short videos, community should provide value before promotion, CRO should keep one clear CTA, and analytics should name what to measure.
5. Produce one ready-to-record short-video pack: 20-35s script, shot list, TikTok caption, YouTube Shorts title/caption, Facebook Reels caption, UTM links, and website CTA. Do not auto-post externally.
6. On Sunday, use the weekly strategy and measurement signals to choose next week's short-video angles. Run Lighthouse CI only when useful, not daily.
7. Do not touch payment, auth, DB schema, coin gates, chart engine, or date engine.
8. If no useful change is available, report a skip with the reason instead of inventing work.
9. Verify touched files with targeted tests/checks. Run build only before release-worthy repo changes.
10. Report status, evidence, output link/file, verification, and next 24h priority.
```

## Policy Basis

- YouTube Shorts creator guidance: `https://www.youtube.com/creators/shorts/`
- YouTube Shorts help: `https://support.google.com/youtube/answer/10059070`
- TikTok Creative Center: `https://ads.tiktok.com/business/creativecenter/`
- Google Search Central people-first content: `https://developers.google.com/search/docs/fundamentals/creating-helpful-content`
- Google Search spam policies: `https://developers.google.com/search/docs/essentials/spam-policies`
- Google structured data guidance: `https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data`
- Lighthouse CI: `https://github.com/GoogleChrome/lighthouse-ci`
