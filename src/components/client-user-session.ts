"use client";

export type ClientSessionUser = {
  id: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN";
  coinBalance: number;
};

type ClientSession = {
  user: ClientSessionUser | null;
};

let sessionPromise: Promise<ClientSession> | null = null;
const SESSION_CHANGED_EVENT = "tuvi:session-changed";

export function fetchClientSession({ force = false }: { force?: boolean } = {}) {
  if (!force && sessionPromise) return sessionPromise;

  sessionPromise = fetch("/api/me", { credentials: "same-origin", cache: "no-store" })
    .then((response) => response.json())
    .then((data) => ({ user: data.user || null }))
    .catch(() => ({ user: null }));

  return sessionPromise;
}

export function clearClientSessionCache() {
  sessionPromise = null;
}

export function notifyClientSessionChanged() {
  clearClientSessionCache();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SESSION_CHANGED_EVENT));
  }
}

export function onClientSessionChanged(handler: () => void) {
  if (typeof window === "undefined") return () => {};

  window.addEventListener(SESSION_CHANGED_EVENT, handler);
  return () => window.removeEventListener(SESSION_CHANGED_EVENT, handler);
}
