# Remove Gemini Runtime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove Gemini from all active runtime paths so AI generation uses only DeepSeek, then Groq, then template fallback.

**Architecture:** Simplify the shared LLM router to two providers and remove provider-specific model hints from the reading layer. Preserve one retry for malformed paid chapters by calling the same DeepSeek/Groq router again. Align production env validation, tests, and active documentation with the two-provider contract.

**Tech Stack:** TypeScript, Next.js 16, Vitest, Node.js production scripts, Markdown documentation.

---

### Task 1: Reduce the shared LLM router to DeepSeek and Groq

**Files:**
- Modify: `src/lib/llm-router.test.ts`
- Modify: `src/lib/llm-router.ts`

- [ ] **Step 1: Replace Gemini tests with the two-provider contract**

Remove Gemini env setup and Gemini request tests. Add assertions that the default order is DeepSeek then Groq and that an unsupported env value is ignored:

```ts
it("defaults to DeepSeek before Groq", async () => {
  process.env.DEEPSEEK_API_KEY = "deepseek-test-key";
  process.env.GROQ_API_KEY = "groq-test-key";
  process.env.LLM_PROVIDER_ORDER = "";
  // mock DeepSeek success
  const result = await generateWithLlmRouter({ prompt: "Viết luận giải" });
  expect(result?.provider).toBe("deepseek");
});

it("ignores removed providers in the env order", async () => {
  process.env.GROQ_API_KEY = "groq-test-key";
  process.env.LLM_PROVIDER_ORDER = "gemini,groq";
  // mock Groq success
  const result = await generateWithLlmRouter({ prompt: "Viết luận giải" });
  expect(result?.provider).toBe("groq");
});
```

Add a source assertion that `src/lib/llm-router.ts` contains neither `callGemini` nor `GEMINI_API_KEY`.

- [ ] **Step 2: Run router tests and verify RED**

Run:

```powershell
npm test -- src/lib/llm-router.test.ts
```

Expected: source-removal assertions fail while Gemini code still exists.

- [ ] **Step 3: Remove Gemini from the router**

Apply these type and default changes:

```ts
export type LlmProvider = "deepseek" | "groq";

type GenerateOptions = {
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  providerOrder?: LlmProvider[];
};
```

Delete `callGemini`. Parse only `deepseek` and `groq`, default to `["deepseek", "groq"]`, read only DeepSeek/Groq keys, and dispatch only those two providers.

- [ ] **Step 4: Run router tests and verify GREEN**

Expected: all router tests pass.

### Task 2: Remove Gemini model policy from paid readings

**Files:**
- Modify: `src/lib/ai.test.ts`
- Modify: `src/lib/ai.ts`

- [ ] **Step 1: Write failing reading-policy tests**

Delete Gemini env save/restore code and model-hint assertions. Update the malformed-chapter test so one failed chapter produces exactly two router calls. Assert both calls receive:

```ts
expect.objectContaining({ providerOrder: ["deepseek", "groq"] })
```

Assert prompt metadata has no `modelPolicy` property:

```ts
expect(promptMeta).not.toHaveProperty("modelPolicy");
```

Change mock results using `provider: "gemini"` to `provider: "deepseek"`.

- [ ] **Step 2: Run AI tests and verify RED**

Run:

```powershell
npm test -- src/lib/ai.test.ts
```

Expected: retry count or metadata assertions fail because Gemini model policy still controls retry.

- [ ] **Step 3: Simplify paid-reading generation**

Delete:

```ts
PAID_READING_DEFAULT_GEMINI_MODEL
PAID_READING_DEFAULT_ESCALATION_GEMINI_MODEL
paidReadingPrimaryGeminiModel
paidReadingEscalationGeminiModel
paidReadingYearlyGeminiModel
paidReadingInitialGeminiModel
```

Remove `modelPolicy` from prompt metadata. Change `generatePaidChapter` to:

```ts
async function generatePaidChapter(prompt: string, maxTokens: number) {
  const routed = await generateWithLlmRouter({
    prompt,
    maxTokens,
    temperature: 0.48,
    providerOrder: [...READING_PROVIDER_ORDER],
  });
  if (!routed) return null;
  return { content: routed.text, model: routed.model };
}
```

For every incomplete or failed paid chapter, call `generatePaidChapter(prompt, maxTokens)` one additional time. If the retry is still incomplete, use the deterministic fallback.

- [ ] **Step 4: Run AI tests and verify GREEN**

Expected: all AI tests pass without setting any Gemini-related environment variable.

### Task 3: Align production env validation

**Files:**
- Create: `src/lib/production-env-contract.test.ts`
- Modify: `scripts/check-production-env.mjs`

- [ ] **Step 1: Write a failing source-contract test**

```ts
const source = readFileSync(
  fileURLToPath(new URL("../../scripts/check-production-env.mjs", import.meta.url)),
  "utf8",
);

expect(source).toContain('["DEEPSEEK_API_KEY", "DEEPSEEK_API_KEYS"]');
expect(source).toContain('["GROQ_API_KEY", "GROQ_API_KEYS"]');
expect(source).toContain("DEEPSEEK_* and GROQ_* all missing");
expect(source).not.toContain("GEMINI_");
```

- [ ] **Step 2: Run the contract test and verify RED**

Run:

```powershell
npm test -- src/lib/production-env-contract.test.ts
```

Expected: DeepSeek group is missing and Gemini strings remain.

- [ ] **Step 3: Update the env checker**

Set:

```js
const llmVarGroups = [
  ["DEEPSEEK_API_KEY", "DEEPSEEK_API_KEYS"],
  ["GROQ_API_KEY", "GROQ_API_KEYS"],
];
```

Change the missing-provider message to `DEEPSEEK_* and GROQ_* all missing`.

- [ ] **Step 4: Run the contract test and verify GREEN**

Expected: the new contract test passes.

### Task 4: Update active documentation

**Files:**
- Modify: `README.md`
- Modify: `docs/agent/current-state.md`
- Modify: `docs/agent/README.md`
- Modify: `docs/superpowers/plans/2026-07-01-free-reading-login-funnel.md`

- [ ] **Step 1: Replace active Gemini guidance**

Document `DeepSeek → Groq → template fallback`, list only DeepSeek/Groq env variables, and remove the stale note about preserving a Gemini escalation edit.

- [ ] **Step 2: Verify active docs contain no Gemini reference**

Run:

```powershell
rg -n -i "gemini" README.md docs/agent/current-state.md docs/agent/README.md docs/superpowers/plans/2026-07-01-free-reading-login-funnel.md
```

Expected: no matches.

### Task 5: Verify and commit the cleanup

**Files:**
- Verify all files changed in Tasks 1–4

- [ ] **Step 1: Verify runtime and active docs are clean**

Run:

```powershell
rg -n -i "gemini" src scripts README.md docs/agent docs/superpowers/plans/2026-07-01-free-reading-login-funnel.md
```

Expected: no matches. Historical specs/plans outside the active paths may still contain Gemini as historical context.

- [ ] **Step 2: Run the verification ladder**

Run sequentially:

```powershell
npm run lint
npm test
npm run build
```

Expected: all commands exit 0 without Gemini environment overrides.

- [ ] **Step 3: Commit scoped changes**

Stage the cleanup files and commit:

```powershell
git commit -m "refactor: remove Gemini runtime support"
```

Do not push or deploy unless requested.
