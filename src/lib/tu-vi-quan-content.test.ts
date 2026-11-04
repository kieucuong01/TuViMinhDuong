import { describe, expect, it } from "vitest";
import { generateTuViChart } from "@/lib/chart";
import { CHART_FIXTURES } from "@/lib/chart.fixtures";
import {
  buildQuanHoroscope, drawDaily, drawIChing, drawTarot, moderateWish,
  quanDayKey, QUAN_COSMETICS, QUAN_TAROT_CARDS,
} from "@/lib/tu-vi-quan-content";

function toss(lines: number[]) {
  const coins = lines.flatMap((line) => Array.from({ length: 3 }, (_, index) => Number(index < line - 6)));
  return drawIChing(() => coins.shift()!);
}

describe("Tử Vi Quán content", () => {
  it("switches days at Vietnamese midnight", () => {
    expect(quanDayKey(new Date("2026-11-04T16:59:59.999Z"))).toBe("2026-11-04");
    expect(quanDayKey(new Date("2026-11-04T17:00:00.000Z"))).toBe("2026-11-05");
  });

  it("anchors daily evidence to the selected chart topic and keeps the seeded draw stable", () => {
    const chart = generateTuViChart(CHART_FIXTURES[0].input);
    const result = drawDaily("money", chart, "profile-day");
    expect(result).toEqual(drawDaily("money", chart, "profile-day"));
    expect(result).toMatchObject({ topic: "money", personalized: true, color: expect.any(String), number: expect.any(Number) });
    expect(result.evidence.join(" ")).toContain("Tài Bạch");
    expect(drawDaily("money", null, "profile-day")).toMatchObject({ personalized: false });
  });

  it("has 78 authored cards and draws three without replacement", () => {
    expect(QUAN_TAROT_CARDS).toHaveLength(78);
    for (const field of ["title", "body", "action"] as const) {
      expect(new Set(QUAN_TAROT_CARDS.map((card) => card[field])).size).toBe(78);
    }
    const limits: number[] = [];
    const reading = drawTarot(3, (max) => {
      limits.push(max);
      return max - 1;
    });
    expect(limits).toEqual([78, 77, 76]);
    expect(reading.cards.map((card) => card.id)).toEqual(["tarot-77", "tarot-76", "tarot-75"]);
    expect(new Set(reading.cards.map((card) => card.position)).size).toBe(3);
  });

  it("covers all 64 hexagrams with independently recognizable upper and lower trigram names", () => {
    const symbolic: Record<string, string> = { Khôn: "Địa", Chấn: "Lôi", Khảm: "Thủy", Đoài: "Trạch", Cấn: "Sơn", Ly: "Hỏa", Tốn: "Phong", Càn: "Thiên" };
    const readings = Array.from({ length: 64 }, (_, mask) =>
      toss(Array.from({ length: 6 }, (_, index) => mask & (1 << index) ? 7 : 8)),
    );
    expect(readings.map((item) => item.primary.number).sort((a, b) => a - b)).toEqual(Array.from({ length: 64 }, (_, i) => i + 1));
    for (const { primary, changed } of readings) {
      const prefix = primary.upper === primary.lower ? `Thuần ${primary.upper}` : `${symbolic[primary.upper]} ${symbolic[primary.lower]} `;
      expect(primary.title.startsWith(prefix)).toBe(true);
      expect(changed).toBeNull();
    }
  });

  it("counts moving lines bottom-up and reverses only old yin and old yang", () => {
    const result = toss([9, 7, 8, 8, 6, 8]);
    expect(result.lines).toEqual([9, 7, 8, 8, 6, 8]);
    expect(result.changingLines).toEqual([1, 5]);
    expect(result.primary).toMatchObject({ number: 19, lower: "Đoài", upper: "Khôn" });
    expect(result.changed).toMatchObject({ number: 29, lower: "Khảm", upper: "Khảm" });
    expect(toss([6, 6, 6, 6, 6, 6]).changed?.number).toBe(1);
  });

  it.each([
    ["Liên hệ tên@example.com", "link"],
    ["tên＠hộp", "email"],
    ["Gọi ＋８４ ９０１.２３４.５６７", "phone"],
    ["https://ví-dụ.vn", "link"],
    ["đồ n\u200bgu", "abuse"],
    ["<svg>", "format"],
    ["a".repeat(121), "length"],
  ])("holds public text containing a %s signal", (input, reason) => {
    expect(moderateWish(input)).toMatchObject({ ok: false, reason });
  });

  it("accepts Vietnamese wishes including ordinary punctuation and numbers", () => {
    expect(moderateWish("  Mong cả nhà bình an. Cố gắng 30 ngày!  ")).toEqual({
      ok: true, text: "Mong cả nhà bình an. Cố gắng 30 ngày!",
    });
  });

  it("has unique cosmetics covering each agreed price and slot", () => {
    expect(new Set(QUAN_COSMETICS.map((item) => item.id)).size).toBe(12);
    expect(new Set(QUAN_COSMETICS.map((item) => item.price))).toEqual(new Set([60, 120, 300, 600]));
    expect(new Set(QUAN_COSMETICS.map((item) => item.slot))).toEqual(new Set(["robe", "lantern", "table", "cardBack", "aura"]));
  });

  it("uses the requested year for stars and provides 12 unscored monthly prompts", () => {
    const input = CHART_FIXTURES[0].input;
    const first = buildQuanHoroscope(input, 2026);
    const second = buildQuanHoroscope(input, 2027);
    expect(first.yearLabel).toBe("Bính Ngọ");
    expect(second.yearLabel).toBe("Đinh Mùi");
    expect(second.areas).toHaveLength(5);
    expect(second.months.map((item) => item.month)).toEqual(Array.from({ length: 12 }, (_, i) => i + 1));
    expect(second.months.every((item) => !Object.hasOwn(item, "score"))).toBe(true);
    expect(second.areas.map((area) => area.evidence)).not.toEqual(first.areas.map((area) => area.evidence));
    const actual = generateTuViChart({ ...input, viewYear: 2027 });
    const work = actual.palaces.find((palace) => palace.name === "Quan Lộc")!;
    expect(second.areas[0].evidence[0]).toContain(work.yearlyStars.join(", ") || "không có trong cung");
    expect(second.mayMan.length).toBeGreaterThan(0);
    expect(JSON.parse(JSON.stringify(second))).toEqual(second);
  });
});
