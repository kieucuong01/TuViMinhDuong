import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createPayOSCheckout: vi.fn(),
  getCurrentUser: vi.fn(),
  getOperationSettings: vi.fn(),
  isCheckoutGuestUser: vi.fn(),
}));

vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => Response.json(body, init),
  },
}));
vi.mock("@/lib/auth", () => ({
  getCurrentUser: mocks.getCurrentUser,
  isCheckoutGuestUser: mocks.isCheckoutGuestUser,
}));
vi.mock("@/lib/data", () => ({
  getOperationSettings: mocks.getOperationSettings,
}));
vi.mock("@/lib/payos", () => ({
  createPayOSCheckout: mocks.createPayOSCheckout,
}));

describe("PayOS top-up checkout API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentUser.mockResolvedValue({
      id: "guest-1",
      email: "guest-checkout-1@checkout.lasotinhhoa.local",
    });
    mocks.isCheckoutGuestUser.mockReturnValue(true);
    mocks.getOperationSettings.mockResolvedValue({
      paymentsEnabled: true,
      coinTopupEnabled: true,
    });
    mocks.createPayOSCheckout.mockResolvedValue({ orderCode: "123" });
  });

  it("rejects checkout guest accounts", async () => {
    const { POST } = await import("./route");
    const response = await POST(new Request("http://test.local/api/payments/payos/checkout", {
      method: "POST",
      body: JSON.stringify({ packageKey: "full-reading" }),
    }));

    expect(response.status).toBe(403);
    expect(mocks.createPayOSCheckout).not.toHaveBeenCalled();
  });
});
