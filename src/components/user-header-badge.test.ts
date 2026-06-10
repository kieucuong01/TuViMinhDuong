import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const userHeaderSource = readFileSync(fileURLToPath(new URL("./user-header-badge.tsx", import.meta.url)), "utf8");
const clientSessionSource = readFileSync(fileURLToPath(new URL("./client-user-session.ts", import.meta.url)), "utf8");
const globalsCss = readFileSync(fileURLToPath(new URL("../app/globals.css", import.meta.url)), "utf8");

describe("user header coin balance", () => {
  it("renders a logged-in user's coin balance with a top-up destination", () => {
    expect(clientSessionSource).toContain("coinBalance: number");
    expect(userHeaderSource).toContain("ClientSessionUser");
    expect(userHeaderSource).toContain("formatCoins(user.coinBalance ?? 0)");
    expect(userHeaderSource).toContain('href="/nap-xu"');
    expect(userHeaderSource).toContain('className="user-coin-pill"');
  });

  it("keeps the mobile account trigger compact on the right side of the header", () => {
    expect(userHeaderSource).toContain("user-account-mobile-coins");
    expect(globalsCss).toMatch(/\.user-header-badge\s+\.user-coin-pill[\s\S]*display:\s*none/);
    expect(globalsCss).toMatch(/\.user-header-badge\s+\.user-name-pill\s*{[\s\S]*width:\s*2\.8rem/);
    expect(globalsCss).toMatch(/\.user-header-badge\s+\.user-account-mobile-coins,\s*\n\s*\.user-header-badge\s+\.user-account-chevron\s*{[\s\S]*display:\s*none/);
  });

  it("renders guest account access as an icon-friendly header action", () => {
    expect(userHeaderSource).toContain('className="login-link btn btn-small btn-ghost"');
    expect(userHeaderSource).toContain("<UserCircle size={16} />");
    expect(globalsCss).toMatch(/\.site-header-actions \.login-link span\s*{[\s\S]*display:\s*none/);
  });

  it("closes the account dropdown when the visitor presses outside it", () => {
    expect(userHeaderSource).toContain("useCloseDetailsOnOutsideClick");
    expect(userHeaderSource).toContain("useCloseDetailsOnOutsideClick(detailsRef)");
  });

  it("keeps logout inside the logged-in account menu on mobile", () => {
    expect(userHeaderSource).toContain('fetch("/api/auth/logout"');
    expect(userHeaderSource).toContain("handleLogout");
    expect(userHeaderSource).toContain("notifyClientSessionChanged");
    expect(userHeaderSource).toContain("onClientSessionChanged");
    expect(userHeaderSource).not.toContain('href="/chinh-sach-thanh-toan-hoan-xu"');
    expect(globalsCss).not.toMatch(/\.user-header-badge\s+\.user-account-value,\s*\n\s*\.user-header-badge\s+form\s*{[\s\S]*display:\s*none/);
  });

  it("keeps the saved-chart shortcut compact enough for narrow mobile headers", () => {
    expect(userHeaderSource).toContain("user-charts-label");
    expect(globalsCss).toMatch(/\.user-header-badge\s+\.user-charts-label\s*{[\s\S]*display:\s*none/);
  });
});
