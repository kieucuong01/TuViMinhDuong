import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const headerSource = readFileSync(fileURLToPath(new URL("./site-header.tsx", import.meta.url)), "utf8");
const mobileMenuSource = readFileSync(fileURLToPath(new URL("./mobile-site-menu.tsx", import.meta.url)), "utf8");
const navShellSource = readFileSync(fileURLToPath(new URL("./site-nav-shell.tsx", import.meta.url)), "utf8");
const layoutSource = readFileSync(fileURLToPath(new URL("../app/layout.tsx", import.meta.url)), "utf8");
const globalsCss = readFileSync(fileURLToPath(new URL("../app/globals.css", import.meta.url)), "utf8");

describe("site header featured nav effects", () => {
  it("marks Xem ngay and Bai Viet as featured nav tabs with icons", () => {
    expect(headerSource).toContain("CalendarDays");
    expect(headerSource).toContain("BookOpenText");
    expect(headerSource).toContain('tone: "date"');
    expect(headerSource).toContain('tone: "knowledge"');
    expect(headerSource).toContain("Bài Viết");
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

  it("adds a Tu vi dropdown with only lifetime reading linked for now", () => {
    expect(headerSource).toContain('tone: "tuvi"');
    expect(headerSource).toContain("site-nav-flyout site-tuvi-menu");
    expect(headerSource).toContain("site-tuvi-panel");
    expect(headerSource).toContain("Xem Tử vi trọn đời");
    expect(headerSource).toContain("/xem-tu-vi-tron-doi");
    expect(headerSource).toContain("Xem Tử vi 2026");
    expect(headerSource).toContain("Tử vi tài lộc & Đầu tư");
    expect(headerSource).toContain("Tương hợp lá số");
    expect(headerSource).toContain('className="site-date-panel-link disabled"');
    expect(mobileMenuSource).toContain("mobile-tuvi-group");
    expect(mobileMenuSource).toContain("mobile-menu-disabled");
  });

  it("moves knowledge and lookup links under the Bai Viet dropdown without changing SEO URLs", () => {
    expect(headerSource).toContain("site-article-menu");
    expect(headerSource).toContain("Kiến thức tử vi");
    expect(headerSource).toContain('href="/tra-cuu"');
    expect(headerSource).not.toContain("site-nav-lookup");
    expect(headerSource).toContain("/tra-cuu/y-nghia-14-chinh-tinh");
    expect(headerSource).toContain("/tra-cuu/y-nghia-12-cung");
    expect(headerSource).toContain("/tra-cuu/phu-tinh");
    expect(headerSource).toContain("site-lookup-panel-icon");
    expect(headerSource).not.toContain("sao-thai-am-cung-tai-bach");
    expect(mobileMenuSource).toContain("mobile-article-group");
    expect(mobileMenuSource).not.toContain("<span>Tra cứu</span>");
  });

  it("places the six-tool Xem Tuổi menu next to Xem Ngày on desktop and mobile", () => {
    expect(headerSource).toContain('href: "/xem-tuoi"');
    expect(headerSource).toContain('tone: "age"');
    expect(headerSource).toContain("AGE_TOOL_LINKS");
    expect(headerSource).toContain("site-nav-flyout site-age-menu");
    expect(mobileMenuSource).toContain("AGE_TOOL_LINKS");
    expect(mobileMenuSource).toContain("mobile-age-group");
  });

  it("opens desktop date and lookup dropdowns on hover/focus without sticky details state", () => {
    expect(headerSource).toContain("SiteNavShell");
    expect(headerSource).toContain("site-nav-flyout site-date-menu");
    expect(headerSource).toContain("site-nav-flyout site-tuvi-menu");
    expect(headerSource).toContain("site-nav-flyout site-lookup-menu");
    expect(headerSource).not.toContain("<details key={item.href} className=\"site-date-menu\"");
    expect(headerSource).not.toContain("<details className=\"site-lookup-menu\"");
    expect(globalsCss).toContain(".site-nav.is-closing .site-date-panel");
    expect(globalsCss).toMatch(/\.site-date-panel\s*{[\s\S]*opacity:\s*0;[\s\S]*pointer-events:\s*none;[\s\S]*visibility:\s*hidden;/);
    expect(globalsCss).toMatch(/\.site-date-menu:hover \.site-date-panel,\s*\n\.site-date-menu:focus-within \.site-date-panel\s*{[\s\S]*opacity:\s*1;[\s\S]*pointer-events:\s*auto;/);
    expect(globalsCss).toMatch(/\.site-tuvi-menu:hover \.site-tuvi-panel,\s*\n\.site-tuvi-menu:focus-within \.site-tuvi-panel\s*{[\s\S]*opacity:\s*1;[\s\S]*pointer-events:\s*auto;/);
    expect(globalsCss).toMatch(/\.site-lookup-menu:hover \.site-lookup-panel,\s*\n\.site-lookup-menu:focus-within \.site-lookup-panel\s*{[\s\S]*opacity:\s*1;[\s\S]*pointer-events:\s*auto;/);
  });

  it("keeps desktop header navigation visible through stable CSS instead of Tailwind-only display classes", () => {
    expect(navShellSource).not.toContain("hidden");
    expect(navShellSource).not.toContain("lg:flex");
    expect(globalsCss).toMatch(/\.site-nav\s*{[\s\S]*display:\s*none;[\s\S]*align-items:\s*center;/);
    expect(globalsCss).toMatch(/@media \(min-width:\s*1024px\)\s*{[\s\S]*\.site-nav\s*{[\s\S]*display:\s*flex;/);
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
    expect(globalsCss).toMatch(/\.site-nav-tuvi,\s*\n\.site-nav-date,\s*\n\.site-nav-knowledge\s*{[\s\S]*box-shadow:/);
    expect(globalsCss).toMatch(/\.site-nav-tuvi::before,\s*\n\.site-nav-date::before,\s*\n\.site-nav-knowledge::before\s*{[\s\S]*animation:\s*nav-chip-glint\s+5\.4s/);
    expect(globalsCss).toMatch(/\.site-nav-date:hover,\s*\n\.site-nav-knowledge:hover[\s\S]*translateY\(-1px\)/);
    expect(globalsCss).toMatch(/\.mobile-menu-tuvi\s*{[\s\S]*linear-gradient/);
    expect(globalsCss).toMatch(/\.mobile-menu-date\s*{[\s\S]*linear-gradient/);
    expect(globalsCss).toMatch(/\.mobile-menu-knowledge\s*{[\s\S]*linear-gradient/);
  });
});
