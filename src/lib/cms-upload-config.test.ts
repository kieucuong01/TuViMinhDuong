import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const nextConfig = readFileSync(fileURLToPath(new URL("../../next.config.ts", import.meta.url)), "utf8");
const gitignore = readFileSync(fileURLToPath(new URL("../../.gitignore", import.meta.url)), "utf8");
const uploadStorage = readFileSync(fileURLToPath(new URL("./article-upload-storage.ts", import.meta.url)), "utf8");

describe("CMS upload configuration", () => {
  it("allows CMS image uploads larger than the Server Action default body limit", () => {
    expect(nextConfig).toContain("serverActions");
    expect(nextConfig).toContain('bodySizeLimit: "8mb"');
  });

  it("keeps runtime CMS uploads out of git", () => {
    expect(gitignore).toContain("/public/uploads/");
  });

  it("stores production uploads outside immutable release directories", () => {
    expect(uploadStorage).toContain("CMS_ARTICLE_UPLOAD_DIR");
    expect(uploadStorage).toContain("/uploads/articles");
    expect(uploadStorage).toContain("productionRelease");
  });
});
