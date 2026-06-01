import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { seedArticles } from "@/lib/content";

const repoRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
const rawAmpersandPattern = /&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-fA-F]+;)/;

describe("article cover assets", () => {
  it("keeps local article cover images present and SVG-safe", () => {
    const localCovers = seedArticles
      .map((article) => article.coverImage)
      .filter((coverImage): coverImage is string => Boolean(coverImage?.startsWith("/")));

    expect(localCovers.length).toBeGreaterThan(0);

    for (const coverImage of localCovers) {
      const assetPath = path.join(repoRoot, "public", coverImage.replace(/^\/+/, ""));
      expect(existsSync(assetPath), `${coverImage} should exist under public/`).toBe(true);

      if (coverImage.endsWith(".svg")) {
        const svg = readFileSync(assetPath, "utf8");
        expect(svg, `${coverImage} should escape ampersands as &amp;`).not.toMatch(rawAmpersandPattern);
      }
    }
  });
});
