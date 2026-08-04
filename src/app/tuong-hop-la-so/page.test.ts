import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const pageSource = readFileSync(fileURLToPath(new URL("./page.tsx", import.meta.url)), "utf8");

describe("two-chart compatibility landing page", () => {
  it("publishes indexable metadata and structured data that match visible content", () => {
    expect(pageSource).toContain("routeMetadata");
    expect(pageSource).toContain('path: "/tuong-hop-la-so"');
    expect(pageSource).toContain("webPageJsonLd");
    expect(pageSource).toContain("webApplicationJsonLd");
    expect(pageSource).toContain("faqJsonLd");
    expect(pageSource).toContain('type="application/ld+json"');
    expect(pageSource).toContain('.replace(/</g, "\\\\u003c")');
    expect(pageSource).toContain("faqs.map");
  });

  it("answers the primary intent before presenting the interactive tool", () => {
    expect(pageSource).toContain("Tương hợp 2 lá số: đối chiếu tình cảm, giao tiếp và đời sống chung");
    expect(pageSource).toContain('data-answer-block="true"');
    expect(pageSource.indexOf("data-answer-block")).toBeLessThan(pageSource.indexOf("<ChartCompatibilityTool"));
    expect(pageSource).toContain("<ChartCompatibilityTool");
  });

  it("explains method, limits and the difference from age compatibility", () => {
    expect(pageSource).toContain("Xem tuổi và tương hợp hai lá số khác nhau thế nào?");
    expect(pageSource).toContain("Can–Chi, ngũ hành năm sinh");
    expect(pageSource).toContain("Mệnh–Thân, Phu Thê, Phúc Đức");
    expect(pageSource).toContain("không dùng để quyết định thay hai người");
    expect(pageSource).toContain("Sáu lớp luận giải trong báo cáo");
  });

  it("builds an internal-link path for readers and AI crawlers", () => {
    expect(pageSource).toContain('href="/xem-tuoi/vo-chong"');
    expect(pageSource).toContain('href="/kien-thuc-tu-vi/cung-phu-the-trong-tu-vi"');
    expect(pageSource).toContain('href="/kien-thuc-tu-vi/cung-menh-cung-than"');
    expect(pageSource).toContain('href="/phuong-phap-luan"');
    expect(pageSource).toContain('href="/#lap-la-so"');
  });
});
