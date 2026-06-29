# Data-Driven Reading Funnel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate evidence-based personal readings through DeepSeek with Groq fallback, show a 450-550 word guest mini-report and personalized VIP outline, and grant full-report buyers exactly three chart-aware AI questions.

**Architecture:** Build one deterministic `ChartEvidenceProfile` shared by free, paid, preview, and chat paths. Extend the server-only LLM router with DeepSeek and force reading calls to `deepseek -> groq`; persist assistant slots in PostgreSQL with a unique `(userId, chartId, slot)` constraint and enforce access in the route handler.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Prisma 7/PostgreSQL, Vitest, Tailwind CSS 4, DeepSeek Chat Completions, Groq OpenAI-compatible API.

---

## File Map

- Create `src/lib/chart-evidence.ts`: compact engine-derived evidence and deterministic VIP outline.
- Create `src/lib/chart-evidence.test.ts`: fixture-backed evidence/outline tests.
- Modify `src/lib/llm-router.ts`: DeepSeek provider and exported provider-order type.
- Modify `src/lib/llm-router.test.ts`: DeepSeek success/fallback tests.
- Modify `src/lib/ai.ts`: shared evidence, 450-550 word mini-report, dossier prompts, forced provider order.
- Modify `src/lib/ai.test.ts`: mini-report and paid-prompt behavior.
- Modify `prisma/schema.prisma`: `AssistantQuestion` relations/model.
- Create `prisma/migrations/20260629000000_add_assistant_questions/migration.sql`: table, foreign keys, indexes.
- Modify `src/lib/data.ts`: assistant entitlement, history, and slot reservation helpers.
- Create `src/lib/chart-assistant.ts`: testable assistant service and prompt.
- Create `src/lib/chart-assistant.test.ts`: entitlement, quota, context, and fallback tests.
- Modify `src/app/api/assistant/route.ts`: authenticated thin route handler.
- Create `src/app/api/assistant/route.test.ts`: status/response contract.
- Create `src/components/personalized-report-outline.tsx`: guest/unlocked VIP contents.
- Create `src/components/personalized-report-outline.test.tsx`: preview content tests.
- Modify `src/components/assistant-widget.tsx`: entitlement state, history, remaining quota.
- Modify `src/components/deferred-assistant-widget.tsx`: pass initial assistant state.
- Modify `src/components/free-overview-loader.tsx`: mini-report naming/copy.
- Modify `src/app/la-so/[id]/page.tsx`: server-derived outline and assistant state.
- Modify `src/app/globals.css`: outline and assistant quota styles.
- Modify `.env.example`: DeepSeek placeholders and provider-order example.
- Modify local `.env`: set only `LLM_PROVIDER_ORDER=deepseek,groq` and `DEEPSEEK_MODEL=deepseek-v4-flash`; never print or commit secrets.
- Modify `docs/agent/playbooks.md`: reading provider, mini-report, and chat entitlement rules.

### Task 1: DeepSeek-first provider routing

**Files:**
- Modify: `src/lib/llm-router.test.ts`
- Modify: `src/lib/llm-router.ts`
- Modify: `.env.example`

- [ ] **Step 1: Write failing DeepSeek tests**

Add tests that set `DEEPSEEK_API_KEY`, clear Gemini/Groq keys, and assert:

```ts
const result = await generateWithLlmRouter({
  prompt: "Luận giải lá số",
  providerOrder: ["deepseek", "groq"],
});

expect(result).toMatchObject({
  provider: "deepseek",
  model: "deepseek/deepseek-v4-flash",
  text: "Bản luận giải cá nhân",
});
expect(fetch).toHaveBeenCalledWith(
  "https://api.deepseek.com/chat/completions",
  expect.objectContaining({
    method: "POST",
    headers: expect.objectContaining({ authorization: "Bearer deepseek-test-key" }),
  }),
);
```

Add a second test with DeepSeek returning `429` and Groq returning `200`; assert two fetches and `provider === "groq"`. Extend environment restore/clear helpers with `DEEPSEEK_API_KEY`, `DEEPSEEK_API_KEYS`, and `DEEPSEEK_MODEL`.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- src/lib/llm-router.test.ts`

Expected: FAIL because `"deepseek"` is not assignable to `LlmProvider` and no DeepSeek call exists.

- [ ] **Step 3: Implement DeepSeek support**

Implement:

```ts
export type LlmProvider = "deepseek" | "gemini" | "groq";

async function callDeepSeek(options: GenerateOptions, key: string): Promise<LlmResult> {
  const model = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";
  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: options.prompt }],
      temperature: options.temperature ?? 0.55,
      max_tokens: options.maxTokens ?? 1200,
    }),
  });
  if (response.status === 429) throw new ProviderRateLimitError("DeepSeek rate limited");
  if (!response.ok) throw new Error(`DeepSeek error ${response.status}: ${await parseError(response)}`);
  const json = await response.json();
  return {
    text: assertText(json.choices?.[0]?.message?.content, "deepseek"),
    model: `deepseek/${model}`,
    provider: "deepseek",
  };
}
```

Update provider parsing, `hasExternalLlmProvider`, and `generateWithLlmRouter` to load DeepSeek keys and dispatch without changing existing Gemini behavior.

- [ ] **Step 4: Document environment placeholders**

Add:

```dotenv
LLM_PROVIDER_ORDER="deepseek,groq"
DEEPSEEK_API_KEY="<SET_ON_SERVER>"
DEEPSEEK_MODEL="deepseek-v4-flash"
```

- [ ] **Step 5: Run focused tests and commit**

Run: `npm test -- src/lib/llm-router.test.ts`

Expected: all router tests PASS.

Commit:

```powershell
git add src/lib/llm-router.ts src/lib/llm-router.test.ts .env.example
git commit -m "feat: route readings through DeepSeek"
```

### Task 2: Shared chart evidence and truthful VIP outline

**Files:**
- Create: `src/lib/chart-evidence.ts`
- Create: `src/lib/chart-evidence.test.ts`

- [ ] **Step 1: Write failing fixture-backed tests**

Use the existing stable chart fixture/helper from `src/lib/chart.test.ts`. Assert:

```ts
const profile = buildChartEvidenceProfile(chart);
expect(profile.viewYear).toBe(chart.input.viewYear);
expect(profile.palaces.find((item) => item.name === "Tài Bạch")?.stars.length).toBeGreaterThan(0);
expect(profile.signals.every((signal) => signal.evidence.length > 0)).toBe(true);
```

For a copied chart with `Tài Bạch` marked by existing Tuần/Triệt fields, assert the outline mentions that condition. For a chart without it, assert the title does not contain `Tuần` or `Triệt`.

- [ ] **Step 2: Run focused test and verify RED**

Run: `npm test -- src/lib/chart-evidence.test.ts`

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement the evidence contract**

Export these stable types/functions:

```ts
export type ChartEvidenceSignal = {
  kind: "strength" | "opportunity" | "caution";
  area: "identity" | "career" | "money" | "relationship" | "health" | "year";
  summary: string;
  evidence: string[];
};

export type ChartEvidenceProfile = {
  fullName: string;
  viewYear: number;
  menh: string;
  than: string;
  palaces: Array<{ name: string; stars: string[]; hasTuan: boolean; hasTriet: boolean }>;
  signals: ChartEvidenceSignal[];
};

export type ReportOutlineItem = { key: string; title: string; description: string };

export function buildChartEvidenceProfile(chart: TuViChart): ChartEvidenceProfile;
export function buildPersonalizedReportOutline(chart: TuViChart): ReportOutlineItem[];
export function formatChartEvidence(profile: ChartEvidenceProfile): string;
```

Derive all values from existing palace/star/state fields; cap stars per palace to keep prompts bounded. Return a stable eight-item outline aligned with the current paid chapters.

- [ ] **Step 4: Run focused tests and commit**

Run: `npm test -- src/lib/chart-evidence.test.ts`

Expected: PASS.

Commit:

```powershell
git add src/lib/chart-evidence.ts src/lib/chart-evidence.test.ts
git commit -m "feat: build shared chart evidence profile"
```

### Task 3: Convert free and paid generation into personal dossiers

**Files:**
- Modify: `src/lib/ai.test.ts`
- Modify: `src/lib/ai.ts`

- [ ] **Step 1: Write failing mini-report tests**

Change expectations to:

```ts
expect(FREE_OVERVIEW_MIN_WORDS).toBe(400);
expect(FREE_OVERVIEW_MAX_WORDS).toBe(650);
expect(prompt).toContain("Mục tiêu 450-550 từ");
expect(prompt).toContain("Cơ hội công việc và tài chính");
expect(prompt).toContain("Không viết như bài blog");
expect(router).toHaveBeenCalledWith(expect.objectContaining({
  providerOrder: ["deepseek", "groq"],
}));
```

Build a valid 450+ word sample with the five approved headings and assert `isCompleteFreeOverview` returns true; test missing evidence/heading and over-650-word samples return false.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- src/lib/ai.test.ts`

Expected: FAIL on old 900-1200 constants/prompt/provider behavior.

- [ ] **Step 3: Implement shared evidence prompts**

Import `buildChartEvidenceProfile` and `formatChartEvidence`. Set:

```ts
export const FREE_OVERVIEW_MIN_WORDS = 400;
export const FREE_OVERVIEW_MAX_WORDS = 650;
export const FREE_OVERVIEW_VERSION = "free-mini-report-v4";
export const PAID_READING_VERSION = "paid-personal-dossier-v4";
export const READING_PROVIDER_ORDER = ["deepseek", "groq"] as const;
```

Make the free prompt target 450-550 words with the approved five headings. Make `buildInstantFreeOverview` produce the same five-section evidence-based fallback. Pass `providerOrder: [...READING_PROVIDER_ORDER]` from `generateFreeOverview` and `generatePaidChapter`.

Update paid quality rules to require personal advice, explicit palace/star evidence, strengths, cautions, money/life opportunities, timing risk, and actions while preserving the repository’s chapter order.

- [ ] **Step 4: Run focused tests and commit**

Run: `npm test -- src/lib/ai.test.ts`

Expected: PASS.

Commit:

```powershell
git add src/lib/ai.ts src/lib/ai.test.ts
git commit -m "feat: generate evidence-based personal dossiers"
```

### Task 4: Persist three assistant question slots

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260629000000_add_assistant_questions/migration.sql`
- Modify: `src/lib/data.ts`
- Create: `src/lib/chart-assistant.test.ts`
- Create: `src/lib/chart-assistant.ts`

- [ ] **Step 1: Write failing assistant service tests**

Define dependency-injected tests for:

```ts
const result = await answerChartQuestion(deps, {
  user: { id: "user-1", role: "USER" },
  chartId: "chart-1",
  question: "Tài chính năm nay cần chú ý gì?",
});
expect(result.remaining).toBe(2);
expect(deps.reserveQuestionSlot).toHaveBeenCalledWith("user-1", "chart-1", "reading-1");
```

Also assert unauthenticated/foreign chart/not-entitled errors, `QUOTA_EXHAUSTED` after three slots, inclusion of earlier history in the prompt, and deterministic fallback completion.

- [ ] **Step 2: Run focused test and verify RED**

Run: `npm test -- src/lib/chart-assistant.test.ts`

Expected: FAIL because the service does not exist.

- [ ] **Step 3: Add Prisma model and SQL migration**

Add user/chart/reading relations and:

```prisma
model AssistantQuestion {
  id        String   @id @default(cuid())
  userId    String
  chartId   String
  readingId String
  slot      Int
  question  String
  answer    String?
  model     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  chart     Chart    @relation(fields: [chartId], references: [id], onDelete: Cascade)
  reading   Reading  @relation(fields: [readingId], references: [id], onDelete: Cascade)

  @@unique([userId, chartId, slot])
  @@index([userId, chartId, createdAt])
}
```

The SQL creates the table, unique/indexes, and three cascading foreign keys.

- [ ] **Step 4: Implement data helpers and service**

Add helpers that:

- fetch only an owned chart (admin may read according to current admin rule);
- find a completed `FULL/all` reading;
- list question history ordered by slot;
- reserve the first free slot from 1..3, retrying on Prisma unique-conflict;
- complete the reserved row with answer/model.

Implement:

```ts
export async function answerChartQuestion(
  deps: ChartAssistantDeps,
  input: { user: SessionUser; chartId: string; question: string },
): Promise<{ answer: string; model: string; remaining: number; history: AssistantHistoryItem[] }>;
```

The prompt uses `formatChartEvidence`, a bounded paid-reading summary, and prior Q/A. Call `generateWithLlmRouter` with `providerOrder: ["deepseek", "groq"]`.

- [ ] **Step 5: Generate Prisma client, run tests, and commit**

Run: `npm run db:generate`

Run: `npm test -- src/lib/chart-assistant.test.ts`

Expected: PASS.

Commit:

```powershell
git add prisma/schema.prisma prisma/migrations/20260629000000_add_assistant_questions/migration.sql src/generated/prisma src/lib/data.ts src/lib/chart-assistant.ts src/lib/chart-assistant.test.ts
git commit -m "feat: persist three chart assistant questions"
```

### Task 5: Enforce assistant access in the API

**Files:**
- Modify: `src/app/api/assistant/route.ts`
- Create: `src/app/api/assistant/route.test.ts`

- [ ] **Step 1: Write failing route tests**

Mock `getCurrentUser` and `answerChartQuestion`. Assert:

```ts
expect(response.status).toBe(401); // no session
expect(response.status).toBe(403); // FULL_REQUIRED
expect(response.status).toBe(409); // QUOTA_EXHAUSTED
expect(await response.json()).toMatchObject({ answer: "…", remaining: 2 });
```

- [ ] **Step 2: Run route test and verify RED**

Run: `npm test -- src/app/api/assistant/route.test.ts`

Expected: FAIL because the existing route allows public unlimited calls.

- [ ] **Step 3: Replace route with a thin authenticated handler**

Parse and cap the question at 600 characters, require `getCurrentUser`, call the service, and map typed domain errors to `401`, `403`, `404`, and `409`. Return generic `500` errors without provider details.

- [ ] **Step 4: Run route tests and commit**

Run: `npm test -- src/app/api/assistant/route.test.ts`

Expected: PASS.

Commit:

```powershell
git add src/app/api/assistant/route.ts src/app/api/assistant/route.test.ts
git commit -m "feat: enforce purchased assistant access"
```

### Task 6: Render the VIP preview and quota-aware assistant

**Files:**
- Create: `src/components/personalized-report-outline.tsx`
- Create: `src/components/personalized-report-outline.test.tsx`
- Modify: `src/components/assistant-widget.tsx`
- Modify: `src/components/deferred-assistant-widget.tsx`
- Modify: `src/components/free-overview-loader.tsx`
- Modify: `src/app/la-so/[id]/page.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Write failing component/source tests**

Assert the outline renders every title, locked descriptions, `Mở hồ sơ đầy đủ — 199 xu`, `Đọc lại không mất thêm xu`, and `Tặng 3 câu hỏi với Cố vấn AI`.

Add assistant tests/source assertions for `remaining`, disabled input at zero, login/full-report locked states, and decrementing from the API response.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- src/components/personalized-report-outline.test.tsx src/components/free-overview-loader.test.ts src/components/deferred-chart-action-panel.test.ts`

Expected: FAIL because the preview and quota props do not exist.

- [ ] **Step 3: Implement server/client composition**

On the server page, build the outline from `record.chart`, derive assistant state from the current user/full reading/history, and pass only serializable props.

Render:

```tsx
<PersonalizedReportOutline
  chartId={id}
  items={buildPersonalizedReportOutline(record.chart)}
  unlocked={Boolean(fullReading)}
  priceCoins={featurePrices?.FULL.priceCoins ?? 199}
/>
```

Change the assistant props to:

```ts
type AssistantAccess = {
  status: "login-required" | "full-required" | "ready" | "exhausted";
  remaining: number;
  history: ChatMessage[];
};
```

Display `Còn {remaining}/3 câu hỏi`, preserve the question on network failure, and use the API’s returned history/remaining as source of truth.

- [ ] **Step 4: Add scoped responsive styles**

Add only `.personal-report-outline`, `.report-outline-item`, `.assistant-quota`, and locked/unlocked modifier styles. Keep primary actions at least 48px high and avoid covering report content.

- [ ] **Step 5: Run focused tests and commit**

Run: `npm test -- src/components/personalized-report-outline.test.tsx src/components/free-overview-loader.test.ts src/components/deferred-chart-action-panel.test.ts`

Expected: PASS.

Commit:

```powershell
git add src/components/personalized-report-outline.tsx src/components/personalized-report-outline.test.tsx src/components/assistant-widget.tsx src/components/deferred-assistant-widget.tsx src/components/free-overview-loader.tsx src/app/la-so/[id]/page.tsx src/app/globals.css
git commit -m "feat: preview VIP dossier and assistant quota"
```

### Task 7: Environment, docs, and complete verification

**Files:**
- Modify: local `.env` (untracked secret file; never stage)
- Modify: `docs/agent/playbooks.md`

- [ ] **Step 1: Update local non-secret routing values safely**

Preserve all existing `.env` values. Replace/add only:

```dotenv
LLM_PROVIDER_ORDER="deepseek,groq"
DEEPSEEK_MODEL="deepseek-v4-flash"
```

Confirm variable names only; do not print values.

- [ ] **Step 2: Update the agent playbook**

Document:

- chart JSON/evidence is the only LLM input truth;
- reading provider order is DeepSeek then Groq;
- free mini-report target is 450-550 words;
- assistant requires completed `FULL/all` and has three persisted slots.

- [ ] **Step 3: Run the full verification ladder**

Use the bundled Node path from `docs/agent/verification.md` if the system Node is below 20.9.

Run:

```powershell
npm run lint
npm test
npm run build
```

Expected: all commands exit 0 with no test failures.

- [ ] **Step 4: Verify local UI**

Start the app on port 4000 with `PLAYWRIGHT_DISABLE_LLM=1`. Verify desktop and mobile:

- guest mini-report and full VIP outline are visible;
- locked assistant has a login/purchase action;
- completed-reading fixture/state shows `3/3`;
- zero remaining disables the form;
- no console errors or layout overlap.

- [ ] **Step 5: Check scope and commit final docs**

Run:

```powershell
git status --short
git diff --check
```

Confirm unrelated SEO/Headroom files remain unstaged and unchanged by this task.

Commit:

```powershell
git add docs/agent/playbooks.md
git commit -m "docs: document personal reading workflow"
```
