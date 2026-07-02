import { describe, expect, it } from "vitest";
import { countWords } from "@/lib/ai";
import {
  FREE_OVERVIEW_TEASER_MAX_WORDS,
  buildFreeOverviewTeaser,
} from "@/lib/free-overview-presentation";

function repeatedWords(prefix: string, count: number) {
  return Array.from({ length: count }, (_, index) => `${prefix}-${index}`).join(" ");
}

const fullReport = `## Mỏ neo
- **Nội lực: 75/100** — Nền tảng vững nhưng cần chọn đúng môi trường.
- **Công việc & tài chính: 65/100** — Có cơ hội khi kiểm soát phạm vi.
- **Vận năm 2026: 55/100** — Nên tiến theo từng bước có kiểm chứng.

## Điểm đáng chú ý nhất
Cung Mệnh và đại vận hiện tại tạo ra một điểm chuyển giữa an toàn và nhu cầu thay đổi.

## Khí chất và nội lực
NỘI_DUNG_KHÓA_KHÍ_CHẤT

## Công việc và tài chính
NỘI_DUNG_KHÓA_CÔNG_VIỆC

## Tình cảm và quan hệ
NỘI_DUNG_KHÓA_TÌNH_CẢM

## Sức khỏe và nhịp sống
NỘI_DUNG_KHÓA_SỨC_KHỎE

## Vận năm 2026
NỘI_DUNG_KHÓA_VẬN_NĂM

## Cẩm nang hành động
- Hành động đầu tiên.
- Hành động thứ hai.
- Hành động thứ ba.
- Hành động thứ tư.
- Hành động thứ năm.`;

describe("free overview guest presentation", () => {
  it("projects the main guest preview sections and first action", () => {
    const teaser = buildFreeOverviewTeaser(fullReport);

    expect(FREE_OVERVIEW_TEASER_MAX_WORDS).toBe(500);
    expect(teaser).toContain("## Mỏ neo");
    expect(teaser).toContain("## Điểm đáng chú ý nhất");
    expect(teaser).toContain("## Khí chất và nội lực");
    expect(teaser).toContain("## Công việc và tài chính");
    expect(teaser).toContain("## Tình cảm và quan hệ");
    expect(teaser).toContain("## Vận năm");
    expect(teaser).toContain("## Một hành động nên làm ngay");
    expect(teaser).toContain("- Hành động đầu tiên.");
    expect(teaser).not.toContain("Hành động thứ hai");
    expect(countWords(teaser)).toBeLessThanOrEqual(FREE_OVERVIEW_TEASER_MAX_WORDS);
  });

  it("returns a bounded teaser when the markdown headings are malformed", () => {
    const malformed = Array.from({ length: 600 }, (_, index) => `từ-${index}`).join(" ");
    const teaser = buildFreeOverviewTeaser(malformed);

    expect(teaser).not.toBe("");
    expect(countWords(teaser)).toBe(FREE_OVERVIEW_TEASER_MAX_WORDS);
    expect(teaser).not.toContain("từ-599");
  });
});

describe("free overview guest teaser length", () => {
  it("uses most of the guest teaser budget when the overview has enough personal content", () => {
    const longReport = `## Mỏ neo
${repeatedWords("neo", 130)}

## Điểm đáng chú ý nhất
${repeatedWords("diem", 150)}

## Khí chất và nội lực
${repeatedWords("khi-chat", 120)}

## Công việc và tài chính
${repeatedWords("cong-viec", 110)}

## Tình cảm và quan hệ
${repeatedWords("tinh-cam", 90)}

## Vận năm 2026
${repeatedWords("van-nam", 80)}

## Cẩm nang hành động
- ${repeatedWords("hanh-dong", 60)}`;

    const teaser = buildFreeOverviewTeaser(longReport);

    expect(countWords(teaser)).toBeGreaterThanOrEqual(450);
    expect(countWords(teaser)).toBeLessThanOrEqual(FREE_OVERVIEW_TEASER_MAX_WORDS);
    expect(teaser).toContain("## Khí chất và nội lực");
    expect(teaser).toContain("## Công việc và tài chính");
    expect(teaser).not.toContain("van-nam-79");
  });
});
