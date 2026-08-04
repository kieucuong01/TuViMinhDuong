import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const toolSource = readFileSync(fileURLToPath(new URL("./chart-compatibility-tool.tsx", import.meta.url)), "utf8");
const globalsCss = readFileSync(fileURLToPath(new URL("../app/globals.css", import.meta.url)), "utf8");

describe("two-chart compatibility tool", () => {
  it("collects two clearly labelled birth profiles with accessible controls", () => {
    expect(toolSource).toContain("Thông tin người thứ nhất");
    expect(toolSource).toContain("Thông tin người thứ hai");
    expect(toolSource).toContain("<fieldset");
    expect(toolSource).toContain('htmlFor={`${prefix}-name`}');
    expect(toolSource).toContain('aria-describedby="compatibility-privacy-note"');
    expect(toolSource).toContain("Dữ liệu chỉ được xử lý trên thiết bị này");
  });

  it("renders a useful report hierarchy instead of a single compatibility score", () => {
    expect(toolSource).toContain("Bức tranh chung");
    expect(toolSource).toContain("Sáu chủ đề cần đối chiếu");
    expect(toolSource).toContain("Góc nhìn chính");
    expect(toolSource).toContain("Khi đi vào đời sống");
    expect(toolSource).toContain("Việc hai người có thể thử");
    expect(toolSource).toContain("Câu hỏi nên trao đổi");
    expect(toolSource).toContain("Căn cứ từ hai lá số");
    expect(toolSource).not.toMatch(/\/\s*100|điểm tương hợp/i);
  });

  it("uses plain editorial labels instead of mechanical explanation prompts", () => {
    expect(toolSource).not.toContain("Vì sao có nhận định này?");
    expect(toolSource).not.toContain("Biểu hiện có thể gặp");
    expect(toolSource).toContain("compatibility-reading-layer is-primary");
    expect(toolSource).toContain("compatibility-reading-layer is-scene");
  });

  it("announces errors and moves focus to the generated result", () => {
    expect(toolSource).toContain('role="alert"');
    expect(toolSource).toContain('aria-live="polite"');
    expect(toolSource).toContain("resultRef.current?.focus()");
    expect(toolSource).toContain('tabIndex={-1}');
  });

  it("uses mobile-first two-profile styling with touch-friendly controls", () => {
    expect(globalsCss).toMatch(/\.compatibility-form-grid\s*{[\s\S]*grid-template-columns:\s*1fr/);
    expect(globalsCss).toMatch(/\.compatibility-person input,[\s\S]*\.compatibility-person select\s*{[\s\S]*min-height:\s*3rem/);
    expect(globalsCss).toMatch(/@media \(min-width:\s*900px\)[\s\S]*\.compatibility-form-grid\s*{[\s\S]*grid-template-columns:\s*repeat\(2,/);
    expect(globalsCss).toMatch(/@media \(max-width:\s*560px\)[\s\S]*\.compatibility-date-grid\s*{[\s\S]*grid-template-columns:\s*repeat\(2,/);
  });
});
