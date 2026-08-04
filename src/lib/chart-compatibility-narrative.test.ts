import { describe, expect, it } from "vitest";
import { selectStableVariant } from "@/lib/chart-compatibility-narrative";

describe("compatibility narrative selector", () => {
  it("selects the same variant for the same seed", () => {
    const variants = [
      { family: "scene-first", value: "a" },
      { family: "contrast-first", value: "b" },
      { family: "need-first", value: "c" },
    ];

    expect(selectStableVariant(variants, "finance:minh:an", new Set())).toEqual(
      selectStableVariant(variants, "finance:minh:an", new Set()),
    );
  });

  it("moves to an unused family when the preferred family is already present", () => {
    const used = new Set(["scene-first"]);
    const result = selectStableVariant(
      [
        { family: "scene-first", value: "a" },
        { family: "contrast-first", value: "b" },
      ],
      "communication:minh:an",
      used,
    );

    expect(result.family).toBe("contrast-first");
  });
});
