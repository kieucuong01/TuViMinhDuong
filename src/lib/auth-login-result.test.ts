import { beforeEach, describe, expect, it, vi } from "vitest";

const { cookiesMock, getDbMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  getDbMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: cookiesMock }));
vi.mock("@/lib/db", () => ({ getDb: getDbMock }));
vi.mock("@/lib/env", () => ({ ADMIN_EMAIL: "admin@example.com", ADMIN_PASSWORD: "" }));

import {
  consumeMagicSessionToken,
  createMagicSession,
  hashPassword,
  isCheckoutGuestUser,
  loginOrRegister,
  normalizeCheckoutEmail,
  signInWithMagicToken,
} from "@/lib/auth";

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

describe("guest checkout auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookiesMock.mockResolvedValue({ set: vi.fn() });
  });

  it("normalizes checkout email without treating it as an authenticated identity", () => {
    expect(normalizeCheckoutEmail(" Reader@Example.COM ")).toBe("reader@example.com");
    expect(normalizeCheckoutEmail("not-an-email")).toBeNull();
    expect(isCheckoutGuestUser({
      email: "guest-checkout-1@checkout.lasotinhhoa.local",
    })).toBe(true);
    expect(isCheckoutGuestUser({ email: "reader@example.com" })).toBe(false);
  });

  it("creates a checkout-scoped token that magic login rejects", async () => {
    const setCookie = vi.fn();
    cookiesMock.mockResolvedValue({ set: setCookie });
    const sessionCreate = vi.fn();
    const sessionFind = vi.fn().mockResolvedValue({
      expiresAt: new Date(Date.now() + 60_000),
      user: existingUser,
    });
    getDbMock.mockReturnValue({
      session: {
        create: sessionCreate,
        findUnique: sessionFind,
      },
    });

    const createCheckoutSession = createMagicSession as unknown as (
      user: typeof existingUser,
      purpose: "checkout",
    ) => Promise<string>;
    const token = await createCheckoutSession(existingUser, "checkout");
    const user = await signInWithMagicToken(token);

    expect(token).toMatch(/^checkout_/);
    expect(sessionCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ token }),
    });
    expect(user).toBeNull();
    expect(sessionFind).not.toHaveBeenCalled();
    expect(setCookie).not.toHaveBeenCalled();
  });

  it("does not consume a checkout token for the wrong order", async () => {
    const setCookie = vi.fn();
    cookiesMock.mockResolvedValue({ set: setCookie });
    const tx = {
      session: {
        findUnique: vi.fn().mockResolvedValue({
          id: "session-1",
          expiresAt: new Date(Date.now() + 60_000),
          user: existingUser,
        }),
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      paymentOrder: {
        findUnique: vi.fn().mockResolvedValue({
          userId: existingUser.id,
          rawPayload: {
            directReading: { token: "checkout_different-order" },
          },
        }),
      },
    };
    getDbMock.mockReturnValue({
      $transaction: vi.fn(async (worker: (client: typeof tx) => unknown) => worker(tx)),
    });
    const consumeCheckoutSession = consumeMagicSessionToken as unknown as (
      token: string,
      orderCode: string,
    ) => Promise<typeof existingUser | null>;

    const user = await consumeCheckoutSession("checkout_magic-1", "999");

    expect(tx.paymentOrder.findUnique).toHaveBeenCalledWith({
      where: { orderCode: BigInt(999) },
      select: { userId: true, rawPayload: true },
    });
    expect(user).toBeNull();
    expect(tx.session.deleteMany).not.toHaveBeenCalled();
    expect(setCookie).not.toHaveBeenCalled();
  });

  it("consumes a checkout token once before restoring the user", async () => {
    const setCookie = vi.fn();
    cookiesMock.mockResolvedValue({ set: setCookie });
    const tx = {
      session: {
        findUnique: vi.fn().mockResolvedValue({
          id: "session-1",
          expiresAt: new Date(Date.now() + 60_000),
          user: existingUser,
        }),
        deleteMany: vi.fn()
          .mockResolvedValueOnce({ count: 1 })
          .mockResolvedValueOnce({ count: 0 }),
      },
      paymentOrder: {
        findUnique: vi.fn().mockResolvedValue({
          userId: existingUser.id,
          rawPayload: {
            directReading: { token: "checkout_magic-1" },
          },
        }),
      },
    };
    getDbMock.mockReturnValue({
      $transaction: vi.fn(async (worker: (client: typeof tx) => unknown) => worker(tx)),
    });
    const consumeCheckoutSession = consumeMagicSessionToken as unknown as (
      token: string,
      orderCode: string,
    ) => Promise<typeof existingUser | null>;

    const first = await consumeCheckoutSession("checkout_magic-1", "123");
    const second = await consumeCheckoutSession("checkout_magic-1", "123");

    expect(tx.session.deleteMany).toHaveBeenCalledWith({
      where: { id: "session-1", token: "checkout_magic-1" },
    });
    expect(tx.session.deleteMany.mock.invocationCallOrder[0]).toBeLessThan(
      setCookie.mock.invocationCallOrder[0],
    );
    expect(first).toMatchObject({ id: existingUser.id });
    expect(second).toBeNull();
    expect(setCookie).toHaveBeenCalledTimes(1);
  });
});
