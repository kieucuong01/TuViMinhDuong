import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const nextConfigSource = readFileSync(fileURLToPath(new URL("../../next.config.ts", import.meta.url)), "utf8");

describe("public SEO cache headers", () => {
  it("sets CDN-friendly cache headers for public discovery pages", () => {
    for (const route of ["/", "/kien-thuc-tu-vi", "/xem-ngay", "/pricing", "/lien-he"]) {
      expect(nextConfigSource).toContain(`source: "${route}"`);
    }

    expect(nextConfigSource).toContain("public, s-maxage=300, stale-while-revalidate=31536000");
  });

  it("keeps the global stylesheet external instead of duplicating it in HTML and RSC payloads", () => {
    expect(nextConfigSource).not.toContain("inlineCss: true");
  });
});
