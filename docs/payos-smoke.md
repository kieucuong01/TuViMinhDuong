# PayOS Checkout Smoke Runbook

Mục tiêu: kiểm chứng luồng nạp xu thật/sandbox từ lúc tạo checkout đến khi webhook cộng xu và user mở được luận giải trả phí.

## Điều kiện trước khi chạy

- `DATABASE_URL` trỏ tới Postgres cần smoke.
- `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY` đã set.
- `NEXT_PUBLIC_APP_URL` trỏ tới domain đang smoke, ví dụ `https://lasotinhhoa.vn`.
- PayOS dashboard cấu hình webhook về:

```text
<NEXT_PUBLIC_APP_URL>/api/webhooks/payos
```

Không dùng return URL để cộng xu. Return URL chỉ đưa user quay về website; webhook mới là nguồn sự thật để cập nhật `PaymentOrder`, `CoinLedger`, `User.coinBalance`.

## 1. Tạo checkout thật/sandbox

```bash
npm run smoke:payos -- create --package full-reading --app-url https://lasotinhhoa.vn
```

Script sẽ:

- Tạo hoặc cập nhật smoke user.
- Tạo payment link trên PayOS.
- Lưu `PaymentOrder` trạng thái `PENDING` vào database.
- In ra `checkoutUrl`, `orderCode`, `paymentLinkId`, `coins`, `amountVnd`.

## 2. Thanh toán

Mở `checkoutUrl`, thanh toán bằng luồng sandbox/thật của PayOS. Sau khi thanh toán, đợi webhook vài giây.

## 3. Inspect bằng chứng trong DB

```bash
npm run smoke:payos -- inspect --order-code <ORDER_CODE>
```

Kết quả pass khi:

- `status` là `PAID`.
- `ledgerCredit.count` là `1`.
- `ledgerCredit.amount` bằng `coins`.
- `checks.paid` là `true`.
- `checks.creditedExactCoins` là `true`.
- `checks.duplicateWebhookDidNotDoubleCredit` là `true`.

Nếu vừa thanh toán xong mà `status` vẫn `PENDING`, kiểm tra webhook URL trong PayOS dashboard, `pm2 logs lasotinhhoa`, Nginx logs và route `/api/webhooks/payos`.

## 4. Smoke mở luận giải

Sau khi inspect pass:

1. Đăng nhập bằng email smoke được in ra ở bước create, hoặc dùng tài khoản test đã chọn.
2. Vào một trang lá số.
3. Bấm `Mở luận giải toàn bộ`.
4. Kỳ vọng: hệ thống không hiện modal thiếu xu, tạo reading thành công, và trang nâng cao đọc được.

## Evidence Template

```text
Date:
Environment:
App URL:
Webhook URL:
Order code:
Payment link id:
Package:
Amount VND:
Coins:
Smoke user:

Create result:
- Checkout created:
- PaymentOrder PENDING:

Payment result:
- Paid in PayOS:
- Return URL opened:

Inspect result:
- PaymentOrder status:
- User coin balance:
- Ledger credit count:
- Ledger credit amount:
- Duplicate webhook check:

Paid reading result:
- Paid CTA clicked:
- Reading unlocked:
- Advanced page visible:

Notes:
```
