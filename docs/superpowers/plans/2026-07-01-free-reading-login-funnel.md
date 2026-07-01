# Free Reading Login Funnel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show guests a compelling evidence-based teaser, then unlock a roughly 1,200-word free mini-report after login without generating a second AI response.

**Architecture:** Keep one cached free-overview document per chart. Add a pure Markdown projection that returns only guest-safe sections, apply it at both server-render and API boundaries, and render locked-section affordances in the client. Signed-in users continue receiving the full document and are offered the existing VIP flow only after reading it.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Vitest, Markdown content renderer, existing auth/modal and background free-overview pipeline.

---

### Task 1: Expand the free mini-report content contract

**Files:**
- Modify: `src/lib/ai.ts`
- Test: `src/lib/ai.test.ts`

- [ ] **Step 1: Write failing tests for the new contract**

Update the free-overview tests so they assert:

```ts
expect(FREE_OVERVIEW_MIN_WORDS).toBe(1000);
expect(FREE_OVERVIEW_MAX_WORDS).toBe(1400);
expect(prompt).toContain("1.150-1.250");
expect(prompt).toContain("## Mỏ neo");
expect(prompt).toContain("## Điểm đáng chú ý nhất");
expect(prompt).toContain("## Khí chất và nội lực");
expect(prompt).toContain("## Công việc và tài chính");
expect(prompt).toContain("## Tình cảm và quan hệ");
expect(prompt).toContain("## Sức khỏe và nhịp sống");
expect(prompt).toContain(`## Vận năm ${chart.input.viewYear}`);
expect(prompt).toContain("## Cẩm nang hành động");
```

Build a valid 1,050-word fixture with all eight headings and chart evidence. Assert that `isCompleteFreeOverview` accepts it, rejects 999 words, rejects 1,401 words, and rejects a document missing any required heading.

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```powershell
$env:PATH='C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;'+$env:PATH
npm test -- src/lib/ai.test.ts
```

Expected: failures showing the old 400–650 range and old five-heading contract.

- [ ] **Step 3: Implement the new prompt and completion guard**

In `src/lib/ai.ts`:

```ts
export const FREE_OVERVIEW_MIN_WORDS = 1000;
export const FREE_OVERVIEW_MAX_WORDS = 1400;
export const FREE_OVERVIEW_MAX_TOKENS = 6500;
export const FREE_OVERVIEW_VERSION = "free-mini-report-v5";
```

Replace the required headings in `isCompleteFreeOverview` with the eight headings from the design. Update `freeOverviewPrompt` to target 1,150–1,250 words, require three `/100` anchors, require five to seven action bullets, prohibit deterministic future claims, and require evidence to be integrated naturally rather than dumped as a data list.

- [ ] **Step 4: Replace the deterministic fallback with the same eight-part structure**

Rewrite `buildInstantFreeOverview` to return 1,000–1,400 words with:

```md
## Mỏ neo
- **Nội lực: <score>/100** — ...
- **Công việc & tài chính: <score>/100** — ...
- **Vận năm <year>: <score>/100** — ...

## Điểm đáng chú ý nhất
...

## Khí chất và nội lực
...

## Công việc và tài chính
...

## Tình cảm và quan hệ
...

## Sức khỏe và nhịp sống
...

## Vận năm <year>
...

## Cẩm nang hành động
- ...
```

Use existing `buildChartEvidenceProfile`, `getDeepReadingSummary`, palace data, decade data, and score helpers. Every paragraph must connect a chart signal to a practical interpretation. Do not add new astrology calculations.

- [ ] **Step 5: Run the focused test and verify GREEN**

Run the same focused test. Expected: all `src/lib/ai.test.ts` tests pass.

### Task 2: Create a guest-safe Markdown projection

**Files:**
- Create: `src/lib/free-overview-presentation.ts`
- Create: `src/lib/free-overview-presentation.test.ts`

- [ ] **Step 1: Write failing projection tests**

Create tests using a full eight-section Markdown fixture. Assert:

```ts
const teaser = buildFreeOverviewTeaser(fullReport);
expect(teaser).toContain("## Mỏ neo");
expect(teaser).toContain("## Điểm đáng chú ý nhất");
expect(teaser).toContain("## Một hành động nên làm ngay");
expect(teaser).toContain("- Hành động đầu tiên");
expect(teaser).not.toContain("## Công việc và tài chính");
expect(teaser).not.toContain("Hành động thứ hai");
expect(countWords(teaser)).toBeLessThanOrEqual(FREE_OVERVIEW_TEASER_MAX_WORDS);
```

Add a malformed-input test proving the function returns a non-empty, maximum-250-word teaser without exposing text beyond the limit.

- [ ] **Step 2: Run the new test and verify RED**

Run:

```powershell
npm test -- src/lib/free-overview-presentation.test.ts
```

Expected: module/function-not-found failure.

- [ ] **Step 3: Implement the pure projection**

Create:

```ts
export const FREE_OVERVIEW_TEASER_MAX_WORDS = 250;

function extractMarkdownSection(content: string, heading: string): string {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = content.match(new RegExp(`^##\\s+${escaped}\\s*$([\\s\\S]*?)(?=^##\\s+|$)`, "im"));
  return match?.[1]?.trim() || "";
}

function limitWords(content: string, limit: number): string {
  const words = content.trim().split(/\s+/).filter(Boolean);
  return words.length <= limit ? content.trim() : `${words.slice(0, limit).join(" ")}…`;
}

export function buildFreeOverviewTeaser(content: string): string {
  const anchor = limitWords(extractMarkdownSection(content, "Mỏ neo"), 100);
  const highlight = limitWords(extractMarkdownSection(content, "Điểm đáng chú ý nhất"), 115);
  const actions = extractMarkdownSection(content, "Cẩm nang hành động");
  const firstAction = actions.split(/\r?\n/).find((line) => /^\s*[-*]\s+\S/.test(line)) || "";
  const projected = [
    anchor ? `## Mỏ neo\n${anchor}` : "",
    highlight ? `## Điểm đáng chú ý nhất\n${highlight}` : "",
    firstAction ? `## Một hành động nên làm ngay\n${limitWords(firstAction, 30)}` : "",
  ].filter(Boolean).join("\n\n");

  return projected || limitWords(content, FREE_OVERVIEW_TEASER_MAX_WORDS);
}
```

Apply one final `limitWords` call to guarantee the exported maximum.

- [ ] **Step 4: Run the new test and verify GREEN**

Expected: projection tests pass.

### Task 3: Prevent full free reports from reaching guests

**Files:**
- Modify: `src/app/la-so/[id]/page.tsx`
- Modify: `src/app/api/charts/[id]/free-overview/route.ts`
- Modify: `src/app/api/charts/[id]/free-overview/route.test.ts`
- Test: `src/components/free-overview-loader.test.ts`

- [ ] **Step 1: Write failing server-boundary tests**

Mock `getCurrentUser` in the GET route test. For a guest, return a ready report containing a locked phrase and assert the response contains the teaser but not the locked phrase. For a signed-in user, assert the same endpoint returns the full content unchanged.

Add source-contract assertions proving the chart page imports `buildFreeOverviewTeaser` and applies it only when `!user`.

- [ ] **Step 2: Run route and component tests and verify RED**

Run:

```powershell
npm test -- "src/app/api/charts/[id]/free-overview/route.test.ts" src/components/free-overview-loader.test.ts
```

Expected: guest payload still contains the full report and page source lacks the projection.

- [ ] **Step 3: Apply the projection in the GET route**

Import `getCurrentUser`, `buildFreeOverviewTeaser`, and `countWords`. After reading status:

```ts
const user = await timer.time("getCurrentUser", () => getCurrentUser());
const responseOverview = !user && overview.content
  ? {
      ...overview,
      content: buildFreeOverviewTeaser(overview.content),
      wordCount: countWords(buildFreeOverviewTeaser(overview.content)),
    }
  : overview;
```

Return `responseOverview`. Keep `private, no-store`.

- [ ] **Step 4: Apply the projection to server-rendered initial data**

In the chart page, derive guest-safe `initialOverview` and `instantOverviewContent` before passing props:

```ts
const visibleFreeOverviewStatus =
  !user && freeOverviewStatus?.content
    ? { ...freeOverviewStatus, content: buildFreeOverviewTeaser(freeOverviewStatus.content) }
    : freeOverviewStatus;
const visibleInstantFreeOverviewContent =
  !user && instantFreeOverviewContent
    ? buildFreeOverviewTeaser(instantFreeOverviewContent)
    : instantFreeOverviewContent;
```

This prevents full content from entering guest HTML while preserving the cached full report for authenticated requests.

- [ ] **Step 5: Run focused tests and verify GREEN**

Expected: route and component tests pass.

### Task 4: Render the login funnel and preserve reading position

**Files:**
- Modify: `src/components/free-overview-loader.tsx`
- Modify: `src/components/free-overview-loader.test.ts`
- Modify: `src/components/reading-detail-cta.test.ts`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Write failing UI contract tests**

Assert the loader contains:

```ts
expect(loaderSource).toContain("Đăng nhập miễn phí để xem toàn bộ luận giải");
expect(loaderSource).toContain("Lá số này sẽ được giữ nguyên");
expect(loaderSource).toContain("free-overview-locked-sections");
expect(loaderSource).toContain("Khí chất và nội lực");
expect(loaderSource).toContain("Công việc và tài chính");
expect(loaderSource).toContain("Tình cảm và quan hệ");
expect(loaderSource).toContain("Vận năm và cẩm nang hành động");
expect(loaderSource).toContain("#luan-giai");
expect(loaderSource).toContain("Xem hồ sơ luận giải chuyên sâu");
```

Assert CSS contains styles for the guest teaser, locked rows, trust copy, and responsive CTA layout.

- [ ] **Step 2: Run component tests and verify RED**

Run:

```powershell
npm test -- src/components/free-overview-loader.test.ts src/components/reading-detail-cta.test.ts
```

Expected: missing login-funnel copy and locked-section markup.

- [ ] **Step 3: Render guest and signed-in branches**

In `FreeOverviewLoader`:

- Keep polling/retry state unchanged.
- For guests, render `MarkdownContent` using the already projected content, then four locked rows and a `Link` built with:

```ts
const chartPath = `/la-so/${chartId}`;
const nextPath = `${chartPath}#luan-giai`;
loginModalHref(chartPath, undefined, nextPath);
```

- Show trust copy explaining the chart is preserved and the 1,200-word report opens after login.
- For signed-in users, render the full fallback/AI report as today.
- Move the existing `ReadingDetailCta` to a transition block after the full report and label it `Xem hồ sơ luận giải chuyên sâu`.
- Retain retry and background-processing status for both branches.

- [ ] **Step 4: Add focused responsive styles**

Add `.free-overview-guest-gate`, `.free-overview-locked-sections`, `.free-overview-locked-row`, `.free-overview-login-copy`, and `.free-overview-vip-transition`. Use the existing orange/stone palette, minimum 44px CTA height, and a single-column layout on narrow screens.

- [ ] **Step 5: Run focused tests and verify GREEN**

Expected: component and CTA tests pass.

### Task 5: Full verification and scoped commit

**Files:**
- Verify all modified source/test files

- [ ] **Step 1: Inspect the scoped diff**

Run:

```powershell
git status --short
git diff --check
git diff -- src/lib/ai.ts src/lib/ai.test.ts src/lib/free-overview-presentation.ts src/lib/free-overview-presentation.test.ts src/app/la-so/[id]/page.tsx src/app/api/charts/[id]/free-overview/route.ts src/app/api/charts/[id]/free-overview/route.test.ts src/components/free-overview-loader.tsx src/components/free-overview-loader.test.ts src/components/reading-detail-cta.test.ts src/app/globals.css
```

Confirm no generated files or unrelated changes are staged.

- [ ] **Step 2: Run the verification ladder**

Run sequentially:

```powershell
npm run lint
npm test
npm run build
```

Expected: all commands exit 0.

- [ ] **Step 3: Commit only scoped files**

Stage the feature files explicitly and commit:

```powershell
git commit -m "feat: gate expanded free reading behind login"
```

Do not push or deploy unless requested.
