import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

import {
  buildSnapshot,
  fetchText,
  mapWithConcurrency,
} from "../../scripts/seo/seo-autopilot-snapshot-runner.mjs";

describe("SEO snapshot networking", () => {
  it("keeps the public snapshot wrapper importable by planner and executor", () => {
    const exportedType = execFileSync(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        "import('./scripts/seo/seo-autopilot-snapshot.mjs').then((module) => console.log(typeof module.buildSnapshot))",
      ],
      { cwd: process.cwd(), encoding: "utf8" },
    ).trim();

    expect(exportedType).toBe("function");
  });

  it("never exceeds the configured page concurrency", async () => {
    let active = 0;
    let peak = 0;

    const values = await mapWithConcurrency([1, 2, 3, 4, 5], 2, async (value) => {
      active += 1;
      peak = Math.max(peak, active);
      await Promise.resolve();
      active -= 1;
      return value * 2;
    });

    expect(values).toEqual([2, 4, 6, 8, 10]);
    expect(peak).toBeLessThanOrEqual(2);
  });

  it("retries one transient fetch failure", async () => {
    let attempts = 0;
    const fetchImpl = async () => {
      attempts += 1;
      if (attempts === 1) throw new TypeError("temporary network error");
      return new Response("ok", { status: 200 });
    };

    await expect(
      fetchText("https://example.com", {
        fetchImpl,
        maxAttempts: 2,
        timeoutMs: 100,
      }),
    ).resolves.toBe("ok");
    expect(attempts).toBe(2);
  });

  it("reports fetch failures separately from missing SEO fields", async () => {
    const baseUrl = "https://example.com";
    const fetchImpl = async (input: string | URL | Request) => {
      const url = String(input);
      if (url.endsWith("/robots.txt")) {
        return new Response("User-agent: *\nAllow: /", { status: 200 });
      }
      if (url.endsWith("/sitemap.xml")) {
        return new Response(
          "<urlset><url><loc>https://example.com/broken</loc></url></urlset>",
          { status: 200 },
        );
      }
      throw new TypeError("socket closed");
    };

    const snapshot = await buildSnapshot({
      baseUrl,
      sampleSize: 2,
      fetchImpl,
      concurrency: 1,
      maxAttempts: 1,
      timeoutMs: 100,
    });

    expect(snapshot.fetchErrors).toHaveLength(2);
    expect(snapshot.warnings.join("\n")).toContain("fetch");
    expect(snapshot.warnings.join("\n")).not.toContain("missing title");
  });
});
