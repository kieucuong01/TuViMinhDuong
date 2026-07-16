import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { AGE_TOOL_PAGES } from "@/lib/age-tools";

function source(path: string) {
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

const hubSource = source("src/app/xem-tuoi/page.tsx");
const leafSource = source("src/app/xem-tuoi/[tool]/page.tsx");
const componentSource = source("src/components/age-tool.tsx");
const sitemapSource = source("src/app/sitemap.ts");

describe("Xem Tuổi page cluster", () => {
  it("publishes six distinct canonical tool definitions", () => {
    expect(AGE_TOOL_PAGES).toHaveLength(6);
    expect(new Set(AGE_TOOL_PAGES.map((page) => page.slug)).size).toBe(6);
    expect(new Set(AGE_TOOL_PAGES.map((page) => page.title)).size).toBe(6);
    expect(new Set(AGE_TOOL_PAGES.map((page) => page.description)).size).toBe(6);
  });

  it("statically publishes the six canonical leaf pages", () => {
    expect(leafSource).toContain("generateStaticParams");
    expect(leafSource).toContain("dynamicParams = false");
    expect(leafSource).toContain("generateMetadata");
    expect(leafSource).toContain("notFound()");
    expect(leafSource).toContain("webApplicationJsonLd");
    expect(leafSource).toContain("faqJsonLd");
  });

  it("renders an indexable hub and sitemap entries from the shared registry", () => {
    expect(hubSource).toContain("itemListJsonLd");
    expect(hubSource).toContain("AGE_TOOL_PAGES.map");
    expect(sitemapSource).toContain("AGE_TOOL_PAGES");
    expect(sitemapSource).toContain("/xem-tuoi");
  });

  it("keeps private inputs out of URL and browser storage", () => {
    expect(componentSource).not.toContain("router.replace");
    expect(componentSource).not.toContain("URLSearchParams");
    expect(componentSource).not.toContain("localStorage");
    expect(componentSource).not.toContain("sessionStorage");
  });
});
