# Current State

Tài liệu này là ảnh chụp nhanh trạng thái dự án **Lá số tinh hoa** để agent mới không phải đọc lại toàn bộ lịch sử chat. Nếu trạng thái thay đổi lớn, cập nhật file này cùng lượt code.

## Product

- Brand: **Lá số tinh hoa**
- Domain chính: `lasotinhhoa.vn`
- Đối tượng chính: người Việt 30-60 tuổi, muốn lập lá số dễ hiểu, ít thuật ngữ kỹ thuật.
- Hướng UX: form-first, chữ rõ, CTA dễ bấm, giải thích ngắn, không tạo cảm giác quá "AI/SaaS".
- Conversion chính: lập lá số miễn phí trước, sau đó mở luận giải toàn bộ hoặc các phần trả phí.

## Stack hiện tại

- Next.js 16 App Router, React 19, TypeScript
- Tailwind CSS v4, lucide-react
- Prisma 7 + PostgreSQL
- Email/password auth, Google OAuth tùy env
- PayOS/VietQR checkout + webhook
- AI SDK `ai` + fallback template
- Vitest, ESLint, Next build
- Vercel deploy target

## Đã có

- Homepage form-first để lập lá số miễn phí.
- Engine lá số phổ thông Việt Nam trong `src/lib/chart.ts`.
- Engine xem ngày trong `src/lib/date-fortune.ts`.
- Trang lá số, lịch sử lá số, luận giải miễn phí và nâng cao.
- Paywall/xu đã bật lại cho guest/user thường; admin được bypass.
- Modal nạp xu để giữ ngữ cảnh tốt hơn.
- CMS/admin có bài viết, SEO score, metadata.
- Seed articles cho cụm kiến thức tử vi.
- Vercel Analytics, Speed Insights, client error telemetry tối thiểu.
- Docs agent: playbooks, roadmap, test strategy, verification, handoff.

## Đang đáng tin tương đối

- Build Next.js production.
- Unit tests hiện có cho chart engine, date fortune, SEO score, AI fallback format.
- Personal chart pages đang đặt `noindex`.
- Article pages có metadata, canonical, OG/Twitter, JSON-LD Article/Breadcrumb; FAQ schema khi có FAQ visible.
- Paywall rule cơ bản: admin xem được, user/guest bị chặn paid content.

## Chưa nên xem là hoàn toàn chuẩn

- Engine lá số chưa đủ golden fixtures đối chiếu nhiều nguồn.
- PayOS thật chưa nên coi là đã hoàn tất nếu chưa smoke bằng môi trường thật và webhook thật.
- E2E Playwright smoke đã có bản đầu trong `tests/e2e/smoke.spec.ts`, nhưng còn thiếu payment checkout và CMS save/read.
- Admin dashboard còn là MVP, chưa phải công cụ vận hành hoàn chỉnh.
- Báo cáo AI vẫn cần kiểm duyệt chất lượng nội dung khi bán thật.
- SEO production cần thời gian index, theo dõi Search Console và cải thiện bài evergreen.

## Không được đụng bừa

- `src/lib/chart.ts`: engine lõi, sửa phải có test/fixture.
- `src/lib/date-fortune.ts`: engine xem ngày, sửa quy tắc phải có test.
- `src/lib/data.ts`: repository + demo fallback + coin/payment logic, sửa dễ ảnh hưởng nhiều flow.
- `src/app/api/webhooks/payos/route.ts`: webhook payment phải idempotent và không credit sai.
- `prisma/schema.prisma`: thay schema phải có migration và nghĩ tới production DB.
- Metadata/robots/sitemap: tránh index nhầm trang lá số cá nhân.

## Quy ước đang dùng

- Timezone mặc định: `Asia/Bangkok`.
- Giờ Tý: 23h-00h59.
- Lá số cá nhân mặc định private/noindex.
- Coin ledger là nguồn sự thật; `User.coinBalance` chỉ là cache.
- AI không tự an sao, chỉ luận từ JSON engine đã tính.
- Reading đã unlock xem lại không trừ xu lần nữa.

## Việc nên làm tiếp

Ưu tiên gần nhất nằm trong `docs/backlog.md`. Nếu user nói "làm tiếp đi" mà không nêu rõ task, đọc theo thứ tự P0 trước.

Thứ tự hợp lý hiện tại:

1. Thêm integration test cho paywall/xu/reading cache.
2. Thêm Playwright smoke cho topup modal, CMS save/read và payment checkout mock/PayOS.
3. Thêm golden fixtures cho engine lá số.
4. Smoke PayOS thật hoặc sandbox thật.
5. Rà admin dashboard cho vận hành.

## Verification mặc định

Với code runtime:

```powershell
npm run lint
npm test
npm run build
```

Với deploy/production:

```powershell
$env:PERF_BASE_URL="https://lasotinhhoa.vn"
npm run perf:smoke
```

Với docs-only change, có thể không cần chạy build; final answer phải nói rõ.
