import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const chartActionPanelSource = readFileSync(fileURLToPath(new URL("./chart-action-panel.tsx", import.meta.url)), "utf8");

describe("chart action panel download", () => {
  it("downloads the chart board as a PNG image instead of opening print", () => {
    expect(chartActionPanelSource).toContain("image/png");
    expect(chartActionPanelSource).toContain(".png");
    expect(chartActionPanelSource).toContain("toBlob");
    expect(chartActionPanelSource).toContain("renderChartPngCanvas");
    expect(chartActionPanelSource).toContain('canvas.getContext("2d")');
    expect(chartActionPanelSource).not.toContain("window.print()");
    expect(chartActionPanelSource).not.toContain("data-chart-download-target");
  });
});
