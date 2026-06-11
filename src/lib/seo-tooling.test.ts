import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const packageJson = JSON.parse(readFileSync(`${repoRoot}/package.json`, "utf8")) as {
  scripts: Record<string, string>;
};
const lighthouseConfig = readFileSync(`${repoRoot}/lighthouserc.cjs`, "utf8");
const workflow = readFileSync(`${repoRoot}/.github/workflows/seo-quality.yml`, "utf8");

describe("trusted SEO tooling integration", () => {
  it("uses Lighthouse CI as the external SEO regression tool", () => {
    expect(packageJson.scripts["seo:lighthouse"]).toContain("@lhci/cli@0.15.x");
    expect(lighthouseConfig).toContain("https://lasotinhhoa.vn/");
    expect(lighthouseConfig).toContain("categories:seo");
    expect(lighthouseConfig).toContain("minScore: 0.9");
  });

  it("keeps the GitHub workflow manual or weekly instead of every push", () => {
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).toContain("schedule:");
    expect(workflow).toContain("npx @lhci/cli@0.15.x autorun");
    expect(workflow).not.toContain("push:");
  });
});
