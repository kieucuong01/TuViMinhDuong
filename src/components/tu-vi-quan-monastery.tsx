"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, BookOpen, CircleDot, Flame, Flower2, HandHeart, Pause, Play, Share2, Ticket, Volume2, VolumeX, Wind } from "lucide-react";
import type { QuanSnapshot } from "./tu-vi-quan-ecosystem-panel";
import type { QuanPractice } from "@/lib/tu-vi-quan-monastery";
import { createMonasteryAudio } from "./tu-vi-quan-monastery-audio";
import { QUAN_MONASTERY_SEATS } from "@/lib/tu-vi-quan-world.mjs";
import styles from "./tu-vi-quan-monastery.module.css";

export type MonasteryPose = "idle" | "greet" | "bow" | "meditate" | "beads" | "chant" | "incense";
const names: Record<QuanPractice, string> = { meditate: "Thiền theo hơi thở", beads: "Lần tràng hạt", chant: "Tụng kinh" };
const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
type Props = { initial?: QuanSnapshot; alias: string; participants: number; connected: boolean; seatIndex: number | null; occupied: { index: number; alias: string }[]; seatError: string; onSeat(index: number | null): void; lite: boolean; onLeave(): void; onSnapshot(value: QuanSnapshot): void; onPose(pose: MonasteryPose): void; onUseTicket(id: string): void };

export default function QuanMonastery({ initial, alias, participants, connected, seatIndex, occupied, seatError, onSeat, lite, onLeave, onSnapshot, onPose, onUseTicket }: Props) {
  const [data, setData] = useState(initial);
  const [mode, setMode] = useState<QuanPractice | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [schedule, setSchedule] = useState(false);
  const [sound, setSound] = useState(true);
  const [showSeats, setShowSeats] = useState(false);
  const [confirmTicket, setConfirmTicket] = useState(false);
  const [breath, setBreath] = useState(0);
  const pending = useRef(false);
  const audio = useRef<ReturnType<typeof createMonasteryAudio> | null>(null);
  const currentMode = useRef(mode);
  useEffect(() => { currentMode.current = mode; }, [mode]);
  const view = data?.monastery;
  const practice = mode ? view?.practices[mode] : null;
  const running = Boolean(practice?.running && connected && seatIndex !== null);
  const actions = practice?.taps ?? 0;
  const seconds = practice?.seconds ?? 0;
  const goal = mode === "meditate" ? 180 : 120;
  const ready = mode === "meditate" ? seconds >= 60 : seconds >= goal && (mode !== "beads" || actions >= 27);
  useEffect(() => { if (!running) audio.current?.stop(); }, [running]);
  useEffect(() => {
    if (seatIndex === null) return;
    const timer = setTimeout(() => { setNotice(""); setError(""); setShowSeats(false); }, 0);
    return () => clearTimeout(timer);
  }, [seatIndex]);

  const request = useCallback(async (body?: Record<string, unknown>) => {
    if (pending.current) return null;
    pending.current = true; setBusy(true); setError("");
    try {
      const response = await fetch("/api/tu-vi-quan/ecosystem", body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Chưa lưu được hoạt động. Bạn thử lại nhé.");
      setData(result); onSnapshot(result);
      return result as QuanSnapshot;
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Chưa kết nối được Tu viện."); return null; }
    finally { pending.current = false; setBusy(false); }
  }, [onSnapshot]);

  useEffect(() => { const timer = setTimeout(() => { void request(); }, 0); return () => clearTimeout(timer); }, [request]);
  useEffect(() => {
    if (!mode) return;
    const pause = () => {
      if (document.hidden) {
        onPose("idle"); audio.current?.stop();
        void request({ action: "practice_pause", mode });
      }
    };
    const timer = setInterval(() => {
      if (document.hidden || !running) return;
      void request({ action: "practice_tick", mode });
    }, 5000);
    document.addEventListener("visibilitychange", pause);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", pause); };
  }, [mode, running, request, onPose]);
  useEffect(() => {
    if (!running || mode !== "meditate") return;
    const timer = setInterval(() => setBreath(value => (value + 1) % 8), 1000);
    return () => clearInterval(timer);
  }, [running, mode]);
  useEffect(() => () => {
    audio.current?.close();
    const mode = currentMode.current;
    if (mode) void fetch("/api/tu-vi-quan/ecosystem", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "practice_pause", mode }), keepalive: true }).catch(() => {});
  }, []);

  async function playActivity(next: QuanPractice) {
    if (!sound) return;
    try { audio.current ??= createMonasteryAudio(); await audio.current.start(next); }
    catch { setNotice("Chưa phát được âm thanh. Bạn chạm nút bật tiếng để thử lại nhé."); }
  }
  useEffect(() => {
    if (seatIndex !== null && connected) return;
    audio.current?.stop();
    const timer = setTimeout(() => {
      if (currentMode.current) void request({ action: "practice_pause", mode: currentMode.current });
    }, 0);
    return () => clearTimeout(timer);
  }, [seatIndex, connected, request]);
  async function start(next: QuanPractice) {
    if (!connected || seatIndex === null) { setShowSeats(true); setNotice("Chọn một đệm trống để bắt đầu thực hành."); return; }
    void playActivity(next);
    const result = await request({ action: "practice_start", mode: next });
    if (!result) { audio.current?.stop(); return; }
    setShowSeats(false); setMode(next); setNotice(""); onPose(next); setSchedule(false);
  }
  async function tick(tap: boolean) {
    const before = actions;
    const result = await request({ action: "practice_tick", mode, tap });
    if (result && mode && result.monastery.practices[mode]!.taps > before && sound) audio.current?.tap();
    else if (tap && result) setNotice("Chậm một nhịp thở rồi lần hạt tiếp theo nhé.");
  }
  async function finish() {
    const before = data?.profile.points ?? 0;
    const result = await request({ action: "practice_finish", mode });
    if (!result) return;
    onPose("idle");
    const earned = result.profile.points - before;
    setNotice(earned > 0 ? `Hoàn thành. Bạn nhận ${earned} Điểm An Nhiên.` : "Đã lưu lượt thực hành. Bạn đã nhận đủ điểm mục này hôm nay.");
    audio.current?.stop();
  }
  async function gesture(pose: "greet" | "bow" | "incense") {
    if (mode && running && !(await request({ action: "practice_pause", mode }))) return;
    audio.current?.stop(); setMode(null); onPose(pose); setNotice(pose === "bow" ? "Cúi mình trước điện Phật. Chạm Ra sân khi bạn muốn trở về." : pose === "greet" ? "Chắp tay, thả lỏng vai và dành một khoảng lặng cho mình." : "");
    if (pose === "incense") {
      const result = await request({ action: "ritual", kind: "incense", count: 1 });
      if (result) setNotice(result.incensePoints ? "Đã thắp hương. +5 Điểm An Nhiên." : "Đã thắp hương. Bạn đã nhận điểm hương hôm nay.");
    }
  }
  async function share() {
    const response = await request({ action: "share", sourceId: "achievement", showAlias: false });
    if (!response?.share) return;
    const url = new URL(response.share.url, location.origin).href;
    const text = "Hôm nay đã ngồi yên được vài phút, chuyện deadline tính sau. Ghé Tu viện An Nhiên cùng mình nhé.";
    try {
      if (navigator.share) await navigator.share({ title: "Một khoảng an nhiên", text, url });
      else { await navigator.clipboard.writeText(text + " " + url); setNotice("Đã sao chép lời mời và thiệp."); }
    } catch (cause) { if (!(cause instanceof DOMException && cause.name === "AbortError")) setNotice("Bạn có thể tạo và tải thiệp trong Hồ sơ ở sân quán."); }
  }

  return <section className={styles.hud} aria-label="Tu viện An Nhiên">
    <header className={styles.top}>
      <div className={styles.identity}><h1>Tu viện An Nhiên</h1><p>{alias} · {participants} người cùng ngồi</p><span><Flower2 size={16} aria-hidden="true" /> {data?.profile.points ?? 0} điểm · {data?.profile.title || "Mời bạn ngồi"}</span></div>
      <div className={styles.tools}><button onClick={() => { setSound(value => !value); if (sound) audio.current?.stop(); else if (mode && running && seatIndex !== null) { audio.current ??= createMonasteryAudio(); void audio.current.start(mode); } }} aria-label={sound ? "Tắt tiếng nghi thức" : "Bật tiếng nghi thức"}>{sound ? <Volume2 /> : <VolumeX />}</button><button onClick={onLeave}><ArrowLeft size={18} /> Ra sân</button></div>
    </header>
    <button className={styles.scheduleToggle} onClick={() => setSchedule(value => !value)} aria-expanded={schedule}>Thời khóa hôm nay</button>
    {schedule && <aside className={styles.schedule} aria-label="Thời khóa hôm nay"><h2>Một khoảng an nhiên</h2><p>Thiền {view?.rewards.meditate ?? 0}/10 · Tràng hạt hoặc tụng kinh {view?.rewards.chant ?? 0}/10 điểm.</p><p>Hành trình {Math.min(7, view?.visits ?? 0)}/7 ngày. {view?.lotusBloomed ? "Đèn kỷ niệm bảy ngày đã vào kho vật phẩm." : "Hoàn thành một nghi thức vào bảy ngày khác nhau để nhận đèn kỷ niệm."}</p><button disabled={busy} onClick={() => void share()}><Share2 size={16} /> Mời bạn cùng ngồi</button><p className={styles.credit}><a href="https://sketchfab.com/3d-models/33699be99fd64375bf0371c0e0c12f70" target="_blank" rel="noreferrer">Tượng Phật · Minneapolis Institute of Art · CC0</a></p><h3>Thêm thời gian gặp thầy</h3><p>60 điểm đổi 5 phút · một vé mỗi ngày · giữ tối đa hai vé.</p>{confirmTicket ? <><p>Dùng 60 điểm để nhận thêm 5 phút trò chuyện?</p><button disabled={busy} onClick={async () => { if (await request({ action: "redeem_voice" })) { setConfirmTicket(false); setNotice("Vé 5 phút đã vào sổ của bạn."); } }}>Xác nhận đổi vé</button><button onClick={() => setConfirmTicket(false)}>Để sau</button></> : <button disabled={busy || !data || data.profile.points < 60 || view?.redeemedToday || (view?.tickets.length ?? 0) >= 2} onClick={() => setConfirmTicket(true)}><Ticket size={16} /> {view?.redeemedToday ? "Đã đổi vé hôm nay" : "Đổi vé · 60 điểm"}</button>}{view?.tickets.map(ticket => <button key={ticket.id} disabled={busy} onClick={() => onUseTicket(ticket.id)}>{ticket.remainingSeconds < 300 ? `Tiếp tục · ${clock(ticket.remainingSeconds)} còn lại` : "Dùng vé 5 phút gặp thầy"}</button>)}</aside>}
    <div className={styles.seatStatus}><button onClick={() => setShowSeats(value => !value)} aria-expanded={showSeats}>{seatIndex === null ? "Chọn chỗ ngồi" : `Đệm số ${seatIndex + 1}`}</button>{seatIndex !== null && <button disabled={busy} onClick={async () => { if (mode && running) await request({ action: "practice_pause", mode }); audio.current?.stop(); setMode(null); onPose("idle"); onSeat(null); }}>Đứng dậy</button>}</div>
    {showSeats && <aside className={styles.seatPicker} aria-label="Chọn đệm ngồi"><h2>Chọn một đệm trống</h2><p>{connected ? "Chạm vào vùng tròn trong điện hoặc chọn số đệm bên dưới." : "Đang kết nối Tu viện. Các nghi thức tính giờ cần chỗ ngồi trực tuyến."}</p><div className={styles.seatGrid}>{QUAN_MONASTERY_SEATS.map(seat => { const owner = occupied.find(person => person.index === seat.index); return <button key={seat.index} disabled={!connected || Boolean(owner)} aria-pressed={seatIndex === seat.index} title={owner ? `Đệm ${seat.index + 1} · ${owner.alias}` : `Đệm ${seat.index + 1} còn trống`} onClick={() => { onSeat(seat.index); setShowSeats(false); }}>{seat.index + 1}{owner && <small>Đã có người</small>}</button>; })}</div><button onClick={() => setShowSeats(false)}>Đóng chọn chỗ</button></aside>}
    {seatError && <p className={styles.notice} role="alert">{seatError}</p>}
    {lite && !mode && <div className={styles.lite}><Flower2 /><h2>Điện Phật · Tu viện An Nhiên</h2><p>Chọn nghi thức ở thanh phía dưới để bắt đầu.</p></div>}
    {mode && <article className={styles.practice} aria-label={names[mode]}><div className={styles.practiceHeading}><h2>{names[mode]}</h2><span>{clock(seconds)} / {clock(goal)}</span></div><progress aria-label="Thời gian thực hành đã được lưu" value={seconds} max={goal} />
      {mode === "meditate" && <><div className={`${styles.breath} ${breath < 4 ? styles.inhale : ""}`} aria-hidden="true"><Wind /></div><p>{!running ? "Đang tạm dừng" : breath < 4 ? "Hít vào nhẹ nhàng" : "Thở ra, thả lỏng vai"}</p><p>Một phút nhận 5 điểm, đủ ba phút nhận tổng 10 điểm hôm nay.</p></>}
      {mode === "beads" && <><svg className={styles.beads} viewBox="0 0 260 130" aria-hidden="true">{Array.from({ length: 27 }, (_, index) => { const angle = Math.PI * 2 * index / 27; return <circle key={index} cx={130 + Math.cos(angle) * 108} cy={61 + Math.sin(angle) * 44} r="6" fill={index < actions ? "#f4ce76" : "#805039"} />; })}<text x="130" y="68" textAnchor="middle">{actions}/27</text></svg><button className={styles.primary} disabled={busy || !running || actions >= 27} onClick={() => void tick(true)}>Lần một hạt</button><p>Chạm từng hạt theo nhịp thở, cách nhau ít nhất bốn giây. Đủ 27 hạt và hai phút để hoàn thành.</p></>}
      {mode === "chant" && <><p className={styles.sutra}>Nam mô A Di Đà Phật</p><p>Niệm chậm theo nhịp thở của bạn trong hai phút. Tràng hạt và tụng kinh dùng chung hạn mức 10 điểm/ngày.</p></>}

      <div className={styles.controls}><button disabled={busy} onClick={async () => { if (running) { if (await request({ action: "practice_pause", mode })) { onPose("idle"); audio.current?.stop(); } } else await start(mode); }}>{running ? <Pause size={17} /> : <Play size={17} />}{running ? "Tạm dừng" : "Tiếp tục"}</button><button className={styles.primary} disabled={busy || !ready || seatIndex === null || !connected} onClick={() => void finish()}>Hoàn thành</button><button disabled={busy} onClick={async () => { if (!running || await request({ action: "practice_pause", mode })) { setMode(null); onPose("idle"); audio.current?.stop(); } }}>Thu gọn</button></div>
    </article>}
    {(notice || error) && <p className={styles.notice} role={error ? "alert" : "status"}>{error || notice}</p>}
    <nav className={styles.rituals} aria-label="Nghi thức trong Tu viện">
      <button disabled={busy} onClick={() => void gesture("greet")}><HandHeart />Chắp tay</button><button disabled={busy} onClick={() => void gesture("bow")}><HandHeart className={styles.bowIcon} />Lạy</button><button disabled={busy} onClick={() => void gesture("incense")}><Flame />Thắp hương</button><button disabled={busy} onClick={() => void start("meditate")} aria-pressed={mode === "meditate"}><Wind />Thiền</button><button disabled={busy} onClick={() => void start("chant")} aria-pressed={mode === "chant"}><BookOpen />Tụng kinh</button><button disabled={busy} onClick={() => void start("beads")} aria-pressed={mode === "beads"}><CircleDot />Tràng hạt</button>
    </nav>
  </section>;
}
