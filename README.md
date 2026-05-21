# Lá số tinh hoa

Web tra cứu tử vi AI dùng Next.js App Router, TypeScript, Tailwind CSS, Prisma/PostgreSQL, PayOS/VietQR, CMS SEO và engine lá số tử vi phổ thông Việt Nam.

## Tech stack hiện tại

- Frontend/web framework: `Next.js 16` (App Router), `React 19`, `TypeScript`
- UI: `Tailwind CSS v4`, `lucide-react`
- Server side: Next.js `Server Actions` + `Route Handlers`
- ORM: `Prisma` (`@prisma/client`, `prisma`)
- Database: `PostgreSQL` (Prisma datasource provider: `postgresql`)
- Authentication: email/password nội bộ, hỗ trợ Google OAuth theo env
- Thanh toán: `PayOS` / `VietQR` (checkout + webhook)
- AI luận giải: router `Gemini/Groq`, Vercel AI Gateway fallback và template fallback
- SEO: Next Metadata API, `robots`, `sitemap`, OG image route
- Quality: `Vitest`, `ESLint`, `TypeScript`
- Deploy target: `Vercel`

## Tính năng chính

- Trang chủ mobile-first với form lập lá số và thẻ xem ngày cát hung.
- Lập lá số 12 cung, xem lịch sử lá số theo tài khoản, trang luận giải miễn phí và nâng cao.
- Các tab luận cung, đại vận, tiểu vận, nguyệt vận, nhật vận, chuyên đề.
- Xem ngày với thẻ ngày tốt xấu, gói mở khóa tạm thời đang để full chức năng.
- Đăng ký/đăng nhập chung bằng email và mật khẩu; Google OAuth bật khi có env.
- CMS admin cho bài viết, ảnh minh họa, metadata SEO, schema và chấm điểm SEO.
- Seed bài viết kiến thức tử vi có internal link, outbound reference, Article JSON-LD và BreadcrumbList.
- Xu, gói nạp, PayOS checkout/webhook và demo fallback.

## Làm việc với AI Agent

Agent mới nên bắt đầu từ `AGENTS.md`, sau đó đọc `docs/agent/README.md` và chỉ mở playbook liên quan trong `docs/agent/playbooks.md`. Bộ docs này giữ ngữ cảnh sản phẩm, kiến trúc, quy tắc domain và checklist kiểm chứng ở dạng ngắn để giảm token khi bàn giao giữa các session.

## Chạy local

Next.js 16 cần Node `>=20.9.0`. Trên máy này, khi chạy qua Codex nên dùng Node bundled:

```powershell
$env:PATH="C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;$env:PATH"
npm run dev
```

Mặc định app chạy ở `http://localhost:3000`. Nếu muốn dùng port 4000:

```powershell
$env:PATH="C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;$env:PATH"
npx next dev --webpack -p 4000
```

Tạo `.env` từ `.env.example`. Nếu chưa có `DATABASE_URL`, app vẫn chạy bằng demo in-memory để xem UI, tạo lá số, đăng nhập demo và nạp xu demo.

## Database

Khi có PostgreSQL:

```powershell
npm run db:generate
npm run db:migrate
```

Production dùng migration đã commit:

```powershell
npm run db:deploy
npm run db:seed
```

Hoặc chạy gộp:

```powershell
npm run db:setup
```

`db:seed` sẽ tạo/cập nhật:

- admin từ `ADMIN_EMAIL` và `ADMIN_PASSWORD`
- gói xu mặc định
- giá tính năng mặc định
- một số bài viết SEO nền tảng
```

## Kiểm tra

```powershell
npm run lint
npm test
npm run build
```

Playwright smoke suite:

```powershell
npm run test:e2e:install
npm run test:e2e
```

Mặc định Playwright tự bật dev server tại `http://127.0.0.1:4000`. Nếu muốn smoke một site đã chạy sẵn:

```powershell
$env:PLAYWRIGHT_BASE_URL="https://tu-vi-minh-duong.vercel.app"
npm run test:e2e
```

Admin smoke sẽ tự skip nếu chưa có `PLAYWRIGHT_ADMIN_EMAIL` và `PLAYWRIGHT_ADMIN_PASSWORD`.

Kiểm tra tốc độ phản hồi các trang public sau deploy:

```powershell
$env:PERF_BASE_URL="https://tu-vi-minh-duong.vercel.app"
npm run perf:smoke
```

Nếu muốn kiểm tra thêm một trang lá số cụ thể, truyền thêm `PERF_CHART_PATH`:

```powershell
$env:PERF_CHART_PATH="/la-so/<id>"
npm run perf:smoke
```

## Deploy

Target deploy là Vercel + Postgres. Các env quan trọng:

- `DATABASE_URL`
- `NEXT_PUBLIC_APP_URL`
- `AUTH_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `PAYOS_CLIENT_ID`
- `PAYOS_API_KEY`
- `PAYOS_CHECKSUM_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GEMINI_API_KEY` hoặc `GEMINI_API_KEYS` cho Gemini
- `GROQ_API_KEY` hoặc `GROQ_API_KEYS` cho Groq
- `LLM_PROVIDER_ORDER` mặc định `gemini,groq`
- `AI_GATEWAY_API_KEY` nếu muốn dùng Vercel AI Gateway fallback
- `ERROR_WEBHOOK_URL` nếu muốn chuyển tiếp lỗi client ra hệ thống ngoài; để trống thì lỗi vẫn được ghi trong Vercel Runtime Logs.

`GEMINI_API_KEYS` và `GROQ_API_KEYS` nhận danh sách key phân tách bằng dấu phẩy hoặc xuống dòng. Chỉ dùng các key/tài khoản hợp lệ bạn sở hữu để dự phòng và chia tải trong giới hạn nhà cung cấp, không dùng để né quota.

### Theo dõi sau deploy

- Vercel Web Analytics và Speed Insights đã được gắn ở root layout.
- Lỗi client được gửi về `/api/telemetry/error`, rút gọn payload và ghi vào runtime logs.
- Sau deploy, chạy `npm run perf:smoke` với `PERF_BASE_URL` là domain production.
- Khi cần rà lỗi nhanh trên Vercel, dùng `npx vercel logs <deployment-url> --level error --since 1h`.

### Checklist production tối thiểu

1. Tạo Postgres thật, ưu tiên Neon qua Vercel Marketplace.
2. Set `DATABASE_URL` trên Vercel cho Production.
3. Set `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `NEXT_PUBLIC_APP_URL`.
4. Pull env production về local nếu cần chạy migration từ máy:

```powershell
npx vercel env pull .env.local --environment=production --yes
npm run db:setup
```

5. Deploy lại production sau khi DB đã migrate.
6. Test luồng login admin, tạo lá số, lưu lịch sử, đọc lại sau restart/deploy mới.

## Ghi chú sản phẩm

Giai đoạn hiện tại đã bật lại chặn xu cho user thường; admin vẫn có toàn quyền xem. Trước khi chạy thu tiền thật cần kiểm thử webhook PayOS bằng môi trường thật, bổ sung chính sách thanh toán/hoàn tiền và rà soát nội dung pháp lý.
