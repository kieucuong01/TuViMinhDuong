import { beforeEach, describe, expect, it, vi } from "vitest";

const { cookiesMock, getDbMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  getDbMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: cookiesMock }));
vi.mock("@/lib/db", () => ({ getDb: getDbMock }));
vi.mock("@/lib/env", () => ({ ADMIN_EMAIL: "admin@example.com", ADMIN_PASSWORD: "" }));

import { hashPassword, loginOrRegister } from "@/lib/auth";

const existingUser = {
  id: "user-existing",
  email: "existing@example.com",
  name: "Existing User",
  role: "USER" as const,
  coinBalance: 30,
  passwordHash: hashPassword("secret1"),
};

describe("loginOrRegister account result", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookiesMock.mockResolvedValue({ set: vi.fn() });
  });

  it("reports login for an existing account", async () => {
    getDbMock.mockReturnValue({
      user: {
        findUnique: vi.fn().mockResolvedValue(existingUser),
        update: vi.fn(),
        create: vi.fn(),
      },
    });

    const result = await loginOrRegister("EXISTING@example.com", "secret1");

    expect(result).toMatchObject({
      user: { id: existingUser.id, email: existingUser.email },
      accountResult: "login",
    });
  });

  it("reports register for a newly created account", async () => {
    const created = { ...existingUser, id: "user-created", email: "new@example.com", name: "new" };
    getDbMock.mockReturnValue({
      user: {
        findUnique: vi.fn().mockResolvedValue(null),
        update: vi.fn(),
        create: vi.fn().mockResolvedValue(created),
      },
    });

    const result = await loginOrRegister("new@example.com", "secret1");

    expect(result).toMatchObject({
      user: { id: created.id, email: created.email },
      accountResult: "register",
    });
  });

  it("reports register for the database-free demo account", async () => {
    getDbMock.mockReturnValue(null);

    const result = await loginOrRegister("demo@example.com", "secret1");

    expect(result).toMatchObject({
      user: { id: "demo-demo@example.com" },
      accountResult: "register",
    });
  });
});
