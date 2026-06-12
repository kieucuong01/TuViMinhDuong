# Current State

## Recent Update: Mobile Header Navigation

- Mobile bottom navigation has been removed. Do not reintroduce it unless the user explicitly asks.
- Mobile header uses three zones: left menu for `Lá số`, `Xem ngày`, `Kiến thức`; centered logo/brand; right account trigger.
- `src/components/mobile-site-menu.tsx` owns the left mobile navigation menu. `src/components/user-header-badge.tsx` owns account/login on the right and must keep logout available for logged-in users.
- Do not add payment/refund policy links to account menus. The authenticated payment/refund policy remains a logged-in footer link only.
- Mobile floating surfaces should use `--mobile-floating-bottom` and `--mobile-safe-bottom`; there is no bottom tabbar height to reserve.

## Recent Update: Google Ads, Trust Pages, And Account Menu

- Google Ads purchase conversion should be tied to verified payment state, not the PayOS return URL alone.
- `src/app/api/payments/status/route.ts` exposes a current-user order status check for conversion verification.
- Google Ads setup and smoke instructions live in `docs/google-ads.md`; real `AW-...` IDs and labels must stay in production env, not the repo.
- Public trust pages now include privacy, terms, contact, and an authenticated payment/refund policy page.
- `/chinh-sach-thanh-toan-hoan-xu` is a logged-in route and is intentionally kept out of the guest footer and sitemap.
- Guest contact/footer surfaces should not expose topup/refund/money-only links. Logged-in footer should expose payment/refund policy. Logged-in account menu should expose coin balance/topup, saved charts, and logout.
- Header account UX is sensitive on mobile: do not hide the logout form when compacting account text.

## Recent Update: Admin Operation Toggles

- Admin now has operation toggles for PayOS payments, coin topups, and public paid readings.
- The "Tắt trả phí public" preset disables payment, topup, and public paid-reading surfaces together.
- When public paid readings are off, non-admin users only see the basic/free chart flow; Luận cung, Đại vận, Tiểu vận, Nguyệt vận, Nhật vận, prompt chips, quick purchase, and full-reading CTA are hidden or blocked.
- Admin is exempt from the paid-reading shutdown and can still view/unlock advanced readings with zero coin charge.
- Settings persist in `OperationSettings`; apply migration `20260526162000_add_operation_settings` before relying on this in production.

## Previous Update: Groq-First Reading Model Policy

- Free and paid readings now use provider order `groq,gemini` by default.
- FULL paid readings still pass Gemini model hints so provider fallback uses `gemini-2.5-flash` for normal chapters.
- If a generated paid chapter is too short, misses required headings, or otherwise fails the format guard, that chapter is retried once; if the router has to use Gemini on that retry, it uses `gemini-3.5-flash`.
- Chapter 8 yearly/month guidance also uses `gemini-3.5-flash` if the router has to fall back from Groq to Gemini.
- Env overrides: `PAID_READING_PRIMARY_GEMINI_MODEL`, `PAID_READING_ESCALATION_GEMINI_MODEL`, and `PAID_READING_YEARLY_GEMINI_MODEL`.

## Previous Update: Reading Unlock Tests

- Added `src/lib/reading-unlock.ts` as the testable core for paid reading unlocks.
- `requestReadingAction` now delegates coin checks, cached reading reuse, admin bypass, debit, save, and refund-on-generation-failure to that service.
- `src/lib/reading-unlock.test.ts` covers: insufficient coins, cached reading no second charge, normal paid debit, admin free bypass, and refund when generation fails.
- Next highest P0 remains Playwright smoke for topup modal/CMS/payment and PayOS webhook tests.

Tài liệu này là ảnh chụp nhanh trạng thái dự án **Lá số tinh hoa** để agent mới không phải đọc lại toàn bộ lịch sử chat. Nếu trạng thái thay đổi lớn, cập nhật file này cùng lượt code.

## Product

- Brand: **Lá số tinh hoa**
- Domain chính: `lasotinhhoa.vn`
- Production host: VPS self-hosted behind Nginx, PM2 process `lasotinhhoa`, internal port `4100`
- Đối tượng chính: người Việt 30-60 tuổi, muốn lập lá số dễ hiểu, ít thuật ngữ kỹ thuật.
- Hướng UX: form-first, chữ rõ, CTA dễ bấm, giải thích ngắn, không tạo cảm giác quá "AI/SaaS".
- Conversion chính: lập lá số miễn phí trước, sau đó mở luận giải toàn bộ hoặc các phần trả phí.

## Stack hiện tại

- Next.js 16 App Router, React 19, TypeScript
- Tailwind CSS v4, lucide-react
- Prisma 7 + PostgreSQL
- Email/password auth, Google OAuth tùy env
- PayOS/VietQR checkout + webhook
- Gemini/Groq LLM router + fallback template
- Vitest, ESLint, Next build
- VPS deploy target with Nginx and PM2

## Đã có

- Homepage form-first để lập lá số miễn phí.
- Engine lá số phổ thông Việt Nam trong `src/lib/chart.ts`.
- Engine xem ngày trong `src/lib/date-fortune.ts`.
- Trang lá số, lịch sử lá số, luận giải miễn phí và nâng cao.
- Paywall/xu đã bật lại cho guest/user thường; admin được bypass.
- Modal nạp xu để giữ ngữ cảnh tốt hơn.
- CMS/admin có bài viết, SEO score, metadata.
- Seed articles cho cụm kiến thức tử vi.
- Deferred GA/Google Ads tracking and client error telemetry tối thiểu.
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
