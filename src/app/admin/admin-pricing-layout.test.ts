import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const adminPageSource = readFileSync(fileURLToPath(new URL("./page.tsx", import.meta.url)), "utf8");
const actionsSource = readFileSync(fileURLToPath(new URL("../actions.ts", import.meta.url)), "utf8");

describe("admin pricing editor layout", () => {
  it("renders the pricing tab as an editable admin form", () => {
    expect(adminPageSource).toContain("saveFeaturePricesAction");
    expect(adminPageSource).toContain("data-testid=\"admin-pricing-form\"");
    expect(adminPageSource).toContain("priceCoins:${key}");
    expect(adminPageSource).toContain("admin-pricing-input");
  });

  it("has a server action dedicated to saving feature prices", () => {
    expect(actionsSource).toContain("export async function saveFeaturePricesAction");
    expect(actionsSource).toContain("updateFeaturePrices");
    expect(actionsSource).toContain("pricingSaved=1");
  });
});
