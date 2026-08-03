# Tử vi tài lộc & Đầu tư Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Biến placeholder “Tử vi tài lộc & Đầu tư” thành landing page indexable và tab miễn phí cá nhân hóa Tài–Quan–Di với biểu đồ 5 năm, bằng chứng lá số và hướng hành động có trách nhiệm.

**Architecture:** Logic thuần nằm trong `src/lib/wealth-fortune.ts`, nhận `TuViChart`, tái dùng `generateTuViChart` cho năm xem liên tiếp và trả về một report typed. Landing page và tab kết quả là Server Components; biểu đồ là SVG server-rendered có bảng dữ liệu thay thế. Server Action chỉ nhận một enum destination có allowlist, không nhận URL redirect tùy ý.

**Tech Stack:** Next.js 16 App Router, React 19 Server Components, TypeScript, Tailwind/CSS hiện có, Lucide, Vitest, JSON-LD, VPS/PM2.

## Global Constraints

- Không sửa quy tắc an sao, chart/date engine, payment gate, auth hoặc DB schema.
- Không thêm dependency hoặc LLM call mới.
- Kết quả cá nhân `/la-so/{id}` tiếp tục `noindex`; chỉ `/tu-vi-tai-loc-dau-tu` được index.
- Không đưa lệnh mua/bán, dự báo giá/lợi suất, tỷ lệ phân bổ bắt buộc hoặc cam kết phát tài.
- Điểm luôn nằm trong 35–92 và luôn được gọi là “chỉ số định hướng”.
- Mọi input từ form là không tin cậy; `chartExperience` chỉ nhận `default | wealth` qua allowlist.
- Mobile-first, body tối thiểu 16px, touch target chính khoảng 48px, semantic HTML và table fallback cho SVG.
- Dùng Node 24 bundled cho mọi lệnh Vitest/Next/ESLint.
- Giữ nguyên mọi URL trong `src/app/llms-protected-urls.json` và mọi thay đổi không liên quan ở checkout chính.

---

### Task 1: Wealth scoring domain

**Files:**
- Create: `src/lib/wealth-fortune.ts`
- Create: `src/lib/wealth-fortune.test.ts`

**Interfaces:**
- Consumes: `TuViChart`, `Palace`, `generateTuViChart` từ `@/lib/chart`.
- Produces: `buildWealthFortuneReport(chart: TuViChart): WealthFortuneReport`.
- Produces types: `WealthPillarKey`, `WealthPillar`, `WealthYearPoint`, `WealthPalaceEvidence`, `WealthFortuneReport`.

- [ ] **Step 1: Viết test RED cho cấu trúc và biên điểm**

```ts
const chart = generateTuViChart(FIXTURE_INPUT);
const report = buildWealthFortuneReport(chart);

expect(report.pillars.map((item) => item.key)).toEqual([
  "cashflow", "career", "mobility", "foundation",
]);
expect(report.overallScore).toBeGreaterThanOrEqual(35);
expect(report.overallScore).toBeLessThanOrEqual(92);
expect(report.pillars.every((item) => item.score >= 35 && item.score <= 92)).toBe(true);
```

- [ ] **Step 2: Chạy test và xác nhận fail vì module chưa tồn tại**

Run:

```powershell
& $NODE .\node_modules\vitest\vitest.mjs run src\lib\wealth-fortune.test.ts
```

Expected: FAIL với lỗi không resolve được `@/lib/wealth-fortune`.

- [ ] **Step 3: Cài đặt score tối thiểu**

```ts
export type WealthPillarKey = "cashflow" | "career" | "mobility" | "foundation";

const MIN_SCORE = 35;
const MAX_SCORE = 92;
const STATE_WEIGHT = { M: 8, V: 6, "Đ": 5, B: 1, H: -7 } as const;

function clampScore(value: number) {
  return Math.max(MIN_SCORE, Math.min(MAX_SCORE, Math.round(value)));
}

export function buildWealthFortuneReport(chart: TuViChart): WealthFortuneReport {
  const pillars = buildPillars(chart);
  const overallScore = weightedAverage(pillars, {
    cashflow: 0.35,
    career: 0.30,
    mobility: 0.20,
    foundation: 0.15,
  });
  return buildReport(chart, pillars, overallScore);
}
```

- [ ] **Step 4: Viết RED cho chuỗi 5 năm và tính quyết định**

```ts
expect(report.fiveYearTrend).toHaveLength(5);
expect(report.fiveYearTrend.map((point) => point.year)).toEqual([2026, 2027, 2028, 2029, 2030]);
expect(new Set(report.fiveYearTrend.map((point) => point.score)).size).toBeGreaterThan(1);
expect(report.strongestYear.score).toBe(Math.max(...report.fiveYearTrend.map((point) => point.score)));
expect(report.cautionYear.score).toBe(Math.min(...report.fiveYearTrend.map((point) => point.score)));
```

- [ ] **Step 5: Cài đặt 5 năm từ engine hiện có**

```ts
function buildFiveYearTrend(chart: TuViChart) {
  return Array.from({ length: 5 }, (_, offset) => {
    const year = chart.input.viewYear + offset;
    const yearlyChart = generateTuViChart({ ...chart.input, viewYear: year });
    return scoreYear(yearlyChart);
  });
}
```

`scoreYear` ghép 65% score cấu trúc với 35% lưu tinh Tài Bạch/Quan Lộc/Thiên Di để tạo biến thiên có giới hạn.

- [ ] **Step 6: Viết RED cho bằng chứng và copy an toàn**

```ts
expect(report.palaceEvidence.map((item) => item.palace)).toEqual(["Tài Bạch", "Quan Lộc", "Thiên Di"]);
expect(report.palaceEvidence.every((item) => item.mainStars.length > 0)).toBe(true);
expect(JSON.stringify(report)).not.toMatch(/chắc chắn|cam kết|phát tài|mua ngay|bán ngay/i);
expect(report.disclaimer).toContain("không thay thế tư vấn tài chính");
```

- [ ] **Step 7: Cài đặt evidence, posture và action plan**

Evidence phải gồm branch, chính tinh có trạng thái, sao hỗ trợ và sao cần lưu ý. `actionPlan` có đúng 3 bước: sửa trụ yếu, dùng trụ mạnh và đặt cổng kiểm chứng trước quyết định.

- [ ] **Step 8: Chạy test GREEN và full chart fixtures liên quan**

```powershell
& $NODE .\node_modules\vitest\vitest.mjs run src\lib\wealth-fortune.test.ts src\lib\chart.test.ts src\lib\chart.fixtures.test.ts
```

Expected: tất cả pass, không warning từ code mới.

- [ ] **Step 9: Commit**

```powershell
git add src/lib/wealth-fortune.ts src/lib/wealth-fortune.test.ts
git commit -m "feat: add deterministic wealth fortune model"
```

---

### Task 2: Accessible wealth report view

**Files:**
- Create: `src/components/wealth-fortune-view.tsx`
- Create: `src/components/wealth-fortune-view.test.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: `buildWealthFortuneReport(chart)` và props `{ chartId: string; chart: TuViChart }`.
- Produces: `WealthFortuneView` Server Component; không có `"use client"`.

- [ ] **Step 1: Viết test RED cho cấu trúc server-rendered**

```ts
expect(source).not.toContain('"use client"');
expect(source).toContain("buildWealthFortuneReport");
expect(source).toContain('role="img"');
expect(source).toContain("<table");
expect(source).toContain("Chỉ số định hướng");
expect(source).toContain("không thay thế tư vấn tài chính");
```

- [ ] **Step 2: Chạy test và xác nhận RED**

Expected: FAIL vì component chưa tồn tại.

- [ ] **Step 3: Cài đặt view và SVG 5 năm**

```tsx
export function WealthFortuneView({ chartId, chart }: WealthFortuneViewProps) {
  const report = buildWealthFortuneReport(chart);
  return (
    <section className="wealth-report" aria-labelledby="wealth-report-title">
      <header className="wealth-report-hero">
        <p className="eyebrow">Tử vi tài lộc & Đầu tư</p>
        <h1 id="wealth-report-title">Bản đồ Tài - Quan - Di của {chart.input.fullName}</h1>
        <p>{report.postureSummary}</p>
      </header>
      <div className="wealth-pillar-grid">
        {report.pillars.map((pillar) => (
          <article key={pillar.key}>
            <h2>{pillar.label}</h2>
            <strong>{pillar.score}/100</strong>
            <p>{pillar.summary}</p>
          </article>
        ))}
      </div>
      <WealthTrendFigure points={report.fiveYearTrend} />
      <div className="wealth-evidence-grid">
        {report.palaceEvidence.map((evidence) => (
          <article key={evidence.palace}>
            <h2>{evidence.palace}</h2>
            <p>{evidence.branch}</p>
            <p>{evidence.mainStars.join(", ")}</p>
          </article>
        ))}
      </div>
      <ol className="wealth-action-list">
        {report.actionPlan.map((step) => <li key={step.title}><strong>{step.title}</strong><p>{step.body}</p></li>)}
      </ol>
    </section>
  );
}
```

SVG dùng `viewBox="0 0 640 260"`, đường grid tĩnh, polyline tính từ 5 điểm và mỗi điểm có label chữ. Table có caption “Bảng chỉ số định hướng 5 năm”.

- [ ] **Step 4: Thêm CSS namespace `wealth-*`**

CSS phải có mobile mặc định, breakpoint 768px, `overflow-wrap`, không fixed width và `@media (prefers-reduced-motion: reduce)` không cần override vì component không chạy animation.

- [ ] **Step 5: GREEN + refactor**

Run targeted component test và `git diff --check`.

- [ ] **Step 6: Commit**

```powershell
git add src/components/wealth-fortune-view.tsx src/components/wealth-fortune-view.test.tsx src/app/globals.css
git commit -m "feat: render accessible five-year wealth report"
```

---

### Task 3: Free Tài lộc chart tab

**Files:**
- Modify: `src/components/fate-tabs.tsx`
- Modify: `src/app/la-so/[id]/page.tsx`
- Create: `src/components/fate-tabs.test.tsx` if no existing focused test can be extended.

**Interfaces:**
- `FateView` adds `"tai-loc"`.
- `FateTabs` adds prop `visibleViews: FateView[]`.
- Chart page renders `<WealthFortuneView chartId={id} chart={record.chart} />` when active.

- [ ] **Step 1: RED cho quyền hiển thị**

Assertions:

```ts
expect(tabsSource).toContain('"tai-loc"');
expect(tabsSource).toContain('label: "Tài lộc"');
expect(tabsSource).toContain("visibleViews.includes(tab.key)");
expect(chartPageSource).toContain('["la-so", "tai-loc"]');
expect(chartPageSource).toContain('activeView === "tai-loc"');
```

- [ ] **Step 2: Chạy RED**

Expected: FAIL do tab chưa có.

- [ ] **Step 3: Cài đặt tab miễn phí, giữ tab trả phí**

```ts
const visibleViews: FateView[] = canUsePaidFateViews
  ? ["la-so", "tai-loc", "luan-cung", "dai-van", "tieu-van", "nguyet-van", "nhat-van"]
  : ["la-so", "tai-loc"];
```

`isScopedReadingView` phải gồm `tai-loc` để không render chart/free overview bên dưới báo cáo. Tab bar luôn render với `visibleViews`.

- [ ] **Step 4: GREEN và regression**

Run focused tab/page tests và existing paid-reading UI tests.

- [ ] **Step 5: Commit**

```powershell
git add src/components/fate-tabs.tsx src/components/fate-tabs.test.tsx src/app/la-so/[id]/page.tsx
git commit -m "feat: add free wealth view to chart tabs"
```

---

### Task 4: Safe focused chart form destination

**Files:**
- Modify: `src/components/chart-form.tsx`
- Modify: `src/components/chart-form.test.ts`
- Modify: `src/app/actions.ts`
- Modify: `src/app/actions-create-chart.test.ts`

**Interfaces:**
- `ChartFormProps` adds `experience?: "default" | "wealth"`, `submitLabel?: string`, `defaultViewYear?: number`.
- Hidden field is `chartExperience`, never `redirectUrl`.
- Helper `safeChartExperience(value): "default" | "wealth"`.

- [ ] **Step 1: RED abuse-case test**

```ts
expect(actionsSource).toContain("function safeChartExperience");
expect(actionsSource).toContain('experience === "wealth"');
expect(actionsSource).not.toContain('formData.get("redirectUrl")');
expect(actionsSource).not.toContain('safeNextPath(formData.get("chartExperience")');
```

- [ ] **Step 2: RED UX test**

```ts
expect(chartFormSource).toContain('name="chartExperience"');
expect(chartFormSource).toContain("submitLabel");
expect(chartFormSource).toContain("defaultViewYear");
```

- [ ] **Step 3: Cài allowlist và paths cố định**

```ts
function safeChartExperience(value: FormDataEntryValue | null) {
  return value === "wealth" ? "wealth" : "default";
}

function chartCreationPaths(experience: "default" | "wealth", chartId?: string) {
  if (experience === "wealth") {
    return {
      error: "/tu-vi-tai-loc-dau-tu#lap-la-so-tai-loc",
      success: chartId ? `/la-so/${chartId}?view=tai-loc` : "/tu-vi-tai-loc-dau-tu",
    };
  }
  return { error: "/#lap-la-so", success: chartId ? `/la-so/${chartId}` : "/" };
}
```

- [ ] **Step 4: Giữ attribution, timeout, rate limit và early overview generation**

Chỉ thay base path của hai redirect trong `createChartAction`; không đổi validation hoặc lưu chart.

- [ ] **Step 5: GREEN + security regression**

Run four focused test files, then `npm audit --omit=dev` và ghi lại high/critical nếu có.

- [ ] **Step 6: Commit**

```powershell
git add src/components/chart-form.tsx src/components/chart-form.test.ts src/app/actions.ts src/app/actions-create-chart.test.ts
git commit -m "feat: route wealth chart submissions safely"
```

---

### Task 5: SEO/AEO landing page

**Files:**
- Create: `src/app/tu-vi-tai-loc-dau-tu/page.tsx`
- Create: `src/app/tu-vi-tai-loc-dau-tu/page.test.ts`
- Modify: `src/app/globals.css`

**Interfaces:**
- Static `metadata = routeMetadata({ title, description, path: "/tu-vi-tai-loc-dau-tu" })` canonical `/tu-vi-tai-loc-dau-tu`.
- Page accepts `searchParams: Promise<{ chartError?: string }>` chỉ để hiển thị lỗi allowlisted.
- Reuses `<ChartForm experience="wealth" submitLabel="Xem bản đồ tài lộc 5 năm" defaultViewYear={2026} />`.

- [ ] **Step 1: RED cho SEO và safety**

```ts
expect(source).toContain('path: "/tu-vi-tai-loc-dau-tu"');
expect(source).toContain('data-answer-block="true"');
expect(answerWordCount).toBeGreaterThanOrEqual(40);
expect(answerWordCount).toBeLessThanOrEqual(60);
expect(source).toContain("faqJsonLd");
expect(source).toContain("webApplicationJsonLd");
expect(source).toContain('experience="wealth"');
expect(source).toContain('role="alert"');
expect(source).toContain("không thay thế tư vấn tài chính");
expect(source).not.toMatch(/cam kết lợi nhuận|chắc chắn giàu|nên mua|nên bán/i);
```

- [ ] **Step 2: Cài metadata và schema khớp nội dung**

Title: `Tử vi tài lộc & đầu tư: Bản đồ Tài Quan Di`.

Description: `Lập lá số để đọc Tài Bạch, Quan Lộc, Thiên Di và biểu đồ định hướng 5 năm. Có bằng chứng cung sao, giới hạn rõ, không thay tư vấn tài chính.`

JSON-LD gồm `webPageJsonLd`, `webApplicationJsonLd`, `faqJsonLd`; FAQ JSON-LD dùng chính mảng `faqs` render trong `<details>`.

- [ ] **Step 3: Cài content people-first**

Các section bắt buộc: form trên fold, “Tài–Quan–Di đọc gì?”, phương pháp chấm, cách dùng biểu đồ, checklist 4 bước, giới hạn, FAQ, CTA cuối. Có ít nhất 6 internal links khác nhau.

- [ ] **Step 4: CSS landing page**

Namespace `wealth-landing-*`; dùng palette orange/gold/stone hiện tại, không dark-only/glass blur. Hai cột desktop, một cột mobile, table có wrapper responsive không làm body overflow.

- [ ] **Step 5: GREEN**

Run landing page test, metadata/AI discovery tests và `git diff --check`.

- [ ] **Step 6: Commit**

```powershell
git add src/app/tu-vi-tai-loc-dau-tu/page.tsx src/app/tu-vi-tai-loc-dau-tu/page.test.ts src/app/globals.css
git commit -m "feat: publish wealth fortune landing page"
```

---

### Task 6: Navigation and AI discovery surfaces

**Files:**
- Modify: `src/components/site-header.tsx`
- Modify: `src/components/site-header-effects.test.ts`
- Modify: `src/app/sitemap.ts`
- Modify: `public/llms.txt`
- Modify: `src/app/ai-discovery.test.ts`
- Modify: `src/lib/agent-resources.ts`
- Modify: `src/lib/agent-resources.test.ts`

**Interfaces:**
- Header placeholder gains `href: "/tu-vi-tai-loc-dau-tu"`.
- Sitemap gains one public tool URL with `lastModified: 2026-08-03`, weekly, priority `0.84`.
- Agent site resource gains one `primaryTopics` item.
- `llms.txt` gains one concise canonical entry; protected URL baseline remains length 148.

- [ ] **Step 1: RED discovery tests**

```ts
expect(headerSource).toContain('href: "/tu-vi-tai-loc-dau-tu"');
expect(sitemapSource).toContain('/tu-vi-tai-loc-dau-tu');
expect(llmsSource).toContain('https://lasotinhhoa.vn/tu-vi-tai-loc-dau-tu');
expect(buildAgentSiteResource().primaryTopics).toContainEqual({
  name: "Tử vi tài lộc & Đầu tư",
  url: `${APP_URL}/tu-vi-tai-loc-dau-tu`,
});
```

- [ ] **Step 2: Cài thay đổi additive**

Không xóa hoặc đổi link hiện có; không thêm personal chart URL vào discovery surfaces.

- [ ] **Step 3: GREEN + protected URLs**

Run header, AI discovery, agent resources tests. Xác nhận `protectedLlmsUrls.urls` vẫn có 148 phần tử và mọi URL còn nằm trong `public/llms.txt`.

- [ ] **Step 4: Commit**

```powershell
git add src/components/site-header.tsx src/components/site-header-effects.test.ts src/app/sitemap.ts public/llms.txt src/app/ai-discovery.test.ts src/lib/agent-resources.ts src/lib/agent-resources.test.ts
git commit -m "feat: expose wealth tool to search and AI agents"
```

---

### Task 7: Full verification and rendered QA

**Files:**
- Verify all changed files.
- Modify only files needed to fix failures caused by this feature.

**Interfaces:** None new.

- [ ] **Step 1: Targeted suite**

```powershell
& $NODE .\node_modules\vitest\vitest.mjs run src\lib\wealth-fortune.test.ts src\components\wealth-fortune-view.test.tsx src\components\fate-tabs.test.tsx src\components\chart-form.test.ts src\app\actions-create-chart.test.ts src\app\tu-vi-tai-loc-dau-tu\page.test.ts src\components\site-header-effects.test.ts src\app\ai-discovery.test.ts src\lib\agent-resources.test.ts
```

- [ ] **Step 2: Full lint, tests, build**

```powershell
& $NODE .\node_modules\eslint\bin\eslint.js
& $NODE .\node_modules\vitest\vitest.mjs run --maxWorkers=4 --reporter=dot
& $NODE .\node_modules\next\dist\bin\next build
```

- [ ] **Step 3: Local production server**

Start `next start -p 4000` from the successful build, hidden window if background process is required.

- [ ] **Step 4: Browser QA desktop và mobile**

Verify:

- `/tu-vi-tai-loc-dau-tu` at 1440px and 390px/375px.
- H1, answer block, form, FAQ, internal links, no horizontal overflow.
- Submit a safe test chart and confirm destination contains `?view=tai-loc`.
- Tab “Tài lộc” active, 4 pillars, 5 SVG points, table with 5 rows, evidence and disclaimer.
- Keyboard focus visible, touch targets at least 44–48px, console has no error.
- DOM has one canonical and valid JSON-LD scripts; `/la-so/{id}` remains `noindex`.

- [ ] **Step 5: Local SEO smoke**

Check `sitemap.xml`, `llms.txt`, `/agent/site.json` and rendered page HTML for the new canonical URL.

- [ ] **Step 6: Requirements audit**

Re-read the design spec and mark every scope item as implemented or record an exact gap. Run `git diff --check`, `git status --short` and secret scan on staged diff.

---

### Task 8: Rebase, release and production proof

**Files:**
- No new product files unless resolving scoped conflicts or live-only defects.

**Interfaces:** Production branch `master`, VPS process `lasotinhhoa`, public URL `https://lasotinhhoa.vn`.

- [ ] **Step 1: Fetch and rebase**

```powershell
git fetch origin
git rebase origin/master
```

Resolve only scoped conflicts, then rerun targeted tests, full tests, lint and build if rebase changed product code.

- [ ] **Step 2: Final scoped commit state**

Confirm branch contains only design/plan and feature commits; checkout chính vẫn giữ nguyên dirty files.

- [ ] **Step 3: Push and guarded release**

Use repo-native `npm run ship -- "Hoàn thiện Tử vi tài lộc và Đầu tư"` with Node 24/npm-cli invocation required by the Windows environment.

- [ ] **Step 4: Production verification**

Confirm:

- `origin/master` SHA equals `/opt/lasotinhhoa/current/.release-commit`.
- PM2 `lasotinhhoa` is online and cwd/script points to the exact new directory printed by `npm run ship` under `/opt/lasotinhhoa/releases/`.
- HTTP 200: `/`, `/tu-vi-tai-loc-dau-tu`, `/xem-tu-vi-tron-doi`, `/kien-thuc-tu-vi`, `/sitemap.xml`, `/llms.txt`, `/agent/site.json`.
- New URL is present in live sitemap, live `llms.txt` and live agent JSON.
- Live desktop/mobile page has canonical, H1, JSON-LD and the header/menu link.
- Live form creates a chart and lands on `?view=tai-loc`; the report renders 5 years without console error.

- [ ] **Step 5: Report exact evidence**

Report commit SHA, release path, PM2 state, test counts, build page count, browser viewports, live endpoints, security/audit findings and any unverified external analytics. Mark the goal complete only after all required proof passes.
