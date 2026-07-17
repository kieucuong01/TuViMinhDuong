import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const adminPageSource = readFileSync(fileURLToPath(new URL("./page.tsx", import.meta.url)), "utf8");

describe("admin chart submissions layout", () => {
  it("adds a dedicated admin tab for chart form submissions", () => {
    expect(adminPageSource).toContain("\"charts\"");
    expect(adminPageSource).toContain("listAdminChartSubmissions");
    expect(adminPageSource).toContain("/admin?tab=charts");
    expect(adminPageSource).toContain("data-testid=\"admin-chart-submissions\"");
    expect(adminPageSource).toContain("sourceLabel(item)");
    expect(adminPageSource).toContain("sourceDetail(item)");
  });

  it("surfaces guest and logged-in submitter context", () => {
    expect(adminPageSource).toContain("Khách vãng lai");
    expect(adminPageSource).toContain("User đã đăng nhập");
    expect(adminPageSource).toContain("Họ tên nhập form");
    expect(adminPageSource).toContain("Ngày giờ sinh");
  });
});
