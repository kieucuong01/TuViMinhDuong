import "server-only";

import { cookies } from "next/headers";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "@/lib/env";
import { getDb } from "@/lib/db";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN";
  coinBalance: number;
};

const COOKIE_NAME = "tuvi_session";

function secret() {
  return process.env.AUTH_SECRET || "dev-tu-vi-secret-change-me";
}

function base64url(input: string) {
  return Buffer.from(input).toString("base64url");
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function sessionValue(user: SessionUser) {
  const payload = base64url(JSON.stringify({ ...user, exp: Date.now() + 1000 * 60 * 60 * 24 * 30 }));
  return `${payload}.${sign(payload)}`;
}

function parseSession(value?: string): SessionUser | null {
  if (!value) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature || sign(payload) !== signature) return null;
  const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  if (!parsed.exp || parsed.exp < Date.now()) return null;
  return {
    id: parsed.id,
    email: parsed.email,
    name: parsed.name,
    role: parsed.role,
    coinBalance: parsed.coinBalance ?? 0,
  };
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored?: string | null) {
  if (!stored) return false;
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return expected.length === candidate.length && timingSafeEqual(expected, candidate);
}

export async function setSession(user: SessionUser) {
  const jar = await cookies();
  jar.set(COOKIE_NAME, sessionValue(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function createMagicSession(user: SessionUser) {
  const db = getDb();
  const token = randomBytes(32).toString("base64url");
  if (!db || user.id.startsWith("demo-") || user.id.startsWith("guest-")) return token;

  await db.session.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    },
  });
  return token;
}

export async function signInWithMagicToken(token: string) {
  const db = getDb();
  if (!db || !token) return null;

  const session = await db.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) return null;

  const user: SessionUser = {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name || session.user.email.split("@")[0],
    role: session.user.role,
    coinBalance: session.user.coinBalance,
  };
  await setSession(user);
  return user;
}

export async function getOrCreateEmailUser(email: string, name?: string): Promise<SessionUser> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error("Email nhận kết quả không hợp lệ.");
  }

  const db = getDb();
  if (!db) {
    return {
      id: `demo-${normalizedEmail}`,
      email: normalizedEmail,
      name: name?.trim() || normalizedEmail.split("@")[0],
      role: normalizedEmail === ADMIN_EMAIL ? "ADMIN" : "USER",
      coinBalance: normalizedEmail === ADMIN_EMAIL ? 999999 : 0,
    };
  }

  const user = await db.user.upsert({
    where: { email: normalizedEmail },
    update: {
      name: name?.trim() || undefined,
    },
    create: {
      email: normalizedEmail,
      name: name?.trim() || normalizedEmail.split("@")[0],
      coinBalance: 0,
    },
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name || user.email.split("@")[0],
    role: user.role,
    coinBalance: user.coinBalance,
  };
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const user = parseSession(jar.get(COOKIE_NAME)?.value);
  if (!user) return null;

  const db = getDb();
  if (!db || user.id.startsWith("demo-") || user.id.startsWith("guest-")) return user;

  const fresh = await db.user.findUnique({
    where: { id: user.id },
    select: { id: true, email: true, name: true, role: true, coinBalance: true },
  });
  return fresh
    ? {
        id: fresh.id,
        email: fresh.email,
        name: fresh.name || fresh.email.split("@")[0],
        role: fresh.role,
        coinBalance: fresh.coinBalance,
      }
    : null;
}

export async function loginOrRegister(email: string, password: string, name?: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || password.length < 6) {
    throw new Error("Email hợp lệ và mật khẩu tối thiểu 6 ký tự.");
  }

  const db = getDb();
  const isAdminEmail = normalizedEmail === ADMIN_EMAIL;
  const isConfiguredAdminLogin = isAdminEmail && Boolean(ADMIN_PASSWORD) && password === ADMIN_PASSWORD;
  const role = isConfiguredAdminLogin ? "ADMIN" : "USER";

  if (!db) {
    const user: SessionUser = {
      id: `demo-${normalizedEmail}`,
      email: normalizedEmail,
      name: name?.trim() || normalizedEmail.split("@")[0],
      role,
      coinBalance: role === "ADMIN" ? 999999 : 30,
    };
    await setSession(user);
    return user;
  }

  const existing = await db.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    if (!existing.passwordHash && !isConfiguredAdminLogin) {
      const synced = await db.user.update({
        where: { id: existing.id },
        data: {
          passwordHash: hashPassword(password),
          name: name?.trim() || existing.name || normalizedEmail.split("@")[0],
        },
      });
      const user: SessionUser = {
        id: synced.id,
        email: synced.email,
        name: synced.name || synced.email.split("@")[0],
        role: synced.role,
        coinBalance: synced.coinBalance,
      };
      await setSession(user);
      return user;
    }
    const passwordMatches = verifyPassword(password, existing.passwordHash);
    if (!passwordMatches && !isConfiguredAdminLogin) {
      throw new Error("Mật khẩu không đúng.");
    }
    const needsAdminSync =
      isConfiguredAdminLogin &&
      (existing.role !== "ADMIN" || !passwordMatches || existing.coinBalance < 999999);
    const synced = needsAdminSync
      ? await db.user.update({
          where: { id: existing.id },
          data: {
            role: "ADMIN",
            passwordHash: hashPassword(ADMIN_PASSWORD),
            coinBalance: Math.max(existing.coinBalance, 999999),
          },
        })
      : existing;
    const user: SessionUser = {
      id: synced.id,
      email: synced.email,
      name: synced.name || synced.email.split("@")[0],
      role: synced.role,
      coinBalance: synced.coinBalance,
    };
    await setSession(user);
    return user;
  }

  const created = await db.user.create({
    data: {
      email: normalizedEmail,
      name: name?.trim() || normalizedEmail.split("@")[0],
      passwordHash: hashPassword(isConfiguredAdminLogin ? ADMIN_PASSWORD : password),
      role,
      coinBalance: role === "ADMIN" ? 999999 : 30,
    },
  });
  const user: SessionUser = {
    id: created.id,
    email: created.email,
    name: created.name || created.email.split("@")[0],
    role: created.role,
    coinBalance: created.coinBalance,
  };
  await setSession(user);
  return user;
}
