import { NextResponse } from "next/server";
import { signInWithMagicToken } from "@/lib/auth";

function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") || "";
  const next = safeNext(url.searchParams.get("next"));
  const user = await signInWithMagicToken(token);
  if (!user) {
    return NextResponse.redirect(new URL(`/dang-nhap?next=${encodeURIComponent(next)}&error=${encodeURIComponent("Link truy cập đã hết hạn hoặc không hợp lệ.")}`, url.origin));
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
