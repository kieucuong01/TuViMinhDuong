# Headroom cho AI Agent

Repo dùng Headroom theo mô hình hybrid:

- Claude Code: chạy qua proxy để nén tự động.
- Codex Desktop/CLI: giữ kết nối OpenAI trực tiếp và dùng MCP để nén output lớn
  theo nhu cầu.

Cách này tránh buộc Codex Responses/WebSocket đi qua proxy. Một số phiên bản
Codex mới có thể truyền request qua Headroom nhưng không tạo savings, hoặc lỗi
transport. Chỉ bật `headroom wrap codex` sau khi upstream xác nhận tương thích
và một smoke thực tế cho thấy `tokens_saved > 0`.

## Cài đặt một lần

```powershell
uv tool install --force "headroom-ai[mcp,proxy]"
npm run agent:headroom:doctor
```

Headroom được cài ở user scope, không đi vào `node_modules`, production build
hoặc VPS. Launcher luôn đặt `HEADROOM_TELEMETRY=off`.

## Dùng với Codex

Codex config user có MCP server `headroom`. Với output lớn như log build, JSON,
DB rows hoặc kết quả audit, agent nên gọi:

- `headroom_compress`: nén trước khi phân tích;
- `headroom_retrieve`: lấy lại nguyên bản khi phần nén thiếu chi tiết;
- `headroom_stats`: xem savings.

Không cần đổi model provider hoặc `OPENAI_BASE_URL`. Sau khi đăng ký MCP, mở
thread Codex mới để tool được load.

## Dùng với Claude Code

Máy hiện tại chưa có lệnh `claude`. Sau khi cài Claude Code:

```powershell
npm run agent:headroom:claude
```

Lệnh này chạy `headroom wrap claude --memory --tool-search true` từ root của
repo. Tham số sau action được chuyển tiếp:

```powershell
npm run agent:headroom:claude -- --resume
```

Project `.mcp.json` cũng đăng ký Headroom MCP cho Claude Code.

## Kiểm tra và đo savings

```powershell
npm run agent:headroom:doctor
npm run agent:headroom:smoke
npm run agent:headroom:stats
```

Smoke thử cả log lớn và JSON array lớn có một dòng FATAL. Kết quả hợp lệ phải có
`tokensSaved > 0` và `fatalPreserved: true`.

Headroom hữu ích nhất với JSON lớn, log build/test và session dài. Với file code
ngắn, `rg` output gọn hoặc diff nhỏ, đọc trực tiếp thường nhanh và chính xác hơn.

## Dữ liệu và rollback

Cache, memory và savings nằm dưới `~/.headroom`, không nằm trong repo. Script
không lưu OpenAI/Anthropic API key.

Gỡ Codex MCP:

```powershell
codex mcp remove headroom
```

Gỡ Headroom:

```powershell
uv tool uninstall headroom-ai
```

Xóa `.mcp.json` chỉ khi không còn muốn Claude Code dùng MCP của project.
