import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const componentUrl = new URL("./knowledge-article-list.tsx", import.meta.url);
const routeUrl = new URL("../app/api/knowledge-articles/route.ts", import.meta.url);
const pageSource = readFileSync(fileURLToPath(new URL("../app/kien-thuc-tu-vi/page.tsx", import.meta.url)), "utf8");
const globalsCss = readFileSync(fileURLToPath(new URL("../app/globals.css", import.meta.url)), "utf8");

describe("knowledge article pagination", () => {
  it("renders a six-card desktop page with category-preserving pagination", () => {
    expect(existsSync(componentUrl)).toBe(true);
    if (!existsSync(componentUrl)) return;

    const componentSource = readFileSync(fileURLToPath(componentUrl), "utf8");
    expect(componentSource).toContain("knowledge-desktop-pagination");
    expect(componentSource).toContain("buildKnowledgePageHref");
    expect(componentSource).toContain("pageSize");
  });

  it("automatically appends mobile articles through the internal endpoint", () => {
    expect(existsSync(componentUrl)).toBe(true);
    expect(existsSync(routeUrl)).toBe(true);
    if (!existsSync(componentUrl) || !existsSync(routeUrl)) return;

    const componentSource = readFileSync(fileURLToPath(componentUrl), "utf8");
    const routeSource = readFileSync(fileURLToPath(routeUrl), "utf8");
    expect(componentSource).toContain("IntersectionObserver");
    expect(componentSource).toContain("/api/knowledge-articles");
    expect(componentSource).toContain("setArticles((current)");
    expect(routeSource).toContain("paginateArticles");
  });

  it("places the repaired CTA after the article list", () => {
    expect(pageSource).toContain("KnowledgeArticleList");
    expect(pageSource.indexOf("KnowledgeArticleList")).toBeLessThan(pageSource.indexOf("knowledge-cta-band"));
    expect(globalsCss).toMatch(/@media \(max-width: 767px\)[\s\S]*\.knowledge-cta-band\s*{[\s\S]*grid-template-columns:\s*minmax\(0, 1fr\)/);
    expect(globalsCss).toMatch(/\.knowledge-cta-actions \.btn\s*{[\s\S]*min-width:\s*0/);
  });
});
