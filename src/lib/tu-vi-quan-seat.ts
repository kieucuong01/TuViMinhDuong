import "server-only";
import { quanPresenceId, quanPresenceSecret, quanSeatCheckToken } from "@/lib/tu-vi-quan-presence.mjs";
import { QuanSessionError } from "@/lib/tu-vi-quan-session";

export async function requireQuanMonasterySeat(guestId: string) {
  const secret = quanPresenceSecret();
  const id = quanPresenceId(guestId, secret);
  const port = process.env.NODE_ENV === "production" ? 4101 : 4001;
  const response = await fetch(`http://127.0.0.1:${port}/monastery-seat/${id}`, {
    headers: { Authorization: "Bearer " + quanSeatCheckToken(secret) },
    cache: "no-store", signal: AbortSignal.timeout(1500),
  }).catch(() => null);
  if (!response?.ok) throw new QuanSessionError(response?.status === 409 ? "Bạn cần chọn đệm trống trong Tu viện trước khi thực hành." : "Đang kết nối chỗ ngồi. Bạn thử lại sau nhé.", response?.status === 409 ? 409 : 503);
}
