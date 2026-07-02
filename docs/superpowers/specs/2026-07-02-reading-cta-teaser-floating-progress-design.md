# Thiết kế sửa CTA, teaser miễn phí và tiến độ đọc nổi

## Mục tiêu

Sửa ba điểm trong luồng đọc lá số:

1. CTA tại danh sách chương VIP không cuộn sai vị trí.
2. Phần luận giải cho khách chưa đăng nhập dài khoảng 500 từ.
3. Tiến độ luận giải trả phí luôn dễ nhìn bằng một nút nổi khi người dùng đang đọc.

## CTA hồ sơ VIP

`PersonalizedReportOutline` giữ hai trạng thái riêng:

- Chưa mở khóa: render `button` với `popoverTarget` trỏ tới popup xác nhận mở khóa của `PremiumReadingCta`.
- Đã mở khóa: render `Link` tới `/la-so/{chartId}/nang-cao`.

Không trạng thái nào dùng `href="#luan-giai"`. Cách này ngăn cuộn nhầm về phần luận giải miễn phí và không mở lại popup trừ xu cho hồ sơ đã mua.

## Teaser trước đăng nhập

Đổi giới hạn teaser từ 250 lên 500 từ.

Teaser tiếp tục chỉ chiếu các phần dẫn dụ:

- Mỏ neo.
- Điểm đáng chú ý nhất.
- Một hành động nên làm ngay.

Các phần khóa như khí chất, công việc, tình cảm, sức khỏe và vận năm không được đưa vào teaser. Khi Markdown không đúng cấu trúc, fallback vẫn cắt cứng tối đa 500 từ.

## Nút tiến độ đọc nổi

Thay khối “Vị trí đọc đã được đồng bộ” ở đầu báo cáo bằng một nút float duy nhất.

### Trạng thái mở lại

Nếu có tiến độ đã lưu từ 2% trở lên:

- Nút xuất hiện ngay với nội dung `Đọc tiếp · X% · Chương Y/N`.
- Bấm nút khôi phục chương và độ lệch trong chương đã lưu.
- Sau lần bấm đầu, nút chuyển sang trạng thái tiến độ trực tiếp.

### Trạng thái đang đọc

Khi vùng báo cáo nằm trong viewport:

- Nút cố định ở góc dưới bên phải.
- Hiển thị `X% · Chương Y/N`.
- Thanh tiến độ mảnh nằm trong nút.
- Bấm nút cuộn tới tiêu đề chương hiện tại, giúp người đọc quay lại đầu chương.

Nút có `role="progressbar"`, giá trị ARIA 0–100 và nhãn mô tả rõ. Desktop dùng chiều rộng gọn; mobile đặt cao hơn các nút nổi khác và không che nội dung chính.

Khối `paid-reading-resume` cũ bị loại bỏ để không lặp thông tin hoặc chỉ xuất hiện ở đầu trang.

## Dữ liệu và API

Không thay đổi schema hoặc API. Nút float dùng lại:

- `initialProgress` từ server.
- Logic `IntersectionObserver`.
- API `PUT /api/readings/[id]/progress`.
- Cơ chế debounce và `keepalive` hiện có.

## Kiểm thử

- CTA chưa mở khóa có `popoverTarget` đúng và không có hash link.
- CTA đã mở khóa trỏ đúng `/la-so/chart-id/nang-cao`.
- Teaser cấu trúc chuẩn không vượt 500 từ và không lộ phần khóa.
- Teaser fallback đúng 500 từ.
- Component tiến độ không còn `paid-reading-resume`.
- Component có nút float, nội dung đọc tiếp, tiến độ chương, ARIA và action cuộn.
- Chạy test tập trung, lint, toàn bộ test và production build.

## Ngoài phạm vi

- Thay đổi giá hoặc cơ chế trừ xu.
- Thay đổi nội dung mini-report đầy đủ sau đăng nhập.
- Thay đổi schema lưu tiến độ.
- Tự động mở popup cho hồ sơ đã mua.
