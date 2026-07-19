# Free Reading and Paid Funnel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Give visitors a genuinely useful long free reading, make the next free and paid steps obvious, measure the resulting funnel, and close ownership and duplicate-payment failure paths without shortening content or weakening payment gates.

**Architecture:** Keep the deterministic 251-rule free-reading engine as the single content source, with a fixed Markdown grammar and a server-side guest projection immediately before section 3. Reuse the existing Markdown renderer, chart page, login/claim path, Google event reporter, shared unlock functions, Reading record, and PaymentOrder proof. Add no new provider, schema, renderer, or analytics service.

**Tech Stack:** Next.js 16, React 19, TypeScript, Vitest, Prisma/PostgreSQL, PayOS, GA4, CSS, PowerShell release script, PM2/Nginx production.

## Global Constraints

- Start only after docs/superpowers/plans/2026-07-19-ga4-collection-recovery.md has passed Checkpoint A on production.
- Preserve the existing chart engine and the 251 interpretation rules. Do not add AI generation, post-processing, new astrology combinations, or new interpretation rules.
- Guest or signed-in non-owner content is the complete prefix before the section-3 H2: 800–950 visible words inclusive. A claimed owner/admin receives all four sections: 1,400–1,650 visible words inclusive.
- The 80–120-word quick read, one self-reflection question, and the FULL bridge count toward both applicable budgets. UI copy does not.
- Never truncate by character, word, height, CSS, or JavaScript. Never cut a sentence or paragraph in presentation code.
- Only combine a primary rule with an existing support rule that shares an applicable palace or is already represented by an existing composite rule. Do not silently fall back to an unrelated combination.
- Guest CTA actions must enter the existing save/login flow, never checkout.
- Only an authenticated owner or admin may open paid actions or spend coins for a chart.
- PayOS remains the primary 199,000đ choice; 199 coins is secondary and appears only with sufficient balance.
- No schema migration, entitlement table, dependency, popup, countdown, scarcity copy, or unverified testimonial.
- Do not send email, name, birth data, chart content, or other identifying data in analytics events.
- Do not perform a real paid transaction during verification unless the operator separately authorizes it.

---

### Task 1: Define the deterministic two-budget free-reading contract

**Files:**

- Modify: src/lib/free-overview-engine.test.ts
- Modify: src/lib/free-overview-presentation.test.ts
- Modify: src/lib/ai.test.ts
- Modify: src/lib/free-overview-status.test.ts
- Modify: src/app/api/charts/[id]/free-overview/route.test.ts
- Modify: src/lib/free-overview-engine.ts
- Modify: src/lib/free-overview-presentation.ts
- Modify: src/lib/ai.ts
- Modify: src/lib/data.ts
- Modify: src/app/api/charts/[id]/free-overview/route.ts
- Modify: src/app/la-so/[id]/page.tsx
- Modify: docs/agent/playbooks.md

- [ ] **Step 1: Add parser helpers to the engine test**

Keep the existing three representative chart fixtures. Add local test helpers that:

- count visible Markdown text with the shared runtime helper, excluding syntax-only tokens such as H2/H3 markers and bold delimiters;
- extract the quick-read paragraph between H3 Đọc nhanh and H2 section 1;
- split the document at the first line matching H2 section 3;
- split each numbered H2 section;
- collect H3 labels inside each section.

The expected semantic labels are:

~~~ts
const semanticLabels = [
  "Điểm nổi bật",
  "Lợi thế",
  "Điểm cần lưu ý",
  "Gợi ý thực tế",
  "Vì sao có nhận định này",
];
~~~

- [ ] **Step 2: Write failing grammar and budget assertions**

For every chart fixture, require:

~~~ts
expect(countVisibleMarkdownWords(quickRead)).toBeGreaterThanOrEqual(80);
expect(countVisibleMarkdownWords(quickRead)).toBeLessThanOrEqual(120);
expect(countVisibleMarkdownWords(guestPrefix)).toBeGreaterThanOrEqual(800);
expect(countVisibleMarkdownWords(guestPrefix)).toBeLessThanOrEqual(950);
expect(countVisibleMarkdownWords(content)).toBeGreaterThanOrEqual(1400);
expect(countVisibleMarkdownWords(content)).toBeLessThanOrEqual(1650);
~~~

Also require:

- exactly one H3 Đọc nhanh before H2 section 1;
- exactly four numbered H2 sections in order;
- exactly the five semantic H3 labels, in order, in every section;
- exactly one self-reflection question and the FULL bridge after the final H3 of section 2 but before H2 section 3;
- no H3 Dấu hiệu bổ sung;
- no duplicate normalized sentence of 18 words or more;
- two builds from the same chart are byte-for-byte equal.

- [ ] **Step 3: Update presentation and API expectations**

In free-overview-presentation.test.ts, use a grammar-valid fixture and require:

- the guest projection contains quick read, sections 1–2, the question, and the FULL bridge;
- it contains neither H2 section 3 nor H2 section 4;
- the cut occurs on an H2 boundary and the final visible paragraph remains complete;
- malformed content without H2 section 3 still fails closed to an empty string.
- countVisibleMarkdownWords counts visible heading/link text but not Markdown-only tokens such as ##, ###, **, list markers, link destinations, or image destinations.

In the free-overview GET route test, require the same guest boundary and require wordCount to equal countVisibleMarkdownWords of the returned content.

Give the chart record a userId and cover all access cases:

- guest receives sections 1–2;
- signed-in non-owner still receives sections 1–2;
- the matching owner receives sections 1–4;
- ADMIN receives sections 1–4.

This locks the rule that login alone is not enough; the chart must have been claimed by that user.

- [ ] **Step 4: Update AI/status contract expectations**

Change the expected free overview version from free-seed-overview-v10 to free-seed-overview-v11. Replace the old two-question/end-of-document assertions with the fixed new grammar, one question before section 3, quick-read range, guest range, and full range. Retain the assertion that the free path never invokes an LLM/provider.

- [ ] **Step 5: Run focused tests and confirm RED**

~~~powershell
npm test -- src/lib/free-overview-engine.test.ts src/lib/free-overview-presentation.test.ts src/lib/ai.test.ts src/lib/free-overview-status.test.ts "src/app/api/charts/[id]/free-overview/route.test.ts"
~~~

Expected: FAIL because the current formatter has rule-title H3s, two questions at the end, no quick read, and no guest-budget validation.

- [ ] **Step 6: Keep matching/scoring intact and guarantee a related quick-read pair**

Do not change fact extraction, match predicates, or rule scores.

When selecting a support rule, reuse the existing rulePalaces function. A candidate may support the primary only when their palace sets intersect, including a palace already present in an existing composite rule. Never fall back to an unrelated rule merely to hit a word count.

For the first cluster, scan candidates in the existing score order and use the first primary that has a currently matched, unused related support whose whole summary sentences can produce an 80–120-word quick read. This preserves the existing top candidate whenever it satisfies the approved grammar and advances only when it cannot. Store that support on the cluster so the quick-read contract is a plan invariant, not an optional formatter guess.

Keep the fallback local and deterministic:

~~~ts
function shareRulePalace(left: ScoredInterpretationRule, right: ScoredInterpretationRule) {
  const rightPalaces = new Set(rulePalaces(right));
  return rulePalaces(left).some((palace) => rightPalaces.has(palace));
}

const quickPair = candidates
  .map((primary) => ({
    primary,
    support: candidates.find(
      (candidate) =>
        candidate.key !== primary.key &&
        shareRulePalace(primary, candidate) &&
        canBuildQuickRead(primary, candidate),
    ),
  }))
  .find((pair) => pair.support);
~~~

Use quickPair only for the first cluster. canBuildQuickRead must call the same whole-sentence selector as buildQuickRead, so test and runtime cannot disagree.

For the other clusters, keep the current primary order and allow support to be absent when no related candidate exists.

Add:

- an assertion that every selected primary/support pair shares at least one palace;
- a test showing the first cluster always has a related support and a quick-readable sentence combination;
- a deterministic chart matrix spanning both genders, representative birth years, all 12 birth-hour indices, and multiple view years; every generated plan must satisfy the first-cluster invariant and every generated overview must satisfy all three word budgets.

If no valid first-cluster pair exists for an actual chart, throw before rendering with non-PII rule keys and counts. The matrix test must pass before release; do not invent filler or an unrelated fallback.

- [ ] **Step 7: Add the shared visible-text counter and build quick read from whole summary sentences**

In free-overview-presentation.ts, export one dependency-free helper used by generation, validation, API responses, and page responses:

~~~ts
export function countVisibleMarkdownWords(content: string): number
~~~

Implement it without a parser dependency:

~~~ts
export function countVisibleMarkdownWords(content: string) {
  const visibleText = content
    .replace(/!\[([^\]]*)\]\([^)]+\)/gu, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/gu, "$1")
    .replace(/^\s{0,3}(?:#{1,6}|[-+*]|\d+\.)\s+/gmu, "")
    .replace(/[*_~\x60>|]/gu, " ");

  return visibleText.trim().split(/\s+/u).filter(Boolean).length;
}
~~~

It preserves visible heading/link/inline-code text while removing syntax-only Markdown markers and destinations before whitespace counting. Keep the existing countWords helper unchanged for paid-reading chapter validation.

Use countVisibleMarkdownWords in:

- free-overview-engine.ts for quick, guest, and full acceptance;
- ai.ts isCompleteFreeOverview;
- data.ts getFreeOverviewStatus.wordCount;
- the free-overview API route response;
- the chart-page projected response;
- all related tests.

Then add small private formatter helpers inside free-overview-engine.ts; do not export a new service.

The quick-read builder must:

1. require the first cluster primary and its guaranteed related support;
2. read whole normalized sentences from those two summaries;
3. add sentences in deterministic order;
4. stop only on a sentence boundary when the result is within 80–120 visible words;
5. record the exact sentences it used so the section body does not repeat them verbatim;
6. throw a descriptive formatter error if the approved matched pair cannot satisfy the range without slicing a sentence.

The helper interface should remain local:

~~~ts
type QuickRead = {
  content: string;
  usedSentences: Set<string>;
};

function buildQuickRead(
  primary: ScoredInterpretationRule,
  support: ScoredInterpretationRule,
): QuickRead
~~~

Do not use Array.slice on words, substring truncation, ellipses, or filler.

- [ ] **Step 8: Replace the old repeated rule template with the fixed grammar**

Render one paragraph after every semantic H3:

~~~text
### Đọc nhanh
[80–120 words from existing summary sentences]

## 1. [cluster title]
### Điểm nổi bật
[remaining non-duplicate primary/support summary]
### Lợi thế
[primary/support strength fields]
### Điểm cần lưu ý
[primary/support caution fields]
### Gợi ý thực tế
[primary/support advice fields]
### Vì sao có nhận định này
[primary/support evidence]
~~~

Apply the same five-H3 grammar to all four sections. Merge only normalized, non-duplicate fields into the corresponding paragraph; do not render a second five-item support template. If quick read consumed every summary sentence for section 1, use a factual lead naming the matched existing rule titles, then expand with the remaining rule fields; do not reinsert the consumed summary verbatim.

After section 2 evidence, insert one normal paragraph beginning with bold text Câu hỏi tự đối chiếu and one short normal paragraph explaining what the FULL report adds. Then render H2 section 3 immediately.

Remove the old final H2 Hai câu hỏi để bạn tự đối chiếu and its two bullets.

- [ ] **Step 9: Validate all three word budgets during deterministic assembly**

Reuse the existing support strength/caution/advice inclusion sets. Measure with countVisibleMarkdownWords. Each candidate formatter output is acceptable only when:

- quick read is 80–120 words;
- buildFreeOverviewTeaser(candidate) is 800–950 words;
- the complete candidate is 1,400–1,650 words.

Import and reuse buildFreeOverviewTeaser from free-overview-presentation.ts so generation and presentation use the same section-3 boundary. Do not add a second character/word truncator.

If no deterministic combination satisfies all ranges, throw an error that includes the three measured counts and non-PII rule keys; do not include the person's name and do not return an invalid or sliced document.

- [ ] **Step 10: Update the validator and version**

In ai.ts:

~~~ts
export const FREE_OVERVIEW_VERSION = "free-seed-overview-v11";
~~~

Update isCompleteFreeOverview to validate:

- one quick-read H3 before section 1;
- four numbered H2 sections;
- five semantic H3 labels per section;
- one question and bridge before section 3;
- quick, guest, and full inclusive word ranges.

Keep buildInstantFreeOverview and generateFreeOverview public signatures unchanged.

In the free-overview API route and chart page, derive full-free access from the same ownership rule:

~~~ts
const canReadFullOverview = Boolean(
  user && (user.role === "ADMIN" || record.userId === user.id),
);
~~~

Project to sections 1–2 whenever canReadFullOverview is false, including a signed-in non-owner. Return all four sections only to the owner/admin. Use countVisibleMarkdownWords for the response wordCount.

- [ ] **Step 11: Correct the operational documentation**

At docs/agent/playbooks.md around the existing guest mini-report note, replace the stale 450–550 range with:

~~~text
Guest/non-owner projection: complete sections 1–2, 800–950 visible words.
Claimed owner/admin projection: complete sections 1–4, 1,400–1,650 visible words.
Projection always cuts immediately before H2 section 3 and never truncates by words or characters.
~~~

- [ ] **Step 12: Run focused tests and confirm GREEN**

~~~powershell
npm test -- src/lib/free-overview-engine.test.ts src/lib/free-overview-presentation.test.ts src/lib/ai.test.ts src/lib/free-overview-status.test.ts "src/app/api/charts/[id]/free-overview/route.test.ts"
~~~

Expected: all fixtures pass both budgets, the grammar parser, determinism, non-repetition, and no-provider assertions.

- [ ] **Step 13: Commit the deterministic content contract**

~~~powershell
git add -- src/lib/free-overview-engine.test.ts src/lib/free-overview-presentation.test.ts src/lib/ai.test.ts src/lib/free-overview-status.test.ts "src/app/api/charts/[id]/free-overview/route.test.ts" src/lib/free-overview-engine.ts src/lib/free-overview-presentation.ts src/lib/ai.ts src/lib/data.ts "src/app/api/charts/[id]/free-overview/route.ts" "src/app/la-so/[id]/page.tsx" docs/agent/playbooks.md
git commit -m "feat: deepen deterministic free readings"
~~~

### Task 2: Add semantic emphasis and long-form reading typography

**Files:**

- Modify: src/components/markdown-content.test.ts
- Modify: src/components/reading-typography.test.ts
- Modify: src/components/markdown-content.tsx
- Modify: src/app/globals.css

- [ ] **Step 1: Write failing renderer marker tests**

Render static markup for all six recognized H3 labels:

~~~ts
const readingBlocks = {
  "Đọc nhanh": "quick",
  "Điểm nổi bật": "highlight",
  "Lợi thế": "strength",
  "Điểm cần lưu ý": "caution",
  "Gợi ý thực tế": "action",
  "Vì sao có nhận định này": "evidence",
};
~~~

Require each H3 to receive its matching data-reading-block value. Require an arbitrary H3 to receive no data-reading-block marker. Keep MarkdownContent props and H2 extraction behavior unchanged.

- [ ] **Step 2: Write failing scoped typography tests**

Extend reading-typography.test.ts to require scoped free-reading rules for:

- max-width 72ch and width 100%;
- font-size at least 1.0625rem and line-height around 1.75;
- left-aligned paragraphs/lists with text-justify disabled;
- distinct quick/highlight, caution, action, and evidence callouts;
- label/border/background cues so color is not the only semantic signal;
- no gradient or animation in these blocks.

Keep the paid-reading typography assertions unchanged.

- [ ] **Step 3: Run tests and confirm RED**

~~~powershell
npm test -- src/components/markdown-content.test.ts src/components/reading-typography.test.ts
~~~

Expected: FAIL because H3s have no semantic marker and free-reading prose inherits unbounded justified layout.

- [ ] **Step 4: Add one local H3 mapping to the existing renderer**

Inside markdown-content.tsx, add a private constant or function mapping the six exact labels above. In the existing H3 branch, render:

~~~tsx
<h3
  id={headingId(title, headingCounts)}
  data-reading-block={readingBlockFor(title)}
>
  {renderInline(title)}
</h3>
~~~

Omit the data attribute when no mapping exists. Do not add a second Markdown renderer, wrapper component, parser, dependency, or public prop.

- [ ] **Step 5: Add late, scoped free-reading CSS**

Add rules after the current generic prose and free-summary rules so the intended overrides win:

~~~css
.free-reading-summary .prose-content {
  width: 100%;
  max-width: 72ch;
  margin-inline: auto;
  font-size: 1.0625rem;
  line-height: 1.75;
}

.free-reading-summary .prose-content p,
.free-reading-summary .prose-content li {
  text-align: left;
  text-justify: auto;
}

.free-reading-summary h3[data-reading-block] + p {
  border: 1px solid;
  border-left-width: 4px;
  border-radius: 0.75rem;
  padding: 0.9rem 1rem;
}
~~~

Use accessible scoped palettes:

- quick/highlight: warm orange background #fff7ed, border #fdba74, text #7c2d12;
- caution: pale rose #fff1f2, border #fda4af, text #881337;
- action: pale green #f0fdf4, border #86efac, text #14532d;
- evidence: neutral stone #f5f5f4, border #d6d3d1, text #44403c;
- strength: a neutral/warm treatment distinct by its visible label and border.

Keep one-column flow on mobile, allow normal wrapping, and prevent horizontal overflow. Verify foreground/background pairs reach at least 4.5:1 contrast. Do not add animation, gradient text, or broad global strong-tag coloring.

- [ ] **Step 6: Run focused tests and confirm GREEN**

~~~powershell
npm test -- src/components/markdown-content.test.ts src/components/reading-typography.test.ts
~~~

- [ ] **Step 7: Commit the presentation slice**

~~~powershell
git add -- src/components/markdown-content.test.ts src/components/reading-typography.test.ts src/components/markdown-content.tsx src/app/globals.css
git commit -m "feat: emphasize free reading insights"
~~~

### Task 3: Make the free continuation and FULL offer visible to guests

**Files:**

- Modify: src/components/free-overview-loader.test.ts
- Modify: src/components/personalized-report-outline.test.ts
- Modify: src/components/assistant-access-ui.test.ts
- Modify: src/components/free-overview-loader.tsx
- Modify: src/components/personalized-report-outline.tsx
- Modify: src/app/la-so/[id]/page.tsx

- [ ] **Step 1: Write the guest-gate copy contract**

Update the loader test to require a fullName prop and the approved copy:

~~~text
Lưu lá số của [Tên] để đọc tiếp miễn phí
Lưu lá số & đọc tiếp miễn phí
Email mới tự tạo tài khoản • Tặng 30 xu • Có thể dùng Google • Chưa mất phí
~~~

Require the link to retain login_gate_clicked, the current chart ID, and the same chart return path. Change the free content view marker from free_insights_viewed to free_overview_viewed.

Add a signed-in non-owner case: it remains at 2/4, receives no login/claim CTA, and gets a safe link to create its own chart.

- [ ] **Step 2: Write owner-aware outline tests**

Use a nine-item fixture and cover three cases:

1. Guest, locked: sees the title/price and all nine chapter names through the first-three-plus-expandable-six outline; CTA is a Link into loginModalHref returning to the same chart outline; no popoverTarget and no checkout form exists.
2. Signed-in owner, locked: sees the same outline; CTA says Mở bản FULL 9 chương — 199.000đ, carries full_offer_clicked, and opens the current premium modal.
3. Unlocked owner: sees the existing read-again link and no locked-offer view event.

Add a signed-in non-owner assertion: no modal-opening CTA is rendered.

- [ ] **Step 3: Write the chart-page composition assertion**

Update assistant-access-ui.test.ts or the smallest existing chart-page source contract to require:

- PersonalizedReportOutline is outside the user-only branch;
- ownsChart is derived from matching record.userId or ADMIN role;
- ReadingTabs and PremiumReadingCta remain owner-only;
- fullName is passed to FreeOverviewLoader.
- canReadFullOverview/ownsChart, not Boolean(user), controls the 2/4 versus 4/4 projection and free-overview depth.

- [ ] **Step 4: Run component tests and confirm RED**

~~~powershell
npm test -- src/components/free-overview-loader.test.ts src/components/personalized-report-outline.test.ts src/components/assistant-access-ui.test.ts
~~~

- [ ] **Step 5: Update FreeOverviewLoader without changing projection logic**

Add fullName and canReadFullOverview to the props. Keep initialOverview content untouched. Use canReadFullOverview, not login state, for data-ad-depth and for deciding whether the continuation block is needed.

Use:

~~~text
Eyebrow: Bạn đã đọc 2/4 phần miễn phí
Title: Lưu lá số của [fullName] để đọc tiếp miễn phí
CTA: Lưu lá số & đọc tiếp miễn phí
Help: Email mới tự tạo tài khoản • Tặng 30 xu • Có thể dùng Google • Chưa mất phí
~~~

Keep the two locked-row labels and current login modal flow. Set data-ad-view to free_overview_viewed.

If the viewer is signed in but canReadFullOverview is false, do not show another login CTA and do not offer claim or checkout. Show a short ownership-safe notice with a link to create their own chart; keep the projection at 2/4.

- [ ] **Step 6: Make PersonalizedReportOutline owner-aware**

Add explicit props:

~~~ts
isSignedIn: boolean;
ownsChart: boolean;
~~~

Give the section its own stable id personal-report-outline and keep the existing H2 id personal-report-outline-title solely for aria-labelledby. Do not duplicate either DOM ID. Show the first three chapter items directly and place the remaining six in a native details element so all nine names are available before login without a custom accordion dependency.

For a locked guest, render a Link built with loginModalHref that returns to:

~~~text
/la-so/[chartId]#personal-report-outline
~~~

The guest link uses login_gate_clicked, not full_offer_clicked, because it opens authentication rather than checkout.

For a locked owner, render the current popover button with full_offer_clicked and the text:

~~~text
Mở bản FULL 9 chương — 199.000đ
~~~

For a signed-in non-owner, render a short safe ownership notice and no purchase/modal control.

- [ ] **Step 7: Recompose the chart page**

Derive the shared ownership/read-access predicate before projecting the free overview:

~~~ts
const canReadFullOverview = Boolean(
  user && (user.role === "ADMIN" || record.userId === user.id),
);
~~~

Use canReadFullOverview for the page's 2/4 versus 4/4 projection and visible wordCount. Set ownsChart to the same value for paid actions. Pass record.chart.input.fullName, Boolean(user), and canReadFullOverview to FreeOverviewLoader.

Render PersonalizedReportOutline whenever paidFeaturesVisible and featurePrices are available, including guests. Pass isSignedIn and ownsChart.

Render ReadingTabs and PremiumReadingCta only when ownsChart is true. Keep payment logic inside existing actions/components, not the page.

- [ ] **Step 8: Run component tests and confirm GREEN**

~~~powershell
npm test -- src/components/free-overview-loader.test.ts src/components/personalized-report-outline.test.ts src/components/assistant-access-ui.test.ts
~~~

- [ ] **Step 9: Commit the guest-to-owner funnel UI**

~~~powershell
git add -- src/components/free-overview-loader.test.ts src/components/personalized-report-outline.test.ts src/components/assistant-access-ui.test.ts src/components/free-overview-loader.tsx src/components/personalized-report-outline.tsx "src/app/la-so/[id]/page.tsx"
git commit -m "feat: clarify free and full reading path"
~~~

### Task 4: Complete privacy-safe funnel instrumentation

**Files:**

- Modify: src/app/login-claim-guest-chart.test.ts
- Modify: src/components/google-ads-tracking.test.ts
- Modify: src/components/paid-reading-experience.test.tsx
- Modify: src/lib/auth.ts
- Modify: src/app/actions.ts
- Modify: src/app/api/oauth/google/callback/route.ts
- Modify: src/components/google-ads-event-reporter.tsx
- Modify: src/components/premium-reading-cta.tsx
- Modify: src/components/paid-reading-experience.tsx

- [ ] **Step 1: Write failing auth/claim marker contracts**

Update login-claim-guest-chart.test.ts to require:

- loginOrRegister returns both SessionUser and accountResult;
- existing users produce login and newly created users produce register;
- password login appends account=login or account=register;
- claimed=1 is appended only when claimGuestChartForUserFromPath returns true;
- redirect remains outside the try/catch;
- Google OAuth determines whether the user existed before upsert, captures the claim boolean, and appends the same non-PII markers.

Do not put email, name, or birth data in the redirect markers.

- [ ] **Step 2: Write failing event reporter contracts**

Extend google-ads-tracking.test.ts to require:

- account_completed from account=login or account=register with result only;
- guest_chart_claimed only from claimed=1;
- checkout_cancelled from checkout=cancelled;
- checkout_failed from deterministic error markers;
- payment_method on submit events;
- reading_id in view-event dedupe/payload;
- no transaction_id on begin/cancel/failure events;
- the existing purchase path still requires a verified status endpoint response.

Require both FULL forms to use data-ad-event begin_checkout and distinct data-ad-method values payos and coins.

- [ ] **Step 3: Write the completed-reading marker test**

Update paid-reading-experience.test.tsx so the root rendered only for a completed reading includes:

~~~text
data-ad-view="reading_completed"
data-reading-id="[readingId]"
~~~

- [ ] **Step 4: Run focused tests and confirm RED**

~~~powershell
npm test -- src/app/login-claim-guest-chart.test.ts src/components/google-ads-tracking.test.ts src/components/paid-reading-experience.test.tsx
~~~

- [ ] **Step 5: Return an explicit password-auth result**

In auth.ts, use:

~~~ts
export type AccountCompletionResult = "login" | "register";

export type LoginOrRegisterResult = {
  user: SessionUser;
  accountResult: AccountCompletionResult;
};
~~~

Make loginOrRegister return register when it creates a new user (and in no-DB demo creation), and login for every existing-user branch. Keep session creation and 30-coin defaults unchanged.

Update loginAction to consume the result, call claimGuestChartForUserFromPath once, retain false on failure, and redirect with account plus optional claimed markers using withQueryParams. Keep redirect outside try/catch per the Next.js Server Action contract.

- [ ] **Step 6: Return the same result from Google OAuth**

Before db.user.upsert, query only whether the normalized email already exists. Set accountResult to login when it exists and register when upsert creates it. Keep Account upsert and session behavior unchanged.

Capture the boolean from claimGuestChartForUserFromPath. Build a URL from parsed.next and APP_URL, append account and optional claimed=1, preserve its hash, then redirect.

- [ ] **Step 7: Add query-marker events to the existing reporter**

In the existing route/search-param effect:

- account=login or register sends account_completed once with result and chart_id;
- claimed=1 sends guest_chart_claimed once with chart_id;
- checkout=cancelled sends checkout_cancelled once with payment_method payos;
- checkout values error, unavailable, invalid, forbidden, or disabled send checkout_failed once with reason and no transaction_id.

Use the existing sendOnce/localStorage mechanism. Dedupe with the chart plus stable result/reason/order code; do not create another storage layer.

In the submit handler, add:

~~~ts
payment_method: form.dataset.adMethod,
~~~

In the view handler, read data-reading-id, include it in the dedupe key, and send reading_id in the payload.

- [ ] **Step 8: Normalize FULL checkout markers**

On the PayOS form:

~~~text
data-ad-event="begin_checkout"
data-ad-method="payos"
~~~

On the sufficient-coin form:

~~~text
data-ad-event="begin_checkout"
data-ad-method="coins"
~~~

Keep the later paid_reading_request event tied to a created Reading/generating marker; it is not a replacement for begin_checkout.

Change checkoutFullReadingAction cancelPath to return to the same chart with checkout=cancelled. Keep verified purchase reporting unchanged.

- [ ] **Step 9: Mark a completed reading without changing its state source**

Add data-ad-view reading_completed and data-reading-id to the PaidReadingExperience root. The component is already rendered from a COMPLETED Reading; the database remains the state source of truth. Do not fire completion from a timer or generation request.

- [ ] **Step 10: Run focused tests and confirm GREEN**

~~~powershell
npm test -- src/app/login-claim-guest-chart.test.ts src/components/google-ads-tracking.test.ts src/components/paid-reading-experience.test.tsx
~~~

- [ ] **Step 11: Commit the instrumentation slice**

~~~powershell
git add -- src/app/login-claim-guest-chart.test.ts src/components/google-ads-tracking.test.ts src/components/paid-reading-experience.test.tsx src/lib/auth.ts src/app/actions.ts src/app/api/oauth/google/callback/route.ts src/components/google-ads-event-reporter.tsx src/components/premium-reading-cta.tsx src/components/paid-reading-experience.tsx
git commit -m "feat: measure the paid reading funnel"
~~~

### Task 5: Enforce chart ownership in every shared coin unlock path

**Files:**

- Modify: src/lib/reading-unlock.test.ts
- Modify: src/lib/reading-unlock.ts
- Modify: src/app/actions.ts

- [ ] **Step 1: Extend the test dependency harness with chart ownership**

Add chartOwnerId to the existing createDeps options and return userId from getChart. Default it to the acting user so existing tests keep their intended setup.

- [ ] **Step 2: Add a table-driven foreign-owner regression test**

Run the same assertion against:

- startFullReadingJobForUser;
- unlockReadingForUser;
- unlockReadingBundleForUser.

For a normal user and a chart owned by another user, require:

~~~ts
expect(result).toEqual({ status: "forbidden" });
expect(adjustCoins).not.toHaveBeenCalled();
expect(createPendingReading).not.toHaveBeenCalled();
expect(generateReading).not.toHaveBeenCalled();
expect(saveReading).not.toHaveBeenCalled();
~~~

Repeat for an unowned chart if an authenticated user attempts a direct coin unlock. Add one admin case proving the intentional bypass still works.

- [ ] **Step 3: Run the focused test and confirm RED**

~~~powershell
npm test -- src/lib/reading-unlock.test.ts
~~~

- [ ] **Step 4: Add one internal shared guard**

Extend ChartRecord with userId and add one private helper:

~~~ts
function canUnlockChart(chart: ChartRecord, user: SessionUser) {
  return user.role === "ADMIN" || chart.userId === user.id;
}
~~~

Add status forbidden to the three result unions. Immediately after each getChart/existence check and before cached access, balance lookup, debit, generation, or save:

~~~ts
if (!canUnlockChart(chartRecord, user)) {
  return { status: "forbidden" };
}
~~~

Do not duplicate ownership checks in UI components as the security boundary.

- [ ] **Step 5: Handle forbidden in every action caller**

In requestReadingAction, its FULL branch, and requestReadingBundleAction, redirect a forbidden result to the same safe next path with paid=forbidden before dereferencing readingId. Do not revalidate or mutate state.

- [ ] **Step 6: Run the focused test and confirm GREEN**

~~~powershell
npm test -- src/lib/reading-unlock.test.ts
~~~

- [ ] **Step 7: Commit the authorization fix**

~~~powershell
git add -- src/lib/reading-unlock.test.ts src/lib/reading-unlock.ts src/app/actions.ts
git commit -m "fix: enforce reading unlock ownership"
~~~

### Task 6: Retry an already-paid failed FULL Reading without another charge

**Files:**

- Modify: src/app/api/readings/[id]/process/route.test.ts
- Modify: src/lib/payos-reading.test.ts
- Modify: src/app/actions-full-checkout.test.ts
- Modify: src/app/api/webhooks/payos/route.test.ts
- Modify: src/app/api/readings/[id]/process/route.ts
- Modify: src/lib/payos.ts
- Modify: src/app/actions.ts
- Modify: src/app/api/webhooks/payos/route.ts

- [ ] **Step 1: Write the prompt-metadata preservation regression**

Give the process-route fixture:

~~~ts
promptMeta: {
  source: "direct-full-checkout",
  paymentOrderId: "order-paid-1",
}
~~~

Require every updateReadingJobProgress, completeReadingJob, and failReadingJob metadata object to retain paymentOrderId and source while adding phase/progress/error data.

- [ ] **Step 2: Write the paid-entitlement retry tests**

In payos-reading.test.ts, add:

1. A FAILED FULL Reading with promptMeta.paymentOrderId pointing to the same user's PAID PaymentOrder whose preserved metadata is FULL/all for the same chart. Require retry to reset the same Reading to PENDING, clear its error, and return the same readingId.
2. Wrong user, non-PAID order, missing paidAt, wrong chart, wrong type/scope, missing paymentOrderId, and non-FAILED Reading. Each returns null and performs no Reading update.

Require no paymentOrder.create call in all retry cases.

- [ ] **Step 3: Write the checkout ordering contract**

In actions-full-checkout.test.ts, require the paid retry helper to run for a FAILED job after cached/PENDING handling but before createPayOSCustomCheckout and before paymentOrder.create. Require a successful retry redirect to the same advanced-reading URL with the same readingId and generating=1.

- [ ] **Step 4: Write the non-paid webhook metadata test**

Seed a PaymentOrder rawPayload containing directReading or quickReading metadata. For a valid signed webhook whose payment state is not paid, require:

- status becomes FAILED when appropriate;
- the callback body is stored under raw;
- the original reading metadata kind, chartId, type FULL, and scopeKey all remain present.

Keep the existing invalid-signature and idempotent paid tests.

- [ ] **Step 5: Run focused tests and confirm RED**

~~~powershell
npm test -- "src/app/api/readings/[id]/process/route.test.ts" src/lib/payos-reading.test.ts src/app/actions-full-checkout.test.ts src/app/api/webhooks/payos/route.test.ts
~~~

- [ ] **Step 6: Preserve entitlement metadata through processing**

At the start of runFullReadingJob, derive:

~~~ts
const persistedPromptMeta = isRecord(reading.promptMeta)
  ? reading.promptMeta
  : {};
~~~

Merge it into:

- the initial processing metadata;
- every progressMeta callback result;
- completed metadata;
- failed metadata.

Put phase-specific fields last, but ensure parsed generated prompt metadata cannot overwrite paymentOrderId. Keep progress, refund, and lock behavior unchanged.

- [ ] **Step 7: Add one focused paid retry helper**

In payos.ts, add:

~~~ts
export async function retryPaidFullReading(
  db: PrismaClient,
  params: {
    userId: string;
    chartId: string;
    readingId: string;
    status: string;
    promptMeta: unknown;
  },
)
~~~

The helper must:

1. require status FAILED;
2. read a string paymentOrderId only from a record-shaped promptMeta;
3. find that exact PaymentOrder by id and userId with status PAID and paidAt not null;
4. parse order.rawPayload with paidReadingOrderPayload;
5. require matching chartId, type FULL, and scopeKey all;
6. call the existing completePaidReadingOrder transaction;
7. return the result only when its readingId equals params.readingId.

Do not create a new entitlement model or duplicate the settlement transaction.

- [ ] **Step 8: Reuse entitlement before creating checkout**

Move getDb early enough in checkoutFullReadingAction to use it before calling createPayOSCustomCheckout.

After the cached and PENDING redirects:

- if the scoped Reading is FAILED and db exists, call retryPaidFullReading;
- on a valid result, redirect to the same advanced-reading route with its existing readingId and generating=1;
- on null, continue through the current normal checkout path.

Do not create a PaymentOrder or payment link on successful retry.

- [ ] **Step 9: Preserve FULL metadata on non-paid webhook callbacks**

Import paidReadingOrderPayload in the webhook route. Before updating a non-paid order, parse its current rawPayload.

If it contains paid-reading metadata, store:

~~~ts
{
  raw: payload,
  [metadata.kind]: {
    chartId: metadata.chartId,
    type: metadata.type,
    scopeKey: metadata.scopeKey,
  },
}
~~~

Otherwise retain the current top-up behavior. This is limited to preserving existing FULL context; do not broaden the task to unrelated PayOS endpoint hardening.

- [ ] **Step 10: Run focused tests and confirm GREEN**

~~~powershell
npm test -- "src/app/api/readings/[id]/process/route.test.ts" src/lib/payos-reading.test.ts src/app/actions-full-checkout.test.ts src/app/api/webhooks/payos/route.test.ts
~~~

- [ ] **Step 11: Preserve the legacy safety boundary**

Do not backfill or infer paymentOrderId for pre-release FAILED rows. A legacy row without the exact persisted order link must fail the retry proof and continue to the normal checkout path. Record this limitation in the implementation handoff; any production reconciliation is a separate, explicitly approved data task.

- [ ] **Step 12: Commit the entitlement fix**

~~~powershell
git add -- "src/app/api/readings/[id]/process/route.test.ts" src/lib/payos-reading.test.ts src/app/actions-full-checkout.test.ts src/app/api/webhooks/payos/route.test.ts "src/app/api/readings/[id]/process/route.ts" src/lib/payos.ts src/app/actions.ts src/app/api/webhooks/payos/route.ts
git commit -m "fix: reuse paid full reading entitlement"
~~~

### Task 7: Run the complete local quality and browser gate

**Files:**

- Verify all files changed in Tasks 1–6
- No new production files expected

- [ ] **Step 1: Run all focused suites together**

~~~powershell
npm test -- src/lib/free-overview-engine.test.ts src/lib/free-overview-presentation.test.ts src/lib/ai.test.ts src/lib/free-overview-status.test.ts "src/app/api/charts/[id]/free-overview/route.test.ts" src/components/markdown-content.test.ts src/components/reading-typography.test.ts src/components/free-overview-loader.test.ts src/components/personalized-report-outline.test.ts src/components/assistant-access-ui.test.ts src/app/login-claim-guest-chart.test.ts src/components/google-ads-tracking.test.ts src/components/paid-reading-experience.test.tsx src/lib/reading-unlock.test.ts "src/app/api/readings/[id]/process/route.test.ts" src/lib/payos-reading.test.ts src/app/actions-full-checkout.test.ts src/app/api/webhooks/payos/route.test.ts
~~~

- [ ] **Step 2: Run the project verification ladder**

~~~powershell
npm run lint
npm test
npm run build
git diff --check
~~~

All commands must exit 0. Investigate any failure; do not label pre-existing failures without reproducing them against the pre-change commit.

- [ ] **Step 3: Start local production-like rendering on port 4000**

Use the repository-documented local command and a fresh browser context. Test desktop and a mobile viewport.

- [ ] **Step 4: Verify the guest flow locally**

Create/open an unowned chart and confirm:

- quick read is 80–120 words;
- visible free content is 800–950 words and ends after a complete bridge paragraph;
- H2 sections 3 and 4 are absent from HTML and the guest API response;
- all semantic callouts are readable, left-aligned, approximately 72ch on desktop, one column on mobile, and do not overflow;
- the semantic foreground/background pairs measure at least 4.5:1 contrast;
- save CTA includes the person's name, free wording, 30-coin help, Google option, and no-payment reassurance;
- FULL offer, all nine chapter names, and 199,000đ are visible;
- neither guest CTA opens checkout.

- [ ] **Step 5: Verify claim and owner flow locally**

Using a safe QA identity, complete password authentication and one Google-path fixture/integration as available. Confirm:

- the guest chart is claimed only once;
- the return URL points to the same chart/context;
- all four sections appear and total 1,400–1,650 words;
- the owner FULL CTA opens the payment modal;
- a signed-in non-owner remains at 2/4 and cannot open the modal or spend coins.

- [ ] **Step 6: Verify analytics requests locally**

With Checkpoint A's working collection shape, inspect gtag commands/events and require:

- free_overview_viewed;
- login_gate_viewed and login_gate_clicked;
- account_completed with result login/register only;
- guest_chart_claimed only after a true claim;
- full_offer_viewed and owner-only full_offer_clicked;
- begin_checkout with payment_method payos or coins;
- checkout_cancelled/checkout_failed without transaction_id;
- reading_completed deduped by reading ID;
- purchase still depends on verified PaymentOrder PAID.

- [ ] **Step 7: Verify paid failure behavior without charging**

Use mocked/test data to confirm:

- a paid FAILED Reading resets to PENDING on the same reading ID;
- no second PaymentOrder or checkout link is created;
- an invalid entitlement follows normal checkout;
- a foreign chart attempt changes neither balance nor Reading rows.

### Task 8: Ship Checkpoint B and verify production

**Files:**

- Verify: scripts/release-production.ps1
- Verify: docs/agent/playbooks.md
- No additional runtime edits expected

- [ ] **Step 1: Review the release range**

~~~powershell
git status --short --branch
git log --oneline --decorate -8
git diff --stat HEAD~6..HEAD
~~~

Confirm only the approved funnel, free-reading, instrumentation, ownership, and entitlement slices are included.

- [ ] **Step 2: Deploy through the real release path**

~~~powershell
npm run ship
~~~

Require origin/master push, clean VPS build, current-release switch, PM2 lasotinhhoa restart, and public HTTP verification.

- [ ] **Step 3: Confirm deployed revision and service health**

Record:

- local and remote commit hashes;
- /opt/lasotinhhoa/current target;
- PM2 process state;
- public responses for the home page, a chart page, login path, and payment status endpoint without exposing secrets.

- [ ] **Step 4: Repeat GA4 collection proof on production**

In a fresh profile, confirm initial page_view and one new custom funnel event both produce g/collect requests with tid=G-5JSNC2T5G0 and no tag console error. This verifies the larger release did not regress Checkpoint A.

- [ ] **Step 5: Run production guest and owner visual smoke**

On desktop and mobile, verify the same content boundaries, semantic styling, guest save CTA, nine-chapter/199,000đ offer, and owner-only modal behavior from Task 7. Confirm no hidden H2 section 3/4 is present for the guest.

- [ ] **Step 6: Verify cancel and retry safely**

Open the PayOS path only far enough to confirm begin_checkout and the correct cancel return marker; do not pay. Use existing mocked/authorized failed-reading test data for retry proof. Confirm no unexpected console error.

- [ ] **Step 7: Capture the release baseline**

Record the production timestamp in Asia/Bangkok. Use existing database facts for charts, account linkage, PaymentOrder, and Reading completion; use GA4 for view/click/checkout intent. Separate PayOS/direct VND from coin unlocks in reporting.

- [ ] **Step 8: Start the approved measurement window**

Compare the 14 days before and after the Checkpoint B timestamp, then confirm again at 30 days. Track at minimum:

- free_overview_viewed to login_gate_clicked;
- login_gate_clicked to account_completed;
- account_completed to guest_chart_claimed;
- full_offer_viewed to full_offer_clicked;
- full_offer_clicked to begin_checkout;
- begin_checkout to verified purchase;
- purchase to reading_completed.

Do not compare pre-Checkpoint-A GA4 hits as trustworthy history. If conversion clearly worsens, roll back the UI/content slice while retaining the GA4 repair and security guards.
