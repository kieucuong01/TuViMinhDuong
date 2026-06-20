# SEO Content Cluster Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Audit and materially improve every public SEO article, remove shared filler, add two distinct main-star support articles, align cover assets, and update the scheduled publisher to support explicit bounded cluster runs.

**Architecture:** Add a reusable deterministic audit over `ArticleView[]`, enforce it through Vitest, and use its findings to refactor the article inventory without changing public URLs. Keep daily publishing single-article by default, but expose an explicit bounded batch command and update automation documentation and prompt rules.

**Tech Stack:** Next.js 16, React 19, TypeScript, Vitest, Node.js SEO scripts, local WebP assets, Codex Automation, VPS/PM2 deployment.

---

### Task 1: Reusable article quality audit

**Files:**
- Create: `src/lib/content-audit.ts`
- Create: `src/lib/content-audit.test.ts`
- Modify: `src/lib/content.test.ts`

- [ ] **Step 1: Write failing audit tests**

Add fixtures that prove the audit detects repeated long sections, missing CTA/internal links, duplicate canonical/focus keyword values, deterministic claims, missing structured blocks, and placeholder SVG covers.

- [ ] **Step 2: Run the focused tests and confirm failure**

Run:

```powershell
npm test -- src/lib/content-audit.test.ts src/lib/content.test.ts
```

Expected: failure because the audit module and strengthened inventory rules do not exist.

- [ ] **Step 3: Implement the audit module**

Export:

```ts
export type ContentAuditFinding = {
  severity: "error" | "warning";
  code: string;
  slug: string;
  message: string;
};

export function auditArticles(articles: ArticleView[]): ContentAuditFinding[];
```

The implementation must normalize Markdown sections, fingerprint repeated sections of meaningful length, count internal links/H2/table-or-list data blocks, check CTA and cover format, identify duplicate metadata, and scan bounded unsafe-claim patterns.

- [ ] **Step 4: Add full-inventory assertions**

Update `src/lib/content.test.ts` so `auditArticles(seedArticles)` has no errors and public articles have distinct slugs, canonicals, titles, and focus keywords.

- [ ] **Step 5: Run focused tests**

Expected: audit unit fixtures pass; full inventory remains failing until Tasks 2-4 repair the content.

### Task 2: Remove shared filler and repair existing article inventory

**Files:**
- Modify: `src/lib/content.ts`
- Modify: `src/lib/content.test.ts`

- [ ] **Step 1: Remove the append-only refresh mechanism**

Delete `ThinArticleRefresh`, `thinArticleRefreshes`, `renderThinArticleRefresh`, `enrichThinArticleContent`, and the call that appends generated refresh prose in `article()`.

- [ ] **Step 2: Keep the internal SEO article out of public inventory**

Remove `seo-cho-website-tu-vi` from `seedArticles` and any refresh-date/test references. Do not add a replacement public URL.

- [ ] **Step 3: Rewrite every article that depended on the removed mechanism**

Materially expand these articles inside their own `content` fields:

```text
nguyet-van-nhat-van
dai-van-la-gi
cung-quan-loc-trong-tu-vi
cung-tai-bach-trong-tu-vi
tu-vi-hang-ngay-cach-doc-van-khi
cung-tat-ach-trong-tu-vi
cung-thien-di-trong-tu-vi
cung-phu-the-trong-tu-vi
xem-ngay-tot-xau-theo-tuoi
tuan-triet-trong-la-so-tu-vi
sao-chinh-tinh-tu-vi
gio-sinh-trong-tu-vi
cach-doc-la-so-tu-vi-cho-nguoi-moi
```

Each article must receive unique headings, at least two topic-specific structured blocks, causal analysis, limits, contextual links, and an interactive CTA.

- [ ] **Step 4: Clarify overlapping conversion intents**

Revise the opening, tables, CTA, and related-link destination for:

```text
tao-la-so-tu-vi
lap-la-so-tu-vi-chuan
la-so-tu-vi-mien-phi
phan-tich-la-so-tu-vi
la-so-tu-vi-la-gi
```

The pages must respectively own first-use workflow, input accuracy, free-result scope, post-chart analysis order, and broad beginner definition.

- [ ] **Step 5: Audit all remaining articles for unsafe claims and thin unique value**

Repair any finding in the remaining palace, date, monthly, and comparison articles without changing their slugs.

- [ ] **Step 6: Run content tests**

Run:

```powershell
npm test -- src/lib/content-audit.test.ts src/lib/content.test.ts
```

Expected: no content audit errors except missing/replacement cover findings addressed in Task 3.

### Task 3: Upgrade public article covers

**Files:**
- Modify: `public/articles/*.webp`
- Remove from active references: public article `.svg` cover paths
- Modify: `src/lib/content.ts`
- Modify: `src/lib/article-cover-assets.test.ts`

- [ ] **Step 1: Identify active non-WebP public covers**

Generate a list from `seedArticles`, not from all files in `public/articles`.

- [ ] **Step 2: Create 1200x675 editorial WebP replacements**

Create realistic warm-premium covers for every active SVG/PNG article cover. Preserve descriptive `coverAlt`, use no text overlays, and keep each image under 260 KB.

- [ ] **Step 3: Update article image references**

Set `coverImage` and `ogImage` to `/articles/<slug>.webp` and update the in-body Markdown image.

- [ ] **Step 4: Enforce WebP for every public article**

Update `src/lib/article-cover-assets.test.ts` and `src/lib/content.test.ts` to require `.webp` for all `seedArticles`.

- [ ] **Step 5: Run cover tests**

Run:

```powershell
npm test -- src/lib/article-cover-assets.test.ts src/lib/content.test.ts
```

Expected: all public cover assets exist, are 1200x675, and are below the byte limit.

### Task 4: Publish distinct main-star support articles

**Files:**
- Modify: `src/lib/content.ts`
- Add: `public/articles/sao-thien-co.webp`
- Add: `public/articles/sao-thai-duong.webp`
- Modify: `src/lib/content.test.ts`

- [ ] **Step 1: Add failing cluster assertions**

Require the `sao-chinh-tinh-tu-vi` pillar to link to Tử Vi, Thiên Cơ, and Thái Dương. Require each support article to link back to the pillar and to have distinct structured-block markers.

- [ ] **Step 2: Write `sao-thien-co`**

Use a distinct intent around thinking patterns, adaptation, work, and instability. Include at least two specific tables, modifier conditions, causal analysis, limitations, five contextual links, visible FAQ, and `/#lap-la-so`.

- [ ] **Step 3: Write `sao-thai-duong`**

Use a distinct intent around visibility, responsibility, authority, contribution, and differences by palace/context. Do not reuse the Thiên Cơ or Tử Vi section sequence.

- [ ] **Step 4: Update pillar links and metadata**

Add contextual links from `sao-chinh-tinh-tu-vi` and relevant existing articles. Use self-canonical URLs and aligned WebP cover/OG paths.

- [ ] **Step 5: Run cluster tests**

Run:

```powershell
npm test -- src/lib/content-audit.test.ts src/lib/content.test.ts src/lib/article-cover-assets.test.ts
```

Expected: all new and existing articles pass.

### Task 5: Explicit bounded cluster publisher mode

**Files:**
- Modify: `package.json`
- Modify: `scripts/seo/seo-autopilot-execute.mjs`
- Modify: `scripts/seo/seo-autopilot-core.mjs`
- Modify: `src/lib/seo-autopilot-core.test.ts`
- Modify: `docs/agent/seo-autopilot.md`
- Modify: `docs/agent/traffic-autopilot.md`
- Modify: `.codex/skills/tuvi-seo-growth/SKILL.md`

- [ ] **Step 1: Write failing planner/executor tests**

Cover these rules:

```text
default publisher count = 1
explicit cluster count must be 2..5
cluster mode rejects duplicate slugs/intents
cluster mode retains all quality requirements
weekly strategy does not publish automatically
```

- [ ] **Step 2: Add an explicit batch command**

Add a script such as:

```json
"seo:autopilot:cluster": "node scripts/seo/seo-autopilot-execute.mjs --cluster --articles 5 --summary-json"
```

Require the explicit `--cluster` flag and clamp article count to five.

- [ ] **Step 3: Update planner output and safety gates**

Emit a cluster publish action only for explicit cluster runs, with selected slugs, distinct intent evidence, and one shared verification/deploy contract.

- [ ] **Step 4: Update repository documentation and skill**

Document single-article default behavior and explicit user-authorized cluster mode consistently across the three instruction surfaces.

- [ ] **Step 5: Run SEO automation tests and dry runs**

Run:

```powershell
npm test -- src/lib/seo-autopilot-core.test.ts
npm run seo:autopilot:publisher -- --dry-run
npm run seo:autopilot:cluster -- --dry-run
```

Expected: publisher selects one task; cluster selects at most five distinct tasks and does not write production content in dry-run mode.

### Task 6: Update configured Codex automation

**External automation:**
- `laso-seo-publisher-mon-wed-fri-21-00`

- [ ] **Step 1: Read the current configured automation**

Use the Codex automation tool when available. If unavailable, inspect the exact automation directory only after explicit permission and preserve schedule/state.

- [ ] **Step 2: Update the prompt**

Keep scheduled runs single-article by default. Add:

```text
Cluster mode is allowed only when the user explicitly authorizes a one-time batch.
An authorized cluster may include 2-5 articles with distinct intent.
Reject shared-template pages, duplicate intent, and partial batch releases.
Run one verification, commit, push, deploy, and live-smoke sequence for the complete authorized batch.
```

- [ ] **Step 3: Verify schedule and prompt**

Confirm automation ID, Monday/Wednesday/Friday 21:00 schedule, repo working directory, and updated quality contract.

### Task 7: Full verification and production release

**Files:**
- All files changed in Tasks 1-6

- [ ] **Step 1: Run deterministic audit**

Run the audit command/test and confirm zero blocking findings across every public article.

- [ ] **Step 2: Run targeted ESLint**

Run ESLint on all changed TypeScript and JavaScript source/test files.

- [ ] **Step 3: Run full tests**

```powershell
npm test
```

Expected: all tests pass.

- [ ] **Step 4: Run production build**

```powershell
npm run build
```

Expected: build succeeds under bundled Node 20+.

- [ ] **Step 5: Review worktree and commit**

Confirm only relevant content, assets, scripts, tests, docs, and automation artifacts are staged.

- [ ] **Step 6: Push `origin master`**

Push only after tests and build pass.

- [ ] **Step 7: Deploy through VPS releases**

Create `/opt/lasotinhhoa/releases/<timestamp>-<sha>`, copy production `.env*`, run `npm ci` and `npm run build`, switch `/opt/lasotinhhoa/current`, restart/recreate PM2 if needed, and run `pm2 save`.

- [ ] **Step 8: Live smoke**

Verify:

```text
/
/kien-thuc-tu-vi
/sitemap.xml
/kien-thuc-tu-vi/sao-chinh-tinh-tu-vi
/kien-thuc-tu-vi/sao-tu-vi
/kien-thuc-tu-vi/sao-thien-co
/kien-thuc-tu-vi/sao-thai-duong
representative refreshed palace, fortune, and conversion articles
```

Confirm HTTP 200, self-canonical metadata, JSON-LD, rendered tables/lists, WebP covers, and PM2 pointing at the new release.
