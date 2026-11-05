import type { QuanPractice } from "@/lib/tu-vi-quan-monastery";

// Âm thanh tạo tại máy bằng Web Audio, bắt đầu từ thao tác của người chơi.
export function createMonasteryAudio() {
  const context = new AudioContext();
  const output = context.createGain(); output.gain.value = 0.55; output.connect(context.destination);
  const playing = new Set<OscillatorNode>();
  let generation = 0;
  let timer: ReturnType<typeof setInterval> | undefined;
  function tone(frequency: number, duration: number, volume: number) {
    const oscillator = context.createOscillator(), gain = context.createGain();
    oscillator.frequency.value = frequency;
    const now = context.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain); gain.connect(output); playing.add(oscillator);
    oscillator.start(); oscillator.stop(now + duration);
    oscillator.onended = () => { playing.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
  }
  function bell() {
    for (const [frequency, amplitude] of [[220, 0.045], [594, 0.018], [1188, 0.008]]) tone(frequency, 7, amplitude);
  }
  function wood() {
    tone(825, 0.21, 0.11); tone(1437, 0.12, 0.05); tone(2283, 0.045, 0.025);
  }
  function bead() {
    tone(1280, 0.045, 0.05); tone(2180, 0.025, 0.025);
  }
  function stop() {
    generation++;
    clearInterval(timer); timer = undefined;
    for (const oscillator of playing) { try { oscillator.stop(); } catch { /* Already ended. */ } }
    playing.clear();
    void context.suspend();
  }
  return {
    async start(mode: QuanPractice) {
      stop(); const current = generation; await context.resume();
      if (current !== generation) return;
      if (mode === "meditate") { bell(); timer = setInterval(bell, 8000); }
      else if (mode === "chant") { wood(); timer = setInterval(wood, 1100); }
      else bead();
    },
    tap: bead,
    stop,
    close() { stop(); output.disconnect(); void context.close(); },
  };
}
