# Backlog

## Recently Completed

- Added integration-style unit coverage for the paid reading unlock flow in `src/lib/reading-unlock.test.ts`.
- Covered insufficient coins, admin bypass, cached reading no second charge, normal paid debit, and refund when AI generation fails.
- Next P0 focus should move to Playwright smoke for topup modal/CMS/payment and PayOS webhook idempotency/signature tests.

Backlog này dùng để quyết định "làm tiếp cái gì" khi không có chỉ định chi tiết. Ưu tiên theo P0 -> P1 -> P2.

## P0: Trước khi bán thật

### Test và độ tin cậy

- Mở rộng Playwright smoke: user thường thiếu xu -> thấy topup modal trên trang lá số.
- Mở rộng Playwright smoke: admin tạo/sửa CMS -> public article đọc được.
- Mở rộng Playwright smoke: payment checkout mock hoặc PayOS sandbox.
- Thêm integration test cho coin ledger:
  - không đủ xu bị chặn
  - admin bypass
  - reading đã unlock không trừ xu lại
  - AI lỗi sau khi trừ xu thì hoàn xu
- Thêm test webhook PayOS:
  - sai signature bị từ chối khi env thật có mặt
  - webhook lặp không cộng xu hai lần
  - return URL không tự cộng xu

### Engine tử vi

- Thêm golden fixture Kiều Tấn Cường đã đối chiếu PDF/web.
- Thêm golden fixture Hứa Thị Thúy Hằng.
- Thêm fixture nam/nữ cho giờ Tý, Dần, Ngọ, Hợi.
- Thêm assertion cho Miếu/Vượng/Đắc/Bình/Hãm của chính tinh quan trọng.
- Thêm assertion cho Tuần/Triệt, sao lưu niên, cân lượng cốt.

### Payment production

- Test PayOS thật hoặc sandbox thật với webhook thật.
- Ghi lại bằng chứng smoke payment trong docs hoặc issue nội bộ.
- Hoàn thiện chính sách thanh toán, hoàn tiền, điều khoản sử dụng.
- Kiểm tra copy UX: "mua một lần, xem lại trong tài khoản".

## P1: Tăng chuyển đổi và SEO

### UX conversion

- Theo dõi click CTA trả phí bằng analytics event.
- Theo dõi mở modal nạp xu, checkout start, checkout success/fail.
- Rà sticky CTA mobile để không che nội dung, chat widget, tab.
- Làm trạng thái loading rõ hơn cho các action còn thiếu.
- Rút gọn các đoạn giải thích dài trong public UI.

### SEO content

- Viết bài evergreen:
  - Lá số tử vi là gì?
  - Cách đọc lá số tử vi cho người mới
  - Cung Phu Thê trong tử vi
  - Cung Tật Ách trong tử vi
  - Cung Thiên Di trong tử vi
  - Sao Tử Vi, Thiên Phủ, Thái Dương, Thái Âm
- Tạo glossary sao tử vi.
- Thêm internal link cluster giữa bài 12 cung, chính tinh, đại vận, xem ngày.
- Tích hợp Search Console sau khi domain production ổn định.
- Kiểm tra sitemap submit và index coverage.

### Performance

- Chạy `npm run perf:smoke` sau mỗi deploy production quan trọng.
- Rà bundle bằng `npm run analyze` khi trang bắt đầu nặng.
- Lazy load các widget ít quan trọng nếu thấy LCP/INP giảm.

## P2: Vận hành và mở rộng

### Admin

- Tách admin dashboard thành tab rõ:
  - Users
  - Charts
  - Readings
  - Payments
  - CMS
  - Logs
- Thêm filter payment theo trạng thái/ngày.
- Thêm audit log cho cộng/trừ xu thủ công.
- Thêm export CSV cho payment/order nếu cần đối soát.

### Sản phẩm

- Email nhận kết quả luận giải cho khách không muốn tạo tài khoản trước.
- PDF lá số đẹp hơn.
- Gói subscription xem ngày/nhật vận.
- Trang so sánh miễn phí và nâng cao.
- A/B test CTA trả phí.

### Engine nâng cao

- Tách data table engine ra module riêng nếu `chart.ts` quá lớn.
- Thêm tài liệu `docs/agent/domain-rules.md` cho quy ước tử vi.
- Lưu nguồn/ghi chú cho từng bảng quy tắc để dễ audit sau này.

## Icebox

- App mobile.
- Tích hợp CRM/email marketing.
- Hệ thống affiliate.
- Nhiều theme lá số.
- Bình luận cộng đồng cho bài viết.

## Cách chọn việc tiếp theo

Nếu user chỉ nói "làm tiếp đi":

1. Chọn P0 đầu tiên chưa làm.
2. Nếu P0 đang bị block, chọn P1 có tác động conversion hoặc SEO cao nhất.
3. Không chọn P2 khi P0 còn hở test/payment/engine.

Nếu task mới được thêm:

- Nếu chạm payment/auth/engine, mặc định xếp P0.
- Nếu tăng SEO/conversion mà không ảnh hưởng core, xếp P1.
- Nếu là polish hoặc vận hành nâng cao, xếp P2.
