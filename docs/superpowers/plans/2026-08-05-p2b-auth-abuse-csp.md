# P2B Auth Abuse Controls and CSP Plan

**Goal:** Make login and magic-link throttling effective across PM2 workers without retaining raw IP addresses, then remove production `unsafe-eval` while preserving the app and Google measurement path.

## Task 1: Lock distributed limiter behavior with tests

- Keep the existing in-process limiter for low-risk telemetry, but route login and magic-link attempts through an asynchronous database-backed fixed window.
- Test HMAC-only keys, fixed-window increments, expiry cleanup, no-database fallback, database-failure fail-closed behavior, and route/action integration.

## Task 2: Add the shared rate-limit store

- Add a `RateLimitBucket` model keyed by HMAC digest plus window start, with expiry index and migration.
- Use `RATE_LIMIT_HMAC_KEY`, then `AUTH_SECRET`, with a development-only fallback; never persist or log raw/normalized IPs.
- Use atomic Prisma upsert increments so separate PM2 workers share one counter.

## Task 3: Remove production `unsafe-eval`

- Follow the bundled Next.js 16 CSP guide: retain `unsafe-eval` only for `next dev`, where React debugging requires it; omit it in production/test header configuration.
- Keep the existing static-generation-friendly header approach and existing Google script/connect/frame allowlist.

## Task 4: Verify and checkpoint P2B

- Format/validate/generate Prisma, then run targeted security tests, lint, full tests, and production build.
- Start the production build locally and run a browser smoke that asserts the delivered CSP omits `unsafe-eval`, the page has no CSP/uncaught errors, and the deferred Google tag script path remains present.
- Commit separately; do not migrate, push, or deploy production in this slice.

## Results

- Login and magic-link attempts now use a database-backed fixed window with atomic upsert increments shared across PM2 workers. The previous in-memory limiter remains only as the no-database development fallback and for low-risk telemetry.
- Stored keys are scope-separated SHA-256 HMAC digests; raw and normalized IP addresses are never written to the rate-limit table. Production requires `RATE_LIMIT_HMAC_KEY` or the existing `AUTH_SECRET`.
- Expired buckets are cleaned periodically. A configured store failure fails auth closed instead of silently disabling throttling.
- Following the bundled Next.js 16 CSP guide, `unsafe-eval` remains available only under `next dev`; the production header omits it while preserving the existing Google script/connect/frame allowlist and static generation.
- The scheduled safe browser workflow now builds and starts the production app, then runs both read-only journeys and a CSP/Google-tag check.
- Prisma format/validation and client generation passed. Targeted security verification: 4 files and 15 tests passed. Full verification: lint passed; 159 test files and 839 tests passed; production build generated 552 pages.
- Production-build browser verification: 8/8 passed across desktop and mobile Chromium. The Google tag request was intercepted locally, so no analytics payload was sent externally.
- No production migration, push, or deploy was performed in this slice.
