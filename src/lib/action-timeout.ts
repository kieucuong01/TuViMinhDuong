export class ActionTimeoutError extends Error {
  action: string;
  timeoutMs: number;

  constructor(action: string, timeoutMs: number) {
    super(`${action} timed out after ${timeoutMs}ms`);
    this.name = "ActionTimeoutError";
    this.action = action;
    this.timeoutMs = timeoutMs;
  }
}

export async function withActionTimeout<T>(action: string, timeoutMs: number, task: () => Promise<T> | T): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      Promise.resolve().then(task),
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new ActionTimeoutError(action, timeoutMs)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
