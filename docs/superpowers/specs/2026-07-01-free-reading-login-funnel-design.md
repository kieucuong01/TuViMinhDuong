# Thiết kế luận giải miễn phí dẫn đến đăng nhập

## Mục tiêu

Thiết kế lại phần luận giải miễn phí trên trang lá số để người chưa đăng nhập nhận được một kết quả cá nhân hóa đủ thuyết phục, đồng thời còn động lực đăng nhập để đọc tiếp.

Luồng mới phải:

- Giữ trải nghiệm fast-first hiện tại: có bản dự phòng ngay, bản AI cập nhật ở nền.
- Cho khách xem teaser khoảng 180–250 từ.
- Sau đăng nhập, quay lại đúng lá số và mở mini-report miễn phí khoảng 1.200 từ.
- Chỉ dẫn sang hồ sơ VIP sau khi người dùng đã đọc bản miễn phí.
- Không gọi thêm một lượt AI chỉ để tạo teaser.

## Quyết định sản phẩm

Một nội dung mini-report duy nhất được tạo cho mỗi lá số. Giao diện quyết định phần nào được hiển thị theo trạng thái đăng nhập:

- Khách chưa đăng nhập: chỉ thấy “Mỏ neo”, “Điểm đáng chú ý nhất”, một hành động thực tế và bản xem trước các phần đang khóa.
- Người đã đăng nhập: thấy toàn bộ mini-report.
- Người đã đăng nhập chưa mua VIP: cuối mini-report có CTA dẫn xuống khu vực mở khóa hồ sơ VIP.

Cách này giữ teaser và bản đầy đủ nhất quán, không tăng chi phí AI và không tạo thêm trạng thái lưu trữ.

## Hợp đồng nội dung mini-report

Mục tiêu là 1.150–1.250 từ tiếng Việt. Bộ kiểm tra chấp nhận 1.000–1.400 từ để không loại một bản tốt chỉ vì sai lệch nhỏ.

Markdown phải có các phần theo đúng thứ tự:

1. `## Mỏ neo`
   - Ba chỉ số `/100`: Nội lực, Công việc & tài chính, Vận năm.
   - Mỗi chỉ số có một câu diễn giải ngắn.
2. `## Điểm đáng chú ý nhất`
   - Một mâu thuẫn, cơ hội hoặc điểm nghẽn cá nhân đáng quan tâm nhất.
   - Gắn nhẹ với cung, sao, trạng thái sao, Tuần/Triệt hoặc đại vận.
3. `## Khí chất và nội lực`
   - Giải thích cách suy nghĩ, ra quyết định và môi trường phù hợp.
4. `## Công việc và tài chính`
   - Nêu lợi thế, rủi ro và điều kiện cần kiểm chứng.
5. `## Tình cảm và quan hệ`
   - Nêu xu hướng giao tiếp, ranh giới và cách xử lý mâu thuẫn.
6. `## Sức khỏe và nhịp sống`
   - Chỉ đưa khuyến nghị sinh hoạt thận trọng; không chẩn đoán y khoa.
7. `## Vận năm <năm xem>`
   - Nêu một vùng cơ hội, một vùng cần thận trọng và nhịp hành động phù hợp.
8. `## Cẩm nang hành động`
   - Năm đến bảy hành động cụ thể, ngắn và có thể kiểm chứng.

Giọng văn học theo ưu điểm của bản chi tiết mẫu: nhận định trực diện, dẫn chứng vừa đủ, liên hệ đời sống và kết thúc bằng hành động. Không sao chép độ dài của báo cáo trả phí, không khẳng định chắc chắn biến cố, không dọa nạt và không lặp dữ kiện kỹ thuật.

## Teaser dành cho khách

Teaser được trích từ cùng mini-report, không sinh nội dung mới:

- Hiển thị đầy đủ `Mỏ neo`.
- Hiển thị đầy đủ `Điểm đáng chú ý nhất`.
- Hiển thị hành động đầu tiên trong `Cẩm nang hành động`.
- Phần còn lại được thay bằng bốn hàng khóa:
  - Khí chất và nội lực
  - Công việc và tài chính
  - Tình cảm và quan hệ
  - Vận năm và cẩm nang hành động

CTA chính:

`Đăng nhập miễn phí để xem toàn bộ luận giải`

Copy hỗ trợ:

`Lá số này sẽ được giữ nguyên. Sau đăng nhập, bạn quay lại đúng vị trí và đọc tiếp bản mini-report khoảng 1.200 từ.`

CTA dùng lại modal đăng nhập và cơ chế `next`/hash hiện có. Sau đăng nhập, trang quay lại đúng lá số và cuộn tới khối luận giải.

## Trải nghiệm sau đăng nhập

Người dùng thấy toàn bộ mini-report tại cùng vị trí, không phải tạo lại lá số. Nếu bản AI vẫn đang xử lý, giao diện tiếp tục hiển thị bản dự phòng và tự cập nhật khi sẵn sàng.

Cuối mini-report có một khối chuyển tiếp:

- Tóm tắt rằng bản miễn phí đã chỉ ra các trục chính.
- Nêu rõ hồ sơ VIP mở rộng sang 12 cung, đại vận và mốc theo thời gian.
- CTA `Xem hồ sơ luận giải chuyên sâu` cuộn tới khu vực mở khóa hiện có.

## Kiến trúc và dữ liệu

### Tạo nội dung

- Nâng phiên bản `FREE_OVERVIEW_VERSION` để các bản cache cũ không được coi là hoàn chỉnh.
- Sửa prompt AI và bản fallback để tuân thủ hợp đồng 8 phần.
- Sửa `isCompleteFreeOverview` theo khoảng từ và các heading mới.
- Giữ router nhà cung cấp và cơ chế background job hiện tại.

### Phân tầng hiển thị

- Tạo hàm thuần để tách mini-report thành teaser và nội dung đầy đủ.
- Hàm tách dựa trên heading Markdown, có fallback an toàn nếu AI trả định dạng thiếu.
- `FreeOverviewLoader` nhận `isSignedIn` như hiện tại:
  - `false`: render teaser, khóa nội dung và CTA đăng nhập.
  - `true`: render toàn bộ nội dung và CTA VIP ở cuối.

Không dùng CSS blur để che nội dung đã có trong DOM. Khách chỉ nhận phần teaser cần hiển thị, tránh việc xem source để đọc bản đầy đủ.

## Xử lý lỗi

- Nếu bản AI chưa sẵn sàng, bản fallback mới vẫn có đủ cấu trúc để teaser hoạt động.
- Nếu thiếu heading, teaser chỉ lấy tối đa 250 từ đầu và hiển thị danh sách khóa; không làm vỡ trang.
- Nếu job thất bại hoặc stale, giữ nút thử lại hiện có.
- Nếu đăng nhập thất bại, người dùng vẫn ở trang lá số và không mất dữ liệu.

## Kiểm thử

### Unit

- Prompt yêu cầu 1.200 từ và đủ 8 phần.
- Guard chấp nhận 1.000–1.400 từ, từ chối thiếu heading hoặc thiếu bằng chứng lá số.
- Fallback nằm trong khoảng từ và đủ cấu trúc.
- Hàm tạo teaser chỉ trả đúng các phần được phép và không chứa nội dung khóa.
- Teaser có fallback an toàn khi Markdown không đúng chuẩn.

### Component/source contract

- Khách thấy CTA đăng nhập và bốn mục khóa.
- Người đăng nhập thấy toàn bộ mini-report và CTA VIP.
- Link đăng nhập giữ đúng chart path cùng hash luận giải.
- Loader/polling/retry hiện tại không bị thay đổi.

### Regression

- Chạy test AI và component liên quan.
- Chạy toàn bộ `npm run lint`, `npm test`, `npm run build`.
- Kiểm tra thủ công hai trạng thái guest/signed-in trên một lá số.

## Ngoài phạm vi

- Không thay đổi thuật toán lập lá số.
- Không thay đổi giá hoặc cổng thanh toán.
- Không tạo thêm gói luận giải.
- Không thay đổi nội dung báo cáo VIP trong hạng mục này.
