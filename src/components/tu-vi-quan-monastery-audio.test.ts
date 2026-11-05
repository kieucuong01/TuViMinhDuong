import { afterEach, expect, it, vi } from "vitest";
import { createMonasteryAudio } from "./tu-vi-quan-monastery-audio";

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

it("plays different instruments, stops loops and honors mute while audio is resuming", async () => {
  vi.useFakeTimers();
  let tones = 0;
  class Context {
    currentTime = 0;
    destination = {};
    resume = vi.fn(async () => {});
    suspend = vi.fn(async () => {});
    close = vi.fn(async () => {});
    createGain() { return { gain: { value: 1, setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, disconnect() {} }; }
    createOscillator() { tones++; return { frequency: { value: 0 }, connect() {}, disconnect() {}, start() {}, stop() {}, onended: null }; }
  }
  const context = new Context();
  vi.stubGlobal("AudioContext", function () { return context; });
  const audio = createMonasteryAudio();
  await audio.start("meditate");
  expect(tones).toBe(3);
  vi.advanceTimersByTime(8000);
  expect(tones).toBe(6);
  audio.stop(); vi.advanceTimersByTime(8000);
  expect(tones).toBe(6);
  await audio.start("chant");
  vi.advanceTimersByTime(1100);
  expect(tones).toBe(12);
  await audio.start("beads"); audio.tap();
  expect(tones).toBe(16);
  let finishResume!: () => void;
  context.resume.mockImplementationOnce(() => new Promise<void>(resolve => { finishResume = resolve; }));
  const starting = audio.start("chant");
  audio.stop(); finishResume(); await starting;
  vi.advanceTimersByTime(8000);
  expect(tones).toBe(16);
  expect(vi.getTimerCount()).toBe(0);
  audio.close(); expect(context.close).toHaveBeenCalledOnce();
});
