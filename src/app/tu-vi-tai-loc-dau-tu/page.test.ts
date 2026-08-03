import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const pagePath = fileURLToPath(new URL("./page.tsx", import.meta.url));
const source = existsSync(pagePath) ? readFileSync(pagePath, "utf8") : "";
const actionsSource = readFileSync(fileURLToPath(new URL("../actions.ts", import.meta.url)), "utf8");
const styles = readFileSync(fileURLToPath(new URL("../globals.css", import.meta.url)), "utf8");

function answerWordCount() {
  const answer = source.match(/data-answer-block="true"[^>]*>([\s\S]*?)<\/p>/)?.[1] ?? "";
  return answer.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length;
}

describe("wealth fortune landing page", () => {
  it("keeps its canonical metadata and answer-first SEO contract", () => {
    expect(source).toContain('path: "/tu-vi-tai-loc-dau-tu"');
    expect(source).toContain('data-answer-block="true"');
    expect(answerWordCount()).toBeGreaterThanOrEqual(40);
    expect(answerWordCount()).toBeLessThanOrEqual(60);
    expect(source).toContain("faqJsonLd");
    expect(source).toContain("webApplicationJsonLd");
  });

  it("uses the safe wealth chart route and only exposes a vetted form error", () => {
    expect(source).toContain('experience="wealth"');
    expect(source).toContain('submitLabel="Xem bản đồ tài lộc 5 năm"');
    expect(source).toContain('defaultViewYear={2026}');
    expect(source).toContain('role="alert"');
    expect(source).toContain("chartFormErrorMessage");
  });

  it("matches the wealth chart error redirect anchor", () => {
    expect(actionsSource).toContain('error: "/tu-vi-tai-loc-dau-tu#lap-la-so-tai-loc"');
    expect(source).toContain('id="lap-la-so-tai-loc"');
    expect(source).toContain('href="#lap-la-so-tai-loc"');
  });

  it("keeps advisory copy, visible matching FAQs, and a useful internal-link cluster", () => {
    expect(source).toContain("không thay thế tư vấn tài chính");
    expect(source).not.toMatch(/cam kết lợi nhuận|chắc chắn giàu|nên mua|nên bán/i);
    expect(source).toContain("<details");
    expect((source.match(/href="\//g) ?? []).length).toBeGreaterThanOrEqual(6);
    expect(source).toContain("Tài–Quan–Di đọc gì?");
    expect(source).toContain("Cách dùng biểu đồ");
  });

  it("stacks the four birth-date controls into two columns on narrow wealth landing viewports", () => {
    expect(styles).toMatch(/@media \(max-width: 520px\) \{[\s\S]*?\.wealth-landing-form \.chart-birth-field \.birth-date-grid \{[^}]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/);
  });

  it("keeps the wealth form helper readable without changing shared chart forms", () => {
    expect(styles).toMatch(/\.wealth-landing-form \.chart-form > p\.text-sm \{[^}]*font-size: 1rem;/);
  });

  it("describes the implemented yearly signal layer without claiming broad fortune-cycle scoring", () => {
    expect(source).toContain("lưu tinh theo năm tại Tài–Quan–Di");
    expect(source).not.toContain("vận hạn");
  });

  it("shows the update date, author, and editorial policy required by the content contract", () => {
    expect(source).toContain('<time dateTime="2026-08-03">');
    expect(source).toContain('href="/tac-gia"');
    expect(source).toContain('href="/chinh-sach-bien-tap"');
  });
});
