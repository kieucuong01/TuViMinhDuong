import { createHmac, timingSafeEqual } from "node:crypto";

const TICKET_LIFETIME_MS = 30_000;

export function quanPresenceSecret() {
  return process.env.AUTH_SECRET || (process.env.NODE_ENV === "production" ? "" : "dev-tu-vi-secret-change-me");
}

export function quanPresenceId(guestId, secret) {
  return sign(secret, "tu-vi-quan-presence-id-v1", guestId).slice(0, 22);
}

export function quanSeatCheckToken(secret) {
  return sign(secret, "tu-vi-quan-monastery-check-v1", "seat-status");
}

/** @param {string} secret @param {string} domain @param {string} value */
function sign(secret, domain, value) {
  return createHmac("sha256", secret).update(domain).update("\0").update(value).digest("base64url");
}

/** @param {{id: string, alias: string}} guest @param {string} secret */
export function issueQuanSocketTicket(guest, secret, now = Date.now()) {
  const id = quanPresenceId(guest.id, secret);
  const payload = Buffer.from(JSON.stringify({ id, alias: guest.alias, expiresAt: now + TICKET_LIFETIME_MS })).toString("base64url");
  return `${payload}.${sign(secret, "tu-vi-quan-presence-ticket-v1", payload)}`;
}

/** @param {unknown} ticket @param {string} secret */
export function verifyQuanSocketTicket(ticket, secret, now = Date.now()) {
  if (!secret || typeof ticket !== "string" || !/^[A-Za-z0-9_-]{1,512}\.[A-Za-z0-9_-]{43}$/.test(ticket)) return null;
  const [payload, signature] = ticket.split(".");
  const expected = sign(secret, "tu-vi-quan-presence-ticket-v1", payload);
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const guest = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (
      typeof guest.id !== "string" || !/^[A-Za-z0-9_-]{22}$/.test(guest.id) ||
      typeof guest.alias !== "string" || !guest.alias.trim() || guest.alias.length > 40 ||
      !Number.isSafeInteger(guest.expiresAt) || guest.expiresAt <= now || guest.expiresAt > now + TICKET_LIFETIME_MS
    ) return null;
    return { id: guest.id, alias: guest.alias };
  } catch {
    return null;
  }
}
