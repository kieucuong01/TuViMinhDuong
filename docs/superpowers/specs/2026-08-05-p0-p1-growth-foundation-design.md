# P0/P1 Growth Foundation Design

## Goal

Complete two independent production slices in order:

1. P0 restores the SEO automation contract, removes the current high-severity dependency advisory, and releases the accumulated `origin/master` data/performance work through the clean production path.
2. P1 adds a privacy-safe GA4 funnel for `/tuong-hop-la-so` and `/tu-vi-tai-loc-dau-tu`, then releases it only after P0 is proven on production.

## P0 Design

`scripts/seo/seo-autopilot-snapshot.mjs` remains the public wrapper for both CLI use and programmatic imports. It will re-export `buildSnapshot` from `seo-autopilot-snapshot-runner.mjs`; planner and executor keep importing the wrapper. The existing networking test will import `buildSnapshot` through the public wrapper so the exact regression cannot recur unnoticed.

The `fast-uri` advisory will be removed by the smallest lockfile-only dependency resolution accepted by `npm audit fix`. No application dependency or API is added. Verification uses Node 24 for npm itself and every lifecycle child process.

P0 is released from a clean checkout. Required proof is: local lint/tests/build, working SEO planner against production with Search Console, zero high/critical production dependency advisories, pushed SHA, matching `/opt/lasotinhhoa/current/.release-commit`, PM2 cwd under that release, and public smoke checks.

## P1 Event Contract

The funnel uses these event names:

- Compatibility: `compatibility_tool_view`, `compatibility_submit`, `compatibility_result`, `compatibility_edit`, `compatibility_evidence_open`, `compatibility_chart_cta`.
- Wealth: `wealth_tool_view`, `wealth_submit`, `wealth_result`, `wealth_evidence_click`, `wealth_next_step`.

`trackOrganicToolEvent` will use a per-event allowlist. Unknown keys are discarded even when their spelling was not anticipated. Names, dates, gender, email, phone, chart/user/reading identifiers, free text, and full URLs are never permitted. Allowed dimensions are bounded categorical values such as `result_level`, `theme_key`, `cta_position`, `entry_state`, `target_palace`, and `next_step`.

## P1 Architecture

`ChartCompatibilityTool` remains the existing client component. It records view, submit, successful result, edit, evidence-open and CTA events at the interaction that owns the state. No birth profile value is passed to analytics.

The wealth report stays server-rendered. A small global `OrganicToolEventReporter` mounted beside the existing Google tag reporter handles:

- route views for the wealth landing and `?view=tai-loc` result;
- delegated submit events from `ChartForm` data attributes;
- delegated click events from the three server-rendered palace evidence links.

One evidence-link click emits the diagnostic `wealth_evidence_click` event and the aggregate funnel event `wealth_next_step` with `next_step=palace_reference`. This avoids turning the full wealth report into a client component and preserves current rendering performance.

## Security And Privacy

The trust boundary is the DOM and all form/profile data entered by the visitor. Analytics is a third-party data sink. The main disclosure threat is an accidental new parameter key bypassing a deny-list. A strict allowlist prevents that class of leak. The reporter never reads form values; it reads only developer-authored `data-*` categorical metadata.

No authentication, payment, chart ownership, persistence, consent storage, Google Ads conversion labels, or purchase verification logic changes. Existing `purchase` behavior remains gated by verified payment status.

## Verification

Each slice follows RED -> GREEN with focused Vitest tests. P0 and P1 each run full lint, all tests and production build before release. P1 additionally receives local desktop/mobile browser verification and production event-source/route smoke. Real GA4 ingestion visibility can lag; code-level calls and loaded production tag are the immediate release evidence, while GA4 Realtime is the operational follow-up surface.
