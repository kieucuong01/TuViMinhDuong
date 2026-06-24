# Knowledge Pagination Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show six knowledge articles per desktop page, append the next six automatically on mobile, and move the repaired CTA band below the article listing.

**Architecture:** Keep category filtering and desktop pagination in the server page through `searchParams`. Render the initial six cards on the server, then let a focused client component request additional six-item JSON pages through an internal route when its mobile sentinel intersects. Shared pagination helpers keep page normalization and slicing deterministic.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, CSS, Vitest.

---

### Task 1: Pagination behavior

**Files:**
- Create: `src/lib/article-pagination.ts`
- Test: `src/lib/article-pagination.test.ts`

- [ ] Write tests for invalid page normalization, six-item slicing, total pages, and category filtering.
- [ ] Run the focused test and confirm it fails because the helper does not exist.
- [ ] Implement the smallest pure helper that passes the tests.
- [ ] Run the focused test again and confirm it passes.

### Task 2: Responsive article list

**Files:**
- Create: `src/components/knowledge-article-list.tsx`
- Create: `src/components/knowledge-article-list.test.ts`
- Create: `src/app/api/knowledge-articles/route.ts`
- Modify: `src/app/kien-thuc-tu-vi/page.tsx`

- [ ] Write source-contract tests for six-item pagination, `IntersectionObserver`, the internal endpoint, category-preserving links, and CTA placement after the list.
- [ ] Run the focused tests and confirm they fail for the missing implementation.
- [ ] Add the API route and responsive client list.
- [ ] Update the server page to pass only the first requested page and move the CTA below the list.
- [ ] Run the focused tests and confirm they pass.

### Task 3: Mobile CSS and verification

**Files:**
- Modify: `src/app/globals.css`

- [ ] Add desktop pagination styles and hide infinite-scroll status on desktop.
- [ ] Add mobile one-column CTA, full-width safe actions, and hide desktop pagination below the desktop breakpoint.
- [ ] Run focused tests, lint, and build.
- [ ] Verify `/kien-thuc-tu-vi` at desktop and mobile widths, including page navigation and automatic mobile append.
