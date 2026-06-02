import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const loaderSource = readFileSync(fileURLToPath(new URL("./free-overview-loader.tsx", import.meta.url)), "utf8");
const globalsCss = readFileSync(fileURLToPath(new URL("../app/globals.css", import.meta.url)), "utf8");

describe("FreeOverviewLoader fast-first flow", () => {
  it("renders fallback content while starting the background overview process", () => {
    expect(loaderSource).toContain('status: "fallback"');
    expect(loaderSource).toContain("/free-overview/process");
    expect(loaderSource).toContain("schedulePoll()");
    expect(loaderSource).toContain("free-overview-inline-status");
  });

  it("has inline status styling for the fast overview state", () => {
    expect(globalsCss).toContain(".free-overview-inline-status");
  });
});
