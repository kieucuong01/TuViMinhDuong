import { describe, expect, it, vi } from "vitest";
import { decodePcm16, playPcmStream } from "./tu-vi-quan-audio";

describe("encounter PCM playback", () => {
  it("decodes signed little endian PCM", () => {
    expect([...decodePcm16(new Uint8Array([0, 128, 255, 127, 0, 0]))]).toEqual([-1, 32767 / 32768, 0]);
  });
  it("starts before stream finishes and preserves split samples", async () => {
    const samples: number[][] = [];
    let finish!: () => void;
    let first!: () => void;
    const started = new Promise<void>(resolve => { first = resolve; });
    const response = new Response(new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array([0, 128, 255])); finish = () => { controller.enqueue(new Uint8Array([127])); controller.close(); }; } }), { headers: { "X-Sample-Rate": "24000" } });
    const context = {
      currentTime: 0, destination: {},
      createAnalyser: () => ({ fftSize: 256, connect: vi.fn(), disconnect: vi.fn(), getFloatTimeDomainData: vi.fn() }),
      createBuffer: (_channels: number, count: number, rate: number) => ({ duration: count / rate, copyToChannel: (values: Float32Array) => samples.push([...values]) }),
      createBufferSource: () => { const source = { buffer: null, connect: vi.fn(), stop: vi.fn(), onended: null as null | (() => void), start: () => { first(); queueMicrotask(() => source.onended?.()); } }; return source; },
    } as unknown as AudioContext;
    const playing = playPcmStream(response, context, new AbortController().signal, new Set(), vi.fn());
    await started;
    expect(samples).toEqual([[-1]]);
    finish(); await playing;
    expect(samples).toEqual([[-1], [32767 / 32768]]);
  });
  it("rejects empty audio instead of pretending speech played", async () => {
    const context = { currentTime: 0, destination: {}, createAnalyser: () => ({ fftSize: 256, connect: vi.fn(), disconnect: vi.fn(), getFloatTimeDomainData: vi.fn() }) } as unknown as AudioContext;
    await expect(playPcmStream(new Response(new Uint8Array()), context, new AbortController().signal, new Set(), vi.fn())).rejects.toThrow("chưa phát được tiếng");
  });
  it("cancels queued audio and an unfinished response on interruption", async () => {
    const cancel = vi.fn(); const stop = vi.fn();
    const controller = new AbortController(); const sources = new Set<AudioBufferSourceNode>();
    let first!: () => void; const started = new Promise<void>(resolve => { first = resolve; });
    const source = { buffer: null, connect: vi.fn(), stop, onended: null, start: first };
    const context = { currentTime: 0, destination: {}, createAnalyser: () => ({ fftSize: 256, connect: vi.fn(), disconnect: vi.fn(), getFloatTimeDomainData: vi.fn() }), createBuffer: () => ({ duration: .1, copyToChannel: vi.fn() }), createBufferSource: () => source } as unknown as AudioContext;
    const response = new Response(new ReadableStream({ start(stream) { stream.enqueue(new Uint8Array([0, 0])); }, cancel }));
    const playing = playPcmStream(response, context, controller.signal, sources, vi.fn());
    await started; controller.abort(); await playing;
    expect(stop).toHaveBeenCalledOnce(); expect(cancel).toHaveBeenCalledOnce(); expect(sources.size).toBe(0);
  });
});
