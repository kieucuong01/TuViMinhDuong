import { describe, expect, it } from "vitest";
import { generateTuViChart } from "@/lib/chart";
import { getMinorFateItems } from "@/lib/fate-analysis";

function sampleChart() {
  return generateTuViChart({
    fullName: "Kiều Tấn Cường",
    gender: "male",
    calendarType: "solar",
    day: 7,
    month: 5,
    year: 1995,
    birthHour: 0,
    viewYear: 2026,
    timezone: "Asia/Bangkok",
  });
}

describe("fate analysis paid scopes", () => {
  it("uses a separate paid reading type for minor fate years", () => {
    const items = getMinorFateItems(sampleChart());

    expect(items).toHaveLength(9);
    expect(items.every((item) => item.kind === "minor")).toBe(true);
    expect(items.every((item) => item.type === "TIEU_VAN")).toBe(true);
    expect(items.every((item) => item.scopeKey.startsWith("tieu-"))).toBe(true);
  });
});
