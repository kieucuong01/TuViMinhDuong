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
    expect(toolSource).toContain("Căn cứ từ hai lá số");
    expect(toolSource).toContain('className="compatibility-theme-prose"');
    expect(toolSource).toContain("{theme.prose}");
    expect(toolSource).not.toContain("Góc nhìn chính");
    expect(toolSource).not.toContain("Khi đi vào đời sống");
    expect(toolSource).not.toContain("Việc hai người có thể thử");
    expect(toolSource).not.toContain("Câu hỏi nên trao đổi");
    expect(toolSource).not.toMatch(/\/\s*100|điểm tương hợp/i);
  });

  it("uses plain editorial labels instead of mechanical explanation prompts", () => {
    expect(toolSource).not.toContain("Vì sao có nhận định này?");
    expect(toolSource).not.toContain("Biểu hiện có thể gặp");
    expect(toolSource).not.toContain("compatibility-reading-layer");
    expect(toolSource).not.toContain("compatibility-guidance-grid");
    expect(globalsCss).toMatch(/\.compatibility-theme-prose\s*{[\s\S]*max-width:\s*72ch[\s\S]*font-size:\s*1\.02rem[\s\S]*line-height:\s*1\.78/);
  });

  it("announces errors and moves focus to the generated result", () => {
    expect(toolSource).toContain('role="alert"');
    expect(toolSource).toContain('aria-live="polite"');
    expect(toolSource).toContain("resultRef.current?.focus()");
    expect(toolSource).toContain('tabIndex={-1}');
  });

  it("measures the reading funnel with categorical evidence only", () => {
    expect(toolSource).toContain('trackOrganicToolEvent("compatibility_tool_view"');
    expect(toolSource).toContain('trackOrganicToolEvent("compatibility_submit"');
    expect(toolSource).toContain('trackOrganicToolEvent("compatibility_result"');
    expect(toolSource).toContain('trackOrganicToolEvent("compatibility_edit"');
    expect(toolSource).toContain('trackOrganicToolEvent("compatibility_evidence_open"');
    expect(toolSource).toContain('trackOrganicToolEvent("compatibility_chart_cta"');
    expect(toolSource).toContain("result_level");
    expect(toolSource).toContain("theme_key");
    expect(toolSource).toContain('cta_position: "report_footer"');

    const analyticsLines = toolSource.split(/\r?\n/)
      .filter((line) => /trackOrganicToolEvent|theme_key|result_level|cta_position/.test(line))
      .join("\n");
    expect(analyticsLines).not.toMatch(/fullName|firstName|secondName|birth|gender|chartId|email|phone|FormData/);
  });

  it("uses mobile-first two-profile styling with touch-friendly controls", () => {
    expect(globalsCss).toMatch(/\.compatibility-form-grid\s*{[\s\S]*grid-template-columns:\s*1fr/);
    expect(globalsCss).toMatch(/\.compatibility-person input,[\s\S]*\.compatibility-person select\s*{[\s\S]*min-height:\s*3rem/);
    expect(globalsCss).toMatch(/@media \(min-width:\s*900px\)[\s\S]*\.compatibility-form-grid\s*{[\s\S]*grid-template-columns:\s*repeat\(2,/);
    expect(globalsCss).toMatch(/@media \(max-width:\s*560px\)[\s\S]*\.compatibility-date-grid\s*{[\s\S]*grid-template-columns:\s*repeat\(2,/);
  });
});
