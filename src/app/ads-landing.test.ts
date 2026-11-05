import { describe, expect, it, vi } from "vitest";
import ChartEntry, { metadata } from "./lap-la-so/page";

vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(url); } }));

describe("legacy chart entry into the game", () => {
  it("sends customers to the Tu Vi host while keeping campaign attribution and dropping arbitrary redirects", async () => {
    await expect(ChartEntry({ searchParams: Promise.resolve({ gclid: "test-click", source: "date_finder", next: "https://other.test", birth: "private", utm_source: ["a", "b"] }) })).rejects.toThrow("/?visit=tuvi&source=date_finder&gclid=test-click");
    expect(metadata.robots).toMatchObject({ index: false });
    expect(metadata.alternates?.canonical).toBe("/");
  });
});