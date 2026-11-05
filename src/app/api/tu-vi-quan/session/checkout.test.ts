import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  identity: vi.fn(), checkout: vi.fn(), owners: vi.fn(),
}));
vi.mock("@/lib/db", () => ({ getDb: () => ({ quanIdentity: { findFirst: mocks.identity } }) }));
vi.mock("@/lib/auth", () => ({ getCurrentUser: async () => null }));
vi.mock("@/lib/tu-vi-quan-ecosystem", () => ({ quanEcosystemEnabled: () => true, resolveQuanOwners: mocks.owners }));
vi.mock("@/lib/tu-vi-quan-guest", () => ({ getQuanGuest: async () => ({ id: "owner", alias: "Khách" }), setQuanGuest: vi.fn(), isQuanSameOrigin: () => true }));
vi.mock("@/lib/rate-limit", () => ({ checkAuthRateLimit: async () => ({ rateLimited: false }) }));
vi.mock("@/lib/tu-vi-quan-encounter", () => ({ quanVoiceGameEnabled: () => true }));
vi.mock("@/lib/tu-vi-quan-voice", () => ({ quanVoiceCapabilities: async () => ({ stt: true, tts: true }) }));
vi.mock("@/lib/tu-vi-quan-payment", () => ({ refreshQuanPayment: vi.fn() }));
vi.mock("@/lib/tu-vi-quan-session", async importOriginal => ({ ...await importOriginal<typeof import("@/lib/tu-vi-quan-session")>(), checkoutQuanSession: mocks.checkout }));
vi.mock("server-only", () => ({}));
import { POST } from "./route";
const request = () => new Request("http://localhost:4000/api/tu-vi-quan/session", { method: "POST", headers: { "Content-Type": "application/json", Origin: "http://localhost:4000" }, body: JSON.stringify({ action: "checkout", minutes: 15, readingKind: "tuvi", chart: { fullName: "untrusted" } }) });
beforeEach(() => { vi.clearAllMocks(); mocks.owners.mockResolvedValue(["owner"]); mocks.checkout.mockResolvedValue({ session: null }); });
it("uses only the owner's saved birth information without asking for a second chart", async () => {
  const birth = { fullName: "Hồ sơ đã lưu", day: 1, month: 1, year: 1990 };
  mocks.identity.mockResolvedValue({ profile: { birthInput: birth } });
  expect((await POST(request())).status).toBe(200);
  expect(mocks.identity).toHaveBeenCalledWith(expect.objectContaining({ where: { guestId: { in: ["owner"] } } }));
  expect(mocks.checkout).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ id: "owner" }), 15, birth, "tuvi");
});
it("does not create an order if the owner has no saved chart", async () => {
  mocks.identity.mockResolvedValue(null);
  expect((await POST(request())).status).toBe(400);
  expect(mocks.checkout).not.toHaveBeenCalled();
});
