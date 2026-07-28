# Lifetime Hub Search-First Design

## Goal

Make `/xem-tu-vi-tron-doi` help a reader reach the right birth-year content immediately, while preserving the existing astrology content, article URLs, SEO index coverage, chart funnel, and payment boundaries.

## Approved Scope

- Move the age search to the first position in the lifetime-reading section.
- Make the hero primary CTA land directly on the search experience.
- Preserve filtering by year, can chi, and gender.
- Persist the query and page in the URL so reload, sharing, and browser navigation keep the current state.
- Replace the 14-button mobile pager with a compact pager.
- Replace dead-end no-result copy with an honest coverage message and a chart-creation path.
- Rename the hard-coded popularity block to a neutral suggestion block.
- Remove user-facing implementation language about crawlers, routes, and unfinished work.
- Collapse secondary card sections and the decade directory by default to reduce mobile page length.
- Announce result-count changes to assistive technology.

## Non-Goals

- Do not change chart calculation, can-chi rules, article content, pricing, authentication, coins, PayOS, or paid-reading gates.
- Do not create missing lifetime articles in this release.
- Do not add analytics, a database query, or a new API.
- Do not redesign the global header, footer, or other routes.

## Information Architecture

The section order becomes:

1. Section heading and explanation.
2. Search controls and result count.
3. Filtered/default lifetime cards.
4. Suggested ages, clearly labeled as editorial suggestions rather than live popularity.
5. Collapsed full directory by decade.
6. Existing deeper-reading, related-content, and FAQ sections.

The hero primary CTA points to `#tim-tuoi`, which is the search container. This removes the current multi-screen gap between the CTA destination and the input.

## Search and URL State

- Query parameter `q` stores the search text.
- Query parameter `page` stores pages greater than 1.
- Typing replaces the current history entry and resets `page` to 1.
- Paging creates a history entry, allowing Back and Forward to restore earlier pages.
- Empty values are removed from the URL.
- Filtering remains accent-insensitive and searches title, year, can chi, and gender.
- Result count uses `role="status"` and `aria-live="polite"`.

## Result and Empty States

- Cards keep the image, identity badges, title, and overview visible.
- Work/money, family/relationship, and caution content moves into a native `<details>` disclosure with a large summary control.
- A zero-result state says that the requested age is not yet available rather than asking the reader to retry a valid year.
- The zero-result state offers two next actions: clear the search or create a personal chart.
- Coverage copy is derived from the available cards and states that the library is still incomplete.

## Pagination

The pager always keeps Previous and Next, while the numbered area shows:

- all pages when the total is seven or fewer;
- first page, last page, current page, and adjacent pages for larger totals;
- non-interactive ellipses for skipped ranges.

All controls retain native button semantics, disabled states, `aria-current`, and at least the existing touch-target size.

## Rendering and Performance

- The page stays statically rendered and keeps the server-rendered directory for discovery.
- The URL-aware client component is wrapped in `Suspense`, as required by Next.js 16 for `useSearchParams`.
- No new dependency is added.
- Filtering logic and pagination-token generation live in a small pure helper module with focused tests.
- The first render still contains six compact cards, but collapsed secondary sections substantially reduce initial mobile length.

## Verification

- Unit tests prove accent-insensitive filtering, URL parsing/building, and compact pagination tokens.
- Source-level route tests prove search-first ordering, honest copy, Suspense wrapping, CTA target, no internal crawler language, and accessibility status.
- Run focused tests, full lint, full test suite, and production build with the bundled Node runtime.
- Browser QA covers desktop and 375px mobile: page identity, no overlay, console health, CTA landing, search result, no-result state, URL persistence, pagination, touch targets, horizontal overflow, and screenshots.
- Release through `npm run ship`, then verify GitHub master, VPS PM2/current release, and the public route.
