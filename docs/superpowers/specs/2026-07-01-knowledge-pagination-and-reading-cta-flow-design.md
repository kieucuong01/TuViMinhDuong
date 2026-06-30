# Knowledge Pagination and Reading CTA Flow Design

## Goal

Improve two reader journeys without changing pricing or authorization rules:

1. Desktop pagination on `/kien-thuc-tu-vi` replaces only the article cards, updates the URL, and scrolls the reader to the start of the list without a full document reload.
2. Reading CTAs preserve the reader's position through login and reuse the existing `PremiumReadingCta` confirmation form before any coins are deducted.

## Current State

- `KnowledgeArticleList` already receives the first server-rendered page and uses `/api/knowledge-articles` to append later pages on mobile.
- Desktop previous/next controls are ordinary Next.js links, so the whole route is rendered again.
- `FreeOverviewLoader` sends guests to `/dang-nhap` and sends signed-in readers to `/la-so/[id]/nang-cao`, which breaks the in-page reading flow.
- `PersonalizedReportOutline` and `AssistantWidget` link to `#mo-khoa-ho-so-vip`, but that anchor only moves the viewport. It does not open the existing confirmation popover.
- `PremiumReadingCta` already owns the correct `requestReadingAction` form and is the only UI in this flow that should initiate coin deduction.

## Considered Approaches

### A. Reuse the article API and existing confirmation form

Intercept desktop pagination links, fetch the requested page through the existing internal API, replace the card collection, update browser history, and scroll to the list. Convert unlock anchors into triggers for the existing confirmation popover.

This is the selected approach. It is small, keeps no-JavaScript link fallback for pagination, avoids a second purchase implementation, and preserves all server-side authorization and coin checks.

### B. Use `router.push` for pagination and add route-level loading UI

This would keep navigation inside Next.js, but the server route and surrounding page content would still be refreshed. It does not meet the requirement to load only the article list as directly as approach A.

### C. Create a second client-side unlock form for every CTA

This would make each CTA self-contained, but it duplicates hidden fields, analytics attributes, pending-state behavior, and purchase logic. It also raises the risk of inconsistent coin-deduction behavior, so it is rejected.

## Pagination Design

`KnowledgeArticleList` remains initialized from server-rendered props for SEO and first-load performance.

- Give the article-list region a stable scroll target and focusable status boundary.
- Keep previous/next controls as links for progressive enhancement.
- Intercept normal primary-button navigation in the client component.
- Fetch `/api/knowledge-articles?page=N&pageSize=6` while preserving `category`.
- On success:
  - replace, rather than append, the desktop article collection;
  - update the current page and total-page state;
  - call `history.pushState` with the canonical page/category URL;
  - scroll the list region into view with smooth behavior, respecting reduced-motion preferences;
  - restore focus to the list heading/status boundary for keyboard and screen-reader continuity.
- Disable pagination controls and expose a Vietnamese loading status during the request.
- On failure, retain the current cards and expose a retryable error state.
- Listen for `popstate` so browser Back/Forward restores the correct article page without a document reload.
- Preserve the existing mobile infinite-append behavior. Mobile loads use the next page after the currently displayed collection and do not replace cards.

## Reading and Login Design

The stable destination is `#mo-khoa-ho-so-vip`, the section containing the existing premium reading controls.

### Guest reader

When a guest presses “Xem luận giải chi tiết”:

1. Open the existing in-page login modal using `loginModalHref`.
2. Set `next` to `/la-so/[id]#mo-khoa-ho-so-vip`.
3. After successful email/password or Google login, redirect to that URL.
4. A small hash-scroll helper runs after hydration and scrolls the destination into view, so sticky layout or delayed rendering cannot leave the reader at the top.

No paid reading request occurs during login.

### Signed-in reader

When a signed-in reader presses “Xem luận giải chi tiết”, prevent route navigation and smoothly scroll to `#mo-khoa-ho-so-vip`. The reader stays on the current chart page and keeps the reading context.

### Unlock CTAs

Locked-state buttons that currently point to `#mo-khoa-ho-so-vip` will target the deterministic popover ID already owned by `PremiumReadingCta`.

- Pressing an unlock CTA opens the existing “Xác nhận mở khóa” popover.
- The CTA itself never submits a paid action.
- Only the existing confirmation submit invokes `requestReadingAction`.
- Existing behavior for insufficient coins, disabled paid readings, admins, and previously unlocked readings remains unchanged.
- Unlocked-state links continue to open the already available reading and never charge again.

## Component Boundaries

- `src/components/knowledge-article-list.tsx`
  - Own client pagination state, history integration, loading/error state, and list scrolling.
- `src/components/reading-detail-cta.tsx`
  - Provide one reusable guest/signed-in detail CTA behavior and hash-scroll helper.
- `src/components/premium-reading-cta.tsx`
  - Continue to own the only paid confirmation form; export or share its deterministic popover ID helper.
- `src/components/personalized-report-outline.tsx`
  - Replace the locked anchor with a trigger for the shared confirmation popover.
- `src/components/assistant-widget.tsx`
  - Replace its locked anchor with the same confirmation-popover trigger.
- `src/components/free-overview-loader.tsx`
  - Use the reusable reading-detail CTA instead of routing directly to login or the advanced page.

No changes are required in `requestReadingAction`, pricing, ledger, or payment code.

## Error Handling and Accessibility

- Pagination failures do not clear the visible list.
- Loading state is announced with `aria-live`, and repeated pagination clicks are ignored while a request is active.
- Disabled previous/next controls remain non-interactive.
- Popover triggers are real buttons with explicit accessible labels.
- Smooth scrolling falls back to immediate scrolling when the reader prefers reduced motion.
- Hash targets use `scroll-margin-top` so the fixed header does not cover the destination.

## Verification

Use test-driven development:

1. Add focused tests for API-backed page replacement, URL/history updates, Back/Forward handling, and the scroll target.
2. Add focused tests for guest modal URLs preserving the hash and signed-in in-page scrolling.
3. Assert every locked `#mo-khoa-ho-so-vip` CTA targets the existing confirmation popover and does not duplicate `requestReadingAction`.
4. Run the focused tests and confirm they fail before implementation.
5. Implement the minimum changes required to pass.
6. Run `npm run lint`, the relevant component tests, the full test suite, and `npm run build`.
7. Verify desktop and mobile flows locally on port `4000`, including:
   - desktop previous/next changes cards without a full document reload;
   - list scrolling and browser Back/Forward;
   - guest login modal and post-login anchor return;
   - signed-in detail scrolling;
   - unlock CTA opens the existing confirmation form;
   - no coin deduction occurs before confirmation.

## Non-Goals

- No pricing changes.
- No bypass of login, coin balance, or paid-reading gates.
- No redesign of the article cards, login modal, or confirmation popover.
- No change to mobile infinite-scroll page size.
- No production deployment in this task unless separately requested.
