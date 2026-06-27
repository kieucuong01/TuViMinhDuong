# Lookup Hubs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chuyển ba hub tra cứu cung, chính tinh và phụ tinh thành form tra cứu server-rendered có nội dung biên tập đủ sâu.

**Architecture:** Một server component dùng chung nhận danh sách thực thể, giá trị được chọn và cấu hình nội dung riêng cho từng hub. Ba page dùng `searchParams: Promise` của Next.js 16 để chọn kết quả, còn metadata và canonical giữ nguyên URL hub.

**Tech Stack:** Next.js 16 App Router, React 19 Server Components, TypeScript, CSS, Vitest.

---

### Task 1: Khóa hành vi bằng regression test

**Files:**
- Modify: `src/app/tra-cuu/pseo-routes.test.ts`

- [ ] **Step 1: Write the failing test**

Thêm assertions yêu cầu component chung có form GET, select `muc`, result
server-rendered, FAQ và danh mục; yêu cầu cả ba route truyền nội dung riêng và
đọc `searchParams` dạng Promise.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/app/tra-cuu/pseo-routes.test.ts`

Expected: FAIL vì `pseo-lookup-hub.tsx` và markers mới chưa tồn tại.

### Task 2: Tạo server-rendered lookup component

**Files:**
- Create: `src/components/pseo-lookup-hub.tsx`
- Modify: `src/app/tra-cuu/y-nghia-12-cung/page.tsx`
- Modify: `src/app/tra-cuu/y-nghia-14-chinh-tinh/page.tsx`
- Modify: `src/app/tra-cuu/phu-tinh/page.tsx`

- [ ] **Step 1: Implement minimal shared component**

Component phải nhận `entities`, `selectedSlug`, `formLabel`, `resultContext`,
`guide`, `principles`, `faqs` và render toàn bộ cấu trúc semantic.

- [ ] **Step 2: Wire all routes**

Mỗi page await `searchParams`, lấy giá trị chuỗi của `muc`, truyền nội dung riêng
và giữ metadata/canonical hiện tại.

- [ ] **Step 3: Run focused test**

Run: `npm test -- src/app/tra-cuu/pseo-routes.test.ts`

Expected: PASS.

### Task 3: Hoàn thiện giao diện responsive

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add lookup form and result styles**

Style theo palette cam/đá hiện tại, form rõ ràng, touch target lớn, result có
hierarchy, danh mục gọn và responsive một cột dưới 720px.

- [ ] **Step 2: Run quality checks**

Run: `npm test -- src/app/tra-cuu/pseo-routes.test.ts src/lib/pseo.test.ts`

Expected: PASS.

Run: `npm run lint`

Expected: exit 0.

Run: `npm run build`

Expected: exit 0.

### Task 4: Browser verification

**Files:**
- No source changes unless visual defects are found.

- [ ] **Step 1: Start local production server on port 4000**

Run: `npx next start -p 4000`

- [ ] **Step 2: Verify three routes**

Kiểm tra desktop và mobile, submit form trên từng route, xác nhận query đổi,
kết quả đúng, không overflow, không lỗi console và nội dung nền vẫn hiển thị.
