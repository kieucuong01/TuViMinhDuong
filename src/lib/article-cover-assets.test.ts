import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { seedArticles } from "@/lib/content";

const repoRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
const rawAmpersandPattern = /&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-fA-F]+;)/;

describe("article cover assets", () => {
  it("keeps local article cover images present, sized, and SVG-safe", () => {
    const localCovers = seedArticles.filter((article) => article.coverImage?.startsWith("/"));

    expect(localCovers.length).toBeGreaterThan(0);

    for (const article of localCovers) {
      const coverImage = article.coverImage || "";
      const assetPath = path.join(repoRoot, "public", coverImage.replace(/^\/+/, ""));
      expect(existsSync(assetPath), `${coverImage} should exist under public/`).toBe(true);

      if (coverImage.endsWith(".svg")) {
        const svg = readFileSync(assetPath, "utf8");
        expect(svg, `${coverImage} should escape ampersands as &amp;`).not.toMatch(rawAmpersandPattern);
        expect(svg, `${coverImage} should use social thumbnail width`).toContain('width="1200"');
        expect(svg, `${coverImage} should use article image height`).toContain('height="675"');
        expect(svg, `${coverImage} should expose the article alt text`).toContain(`aria-label="${article.coverAlt}"`);
        expect(svg, `${coverImage} should not contain mojibake`).not.toMatch(/Ã|Â|á»|Ä|Æ|�|\?/);
      }
    }
  });

  it("keeps the precise chart setup cover at social-preview dimensions", () => {
    const assetPath = path.join(repoRoot, "public", "articles", "lap-la-so-tu-vi-chuan.png");
    const png = readFileSync(assetPath);

    expect(png.toString("ascii", 1, 4)).toBe("PNG");
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);
  });
});
