# P0/P1 Growth Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore and release the production growth foundation, then add and release privacy-safe funnel analytics for the compatibility and wealth tools.

**Architecture:** Keep the SEO snapshot wrapper as the stable public module. Keep wealth content server-rendered and add only a small delegated client analytics reporter. Enforce analytics privacy with per-event parameter allowlists instead of a deny-list.

**Tech Stack:** Next.js 16, React 19, TypeScript, Vitest, GA4 gtag, Node 24, npm lockfile, VPS/PM2/Nginx.

## Global Constraints

- Complete and deploy P0 before writing P1 production code.
- Never send names, birth data, gender, email, phone, chart IDs, user IDs, reading IDs, free text, or full URLs in organic-tool events.
- Do not alter Google Ads conversion labels or verified-purchase logic.
- Preserve unrelated dirty work in the main checkout.
- Use Node 24 for npm, lifecycle scripts, tests and builds.
- Use a clean checkout for each production release and prove local/origin/deployed SHA identity.

---

### Task 1: Restore the SEO snapshot public contract

**Files:**
- Modify: `src/lib/seo-autopilot-snapshot-script.test.ts`
- Modify: `scripts/seo/seo-autopilot-snapshot.mjs`

**Interfaces:**
- Consumes: `buildSnapshot(options)` from `seo-autopilot-snapshot-runner.mjs`.
- Produces: named export `buildSnapshot` from `seo-autopilot-snapshot.mjs` for planner and executor.

- [ ] **Step 1: Write the failing integration test**

Change the test import so `buildSnapshot` comes from the public wrapper while `fetchText` and `mapWithConcurrency` remain imported from the runner:

```ts
import { buildSnapshot } from "../../scripts/seo/seo-autopilot-snapshot.mjs";
import { fetchText, mapWithConcurrency } from "../../scripts/seo/seo-autopilot-snapshot-runner.mjs";
```

- [ ] **Step 2: Run RED**

Run:

```powershell
node node_modules/vitest/vitest.mjs run src/lib/seo-autopilot-snapshot-script.test.ts
```

Expected: module import failure because the wrapper has no `buildSnapshot` export.

- [ ] **Step 3: Add the minimal public re-export**

Use one imported binding for both the CLI and export:

```js
import { buildSnapshot } from "./seo-autopilot-snapshot-runner.mjs";
export { buildSnapshot };
```

- [ ] **Step 4: Run GREEN**

Run the focused test and then execute the real planner with `--skip-search-console --sample-size 1`. Both must exit zero.

- [ ] **Step 5: Commit the P0 code change**

Commit the wrapper and regression test with message `fix: restore seo autopilot snapshot contract`.

### Task 2: Remove the high dependency advisory

**Files:**
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: current npm advisory resolution.
- Produces: reproducible lockfile with no high/critical production advisory.

- [ ] **Step 1: Record the current failure**

Run `npm audit --omit=dev --audit-level=high`; expected exit 1 naming `fast-uri`.

- [ ] **Step 2: Apply the smallest lockfile repair**

Run `npm audit fix --package-lock-only`, inspect the lock diff, and reject unrelated major upgrades.

- [ ] **Step 3: Reinstall and verify**

Run Node-24 `npm ci`, `npm audit --omit=dev --audit-level=high`, focused SEO tests, full lint, 772+ tests, and production build.

- [ ] **Step 4: Commit dependency repair**

Commit only `package-lock.json` with message `fix: resolve production dependency advisory`.

### Task 3: Release and prove P0

**Files:**
- No production source change.

**Interfaces:**
- Consumes: verified P0 commits and `origin/master` fast-forward state.
- Produces: matching GitHub/VPS/PM2 production SHA.

- [ ] **Step 1: Rebase against current origin/master and rerun affected checks**
- [ ] **Step 2: Push the P0 branch tip as a fast-forward to `origin/master`**
- [ ] **Step 3: Deploy from a clean master checkout with `npm run ship`**
- [ ] **Step 4: Verify release commit, symlink, PM2 cwd, public routes, SEO planner and dependency audit**

### Task 4: Enforce the organic-event allowlist

**Files:**
- Modify: `src/components/organic-tools-analytics.test.ts`
- Modify: `src/lib/client-analytics.ts`

**Interfaces:**
- Consumes: event name plus arbitrary primitive parameter record.
- Produces: `trackOrganicToolEvent` that emits only parameters allowed for that event.

- [ ] **Step 1: Write RED privacy tests**

Add unknown sensitive-looking keys such as `chart_id`, `email`, `phone`, `birth_timestamp`, and `unexpected` to an existing event call. Assert the emitted payload contains only that event's allowed keys.

- [ ] **Step 2: Run RED**

Expected: current deny-list leaks the new keys into `gtag`.

- [ ] **Step 3: Implement per-event allowlists**

Define all existing and new event names and exact parameter names. Filter against the selected event's set before calling `gtag`.

- [ ] **Step 4: Run GREEN and mutation-check the allowlist**

Temporarily reason through removal/addition of an allowed key; the test must catch both wrong retention and wrong removal.

### Task 5: Add compatibility funnel events

**Files:**
- Modify: `src/components/chart-compatibility-tool.test.ts`
- Modify: `src/components/chart-compatibility-tool.tsx`

**Interfaces:**
- Consumes: current compatibility UI state and categorical report fields.
- Produces: six compatibility events with no birth-profile parameters.

- [ ] **Step 1: Write RED contract tests for all six interaction points**
- [ ] **Step 2: Run RED and confirm the missing-event failure**
- [ ] **Step 3: Track view, submit, successful result, edit, evidence-open and chart CTA**
- [ ] **Step 4: Run focused analytics and compatibility tests GREEN**

### Task 6: Add the server-rendered wealth funnel reporter

**Files:**
- Create: `src/components/organic-tool-event-reporter.tsx`
- Modify: `src/components/google-analytics.tsx`
- Modify: `src/components/chart-form.tsx`
- Modify: `src/components/wealth-fortune-view.tsx`
- Modify: `src/components/organic-tools-analytics.test.ts`
- Modify: `src/components/wealth-fortune-view.test.tsx`

**Interfaces:**
- Consumes: pathname, relevant query flags, and developer-authored `data-organic-*` metadata.
- Produces: wealth landing view, submit, result, evidence-click and next-step events without converting the report to a client component.

- [ ] **Step 1: Write RED route-mapping, form-marker and rendered-link tests**
- [ ] **Step 2: Run RED and confirm missing reporter/markers**
- [ ] **Step 3: Implement the small reporter and mount it beside Google Ads reporting**
- [ ] **Step 4: Add the wealth-only form and evidence-link data attributes**
- [ ] **Step 5: Run focused tests GREEN**

### Task 7: Verify and release P1

**Files:**
- No additional source file required unless verification exposes a regression.

**Interfaces:**
- Consumes: completed analytics implementation.
- Produces: production P1 SHA and evidence for all event call sites and privacy controls.

- [ ] **Step 1: Run fresh lint, all Vitest tests, production build and zero-high audit**
- [ ] **Step 2: Run desktop and mobile local browser smoke for both tools**
- [ ] **Step 3: Inspect git diff and staged secret scan, then commit `feat: measure compatibility and wealth funnels`**
- [ ] **Step 4: Rebase/push P1 as a fast-forward to `origin/master`**
- [ ] **Step 5: Deploy from the clean master checkout and prove SHA/PM2/public routes**
- [ ] **Step 6: Re-audit every event name and allowed parameter against the design before marking the goal complete**
