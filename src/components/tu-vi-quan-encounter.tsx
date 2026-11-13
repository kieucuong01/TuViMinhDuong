"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { playPcmStream } from "./tu-vi-quan-audio";
import { QUAN_TAROT_CARDS } from "@/lib/tu-vi-quan-content";
import { reportQuanStep } from "@/lib/first-party-funnel-client";
import styles from "./tu-vi-quan-encounter.module.css";

export type EncounterKind = "tuvi" | "tarot" | "iching";
export type EncounterVisual = { kind: EncounterKind; state: "greeting" | "listening" | "thinking" | "speaking" | "idle"; audioLevel: number };
type Message = { id: string; question: string; answer: string | null; interrupted: boolean };
type Encounter = { id: string; visitId?: string; kind: EncounterKind; tier: "free" | "paid"; state: "waiting" | "invited" | "active" | "ended" | "left"; endsAt?: string; remainingSeconds: number; messages: Message[]; context: { title: string; brief?: string; cards?: { id: string; title: string }[]; lines?: number[]; chartMissing?: boolean; menhIndex?: number; birthDraft?: { fullName?: string; day?: number; month?: number; year?: number; calendarType?: string; gender?: string; birthHour?: number; birthMinute?: number } } };
type Snapshot = { encounter: Encounter | null; freeRemainingSeconds: number; paidRemainingSeconds?: number; rewardTickets?: { id: string }[]; capabilities: { stt: boolean; tts: boolean } };
type Props = { kind: EncounterKind; orderId?: string; ticketId?: string; muted: boolean; onLeave(): void; onSeatReady(ready: boolean): void; onVisual(value: EncounterVisual): void; onUpgrade(kind: EncounterKind): void; onRitual(kind: "tarot" | "iching", count?: number, values?: number[]): void; onChartReady(palace: number): void };
const names = { tuvi: "Thầy tử vi", tarot: "Người đọc Tarot", iching: "Thầy Dịch" };
const endpoint = "/api/tu-vi-quan/encounter";

async function readResponse(response: Response) {
  const data = await response.json().catch(() => null);
  if (!response.ok || !data) throw new Error(data?.error || "Chưa kết nối được với quán. Bạn thử lại nhé.");
  return data;
}

export default function TuViQuanEncounter({ kind, orderId, ticketId, muted, onLeave, onSeatReady, onVisual, onUpgrade, onRitual, onChartReady }: Props) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [busy, setBusy] = useState(true);
  const [recording, setRecording] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [showText, setShowText] = useState(kind !== "tuvi");
  const [seconds, setSeconds] = useState(0);
  const generation = useRef(0);
  const current = useRef<Encounter | null>(null);
  const seatReady = useRef(onSeatReady); seatReady.current = onSeatReady;
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

  const apply = useCallback((data: Snapshot) => {
    current.current = data.encounter;
    setSnapshot(data);
    if (data.encounter?.state === "waiting") reportQuanStep("queue_wait");
    if (data.encounter?.state === "invited") {
      reportQuanStep("seat_ready");
      if (data.encounter.context.chartMissing) reportQuanStep("birth_view");
    }
    seatReady.current(data.encounter?.kind === kind && (data.encounter.state === "invited" || data.encounter.state === "active"));
  }, [kind]);
  function release(row: Encounter | null) {
    if (!row || row.state === "ended" || row.state === "left") return;
    void fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "leave", id: row.id, visitId: row.visitId }), keepalive: true }).catch(() => {});
  }
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
    if (actionName === "start") reportQuanStep("start_click");
    if (actionName === "birth_confirm" || actionName === "birth_capture") reportQuanStep("birth_submit");
    if (actionName === "turn") reportQuanStep("question_send");
    try {
      return await readResponse(await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: actionName, ...fields }), signal }));
    } catch (error) {
      if (!signal?.aborted) {
        if (actionName === "start") reportQuanStep("start_error");
        if (actionName === "birth_confirm" || actionName === "birth_capture") reportQuanStep("birth_error");
        if (actionName === "turn") reportQuanStep("question_error");
      }
      throw error;
    }
  }
  async function speak(encounter: Encounter, message: Message) {
    stopSpeech(); spokenTurn.current = message.id;
    if (!snapshot?.capabilities.tts || !message.answer || document.hidden) { state("idle"); return; }
    const token = generation.current;
    const controller = new AbortController(); speech.current = controller;
    try {
      await unlockAudio();
      const payload = JSON.stringify({ id: encounter.id, turnId: message.id });
      const requestSpeech = () => fetch("/api/tu-vi-quan/voice/speak", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, signal: controller.signal });
      let response = await requestSpeech();
      if (response.status === 409 && !controller.signal.aborted) {
        const blocked = await response.clone().json().catch(() => null);
        if (blocked?.error === "Thầy đang nói. Bạn đợi một chút nhé.") {
          await new Promise(resolve => setTimeout(resolve, 350));
          response = await requestSpeech();
        }
      }
      if (!response.ok) { const data = await response.json().catch(() => ({})); throw new Error(data.error || "Giọng đọc đang bận. Bạn có thể đọc phụ đề hoặc thử lại."); }
      if (token !== generation.current || controller.signal.aborted || document.hidden) { controller.abort(); return; }
      setSpeaking(true); state("speaking");
      await playPcmStream(response, audio.current!, controller.signal, sources.current, value => { if (token === generation.current && !controller.signal.aborted) state("speaking", value); });
    } catch (cause) { if (!controller.signal.aborted && token === generation.current) setError(cause instanceof Error ? cause.message : "Chưa phát được âm thanh."); }
    finally { if (token === generation.current && speech.current === controller) { setSpeaking(false); state("idle"); speech.current = null; } }
  }
  async function run(actionName: string, rewardId?: string) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(""); const token = generation.current;
    try {
      if (actionName !== "begin") void unlockAudio().catch(() => {});
      if (rewardId && current.current) {
        stopSpeech();
        await action("leave", { id: current.current.id, visitId: current.current.visitId });
      }
      const data = await action(actionName, actionName === "begin" ? { kind, orderId, ticketId: rewardId ?? ticketId } : { id: current.current?.id });
      if (token !== generation.current) return;
      apply(data);
      const greeting = data.encounter?.messages.find(message => message.id === "greeting");
      if ((data.encounter?.state === "active" || data.encounter?.state === "invited" && data.encounter.context.chartMissing) && greeting) void speak(data.encounter, greeting);
    } catch (cause) { if (token === generation.current) setError(cause instanceof Error ? cause.message : "Chưa vào được cuộc trò chuyện."); }
    finally { if (token === generation.current) { lock.current = false; setBusy(false); } }
  }
  async function send(question: string) {
    const encounter = current.current;
    if (!encounter || encounter.state !== "active" || !question.trim() || lock.current) return;
    lock.current = true; setBusy(true); setError(""); state("thinking");
    const token = generation.current; const controller = new AbortController(); request.current = controller;
    try {
      const turnId = crypto.randomUUID();
      const data = await action("turn", { id: encounter.id, turnId, question: question.trim() }, controller.signal);
      if (token !== generation.current) return;
      apply(data); setText("");
      const message = data.encounter?.messages.find(item => item.id === turnId);
      reportQuanStep(message?.answer ? "answer_ready" : "question_error");
      if (data.encounter && message?.answer) void speak(data.encounter, message);
      else state("idle");
    } catch (cause) { if (!controller.signal.aborted && token === generation.current) { setError(cause instanceof Error ? cause.message : "Câu hỏi chưa được gửi."); state("idle"); } }
    finally { if (token === generation.current) { lock.current = false; setBusy(false); } }
  }
  async function startMic() {
    if (recording) { stopMic(); return; }
    if (lock.current || acquiringMic.current || !(current.current?.state === "active" || current.current?.state === "invited" && current.current.context.chartMissing)) return;
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
          if (!data.text?.trim()) throw new Error("Thầy chưa nghe rõ. Bạn thử nói lại nhé.");
          if (current.current?.context.chartMissing) {
            const view = await action("birth_capture", { id: current.current.id, transcript: data.text }, controller.signal);
            if (token === generation.current) applyBirth(view);
          } else {
            lock.current = false; setBusy(false); await send(data.text);
          }
        } catch (cause) { if (token === generation.current && !controller.signal.aborted) { setError(cause instanceof Error ? cause.message : "Chưa nhận được lời nói."); state("idle"); } }
        finally { if (token === generation.current) { lock.current = false; setBusy(false); } }
      };
      instance.start(250); setRecording(true); state("listening");
      recordingTimer.current = setTimeout(() => stopMic(), 30000);
    } catch (cause) { if (token === generation.current) { reportQuanStep("mic_error"); stopMic(true); setShowText(true); setError(cause instanceof Error ? cause.message : "Không mở được micro. Hãy kiểm tra quyền thu âm."); state("idle"); } }
    finally { acquiringMic.current = false; }
  }
  function applyBirth(data: Snapshot) {
    apply(data);
    const encounter = data.encounter;
    if (!encounter) return;
    if (!encounter.context.chartMissing) reportQuanStep("birth_ready");
    if (encounter.context.menhIndex !== undefined && encounter.context.menhIndex >= 0) onChartReady(encounter.context.menhIndex);
    const message = encounter.messages.at(-1);
    if (message) void speak(encounter, message);
    else state("idle");
  }
  async function saveBirth(form: FormData) {
    if (lock.current || !current.current?.context.chartMissing) return;
    lock.current = true;
    setBusy(true);
    setError("");
    const token = generation.current;
    const controller = new AbortController(); request.current = controller;
    interruptSpeech();
    try {
      const input = {
        fullName: form.get("fullName"),
        gender: form.get("gender"), calendarType: form.get("calendarType"),
        year: Number(form.get("year")), month: Number(form.get("month")), day: Number(form.get("day")),
        birthHour: Number(form.get("hour")), birthMinute: Number(form.get("minute")),
      };
      const data = await action("birth_confirm", { id: current.current.id, input }, controller.signal);
      if (token === generation.current) applyBirth(data);
    } catch (cause) {
      if (token === generation.current) setError(cause instanceof Error ? cause.message : "Chưa lập được lá số.");
    } finally {
      if (token === generation.current) { lock.current = false; setBusy(false); }
    }
  }
  async function leave() {
    if (lock.current && !request.current) return;
    const encounter = current.current; generation.current++; stopMic(true); stopSpeech(); request.current?.abort();
    lock.current = true; setBusy(true); setError("");
    try {
      if (encounter && !["ended", "left"].includes(encounter.state)) {
        await action("leave", { id: encounter.id, visitId: encounter.visitId });
        if (encounter.state === "waiting") reportQuanStep("queue_leave");
      }
      current.current = null; onLeave();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Chưa lưu được thời gian còn lại. Bạn thử rời ghế lần nữa nhé."); }
    finally { lock.current = false; setBusy(false); }
  }

  useEffect(() => {
    const token = ++generation.current;
    const controller = new AbortController();
    lock.current = true;
    async function join() {
      try {
        let data: Snapshot = await readResponse(await fetch(endpoint, { signal: controller.signal }));
        if (token !== generation.current) return;
        const hasTime = Boolean(orderId || ticketId || data.freeRemainingSeconds || data.paidRemainingSeconds);
        if (!data.encounter && hasTime) {
          data = await action("begin", { kind, orderId, ticketId });
          if (token !== generation.current) { release(data.encounter); return; }
        }
        apply(data);
      } catch (cause) {
        if (token === generation.current) setError(cause instanceof Error ? cause.message : "Chưa tìm được chỗ. Bạn thử lại nhé.");
      } finally {
        if (token === generation.current) { lock.current = false; setBusy(false); }
      }
    }
    void join();
    const hidden = () => { if (document.hidden) { stopMic(true); stopSpeech(); state("idle"); } };
    const pageHide = () => release(current.current);
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") void leave(); };
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("pagehide", pageHide);
    window.addEventListener("keydown", escape);
    return () => {
      generation.current = token + 1; controller.abort(); request.current?.abort(); stopMic(true); stopSpeech(); void audio.current?.close(); audio.current = null; document.removeEventListener("visibilitychange", hidden); window.removeEventListener("pagehide", pageHide); window.removeEventListener("keydown", escape);
      release(current.current);
    };
    // This component is mounted for one host visit; refs keep scene callbacks current.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const encounter = snapshot?.encounter?.kind === kind ? snapshot.encounter : null;
  const active = encounter?.state === "active";
  const intake = Boolean((active || encounter?.state === "invited") && encounter?.context.chartMissing);
  const draft = encounter?.context.birthDraft;
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
    if (encounter?.state !== "waiting" && encounter?.state !== "invited" && !(active && seconds === 0)) return;
    const controller = new AbortController(); const token = generation.current;
    const timer = setInterval(() => {
      if (lock.current) return;
      const before = current.current;
      void fetch(endpoint, { signal: controller.signal }).then(readResponse).then(data => {
        if (token === generation.current && !lock.current && current.current === before) apply(data);
      }).catch(() => {});
    }, 3000);
    return () => { clearInterval(timer); controller.abort(); };
  }, [encounter?.state, active, seconds, apply]);
  const last = encounter?.messages.filter(message => message.answer).at(-1);
  const ended = encounter?.state === "ended" || (active && !!encounter.endsAt && Date.parse(encounter.endsAt) <= Date.now());
  const exhausted = !encounter && snapshot?.freeRemainingSeconds === 0 && !snapshot?.paidRemainingSeconds && !orderId && !ticketId;
  function drawAtTable() {
    if (!encounter || kind === "tuvi") return;
    void soundDraw(kind);
    if (kind === "iching") onRitual(kind, 6, encounter.context.lines);
    else onRitual(kind, encounter.context.cards?.length || 3, encounter.context.cards?.map(card => QUAN_TAROT_CARDS.findIndex(item => item.id === card.id)).filter(index => index >= 0));
  }
  return <section className={styles.hud} aria-label={`Trò chuyện với ${names[kind]}`}>
    <div className={styles.caption}>
      <div className={styles.eyebrow}>{names[kind]}{active && <span className={styles.timer}> · Còn {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}</span>}{intake && !active && " · Lập lá số, chưa tính giờ"}</div>
      <p aria-live="polite">{exhausted || ended ? "Thời gian xem đã hết. Bạn có thể chọn xem thêm." : encounter?.state === "waiting" ? "Thầy đang tiếp khách. Quán sẽ tự mời bạn khi có chỗ." : intake && last?.id !== "birth-prompt" ? "Nói hoặc nhập họ tên, ngày giờ sinh, loại lịch và giới tính để Thầy lập lá số." : last?.answer || (encounter?.state === "invited" ? "Đã có chỗ. Bấm bắt đầu khi bạn sẵn sàng." : busy ? "Đang tìm chỗ trống…" : "Bạn có thể thử tìm chỗ lại.")}</p>
      {error && <p role="alert" className={styles.error}>{error}</p>}
    </div>
    <div className={styles.bar}>
      {!encounter && !exhausted && !busy && <button className={styles.primary} onClick={() => void run("begin")}>Thử tìm chỗ lại</button>}
      {encounter?.state === "invited" && !intake && <button className={styles.primary} disabled={busy} onClick={() => void run("start")}>Bắt đầu xem</button>}
      {(active || intake) && !ended && snapshot?.capabilities.stt && <button className={recording ? styles.recording : styles.primary} disabled={busy} onClick={() => void startMic()} aria-pressed={recording}>{recording ? "Gửi lời nói" : speaking ? "Ngắt lời và nói" : intake ? "Nói thông tin" : "Nói với Thầy"}</button>}
      {(intake || (active && snapshot?.capabilities.tts)) && !ended && snapshot?.capabilities.stt && <button aria-expanded={showText} onClick={() => setShowText(value => !value)}>{intake ? "Nhập thông tin" : "Gõ câu hỏi"}</button>}
      {active && !ended && !recording && !busy && !speaking && kind !== "tuvi" && <button onClick={drawAtTable}>{kind === "tarot" ? "Rút bài trên bàn" : "Gieo quẻ trên bàn"}</button>}
      {(ended || exhausted) && <button className={styles.primary} onClick={() => onUpgrade(kind)}>Xem thêm</button>}
      {(ended || exhausted) && snapshot?.rewardTickets?.[0] && <button disabled={busy} onClick={() => void run("begin", snapshot.rewardTickets![0].id)}>Dùng vé thêm 5 phút</button>}
      <button disabled={busy} onClick={() => void leave()}>{encounter?.state === "waiting" ? "Rời hàng chờ" : active ? "Rời bàn và giữ phút" : "Về sân"}</button>
    </div>
    {busy && active && <p className={styles.status} role="status">Thầy đang suy ngẫm…</p>}
    {intake && !ended && (showText || !snapshot?.capabilities.stt) && <>
        <form key={JSON.stringify(draft)} className={styles.birth} onSubmit={event => { event.preventDefault(); void saveBirth(new FormData(event.currentTarget)); }}>
          <label>Họ tên thật<input name="fullName" maxLength={100} defaultValue={draft?.fullName === "Khách" ? "" : draft?.fullName} autoComplete="name" required /></label>
          <fieldset className={styles.dateRow}><legend>Ngày sinh</legend><label>Ngày<input name="day" type="number" min="1" max="31" defaultValue={draft?.day} required /></label>
          <label>Tháng<input name="month" type="number" min="1" max="12" defaultValue={draft?.month} required /></label>
          <label>Năm<input name="year" type="number" min="1900" max={new Date().getFullYear()} defaultValue={draft?.year} required /></label>
          </fieldset><label>Loại lịch<select aria-label="Loại lịch" name="calendarType" defaultValue={draft?.calendarType || ""} required><option value="">Chọn loại lịch</option><option value="solar">Dương lịch</option><option value="lunar">Âm lịch</option></select></label>
          <label>Giờ sinh (0–23)<input name="hour" type="number" min="0" max="23" defaultValue={draft?.birthHour} required /></label>
          <label>Phút sinh<input name="minute" type="number" min="0" max="59" defaultValue={draft?.birthMinute ?? 0} /></label>
          <label>Giới tính<select aria-label="Giới tính" name="gender" defaultValue={draft?.gender || ""} required><option value="">Chọn nam hoặc nữ</option><option value="male">Nam</option><option value="female">Nữ</option></select></label>
          <button className={styles.primary} disabled={busy || recording}>Lập lá số</button>
        </form>
      </>}
    {active && !intake && !ended && snapshot?.capabilities.tts === false && <p className={styles.status}>Thầy sẽ trả lời bằng chữ khi giọng đọc chưa sẵn sàng.</p>}
    {(showText || !snapshot?.capabilities.stt || !snapshot?.capabilities.tts) && active && !intake && !ended && <form className={styles.text} onSubmit={event => { event.preventDefault(); interruptSpeech(); void send(text); }}><textarea rows={2} aria-label="Câu hỏi cho Thầy" value={text} onChange={event => setText(event.target.value)} maxLength={1200} placeholder="Bạn muốn hỏi điều gì?" /><button disabled={busy || recording || !text.trim()}>Gửi</button></form>}
    {!!encounter?.messages.length && <details><summary>Xem lại cuộc trò chuyện</summary><div className={styles.transcript}>{encounter.messages.map(message => <p key={message.id}>{message.question && <><strong>Bạn:</strong> {message.question}<br /></>}<strong>{names[kind]}:</strong> {message.answer || "Đang suy ngẫm…"}{message.interrupted && " (đã ngắt lời)"}</p>)}</div></details>}
  </section>;
}
