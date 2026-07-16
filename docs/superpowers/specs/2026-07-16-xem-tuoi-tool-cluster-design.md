# Cụm công cụ Xem tuổi

**Ngày:** 2026-07-16

**Trạng thái:** Chờ duyệt bản viết

**Phạm vi:** Một hub `/xem-tuoi`, sáu công cụ công khai, menu header, SEO, đo lường và phát hành production.

## Mục tiêu

Thêm tab **Xem tuổi** ngay cạnh **Xem ngày** và xây một cụm công cụ miễn phí giúp người đọc đối chiếu tuổi theo các quy tắc cổ truyền có thể giải thích được. Cụm trang phục vụ ba mục tiêu cùng lúc:

1. Trả lời đúng intent tìm kiếm của từng nhu cầu xem tuổi.
2. Tạo kết quả hữu ích, minh bạch, không dùng điểm số hoặc lời phán do hệ thống tự bịa.
3. Dẫn người đọc phù hợp sang lập lá số miễn phí, xem ngày hoặc đọc nội dung chuyên sâu.

## Nguyên tắc sản phẩm

- Đây là công cụ tham khảo văn hóa, không phải dự báo khoa học hay lời khuyên thay thế quyết định thực tế.
- Không tuyên bố chắc chắn về hôn nhân, con cái, sức khỏe, lợi nhuận, tai họa hoặc vận mệnh.
- Không bán hoặc gợi ý dịch vụ “hóa giải”.
- Không lưu ngày sinh, giới tính hoặc kết quả vào URL, database, log hay analytics.
- Không tạo trang hàng loạt theo từng năm sinh, năm xem hoặc cặp tuổi.
- Không dùng một xung khắc đơn lẻ để phủ định toàn bộ quan hệ hoặc quyết định.

## Phạm vi URL và điều hướng

Tab `Xem tuổi` nằm ngay sau `Xem ngày` trong header desktop. Tab có flyout cùng ngôn ngữ giao diện với menu Xem ngày, gồm sáu liên kết:

| Nhãn | URL |
| --- | --- |
| Xem tuổi xông đất | `/xem-tuoi/xong-dat` |
| Xem tuổi vợ chồng | `/xem-tuoi/vo-chong` |
| Xem tuổi sinh con | `/xem-tuoi/sinh-con` |
| Xem tuổi kết hôn | `/xem-tuoi/ket-hon` |
| Xem tuổi làm ăn | `/xem-tuoi/lam-an` |
| Xem tuổi làm nhà | `/xem-tuoi/lam-nha` |

Menu mobile dùng một nhóm `details/summary` tương tự nhóm Xem ngày, hỗ trợ bàn phím và tự đóng khi đổi route. Hub `/xem-tuoi` có sáu thẻ công cụ, phần giải thích phương pháp, giới hạn sử dụng và liên kết tới toàn bộ trang con.

## Kiến trúc tối thiểu

Phương án đã chọn là một engine thuần TypeScript và một giao diện công cụ dùng chung:

- `src/lib/age-compatibility.ts`: quy đổi hồ sơ năm âm, Can–Chi, Nạp âm, Ngũ hành, Cung Phi, quan hệ Thiên Can/Địa Chi và các hạn theo năm.
- `src/lib/age-tools.ts`: registry sáu công cụ, metadata, yêu cầu input, nội dung riêng, CTA và hàm phân tích tương ứng.
- `src/components/age-tool.tsx`: form và kết quả dùng chung; chỉ phần này là Client Component.
- `src/app/xem-tuoi/page.tsx`: hub Server Component.
- `src/app/xem-tuoi/[tool]/page.tsx`: sáu trang được giới hạn bởi registry và tạo tĩnh; slug ngoài registry trả `notFound()`.

Nội dung SEO, breadcrumb và metadata được render phía server. Phép tính chạy tại trình duyệt bằng hàm thuần, không cần API, server action, database hoặc AI. Cách này giữ dữ liệu cá nhân trên thiết bị và tránh thêm hạ tầng không cần thiết.

Trước khi sửa API App Router, metadata hoặc `generateStaticParams`, phải đọc hướng dẫn tương ứng trong `node_modules/next/dist/docs/` theo hợp đồng repo.

## Engine và nguồn quy tắc

### Hồ sơ năm âm

Ngày sinh dương lịch được đổi sang ngày âm Việt Nam theo GMT+7 bằng `src/lib/lunar.ts`. Năm âm sau chuyển đổi là nguồn duy nhất để xác định:

- Thiên Can và Địa Chi;
- âm dương và hành của Can/Chi;
- Nạp âm trong Lục thập hoa giáp;
- Cung Phi theo năm âm và giới tính.

Việc dùng ngày sinh đầy đủ chỉ nhằm xử lý đúng người sinh trước hoặc sau Tết âm lịch. Hệ thống không dùng ngày hoặc giờ sinh để tạo độ chính xác giả cho phép so tuổi theo năm.

### Quan hệ nền

Engine biểu diễn rõ từng quan hệ, không quy tất cả về một con số:

- Ngũ hành: tương sinh, tương khắc, đồng hành và bình hòa.
- Thiên Can: ngũ hợp; hành của Can để mô tả sinh, khắc hoặc bình hòa.
- Địa Chi: tam hợp, lục hợp, lục xung, tương hại, tương phá và không có quan hệ mạnh.
- Cung Phi: dùng bảng phối cung Bát Trạch chỉ ở công cụ vợ chồng; không dùng làm chỉ báo lợi nhuận cho làm ăn.

Cung Phi được tính theo công thức Tam nguyên Cửu khí, có xử lý riêng trước/sau năm 2000 và quy ước số 5 theo giới tính. Tối thiểu phải có fixture đối chiếu:

1. Cộng hai chữ số cuối của năm âm và rút gọn về một chữ số.
2. Trước năm 2000: nam lấy `10 - số rút gọn`, nữ lấy `số rút gọn + 5` rồi tiếp tục rút gọn.
3. Từ năm 2000: nam lấy `9 - số rút gọn`, nữ lấy `số rút gọn + 6` rồi tiếp tục rút gọn; kết quả 0 của nam được quy về 9.
4. Số 5 quy về Khôn (2) cho nam và Cấn (8) cho nữ.
5. Bảng cung: 1 Khảm, 2 Khôn, 3 Chấn, 4 Tốn, 6 Càn, 7 Đoài, 8 Cấn, 9 Ly.

- 1990: nam Khảm, nữ Cấn;
- 1995: nam Khôn, nữ Khảm;
- 2000: nam Ly, nữ Càn.

Bảng Nạp âm 60 năm phải có fixture ở đầu, giữa và điểm lặp chu kỳ; không suy Nạp âm chỉ từ hành của Thiên Can.

### Kết luận minh bạch

Mỗi tiêu chí trả về:

- `status`: `favorable`, `neutral` hoặc `caution`;
- tên quy tắc;
- dữ liệu hai phía đã đối chiếu;
- giải thích ngắn bằng tiếng Việt;
- mức vai trò: `primary` hoặc `supporting`.

Kết luận tổng chỉ dùng ba nhãn:

- **Nhiều điểm thuận:** không có tiêu chí chính ở mức `caution` và số tiêu chí thuận nhiều hơn trung tính.
- **Thuận nghịch đan xen:** có cả `favorable` và `caution`, hoặc đa số tiêu chí trung tính.
- **Có xung khắc đáng lưu ý:** có từ hai tiêu chí chính ở mức `caution`; vẫn phải nói rõ đây không phải kết luận định mệnh.

Không hiển thị phần trăm, điểm trên 10/100 hoặc thứ hạng “chính xác”. Các công cụ chọn năm/xông đất có thể sắp thứ tự bằng bộ khóa minh bạch: ít `caution` chính hơn trước, nhiều `favorable` chính hơn sau, rồi năm gần hiện tại hơn. Giao diện hiển thị số tiêu chí thuận và cần cân nhắc thay vì điểm tự đặt.

## Sáu công cụ

### Xem tuổi xông đất

**Input:** ngày sinh gia chủ và năm cần xem. Năm xem từ năm hiện tại đến 20 năm tiếp theo.

**Xử lý:** tạo các hồ sơ tuổi Can–Chi cho người trưởng thành 18–80 tuổi trong năm xem; đối chiếu từng tuổi với gia chủ và Can–Chi/Nạp âm của năm. Các tiêu chí chính là Nạp âm, Thiên Can và Địa Chi của người xông so với gia chủ; quan hệ với năm xem là tiêu chí hỗ trợ.

**Output:** tối đa 10 tuổi Can–Chi có ít xung khắc chính nhất, kèm các năm sinh tương ứng trong khoảng tuổi đã xét và giải thích từng tiêu chí. Có lưu ý rằng hoàn cảnh, sức khỏe và quan hệ thực tế của người xông đất không thể suy ra từ năm sinh.

**CTA:** xem ngày đầu năm và lập lá số.

### Xem tuổi vợ chồng

**Input:** ngày sinh và giới tính của hai người.

**Xử lý:** đối chiếu Nạp âm, Thiên Can, Địa Chi và phối Cung Phi. Nạp âm/Can/Chi là tiêu chí chính; Cung Phi là lớp tham khảo bổ sung. Không biến một cặp lục xung hoặc cung xấu thành lời khuyên chia tay.

**Output:** hồ sơ hai người, bốn nhóm tiêu chí và kết luận có giới hạn.

**CTA:** lập hai lá số để đọc bối cảnh Phu Thê và xem ngày kết hôn.

### Xem tuổi sinh con

**Input:** ngày sinh bố, ngày sinh mẹ và khoảng năm dự kiến; mặc định năm hiện tại đến 10 năm tiếp theo, không quá 20 năm.

**Xử lý:** tạo hồ sơ từng năm sinh con, so Nạp âm/Can/Chi của con lần lượt với bố và mẹ. Kết quả ưu tiên năm không có xung khắc chính với cả hai hơn năm rất thuận với một người nhưng xung mạnh với người còn lại.

**Output:** tối đa 5 năm dễ tham khảo nhất, kèm hai cột đối chiếu với bố và mẹ. Không dự đoán giới tính, sức khỏe, khả năng thụ thai hoặc số phận của trẻ.

**CTA:** đọc cung Tử Tức trong lá số và các bài kiến thức liên quan.

### Xem tuổi kết hôn

**Input:** ngày sinh, giới tính và khoảng năm dự kiến; mặc định năm hiện tại đến 10 năm tiếp theo, không quá 20 năm.

**Xử lý:** tính tuổi mụ từng năm, Kim Lâu, Tam Tai và quan hệ Thái Tuế. Kim Lâu trong ngữ cảnh cưới được ghi rõ là tục lệ thường xét tuổi cô dâu; với input nam, công cụ vẫn hiển thị tuổi mụ và các yếu tố theo năm nhưng không giả rằng cùng một quy ước áp dụng giống hệt.

Kim Lâu dùng tuổi mụ chia 9, dư 1, 3, 6 hoặc 8. Tam Tai dùng bốn nhóm tam hợp và ba năm liên tiếp tương ứng. Thái Tuế chỉ mô tả quan hệ Địa Chi của tuổi với năm, không thêm hệ sao hoặc hạn không có trong engine.

Các nhóm Tam Tai được cố định như sau:

- Thân–Tý–Thìn gặp Tam Tai vào Dần–Mão–Thìn;
- Dần–Ngọ–Tuất gặp Tam Tai vào Thân–Dậu–Tuất;
- Hợi–Mão–Mùi gặp Tam Tai vào Tỵ–Ngọ–Mùi;
- Tỵ–Dậu–Sửu gặp Tam Tai vào Hợi–Tý–Sửu.

Kim Lâu ghi rõ dư 1 là Kim Lâu Thân, dư 3 là Kim Lâu Thê, dư 6 là Kim Lâu Tử và dư 8 là Kim Lâu Súc. Với Thái Tuế, cùng Địa Chi được gọi là Trực Thái Tuế, cặp lục xung được gọi là Xung Thái Tuế; quan hệ hại/phá chỉ hiển thị bằng chính tên quan hệ Địa Chi, không tự gán thêm hạn.

**Output:** bảng các năm với từng tiêu chí riêng; không dùng một tiêu chí làm lệnh cấm kết hôn.

**CTA:** `/xem-ngay/ket-hon` và lập lá số.

### Xem tuổi làm ăn

**Input:** ngày sinh của hai người; giới tính không bắt buộc vì Cung Phi không được dùng làm tiêu chí kinh doanh.

**Xử lý:** đối chiếu Nạp âm, hành Thiên Can và quan hệ Địa Chi. Kết quả chỉ mô tả mức tương hỗ/xung khắc theo quy ước năm sinh, không dự đoán doanh thu, uy tín hoặc năng lực quản trị.

**Output:** hồ sơ hai phía, ba nhóm tiêu chí và nhắc người dùng vẫn phải xem vai trò, vốn, hợp đồng và trách nhiệm thực tế.

**CTA:** xem ngày ký kết và lập lá số.

### Xem tuổi làm nhà

**Input:** ngày sinh gia chủ, giới tính và khoảng năm dự kiến; mặc định năm hiện tại đến 10 năm tiếp theo, không quá 20 năm.

**Xử lý:** tính tuổi mụ, Tam Tai, Kim Lâu và Hoang Ốc. Hoang Ốc chạy đúng vòng sáu cung:

1. Nhất Cát — thuận;
2. Nhì Nghi — thuận;
3. Tam Địa Sát — cần cân nhắc;
4. Tứ Tấn Tài — thuận;
5. Ngũ Thọ Tử — cần cân nhắc;
6. Lục Hoang Ốc — cần cân nhắc.

Cách chạy vòng được cố định để tránh bảng tuổi viết tay: 10 tuổi mụ bắt đầu ở Nhất Cát, 20 ở Nhì Nghi, 30 ở Tam Địa Sát, 40 ở Tứ Tấn Tài, 50 ở Ngũ Thọ Tử, 60 ở Lục Hoang Ốc và 70 quay lại Nhất Cát. Tuổi lẻ tiến tiếp từng cung; ví dụ 31 là Tứ Tấn Tài, 32 là Ngũ Thọ Tử, 33 là Lục Hoang Ốc và 34 quay lại Nhất Cát.

**Output:** bảng từng năm, tuổi mụ, ba tiêu chí và giải thích riêng. Không tự động đề xuất “mượn tuổi” như một bảo đảm hóa giải.

**CTA:** `/xem-ngay/dong-tho` và nội dung nhà ở liên quan.

## UX và accessibility

- Hub mở bằng giới thiệu ngắn và lưới sáu công cụ; không chặn người dùng bằng hero dài.
- Trang công cụ đặt form trước phần giải thích dài.
- Dùng `input type="date"`, `select`, `fieldset`, `legend` và nhãn hiển thị thật.
- Touch target tối thiểu 44px; cỡ chữ và khoảng cách phù hợp nhóm 30–60 tuổi.
- Lỗi nằm ngay dưới trường liên quan và được nối bằng `aria-describedby`.
- Kết quả có heading rõ, `aria-live="polite"`, không chỉ dùng màu để phân biệt ba trạng thái.
- Khi submit lỗi, giữ nguyên dữ liệu người dùng đã nhập.
- Mobile dùng một cột; bảng năm chuyển thành danh sách thẻ hoặc có cấu trúc không tràn ngang.
- Không thêm animation nặng, ảnh hero hoặc dependency mới.

## Validation và giới hạn dữ liệu

- Ngày sinh hợp lệ từ `1900-01-01` đến ngày hiện tại.
- Không nhận ngày sinh tương lai hoặc ngày lịch không tồn tại.
- Năm xem nằm từ năm hiện tại đến tối đa 20 năm tiếp theo.
- Khoảng năm phải có `from <= to` và dài tối đa 20 năm.
- Công cụ cần Cung Phi bắt buộc giới tính; công cụ không dùng Cung Phi không hỏi giới tính nếu không cần.
- Hai người cùng năm sinh vẫn hợp lệ; hệ thống không suy rằng họ là cùng một người.
- Slug công cụ không hợp lệ trả 404, không rơi về một công cụ mặc định.

## SEO và nội dung

### Indexation

- Bảy URL có metadata riêng, canonical tuyệt đối về chính URL và xuất hiện trong sitemap chính.
- Không có URL kết quả, query parameter hoặc trang tuổi/năm phát sinh để index.
- Header, hub, sitemap và internal link luôn dùng URL canonical.

### Cấu trúc nội dung mỗi trang

Mỗi trang con có nội dung riêng, không chỉ thay tên công cụ trong một template:

1. H1 và mô tả answer-first đúng intent.
2. Form công cụ.
3. Kết quả có giải thích.
4. “Công cụ này dựa vào đâu?” nêu đúng các quy tắc thực sự chạy.
5. “Cách đọc kết quả” và giới hạn.
6. Ví dụ riêng cho intent.
7. FAQ hiển thị thật.
8. Liên kết tới hub, công cụ liên quan, nội dung kiến thức và CTA phù hợp.

Chỉ thêm structured data phản ánh nội dung nhìn thấy. Dùng WebPage và Breadcrumb hiện có; FAQ có thể giữ dưới dạng nội dung hữu ích nhưng không coi FAQ rich result là mục tiêu vì Google không thường xuyên hiển thị dạng này cho website ngoài chính phủ/y tế. Không thêm review, rating hoặc lời chứng thực giả.

### Internal link chính

- Hub liên kết trực tiếp tới sáu công cụ và nhận liên kết từ cả sáu trang.
- Vợ chồng liên kết Kết hôn và Sinh con.
- Kết hôn liên kết `/xem-ngay/ket-hon`.
- Làm nhà liên kết `/xem-ngay/dong-tho`.
- Làm ăn liên kết công cụ xem ngày ký kết hiện có hoặc `/xem-ngay` với mục đích phù hợp.
- Mỗi trang có một CTA tự nhiên về `/#lap-la-so`, không lặp CTA sau mọi đoạn.

## Đo lường và quyền riêng tư

Gửi các sự kiện sau qua helper analytics hiện có:

- `age_tool_view`;
- `age_tool_submit`;
- `age_tool_result`;
- `age_tool_related_click`;
- `age_tool_chart_cta`.

Payload chỉ chứa slug công cụ, nhóm kết luận (`favorable`, `mixed`, `caution`) và vị trí CTA. Tuyệt đối không gửi ngày sinh, năm sinh, giới tính, Can–Chi cá nhân hoặc nội dung kết quả.

Product Marketing Context được cập nhật tối thiểu ở phần use case và secondary actions để ghi nhận cụm Xem tuổi; mục tiêu chuyển đổi chính vẫn là lập lá số miễn phí.

## Kiểm thử

### Unit fixtures bắt buộc

- Chu kỳ Can–Chi: 1984 Giáp Tý, 2026 Bính Ngọ và năm cách nhau 60 năm.
- Sinh sát Tết âm lịch: hai ngày dương cùng năm nhưng thuộc hai năm âm khác nhau.
- Nạp âm: fixture ở ít nhất ba điểm và một cặp lặp chu kỳ 60 năm.
- Cung Phi: 1990, 1995, 2000 cho cả nam và nữ.
- Ngũ hành: sinh, khắc, đồng hành, bình hòa.
- Địa Chi: tam hợp, lục hợp, lục xung, hại, phá và không có quan hệ mạnh.
- Kim Lâu: tuổi mụ có số dư 1, 3, 6, 8 và một tuổi không phạm.
- Tam Tai: đủ bốn nhóm tam hợp.
- Hoang Ốc: đủ sáu cung, bao gồm mốc 10, 20, 30, 40, 50, 60 và tuổi lẻ.
- Mỗi công cụ có ít nhất một fixture thuận, một fixture đan xen và một fixture cần cân nhắc.

### Regression và browser QA

- Header desktop/mobile chứa hub và đủ sáu liên kết.
- Bảy route có metadata/canonical riêng và có trong sitemap.
- Slug ngoài registry trả 404.
- Form có label, validation và giữ giá trị khi lỗi.
- Kết quả không xuất hiện trong URL và analytics không chứa dữ liệu cá nhân.
- Kiểm tra desktop và mobile tại port 4000, gồm bàn phím, menu, submit, lỗi và CTA.

## Xác minh và phát hành

Chạy theo thứ tự:

1. Test tập trung cho engine và route mới.
2. `npm run lint`.
3. `npm test`.
4. `npm run build`.
5. Browser QA local port 4000 ở desktop/mobile.
6. `npm run ship -- "feat: add xem tuoi tool cluster"`.
7. Xác nhận `pm2 describe lasotinhhoa` trỏ tới release mới và `.release-commit` đúng commit đã push.
8. Smoke `https://lasotinhhoa.vn/xem-tuoi` cùng sáu URL con, metadata, canonical, sitemap và menu header công khai.

Không coi build local là bằng chứng production.

## Nguồn tham khảo nghiên cứu

- Tuvi.vn, hub và sáu công cụ Xem tuổi: dùng để đối chiếu intent/luồng, không sao chép điểm số hoặc nội dung: <https://tuvi.vn/xem-tuoi>.
- Viện Nghiên cứu Hán Nôm, nền tảng Can–Chi/Ngũ hành: <https://hannom.vass.gov.vn/tong-muc-luc/7-van-khi-bi-dien-cua-hai-thuong-lan-ong-qua-thu-tich-han-nom-va-ung-dung-tbhnh-2002-505230>.
- Đại học Huế, nghiên cứu về các hệ quy chiếu xem ngày truyền thống và giới hạn khi phối nhiều phép: <https://hueuni.edu.vn/portal/vi/data/bandtdh/2025/6/20250630_103313_NOIDUNGLA_NGUYENDANGHUU.pdf>.
- Thư Viện Pháp Luật, cách tính Kim Lâu theo tuổi mụ chia 9: <https://thuvienphapluat.vn/lao-dong-tien-luong/cam-nang-di-lam/cach-tinh-tuoi-kim-lau-chinh-xac-nhat-pham-kim-lau-can-chu-y-gi-trong-cong-viec-1240.html>.
- Thư Viện Pháp Luật, nhóm Tam Tai và lưu ý đây là tín ngưỡng/phong tục: <https://thuvienphapluat.vn/banan/tin-tuc/tam-tai-la-gi-nhung-tuoi-gap-tam-tai-trong-nam-2026-va-nhung-dieu-can-luu-y-khi-gap-tam-tai-13434.html>.
- Google Search Central, people-first content: <https://developers.google.com/search/docs/fundamentals/creating-helpful-content>.
- Google Search Central, canonical: <https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls>.
