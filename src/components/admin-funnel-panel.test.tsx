import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AdminFunnelPanel } from "@/components/admin-funnel-panel";
import { buildAdminFunnelDashboard } from "@/lib/funnel-report";

describe("AdminFunnelPanel", () => {
  it("renders an accessible text-first funnel with selectable 7 and 28 day windows", () => {
    const now = new Date("2026-08-05T12:00:00.000Z");
    const dashboard = buildAdminFunnelDashboard({
      now,
      events: [
        { id: "1", name: "landing", anonymousSessionId: "session-a", userId: null, source: "ai", tool: "wealth", createdAt: new Date(now.getTime() - 1_000) },
        { id: "2", name: "result", anonymousSessionId: "session-a", userId: null, source: "ai", tool: "wealth", createdAt: new Date(now.getTime() - 1_000) },
      ],
      payments: [{ status: "PENDING", amountVnd: 199_000, createdAt: new Date(now.getTime() - 90_000_000) }],
    });

    const markup = renderToStaticMarkup(<AdminFunnelPanel dashboard={dashboard} initialWindow={7} />);
    expect(markup).toContain("Hành trình từ lượt xem đến luận giải");
    expect(markup).toContain('aria-label="Chọn khoảng thời gian funnel"');
    expect(markup).toContain("/admin?tab=overview&amp;funnel=7");
    expect(markup).toContain("/admin?tab=overview&amp;funnel=28");
    expect(markup).toContain("Vào trang");
    expect(markup).toContain("Nhận kết quả");
    expect(markup).toContain("Công cụ AI");
    expect(markup).toContain("Tài lộc &amp; đầu tư");
    expect(markup).toContain("Đơn chờ quá 24 giờ");
    expect(markup).toContain("199.000");
  });

  it("does not render raw visitor or account identifiers", () => {
    const dashboard = buildAdminFunnelDashboard({ events: [], payments: [] });
    const markup = renderToStaticMarkup(<AdminFunnelPanel dashboard={dashboard} initialWindow={28} />);
    expect(markup).not.toContain("anonymousSessionId");
    expect(markup).not.toContain("userId");
  });
});
