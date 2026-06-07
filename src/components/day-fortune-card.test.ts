import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const dayFortuneSource = readFileSync(fileURLToPath(new URL("./day-fortune-card.tsx", import.meta.url)), "utf8");

describe("DayFortuneCard performance", () => {
  it("does not prefetch dynamic date-fortune routes while the homepage is settling", () => {
    expect(dayFortuneSource).toContain('href={`/xem-ngay?date=${selectedDate}`}');
    expect(dayFortuneSource).toContain("prefetch={false}");
  });
});
