import { describe, expect, it } from "vitest";
import {
  FREE_OVERVIEW_GUEST_INSIGHT_DEPTH,
  buildFreeOverviewTeaser,
  countVisibleMarkdownWords,
} from "@/lib/free-overview-presentation";

const report = `# Bản tổng quan lá số của bạn

Phần mở đầu riêng cho bạn.

## 1. Khí chất và cách ra quyết định

INSIGHT_MỘT

## 2. Công việc và nguồn lực

INSIGHT_HAI

**Câu hỏi tự đối chiếu:** Điều gì đang lặp lại trong cách bạn dùng nguồn lực?

Bản FULL 9 chương sẽ nối các dấu hiệu này thành lộ trình cụ thể hơn.

## 3. Quan hệ và nhịp sống

NỘI_DUNG_KHÔNG_ĐƯỢC_GỬI

## 4. Vận hiện tại

NỘI_DUNG_VẬN_KHÔNG_ĐƯỢC_GỬI`;

const premiumPreview = `# Bài mẫu luận giải miễn phí

## 1. Năng lực thiên phú (Cung Mệnh)

Nội dung miễn phí.

🔒 Nâng cấp Premium để xem:

- Điểm mù tâm lý của riêng bạn.

## 2. Phong cách kiếm tiền (Cung Tài Bạch)

Nội dung miễn phí.

🔒 Nâng cấp Premium để xem:

- Bản đồ đầu tư cá nhân.

## 3. Môi trường làm việc lý tưởng (Cung Quan Lộc)

Nội dung miễn phí.

🔒 Nâng cấp Premium để xem:

- Top 3 mô hình dự án hợp lá số.

## 4. Vận hạn năm 2026 (Năm Bính Ngọ)

Nội dung miễn phí.

🔒 Nâng cấp Premium để xem:

- Lộ trình 12 tháng.`;

describe("free overview guest presentation", () => {
  it("returns the introduction and exactly the first two insights", () => {
    const teaser = buildFreeOverviewTeaser(report);

    expect(FREE_OVERVIEW_GUEST_INSIGHT_DEPTH).toBe(2);
    expect(teaser).toContain("Phần mở đầu riêng cho bạn");
    expect(teaser).toContain("## 1. Khí chất và cách ra quyết định");
    expect(teaser).toContain("INSIGHT_MỘT");
    expect(teaser).toContain("## 2. Công việc và nguồn lực");
    expect(teaser).toContain("INSIGHT_HAI");
    expect(teaser).toContain("Câu hỏi tự đối chiếu");
    expect(teaser).toContain("Bản FULL 9 chương");
    expect(teaser).not.toContain("## 3.");
    expect(teaser).not.toContain("NỘI_DUNG_KHÔNG_ĐƯỢC_GỬI");
    expect(teaser).not.toContain("## 4.");
  });

  it("counts only words visible after Markdown formatting", () => {
    const content = "# Tiêu đề\n\n**Một câu rõ ràng** [xem thêm](https://example.com)";

    expect(countVisibleMarkdownWords(content)).toBe(8);
  });

  it("fails closed when the expected third insight boundary is missing", () => {
    expect(buildFreeOverviewTeaser("# Báo cáo cũ\n\nNội dung không rõ cấu trúc")).toBe("");
  });

  it("keeps all four sections when the free preview already injects premium hooks", () => {
    const teaser = buildFreeOverviewTeaser(premiumPreview);

    expect(teaser).toContain("## 1. Năng lực thiên phú");
    expect(teaser).toContain("## 4. Vận hạn năm 2026");
    expect(teaser.match(/🔒 Nâng cấp Premium để xem:/gu)).toHaveLength(4);
  });
});
