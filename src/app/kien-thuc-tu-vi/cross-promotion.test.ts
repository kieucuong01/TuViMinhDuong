import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("src/app/kien-thuc-tu-vi/page.tsx", "utf8");

describe("Bản Đồ Thần Số contextual cross-promotion", () => {
  it("uses one privacy-safe attributed link from the knowledge hub", () => {
    const link = "https://bandothanso.vn/cong-cu/tinh-than-so-hoc?utm_source=lasotinhhoa&utm_medium=referral&utm_campaign=cross_promo&utm_content=knowledge_hub";
    expect(source).toContain(link);
    expect(source).toContain("Một góc nhìn khác từ tên và ngày sinh");
    expect(source.match(/https:\/\/bandothanso\.vn/g)).toHaveLength(1);
    expect(source).toContain('target="_blank"');
    expect(source).toContain('rel="noopener noreferrer"');
  });
});
