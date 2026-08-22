import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const appRoot = fileURLToPath(new URL("./", import.meta.url));
const route = "huong-dan-chon-web-lap-la-so-tu-vi";
const sourcePath = `${appRoot}${route}/page.tsx`;
const sitemap = readFileSync(fileURLToPath(new URL("./sitemap.ts", import.meta.url)), "utf8");
const llms = readFileSync("public/llms.txt", "utf8");

function words(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

describe("P1 evaluation hub", () => {
  it("publishes a neutral, extractable guide for choosing a chart website", () => {
    expect(existsSync(sourcePath)).toBe(true);
    const source = readFileSync(sourcePath, "utf8");
    const answer = source.match(/data-answer-block="true">([^<]+)</)?.[1] || "";

    expect(words(answer)).toBeGreaterThanOrEqual(40);
    expect(words(answer)).toBeLessThanOrEqual(60);
    expect(source).toContain('"@type": "FAQPage"');
    expect(source).toContain("không tự xếp hạng");
    for (const href of ["/lap-la-so", "/pricing", "/phuong-phap-luan", "/chinh-sach-bien-tap", "/chinh-sach-bao-mat"]) {
      expect(source).toContain(`href="${href}"`);
    }
  });

  it("makes the comparison-intent hub discoverable without replacing the tool URL", () => {
    expect(sitemap).toContain(`/${route}`);
    expect(llms).toContain(`https://lasotinhhoa.vn/${route}`);
    expect(llms).toContain("nên chọn website lập lá số");
  });
});
