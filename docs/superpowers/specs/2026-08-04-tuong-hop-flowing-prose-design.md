# Thiết kế luận giải văn xuôi cho Tương hợp 2 lá số

## Mục tiêu

Thay trải nghiệm đọc theo bốn khối “Góc nhìn chính”, “Khi đi vào đời sống”, “Việc hai người có thể thử” và “Câu hỏi nên trao đổi” bằng một đoạn văn xuôi liền mạch cho mỗi chủ đề. Người đọc cần có cảm giác đang được một người hiểu hai lá số và kể lại bằng lời thân thiện, không phải đang xem các mảnh nội dung được ghép từ rule.

## Trải nghiệm đọc

Mỗi chủ đề giữ lại:

- số thứ tự, tên chủ đề và mức tương hợp;
- một đoạn luận giải văn xuôi khoảng 160–230 từ;
- phần “Căn cứ từ hai lá số” ở dạng thu gọn bên dưới.

Không hiển thị nhãn phụ, ô màu, danh sách hành động hoặc danh sách câu hỏi trong phần đọc chính. Đoạn văn được giới hạn bề rộng đọc khoảng 65–75 ký tự trên desktop, dùng cỡ chữ tối thiểu 16px và line-height khoảng 1.7–1.8; trên điện thoại đoạn văn dùng toàn bộ chiều rộng card nhưng vẫn giữ khoảng đệm thoáng.

## Mạch kể ẩn bên trong

Engine vẫn dùng dữ liệu có cấu trúc, nhưng người đọc chỉ thấy một mạch văn:

1. Mở bằng nét tương tác đáng chú ý nhất của hai người trong chủ đề.
2. Giải thích nhu cầu hoặc thế mạnh riêng của từng người bằng ngôn ngữ đời thường.
3. Đặt hai nhịp vào một tình huống có thể xảy ra trong đời sống.
4. Chuyển nhẹ sang điểm dễ hiểu nhầm hoặc điều đáng gìn giữ.
5. Gợi một hoặc hai hành động vừa sức, không dùng giọng ra lệnh.
6. Kết bằng một câu hỏi hoặc lời mời quan sát khiến người đọc muốn đối chiếu với trải nghiệm thật.

Đây là cấu trúc biên tập nội bộ, không trở thành tiêu đề hay đoạn tách riêng trên giao diện.

## Narrative composer

`ThemeNarrative` bổ sung trường `prose: string`. Các trường có cấu trúc hiện tại vẫn được giữ trong engine để strategy dễ kiểm thử và không làm thay đổi logic chấm mức, nhưng UI chỉ hiển thị `prose`.

Composer nhận:

- `summary`, `whyItMatters`, `possibleExpression`;
- hai hành động và hai câu hỏi đã chọn theo mức;
- chủ đề, mức tương hợp, kiểu tương tác và seed ổn định;
- ledger toàn báo cáo để tránh dùng lại nhịp chuyển ý.

Composer không nối thẳng các trường bằng khoảng trắng. Mỗi chủ đề có một nhóm cầu nối và cách kết riêng. Nó có thể điều chỉnh chữ đầu của hành động, bỏ dấu câu thừa và chuyển câu mệnh lệnh thành lời gợi ý như “Hai người có thể bắt đầu bằng…”, “Điều đáng thử trước…” hoặc “Có lẽ hữu ích nhất lúc này là…”. Những họ câu này được chọn ổn định theo seed và không lặp giữa sáu lớp.

Câu hỏi được đưa vào cuối đoạn bằng cách dẫn tự nhiên, chẳng hạn “Nếu muốn kiểm chứng phần này, hai người có thể tự hỏi…” hoặc được viết lại thành một câu gợi mở gián tiếp. Không ghép cả hai câu hỏi liên tiếp như một bảng khảo sát; composer chọn câu phù hợp nhất và chỉ dùng câu thứ hai khi nó bổ sung một góc khác rõ ràng.

## Giọng văn

- Gọi tên hai người vừa đủ, tránh lặp tên ở mọi câu.
- Ưu tiên động từ cụ thể và tình huống đời thường.
- Dùng “có thể”, “dễ”, “thường”, “đáng thử”, “nếu điều này đúng với trải nghiệm” thay cho kết luận chắc chắn.
- Không giải thích thuật toán trong phần đọc nhanh.
- Không dùng câu kết chung kiểu “đây không phải nhãn tính cách” ở cả sáu lớp; giới hạn phương pháp đã có ở cuối báo cáo.
- Không phán quyết hôn nhân, chia tay, hợp tác hoặc quyết định tài chính.
- Đoạn kết tạo cảm giác được thấu hiểu và có một bước nhỏ để thử, không tạo áp lực phải làm theo.

## Chống trùng

`auditNarrativeUniqueness` chuyển sang kiểm tra trường `prose` hoàn chỉnh và vẫn phát hiện:

- câu trùng sau chuẩn hóa;
- ba từ mở đầu trùng giữa các chủ đề;
- cụm sáu từ lặp ở hai chủ đề khác nhau.

Composer ghi nhận họ cầu nối và họ câu kết trong `NarrativeLedger`. Nếu biến thể ưu tiên đã dùng, nó chọn biến thể kế tiếp theo thứ tự ổn định. Nếu mọi biến thể đều đã dùng, strategy sử dụng một câu kết riêng của chủ đề thay vì quay lại mẫu chung.

## UI

Trong `chart-compatibility-tool.tsx`, mỗi card chỉ render:

```tsx
<p className="compatibility-theme-prose">{theme.prose}</p>
```

Sau đó là `details` “Căn cứ từ hai lá số”. Các khối `compatibility-reading-layer` và `compatibility-guidance-grid` được gỡ khỏi card. CSS liên quan chỉ bị xóa khi không còn consumer khác; card, badge mức tương hợp, focus behavior và form nhập liệu giữ nguyên.

## Kiểm thử

Thực hiện TDD cho các hành vi:

- `prose` chứa nội dung từ chân dung, tình huống và gợi ý nhưng không có nhãn kỹ thuật;
- UI không còn bốn tiêu đề hoặc danh sách hành động/câu hỏi;
- mỗi đoạn dài trong khoảng chất lượng tối thiểu và không vượt mức gây mệt khi đọc;
- ba cặp fixture đều cho sáu đoạn ổn định, không trùng câu, nhịp mở hoặc cụm dài;
- thay đổi lá số trong khi giữ nguyên tên vẫn làm nội dung thay đổi;
- đảo thứ tự hai người giữ nguyên mức tương hợp nhưng đổi vai diễn đạt hợp lý;
- không xuất hiện lời phán quyết hoặc khuyến nghị tài chính chắc chắn;
- lint, bộ test và production build tiếp tục đạt.

## Ngoài phạm vi

- Không gọi LLM hoặc API hậu biên tập.
- Không đổi thuật toán an sao hoặc chấm mức tương hợp.
- Không thay đổi form ngày giờ sinh, sitemap, metadata hoặc schema.
- Không xóa phần căn cứ cung sao, phương pháp luận hoặc giới hạn sử dụng.
