# Roadmap

Tài liệu này dùng để giữ nhịp phát triển cho **Lá số tinh hoa**. Mục tiêu là làm nhanh hơn nhưng ít vỡ hơn: mỗi đợt chỉ tập trung một module, có tiêu chí xong rõ ràng và có test tương ứng.

## Nguyên tắc ưu tiên

1. Luồng kiếm tiền và niềm tin người dùng quan trọng hơn tính năng phụ.
2. Engine tử vi và xem ngày phải có fixture/test trước khi sửa sâu.
3. UI hướng tới người dùng 30-60 tuổi: chữ rõ, ít thuật ngữ, CTA dễ hiểu.
4. SEO public phải bền: bài evergreen, internal link, schema, tốc độ tốt.
5. Không trộn engine, payment, UI lớn và SEO trong cùng một lượt nếu không bắt buộc.

## Giai đoạn 1: Ổn định trước khi bán thật

Trạng thái: đang trong giai đoạn hardening. Các tính năng chính đã có, nhưng cần khóa chất lượng trước khi đẩy mạnh traffic và thanh toán thật.

### Must-have

- Chuẩn hóa test strategy và bắt buộc chạy test theo loại task.
- Thêm Playwright smoke cho luồng: trang chủ -> lập lá số -> xem lá số.
- Thêm Playwright smoke cho auth: đăng nhập admin, user thường, guest bị paywall.
- Thêm integration test cho coin/paywall: không đủ xu, admin bypass, cached reading không trừ xu lại.
- Kiểm tra PayOS thật với webhook signature, idempotency và luồng lỗi.
- Thêm golden fixtures cho engine lá số từ các lá số đã đối chiếu.
- Kiểm tra personal chart pages vẫn `noindex`.
- Chạy smoke production sau deploy: login, tạo lá số, lưu lịch sử, CMS, checkout mock/PayOS.

### Done khi

- `npm run lint`, `npm test`, `npm run build` pass.
- Ít nhất 5 luồng chính có E2E smoke.
- Có fixture engine cho các case quan trọng.
- Payment thật hoặc sandbox PayOS có bằng chứng test.

## Giai đoạn 2: Nâng độ tin cậy engine

Mục tiêu: biến engine thành tài sản lõi, không sửa theo cảm tính.

### Việc cần làm

- Mở rộng `src/lib/chart.fixtures.ts` với nhiều lá số nam/nữ, giờ Tý/Dần/Ngọ/Hợi, âm lịch/dương lịch.
- Tách các bảng quy tắc quan trọng trong `src/lib/chart.ts` thành cấu trúc dễ test hơn nếu file quá lớn.
- Thêm test riêng cho Miếu/Vượng/Đắc/Bình/Hãm của chính tinh quan trọng.
- Thêm test cho Tuần/Triệt, sao lưu niên chọn lọc, cân lượng cốt.
- Ghi rõ quy ước engine trong docs: timezone, giờ Tý, lịch âm, chuẩn phổ thông Việt Nam.

### Done khi

- Sửa một quy tắc engine luôn đi kèm fixture/test.
- UI lá số chỉ hiển thị dữ liệu engine trả về, không tự tính lại.
- AI prompt chỉ dùng structured JSON từ engine, không yêu cầu AI tự an sao.

## Giai đoạn 3: Conversion và payment UX

Mục tiêu: tăng tỉ lệ người dùng mở luận giải mà không làm họ mất ngữ cảnh.

### Việc cần làm

- Hoàn thiện modal nạp xu/mua luận giải ngay trên trang lá số.
- CTA trả phí nổi bật nhưng không che nội dung, đặc biệt trên mobile.
- Viết rõ: mua một lần, xem lại trong tài khoản.
- Theo dõi click CTA, mở modal, checkout success/fail bằng analytics event.
- Rà nội dung pháp lý: chính sách thanh toán, hoàn tiền, điều khoản sử dụng.

### Done khi

- Người dùng có thể tạo lá số, đọc miễn phí, mở modal mua, quay lại đúng lá số.
- Payment fail không làm mất trang hiện tại.
- Webhook lặp không cộng xu hai lần.

## Giai đoạn 4: SEO production

Mục tiêu: tăng độ phủ từ khóa bền vững trong khi tính năng báo cáo tiếp tục hoàn thiện.

### Việc cần làm

- Viết topic cluster evergreen:
  - Lá số tử vi là gì
  - Cung Mệnh, Cung Thân
  - 12 cung tử vi
  - Chính tinh tử vi
  - Tuần Triệt
  - Đại vận, Tiểu vận, Nguyệt vận, Nhật vận
  - Xem ngày tốt xấu theo tuổi
- Mỗi bài có internal links về `/#lap-la-so`, `/xem-ngay` và bài liên quan.
- Thêm FAQ schema cho bài có câu hỏi thường gặp visible.
- Kiểm tra sitemap, robots, canonical, OG image.
- Chạy `npm run perf:smoke` sau deploy.

### Done khi

- Bài public index được, lá số cá nhân noindex.
- Bài viết có schema Article/Breadcrumb; FAQ chỉ dùng khi có FAQ visible.
- Home và bài viết public đạt tốc độ phản hồi ổn định trên production.

## Giai đoạn 5: Admin và vận hành

Mục tiêu: quản trị nội dung, user, xu, đơn hàng và lỗi sản xuất dễ hơn.

### Việc cần làm

- Dashboard admin tách tab rõ: Users, Charts, Readings, Payments, CMS, Logs.
- Bộ lọc payment theo trạng thái và ngày.
- Audit log cho thao tác cộng/trừ xu thủ công.
- Error logging tối thiểu: runtime logs, client error endpoint, hướng dẫn kiểm tra Vercel logs.
- Thêm export dữ liệu cơ bản cho admin nếu cần đối soát.

### Done khi

- Admin xử lý được user/payment/CMS mà không cần vào DB.
- Có cách tra lỗi production trong 5 phút đầu khi user báo lỗi.

## Backlog sau khi ổn định

- Email nhận kết quả luận giải cho khách không muốn tạo tài khoản ngay.
- Gói subscription xem ngày/nhật vận.
- PDF lá số đẹp hơn.
- Trang glossary sao tử vi.
- A/B test CTA trả phí.
- Tích hợp Search Console, submit sitemap và theo dõi index coverage.

## Cách chọn task cho mỗi lượt làm

Mỗi lượt nên trả lời 4 câu trước khi code:

1. Module chính là gì?
2. Test nào chứng minh task xong?
3. Có ảnh hưởng payment/auth/engine không?
4. Có cần cập nhật docs hoặc SEO metadata không?

Nếu task chạm từ hai module rủi ro trở lên, tách thành nhiều lượt nhỏ.
