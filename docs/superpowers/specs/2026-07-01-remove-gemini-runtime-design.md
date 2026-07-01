# Thiết kế loại bỏ Gemini khỏi runtime

## Mục tiêu

Loại bỏ toàn bộ hỗ trợ Gemini khỏi mã chạy production, test, kiểm tra môi trường và tài liệu vận hành đang hoạt động. Hệ thống AI chỉ dùng chuỗi nhà cung cấp:

`DeepSeek → Groq → template fallback`

## Phạm vi

### LLM router

- `LlmProvider` chỉ còn `deepseek | groq`.
- Xóa tùy chọn `geminiModel` khỏi `GenerateOptions`.
- Xóa hàm gọi Gemini, URL Google Generative Language và xử lý lỗi Gemini.
- Xóa đọc biến `GEMINI_API_KEY`, `GEMINI_API_KEYS`, `GEMINI_MODEL`.
- Thứ tự mặc định của router là `deepseek,groq`.
- `hasExternalLlmProvider` chỉ kiểm tra DeepSeek và Groq.
- Giữ cơ chế luân phiên key, chuyển provider khi rate limit và template fallback.

### Luận giải miễn phí và trả phí

- Xóa các hằng, helper và metadata liên quan model Gemini khỏi `src/lib/ai.ts`.
- Xóa các biến:
  - `PAID_READING_PRIMARY_GEMINI_MODEL`
  - `PAID_READING_ESCALATION_GEMINI_MODEL`
  - `PAID_READING_YEARLY_GEMINI_MODEL`
- Mọi chương trả phí gọi cùng router `DeepSeek → Groq`.
- Nếu chương thiếu độ dài hoặc heading bắt buộc, retry đúng một lần qua cùng router trước khi dùng template fallback.
- Chương vận năm không còn model override riêng.
- Metadata prompt chỉ lưu provider order và kết quả model thực tế; không lưu Gemini model policy.

### Kiểm tra production env

- Nhóm LLM hợp lệ gồm:
  - `DEEPSEEK_API_KEY` hoặc `DEEPSEEK_API_KEYS`
  - `GROQ_API_KEY` hoặc `GROQ_API_KEYS`
- Thông báo thiếu cấu hình phải nhắc `DEEPSEEK_*` và `GROQ_*`.
- Gemini key còn tồn tại trên VPS không được đọc hoặc dùng; việc xóa secret khỏi VPS là hạng mục vận hành riêng.

### Tài liệu

Cập nhật tài liệu đang dùng:

- `README.md`
- `docs/agent/current-state.md`
- `docs/agent/README.md`
- Kế hoạch mini-report vừa tạo nếu còn ghi chú giữ thay đổi Gemini.

Không sửa các spec/plan lịch sử ngày 2026-06-29 vì chúng ghi lại quyết định tại thời điểm cũ, không phải hướng dẫn vận hành hiện tại.

## Tương thích và dữ liệu

- Không thay đổi schema database.
- Không thay đổi nội dung lá số hoặc thuật toán tử vi.
- Các reading đã lưu với tên model `gemini/...` vẫn đọc được như dữ liệu lịch sử.
- Không chạy migration hoặc sửa các reading cũ.
- Nếu production chỉ có Gemini key mà thiếu cả DeepSeek và Groq, kiểm tra env sẽ báo thiếu LLM và runtime dùng template fallback.

## Kiểm thử

### Router

- DeepSeek được ưu tiên trước Groq theo mặc định.
- Rate limit DeepSeek chuyển sang Groq.
- Không có key trả về `null`.
- `LLM_PROVIDER_ORDER` có giá trị `gemini` phải bỏ qua giá trị đó.
- Source router không còn chuỗi `gemini`, `GEMINI_*` hoặc Google Generative Language.

### Luận giải

- Free overview và paid reading vẫn truyền `deepseek,groq`.
- Chương sai format được gọi hai lần rồi mới fallback.
- Chương hợp lệ chỉ gọi một lần.
- Prompt metadata không còn model policy Gemini.

### Production env

- Chỉ DeepSeek key: LLM sẵn sàng.
- Chỉ Groq key: LLM sẵn sàng.
- Chỉ Gemini key: LLM không sẵn sàng.

### Verification

Chạy:

```powershell
npm run lint
npm test
npm run build
```

Sau đó chạy `rg -i "gemini"` trong các file runtime, test và tài liệu vận hành đang hoạt động. Kết quả chỉ được phép còn trong spec/plan lịch sử đã nêu rõ ở trên.

## Ngoài phạm vi

- Không đổi model DeepSeek hoặc Groq hiện tại.
- Không thêm nhà cung cấp mới.
- Không xóa secret production qua SSH trong thay đổi code này.
- Không sửa dữ liệu reading lịch sử.
