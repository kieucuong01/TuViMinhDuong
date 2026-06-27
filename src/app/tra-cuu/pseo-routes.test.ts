import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("pSEO route structure", () => {
  it("keeps the leaf route static-capable and excludes unpublished pages", () => {
    const source = readFileSync("src/app/tra-cuu/[slug]/page.tsx", "utf8");
    expect(source).toContain("generateStaticParams");
    expect(source).toContain("generateMetadata");
    expect(source).toContain("getPublishedPseoPage");
    expect(source).toContain("dynamicParams = true");
  });

  it("renders the conversion funnel and both related-link directions", () => {
    const source = readFileSync("src/app/tra-cuu/[slug]/page.tsx", "utf8");
    expect(source).toContain("PseoArticleFunnel");
    const funnel = readFileSync("src/components/pseo-article-funnel.tsx", "utf8");
    expect(funnel).toContain("ChartForm");
    expect(funnel).toContain("sameStar");
    expect(funnel).toContain("samePalace");
    expect(funnel).toContain('adSource="pseo_inline"');
  });

  it("turns all three entity hubs into server-rendered lookup forms with distinct guidance", () => {
    const routes = [
      {
        path: "src/app/tra-cuu/y-nghia-12-cung/page.tsx",
        markers: ["PseoLookupHub", "searchParams: Promise", "muc", "Cách chọn cung theo câu hỏi thật"],
      },
      {
        path: "src/app/tra-cuu/y-nghia-14-chinh-tinh/page.tsx",
        markers: ["PseoLookupHub", "searchParams: Promise", "muc", "Cách đọc chính tinh đúng bối cảnh"],
      },
      {
        path: "src/app/tra-cuu/phu-tinh/page.tsx",
        markers: ["PseoLookupHub", "searchParams: Promise", "muc", "Cách đọc phụ tinh mà không kết luận vội"],
      },
    ];

    for (const route of routes) {
      const source = readFileSync(route.path, "utf8");
      for (const marker of route.markers) expect(source).toContain(marker);
      expect(source).toContain("routeMetadata");
    }
  });
});
