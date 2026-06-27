# Headroom cho Codex và Claude Code

## Mục tiêu

Áp dụng Headroom cho workflow AI Agent của repo để giảm token từ log, JSON, kết
quả test và tài liệu dài mà không thay đổi runtime production của Lá số tinh
hoa.

## Kiến trúc

Headroom được cài ở user scope bằng `uv tool`; không thêm dependency Python hoặc
Node vào ứng dụng Next.js.

- Claude Code chạy qua `headroom wrap claude --memory`, nên proxy nén context tự
  động và chia sẻ bộ nhớ Headroom.
- Codex Desktop/CLI tiếp tục kết nối trực tiếp tới OpenAI. Headroom được đăng ký
  như MCP server để agent chủ động gọi `headroom_compress`,
  `headroom_retrieve`, và `headroom_stats` cho output lớn.
- Không dùng `headroom wrap codex` mặc định vì transport Responses/WebSocket của
  các bản Codex mới có báo cáo không nén hoặc kết nối không ổn định.

## Phạm vi repo

- `scripts/headroom-agent.ps1`: launcher Windows duy nhất cho setup check, MCP,
  Claude wrapper, stats và smoke compression.
- `scripts/headroom-agent.test.mjs`: kiểm tra contract của launcher và tài liệu.
- `.mcp.json`: cấu hình project MCP cho Claude Code qua launcher.
- `package.json`: các lệnh `agent:headroom:*` dễ nhớ.
- `docs/agent/headroom.md`: cài đặt, cách dùng, giới hạn, rollback và cách đo
  savings.
- `AGENTS.md` và `docs/agent/quickstart.md`: chỉ dẫn ngắn, không nhồi toàn bộ
  tài liệu Headroom vào context mặc định.

## Chính sách an toàn

- Tắt anonymous telemetry bằng `HEADROOM_TELEMETRY=off`.
- Store/cache nằm ngoài repo và không được commit.
- Không ghi API key vào script, `.mcp.json`, tài liệu hoặc `.env` của app.
- Chỉ nén output lớn; source code ngắn, lỗi chính và diff nhỏ được đọc nguyên
  văn.
- Khi Headroom không sẵn sàng, launcher báo lệnh sửa cụ thể thay vì âm thầm đổi
  model provider.

## Xác minh

1. `headroom --version` hoạt động từ uv tool.
2. MCP server khởi động qua stdio và Codex config nhận server `headroom`.
3. Smoke compression dùng payload log lặp đủ lớn, kiểm tra output ngắn hơn và
   có thể lấy stats.
4. Claude launcher báo rõ `claude` chưa cài trên máy hiện tại; sau khi cài
   Claude Code, cùng launcher chạy wrapper mà không cần sửa repo.
5. Test contract, lint và git diff không đụng các file SEO đang dở.
