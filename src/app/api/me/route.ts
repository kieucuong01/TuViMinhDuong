import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { TEMPORARY_FULL_ACCESS } from "@/lib/pricing";

export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({
    user,
    temporaryFullAccess: TEMPORARY_FULL_ACCESS,
  });
}
