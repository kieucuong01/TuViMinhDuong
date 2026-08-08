# Thiết kế tính năng Xem Tử vi 2026

**Ngày:** 2026-08-09  
**Phạm vi:** công cụ công khai `/xem-tu-vi-2026` và chế độ kết quả `nam-2026` trên trang lá số  
**Quyết định:** người dùng đã ủy quyền tự quyết định sản phẩm; chọn phương án công cụ cá nhân hóa, không tạo hàng loạt trang tuổi mỏng.

## Mục tiêu

Hoàn thiện mục “Xem Tử vi 2026” đang để trạng thái “Sẽ làm sau” thành một hành trình trọn vẹn: người đọc hiểu ngay công cụ làm gì, nhập ngày giờ sinh, nhận bản luận giải vận năm 2026 có căn cứ từ lá số và biết nên ứng dụng kết quả thế nào trong đời sống.

Nội dung tham khảo nhịp văn của tuvi.vn ở mức cấu trúc: mở bằng bối cảnh năm, đi theo từng phương diện, giải thích tín hiệu và kết lại bằng lời khuyên thực tế. Không sao chép câu chữ, không dùng các khẳng định chắc chắn về bệnh tật, tài chính, hôn nhân hay số phận.

## Các phương án đã cân nhắc

1. **Công cụ cá nhân hóa từ lá số — chọn.** Một landing page indexable dẫn vào kết quả riêng theo ngày, giờ sinh và giới tính. Có giá trị sản phẩm cao, tận dụng engine đã được kiểm chứng và tránh nội dung trùng.
2. **Chỉ làm bài tổng hợp 12 con giáp.** Nhanh nhưng quá chung, khó tạo khác biệt và dễ trở thành nội dung SEO mỏng.
3. **Sinh hàng loạt URL theo năm sinh và giới tính.** Có độ phủ từ khóa nhưng rủi ro cannibalization, nội dung lặp và tăng gánh bảo trì. Không phù hợp khi chưa có dữ liệu GSC mới.

## Trải nghiệm người dùng

### Landing page `/xem-tu-vi-2026`

- H1 và answer block trả lời trực tiếp: kết quả dùng lá số cá nhân để đọc vận năm Bính Ngọ 2026.
- Form nhập họ tên, ngày tháng năm sinh, lịch, giờ sinh và giới tính; năm xem được khóa ở 2026 để tránh lệch ý định.
- Trình bày năm Bính Ngọ là lớp thời gian, sau đó giải thích năm lớp luận: tổng vận, công việc, tài chính, tình cảm–gia đạo, sức khỏe–nhịp sống.
- Có phần phương pháp, giới hạn, FAQ thật và liên kết tới Tử vi trọn đời, Tài lộc–Đầu tư, Xem ngày và Xem tuổi.
- Metadata, WebPage, WebApplication và FAQ JSON-LD thống nhất với nội dung hiển thị.

### Kết quả `?view=nam-2026`

- Tiêu đề gọi đúng tên người xem, năm 2026 và tuổi âm lịch.
- Mở bằng một đoạn văn xuôi tổng quan, không chia nhỏ thành các nhãn máy móc.
- Hiển thị 5 phương diện với chỉ số định hướng, luận giải tự nhiên, điểm thuận, điểm cần giữ nhịp và một hành động cụ thể.
- Hiển thị 4 chặng trong năm, mỗi chặng gồm 3 tháng để người đọc dễ lập kế hoạch nhưng không ngộ nhận là dự đoán sự kiện chắc chắn.
- Có “Căn cứ lá số” nêu cung, địa chi, chính tinh, sao hỗ trợ/cảnh báo và sao lưu năm được dùng cho từng kết luận.
- Có kế hoạch tự rà soát 30 ngày và liên kết sang công cụ chuyên biệt phù hợp.
- Nội dung miễn phí và riêng tư như các chế độ lá số hiện tại; không thay đổi cổng thanh toán.

## Kiến trúc

- `src/lib/yearly-fortune-2026.ts`: engine thuần, nhận `TuViChart`, tạo báo cáo có kiểu dữ liệu rõ ràng. Engine chỉ đọc dữ liệu chart đã tính, không gọi LLM và không phụ thuộc mạng.
- `src/components/yearly-fortune-2026-view.tsx`: render báo cáo bằng semantic HTML, các thẻ phương diện, timeline và evidence.
- `src/app/xem-tu-vi-2026/page.tsx`: landing page server-rendered, schema và form.
- `ChartForm` thêm experience `annual-2026`, khóa năm xem bằng hidden input và đặt attribution riêng.
- `createChartAction` allowlist experience mới, redirect lỗi về landing và thành công về `?view=nam-2026`.
- `FateTabs` và trang `/la-so/[id]` thêm view `nam-2026`, hiển thị miễn phí cho guest tương tự Tài lộc.
- Header, sitemap và các liên kết nội bộ cập nhật sang route thật.

## Luật luận giải

- Chấm từng phương diện từ tổ hợp 2–4 cung liên quan, trạng thái chính tinh, phụ tinh và sao lưu năm.
- Điểm số luôn nằm trong khoảng định hướng; không hiển thị xác suất hay cam kết kết quả.
- Mỗi đoạn phải nối được ba ý: dấu hiệu lá số, biểu hiện có thể gặp trong đời sống, hành động người đọc có thể kiểm chứng.
- Nếu thiếu cung hoặc sao, báo rõ dữ liệu chưa đủ thay vì suy đoán.
- Tránh chẩn đoán bệnh, khuyến nghị mua bán tài sản, khuyên chia tay/kết hôn hoặc dùng nghi lễ như biện pháp đảm bảo.
- Mỗi chặng quý lấy các cung khác nhau theo vòng 12 cung và có câu văn riêng để chống lặp giữa các chặng.

## SEO, AEO và đo lường

- Chỉ thêm một URL indexable mới; kết quả cá nhân giữ `noindex` theo trang lá số hiện tại.
- Answer block đầu trang khoảng 40–70 từ, các heading khớp câu hỏi người dùng và FAQ trả lời độc lập.
- Các nguồn dữ liệu và phương pháp được giải thích tại chỗ; liên kết sang `/phuong-phap-luan` và nội dung tra cứu liên quan.
- Form mang `sourceSlug`, `entryArticle`, `ctaLocation` và organic event riêng để đo view → submit → result.
- Không sửa title/copy của URL đang có traffic trong đợt này.

## Xử lý lỗi và quyền riêng tư

- Dùng cùng validate tên, rate limit, timeout và lưu chart hiện tại.
- Thông báo lỗi tại landing bằng ngôn ngữ dễ hiểu và giữ đường quay lại form.
- Không đưa họ tên hay dữ liệu sinh vào URL indexable; kết quả tiếp tục nằm sau chart id và `noindex`.

## Kiểm thử và tiêu chí hoàn thành

- Unit test engine: năm luôn là 2026, đủ 5 phương diện, 4 chặng, evidence không rỗng, điểm trong biên, kết quả khác nhau cho fixture nam/nữ và giờ sinh khác nhau.
- Component test: có tổng quan văn xuôi, phương diện, timeline, evidence, disclaimer và CTA.
- Route/source test: metadata, schema, answer block, internal links, form khóa năm, redirect experience và menu không còn “Sẽ làm sau”.
- Chạy test tập trung, lint, toàn bộ test và production build.
- Kiểm tra render desktop/mobile, flow form → kết quả và public smoke sau deploy.

## Ngoài phạm vi

- Không tạo 80–100 trang theo tuổi/giới tính trong lần này.
- Không bổ sung sao Cửu diệu hoặc thuật toán hạn chưa có fixture đối chiếu.
- Không thay đổi giá, thanh toán, quyền mở bản FULL hay engine an sao gốc.
