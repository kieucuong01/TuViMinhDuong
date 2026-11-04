"use client";

import { useEffect, useRef, useState } from "react";
import { playPcmStream } from "./tu-vi-quan-audio";
import { QUAN_TAROT_CARDS } from "@/lib/tu-vi-quan-content";
import styles from "./tu-vi-quan-encounter.module.css";

export type EncounterKind = "tuvi" | "tarot" | "iching";
export type EncounterVisual = { kind: EncounterKind; state: "greeting" | "listening" | "thinking" | "speaking" | "idle"; audioLevel: number };
type Message = { id: string; question: string; answer: string | null; interrupted: boolean };
type Encounter = { id: string; kind: EncounterKind; tier: "free" | "paid"; state: "waiting" | "invited" | "active" | "ended" | "left"; endsAt?: string; remainingSeconds: number; messages: Message[]; context: { title: string; brief?: string; cards?: { id: string; title: string }[]; lines?: number[]; chartMissing?: boolean } };
type Snapshot = { encounter: Encounter | null; freeRemainingSeconds: number; capabilities: { stt: boolean; tts: boolean } };
type Props = { kind: EncounterKind; orderId?: string; muted: boolean; onLeave(): void; onVisual(value: EncounterVisual): void; onUpgrade(kind: EncounterKind): void; onRitual(kind: "tarot" | "iching", count?: number, values?: number[]): void; onChartReady(palace: number): void };
const names = { tuvi: "Thầy tử vi", tarot: "Người đọc Tarot", iching: "Thầy Dịch" };
const endpoint = "/api/tu-vi-quan/encounter";

async function readResponse(response: Response) {
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Chưa kết nối được với quán. Bạn thử lại nhé.");
  return data;
}

export default function TuViQuanEncounter({ kind, orderId, muted, onLeave, onVisual, onUpgrade, onRitual, onChartReady }: Props) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [showText, setShowText] = useState(false);
  const [birthSaved, setBirthSaved] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const generation = useRef(0);
  const current = useRef<Encounter | null>(null);
  const visual = useRef(onVisual); visual.current = onVisual;
  const audio = useRef<AudioContext | null>(null);
  const sources = useRef(new Set<AudioBufferSourceNode>());
  const speech = useRef<AbortController | null>(null);
  const request = useRef<AbortController | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const mic = useRef<MediaStream | null>(null);
  const recordingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spokenTurn = useRef<string | null>(null);
  const lock = useRef(false);
  const acquiringMic = useRef(false);

  function apply(data: Snapshot) { current.current = data.encounter; setSnapshot(data); }
  function state(value: EncounterVisual["state"], audioLevel = 0) { visual.current({ kind, state: value, audioLevel }); }
  function stopMic(discard = false) {
    if (recordingTimer.current) clearTimeout(recordingTimer.current);
    if (recorder.current && recorder.current.state !== "inactive") { if (discard) recorder.current.onstop = null; recorder.current.stop(); }
    mic.current?.getTracks().forEach(track => track.stop()); mic.current = null;
    setRecording(false);
  }
  function stopSpeech() { speech.current?.abort(); speech.current = null; for (const source of sources.current) { try { source.stop(); } catch {} } sources.current.clear(); setSpeaking(false); }
  function interruptSpeech() {
    if (speech.current && spokenTurn.current && current.current) void action("interrupt", { id: current.current.id, turnId: spokenTurn.current }).catch(() => {});
    stopSpeech();
  }
  async function unlockAudio() { audio.current ??= new AudioContext(); await audio.current.resume(); }
  async function soundDraw(kind: "tarot" | "iching") {
    if (muted) return;
    try {
      await unlockAudio();
      const context = audio.current!;
      const duration = kind === "tarot" ? 0.58 : 0.43;
      const clip = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate);
      const samples = clip.getChannelData(0);
      for (let i = 0; i < samples.length; i++) {
        const t = i / context.sampleRate;
        const pulse = t % (kind === "tarot" ? 0.15 : 0.105);
        samples[i] = kind === "tarot"
          ? (Math.random() * 2 - 1) * Math.sin(Math.PI * pulse / 0.15) ** 2 * (1 - t / duration) * 0.085
          : Math.sin(2 * Math.PI * (1350 + Math.floor(t / 0.105) * 290) * t) * Math.exp(-pulse * 62) * (1 - t / duration) * 0.10;
      }
      const source = context.createBufferSource(); source.buffer = clip; source.connect(context.destination); source.start();
    } catch { /* The tabletop reveal also works without sound. */ }
  }
  async function action(actionName: string, fields: Record<string, unknown> = {}, signal?: AbortSignal): Promise<Snapshot> {
    return readResponse(await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: actionName, ...fields }), signal }));
  }
  async function speak(encounter: Encounter, message: Message) {
    stopSpeech(); spokenTurn.current = message.id;
    if (!snapshot?.capabilities.tts || !message.answer || document.hidden) { state("idle"); return; }
    const token = generation.current;
    const controller = new AbortController(); speech.current = controller;
    try {
      await unlockAudio();
      const response = await fetch("/api/tu-vi-quan/voice/speak", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: encounter.id, turnId: message.id }), signal: controller.signal });
      if (!response.ok) { const data = await response.json().catch(() => ({})); throw new Error(data.error || "Giọng đọc đang bận. Bạn có thể đọc phụ đề hoặc thử lại."); }
      if (token !== generation.current || controller.signal.aborted || document.hidden) { controller.abort(); return; }
      setSpeaking(true); state("speaking");
      await playPcmStream(response, audio.current!, controller.signal, sources.current, value => { if (token === generation.current && !controller.signal.aborted) state("speaking", value); });
    } catch (cause) { if (!controller.signal.aborted && token === generation.current) setError(cause instanceof Error ? cause.message : "Chưa phát được âm thanh."); }
    finally { if (token === generation.current && speech.current === controller) { setSpeaking(false); state("idle"); speech.current = null; } }
  }
  async function run(actionName: string) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(""); const token = generation.current;
    try {
      await unlockAudio();
      const data = await action(actionName, actionName === "begin" ? { kind, orderId } : { id: current.current?.id });
      if (token !== generation.current) return;
      apply(data);
      const greeting = data.encounter?.messages.find(message => message.id === "greeting");
      if (data.encounter?.state === "active" && greeting) void speak(data.encounter, greeting);
    } catch (cause) { if (token === generation.current) setError(cause instanceof Error ? cause.message : "Chưa vào được cuộc trò chuyện."); }
    finally { if (token === generation.current) { lock.current = false; setBusy(false); } }
  }
  async function send(question: string) {
    const encounter = current.current;
    if (!encounter || encounter.state !== "active" || !question.trim() || lock.current) return;
    lock.current = true; setBusy(true); setError(""); state("thinking");
    const token = generation.current; const controller = new AbortController(); request.current = controller;
    try {
      const data = await action("turn", { id: encounter.id, turnId: crypto.randomUUID(), question: question.trim() }, controller.signal);
      if (token !== generation.current) return;
      apply(data); setText("");
      const message = data.encounter?.messages.at(-1);
      if (data.encounter && message?.answer) void speak(data.encounter, message);
      else state("idle");
    } catch (cause) { if (!controller.signal.aborted && token === generation.current) { setError(cause instanceof Error ? cause.message : "Câu hỏi chưa được gửi."); state("idle"); } }
    finally { if (token === generation.current) { lock.current = false; setBusy(false); } }
  }
  async function startMic() {
    if (recording) { stopMic(); return; }
    if (lock.current || acquiringMic.current || current.current?.state !== "active") return;
    acquiringMic.current = true;
    setError(""); const token = generation.current;
    try {
      await unlockAudio();
      interruptSpeech();
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") throw new Error("Trình duyệt này chưa hỗ trợ thu âm. Bạn có thể gõ câu hỏi bên dưới.");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      if (token !== generation.current || document.hidden) { stream.getTracks().forEach(track => track.stop()); return; }
      mic.current = stream;
      const instance = new MediaRecorder(stream); recorder.current = instance;
      const chunks: Blob[] = []; let bytes = 0;
      instance.ondataavailable = event => { bytes += event.data.size; chunks.push(event.data); if (bytes > 6 * 1024 * 1024) { stopMic(true); setError("Bản thu quá dài. Bạn nói ngắn hơn nhé."); } };
      instance.onstop = async () => {
        if (token !== generation.current) return;
        stopMic(true); lock.current = true; setBusy(true); state("thinking");
        const controller = new AbortController(); request.current = controller;
        try {
          const form = new FormData(); form.set("id", current.current!.id); form.set("audio", new Blob(chunks, { type: instance.mimeType }), "question.webm");
          const data = await readResponse(await fetch("/api/tu-vi-quan/voice/transcribe", { method: "POST", body: form, signal: controller.signal }));
          if (token !== generation.current) return;
          if (!data.text?.trim()) throw new Error("Chưa nghe rõ câu hỏi. Bạn thử nói lại nhé.");
          lock.current = false; setBusy(false); await send(data.text);
        } catch (cause) { if (token === generation.current && !controller.signal.aborted) { setError(cause instanceof Error ? cause.message : "Chưa nhận được lời nói."); state("idle"); } }
        finally { if (token === generation.current) { lock.current = false; setBusy(false); } }
      };
      instance.start(250); setRecording(true); state("listening");
      recordingTimer.current = setTimeout(() => stopMic(), 30000);
    } catch (cause) { if (token === generation.current) { stopMic(true); setError(cause instanceof Error ? cause.message : "Không mở được micro. Hãy kiểm tra quyền thu âm."); state("idle"); } }
    finally { acquiringMic.current = false; }
  }
  async function saveBirth(form: FormData) {
    if (lock.current) return;
    const [year, month, day] = String(form.get("birthDate")).split("-").map(Number);
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const data = await readResponse(await fetch("/api/tu-vi-quan/ecosystem", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "birth", input: {
          fullName: "Khách", gender: form.get("gender"), calendarType: "solar",
          year, month, day, birthHour: Number(form.get("hour")), birthMinute: Number(form.get("minute")),
        } }),
      }));
      setBirthSaved(true);
      const palace = data.chartSummary?.palaces?.findIndex((item: { name: string }) => item.name === "Mệnh");
      if (Number.isInteger(palace) && palace >= 0) onChartReady(palace);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Chưa lưu được ngày giờ sinh.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function leave() {
    const encounter = current.current; generation.current++; stopMic(true); stopSpeech(); request.current?.abort();
    if (encounter && !["ended", "left"].includes(encounter.state)) void action("leave", { id: encounter.id }).catch(() => {});
    current.current = null;
    onLeave();
  }

  useEffect(() => {
    const token = ++generation.current;
    const controller = new AbortController();
    void fetch(endpoint, { signal: controller.signal }).then(readResponse).then((data: Snapshot) => {
      if (token === generation.current) apply(data);
    }).catch(cause => { if (!controller.signal.aborted) setError(cause.message); });
    const hidden = () => { if (document.hidden) { stopMic(true); stopSpeech(); state("idle"); } };
    document.addEventListener("visibilitychange", hidden);
    return () => {
      generation.current = token + 1; controller.abort(); request.current?.abort(); stopMic(true); stopSpeech(); void audio.current?.close(); audio.current = null; document.removeEventListener("visibilitychange", hidden);
      const encounter = current.current;
      if (encounter && !["ended", "left"].includes(encounter.state)) void fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "leave", id: encounter.id }), keepalive: true }).catch(() => {});
    };
    // This component is mounted for one host visit; refs keep scene callbacks current.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const encounter = snapshot?.encounter?.kind === kind ? snapshot.encounter : null;
  const active = encounter?.state === "active";
  useEffect(() => {
    if (!encounter) return;
    let stopped = false;
    const tick = () => {
      const remaining = encounter.endsAt ? Math.max(0, Math.ceil((Date.parse(encounter.endsAt) - Date.now()) / 1000)) : encounter.remainingSeconds;
      setSeconds(remaining);
      if (!remaining && encounter.state === "active" && !stopped) { stopped = true; stopMic(true); }
    };
    tick(); const timer = setInterval(tick, 1000); return () => clearInterval(timer);
  }, [encounter]);
  useEffect(() => {
    if (encounter?.state !== "waiting" && !(active && seconds === 0)) return;
    const controller = new AbortController(); const token = generation.current;
    const timer = setInterval(() => { void fetch(endpoint, { signal: controller.signal }).then(readResponse).then(data => { if (token === generation.current) apply(data); }).catch(() => {}); }, 3000);
    return () => { clearInterval(timer); controller.abort(); };
  }, [encounter?.state, active, seconds]);
  const last = encounter?.messages.filter(message => message.answer).at(-1);
  const ended = encounter?.state === "ended" || (active && !!encounter.endsAt && Date.parse(encounter.endsAt) <= Date.now());
  const exhausted = !encounter && snapshot?.freeRemainingSeconds === 0 && !orderId;
  function drawAtTable() {
    if (!encounter || kind === "tuvi") return;
    void soundDraw(kind);
    if (kind === "iching") onRitual(kind, 6, encounter.context.lines);
    else onRitual(kind, encounter.context.cards?.length || 3, encounter.context.cards?.map(card => QUAN_TAROT_CARDS.findIndex(item => item.id === card.id)).filter(index => index >= 0));
  }
  return <section className={styles.hud} aria-label={`Trò chuyện với ${names[kind]}`}>
    <div className={styles.caption}>
      <div className={styles.eyebrow}>{names[kind]}{active && <span className={styles.timer}> · {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}</span>}</div>
      <p aria-live="polite">{exhausted ? "Bạn đã dùng hết 5 phút miễn phí hôm nay. Ngày mai bạn có thể ghé lại, hoặc chọn trò chuyện thêm." : ended && !speaking ? "Buổi trò chuyện đã hết giờ. Cảm ơn bạn đã ghé quán." : last?.answer || (encounter?.state === "waiting" ? "Thầy đang tiếp khách. Bạn đợi một chút nhé, quán sẽ mời bạn khi có chỗ." : encounter?.state === "invited" ? "Đã có chỗ dành cho bạn. Khi sẵn sàng, bạn hãy bắt đầu trò chuyện." : "Mời bạn ngồi xuống. Bạn đang muốn hỏi về điều gì?")}</p>
      {!encounter && <p className={styles.eyebrow}>Mỗi ngày có 5 phút trò chuyện miễn phí, dùng chung cả ba thầy.</p>}
      {error && <p role="alert" className={styles.error}>{error}</p>}
    </div>
    <div className={styles.bar}>
      {!encounter && !exhausted && <button className={styles.primary} disabled={busy || !snapshot} onClick={() => void run("begin")}>Ngồi xuống trò chuyện</button>}
      {encounter?.state === "invited" && <button className={styles.primary} disabled={busy} onClick={() => void run("start")}>Bắt đầu trò chuyện</button>}
      {active && !ended && <><button className={recording ? styles.recording : styles.primary} disabled={busy || !snapshot?.capabilities.stt} onClick={() => void startMic()} aria-pressed={recording}>{recording ? "Nói xong · Gửi" : speaking ? "Ngắt lời và nói" : "Bật micro để nói"}</button><button onClick={() => setShowText(value => !value)}>Gõ câu hỏi</button>{!recording && !busy && !speaking && kind !== "tuvi" && <button onClick={drawAtTable}>{kind === "tarot" ? "Rút bài trên bàn" : "Gieo quẻ trên bàn"}</button>}</>}
      {(ended || exhausted) && <button className={styles.primary} onClick={() => onUpgrade(kind)}>Trò chuyện thêm · 100.000đ/15 phút · 200.000đ/30 phút</button>}
      <button onClick={() => void leave()}>Rời ghế</button>
    </div>
    {active && !ended && !snapshot?.capabilities.stt && <div className={styles.status}>Thu âm đang tạm nghỉ. Bạn có thể gõ câu hỏi.</div>}
    {active && !ended && !snapshot?.capabilities.tts && <div className={styles.status}>Giọng đọc đang tạm nghỉ. Lời của thầy sẽ hiện ở phụ đề.</div>}
    {busy && <div className={styles.status} role="status">Thầy đang lắng nghe và suy ngẫm…</div>}
    {kind === "tuvi" && !orderId && !ended && !exhausted && (!encounter || encounter.context.chartMissing) && (birthSaved
      ? <p className={styles.status}>Ngày giờ sinh đã lưu. Thầy sẽ dùng lá số này ở lượt hỏi tiếp theo.</p>
      : <details><summary>Lập lá số tại bàn</summary>
        <form className={styles.birth} onSubmit={event => { event.preventDefault(); void saveBirth(new FormData(event.currentTarget)); }}>
          <label>Ngày sinh dương lịch<input name="birthDate" type="date" required /></label>
          <label>Giờ sinh<input name="hour" type="number" min="0" max="23" required /></label>
          <label>Phút sinh<input name="minute" type="number" min="0" max="59" defaultValue="0" required /></label>
          <label>Giới tính<select name="gender"><option value="male">Nam</option><option value="female">Nữ</option></select></label>
          <button disabled={busy || recording}>Lưu lá số</button>
        </form>
      </details>)}
    {showText && active && !ended && <form className={styles.text} onSubmit={event => { event.preventDefault(); interruptSpeech(); void send(text); }}><input aria-label="Câu hỏi của bạn" value={text} onChange={event => setText(event.target.value)} maxLength={1200} placeholder="Bạn muốn hỏi điều gì?" /><button disabled={busy || recording || !text.trim()}>Gửi</button></form>}
    {!!encounter?.messages.length && <details><summary>Xem lại cuộc trò chuyện</summary><div className={styles.transcript}>{encounter.messages.map(message => <p key={message.id}>{message.question && <><strong>Bạn:</strong> {message.question}<br /></>}<strong>{names[kind]}:</strong> {message.answer || "Đang suy ngẫm…"}{message.interrupted && " (đã ngắt lời)"}</p>)}</div></details>}
  </section>;
}
