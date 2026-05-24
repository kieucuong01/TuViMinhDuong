# AI Agent Context

This folder keeps the high-signal context for future AI agents. It is inspired by three useful patterns:

- `AGENTS.md` as a short router to the real source of truth.
- Skill-style playbooks: load the right small guide only when the task needs it.
- Goal-driven execution: define the expected behavior and verification before editing.

## Product Snapshot

- Brand: **Lá số tinh hoa**
- Domain chính: `lasotinhhoa.vn`
- Domain Vercel dự phòng: `tu-vi-minh-duong.vercel.app`
- Audience: Vietnamese adults, mostly 30-60, who want a clear tử vi chart and plain-language readings.
- Main conversion: create a free chart first, then open paid full readings.
- UX tone: calm, readable, trustworthy, less "AI/SaaS", more "easy tử vi tool".

## Stack

- Next.js `16.2.6` App Router, React `19.2.4`, TypeScript
- Tailwind CSS v4, `lucide-react`
- Server Actions and Route Handlers
- Prisma `7.8.0` with PostgreSQL
- Email/password auth, optional Google OAuth by env
- PayOS/VietQR checkout and webhook
- AI SDK `ai` plus fallback template readings
- Vitest, ESLint, TypeScript checks
- Vercel deploy target

## Core Flows

- Home: form-first chart creation, date fortune teaser, simplified copy for older readers.
- Chart: free chart view, mobile-readable accordion, sticky paid CTA that must not cover content.
- History: `/la-so` lists saved charts for the current account.
- Paid readings: coin gated for normal users and guests; admins can view everything.
- Date fortune: `src/lib/date-fortune.ts` calculates truc, hoang/hac dao, sao, xung hop, and activity advice.
- CMS: admin article editing with SEO score and public article pages at `/kien-thuc-tu-vi/[slug]`.
- Payment: PayOS checkout/webhook credits coins idempotently; `CoinLedger` is the source of truth.

## Architecture Map

- `src/app/page.tsx`: homepage composition.
- `src/app/actions.ts`: chart creation and server-side mutations.
- `src/app/la-so/[id]/page.tsx`: chart detail page.
- `src/app/la-so/[id]/nang-cao/page.tsx`: advanced paid reading page.
- `src/components/chart-board.tsx`: desktop/mobile chart rendering.
- `src/components/chart-form.tsx`: public chart input form.
- `src/components/global-loading-toast.tsx`: global loading feedback for navigations/forms.
- `src/components/loading-submit-button.tsx`: submit button state for server-action forms.
- `src/lib/chart.ts`: tử vi chart engine.
- `src/lib/chart.fixtures.ts`: golden chart fixtures.
- `src/lib/date-fortune.ts`: date fortune engine.
- `src/lib/data.ts`: DB-backed repositories with demo fallbacks.
- `src/lib/seo.ts`: SEO scoring and metadata helpers.
- `prisma/schema.prisma`: data model.

## Domain Invariants

- Timezone is `Asia/Bangkok`.
- Chart pages are personal/private by default; avoid indexing personal chart URLs unless the user asks.
- The chart engine must return structured JSON that AI readings can cite. Do not let AI recalculate the chart.
- Coin balance is cached on `User.coinBalance`; transaction history lives in `CoinLedger`.
- Paid readings should be cached by user/chart/type/scope so repeat views do not charge again.
- If payment or AI generation fails after charging, preserve an audit trail and refund via ledger transaction.

## Agent Workflow

1. Start with the relevant playbook, not a full repo scan.
2. Use `rg` / `rg --files` to find code.
3. Inspect current patterns before inventing new components or abstractions.
4. Edit with `apply_patch`.
5. Run the smallest verification ladder that proves the requested behavior.
6. Update these docs when a major flow, route, brand, payment rule, or engine invariant changes.

## Planning And Test Docs

- `docs/agent/current-state.md`: latest project snapshot, known stable areas, risky areas, and next recommended work.
- `docs/roadmap.md`: module roadmap, priorities, and what "done" means before selling harder.
- `docs/backlog.md`: prioritized P0/P1/P2 task queue for "làm tiếp đi" style requests.
- `docs/agent/test-strategy.md`: test pyramid, TDD rules by module, E2E smoke plan, and production smoke checklist.
- `docs/agent/task-template.md`: compact task format for scoping future work.
