# P0 Checkout Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore a syntactically valid, testable lifetime-content change set and isolate it from unrelated audit artifacts so later P1 work starts from a trustworthy baseline.

**Architecture:** Treat the current lifetime tests and cover refresh as one bounded P0 unit. Repair the incorrect route assertion at the contract boundary, retain the existing article generator, validate the raster covers against the repository asset rules, and stage only the reviewed lifetime/test files.

**Tech Stack:** TypeScript, Vitest, Node 24, static SVG/WebP assets, Git.

## Global Constraints

- Preserve current public lifetime URLs, canonicals, article data, and chart/payment behavior.
- Do not modify `src/lib/lifetime-age-data.ts` unless a focused test proves its existing route contract is wrong.
- Do not stage `.codex/skills/graphify/`, `graphify-out/`, or `src/graphify-out/`.
- Use Node 24 for every Vitest, lint, and build child process.
- Do not delete the four untracked SVG files; either validate and stage them as part of the cover source set or leave them untouched and report them separately.

---

### Task 1: Repair The Lifetime Test Contract

**Files:**
- Modify: `src/lib/lifetime-tuvi-articles.test.ts:62-78`
- Test: `src/lib/lifetime-tuvi-articles.test.ts`

**Interfaces:**
- Consumes: `HistoricalLifetimeArticleInput.siblingLink.href` from `buildArticle()` in `src/lib/lifetime-age-data.ts`.
- Produces: a regression assertion that every sibling link uses `/xem-tu-vi-tron-doi/<sibling-slug>`.

- [ ] **Step 1: Record RED from the current checkout**

Run:

```powershell
$env:PATH="C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;$env:PATH"
& "C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" .\node_modules\vitest\vitest.mjs run src/lib/lifetime-tuvi-articles.test.ts
```

Expected: parser failure caused by the unmatched `});` after the adult-expansion test.

- [ ] **Step 2: Remove the unmatched close and correct the expected sibling route**

Keep one closing `});` for the test and use this assertion body:

```ts
expect(
  adultExpansionLifetimeAgeArticleInputs.every((input) => {
    const siblingSlug = input.slug.endsWith("nam-mang")
      ? input.slug.replace("nam-mang", "nu-mang")
      : input.slug.replace("nu-mang", "nam-mang");
    return input.siblingLink?.href === `/xem-tu-vi-tron-doi/${siblingSlug}`;
  }),
).toBe(true);
```

- [ ] **Step 3: Run GREEN for the lifetime contract**

Run the focused command from Step 1.

Expected: all tests in `lifetime-tuvi-articles.test.ts` pass, including the sibling-link assertion.

### Task 2: Validate The Current Cover And Slow-Test Changes

**Files:**
- Modify only if a failure proves it necessary: `src/lib/article-cover-assets.test.ts`
- Review: `src/lib/chart-ownership.test.ts`
- Review: `src/lib/cms.test.ts`
- Review: `public/articles/tu-vi-tron-doi-tuoi-binh-dan-1986-nam-mang.webp`
- Review: `public/articles/tu-vi-tron-doi-tuoi-binh-dan-1986-nu-mang.webp`
- Review: `public/articles/tu-vi-tron-doi-tuoi-dinh-mao-1987-nam-mang.webp`
- Review: `public/articles/tu-vi-tron-doi-tuoi-dinh-mao-1987-nu-mang.webp`
- Review: `public/articles/tu-vi-tron-doi-tuoi-canh-ngo-1990-nu-mang.webp`

**Interfaces:**
- Consumes: `seedArticles[*].coverImage` and `coverAlt`.
- Produces: 1200x675 WebP files under 260 KB and stable focused tests on the Windows workspace.

- [ ] **Step 1: Run the bounded P0 test group**

```powershell
$env:PATH="C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;$env:PATH"
& "C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" .\node_modules\vitest\vitest.mjs run src/lib/lifetime-tuvi-articles.test.ts src/lib/article-cover-assets.test.ts src/lib/content.test.ts src/lib/chart-ownership.test.ts src/lib/cms.test.ts
```

Expected: all files pass without relying on system Node 18.

- [ ] **Step 2: Validate the five raster files directly**

Run the asset test and inspect file metadata. Confirm each file is 1200x675, below 260 KB, decodes successfully, and the displayed scene contains no broken text or misleading claim.

- [ ] **Step 3: Review the timeout-only test changes**

Run the bounded group once with the repository's 15-second default. If all five files pass within the existing limit, exclude the copied timeout-only changes from P0; a larger timeout without a reproduced timeout failure would only hide future slowness. The observed P0 run passed 62 tests without those overrides, so the timeout-only changes are excluded.

- [ ] **Step 4: Classify the SVG source files**

Inspect the five 1986/1987/1990 SVGs. Stage them only if all five form one complete source set with valid UTF-8 Vietnamese, 1200x675 dimensions, an article-specific `aria-label`, and no raw ampersand. Otherwise leave all SVG changes untouched in the original checkout; never stage a partial source set. The P0 worktree excludes these SVG changes because the public articles reference the reviewed WebP assets and the SVG sources are not part of that runtime contract.

### Task 3: Prove And Commit The P0 Unit

**Files:**
- Modify: only files proven by Tasks 1-2.
- Exclude: `.codex/skills/graphify/`, `graphify-out/`, `src/graphify-out/`.

**Interfaces:**
- Consumes: GREEN focused tests and reviewed asset files.
- Produces: one scoped P0 commit with no generated audit output.

- [ ] **Step 1: Run static diff checks**

```powershell
git diff --check
git status --short
git diff --stat
```

Expected: no whitespace errors; every staged candidate belongs to the lifetime/test recovery unit.

- [ ] **Step 2: Run full P0 verification**

```powershell
$env:PATH="C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;$env:PATH"
& "C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" .\node_modules\eslint\bin\eslint.js
& "C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" .\node_modules\vitest\vitest.mjs run --maxWorkers=4
& "C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" .\node_modules\next\dist\bin\next build
```

Expected: lint, all Vitest files, and the production build pass. Cache-size warnings may still appear here; eliminating them belongs to Slice 1A and is not misreported as a P0 failure.

- [ ] **Step 3: Stage only the reviewed P0 files**

Stage the four test files, five reviewed WebPs, and either all five validated SVG sources or none of the untracked SVG sources. Verify with:

```powershell
git diff --cached --name-status
```

Expected: no Graphify or generated directories in the staged set.

- [ ] **Step 4: Commit the P0 unit**

```powershell
git commit -m "fix: stabilize lifetime content checks"
```

- [ ] **Step 5: Start P1 from an isolated worktree**

Invoke `superpowers:using-git-worktrees` and create a `codex/` branch from the new P0 commit. Leave any untracked local-only artifacts in the original checkout.
