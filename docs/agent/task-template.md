# Task Template

Dùng template này khi giao việc cho AI Agent hoặc khi agent tự chia nhỏ một yêu cầu lớn. Mục tiêu là tránh hiểu quá rộng, giảm sửa lan man và biết test gì trước khi code.

## Template ngắn

```md
Mục tiêu:

Phạm vi:

Không làm:

File/route liên quan:

Test bắt buộc:

Ghi chú UX/SEO/payment:

Done khi:
```

## Template đầy đủ

```md
# Task

## Mục tiêu

Viết rõ kết quả người dùng/admin nhìn thấy hoặc hành vi hệ thống cần đạt.

## Phạm vi

Liệt kê phần được sửa:

- UI/component:
- Server action/API:
- DB/schema:
- Engine:
- SEO/docs:

## Không làm

Liệt kê những thứ dễ bị lôi vào nhưng chưa làm trong lượt này.

## Rủi ro

- Có chạm payment/auth/engine không?
- Có chạm production DB/migration không?
- Có ảnh hưởng SEO index/canonical không?
- Có cần giữ tương thích dữ liệu cũ không?

## Test bắt buộc

- Unit:
- Integration:
- E2E/manual:
- Build:

## Done khi

- Người dùng làm được gì?
- Admin làm được gì?
- Test nào pass?
- Có cập nhật docs không?
```

## Ví dụ: Task UI

```md
Mục tiêu:
Khi bấm "Xem lá số miễn phí", người dùng thấy loading rõ và không bấm lặp.

Phạm vi:
Sửa `src/components/chart-form.tsx`, loading button/toast nếu cần.

Không làm:
Không sửa engine lá số, không sửa payment.

Test bắt buộc:
`npm run lint`, kiểm tra thủ công homepage mobile/desktop.

Ghi chú UX/SEO/payment:
Button tối thiểu 48px, text loading dễ hiểu cho người 30-60 tuổi.

Done khi:
Submit form hiển thị loading ngay, tạo lá số thành công, không tràn layout mobile.
```

## Ví dụ: Task engine

```md
Mục tiêu:
Sửa cách tính sao lưu niên cho năm xem.

Phạm vi:
Sửa `src/lib/chart.ts`, cập nhật `src/lib/chart.fixtures.ts`.

Không làm:
Không chỉnh giao diện lá số ngoài việc hiển thị dữ liệu đã có.

Test bắt buộc:
Thêm assertion trong `src/lib/chart.fixtures.test.ts`, chạy `npm test`.

Ghi chú UX/SEO/payment:
Không liên quan.

Done khi:
Fixture chuẩn khớp sao lưu niên, 14 chính tinh không bị regression.
```

## Ví dụ: Task payment

```md
Mục tiêu:
Mở modal nạp xu ngay trên trang lá số khi user thiếu xu.

Phạm vi:
Sửa paywall CTA, topup modal, checkout API nếu cần.

Không làm:
Không đổi giá gói xu, không đổi schema nếu chưa cần.

Test bắt buộc:
Unit/integration cho không đủ xu, manual smoke user thường và admin.

Ghi chú UX/SEO/payment:
Không được rời khỏi trang lá số trước khi user chọn checkout. Return URL không được cộng xu.

Done khi:
User thấy modal, admin vẫn bypass, checkout tạo order đúng, webhook là nơi duy nhất cộng xu.
```

## Quy tắc chia task lớn

Tách task nếu chạm hơn một nhóm sau:

- Engine tử vi/xem ngày
- Payment/auth/xu
- DB schema/migration
- SEO metadata/indexing
- UI lớn/mobile layout

Ví dụ không nên gom: "nâng engine lá số + làm lại UI lá số + thêm payment CTA". Hãy chia thành 3 task nhỏ.
