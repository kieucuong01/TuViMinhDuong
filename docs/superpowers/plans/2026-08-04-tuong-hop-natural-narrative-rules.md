# Natural Compatibility Narrative Rules Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the repeated template prose in `/tuong-hop-la-so` with deterministic, topic-specific narrative rules that read naturally, respond to both charts, and prevent duplicated language across the six interpretation layers.

**Architecture:** Keep chart generation and compatibility scoring in `chart-compatibility.ts`, but move editorial generation into a focused `chart-compatibility-narrative.ts` module. The module receives already-derived traits and signal strengths, selects deterministic topic-specific narrative variants through a report-scoped ledger, and returns structured prose for the existing report contract. No LLM, API, persistence, randomness, or astrology-engine changes are introduced.

**Tech Stack:** TypeScript, Next.js 16 client rendering, Vitest, existing `generateTuViChart` engine.

## Global Constraints

- All birth data remains in the browser; add no network or API dependency.
- Keep compatibility scores and the chart/star placement engine unchanged.
- Use deterministic selection; the same two inputs must always produce the same report.
- Each of the six themes must have a distinct editorial strategy and practical situation.
- Avoid deterministic relationship, marriage, investment, or separation verdicts.
- Preserve the current public report shape unless a new field directly improves reader comprehension.
- Public Vietnamese copy targets adults 30–60: natural, concrete, calm, and free of technical jargon in the quick reading.

---

### Task 1: Define the narrative profile and deterministic selection boundary

**Files:**
- Create: `src/lib/chart-compatibility-narrative.ts`
- Create: `src/lib/chart-compatibility-narrative.test.ts`

**Interfaces:**
- Produces: `NarrativeTrait`, `NarrativeProfile`, `NarrativeContext`, `NarrativeLedger`, and `selectStableVariant<T>(variants, seed, usedFamilies)`.
- Consumes later: `buildThemeNarrative(context, ledger)` returns the prose fields consumed by `ChartCompatibilityTheme`.

- [ ] **Step 1: Write failing tests for stable, non-repeating selection**

```ts
it("selects the same variant for the same seed", () => {
  const variants = [
    { family: "scene-first", value: "a" },
    { family: "contrast-first", value: "b" },
    { family: "need-first", value: "c" },
  ];
  expect(selectStableVariant(variants, "finance:minh:an", new Set())).toEqual(
    selectStableVariant(variants, "finance:minh:an", new Set()),
  );
});

it("moves to an unused family when the preferred family is already present", () => {
  const used = new Set(["scene-first"]);
  const result = selectStableVariant(
    [{ family: "scene-first", value: "a" }, { family: "contrast-first", value: "b" }],
    "communication:minh:an",
    used,
  );
  expect(result.family).toBe("contrast-first");
});
```

- [ ] **Step 2: Run the narrative test and confirm RED**

Run: `node node_modules/vitest/vitest.mjs run src/lib/chart-compatibility-narrative.test.ts`

Expected: FAIL because `chart-compatibility-narrative.ts` and its exports do not exist.

- [ ] **Step 3: Implement stable hashing, variant selection, and report-scoped ledger**

```ts
export type NarrativeVariant<T> = { family: string; value: T };

export function stableHash(seed: string) {
  return [...seed].reduce((value, char) => ((value * 31) + char.charCodeAt(0)) >>> 0, 2166136261);
}

export function selectStableVariant<T>(variants: NarrativeVariant<T>[], seed: string, usedFamilies: Set<string>) {
  const available = variants.filter((variant) => !usedFamilies.has(variant.family));
  const pool = available.length ? available : variants;
  return pool[stableHash(seed) % pool.length];
}

export class NarrativeLedger {
  readonly openingFamilies = new Set<string>();
  readonly transitions = new Set<string>();
  readonly normalizedSentences = new Set<string>();
}
```

- [ ] **Step 4: Run the narrative test and confirm GREEN**

Run: `node node_modules/vitest/vitest.mjs run src/lib/chart-compatibility-narrative.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the selection boundary**

```powershell
git add src/lib/chart-compatibility-narrative.ts src/lib/chart-compatibility-narrative.test.ts
git commit -m "feat: add deterministic compatibility narrative selector"
```

### Task 2: Build six topic-specific editorial strategies

**Files:**
- Modify: `src/lib/chart-compatibility-narrative.ts`
- Modify: `src/lib/chart-compatibility-narrative.test.ts`

**Interfaces:**
- Consumes: `NarrativeContext` containing `key`, `level`, `interaction`, two named profiles, and seed.
- Produces: `ThemeNarrative` with `summary`, `whyItMatters`, `possibleExpression`, `actions`, `questions`, `openingFamily`, and `sceneFamily`.

- [ ] **Step 1: Write a failing table-driven test for six distinct strategies**

```ts
const baseContext: Omit<NarrativeContext, "key"> = {
  level: "coordinate",
  interaction: "complementary",
  seed: "minh:an",
  first: { name: "Minh", traits: ["analysis"], primaryNeed: "hiểu rõ việc đang xảy ra", reassurance: "có đủ thời gian cân nhắc", contribution: "kiểm tra kỹ", friction: "chậm chốt" },
  second: { name: "An", traits: ["action"], primaryNeed: "thấy việc được chuyển động", reassurance: "có một bước tiếp theo rõ ràng", contribution: "mở việc nhanh", friction: "dễ sốt ruột" },
};

const makeContext = (key: CompatibilityThemeKey): NarrativeContext => ({ ...baseContext, key });

it.each([
  ["temperament", "khi nhịp sống bị xáo trộn"],
  ["communication", "một cuộc trao đổi"],
  ["commitment", "cảm giác được đồng hành"],
  ["finance", "một khoản chi"],
  ["work", "một việc chung"],
  ["family", "nếp sống chung"],
] as const)("gives %s its own real-life scene", (key, expectedScene) => {
  const result = buildThemeNarrative(makeContext(key), new NarrativeLedger());
  expect(result.possibleExpression.toLowerCase()).toContain(expectedScene);
});
```

The production mutation caught by this test is routing every theme through one generic expression template.

- [ ] **Step 2: Run the test and confirm RED**

Run: `node node_modules/vitest/vitest.mjs run src/lib/chart-compatibility-narrative.test.ts`

Expected: FAIL because `buildThemeNarrative` and topic strategies are missing.

- [ ] **Step 3: Implement a strategy map with theme-specific opening, interaction, scene, watch-point, action, and question variants**

Implement `THEME_STRATEGIES: Record<CompatibilityThemeKey, ThemeNarrativeStrategy>`. Each strategy must contain at least:

```ts
type ThemeNarrativeStrategy = {
  opening: Record<InteractionKind, NarrativeVariant<NarrativeWriter>[]>;
  scenes: Record<CompatibilityLevel, NarrativeVariant<NarrativeWriter>[]>;
  watchPoints: Record<CompatibilityLevel, NarrativeVariant<NarrativeWriter>[]>;
  actions: Record<CompatibilityLevel, NarrativeWriter[]>;
  questions: Record<CompatibilityLevel, NarrativeWriter[]>;
};
```

Use writer functions so names and traits enter sentences grammatically, for example:

```ts
({ first, second }) => `${first.name} thường muốn ${first.primaryNeed}, còn ${second.name} dễ yên tâm hơn khi ${second.reassurance}. Sự khác nhịp này không hẳn là bất đồng; nó cho thấy hai người cần một cách báo trước dễ hiểu.`
```

Do not reuse the same generic final disclaimer in every summary; the report-level disclaimer already handles limits.

- [ ] **Step 4: Run tests and confirm GREEN**

Run: `node node_modules/vitest/vitest.mjs run src/lib/chart-compatibility-narrative.test.ts`

Expected: all narrative strategy tests PASS.

- [ ] **Step 5: Commit the six strategies**

```powershell
git add src/lib/chart-compatibility-narrative.ts src/lib/chart-compatibility-narrative.test.ts
git commit -m "feat: add topic-specific compatibility narratives"
```

### Task 3: Integrate narrative profiles with the chart compatibility engine

**Files:**
- Modify: `src/lib/chart-compatibility.ts`
- Modify: `src/lib/chart-compatibility.test.ts`

**Interfaces:**
- Consumes: existing `traitsForPalaces`, `signalBalance`, theme level, person names, and theme key.
- Produces: the existing `ChartCompatibilityReport`; scoring, evidence, methodology, and disclaimer stay compatible.

- [ ] **Step 1: Add failing behavioral tests for natural, chart-responsive output**

```ts
it("does not repeat the former summary skeleton across six layers", () => {
  const report = buildChartCompatibilityReport(first, second);
  expect(report.themes.filter((theme) => theme.summary.includes("nổi bật ở xu hướng"))).toHaveLength(0);
  expect(new Set(report.themes.map((theme) => theme.summary.split(/[.!?]/, 1)[0].trim())).size).toBe(6);
});

it("changes the narrative when the chart pair changes", () => {
  const firstPair = buildChartCompatibilityReport(first, second);
  const differentSecond = { ...CHART_FIXTURES[2].input, fullName: "Lan" };
  const secondPair = buildChartCompatibilityReport(first, differentSecond);
  expect(secondPair.themes.map((theme) => theme.summary)).not.toEqual(firstPair.themes.map((theme) => theme.summary));
});
```

The mutations caught are restoring the shared summary template or ignoring chart-derived profiles.

- [ ] **Step 2: Run the engine test and confirm RED**

Run: `node node_modules/vitest/vitest.mjs run src/lib/chart-compatibility.test.ts`

Expected: FAIL because the current output still contains `nổi bật ở xu hướng` in every theme.

- [ ] **Step 3: Extract narrative profiles and call `buildThemeNarrative` from `themeReport`**

Map chart traits into human needs and behaviors through explicit lookup tables:

```ts
type NarrativeTraitDetail = {
  pace: string;
  need: string;
  reassurance: string;
  contribution: string;
  friction: string;
};
```

Create one `NarrativeLedger` in `buildChartCompatibilityReport` and pass it through all six `themeReport` calls. Replace `config.focus`, `config.expressions`, `config.actions`, and `config.questions` with the structured output from the theme strategy. Keep `evidenceFor`, `compatibilityLevel`, and score calculation unchanged.

- [ ] **Step 4: Run narrative and engine tests and confirm GREEN**

Run: `node node_modules/vitest/vitest.mjs run src/lib/chart-compatibility-narrative.test.ts src/lib/chart-compatibility.test.ts`

Expected: both files PASS.

- [ ] **Step 5: Commit the engine integration**

```powershell
git add src/lib/chart-compatibility.ts src/lib/chart-compatibility.test.ts src/lib/chart-compatibility-narrative.ts src/lib/chart-compatibility-narrative.test.ts
git commit -m "refactor: generate compatibility readings from chart context"
```

### Task 4: Enforce report-wide duplicate prevention

**Files:**
- Modify: `src/lib/chart-compatibility-narrative.ts`
- Modify: `src/lib/chart-compatibility-narrative.test.ts`
- Modify: `src/lib/chart-compatibility.test.ts`

**Interfaces:**
- Produces: `auditNarrativeUniqueness(themes)` returning `{ duplicateSentences, repeatedOpenings, repeatedNgrams }`.
- Internal: `buildThemeNarrative` retries its ordered fallback variants before returning prose.

- [ ] **Step 1: Write failing tests for exact sentence and long-phrase duplication**

```ts
it("detects normalized duplicate sentences and long repeated phrases", () => {
  const makeTheme = (summary: string): Pick<ChartCompatibilityTheme, "summary" | "whyItMatters" | "possibleExpression"> => ({
    summary,
    whyItMatters: "Một góc nhìn riêng không trùng với phần còn lại.",
    possibleExpression: "Một tình huống riêng không trùng với phần còn lại.",
  });
  const audit = auditNarrativeUniqueness([
    makeTheme("Minh cần một khoảng lặng trước khi nói tiếp. Hai người nên hẹn giờ quay lại."),
    makeTheme("Minh cần một khoảng lặng trước khi nói tiếp! Hai người có thể thử hẹn giờ quay lại."),
  ]);
  expect(audit.duplicateSentences).toContain("minh cần một khoảng lặng trước khi nói tiếp");
  expect(audit.repeatedNgrams.length).toBeGreaterThan(0);
});

it("ships a six-layer report with no duplicate sentences or repeated openings", () => {
  const report = buildChartCompatibilityReport(first, second);
  expect(auditNarrativeUniqueness(report.themes)).toEqual({
    duplicateSentences: [], repeatedOpenings: [], repeatedNgrams: [],
  });
});
```

- [ ] **Step 2: Run tests and confirm RED**

Run: `node node_modules/vitest/vitest.mjs run src/lib/chart-compatibility-narrative.test.ts src/lib/chart-compatibility.test.ts`

Expected: FAIL because uniqueness audit and fallback selection do not exist.

- [ ] **Step 3: Implement normalization, six-word n-gram audit, opening-shape audit, and deterministic fallback retry**

Normalize Vietnamese text with lowercase, punctuation removal, and whitespace collapse while preserving diacritics. Ignore common functional n-grams shorter than six words. An opening shape is the first three normalized words; no shape may appear more than once across theme summaries.

When a candidate conflicts with `NarrativeLedger`, rotate through the strategy's remaining variants using `stableHash(seed) + attempt`. Maximum attempts equal the number of available variants; final fallback is theme-specific and must also be recorded.

- [ ] **Step 4: Run tests and confirm GREEN**

Run: `node node_modules/vitest/vitest.mjs run src/lib/chart-compatibility-narrative.test.ts src/lib/chart-compatibility.test.ts`

Expected: all duplicate-prevention tests PASS.

- [ ] **Step 5: Commit duplicate prevention**

```powershell
git add src/lib/chart-compatibility-narrative.ts src/lib/chart-compatibility-narrative.test.ts src/lib/chart-compatibility.test.ts
git commit -m "feat: prevent repeated compatibility interpretations"
```

### Task 5: Present the richer editorial flow in the report UI

**Files:**
- Modify: `src/components/chart-compatibility-tool.tsx`
- Modify: `src/components/chart-compatibility-tool.test.ts`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: unchanged `ChartCompatibilityTheme` fields.
- Produces: reader-facing labels that distinguish “góc nhìn chính”, “khi đi vào đời sống”, “việc có thể thử”, and “câu hỏi để hiểu nhau”.

- [ ] **Step 1: Write a failing rendered-contract test for distinct editorial labels**

```ts
it("labels each narrative layer in plain Vietnamese", () => {
  expect(toolSource).toContain("Góc nhìn chính");
  expect(toolSource).toContain("Khi đi vào đời sống");
  expect(toolSource).toContain("Việc hai người có thể thử");
  expect(toolSource).not.toContain("Vì sao có nhận định này?");
  expect(toolSource).not.toContain("Biểu hiện có thể gặp");
});
```

- [ ] **Step 2: Run component tests and confirm RED**

Run: `node node_modules/vitest/vitest.mjs run src/components/chart-compatibility-tool.test.ts`

Expected: FAIL because current labels are `Vì sao có nhận định này?` and `Biểu hiện có thể gặp`.

- [ ] **Step 3: Update labels and spacing without changing the form or evidence disclosure**

Render:

```tsx
<div className="compatibility-reading-layer is-primary">
  <h5>Góc nhìn chính</h5>
  <p>{theme.whyItMatters}</p>
</div>
<div className="compatibility-reading-layer is-scene">
  <h5>Khi đi vào đời sống</h5>
  <p>{theme.possibleExpression}</p>
</div>
```

Use existing typography and colors; only add subtle spacing or left-border differentiation where needed. Preserve 48px touch targets and the `Căn cứ từ hai lá số` details block.

- [ ] **Step 4: Run component and engine tests and confirm GREEN**

Run: `node node_modules/vitest/vitest.mjs run src/components/chart-compatibility-tool.test.ts src/lib/chart-compatibility-narrative.test.ts src/lib/chart-compatibility.test.ts`

Expected: all targeted tests PASS.

- [ ] **Step 5: Commit the UI flow**

```powershell
git add src/components/chart-compatibility-tool.tsx src/components/chart-compatibility-tool.test.ts src/app/globals.css
git commit -m "feat: clarify compatibility narrative layers"
```

### Task 6: Final regression and quality gate

**Files:**
- Modify only if a verified regression requires a scoped fix.

**Interfaces:**
- Verifies the public compatibility-report contract and project build.

- [ ] **Step 1: Run the complete compatibility slice**

Run:

```powershell
node node_modules/vitest/vitest.mjs run src/lib/chart-compatibility-narrative.test.ts src/lib/chart-compatibility.test.ts src/components/chart-compatibility-tool.test.ts src/app/tuong-hop-la-so/page.test.ts src/components/site-header-effects.test.ts src/app/sitemap.test.ts
```

Expected: all selected files PASS with zero failures.

- [ ] **Step 2: Generate three fixed sample pairs and audit their prose**

Add a table-driven test fixture for a similar-trait pair, a complementary pair, and a contrast pair. For every result assert:

```ts
expect(auditNarrativeUniqueness(report.themes)).toEqual({
  duplicateSentences: [], repeatedOpenings: [], repeatedNgrams: [],
});
expect(report.themes.every((theme) => theme.summary.length >= 120)).toBe(true);
expect(report.themes.every((theme) => theme.possibleExpression.length >= 100)).toBe(true);
```

- [ ] **Step 3: Run lint and production build**

Run:

```powershell
npm run lint
npm run build
```

Expected: both commands exit 0; build route table includes `/tuong-hop-la-so`.

- [ ] **Step 4: Inspect the final diff and working tree**

Run:

```powershell
git diff --check
git status --short
git diff --stat HEAD~5..HEAD
```

Expected: no whitespace errors, no generated or unrelated files, and only the narrative engine, tests, UI, CSS, plan, and spec are included.

- [ ] **Step 5: Keep the implementation ready for the user's explicit release instruction**

Do not deploy in this task unless the user explicitly asks for `commit/push/deploy`. Report the commit(s), verification evidence, and production status accurately.
