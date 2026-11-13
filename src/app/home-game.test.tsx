import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import Home, { metadata as homeMetadata } from "./page";
import LegacyGame, { metadata as aliasMetadata } from "./tu-vi-quan/page";

vi.mock("@/components/tu-vi-quan-entry", () => ({ default: () => createElement("main", { "data-quan-world": true }, "Tử Vi Quán") }));
vi.mock("@/components/chart-form", () => ({ ChartForm: () => createElement("form") }));
vi.mock("@/lib/data", () => ({ listArticleSummaries: async () => [] }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(url); } }));

describe("chart-first homepage", () => {
  it("shows a form at home and keeps the game on its own route", async () => {
    const html = renderToStaticMarkup(await Home({}));
    expect(html).toContain('id="lap-la-so"');
    expect(html).toContain("<form");
    expect(html).toContain('href="/tu-vi-quan"');
    expect(renderToStaticMarkup(createElement(LegacyGame))).toContain("data-quan-world");
    expect(new URL(String(homeMetadata.alternates?.canonical)).pathname).toBe("/");
    expect(aliasMetadata.alternates?.canonical).toBe("/");
    expect(aliasMetadata.robots).toMatchObject({ index: false });
  });

  it("keeps already issued PayOS return links usable", async () => {
    const session = "01111111-1111-4111-8111-111111111111";
    await expect(Home({ searchParams: Promise.resolve({ session }) })).rejects.toThrow(`/tu-vi-quan?session=${session}`);
  });
});
