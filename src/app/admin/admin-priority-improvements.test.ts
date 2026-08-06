import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const rootLayoutSource = readFileSync(fileURLToPath(new URL("../layout.tsx", import.meta.url)), "utf8");
const analyticsSource = `${readFileSync(fileURLToPath(new URL("../../components/google-analytics.tsx", import.meta.url)), "utf8")}\n${readFileSync(fileURLToPath(new URL("../../components/google-analytics-route-gate.tsx", import.meta.url)), "utf8")}`;
const loadingSubmitSource = readFileSync(fileURLToPath(new URL("../../components/loading-submit-button.tsx", import.meta.url)), "utf8");
const adminPageSource = readFileSync(fileURLToPath(new URL("./page.tsx", import.meta.url)), "utf8");
const pseoPageSource = readFileSync(fileURLToPath(new URL("./tra-cuu/page.tsx", import.meta.url)), "utf8");
const globalsCss = readFileSync(fileURLToPath(new URL("../globals.css", import.meta.url)), "utf8");

describe("admin priority UX improvements", () => {
  it("uses an admin route class to hide public chrome on admin routes", () => {
    expect(rootLayoutSource).toContain("AdminRouteClassSync");
    expect(globalsCss).toContain(".admin-route .site-header");
    expect(globalsCss).toContain(".admin-route .site-footer");
    expect(globalsCss).toContain(".admin-shell-bar");
    expect(adminPageSource).toContain("admin-shell-bar");
    expect(pseoPageSource).toContain("admin-shell-bar");
  });

  it("gates analytics reporters away from admin routes", () => {
    expect(analyticsSource).toContain("GoogleAnalyticsRouteGate");
    expect(analyticsSource).toContain("pathname === \"/admin\" || pathname.startsWith(\"/admin/\")");
  });

  it("makes wide admin tables obviously scrollable with sticky action columns", () => {
    expect(adminPageSource).toContain("admin-table-wrap sticky-actions");
    expect(adminPageSource).toContain("admin-table-scroll-hint");
    expect(adminPageSource).toContain("admin-user-action-cell sticky-action");
    expect(adminPageSource).toContain("admin-chart-action-cell sticky-action");
    expect(globalsCss).toContain(".admin-table-wrap.sticky-actions");
    expect(globalsCss).toContain("position: sticky");
  });

  it("requires confirmation copy for risky settings and pricing actions", () => {
    expect(loadingSubmitSource).toContain("confirmMessage");
    expect(loadingSubmitSource).toContain("window.confirm(confirmMessage)");
    expect(adminPageSource).toContain("admin-danger-note");
    expect(adminPageSource).toContain("data-testid=\"admin-settings-audit-note\"");
    expect(adminPageSource).toContain("confirmMessage=\"Xác nhận lưu cấu hình vận hành");
    expect(adminPageSource).toContain("confirmMessage=\"Xác nhận cập nhật bảng giá xu");
  });

  it("expands pSEO management to a full-width accessible list", () => {
    expect(pseoPageSource).toContain("admin-pseo-results-head");
    expect(pseoPageSource).toContain("htmlFor=\"admin-pseo-status\"");
    expect(pseoPageSource).toContain("admin-pseo-status-pill");
    expect(pseoPageSource).toContain("admin-pseo-actions");
    expect(globalsCss).toMatch(/\.admin-pseo-layout\s*{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  });
});
