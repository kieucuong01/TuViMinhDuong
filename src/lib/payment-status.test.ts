import { describe, expect, it } from "vitest";
import { paymentReturnNotice } from "@/lib/payment-status";

describe("payment return status copy", () => {
  it("does not treat PayOS return success as credited coins", () => {
    const notice = paymentReturnNotice("success", "123456");

    expect(notice).toEqual({
      tone: "info",
      message: "Thanh toán đã được chuyển về website. Hệ thống sẽ cộng xu khi nhận webhook xác nhận từ PayOS. Mã đơn: 123456.",
    });
    expect(notice?.message).not.toContain("Đã cộng xu");
  });

  it("keeps cancelled, failed, and expired returns as not credited", () => {
    expect(paymentReturnNotice("cancelled")?.message).toContain("Xu chưa được cộng");
    expect(paymentReturnNotice("failed")?.message).toContain("Xu chưa được cộng");
    expect(paymentReturnNotice("expired")?.message).toContain("Xu chưa được cộng");
  });

  it("only demo-paid says coins were credited immediately", () => {
    expect(paymentReturnNotice("demo-paid", "789")?.message).toBe("Đã cộng xu vào phiên hiện tại. Mã đơn: 789.");
  });
});
