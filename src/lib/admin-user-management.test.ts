import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SessionUser } from "@/lib/auth";

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({ getDb: mocks.getDb }));

const admin: SessionUser = {
  id: "admin-1",
  email: "admin@example.com",
  name: "Admin",
  role: "ADMIN",
  coinBalance: 999999,
};

const normalUser: SessionUser = {
  id: "user-1",
  email: "user@example.com",
  name: "User",
  role: "USER",
  coinBalance: 30,
};

function createDb(target = { id: "user-2", email: "target@example.com", name: "Target", role: "USER", coinBalance: 120 }) {
  const db = {
    user: {
      findUnique: vi.fn(async () => target),
      findUniqueOrThrow: vi.fn(async () => target),
      update: vi.fn(async ({ data }: { data: { coinBalance: number } }) => ({ ...target, coinBalance: data.coinBalance })),
      delete: vi.fn(async () => target),
    },
    coinLedger: {
      create: vi.fn(async () => null),
    },
    auditLog: {
      create: vi.fn(async () => null),
    },
    $transaction: vi.fn(async (callback: (tx: typeof db) => Promise<unknown>) => callback(db)),
  };
  return db;
}

describe("admin user management", () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.getDb.mockReset();
  });

  it("lets admins adjust a user's coins with a ledger and audit entry", async () => {
    const db = createDb();
    mocks.getDb.mockReturnValue(db);

    const { adminAdjustUserCoins } = await import("@/lib/admin-user-management");
    const result = await adminAdjustUserCoins(admin, {
      userId: "user-2",
      amount: 50,
      reason: "Bù xu hỗ trợ khách",
    });

    expect(result.balance).toBe(170);
    expect(db.user.update).toHaveBeenCalledWith({ where: { id: "user-2" }, data: { coinBalance: 170 } });
    expect(db.coinLedger.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user-2",
        type: "ADJUSTMENT",
        amount: 50,
        balance: 170,
        reason: "Bù xu hỗ trợ khách",
        referenceId: "admin:admin-1",
      }),
    });
    expect(db.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "admin-1",
        action: "ADMIN_COIN_ADJUSTMENT",
        entity: "User",
        entityId: "user-2",
      }),
    });
  });

  it("rejects non-admin coin adjustments before touching the database", async () => {
    const db = createDb();
    mocks.getDb.mockReturnValue(db);

    const { adminAdjustUserCoins } = await import("@/lib/admin-user-management");
    await expect(adminAdjustUserCoins(normalUser, { userId: "user-2", amount: 10 })).rejects.toThrow("ADMIN_REQUIRED");

    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("does not allow revoking more coins than the user has", async () => {
    const db = createDb();
    mocks.getDb.mockReturnValue(db);

    const { adminAdjustUserCoins } = await import("@/lib/admin-user-management");
    await expect(adminAdjustUserCoins(admin, { userId: "user-2", amount: -150 })).rejects.toThrow("INSUFFICIENT_COINS");

    expect(db.user.update).not.toHaveBeenCalled();
    expect(db.coinLedger.create).not.toHaveBeenCalled();
  });

  it("lets admins delete a normal user with an audit entry", async () => {
    const db = createDb();
    mocks.getDb.mockReturnValue(db);

    const { adminDeleteUser } = await import("@/lib/admin-user-management");
    const result = await adminDeleteUser(admin, { userId: "user-2" });

    expect(result.email).toBe("target@example.com");
    expect(db.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "admin-1",
        action: "ADMIN_DELETE_USER",
        entity: "User",
        entityId: "user-2",
      }),
    });
    expect(db.user.delete).toHaveBeenCalledWith({ where: { id: "user-2" } });
  });

  it("blocks deleting admin accounts", async () => {
    const db = createDb({ id: "admin-2", email: "owner@example.com", name: "Owner", role: "ADMIN", coinBalance: 999999 });
    mocks.getDb.mockReturnValue(db);

    const { adminDeleteUser } = await import("@/lib/admin-user-management");
    await expect(adminDeleteUser(admin, { userId: "admin-2" })).rejects.toThrow("CANNOT_DELETE_ADMIN");

    expect(db.user.delete).not.toHaveBeenCalled();
  });
});
