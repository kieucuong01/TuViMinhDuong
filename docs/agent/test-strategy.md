# Test Strategy

## Current Coverage Added

- `src/lib/reading-unlock.test.ts` exercises the paid reading unlock core without Next cookies or a live database.
- Covered cases: insufficient coins, cached reading reuse, normal debit, admin bypass, and refund after generation failure.
- Remaining payment-risk tests: PayOS webhook signature, duplicate webhook idempotency, and return URL not crediting coins.
- `src/app/api/webhooks/payos/route.test.ts` now covers invalid signatures, paid topup credit, duplicate webhook idempotency, failed statuses, and quick email readings.
- `tests/e2e/smoke.spec.ts` now covers the P0 browser paths: home chart creation, paid CTA confirmation, insufficient-coin topup modal, admin dashboard, admin full-reading access, and admin CMS publish-to-public.
- `scripts/smoke-payos-checkout.mjs` plus `docs/payos-smoke.md` cover the real PayOS sandbox/production checkout smoke flow: create checkout, manually pay, inspect `PaymentOrder` + `CoinLedger`, then verify paid reading unlock.
- Current remaining payment-risk test: run the PayOS smoke against the final production domain after webhook URL is configured in the PayOS dashboard. Return URL still must not be treated as a source of coin credit.

Tài liệu này định nghĩa cách test cho dự án **Lá số tinh hoa**. Mục tiêu là hỗ trợ TDD thực dụng: phần logic quan trọng có test trước hoặc test đi kèm ngay trong cùng lượt, UI có smoke test đủ bắt lỗi vỡ luồng chính.

## Test pyramid

Ưu tiên theo thứ tự:

1. **Unit tests** cho logic thuần: engine lá số, xem ngày, SEO score, AI formatter.
2. **Integration tests** cho luồng có trạng thái: auth, coin ledger, paywall, payment webhook, reading cache.
3. **E2E smoke tests** cho hành trình người dùng chính bằng Playwright.
4. **Production smoke** sau deploy cho DB thật, auth thật, route public và payment mock/PayOS.

Không cần test mọi pixel UI bằng unit test. Với UI, ưu tiên test hành vi: form submit, loading state, paywall, modal, route chuyển đúng.

## Verification ladder

Mặc định sau mỗi task:

```powershell
npm run lint
npm test
npm run build
```

Nếu task chỉ sửa docs, có thể bỏ build. Nếu task sửa App Router, metadata, route handler, auth hoặc payment, phải chạy build.

Smoke E2E:

```powershell
npm run test:e2e:install
npm run test:e2e
```

Mặc định suite tự bật Next dev server ở `http://127.0.0.1:4000`. Nếu muốn test staging/production, đặt `PLAYWRIGHT_BASE_URL`. Admin smoke sẽ skip nếu không có `PLAYWRIGHT_ADMIN_EMAIL` và `PLAYWRIGHT_ADMIN_PASSWORD`.

Nếu task sửa UI quan trọng, thêm kiểm tra thủ công hoặc Playwright ở các viewport:

- Mobile: 390px
- Tablet: 768px
- Desktop: 1440px

Nếu task sửa production/deploy, thêm:

```powershell
$env:PERF_BASE_URL="https://tu-vi-minh-duong.vercel.app"
npm run perf:smoke
```

## TDD theo module

### Engine lá số

Files chính:

- `src/lib/chart.ts`
- `src/lib/lunar.ts`
- `src/lib/chart.fixtures.ts`
- `src/lib/chart.test.ts`
- `src/lib/chart.fixtures.test.ts`

Quy tắc:

- Mọi sửa đổi thuật toán phải có fixture hoặc assertion.
- Không sửa UI để "nhìn giống" nếu engine data chưa đúng.
- Golden fixtures nên lưu dữ liệu đã đối chiếu: ngày sinh, âm lịch, Can Chi, Mệnh/Thân, Cục, chủ mệnh/chủ thân, cân lượng, sao chính, Tuần/Triệt, sao lưu.

Test cần có:

- Âm/dương lịch.
- Giờ sinh, đặc biệt giờ Tý 23h-00h59.
- 12 cung và Mệnh/Thân.
- 14 chính tinh xuất hiện đúng một lần.
- Miếu/Vượng/Đắc/Bình/Hãm cho sao trọng yếu.
- Sao lưu niên chọn lọc.
- Cân lượng cốt.

### Engine xem ngày

Files chính:

- `src/lib/date-fortune.ts`
- `src/lib/date-fortune.test.ts`
- `src/components/date-view.tsx`
- `src/app/xem-ngay/page.tsx`

Test cần có:

- Can chi ngày/tháng/năm.
- 12 trực.
- Hoàng đạo/hắc đạo.
- Nhị thập bát tú.
- Sao tốt/xấu theo ngày.
- Xung hợp theo tuổi.
- Việc nên/kỵ theo loại việc: cưới hỏi, khai trương, ký hợp đồng, xuất hành.

### AI luận giải

Files chính:

- `src/lib/ai.ts`
- `src/lib/ai.test.ts`
- `src/app/api/readings/route.ts`

Quy tắc:

- AI không tự tính lá số.
- Prompt phải dùng dữ liệu JSON đã tính.
- Fallback và AI thật phải cùng format section.
- Nội dung hướng tới người đọc 30-60 tuổi: ngắn, rõ, ít thuật ngữ.

Format bắt buộc:

1. `Tổng quan`
2. `Điểm mạnh`
3. `Điều cần lưu ý`
4. `Công việc`
5. `Tài chính`
6. `Tình cảm`
7. `Sức khỏe`
8. `Vận hạn năm`

Test cần có:

- Fallback có đủ section đúng thứ tự.
- Không còn section cũ dài dòng.
- Evidence đưa vào prompt có sao/trạng thái/lưu niên khi liên quan.

### Auth, xu, paywall, payment

Files chính:

- `src/lib/auth.ts`
- `src/lib/data.ts`
- `src/lib/pricing.ts`
- `src/lib/payos.ts`
- `src/app/api/payments/payos/checkout/route.ts`
- `src/app/api/webhooks/payos/route.ts`
- `prisma/schema.prisma`

Test cần có:

- Guest bị chặn paid content.
- User thường không đủ xu thấy prompt nạp xu.
- Admin bypass paywall.
- Mua reading lần đầu trừ xu đúng giá.
- Reading đã unlock xem lại không trừ xu.
- AI lỗi sau khi trừ xu thì hoàn xu.
- PayOS webhook sai signature bị từ chối khi real env có mặt.
- Webhook lặp không cộng xu hai lần.
- Return URL không tự cộng xu.

### CMS và SEO

Files chính:

- `src/lib/seo.ts`
- `src/lib/content.ts`
- `src/app/kien-thuc-tu-vi/[slug]/page.tsx`
- `src/app/sitemap.ts`
- `src/app/robots.ts`
- `src/app/admin/page.tsx`

Test cần có:

- SEO score giảm khi thiếu meta title/description/canonical/internal link/alt.
- Article JSON-LD có headline, description, canonical URL, publisher.
- FAQ JSON-LD chỉ render khi có FAQ visible.
- Personal chart pages noindex.
- Sitemap chứa bài public và không chứa chart cá nhân.

### UI / UX

Files hay chạm:

- `src/app/page.tsx`
- `src/components/chart-form.tsx`
- `src/components/chart-board.tsx`
- `src/components/site-header.tsx`
- `src/components/global-loading-toast.tsx`
- `src/app/globals.css`

Test/QA cần có:

- Primary buttons tối thiểu khoảng 48px cao.
- Form lập lá số có loading khi submit.
- Mobile lá số không tràn ngang ngoài vùng scroll/zoom có chủ đích.
- Sticky CTA không che nội dung báo cáo.
- Modal nạp xu không làm mất ngữ cảnh trang lá số.

## E2E smoke nên thêm

Khi bổ sung Playwright, ưu tiên các scenario:

1. Trang chủ mở được, người dùng nhập form và tạo lá số miễn phí. Đã có trong `tests/e2e/smoke.spec.ts`.
2. Lá số hiển thị chart, tab, action buttons, biểu đồ 12 cung. Đã có kiểm tra action panel cơ bản.
3. Guest mở paid reading thì thấy login paywall. Đã có.
4. Admin đăng nhập và mở dashboard. Đã có, skip nếu thiếu env.
5. Public article có Article/Breadcrumb/FAQ schema. Đã có.
6. Trang xem ngày chọn ngày và tuổi, kết quả thay đổi. Đã có kiểm tra input cơ bản.

Còn nên bổ sung sau:

- User thường thiếu xu thấy topup modal ngay trên trang lá số.
- Admin tạo/sửa bài CMS rồi đọc public article.
- Xem ngày đổi loại việc nếu UI có bộ chọn loại việc.
- Payment checkout mock/PayOS sandbox.

## Production smoke

Sau deploy thật, kiểm tra thủ công hoặc script:

- Home load.
- Login admin.
- Tạo lá số.
- Lưu lịch sử và đọc lại sau restart/deploy.
- Tạo hoặc sửa bài CMS.
- Public article có metadata/schema.
- Checkout mock hoặc PayOS thật.
- Runtime logs không có error mới.
- `npm run perf:smoke` với domain production.

## Khi nào được bỏ test?

Chỉ nên bỏ test khi:

- Sửa copy/docs thuần.
- Sửa CSS rất nhỏ không ảnh hưởng layout chính.
- Tạo asset tĩnh không liên quan logic.

Nếu bỏ test, final answer phải nói rõ lý do. Nếu task chạm engine, payment, auth, route handler hoặc metadata, không nên bỏ test.

## Quy ước làm việc với AI Agent

Trước khi code, agent nên xác định:

- Task thuộc module nào.
- File test nào sẽ chứng minh task xong.
- Có cần fixture mới không.
- Có cần cập nhật docs không.

Sau khi code:

- Chạy verification ladder phù hợp.
- Nêu rõ test nào đã chạy.
- Nêu rõ phần chưa test được nếu có.
