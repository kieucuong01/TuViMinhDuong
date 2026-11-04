export function decodePcm16(bytes: Uint8Array): Float32Array<ArrayBuffer> {
  const samples = new Float32Array(Math.floor(bytes.length / 2));
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (let i = 0; i < samples.length; i++) samples[i] = view.getInt16(i * 2, true) / 32768;
  return samples;
}

export async function playPcmStream(response: Response, context: AudioContext, signal: AbortSignal, sources: Set<AudioBufferSourceNode>, level: (value: number) => void) {
  if (!response.body) throw new Error("Không nhận được âm thanh từ thầy.");
  const sampleRate = Number(response.headers.get("X-Sample-Rate") || 24000);
  if (!Number.isFinite(sampleRate) || sampleRate < 8000 || sampleRate > 96000) throw new Error("Định dạng âm thanh chưa hợp lệ.");
  const reader = response.body.getReader();
  const analyser = context.createAnalyser(); analyser.fftSize = 256; analyser.connect(context.destination);
  const waveform = new Float32Array(analyser.fftSize);
  const meter = setInterval(() => { analyser.getFloatTimeDomainData(waveform); let energy = 0; for (const value of waveform) energy += value * value; level(Math.min(1, Math.sqrt(energy / waveform.length) * 4)); }, 125);
  let carry = new Uint8Array(0);
  let next = context.currentTime + .04;
  let received = false;
  const stop = () => { void reader.cancel().catch(() => {}); for (const source of sources) { try { source.stop(); } catch {} } sources.clear(); level(0); };
  signal.addEventListener("abort", stop, { once: true });
  try {
    while (!signal.aborted) {
      const { done, value } = await reader.read();
      if (done) break;
      const joined = new Uint8Array(carry.length + value.length);
      joined.set(carry); joined.set(value, carry.length);
      const length = joined.length - joined.length % 2;
      carry = joined.slice(length);
      if (!length) continue;
      received = true;
      const samples = decodePcm16(joined.subarray(0, length));
      const buffer = context.createBuffer(1, samples.length, sampleRate);
      buffer.copyToChannel(samples, 0);
      const source = context.createBufferSource();
      source.buffer = buffer; source.connect(analyser); sources.add(source);
      source.onended = () => { sources.delete(source); };
      next = Math.max(next, context.currentTime + .025);
      source.start(next); next += buffer.duration;
      // Bound queued audio so a slow device does not retain an entire answer in memory.
      while (!signal.aborted && next - context.currentTime > 2) await new Promise(resolve => setTimeout(resolve, 80));
    }
    if (!received && !signal.aborted) throw new Error("Thầy chưa phát được tiếng. Bạn vẫn có thể đọc phụ đề.");
    while (!signal.aborted && sources.size) await new Promise(resolve => setTimeout(resolve, 125));
  } catch (error) { stop(); throw error; }
  finally { clearInterval(meter); analyser.disconnect(); signal.removeEventListener("abort", stop); level(0); reader.releaseLock(); }
}
