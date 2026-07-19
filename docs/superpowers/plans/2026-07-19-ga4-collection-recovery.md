# GA4 Collection Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Restore standards-compatible GA4 command queuing, deploy it independently, and prove that production sends page-view and custom-event collection requests to G-5JSNC2T5G0 before any funnel UI changes ship.

**Architecture:** Keep the three existing local gtag shims and change only the queued value from a rest-parameter Array to the native Arguments object expected by gtag.js. Protect the behavior with one focused regression test, then treat live network collection plus GA4 Realtime/DebugView as a hard release checkpoint.

**Tech Stack:** Next.js 16, React 19, TypeScript, Vitest, GA4, Google tag, PowerShell release script, PM2/Nginx production.

## Global Constraints

- Do not add GTM, another analytics library, an analytics database, or a shared wrapper.
- Do not rename existing events, change Measurement IDs, alter Google Ads labels, or mix funnel/UI changes into this release.
- All three shims must use the same native Arguments queue shape because whichever shim runs first may define window.gtag for the others.
- Script presence and dataLayer presence are diagnostics only; they do not pass Checkpoint A without real g/collect requests.
- Use a fresh browser profile/context so old localStorage dedupe keys cannot suppress the custom event.
- Stop after deployment if the required production evidence is missing. Do not begin the funnel rollout plan.

---

### Task 1: Lock the native Arguments queue contract with a regression test

**Files:**

- Modify: src/components/google-ads-tracking.test.ts
- Read for contract: src/components/google-analytics-deferred-loader.tsx
- Read for contract: src/components/google-analytics-page-view.tsx
- Read for contract: src/components/google-ads-event-reporter.tsx

- [ ] **Step 1: Extend the source fixtures to cover all three shims**

Read google-analytics-page-view.tsx in addition to the reporter, composition component, and deferred loader. Put the three shim sources in one local array so the same contract is asserted for each file.

~~~ts
const gtagShimSources = [
  deferredLoaderSource,
  pageViewSource,
  eventReporterSource,
];
~~~

- [ ] **Step 2: Add the queue-shape assertions**

Add a test that requires every source to contain the native queue call and rejects the old rest-array call:

~~~ts
it("queues native Arguments objects in every gtag shim", () => {
  for (const source of gtagShimSources) {
    expect(source).toContain("dataLayer?.push(arguments)");
    expect(source).not.toContain("dataLayer?.push(args)");
  }
});
~~~

Add a runnable behavior check so the regression test distinguishes an Arguments object from an Array instead of relying only on source spelling:

~~~ts
it("preserves the gtag command as an Arguments object", () => {
  const queue: unknown[] = [];

  function gtag() {
    queue.push(arguments);
  }

  gtag("event", "checkpoint_a");

  expect(Array.isArray(queue[0])).toBe(false);
  expect(Object.prototype.toString.call(queue[0])).toBe("[object Arguments]");
  expect(Array.from(queue[0] as IArguments)).toEqual(["event", "checkpoint_a"]);
});
~~~

- [ ] **Step 3: Run the focused test and confirm RED**

~~~powershell
npm test -- src/components/google-ads-tracking.test.ts
~~~

Expected: FAIL because all three runtime shims still push args, and the test now reads the SPA page-view file too.

### Task 2: Repair all three existing gtag shims

**Files:**

- Modify: src/components/google-analytics-deferred-loader.tsx
- Modify: src/components/google-analytics-page-view.tsx
- Modify: src/components/google-ads-event-reporter.tsx
- Test: src/components/google-ads-tracking.test.ts

- [ ] **Step 1: Replace the deferred-loader shim**

Replace only the function body/signature:

~~~ts
function gtag() {
  window.dataLayer?.push(arguments);
}
~~~

Keep its js/config calls and deferred script-loading behavior unchanged.

- [ ] **Step 2: Replace the SPA page-view shim**

Use the same zero-rest-parameter function:

~~~ts
function gtag() {
  window.dataLayer?.push(arguments);
}
~~~

Keep the existing route dedupe and page_view payload unchanged.

- [ ] **Step 3: Replace the event-reporter fallback shim**

Inside ensureGtagQueue, retain the existing fallback assignment but use:

~~~ts
window.gtag =
  window.gtag ||
  function gtag() {
    window.dataLayer?.push(arguments);
  };
~~~

Keep sendGtagEvent, Google Ads conversion dispatch, event names, values, and dedupe behavior unchanged.

- [ ] **Step 4: Run the focused test and confirm GREEN**

~~~powershell
npm test -- src/components/google-ads-tracking.test.ts
~~~

Expected: PASS, including the native Arguments behavior assertion.

- [ ] **Step 5: Run static verification**

~~~powershell
npm run lint
npm run build
git diff --check
~~~

Expected: all commands exit 0.

- [ ] **Step 6: Commit the isolated fix**

~~~powershell
git add -- src/components/google-ads-tracking.test.ts src/components/google-analytics-deferred-loader.tsx src/components/google-analytics-page-view.tsx src/components/google-ads-event-reporter.tsx
git commit -m "fix: restore GA4 collection queue"
~~~

### Task 3: Ship Checkpoint A through the real production path

**Files:**

- Verify: scripts/release-production.ps1
- Verify: docs/agent/playbooks.md
- No runtime file changes expected

- [ ] **Step 1: Confirm release scope before shipping**

~~~powershell
git status --short --branch
git show --stat --oneline HEAD
~~~

Expected: the GA4 fix is the only unshipped runtime commit and the worktree has no unrelated staged files.

- [ ] **Step 2: Deploy the committed revision**

~~~powershell
npm run ship
~~~

The command must push origin/master, build a clean release on the VPS, move the current release, restart PM2 process lasotinhhoa, and complete its built-in public checks. Do not substitute a local build for this step.

- [ ] **Step 3: Record server and public revision evidence**

Capture the deployed commit, current release target, PM2 process state, and public HTTP response according to docs/agent/playbooks.md. The deployed revision must equal the local committed revision.

### Task 4: Prove production collection in a fresh browser

**Files:**

- Verify only: src/lib/env.ts
- Verify only: src/components/google-analytics.tsx
- Verify only: src/app/layout.tsx
- No code changes expected

- [ ] **Step 1: Start a clean browser session with network and console capture**

Open a new profile/context with extensions and stale site storage disabled or cleared. Preserve network logs and include requests from google-analytics.com.

- [ ] **Step 2: Prove the Google tag loads**

Navigate to:

~~~text
https://lasotinhhoa.vn/kien-thuc-tu-vi/lap-la-so-bat-tu
~~~

Confirm gtag/js?id=G-5JSNC2T5G0 returns HTTP 200.

- [ ] **Step 3: Prove the initial page view is collected**

Inspect the g/collect request URL and POST body. Require:

~~~text
tid=G-5JSNC2T5G0
en=page_view
~~~

Record the timestamp, URL path, request status, tid, and event name. Merely seeing the script or dataLayer is not enough.

- [ ] **Step 4: Prove SPA navigation and one custom event with the same click**

On the article page, click the existing element marked:

~~~text
data-ad-click="article_chart_cta_click"
~~~

Compare the network log immediately before and after this single click. Require:

- exactly one additional g/collect request with en=page_view and the same tid after client navigation;
- exactly one g/collect request with en=article_chart_cta_click and the same tid.

- [ ] **Step 5: Check duplicates and console errors**

Confirm the one click did not create a duplicate page view or duplicate custom event, and no Google-tag console error occurred.

- [ ] **Step 6: Confirm the session in GA4**

Using the property for G-5JSNC2T5G0, confirm the test session appears in Realtime or DebugView after the normal processing delay. Record which view was used and the visible event names; do not record user-identifying data.

- [ ] **Step 7: Apply the hard checkpoint**

Checkpoint A passes only if all are true:

- gtag.js returned successfully.
- The initial page view produced a matching g/collect request.
- Client navigation produced exactly one new page view.
- A custom event produced a matching g/collect request.
- No Google-tag console error appeared.
- Realtime or DebugView received the session.

If any condition fails, stop and report the exact failed observation. Do not execute docs/superpowers/plans/2026-07-19-free-reading-paid-funnel.md.

### Task 5: Handoff the trustworthy measurement start point

- [ ] **Step 1: Record the measurement baseline**

In the implementation handoff, include:

- deployed commit hash;
- production verification timestamp in Asia/Bangkok;
- exact page-view and custom-event names observed;
- confirmation that the tid was G-5JSNC2T5G0;
- Realtime or DebugView result;
- statement that pre-fix hits cannot be recovered and post-checkpoint data is the trustworthy baseline.

- [ ] **Step 2: Mark Checkpoint A ready for the funnel rollout**

Only after Task 4 passes, proceed to docs/superpowers/plans/2026-07-19-free-reading-paid-funnel.md using its own RED/GREEN and production gates.
