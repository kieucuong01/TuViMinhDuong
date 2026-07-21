import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const appRoot = fileURLToPath(new URL("./", import.meta.url));
const sitemapSource = readFileSync(fileURLToPath(new URL("./sitemap.ts", import.meta.url)), "utf8");

function pageSource(path: string) {
  const filePath = `${appRoot}${path}/page.tsx`;
  expect(existsSync(filePath)).toBe(true);
  return readFileSync(filePath, "utf8");
}

function words(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

describe("AI discovery", () => {
  it("publishes a concise llms.txt with the core public tools", () => {
    expect(existsSync("public/llms.txt")).toBe(true);
    const source = readFileSync("public/llms.txt", "utf8");

    for (const route of ["/", "/xem-ngay", "/xem-tuoi", "/tra-cuu", "/kien-thuc-tu-vi"]) {
      expect(source).toContain(`https://lasotinhhoa.vn${route}`);
    }
  });

  it("publishes lightweight AI visibility pages with extractable answers", () => {
    for (const path of ["gioi-thieu", "phuong-phap-luan", "tac-gia"]) {
      const source = pageSource(path);
      const answer = source.match(/data-answer-block="true">([^<]+)</)?.[1] || "";

      expect(source).toContain("<h1");
      expect(words(answer)).toBeGreaterThanOrEqual(40);
      expect(words(answer)).toBeLessThanOrEqual(60);
      expect(source).toContain("Nội dung chỉ mang tính tham khảo");
      expect(source).toContain("không cam kết vận mệnh, sức khỏe, tài chính hoặc hôn nhân");
      expect(source).toContain("Cập nhật lần cuối");
      expect(source).toContain('type="application/ld+json"');

      for (const href of ['href="/"', 'href="/kien-thuc-tu-vi"', 'href="/tra-cuu"', 'href="/xem-ngay"', 'href="/xem-tuoi"']) {
        expect(source).toContain(href);
      }
    }
  });

  it("includes AI visibility pages in the sitemap source", () => {
    for (const path of ["/gioi-thieu", "/phuong-phap-luan", "/tac-gia"]) {
      expect(sitemapSource).toContain(path);
    }
  });
});
