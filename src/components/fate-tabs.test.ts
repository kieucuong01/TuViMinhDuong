import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const fateTabsSource = readFileSync(fileURLToPath(new URL("./fate-tabs.tsx", import.meta.url)), "utf8");
const chartPageSource = readFileSync(fileURLToPath(new URL("../app/la-so/[id]/page.tsx", import.meta.url)), "utf8");

describe("fate tabs", () => {
  it("keeps Nhat van as the final fate tab and removes Chuyen de", () => {
    expect(fateTabsSource).toContain('label: "Nhật vận"');
    expect(fateTabsSource).not.toContain("Chuyên đề");
    expect(fateTabsSource).not.toContain("chuyen-de");
    expect(chartPageSource).not.toContain("chuyen-de");
  });
});
