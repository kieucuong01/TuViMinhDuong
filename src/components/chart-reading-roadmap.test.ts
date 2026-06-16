import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const roadmapSource = readFileSync(fileURLToPath(new URL("./chart-reading-roadmap.tsx", import.meta.url)), "utf8");
const chartPageSource = readFileSync(fileURLToPath(new URL("../app/la-so/[id]/page.tsx", import.meta.url)), "utf8");
const globalsSource = readFileSync(fileURLToPath(new URL("../app/globals.css", import.meta.url)), "utf8");

describe("ChartReadingRoadmap", () => {
  it("guides new readers through the chart in a practical order", () => {
    expect(roadmapSource).toContain("Lộ trình đọc lá số của bạn");
    expect(roadmapSource).toContain("Mệnh");
    expect(roadmapSource).toContain("Tài Bạch");
    expect(roadmapSource).toContain("Quan Lộc");
    expect(roadmapSource).toContain("Phu Thê");
    expect(roadmapSource).toContain("Vận tháng/ngày");
  });

  it("is not mounted on the chart result page", () => {
    expect(chartPageSource).not.toContain("ChartReadingRoadmap");
    expect(chartPageSource).not.toContain("<ChartReadingRoadmap");
  });

  it("collapses roadmap steps on narrow screens", () => {
    expect(globalsSource).toContain("@media (max-width: 900px)");
    expect(globalsSource).toContain(".chart-roadmap-steps");
    expect(globalsSource).toContain("grid-template-columns: repeat(2, minmax(0, 1fr));");
    expect(globalsSource).toContain("grid-template-columns: 1fr;");
  });
});
