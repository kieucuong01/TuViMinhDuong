import { describe, expect, it } from "vitest";

import nextConfig from "../../next.config";
import { LEGACY_ARTICLE_REDIRECTS } from "@/lib/legacy-article-redirects";

const expectedRedirects = [
  {
    source: "/kien-thuc-tu-vi/cach-luan-giai-la-so-tu-vi",
    destination: "/kien-thuc-tu-vi/luan-giai-la-so-tu-vi",
    permanent: true,
  },
  {
    source: "/kien-thuc-tu-vi/phan-tich-la-so-tu-vi",
    destination: "/kien-thuc-tu-vi/binh-giai-la-so-tu-vi",
    permanent: true,
  },
  {
    source: "/kien-thuc-tu-vi/sao-liem-trinh",
    destination: "/kien-thuc-tu-vi/sao-liem-trinh-trong-tu-vi",
    permanent: true,
  },
  {
    source: "/kien-thuc-tu-vi/sao-thai-am",
    destination: "/kien-thuc-tu-vi/sao-thai-am-trong-tu-vi",
    permanent: true,
  },
  {
    source: "/kien-thuc-tu-vi/sao-thien-co",
    destination: "/kien-thuc-tu-vi/sao-thien-co-trong-tu-vi",
    permanent: true,
  },
  {
    source: "/kien-thuc-tu-vi/sao-thien-phu",
    destination: "/kien-thuc-tu-vi/sao-thien-phu-trong-tu-vi",
    permanent: true,
  },
  {
    source: "/kien-thuc-tu-vi/sao-tu-vi",
    destination: "/kien-thuc-tu-vi/sao-tu-vi-trong-tu-vi",
    permanent: true,
  },
  {
    source: "/kien-thuc-tu-vi/sao-vu-khuc",
    destination: "/kien-thuc-tu-vi/sao-vu-khuc-trong-tu-vi",
    permanent: true,
  },
] as const;

describe("legacy article redirects", () => {
  it("contains the eight reviewed permanent mappings", () => {
    expect(LEGACY_ARTICLE_REDIRECTS).toEqual(expectedRedirects);
    expect(new Set(LEGACY_ARTICLE_REDIRECTS.map((item) => item.source)).size).toBe(8);
    expect(
      LEGACY_ARTICLE_REDIRECTS.every((item) => item.source !== item.destination),
    ).toBe(true);
  });

  it("publishes every reviewed mapping through Next config", async () => {
    await expect(nextConfig.redirects?.()).resolves.toEqual(expectedRedirects);
  });
});
