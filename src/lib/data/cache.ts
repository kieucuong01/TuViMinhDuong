import { unstable_cache } from "next/cache";

export function cacheServerData<T extends (...args: never[]) => Promise<unknown>>(
  reader: T,
  keyParts: string[],
  options: { tags: string[]; revalidate: number },
) {
  if (process.env.NODE_ENV === "test") return reader;
  return unstable_cache(reader as unknown as Parameters<typeof unstable_cache>[0], keyParts, options) as unknown as T;
}
