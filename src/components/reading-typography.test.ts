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

  it("lets reading panels expand instead of clipping long generated text", () => {
    expect(cssRule(".reading-content-panel")).toContain("overflow: visible");
    expect(cssRule(".reading-content-panel .prose-content")).toContain("max-width: none");
    expect(cssRule(".reading-content-panel .prose-content")).toContain("overflow-wrap: anywhere");
  });

  it("lets unlocked paid readings use the full card width with justified body text", () => {
    expect(cssRule(".unlocked-reading .prose-content")).toContain("max-width: none");
    expect(cssRule(".unlocked-reading .prose-content")).toContain("width: 100%");
    expect(cssRule(".unlocked-reading .prose-content p,\n.unlocked-reading .prose-content li")).toContain("text-align: justify");
    expect(cssRule(".unlocked-reading .prose-content p,\n.unlocked-reading .prose-content li")).toContain("text-justify: inter-word");
  });

  it("justifies long-form paragraph surfaces without relying on per-page inline classes", () => {
    const longFormRule = cssRule(
      ".prose-content p,\n.prose-content li,\n.article-shell > p:not(.eyebrow),\n.article-faq p,\n.site-footer-brand p,\n.site-footer-columns p,\n.reader-comments-head p:not(.eyebrow),\n.reader-comment-body p,\n.reader-comment-reply p,\n.day-fortune-note,\n.date-guide-card p,\n.date-faq-item p,\n.date-info-card p.leading-7,\n.date-task-card p,\n.date-rule-card p,\n.date-star-chip span,\n.fate-hero-copy p,\n.fate-explain p,\n.fate-summary,\n.palace-stat-card p,\n.palace-preview-card p,\n.palace-reading-card p,\n.palace-card-summary,\n.fate-preview-panel p,\n.fate-preview-panel li,\n.fate-premium-box p,\n.fate-premium-box li,\n.fate-plans > p",
    );

    expect(longFormRule).toContain("text-align: justify");
    expect(longFormRule).toContain("text-justify: inter-word");
  });
});
