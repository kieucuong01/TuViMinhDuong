import { describe, expect, it } from "vitest";
import {
  buildLifetimeSearchUrl,
  filterLifetimeCards,
  getLifetimePaginationTokens,
  parseLifetimePage,
} from "./lifetime-card-list.logic";

const cards = [
  {
    title: "Tử vi trọn đời tuổi Kỷ Dậu 1969 nam mạng",
    year: "1969",
    canChi: "Kỷ Dậu",
    gender: "Nam mạng",
  },
  {
    title: "Tử vi trọn đời tuổi Ất Hợi 1995 nữ mạng",
    year: "1995",
    canChi: "Ất Hợi",
    gender: "Nữ mạng",
  },
];

describe("lifetime card list logic", () => {
  it("filters by accent-insensitive year, can chi, and gender text", () => {
    expect(filterLifetimeCards(cards, "at hoi 1995 nu")).toEqual([cards[1]]);
    expect(filterLifetimeCards(cards, "ky dau nam")).toEqual([cards[0]]);
    expect(filterLifetimeCards(cards, "1992")).toEqual([]);
    expect(filterLifetimeCards(cards, "   ")).toEqual(cards);
  });

  it("parses and clamps URL page state", () => {
    expect(parseLifetimePage(null, 14)).toBe(1);
    expect(parseLifetimePage("-3", 14)).toBe(1);
    expect(parseLifetimePage("7", 14)).toBe(7);
    expect(parseLifetimePage("999", 14)).toBe(14);
    expect(parseLifetimePage("not-a-page", 14)).toBe(1);
  });

  it("serializes query and page state without dropping unrelated params", () => {
    expect(
      buildLifetimeSearchUrl(
        "/xem-tu-vi-tron-doi",
        new URLSearchParams("source=menu"),
        "1995 nữ",
        1,
      ),
    ).toBe("/xem-tu-vi-tron-doi?source=menu&q=1995+n%E1%BB%AF#tim-tuoi");

    expect(
      buildLifetimeSearchUrl(
        "/xem-tu-vi-tron-doi",
        new URLSearchParams("q=1995+n%E1%BB%AF&page=3"),
        "",
        1,
      ),
    ).toBe("/xem-tu-vi-tron-doi#tim-tuoi");
  });

  it("returns compact pagination tokens for long page ranges", () => {
    expect(getLifetimePaginationTokens(1, 14)).toEqual([1, 2, 3, "ellipsis-end", 14]);
    expect(getLifetimePaginationTokens(7, 14)).toEqual([
      1,
      "ellipsis-start",
      6,
      7,
      8,
      "ellipsis-end",
      14,
    ]);
    expect(getLifetimePaginationTokens(14, 14)).toEqual([
      1,
      "ellipsis-start",
      12,
      13,
      14,
    ]);
    expect(getLifetimePaginationTokens(3, 5)).toEqual([1, 2, 3, 4, 5]);
  });
});
