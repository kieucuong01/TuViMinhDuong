import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const componentSource = readFileSync(fileURLToPath(new URL("./social-proof-popup.tsx", import.meta.url)), "utf8");
const globalsCss = readFileSync(fileURLToPath(new URL("../app/globals.css", import.meta.url)), "utf8");
const popupRule = globalsCss.match(/\.social-proof-popup\s*{[\s\S]*?^}/m)?.[0] || "";

describe("social proof popup polish", () => {
  it("uses a compact layout instead of the old wide card with a separate CTA row", () => {
    expect(componentSource).toContain("social-proof-body");
    expect(componentSource).toContain("social-proof-action-row");
    expect(popupRule).toContain("grid-template-columns: auto minmax(0, 1fr) auto");
    expect(popupRule).toContain("width: min(calc(100vw - 2rem), 25rem)");
    expect(popupRule).not.toContain("34rem");
  });
});
