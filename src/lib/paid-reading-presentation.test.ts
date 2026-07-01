import { describe, expect, it } from "vitest";
import { normalizePaidReading } from "@/lib/paid-reading-presentation";

const legacy = `# Trung tâm dữ liệu lá số
| Cung | Sao |
| --- | --- |
| Mệnh | Cự Môn |

# Chương 1: Tổng quan lá số
## Mỏ neo
Bạn có nội lực bền bỉ.
## Luận giải chi tiết
Nội dung tổng quan.
## Cẩm nang hành động
- Giữ nhịp nghỉ ngơi.

# Chương 2: Mệnh, Thân và khí chất cốt lõi
## Mỏ neo
**Bạn quyết đoán khi có đủ dữ kiện.**
## Luận giải chi tiết
Nội dung khí chất.
## Cẩm nang hành động
- Kiểm tra dữ kiện trước quyết định.`;

describe("normalizePaidReading", () => {
  it("removes the dashboard and consolidates legacy action guides", () => {
    const result = normalizePaidReading(legacy);

    expect(result.content).not.toContain("Trung tâm dữ liệu lá số");
    expect(result.content).not.toContain("Cẩm nang hành động");
    expect(result.content).toContain("# Kế hoạch hành động cá nhân");
    expect(result.content).toContain("## Chương 1: Tổng quan lá số");
    expect(result.content).toContain("- Giữ nhịp nghỉ ngơi.");
    expect(result.chapters.map((chapter) => chapter.title)).toEqual([
      "Chương 1: Tổng quan lá số",
      "Chương 2: Mệnh, Thân và khí chất cốt lõi",
      "Kế hoạch hành động cá nhân",
    ]);
  });

  it("adds emphasis only when the anchor has no existing strong text", () => {
    const result = normalizePaidReading(legacy);

    expect(result.content).toContain("**Bạn có nội lực bền bỉ.**");
    expect(result.content).toContain("**Bạn quyết đoán khi có đủ dữ kiện.**");
    expect(result.content).not.toContain("****Bạn quyết đoán");
  });

  it("does not append an empty action chapter", () => {
    const content = `# Chương 1: Tổng quan\n## Mỏ neo\nMột kết luận.\n## Luận giải chi tiết\nMột diễn giải.`;
    const result = normalizePaidReading(content);

    expect(result.content).not.toContain("Kế hoạch hành động cá nhân");
    expect(result.chapters).toHaveLength(1);
  });

  it("is idempotent", () => {
    const once = normalizePaidReading(legacy);
    expect(normalizePaidReading(once.content)).toEqual(once);
  });
});
