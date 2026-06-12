import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const loaderSource = readFileSync(fileURLToPath(new URL("./free-overview-loader.tsx", import.meta.url)), "utf8");
const globalsCss = readFileSync(fileURLToPath(new URL("../app/globals.css", import.meta.url)), "utf8");
const chartPageSource = readFileSync(fileURLToPath(new URL("../app/la-so/[id]/page.tsx", import.meta.url)), "utf8");

describe("FreeOverviewLoader fast-first flow", () => {
  it("renders fallback content while starting the background overview process", () => {
    expect(loaderSource).toContain('status: "fallback"');
    expect(loaderSource).toContain("/free-overview/process");
    expect(loaderSource).toContain("schedulePoll()");
    expect(loaderSource).toContain("free-overview-inline-status");
  });

  it("renders server-provided instant overview content before client polling finishes", () => {
    expect(loaderSource).toContain("initialOverview");
    expect(loaderSource).toContain("useState<FreeOverviewState>(() =>");
    expect(chartPageSource).toContain("getFreeOverviewStatus(record.chart)");
    expect(chartPageSource).toContain("initialOverview={freeOverviewStatus}");
    expect(chartPageSource).not.toContain("deferUntilVisible");
  });

  it("polls with no-store and refreshes the route when the full overview is ready", () => {
    expect(loaderSource).toContain('import { useRouter } from "next/navigation"');
    expect(loaderSource).toContain("router.refresh()");
    expect(loaderSource).toContain('cache: "no-store"');
    expect(loaderSource).toContain("MAX_POLL_ATTEMPTS = 72");
  });

  it("lets readers retry failed or stale background overview jobs without reloading", () => {
    expect(loaderSource).toContain("retryOverview");
    expect(loaderSource).toContain("Thử viết lại");
    expect(loaderSource).toContain('state.jobStatus === "stale"');
    expect(loaderSource).toContain('state.jobStatus === "failed"');
  });

  it("has inline status styling for the fast overview state", () => {
    expect(globalsCss).toContain(".free-overview-inline-status");
  });
});
