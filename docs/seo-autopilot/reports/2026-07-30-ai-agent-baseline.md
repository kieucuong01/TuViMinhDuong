# AI Agent / Search Console Baseline — 2026-07-30

## Phạm vi

- Property: `sc-domain:lasotinhhoa.vn`
- Search Analytics: 28 ngày từ `2026-06-30` đến `2026-07-27` (D-3)
- Quyền OAuth sử dụng: Search Console read-only
- Mục đích: khóa baseline trước lát cắt sitemap freshness và answer block của `/kien-thuc-tu-vi`

## Baseline Search Analytics

Tổng hợp property không dimension:

| Clicks | Impressions | CTR | Average position |
| ---: | ---: | ---: | ---: |
| 102 | 316 | 32.28% | 17.96 |

Nhóm page dimension ưu tiên:

| Nhóm | Page rows | Clicks | Impressions | CTR | Average position |
| --- | ---: | ---: | ---: | ---: | ---: |
| Trang chủ | 1 | 91 | 174 | 52.30% | 3.97 |
| `/kien-thuc-tu-vi` | 27 | 2 | 134 | 1.49% | 36.75 |
| `/tra-cuu` | 66 | 8 | 453 | 1.77% | 17.94 |
| `/xem-ngay` | 3 | 1 | 95 | 1.05% | 11.61 |
| `/xem-tuoi` | 7 | 1 | 67 | 1.49% | 14.49 |

Không cộng các dòng page dimension để thay cho tổng property: một kết quả tìm kiếm có thể tạo impression cho nhiều URL cùng domain. Khi theo dõi sau release, phải so sánh cùng query shape với baseline tương ứng.

## Indexing và sitemap

- Sitemap index `https://lasotinhhoa.vn/sitemap-index.xml`: submitted `348`, pending `false`, warnings `0`, errors `0`; Google tải gần nhất `2026-07-28`.
- Search Console overview tại thời điểm kiểm tra: `217` trang đã index, `147` trang chưa index.
- URL Inspection:
  - `/`: PASS, index allowed, canonical Google và user trùng nhau.
  - `/tra-cuu`: PASS, index allowed, canonical trùng nhau.
  - `/xem-ngay`: PASS, index allowed, canonical trùng nhau.
  - `/xem-tuoi`: PASS, index allowed, canonical trùng nhau.
  - `/kien-thuc-tu-vi`: crawl thành công nhưng hiện chưa index; lần crawl được API báo `2026-06-11`.

## GenAI và guardrail

- Tài khoản chưa hiển thị báo cáo GenAI riêng. Giao diện Performance chỉ có nút hỗ trợ tùy chỉnh báo cáo bằng AI; không coi đây là GenAI traffic report.
- Theo dõi 14 ngày sau release bằng cùng property/date lag/query shape.
- Điều tra nếu clicks hoặc impressions của knowledge hub giảm trên 15% trong ít nhất 3 ngày dữ liệu hoàn chỉnh và xấu hơn xu hướng toàn site.
- Rollback ngay khi có URL gãy, canonical/robots ngoài ý muốn, sitemap regression hoặc lỗi rendered snapshot.
