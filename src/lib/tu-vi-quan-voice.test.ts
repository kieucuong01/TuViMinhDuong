import { EventEmitter } from "node:events";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ spawn: vi.fn() }));
vi.mock("node:child_process", () => ({ spawn: mocks.spawn }));
vi.mock("@/lib/tu-vi-quan-session", () => ({ QuanSessionError: class extends Error { constructor(message: string, public status: number) { super(message); } } }));
import { normalizeQuanAudio, quanPcmWav, readBoundedAudioForm, streamQuanSpeech, transcribeQuanAudio } from "./tu-vi-quan-voice";

function mockFfmpeg(success = true) {
  mocks.spawn.mockImplementation(() => {
    const child = new EventEmitter() as EventEmitter & { stdin: EventEmitter & { end: () => void }; stdout: EventEmitter; kill: ReturnType<typeof vi.fn> };
    child.stdout = new EventEmitter(); child.stdin = Object.assign(new EventEmitter(), { end: () => queueMicrotask(() => { if (success) { const pcm = Buffer.alloc(6400); for (let i = 0; i < pcm.length; i += 2) pcm.writeInt16LE(1000, i); child.stdout.emit("data", pcm); } child.emit("close", success ? 0 : 1); }) }); child.kill = vi.fn(); return child;
  });
}
beforeEach(() => { vi.stubEnv("GROQ_API_KEYS", "key-first;key-second"); vi.stubEnv("QUAN_VOICE_URL", "http://127.0.0.1:4112"); mockFfmpeg(); });
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("private voice boundaries", () => {
  it("rejects actual multipart bodies above the cap without trusting content-length", async () => {
    const request = new Request("https://example.com", { method: "POST", headers: { "Content-Type": "multipart/form-data; boundary=test" }, body: new Uint8Array(6 * 1024 * 1024 + 8193) });
    await expect(readBoundedAudioForm(request)).rejects.toMatchObject({ status: 413 });
  });
  it("normalizes in memory and refuses silent audio", async () => {
    const pcm = await normalizeQuanAudio(new Uint8Array([1]), new AbortController().signal);
    expect(quanPcmWav(pcm).subarray(0, 4).toString()).toBe("RIFF");
    expect(() => quanPcmWav(Buffer.alloc(6400))).toThrow("Chưa nghe rõ");
    expect(mocks.spawn.mock.calls[0][1]).toContain("pipe:0");
  });
  it("reports ffmpeg failures before any paid provider call", async () => {
    mockFfmpeg(false); const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    await expect(transcribeQuanAudio(new Blob(["bad"], { type: "audio/webm" }), new AbortController().signal)).rejects.toMatchObject({ status: 400 });
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("switches Groq keys on failure and prefers the last working key", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response("", { status: 429 })).mockImplementation(async () => Response.json({ text: "Tôi muốn hỏi về công việc" })); vi.stubGlobal("fetch", fetcher);
    await expect(transcribeQuanAudio(new Blob(["audio"], { type: "audio/webm" }), new AbortController().signal)).resolves.toContain("công việc");
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls.map(call => call[1].headers.Authorization)).toEqual(["Bearer key-first", "Bearer key-second"]);
    await transcribeQuanAudio(new Blob(["audio"], { type: "audio/webm" }), new AbortController().signal);
    expect(fetcher.mock.calls[2][1].headers.Authorization).toBe("Bearer key-second");
  });
  it("proxies stored text and finalizes cancellation without marking service failure", async () => {
    const cancel = vi.fn(); const finish = vi.fn().mockResolvedValue(undefined); const fetcher = vi.fn().mockResolvedValue(new Response(new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array([0, 0])); }, cancel }))); vi.stubGlobal("fetch", fetcher);
    const response = await streamQuanSpeech("Xin chào bạn", new AbortController().signal, finish);
    const reader = response.body!.getReader(); await reader.read(); await reader.cancel();
    expect(finish).toHaveBeenCalledExactlyOnceWith({ failed: false, aborted: true }); expect(cancel).toHaveBeenCalledOnce();
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toMatchObject({ voice: "Hải Đăng", input: "Xin chào bạn" });
  });
  it("blocks non-loopback speech destinations", async () => {
    vi.stubEnv("QUAN_VOICE_URL", "http://evil.example:4112"); const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher); const finish = vi.fn().mockResolvedValue(undefined);
    await expect(streamQuanSpeech("Xin chào", new AbortController().signal, finish)).rejects.toMatchObject({ status: 503 }); expect(fetcher).not.toHaveBeenCalled();
  });
  it("caps streamed speech bytes and marks upstream failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(new Uint8Array(1500002)))); const finish = vi.fn().mockResolvedValue(undefined);
    const response = await streamQuanSpeech("Xin chào", new AbortController().signal, finish);
    await expect(response.arrayBuffer()).rejects.toThrow("đã dừng"); expect(finish).toHaveBeenCalledExactlyOnceWith({ failed: true, aborted: false });
  });
});
