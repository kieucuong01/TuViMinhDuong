import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { quanError, quanJson, readQuanBody } from "@/lib/tu-vi-quan-http";
import { getQuanCapacity, quanTransaction, QuanSessionError, reconcileQueue } from "@/lib/tu-vi-quan-session";

const orderFields = {
  id: true, orderCode: true, status: true, minutes: true, amountVnd: true, paidAt: true,
  refundAmountVnd: true, refundSettledAt: true, createdAt: true,
} as const;

export async function GET() {
  try {
    if ((await getCurrentUser())?.role !== "ADMIN") return quanJson({ error: "Cần quyền quản trị." }, 403);
    const db = getDb();
    if (!db) throw new QuanSessionError("Chưa kết nối dữ liệu.", 503);
    await quanTransaction(db, reconcileQueue);
    const [maxTables, refunds, recent] = await Promise.all([
      getQuanCapacity(db),
      db.quanOrder.findMany({
        where: { status: "REFUND", refundSettledAt: null },
        orderBy: { createdAt: "asc" },
        select: orderFields,
      }),
      db.quanOrder.findMany({
        where: { NOT: { status: "REFUND", refundSettledAt: null } },
        orderBy: { createdAt: "desc" },
        take: 100,
        select: orderFields,
      }),
    ]);
    return quanJson({ maxTables, orders: [...refunds, ...recent].map((order) => ({
      ...order, orderCode: String(order.orderCode), status: order.status.toLowerCase(),
    })) });
  } catch (error) {
    return quanError(error);
  }
}

export async function POST(request: Request) {
  try {
    if ((await getCurrentUser())?.role !== "ADMIN") return quanJson({ error: "Cần quyền quản trị." }, 403);
    const body = await readQuanBody(request);
    const db = getDb();
    if (!db) throw new QuanSessionError("Chưa kết nối dữ liệu.", 503);
    const { maxTables, refundOrderId } = body;
    if (typeof maxTables === "number" && Number.isInteger(maxTables) && maxTables >= 0 && maxTables <= 3) {
      await quanTransaction(db, async (tx) => {
        await tx.quanSettings.upsert({ where: { id: "global" }, create: { id: "global", maxTables }, update: { maxTables } });
      });
      return quanJson({ maxTables });
    }
    if (typeof refundOrderId === "string" && refundOrderId.length <= 64) {
      const refund = await db.quanOrder.updateMany({
        where: { id: refundOrderId, status: "REFUND", refundSettledAt: null },
        data: { refundSettledAt: new Date() },
      });
      if (!refund.count) throw new QuanSessionError("Không tìm thấy yêu cầu hoàn tiền đang chờ.", 404);
      return quanJson({ ok: true });
    }
    throw new QuanSessionError("Thông tin quản trị không hợp lệ.", 400);
  } catch (error) {
    return quanError(error);
  }
}
