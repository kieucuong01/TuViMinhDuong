import { open } from "node:fs/promises";

export const dynamic = "force-dynamic";

export async function GET() {
  const path = process.env.TU_VI_QUAN_SUPPORT_QR_FILE?.trim();
  if (!path || !process.env.TU_VI_QUAN_SUPPORT_RECIPIENT?.trim()) return new Response(null, { status: 404 });
  const file = await open(path, "r").catch(() => null);
  if (!file) return new Response(null, { status: 404 });
  try {
    const stat = await file.stat();
    if (!stat.isFile() || stat.size > 1_000_000) return new Response(null, { status: 404 });
    const image = await file.readFile();
    if (image[0] !== 0xff || image[1] !== 0xd8 || image[2] !== 0xff) return new Response(null, { status: 404 });
    return new Response(new Uint8Array(image), { headers: {
      "Content-Type": "image/jpeg", "Content-Disposition": 'inline; filename="tu-vi-quan-ung-ho.jpg"',
      "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "X-Robots-Tag": "noindex",
    } });
  } catch {
    return new Response(null, { status: 404 });
  } finally {
    await file.close();
  }
}
