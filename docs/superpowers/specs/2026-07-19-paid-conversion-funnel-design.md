# Thiết kế nâng chuyển đổi lá số trả phí

## Mục tiêu

Tăng tỷ lệ người lập lá số chuyển sang bản FULL mà không giảm giá, không ép thanh toán và không làm yếu hàng rào sở hữu lá số.

Ảnh chụp dữ liệu production đến ngày 18/07/2026 cho thấy:

- 30 ngày: 876 lá số, 105 lá số gắn tài khoản (12%), 29 lá số có luận giải tính phí hoàn tất (3,3%).
- 7 ngày: 267 lá số, 24 lá số gắn tài khoản (9%), 3 lá số có luận giải tính phí hoàn tất (1,1%).
- 88-91% lá số vẫn ở trạng thái khách.
- Khách chỉ thấy 2/4 phần miễn phí và chưa thấy giá trị hoặc giá 199.000đ của bản FULL trước khi đăng nhập.

Mục tiêu sau 30 ngày kể từ khi phát hành đầy đủ:

- Tỷ lệ lá số được gắn tài khoản đạt ít nhất 18%.
- Tỷ lệ lá số dẫn tới luận giải tính phí hoàn tất đạt ít nhất 4,5%; doanh thu tiền mặt được báo cáo riêng từ PaymentOrder PAID.
- Luận giải miễn phí đủ dài và có căn cứ để giữ chân người đọc, xây dựng niềm tin trước khi mời họ lưu lá số hoặc mua bản FULL.
- Không phát sinh trường hợp trả tiền hai lần cho cùng bản FULL, mất quyền đọc sau khi đã trả tiền hoặc mở nội dung của lá số không thuộc người dùng.

Giá bản FULL giữ nguyên 199.000đ, tương đương 199 xu. Không thêm giảm giá, đếm ngược hoặc khan hiếm giả.

## Phương án đã chọn

Áp dụng một thay đổi 80/20 trên luồng hiện có:

1. Sửa GA4 và chứng minh trình duyệt production thực sự phát dữ liệu.
2. Nâng cách trình bày luận giải miễn phí nhưng giữ lượng nội dung dài: khách đọc từ 800 đến 950 từ, người đã lưu lá số đọc đủ từ 1.400 đến 1.650 từ.
3. Cho khách thấy giá trị và giá bản FULL ngay trên lá số, nhưng CTA chính vẫn là lưu lá số và đọc tiếp miễn phí.
4. Sau khi đăng nhập hoặc tạo tài khoản, gắn lá số hiện tại cho người dùng rồi đưa họ trở lại đúng ngữ cảnh mua FULL.
5. Dùng PayOS 199.000đ làm lựa chọn chính; dùng 199 xu là lựa chọn phụ khi đủ số dư.
6. Sửa hai rủi ro trên đúng luồng này: kiểm tra sở hữu cho mọi cách mở trả phí và tái dùng quyền đã thanh toán khi quá trình sinh FULL lỗi.

Không xây guest checkout, không thêm hệ thống analytics riêng và không thiết kế lại toàn bộ website.

## Trình tự phát hành

Thiết kế có hai checkpoint production độc lập nhưng nằm trong cùng một kế hoạch triển khai.

### Checkpoint A: khôi phục đo lường

Sửa GA4, deploy và xác minh request `g/collect` trước khi phát hành thay đổi giao diện. Nếu chưa chứng minh được hit gửi tới đúng Measurement ID thì dừng tại checkpoint này.

### Checkpoint B: phát hành funnel và chốt an toàn

Chỉ thực hiện sau khi checkpoint A đạt yêu cầu. Nâng cấp luận giải miễn phí, thay đổi giao diện, event funnel, ownership và retry đơn đã trả tiền được phát hành cùng nhau để số liệu sau phát hành có thể tin cậy.

## Luồng người dùng

### Khách vừa lập lá số

Thứ tự trang lá số:

1. Tiêu đề và bàn lá số.
2. Các thao tác cần thiết như sửa thông tin hoặc tải ảnh.
3. Luận giải miễn phí 2/4 phần.
4. Khối lưu lá số và đọc tiếp.
5. Khối giới thiệu bản FULL.
6. Các đường dẫn giữ chân thứ cấp như vận tháng, ngày tốt hoặc nội dung tra cứu.

Khối lưu lá số dùng nội dung:

- Tiêu đề: `Lưu lá số của [Tên] để đọc tiếp miễn phí`.
- CTA: `Lưu lá số & đọc tiếp miễn phí`.
- Trợ giúp: `Email mới tự tạo tài khoản • Tặng 30 xu • Có thể dùng Google • Chưa mất phí`.

Khối FULL được hiển thị cho cả khách, nêu rõ có 9 chương cá nhân hóa và giá 199.000đ. Khối này không mở nội dung trả phí và không biến CTA thanh toán thành hành động chính của khách.

Với khách, mọi CTA trong khối FULL mở cùng luồng lưu lá số/đăng nhập, không gọi checkout. Sau khi xác thực và claim thành công, người dùng trở lại khối FULL trên cùng lá số; chỉ user đã đăng nhập và sở hữu lá số mới mở được modal thanh toán.

### Sau khi đăng nhập hoặc tạo tài khoản

Luồng xác thực giữ nguyên email/mật khẩu và Google hiện có. Khi thành công:

1. Claim lá số hiện tại nếu lá số chưa có chủ sở hữu.
2. Trở lại cùng URL lá số.
3. Hiển thị đủ 4/4 phần miễn phí.
4. Hiển thị ba chương đầu của outline FULL và cho mở rộng để xem tên sáu chương còn lại.
5. CTA: `Mở bản FULL 9 chương — 199.000đ`.

Không claim lại lá số đã thuộc người khác. Việc claim thành công phải được ghi nhận riêng với việc đăng nhập thành công.

### Chọn thanh toán

Modal FULL nêu ngắn gọn lợi ích, giá và trạng thái thanh toán một lần:

- Lựa chọn chính: thanh toán PayOS 199.000đ.
- Lựa chọn phụ: dùng 199 xu nếu số dư đủ.
- Nếu thiếu xu, không đẩy người dùng qua một vòng nạp xu khó hiểu; PayOS trực tiếp vẫn là đường ngắn nhất.
- Cancel quay lại đúng lá số với marker `checkout=cancelled`, giữ nguyên nội dung miễn phí và phát event hủy một lần.

Không thay đổi trang pricing hoặc các gói xu ngoài phần cần để giữ ngữ cảnh lá số.

## Nâng cấp luận giải miễn phí

### Độ dài và nguyên tắc giữ chân

Không rút ngắn luận giải chỉ để đưa CTA lên sớm. Nội dung phải cho người đọc nhận được giá trị thật trước khi gặp lời mời chuyển đổi:

- Khách chưa đăng nhập đọc từ 800 đến 950 từ, gồm trọn hai phần đầu trong bốn phần miễn phí.
- Người đã lưu lá số đọc đủ bốn phần, tổng từ 1.400 đến 1.650 từ như hiện tại.
- Thêm một khối `Đọc nhanh` từ 80 đến 120 từ ở đầu để nêu điểm nổi bật nhất, nhưng toàn bộ phần phân tích dài vẫn hiển thị ngay bên dưới.
- Hai khoảng độ dài trên là biên inclusive và tính toàn bộ nội dung luận giải nhìn thấy, gồm `Đọc nhanh`, câu hỏi tự đối chiếu và cầu nối FULL; không tính nhãn nút hoặc copy đăng nhập.
- Không dùng accordion, nút “xem thêm” hoặc cắt đoạn để che nội dung đã được phép đọc.
- Không kéo dài bằng câu đệm hoặc lặp lại cùng một nhận định. Độ dài đến từ sắc thái, bằng chứng và gợi ý thực tế.

Điểm cắt guest luôn nằm ngay trước heading phần 3, không phụ thuộc số từ tại thời điểm render. Hai biên độ dài là acceptance của bộ sinh nội dung: bộ sinh phải điều chỉnh cách ghép các trường rule một cách xác định trước khi trả Markdown; presentation không cắt theo ký tự, từ hoặc chiều cao CSS.

### Cấu trúc nội dung

Giữ engine 251 quy tắc xác định hiện có và cùng cách chọn quy tắc. Engine chịu trách nhiệm tạo toàn bộ Markdown, gồm `Đọc nhanh`, bốn phần và cầu nối. Presentation chỉ tách guest content tại marker heading phần 3, không sinh hoặc tóm tắt nội dung.

Grammar Markdown cố định để renderer và test nhận diện chắc chắn:

- `### Đọc nhanh` chỉ xuất hiện một lần trước `## 1. ...`.
- Bốn phần dùng H2 có số thứ tự: `## 1. ...` đến `## 4. ...`.
- Trong mỗi phần, các nhãn semantic dùng đúng H3: `### Điểm nổi bật`, `### Lợi thế`, `### Điểm cần lưu ý`, `### Gợi ý thực tế` và `### Vì sao có nhận định này`.
- Câu hỏi tự đối chiếu và cầu nối FULL nằm sau H3 cuối của phần 2 nhưng trước `## 3. ...`.

Mỗi phần được biên tập theo một nhịp đọc nhất quán:

1. `Điểm nổi bật`: nhận định rõ và gần với trải nghiệm đời sống.
2. `Lợi thế`: điều người đọc có thể tận dụng.
3. `Điểm cần lưu ý`: rủi ro hoặc xu hướng cần quan sát, dùng ngôn ngữ có điều kiện.
4. `Gợi ý thực tế`: một hành động cụ thể, không hứa hẹn kết quả chắc chắn.
5. `Vì sao có nhận định này`: nêu cung, sao hoặc trạng thái làm căn cứ.

Quy tắc chính dẫn dắt trọn cấu trúc trên. Nội dung không trùng từ các trường `evidence`, `strength`, `caution` và `advice` của quy tắc hỗ trợ được ghép vào đúng H3 liên quan, thay vì render lại một khuôn năm mục thứ hai. Nhờ vậy giữ được độ sâu và ngưỡng từ mà không cần thêm filler, AI hoặc quy tắc mới. `Đọc nhanh` chỉ rút ý trực tiếp từ summary của quy tắc chính và một quy tắc hỗ trợ liên quan; phần phân tích bên dưới mở rộng căn cứ, không lặp nguyên văn đoạn tóm tắt. Chỉ kết hợp hai dấu hiệu khi chúng cùng liên quan tới một cung hoặc đã có quy tắc tổng hợp hiện hữu; không tự suy diễn tổ hợp mới.

Ngay cuối phần thứ hai, trước điểm cắt dành cho khách, hiển thị một câu hỏi tự đối chiếu và một cầu nối ngắn tới bản FULL. Cầu nối giải thích bản FULL đào sâu điều gì còn thiếu, không tạo sợ hãi và không làm mất CTA chính `Lưu lá số & đọc tiếp miễn phí`.

### Phân cấp thị giác

Mở rộng Markdown renderer hiện có bằng một mapping nhỏ từ năm nhãn H3 cố định sang class hoặc `data-*` semantic; không tạo renderer thứ hai và không thêm dependency. CSS scoped dùng các marker này để phân cấp:

- Phần nội dung chính có cỡ chữ tối thiểu khoảng 17px, line-height khoảng 1,75, chiều rộng đọc 68–72 ký tự và căn trái thay vì căn đều.
- Khối điểm nổi bật dùng nền cam ấm; điểm cần lưu ý dùng hồng nhạt; gợi ý thực tế dùng xanh nhạt; bằng chứng dùng màu đá trung tính.
- Mỗi loại khối có nhãn chữ và đường viền riêng, không dùng màu làm tín hiệu duy nhất; màu chữ và nền phải đạt tương phản tối thiểu 4,5:1.
- Chữ đậm chỉ dành cho câu chốt, từ khóa hoặc hành động quan trọng; không tô màu tràn lan.
- Trên mobile, các khối xếp một cột, không tràn ngang và không dùng animation hay gradient text gây phân tán.

### Độ tin cậy

Luận giải miễn phí vẫn được tạo hoàn toàn từ dữ liệu lá số và engine quy tắc xác định; không gọi AI và không thay đổi engine lập lá số. Mọi nhận định nổi bật phải có phần căn cứ đi kèm. Câu chữ dùng các dạng `có xu hướng`, `thường`, `dễ` hoặc `nên lưu ý`, không khẳng định định mệnh, sự kiện chắc chắn hay kết quả tài chính, sức khỏe và quan hệ.

## Khôi phục GA4

### Nguyên nhân gốc

Ba hàm khởi tạo `window.gtag` hiện đẩy rest-array vào `dataLayer`:

```ts
function gtag(...args: unknown[]) {
  window.dataLayer?.push(args);
}
```

`gtag.js` yêu cầu hàng đợi lệnh theo snippet chuẩn `dataLayer.push(arguments)`. A/B browser smoke chỉ thay kiểu phần tử hàng đợi cho kết quả:

- `Array`: không phát request collect.
- `Arguments`: phát request `g/collect`.

Sửa cả ba shim hiện có về `arguments`; không tạo helper hoặc thư viện analytics mới. Ba vị trí là deferred loader, SPA page view và Google Ads event reporter.

Các hit đã mất trước khi sửa không thể phục hồi. Đo lường chỉ được xem là đáng tin từ thời điểm checkpoint A được xác minh trên production.

### Điều kiện chấp nhận GA4

Trên một browser profile mới:

- `gtag.js?id=G-5JSNC2T5G0` trả HTTP thành công.
- Initial `page_view` tạo request `g/collect` có `tid=G-5JSNC2T5G0`.
- Điều hướng client tạo đúng một page view mới.
- Một custom funnel event tạo collect request tới cùng Measurement ID.
- Không có lỗi console liên quan đến Google tag.
- Realtime hoặc DebugView nhận được phiên kiểm tra sau thời gian xử lý cho phép.

Không dùng sự hiện diện của script hoặc `dataLayer` làm bằng chứng hoàn tất nếu chưa thấy request collect.

## Sự kiện funnel

Tiếp tục dùng GA4 và reporter hiện có; không thêm bảng analytics hoặc dịch vụ bên thứ ba.

| Giai đoạn | Event | Điều kiện |
|---|---|---|
| Tạo lá số | `create_chart` | Redirect tạo lá số thành công |
| Đọc miễn phí | `free_overview_viewed` | Khối miễn phí đạt ngưỡng nhìn thấy hiện có |
| Gặp login gate | `login_gate_viewed` | Gate đạt ngưỡng nhìn thấy |
| Bấm lưu | `login_gate_clicked` | Người dùng mở luồng xác thực |
| Xác thực xong | `account_completed` | Login hoặc tạo tài khoản thành công |
| Claim lá số | `guest_chart_claimed` | Cập nhật `userId` từ null thành người dùng hiện tại thành công |
| Thấy offer | `full_offer_viewed` | Offer đạt ngưỡng nhìn thấy |
| Mở offer | `full_offer_clicked` | Mở modal FULL |
| Bắt đầu mua | `begin_checkout` | Submit PayOS trực tiếp hoặc submit dùng xu |
| Thanh toán | `purchase` | Server đã xác minh PaymentOrder PAID và số tiền hợp lệ |
| Luận giải xong | `reading_completed` | Reading chuyển sang COMPLETED |
| Hủy hoặc lỗi | `checkout_cancelled`, `checkout_failed` | Return/cancel hoặc lỗi checkout xác định được |

Event không chứa email, họ tên, ngày sinh hoặc nội dung lá số. `account_completed` chỉ thêm kết quả `login` hoặc `register`; `begin_checkout` chỉ thêm phương thức `payos` hoặc `coins`. `transaction_id` chỉ dùng cho `purchase` để chống đếm trùng. Các event view, submit và `reading_completed` dùng cơ chế dedupe hiện có; kiểm thử sau sửa GA phải dùng profile mới để không bị key cũ trong `localStorage` che mất event.

## An toàn và xử lý lỗi

### Quyền sở hữu

Mọi đường mở nội dung bằng xu hoặc theo bundle phải kiểm tra chart thuộc người dùng hiện tại, ngoại trừ admin. Kiểm tra đặt trong các hàm unlock dùng chung để bảo vệ tất cả caller, không lặp guard ở từng component.

Nếu không sở hữu, trả trạng thái forbidden an toàn và không trừ xu, không tạo Reading.

### Bản FULL đã trả tiền nhưng sinh lỗi

Không thêm bảng hay entitlement mới. Tái dùng dữ liệu hiện có:

- Reading FULL duy nhất theo `userId + chartId + type + scopeKey`.
- `promptMeta.paymentOrderId` nối Reading trả tiền với PaymentOrder.
- PaymentOrder phải thuộc đúng user, ở trạng thái PAID và metadata phải trỏ đúng chart FULL.

Khi người dùng bấm lại CTA và Reading đang FAILED nhưng bằng chứng thanh toán trên hợp lệ, chuyển chính Reading đó về PENDING và chạy lại. Không tạo checkout PayOS mới. Nếu không có bằng chứng thanh toán hợp lệ, đi theo luồng mua bình thường.

Luồng mua bằng xu tiếp tục hoàn xu theo hành vi hiện có khi sinh nội dung lỗi.

## Ranh giới thành phần

- Chart page quyết định thứ tự các khối và truyền trạng thái guest/user; không chứa logic thanh toán.
- Free overview engine dùng lại 251 quy tắc để tạo toàn bộ Markdown dài có cấu trúc, bằng chứng và cầu nối sau phần thứ hai; không gọi AI.
- Free overview presentation chỉ tách tại marker `## 3. ...`, giữ trạng thái 2/4 hoặc 4/4 và không cắt theo số từ.
- Markdown renderer hiện có ánh xạ các nhãn H3 cố định sang marker semantic; CSS scoped trình bày các marker đó, không thêm renderer hoặc dependency mới.
- Login modal phụ trách copy lưu lá số và mở xác thực.
- Personalized report outline hiển thị offer cho cả guest nhưng không cấp quyền nội dung.
- Premium reading CTA phụ trách modal và hai lựa chọn thanh toán hiện có.
- Auth/data layer claim lá số và trả kết quả boolean để phát event chính xác.
- Shared reading unlock layer kiểm tra ownership trước khi trừ xu.
- Checkout action tái dùng Reading đã có quyền trả tiền trước khi tạo PayOS order mới.
- Google event reporter chỉ chuẩn hóa và phát event; quyết định thanh toán thành công vẫn thuộc server.

Không thêm abstraction nếu một thay đổi tại helper hiện có hoặc action hiện có đã bảo vệ được toàn bộ luồng.

## Kiểm thử chấp nhận

### Funnel

- Guest thấy 2/4 phần miễn phí, từ 800 đến 950 từ tính cả hai đầu mốc, một câu hỏi tự đối chiếu, cầu nối FULL, tên 9 chương và giá 199.000đ trước đăng nhập.
- CTA chính của guest nói rõ lưu và đọc tiếp miễn phí; không mở thanh toán ngoài ý muốn.
- Email mới tạo tài khoản, nhận 30 xu, claim đúng lá số và quay lại cùng trang.
- User thấy 4/4 phần miễn phí, tổng từ 1.400 đến 1.650 từ tính cả hai đầu mốc và CTA FULL đúng giá.
- PayOS và xu cùng phát `begin_checkout` một lần cho mỗi hành động.

### Nội dung miễn phí

- Cùng một lá số và cùng phiên bản quy tắc luôn cho cùng một luận giải; quá trình tạo không gọi AI.
- Khối `Đọc nhanh` dài từ 80 đến 120 từ tính cả hai đầu mốc nhưng không thay thế hoặc làm ẩn phần phân tích dài.
- Mỗi phần có điểm nổi bật, lợi thế, điểm cần lưu ý, gợi ý thực tế và căn cứ; quy tắc hỗ trợ không lặp nguyên cấu trúc.
- Bộ đếm tính cả `Đọc nhanh`, câu hỏi và cầu nối; không tính copy UI. Các mẫu fixture phải nằm trong cả biên guest 800–950 và biên toàn bài 1.400–1.650.
- Điểm cắt luôn ở trước H2 phần 3; khách không thấy nội dung riêng của phần ba hoặc phần bốn trước khi claim lá số và không có đoạn nào bị cắt giữa chừng.
- Test parser xác nhận đúng một `Đọc nhanh`, bốn H2 đánh số và năm nhãn H3 trong mỗi phần.
- Không có tổ hợp sao tự suy diễn, dữ liệu nhận dạng cá nhân, lời khẳng định định mệnh hoặc hứa hẹn kết quả chắc chắn.

### Quyền và thanh toán

- User không thể dùng xu mở nội dung của chart thuộc người khác.
- Thao tác bị từ chối không làm thay đổi số dư hoặc tạo Reading.
- Reading FULL đã trả tiền nhưng FAILED được chạy lại trên cùng entitlement.
- Retry không tạo PaymentOrder mới và không yêu cầu trả tiền lần hai.
- `purchase` chỉ phát sau khi server xác minh đơn PAID.

### GA4 và giao diện

- Regression test phân biệt đúng `Arguments` queue với rest-array.
- Browser network smoke chứng minh page view và custom event phát collect request đúng ID.
- Luận giải dài vẫn dễ quét: cỡ chữ, line-height, chiều rộng dòng, nhãn khối và độ tương phản đạt thiết kế trên desktop lẫn mobile.
- Desktop và mobile không có che khuất, tràn ngang hoặc CTA quá nhỏ.
- Luồng modal, login, cancel và retry không có lỗi console.

### Kiểm tra dự án

Chạy bộ test tập trung trước, sau đó:

```powershell
npm run lint
npm test
npm run build
```

Production phát hành qua `npm run ship`, sau đó kiểm tra PM2/current release, URL công khai và request GA4 trên browser profile mới.

## Đo kết quả

- Dùng database hiện có làm nguồn sự thật cho chart, user linkage, PaymentOrder và Reading hoàn tất.
- Dùng GA4 để đo các bước view/click/checkout mà database không lưu.
- Dùng `free_overview_viewed` và các event login gate hiện có để đánh giá khả năng giữ chân và chuyển tiếp; không thêm event chỉ để theo dõi từng khối nội dung.
- So sánh 14 ngày trước và sau phát hành; xác nhận lại khi đủ 30 ngày.
- Tách PayOS/direct VND khỏi unlock bằng xu tặng khi báo cáo doanh thu.
- Dừng hoặc hoàn tác phần UI nếu conversion giảm rõ rệt, nhưng không hoàn tác sửa GA4 hoặc các guard an toàn.

## Ngoài phạm vi

- Thay đổi giá 199.000đ hoặc các gói xu.
- Guest checkout, mã giảm giá, popup, countdown hoặc scarcity.
- Thêm testimonial chưa có nguồn xác minh.
- Thêm database analytics, CDP, GTM hoặc dependency tracking mới.
- Thiết kế lại homepage, pricing hay toàn bộ chart page.
- Dùng AI để sinh hoặc hậu xử lý/tóm tắt luận giải miễn phí; dùng CSS, JavaScript hoặc presentation để cắt nội dung đã được phép đọc. Formatter xác định vẫn được phép ghép trực tiếp các trường rule theo grammar đã định.
- Mở rộng kho quy tắc tử vi hoặc thêm tổ hợp sao mới chưa có căn cứ trong engine hiện tại.
- Sửa concurrency ledger, endpoint PayOS mồ côi hoặc các hardening thanh toán không nằm trên luồng FULL này; các việc đó cần một release an toàn riêng.
- Thay đổi engine lập lá số.
