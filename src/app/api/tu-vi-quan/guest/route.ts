import { randomUUID } from "node:crypto";
import { getQuanGuest, normalizeQuanAlias, setQuanGuest } from "@/lib/tu-vi-quan-guest";
import { quanError, quanJson, readQuanBody } from "@/lib/tu-vi-quan-http";

const attempts = new Map<string, { until: number; count: number }>();
const windowMs = 5000;

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try { body = await readQuanBody(request); }
  catch (error) { return quanError(error); }
  const alias = normalizeQuanAlias(body.alias);
  if (!alias) return quanJson({ error: "Bí danh cần từ 2 đến 24 ký tự, gồm chữ, số, dấu cách, gạch ngang hoặc gạch dưới." }, 400);
  const existing = await getQuanGuest();
  if (!existing) {
    const now = Date.now();
    for (const [key, item] of attempts) if (item.until <= now) attempts.delete(key);
    const ip = request.headers.get("x-real-ip") || "local";
    const attempt = attempts.get(ip);
    if (attempts.size >= 1024 || (attempt?.count ?? 0) >= 5) {
      return quanJson({ error: "Vui lòng thử lại sau vài giây." }, 429);
    }
    attempts.set(ip, { until: attempt?.until ?? now + windowMs, count: (attempt?.count ?? 0) + 1 });
  }
  if (!process.env.AUTH_SECRET) return quanJson({ error: "Quán chưa sẵn sàng." }, 503);
  await setQuanGuest({ id: existing?.id || randomUUID(), alias });
  return quanJson({ alias });
}
