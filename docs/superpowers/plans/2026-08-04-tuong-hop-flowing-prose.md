# Flowing Compatibility Prose Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render every compatibility theme as one friendly, flowing Vietnamese prose passage instead of four visibly separated explanation, scenario, action, and question blocks.

**Architecture:** Keep the structured rule outputs because they make chart logic testable, then add a deterministic `composeThemeProse` editorial boundary in `chart-compatibility-narrative.ts`. The composer blends those parts through topic-specific transitions and endings, while the report UI consumes only the resulting `prose` field and keeps chart evidence collapsed below it.

**Tech Stack:** TypeScript, React/Next.js 16, Vitest, existing client-side compatibility engine and CSS.

## Global Constraints

- No LLM, API, network request, persistence, or random output.
- Keep chart placement and compatibility scoring unchanged.
- Each theme renders one prose block of roughly 160–230 Vietnamese words.
- Do not display the four labels or action/question lists in the main reading.
- Keep “Căn cứ từ hai lá số”, methodology, disclaimer, form, metadata, schema, and sitemap unchanged.
- Preserve deterministic output and report-wide duplicate prevention.
- Keep body text at least 16px, line-height about 1.7–1.8, and desktop line measure at 65–75 characters.
- Avoid deterministic relationship, marriage, separation, partnership, or financial verdicts.

---

### Task 1: Add a deterministic prose composer

**Files:**
- Modify: `src/lib/chart-compatibility-narrative.ts`
- Modify: `src/lib/chart-compatibility-narrative.test.ts`

**Interfaces:**
- Add to `ThemeNarrative`: `prose: string`.
- Produce: `composeThemeProse(input: ProseComposerInput, ledger: NarrativeLedger): string`.
- `ProseComposerInput` contains `context`, `summary`, `whyItMatters`, `possibleExpression`, `actions`, and `questions`.

- [ ] **Step 1: Write failing behavioral tests for the prose contract**

```ts
it("composes one complete prose reading with guidance and a reflective close", () => {
  const result = buildThemeNarrative(makeContext("communication"), new NarrativeLedger());

  expect(result.prose.length).toBeGreaterThan(700);
  expect(result.prose.length).toBeLessThan(1_800);
  expect(result.prose).toContain("Minh");
  expect(result.prose).toContain("An");
  expect(result.prose).toMatch(/\?$/);
  expect(result.prose).not.toMatch(/Góc nhìn chính|Khi đi vào đời sống|Việc hai người có thể thử|Câu hỏi nên trao đổi/);
});

it("keeps prose stable for identical chart context", () => {
  const first = buildThemeNarrative(makeContext("finance"), new NarrativeLedger()).prose;
  const second = buildThemeNarrative(makeContext("finance"), new NarrativeLedger()).prose;
  expect(second).toBe(first);
});
```

The production break these tests catch is returning fragments without an integrated closing or introducing random editorial choices.

- [ ] **Step 2: Run the narrative test and confirm RED**

Run:

```powershell
& 'C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' node_modules\vitest\vitest.mjs run src/lib/chart-compatibility-narrative.test.ts
```

Expected: FAIL because `ThemeNarrative.prose` does not exist.

- [ ] **Step 3: Implement the composer and theme-specific endings**

Add:

```ts
type ProseComposerInput = Pick<ThemeNarrative, "summary" | "whyItMatters" | "possibleExpression" | "actions" | "questions"> & {
  context: NarrativeContext;
};

type ProseClosingWriter = (input: ProseComposerInput, question: string) => string;
```

Create `PROSE_CLOSINGS: Record<CompatibilityNarrativeThemeKey, NarrativeVariant<ProseClosingWriter>[]>` with at least two closing families per theme. Each writer must:

1. introduce the first action as a small experiment rather than an order;
2. connect the second action with a natural transition;
3. end with one selected question and preserve its question mark;
4. use wording unique to that theme.

Use helpers with exact behavior:

```ts
function trimSentence(value: string) {
  return value.trim().replace(/[.!?]+$/, "");
}

function lowerFirst(value: string) {
  return value ? `${value[0].toLocaleLowerCase("vi")}${value.slice(1)}` : value;
}
```

Add `closingFamilies` to `NarrativeLedger`. Select one closing with `selectStableVariant` using `${context.seed}:${context.key}:closing`, record its family, then return:

```ts
[summary, whyItMatters, possibleExpression, closing].join(" ").replace(/\s+/g, " ").trim()
```

- [ ] **Step 4: Run the narrative test and confirm GREEN**

Run the command from Step 2. Expected: all narrative tests PASS.

- [ ] **Step 5: Commit the composer**

```powershell
git add src/lib/chart-compatibility-narrative.ts src/lib/chart-compatibility-narrative.test.ts
git commit -m "feat: compose compatibility readings as flowing prose"
```

### Task 2: Promote prose into the public report and audit the final text

**Files:**
- Modify: `src/lib/chart-compatibility.ts`
- Modify: `src/lib/chart-compatibility.test.ts`
- Modify: `src/lib/chart-compatibility-narrative.ts`
- Modify: `src/lib/chart-compatibility-narrative.test.ts`

**Interfaces:**
- Add `prose: string` to `ChartCompatibilityTheme`.
- `themeReport` maps `narrative.prose` without changing level, evidence, scoring, or existing structured fields.
- `auditNarrativeUniqueness` consumes `Array<Pick<ThemeNarrative, "prose">>` and audits only the text users read.

- [ ] **Step 1: Write failing report tests**

```ts
it("returns one reader-facing prose passage for every theme", () => {
  const report = buildChartCompatibilityReport(first, second);
  expect(report.themes).toHaveLength(6);
  expect(report.themes.every((theme) => theme.prose.length >= 700)).toBe(true);
  expect(report.themes.every((theme) => theme.prose.length <= 1_800)).toBe(true);
});

it("audits the final prose rather than hidden structured fragments", () => {
  const audit = auditNarrativeUniqueness([
    { prose: "Minh cần một khoảng lặng trước khi nói tiếp. Hai người nên hẹn giờ quay lại." },
    { prose: "Minh cần một khoảng lặng trước khi nói tiếp! Hai người có thể thử hẹn giờ quay lại." },
  ]);
  expect(audit.duplicateSentences).toContain("minh cần một khoảng lặng trước khi nói tiếp");
});
```

- [ ] **Step 2: Run engine tests and confirm RED**

Run:

```powershell
& 'C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' node_modules\vitest\vitest.mjs run src/lib/chart-compatibility-narrative.test.ts src/lib/chart-compatibility.test.ts
```

Expected: FAIL because report themes and audit inputs do not yet use `prose`.

- [ ] **Step 3: Wire `prose` through the report and switch uniqueness auditing**

Change `NarrativeTextBlock` to:

```ts
export type NarrativeTextBlock = Pick<ThemeNarrative, "prose">;
```

In `auditNarrativeUniqueness`, replace the three-block array with:

```ts
const blocks = [theme.prose];
```

In `themeReport`, add:

```ts
prose: narrative.prose,
```

Keep structured fields until UI migration is complete.

- [ ] **Step 4: Run both engine test files and confirm GREEN**

Run the Step 2 command. Expected: both files PASS.

- [ ] **Step 5: Commit report integration**

```powershell
git add src/lib/chart-compatibility.ts src/lib/chart-compatibility.test.ts src/lib/chart-compatibility-narrative.ts src/lib/chart-compatibility-narrative.test.ts
git commit -m "refactor: audit the final compatibility prose"
```

### Task 3: Replace four visible content blocks with one editorial passage

**Files:**
- Modify: `src/components/chart-compatibility-tool.tsx`
- Modify: `src/components/chart-compatibility-tool.test.ts`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: `theme.prose`.
- Produces: one `.compatibility-theme-prose` paragraph followed by the existing evidence details.

- [ ] **Step 1: Write a failing source-contract test for the simplified card**

```ts
it("renders one flowing prose passage before chart evidence", () => {
  expect(toolSource).toContain('<p className="compatibility-theme-prose">{theme.prose}</p>');
  expect(toolSource).not.toContain("compatibility-reading-layer");
  expect(toolSource).not.toContain("compatibility-guidance-grid");
  expect(toolSource).not.toMatch(/Góc nhìn chính|Khi đi vào đời sống|Việc hai người có thể thử|Câu hỏi nên trao đổi/);
  expect(toolSource.indexOf("compatibility-theme-prose")).toBeLessThan(toolSource.indexOf("compatibility-evidence"));
});
```

The mutation caught is restoring labeled fragments or bullet guidance in the reader-facing card.

- [ ] **Step 2: Run the component test and confirm RED**

Run:

```powershell
& 'C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' node_modules\vitest\vitest.mjs run src/components/chart-compatibility-tool.test.ts
```

Expected: FAIL because the component still renders four blocks.

- [ ] **Step 3: Simplify JSX and apply editorial typography**

Replace the summary, reading layers, and guidance grid with:

```tsx
<p className="compatibility-theme-prose">{theme.prose}</p>
```

Keep the header and evidence `<details>` unchanged. Add CSS:

```css
.compatibility-theme-prose {
  max-width: 72ch;
  margin: 1rem 0 0;
  color: #3f3a35;
  font-size: 1.02rem;
  line-height: 1.78;
  text-wrap: pretty;
}
```

Remove selectors used only by `compatibility-reading-layer` and `compatibility-guidance-grid`. Do not change form controls, focus behavior, card level colors, or evidence touch target.

- [ ] **Step 4: Run component and engine tests and confirm GREEN**

Run:

```powershell
& 'C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' node_modules\vitest\vitest.mjs run src/components/chart-compatibility-tool.test.ts src/lib/chart-compatibility-narrative.test.ts src/lib/chart-compatibility.test.ts
```

Expected: all selected files PASS.

- [ ] **Step 5: Commit the simplified card**

```powershell
git add src/components/chart-compatibility-tool.tsx src/components/chart-compatibility-tool.test.ts src/app/globals.css
git commit -m "feat: present compatibility readings as prose"
```

### Task 4: Verify prose quality across fixtures and production build

**Files:**
- Modify only if a verified failure needs a scoped fix.

**Interfaces:**
- Verifies deterministic prose, duplicate prevention, safe language, UI contract, and build compatibility.

- [ ] **Step 1: Run the complete compatibility slice**

```powershell
& 'C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' node_modules\vitest\vitest.mjs run src/lib/chart-compatibility-narrative.test.ts src/lib/chart-compatibility.test.ts src/components/chart-compatibility-tool.test.ts src/app/tuong-hop-la-so/page.test.ts src/components/site-header-effects.test.ts src/app/sitemap.test.ts
```

Expected: all selected files PASS.

- [ ] **Step 2: Confirm three fixture pairs satisfy the reader-facing prose contract**

For pairs `0-1`, `2-3`, and `0-3`, assert:

```ts
expect(auditNarrativeUniqueness(report.themes)).toEqual({
  duplicateSentences: [],
  repeatedOpenings: [],
  repeatedNgrams: [],
});
expect(report.themes.every((theme) => theme.prose.length >= 700 && theme.prose.length <= 1_800)).toBe(true);
expect(JSON.stringify(report.themes)).not.toMatch(/chắc chắn|định mệnh|phải cưới|phải chia tay|điểm số định đoạt/i);
```

- [ ] **Step 3: Run lint, full tests, and production build**

```powershell
$taskNodeDir='C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin'
$env:PATH="$taskNodeDir;$env:PATH"
$env:npm_config_cache='C:\tmp\tuvi-npm-cache'
npm run lint
npm test
npm run build
```

Expected: lint exits with zero errors/warnings, all tests pass, and the route table contains `/tuong-hop-la-so`.

- [ ] **Step 4: Inspect release scope**

```powershell
git diff --check
git status --short
git log -5 --oneline
```

Expected: no whitespace errors or unrelated/generated files; only prose engine, tests, UI, CSS, spec, and plan commits are present.

- [ ] **Step 5: Keep the branch ready for explicit push/deploy authorization**

Do not push or deploy unless the user explicitly requests it. Report the verified HEAD and whether production still runs the previous SHA.
