import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const navSource = readFileSync(fileURLToPath(new URL("./mobile-bottom-nav.tsx", import.meta.url)), "utf8");
const layoutSource = readFileSync(fileURLToPath(new URL("../app/layout.tsx", import.meta.url)), "utf8");
const globalsCss = readFileSync(fileURLToPath(new URL("../app/globals.css", import.meta.url)), "utf8");

describe("mobile bottom navigation", () => {
  it("is mounted globally and exposes the four approved app tabs", () => {
    expect(layoutSource).toContain('import { MobileBottomNav } from "@/components/mobile-bottom-nav"');
    expect(layoutSource).toContain("<MobileBottomNav />");
    expect(navSource).toContain("Lá số");
    expect(navSource).toContain("Xem ngày");
    expect(navSource).toContain("Kiến thức");
    expect(navSource).toContain("Tài khoản");
  });

  it("uses the agreed mobile destinations and login behavior", () => {
    expect(navSource).toContain('const chartHref = user ? "/la-so" : "/#lap-la-so"');
    expect(navSource).toContain('href="/xem-ngay"');
    expect(navSource).toContain('href="/kien-thuc-tu-vi"');
    expect(navSource).toContain("loginModalHref");
    expect(navSource).toContain('fetch("/api/me"');
  });

  it("keeps money policy out of the account sheet while preserving account actions", () => {
    expect(navSource).toContain("mobile-account-sheet");
    expect(navSource).toContain('href="/la-so"');
    expect(navSource).toContain('href="/nap-xu"');
    expect(navSource).toContain("logoutAction");
    expect(navSource).not.toContain("chinh-sach-thanh-toan-hoan-xu");
    expect(navSource).not.toContain("Thanh toán và Hoàn xu");
  });

  it("defines safe-area spacing for the bottom nav and floating mobile UI", () => {
    expect(globalsCss).toContain("--mobile-bottom-nav-height");
    expect(globalsCss).toContain("--mobile-floating-bottom");
    expect(globalsCss).toContain("--mobile-safe-bottom");
    expect(globalsCss).toMatch(/\.premium-reading-cta-floating\s*{[\s\S]*bottom:\s*var\(--mobile-floating-bottom\)/);
    expect(globalsCss).toMatch(/\.paywall-popup\s*{[\s\S]*bottom:\s*var\(--mobile-floating-bottom\)/);
    expect(globalsCss).toMatch(/\.paywall-modal-backdrop\s*{[\s\S]*var\(--mobile-bottom-nav-height\)/);
  });
});
