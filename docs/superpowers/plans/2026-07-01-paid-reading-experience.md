# Paid Reading Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure paid readings into eight interpretive chapters plus one consolidated action chapter, improve key-point emphasis, and persist cross-device reading progress with a resume experience.

**Architecture:** A pure Markdown presentation normalizer adapts legacy reports without changing stored content, while new reports are generated directly in the new format. A dedicated client reader component tracks the active H1 and position, and an authenticated API persists one `ReadingProgress` row per user and paid reading.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Prisma 7/PostgreSQL, Vitest, Tailwind/CSS.

**Execution status (2026-07-02):** Completed on `master`. Verified with ESLint, 388 Vitest tests, Prisma client generation, production build, and local desktop/mobile guest-route smoke testing.

**Production migration note:** `20260702120000_add_reading_progress` was applied transactionally through the app PostgreSQL driver after Prisma's schema-engine connectivity probe stalled against the old remote connection; the migration history row and all `ReadingProgress` columns were verified before deployment continued.

---

## File map

- Create `src/lib/paid-reading-presentation.ts`: normalize legacy/new paid Markdown and expose stable chapter metadata.
- Create `src/lib/paid-reading-presentation.test.ts`: normalization and idempotence tests.
- Modify `src/lib/ai.ts`: remove the paid data dashboard and define the ninth action chapter.
- Modify `src/lib/ai.test.ts`: assert the new paid report contract.
- Modify `prisma/schema.prisma`: add `ReadingProgress` relations and model.
- Create `prisma/migrations/20260701120000_add_reading_progress/migration.sql`: additive production migration.
- Modify `src/lib/data.ts`: load and upsert reading progress, including in-memory fallback.
- Create `src/lib/reading-progress.ts`: validation and position calculation helpers shared by UI/API tests.
- Create `src/lib/reading-progress.test.ts`: payload and progress calculation tests.
- Create `src/app/api/readings/[id]/progress/route.ts`: authenticated progress update endpoint.
- Create `src/app/api/readings/[id]/progress/route.test.ts`: auth, ownership, validation, and upsert tests.
- Create `src/components/paid-reading-experience.tsx`: progress bar, current chapter, TOC, resume button, debounced persistence.
- Create `src/components/paid-reading-experience.test.tsx`: source-level contract tests for browser behavior boundaries.
- Modify `src/components/markdown-content.tsx`: allow the paid reader to identify the rendered content container without changing other Markdown consumers.
- Modify `src/app/la-so/[id]/nang-cao/page.tsx`: normalize content, load initial progress, and render the client experience.
- Modify `src/app/globals.css`: paid-only emphasis, progress bar, active TOC, responsive/resume styling.

### Task 1: Normalize legacy paid reading Markdown

**Files:**
- Create: `src/lib/paid-reading-presentation.ts`
- Create: `src/lib/paid-reading-presentation.test.ts`

- [ ] **Step 1: Write failing normalization tests**

Cover removal, aggregation, preservation, stable headings, legacy emphasis, empty-action behavior, and idempotence:

```ts
import { describe, expect, it } from "vitest";
import { normalizePaidReading } from "@/lib/paid-reading-presentation";

const legacy = `# Trung tâm dữ liệu lá số
| Cung | Sao |
| --- | --- |
| Mệnh | Cự Môn |

# Chương 1: Tổng quan lá số
## Mỏ neo
Bạn có nội lực bền bỉ.
## Luận giải chi tiết
Nội dung tổng quan.
## Cẩm nang hành động
- Giữ nhịp nghỉ ngơi.

# Chương 2: Mệnh, Thân và khí chất cốt lõi
## Mỏ neo
**Bạn quyết đoán khi có đủ dữ kiện.**
## Luận giải chi tiết
Nội dung khí chất.
## Cẩm nang hành động
- Kiểm tra dữ kiện trước quyết định.`;

describe("normalizePaidReading", () => {
  it("removes the dashboard and consolidates legacy action guides", () => {
    const result = normalizePaidReading(legacy);
    expect(result.content).not.toContain("Trung tâm dữ liệu lá số");
    expect(result.content.match(/Cẩm nang hành động/g)).toBeNull();
    expect(result.content).toContain("# Kế hoạch hành động cá nhân");
    expect(result.content).toContain("## Chương 1: Tổng quan lá số");
    expect(result.content).toContain("- Giữ nhịp nghỉ ngơi.");
  });

  it("adds emphasis only when the anchor has no existing strong text", () => {
    const result = normalizePaidReading(legacy);
    expect(result.content).toContain("**Bạn có nội lực bền bỉ.**");
    expect(result.content).toContain("**Bạn quyết đoán khi có đủ dữ kiện.**");
  });

  it("is idempotent", () => {
    const once = normalizePaidReading(legacy);
    expect(normalizePaidReading(once.content)).toEqual(once);
  });
});
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```powershell
npm test -- src/lib/paid-reading-presentation.test.ts
```

Expected: FAIL because `@/lib/paid-reading-presentation` does not exist.

- [ ] **Step 3: Implement the pure normalizer**

Implement these public types and entry point:

```ts
export type PaidReadingDisplayChapter = {
  key: string;
  id: string;
  title: string;
  index: number;
};

export type NormalizedPaidReading = {
  content: string;
  chapters: PaidReadingDisplayChapter[];
};

export function normalizePaidReading(content: string): NormalizedPaidReading;
```

Implementation requirements:

- Parse H1 blocks without interpreting arbitrary prose.
- Discard an H1 whose normalized title equals `trung-tam-du-lieu-la-so`.
- Extract every H2 block whose normalized title equals `cam-nang-hanh-dong`.
- Append one `# Kế hoạch hành động cá nhân` only when extracted actions exist and no action chapter already exists.
- Within that chapter, use `## <source chapter title>` so legacy advice keeps its context.
- In `## Mỏ neo`, wrap the first complete non-list sentence in `**...**` only when that section contains no strong text.
- Generate H1 IDs with the same Vietnamese-safe slug behavior used by `MarkdownContent`.
- Return only H1 chapters and preserve source order.
- Make normalization idempotent.

- [ ] **Step 4: Run focused tests**

Run:

```powershell
npm test -- src/lib/paid-reading-presentation.test.ts
```

Expected: all normalization tests PASS.

- [ ] **Step 5: Commit the normalizer**

```powershell
git add src/lib/paid-reading-presentation.ts src/lib/paid-reading-presentation.test.ts
git commit -m "feat: normalize legacy paid readings"
```

### Task 2: Generate the new nine-chapter paid report

**Files:**
- Modify: `src/lib/ai.ts`
- Modify: `src/lib/ai.test.ts`

- [ ] **Step 1: Update tests to express the new report contract**

Add assertions equivalent to:

```ts
it("builds eight interpretation chapters and one consolidated action chapter", () => {
  const chapters = paidReadingChapters(sampleChart(), "FULL");
  expect(chapters).toHaveLength(9);
  expect(chapters.slice(0, 8).every((chapter) =>
    chapter.requiredSections.join("|") === "Mỏ neo|Luận giải chi tiết",
  )).toBe(true);
  expect(chapters[8]).toMatchObject({
    key: "action-plan",
    title: "Chương 9: Kế hoạch hành động cá nhân",
    requiredSections: [
      "Việc cần ưu tiên ngay",
      "Kế hoạch 30 ngày",
      "Kế hoạch 90 ngày",
      "Điều cần tránh",
      "Mốc tự đánh giá lại",
    ],
  });
});

it("does not prepend a technical data dashboard", async () => {
  const result = await generateReadingWithProgress(sampleChart(), "FULL", "all");
  expect(result.content).not.toContain("# Trung tâm dữ liệu lá số");
  expect(result.content).not.toContain("## Cẩm nang hành động");
});
```

Update `completeGeneratedChapter` so it renders every item in `chapter.requiredSections`, rather than indexing four fixed sections.

- [ ] **Step 2: Run the AI tests and verify failure**

Run:

```powershell
npm test -- src/lib/ai.test.ts
```

Expected: FAIL on the old dashboard, eight-chapter count, and per-chapter action sections.

- [ ] **Step 3: Remove dashboard generation and update chapter definitions**

In `src/lib/ai.ts`:

- Delete `PAID_DATA_DASHBOARD_TITLE`, `paidReadingDataDashboard`, `prependPaidDataDashboard`, and their call sites.
- Change chapters 1–8 to `requiredSections: ["Mỏ neo", "Luận giải chi tiết"]`.
- Append:

```ts
{
  key: "action-plan",
  title: "Chương 9: Kế hoạch hành động cá nhân",
  requiredSections: [
    "Việc cần ưu tiên ngay",
    "Kế hoạch 30 ngày",
    "Kế hoạch 90 ngày",
    "Điều cần tránh",
    "Mốc tự đánh giá lại",
  ],
  instruction:
    "Tổng hợp các kết luận của tám chương trước thành kế hoạch cụ thể. Không luận giải lại, không lặp ý, mỗi hành động bắt đầu bằng động từ và có mốc thực hiện hoặc tiêu chí tự kiểm tra.",
  targetWords: "700-1000 từ",
}
```

Update paid quality and chapter prompt rules:

- Require 3–6 `**key conclusions**` in each interpretive chapter.
- Do not bold whole paragraphs.
- Keep evidence woven into prose and remove every reference to a technical dashboard.
- Reserve action bullets for `action-plan`.
- Update progress totals and tests from 8 to 9.
- Adapt fallback chapter rendering to the chapter’s own `requiredSections`.
- Generate chapters 1–8 through the existing bounded parallel queue, then generate `action-plan` after those chapters finish.
- Build a bounded action context from the `Mỏ neo` sections and bold conclusions of chapters 1–8; cap it before adding it to the action prompt so the ninth chapter truly consolidates prior advice without sending the full report back to the provider.

Expose and test a focused helper:

```ts
export function buildPaidActionPlanContext(chapterContents: string[]) {
  // Return source chapter labels plus anchor/bold conclusions, capped at 12,000 characters.
}
```

Add a router-mock assertion that the `action-plan` prompt contains unique markers from successful interpretation chapters and is called only after all eight are complete.

- [ ] **Step 4: Run AI and normalizer tests**

Run:

```powershell
npm test -- src/lib/ai.test.ts src/lib/paid-reading-presentation.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit the generation contract**

```powershell
git add src/lib/ai.ts src/lib/ai.test.ts
git commit -m "feat: consolidate paid reading actions"
```

### Task 3: Add persistent reading progress storage

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260701120000_add_reading_progress/migration.sql`
- Modify: `src/lib/data.ts`
- Create: `src/lib/reading-progress.ts`
- Create: `src/lib/reading-progress.test.ts`

- [ ] **Step 1: Write failing validation and calculation tests**

```ts
import { describe, expect, it } from "vitest";
import {
  calculateReadingPercent,
  parseReadingProgressInput,
} from "@/lib/reading-progress";

describe("reading progress", () => {
  it("clamps report progress", () => {
    expect(calculateReadingPercent(500, 100, 900)).toBe(50);
    expect(calculateReadingPercent(-20, 100, 900)).toBe(0);
    expect(calculateReadingPercent(1200, 100, 900)).toBe(100);
  });

  it("accepts a bounded progress payload", () => {
    expect(parseReadingProgressInput({
      chapterKey: "chuong-4-cong-viec",
      chapterIndex: 3,
      percent: 42,
      chapterOffset: 0.35,
    })).toEqual({
      chapterKey: "chuong-4-cong-viec",
      chapterIndex: 3,
      percent: 42,
      chapterOffset: 0.35,
    });
  });

  it("rejects invalid bounds", () => {
    expect(parseReadingProgressInput({
      chapterKey: "x",
      chapterIndex: -1,
      percent: 101,
      chapterOffset: 2,
    })).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```powershell
npm test -- src/lib/reading-progress.test.ts
```

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Add the Prisma model and SQL migration**

Add relations:

```prisma
model User {
  // existing fields
  readingProgress ReadingProgress[]
}

model Reading {
  // existing fields
  progress ReadingProgress[]
}

model ReadingProgress {
  id            String   @id @default(cuid())
  userId        String
  readingId     String
  chapterKey    String
  chapterIndex  Int
  percent       Int
  chapterOffset Float
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  reading       Reading  @relation(fields: [readingId], references: [id], onDelete: Cascade)

  @@unique([userId, readingId])
  @@index([readingId])
}
```

Create equivalent additive PostgreSQL SQL with foreign keys, unique index, reading index, and cascading deletes. Do not alter existing `Reading` content.

- [ ] **Step 4: Implement helpers and data access**

Export:

```ts
export type ReadingProgressInput = {
  chapterKey: string;
  chapterIndex: number;
  percent: number;
  chapterOffset: number;
};

export function parseReadingProgressInput(value: unknown): ReadingProgressInput | null;
export function calculateReadingPercent(scrollY: number, reportTop: number, reportBottom: number): number;
export async function getReadingProgress(userId: string, readingId: string);
export async function saveReadingProgress(userId: string, readingId: string, input: ReadingProgressInput);
```

Validation rules:

- `chapterKey`: 1–160 lowercase slug characters.
- `chapterIndex`: integer 0–50.
- `percent`: integer 0–100.
- `chapterOffset`: finite number 0–1.

`data.ts` uses `db.readingProgress.findUnique` and `upsert` by `userId_readingId`. Add a keyed in-memory map for demo/no-database mode so local flows remain functional.

`getReadingProgress` must catch the Prisma missing-table condition and return `null`. This keeps the paid report readable during a rolling deploy before `prisma migrate deploy` completes. Write failures may propagate to the API because the client already treats persistence as non-blocking.

- [ ] **Step 5: Generate Prisma client and run tests**

Run:

```powershell
npm run db:generate
npm test -- src/lib/reading-progress.test.ts
```

Expected: Prisma generation succeeds and tests PASS.

- [ ] **Step 6: Commit persistence**

```powershell
git add prisma/schema.prisma prisma/migrations/20260701120000_add_reading_progress/migration.sql src/lib/data.ts src/lib/reading-progress.ts src/lib/reading-progress.test.ts
git commit -m "feat: persist paid reading progress"
```

### Task 4: Add the authenticated progress endpoint

**Files:**
- Create: `src/app/api/readings/[id]/progress/route.ts`
- Create: `src/app/api/readings/[id]/progress/route.test.ts`

- [ ] **Step 1: Write failing route tests**

Mock `getCurrentUser`, `getReadingJobById`, and `saveReadingProgress`. Test:

```ts
it("returns 401 for a guest", async () => {
  mocks.getCurrentUser.mockResolvedValue(null);
  const response = await putProgress();
  expect(response.status).toBe(401);
});

it("hides a reading not owned by the user", async () => {
  mocks.getReadingJobById.mockResolvedValue(null);
  const response = await putProgress();
  expect(response.status).toBe(404);
});

it("rejects a non-completed or non-FULL reading", async () => {
  mocks.getReadingJobById.mockResolvedValue({
    id: "reading-1",
    type: "FREE_OVERVIEW",
    status: "COMPLETED",
  });
  expect((await putProgress()).status).toBe(404);
});

it("upserts valid progress for the owner", async () => {
  const response = await putProgress();
  expect(response.status).toBe(200);
  expect(mocks.saveReadingProgress).toHaveBeenCalledWith("user-1", "reading-1", {
    chapterKey: "chuong-4-cong-viec",
    chapterIndex: 3,
    percent: 42,
    chapterOffset: 0.35,
  });
});
```

- [ ] **Step 2: Run route tests and verify failure**

Run:

```powershell
npm test -- "src/app/api/readings/[id]/progress/route.test.ts"
```

Expected: FAIL because the route does not exist.

- [ ] **Step 3: Implement `PUT`**

Flow:

```ts
const user = await getCurrentUser();
if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

const reading = await getReadingJobById(user.id, id);
if (!reading || reading.type !== "FULL" || reading.status !== "COMPLETED") {
  return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
}

const input = parseReadingProgressInput(await request.json().catch(() => null));
if (!input) return NextResponse.json({ error: "INVALID_PROGRESS" }, { status: 400 });

const progress = await saveReadingProgress(user.id, reading.id, input);
return NextResponse.json({ progress });
```

The endpoint never accepts a client-supplied `userId`.

- [ ] **Step 4: Run focused tests**

Run:

```powershell
npm test -- "src/app/api/readings/[id]/progress/route.test.ts" src/lib/reading-progress.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit the endpoint**

```powershell
git add "src/app/api/readings/[id]/progress/route.ts" "src/app/api/readings/[id]/progress/route.test.ts"
git commit -m "feat: secure reading progress updates"
```

### Task 5: Build the paid reader experience

**Files:**
- Create: `src/components/paid-reading-experience.tsx`
- Create: `src/components/paid-reading-experience.test.tsx`
- Modify: `src/components/markdown-content.tsx`
- Modify: `src/app/la-so/[id]/nang-cao/page.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Write the component contract test**

Because the repository does not include a DOM test environment, use source-contract tests for browser API and accessibility boundaries:

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("src/components/paid-reading-experience.tsx", "utf8");

describe("PaidReadingExperience contract", () => {
  it("tracks chapters and persists progress without blocking reading", () => {
    expect(source).toContain("IntersectionObserver");
    expect(source).toContain("requestAnimationFrame");
    expect(source).toContain("setTimeout");
    expect(source).toContain(`/api/readings/`);
    expect(source).toContain("keepalive: true");
    expect(source).toContain("Đọc tiếp từ");
    expect(source).toContain("aria-current");
    expect(source).toContain("aria-valuenow");
  });
});
```

- [ ] **Step 2: Run the test and verify failure**

Run:

```powershell
npm test -- src/components/paid-reading-experience.test.tsx
```

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement the client component**

Use this public contract:

```ts
type PaidReadingExperienceProps = {
  readingId: string;
  content: string;
  chapters: PaidReadingDisplayChapter[];
  initialProgress: ReadingProgressInput | null;
};
```

Required behavior:

- Render the TOC and `MarkdownContent`.
- Find the report container and H1 elements by stable IDs.
- Use `IntersectionObserver` for active chapter.
- Use one passive scroll handler scheduled through `requestAnimationFrame`.
- Calculate report progress and chapter-relative offset.
- Debounce `PUT /api/readings/${readingId}/progress` for 2 seconds.
- Skip writes when percent and chapter are unchanged.
- Catch network errors and retain the latest pending state for retry.
- Send the final state with `fetch(..., { keepalive: true })` during `pagehide`.
- Show a fixed progress bar only while the report intersects the viewport.
- Show `Đọc tiếp từ Chương X — Y%` when initial progress is at least 2%.
- On resume, target `chapterKey` plus `chapterOffset`; fall back to report percent.
- Set `aria-current="location"` on the active TOC link and progressbar ARIA values.

- [ ] **Step 4: Wire the server page**

In `page.tsx`:

```ts
const normalizedReading = normalizePaidReading(fullReading?.content || "");
const initialProgress = fullReading
  ? await getReadingProgress(user.id, fullReading.id)
  : null;
```

Replace the static aside/article block with:

```tsx
<PaidReadingExperience
  readingId={fullReading.id}
  content={normalizedReading.content}
  chapters={normalizedReading.chapters}
  initialProgress={initialProgress}
/>
```

The pending-reading path must not query or render progress.

- [ ] **Step 5: Add paid-only visual styles**

Add scoped selectors under `.paid-reading-experience`:

- Sticky/fixed progress surface with a thin filled bar.
- Responsive safe offsets and `pointer-events` behavior.
- Active TOC background and text color.
- Resume card/button.
- `strong` styling with dark amber text and a subtle cream highlight.
- `scroll-margin-top` on paid report H1 headings.

Do not change global `.prose-content strong` behavior.

- [ ] **Step 6: Run focused tests and lint**

Run:

```powershell
npm test -- src/components/paid-reading-experience.test.tsx src/components/markdown-content.test.ts src/lib/paid-reading-presentation.test.ts
npm run lint
```

Expected: tests and lint PASS.

- [ ] **Step 7: Commit the reader UI**

```powershell
git add src/components/paid-reading-experience.tsx src/components/paid-reading-experience.test.tsx src/components/markdown-content.tsx "src/app/la-so/[id]/nang-cao/page.tsx" src/app/globals.css
git commit -m "feat: add resumable paid reading experience"
```

### Task 6: Verify the complete flow

**Files:**
- Modify only files required to fix failures found by verification.

- [ ] **Step 1: Run all focused tests**

```powershell
npm test -- src/lib/paid-reading-presentation.test.ts src/lib/ai.test.ts src/lib/reading-progress.test.ts "src/app/api/readings/[id]/progress/route.test.ts" src/components/paid-reading-experience.test.tsx src/components/markdown-content.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run the full verification ladder with bundled Node**

```powershell
$env:PATH="C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;$env:PATH"
npm run lint
npm test
npm run build
```

Expected: all commands exit 0. Use Headroom compression for long output and retrieve exact lines only if a failure requires diagnosis.

- [ ] **Step 3: Run local browser verification**

Start on port 4000 and verify:

- Paid report contains no data dashboard.
- Legacy action guides appear once at the end.
- Important conclusions are visibly emphasized.
- Progress percent and chapter update during scroll.
- TOC highlights and scrolls smoothly.
- Resume button restores the location after reload.
- Narrow mobile width does not obscure content.
- Browser console has no errors.

- [ ] **Step 4: Check migration and Git hygiene**

```powershell
npm run db:generate
git diff --check
git status --short --branch
```

Expected: generated client succeeds, no whitespace errors, and only intended files are changed.

- [ ] **Step 5: Commit any verification-only fixes**

If verification required code changes:

```powershell
git add <only-the-files-fixed>
git commit -m "fix: harden paid reading resume flow"
```

If no changes were required, do not create an empty commit.
