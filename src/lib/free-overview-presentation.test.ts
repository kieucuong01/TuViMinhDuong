import { describe, expect, it } from "vitest";
import { FREE_OVERVIEW_GUEST_INSIGHT_DEPTH, buildFreeOverviewTeaser } from "@/lib/free-overview-presentation";

const report = `# Bản tổng quan lá số của bạn

Phần mở đầu riêng cho bạn.

## 1. Khí chất và cách ra quyết định

INSIGHT_MỘT

## 2. Công việc và nguồn lực

INSIGHT_HAI

## 3. Quan hệ và nhịp sống

NỘI_DUNG_KHÔNG_ĐƯỢC_GỬI

## 4. Vận hiện tại

NỘI_DUNG_VẬN_KHÔNG_ĐƯỢC_GỬI

## Hai câu hỏi để bạn tự đối chiếu

- Câu hỏi thứ nhất?
- Câu hỏi thứ hai?`;

describe("free overview guest presentation", () => {
  it("returns the introduction and exactly the first two insights", () => {
    const teaser = buildFreeOverviewTeaser(report);

    expect(FREE_OVERVIEW_GUEST_INSIGHT_DEPTH).toBe(2);
    expect(teaser).toContain("Phần mở đầu riêng cho bạn");
    expect(teaser).toContain("## 1. Khí chất và cách ra quyết định");
    expect(teaser).toContain("INSIGHT_MỘT");
    expect(teaser).toContain("## 2. Công việc và nguồn lực");
    expect(teaser).toContain("INSIGHT_HAI");
    expect(teaser).not.toContain("## 3.");
    expect(teaser).not.toContain("NỘI_DUNG_KHÔNG_ĐƯỢC_GỬI");
    expect(teaser).not.toContain("## 4.");
    expect(teaser).not.toContain("Câu hỏi thứ nhất");
  });

  it("fails closed when the expected third insight boundary is missing", () => {
    expect(buildFreeOverviewTeaser("# Báo cáo cũ\n\nNội dung không rõ cấu trúc")).toBe("");
  });
});
