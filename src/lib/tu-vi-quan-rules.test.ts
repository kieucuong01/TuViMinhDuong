import { describe, expect, it } from "vitest";
import { getQuanPackage, getQuanQueueWait, isExactQuanPayment, quanRefundAmount } from "./tu-vi-quan-rules";

describe("Tử Vi Quán billing and queue", () => {
  it("locks price and minutes to one of the two supported packages", () => {
    expect(getQuanPackage(15)).toEqual({ minutes: 15, amountVnd: 100_000 });
    expect(getQuanPackage(30)).toEqual({ minutes: 30, amountVnd: 200_000 });
    expect(getQuanPackage("15")).toBeNull();
    expect(getQuanPackage(20)).toBeNull();
  });

  it("accepts only a verified paid status with the exact order amount", () => {
    expect(isExactQuanPayment({ status: "PAID", amount: 200_000, amountPaid: 200_000 }, 200_000)).toBe(true);
    expect(isExactQuanPayment({ status: "PAID", amount: 200_000, amountPaid: 199_999 }, 200_000)).toBe(false);
    expect(isExactQuanPayment({ status: "PAID", amount: 200_000, amountPaid: 200_001 }, 200_000)).toBe(false);
    expect(isExactQuanPayment({ status: "CANCELLED", amount: 200_000, amountPaid: 200_000 }, 200_000)).toBe(false);
  });

  it("estimates FIFO waits across tables with mixed package durations", () => {
    expect(getQuanQueueWait([60, 120], [30, 15])).toBe(1020);
    expect(getQuanQueueWait([0, 120], [30])).toBe(120);
    expect(getQuanQueueWait([], [15])).toBeUndefined();
  });

  it("prorates the refund using the purchased package, rounded up and capped", () => {
    expect(quanRefundAmount(200_000, 30, 15 * 60_000)).toBe(100_000);
    expect(quanRefundAmount(100_000, 15, 10)).toBe(2);
    expect(quanRefundAmount(100_000, 15, 90 * 60_000)).toBe(100_000);
    expect(quanRefundAmount(100_000, 15, -1000)).toBe(0);
  });
});
