# P2A Payment Reconciliation Plan

**Goal:** Turn stale pending PayOS orders into an observable, safely reconcilable queue without creating a second path that can grant paid access.

## Safety invariants

- The command is dry-run by default and never talks to PayOS without configured credentials.
- Reconciliation may move only a database `PENDING` order to a provider-confirmed unpaid terminal state: `CANCELLED`, `EXPIRED`, or `FAILED`.
- A provider `PAID` response is reported for the existing verified settlement path; reconciliation itself never writes `PAID`, `paidAt`, coins, ledger entries, or readings.
- Provider order code and amount must match the stored order before any update.
- Every applied update uses a conditional `status: PENDING` write so a concurrent webhook cannot be overwritten.

## Task 1: Lock policy and runner behavior with tests

- Cover terminal-state mapping, processing/pending no-op, paid handoff, order/amount mismatch, provider failures and retries, dry-run, and concurrent paid immutability.
- Cover pending-order age buckets and latest reconciliation outcome formatting for admin.

## Task 2: Add bounded reconciliation infrastructure

- Add an append-only summary model for applied runs and its migration.
- Add a pure reconciliation policy, retrying PayOS reader, bounded runner, and `payments:reconcile` CLI.
- Keep the command dry-run unless `--apply` is explicitly present; expose age threshold and batch limit with conservative bounds.

## Task 3: Make payment hygiene visible to admin

- Show pending counts and amounts for under 24 hours, 24-72 hours, and over 72 hours.
- Show the latest applied run with scanned, updated, unchanged, paid-observed, mismatch, and provider-error outcomes.

## Task 4: Verify and checkpoint P2A

- Generate Prisma client and validate schema.
- Run targeted tests, lint, full tests, production build, and `git diff --check`.
- Commit P2A separately; do not run reconciliation against production in this implementation task.

## Results

- Added a dry-run-first `payments:reconcile` command with bounded age/limit arguments, three-attempt provider reads, identifier and amount checks, and conditional pending-only updates.
- Added an append-only summary for applied runs and an admin panel with under-24-hour, 24-72-hour, and over-72-hour pending buckets plus the latest reconciliation outcomes.
- A provider `PAID` observation is counted for operator attention but cannot be written by this runner; the existing verified webhook/status settlement remains the only paid-access path.
- PayOS mapping was checked against the official API and return-URL documentation. The documented active states are `PENDING`, `PROCESSING`, `PAID`, and `CANCELLED`; the policy also safely accepts `EXPIRED` or `FAILED` only if the provider explicitly returns either terminal value.
- Prisma schema format/validation and client generation passed; the command syntax and default dry-run arguments were verified without connecting to a database or PayOS.
- Targeted verification: 3 files and 16 tests passed. Full verification: lint passed; 157 test files and 831 tests passed; production build generated 552 pages.
- No production reconciliation, migration, push, or deploy was performed in this slice.
