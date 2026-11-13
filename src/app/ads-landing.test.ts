import { describe, expect, it, vi } from "vitest";
import ChartEntry, { metadata } from "./lap-la-so/page";

vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(url); } }));

describe("chart form entry", () => {
  it("sends customers to the homepage form while keeping campaign attribution and dropping arbitrary redirects", async () => {
    await expect(ChartEntry({ searchParams: Promise.resolve({ gclid: "test-click", source: "date_finder", next: "https://other.test", birth: "private", utm_source: ["a", "b"] }) })).rejects.toThrow("/?source=date_finder&gclid=test-click#lap-la-so");
    expect(metadata.robots).toMatchObject({ index: false });
    expect(metadata.alternates?.canonical).toBe("/");
  });
});
