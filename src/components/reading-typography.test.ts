import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const globalsCss = readFileSync(fileURLToPath(new URL("../app/globals.css", import.meta.url)), "utf8");

function cssRule(selector: string) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matches = [...globalsCss.matchAll(new RegExp(`(?:^|\\n)${escaped}\\s*{([\\s\\S]*?)\\n}`, "g"))];
  return matches.at(-1)?.[1] || "";
}

describe("reading typography", () => {
  it("keeps inline emphasis readable instead of rendering paragraph highlights as badges", () => {
    const paragraphStrongRule = cssRule(".free-reading-summary .prose-content p strong");

    expect(paragraphStrongRule).toContain("background: transparent");
    expect(paragraphStrongRule).toContain("color: inherit");
    expect(paragraphStrongRule).toContain("font-weight: 620");
    expect(paragraphStrongRule).toContain("padding: 0");
    expect(paragraphStrongRule).not.toContain("#fff7ed");
  });

  it("uses softer emphasis weights for long-form reading content", () => {
    expect(cssRule(".prose-content strong")).toContain("font-weight: 650");
    expect(cssRule(".prose-content p strong")).toContain("font-weight: 620");
    expect(cssRule(".free-reading-summary .prose-content li strong,\n.free-reading-summary .prose-content p strong")).toContain("font-weight: 650");
    expect(cssRule(".free-reading-summary h2,\n.free-reading-summary h3")).toContain("font-weight: 800");
  });
});
