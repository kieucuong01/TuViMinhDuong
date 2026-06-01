import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const headerSource = readFileSync(fileURLToPath(new URL("./site-header.tsx", import.meta.url)), "utf8");
const mobileMenuSource = readFileSync(fileURLToPath(new URL("./mobile-site-menu.tsx", import.meta.url)), "utf8");
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

  it("keeps the same featured treatment available in the mobile menu", () => {
    expect(mobileMenuSource).toContain("CalendarDays");
    expect(mobileMenuSource).toContain("BookOpenText");
    expect(mobileMenuSource).toContain("mobile-menu-date");
    expect(mobileMenuSource).toContain("mobile-menu-knowledge");
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
