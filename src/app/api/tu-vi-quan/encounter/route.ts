import { getCurrentUser, isCheckoutGuestUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { checkAuthRateLimit } from "@/lib/rate-limit";
import { answerEncounter, captureEncounterBirth, changeEncounter, quanVoiceGameEnabled, readEncounter } from "@/lib/tu-vi-quan-encounter";
import { getQuanGuest } from "@/lib/tu-vi-quan-guest";
import { quanError, quanJson, readQuanBody } from "@/lib/tu-vi-quan-http";
import { QuanSessionError } from "@/lib/tu-vi-quan-session";
import { quanVoiceCapabilities } from "@/lib/tu-vi-quan-voice";

async function context() {
  if (!quanVoiceGameEnabled()) throw new QuanSessionError("Trò chuyện bằng giọng nói chưa mở.", 503);
  const [guest, user] = await Promise.all([getQuanGuest(), getCurrentUser()]);
  if (!guest) throw new QuanSessionError("Hãy nhập bí danh trước khi trò chuyện.", 401);
  const db = getDb();
  if (!db) throw new QuanSessionError("Quán đang tạm nghỉ.", 503);
  return { db, actor: { guest, userId: user && !isCheckoutGuestUser(user) ? user.id : undefined } };
}

export async function GET() {
  try {
    const { db, actor } = await context();
    const [view, capabilities] = await Promise.all([readEncounter(db, actor), quanVoiceCapabilities()]);
    return quanJson({ ...view, capabilities });
  } catch (error) { return quanError(error); }
}

export async function POST(request: Request) {
  try {
    const body = await readQuanBody(request);
    const { db, actor } = await context();
    const limit = await checkAuthRateLimit("quan-encounter", request.headers, { limit: 60, windowMs: 60_000 });
    if (limit.rateLimited) throw new QuanSessionError("Bạn thao tác hơi nhanh. Hãy thử lại sau.", 429);
    const capabilities = await quanVoiceCapabilities();
    const view = body.action === "turn" ? await answerEncounter(db, actor, body)
      : body.action === "birth_capture" ? await captureEncounterBirth(db, actor, body)
        : await changeEncounter(db, actor, body);
    return quanJson({ ...view, capabilities });
  } catch (error) { return quanError(error); }
}
