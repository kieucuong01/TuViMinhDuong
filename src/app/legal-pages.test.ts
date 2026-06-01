import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const appRoot = fileURLToPath(new URL("./", import.meta.url));
const footerSource = readFileSync(fileURLToPath(new URL("../components/site-footer.tsx", import.meta.url)), "utf8");
const sitemapSource = readFileSync(fileURLToPath(new URL("./sitemap.ts", import.meta.url)), "utf8");

function pageSource(path: string) {
  const filePath = `${appRoot}${path}/page.tsx`;
  expect(existsSync(filePath)).toBe(true);
  return readFileSync(filePath, "utf8");
}

describe("legal and trust pages for ads readiness", () => {
  it("publishes privacy, terms, payment refund, and contact pages", () => {
    expect(pageSource("chinh-sach-bao-mat")).toContain('path: "/chinh-sach-bao-mat"');
    expect(pageSource("dieu-khoan-su-dung")).toContain('path: "/dieu-khoan-su-dung"');
    expect(pageSource("chinh-sach-thanh-toan-hoan-xu")).toContain('path: "/chinh-sach-thanh-toan-hoan-xu"');
    expect(pageSource("lien-he")).toContain('path: "/lien-he"');
  });

  it("links trust pages from the global footer", () => {
    for (const href of ["/chinh-sach-bao-mat", "/dieu-khoan-su-dung", "/lien-he"]) {
      expect(footerSource).toContain(href);
    }
    expect(footerSource).not.toContain("/chinh-sach-thanh-toan-hoan-xu");
    expect(footerSource).not.toContain("/nap-xu");
  });

  it("includes public trust pages in the sitemap", () => {
    for (const path of ["/chinh-sach-bao-mat", "/dieu-khoan-su-dung", "/lien-he"]) {
      expect(sitemapSource).toContain(path);
    }
    expect(sitemapSource).not.toContain("/chinh-sach-thanh-toan-hoan-xu");
  });

  it("keeps money-related policy surfaces behind an authenticated account context", () => {
    expect(pageSource("chinh-sach-thanh-toan-hoan-xu")).toContain("getCurrentUser");
    expect(pageSource("chinh-sach-thanh-toan-hoan-xu")).toContain('redirect("/dang-nhap?next=/chinh-sach-thanh-toan-hoan-xu")');
    expect(pageSource("lien-he")).toContain("authOnly");
    expect(pageSource("lien-he")).toContain("visibleSupportItems");
  });
});
