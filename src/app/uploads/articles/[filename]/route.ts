import { readFile, stat } from "node:fs/promises";
import { NextResponse } from "next/server";
import { articleUploadContentType, articleUploadFilePath } from "@/lib/article-upload-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;
  const filePath = articleUploadFilePath(filename);
  if (!filePath) return new NextResponse("Not found", { status: 404 });

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) return new NextResponse("Not found", { status: 404 });

    const body = await readFile(filePath);
    return new NextResponse(body, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": String(fileStat.size),
        "Content-Type": articleUploadContentType(filename),
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
