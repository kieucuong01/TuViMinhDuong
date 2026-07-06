# Progressive Free Overview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hiển thị sớm một đoạn luận giải LLM cá nhân hóa có hiệu ứng đang viết và CTA đăng nhập trong khi mini-report đầy đủ tiếp tục được tạo.

**Architecture:** Lưu một `freeOverviewPreview` có phiên bản trong JSON lá số. Job nền tạo và lưu preview trước, sau đó tạo bản đầy đủ; API polling trả trạng thái `preview` ngay khi có dữ liệu. Client hé lộ preview theo cụm từ, tiếp tục polling và thay bằng bản đầy đủ khi trạng thái chuyển sang `ready`.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Vitest, CSS.

---

## File Structure

- `src/lib/ai.ts`: định nghĩa prompt, validation và lời gọi LLM cho preview 150–200 từ.
- `src/lib/data.ts`: lưu preview, phân giải trạng thái `preview`, rồi tạo bản đầy đủ.
- `src/components/free-overview-loader.tsx`: polling, hiệu ứng hé lộ chữ, CTA đăng nhập thường trực cho khách.
- `src/app/api/charts/[id]/free-overview/route.ts`: trả nguyên preview LLM, chỉ cắt teaser khi bản đầy đủ đã sẵn sàng.
- `src/app/la-so/[id]/page.tsx`: truyền trạng thái preview từ server vào loader.
- `src/app/globals.css`: con trỏ viết, chuyển động và reduced-motion.
- Các file `*.test.ts(x)` tương ứng: khóa hành vi hồi quy.

### Task 1: LLM preview contract

**Files:**
- Modify: `src/lib/ai.ts`
- Test: `src/lib/ai.test.ts`

- [ ] Viết test yêu cầu `FREE_OVERVIEW_PREVIEW_MIN_WORDS`, `FREE_OVERVIEW_PREVIEW_MAX_WORDS`, `isCompleteFreeOverviewPreview()` và `generateFreeOverviewPreview()` dùng router LLM, không trả template như kết quả hợp lệ.
- [ ] Chạy `npm test -- src/lib/ai.test.ts` và xác nhận test thất bại vì API preview chưa tồn tại.
- [ ] Thêm prompt ngắn, yêu cầu 150–200 từ, câu mở đầu chạm đúng hoàn cảnh, giải thích tối đa hai thuật ngữ tử vi và kết thúc bằng một điểm cần đọc sâu; thêm validation độ dài và bằng chứng lá số.
- [ ] Chạy lại test và xác nhận pass.

### Task 2: Persisted preview state

**Files:**
- Modify: `src/lib/data.ts`
- Test: `src/lib/free-overview-status.test.ts`

- [ ] Viết test cho lá số có `freeOverviewPreview` đúng phiên bản: `getFreeOverviewStatus()` phải trả `{ status: "preview", source: "ai-preview" }` cùng trạng thái job.
- [ ] Chạy test tập trung và xác nhận thất bại vì union chưa có `preview`.
- [ ] Mở rộng `ChartWithFreeOverview` và `FreeOverviewStatus`, thêm hàm lưu preview bằng cách đọc lại record mới nhất trước khi cập nhật để không ghi đè dữ liệu khác.
- [ ] Sửa `generateAndStoreFreeOverview()` để tái sử dụng preview hợp lệ; nếu chưa có thì gọi `generateFreeOverviewPreview()`, lưu ngay, sau đó gọi `generateFreeOverview()`. Preview lỗi không được ngăn thử tạo bản đầy đủ.
- [ ] Chạy lại test và xác nhận pass.

### Task 3: API projection

**Files:**
- Modify: `src/app/api/charts/[id]/free-overview/route.ts`
- Test: `src/app/api/charts/[id]/free-overview/route.test.ts`

- [ ] Viết test khách nhận nguyên nội dung và metadata khi status là `preview`.
- [ ] Chạy test và xác nhận thất bại vì route hiện chỉ xử lý `ready` và `fallback`.
- [ ] Giữ `buildFreeOverviewTeaser()` chỉ cho `ready`; trả `preview` không bị xóa nội dung.
- [ ] Chạy lại test route và xác nhận pass.

### Task 4: Progressive writing UI and persistent login CTA

**Files:**
- Modify: `src/components/free-overview-loader.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/app/la-so/[id]/page.tsx`
- Test: `src/components/free-overview-loader.test.ts`

- [ ] Viết test nguồn yêu cầu trạng thái `preview`, timer hé lộ theo cụm từ, class con trỏ viết, media query `prefers-reduced-motion`, CTA `loginModalHref()` có `#luan-giai` trong cả trạng thái chờ/preview/lỗi của khách.
- [ ] Chạy test và xác nhận thất bại vì các dấu hiệu trên chưa tồn tại.
- [ ] Bổ sung component CTA dùng lại, renderer preview và hook hé lộ theo cụm từ; không khởi động lại hiệu ứng khi polling cùng một nội dung.
- [ ] Tiếp tục polling khi đang ở `preview`; chuyển sang `ready` tại chỗ, không xóa nội dung đang đọc trong lúc request tiếp theo chạy.
- [ ] Thêm CSS con trỏ nhấp nháy, bố cục CTA và tắt animation khi reduced motion.
- [ ] Chạy lại test và xác nhận pass.

### Task 5: Verification

**Files:**
- Read: `docs/agent/verification.md`

- [ ] Chạy `git diff --check`.
- [ ] Chạy các test tập trung cho AI, data, route và loader.
- [ ] Chạy `npm test`.
- [ ] Chạy `npm run lint`.
- [ ] Chạy `npm run build`.
- [ ] Kiểm tra `git status --short`, bảo toàn file nháp SEO không liên quan và báo chính xác những gì đã kiểm chứng.
