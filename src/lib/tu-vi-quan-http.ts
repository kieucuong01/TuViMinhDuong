import { isQuanSameOrigin } from "@/lib/tu-vi-quan-guest";
import { QuanSessionError } from "@/lib/tu-vi-quan-session";

export function quanJson(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

export function quanError(error: unknown) {
  if (error instanceof QuanSessionError) return quanJson({ error: error.message }, error.status);
  return quanJson({ error: "Tử Vi Quán đang bận. Bạn vui lòng thử lại." }, 503);
}

export async function readQuanBody(request: Request): Promise<Record<string, unknown>> {
  if (!isQuanSameOrigin(request)) {
    throw new QuanSessionError("Yêu cầu không hợp lệ.", 403);
  }
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json") || !request.body) {
    throw new QuanSessionError("Yêu cầu không hợp lệ.", 400);
  }
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let body = "";
  for (;;) {
    const chunk = await reader.read();
    if (chunk.done) break;
    size += chunk.value.byteLength;
    if (size > 8192) {
      void reader.cancel().catch(() => {});
      throw new QuanSessionError("Nội dung quá dài.", 413);
    }
    body += decoder.decode(chunk.value, { stream: true });
  }
  try {
    const value = JSON.parse(body + decoder.decode());
    if (value && typeof value === "object" && !Array.isArray(value)) return value;
  } catch {
    // Match the error for an unsupported JSON shape.
  }
  throw new QuanSessionError("Yêu cầu không hợp lệ.", 400);
}
