# Thiết kế UI/UX cho hệ thống `/tra-cuu`

Ngày: 2026-06-30

## Mục tiêu

Nâng cấp toàn bộ họ trang `/tra-cuu` thành một hệ thống tra cứu tử vi chuyên nghiệp, dễ đọc trên desktop và mobile, đồng thời giữ nguyên các cơ chế bảo vệ SEO hiện có. Giao diện phải phục vụ độc giả Việt Nam 30–60 tuổi, ưu tiên thao tác rõ ràng, chữ dễ đọc và nội dung có chiều sâu thay vì trang trí dày đặc.

Phạm vi gồm:

- trang gốc `/tra-cuu`;
- các hub chính tinh, 12 cung và phụ tinh;
- trang thực thể sao hoặc cung;
- trang phân tích tổ hợp sao–cung đã được curated và publish.

Không đổi URL, trạng thái publish, mô hình dữ liệu, engine tử vi, thanh toán hoặc quy tắc index.

## Hướng thiết kế

Sử dụng phong cách “editorial tra cứu”: nền sáng trung tính, chữ mực đậm, điểm nhấn cam/gold tiết chế và khoảng trắng rõ. Giao diện mang cảm giác cẩm nang đáng tin cậy kết hợp công cụ tra cứu, không biến thành dashboard SaaS và không dùng nhiều hoa văn tử vi gây nhiễu.

Nguyên tắc:

- một điểm nhấn chính trong viewport đầu;
- không thêm eyebrow, badge hoặc pill chỉ để trang trí;
- hạn chế card lồng card;
- CTA có độ tương phản tốt nhưng không cạnh tranh với nội dung;
- giữ thuật ngữ tử vi quen thuộc và diễn giải bằng tiếng Việt đơn giản;
- mọi điều khiển chính có vùng chạm tối thiểu khoảng 48px.

## Hệ thống giao diện

### Token

- Nền trang: trắng hoặc xám ấm rất nhẹ.
- Bề mặt chính: trắng.
- Chữ chính: nâu đen gần `#1c1917`.
- Chữ phụ: xám nâu gần `#57534e`.
- Accent: cam đất hoặc gold hiện có, dùng cho CTA và trạng thái tương tác.
- Trạng thái tích cực: xanh lá trầm.
- Trạng thái cảnh báo: hổ phách.
- Border: mảnh, độ tương phản thấp.
- Radius: vừa phải; không bọc mọi khu vực bằng khung bo lớn.
- Shadow: chỉ dùng cho công cụ tra cứu hoặc CTA quan trọng.

### Kiểu chữ và khoảng cách

- H1 dùng thang responsive, không vượt quá độ rộng đọc khoảng 18–22 ký tự.
- Nội dung chính trên mobile ở mức 17–18px, line-height tối thiểu 1.65.
- Tiêu đề mục có khoảng cách trên rõ để tạo nhịp đọc.
- Chiều rộng dòng nội dung dài giới hạn khoảng 65–75 ký tự.

## Kiến trúc component

Giữ các component hiện có và làm rõ vai trò:

- `PseoLookupHub`: công cụ chọn thực thể, kết quả tóm tắt, hướng dẫn, nguyên tắc, danh mục và FAQ.
- `PseoHub`: danh mục sao/cung theo kiểu index mở, tránh một lưới card đồng dạng dày đặc.
- `PseoEntityPage`: trang nền tảng của từng sao/cung, gồm tóm tắt, cách đọc, điểm mạnh, điểm cần lưu ý và các tổ hợp đã publish.
- `PseoArticleFunnel`: bài phân tích dài, bảng dữ kiện, nội dung editorial, form lập lá số, nội dung liên quan và CTA VIP.

Tạo các primitive CSS dùng chung cho hero, section heading, data strip, content rail, index row và CTA. Không thay đổi API dữ liệu của component nếu không cần thiết.

## Thiết kế theo loại trang

### Trang `/tra-cuu`

- Hero ngắn, nêu rõ người dùng có thể tra cứu sao, cung và phụ tinh.
- Ba lối vào chính dùng bố cục bất đối xứng nhẹ hoặc các hàng lớn, thay vì ba card giống hệt nhau.
- Mỗi lối vào có mô tả mục đích và hành động rõ.
- Bổ sung một đoạn hướng dẫn ngắn về cách dùng hệ thống và giới hạn của tra cứu riêng lẻ để trang gốc có giá trị nội dung độc lập.

### Hub tra cứu sao, cung và phụ tinh

- Công cụ select + nút tra cứu nằm ngay sau hero.
- Kết quả dùng một bề mặt chính; điểm mạnh và lưu ý được chia bằng typography và đường phân cách, không tạo hai card nặng.
- Hướng dẫn hiển thị dạng danh sách bước có thứ tự.
- Danh mục thực thể dùng index row dễ quét; mỗi hàng có tên, thuộc tính, mô tả riêng và link chi tiết nếu có.
- FAQ dùng `details/summary`, giữ nội dung hiển thị trong DOM.

### Trang thực thể sao/cung

- Breadcrumb rõ ràng.
- Hero chứa H1, mô tả và dải dữ kiện nền.
- Nội dung chính có chiều rộng đọc giới hạn.
- CTA lập lá số nằm cạnh nội dung trên desktop và chuyển thành block trong luồng trên mobile.
- Danh sách tổ hợp chỉ hiển thị URL đã publish.
- Bổ sung cấu trúc nội dung đủ phân biệt giữa từng thực thể, không chỉ thay tên sao/cung trong cùng một đoạn mẫu.

### Trang tổ hợp sao–cung

- Giảm độ cao và mức chiếm chỗ của sticky banner; trên mobile banner không sticky.
- Bảng tóm tắt trở thành data strip dễ quét.
- Bài viết giữ thứ bậc H2/H3, bảng, danh sách và internal link.
- Form lập lá số xuất hiện sau phần nội dung đầu tiên nhưng không làm gián đoạn đoạn mở đầu.
- Sidebar VIP chỉ sticky trên desktop rộng; mobile dùng CTA trong luồng.
- Nội dung liên quan trình bày dạng danh sách liên kết, không thành lưới card dày.

## Responsive và accessibility

Breakpoints dựa trên nội dung:

- Desktop rộng: nội dung + sidebar khi có đủ chiều ngang.
- Tablet: một cột, giữ khoảng trắng và chiều rộng đọc.
- Mobile: một cột, padding 16px, điều khiển full-width khi cần.

Yêu cầu:

- không có overflow ngang ở 320px;
- select, button và link hành động chính cao tối thiểu khoảng 48px;
- focus-visible rõ;
- màu chữ đạt tương phản đọc tốt;
- thứ tự DOM hợp lý khi chuyển từ hai cột sang một cột;
- hỗ trợ `prefers-reduced-motion`;
- icon chỉ bổ trợ, không thay thế nhãn chữ.

## Bảo vệ SEO và chống thin content

Thay đổi UI không được làm suy yếu nội dung hoặc indexability:

- giữ một H1 duy nhất trên mỗi trang;
- giữ nội dung H2/H3, FAQ hiển thị, breadcrumb và structured data hiện có;
- không ẩn nội dung chính sau client-only tab hoặc accordion mặc định đóng;
- không tạo URL mới từ filter/select;
- chỉ link tới tổ hợp đã publish;
- giữ canonical, robots và sitemap hiện tại;
- giữ `DRAFT` ở `noindex,follow`;
- giữ audit tối thiểu 800 từ, 4.500 ký tự, 5 H2, bảng/danh sách, ít nhất 5 internal link và CTA `/#lap-la-so`;
- giữ kiểm tra similarity và chặn `duplicate-template` từ ngưỡng hiện tại;
- nội dung bổ sung cho hub/thực thể phải trả lời câu hỏi riêng của trang, không dùng đoạn thay biến hàng loạt.

Google không có ngưỡng số từ đảm bảo chất lượng. Các ngưỡng trong repo chỉ là cổng nội bộ; tiêu chuẩn chính vẫn là mỗi URL có mục đích riêng, dữ kiện riêng và giúp người đọc hoàn thành một tác vụ cụ thể.

## Luồng dữ liệu và trạng thái lỗi

Không thay đổi data flow:

- route server lấy dữ liệu qua `pseo-data`;
- hub nhận danh sách thực thể và query `muc`;
- leaf route chỉ render trang thực thể hoặc trang curated đã publish;
- dữ liệu DB lỗi tiếp tục dùng fallback hiện có;
- thực thể không tồn tại tiếp tục trả `notFound()`.

UI phải hiển thị ổn khi danh sách liên quan rỗng hoặc chỉ có một mục. Không render section trống; không tạo link giả sang trang draft.

## Kiểm thử

Kiểm thử tự động:

- cập nhật test component cho cấu trúc và nội dung quan trọng;
- giữ test route/pSEO, audit, sitemap và publish gate;
- chạy lint và build bằng Node phù hợp với Next.js 16.

Kiểm thử trình duyệt:

- `/tra-cuu`;
- ba hub tra cứu;
- một trang thực thể sao;
- một trang thực thể cung;
- một trang tổ hợp đã publish.

Viewport tối thiểu:

- desktop khoảng 1440px;
- tablet khoảng 768px;
- mobile 390px;
- kiểm tra bổ sung không overflow ở 320px.

Kiểm tra thao tác select/submit, breadcrumb, CTA lập lá số, FAQ, link liên quan, focus keyboard và không có lỗi console.

## Tiêu chí hoàn thành

- Các loại trang dùng một hệ thống hình ảnh nhất quán nhưng không đồng dạng máy móc.
- Viewport đầu cho thấy rõ mục đích và hành động chính.
- Mobile không bị sticky CTA che nội dung, không tràn ngang và có vùng chạm phù hợp.
- Nội dung/index/schema/canonical/publish gate vẫn hoạt động.
- Lint, test tập trung và build vượt qua.
- Render thực tế được đối chiếu với thiết kế trên desktop và mobile trước khi bàn giao.
