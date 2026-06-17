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

If `npm` resolves to Node 18, run checks with the bundled Node executable instead of trusting the failure:

```powershell
& "C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" .\node_modules\vitest\vitest.mjs run
& "C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" .\node_modules\eslint\bin\eslint.js
$env:PATH="C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;$env:PATH"
& "C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" .\node_modules\next\dist\bin\next build
```

Production-like local server after build:

```powershell
npx next start -p 4000
```

Production smoke target:

```powershell
$env:PERF_BASE_URL="https://lasotinhhoa.vn"
npm run perf:smoke
```

## Check Ladder

Docs-only:

```powershell
git diff --check
```

SEO article content plus cover-asset changes:

```powershell
npm test -- src/lib/content.test.ts src/lib/article-cover-assets.test.ts
```

Deploy/docs/automation workflow changes:

```powershell
git diff --check
ssh tuvi-vps "pm2 describe lasotinhhoa"
curl.exe -L -s -o NUL -w "%{http_code}\n" https://lasotinhhoa.vn
curl.exe -L -s -o NUL -w "%{http_code}\n" https://lasotinhhoa.vn/kien-thuc-tu-vi
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

Article cover assets:

- Confirm the changed article references a local `coverImage` under `/articles/`.
- Confirm `coverAlt` is descriptive and matches the actual visual subject.
- Confirm the article body includes the same image when that is the current content pattern.

Payments:

- Use a safe PayOS/mock flow unless the user asks for a real transaction test.
- Confirm insufficient coins blocks paid content.
- Confirm unlocked readings can be revisited without charging again.
- Confirm `purchase` tracking depends on verified paid order status, not only return URL query params.
- Confirm guest public footer/contact/sitemap do not expose topup/refund-only policy links.

Google Ads:

- Do not smoke with invented `AW-...` values.
- With real env values, run `npm run smoke:google-ads`.
- In Tag Assistant, verify AW tag on `/lap-la-so`, `create_chart` after `created=1`, and `purchase` only after `/api/payments/status` returns `verified: true`.

Public trust policy:

- As guest, `/chinh-sach-thanh-toan-hoan-xu` should redirect to `/dang-nhap?next=/chinh-sach-thanh-toan-hoan-xu`.
- As guest, `/lien-he` should not show refund/topup-only CTA.
- `sitemap.xml` should not include authenticated/money-only policy routes.

Deploy path:

- After any production release, confirm `pm2 describe lasotinhhoa` shows `exec cwd` or script path under the latest `/opt/lasotinhhoa/releases/<timestamp>-<sha>`, not an older release.
- Smoke `https://lasotinhhoa.vn`, `https://lasotinhhoa.vn/kien-thuc-tu-vi`, and the changed public URL before claiming deploy success.

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
- local deployment metadata directories or release scratch folders
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
