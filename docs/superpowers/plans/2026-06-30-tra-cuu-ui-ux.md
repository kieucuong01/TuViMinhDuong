# Tra Cứu UI/UX Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Làm mới toàn bộ họ trang `/tra-cuu` theo phong cách editorial chuyên nghiệp, dễ dùng trên mobile và không làm suy yếu nội dung/indexability.

**Architecture:** Giữ nguyên route, server data flow và publish gate. Thay đổi cấu trúc trình bày trong bốn component pSEO, bổ sung nội dung có mục đích riêng cho root hub, rồi thay vùng CSS pSEO bằng các primitive thống nhất; test server-rendered HTML bảo vệ nội dung và test CSS bảo vệ responsive.

**Tech Stack:** Next.js 16 App Router, React 19 Server Components, TypeScript, Tailwind v4/global CSS, Vitest, React DOM server renderer, Browser/IAB.

---

## File map

- Modify `src/app/tra-cuu/page.tsx`: cấu trúc root hub và phần hướng dẫn chống hiểu sai.
- Modify `src/components/pseo-hub.tsx`: danh mục editorial có thứ tự và CTA đầy đủ.
- Modify `src/components/pseo-lookup-hub.tsx`: bỏ nhãn trang trí, cải thiện cấu trúc công cụ/kết quả/index.
- Modify `src/components/pseo-entity-page.tsx`: hero, content rail, CTA và empty-state cho related pages.
- Modify `src/components/pseo-article-funnel.tsx`: banner gọn, data strip và related section không rỗng.
- Modify `src/app/globals.css`: design tokens và responsive rules cho toàn bộ pSEO.
- Modify `src/components/pseo-lookup-hub.test.tsx`: hành vi lookup, nội dung server-readable và CSS mobile.
- Create `src/components/pseo-pages-ui.test.tsx`: regression test cho root hub, hub, entity page và article funnel.

### Task 1: Khóa concept và design tokens

**Files:**
- Reference: `docs/superpowers/specs/2026-06-30-tra-cuu-ui-ux-design.md`
- Reference: `src/app/globals.css`

- [ ] **Step 1: Tạo concept desktop**

Dùng Image Gen tạo một ảnh concept desktop cho trang hub tra cứu với đúng kiến trúc: hero ngắn, công cụ tra cứu, kết quả, guide, index, FAQ và CTA; không có badge/kicker trang trí.

- [ ] **Step 2: Tạo concept mobile**

Dùng Image Gen tạo concept 390px cùng hệ thống, một cột, điều khiển full-width, CTA không sticky và nội dung 17–18px.

- [ ] **Step 3: Kiểm tra concept**

Dùng `view_image` kiểm tra typography, màu, card density, section rhythm và tính khả thi khi triển khai bằng HTML/CSS. Lặp lại nếu concept có text quá nhỏ, nested card hoặc mobile overflow.

- [ ] **Step 4: Khóa token**

Ghi lại các giá trị triển khai:

```css
--pseo-ink: #211a17;
--pseo-muted: #675f5a;
--pseo-accent: #b94b1f;
--pseo-accent-strong: #913515;
--pseo-line: #e7ded7;
--pseo-paper: #ffffff;
--pseo-wash: #fbf8f5;
```

### Task 2: Viết regression tests trước

**Files:**
- Modify: `src/components/pseo-lookup-hub.test.tsx`
- Create: `src/components/pseo-pages-ui.test.tsx`

- [ ] **Step 1: Viết test fail cho lookup hub**

Thêm assertions:

```tsx
expect(html).not.toContain("Công cụ tra cứu tử vi");
expect(html).not.toContain("Bước 1");
expect(html).toContain('class="pseo-lookup-result-meta"');
expect(html).toContain('class="pseo-index-row"');
expect(css).toContain("--pseo-ink:");
expect(css).toMatch(
  /@media \(max-width: 720px\)[\s\S]*\.pseo-sticky-banner\s*\{[\s\S]*position:\s*static/,
);
```

- [ ] **Step 2: Viết test fail cho các page family**

Tạo `src/components/pseo-pages-ui.test.tsx`, render component bằng `renderToStaticMarkup` và kiểm tra:

```tsx
expect(hubHtml).toContain('class="pseo-hub-index"');
expect(entityHtml).toContain('class="pseo-entity-reading-note"');
expect(entityWithoutRelatedHtml).not.toContain("pseo-related-group");
expect(articleWithoutRelatedHtml).not.toContain("Cùng sao, khác cung");
expect(articleHtml).toContain('class="pseo-data-strip"');
```

Đọc `src/app/tra-cuu/page.tsx` và kiểm tra root hub có heading “Cách dùng thư viện tra cứu” cùng link tới `/#lap-la-so`.

- [ ] **Step 3: Chạy test để xác nhận RED**

Run:

```powershell
& "C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" .\node_modules\vitest\vitest.mjs run src/components/pseo-lookup-hub.test.tsx src/components/pseo-pages-ui.test.tsx
```

Expected: FAIL vì các class/section mới chưa tồn tại và sticky banner mobile chưa `position: static`.

### Task 3: Triển khai semantic structure

**Files:**
- Modify: `src/app/tra-cuu/page.tsx`
- Modify: `src/components/pseo-hub.tsx`
- Modify: `src/components/pseo-lookup-hub.tsx`
- Modify: `src/components/pseo-entity-page.tsx`
- Modify: `src/components/pseo-article-funnel.tsx`

- [ ] **Step 1: Làm root hub có giá trị độc lập**

Sau ba lối vào, thêm section:

```tsx
<section className="pseo-root-guide" aria-labelledby="pseo-root-guide-title">
  <div>
    <h2 id="pseo-root-guide-title">Cách dùng thư viện tra cứu</h2>
    <p>Tra cứu giúp bạn hiểu từng lớp thông tin trước khi đối chiếu với toàn bộ lá số.</p>
  </div>
  <ol>
    <li><strong>Chọn đúng lớp dữ liệu</strong><span>Bắt đầu từ sao, cung hoặc phụ tinh bạn đang thấy.</span></li>
    <li><strong>Đặt vào đúng bối cảnh</strong><span>Không kết luận từ một tên sao đứng riêng.</span></li>
    <li><strong>Đối chiếu lá số cá nhân</strong><span>Dùng ngày giờ sinh để xem vị trí và tổ hợp thực tế.</span></li>
  </ol>
</section>
```

Thêm CTA tới `/#lap-la-so`, không tạo route mới.

- [ ] **Step 2: Chuyển hub thành index editorial**

Đổi wrapper thành `pseo-hub-index`, thêm số thứ tự bằng `aria-hidden`, giữ nguyên `canonicalPath` và không render link khi thiếu canonical.

- [ ] **Step 3: Tinh gọn lookup hub**

Xóa hai nhãn trang trí “Công cụ tra cứu tử vi” và “Bước 1”. Đổi element thành metadata có class `pseo-lookup-result-meta`; mỗi entity row dùng class `pseo-index-row`. Giữ form GET, toàn bộ FAQ và entity index trong server HTML.

- [ ] **Step 4: Làm entity page có chiều sâu và empty-state đúng**

Thêm một đoạn `pseo-entity-reading-note` giải thích sao/cung chỉ là một lớp dữ liệu. Chỉ render `pseo-related` khi `page.relatedPages.length > 0`.

- [ ] **Step 5: Tinh gọn article funnel**

Đổi `pseo-summary-table` thành `pseo-data-strip`. `RelatedList` trả `null` nếu `pages.length === 0`; section `pseo-related` chỉ render khi một trong hai danh sách có dữ liệu.

- [ ] **Step 6: Chạy test cấu trúc**

Run lệnh Vitest ở Task 2.

Expected: phần HTML assertions PASS; CSS assertions vẫn FAIL cho tới Task 4.

### Task 4: Triển khai CSS editorial và responsive

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Thêm pSEO tokens**

Khai báo token ở `.pseo-page, .pseo-hub`:

```css
.pseo-page,
.pseo-hub {
  --pseo-ink: #211a17;
  --pseo-muted: #675f5a;
  --pseo-accent: #b94b1f;
  --pseo-accent-strong: #913515;
  --pseo-line: #e7ded7;
  --pseo-paper: #fff;
  --pseo-wash: #fbf8f5;
}
```

- [ ] **Step 2: Giảm card density**

Chuyển hub/index/related thành row hoặc rail có border-bottom; chỉ giữ shadow nhẹ cho lookup tool và inline chart form. Giới hạn content width và áp dụng `content-visibility: auto` cho index dài.

- [ ] **Step 3: Tạo data strip và content rail**

`pseo-data-strip` dùng hai cột desktop, một cột mobile; `pseo-entity-content article` giới hạn dòng đọc; sidebar dùng nền mực và chỉ sticky trên desktop.

- [ ] **Step 4: Sửa mobile**

Trong `@media (max-width: 720px)`:

```css
.pseo-sticky-banner {
  position: static;
}

.pseo-lookup-form > div,
.pseo-lookup-lists,
.pseo-lookup-index > ul,
.pseo-data-strip {
  grid-template-columns: 1fr;
}

.pseo-hub .btn,
.pseo-lookup-form button {
  width: 100%;
  min-height: 3rem;
}
```

Đặt body copy pSEO ở `1.0625rem` hoặc lớn hơn, padding ngang 1rem và bảo đảm `min-width: 0`.

- [ ] **Step 5: Chạy test để xác nhận GREEN**

Run lệnh Vitest ở Task 2.

Expected: 0 failed.

### Task 5: Kiểm tra toàn bộ và browser QA

**Files:**
- Verify: all modified files

- [ ] **Step 1: Chạy pSEO regression suite**

```powershell
& "C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" .\node_modules\vitest\vitest.mjs run src/components/pseo-lookup-hub.test.tsx src/components/pseo-pages-ui.test.tsx src/app/tra-cuu/pseo-routes.test.ts src/lib/pseo.test.ts src/lib/pseo-sitemap.test.ts
```

Expected: 0 failed.

- [ ] **Step 2: Chạy lint**

```powershell
& "C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" .\node_modules\eslint\bin\eslint.js src/app/tra-cuu/page.tsx src/components/pseo-hub.tsx src/components/pseo-lookup-hub.tsx src/components/pseo-entity-page.tsx src/components/pseo-article-funnel.tsx src/components/pseo-lookup-hub.test.tsx src/components/pseo-pages-ui.test.tsx
```

Expected: 0 errors.

- [ ] **Step 3: Chạy build**

```powershell
$env:PATH="C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;$env:PATH"
npm run build
```

Expected: exit code 0.

- [ ] **Step 4: Chạy local app**

```powershell
$env:PATH="C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;$env:PATH"
npx next dev --webpack -p 4000
```

- [ ] **Step 5: Browser QA**

Dùng Browser/IAB kiểm tra `/tra-cuu`, ba hub, một entity star, một entity palace và một curated leaf ở 1440px, 768px, 390px và 320px. Kiểm tra form GET, FAQ, CTA, keyboard focus, console và horizontal overflow.

- [ ] **Step 6: Fidelity QA**

Chụp desktop và mobile render. Dùng `view_image` cho concept và render mới; ghi fidelity ledger tối thiểu năm điểm: copy, layout, typography, palette, container model, responsive và CTA behavior. Sửa mọi mismatch còn thấy được.

- [ ] **Step 7: Kiểm tra diff**

```powershell
git diff --check
git status --short
```

Expected: không có whitespace error; ba file SEO-autopilot có sẵn vẫn không bị sửa bởi task này.
