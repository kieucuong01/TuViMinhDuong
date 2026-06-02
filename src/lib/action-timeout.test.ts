import { describe, expect, it } from "vitest";
import { ActionTimeoutError, withActionTimeout } from "@/lib/action-timeout";

describe("withActionTimeout", () => {
  it("returns the task result when it finishes before the timeout", async () => {
    await expect(withActionTimeout("quick-task", 50, async () => "ok")).resolves.toBe("ok");
  });

  it("rejects with a labeled timeout error when the task is too slow", async () => {
    await expect(
      withActionTimeout("createChartAction", 5, () => new Promise((resolve) => setTimeout(resolve, 50))),
    ).rejects.toMatchObject({
      name: "ActionTimeoutError",
      action: "createChartAction",
      timeoutMs: 5,
    });

    await expect(
      withActionTimeout("createChartAction", 5, () => new Promise((resolve) => setTimeout(resolve, 50))),
    ).rejects.toBeInstanceOf(ActionTimeoutError);
  });
});
