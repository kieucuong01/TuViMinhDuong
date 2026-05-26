import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getOperationSettings } from "@/lib/data";
import { TEMPORARY_FULL_ACCESS } from "@/lib/pricing";

export async function GET() {
  const [user, operationSettings] = await Promise.all([getCurrentUser(), getOperationSettings()]);
  return NextResponse.json({
    user,
    temporaryFullAccess: TEMPORARY_FULL_ACCESS,
    operationSettings,
  });
}
