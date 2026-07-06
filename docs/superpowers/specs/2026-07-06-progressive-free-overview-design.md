# Progressive Free Overview Design

## Mục tiêu

Người chưa đăng nhập phải có nội dung luận giải cá nhân hóa để đọc sớm, thay vì chỉ nhìn thấy thông báo chờ trong lúc hệ thống viết toàn bộ mini-report. Nội dung hiển thị vẫn phải do LLM tạo, không dùng lại template luận giải.

## Trải nghiệm người dùng

1. Ngay sau khi tạo lá số, khu vực luận giải hiển thị trạng thái “Đang đọc những tín hiệu nổi bật trong lá số…”.
2. LLM tạo trước một đoạn mở đầu ngắn khoảng 150–200 từ và lưu cùng lá số.
3. Khi đoạn mở đầu sẵn sàng, giao diện hé lộ nội dung theo từng cụm từ với con trỏ nhấp nháy để tạo cảm giác đang viết.
4. Với khách chưa đăng nhập, nút “Đăng nhập miễn phí để xem chi tiết” luôn xuất hiện trong khu vực này, kể cả khi đoạn mở đầu hoặc bản đầy đủ còn đang tạo.
5. Hệ thống tiếp tục tạo mini-report đầy đủ ở nền. Khi hoàn tất, giao diện chuyển sang đoạn teaser dành cho khách hoặc toàn bộ mini-report dành cho người đã đăng nhập mà không tải lại trang.
6. Đăng nhập giữ nguyên lá số và đưa người dùng trở lại `#luan-giai`.

## Kiến trúc và dữ liệu

- Bổ sung một bản LLM preview ngắn vào dữ liệu JSON của lá số, có phiên bản, nội dung, model và thời điểm tạo.
- Trạng thái API của free overview có thêm trạng thái `preview`, phân biệt rõ với `ready`, `processing` và lỗi.
- Job nền tạo preview trước, lưu ngay, rồi mới tạo bản đầy đủ. Nếu preview đã hợp lệ thì không tạo lại khi retry.
- Khi bản đầy đủ hoàn tất, dữ liệu đầy đủ là nguồn chuẩn; preview chỉ phục vụ thời gian chờ.
- Không dùng `buildInstantFreeOverview` hoặc nội dung template làm bản luận giải hiển thị.

## Giao diện

- `FreeOverviewLoader` hỗ trợ trạng thái `preview`.
- Hiệu ứng viết chỉ là hiệu ứng hé lộ nội dung LLM đã nhận được; không tạo thêm nội dung ở trình duyệt.
- CTA đăng nhập dùng luồng modal hiện có và `nextPath=/la-so/<id>#luan-giai`.
- Người dùng bật chế độ giảm chuyển động sẽ nhận toàn bộ đoạn preview ngay, không chạy hiệu ứng gõ chữ.
- Khi job lỗi hoặc quá hạn, giữ lại preview đã có, hiển thị nút thử lại và không làm mất CTA.

## Xử lý lỗi

- Preview lỗi: tiếp tục thử tạo bản đầy đủ; UI hiển thị trạng thái chờ và CTA.
- Bản đầy đủ lỗi nhưng preview đã có: giữ preview, báo chưa viết xong phần chi tiết và cho phép thử lại.
- Cả hai cùng lỗi: hiện thông báo ngắn, nút thử lại và CTA đăng nhập.

## Kiểm thử

- Kiểm tra prompt và giới hạn độ dài preview.
- Kiểm tra trạng thái dữ liệu trả `preview` khi có preview hợp lệ nhưng chưa có bản đầy đủ.
- Kiểm tra API không xóa nội dung preview đối với khách.
- Kiểm tra loader có hiệu ứng viết, hỗ trợ reduced motion, CTA luôn xuất hiện cho khách và vẫn polling đến `ready`.
- Chạy test tập trung, lint và build theo thang kiểm chứng của repo.
