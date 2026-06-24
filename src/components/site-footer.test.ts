import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const layoutSource = readFileSync(fileURLToPath(new URL("../app/layout.tsx", import.meta.url)), "utf8");
const footerPath = fileURLToPath(new URL("./site-footer.tsx", import.meta.url));
const footerSource = existsSync(footerPath) ? readFileSync(footerPath, "utf8") : "";

describe("site footer SEO surface", () => {
  it("mounts a semantic global footer from the root layout", () => {
    expect(layoutSource).toContain("SiteFooter");
    expect(footerSource).toContain("<footer");
    expect(footerSource).toContain('aria-label="Chân trang Lá số tinh hoa"');
  });

  it("keeps the primary indexable and conversion links available from every page", () => {
    for (const href of ["/#lap-la-so", "/xem-ngay", "/kien-thuc-tu-vi", "/dang-nhap"]) {
      expect(footerSource).toContain(href);
    }
  });

  it("does not expose authenticated routes as public crawl links", () => {
    expect(footerSource).not.toContain('{ href: "/la-so"');
    expect(footerSource).toContain("/dang-nhap?next=/la-so");
  });

  it("links to the core knowledge cluster with descriptive Vietnamese anchor text", () => {
    const clusterLinks = [
      "Lá số tử vi là gì?",
      "Cách đọc lá số tử vi",
      "12 cung trong lá số tử vi",
      "Đại vận là gì?",
    ];

    for (const label of clusterLinks) {
      expect(footerSource).toContain(label);
    }
  });
});
