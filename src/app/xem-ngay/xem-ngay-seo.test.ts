import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const pageSource = readFileSync("src/app/xem-ngay/page.tsx", "utf8");
const dateViewSource = readFileSync("src/components/date-view.tsx", "utf8");

describe("/xem-ngay evidence-led SEO", () => {
  it("targets the observed choose-a-date-by-age intent while preserving the canonical", () => {
    expect(pageSource).toContain('title: "Xem ngày tốt theo tuổi: Lọc ngày đẹp cho từng việc"');
    expect(pageSource).toContain("lọc ngày phù hợp cho cưới hỏi, khai trương, động thổ");
    expect(pageSource).toContain('path: "/xem-ngay"');
    expect(pageSource).toContain('url: "/xem-ngay"');
  });

  it("opens with a direct useful answer instead of keyword-only copy", () => {
    expect(dateViewSource).toContain("Muốn chọn ngày tốt theo tuổi, hãy chọn việc cần làm trước");
    expect(dateViewSource).toContain("12 trực, giờ hoàng đạo và các sao tốt xấu");
    expect(dateViewSource).toContain("Xem ngày tốt theo tuổi cho từng việc");
  });

  it("offers contextual paths to purpose tools and the explanatory article", () => {
    expect(dateViewSource).toContain('href="/xem-ngay/cuoi-hoi"');
    expect(dateViewSource).toContain('href="/xem-ngay/khai-truong"');
    expect(dateViewSource).toContain('href="/xem-ngay/dong-tho"');
    expect(dateViewSource).toContain('href="/kien-thuc-tu-vi/xem-ngay-tot-xau-theo-tuoi"');
    expect(dateViewSource).toContain('aria-label="Lối tắt xem ngày theo nhu cầu"');
  });
});
