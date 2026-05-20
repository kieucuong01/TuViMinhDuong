# Tử Vi Minh Đường

Web tra cứu tử vi AI dùng Next.js App Router, TypeScript, Tailwind CSS, Prisma/PostgreSQL, PayOS/VietQR, CMS SEO và engine lá số tử vi phổ thông Việt Nam.

## Tính năng chính

- Trang chủ mobile-first với form lập lá số và thẻ xem ngày cát hung.
- Lập lá số 12 cung, xem lịch sử lá số theo tài khoản, trang luận giải miễn phí và nâng cao.
- Các tab luận cung, đại vận, tiểu vận, nguyệt vận, nhật vận, chuyên đề.
- Xem ngày với thẻ ngày tốt xấu, gói mở khóa tạm thời đang để full chức năng.
- Đăng ký/đăng nhập chung bằng email và mật khẩu; Google OAuth bật khi có env.
- CMS admin cho bài viết, ảnh minh họa, metadata SEO, schema và chấm điểm SEO.
- Seed bài viết kiến thức tử vi có internal link, outbound reference, Article JSON-LD và BreadcrumbList.
- Xu, gói nạp, PayOS checkout/webhook và demo fallback.

## Chạy local

Next.js 16 cần Node mới. Trên máy này, khi chạy qua Codex nên dùng Node bundled:

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

## Kiểm tra

```powershell
npm run lint
npm test
npm run build
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
- `AI_GATEWAY_API_KEY` hoặc provider AI tương ứng

## Ghi chú sản phẩm

Giai đoạn hiện tại đang để mở khóa/full chức năng theo yêu cầu thử nghiệm. Khi chuyển sang production cần bật lại chặn xu, kiểm thử webhook PayOS bằng môi trường thật, bổ sung chính sách thanh toán/hoàn tiền và rà soát nội dung pháp lý.
