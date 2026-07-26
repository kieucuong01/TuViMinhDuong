import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(fileURLToPath(new URL("./page.tsx", import.meta.url)), "utf8");

describe("coin top-up page", () => {
  it("redirects checkout guest accounts before rendering top-up content", () => {
    expect(source).toContain('import { redirect } from "next/navigation"');
    expect(source).toContain("if (isCheckoutGuestUser(user)) redirect(");
    expect(source.indexOf("if (isCheckoutGuestUser(user))"))
      .toBeLessThan(source.indexOf("return ("));
  });
});
