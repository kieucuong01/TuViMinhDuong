# SEO Content Cluster Overhaul Design

Date: 2026-06-19

## Objective

Audit and improve every public knowledge article on lasotinhhoa.vn in one coordinated production release, then expand the strongest topic cluster without creating scaled low-value content.

The release must preserve useful existing URLs, remove repetitive template content, improve article-specific value, update article covers where needed, and align the SEO publisher automations with the new cluster-capable workflow.

## Scope

### Existing content

- Audit every public article returned by `seedArticles` and every live URL in `/sitemap.xml`.
- Keep existing public slugs and canonical URLs unless a concrete duplicate-intent defect requires consolidation.
- Do not delete or redirect indexed URLs in this release.
- Remove the generic `thinArticleRefreshes` append-only pattern from public output.
- Replace generic appended sections with article-specific analysis, structured blocks, internal links, and practical next steps.
- Correct unsafe or absolute claims concerning health, finance, marriage, career, legal matters, and fate.
- Remove public articles that discuss internal SEO implementation from the indexable knowledge inventory. The existing `seo-cho-website-tu-vi` source entry is not a reader-facing astrology topic and must remain non-public or be removed from the public article seed.

### Cluster expansion

- Treat `sao-chinh-tinh-tu-vi` as the pillar for the 14-main-stars cluster.
- Keep `sao-tu-vi` as the first completed support article.
- Add a bounded first cluster expansion covering the highest-priority distinct intents from the current SEMrush plan:
  - `sao-thien-co`
  - `sao-thai-duong`
- Do not create all remaining star pages merely by replacing star names in a template.
- Each new support article must contain unique causal analysis, at least two topic-specific structured data blocks, a contextual chart CTA, and a distinct internal-link path.

## Content Quality Model

Every indexable article must pass these checks:

- One clear reader intent and one primary role in its cluster.
- At least 4,500 characters and 800 editorial words, with longer ranges where the intent requires it.
- At least five contextual internal links, including `/#lap-la-so` and two related knowledge pages.
- At least five useful H2 sections.
- A descriptive local cover image and aligned `coverImage`/`ogImage`.
- No generic filler section shared verbatim across many articles.
- No guarantee or deterministic claim about health, wealth, marriage, career, legal outcomes, or fate.
- No doorway behavior, keyword swapping, copied competitor content, or pages differentiated only by one entity name.
- FAQ schema only when the FAQ is visible in the article.
- Article-specific structured value such as comparison tables, decision matrices, modifier conditions, checklists, source notes, or reading sequences.

## Intent Boundaries

Potentially overlapping pages must have explicit roles:

- `tao-la-so-tu-vi`: practical first-use workflow.
- `lap-la-so-tu-vi-chuan`: input accuracy and preparation.
- `la-so-tu-vi-mien-phi`: what the free result contains and its limits.
- `phan-tich-la-so-tu-vi`: the analysis sequence after a chart exists.
- `la-so-tu-vi-la-gi`: broad beginner pillar.

These pages remain separate only if their title, opening, structured blocks, CTA, and internal-link destinations consistently serve those distinct intents.

## Cover Assets

- Preserve good existing WebP assets.
- Replace indexable article SVG placeholders with 1200x675 WebP covers.
- Covers must use the site's warm premium editorial direction and depict a real or realistic astrology-reading context.
- Avoid text-heavy graphics, generic gradients, horoscope clip art, and unrelated stock imagery.
- New star-cluster covers must be visibly distinct while remaining part of one visual family.

## Implementation Structure

### Audit tooling

Add a deterministic content audit module or script that reports:

- article length and word count
- internal-link and H2 counts
- duplicate or highly similar section fingerprints
- CTA presence
- structured-block count
- unsafe-claim patterns
- cover format and asset existence
- duplicate focus keywords, titles, canonicals, or intents where detectable

The audit must be testable and reusable by the publisher automation.

### Content source

Refactor `src/lib/content.ts` enough to remove shared public filler while preserving the current `ArticleView` contract.

Content may remain in the current file for this release if extraction would add deployment risk. Any helper retained must produce genuinely article-specific output and must not append the same long prose to many pages.

### Tests

Strengthen content tests to enforce:

- no repeated generic refresh blocks
- no public internal-SEO article
- distinct titles, slugs, canonical URLs, and focus keywords
- per-article CTA, link, depth, H2, cover, and structured-value requirements
- cluster-specific links between the pillar and support articles
- no high-risk deterministic claims

## Automation Workflow

### Default daily mode

- Keep the normal scheduled publisher conservative: one high-quality article or material refresh per run.
- Continue to skip rather than publish filler when quality or evidence is insufficient.

### Explicit cluster mode

- Add a bounded cluster/batch option for user-authorized runs.
- Batch mode must require an explicit article count or explicit cluster flag; it must never activate implicitly.
- Before writing, the planner must prove that each selected slug has a distinct intent and does not duplicate an existing URL.
- Maximum default explicit batch size: five articles.
- The entire batch shares one verification, commit, push, and VPS release only after every selected article passes.
- A failure in any selected article blocks the whole production release unless that article is removed from the authorized batch with a documented reason.

### Documentation and automation prompt

Update:

- `package.json` scripts where needed
- `docs/agent/seo-autopilot.md`
- `docs/agent/traffic-autopilot.md`
- `.codex/skills/tuvi-seo-growth/SKILL.md`
- the configured automation `laso-seo-publisher-mon-wed-fri-21-00`

The scheduled automation remains single-article by default. Its prompt must explain that a one-time cluster batch is allowed only when the user explicitly requests it, and must retain all quality, test, deploy, and live-smoke gates.

## Verification

Before production release:

1. Run the reusable content audit and confirm no blocking findings.
2. Run targeted content and cover tests.
3. Run targeted ESLint for changed source/test/script files.
4. Run the full test suite.
5. Run `npm run build`.
6. Inspect the generated sitemap count and sample every changed article for title, canonical, H1, JSON-LD, cover, tables, lists, and internal links.
7. Commit and push only after all checks pass.
8. Deploy through the documented VPS release-symlink path.
9. Verify PM2 points to the new release.
10. Smoke the home page, knowledge hub, sitemap, every newly published URL, and representative refreshed URLs.

## Success Criteria

- Every public article passes the new content-quality audit.
- Shared template filler is no longer rendered.
- Existing URLs remain valid and self-canonical.
- The main-stars pillar links to at least three completed support pages: Tử Vi, Thiên Cơ, and Thái Dương.
- New support articles are materially different in intent, structure, data blocks, analysis, and CTA.
- All public covers are valid local assets; indexable articles no longer rely on generic SVG placeholders.
- Automation documentation and the configured scheduled publisher agree on single-article default behavior and explicit bounded cluster mode.
- Production tests, build, deploy, PM2 verification, and live smoke all pass.

## Non-Goals

- No changes to payment, authentication, database schema, chart engine, date engine, or large URL structure.
- No mass creation of all 14 star pages in one release.
- No backlink purchasing, automated Google queries, or paid SEO APIs.
- No deletion or redirect of existing indexable URLs without a separate review based on Search Console evidence.
