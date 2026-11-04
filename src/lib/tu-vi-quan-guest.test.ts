import { afterEach, describe, expect, it, vi } from "vitest";
import { decodeQuanGuest, normalizeQuanAlias, signQuanGuest } from "./tu-vi-quan-guest";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));

afterEach(() => vi.unstubAllEnvs());

describe("Tử Vi Quán guest identity", () => {
  it("accepts Vietnamese aliases and rejects hidden controls or excessive length", () => {
    expect(normalizeQuanAlias("  Mây   Trắng ")).toBe("Mây Trắng");
    expect(normalizeQuanAlias("A\u202eB")).toBeNull();
    expect(normalizeQuanAlias("x".repeat(25))).toBeNull();
  });

  it("rejects forged and expired guest cookies", () => {
    vi.stubEnv("AUTH_SECRET", "test-key");
    const guest = { id: "813c9ac7-d013-451c-b26e-9f83b8bf4171", alias: "Mây Trắng" };
    const token = signQuanGuest(guest, 1000);
    expect(decodeQuanGuest(token, 2000)).toEqual(guest);
    expect(decodeQuanGuest(token.replace(/\.[^.]+$/, ".forged"), 2000)).toBeNull();
    expect(decodeQuanGuest(token, 31 * 86400000)).toBeNull();
  });
});
