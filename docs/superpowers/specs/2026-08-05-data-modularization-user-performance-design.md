# Thiết kế chuẩn hóa data layer và tối ưu hành trình người dùng

## Mục tiêu

Chuẩn hóa kiến trúc nội bộ của ứng dụng Tử Vi theo hai giai đoạn tuần tự:

1. Tách các trách nhiệm đang tập trung trong `src/lib/data.ts` và làm mỏng `src/app/actions.ts` mà không đổi hành vi công khai.
2. Đo rồi tối ưu hiệu năng mobile của hành trình trang chủ → lập lá số → kết quả lá số/luận giải miễn phí.

Sau khi hai giai đoạn vượt qua toàn bộ cổng kiểm chứng, dựng lại Graphify trên `src` để so sánh hotspot, độ kết dính module và các khoảng trống quan hệ trước/sau.

## Trạng thái ban đầu và lý do ưu tiên

- Graphify hiện cho thấy `getDb()`, `getCurrentUser()` và `generateTuViChart()` là các node trung tâm nhất.
- Community `Admin Data and Content` có cohesion khoảng `0.04`, cho thấy nhiều trách nhiệm ít liên quan đang bị gom chung.
- Bản khảo sát checkout cũ ghi nhận `src/lib/data.ts` có 2.561 dòng, 69 export và 119 hàm; `src/app/actions.ts` có 802 dòng và 17 Server Action.
- `src/lib/content.ts`, `src/lib/ai.ts` và `src/app/globals.css` cũng lớn, nhưng không được tách chỉ vì số dòng. Chúng chỉ được thay đổi khi phục vụ trực tiếp cho ranh giới data layer hoặc bottleneck hiệu năng đã đo được.
- Công việc được thực hiện trong worktree `codex/refactor-data-performance`, dựa trên `origin/master` mới nhất. Checkout chính và các file đang làm dở không thuộc phạm vi.

Graph hiện có được tạo từ checkout cũ hơn `origin/master`, vì vậy số liệu Graphify ban đầu phải được dựng lại trong worktree sạch trước khi dùng làm baseline chính thức.

## Phạm vi bắt buộc giữ nguyên

- Không đổi giao diện, URL, metadata, API, tên Server Action hoặc chữ ký hàm được consumer hiện tại sử dụng.
- Không đổi thuật toán lá số, lịch âm, kết quả luận giải, cấu trúc chart JSON hoặc fixture nghiệp vụ.
- Không đổi authentication, authorization, quyền sở hữu lá số, coin gate, cách trừ/hoàn xu hoặc xác minh PayOS.
- Không đổi redirect, revalidation, thông báo lỗi và kiểu dữ liệu trả về đang quan sát được.
- Giữ nguyên demo/in-memory fallback; không xem các nhánh fallback này là code thừa.
- Không thêm framework hoặc dependency runtime mới.
- Không push, deploy hoặc sửa production trong phạm vi này.

## Kiến trúc mục tiêu

### Data layer theo domain

```text
src/lib/data/
├── contracts.ts       # Type và interface dùng chung
├── demo-store.ts      # Trạng thái demo/in-memory dùng chung, giữ nguyên vòng đời
├── charts.ts          # Lưu, lấy, sở hữu, claim và lịch sử lá số
├── free-overview.ts   # Trạng thái và job luận giải miễn phí
├── readings.ts        # Reading trả phí, bundle, progress và cache nghiệp vụ
├── articles.ts        # Bài viết, danh mục, upload và CMS persistence
├── settings.ts        # Giá tính năng, xu và operation settings
└── admin.ts           # Dashboard, trend và chart submissions
```

`src/lib/data.ts` tiếp tục là compatibility facade. Nó xuất lại đúng API hiện có để consumer chưa cần đổi import trong cùng một lát refactor. Consumer chỉ chuyển sang import trực tiếp từ domain module khi việc đó giảm coupling rõ ràng và có test bảo vệ.

Mỗi module sở hữu một nhóm nghiệp vụ và chỉ phụ thuộc vào primitive thấp hơn như `db.ts`, `auth.ts`, `chart.ts`, `pricing.ts` hoặc các contract dùng chung. Module domain không được import ngược từ `src/lib/data.ts`; quy tắc này ngăn circular dependency.

`demo-store.ts` là nguồn duy nhất cho các map/array fallback dùng chung. Việc tách module không được tạo bản sao trạng thái hoặc làm mất dữ liệu demo giữa các lời gọi trong cùng process.

### Server Actions mỏng

`src/app/actions.ts` vẫn giữ directive `"use server"` ở cấp file và giữ nguyên toàn bộ export công khai. Mỗi action chỉ thực hiện bốn việc:

1. Đọc và chuẩn hóa input không tin cậy từ `FormData`.
2. Xác thực, phân quyền và kiểm tra ownership tại đúng ranh giới bảo mật.
3. Gọi một primitive từ data/domain layer.
4. Redirect, revalidate hoặc trả về kết quả tối thiểu mà UI hiện tại cần.

Logic database và nghiệp vụ dài được đưa xuống module server-side; kiểm tra quyền không được chuyển ra khỏi action/DAL hoặc chỉ dựa vào việc UI có hiển thị nút hay không. Đây là mô hình Data Access Layer được tài liệu Next.js 16.2.11 của chính dự án khuyến nghị.

## Trình tự refactor kiến trúc

1. Dựng baseline từ `origin/master`: Git status sạch, graph mới, lint, full test và build.
2. Tạo contract test cho compatibility facade và test module-boundary đầu tiên; xác nhận test thất bại vì module mới chưa tồn tại.
3. Tách `contracts.ts` và `demo-store.ts` trước để các module sau dùng cùng kiểu và cùng fallback state.
4. Tách `charts.ts`, sau đó `free-overview.ts`; đây là luồng người dùng trọng tâm và có test hiện hữu mạnh.
5. Tách `readings.ts`; giữ nguyên progress, retry, refund và cache/version behavior.
6. Tách `settings.ts` và `admin.ts`; giữ nguyên cache tag, default values và báo cáo.
7. Tách `articles.ts`; giữ nguyên seed-vs-DB precedence, upload validation, canonical và CMS behavior.
8. Làm mỏng từng nhóm trong `src/app/actions.ts` bằng cách ủy quyền cho primitive đã kiểm thử.
9. Chạy full gate và đo lại hiệu năng để chứng minh refactor không gây regression trước khi tối ưu.

Mỗi bước là một commit độc lập, có targeted test và có thể review/revert riêng.

## Đo và tối ưu hiệu năng

### Hành trình ưu tiên

1. Trang chủ `/`.
2. Form lập lá số và quá trình submit.
3. Trang kết quả lá số cùng luận giải miễn phí trên một chart test an toàn.

### Phương pháp đo

- Dùng production build chạy cục bộ trên port `4000` với bundled Node đáp ứng Next.js 16.
- Dùng mobile emulation cố định và chạy ít nhất ba lần cho mỗi route; báo cáo trung vị thay vì chọn lần nhanh nhất.
- Ghi LCP, CLS, TTFB, kích thước HTML và JavaScript tải ban đầu.
- Dùng cùng commit, dữ liệu test, viewport và điều kiện cache cho phép so sánh trước/sau.
- `PERF_CHART_PATH` phải trỏ tới chart test/local an toàn; không tạo giao dịch PayOS và không ghi production.

### Tiêu chí đạt

- LCP mobile không vượt `2.5s`.
- CLS không vượt `0.1`.
- JavaScript tải ban đầu không tăng.
- Nếu baseline đã đạt ngưỡng, bottleneck chính của route phải cải thiện ít nhất `15%` theo trung vị.
- Sau giai đoạn kiến trúc, mọi chỉ số không được regression quá nhiễu đo hợp lý trước khi bắt đầu tối ưu.

### Thứ tự tối ưu dựa trên bằng chứng

1. Trì hoãn component nặng chưa cần trong màn hình đầu như assistant, export và paid-reading UI.
2. Loại bỏ truy vấn lặp và chạy song song các truy vấn server độc lập.
3. Cache dữ liệu công khai ổn định như pricing, operation settings và metadata bằng đúng cache tag hiện có.
4. Giảm client boundary và JavaScript hydration; ưu tiên Server Components khi không làm đổi UX.
5. Tối ưu ảnh/font tham gia trực tiếp vào LCP.
6. Chỉ chia `globals.css` khi coverage hoặc bundle evidence chứng minh CSS toàn cục là bottleneck; giữ nguyên thứ tự cascade quan sát được.

Không cache dữ liệu cá nhân, chart riêng tư, session hoặc kết quả reading giữa người dùng. Không thêm memoization khi không có số đo chứng minh lợi ích.

## Xử lý lỗi và bảo mật

- Server Action được coi là endpoint POST công khai: mọi input đều không tin cậy và mọi thao tác nhạy cảm phải kiểm tra auth/authz lại.
- Lỗi expected tiếp tục dùng contract hiện tại; lỗi unexpected không bị nuốt hoặc đổi thành kết quả thành công.
- Claim, charge, refund, job progress và completion vẫn phải idempotent theo hành vi hiện có.
- Article upload tiếp tục kiểm tra kích thước, MIME/signature và đường dẫn an toàn.
- Cache public và cache private phải có ranh giới rõ; không dùng cache key thiếu user/chart identity cho dữ liệu riêng tư.

## Chiến lược kiểm thử

Mọi lát refactor áp dụng red-green-refactor:

1. Viết test cho ranh giới module hoặc contract cần tồn tại.
2. Chạy và quan sát test thất bại vì module/API mới chưa có.
3. Di chuyển lượng code tối thiểu để test qua.
4. Chạy targeted tests của domain và consumer.
5. Chạy lại test sau cleanup, rồi mới commit.

Cổng cuối bắt buộc:

```powershell
npm run lint
npm test
npm run build
```

Browser smoke chạy desktop và mobile cho ba hành trình ưu tiên. Chart/date fixtures, payment/auth tests, CMS tests và cache/version tests phải được giữ xanh tùy module được tách.

## Graphify trước và sau

Baseline Graphify được dựng trên `src` của worktree sạch trước refactor. Sau khi code và hiệu năng vượt gate:

1. Chạy Graphify incremental update hoặc full rebuild nếu manifest không tương thích.
2. Xuất lại `graph.json`, `graph.html`, `GRAPH_REPORT.md`, manifest và cost report.
3. Chạy graph-health diagnostic.
4. So sánh số dòng/export của facade, god nodes, community cohesion, node cô lập và dangling/collapsed edges.

Mục tiêu không phải ép số node thấp hơn. Thành công là facade nhỏ hơn, domain rõ hơn, centrality bớt tập trung vào một file và graph phản ánh các ranh giới nghiệp vụ dễ điều hướng hơn. Cảnh báo Graphify còn tồn tại phải được báo trung thực, không diễn giải thành lỗi ứng dụng nếu chưa có bằng chứng.

## Bàn giao

- Các commit chỉ tồn tại trên nhánh worktree `codex/refactor-data-performance` cho tới khi người dùng yêu cầu tích hợp.
- Không stage hoặc commit file Graphify/runtime tạm, Prisma client, `.next`, log, env hoặc thay đổi ngoài phạm vi.
- Báo cáo cuối nêu rõ thay đổi, test/build/browser/performance đã chạy, số liệu trước/sau, graph health và phần chưa kiểm chứng.
- Không push hoặc deploy production nếu không có yêu cầu mới rõ ràng.

## Tự rà soát thiết kế

Thiết kế không có placeholder; phạm vi được giới hạn vào data layer, Server Action adapters và ba hành trình hiệu năng đã duyệt. Các chữ ký công khai, nghiệp vụ lá số, payment/auth, fallback, URL và UI đều được giữ nguyên. Mọi tối ưu yêu cầu baseline đo được, có ngưỡng thành công cụ thể và có đường kiểm chứng/revert độc lập.
