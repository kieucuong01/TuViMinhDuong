import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";

describe("production content security policy", () => {
  it("omits unsafe-eval outside development while keeping required Google origins", async () => {
    const rules = await nextConfig.headers?.();
    const globalRule = rules?.find((rule) => rule.source === "/:path*");
    const csp = globalRule?.headers.find((header) => header.key === "Content-Security-Policy")?.value || "";

    expect(process.env.NODE_ENV).not.toBe("development");
    expect(csp).not.toContain("'unsafe-eval'");
    expect(csp).toContain("https://www.googletagmanager.com");
    expect(csp).toContain("https://www.google-analytics.com");
  });
});
