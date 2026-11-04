import { getCurrentUser, isCheckoutGuestUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { checkAuthRateLimit } from "@/lib/rate-limit";
import { authorizeEncounter, quanVoiceGameEnabled } from "@/lib/tu-vi-quan-encounter";
import { getQuanGuest, isQuanSameOrigin } from "@/lib/tu-vi-quan-guest";
import { quanError, quanJson } from "@/lib/tu-vi-quan-http";
import { QuanSessionError } from "@/lib/tu-vi-quan-session";
import { readBoundedAudioForm, transcribeQuanAudio } from "@/lib/tu-vi-quan-voice";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!quanVoiceGameEnabled()) throw new QuanSessionError("Trò chuyện bằng giọng nói chưa mở.", 503);
    if (!isQuanSameOrigin(request)) throw new QuanSessionError("Yêu cầu không hợp lệ.", 403);
    const [guest, user] = await Promise.all([getQuanGuest(), getCurrentUser()]);
    if (!guest) throw new QuanSessionError("Hãy nhập bí danh trước khi trò chuyện.", 401);
    const db = getDb(); if (!db) throw new QuanSessionError("Quán đang tạm nghỉ.", 503);
    const limit = await checkAuthRateLimit("quan-voice-transcribe", request.headers, { limit: 15, windowMs: 60000 });
    if (limit.rateLimited) throw new QuanSessionError("Bạn nói chậm lại một chút nhé.", 429);
    const { id, audio } = await readBoundedAudioForm(request);
    const actor = { guest, userId: user && !isCheckoutGuestUser(user) ? user.id : undefined };
    await authorizeEncounter(db, actor, id);
    const text = await transcribeQuanAudio(audio, request.signal);
    return quanJson({ text });
  } catch (error) { return quanError(error); }
}
