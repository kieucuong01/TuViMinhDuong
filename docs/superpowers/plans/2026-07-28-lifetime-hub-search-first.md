# Lifetime Hub Search-First Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/xem-tu-vi-tron-doi` search-first, honest about content coverage, compact on mobile, URL-persistent, and accessible without changing astrology or payment logic.

**Architecture:** Keep `page.tsx` as the server-rendered content/SEO surface and wrap the URL-aware `LifetimeCardList` client island in `Suspense`. Move pure filtering, URL, and pagination behavior into `lifetime-card-list.logic.ts` so it can be tested without a browser or Next.js runtime.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Vitest, in-app Browser QA, VPS/PM2 deployment through `npm run ship`.

## Global Constraints

- Do not change chart calculation, article content, pricing, authentication, coins, PayOS, or paid-reading gates.
- Do not add dependencies, APIs, database queries, analytics, or missing lifetime articles.
- Keep Vietnamese copy clear for adults 30-60 and remove internal crawler/route wording.
- Preserve server-rendered article links and existing canonical detail URLs.
- Use the bundled Node runtime for test, lint, and build verification.
- Deploy only after focused tests, full tests, lint, build, and rendered QA pass.

---

### Task 1: Pure Lifetime Search Logic

**Files:**
- Create: `src/app/xem-tu-vi-tron-doi/lifetime-card-list.logic.ts`
- Create: `src/app/xem-tu-vi-tron-doi/lifetime-card-list.logic.test.ts`

**Interfaces:**
- Consumes: card-like values with `title`, `year`, `canChi`, and `gender`.
- Produces: `normalizeLifetimeFilter`, `filterLifetimeCards`, `parseLifetimePage`, `buildLifetimeSearchUrl`, `getLifetimePaginationTokens`, and `LifetimePaginationToken`.

- [ ] **Step 1: Write failing tests for accent-insensitive filtering**

```ts
expect(filterLifetimeCards(cards, "at hoi 1995 nu")).toEqual([cards[1]]);
expect(filterLifetimeCards(cards, "1992")).toEqual([]);
```

- [ ] **Step 2: Write failing tests for URL state**

```ts
expect(buildLifetimeSearchUrl("/xem-tu-vi-tron-doi", new URLSearchParams(), "1995 nữ", 1))
  .toBe("/xem-tu-vi-tron-doi?q=1995+n%E1%BB%AF#tim-tuoi");
expect(parseLifetimePage("999", 14)).toBe(14);
```

- [ ] **Step 3: Write failing tests for compact pagination**

```ts
expect(getLifetimePaginationTokens(1, 14)).toEqual([1, 2, 3, "ellipsis-end", 14]);
expect(getLifetimePaginationTokens(7, 14)).toEqual([1, "ellipsis-start", 6, 7, 8, "ellipsis-end", 14]);
expect(getLifetimePaginationTokens(14, 14)).toEqual([1, "ellipsis-start", 12, 13, 14]);
```

- [ ] **Step 4: Run the focused logic test and confirm RED**

Run:

```powershell
& "C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" .\node_modules\vitest\vitest.mjs run src/app/xem-tu-vi-tron-doi/lifetime-card-list.logic.test.ts
```

Expected: FAIL because `lifetime-card-list.logic.ts` does not exist.

- [ ] **Step 5: Implement the minimal pure functions**

Implement accent folding, trimmed filtering, numeric page clamping, query/page URL serialization with `#tim-tuoi`, and the pagination-token algorithm proven by the tests.

- [ ] **Step 6: Re-run the logic test and confirm GREEN**

Run the Step 4 command. Expected: all logic tests pass.

### Task 2: Search-First Page and Accessible Client Island

**Files:**
- Modify: `src/app/xem-tu-vi-tron-doi/page.tsx`
- Modify: `src/app/xem-tu-vi-tron-doi/lifetime-card-list.tsx`
- Modify: `src/app/lifetime-tuvi-page.test.ts`

**Interfaces:**
- Consumes: the Task 1 helpers and the existing `LifetimeCardListItem` card data.
- Produces: `LifetimeCardList({ cards, itemsPerPage, chartHref })`, rendered under `<Suspense>`.

- [ ] **Step 1: Add failing source-contract tests**

Assert all of the following:

```ts
expect(pageSource.indexOf("<LifetimeCardList")).toBeLessThan(pageSource.indexOf("lifetime-suggested-heading"));
expect(pageSource).toContain('href="#tim-tuoi"');
expect(pageSource).toContain("<Suspense");
expect(pageSource).toContain("Gợi ý xem nhanh");
expect(pageSource).not.toContain("Tín hiệu người đọc");
expect(pageSource).not.toContain("Google và AI crawler");
expect(cardListSource).toContain('aria-live="polite"');
expect(cardListSource).toContain("window.history.replaceState");
expect(cardListSource).toContain("window.history.pushState");
expect(cardListSource).toContain("Chưa có bài trọn đời phù hợp");
expect(cardListSource).toContain("<details");
expect(cardListSource).not.toContain("Anh thử nhập");
```

- [ ] **Step 2: Run the route test and confirm RED**

Run:

```powershell
& "C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" .\node_modules\vitest\vitest.mjs run src/app/lifetime-tuvi-page.test.ts
```

Expected: FAIL on the new search-first and copy assertions.

- [ ] **Step 3: Refactor the client component**

Implement:

- `usePathname` and `useSearchParams` as the URL source of truth;
- replace history for query typing and push history for pagination;
- no scroll jump while typing;
- compact pagination tokens;
- `role="status"` plus `aria-live="polite"`;
- coverage-aware zero result with clear-search and chart CTAs;
- visible overview plus collapsed secondary reading sections.

- [ ] **Step 4: Reorder and rewrite the server page**

Implement:

- hero CTA to `#tim-tuoi`;
- search/results before suggestions and directory;
- `Suspense` fallback around `LifetimeCardList`;
- “Gợi ý xem nhanh” copy without analytics claims;
- reader-facing directory copy;
- all decade groups collapsed initially.

- [ ] **Step 5: Re-run focused route and logic tests**

Run:

```powershell
& "C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" .\node_modules\vitest\vitest.mjs run src/app/lifetime-tuvi-page.test.ts src/app/xem-tu-vi-tron-doi/lifetime-card-list.logic.test.ts src/lib/lifetime-tuvi-articles.test.ts
```

Expected: all focused tests pass.

### Task 3: Verification, Release, and Production Proof

**Files:**
- Modify only if verification reveals a defect in Task 1 or Task 2 files.

**Interfaces:**
- Consumes: completed search-first implementation.
- Produces: verified commit on `master` and a deployed PM2 release.

- [ ] **Step 1: Run repository verification**

```powershell
git diff --check
& "C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" .\node_modules\eslint\bin\eslint.js
& "C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" .\node_modules\vitest\vitest.mjs run
$env:PATH="C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;$env:PATH"
& "C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" .\node_modules\next\dist\bin\next build
```

Expected: zero lint errors, zero test failures, build exit 0.

- [ ] **Step 2: Run local rendered QA on port 4000**

Verify desktop plus 375px mobile:

- CTA lands on visible search controls.
- `1995 nữ` returns one correct card and writes `q` to the URL.
- `1992` shows the honest no-result state and chart CTA.
- pagination uses compact tokens and writes `page`.
- reload preserves query/page.
- no console error, framework overlay, horizontal overflow, or sub-44px primary touch target.

- [ ] **Step 3: Commit the implementation**

Stage only:

```text
docs/superpowers/plans/2026-07-28-lifetime-hub-search-first.md
src/app/lifetime-tuvi-page.test.ts
src/app/xem-tu-vi-tron-doi/lifetime-card-list.logic.ts
src/app/xem-tu-vi-tron-doi/lifetime-card-list.logic.test.ts
src/app/xem-tu-vi-tron-doi/lifetime-card-list.tsx
src/app/xem-tu-vi-tron-doi/page.tsx
```

Commit message:

```text
Improve lifetime hub search UX
```

- [ ] **Step 4: Push the feature commit to `origin/master` and deploy**

Use the documented production path:

```powershell
npm run ship -- "Improve lifetime hub search UX"
```

Expected: commit/push if required, clean release build on VPS, PM2 switched to the new release, and public checks pass.

- [ ] **Step 5: Verify public production**

Confirm:

- `origin/master` equals the deployed commit;
- VPS source/current release and PM2 point to that commit;
- `https://lasotinhhoa.vn/xem-tu-vi-tron-doi` returns 200;
- public desktop/mobile behavior matches the local QA checks;
- public console has no relevant error.
