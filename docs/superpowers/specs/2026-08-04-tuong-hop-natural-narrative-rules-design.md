# Thiết kế rule luận giải tự nhiên cho Tương hợp 2 lá số

## Mục tiêu

Thay hệ thống ghép câu đồng dạng hiện tại bằng một engine biên tập theo ngữ cảnh. Báo cáo vẫn chạy hoàn toàn trên trình duyệt, không gọi LLM, không gửi dữ liệu ngày giờ sinh ra ngoài, nhưng mỗi lớp có giọng kể, mạch lập luận và tình huống riêng như một người luận giải đang viết.

Thành công được hiểu là:

- Sáu lớp không còn dùng chung một câu mở đầu hay khung đoạn văn cố định.
- Nội dung gọi đúng tên và mô tả vai trò riêng của hai người, thay vì chỉ liệt kê hai nhóm đặc tính.
- Mỗi nhận định đi qua một mạch rõ: trọng tâm, tương tác, tình huống thực tế, điểm cần lưu ý và bước có thể thử.
- Không có câu hoặc lời khuyên trùng nguyên văn giữa các lớp; hạn chế rõ rệt các cụm dẫn nhập lặp lại.
- Kết quả có tính quyết định: cùng dữ liệu luôn cho cùng văn bản, thuận tiện kiểm thử và chia sẻ.

## Phạm vi

Thay đổi tập trung trong `src/lib/chart-compatibility.ts`, các kiểm thử của module và nhãn hiển thị liên quan trong `chart-compatibility-tool.tsx`. Không thay đổi cách an lá số, cách tính mức tương hợp, form nhập liệu, lưu trữ, tài khoản hay API.

## Kiến trúc rule

### 1. Hồ sơ diễn giải của từng người

Với mỗi chủ đề, engine tạo một hồ sơ nhỏ gồm:

- hai đặc tính nổi bật theo thứ tự ưu tiên;
- tín hiệu nâng đỡ và tín hiệu cần điều tiết;
- vai trò tương tác phù hợp với chủ đề;
- cung sao làm căn cứ.

Hồ sơ này là dữ liệu trung gian, không phải câu văn. Nó giúp tách logic đọc lá số khỏi logic biên tập.

### 2. Sáu chiến lược biên tập độc lập

Mỗi lớp có một chiến lược riêng:

- `temperament`: nhịp phản ứng, nhu cầu khi căng thẳng và cách lấy lại cân bằng;
- `communication`: một tình huống đối thoại, cách truyền đạt và cách tiếp nhận;
- `commitment`: nhu cầu gần gũi, biểu hiện quan tâm và kỳ vọng cam kết;
- `finance`: cách nhìn nguồn lực, quyền tự chủ, rủi ro và quyết định chung;
- `work`: cách mở việc, kiểm tra, chốt quyết định và chịu trách nhiệm;
- `family`: ảnh hưởng nền gia đình, đời sống chung và lựa chọn dài hạn.

Chiến lược trả về các đoạn đã phân vai: `opening`, `interaction`, `realLifeScene`, `watchPoint`. UI có thể hiển thị thành các lớp dễ đọc mà không cần biết rule bên trong.

### 3. Kho biến thể có điều kiện

Mỗi chiến lược có biến thể theo ba kiểu tương tác:

- `shared`: hai người có đặc tính nổi bật tương đồng;
- `complementary`: đặc tính khác nhau nhưng có thể bổ sung;
- `contrast`: khác nhịp và cần quy ước rõ.

Mỗi kiểu tiếp tục có biến thể theo mức `flow`, `coordinate`, `discuss`. Biến thể được chọn bằng khóa ổn định tạo từ chủ đề, hai hồ sơ và dữ liệu lá số; không dùng `Math.random`, nên không gây thay đổi nội dung mỗi lần render.

### 4. Cơ chế chống trùng

Một bộ điều phối báo cáo giữ lại dấu vết các lựa chọn đã dùng:

- họ câu mở đầu;
- cụm chuyển ý;
- góc mô tả đặc tính;
- hành động và câu hỏi.

Khi biến thể dự kiến va với phần trước, engine chọn ứng viên kế tiếp. Sau khi dựng đủ sáu lớp, một bước kiểm tra chuẩn hóa câu và n-gram phát hiện câu trùng nguyên văn, câu mở cùng nhịp hoặc cụm dài lặp quá ngưỡng. Nếu vẫn trùng, engine dùng biến thể dự phòng của chính chủ đề; không xóa nội dung làm mất ý.

### 5. Nguyên tắc văn phong

- Viết trực tiếp, tự nhiên, ưu tiên động từ và tình huống đời thường.
- Đặt tên hai người đúng chỗ nhưng không lặp tên trong mọi câu.
- Không mở liên tiếp bằng “Hai người…”, “Một người…”, hoặc “Điều này…”.
- Tránh thuật ngữ tử vi trong phần đọc nhanh; căn cứ cung sao giữ trong khối mở rộng.
- Không phán quyết quan hệ, hôn nhân hay tài chính; dùng ngôn ngữ xác suất và mời kiểm chứng bằng trải nghiệm thật.
- Lời khuyên phải cụ thể, vừa sức và khác nhau theo từng lớp.

## Dòng dữ liệu

1. Hai `ChartInput` được xác thực và đưa qua engine lá số hiện có.
2. Logic chấm mức tương hợp hiện tại giữ nguyên.
3. `buildNarrativeProfile` tạo dữ liệu diễn giải cho từng người ở từng chủ đề.
4. Strategy của chủ đề dựng các ứng viên đoạn văn theo kiểu tương tác và mức kết quả.
5. `NarrativeLedger` chọn biến thể chưa dùng và ghi nhận dấu vết.
6. Bộ kiểm tra chống trùng rà toàn báo cáo.
7. Component hiển thị mạch luận giải mới và giữ nguyên phần căn cứ, phương pháp, giới hạn.

## Xử lý thiếu dữ liệu và lỗi

Nếu một cung vô chính diệu hoặc không rút được đặc tính nổi bật, strategy chuyển sang mô tả nhịp cung, tín hiệu phụ trợ và nhu cầu trao đổi; không in câu kỹ thuật kiểu “không đủ dữ liệu”. Validation đầu vào và lỗi ngày giờ sinh giữ nguyên. Engine không được ném lỗi chỉ vì kho biến thể đã dùng hết; nó dùng biến thể dự phòng có cấu trúc trung tính nhưng vẫn riêng cho chủ đề.

## Kiểm thử

Thực hiện TDD với các nhóm kiểm thử:

- sáu lớp có câu mở và mạch kể khác nhau;
- không có câu trùng nguyên văn hoặc n-gram dài vượt ngưỡng giữa các lớp;
- cùng dữ liệu cho kết quả ổn định;
- đảo thứ tự hai người giữ nguyên mức tương hợp nhưng đổi vai diễn đạt hợp lý;
- các mẫu lá số khác nhau sinh ra nội dung khác nhau;
- mỗi lớp vẫn có tình huống, điểm lưu ý, hành động, câu hỏi và căn cứ;
- không xuất hiện ngôn ngữ định mệnh hoặc khuyến nghị tài chính chắc chắn;
- toàn bộ dữ liệu vẫn được xử lý cục bộ, không thêm network/API dependency.

## Ngoài phạm vi

- Không gọi LLM để hậu biên tập.
- Không thêm điểm số phần trăm.
- Không thay đổi thuật toán an sao hoặc chấm mức tương hợp.
- Không cá nhân hóa bằng dữ liệu hành vi, tài khoản hoặc lịch sử người dùng.
