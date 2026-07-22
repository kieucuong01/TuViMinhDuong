import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const dateViewSource = readFileSync(fileURLToPath(new URL("./date-view.tsx", import.meta.url)), "utf8");
const purposePageSource = readFileSync(fileURLToPath(new URL("../app/xem-ngay/[purpose]/page.tsx", import.meta.url)), "utf8");
const articlePageSource = readFileSync(fileURLToPath(new URL("./article-page-content.tsx", import.meta.url)), "utf8");

describe("SEO page markup", () => {
  it("keeps one visible H1 on purpose-specific date pages", () => {
    expect(dateViewSource).toContain("showPageHeading?: boolean");
    expect(dateViewSource).toContain("showPageHeading = true");
    expect(dateViewSource).toContain("showPageHeading ?");
    expect(purposePageSource).toContain("showPageHeading={false}");
  });

  it("shows the latest article date when content was updated", () => {
    expect(articlePageSource).toContain("const displayDate = article.updatedAt || article.publishedAt");
    expect(articlePageSource).toContain("displayDate ?");
    expect(articlePageSource).toContain("new Date(displayDate)");
  });
});
