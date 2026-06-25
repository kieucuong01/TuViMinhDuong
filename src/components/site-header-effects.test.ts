import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const headerSource = readFileSync(fileURLToPath(new URL("./site-header.tsx", import.meta.url)), "utf8");
const mobileMenuSource = readFileSync(fileURLToPath(new URL("./mobile-site-menu.tsx", import.meta.url)), "utf8");
const layoutSource = readFileSync(fileURLToPath(new URL("../app/layout.tsx", import.meta.url)), "utf8");
const globalsCss = readFileSync(fileURLToPath(new URL("../app/globals.css", import.meta.url)), "utf8");

describe("site header featured nav effects", () => {
  it("marks Xem ngay and Kien thuc as featured nav tabs with icons", () => {
    expect(headerSource).toContain("CalendarDays");
    expect(headerSource).toContain("BookOpenText");
    expect(headerSource).toContain('tone: "date"');
    expect(headerSource).toContain('tone: "knowledge"');
    expect(headerSource).toContain("site-nav-date");
    expect(headerSource).toContain("site-nav-knowledge");
  });

  it("keeps featured destinations available in the left mobile header menu", () => {
    expect(headerSource).toContain("MobileSiteMenu");
    expect(mobileMenuSource).toContain("Sparkles");
    expect(mobileMenuSource).toContain("CalendarDays");
    expect(mobileMenuSource).toContain("BookOpenText");
    expect(headerSource).toContain('href: "/xem-ngay"');
    expect(headerSource).toContain('href: "/kien-thuc-tu-vi"');
  });

  it("adds a three-hub lookup dropdown without leaf links", () => {
    expect(headerSource).toContain("Tra cứu");
    expect(headerSource).toContain("/tra-cuu/y-nghia-14-chinh-tinh");
    expect(headerSource).toContain("/tra-cuu/y-nghia-12-cung");
    expect(headerSource).toContain("/tra-cuu/phu-tinh");
    expect(headerSource).not.toContain("sao-thai-am-cung-tai-bach");
    expect(mobileMenuSource).toContain("mobile-lookup-group");
  });

  it("removes the mobile bottom nav in favor of a three-zone mobile header", () => {
    expect(layoutSource).not.toContain("MobileBottomNav");
    expect(headerSource).toContain("site-header-menu-slot");
    expect(globalsCss).toMatch(/\.site-header-shell\s*{[\s\S]*grid-template-columns:\s*minmax\(3rem,\s*1fr\)\s+auto\s+minmax\(3rem,\s*1fr\)/);
    expect(globalsCss).toMatch(/\.site-header-menu-slot\s*{[\s\S]*justify-self:\s*start/);
    expect(globalsCss).toMatch(/\.site-brand\s*{[\s\S]*justify-self:\s*center/);
    expect(globalsCss).toMatch(/\.site-header-actions\s*{[\s\S]*justify-self:\s*end/);
  });

  it("lets the mobile brand shrink before overlapping the account controls", () => {
    expect(headerSource).toContain("site-header-actions");
    expect(globalsCss).toMatch(/\.site-brand-copy > span:first-child\s*{[\s\S]*max-width:\s*min\(8\.2rem,\s*42vw\)/);
    expect(globalsCss).toMatch(/\.site-header-actions \.login-link\s*{[\s\S]*width:\s*2\.8rem/);
    expect(globalsCss).toMatch(/\.site-header-actions \.login-link span\s*{[\s\S]*display:\s*none/);
  });

  it("adds restrained chip glint and hover polish through CSS", () => {
    expect(globalsCss).toContain("@keyframes nav-chip-glint");
    expect(globalsCss).toMatch(/\.site-nav-date,\s*\n\.site-nav-knowledge\s*{[\s\S]*box-shadow:/);
    expect(globalsCss).toMatch(/\.site-nav-date::before,\s*\n\.site-nav-knowledge::before\s*{[\s\S]*animation:\s*nav-chip-glint\s+5\.4s/);
    expect(globalsCss).toMatch(/\.site-nav-date:hover,\s*\n\.site-nav-knowledge:hover[\s\S]*translateY\(-1px\)/);
    expect(globalsCss).toMatch(/\.mobile-menu-date\s*{[\s\S]*linear-gradient/);
    expect(globalsCss).toMatch(/\.mobile-menu-knowledge\s*{[\s\S]*linear-gradient/);
  });
});
