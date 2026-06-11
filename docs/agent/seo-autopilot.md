# SEO Autopilot

This workflow lets Codex Automation operate as the SEO Growth Agent for `https://lasotinhhoa.vn`.

## Mission

Increase qualified organic traffic for the Tu vi site and move readers toward the chart creation flow. The agent may decide what SEO/content/performance work is most valuable, implement safe changes, verify them, and report what changed.

The default publishing target is **3 high-quality articles per week**, not more. If the agent cannot produce useful people-first content for all 3, it should publish fewer and explain why.

## Autonomy Scope

The agent may do these without asking first:

- Audit `robots.txt`, `sitemap.xml`, canonical URLs, metadata, H1s, JSON-LD, and article readability.
- Pick SEO topics from missing clusters or Search Console opportunities.
- Draft or update evergreen articles under `/kien-thuc-tu-vi/[slug]`.
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

For a publisher run that should consider and write only the next production article/refresh, use the token-conscious single-task command:

```powershell
$env:PATH="C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;$env:PATH"
npm run seo:autopilot:publisher
```

This writes:

- `docs/seo-autopilot/drafts/<slug>.md`
- `docs/seo-autopilot/reports/<date>-<slug>.md`
- `docs/seo-autopilot/state.json`

For daily traffic growth beyond publishing, use the lightweight Traffic Autopilot coordinator:

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

## Weekly Automation Prompt

Use this prompt for Codex Automation:

```text
You are SEO Autopilot for lasotinhhoa.vn.

Goal: improve qualified organic traffic and route readers toward free chart creation.

Start by reading AGENTS.md, docs/agent/quickstart.md, docs/agent/playbooks.md#seo--cms, and docs/agent/seo-autopilot.md.

Then:
1. Run `npm run seo:autopilot:publisher` for Mon/Wed/Fri publisher runs, or `npm run seo:autopilot:execute` for the Sunday strategy batch.
2. Inspect the generated draft/report and repo SEO/content files only as needed.
3. For publisher runs, implement at most one selected article/refresh. For Sunday strategy, use plan.weeklyContentPlan as the 3-slot weekly queue unless live evidence points to a higher-impact safe task.
4. Implement up to 3 SEO/content articles per week without asking first, but never more than one production article/refresh per automation run.
5. Each article must follow the brief:
   - target character range from brief.targetCharacterRange
   - at least 5 contextual internal links
   - at least 1 conversion link to /#lap-la-so where relevant
   - at least 2 related knowledge links
   - at least 2 unique-value data blocks from brief.uniqueValueRequirements, such as a score table, modifier-star/context notes, or algorithmic source notes
   - an expert-frame analysis that explains causal logic, not generic AI advice
   - a compact interactive CTA that sends the reader to /#lap-la-so to check the personal chart context
   - FAQ content only when visible FAQ is included
   - no exact-match anchor stuffing
   - no copied, thin, doorway, or mass-produced search-first content
6. Do not touch payment, auth, DB schema, chart/date engine rules, or large URL structure.
7. Run targeted tests, targeted ESLint, npm run build, and live checks when practical.
8. Commit/push/deploy SEO/content-only changes if verification passes.
9. Report what changed, why, verification results, expected SEO impact, measurement plan, and next priority.

Keep content useful for Vietnamese adults 30-60. Avoid generic AI filler, exaggerated claims, and hidden SEO notes in public copy. Follow Google Search Central's people-first guidance and spam policies: do not create scaled low-value content to manipulate ranking.
```

## Programmatic SEO Quality Gate

Programmatic SEO is allowed only when the generated page has real unique value beyond prose. Do not create separate near-duplicate pages by swapping variables such as star names, palace names, birth years, or synonym keywords into the same template.

Every automatically drafted article must include:

- Data enrichment: at least two structured blocks, such as score/risk tables, companion-star modifiers, palace context, chart-input logic, or source notes from the app's calculation/data layer.
- Expert prompt frame: analysis must follow causal logic from star/palace nature -> condition/modifier -> likely expression -> limit of interpretation -> practical next step.
- Interactive element: include a concise CTA asking readers to enter birth date/time at `/#lap-la-so` to check whether the discussed pattern appears in their own chart and whether modifiers change the reading.

Stop or downgrade to draft/report-only when the topic would produce thin advice, doorway variants, or a page that cannot add data/tool value.

## Token And Work Budget

Automation should avoid repeated heavy work. Use the smallest useful loop:

- Publisher runs use `npm run seo:autopilot:publisher`, which limits planning to one selected task and prints summary JSON instead of the full plan.
- Sunday strategy may use the full batch planner because it is the handoff for the week.
- Lighthouse CI is weekly/manual only. Do not run it inside every publisher automation unless the task changed public SEO layout, metadata, structured data, or page experience.
- Do not run `npm test`, `npm run build`, deploy, or live smoke when no repo/content files changed.
- Prefer targeted tests and targeted ESLint for touched files; run full build only before release.
- If GSC, SEMrush, sitemap, and content inventory are unchanged from the latest `docs/seo-autopilot/state.json`, do a short report/skip instead of repeating the same draft.
- Keep useful repetition: weekly measurement, GSC opportunity checks, and one publish/refresh slot per scheduled publisher run are worth keeping because they catch trend changes and prevent stale content.

## Suggested Schedule

- Daily 08:00: audit live SEO, keyword clusters, duplicate-intent risk, and content gaps without publishing unless scheduled.
- Monday 08:00: publish article 1, usually the highest-value pillar/conversion-support topic.
- Wednesday 08:00: publish article 2, usually middle-funnel explanation/comparison.
- Friday 08:00: publish article 3, usually conversion-support or practical preparation.
- Sunday 21:00: measurement report, refresh recommendations, and next-week priorities.

Each publish automation should create or update only one production article. Do not batch all 3 articles in one run unless the user explicitly asks for a one-time batch.

## Level 5 SEO Agent Workflow

Use this workflow for autonomous SEO operations:

1. Daily/weekly audit: run `npm run seo:autopilot` or `npm run seo:autopilot:execute`, inspect live snapshot, sitemap, article inventory, SEMrush keyword clusters, and Search Console feedback.
2. Strategy selection: choose one intent cluster, not one raw keyword. Prefer the `lá số tử vi` pillar funnel first because the SEMrush export shows the largest qualified demand there.
3. Google-safe filtering: skip stale year pages, competitor-navigation pages, mass birth-year pages, and near-duplicate variants such as separate pages for `lập`, `lấy`, `tạo`, `tra`, `vẽ`, `kẻ` when they answer the same user need.
4. Content decision: pick one of three safe actions: refresh an existing pillar, publish one support article, or improve internal links/metadata if no article is strong enough.
5. Production writing: write useful Vietnamese copy for adults 30-60, add contextual internal links, visible FAQ only when useful, and at least one natural conversion path to `/#lap-la-so`.
6. Verification: run targeted tests plus `npm test` and `npm run build` before commit/deploy.
7. Release: commit, push `master`, deploy Vercel production, and smoke test the live home, hub, and changed article URL.
8. Measurement: use Search Console impressions, clicks, CTR, average position, indexed status, and internal clicks toward chart creation to decide whether to refresh a page, add support content, or continue the planned funnel.

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

Policy basis:

- Google Search Central: `https://developers.google.com/search/docs/fundamentals/creating-helpful-content`
- Google SEO Starter Guide: `https://developers.google.com/search/docs/fundamentals/seo-starter-guide`
- Google Search spam policies: `https://developers.google.com/search/docs/essentials/spam-policies`

## Keyword Funnel Strategy

Default weekly batch:

1. Top funnel: broad informational topic that can earn impressions.
2. Middle funnel: topic that helps readers understand how to interpret a chart.
3. Conversion-support: topic that naturally leads to creating a chart or checking a personal case.

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
      "articlesPerWeek": 3,
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

If the action is `weekly_content_batch`, create or update up to 3 seeded articles, run the listed verification commands, then commit/push/deploy only if verification passes.
