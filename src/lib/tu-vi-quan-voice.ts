import { spawn } from "node:child_process";
import { QuanSessionError } from "@/lib/tu-vi-quan-session";

export const QUAN_AUDIO_LIMIT = 6 * 1024 * 1024;
const pcmLimit = 30 * 16000 * 2;
let preferredKey = 0;
let capabilityCache: { until: number; value: { stt: boolean; tts: boolean } } | undefined;

function groqKeys() { return [...new Set((process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY || "").split(/[,;\s]+/).filter(Boolean))]; }
function voiceUrl() {
  try {
    const url = new URL(process.env.QUAN_VOICE_URL || "http://127.0.0.1:4112");
    if (url.protocol !== "http:" || !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname) || url.port !== "4112" || url.username || url.password || url.search || url.hash || url.pathname !== "/") return null;
    return url;
  } catch { return null; }
}
function voiceHeaders(): Record<string, string> {
  return process.env.QUAN_VOICE_API_KEY ? { Authorization: `Bearer ${process.env.QUAN_VOICE_API_KEY}` } : {};
}

export async function quanVoiceCapabilities() {
  if (capabilityCache && capabilityCache.until > Date.now()) return capabilityCache.value;
  const url = voiceUrl();
  const [ffmpeg, worker] = await Promise.all([
    new Promise<boolean>(resolve => { const process = spawn("ffmpeg", ["-version"], { stdio: "ignore", windowsHide: true }); const timer = setTimeout(() => { process.kill(); resolve(false); }, 1500); process.once("error", () => { clearTimeout(timer); resolve(false); }); process.once("close", code => { clearTimeout(timer); resolve(code === 0); }); }),
    url ? fetch(new URL("/health", url), { headers: voiceHeaders(), signal: AbortSignal.timeout(1500), cache: "no-store" }).then(response => response.ok).catch(() => false) : false,
  ]);
  const value = { stt: groqKeys().length > 0 && ffmpeg, tts: worker };
  capabilityCache = { until: Date.now() + 10000, value }; return value;
}

export async function readBoundedAudioForm(request: Request) {
  if (!request.body || !request.headers.get("content-type")?.startsWith("multipart/form-data;")) throw new QuanSessionError("Bản thu không hợp lệ.", 400);
  const limit = QUAN_AUDIO_LIMIT + 8192;
  if (Number(request.headers.get("content-length")) > limit) throw new QuanSessionError("Bản thu quá lớn.", 413);
  const chunks: Uint8Array[] = []; let size = 0; const reader = request.body.getReader();
  try { for (;;) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > limit) { await reader.cancel(); throw new QuanSessionError("Bản thu quá lớn.", 413); } chunks.push(value); } }
  finally { reader.releaseLock(); }
  const data = await new Response(Buffer.concat(chunks), { headers: { "Content-Type": request.headers.get("content-type")! } }).formData().catch(() => { throw new QuanSessionError("Bản thu không hợp lệ.", 400); });
  const id = data.get("id"); const audio = data.get("audio");
  if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id) || !(audio instanceof Blob) || !audio.size || audio.size > QUAN_AUDIO_LIMIT || [...data.keys()].some(key => key !== "id" && key !== "audio") || data.getAll("id").length !== 1 || data.getAll("audio").length !== 1) throw new QuanSessionError("Bản thu không hợp lệ.", 400);
  if (!/^(audio\/(webm|wav|x-wav|wave|ogg|mp4|mpeg|x-m4a)|video\/(webm|mp4))(;.*)?$/i.test(audio.type)) throw new QuanSessionError("Hãy dùng bản thu WAV, WebM, MP4 hoặc Ogg.", 400);
  return { id, audio };
}

export function normalizeQuanAudio(input: Uint8Array, signal: AbortSignal): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const child = spawn("ffmpeg", ["-nostdin", "-v", "error", "-threads", "1", "-protocol_whitelist", "pipe", "-i", "pipe:0", "-vn", "-ac", "1", "-ar", "16000", "-t", "31", "-f", "s16le", "pipe:1"], { stdio: ["pipe", "pipe", "ignore"], windowsHide: true });
    const chunks: Buffer[] = []; let size = 0; let settled = false;
    const finish = (error?: Error) => { if (settled) return; settled = true; clearTimeout(timer); signal.removeEventListener("abort", aborted); if (error) { child.kill("SIGKILL"); reject(error); } else resolve(Buffer.concat(chunks)); };
    const aborted = () => finish(new QuanSessionError("Đã dừng thu âm.", 499));
    const timer = setTimeout(() => finish(new QuanSessionError("Bản thu xử lý quá lâu. Bạn thử nói ngắn hơn nhé.", 504)), 10000);
    child.once("error", () => finish(new QuanSessionError("Thu âm đang tạm nghỉ.", 503)));
    child.stdin.on("error", () => {});
    child.stdout.on("data", (chunk: Buffer) => { size += chunk.length; if (size > pcmLimit) finish(new QuanSessionError("Mỗi câu nói tối đa 30 giây.", 413)); else chunks.push(chunk); });
    child.once("close", code => { if (code !== 0 || !size || size % 2) finish(new QuanSessionError("Không đọc được bản thu. Bạn thử lại nhé.", 400)); else finish(); });
    signal.addEventListener("abort", aborted, { once: true });
    if (signal.aborted) aborted(); else child.stdin.end(input);
  });
}

export function quanPcmWav(pcm: Buffer) {
  let energy = 0; for (let index = 0; index < pcm.length; index += 2) energy += (pcm.readInt16LE(index) / 32768) ** 2;
  if (pcm.length < 3200 || Math.sqrt(energy / (pcm.length / 2)) < .002) throw new QuanSessionError("Chưa nghe rõ lời nói. Bạn nói gần micro hơn nhé.", 400);
  const header = Buffer.alloc(44); header.write("RIFF"); header.writeUInt32LE(36 + pcm.length, 4); header.write("WAVEfmt ", 8); header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22); header.writeUInt32LE(16000, 24); header.writeUInt32LE(32000, 28); header.writeUInt16LE(2, 32); header.writeUInt16LE(16, 34); header.write("data", 36); header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

export async function transcribeQuanAudio(audio: Blob, signal: AbortSignal) {
  const keys = groqKeys(); if (!keys.length) throw new QuanSessionError("Thu âm đang tạm nghỉ. Bạn có thể gõ câu hỏi.", 503);
  const wav = quanPcmWav(await normalizeQuanAudio(new Uint8Array(await audio.arrayBuffer()), signal));
  const start = preferredKey % keys.length;
  for (let attempt = 0; attempt < Math.min(2, keys.length); attempt++) {
    if (signal.aborted) throw new QuanSessionError("Đã dừng thu âm.", 499);
    const form = new FormData(); form.set("file", new Blob([new Uint8Array(wav)], { type: "audio/wav" }), "question.wav"); form.set("model", "whisper-large-v3-turbo"); form.set("language", "vi"); form.set("response_format", "json");
    const keyIndex = (start + attempt) % keys.length;
    try {
      const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", { method: "POST", headers: { Authorization: `Bearer ${keys[keyIndex]}` }, body: form, signal: AbortSignal.any([signal, AbortSignal.timeout(8000)]), cache: "no-store" });
      if (!response.ok) { await response.body?.cancel(); continue; }
      const data = await response.json(); const text = typeof data.text === "string" ? data.text.trim() : "";
      if (!text || text.length > 1200) throw new QuanSessionError("Chưa nghe rõ câu hỏi. Bạn thử nói lại nhé.", 400);
      preferredKey = keyIndex;
      return text;
    } catch (error) { if (error instanceof QuanSessionError) throw error; if (signal.aborted) throw new QuanSessionError("Đã dừng thu âm.", 499); }
  }
  throw new QuanSessionError("Chưa nhận được lời nói. Bạn có thể gõ câu hỏi hoặc thử lại.", 503);
}

export async function streamQuanSpeech(text: string, signal: AbortSignal, finished: (result: { failed: boolean; aborted: boolean }) => Promise<unknown>) {
  const url = voiceUrl(); if (!url || !text.trim() || text.length > 900) { await finished({ failed: true, aborted: false }); throw new QuanSessionError("Giọng đọc đang tạm nghỉ.", 503); }
  const upstream = new AbortController();
  let settled = false; let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  const finish = async (failed: boolean, aborted: boolean) => { if (settled) return; settled = true; clearTimeout(timer); signal.removeEventListener("abort", abort); upstream.abort(); await reader?.cancel().catch(() => {}); await finished({ failed, aborted }); };
  const abort = () => { void finish(false, true).catch(() => {}); };
  signal.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(() => { void finish(true, false).catch(() => {}); }, 30000);
  try {
    if (signal.aborted) { await finish(false, true); throw new QuanSessionError("Đã dừng lời đọc.", 499); }
    const response = await fetch(new URL("/v1/audio/speech", url), { method: "POST", headers: { ...voiceHeaders(), "Content-Type": "application/json" }, body: JSON.stringify({ input: text, voice: "Hải Đăng", response_format: "pcm", sample_rate: 24000, stream_format: "audio" }), signal: upstream.signal, cache: "no-store" });
    if (!response.ok || !response.body) { await response.body?.cancel(); throw new QuanSessionError("Giọng đọc đang bận. Bạn có thể đọc phụ đề.", 503); }
    reader = response.body.getReader(); let size = 0;
    const body = new ReadableStream<Uint8Array>({
      async pull(controller) {
        try {
          const { done, value } = await reader!.read();
          if (settled) { controller.close(); return; }
          if (done) { if (!size || size % 2) throw new Error("Invalid PCM"); await finish(false, false); controller.close(); return; }
          size += value.length; if (size > 1500000) throw new Error("PCM limit"); controller.enqueue(value);
        } catch { await finish(!signal.aborted, signal.aborted); controller.error(new Error("Lời đọc đã dừng.")); }
      },
      async cancel() { await finish(false, true); },
    });
    return new Response(body, { headers: { "Content-Type": "audio/pcm", "X-Sample-Rate": "24000", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch (error) { await finish(!signal.aborted, signal.aborted); if (error instanceof QuanSessionError) throw error; throw new QuanSessionError("Giọng đọc đang tạm nghỉ. Bạn có thể đọc phụ đề.", 503); }
}
