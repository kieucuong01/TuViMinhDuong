# P1D Continuous Integration Guardrails Plan

**Goal:** Make every pull request and `master` push prove install, lint, tests, build, and high-severity dependency health, while adding a scheduled/manual browser smoke that cannot create a real charge or mutate production.

## Task 1: Lock the workflow contracts

- Add source tests for workflow triggers, least-privilege permissions, Node 24, deterministic `npm ci`, lint/test/build, high-severity audit, timeouts, and concurrency.
- Require scheduled/manual E2E to use the local app, no production base URL, no payment credentials, and one explicitly read-only spec.

## Task 2: Add the required CI workflow

- Trigger on pull requests and pushes to `master`.
- Use `actions/checkout@v4`, `actions/setup-node@v4`, Node 24, npm cache, `npm ci`, `npm audit --audit-level=high`, `npm run lint`, `npm test`, and `npm run build`.
- Keep permissions read-only and cancel superseded runs for the same ref.

## Task 3: Add safe scheduled/manual browser smoke

- Add a Playwright spec that only reads public local routes and changes local UI controls; it must not submit chart/auth/CMS/payment forms.
- Run both configured desktop and mobile Chromium projects against the automatically started local server.
- Explicitly disable LLM and PayOS configuration and upload Playwright reports only as diagnostic artifacts.

## Task 4: Verify and checkpoint P1D

- Run the workflow contract test and the safe Playwright spec locally when Chromium is available.
- Run lint, full tests, build, and `git diff --check`.
- Commit P1D separately without changing the existing weekly Lighthouse workflow.

## Results

- Added a least-privilege Node 24 CI workflow for pull requests and `master` pushes with deterministic install, high-severity dependency audit, lint, tests, and production build.
- Added a scheduled/manual Playwright workflow that starts only the local app, blanks PayOS credentials, disables LLM calls, and runs a dedicated read-only public journey on desktop and mobile Chromium.
- Workflow contract tests: 3 passed.
- Safe browser smoke: 6 passed across desktop and mobile Chromium.
- Full verification: lint passed; 155 test files and 817 tests passed; production build generated 552 pages.
- `npm audit` remains enforced in GitHub CI. A local audit was not rerun because the sandbox would need to transmit the private dependency tree to the npm registry and approval was not granted.
