import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const userHeaderSource = readFileSync(fileURLToPath(new URL("./user-header-badge.tsx", import.meta.url)), "utf8");
const globalsCss = readFileSync(fileURLToPath(new URL("../app/globals.css", import.meta.url)), "utf8");

describe("user header coin balance", () => {
  it("renders a logged-in user's coin balance with a top-up destination", () => {
    expect(userHeaderSource).toContain("coinBalance: number");
    expect(userHeaderSource).toContain("formatCoins(user.coinBalance ?? 0)");
    expect(userHeaderSource).toContain('href="/nap-xu"');
    expect(userHeaderSource).toContain('className="user-coin-pill"');
  });

  it("keeps coin balance readable on mobile without adding another header chip", () => {
    expect(userHeaderSource).toContain("user-account-mobile-coins");
    expect(globalsCss).toMatch(/\.user-header-badge\s+\.user-coin-pill[\s\S]*display:\s*none/);
    expect(globalsCss).toMatch(/\.user-account-mobile-coins\s*{[\s\S]*display:\s*inline-flex/);
  });
});
