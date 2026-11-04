import { getCurrentUser, isCheckoutGuestUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { checkAuthRateLimit } from "@/lib/rate-limit";
import { finishEncounterSpeech, getEncounterSpeech, quanVoiceGameEnabled } from "@/lib/tu-vi-quan-encounter";
import { getQuanGuest } from "@/lib/tu-vi-quan-guest";
import { quanError, readQuanBody } from "@/lib/tu-vi-quan-http";
import { QuanSessionError } from "@/lib/tu-vi-quan-session";
import { streamQuanSpeech } from "@/lib/tu-vi-quan-voice";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!quanVoiceGameEnabled()) throw new QuanSessionError("Trò chuyện bằng giọng nói chưa mở.", 503);
    const body = await readQuanBody(request);
    if (typeof body.id !== "string" || !/^[0-9a-f-]{36}$/i.test(body.id) || typeof body.turnId !== "string" || !/^[A-Za-z0-9_-]{1,80}$/.test(body.turnId) || Object.keys(body).some(key => key !== "id" && key !== "turnId")) throw new QuanSessionError("Không tìm thấy lời đọc.", 400);
    const [guest, user] = await Promise.all([getQuanGuest(), getCurrentUser()]);
    if (!guest) throw new QuanSessionError("Hãy nhập bí danh trước khi trò chuyện.", 401);
    const db = getDb(); if (!db) throw new QuanSessionError("Quán đang tạm nghỉ.", 503);
    const limit = await checkAuthRateLimit("quan-voice-speak", request.headers, { limit: 18, windowMs: 60000 });
    if (limit.rateLimited) throw new QuanSessionError("Bạn đợi thầy nói xong một chút nhé.", 429);
    const actor = { guest, userId: user && !isCheckoutGuestUser(user) ? user.id : undefined };
    const id = body.id;
    const speech = await getEncounterSpeech(db, actor, id, body.turnId);
    return await streamQuanSpeech(speech.text, request.signal, result => finishEncounterSpeech(db, actor, id, result, speech.speakingUntil));
  } catch (error) { return quanError(error); }
}
