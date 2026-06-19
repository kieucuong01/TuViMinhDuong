import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { extractMarkdownHeadings, MarkdownContent, parseInlineMarkdown } from "@/components/markdown-content";

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

  it("can insert a retention block after the first H2 section", () => {
    const html = renderToStaticMarkup(
      createElement(MarkdownContent, {
        content: `## Phần đầu
Đoạn mở đầu.

## Phần tiếp theo
Đoạn tiếp theo.`,
        afterFirstSection: createElement("aside", { className: "mid-cta" }, "Lập lá số miễn phí"),
      }),
    );

    expect(html.indexOf("Đoạn mở đầu.")).toBeLessThan(html.indexOf("mid-cta"));
    expect(html.indexOf("mid-cta")).toBeLessThan(html.indexOf("Phần tiếp theo"));
  });
  it("renders markdown tables as real table elements", () => {
    const html = renderToStaticMarkup(
      createElement(MarkdownContent, {
        content: `| Cá»™t 1 | Cá»™t 2 |
| --- | --- |
| [Cung Má»‡nh](/kien-thuc-tu-vi/cung-menh-cung-than) | **Giáº£i thÃ­ch** |`,
      }),
    );

    expect(html).toContain('<div class="prose-table-wrap"><table>');
    expect(html).toContain('<thead><tr><th scope="col">Cá»™t 1</th><th scope="col">Cá»™t 2</th></tr></thead>');
    expect(html).toContain('href="/kien-thuc-tu-vi/cung-menh-cung-than"');
    expect(html).toContain("<strong>Giáº£i thÃ­ch</strong>");
  });

  it("renders ordered markdown lists as ol/li instead of paragraph text", () => {
    const html = renderToStaticMarkup(
      createElement(MarkdownContent, {
        content: `1. BÆ°á»›c má»™t
2. BÆ°á»›c hai
3. BÆ°á»›c ba`,
      }),
    );

    expect(html).toContain("<ol>");
    expect(html).toContain("<li>BÆ°á»›c má»™t</li>");
    expect(html).toContain("<li>BÆ°á»›c hai</li>");
    expect(html).not.toContain("<p>1. BÆ°á»›c má»™t 2. BÆ°á»›c hai 3. BÆ°á»›c ba</p>");
  });
});

describe("extractMarkdownHeadings", () => {
  it("builds a table of contents from H2 sections only", () => {
    expect(
      extractMarkdownHeadings(`## Tổng quan tháng 6/2026
Nên đọc phần này trước.

### Ghi chú nhỏ
Không đưa vào mục lục chính.

## **Cách đọc** [vận tháng](/xem-ngay)
Nội dung tiếp theo.`),
    ).toEqual([
      { id: "tong-quan-thang-6-2026", title: "Tổng quan tháng 6/2026" },
      { id: "cach-doc-van-thang", title: "Cách đọc vận tháng" },
    ]);
  });

  it("deduplicates repeated heading ids", () => {
    expect(
      extractMarkdownHeadings(`## Cung Mệnh
## Cung Mệnh`),
    ).toEqual([
      { id: "cung-menh", title: "Cung Mệnh" },
      { id: "cung-menh-2", title: "Cung Mệnh" },
    ]);
  });
});
