# Tương hợp 2 lá số — Thiết kế tính năng

## Mục tiêu

Xây dựng công cụ miễn phí tại `/tuong-hop-la-so` để người dùng nhập thông tin sinh của hai người, nhận báo cáo đối chiếu hai lá số chi tiết, dễ hiểu và có căn cứ. Công cụ phục vụ tự nhìn lại quan hệ, không phán quyết cưới/chia tay, không hứa hẹn kết quả và không thay tư vấn chuyên môn.

## Quyết định sản phẩm

- Đặt trong menu `Tử vi`, dùng tên hiển thị “Tương hợp 2 lá số”.
- Tính trong trình duyệt bằng `generateTuViChart`; không lưu ngày giờ sinh, không tạo chart trong tài khoản, không gọi LLM hay API bên ngoài.
- Không dùng một điểm số “hợp/khắc” duy nhất. Báo cáo dùng ba mức diễn giải: `thuận để phát huy`, `cần chủ động phối hợp`, `nên trao đổi rõ`.
- Mỗi kết luận phải có bốn lớp: nhận định dễ hiểu, căn cứ lá số, biểu hiện có thể gặp, gợi ý đối thoại/hành động.
- Đọc theo sáu chủ đề: nhịp tính cách; giao tiếp và cảm xúc; tình cảm và cam kết; tiền bạc và cách ra quyết định; công việc và phối hợp; gia đình và đời sống chung.
- Kết quả luôn nhắc giới hạn của giờ sinh và hoàn cảnh thật; không khẳng định quan hệ tốt/xấu cố định.

## Kiến trúc

1. `src/lib/chart-compatibility.ts` nhận hai `ChartInput`, gọi engine hiện có, trích cung/sao và trả về `ChartCompatibilityReport` thuần dữ liệu.
2. Báo cáo tổng hợp nền Mệnh–Thân–Cục, quan hệ ngũ hành, sáu cụm cung và nhóm sao có sắc thái rõ. Thuật toán chỉ diễn giải dữ liệu engine, không tự an sao.
3. `src/components/chart-compatibility-tool.tsx` là Client Component quản lý form và hiển thị báo cáo tại chỗ; nội dung landing, metadata và JSON-LD vẫn là Server Component để crawler đọc ngay.
4. `/tuong-hop-la-so` có answer block, bảng phương pháp, FAQ nhìn thấy được, internal links và WebPage/WebApplication/FAQ schema khớp nội dung.

## Trải nghiệm

- Form chia hai `fieldset`, mỗi người có tên gọi, giới tính, ngày/tháng/năm, loại lịch và giờ sinh.
- Trên màn hình nhỏ xếp dọc; desktop hiển thị hai cột. Tất cả label luôn nhìn thấy, control cao tối thiểu 48px, lỗi nằm ngay vùng form.
- Sau khi submit, cuộn/focus tới tiêu đề kết quả; phần tóm tắt xuất hiện trước, sáu chủ đề dùng thẻ nội dung dễ quét, căn cứ chi tiết nằm trong `details` để không gây ngợp.
- Có nút sửa dữ liệu và CTA nhẹ tới lập lá số riêng/đọc phương pháp luận; không chặn giá trị miễn phí bằng paywall.

## SEO, AEO và an toàn nội dung

- Canonical: `https://lasotinhhoa.vn/tuong-hop-la-so`.
- Intent chính: tương hợp 2 lá số; intent phụ: so hai lá số tử vi, xem độ hòa hợp vợ chồng/người yêu/đối tác bằng lá số.
- Nội dung tĩnh giải thích khác biệt giữa xem tuổi Can–Chi và đối chiếu hai lá số, cách đọc sáu chủ đề, dữ liệu cần chuẩn bị, giới hạn kết quả.
- JSON-LD gồm WebPage, WebApplication, FAQPage; dữ liệu được escape ký tự `<` theo hướng dẫn Next.js.
- Thêm sitemap, menu desktop/mobile và `public/llms.txt`; không tạo trang biến thể mỏng hay URL chứa dữ liệu cá nhân.

## Điều kiện hoàn tất

- Module luận giải có kiểm thử cho dữ liệu hợp lệ, tính đối xứng, sáu chủ đề, căn cứ sao/cung, copy không định mệnh và lỗi ngày sinh.
- Route render metadata, schema, answer block, FAQ và công cụ; menu/sitemap/llms liên kết route.
- Lint, test, build, kiểm tra giao diện desktop/390px và production smoke đều đạt trước khi báo hoàn tất.
