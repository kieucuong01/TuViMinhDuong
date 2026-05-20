import { NextResponse } from "next/server";
import { scoreArticleSeo } from "@/lib/seo";

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json(scoreArticleSeo(body));
}
