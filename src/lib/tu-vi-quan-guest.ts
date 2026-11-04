import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { APP_URL } from "@/lib/env";

const cookieName = "tu_vi_quan_guest";
const maxAge = 30 * 86400;
export type QuanGuest = { id: string; alias: string };

export function normalizeQuanAlias(value: unknown) {
  if (typeof value !== "string" || value.length > 100) return null;
  const alias = value.normalize("NFC").trim().replace(/ +/g, " ");
  return /^[\p{L}\p{N} _-]{2,24}$/u.test(alias) ? alias : null;
}

function signature(payload: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is required for Tử Vi Quán");
  return createHmac("sha256", secret).update("tu-vi-quan-guest:" + payload).digest();
}

export function signQuanGuest(guest: QuanGuest, now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({ ...guest, exp: now + maxAge * 1000 })).toString("base64url");
  return payload + "." + signature(payload).toString("base64url");
}

export function decodeQuanGuest(token: string, now = Date.now()): QuanGuest | null {
  try {
    const [payload, mac, ...extra] = token.split(".");
    if (!payload || !mac || extra.length || token.length > 512) return null;
    const actual = Buffer.from(mac, "base64url");
    const expected = signature(payload);
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
    const { id, alias, exp } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof exp !== "number" || exp <= now || typeof id !== "string" || !/^[0-9a-f-]{36}$/.test(id) || !normalizeQuanAlias(alias)) return null;
    return { id, alias };
  } catch {
    return null;
  }
}

export async function getQuanGuest() {
  return decodeQuanGuest((await cookies()).get(cookieName)?.value || "");
}

export async function setQuanGuest(guest: QuanGuest) {
  (await cookies()).set(cookieName, signQuanGuest(guest), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge,
  });
}

export function isQuanSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  return origin === APP_URL || (process.env.NODE_ENV !== "production" && origin === new URL(request.url).origin);
}
