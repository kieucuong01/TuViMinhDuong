# Data-Driven Reading Funnel Design

**Date:** 2026-06-29

**Status:** Approved direction; written specification pending final user review

## Goal

Turn the chart result page from a lookup surface into a practical personal advisory flow:

1. show every visitor a useful 450-550 word mini-report based on their computed chart;
2. preview the complete personalized VIP report outline before purchase;
3. generate the paid report from chart evidence with DeepSeek as primary and Groq as fallback;
4. give the buyer three chart-aware AI questions after a completed full-report purchase.

The chart engine remains the only source of astrological calculations. The LLM interprets supplied chart data and must not recalculate star placement.

## Scope

### Included

- DeepSeek support in the existing LLM router.
- A fixed provider order for reading features: DeepSeek, then Groq, then deterministic data-based fallback.
- A compact, reusable evidence profile derived from the existing `TuViChart`.
- A 450-550 word free mini-report for guests and signed-in users.
- A deterministic personalized VIP table of contents.
- Revised paid-report prompts that produce a personal advisory dossier rather than generic article copy.
- Three persisted AI questions for the owner of a chart after a completed `FULL/all` reading.
- Server-side entitlement and quota enforcement.
- Focused tests, lint, build, and local desktop/mobile browser verification.
- Environment documentation for local and production configuration.

### Excluded

- Changes to chart calculation, star placement, lunar conversion, or date-fortune logic.
- Changes to the 199-coin full-reading price or PayOS payment verification.
- Streaming chat, unlimited chat, purchased question packs, or a general-purpose chatbot.
- A/B testing, analytics dashboards, CRM, email campaigns, or production deployment unless separately requested.
- Claims that financial, relationship, health, or timing outcomes are certain.

## Architecture

### 1. Provider routing

Extend `src/lib/llm-router.ts` with a `deepseek` provider that reads:

- `DEEPSEEK_API_KEY` or `DEEPSEEK_API_KEYS`;
- `DEEPSEEK_MODEL`, defaulting to `deepseek-v4-flash`.

Use the OpenAI-compatible base URL `https://api.deepseek.com` and Chat Completions endpoint. Do not default to the legacy `deepseek-chat` alias because DeepSeek has announced its deprecation for 2026-07-24.

Reading generation, free overview generation, and chart assistant calls pass an explicit provider order of `deepseek,groq`. Existing Gemini support remains available for unrelated callers but is not part of this reading workflow.

Provider failures are isolated:

1. try DeepSeek;
2. on rate limit, network error, invalid response, or provider error, try Groq;
3. if both providers fail, return the existing deterministic chart-based fallback.

No API key is sent to the browser, logged, stored in reading metadata, or committed. The local `.env` is updated only with non-secret routing/model variables if needed; `.env.example` documents placeholders.

### 2. Chart evidence profile

Create one focused module that converts `TuViChart` into a compact interpretation profile. It contains only engine-derived facts needed by prompts and previews:

- birth/view-year context and preferred form of address;
- Mệnh and Thân placement;
- important palaces, main/support/yearly stars, and star states;
- Tuần/Triệt flags from existing chart data;
- current decade/year context already calculated by the engine;
- evidence-backed strength, opportunity, and caution signals;
- source labels that let prompts cite the relevant palace and stars.

The profile does not assign new stars or infer unsupported chart facts. Free, paid, preview, and chat flows consume the same profile so their messages remain consistent.

### 3. Free mini-report

The current long free overview becomes a mini-report with a target of 450-550 Vietnamese words. It is available immediately after chart creation without requiring login.

Required sections:

1. `Chân dung nổi bật`
2. `Điểm mạnh nên phát huy`
3. `Cơ hội công việc và tài chính`
4. `Điều cần thận trọng`
5. `Gợi ý hành động trong năm {viewYear}`

Each section must connect advice to at least one supplied chart fact. The language is practical and advisory, avoids blog introductions, avoids vague praise, and does not promise outcomes. The report includes one specific opportunity or caution, framed as a tendency to verify rather than a guaranteed event.

The prompt target is 450-550 words. The quality guard accepts 400-650 words, all required headings, and chart evidence. This tolerance avoids discarding a useful report for a small length deviation. Invalid or unavailable LLM output falls back to a deterministic report assembled from the same evidence profile.

### 4. Personalized VIP preview

Add a deterministic `buildPersonalizedReportOutline(chart)` function. The outline appears directly below the mini-report and is available to guests.

Every preview item has:

- a personalized title;
- a one-line description;
- a stable key matching the paid-report chapter where possible;
- a locked/unlocked presentation state.

Conditional titles are only used when supported by chart data. For example, a title about Tuần/Triệt in Tài Bạch is allowed only when that condition is present. Otherwise the function uses a truthful alternative based on the strongest available evidence.

The preview exposes the full table of contents but no paid chapter body. The primary call to action is:

`Mở hồ sơ đầy đủ — 199 xu`

Supporting copy states that the report can be read again without another charge and includes three chart-aware AI questions.

### 5. Paid personal dossier

Keep the existing asynchronous, chapter-based full-reading generation and payment gate. Revise the prompt contract so every chapter:

- addresses the chart owner as an individual;
- uses the shared evidence profile instead of generic astrology exposition;
- covers strengths, weaknesses/cautions, financial or life opportunities, timing risks, and practical actions where relevant;
- distinguishes chart evidence from advisory interpretation;
- avoids internal prompt labels and repetitive disclaimers;
- uses financial/life advisory language without presenting professional financial or medical advice;
- keeps the established mobile-readable headings and chapter order required by the repository playbook.

The existing format and completeness guards remain, with their expected headings updated only where the new dossier contract requires it.

### 6. Three-question chart-aware assistant

Replace the public unlimited assistant behavior with a purchased benefit.

Eligibility:

- the requester is authenticated;
- the requester owns the chart, or is an admin following existing paid-content rules;
- a completed `FULL` reading with scope `all` exists for the same user and chart.

Persistence uses a new `AssistantQuestion` model with:

- `id`, `userId`, `chartId`, and `readingId`;
- `slot` restricted by application logic to 1, 2, or 3;
- `question`, `answer`, and `model`;
- timestamps;
- a unique constraint on `(userId, chartId, slot)`.

The server reserves the next available slot before invoking a provider. The unique slot constraint prevents concurrent requests from exceeding three. A successful LLM or deterministic fallback answer completes the slot. Invalid requests do not consume a slot.

The assistant prompt receives:

- the compact chart evidence profile;
- a compact summary of the purchased full reading, not the entire 8,000-12,000 word document;
- the current question;
- up to the earlier two question/answer pairs for continuity.

The UI shows the entitlement state and remaining count (`3/3`, `2/3`, `1/3`, `0/3`). Guests or users without the completed full reading see the VIP benefit explanation and purchase/login action, not an enabled chat form.

## User Experience

### Before purchase

1. Chart renders as it does today.
2. The mini-report loads with a clear progress state.
3. The personalized VIP outline appears below it.
4. Locked items show titles and one-line descriptions without obscuring the mini-report.
5. The 199-coin CTA stays visible and preserves chart context through login/payment.

### After purchase

1. Existing completed reading content remains readable without another charge.
2. The same outline becomes chapter navigation where supported by current rendering.
3. The assistant opens with three suggested chart-specific questions.
4. Each completed answer updates the remaining-question count.

Primary controls retain approximately 48px touch targets and readable Vietnamese copy for adults aged 30-60.

## Error Handling

- Missing DeepSeek key: skip DeepSeek and try Groq.
- DeepSeek error/rate limit/empty text: record only a safe provider label and try Groq.
- Both providers unavailable: use deterministic evidence-based fallback.
- Free mini-report is still loading: retain the current asynchronous loading/retry behavior.
- Invalid mini-report structure: discard it and use deterministic fallback rather than displaying malformed text.
- Assistant unauthenticated: return `401` with a login action.
- Assistant not entitled: return `403` with the full-report purchase action.
- Three slots exhausted: return `409` with the persisted history and `remaining: 0`.
- Unknown or non-owned chart: return `404` to avoid disclosing chart existence.
- Assistant client/network error: keep the typed question and show a retryable inline error when no slot was consumed.

## Security and Privacy

- All provider requests run server-side.
- Prompts contain only the selected chart/evidence data needed for the feature.
- API responses never expose provider keys, raw provider errors, or internal prompt text.
- Entitlement and quota checks run on every assistant request; the browser counter is display-only.
- Personal chart routes remain private/noindex according to existing behavior.
- Stored assistant questions are deleted with the user or chart through cascading relations.

## Testing Strategy

Implementation follows test-driven development.

Focused tests cover:

- DeepSeek request shape and successful response parsing.
- DeepSeek-to-Groq fallback and no Gemini call in the reading workflow.
- provider detection when only `DEEPSEEK_API_KEY` exists.
- evidence profile output from a stable chart fixture.
- mini-report headings, evidence requirement, and length guard.
- deterministic fallback when both providers fail.
- conditional VIP titles, especially Tuần/Triệt truthfulness.
- assistant authentication, chart ownership, completed-full-reading entitlement, and three-slot quota.
- concurrent slot uniqueness behavior.
- assistant prompt context and remaining-count responses.
- guest, locked, and unlocked UI source/component behavior.

Verification uses the repository ladder:

1. focused Vitest files during each red-green cycle;
2. `npm run lint`;
3. `npm test`;
4. `npm run build`;
5. local browser checks on port 4000 for guest and purchased states at desktop and mobile widths.

Before changing Next.js route or caching APIs, the implementation must read the relevant guide under `node_modules/next/dist/docs/`, as required by `AGENTS.md`.

## Data Migration and Rollout

Add one Prisma migration for `AssistantQuestion` and regenerate the Prisma client. Existing readings and users require no backfill.

Local environment:

- retain the existing secret `DEEPSEEK_API_KEY`;
- ensure `GROQ_API_KEYS` remains the fallback;
- set the reading workflow order in code so a stale global `LLM_PROVIDER_ORDER` cannot bypass DeepSeek.

Production requires the same DeepSeek/Groq secrets to be present on the VPS before release. Local implementation and verification do not imply production configuration or deployment.

## Acceptance Criteria

- A guest receives a 450-550 word target mini-report based on their computed chart.
- The page shows a complete personalized VIP outline without revealing paid bodies.
- All reading-related LLM calls use DeepSeek first and Groq second.
- A normal user cannot use chart chat before completing the full reading.
- A qualified buyer receives exactly three persisted questions for that chart and cannot exceed the quota through concurrent requests.
- Paid reports read as personal advisory dossiers and cite chart evidence instead of generic blog content.
- Existing price, coin ledger, payment verification, and chart-engine behavior remain unchanged.
