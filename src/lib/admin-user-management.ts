import "server-only";

import { getDb } from "@/lib/db";
import type { SessionUser } from "@/lib/auth";

export type AdminAdjustUserCoinsInput = {
  userId: string;
  amount: number;
  reason?: string;
};

export type AdminDeleteUserInput = {
  userId: string;
};

function requireAdmin(actor: SessionUser | null | undefined): asserts actor is SessionUser {
  if (actor?.role !== "ADMIN") throw new Error("ADMIN_REQUIRED");
}

function cleanUserId(userId: string) {
  const value = userId.trim();
  if (!value) throw new Error("USER_REQUIRED");
  return value;
}

function cleanAmount(amount: number) {
  if (!Number.isFinite(amount) || !Number.isInteger(amount) || amount === 0) throw new Error("INVALID_AMOUNT");
  return amount;
}

function cleanReason(reason?: string) {
  const value = reason?.trim();
  return value || "Điều chỉnh xu từ admin";
}

export async function adminAdjustUserCoins(actor: SessionUser | null | undefined, input: AdminAdjustUserCoinsInput) {
  requireAdmin(actor);
  const userId = cleanUserId(input.userId);
  const amount = cleanAmount(input.amount);
  const reason = cleanReason(input.reason);
  const db = getDb();
  if (!db) throw new Error("DATABASE_REQUIRED");

  return db.$transaction(async (tx) => {
    const target = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, coinBalance: true },
    });
    if (!target) throw new Error("USER_NOT_FOUND");

    const balance = target.coinBalance + amount;
    if (balance < 0) throw new Error("INSUFFICIENT_COINS");

    await tx.user.update({ where: { id: userId }, data: { coinBalance: balance } });
    await tx.coinLedger.create({
      data: {
        userId,
        type: "ADJUSTMENT",
        amount,
        balance,
        reason,
        referenceId: `admin:${actor.id}`,
      },
    });
    await tx.auditLog.create({
      data: {
        userId: actor.id,
        action: "ADMIN_COIN_ADJUSTMENT",
        entity: "User",
        entityId: userId,
        metadata: {
          amount,
          balance,
          reason,
          targetEmail: target.email,
          targetRole: target.role,
        },
      },
    });

    return { userId, email: target.email, name: target.name, balance };
  });
}

export async function adminDeleteUser(actor: SessionUser | null | undefined, input: AdminDeleteUserInput) {
  requireAdmin(actor);
  const userId = cleanUserId(input.userId);
  if (userId === actor.id) throw new Error("CANNOT_DELETE_SELF");
  const db = getDb();
  if (!db) throw new Error("DATABASE_REQUIRED");

  return db.$transaction(async (tx) => {
    const target = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, coinBalance: true },
    });
    if (!target) throw new Error("USER_NOT_FOUND");
    if (target.role === "ADMIN") throw new Error("CANNOT_DELETE_ADMIN");

    await tx.auditLog.create({
      data: {
        userId: actor.id,
        action: "ADMIN_DELETE_USER",
        entity: "User",
        entityId: userId,
        metadata: {
          targetEmail: target.email,
          targetName: target.name,
          targetCoinBalance: target.coinBalance,
        },
      },
    });
    await tx.user.delete({ where: { id: userId } });

    return { userId, email: target.email, name: target.name };
  });
}
