# Addendum: checkout bản FULL không cần đăng nhập

## Phạm vi

Tài liệu này bổ sung và thay thế riêng quyết định “không xây guest checkout” trong
`2026-07-19-paid-conversion-funnel-design.md`.

Luồng mới:

`Lập lá số -> đọc luận giải free -> nhập email -> PayOS -> đọc bản FULL`

Khách không phải đăng nhập, tạo mật khẩu hoặc dùng Google trước khi thanh toán.
Email là trường bắt buộc để PayOS và bộ phận hỗ trợ đối soát giao dịch.

Giữ nguyên:

- Giá bản FULL và giá xu hiện tại.
- Nội dung luận giải free và outline 9 chương.
- Lựa chọn PayOS hoặc xu cho người đã đăng nhập.
- Webhook, đối soát PayOS và settlement idempotent hiện có.
- Điều kiện `purchase` chỉ phát sau khi server xác minh đơn `PAID`.

## Phương án

### Chọn: phiên khách nội bộ

Khi khách gửi email từ modal FULL, server tạo một user nội bộ có email kỹ thuật
duy nhất, gắn lá số vào user đó và đặt session cookie hiện có. Email thật chỉ được
gửi sang PayOS và lưu trong metadata đơn hàng để đối soát.

Phương án này tái sử dụng toàn bộ quan hệ `User -> Chart -> PaymentOrder -> Reading`,
không cần migration hoặc bảng entitlement mới.

### Không chọn

- Tự đăng nhập bằng email thật: ít code hơn nhưng có thể cấp nhầm quyền vào tài
  khoản đã tồn tại khi email chưa được xác minh.
- Thêm bảng guest entitlement và dịch vụ gửi email: hỗ trợ cross-device tốt hơn
  nhưng cần migration, email provider và quy trình claim riêng; chưa cần cho lần
  phát hành này.

## Trải nghiệm

### Khách

1. Khách lập lá số và đọc phần luận giải miễn phí như hiện tại.
2. Mọi CTA FULL của khách mở cùng modal thanh toán, không mở login modal.
3. Modal hiển thị 9 chương, giá trọn gói, một ô email và nút
   `Thanh toán PayOS - {giá}`.
4. Copy dưới ô email nói rõ email dùng để đối soát và hỗ trợ khôi phục giao dịch;
   không hứa gửi kết quả qua email vì hệ thống chưa có email provider.
5. Submit hợp lệ chuyển thẳng sang PayOS.
6. Hủy thanh toán quay lại đúng lá số và giữ nguyên nội dung free.
7. Thanh toán thành công quay thẳng tới bản FULL đang được tạo.

### Người đã đăng nhập

Không đổi hành vi: modal tiếp tục cho thanh toán PayOS và hiển thị lựa chọn dùng
xu khi số dư đủ.

## Dữ liệu và quyền truy cập

Checkout guest chỉ chạy khi lá số tồn tại và chưa thuộc user khác.

Server tạo user nội bộ với:

- Email kỹ thuật ngẫu nhiên dưới domain nội bộ.
- Tên hiển thị lấy từ lá số.
- Số dư 0 xu và role `USER`.

Việc tạo user và claim lá số phải thất bại an toàn nếu một request khác đã claim
lá số trước đó. Không được tạo PaymentOrder khi claim không thành công.

`PaymentOrder.rawPayload.directReading` giữ metadata FULL hiện có và bổ sung email
đối soát cùng token khôi phục phiên. Email không được đưa vào event analytics,
URL public hoặc log ứng dụng.

## Thanh toán và return

Guest checkout dùng `createPayOSCustomCheckout` và settlement FULL hiện có.

Return URL guest mang token ngẫu nhiên dùng một lần. Route return:

1. Kiểm tra định dạng `orderCode` và token.
2. Tiêu thụ token và khôi phục đúng user nội bộ; token đã dùng không thể dùng lại.
3. Kiểm tra PaymentOrder thuộc user đó và metadata trỏ đúng lá số FULL.
4. Hỏi lại PayOS; không tin query `status=success`.
5. Chỉ settle khi PayOS xác nhận đủ số tiền hoặc đơn đã được webhook đánh dấu
   `PAID`.
6. Đặt session cookie và chuyển tới đúng Reading FULL.

Webhook tiếp tục là đường settlement độc lập và idempotent. Return URL không cộng
xu và không tự mở nội dung nếu chưa có bằng chứng thanh toán.

`/api/payments/status` tiếp tục xác minh đơn thuộc session hiện tại trước khi trả
`verified: true`, nhờ đó event `purchase` giữ nguyên điều kiện an toàn.

## Lỗi và khôi phục

- Email sai: hiển thị lỗi tại modal, không tạo user hoặc đơn.
- Lá số đã có chủ: từ chối checkout, không đổi ownership.
- PayOS chưa xác nhận: quay lại lá số với trạng thái pending.
- Token sai hoặc không thuộc đơn: từ chối, không tiết lộ dữ liệu đơn.
- Reading sinh lỗi sau khi đã trả tiền: dùng entitlement PaymentOrder hiện có để
  chạy lại, không tạo đơn mới.

Cross-device và gửi link đọc qua email nằm ngoài phạm vi. Bổ sung khi có email
provider hoặc dữ liệu hỗ trợ cho thấy mất session là vấn đề đáng kể.

## Đo lường

Giữ các event hiện có:

- `full_offer_viewed`
- `full_offer_clicked`
- `begin_checkout`
- `checkout_cancelled`
- `checkout_failed`
- `purchase`
- `paid_reading_request`

`begin_checkout` của guest có `method=payos` và vị trí CTA; không chứa email.
`purchase` chỉ phát sau khi `/api/payments/status` xác minh đơn `PAID`.

## Kiểm thử chấp nhận

- Guest đọc free, mở modal FULL, chỉ cần nhập email rồi sang PayOS.
- Guest không bị chuyển tới login modal ở CTA FULL.
- Email không hợp lệ không tạo user, order hoặc đổi ownership.
- Email trùng tài khoản thật không cấp session của tài khoản đó.
- Hai request không thể cùng claim một lá số.
- Return token sai, sai owner hoặc PayOS chưa trả tiền không mở FULL.
- Webhook và return chạy lặp không tạo hai Reading hoặc hai quyền mua.
- Sau thanh toán, guest vào đúng Reading và `purchase` được xác minh server.
- Người đăng nhập vẫn mua PayOS hoặc dùng xu như trước.
- Desktop và mobile không tràn ngang; ô email và nút có touch target phù hợp.

Chạy:

```powershell
npm run lint
npm test
npm run build
```

Sau deploy, kiểm tra PM2/current release, URL lá số public và một checkout
PayOS an toàn theo playbook.
