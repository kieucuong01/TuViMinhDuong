# Lifetime Hub Completion Implementation Plan

> Execute in the isolated `codex/lifetime-hub-completion` worktree. Follow TDD and stop if baseline verification is not clean.

## Task 1: Establish a clean baseline

1. Install locked dependencies with bundled Node 24.
2. Run the focused lifetime tests.
3. Confirm the worktree contains no unrelated changes beyond these two planning documents.

## Task 2: Make search keyword-order independent

1. Add a failing test for `nữ 1995`, repeated whitespace, and terms that do not all match one card.
2. Run the focused logic test and confirm the new assertion fails for the expected reason.
3. Change filtering to split the normalized query into non-empty terms and require every term in the normalized card haystack.
4. Rerun the focused test.

## Task 3: Add 1986-1989 content and synchronized dates

1. Add failing tests requiring two unique articles per year for 1986-1989, correct sibling links, a release `contentDate`, and a shared latest lifetime update date.
2. Add `contentDate` to the generated lifetime input model, add the four year rows, and derive/export the latest content date from all generated inputs.
3. Make the article factory use the input date, the hub format the derived date for Vietnamese readers, and the sitemap use the same Date value.
4. Rerun the focused lifetime/content/sitemap tests.

## Task 4: Add and verify cover assets

1. Generate eight distinct photo-editorial covers with the built-in image generator.
2. Copy final assets into `public/articles/<slug>.webp` without changing existing covers.
3. Normalize each asset to 1200x675 WebP under 260 KB when needed.
4. Run the article cover and lifetime content tests.

## Task 5: Full verification and browser QA

1. Run `git diff --check`, targeted lint, full lint, full tests, and `npm run build` using Node 24.
2. Start the production build locally on port 4000.
3. Verify desktop and 390px mobile hub behavior, token-order search, result counts, one new detail page, canonical, visible update date, and clean console.
4. Review the complete diff for scope and content quality.

## Task 6: Review, commit, push, deploy, and live proof

1. Request an independent code review and address only verified actionable findings.
2. Commit only scoped files.
3. Fetch/rebase on the current `origin/master`, repeat the required gates if the base changed, then push the release commit to `origin/master` without force.
4. Run `npm run ship` from a clean master checkout.
5. Verify PM2 points to the new release, `.release-commit` matches GitHub, changed URLs and sitemap return 200, both query orders return the expected result in production, and the console is clean on desktop/mobile.
