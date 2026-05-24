import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MarkdownContent, parseInlineMarkdown } from "@/components/markdown-content";

describe("parseInlineMarkdown", () => {
  it("keeps emphasized labels and markdown links as separate inline tokens", () => {
    expect(parseInlineMarkdown("**Điểm nổi bật:** nên đọc [Cung Mệnh](/la-so/demo#menh) trước.")).toEqual([
      { type: "strong", value: "Điểm nổi bật:" },
      { type: "text", value: " nên đọc " },
      { type: "link", label: "Cung Mệnh", href: "/la-so/demo#menh" },
      { type: "text", value: " trước." },
    ]);
  });

  it("leaves unfinished bold markers as plain text", () => {
    expect(parseInlineMarkdown("**Điểm cần xem kỹ")).toEqual([{ type: "text", value: "**Điểm cần xem kỹ" }]);
  });

  it("keeps headings separate when markdown uses a single newline before paragraph and bullets", () => {
    const html = renderToStaticMarkup(
      createElement(MarkdownContent, {
        content: `## Tổng quan miễn phí
Lá số này nên đọc từ phần tổng quan.

- **Điểm nổi bật:** Mệnh và Thân cùng một cung.

## Mệnh và Thân nói gì
- **Khí chất chính:** có xu hướng đi thẳng vào việc cần làm.`,
      }),
    );

    expect(html).toContain('<h2 id="tong-quan-mien-phi">Tổng quan miễn phí</h2>');
    expect(html).toContain("<p>Lá số này nên đọc từ phần tổng quan.</p>");
    expect(html).toContain("<strong>Điểm nổi bật:</strong>");
    expect(html).toContain('<h2 id="menh-va-than-noi-gi">Mệnh và Thân nói gì</h2>');
  });
});
