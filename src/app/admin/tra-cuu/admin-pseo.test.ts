import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("pSEO admin CMS", () => {
  it("provides list, filter, preview, edit and individual publish controls", () => {
    const source = readFileSync("src/app/admin/tra-cuu/page.tsx", "utf8");
    expect(source).toContain("listAdminPseoPages");
    expect(source).toContain("savePseoPageAction");
    expect(source).toContain("status");
    expect(source).toContain("Xem trang");
    expect(source).not.toContain("bulk");
  });

  it("links the pSEO CMS from the content tab", () => {
    const source = readFileSync("src/app/admin/page.tsx", "utf8");
    expect(source).toContain("/admin/tra-cuu");
    expect(source).toContain("Tra cứu pSEO");
    expect(source).toContain("CMS, SEO và pSEO");
  });
});
