# Verification Guide

Use the smallest check that proves the requested change. Do not claim a flow works unless you actually verified the relevant layer.

## Local Environment

This is a Windows/PowerShell workspace. Next.js requires Node `>=20.9.0`. In Codex, prepend the bundled Node path when needed:

```powershell
$env:PATH="C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;$env:PATH"
```

Preferred local app port for this project:

```powershell
npx next dev --webpack -p 4000
```

Production-like local server after build:

```powershell
npx next start -p 4000
```

## Check Ladder

Docs-only:

```powershell
git diff --check
```

UI or component changes:

```powershell
npm run lint
npm run build
```

Domain logic, data, pricing, payment, auth:

```powershell
npm run lint
npm test
npm run build
```

Route deletion or App Router structure changes:

```powershell
Remove-Item -Recurse -Force .next
npm run build
```

## Smoke Tests

Home/chart:

- Open `http://localhost:4000/`.
- Submit the chart form.
- Confirm loading feedback appears.
- Confirm the chart detail page loads and mobile layout is readable.

Auth/history:

- Login with a known account.
- Create multiple charts.
- Visit `/la-so` and confirm history shows the right basic fields.

Admin/CMS:

- Login as admin.
- Visit `/admin`.
- Save or preview an article.
- Confirm public article metadata and content render.

Payments:

- Use a safe PayOS/mock flow unless the user asks for a real transaction test.
- Confirm insufficient coins blocks paid content.
- Confirm unlocked readings can be revisited without charging again.

## Git Hygiene

This repo can have unrelated dirty changes. Before staging or committing:

```powershell
git -c safe.directory="C:/Users/ASUS/Documents/Claude/Projects/Tu vi" status --short
git -c safe.directory="C:/Users/ASUS/Documents/Claude/Projects/Tu vi" diff --stat
```

If Git reports dubious ownership, prefer the per-command `-c safe.directory=...` form unless the user asks to configure global Git.

Never commit:

- `.env*`
- `.next/`
- `.vercel/`
- `.next-start-*.log`
- `node_modules/`
- generated Prisma client under `src/generated/prisma/`
- unrelated user changes

## Completion Note

Final responses should include:

- What changed.
- What was verified.
- What was not verified, if anything.
- Any remaining risk the user should know before deploy.
