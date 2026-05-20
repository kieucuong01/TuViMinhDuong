# AItuvi - Web tra cứu tử vi AI

MVP full-stack bằng Next.js App Router, TypeScript, Prisma/PostgreSQL, PayOS/VietQR, AI SDK fallback, CMS SEO và engine lá số tử vi phổ thông.

## Chạy local

Runtime hệ thống trong máy này đang thấp hơn yêu cầu Next.js 16. Khi chạy qua Codex, dùng Node bundled:

```powershell
$env:PATH="C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;$env:PATH"
npm run dev
```

Tạo `.env` từ `.env.example`. Nếu chưa có `DATABASE_URL`, app vẫn chạy bằng demo in-memory để xem UI, tạo lá số, auth demo và nạp xu demo. Khi có PostgreSQL:

```powershell
npm run db:generate
npm run db:migrate
```

## Tính năng đã có

- Home mobile-first, form lập lá số và các section SEO-friendly.
- Lá số 12 cung desktop, mobile có accordion để đọc rõ.
- Auth email/password chung đăng ký/đăng nhập, Google OAuth optional.
- Xu, gói nạp, PayOS checkout/webhook và demo fallback.
- AI luận giải lưu cache, fallback template khi chưa có Vercel AI Gateway.
- CMS admin, bài viết, metadata SEO và chấm điểm SEO.
- `robots.ts`, `sitemap.ts`, JSON-LD Article/Breadcrumb.

## Kiểm tra

```powershell
npm run lint
npm test
npm run build
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
