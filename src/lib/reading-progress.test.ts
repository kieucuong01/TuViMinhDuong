import { describe, expect, it } from "vitest";
import {
  calculateReadingPercent,
  parseReadingProgressInput,
} from "@/lib/reading-progress";

describe("reading progress", () => {
  it("calculates and clamps progress inside the report", () => {
    expect(calculateReadingPercent(500, 100, 900)).toBe(50);
    expect(calculateReadingPercent(-20, 100, 900)).toBe(0);
    expect(calculateReadingPercent(1200, 100, 900)).toBe(100);
    expect(calculateReadingPercent(100, 100, 100)).toBe(0);
  });

  it("accepts a bounded progress payload", () => {
    expect(parseReadingProgressInput({
      chapterKey: "chuong-4-cong-viec",
      chapterIndex: 3,
      percent: 42,
      chapterOffset: 0.35,
    })).toEqual({
      chapterKey: "chuong-4-cong-viec",
      chapterIndex: 3,
      percent: 42,
      chapterOffset: 0.35,
    });
  });

  it.each([
    { chapterKey: "x", chapterIndex: -1, percent: 50, chapterOffset: 0.2 },
    { chapterKey: "x", chapterIndex: 1, percent: 101, chapterOffset: 0.2 },
    { chapterKey: "x", chapterIndex: 1, percent: 10, chapterOffset: 2 },
    { chapterKey: "Có khoảng trắng", chapterIndex: 1, percent: 10, chapterOffset: 0.2 },
  ])("rejects invalid progress %#", (input) => {
    expect(parseReadingProgressInput(input)).toBeNull();
  });
});
