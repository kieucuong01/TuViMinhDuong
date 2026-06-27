import { createElement } from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PseoLookupHub } from "@/components/pseo-lookup-hub";
import { MAIN_STARS } from "@/lib/pseo-registry";

const content = {
  formLabel: "Chọn chính tinh cần tra cứu",
  formHint: "Chọn một sao để xem ý nghĩa nền.",
  resultContext: "Luôn đọc chính tinh cùng cung và trạng thái mạnh yếu.",
  guideTitle: "Cách tra cứu chính tinh",
  guideIntro: "Ba bước giúp tránh đọc một sao như lời phán độc lập.",
  steps: [
    { title: "Chọn sao", body: "Bắt đầu từ sao xuất hiện trong lá số." },
    { title: "Đặt vào cung", body: "Xác định vùng đời sống đang được nhấn mạnh." },
    { title: "Đối chiếu", body: "So với trạng thái sao và câu hỏi thật." },
  ],
  principles: [
    { title: "Không tách khỏi cung", body: "Cùng một sao sẽ biểu hiện khác nhau theo cung." },
    { title: "Không kết luận tuyệt đối", body: "Tử vi là dữ liệu tham khảo có bối cảnh." },
  ],
  faqs: [
    { question: "Một chính tinh có quyết định toàn bộ lá số không?", answer: "Không. Cần đọc cùng cung, phụ tinh và vận." },
  ],
  indexTitle: "Danh mục 14 chính tinh",
  indexIntro: "Dùng danh mục để nhận diện nhanh trước khi tra cứu sâu.",
};

describe("PseoLookupHub", () => {
  it("renders a server-readable GET lookup form and the selected result", () => {
    const html = renderToStaticMarkup(
      createElement(PseoLookupHub, {
        title: "Ý nghĩa 14 Chính Tinh",
        description: "Tra cứu chính tinh theo đúng bối cảnh.",
        actionPath: "/tra-cuu/y-nghia-14-chinh-tinh",
        entities: MAIN_STARS,
        selectedSlug: "thai-am",
        ...content,
      }),
    );

    expect(html).toContain('action="/tra-cuu/y-nghia-14-chinh-tinh"');
    expect(html).toContain('name="muc"');
    expect(html).toMatch(/value="thai-am"[^>]*selected/);
    expect(html).toContain("Kết quả tra cứu");
    expect(html).toContain("Thái Âm");
    expect(html).toContain("Điểm nên phát huy");
    expect(html).toContain("Điều cần lưu ý");
  });

  it("keeps substantial guidance, FAQ and the complete entity index in HTML", () => {
    const html = renderToStaticMarkup(
      createElement(PseoLookupHub, {
        title: "Ý nghĩa 14 Chính Tinh",
        description: "Tra cứu chính tinh theo đúng bối cảnh.",
        actionPath: "/tra-cuu/y-nghia-14-chinh-tinh",
        entities: MAIN_STARS,
        selectedSlug: "khong-ton-tai",
        ...content,
      }),
    );

    expect(html).toContain("Cách tra cứu chính tinh");
    expect(html).toContain("Không tách khỏi cung");
    expect(html).toContain("Một chính tinh có quyết định toàn bộ lá số không?");
    expect(MAIN_STARS.every((entity) => html.includes(entity.name) && html.includes(entity.summary))).toBe(true);
    expect(html).toContain(MAIN_STARS[0]!.name);
  });

  it("has dedicated responsive styles for the form, result and mobile layout", () => {
    const css = readFileSync("src/app/globals.css", "utf8");
    expect(css).toContain(".pseo-lookup-tool");
    expect(css).toContain(".pseo-lookup-form");
    expect(css).toContain(".pseo-lookup-result");
    expect(css).toMatch(/@media \(max-width: 720px\)[\s\S]*\.pseo-lookup-tool/);
  });
});
