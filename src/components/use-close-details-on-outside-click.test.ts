import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const hookSource = readFileSync(fileURLToPath(new URL("./use-close-details-on-outside-click.ts", import.meta.url)), "utf8");

describe("useCloseDetailsOnOutsideClick", () => {
  it("closes an open details element only when the press starts outside it", () => {
    expect(hookSource).toContain('document.addEventListener("pointerdown"');
    expect(hookSource).toContain("details.contains(target)");
    expect(hookSource).toContain("details.open = false");
  });

  it("removes document listeners when the component unmounts", () => {
    expect(hookSource).toContain('document.removeEventListener("pointerdown"');
    expect(hookSource).toContain('document.removeEventListener("keydown"');
  });
});
