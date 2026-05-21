# Low-Token Handoff

Use this when starting a new AI-agent session. Paste the short bootstrap plus the concrete task. Do not paste long chat history unless it contains facts not captured in repo docs.

## Bootstrap Prompt

```text
You are working in C:\Users\ASUS\Documents\Claude\Projects\Tu vi.
Start by reading AGENTS.md, then docs/agent/README.md, then only the relevant playbook in docs/agent/playbooks.md.
This is the Lá số tinh hoa Next.js 16 app. The temporary production URL is tu-vi-minh-duong.vercel.app; lasotinhhoa.vn is planned after DNS is stable.
Follow existing patterns, preserve unrelated dirty changes, and verify with the smallest sufficient ladder from docs/agent/verification.md.
```

## Task Prompt Shape

```text
Goal:
- <one concrete outcome>

Context:
- <route/component/bug/user flow>
- <known constraints, env, screenshots, or repro steps>

Acceptance criteria:
- <observable behavior>
- <mobile/desktop requirements if UI>
- <SEO/payment/auth/data requirements if relevant>

Verification:
- <expected command or smoke test>
```

## Status Update Shape

```text
Done:
- <files/flows changed>

Verified:
- <commands or browser checks>

Open:
- <risks, blockers, or follow-up>
```

## When To Update Docs

Update `docs/agent/*` when any of these change:

- brand/domain/SEO routes
- payment or coin rules
- chart/date engine conventions
- admin/CMS workflow
- deployment process
- local server or verification commands
- major UX rule for the target audience
