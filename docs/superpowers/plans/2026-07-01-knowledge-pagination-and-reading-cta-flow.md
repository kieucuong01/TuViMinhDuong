# Knowledge Pagination and Reading CTA Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace desktop knowledge cards without a page reload and keep free-reading users in context through login and premium unlock confirmation.

**Architecture:** Extend the existing client article list to fetch replacement pages from the current API while retaining mobile append behavior and link fallback. Add one reusable reading-detail CTA plus deterministic premium target helpers, then point every locked CTA at the existing `PremiumReadingCta` popover so `requestReadingAction` remains the only coin-deduction entrypoint.

**Tech Stack:** Next.js 16 App Router, React 19 client components, native History and Popover APIs, Vitest 4, TypeScript, CSS.

---

### Task 1: Client-only desktop knowledge pagination

**Files:**
- Modify: `src/components/knowledge-article-list.test.ts`
- Modify: `src/components/knowledge-article-list.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Write the failing pagination contract test**

Add this test to `src/components/knowledge-article-list.test.ts`:

```ts
it("replaces desktop cards, updates history, and returns focus to the list", () => {
  const componentSource = readFileSync(fileURLToPath(componentUrl), "utf8");

  expect(componentSource).toContain('mode: "replace" | "append"');
  expect(componentSource).toContain("window.history.pushState");
  expect(componentSource).toContain('window.addEventListener("popstate"');
  expect(componentSource).toContain("scrollKnowledgeListIntoView");
  expect(componentSource).toContain('aria-busy={isLoading}');
  expect(componentSource).toContain('className="knowledge-article-region"');
  expect(globalsCss).toContain(".knowledge-article-region");
  expect(globalsCss).toContain("scroll-margin-top:");
});
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run:

```powershell
$env:PATH="C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;$env:PATH"
npm test -- src/components/knowledge-article-list.test.ts
```

Expected: FAIL because the replacement mode, History API, region, and scroll helper are not present.

- [ ] **Step 3: Implement page replacement and history navigation**

In `src/components/knowledge-article-list.tsx`:

1. Import `type MouseEvent as ReactMouseEvent`.
2. Add state for `currentPage` and `currentTotalPages`.
3. Add a `regionRef`.
4. Replace the current one-purpose `loadMore` implementation with the following shape:

```tsx
const [currentPage, setCurrentPage] = useState(page);
const [currentTotalPages, setCurrentTotalPages] = useState(totalPages);
const regionRef = useRef<HTMLElement>(null);

const scrollKnowledgeListIntoView = useCallback(() => {
  const region = regionRef.current;
  if (!region) return;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  region.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  region.focus({ preventScroll: true });
}, []);

const loadPage = useCallback(
  async (targetPage: number, mode: "replace" | "append", updateHistory = false) => {
    if (isLoading) return;
    setIsLoading(true);
    setLoadError(false);

    try {
      const params = new URLSearchParams({
        page: String(targetPage),
        pageSize: String(pageSize),
      });
      if (category) params.set("category", category);
      const response = await fetch(`/api/knowledge-articles?${params.toString()}`, {
        headers: { accept: "application/json" },
      });
      if (!response.ok) throw new Error("Không thể tải bài viết.");
      const payload = (await response.json()) as KnowledgeArticlesResponse;

      if (mode === "replace") {
        setArticles(payload.items);
        setCurrentPage(payload.page);
        setNextPage(payload.page + 1);
        setCurrentTotalPages(payload.totalPages);
        setHasMore(payload.page < payload.totalPages);
        if (updateHistory) {
          window.history.pushState(
            { knowledgePage: payload.page },
            "",
            buildKnowledgePageHref(payload.page, category),
          );
        }
        requestAnimationFrame(scrollKnowledgeListIntoView);
      } else {
        setArticles((current) => {
          const existingSlugs = new Set(current.map((article) => article.slug));
          return [...current, ...payload.items.filter((article) => !existingSlugs.has(article.slug))];
        });
        setNextPage(payload.page + 1);
        setCurrentTotalPages(payload.totalPages);
        setHasMore(payload.page < payload.totalPages);
      }
    } catch {
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  },
  [category, isLoading, pageSize, scrollKnowledgeListIntoView],
);

const loadMore = useCallback(
  () => loadPage(nextPage, "append"),
  [loadPage, nextPage],
);

function handleDesktopPageClick(event: ReactMouseEvent<HTMLAnchorElement>, targetPage: number) {
  if (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    isLoading ||
    targetPage === currentPage
  ) {
    return;
  }
  event.preventDefault();
  void loadPage(targetPage, "replace", true);
}
```

Add Back/Forward restoration:

```tsx
useEffect(() => {
  function restoreHistoryPage() {
    const params = new URLSearchParams(window.location.search);
    const requestedPage = Math.max(1, Number(params.get("page") || 1) || 1);
    if (requestedPage !== currentPage) {
      void loadPage(requestedPage, "replace");
    }
  }

  window.addEventListener("popstate", restoreHistoryPage);
  return () => window.removeEventListener("popstate", restoreHistoryPage);
}, [currentPage, loadPage]);
```

Wrap the grid, pagination, and mobile status in:

```tsx
<section
  ref={regionRef}
  className="knowledge-article-region"
  tabIndex={-1}
  aria-busy={isLoading}
  aria-label="Danh sách bài viết"
>
  {/* existing grid, desktop pagination, and mobile load-more content */}
</section>
```

Use `currentPage` and `currentTotalPages` in the pagination labels and href calculations. Add `onClick={(event) => handleDesktopPageClick(event, currentPage - 1)}` and the equivalent next-page handler. Render `Đang tải trang bài viết...` in an `aria-live="polite"` status while desktop replacement is pending.

- [ ] **Step 4: Add fixed-header scroll offset**

Add to `src/app/globals.css`:

```css
.knowledge-article-region {
  scroll-margin-top: 6.5rem;
  outline: none;
}
```

- [ ] **Step 5: Run the focused test and confirm GREEN**

Run:

```powershell
npm test -- src/components/knowledge-article-list.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit the pagination slice**

```powershell
git add src/components/knowledge-article-list.tsx src/components/knowledge-article-list.test.ts src/app/globals.css
git commit -m "feat: paginate knowledge articles without reload"
```

### Task 2: Preserve the reading destination through login

**Files:**
- Create: `src/components/premium-reading-target.ts`
- Create: `src/components/reading-detail-cta.tsx`
- Create: `src/components/reading-detail-cta.test.ts`
- Modify: `src/components/free-overview-loader.tsx`
- Modify: `src/app/la-so/[id]/page.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Write the failing reading-flow tests**

Create `src/components/reading-detail-cta.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loginModalHref } from "@/components/login-modal-link";

const ctaSource = readFileSync(fileURLToPath(new URL("./reading-detail-cta.tsx", import.meta.url)), "utf8");
const loaderSource = readFileSync(fileURLToPath(new URL("./free-overview-loader.tsx", import.meta.url)), "utf8");
const chartPageSource = readFileSync(fileURLToPath(new URL("../app/la-so/[id]/page.tsx", import.meta.url)), "utf8");

describe("reading detail CTA flow", () => {
  it("keeps the premium anchor in the modal login return URL", () => {
    const next = "/la-so/chart-1#mo-khoa-ho-so-vip";
    const href = loginModalHref("/la-so/chart-1", undefined, next);
    const params = new URL(href, "https://example.test").searchParams;

    expect(params.get("login")).toBe("1");
    expect(params.get("next")).toBe(next);
  });

  it("scrolls signed-in readers and restores the anchor after login", () => {
    expect(ctaSource).toContain("scrollToPremiumReading");
    expect(ctaSource).toContain("ReadingHashScrollRestorer");
    expect(ctaSource).toContain("window.location.hash");
    expect(ctaSource).toContain("loginModalHref");
    expect(loaderSource).toContain("<ReadingDetailCta");
    expect(chartPageSource).toContain("<ReadingHashScrollRestorer");
  });
});
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run:

```powershell
npm test -- src/components/reading-detail-cta.test.ts
```

Expected: FAIL because `reading-detail-cta.tsx` does not exist.

- [ ] **Step 3: Create the reusable CTA and one-time hash restorer**

Create `src/components/premium-reading-target.ts`:

```ts
export const PREMIUM_READING_TARGET_ID = "mo-khoa-ho-so-vip";
export const PREMIUM_READING_HASH = `#${PREMIUM_READING_TARGET_ID}`;

export function premiumReadingModalId(chartId: string) {
  return `premium-confirm-${chartId}`;
}
```

Create `src/components/reading-detail-cta.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useEffect } from "react";
import { loginModalHref } from "@/components/login-modal-link";
import { PREMIUM_READING_HASH, PREMIUM_READING_TARGET_ID } from "@/components/premium-reading-target";

function preferredScrollBehavior(): ScrollBehavior {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
}

export function scrollToPremiumReading() {
  document.getElementById(PREMIUM_READING_TARGET_ID)?.scrollIntoView({
    behavior: preferredScrollBehavior(),
    block: "start",
  });
}

export function ReadingHashScrollRestorer() {
  useEffect(() => {
    if (window.location.hash !== PREMIUM_READING_HASH) return;
    requestAnimationFrame(scrollToPremiumReading);
  }, []);

  return null;
}

export function ReadingDetailCta({
  chartId,
  isSignedIn,
  children,
}: {
  chartId: string;
  isSignedIn: boolean;
  children: React.ReactNode;
}) {
  const chartPath = `/la-so/${chartId}`;
  const nextPath = `${chartPath}${PREMIUM_READING_HASH}`;

  if (!isSignedIn) {
    return (
      <Link className="btn btn-small btn-primary" href={loginModalHref(chartPath, undefined, nextPath)} scroll={false}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className="btn btn-small btn-primary" onClick={scrollToPremiumReading}>
      {children}
    </button>
  );
}
```

- [ ] **Step 4: Use the reusable CTA in the free overview**

In `src/components/free-overview-loader.tsx`:

- Remove the unused `Link` import.
- Import `ReadingDetailCta`.
- Remove `loginHref` and `detailHref`.
- Keep `detailCta`.
- Replace both detail links with:

```tsx
<ReadingDetailCta chartId={chartId} isSignedIn={isSignedIn}>
  {detailCta}
</ReadingDetailCta>
```

- [ ] **Step 5: Mount the hash restorer once and add scroll offset**

In `src/app/la-so/[id]/page.tsx`, import `ReadingHashScrollRestorer` and render it once inside `<main>`:

```tsx
<ReadingHashScrollRestorer />
```

In `src/app/globals.css`, add:

```css
#mo-khoa-ho-so-vip {
  scroll-margin-top: 7rem;
}
```

- [ ] **Step 6: Run reading-flow tests and confirm GREEN**

Run:

```powershell
npm test -- src/components/reading-detail-cta.test.ts src/components/free-overview-loader.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit the reading-login slice**

```powershell
git add src/components/premium-reading-target.ts src/components/reading-detail-cta.tsx src/components/reading-detail-cta.test.ts src/components/free-overview-loader.tsx src/app/la-so/[id]/page.tsx src/app/globals.css
git commit -m "fix: preserve reading flow through login"
```

### Task 3: Reuse the existing premium confirmation popover

**Files:**
- Modify: `src/components/premium-reading-target.ts`
- Modify: `src/components/premium-reading-cta.tsx`
- Modify: `src/components/personalized-report-outline.tsx`
- Modify: `src/components/personalized-report-outline.test.ts`
- Modify: `src/components/assistant-widget.tsx`
- Modify: `src/components/assistant-access-ui.test.ts`

- [ ] **Step 1: Write failing popover-reuse assertions**

Update the locked-state assertion in `src/components/personalized-report-outline.test.ts`:

```ts
expect(html).toContain('popovertarget="premium-confirm-chart-1"');
expect(html).not.toContain('href="#mo-khoa-ho-so-vip"');
```

Add to `src/components/assistant-access-ui.test.ts`:

```ts
expect(widgetSource).toContain("premiumReadingModalId(chartId)");
expect(widgetSource).toContain(".showPopover()");
expect(widgetSource).not.toContain('href="#mo-khoa-ho-so-vip"');
```

Create a source assertion in `src/components/reading-detail-cta.test.ts`:

```ts
const premiumSource = readFileSync(fileURLToPath(new URL("./premium-reading-cta.tsx", import.meta.url)), "utf8");
expect(premiumSource).toContain("premiumReadingModalId(props.chartId)");
expect(premiumSource.match(/action=\{requestReadingAction\}/g)).toHaveLength(1);
```

- [ ] **Step 2: Run the focused tests and confirm RED**

Run:

```powershell
npm test -- src/components/personalized-report-outline.test.ts src/components/assistant-access-ui.test.ts src/components/reading-detail-cta.test.ts
```

Expected: FAIL because locked CTAs are still anchors and the shared ID helper does not exist.

- [ ] **Step 3: Reuse the deterministic target helper in the premium CTA**

In `src/components/premium-reading-cta.tsx`, import `premiumReadingModalId` from the helper created in Task 2 and replace:

```ts
const modalId = `premium-confirm-${props.chartId}`;
```

with:

```ts
const modalId = premiumReadingModalId(props.chartId);
```

- [ ] **Step 4: Make the report-outline CTA open the existing popover**

In `src/components/personalized-report-outline.tsx`, import `premiumReadingModalId`, remove the locked-state `Link`, and render:

```tsx
<button
  type="button"
  className="btn btn-primary personal-report-outline-cta"
  popoverTarget={premiumReadingModalId(chartId)}
>
  Mở hồ sơ đầy đủ — {priceCoins} xu
</button>
```

The unlocked-state `Link href="#luan-giai"` remains unchanged.

- [ ] **Step 5: Make the assistant CTA open the same popover before closing**

In `src/components/assistant-widget.tsx`, import `premiumReadingModalId`. Replace the full-required anchor with:

```tsx
<button
  type="button"
  className="btn btn-primary w-full"
  onClick={() => {
    const modal = document.getElementById(premiumReadingModalId(chartId));
    if (modal instanceof HTMLElement && typeof modal.showPopover === "function") {
      modal.showPopover();
    }
    setOpen(false);
  }}
>
  Mở Hồ sơ VIP
</button>
```

This explicitly opens the existing popover before the assistant panel unmounts its trigger.

- [ ] **Step 6: Use the shared target ID on the chart page**

In `src/app/la-so/[id]/page.tsx`, import `PREMIUM_READING_TARGET_ID` and replace the literal wrapper ID:

```tsx
<div id={PREMIUM_READING_TARGET_ID}>
```

- [ ] **Step 7: Run focused tests and confirm GREEN**

Run:

```powershell
npm test -- src/components/personalized-report-outline.test.ts src/components/assistant-access-ui.test.ts src/components/reading-detail-cta.test.ts src/components/free-overview-loader.test.ts
```

Expected: PASS. The source contains only one `requestReadingAction` form and every locked CTA resolves to its popover.

- [ ] **Step 8: Commit the unlock-trigger slice**

```powershell
git add src/components/premium-reading-target.ts src/components/premium-reading-cta.tsx src/components/personalized-report-outline.tsx src/components/personalized-report-outline.test.ts src/components/assistant-widget.tsx src/components/assistant-access-ui.test.ts src/components/reading-detail-cta.tsx src/components/reading-detail-cta.test.ts src/app/la-so/[id]/page.tsx
git commit -m "fix: reuse premium reading confirmation"
```

### Task 4: Full verification and browser UX check

**Files:**
- Modify only if verification exposes a defect in the files listed above.

- [ ] **Step 1: Run formatting and static checks**

Run:

```powershell
git diff --check
npm run lint
```

Expected: both commands exit `0`.

- [ ] **Step 2: Run all tests**

Run:

```powershell
npm test
```

Expected: all Vitest files and tests pass.

- [ ] **Step 3: Run the production build**

Run:

```powershell
npm run build
```

Expected: Next.js build exits `0` under Node `>=20.9.0`.

- [ ] **Step 4: Start the local app on port 4000**

Run:

```powershell
npx next dev --webpack -p 4000
```

Expected: app becomes available at `http://localhost:4000`.

- [ ] **Step 5: Verify desktop pagination**

At desktop width:

1. Open `http://localhost:4000/kien-thuc-tu-vi`.
2. Record a card title and the current document navigation entry.
3. Press “Trang sau”.
4. Confirm exactly the next six cards replace the old cards.
5. Confirm the URL contains `?page=2`.
6. Confirm the viewport is at the article-list start.
7. Confirm the page shell, category navigation, and CTA band did not disappear or flash as a full reload.
8. Use browser Back and confirm page-one cards return without a document reload.

- [ ] **Step 6: Verify reading and unlock flows**

With a safe test chart:

1. As guest, press “Đăng nhập để xem chi tiết”.
2. Confirm the in-page login modal opens.
3. Log in with a safe test account.
4. Confirm the chart page returns at `#mo-khoa-ho-so-vip`.
5. As signed in, press “Xem luận giải chi tiết” and confirm smooth in-page scrolling.
6. Press “Mở hồ sơ đầy đủ” and “Mở Hồ sơ VIP” separately.
7. Confirm both open the existing “Xác nhận mở khóa” form.
8. Close the form and confirm no coin balance changed.
9. Do not submit the confirmation unless a deliberately safe coin-deduction test account is available.

- [ ] **Step 7: Review final diff and commit any verification-only fixes**

Run:

```powershell
git status --short
git diff --stat
git diff --check
```

Expected: only task-related files are changed, and no `.env`, `.next`, logs, or unrelated user files are staged.
