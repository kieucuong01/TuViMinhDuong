# Tương hợp 2 lá số Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hoàn thiện công cụ `/tuong-hop-la-so` với luận giải hai lá số chi tiết, dễ hiểu, riêng tư và tối ưu SEO/AEO.

**Architecture:** Giữ landing page và dữ liệu SEO ở Server Component, còn form cùng báo cáo là một Client Component tính cục bộ. Module `chart-compatibility.ts` chỉ tiêu thụ JSON từ engine `generateTuViChart`, tạo báo cáo xác định và không thay đổi quy tắc an sao.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind/CSS hiện có, Vitest, JSON-LD.

## Global Constraints

- Copy dành cho người Việt 30–60 tuổi, bình tĩnh, rõ ràng, không phán định số mệnh hay đảm bảo hôn nhân.
- Không lưu dữ liệu sinh, không gọi LLM/API ngoài, không thay chart engine và không bypass payment gate.
- Mỗi nhận định kết quả phải có căn cứ cung/sao và hành động tự đối chiếu.
- Route công khai phải có canonical, answer block, nội dung tĩnh, FAQ nhìn thấy được, schema khớp và sitemap/AI discovery.
- UI phải dùng label thật, focus rõ, control tối thiểu 44–48px và không tràn ở 390px.

---

### Task 1: Module báo cáo tương hợp

**Files:**
- Create: `src/lib/chart-compatibility.test.ts`
- Create: `src/lib/chart-compatibility.ts`

**Interfaces:**
- Consumes: `ChartInput`, `TuViChart`, `Palace`, `generateTuViChart` từ `src/lib/chart.ts`.
- Produces: `buildChartCompatibilityReport(first, second): ChartCompatibilityReport`.

- [ ] **Step 1: Viết kiểm thử đỏ** cho validation, kết quả đối xứng, đủ sáu chủ đề, evidence có cung/sao, ba mức sắc thái và copy giới hạn.
- [ ] **Step 2: Chạy `vitest run src/lib/chart-compatibility.test.ts`**, xác nhận fail vì module chưa tồn tại.
- [ ] **Step 3: Viết implementation tối thiểu** gồm validation, quan hệ ngũ hành, nhóm sao, evidence formatter, theme builder và summary.
- [ ] **Step 4: Chạy lại kiểm thử**, sửa implementation cho tới khi toàn bộ test module xanh.

### Task 2: Công cụ nhập hai người và hiển thị luận giải

**Files:**
- Create: `src/components/chart-compatibility-tool.test.ts`
- Create: `src/components/chart-compatibility-tool.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: `buildChartCompatibilityReport` và các type báo cáo Task 1.
- Produces: `<ChartCompatibilityTool />` với form hai fieldset, lỗi và vùng kết quả có focus.

- [ ] **Step 1: Viết kiểm thử đỏ** kiểm tra hai nhóm dữ liệu, label, thông báo riêng tư, CTA submit, sáu vùng luận giải, details evidence và vùng lỗi live.
- [ ] **Step 2: Chạy test component**, xác nhận fail vì component chưa tồn tại.
- [ ] **Step 3: Viết component** dùng `FormData`, HTML validation và `useState`; tạo báo cáo tại submit, focus kết quả, cho phép sửa dữ liệu.
- [ ] **Step 4: Bổ sung CSS** mobile-first dùng token/cấu trúc hiện có, hai cột từ desktop, control 48px, card rõ và `prefers-reduced-motion` an toàn.
- [ ] **Step 5: Chạy lại test component** và kiểm tra không có nội dung phán quyết tuyệt đối.

### Task 3: Landing page SEO/AEO/schema

**Files:**
- Create: `src/app/tuong-hop-la-so/page.test.ts`
- Create: `src/app/tuong-hop-la-so/page.tsx`

**Interfaces:**
- Consumes: `ChartCompatibilityTool`, `routeMetadata`, `webPageJsonLd`, `webApplicationJsonLd`, `faqJsonLd`.
- Produces: route indexable `/tuong-hop-la-so`.

- [ ] **Step 1: Viết kiểm thử đỏ** cho metadata/canonical, JSON-LD, answer block, FAQ nhìn thấy, bảng so sánh xem tuổi và hai lá số, phương pháp, internal links và disclaimer.
- [ ] **Step 2: Chạy route test**, xác nhận fail vì page chưa tồn tại.
- [ ] **Step 3: Viết page** với H1 rõ intent, câu trả lời 40–60 từ, công cụ ở đầu trang, nội dung phương pháp/FAQ và ba script JSON-LD đã escape `<`.
- [ ] **Step 4: Chạy lại route test**.

### Task 4: Điều hướng và discovery

**Files:**
- Modify: `src/components/site-header.tsx`
- Modify: `src/components/site-header-effects.test.ts`
- Modify: `src/app/sitemap.ts`
- Modify: `src/app/sitemap.test.ts`
- Modify: `src/app/lifetime-tuvi-page.test.ts`
- Modify: `public/llms.txt`

**Interfaces:**
- Produces: link desktop/mobile qua nguồn `tuViLinks`, sitemap entry và AI discovery entry.

- [ ] **Step 1: Sửa test trước** để yêu cầu `href: "/tuong-hop-la-so"`, sitemap entry/date và llms link; bỏ assertion placeholder cũ.
- [ ] **Step 2: Chạy nhóm test**, xác nhận fail vì route chưa được nối.
- [ ] **Step 3: Kích hoạt menu item**, thêm mốc `compatibility` vào sitemap và mô tả route trong `llms.txt`.
- [ ] **Step 4: Chạy lại nhóm test**.

### Task 5: Xác minh và phát hành

**Files:**
- Modify only if verification exposes a scoped defect.

- [ ] **Step 1: Chạy focused tests**, `git diff --check` và lint trên mã thay đổi.
- [ ] **Step 2: Chạy full `npm test`, `npm run lint`, `npm run build`** bằng bundled Node; sửa mọi lỗi trong scope.
- [ ] **Step 3: Chạy local production server port 4000**, kiểm tra desktop và viewport 390px: form, submit, kết quả, focus, menu, metadata/schema và không tràn ngang.
- [ ] **Step 4: Rà scope/dirty state**, cập nhật checklist kế hoạch và xác minh không có file ngoài phạm vi.
- [ ] **Step 5: Dùng `npm run ship -- "feat: add two-chart compatibility readings"`** để commit, push `origin/master`, deploy release VPS.
- [ ] **Step 6: Xác minh SHA origin/VPS/current release, PM2 online, route public 200, canonical/JSON-LD/sitemap/llms và hành vi form production.
