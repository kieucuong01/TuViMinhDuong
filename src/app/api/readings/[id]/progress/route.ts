import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getReadingJobById, saveReadingProgress } from "@/lib/data";
import { parseReadingProgressInput } from "@/lib/reading-progress";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { id } = await params;
  const reading = await getReadingJobById(user.id, id);
  if (!reading || reading.type !== "FULL" || reading.status !== "COMPLETED") {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const input = parseReadingProgressInput(await request.json().catch(() => null));
  if (!input) {
    return NextResponse.json({ error: "INVALID_PROGRESS" }, { status: 400 });
  }

  const progress = await saveReadingProgress(user.id, reading.id, input);
  return NextResponse.json({ progress });
}
