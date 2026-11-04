import { randomUUID } from "node:crypto";
import { getCurrentUser, isCheckoutGuestUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { checkAuthRateLimit } from "@/lib/rate-limit";
import { mutateEcosystem, quanEcosystemEnabled, readEcosystem } from "@/lib/tu-vi-quan-ecosystem";
import { getQuanGuest, setQuanGuest } from "@/lib/tu-vi-quan-guest";
import { quanError, quanJson, readQuanBody } from "@/lib/tu-vi-quan-http";

export async function GET() {
  try {
    if (!quanEcosystemEnabled()) return quanJson({ error: "Tính năng chưa mở." }, 503);
    const [guest, user] = await Promise.all([getQuanGuest(), getCurrentUser()]);
    if (!guest) return quanJson({ error: "Hãy nhập bí danh trước." }, 401);
    const db = getDb();
    if (!db) return quanJson({ error: "Chưa kết nối được sổ của quán." }, 503);
    const result = await readEcosystem(db, { guest, userId: user && !isCheckoutGuestUser(user) ? user.id : undefined });
    await setQuanGuest({ id: guest.id, alias: result.profile.alias });
    return quanJson(result);
  } catch (error) { return quanError(error); }
}

export async function POST(request: Request) {
  try {
    if (!quanEcosystemEnabled()) return quanJson({ error: "Tính năng chưa mở." }, 503);
    const body = await readQuanBody(request);
    const restoring = body.action === "recovery_restore";
    const limit = await checkAuthRateLimit(restoring ? "quan-profile-recovery" : "quan-ecosystem-write", request.headers, { limit: restoring ? 8 : 90, windowMs: restoring ? 900_000 : 60_000 });
    if (limit.rateLimited) return quanJson({ error: "Bạn thao tác hơi nhanh. Hãy thử lại sau." }, 429);
    const [cookie, user] = await Promise.all([getQuanGuest(), getCurrentUser()]);
    if (!cookie && !restoring) return quanJson({ error: "Hãy nhập bí danh trước." }, 401);
    const guest = cookie ?? { id: randomUUID(), alias: "Khách" };
    const db = getDb();
    if (!db) return quanJson({ error: "Chưa kết nối được sổ của quán." }, 503);
    const result = await mutateEcosystem(db, { guest, userId: user && !isCheckoutGuestUser(user) ? user.id : undefined }, body);
    if (restoring || body.action === "link" || body.action === "alias") await setQuanGuest({ id: guest.id, alias: result.profile.alias });
    return quanJson(result);
  } catch (error) { return quanError(error); }
}
