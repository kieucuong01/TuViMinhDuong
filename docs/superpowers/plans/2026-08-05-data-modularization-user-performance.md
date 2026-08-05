# Data Modularization and User Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task, with review checkpoints after every task.

**Goal:** Tách data layer và làm mỏng Server Actions mà không đổi hành vi công khai, sau đó cải thiện tốc độ mobile của hành trình trang chủ → lập lá số → trang kết quả và cập nhật lại bản đồ Graphify.

**Architecture:** Giữ `src/lib/data.ts` làm compatibility facade có explicit re-export; chuyển implementation vào các module server-only theo domain dùng chung một singleton demo store. Giữ auth/authz tại Server Action hoặc data-access boundary. Tối ưu hiệu năng dựa trên baseline production build: giảm payload truy vấn bài viết trang chủ, loại truy vấn reading trùng và chạy song song các server read độc lập.

**Tech Stack:** Next.js 16 App Router, React 19 Server Components/Server Actions, TypeScript 5, Prisma 7/PostgreSQL với demo in-memory fallback, Vitest 4, Playwright 1.60, Graphify 0.9.33, Node.js 24 bundled runtime.

## Global Constraints

- Làm việc duy nhất trong `C:\Users\ASUS\Documents\Claude\Projects\Tu vi\.worktrees\refactor-data-performance` trên nhánh `codex/refactor-data-performance`.
- Không chỉnh checkout chính, không stage thay đổi ngoài phạm vi, không push và không deploy.
- Giữ nguyên URL, UI, metadata, Server Action export/signature, redirect/revalidation, chart JSON, thuật toán lá số/lịch, auth/ownership, coin/PayOS, retry/refund và CMS behavior.
- Giữ nguyên fallback demo/in-memory và vòng đời singleton của nó; database có thể vắng hoặc lỗi như hiện tại.
- Không thêm runtime dependency.
- `src/lib/data.ts` phải tiếp tục import `server-only`; mọi module dưới `src/lib/data/` cũng phải là server-only hoặc chỉ chứa type/pure helper không thể truy cập client ngoài ý muốn.
- Không cache chart riêng tư, session, balance hoặc reading theo key thiếu user/chart identity.
- Dùng red-green-refactor ở mỗi task: tạo/đổi test trước, chạy thấy fail đúng lý do, viết lượng code tối thiểu, chạy targeted tests, cleanup, chạy lại rồi commit.
- Không commit `graphify-out/`, `src/graphify-out/`, `.next/`, generated Prisma client, Playwright report, env, log hoặc artifact trong `C:\tmp`.

## Fixed Tooling Commands

Chạy các lệnh Node bằng runtime đã xác nhận tương thích với Next 16.2.12 và Rolldown 1.2.1:

```powershell
$Node24 = 'C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
$Vitest = '.\node_modules\vitest\vitest.mjs'
$Eslint = '.\node_modules\eslint\bin\eslint.js'
$Next = '.\node_modules\next\dist\bin\next'
$Playwright = '.\node_modules\@playwright\test\cli.js'
$Graphify = 'C:\Users\ASUS\Documents\Claude\Projects\Tu vi\.codex\tools\graphify-venv\Scripts\graphify.exe'
$SafeGit = 'C:/Users/ASUS/Documents/Claude/Projects/Tu vi/.worktrees/refactor-data-performance'
```

Mọi lệnh Git trong worktree dùng dạng:

```powershell
git -c safe.directory=$SafeGit status --short --branch
```

Baseline môi trường đã quan sát khi lập kế hoạch: lint exit `0`; Vitest `137` files/`730` tests pass khi chạy ngoài giới hạn tạo upload fixture; build exit `0` và sinh `551` static pages. Đây chỉ là mốc tham khảo, executor phải chạy lại gate mới trước khi tuyên bố hoàn tất. Giữ nguyên và báo riêng hai warning hiện có: Vitest/Vite ESM-config warning và Next Turbopack workspace-root warning do nested worktree.

---

## Task 1: Add a Reproducible User-Journey Performance Harness and Capture Baselines

**Files:**

- Create: `src/lib/performance-metrics.ts`
- Create: `src/lib/performance-metrics.test.ts`
- Create: `tests/e2e/user-journey-performance.spec.ts`
- Modify: `tests/e2e/helpers.ts`
- Modify: `package.json`
- Modify: `playwright.config.ts`
- Runtime only, do not commit: `graphify-out/`
- Runtime only, do not commit: `C:\tmp\tuvi-user-journey-before.json`
- Runtime only, do not commit: `C:\tmp\tuvi-graphify-before-20260805\`

### 1.1 Write the failing pure metric tests

- [ ] Create `src/lib/performance-metrics.test.ts` with fixtures for three samples per route. Vitest only collects `src/**/*.{test,spec}.{ts,tsx}` in this project; keeping it under `src/lib` also prevents Playwright from collecting it.
- [ ] Assert median is the middle sorted value, not the minimum or arithmetic average.
- [ ] Assert primary-bottleneck selection uses normalized diagnostic ratios and the documented tie order.
- [ ] Assert `evaluateBudget` rejects LCP above `2500`, CLS above `0.1`, or initial JS greater than baseline.
- [ ] Assert a route whose baseline already meets LCP/CLS must improve its selected bottleneck by at least `15%`.

The public test helper contract is:

```ts
export type JourneyRoute = "home" | "chart-result";

export type PerformanceSample = {
  route: JourneyRoute;
  lcpMs: number;
  cls: number;
  ttfbMs: number;
  htmlBytes: number;
  initialJsBytes: number;
};

export type PerformanceSummary = PerformanceSample & { samples: number };

export function median(values: number[]): number;
export function summarize(samples: PerformanceSample[]): PerformanceSummary[];
export function selectPrimaryBottleneck(
  summary: PerformanceSummary,
): "lcpMs" | "ttfbMs" | "htmlBytes" | "initialJsBytes";
export function evaluateBudget(
  before: PerformanceSummary,
  after: PerformanceSummary,
  bottleneck: "lcpMs" | "ttfbMs" | "htmlBytes" | "initialJsBytes",
): { passed: boolean; reasons: string[]; improvementPct: number };
```

- [ ] Run RED:

```powershell
& $Node24 $Vitest run src/lib/performance-metrics.test.ts
```

Expected: fail because `src/lib/performance-metrics.ts` or its exports do not exist.

### 1.2 Implement metric calculation without app runtime dependencies

- [ ] Implement finite-number validation and median calculation. Throw on an empty array or mixed routes instead of silently producing `NaN`.
- [ ] Round timings/bytes to whole numbers, CLS to four decimals, and improvement percentage to one decimal only when building the report.
- [ ] Select the baseline bottleneck by the largest normalized ratio using diagnostic reference values LCP `2500ms`, TTFB `800ms`, HTML `150_000` bytes and initial JS `200_000` bytes. These extra reference values only prevent cherry-picking the 15% target; they do not create new pass/fail budgets. Break equal ratios in this order: LCP, TTFB, HTML, initial JS.
- [ ] Enforce these fixed rules in `evaluateBudget`:

```ts
const LCP_BUDGET_MS = 2_500;
const CLS_BUDGET = 0.1;

// Always required:
after.lcpMs <= LCP_BUDGET_MS;
after.cls <= CLS_BUDGET;
after.initialJsBytes <= before.initialJsBytes;

// Required when the baseline already met LCP and CLS:
((before[bottleneck] - after[bottleneck]) / before[bottleneck]) * 100 >= 15;
```

- [ ] Run GREEN with the same Vitest command.

### 1.3 Add the production-journey Playwright spec

- [ ] Add an init script before each navigation that observes `largest-contentful-paint` and non-input `layout-shift` entries.
- [ ] Wait for a non-zero observed LCP plus a fixed one-second settling window before capture; do not wait for `networkidle`, because free-overview polling intentionally keeps the chart page network-active.
- [ ] Read TTFB and HTML transfer bytes from the navigation timing entry.
- [ ] Sum `transferSize`, falling back to `encodedBodySize`, for script resources loaded during the initial navigation.
- [ ] Run exactly three cold browser-context samples for `/` and three full guest chart journeys using the existing `createSmokeChart` helper.
- [ ] After each helper creates a chart, close its creation context and open `/la-so/{id}` in a new cold context before recording chart-result Navigation Timing. Assert the navigation-entry pathname matches `window.location.pathname` so a Next client transition cannot be mislabeled as a cold route measurement.
- [ ] Keep `createSmokeChart` aligned with the current form controls: day, month, year, birth hour and view year are `<select>` elements and must use `selectOption`.
- [ ] Use a unique harmless name per chart sample and never call checkout, PayOS, coin, admin, or production endpoints.
- [ ] Write `{ phase, generatedAt, summaries, samples }` to the absolute path from `PERF_OUTPUT_PATH`; reject a relative or missing path.
- [ ] Add package script:

```json
"test:perf:user-journey": "playwright test tests/e2e/user-journey-performance.spec.ts --project=mobile-chrome"
```

- [ ] Allow `PLAYWRIGHT_EXECUTABLE_PATH` to set Playwright `launchOptions.executablePath` for local machines that have system Chrome but not the package-matched browser cache. Leave CI/default behavior unchanged when the variable is absent.

- [ ] Run the pure unit test and list the new Playwright test without starting a server:

```powershell
& $Node24 $Vitest run src/lib/performance-metrics.test.ts
& $Node24 $Playwright test tests/e2e/user-journey-performance.spec.ts --project=mobile-chrome --list
```

Expected: unit test passes; Playwright lists one performance suite and does not report a syntax/config error.

### 1.4 Build once and record the pre-refactor performance baseline

- [ ] Run a fresh production build:

```powershell
& $Node24 $Next build
```

- [ ] Start the production server with bundled Node in a hidden process, poll `http://127.0.0.1:4000/` until ready, run the mobile performance suite, and always stop only that process in `finally`:

```powershell
$Server = Start-Process -FilePath $Node24 -ArgumentList @($Next, 'start', '-p', '4000') -WorkingDirectory (Get-Location) -WindowStyle Hidden -PassThru
try {
  $Ready = $false
  1..60 | ForEach-Object {
    if (-not $Ready) {
      try { $null = Invoke-WebRequest 'http://127.0.0.1:4000/' -UseBasicParsing -TimeoutSec 2; $Ready = $true } catch { Start-Sleep -Seconds 1 }
    }
  }
  if (-not $Ready) { throw 'Production server did not become ready on port 4000.' }
  $env:PLAYWRIGHT_BASE_URL = 'http://127.0.0.1:4000'
  $env:PLAYWRIGHT_DISABLE_LLM = '1'
  $env:PERF_PHASE = 'before'
  $env:PERF_OUTPUT_PATH = 'C:\tmp\tuvi-user-journey-before.json'
  & $Node24 $Playwright test tests/e2e/user-journey-performance.spec.ts --project=mobile-chrome
  if ($LASTEXITCODE -ne 0) { throw "Performance baseline failed with exit code $LASTEXITCODE" }
} finally {
  if ($Server -and -not $Server.HasExited) { Stop-Process -Id $Server.Id }
}
```

- [ ] Record `selectPrimaryBottleneck(summary)` for each route before inspecting any after result; this fixed value is the metric that must improve by 15% when the baseline already passes LCP/CLS.

### 1.5 Build the fresh Graphify baseline from the project root

- [ ] Run from the worktree root, not from `src`, so the expected output is `graphify-out/` and no new `src/graphify-out/` is created:

```powershell
& $Graphify extract . --code-only --out . --force
& $Graphify cluster-only . --no-label
& $Graphify diagnose multigraph --graph '.\graphify-out\graph.json' --json
& $Graphify god-nodes --graph '.\graphify-out\graph.json' --top 15 --json
```

- [ ] Copy the untracked baseline artifacts outside the repository for later comparison:

```powershell
$BeforeGraphDir = 'C:\tmp\tuvi-graphify-before-20260805'
New-Item -ItemType Directory -Path $BeforeGraphDir -Force | Out-Null
Copy-Item -LiteralPath '.\graphify-out\graph.json' -Destination $BeforeGraphDir -Force
Copy-Item -LiteralPath '.\graphify-out\GRAPH_REPORT.md' -Destination $BeforeGraphDir -Force
```

- [ ] Confirm `git status --short` contains only the intended tracked harness files plus ignored/untracked Graphify output; never add Graphify output.
- [ ] Commit only harness files:

```powershell
git -c safe.directory=$SafeGit add package.json playwright.config.ts src/lib/performance-metrics.ts src/lib/performance-metrics.test.ts tests/e2e/helpers.ts tests/e2e/user-journey-performance.spec.ts docs/superpowers/plans/2026-08-05-data-modularization-user-performance.md
git -c safe.directory=$SafeGit commit -m "test: add mobile journey performance baseline"
```

---

## Task 2: Extract Shared Contracts and the Singleton Demo Store

**Files:**

- Create: `src/lib/data/contracts.ts`
- Create: `src/lib/data/demo-store.ts`
- Create: `src/lib/data-module-boundaries.test.ts`
- Modify: `src/lib/data.ts`

### 2.1 Add the failing architecture boundary test

- [ ] Read source files with `node:fs`; do not import server-only modules at runtime.
- [ ] Assert `contracts.ts` and `demo-store.ts` exist.
- [ ] Assert no file under `src/lib/data/` imports `@/lib/data` or `../data`; domain dependencies must point inward to concrete lower-level modules.
- [ ] Assert `demo-store.ts` contains exactly one `globalThis` registry and exports accessors rather than top-level mutable maps.
- [ ] Assert `src/lib/data.ts` still starts with `import "server-only";`.
- [ ] Run RED:

```powershell
& $Node24 $Vitest run src/lib/data-module-boundaries.test.ts
```

Expected: fail because the new module files do not exist.

### 2.2 Move shared types without changing their shape

- [ ] Move these types verbatim to `contracts.ts` and re-export them explicitly from the facade:

```text
ChartCreationMetadata
StoredReading
ReadingScopeKey
OperationSettings
AdminPaymentSource
AdminRevenueMetrics
AdminRecentUser
AdminRecentPayment
AdminBusinessDashboard
AdminTrendPeriod
AdminTrendPoint
AdminTrendGroups
StoredReadingProgress
AdminChartSubmission
FreeOverviewBlockProgress
FreeOverviewStatus
FreeOverviewGenerationClaim
ChartHistoryItem
```

- [ ] Use `import type` for `SessionUser`, `StoredChart`, `ReadingKey`, `ReadingProgressInput` and other type-only dependencies.
- [ ] Do not move `normalizeAdminTrendPeriod`, cache tags, or default values into contracts; they belong to their domain modules.

### 2.3 Move fallback state into one registry

- [ ] Move the existing `globalStore` shape and all `demo*()` accessors into `demo-store.ts` without changing key names or initialization semantics.
- [ ] Preserve Maps for charts, readings, progress, balances, articles and categories.
- [ ] Prevent a dependency cycle for settings/prices by making their accessors accept initializers:

```ts
export function demoOperationSettings(initial: OperationSettings): OperationSettings;
export function replaceDemoOperationSettings(next: OperationSettings): OperationSettings;
export function demoFeaturePrices(initial: () => FeaturePriceMap): FeaturePriceMap;
export function replaceDemoFeaturePrices(next: FeaturePriceMap): FeaturePriceMap;
```

- [ ] Keep seed article/category initialization lazy and equivalent to the current first-access behavior.
- [ ] Update `data.ts` to consume the extracted accessors temporarily; no domain implementation moves in this task.

### 2.4 Verify and commit

- [ ] Run:

```powershell
& $Node24 $Vitest run src/lib/data-module-boundaries.test.ts src/lib/data-seed-priority.test.ts src/lib/free-overview-status.test.ts src/lib/reading-progress.test.ts src/lib/admin-pricing.test.ts
& $Node24 $Eslint src/lib/data.ts src/lib/data/contracts.ts src/lib/data/demo-store.ts src/lib/data-module-boundaries.test.ts
```

- [ ] Confirm the facade public type names and fallback behavior are unchanged.
- [ ] Commit:

```powershell
git -c safe.directory=$SafeGit add src/lib/data.ts src/lib/data/contracts.ts src/lib/data/demo-store.ts src/lib/data-module-boundaries.test.ts
git -c safe.directory=$SafeGit commit -m "refactor: extract shared data contracts and demo store"
```

---

## Task 3: Extract the Chart Persistence Domain

**Files:**

- Create: `src/lib/data/charts.ts`
- Modify: `src/lib/data.ts`
- Modify: `src/lib/data-module-boundaries.test.ts`

### 3.1 Extend the boundary test first

- [ ] Add an ownership table asserting these exports are implemented in `charts.ts` and explicitly re-exported by the facade:

```text
countRecentChartsForIp
saveChart
claimGuestChartForCheckout
claimGuestChartForUserFromPath
getChart
listUserCharts
deleteUserChart
```

- [ ] Assert `charts.ts` does not import `free-overview.ts`, `readings.ts`, `articles.ts`, `settings.ts`, `admin.ts`, or the facade.
- [ ] Run RED and observe failure because `charts.ts` is missing.

### 3.2 Move chart code as a mechanical refactor

- [ ] Move chart record normalization, JSON parsing, creation metadata, owner checks, guest-claim transaction logic, recent-IP count, list-history and delete helpers together with the seven public functions.
- [ ] Preserve these public signatures exactly:

```ts
countRecentChartsForIp(requestIp: string | undefined, since: Date)
saveChart(input: ChartInput, user: SessionUser | null, metadata?: ChartCreationMetadata)
claimGuestChartForCheckout(chartId: string, fullName: string): Promise<SessionUser | null>
claimGuestChartForUserFromPath(path: string, user: SessionUser)
getChart(id: string)
listUserCharts(userId: string, includeAll?: boolean): Promise<ChartHistoryItem[]>
deleteUserChart(user: SessionUser, chartId: string)
```

- [ ] Keep chart calculation delegated to the existing `generateTuViChart`; do not alter date/chart code or serialized JSON.
- [ ] Keep demo and Prisma branches, duplicate/rate metadata, ownership conditions and return values byte-for-byte where practical.
- [ ] Replace the removed facade implementation with explicit value/type re-exports only.

### 3.3 Verify and commit

- [ ] Run:

```powershell
& $Node24 $Vitest run src/lib/data-module-boundaries.test.ts src/lib/data-chart-creation-metadata.test.ts src/lib/chart-save-performance.test.ts src/lib/chart-ownership.test.ts src/app/actions-create-chart.test.ts src/app/login-claim-guest-chart.test.ts
& $Node24 $Eslint src/lib/data.ts src/lib/data/charts.ts src/lib/data-module-boundaries.test.ts
```

- [ ] Commit:

```powershell
git -c safe.directory=$SafeGit add src/lib/data.ts src/lib/data/charts.ts src/lib/data-module-boundaries.test.ts
git -c safe.directory=$SafeGit commit -m "refactor: extract chart persistence domain"
```

---

## Task 4: Extract the Free-Overview Domain

**Files:**

- Create: `src/lib/data/free-overview.ts`
- Modify: `src/lib/data.ts`
- Modify: `src/lib/data-module-boundaries.test.ts`

### 4.1 Add failing ownership assertions

- [ ] Assign these exports to `free-overview.ts` in the boundary test:

```text
getFreeOverviewStatus
claimFreeOverviewGeneration
claimFreeOverviewBlockGeneration
failFreeOverviewGeneration
generateAndStoreFreeOverviewBlock
generateAndStoreFreeOverview
getOrCreateFreeOverview
```

- [ ] Permit `free-overview.ts` to import `getChart` from `./charts`; forbid the reverse import.
- [ ] Run RED and confirm only the missing ownership/module assertions fail.

### 4.2 Move the overview state machine unchanged

- [ ] Move status normalization, legacy-content migration, per-block progress, claim/fail/complete state transitions and AI generation orchestration.
- [ ] Preserve the exact public signatures and default `{ force?: boolean } = {}`.
- [ ] Preserve idempotency: already-completed blocks stay completed, competing claims do not duplicate jobs, failure metadata remains observable, and demo chart mutation updates the shared store.
- [ ] Do not change prompt/content generation, visible teaser behavior or the API route contract.

### 4.3 Verify and commit

- [ ] Run:

```powershell
& $Node24 $Vitest run src/lib/data-module-boundaries.test.ts src/lib/free-overview-status.test.ts src/lib/free-overview-engine.test.ts src/lib/free-overview-presentation.test.ts 'src/app/api/charts/[id]/free-overview/route.test.ts' 'src/app/api/charts/[id]/free-overview/process/route.test.ts' src/components/free-overview-loader.test.ts
& $Node24 $Eslint src/lib/data.ts src/lib/data/free-overview.ts src/lib/data-module-boundaries.test.ts
```

- [ ] Commit:

```powershell
git -c safe.directory=$SafeGit add src/lib/data.ts src/lib/data/free-overview.ts src/lib/data-module-boundaries.test.ts
git -c safe.directory=$SafeGit commit -m "refactor: extract free overview domain"
```

---

## Task 5: Extract Pricing and Operation Settings

**Files:**

- Create: `src/lib/data/settings.ts`
- Create: `src/lib/data/cache.ts`
- Modify: `src/lib/data.ts`
- Modify: `src/lib/data-module-boundaries.test.ts`

### 5.1 Add the failing settings ownership contract

- [ ] Assign these values/functions to `settings.ts`:

```text
OPERATION_SETTINGS_CACHE_TAG
FEATURE_PRICES_CACHE_TAG
DEFAULT_OPERATION_SETTINGS
getFeaturePrice
getFeaturePrices
updateFeaturePrices
getOperationSettings
updateOperationSettings
```

- [ ] Assert the facade exports the constants and functions explicitly.
- [ ] Run RED before creating the module.

### 5.2 Move settings with cache semantics intact

- [ ] Move the generic server-cache wrapper to the low-level internal helper `src/lib/data/cache.ts`; settings and articles both consume it, and it never imports a domain module or the facade.
- [ ] Preserve `NODE_ENV === "test"` bypass, cache tags and `revalidate: 300`.
- [ ] Preserve default feature-price cloning so callers cannot mutate a shared default object.
- [ ] Preserve `revalidateTag` calls after updates and exact demo-store replacement behavior.
- [ ] Do not cache user-specific values.

### 5.3 Verify and commit

- [ ] Run:

```powershell
& $Node24 $Vitest run src/lib/data-module-boundaries.test.ts src/lib/admin-pricing.test.ts src/lib/pricing.test.ts src/app/admin/admin-pricing-layout.test.ts
& $Node24 $Eslint src/lib/data.ts src/lib/data/settings.ts src/lib/data/cache.ts src/lib/data-module-boundaries.test.ts
```

- [ ] Commit:

```powershell
git -c safe.directory=$SafeGit add src/lib/data.ts src/lib/data/settings.ts src/lib/data/cache.ts src/lib/data-module-boundaries.test.ts
git -c safe.directory=$SafeGit commit -m "refactor: extract pricing and operation settings"
```

---

## Task 6: Extract Reading, Balance, Bundle and Progress Persistence

**Files:**

- Create: `src/lib/data/readings.ts`
- Modify: `src/lib/data.ts`
- Modify: `src/lib/data-module-boundaries.test.ts`

### 6.1 Add the failing reading ownership contract

- [ ] Assign all of these exports to `readings.ts`:

```text
getUserBalance
adjustCoins
getCachedReading
hasReadingBundleAccess
getAnyCompletedReading
getReadingJobByScope
getReadingJobById
getReadingProgress
saveReadingProgress
createPendingReading
updateReadingJobProgress
completeReadingJob
failReadingJob
getCompletedReadingsForScopes
getReadingById
saveReading
```

- [ ] Assert `readings.ts` may import `./charts` and shared contracts/store, but cannot import actions, pages, admin, articles or the facade.
- [ ] Run RED before moving code.

### 6.2 Move the full reading persistence state machine

- [ ] Move balance normalization, ledger writes, reading key/scope normalization, bundle access, progress persistence, pending/completed/failed transitions and demo fallbacks together.
- [ ] Preserve transaction boundaries, unique-key/upsert semantics, idempotent completion, `refunded` behavior and `promptMeta`/model persistence.
- [ ] Preserve all current return object shapes and `null` behavior.
- [ ] Do not move pricing policy into this module; callers continue to supply `priceCoins` where they do today.

### 6.3 Verify and commit

- [ ] Run:

```powershell
& $Node24 $Vitest run src/lib/data-module-boundaries.test.ts src/lib/reading-progress.test.ts src/lib/reading-unlock.test.ts src/lib/payos-reading.test.ts 'src/app/api/readings/[id]/progress/route.test.ts' 'src/app/api/readings/[id]/process/route.test.ts' src/app/actions-full-checkout.test.ts src/app/actions-checkout-full.test.ts
& $Node24 $Eslint src/lib/data.ts src/lib/data/readings.ts src/lib/data-module-boundaries.test.ts
```

- [ ] Commit:

```powershell
git -c safe.directory=$SafeGit add src/lib/data.ts src/lib/data/readings.ts src/lib/data-module-boundaries.test.ts
git -c safe.directory=$SafeGit commit -m "refactor: extract reading persistence domain"
```

---

## Task 7: Extract Article and CMS Persistence

**Files:**

- Create: `src/lib/data/articles.ts`
- Modify: `src/lib/data.ts`
- Modify: `src/lib/data-module-boundaries.test.ts`

### 7.1 Add failing ownership assertions

- [ ] Assign these exports/constants to `articles.ts`:

```text
ARTICLES_CACHE_TAG
listArticles
listAdminArticles
getArticleBySlug
getAdminArticleBySlug
deleteArticleBySlug
listArticleCategories
saveArticleCategoryFromForm
saveArticleFromForm
```

- [ ] Run RED and confirm the existing seed/CMS tests remain unchanged at this point.

### 7.2 Move article persistence and normalization unchanged

- [ ] Move article/category record types, seed freshness comparison, relation normalization, sorting, deleted-status tombstones, cached reads and form persistence.
- [ ] Preserve seed-vs-DB precedence, deleted seed suppression, public-vs-admin status filtering, cache tags, canonical/SEO fields and fallback behavior.
- [ ] Preserve existing upload route/security separately; do not move filesystem upload validation into this data module.
- [ ] Reuse the shared cache helper from Task 5 if it exists.

### 7.3 Verify and commit

- [ ] Run:

```powershell
& $Node24 $Vitest run src/lib/data-module-boundaries.test.ts src/lib/data-seed-priority.test.ts src/lib/cms.test.ts src/lib/article-cache.test.ts src/lib/article-pagination.test.ts src/app/uploads/articles/article-upload-route.test.ts src/app/admin/admin-content-layout.test.ts
& $Node24 $Eslint src/lib/data.ts src/lib/data/articles.ts src/lib/data-module-boundaries.test.ts
```

- [ ] Commit:

```powershell
git -c safe.directory=$SafeGit add src/lib/data.ts src/lib/data/articles.ts src/lib/data-module-boundaries.test.ts
git -c safe.directory=$SafeGit commit -m "refactor: extract article and CMS persistence"
```

---

## Task 8: Extract Admin Reporting

**Files:**

- Create: `src/lib/data/admin.ts`
- Modify: `src/lib/data.ts`
- Modify: `src/lib/data-module-boundaries.test.ts`

### 8.1 Add failing admin ownership assertions

- [ ] Assign these exports to `admin.ts`:

```text
normalizeAdminTrendPeriod
getAdminBusinessDashboard
listAdminChartSubmissions
getAdminOverview
```

- [ ] Permit admin to import public settings functions from `./settings`; forbid settings importing admin.
- [ ] Run RED.

### 8.2 Move reporting queries and pure normalization

- [ ] Move dashboard date windows, revenue-source grouping, recent-user/payment projection, trend aggregation, chart-submission projection and overview composition.
- [ ] Preserve timezone/date range semantics, source classification, limits, ordering and fallback values.
- [ ] Preserve `getAdminOverview(periodInput?: string | null)` behavior and the current normalization default.

### 8.3 Verify and commit

- [ ] Run:

```powershell
& $Node24 $Vitest run src/lib/data-module-boundaries.test.ts src/lib/admin-business-dashboard.test.ts src/lib/admin-chart-submissions.test.ts src/app/admin/admin-overview-layout.test.ts src/app/admin/admin-chart-submissions-layout.test.ts
& $Node24 $Eslint src/lib/data.ts src/lib/data/admin.ts src/lib/data-module-boundaries.test.ts
```

- [ ] Commit:

```powershell
git -c safe.directory=$SafeGit add src/lib/data.ts src/lib/data/admin.ts src/lib/data-module-boundaries.test.ts
git -c safe.directory=$SafeGit commit -m "refactor: extract admin reporting domain"
```

---

## Task 9: Lock the Facade Contract and Make Server Actions Thin

**Files:**

- Create: `src/lib/data-facade-contract.test.ts`
- Create: `src/lib/action-input.ts`
- Create: `src/lib/action-input.test.ts`
- Create: `src/lib/reading-checkout.ts`
- Create: `src/lib/reading-checkout.test.ts`
- Modify: `src/lib/data.ts`
- Modify: `src/app/actions.ts`
- Modify: source-contract tests under `src/app/*actions*.test.ts` only where they inspect implementation text rather than behavior

### 9.1 Freeze the facade public API before cleanup

- [ ] Create a source-level expected-symbol list containing every type, constant and function present before extraction.
- [ ] Assert every symbol is explicitly re-exported exactly once from `src/lib/data.ts`.
- [ ] Assert the facade contains no database call, mutation, cache configuration or fallback state and stays under 140 non-blank lines.
- [ ] Assert no consumer is forced to change its existing `@/lib/data` import in this refactor.
- [ ] Run RED; it should fail until the facade is reduced to re-exports.

### 9.2 Add pure FormData parser tests

- [ ] Identify duplicated string/number/boolean parsing in `actions.ts` and write behavior tests for these pure functions:

```ts
parseChartActionInput(formData: FormData): ChartInput;
parseReadingRequestInput(formData: FormData): ReadingRequestInput;
parseReadingBundleInput(formData: FormData): ReadingBundleInput;
parseOperationSettingsInput(formData: FormData): Omit<OperationSettings, "updatedAt">;
parseFeaturePriceUpdates(formData: FormData): Array<{ key: string; priceCoins: number }>;
```

- [ ] Preserve the exact accepted field names, trimming/default behavior, bounds and thrown/returned expected-error behavior from current actions.
- [ ] Run RED before creating `action-input.ts`.

### 9.3 Thin actions without moving security outward

- [ ] Keep file-level `"use server"` and all 17 public action names/signatures.
- [ ] Move only pure input normalization into `action-input.ts`.
- [ ] Keep `getCurrentUser`, admin checks, ownership checks, rate-limit checks, checkout token verification and all authorization in the action or called server-only DAL.
- [ ] Each action should visibly follow: parse → authorize → call one domain operation/orchestrator → redirect/revalidate/return.
- [ ] Preserve action timeout wrappers, exact redirect query parameters and `revalidatePath` calls.
- [ ] Move the payment-order/read-job orchestration currently embedded in `quickReadingCheckoutAction` and `checkoutFullReadingAction` into `reading-checkout.ts`, following the dependency-injection pattern already used by `reading-unlock.ts`.
- [ ] Cover these checkout outcomes before moving them: existing cached reading, existing pending reading, retryable failed paid reading, forbidden ownership, invalid checkout email, PayOS creation error, unavailable non-demo checkout, local demo completion and external checkout URL.
- [ ] Keep session creation/rotation and the final Next `redirect`/`revalidatePath` calls in `actions.ts`; the orchestrator returns a discriminated result and never imports `next/navigation` or `next/cache`:

```ts
export type ReadingCheckoutResult =
  | { status: "cached" | "pending" | "retrying" | "demo-paid"; location: string; revalidatePath?: string }
  | { status: "external"; location: string }
  | { status: "error"; code: "forbidden" | "email-invalid" | "unavailable" | "checkout-error" };
```

- [ ] Preserve each existing database transaction/order payload and do not split atomic payment/read-job operations across action and orchestrator.
- [ ] Assert `actions.ts` contains no direct `db.paymentOrder.create` after extraction and remains below 560 non-blank lines; this is a maintainability guard, not permission to compress logic unreadably.
- [ ] Update source-inspection tests to assert the new security/data boundary; never weaken a behavior assertion just to make the refactor pass.

### 9.4 Verify and commit

- [ ] Run:

```powershell
& $Node24 $Vitest run src/lib/data-module-boundaries.test.ts src/lib/data-facade-contract.test.ts src/lib/action-input.test.ts src/lib/reading-checkout.test.ts src/app/actions-create-chart.test.ts src/app/actions-full-checkout.test.ts src/app/actions-checkout-full.test.ts src/app/login-claim-guest-chart.test.ts src/lib/payos-reading.test.ts src/lib/admin-user-management.test.ts
& $Node24 $Eslint src/lib/data.ts src/lib/data src/lib/action-input.ts src/lib/action-input.test.ts src/lib/reading-checkout.ts src/lib/reading-checkout.test.ts src/app/actions.ts src/lib/data-facade-contract.test.ts
```

- [ ] Inspect `git diff --stat` and verify no chart/date/payment fixture changed.
- [ ] Commit:

```powershell
git -c safe.directory=$SafeGit add src/lib/data.ts src/lib/data src/lib/data-facade-contract.test.ts src/lib/action-input.ts src/lib/action-input.test.ts src/lib/reading-checkout.ts src/lib/reading-checkout.test.ts src/app/actions.ts src/app/*actions*.test.ts src/app/login-claim-guest-chart.test.ts
git -c safe.directory=$SafeGit commit -m "refactor: finalize data facade and thin server actions"
```

---

## Task 10: Prove the Architecture Refactor Has No Functional Regression

**Files:**

- Modify only if a real failure requires a scoped fix: files from Tasks 2–9

### 10.1 Run complete static and unit gates

- [ ] Run a clean status check and ensure only intended commits are ahead of `origin/master`.
- [ ] Run:

```powershell
& $Node24 $Eslint .
& $Node24 $Vitest run --maxWorkers=4
& $Node24 $Next build
```

The full Vitest command needs permission to create/remove its own `public/uploads` fixtures in this desktop sandbox. A sandbox-only `EPERM` is not an application failure; rerun the identical command with the required permission and report both observations.

### 10.2 Run the existing browser smoke before performance changes

- [ ] Run desktop and mobile smoke against a production build with `PLAYWRIGHT_DISABLE_LLM=1`:

```powershell
$env:PLAYWRIGHT_BASE_URL = 'http://127.0.0.1:4000'
& $Node24 $Playwright test tests/e2e/smoke.spec.ts --project=chromium --project=mobile-chrome
```

- [ ] Verify guest home renders, form submission creates a local chart, `/la-so/[id]` renders chart/free overview shell, and no checkout is triggered.
- [ ] If any regression appears, use `superpowers:systematic-debugging`, fix it in the owning domain, rerun the targeted test and then rerun this complete task.
- [ ] Do not create a checkpoint commit if no code changed. If a scoped fix was needed, commit it as `fix: preserve behavior after data modularization`.

---

## Task 11: Reduce Homepage Article Work Without Changing the Cards

**Files:**

- Modify: `src/lib/data/contracts.ts`
- Modify: `src/lib/data/articles.ts`
- Modify: `src/lib/data.ts`
- Modify: `src/app/page.tsx`
- Create: `src/lib/article-summaries.test.ts`
- Modify: `src/lib/data-facade-contract.test.ts`

### 11.1 Write failing summary-query tests

- [ ] Define the exact summary type:

```ts
export type ArticleSummary = Pick<
  ArticleView,
  "id" | "slug" | "title" | "excerpt" | "coverImage" | "coverAlt" | "publishedAt" | "updatedAt"
>;

export async function listArticleSummaries(limit?: number): Promise<ArticleSummary[]>;
```

- [ ] Test default limit `3`, stable newest-first ordering, seed-vs-DB freshness precedence, deleted tombstone suppression and demo fallback.
- [ ] Add a Prisma mock assertion that the summary query does not select `content`, FAQ, SEO checklist or other full-body fields.
- [ ] Add a source assertion that home calls `listArticleSummaries(3)` and no longer calls `listArticles().slice(0, 3)`.
- [ ] Run RED:

```powershell
& $Node24 $Vitest run src/lib/article-summaries.test.ts src/lib/data-seed-priority.test.ts
```

Expected: fail because the summary API does not exist.

### 11.2 Implement the minimal public-card query

- [ ] Add a cached reader in `articles.ts` selecting only the eight summary fields plus internal status/timestamps required to reconcile seed and DB rows.
- [ ] Keep the existing full `listArticles()` API unchanged for knowledge/CMS consumers.
- [ ] Apply `limit` only after seed/DB reconciliation so freshness/deletion semantics are correct.
- [ ] Validate `limit` as an integer in `1..20`, defaulting to `3`; reject invalid internal calls rather than querying unbounded data.
- [ ] Re-export `ArticleSummary` and `listArticleSummaries` from the facade.
- [ ] Change only the data call on home; keep card HTML, image dimensions, copy and order unchanged.

### 11.3 Verify and commit

- [ ] Run:

```powershell
& $Node24 $Vitest run src/lib/article-summaries.test.ts src/lib/data-seed-priority.test.ts src/lib/article-cache.test.ts src/app/homepage-effects.test.ts src/lib/data-facade-contract.test.ts
& $Node24 $Eslint src/lib/data/contracts.ts src/lib/data/articles.ts src/lib/data.ts src/app/page.tsx src/lib/article-summaries.test.ts
```

- [ ] Commit:

```powershell
git -c safe.directory=$SafeGit add src/lib/data/contracts.ts src/lib/data/articles.ts src/lib/data.ts src/app/page.tsx src/lib/article-summaries.test.ts src/lib/data-facade-contract.test.ts
git -c safe.directory=$SafeGit commit -m "perf: load article summaries on home"
```

---

## Task 12: Remove the Chart-Result Server Read Waterfall

**Files:**

- Modify: `src/app/la-so/[id]/page.tsx`
- Create: `src/app/chart-page-data-loading.test.ts`

### 12.1 Write the failing data-loading contract

- [ ] Add a source/behavior test proving:
  - `getChart(id)`, `getCurrentUser()` and `getOperationSettings()` begin in one `Promise.all`.
  - the viewer FULL-reading lookup is created exactly once and reused for both visible full reading and assistant access.
  - feature prices, selected reading, viewer FULL reading and coin balance run in one independent `Promise.all` after access flags are known.
  - assistant history waits only for the single resolved FULL reading.
- [ ] Preserve all conditional guards: no price read when paid features are hidden; no private reading/balance read without eligible user access.
- [ ] Run RED:

```powershell
& $Node24 $Vitest run src/app/chart-page-data-loading.test.ts src/lib/reading-unlock.test.ts src/components/assistant-access-ui.test.ts
```

Expected: fail because the page currently awaits these reads serially and calls the FULL lookup twice on the default view when the first lookup misses.

### 12.2 Parallelize and deduplicate without changing rendering

- [ ] Add a page-local server helper with this exact behavior:

```ts
async function getViewerFullReading(user: SessionUser, chartId: string) {
  return (await getCachedReading(user.id, chartId, "FULL", "all"))
    ?? (user.role === "ADMIN" ? await getAnyCompletedReading(chartId, "FULL", "all") : null);
}
```

- [ ] Resolve `[record, user, operationSettings]` together, then call `notFound()` if `record` is absent.
- [ ] Compute access flags synchronously.
- [ ] Build guarded promises and resolve them together:

```ts
const [featurePrices, selectedReadingCandidate, viewerFullReading, coinBalance] = await Promise.all([
  paidFeaturesVisible ? getFeaturePrices() : Promise.resolve(null),
  canReadFullOverview && user && query.reading && !isScopedReadingView
    ? getReadingById(user.id, query.reading)
    : Promise.resolve(null),
  canReadFullOverview && user ? getViewerFullReading(user, id) : Promise.resolve(null),
  canReadFullOverview && user ? getUserBalance(user) : Promise.resolve(0),
]);
```

- [ ] Derive `fullReading = isScopedReadingView ? null : viewerFullReading` and `assistantFullReading = viewerFullReading`.
- [ ] Keep all JSX, labels, free-overview visibility, paid CTA visibility and assistant access states unchanged.

### 12.3 Verify and commit

- [ ] Run:

```powershell
& $Node24 $Vitest run src/app/chart-page-data-loading.test.ts src/lib/reading-unlock.test.ts src/lib/reading-progress.test.ts src/components/assistant-access-ui.test.ts src/components/premium-reading-cta.test.ts src/components/free-overview-loader.test.ts
& $Node24 $Eslint 'src/app/la-so/[id]/page.tsx' src/app/chart-page-data-loading.test.ts
```

- [ ] Commit:

```powershell
git -c safe.directory=$SafeGit add 'src/app/la-so/[id]/page.tsx' src/app/chart-page-data-loading.test.ts
git -c safe.directory=$SafeGit commit -m "perf: parallelize chart result data loading"
```

---

## Task 13: Measure, Apply the Evidence Gate, and Update Graphify

**Files:**

- Modify only if the measured gate requires one evidence-selected optimization: the directly implicated page/component/asset
- Runtime only, do not commit: `C:\tmp\tuvi-user-journey-after.json`
- Runtime only, do not commit: `graphify-out/`

### 13.1 Run full final verification before measuring

- [ ] Run fresh commands, not cached claims from Task 10:

```powershell
& $Node24 $Eslint .
& $Node24 $Vitest run --maxWorkers=4
& $Node24 $Next build
```

- [ ] Run desktop and mobile smoke against the production server.
- [ ] Inspect browser console and failed requests for `/`, chart creation and `/la-so/[id]`.

### 13.2 Record the after metrics under identical conditions

- [ ] Repeat Task 1.4 with only these environment changes:

```powershell
$env:PERF_PHASE = 'after'
$env:PERF_OUTPUT_PATH = 'C:\tmp\tuvi-user-journey-after.json'
```

- [ ] Compare medians using the checked-in `evaluateBudget` helper. Report each route's LCP, CLS, TTFB, HTML bytes and initial JS bytes before/after.
- [ ] Require LCP `<= 2500ms`, CLS `<= 0.1`, no initial-JS increase, and at least `15%` improvement in the preselected primary bottleneck when baseline was already within Core Web Vitals thresholds.

### 13.3 Use one deterministic evidence branch if the gate is not met

- [ ] Do not make a speculative bundle-wide change. Select exactly the first matching branch from this ordered table, add a failing regression/budget test, implement, rebuild and remeasure:

| Evidence | Scoped action | Required proof |
|---|---|---|
| LCP element is an image and starts late | Add `priority`/preload or correct `sizes` only on that measured above-the-fold image | Earlier resource start and lower median LCP; no layout change |
| Initial JS is the failing metric and one client chunk dominates | Dynamically defer the measured below-fold client component while preserving its visible fallback | Smaller initial JS and smoke of deferred interaction |
| TTFB remains dominant on home | Profile `listArticleSummaries`; narrow its Prisma select/cache key without changing reconciliation | Query test plus lower home median TTFB |
| TTFB remains dominant on chart result | Instrument read durations; parallelize the next independent pair or remove the measured duplicate only | Call-count/concurrency test plus lower chart median TTFB |
| CLS exceeds 0.1 | Reserve measured element dimensions in existing markup/CSS | CLS median <= 0.1 on three runs |

- [ ] If none of the evidence branches applies, stop optimization changes and report the measured blocker; do not invent a change solely to reach 15%.
- [ ] Commit a selected extra fix separately with the exact message tied to the chosen evidence branch: `perf: prioritize measured lcp image`, `perf: defer measured below-fold client chunk`, `perf: reduce home summary ttfb`, `perf: reduce chart result ttfb`, or `perf: reserve measured layout space`.
- [ ] Rerun full lint, full tests, build, smoke and the three-sample after measurement after any extra fix.

### 13.4 Rebuild and diagnose the Graphify map

- [ ] Rebuild from the project root with the same code-only settings as the baseline. A full rebuild is authoritative here because the refactor moves/deletes many symbols and before/after comparison must use identical extraction settings:

```powershell
& $Graphify extract . --code-only --out . --force
& $Graphify cluster-only . --no-label
& $Graphify diagnose multigraph --graph '.\graphify-out\graph.json' --json
& $Graphify god-nodes --graph '.\graphify-out\graph.json' --top 15 --json
```

- [ ] Confirm `graphify-out/graph.json`, `GRAPH_REPORT.md`, `graph.html` and the manifest were regenerated without semantic-token/API usage.

- [ ] Compare the final graph with `C:\tmp\tuvi-graphify-before-20260805\graph.json`: total nodes/edges/communities, top god nodes, facade node count, domain-module communities, dangling endpoints and directed/undirected collapse warnings.
- [ ] Treat remaining Graphify warnings as graph-quality diagnostics, not automatically as application bugs.
- [ ] Confirm `src/graphify-out/` was not created and Graphify artifacts remain untracked/uncommitted.

### 13.5 Final integrity review

- [ ] Run:

```powershell
git -c safe.directory=$SafeGit status --short --branch
git -c safe.directory=$SafeGit diff origin/master...HEAD --check
git -c safe.directory=$SafeGit log --oneline --decorate origin/master..HEAD
$ForbiddenMarkers = @('T' + 'BD', 'T' + 'ODO', 'implement ' + 'later', 'fill in ' + 'details', 'similar ' + 'to')
$MarkerHits = Select-String -LiteralPath 'docs/superpowers/plans/2026-08-05-data-modularization-user-performance.md' -Pattern $ForbiddenMarkers -CaseSensitive:$false
if ($MarkerHits) { $MarkerHits; throw 'Implementation plan contains a forbidden marker.' }
```

- [ ] The forbidden-marker scan must return no result. Existing unrelated product debt comments, if any, must not be silently edited.
- [ ] Verify no generated/runtime file is staged.
- [ ] Do not push or deploy. Hand off the local branch, exact test/build/browser evidence, performance before/after table, Graphify before/after summary, warnings and any unverified production state.

## Final Acceptance Checklist

- [ ] `src/lib/data.ts` is a small explicit compatibility facade and all pre-existing public exports/signatures still resolve.
- [ ] Domain modules have one-way dependencies and no import cycle back through the facade.
- [ ] Demo fallback uses one process-wide store and passes the same tests as database-backed behavior.
- [ ] Server Actions keep all auth/authz/ownership and observable redirect/revalidation contracts.
- [ ] Full lint, all Vitest tests and production build pass from fresh commands.
- [ ] Desktop and mobile browser smoke pass for home, chart creation and chart result/free overview.
- [ ] Mobile LCP/CLS/initial-JS gates pass; the primary already-good bottleneck improves at least 15% or a measured non-speculative blocker is reported.
- [ ] Graphify is updated from the project root, graph health is recorded, and no Graphify output is committed.
- [ ] No push or production deploy occurred.
