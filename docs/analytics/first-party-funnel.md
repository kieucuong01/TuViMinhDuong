# First-party conversion funnel

## Purpose

This dataset answers product decisions that GA4 alone cannot answer reliably:
which acquisition sources and tools lead to a saved chart, account, checkout,
verified payment and completed reading; where the largest stage drop occurs; and
whether stale pending orders are being confused with revenue.

The canonical stages are:

`landing -> tool_view -> submit -> result -> save_intent -> account -> checkout -> paid -> reading_complete`

Client code may report only the first five stages. Account, checkout, paid and
reading completion are written by trusted server paths. `paid` is recorded only
after the existing verified PayOS settlement succeeds.

## Stored fields

- event name from the fixed stage list;
- anonymous random UUID scoped to `sessionStorage` and rotated with the browser
  session;
- authenticated user ID when a session already exists;
- chart ID only on trusted server writes for ownership joins;
- categorical source, landing class, tool, placement and result band;
- timestamp and an optional server/client retry dedupe key.

The payment-order snapshot contains only `source`, `landingClass`, `tool` and a
bounded placement value.

## Forbidden data

The funnel endpoint rejects unknown keys. It does not accept or store names,
emails, phone numbers, birth data, chart input, report text, raw referrer URLs,
raw landing URLs, UTM search terms, IP addresses, user IDs, chart IDs, arbitrary
parameter bags, or client claims of account/payment/reading completion.

## Retention and access

Events are retained for 180 days. A daily-gated best-effort prune runs during
event writes. The admin report exposes only aggregate counts and rates; it never
renders anonymous session IDs, chart IDs, user IDs or IP addresses.

## Reporting semantics

- Stage counts are distinct actors: authenticated user first, otherwise anonymous
  session.
- Conversion rate is the current stage actor count divided by the previous stage
  actor count for the selected 7- or 28-day window.
- Source/tool tables use the normalized categorical vocabulary.
- Pending orders older than 24 hours are shown separately from paid revenue.

