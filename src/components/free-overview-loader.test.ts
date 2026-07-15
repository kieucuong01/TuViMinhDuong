import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const loaderSource = readFileSync(fileURLToPath(new URL("./free-overview-loader.tsx", import.meta.url)), "utf8");
const chartPageSource = readFileSync(fileURLToPath(new URL("../app/la-so/[id]/page.tsx", import.meta.url)), "utf8");

describe("FreeOverviewLoader seed-only gate", () => {
  it("renders server-projected seed content without polling or background LLM work", () => {
    expect(loaderSource).toContain("<MarkdownContent content={initialOverview.content} />");
    expect(loaderSource).not.toContain("useEffect");
    expect(loaderSource).not.toContain("fetch(");
    expect(loaderSource).not.toContain("/free-overview/process");
    expect(loaderSource).not.toContain("schedulePoll");
    expect(loaderSource).not.toContain("LLM");
  });

  it("keeps insight three and four server-side for guests", () => {
    expect(chartPageSource).toContain("buildFreeOverviewTeaser");
    expect(chartPageSource).toContain("buildFreeOverviewTeaser(freeOverviewStatus.content)");
    expect(chartPageSource).toContain("initialOverview={visibleFreeOverviewStatus}");
    expect(loaderSource).not.toContain("detailContent");
    expect(loaderSource).not.toContain("expandedOverviewContent");
  });

  it("uses the approved login gate copy and tracks the 2/4 funnel depth", () => {
    expect(loaderSource).toContain("Lưu lá số để đọc tiếp 2 phần còn lại");
    expect(loaderSource).toContain("Email mới sẽ tự tạo tài khoản và nhận 30 xu");
    expect(loaderSource).toContain("Đăng nhập hoặc tạo tài khoản");
    expect(loaderSource).toContain("data-ad-view=\"free_insights_viewed\"");
    expect(loaderSource).toContain("data-ad-depth={isSignedIn ? \"4\" : \"2\"}");
    expect(loaderSource).toContain("data-ad-view=\"login_gate_viewed\"");
    expect(loaderSource).toContain("data-ad-click=\"login_gate_clicked\"");
    expect(loaderSource).toContain("Quan hệ và nhịp sống");
    expect(loaderSource).toContain("Vận hiện tại");
  });
});
