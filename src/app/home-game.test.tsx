import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import Home, { metadata as homeMetadata } from "./page";
import LegacyGame, { metadata as aliasMetadata } from "./tu-vi-quan/page";

vi.mock("@/components/tu-vi-quan-entry", () => ({ default: () => createElement("main", { "data-quan-world": true }, "Tử Vi Quán") }));

describe("game-first homepage", () => {
  it("opens the same game on the homepage and existing game address with one canonical home", () => {
    for (const Page of [Home, LegacyGame]) {
      const html = renderToStaticMarkup(createElement(Page));
      expect(html).toContain("data-quan-world");
      expect(html).not.toContain("<form");
    }
    expect(new URL(String(homeMetadata.alternates?.canonical)).pathname).toBe("/");
    expect(homeMetadata.robots).toMatchObject({ index: true });
    expect(aliasMetadata.alternates?.canonical).toBe("/");
    expect(aliasMetadata.robots).toMatchObject({ index: false });
  });
});
