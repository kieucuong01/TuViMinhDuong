# Reading CTA, Teaser, and Floating Progress Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the VIP outline CTA destination, expand the guest teaser to 500 words, and replace the report-top resume card with one live floating progress button.

**Architecture:** Keep CTA behavior explicit by purchase state, preserve the existing teaser projection while changing only its word ceiling, and reuse the current paid-reading progress state/API inside a single fixed interactive control. No schema, payment, or generation changes are required.

**Tech Stack:** Next.js 16, React 19, TypeScript, Vitest, CSS.

---

### Task 1: Correct the VIP outline CTA by unlock state

**Files:**
- Modify: `src/components/personalized-report-outline.test.ts`
- Modify: `src/components/personalized-report-outline.tsx`

- [ ] **Step 1: Write the failing unlocked-state assertion**

Change the unlocked test to require:

```ts
expect(html).toContain('href="/la-so/chart-1/nang-cao"');
expect(html).not.toContain('href="#luan-giai"');
```

Keep the locked-state assertions for `popoverTarget="premium-confirm-chart-1"` and absence of hash links.

- [ ] **Step 2: Run the test and confirm RED**

```powershell
npm test -- src/components/personalized-report-outline.test.ts
```

Expected: FAIL because the unlocked CTA still points to `#luan-giai`.

- [ ] **Step 3: Implement the minimal destination fix**

Replace:

```tsx
<Link className="btn btn-primary personal-report-outline-cta" href="#luan-giai">
```

with:

```tsx
<Link className="btn btn-primary personal-report-outline-cta" href={`/la-so/${chartId}/nang-cao`}>
```

- [ ] **Step 4: Run test and confirm GREEN**

```powershell
npm test -- src/components/personalized-report-outline.test.ts
```

Expected: PASS.

### Task 2: Expand the guest teaser to 500 words

**Files:**
- Modify: `src/lib/free-overview-presentation.test.ts`
- Modify: `src/lib/free-overview-presentation.ts`

- [ ] **Step 1: Write failing limit assertions**

Add:

```ts
expect(FREE_OVERVIEW_TEASER_MAX_WORDS).toBe(500);
```

Keep the malformed Markdown fixture at more than 500 words and assert:

```ts
expect(countWords(teaser)).toBe(500);
expect(teaser).not.toContain("từ-599");
```

Also keep assertions that locked sections never appear in structured teaser output.

- [ ] **Step 2: Run the test and confirm RED**

```powershell
npm test -- src/lib/free-overview-presentation.test.ts
```

Expected: FAIL because the current limit is 250.

- [ ] **Step 3: Raise only the teaser ceiling**

```ts
export const FREE_OVERVIEW_TEASER_MAX_WORDS = 500;
```

Do not change section selection or the signed-in full mini-report.

- [ ] **Step 4: Run test and confirm GREEN**

```powershell
npm test -- src/lib/free-overview-presentation.test.ts
```

Expected: PASS.

### Task 3: Replace top resume block with a floating progress button

**Files:**
- Modify: `src/components/paid-reading-experience.test.tsx`
- Modify: `src/components/paid-reading-experience.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Write failing component contract assertions**

Require:

```ts
expect(source).not.toContain('className="paid-reading-resume"');
expect(source).toContain('data-testid="paid-reading-progress-fab"');
expect(source).toContain("Đọc tiếp");
expect(source).toContain("scrollToChapter(chapters[progress.chapterIndex]");
expect(source).toContain('aria-valuenow');
```

Require CSS to contain `.paid-reading-progress-fab`, `position: fixed`, desktop and mobile offsets, and no `.paid-reading-resume`.

- [ ] **Step 2: Run component tests and confirm RED**

```powershell
npm test -- src/components/paid-reading-experience.test.tsx
```

Expected: FAIL because the top resume block still exists and progress is not an interactive button.

- [ ] **Step 3: Implement one floating control**

Remove the top `paid-reading-resume` block. Render:

```tsx
<button
  type="button"
  data-testid="paid-reading-progress-fab"
  className={`paid-reading-progress-fab ${isVisible || showResume ? "is-visible" : ""}`}
  onClick={() => {
    if (showResume) resumeReading();
    else scrollToChapter(chapters[progress.chapterIndex] || chapters[0]);
  }}
  role="progressbar"
  aria-valuemin={0}
  aria-valuemax={100}
  aria-valuenow={showResume ? initialProgress!.percent : progress.percent}
>
  <span>{showResume ? "Đọc tiếp · " : ""}{displayPercent}%</span>
  <span>Chương {displayChapter}/{chapters.length}</span>
  <i style={{ width: `${displayPercent}%` }} aria-hidden="true" />
</button>
```

After `resumeReading`, set `resumeDismissed` so subsequent clicks return to the current chapter heading.

- [ ] **Step 4: Replace CSS with compact floating-button styles**

Delete `.paid-reading-resume` and old `.paid-reading-progress*` rules. Add:

```css
.paid-reading-progress-fab {
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  z-index: 45;
  pointer-events: auto;
}
```

Style it as a compact pill/card with visible focus, internal progress line, and a mobile bottom offset that avoids existing floating controls.

- [ ] **Step 5: Run focused tests and lint**

```powershell
npm test -- src/components/paid-reading-experience.test.tsx src/components/personalized-report-outline.test.ts src/lib/free-overview-presentation.test.ts
npx eslint src/components/paid-reading-experience.tsx src/components/personalized-report-outline.tsx src/lib/free-overview-presentation.ts
```

Expected: PASS.

### Task 4: Full verification

**Files:**
- Modify only files required by a reproduced verification failure.

- [ ] **Step 1: Run the complete checks**

```powershell
$env:PATH="C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;$env:PATH"
npm run lint
npm test
npm run build
git diff --check
git status --short --branch
```

Expected: lint exits 0, all tests pass, build exits 0, and only intended files remain.

- [ ] **Step 2: Browser smoke**

Verify desktop and mobile:

- Locked CTA opens the existing confirmation popup.
- Unlocked CTA points to the advanced report.
- Floating progress button remains visible while scrolling the report.
- Resume click restores the saved position.
- The control does not overlap mobile content or other floating buttons.
- No relevant console errors.

- [ ] **Step 3: Commit implementation**

```powershell
git add src/components/personalized-report-outline.tsx src/components/personalized-report-outline.test.ts src/lib/free-overview-presentation.ts src/lib/free-overview-presentation.test.ts src/components/paid-reading-experience.tsx src/components/paid-reading-experience.test.tsx src/app/globals.css
git commit -m "fix: align reading CTAs and floating progress"
```
