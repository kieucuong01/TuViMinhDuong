# Lifetime Hub Completion Design

Date: 2026-08-03

## Goal

Finish the next bounded release for `/xem-tu-vi-tron-doi`: make search tolerant of keyword order, keep the visible update date synchronized with the actual lifetime-content dataset, and publish complete male/female detail coverage for 1986-1989.

## Approved scope

- Search treats normalized whitespace-separated terms as an AND query. `nữ 1995` and `1995 nữ` therefore return the same card while accent-insensitive matching remains intact.
- Each generated lifetime article input owns a `contentDate`. The hub derives its displayed update date from the newest input, and the sitemap uses that same derived date. This removes the separate stale literal from the page and prevents the hub and sitemap from drifting apart.
- Add Bính Dần 1986, Đinh Mão 1987, Mậu Thìn 1988, and Kỷ Tỵ 1989 for both genders to the existing generated article/card pipeline.
- Give all eight new detail pages a distinct local 1200x675 WebP cover in the existing warm editorial visual language, with no text or watermark.
- Preserve existing routes, canonicals, card pagination, chart CTA, disclaimers, payment gates, and tử vi/date engines.

## Data flow

`adultExpansionRows` remains the single source for generated adult-year coverage. A row produces two article inputs, two hub cards, two static params, two sitemap article entries, and sibling links. The newest `contentDate` across generated lifetime inputs becomes the hub/sitemap update date.

## Verification

- Unit tests prove token-order independence, 1986-1989 gender coverage, uniqueness, sibling links, publication dates, and shared hub update date.
- Cover tests prove each referenced asset exists, is 1200x675 WebP, and remains below the repository size limit.
- Full lint, test, and production build run before release.
- Browser QA covers desktop and 390px mobile search, result counts, detail navigation, update date, console, canonical, and live sitemap.
- Deployment uses the repository's `npm run ship` GitHub-to-VPS/PM2 path and verifies the exact release commit.

## Out of scope

Analytics instrumentation, broad mobile section reordering, completing other missing year ranges, and changes to astrology calculation logic are deferred.
