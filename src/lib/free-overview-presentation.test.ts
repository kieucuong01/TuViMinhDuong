import { describe, expect, it } from "vitest";
import {
  FREE_OVERVIEW_GUEST_TEASER_MAX_CHARS,
  FREE_OVERVIEW_GUEST_TEASER_MIN_CHARS,
  buildFreeOverviewTeaser,
} from "@/lib/free-overview-presentation";

const guestTeaser = `Cung Mệnh cho thấy đây không phải kiểu lá số nên đi theo cảm hứng nhất thời. Bạn có năng lực nhìn ra vấn đề khá sớm, nhưng càng gặp chuyện lớn càng cần một cấu trúc rõ để không tự ôm hết áp lực. Điểm đáng chú ý là trục công việc và tài chính đang yêu cầu bạn chọn lọc cơ hội kỹ hơn: cơ hội có, nhưng chỉ tốt khi quyền hạn, dòng tiền và người chịu trách nhiệm được nói thẳng từ đầu.

Nếu đoạn này khiến bạn thấy “đúng quá”, phần hồ sơ chuyên sâu sẽ đi tiếp vào từng cung, đại vận và các mốc cần chú ý để biến cảm giác đó thành kế hoạch hành động cụ thể hơn.`;
const guestTeaserClosing =
  " Khi mở hồ sơ đầy đủ, người đọc sẽ thấy rõ vì sao cùng một cơ hội có lúc nên tiến nhanh, có lúc nên giữ nhịp chậm để tránh mất sức và mất tiền.";

const fullReport = `## Tín hiệu nổi bật của lá số
${guestTeaser}${guestTeaserClosing}

## Mỏ neo
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
  it("uses the dedicated LLM guest teaser instead of mechanically cutting the report", () => {
    const teaser = buildFreeOverviewTeaser(fullReport);

    expect(FREE_OVERVIEW_GUEST_TEASER_MIN_CHARS).toBe(650);
    expect(FREE_OVERVIEW_GUEST_TEASER_MAX_CHARS).toBe(900);
    expect(teaser).toContain("Cung Mệnh cho thấy");
    expect(teaser).toContain("đúng quá");
    expect(teaser).not.toContain("## Tín hiệu nổi bật");
    expect(teaser).not.toContain("## Mỏ neo");
    expect(teaser.length).toBeGreaterThanOrEqual(FREE_OVERVIEW_GUEST_TEASER_MIN_CHARS);
    expect(teaser.length).toBeLessThanOrEqual(FREE_OVERVIEW_GUEST_TEASER_MAX_CHARS);
  });

  it("falls back to a natural 800-character opening when old reports lack the guest teaser", () => {
    const malformed = Array.from({ length: 130 }, (_, index) => `đoạn-cũ-${index}`).join(" ");
    const teaser = buildFreeOverviewTeaser(malformed);

    expect(teaser).not.toBe("");
    expect(teaser.length).toBeLessThanOrEqual(800);
    expect(teaser).not.toContain("đoạn-cũ-129");
    expect(teaser).not.toContain("…");
  });
});

describe("free overview guest teaser length", () => {
  it("bounds an overlong LLM teaser without adding ellipses", () => {
    const longTeaser = Array.from({ length: 180 }, (_, index) => `tín-hiệu-${index}`).join(" ");
    const longReport = `## Tín hiệu nổi bật của lá số\n${longTeaser}\n\n## Mỏ neo\nPhần còn lại.`;

    const teaser = buildFreeOverviewTeaser(longReport);

    expect(teaser.length).toBeGreaterThanOrEqual(FREE_OVERVIEW_GUEST_TEASER_MIN_CHARS);
    expect(teaser.length).toBeLessThanOrEqual(FREE_OVERVIEW_GUEST_TEASER_MAX_CHARS);
    expect(teaser).toContain("tín-hiệu-0");
    expect(teaser).not.toContain("## Mỏ neo");
    expect(teaser).not.toContain("…");
  });
});
