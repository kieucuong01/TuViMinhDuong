import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const adminPageSource = readFileSync(fileURLToPath(new URL("./page.tsx", import.meta.url)), "utf8");
const globalsCss = readFileSync(fileURLToPath(new URL("../globals.css", import.meta.url)), "utf8");

describe("admin article content layout", () => {
  it("renders current articles as the first full-width CMS surface with pagination", () => {
    expect(adminPageSource).toContain("ARTICLES_PER_ADMIN_PAGE");
    expect(adminPageSource).toContain("paginatedArticles");
    expect(adminPageSource).toContain("admin-article-board");
    expect(adminPageSource.indexOf("admin-article-board")).toBeLessThan(adminPageSource.indexOf("admin-article-modal"));
    expect(adminPageSource).toContain("admin-article-pagination");
    expect(adminPageSource).toContain("articlePage");
  });

  it("opens the article editor through a modal query instead of the default CMS surface", () => {
    expect(adminPageSource).toContain("articleModal");
    expect(adminPageSource).toContain("/admin?tab=content&articleModal=new");
    expect(adminPageSource).toContain("className=\"admin-article-modal\"");
  });

  it("keeps the CMS layout single-column so the article board can use the full screen width", () => {
    expect(globalsCss).toMatch(/\.admin-cms-grid\s*{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/);
    expect(globalsCss).toMatch(/\.admin-article-board\s*{[\s\S]*grid-column:\s*1 \/ -1/);
    expect(globalsCss).toMatch(/\.admin-article-modal\s*{[\s\S]*position:\s*fixed/);
  });
});
