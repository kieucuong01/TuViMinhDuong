import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

const registrySource = source("src/lib/date-purpose-pages.ts");
const landingSource = source("src/app/xem-ngay/[purpose]/page.tsx");
const sitemapSource = source("src/app/sitemap.ts");
const lookupComponentSource = source("src/components/pseo-lookup-hub.tsx");
const lookupRootSource = source("src/app/tra-cuu/page.tsx");

describe("bounded date-purpose SEO pages", () => {
  it("publishes exactly three distinct purpose pages", () => {
    expect(registrySource).toContain('slug: "khai-truong"');
    expect(registrySource).toContain('slug: "cuoi-hoi"');
    expect(registrySource).toContain('slug: "dong-tho"');
    expect(registrySource.match(/slug: "/g)).toHaveLength(3);
    expect(registrySource).toContain('task: "opening"');
    expect(registrySource).toContain('task: "wedding"');
    expect(registrySource).toContain('task: "groundbreaking"');
  });

  it("renders visible guidance and matching structured data", () => {
    expect(landingSource).toContain("generateStaticParams");
    expect(landingSource).toContain("generateMetadata");
    expect(landingSource).toContain("notFound()");
    expect(landingSource).toContain('initialMode="finder"');
    expect(landingSource).toContain("webApplicationJsonLd");
    expect(landingSource).toContain("faqJsonLd(page.faqs)");
    expect(landingSource).toContain("page.criteria.map");
    expect(landingSource).toContain("page.faqs.map");
  });

  it("adds only the three approved purpose pages to the main sitemap", () => {
    expect(sitemapSource).toContain("DATE_PURPOSE_PAGES");
    expect(sitemapSource).toContain("/xem-ngay/${page.slug}");
  });
});

describe("lookup hub structured data", () => {
  it("adds WebPage, ItemList and FAQ JSON-LD to the three entity hubs", () => {
    expect(lookupComponentSource).toContain("webPageJsonLd");
    expect(lookupComponentSource).toContain("itemListJsonLd");
    expect(lookupComponentSource).toContain("faqJsonLd");
    expect(lookupComponentSource).toContain('id="pseo-hub-page-jsonld"');
    expect(lookupComponentSource).toContain('id="pseo-hub-list-jsonld"');
    expect(lookupComponentSource).toContain('id="pseo-hub-faq-jsonld"');
  });

  it("adds WebPage and ItemList JSON-LD to the lookup root", () => {
    expect(lookupRootSource).toContain("webPageJsonLd");
    expect(lookupRootSource).toContain("itemListJsonLd");
    expect(lookupRootSource).toContain('id="lookup-root-page-jsonld"');
    expect(lookupRootSource).toContain('id="lookup-root-list-jsonld"');
  });
});
