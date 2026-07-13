import { describe, expect, it } from "vitest";
import { analyzeDate, rankDateRange } from "@/lib/date-fortune";

describe("date range ranking", () => {
  it("ranks an inclusive range by the selected task and keeps source analysis intact", () => {
    const results = rankDateRange({
      from: "2026-07-10",
      to: "2026-07-14",
      task: "opening",
      birthYear: 1990,
    });

    expect(results).toHaveLength(5);
    expect(results.map((item) => item.dateKey)).toEqual(expect.arrayContaining([
      "2026-07-10",
      "2026-07-11",
      "2026-07-12",
      "2026-07-13",
      "2026-07-14",
    ]));

    for (const item of results) {
      const source = analyzeDate(item.date, 1990);
      const sourceTask = source.taskScores.find((taskScore) => taskScore.key === "opening");
      expect(item.taskScore).toBe(sourceTask?.score);
      expect(item.overallScore).toBe(source.score);
      expect(item.goodSignals).toEqual(sourceTask?.goodSignals.slice(0, 3));
      expect(item.badSignals).toEqual(sourceTask?.badSignals.slice(0, 2));
      expect(item.goodHours).toEqual(source.goodHours);
    }

    for (let index = 1; index < results.length; index += 1) {
      const previous = results[index - 1];
      const current = results[index];
      expect(previous.taskScore).toBeGreaterThanOrEqual(current.taskScore);
      if (previous.taskScore === current.taskScore) {
        expect(previous.overallScore).toBeGreaterThanOrEqual(current.overallScore);
      }
      if (previous.taskScore === current.taskScore && previous.overallScore === current.overallScore) {
        expect(previous.dateKey.localeCompare(current.dateKey)).toBeLessThan(0);
      }
    }
  });

  it("returns only the five strongest days from a longer valid range", () => {
    const results = rankDateRange({
      from: "2026-07-01",
      to: "2026-07-31",
      task: "wedding",
    });

    expect(results).toHaveLength(5);
    expect(results.every((item) => item.task === "wedding")).toBe(true);
  });

  it.each(["houseMoving", "vehiclePurchase", "funeral"] as const)("supports the expanded date menu task %s", (task) => {
    const results = rankDateRange({
      from: "2026-07-01",
      to: "2026-07-10",
      task,
    });

    expect(results).toHaveLength(5);
    expect(results.every((item) => item.task === task)).toBe(true);
  });

  it.each([
    [{ from: "2026-02-30", to: "2026-03-01", task: "opening" as const }, "Ngày bắt đầu không hợp lệ"],
    [{ from: "2026-07-10", to: "2026-07-09", task: "opening" as const }, "Ngày kết thúc phải từ ngày bắt đầu"],
    [{ from: "2026-01-01", to: "2026-03-02", task: "opening" as const }, "Khoảng tìm kiếm tối đa 60 ngày"],
    [{ from: "2026-07-10", to: "2026-07-12", task: "general" as const }, "Hãy chọn một việc cụ thể"],
    [{ from: "2026-07-10", to: "2026-07-12", task: "opening" as const, birthYear: 1800 }, "Năm sinh không hợp lệ"],
  ])("rejects unsafe or unsupported input: %s", (input, message) => {
    expect(() => rankDateRange(input)).toThrow(message);
  });
});
