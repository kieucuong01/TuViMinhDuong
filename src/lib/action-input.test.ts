import { describe, expect, it } from "vitest";
import { FEATURE_PRICE_KEYS } from "@/lib/pricing";

describe("server action input parsing", () => {
  it("parses chart fields with the established defaults", async () => {
    const { parseChartActionInput } = await import("@/lib/action-input");
    const formData = new FormData();
    formData.set("fullName", "  Nguyễn Văn A  ");
    formData.set("gender", "female");
    formData.set("calendarType", "lunar");
    formData.set("day", "17");
    formData.set("month", "8");
    formData.set("year", "1992");
    formData.set("birthHour", "23");
    formData.set("birthMinute", "45");
    formData.set("viewYear", "2030");

    expect(parseChartActionInput(formData)).toEqual({
      fullName: "  Nguyễn Văn A  ",
      gender: "female",
      calendarType: "lunar",
      day: 17,
      month: 8,
      year: 1992,
      birthHour: 23,
      birthMinute: 45,
      viewYear: 2030,
      timezone: "Asia/Bangkok",
    });
  });

  it("parses reading and bundle requests while rejecting unsafe next paths", async () => {
    const { parseReadingBundleInput, parseReadingRequestInput } = await import("@/lib/action-input");
    const reading = new FormData();
    reading.set("chartId", "chart-1");
    reading.set("type", "CAREER");
    reading.set("scopeKey", "career");
    reading.set("next", "//evil.example/path");

    expect(parseReadingRequestInput(reading)).toEqual({
      chartId: "chart-1",
      type: "CAREER",
      scopeKey: "career",
      nextPath: "/la-so/chart-1",
    });

    const bundle = new FormData();
    bundle.set("chartId", "chart-2");
    bundle.set("type", "LIFE_BUNDLE");
    bundle.set("next", "/la-so/chart-2#bundle");
    expect(parseReadingBundleInput(bundle)).toEqual({
      chartId: "chart-2",
      type: "LIFE_BUNDLE",
      nextPath: "/la-so/chart-2#bundle",
    });
  });

  it("parses operation presets and custom checkbox values", async () => {
    const { parseOperationSettingsInput } = await import("@/lib/action-input");
    const basic = new FormData();
    basic.set("mode", "basic-free");
    expect(parseOperationSettingsInput(basic)).toEqual({
      paymentsEnabled: false,
      coinTopupEnabled: false,
      paidReadingsEnabled: false,
    });

    const custom = new FormData();
    custom.set("paymentsEnabled", "1");
    custom.set("paidReadingsEnabled", "1");
    expect(parseOperationSettingsInput(custom)).toEqual({
      paymentsEnabled: true,
      coinTopupEnabled: false,
      paidReadingsEnabled: true,
    });
  });

  it("maps every established feature price field without validation side effects", async () => {
    const { parseFeaturePriceUpdates } = await import("@/lib/action-input");
    const formData = new FormData();
    FEATURE_PRICE_KEYS.forEach((key, index) => formData.set(`priceCoins:${key}`, String(index + 10)));

    expect(parseFeaturePriceUpdates(formData)).toEqual(
      FEATURE_PRICE_KEYS.map((key, index) => ({ key, priceCoins: index + 10 })),
    );
  });
});
