import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

const ci = source(".github/workflows/ci.yml");
const e2e = source(".github/workflows/e2e-safe.yml");
const safeSpec = source("tests/e2e/ci-safe.spec.ts");

describe("GitHub Actions guardrails", () => {
  it("runs the full deterministic quality gate on pull requests and master pushes", () => {
    expect(ci).toContain("pull_request:");
    expect(ci).toContain("push:");
    expect(ci).toContain("- master");
    expect(ci).toContain("contents: read");
    expect(ci).toContain("node-version: 24");
    expect(ci).toContain("cache: npm");
    expect(ci).toContain("npm ci");
    expect(ci).toContain("npm audit --audit-level=high");
    expect(ci).toContain("npm run lint");
    expect(ci).toContain("npm test");
    expect(ci).toContain("npm run build");
    expect(ci).toContain("cancel-in-progress: true");
    expect(ci).toContain("timeout-minutes:");
  });

  it("keeps scheduled browser checks local, read-only, and payment-safe", () => {
    expect(e2e).toContain("workflow_dispatch:");
    expect(e2e).toContain("schedule:");
    expect(e2e).toContain("PLAYWRIGHT_DISABLE_LLM: \"1\"");
    expect(e2e).toContain("PAYOS_CLIENT_ID: \"\"");
    expect(e2e).toContain("PAYOS_API_KEY: \"\"");
    expect(e2e).toContain("PAYOS_CHECKSUM_KEY: \"\"");
    expect(e2e).toContain("npx playwright install --with-deps chromium");
    expect(e2e).toContain("playwright test tests/e2e/ci-safe.spec.ts");
    expect(e2e).not.toContain("PLAYWRIGHT_BASE_URL");
    expect(e2e).not.toContain("secrets.");
  });

  it("uses a dedicated smoke spec with no state-changing product action", () => {
    expect(safeSpec).toContain('page.goto("/")');
    expect(safeSpec).toContain('page.goto("/xem-ngay")');
    expect(safeSpec).toContain('page.goto("/kien-thuc-tu-vi")');
    expect(safeSpec).not.toMatch(/createSmokeChart|checkout|payment|admin|\.fill\(|\.submit\(|button\[type=submit\]/i);
  });
});
