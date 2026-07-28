import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const hubSource = readFileSync(fileURLToPath(new URL("./xem-tuoi/page.tsx", import.meta.url)), "utf8");
const ageToolsSource = readFileSync(fileURLToPath(new URL("../lib/age-tools.ts", import.meta.url)), "utf8");

describe("xem tuoi hub SEO and attribution", () => {
  it("adds an answer-first hub section with intent table and tracked chart CTAs", () => {
    expect(hubSource).toContain("Xem tuổi theo Can Chi, Ngũ hành giúp đối chiếu tuổi cho đúng việc");
    expect(hubSource).toContain("age-hub-intent");
    expect(hubSource).toContain("age-intent-table");
    expect(hubSource).toContain("source_slug=xem-tuoi");
    expect(hubSource).toContain("cta_location=xem_tuoi_hub_table");
  });

  it("uses standard attribution params for age-tool chart CTAs", () => {
    expect(ageToolsSource).toContain("source=tool&source_slug=xem-tuoi-vo-chong");
    expect(ageToolsSource).toContain("source=tool&source_slug=xem-tuoi-sinh-con");
    expect(ageToolsSource).not.toContain("source=xem_tuoi_vo_chong");
    expect(ageToolsSource).not.toContain("source=xem_tuoi_sinh_con");
  });
});
