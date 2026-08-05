# P1A Article Cache Read Model Implementation Plan

> **Execution note:** Follow the P0-P2 roadmap sequentially and use TDD for every behavior change.

**Goal:** Remove the oversized public article-list cache while preserving article ordering, seed/DB precedence, deletion tombstones, canonical routing, category filtering, and related-article UX.

**Architecture:** Keep full `ArticleView` reads only for one article by slug and admin/CMS workflows. Introduce a cached `ArticleIndexEntry[]` read model containing only card, category, canonical, robots, and date fields. Route generation, sitemap, public hubs, pagination API, and related cards consume this index. Retain `listArticles()` as an uncached compatibility/CMS reader until P2 modular cleanup so no full-body result can be persisted under the shared public cache tag.

**Stack:** Next.js 16 App Router, React 19 server components, Prisma, TypeScript, Vitest.

---

## Task 1: Lock the lightweight read-model contract

**Files:**
- Modify: `src/lib/data/contracts.ts`
- Modify: `src/lib/article-summaries.test.ts`
- Modify: `src/lib/article-cache.test.ts`

1. Add failing tests proving the public index query selects no `content`, `faqs`, `seoChecklist`, or other full-body fields.
2. Assert seed/DB freshness and deletion behavior match the current public article list.
3. Assert the serialized seed index stays below a 512 KiB regression budget.
4. Assert the old full-list cache wrapper no longer exists and the index cache shares `ARTICLES_CACHE_TAG`.
5. Run the focused tests and confirm RED for missing `listArticleIndex`.

## Task 2: Implement and cache the article index

**Files:**
- Modify: `src/lib/data/contracts.ts`
- Modify: `src/lib/data/articles.ts`
- Modify: `src/lib/data.ts`
- Modify: `src/lib/data-module-boundaries.test.ts`

1. Add `ArticleIndexEntry` with card, category, canonical, robots, publication and update fields only.
2. Query Prisma with an explicit lightweight `select`, reconcile against seed articles, remove deletion tombstones, sort newest first, and return public entries.
3. Cache `listArticleIndex()` for 300 seconds under `ARTICLES_CACHE_TAG`.
4. Remove the cache wrapper around `listArticles()` while retaining the function for compatibility/admin tests.
5. Export the new function and type through the data facade.
6. Run focused data tests and confirm GREEN.

## Task 3: Migrate public consumers off the full corpus

**Files:**
- Modify: `src/app/[slug]/page.tsx`
- Modify: `src/app/xem-tu-vi-tron-doi/[slug]/page.tsx`
- Modify: `src/app/kien-thuc-tu-vi/[slug]/page.tsx`
- Modify: `src/app/kien-thuc-tu-vi/page.tsx`
- Modify: `src/app/api/knowledge-articles/route.ts`
- Modify: `src/app/sitemap.ts`
- Modify: `src/components/article-page-content.tsx`
- Modify: `src/lib/article-pagination.ts`
- Modify: route/component tests as needed

1. Add failing source/behavior assertions that all public list consumers call `listArticleIndex()` and no public route calls `listArticles()`.
2. Change static params, sitemap, public hubs, API pagination, and related-card inputs to use the index.
3. Narrow `ArticlePageContent` related-article props and pagination conversion to the index type.
4. Preserve parallel fetching of the one full article and the lightweight index.
5. Run focused route, article, sitemap, and component tests and confirm GREEN.

## Task 4: Verify the performance outcome

**Files:**
- Modify: tests only if a missing guard is discovered

1. Measure the serialized article index and compare it with the full seed corpus; record the byte reduction in the commit handoff.
2. Run `npm run lint`.
3. Run all Vitest tests.
4. Run `npm run build` with the repository's Node 24 runtime path first when required by the environment.
5. Confirm build output has no `Failed to set Next.js data cache` payload warning.
6. Run `git diff --check`, review exact scope, and commit P1A separately.

## Execution Result

- 163 seed articles serialize to 124,994 bytes in the lightweight index versus
  2,885,164 bytes in the full corpus, a 95.7% reduction.
- Lint passed; the full suite passed with 146 files and 782 tests.
- The production build generated 551 pages and did not emit the previous
  `Failed to set Next.js data cache` payload warning.
- The remaining build warnings are the known nested-worktree root inference and
  edge-runtime static-generation notices, neither caused by this read model.
