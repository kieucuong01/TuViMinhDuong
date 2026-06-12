import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { seedArticles } from "@/lib/content";

const repoRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
const rawAmpersandPattern = /&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-fA-F]+;)/;

function readWebpSize(buffer: Buffer) {
  expect(buffer.toString("ascii", 0, 4)).toBe("RIFF");
  expect(buffer.toString("ascii", 8, 12)).toBe("WEBP");

  const chunkType = buffer.toString("ascii", 12, 16);
  if (chunkType === "VP8X") {
    return {
      width: 1 + buffer.readUIntLE(24, 3),
      height: 1 + buffer.readUIntLE(27, 3),
    };
  }

  if (chunkType === "VP8 ") {
    return {
      width: buffer.readUInt16LE(26) & 0x3fff,
      height: buffer.readUInt16LE(28) & 0x3fff,
    };
  }

  throw new Error(`Unsupported WebP chunk ${chunkType}`);
}

describe("article cover assets", () => {
  it("keeps local article cover images present, sized, and optimized", () => {
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
        expect(svg, `${coverImage} should not contain mojibake`).not.toMatch(/Ãƒ|Ã‚|Ã¡Â»|Ã„|Ã†|ï¿½|\?/);
      }

      if (coverImage.endsWith(".webp")) {
        const webp = readFileSync(assetPath);
        const size = readWebpSize(webp);
        expect(size.width, `${coverImage} should use social thumbnail width`).toBe(1200);
        expect(size.height, `${coverImage} should use article image height`).toBe(675);
        expect(webp.byteLength, `${coverImage} should stay lightweight`).toBeLessThan(260_000);
      }
    }
  });

  it("keeps the precise chart setup cover at social-preview dimensions", () => {
    const assetPath = path.join(repoRoot, "public", "articles", "lap-la-so-tu-vi-chuan.webp");
    const size = readWebpSize(readFileSync(assetPath));

    expect(size.width).toBe(1200);
    expect(size.height).toBe(675);
  });
});
