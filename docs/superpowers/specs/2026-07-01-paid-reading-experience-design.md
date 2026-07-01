# Thiết kế nâng cấp trải nghiệm luận giải trả phí

## Mục tiêu

Nâng chất lượng đọc luận giải trả phí theo bốn hướng:

1. Loại bỏ cảm giác báo cáo kỹ thuật do phần “Trung tâm dữ liệu lá số”.
2. Không lặp “Cẩm nang hành động” ở từng chương; thay bằng một chương hành động tổng hợp.
3. Làm nổi bật các kết luận quan trọng nhưng vẫn giữ cảm giác cao cấp, dễ đọc.
4. Cho người dùng biết tiến độ đọc và tiếp tục đúng vị trí trên mọi thiết bị sau khi đăng nhập.

Thay đổi áp dụng cho cả báo cáo tạo mới và báo cáo đã được mở khóa trước đây. Nội dung gốc của báo cáo cũ không bị ghi đè và không gọi AI để sinh lại.

## Phương án đã chọn

Ứng dụng chuẩn hóa nội dung tại lớp trình bày:

- Báo cáo cũ được chuyển đổi trong bộ nhớ trước khi render.
- Báo cáo mới được sinh trực tiếp theo cấu trúc mới.
- Dữ liệu báo cáo cũ trong database được giữ nguyên để có thể hoàn tác và đối chiếu.
- Không phát sinh chi phí AI để tái tạo báo cáo khách đã mua.

Hai phương án không chọn là cập nhật hàng loạt nội dung cũ trong database và sinh lại toàn bộ báo cáo cũ. Cả hai đều tạo rủi ro không cần thiết cho nội dung đã thanh toán.

## Cấu trúc nội dung mới

### Chương luận giải

Tám chương luận giải hiện có tiếp tục giữ chủ đề và thứ tự hiện tại. Mỗi chương chỉ còn:

- `Mỏ neo`
- `Luận giải chi tiết`

Không chương nào chứa “Cẩm nang hành động” hoặc một bản liệt kê dữ liệu kỹ thuật riêng.

Prompt sinh nội dung yêu cầu mỗi chương có từ 3 đến 6 kết luận quan trọng được đánh dấu bằng Markdown `**in đậm**`. Chỉ các kết luận có giá trị định hướng hoặc cảnh báo mới được nhấn mạnh; không in đậm cả đoạn.

### Chương hành động tổng hợp

Báo cáo mới có chương thứ chín: `Kế hoạch hành động cá nhân`, gồm:

1. Việc cần ưu tiên ngay.
2. Kế hoạch 30 ngày.
3. Kế hoạch 90 ngày.
4. Điều cần tránh.
5. Mốc tự đánh giá lại.

Chương này tổng hợp từ toàn bộ tám chương trước, ưu tiên hành động cụ thể, có thời hạn và không lặp lại phần luận giải.

### Chuyển đổi báo cáo cũ

Bộ chuẩn hóa Markdown thực hiện các bước:

1. Loại toàn bộ chương H1 “Trung tâm dữ liệu lá số” cho tới H1 tiếp theo.
2. Tách phần H2 “Cẩm nang hành động” khỏi từng chương.
3. Giữ nguyên các đoạn luận giải còn lại.
4. Gom các phần hành động đã tách vào một H1 cuối cùng mang tên “Kế hoạch hành động cá nhân”.
5. Trong báo cáo cũ, các hành động được nhóm theo tên chương nguồn để giữ đúng ngữ cảnh, thay vì tự suy diễn mốc 30/90 ngày mà nội dung cũ không cung cấp.
6. Nếu báo cáo cũ không có phần hành động, không tạo chương tổng hợp rỗng.
7. Làm nổi bật câu kết luận đầu tiên trong phần “Mỏ neo” nếu chương chưa có nội dung in đậm.

Bộ chuyển đổi phải thuần túy và ổn định: cùng một đầu vào luôn cho cùng một đầu ra, không sửa database và không làm mất nội dung đã mua.

## Trình bày ý quan trọng

`MarkdownContent` tiếp tục dùng cú pháp `**...**`, nhưng trang luận giải nâng cao có kiểu hiển thị riêng:

- Chữ đậm dùng màu nâu cam đậm, tương phản đạt chuẩn đọc.
- Nền vàng kem nhẹ chỉ bao quanh cụm kết luận, không phủ cả đoạn văn.
- Tiêu đề chương và chương đang đọc dùng cùng hệ màu để tạo hệ thống thị giác nhất quán.
- Không dùng quá nhiều màu hoặc hiệu ứng chuyển động.

Kiểu nhấn mạnh chỉ được áp dụng trong vùng luận giải trả phí để không làm thay đổi giao diện bài viết và các Markdown khác trên website.

## Tiến độ đọc

Một client component chuyên trách trải nghiệm đọc sẽ bao quanh mục lục và nội dung báo cáo.

### Hiển thị

- Thanh tiến độ cố định khi người dùng đang ở vùng báo cáo.
- Nội dung trạng thái theo mẫu: `42% · Chương 4/9`.
- Thanh không che nội dung trên desktop hoặc mobile.
- Mục lục tô sáng chương hiện tại.
- Bấm mục lục cuộn mượt tới chương tương ứng.
- Tiến độ được tính trong phạm vi nội dung báo cáo, không dựa trên toàn bộ chiều cao trang.

### Xác định chương và vị trí

- `IntersectionObserver` theo dõi các tiêu đề H1 đã được chuẩn hóa.
- Khi nhiều tiêu đề giao nhau, chương gần vùng đọc phía trên màn hình nhất là chương hiện tại.
- Phần trăm là khoảng cách đã đọc từ đầu tới cuối vùng báo cáo, được giới hạn từ 0 đến 100.
- Trạng thái lưu gồm mã chương ổn định, chỉ số chương, phần trăm toàn báo cáo và tỷ lệ vị trí bên trong chương.
- Mã chương và tỷ lệ trong chương là dữ liệu khôi phục chính; phần trăm toàn báo cáo là dữ liệu dự phòng nếu cấu trúc nội dung thay đổi.

## Lưu và khôi phục đa thiết bị

### Mô hình dữ liệu

Thêm model `ReadingProgress`:

- `id`
- `userId`
- `readingId`
- `chapterKey`
- `chapterIndex`
- `percent`
- `chapterOffset`
- `createdAt`
- `updatedAt`

Cặp `userId + readingId` là duy nhất. Quan hệ tới người dùng và báo cáo dùng xóa dây chuyền để không tạo dữ liệu mồ côi.

### Luồng lưu

- Trang server đọc tiến độ hiện có cùng báo cáo và truyền xuống client.
- Client gửi cập nhật qua API sau khi trạng thái ổn định khoảng 2 giây.
- Chỉ gửi khi chương hoặc vị trí thay đổi đủ đáng kể.
- Khi người dùng rời trang, client cố gửi trạng thái cuối bằng cơ chế phù hợp với trình duyệt.
- Lỗi mạng không chặn việc đọc; trạng thái mới nhất được giữ ở client và thử lại ở lần cập nhật sau.

### Luồng đọc tiếp

Khi báo cáo có tiến độ hợp lệ lớn hơn mức tối thiểu:

- Hiện nút `Đọc tiếp từ Chương X — Y%`.
- Không tự động cuộn khi vừa mở trang.
- Khi người dùng bấm, tìm chương theo `chapterKey`, sau đó khôi phục tỷ lệ trong chương.
- Nếu không còn mã chương đó, dùng phần trăm toàn báo cáo làm dự phòng.
- Khi báo cáo đã gần 100%, nút đổi thành `Xem lại phần cuối` thay vì tạo cảm giác còn nội dung chưa đọc.

## API và phân quyền

Tạo endpoint cập nhật tiến độ theo `readingId`.

Endpoint phải:

- Yêu cầu phiên đăng nhập hợp lệ.
- Xác minh báo cáo thuộc chính người dùng hiện tại.
- Chỉ chấp nhận báo cáo trả phí đã hoàn tất.
- Kiểm tra `percent` trong khoảng 0–100, `chapterOffset` trong khoảng 0–1 và giới hạn độ dài `chapterKey`.
- Upsert theo cặp `userId + readingId`.
- Trả `401` nếu chưa đăng nhập, `404` nếu báo cáo không tồn tại hoặc không thuộc người dùng, và `400` cho payload không hợp lệ.

Không cho phép client truyền `userId`.

## Ranh giới thành phần

- Bộ chuẩn hóa nội dung: nhận Markdown thô, trả Markdown trình bày và danh sách chương.
- Trình tạo nội dung: định nghĩa cấu trúc chín chương cho báo cáo mới.
- Server page: tải báo cáo, quyền sở hữu và tiến độ ban đầu.
- Reading progress component: theo dõi cuộn, hiển thị trạng thái, điều khiển mục lục và gửi cập nhật.
- API progress: xác thực, kiểm tra quyền và lưu trạng thái.

Các phần trên giao tiếp qua kiểu dữ liệu rõ ràng; logic phân tích Markdown và logic theo dõi cuộn không nằm trong page component.

## Tương thích và triển khai

- Migration chỉ thêm bảng mới, không sửa hoặc xóa nội dung `Reading`.
- Báo cáo cũ được chuẩn hóa ngay lần hiển thị đầu tiên sau deploy.
- Nếu chưa chạy migration, phần báo cáo không được phép lỗi trắng; việc tải tiến độ thất bại phải suy giảm an toàn về trạng thái chưa lưu.
- Không thay đổi giá, cơ chế trừ xu, quyền mở khóa hoặc nội dung luận giải miễn phí.
- Không thay đổi engine lập lá số.

## Kiểm thử chấp nhận

### Nội dung

- Báo cáo mới không chứa “Trung tâm dữ liệu lá số”.
- Tám chương đầu không chứa “Cẩm nang hành động”.
- Báo cáo mới có một chương hành động cuối cùng với đủ năm phần.
- Các ý quan trọng có đánh dấu in đậm nhưng không in đậm nguyên đoạn.
- Báo cáo cũ loại đúng dashboard, giữ nguyên luận giải và gom đủ các phần hành động.
- Chạy bộ chuẩn hóa nhiều lần không tiếp tục làm thay đổi đầu ra.

### Tiến độ và API

- Tính đúng phần trăm tại đầu, giữa và cuối vùng báo cáo.
- Xác định đúng chương hiện tại khi cuộn và khi bấm mục lục.
- API từ chối khách chưa đăng nhập và người không sở hữu báo cáo.
- Cập nhật nhiều lần chỉ tạo một bản ghi cho mỗi người dùng và báo cáo.
- Mở trên thiết bị khác hiển thị đúng nút đọc tiếp.
- Khôi phục theo chương và vị trí trong chương; dùng phần trăm dự phòng khi mã chương không còn.
- Lỗi lưu không làm gián đoạn nội dung.

### Giao diện

- Thanh tiến độ và nút đọc tiếp không che nội dung ở mobile và desktop.
- Chương đang đọc có trạng thái rõ ràng trong mục lục.
- Màu nhấn mạnh dễ đọc và chỉ ảnh hưởng vùng luận giải trả phí.

### Kiểm tra dự án

Chạy kiểm thử tập trung cho bộ chuẩn hóa, cấu trúc prompt, API và logic tiến độ; sau đó chạy:

```powershell
npm run lint
npm test
npm run build
```

Thực hiện kiểm tra trình duyệt ở kích thước mobile và desktop cho cuộn, mục lục, nút đọc tiếp và lỗi console.

## Ngoài phạm vi

- Sinh lại nội dung báo cáo cũ bằng AI.
- Chỉnh sửa trực tiếp hàng loạt báo cáo cũ trong database.
- Thay đổi giá hoặc luồng thanh toán.
- Thêm ghi chú, bookmark thủ công hoặc đánh dấu đã đọc theo từng đoạn.
- Đồng bộ tiến độ cho người dùng chưa đăng nhập.
