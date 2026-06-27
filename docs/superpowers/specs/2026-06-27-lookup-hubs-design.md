# Thiết kế lại ba hub tra cứu tử vi

## Mục tiêu

Biến `/tra-cuu/y-nghia-12-cung`, `/tra-cuu/y-nghia-14-chinh-tinh` và
`/tra-cuu/phu-tinh` từ lưới thẻ ngắn thành công cụ tra cứu thực sự, đồng thời
tăng giá trị biên tập để mỗi trang có mục đích và nội dung riêng.

## Luồng sử dụng

Mỗi trang mở bằng tiêu đề và lời giải thích ngắn, sau đó là form gồm nhãn rõ
ràng, ô chọn và nút `Tra cứu`. Form dùng phương thức GET với tham số `muc`, nên
kết quả có thể tải lại, chia sẻ và hoạt động khi JavaScript bị tắt.

Kết quả được render phía server và gồm:

- tên, nhóm/ngũ hành và mô tả cốt lõi;
- điểm nên phát huy;
- điều cần lưu ý;
- hướng dẫn đặt đối tượng vào đúng ngữ cảnh;
- liên kết tới trang thực thể chuyên sâu nếu thực thể đó có canonical riêng.

Giá trị `muc` không hợp lệ được thay bằng thực thể đầu tiên thay vì gây lỗi.
Canonical của mọi trạng thái vẫn là URL hub, không tạo thêm trang indexable từ
query parameter.

## Giá trị nội dung

Ba hub dùng chung cấu trúc giao diện nhưng có nội dung biên tập khác nhau:

- 12 cung: giải thích cung là vùng đời sống, cách chọn cung theo câu hỏi thật và
  nguyên tắc không đọc một cung tách khỏi Mệnh, Thân, sao và vận.
- 14 chính tinh: giải thích sao là khí chất nền, cách ghép sao với cung, trạng
  thái miếu/vượng/hãm và bối cảnh đời sống.
- Phụ tinh: giải thích vai trò bổ sung, cách phân nhóm cát/hung/hóa tinh và lý do
  không dùng một phụ tinh để kết luận toàn bộ lá số.

Mỗi trang có hướng dẫn ba bước, các nguyên tắc đọc, FAQ riêng, danh mục đầy đủ
của nhóm và CTA lập lá số. Danh mục này là nội dung HTML thật, không phải dữ
liệu chỉ tải sau tương tác.

## Kiến trúc

- `src/components/pseo-lookup-hub.tsx`: server component dùng chung, xử lý form,
  thực thể được chọn, kết quả, nội dung nền, FAQ và danh mục.
- Ba `page.tsx`: nhận `searchParams` dạng `Promise` theo Next.js 16, chuẩn hóa
  `muc`, truyền cấu hình riêng vào component.
- `src/app/globals.css`: style cho form, result, prose và responsive.
- `src/app/tra-cuu/pseo-routes.test.ts`: regression test cho form GET, nội dung
  chống thin-content, ba cấu hình riêng và canonical hiện hữu.

Không thay đổi engine tử vi, database, sitemap, canonical route hoặc trạng thái
publish của ma trận pSEO.

## Accessibility và responsive

Select có `label`, kết quả có `aria-live="polite"`, vùng FAQ dùng semantic
`details/summary`, nút cao tối thiểu phù hợp người dùng 30-60 tuổi. Trên mobile,
form chuyển từ hàng ngang sang một cột; bảng thông tin và danh mục không gây
tràn ngang.

## Xác minh

- Test regression phải fail trước khi thêm component và pass sau triển khai.
- Chạy test pSEO liên quan, lint và build.
- Chạy local port 4000, kiểm tra đủ ba route ở desktop/mobile và thử thay đổi
  lựa chọn.
- Kiểm tra HTML có nội dung nền, form và kết quả server-rendered.
