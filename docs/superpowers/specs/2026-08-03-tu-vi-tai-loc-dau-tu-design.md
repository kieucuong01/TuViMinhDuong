# Tử vi tài lộc & Đầu tư — Thiết kế sản phẩm

## Bối cảnh và quyết định

Mục Tử vi trên header đang có một placeholder “Tử vi tài lộc & Đầu tư — Chấm Tài - Quan - Di và biểu đồ 5 năm tới”. Người dùng đã ủy quyền tự quyết toàn bộ phạm vi. Ba hướng đã được cân nhắc:

1. Chỉ mở một landing page SEO: ít rủi ro nhưng không tạo đủ giá trị sản phẩm.
2. Dùng AI đưa khuyến nghị đầu tư hoặc bán báo cáo riêng: nhiều chi phí, khó kiểm chứng và dễ bị hiểu là tư vấn tài chính.
3. Tạo landing page công khai kết hợp một tab miễn phí, cá nhân hóa từ dữ liệu lá số đã có: hữu ích, có thể kiểm thử, tạo search intent rõ và không phá payment funnel.

Chọn hướng 3. Đây là một lát cắt sản phẩm hoàn chỉnh, không mở thêm loại thanh toán, không thay đổi chart engine và không đưa lệnh mua/bán.

## Mục tiêu

- Biến placeholder trong menu Tử vi thành một công cụ hoạt động thật.
- Giúp người đọc hiểu cách Tài Bạch, Quan Lộc, Thiên Di, Phúc Đức và Điền Trạch liên hệ với cách tạo, giữ và mở rộng nguồn lực.
- Cho thấy xu hướng định hướng trong 5 năm bắt đầu từ “năm xem” đã chọn, kèm bằng chứng cung/sao và giới hạn diễn giải.
- Tạo một landing page indexable, answer-first, semantic và có schema khớp nội dung hiển thị để có thể nhận traffic từ Google, AI search, AIO và AEO.
- Giữ trang lá số cá nhân `noindex`, giữ nguyên coin/payment gates và funnel hiện tại.

## Phạm vi chức năng

### 1. Landing page công khai

URL chính tắc: `/tu-vi-tai-loc-dau-tu`.

Trang gồm:

- H1 và đoạn trả lời trực tiếp 40–60 từ giải thích công cụ đọc gì và không đọc gì.
- Form lập lá số tái sử dụng `ChartForm`; nút chính là “Xem bản đồ tài lộc 5 năm”.
- Khối giải thích Tài Bạch, Quan Lộc và Thiên Di bằng bảng so sánh ngắn.
- Phương pháp chấm điểm, cách đọc biểu đồ và giới hạn của chỉ số.
- Quy trình 4 bước sử dụng kết quả cho một quyết định thật.
- Các liên kết ngữ cảnh tới hub Tử vi, Cung Tài Bạch, Quan Lộc, Thiên Di, phương pháp luận và form lập lá số.
- FAQ hiển thị trên trang và FAQ JSON-LD có cùng nội dung.
- Dấu thời gian cập nhật, liên kết tác giả/chính sách biên tập và cảnh báo tài chính rõ ràng.

Nếu lập lá số từ trang này thành công, Server Action chuyển tới `/la-so/{id}?view=tai-loc&created=1`. Nếu lỗi, người dùng được đưa lại đúng form trên landing page với thông báo có `role="alert"`.

### 2. Tab Tài lộc trong lá số

Tab mới có key `tai-loc`, nhãn ngắn “Tài lộc”, miễn phí cho cả khách và tài khoản đã đăng nhập. Các tab luận giải trả phí khác giữ nguyên quyền truy cập.

Nội dung tab:

- Tiêu đề cá nhân hóa theo họ tên và năm bắt đầu.
- Chỉ số tổng hợp với nhãn tư thế: “Tăng trưởng từ nghề”, “Quản trị dòng tiền”, “Mở rộng có kiểm chứng”, “Tích lũy bền” hoặc “Phòng thủ và sửa nền”.
- Bốn trụ cột: Dòng tiền, Năng lực tạo giá trị, Mở rộng môi trường và Nền tích lũy.
- Biểu đồ 5 năm dùng SVG server-rendered, có mô tả cho screen reader và bảng số liệu thay thế.
- Năm có độ thuận lợi tương đối cao nhất và năm cần kiểm chứng nhiều nhất, không gọi là “năm phát tài” hay “năm mất tiền”.
- Ba thẻ bằng chứng cho Tài Bạch, Quan Lộc, Thiên Di: cung đóng tại đâu, chính tinh, sao hỗ trợ, sao cần lưu ý.
- Kế hoạch hành động 90 ngày và bộ lọc 6 câu trước quyết định lớn.
- Liên kết đọc sâu tới các trang tra cứu công khai.

### 3. Điểm số và biểu đồ

Điểm nằm trong khoảng 35–92 để tránh cảm giác tuyệt đối. Đây là “chỉ số định hướng”, không phải xác suất sinh lời.

Mỗi cung bắt đầu từ một mức trung tính. Điểm được điều chỉnh bởi:

- trạng thái Miếu, Vượng, Đắc, Bình, Hãm của sao;
- nhóm sao hỗ trợ như Lộc, Khoa, Quyền, Tả, Hữu, Xương, Khúc, Khôi, Việt, Thiên Mã;
- nhóm sao cần kiểm chứng như Kình, Đà, Không, Kiếp, Hỏa, Linh, Tang, Hổ, Kỵ, Tuần, Triệt;
- lưu tinh của từng năm, với trọng số đủ để đường 5 năm có biến thiên nhưng không lấn át cấu trúc gốc.

Bốn trụ cột được ghép như sau:

- Dòng tiền: Tài Bạch là chính, Phúc Đức và Điền Trạch là nền.
- Năng lực tạo giá trị: Quan Lộc là chính, đối chiếu Mệnh/Thân.
- Mở rộng môi trường: Thiên Di là chính, đối chiếu Quan Lộc và Nô Bộc.
- Nền tích lũy: Phúc Đức, Điền Trạch và Tài Bạch.

Điểm tổng hợp ưu tiên Dòng tiền và Năng lực tạo giá trị, sau đó tới Mở rộng và Nền tích lũy. Biểu đồ 5 năm tạo năm bản sao từ `ChartInput` với `viewYear` liên tiếp rồi gọi lại `generateTuViChart`; không sửa hay tái tính quy tắc an sao trong UI.

## Kiến trúc và ranh giới file

- `src/lib/wealth-fortune.ts`: logic thuần để chấm cung, ghép trụ cột, tạo chuỗi 5 năm, nhãn, bằng chứng và action plan.
- `src/lib/wealth-fortune.test.ts`: kiểm thử score bounds, tính quyết định, biến thiên 5 năm, bằng chứng và không đột biến do năm.
- `src/components/wealth-fortune-view.tsx`: server component hiển thị báo cáo cá nhân và SVG/bảng dữ liệu.
- `src/app/tu-vi-tai-loc-dau-tu/page.tsx`: landing page, metadata, nội dung answer-first, FAQ/schema và form.
- `src/app/tu-vi-tai-loc-dau-tu/page.test.ts`: kiểm tra copy an toàn, answer block, canonical/schema, internal links và form intent.
- `src/components/chart-form.tsx` + `src/app/actions.ts`: thêm một destination enum có allowlist; không nhận URL redirect tùy ý từ client.
- `src/components/fate-tabs.tsx` + `src/app/la-so/[id]/page.tsx`: thêm tab miễn phí, chỉ render các tab được phép.
- `src/components/site-header.tsx`: thay placeholder bằng link thật; mobile menu tự nhận `href` hiện có.
- `src/app/sitemap.ts`, `public/llms.txt`, `src/lib/agent-resources.ts`: quảng bá đúng một URL công cụ mới, không xóa hoặc đổi URL hiện có.
- `src/app/globals.css`: style có namespace `wealth-*`, dùng token màu cam/gold/stone hiện có.

## UX và khả năng truy cập

- Server Components là mặc định; không thêm client JavaScript cho nội dung, điểm số hoặc biểu đồ.
- Bố cục mobile-first, font thân bài tối thiểu 16px, nút/form cao tối thiểu khoảng 48px.
- Dùng Lucide hiện có, không dùng emoji làm icon cấu trúc.
- Không dùng màu đơn lẻ để truyền trạng thái; mọi điểm đều có nhãn chữ.
- SVG có `role="img"`, tên/mô tả; bảng 5 năm luôn có trong DOM.
- Không dùng chuyển động trang hoặc hiệu ứng blur nặng; giữ phong cách sáng, ấm, premium hiện có thay vì áp dark mode/glassmorphism lạ vào app.
- Nội dung dài được chia bằng heading, bảng và `details` FAQ; không tạo nested scroll.

## SEO, AIO và AEO

- Metadata tĩnh: title, description, canonical, Open Graph và Twitter từ `routeMetadata`.
- H1 duy nhất; keyword chính xuất hiện tự nhiên trong H1 và đoạn mở đầu.
- Đoạn answer-first 40–60 từ hoạt động độc lập khi AI trích dẫn.
- WebPage, WebApplication, BreadcrumbList và FAQPage JSON-LD chỉ mô tả nội dung nhìn thấy.
- Semantic HTML gồm `main`, `section`, `figure`, `table`, `ol`, `details` và liên kết mô tả rõ.
- Cập nhật sitemap, `llms.txt` và `agent/site.json`; giữ nguyên 148 URL được bảo vệ trong `llms-protected-urls.json`.
- Không tạo nhiều route theo năm/tuổi, không cạnh tranh intent với các bài Cung Tài Bạch/Quan Lộc hiện có.
- Landing page là indexable; mọi `/la-so/{id}` vẫn `noindex` và không được đưa vào sitemap/llms.

## Bảo mật và riêng tư

Ranh giới tin cậy nằm tại Server Action nhận `FormData`. `chartExperience` là dữ liệu không tin cậy và chỉ được ánh xạ qua allowlist `default | wealth`; giá trị khác rơi về flow mặc định. Client không được gửi URL redirect.

Ngày giờ sinh và họ tên tiếp tục đi qua validation, rate limit và luồng lưu chart hiện có. Không thu thêm dữ liệu, không thêm API ngoài, không gửi dữ liệu lá số cho một LLM mới. JSON-LD chỉ chứa nội dung tĩnh, không chứa thông tin cá nhân.

## Xử lý lỗi

- Chart không tồn tại: giữ `notFound()` hiện có.
- Cung cần thiết thiếu dữ liệu: trả bằng chứng “chưa có dữ liệu”, dùng mức trung tính và không làm crash báo cáo.
- Năm xem ngoài phạm vi UI: vẫn dùng số nguyên đã được engine hỗ trợ; chuỗi 5 năm được giới hạn đúng 5 điểm.
- Form thất bại hoặc timeout: quay lại landing, hiện thông báo có hướng phục hồi.
- Điểm trùng nhau: chọn năm sớm hơn làm “năm thuận hơn”; năm muộn hơn chỉ được chọn làm năm thận trọng khi có score thấp hơn thật sự.

## Kiểm thử và tiêu chí hoàn tất

- TDD đỏ–xanh cho logic score, action destination và cấu trúc route/tab.
- Targeted Vitest cho các file mới và các guard header/AI discovery.
- Full `npm test`, `npm run lint`, `npm run build` bằng Node 24.
- Browser QA trên port 4000 ở desktop và viewport 390px/375px: landing, form, redirect, tab, SVG/table, no horizontal overflow, focus và console.
- Rendered DOM có canonical, metadata và JSON-LD khớp nội dung hiển thị.
- `npm audit` được kiểm tra và mọi high/critical reachable mới phải được xử lý hoặc báo rõ.
- Trước release: fetch/rebase `origin/master`, chỉ commit file trong phạm vi.
- Production: `npm run ship`, kiểm tra commit/release path, PM2 `lasotinhhoa`, HTTP 200 landing, menu link, sitemap, `llms.txt`, agent JSON và flow tạo chart tới tab Tài lộc.

## Ngoài phạm vi

- Không tư vấn mua/bán cổ phiếu, coin, bất động sản hay sản phẩm tài chính cụ thể.
- Không dự báo giá, lợi suất hoặc xác suất giàu nghèo.
- Không tạo portfolio tracker, lưu ngân sách hoặc kết nối tài khoản ngân hàng.
- Không thêm payment SKU, migration DB, LLM provider hay dependency mới.
- Không đổi thuật toán an sao, chart/date engine hoặc URL/canonical đang có.
