import { NextResponse } from "next/server";
import { getQuanGuest } from "@/lib/tu-vi-quan-guest";
import { issueQuanSocketTicket, quanPresenceSecret } from "@/lib/tu-vi-quan-presence.mjs";

const privateResponse = { "Cache-Control": "private, no-store" };

export async function GET(request: Request) {
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") {
    return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 403, headers: privateResponse });
  }
  const guest = await getQuanGuest();
  if (!guest) {
    return NextResponse.json({ error: "Nhập bí danh để vào quán." }, { status: 401, headers: privateResponse });
  }
  const secret = quanPresenceSecret();
  if (!secret) {
    return NextResponse.json({ error: "Sân quán đang bảo trì." }, { status: 503, headers: privateResponse });
  }
  return NextResponse.json({ ticket: issueQuanSocketTicket(guest, secret) }, { headers: privateResponse });
}
