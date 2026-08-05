# P2C Targeted Modularity Plan

**Goal:** Confirm and lock the four roadmap boundaries without turning the final slice into a broad refactor.

## Task 1: Audit the actual import graph

- Build a Graphify AST graph for `src/` and query the article, funnel, payment reconciliation, and admin presentation paths.
- Treat graph health warnings honestly and verify important conclusions against source imports.

## Task 2: Lock the intended boundaries

- Keep article index/summary/detail read models inside the dedicated article data module, outside the old `data.ts` facade.
- Keep funnel validation/write in `funnel-events`, read aggregation in `funnel-report`, payment reconciliation independent from routes/DB globals, and admin presentation in focused components.
- Make presentation components import contracts directly instead of the broad data barrel.
- Add a source-level import-cycle and boundary contract test.

## Task 3: Final completion audit

- Run targeted boundary tests, lint, all tests, production build, and production browser smoke.
- Recheck clean Git scope and commit P2C separately.
- Record the local dependency-audit limitation honestly; do not push, migrate, reconcile, or deploy production unless separately requested.

## Audit results

- Graphify indexed 404 source files into 2,657 nodes, 6,107 edges, and 177 communities. The article read models, funnel writer/report, payment reconciliation, and admin presentation surfaces remain distinct boundaries.
- The graph reported 698 dangling endpoint edges and 148 collapsed same-endpoint groups, so it is supporting evidence only. The source-level contract test is the final authority for cycles and forbidden imports.
- The source import graph is acyclic. Payment reconciliation remains pure and independent from routes, database globals, PayOS, and server-only modules.
- Funnel validation/write, reporting, and admin presentation remain separated. Admin presentation now imports shared types directly from `data/contracts` instead of the broad `data` facade.
- Article list, summary, and detail read models remain in the dedicated article module.
- Targeted verification passed: 3 test files, 7 tests, plus targeted ESLint.
- Final gates passed: full ESLint, 160 test files with 843/843 tests, production build with 552/552 generated pages, and 8/8 production browser smoke tests across desktop and mobile.
- The local dependency audit was not run because the sandbox would have transmitted the private dependency tree to npm without explicit authorization. The P1D GitHub workflow enforces `npm audit --audit-level=high` in CI instead.
- Existing non-blocking warnings remain documented separately: Vite's future native config-loader compatibility, Next.js worktree root inference, and edge-runtime static-generation behavior.
