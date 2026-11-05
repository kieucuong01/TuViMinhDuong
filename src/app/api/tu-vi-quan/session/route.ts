import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { quanEcosystemEnabled, resolveQuanOwners } from "@/lib/tu-vi-quan-ecosystem";
import { checkAuthRateLimit } from "@/lib/rate-limit";
import { getQuanGuest, setQuanGuest } from "@/lib/tu-vi-quan-guest";
import { quanError, quanJson, readQuanBody } from "@/lib/tu-vi-quan-http";
import { refreshQuanPayment } from "@/lib/tu-vi-quan-payment";
import { quanVoiceGameEnabled } from "@/lib/tu-vi-quan-encounter";
import { quanVoiceCapabilities } from "@/lib/tu-vi-quan-voice";
import {
  answerQuanTurn, changeQuanAdmission, checkoutQuanSession, quanTransaction,
  QuanSessionError, readQuanSession, reissueQuanRecoveryCode, restoreQuanSession,
} from "@/lib/tu-vi-quan-session";

const orderIdPattern = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const turnIdPattern = /^[A-Za-z0-9_-]{8,80}$/;

export async function GET(request: Request) {
  try {
    const guest = await getQuanGuest();
    if (!guest) return quanJson({ session: null });
    const id = new URL(request.url).searchParams.get("id");
    if (id && !orderIdPattern.test(id)) throw new QuanSessionError("Không tìm thấy lượt xem.", 404);
    const db = getDb();
    if (!db) return quanJson({ session: null });
    const owners = await resolveQuanOwners(db, guest.id, quanEcosystemEnabled() ? (await getCurrentUser())?.id : undefined);
    const order = await db.quanOrder.findFirst({
      where: { ownerId: { in: owners }, ...(id ? { id } : {}) },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });
    if (!order) {
      if (id) throw new QuanSessionError("Không tìm thấy lượt xem.", 404);
      return quanJson({ session: null });
    }
    await refreshQuanPayment(db, order);
    return quanJson(await quanTransaction(db, (tx, now) => readQuanSession(tx, order.ownerId, order.id, now)));
  } catch (error) {
    return quanError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await readQuanBody(request);
    const db = getDb();
    if (!db) throw new QuanSessionError("Tử Vi Quán chưa mở phiên xem.", 503);
    const guest = await getQuanGuest();
    if (body.action === "restore") {
      const limit = await checkAuthRateLimit("quan-restore", request.headers, { limit: 8, windowMs: 15 * 60_000 });
      if (limit.rateLimited) throw new QuanSessionError("Bạn hãy đợi rồi thử khôi phục lại.", 429);
      const code = typeof body.code === "string" ? body.code.trim() : "";
      if (!/^[A-Za-z0-9_-]{32}$/.test(code)) throw new QuanSessionError("Mã khôi phục không hợp lệ.", 400);
      const owner = guest ?? { id: randomUUID(), alias: "Khách" };
      const restored = await restoreQuanSession(db, owner, code);
      if (!guest) await setQuanGuest(owner);
      return quanJson(restored);
    }
    if (!guest) throw new QuanSessionError("Hãy nhập bí danh trước khi xem.", 401);
    if (body.action === "checkout") {
      if (quanVoiceGameEnabled() && process.env.NODE_ENV === "production") {
        const voice = await quanVoiceCapabilities();
        if (!voice.stt || !voice.tts) throw new QuanSessionError("Bàn thoại đang tạm nghỉ.", 503);
      }
      const limit = await checkAuthRateLimit("quan-checkout", request.headers, { limit: 12, windowMs: 15 * 60_000 });
      if (limit.rateLimited) throw new QuanSessionError("Bạn đã tạo nhiều đơn. Hãy đợi rồi thử lại.", 429);
      const kind = body.readingKind;
      if (kind !== undefined && kind !== "tuvi" && kind !== "tarot" && kind !== "iching") throw new QuanSessionError("Bàn xem không hợp lệ.", 400);
      let chart = body.chart;
      if (quanVoiceGameEnabled() && (kind === undefined || kind === "tuvi")) {
        const owners = await resolveQuanOwners(db, guest.id, (await getCurrentUser())?.id);
        const identity = await db.quanIdentity.findFirst({ where: { guestId: { in: owners } }, select: { profile: { select: { birthInput: true } } } });
        chart = identity?.profile.birthInput;
        if (!chart) throw new QuanSessionError("Con hãy gặp Thầy lập lá số trước khi mua thêm phút.", 400);
      }
      return quanJson(await checkoutQuanSession(db, guest, body.minutes, chart, quanVoiceGameEnabled() ? kind : undefined));
    }
    const { id, action } = body;
    if (quanVoiceGameEnabled() && process.env.NODE_ENV === "production" && (action === "start" || action === "chat")) {
      throw new QuanSessionError("Hãy vào bàn trò chuyện để dùng phiên này.", 409);
    }
    if (typeof id !== "string" || !orderIdPattern.test(id)) throw new QuanSessionError("Không tìm thấy lượt xem.", 404);
    const owners = await resolveQuanOwners(db, guest.id, quanEcosystemEnabled() ? (await getCurrentUser())?.id : undefined);
    const order = await db.quanOrder.findFirst({ where: { id, ownerId: { in: owners } }, select: { ownerId: true } });
    if (!order) throw new QuanSessionError("Không tìm thấy lượt xem.", 404);
    if (action === "reissue") return quanJson(await reissueQuanRecoveryCode(db, order.ownerId, id));
    if (action === "join" || action === "leave" || action === "start") {
      return quanJson(await changeQuanAdmission(db, order.ownerId, id, action));
    }
    if (action === "chat") {
      const question = typeof body.question === "string" ? body.question.trim() : "";
      const turnId = typeof body.turnId === "string" ? body.turnId : "";
      if (!question || question.length > 1200 || !turnIdPattern.test(turnId)) {
        throw new QuanSessionError("Hãy nhập câu hỏi tối đa 1.200 ký tự.", 400);
      }
      return quanJson(await answerQuanTurn(db, order.ownerId, id, turnId, question));
    }
    throw new QuanSessionError("Yêu cầu không hợp lệ.", 400);
  } catch (error) {
    return quanError(error);
  }
}
