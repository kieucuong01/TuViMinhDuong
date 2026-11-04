"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { createChartAction } from "@/app/actions";
import { LoadingSubmitButton } from "@/components/loading-submit-button";
import type { ChartInput } from "@/lib/chart";
import styles from "./tu-vi-quan-ecosystem-panel.module.css";

type Json = null | string | number | boolean | Json[] | { [key: string]: Json };
type Entry = { id: string; kind?: string; createdAt?: string; result?: Json; payload?: Json; text?: string; status?: string; dayKey?: string; hearts?: number; blessings?: number; myReactions?: string[]; placement?: "tree" | "lotus" };
type Cosmetic = { id: string; title: string; name?: string; value: string; price: number; slot?: string; description?: string };
export type QuanSnapshot = {
  profile: { id: string; alias: string; linked: boolean; points: number; earned: number; title: string; birthInput: ChartInput | null; equipped: Record<string, string> };
  chartSummary?: { menh: string; banMenh: string; cuc: string; canChi: string; summary: string[]; palaces: { name: string; branch: string; mainStars: string[] }[] };
  charts?: { id: string; label: string; year: number }[];
  sessions?: { id: string; minutes: number; status: string; paidAt?: string }[];
  daily?: Json; latestResult?: Json; history: Entry[]; inventory: Cosmetic[];
  wishes: Entry[]; myWishes: Entry[]; cosmetics: Cosmetic[]; event?: { id: string; title: string; startsAt: string; endsAt: string; active: boolean; joinedAt: string | null; claimed: boolean } | null; flags?: { publicPosting: boolean }; horoscope?: Json; serverTime: string;
  meditation?: { startedAt: string | null; completed: boolean }; shares?: { id: string; url: string; expiresAt: string; revoked: boolean }[]; recoveryCode?: string; share?: { id: string; url: string; snapshot: Json; expiresAt: string };
};
export type QuanExperience = "courtyard" | "teacher" | "tarot" | "iching" | "personal";
export type QuanPreferences = { quality: "low" | "medium" | "high"; reducedMotion: boolean; muted: boolean };
type Tab = "today" | "divination" | "wishes" | "explore" | "profile" | "settings";
const names: Record<Tab, string> = { today: "Hôm nay", divination: "Xem bói", wishes: "Cầu an", explore: "Khám phá", profile: "Hồ sơ của bạn", settings: "Tùy chọn" };
const labels: Record<string, string> = { title: "Thông điệp", body: "Lời luận", evidence: "Căn cứ", disclaimer: "Lưu ý", color: "Màu gợi ý", personalized: "Theo ngày sinh", primary: "Quẻ chính", changed: "Quẻ biến", changingLines: "Hào động", lower: "Hạ quái", upper: "Thượng quái", message: "Lời nhắn", advice: "Gợi ý", summary: "Tổng quan", interpretation: "Luận giải", meaning: "Ý nghĩa", name: "Tên", upright: "Xuôi", reversed: "Ngược", position: "Vị trí", month: "Tháng", narrative: "Lời luận", career: "Công việc", love: "Tình cảm", money: "Tài chính", lines: "Sáu hào", cards: "Lá bài", months: "Từng tháng", axes: "Các phương diện", score: "Mức độ", value: "Giá trị", label: "Phương diện", guidance: "Gợi ý thực hành", caution: "Điều cần lưu ý", reflection: "Câu hỏi suy ngẫm", action: "Việc nhỏ hôm nay", coins: "Ba đồng xu", changing: "Hào động", number: "Số quẻ", hexagram: "Quẻ chính", transformed: "Quẻ biến" };
function Reading({ value }: { value: Json | undefined }) {
  if (value === null || value === undefined) return null;
  if (typeof value !== "object") return <p>{typeof value === "boolean" ? value ? "Có" : "Không" : String(value)}</p>;
  if (Array.isArray(value)) return <div className={styles.reading}>{value.map((entry, i) => <article className={styles.card} key={i}><Reading value={entry} /></article>)}</div>;
  return <div className={styles.reading}>{Object.entries(value).filter(([key]) => !["id", "seed", "version", "contentVersion", "ruleVersion", "profileId", "birthInput", "input", "sourceId", "casts"].includes(key)).map(([key, entry]) => <section key={key}>{labels[key] && <strong>{labels[key]}</strong>}<Reading value={entry} /></section>)}</div>;
}

export default function QuanEcosystem({ alias, suspended, onOpen, onSnapshot, preferences, onPreferences, onLegacy, onExperience, lite, onLite, onRitual, readingPrice, activityRequest }: {
  alias: string; suspended: boolean; onOpen: (open: boolean) => void; onSnapshot: (data: QuanSnapshot) => void;
  onRitual: (kind: "greet" | "incense" | "meditate" | "idle") => void;
  readingPrice: number | null;
  activityRequest?: { tab: "today" | "divination" | "wishes"; id: number };
  lite: boolean; onLite: (lite: boolean) => void;
  onExperience: (experience: QuanExperience) => void;
  preferences: QuanPreferences; onPreferences: (data: QuanPreferences) => void; onLegacy: (panel: "session" | "support" | "map" | "restore") => void;
}) {
  const [dismissedReminder, setDismissedReminder] = useState("");
  const [tab, setTab] = useState<Tab | null>(null);
  const [data, setData] = useState<QuanSnapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [wish, setWish] = useState("");
  const [ritualNote, setRitualNote] = useState("");
  const [edit, setEdit] = useState<string | null>(null);
  const [publicWish, setPublicWish] = useState(false);
  const [placement, setPlacement] = useState<"tree" | "lotus">("tree");
  const [filter, setFilter] = useState<"all" | "tree" | "lotus" | "mine">("all");
  const [recovery, setRecovery] = useState("");
  const [showAlias, setShowAlias] = useState(false);
  const [source, setSource] = useState("");
  const [cards, setCards] = useState<1 | 3>(1);
  const [selected, setSelected] = useState<number[]>([]);
  const [drawExperience, setDrawExperience] = useState<QuanExperience>("tarot");
  const [drawStage, setDrawStage] = useState<"idle" | "choose" | "reveal">("idle");
  const [ritualUntil, setRitualUntil] = useState(0);
  const [serverOffset, setServerOffset] = useState(0);
  const [latest, setLatest] = useState<Json>();
  const [chartId, setChartId] = useState("");
  const [chartSummary, setChartSummary] = useState<QuanSnapshot["chartSummary"]>();
  const [annual, setAnnual] = useState<Json>();
  const [needsLogin, setNeedsLogin] = useState(false);
  const [now, setNow] = useState(Date.now);
  const [preview, setPreview] = useState<string>("");
  const heading = useRef<HTMLHeadingElement>(null);
  const dialog = useRef<HTMLElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const pending = useRef(false);
  const accept = useCallback((next: QuanSnapshot) => { setServerOffset(Date.now() - Date.parse(next.serverTime));
    setData(current => ({ ...next, share: next.share ?? current?.share })); onSnapshot(next);
    setRitualUntil(next.meditation?.startedAt && !next.meditation.completed ? Date.now() + Math.max(0, Date.parse(next.meditation.startedAt) + 60000 - Date.parse(next.serverTime)) : 0);
    if (next.horoscope) setAnnual(next.horoscope);
    if (next.chartSummary || !next.profile.birthInput) setChartSummary(next.chartSummary); }, [onSnapshot]);
  const request = useCallback(async (body?: Record<string, unknown>) => {
    if (pending.current) return null;
    pending.current = true; setBusy(true); setError("");
    try {
      const response = await fetch("/api/tu-vi-quan/ecosystem", body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : { cache: "no-store" });
      const result = await response.json();
      setNeedsLogin(response.status === 401);
      if (!response.ok) throw new Error(result.error || "Chưa kết nối được với quán. Bạn thử lại nhé.");
      accept(result);
      if (body?.action === "tarot" || body?.action === "iching") setLatest(result.latestResult);
      return result as QuanSnapshot;
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Vui lòng thử lại."); return null; }
    finally { pending.current = false; setBusy(false); }
  }, [accept]);
  useEffect(() => { const timer = setTimeout(() => { if (alias) void request(); }, 0); return () => clearTimeout(timer); }, [alias, request]);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  useEffect(() => {
    if (tab !== "wishes") return;
    const timer = setInterval(() => { if (document.visibilityState === "visible") void request(); }, 15000);
    return () => clearInterval(timer);
  }, [tab, request]);
  useEffect(() => { const timer = setTimeout(() => { if (suspended) setTab(null); }, 0); return () => clearTimeout(timer); }, [suspended]);
  useEffect(() => {
    if (!activityRequest) return;
    const timer = setTimeout(() => setTab(activityRequest.tab), 0);
    return () => clearTimeout(timer);
  }, [activityRequest]);
  useEffect(() => { onOpen(Boolean(tab)); if (tab) heading.current?.focus(); else opener.current?.focus(); }, [tab, onOpen]);
  useEffect(() => {
    if (!tab) return;
    function dismiss(event: KeyboardEvent) {
      if (event.key === "Escape") { event.preventDefault(); setTab(null); }
    }
    window.addEventListener("keydown", dismiss);
    return () => window.removeEventListener("keydown", dismiss);
  }, [tab]);
  useEffect(() => { onExperience(tab === "divination" ? drawExperience : tab === "profile" ? "personal" : "courtyard"); }, [tab, drawExperience, onExperience]);
  const dayKey = data ? new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(data.serverTime)) : "";
  useEffect(() => {
    const timer = setTimeout(() => {
      try { setDismissedReminder(localStorage.getItem("quan-daily-reminder") || ""); } catch { /* Storage may be disabled. */ }
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  function open(next: Tab) {
    opener.current = document.activeElement as HTMLElement;
    setTab(next);
    setMessage("");
    if (next === "explore" || next === "wishes" || !data) void request();
  }
  async function perform(action: string, fields: Record<string, unknown> = {}) { const result = await request({ action, ...fields }); if (result) setMessage("Đã lưu vào sổ của bạn."); return result; }
  async function ritual(kind: "incense" | "greet" | "meditate_start" | "meditate_finish", count?: number) {
    if (!await perform("ritual", { kind, count, note: ritualNote })) return;
    onRitual(kind === "meditate_start" ? "meditate" : kind === "meditate_finish" ? "idle" : kind);
  }
  function chooseShare(value: Json | undefined) {
    if (!value || typeof value !== "object" || Array.isArray(value) || typeof value.sourceId !== "string") return;
    setSource(value.sourceId);
    setPreview("");
    setTab("profile");
    requestAnimationFrame(() => document.getElementById("quan-share")?.focus());
  }
  function legacy(panel: "session" | "support" | "map" | "restore") { setTab(null); onLegacy(panel); }
  async function submitWish(event: FormEvent) { event.preventDefault(); if (await perform(edit ? "wish_edit" : "wish", { id: edit, text: wish, public: publicWish, placement })) { setWish(""); setEdit(null); setPublicWish(false); } }
  async function share() {
    const result = await perform("share", { sourceId: source, showAlias });
    if (!result?.share) return;
    const canvas = document.createElement("canvas"); canvas.width = 1080; canvas.height = 1350;
    const context = canvas.getContext("2d"); if (!context) return;
    context.fillStyle = "#241b20"; context.fillRect(0, 0, 1080, 1350); context.strokeStyle = "#edc38c"; context.lineWidth = 3; context.strokeRect(48, 48, 984, 1254);
    context.fillStyle = "#edc38c"; context.font = "bold 64px serif"; context.fillText("Tử Vi Quán", 90, 160);
    context.fillStyle = "#f9e9ce"; context.font = "32px sans-serif";
    const strings: string[] = []; const collect = (value: Json) => { if (typeof value === "string") strings.push(value); else if (Array.isArray(value)) value.forEach(collect); else if (value && typeof value === "object") Object.values(value).forEach(collect); }; collect(result.share.snapshot);
    const words = strings.join(" · ").split(/\s+/); let line = "", y = 260;
    for (const word of words) { if (context.measureText(line + word).width > 890) { context.fillText(line, 90, y); y += 49; line = ""; } if (y > 1140) break; line += word + " "; }
    if (y <= 1140) context.fillText(line, 90, y);
    context.font = "25px sans-serif"; context.fillText("Một lời gợi mở để tự nhìn lại • lasotinhhoa.vn", 90, 1245);
    setPreview(canvas.toDataURL("image/png"));
  }
  async function nativeShare() {
    if (!data?.share) return;
    const url = new URL(data.share.url, location.origin).href;
    try {
      if (navigator.share) {
        const bytes = Uint8Array.from(atob(preview.split(",")[1]), byte => byte.charCodeAt(0));
        const files = [new File([bytes], "tu-vi-quan.png", { type: "image/png" })];
        await navigator.share({ title: "Tử Vi Quán", url, ...(navigator.canShare?.({ files }) ? { files } : {}) });
      } else {
        await navigator.clipboard.writeText(url);
        setMessage("Đã chép liên kết.");
      }
    } catch (cause) {
      if (!(cause instanceof DOMException && cause.name === "AbortError")) setMessage("Bạn có thể tải ảnh hoặc sao chép địa chỉ của thiệp.");
    }
  }
  const remaining = (until: number) => Math.max(0, Math.ceil((until - now) / 1000));
  const event = data?.event;
  const eventActive = event?.active && !event.claimed && now - serverOffset < Date.parse(event.endsAt);
  const eventUntil = event?.joinedAt ? Date.parse(event.joinedAt) + 60000 + serverOffset : 0;
  const wishes = filter === "mine" ? data?.myWishes : data?.wishes.filter(item => filter === "all" || item.placement === filter);
  return <>
    <div className={styles.top} inert={Boolean(tab) || suspended}><button onClick={() => open("profile")}>{data?.profile.alias || alias} · {data?.profile.points ?? 0} điểm</button><button onClick={() => open("settings")}>Tùy chọn</button></div>
    <nav className={styles.dock} aria-label="Dịch vụ Tử Vi Quán" inert={Boolean(tab) || suspended}>
      {(["today", "divination", "wishes", "explore"] as Tab[]).map(item => {
        const newFortune = item === "today" && dayKey && !data?.daily && dismissedReminder !== dayKey;
        return <button key={item} onClick={() => open(item)}>{names[item]}{newFortune && <span className={styles.newFortune} aria-label="Có quẻ mới" title="Có quẻ mới" />}</button>;
      })}
    </nav>
    {tab && <div className={styles.scrim}><section ref={dialog} className={styles.panel} role="dialog" aria-modal="true" aria-labelledby="ecosystem-title" onKeyDown={event => {
      if (event.key === "Escape") { event.stopPropagation(); setTab(null); }
      if (event.key === "Tab") { event.stopPropagation(); const nodes = dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input,select,textarea,a[href]'); const first = nodes?.[0], last = nodes?.[nodes.length - 1]; if (first && last && ((event.shiftKey && (document.activeElement === first || document.activeElement === heading.current)) || (!event.shiftKey && document.activeElement === last))) { event.preventDefault(); (event.shiftKey ? last : first).focus(); } }
    }}>
      <header className={styles.header}><h2 id="ecosystem-title" ref={heading} tabIndex={-1}>{names[tab]}</h2><button onClick={() => setTab(null)} aria-label="Đóng cửa sổ">Đóng</button></header>
      {error && <p role="alert" className={styles.error}>{error}{needsLogin && <Link href="/dang-nhap?next=%2Ftu-vi-quan">Đăng nhập lại</Link>}<button disabled={busy} onClick={() => void request()}>Thử lại</button></p>}
      {busy && <p role="status">Đang mở sổ…</p>}{message && <p role="status">{message}</p>}
      <div aria-busy={busy} data-reduced-motion={preferences.reducedMotion} className={styles.body}>
      {tab === "today" && <>{dayKey && !data?.daily && dismissedReminder !== dayKey && <aside className={styles.card}>
        <p>Lần đầu ghé hôm nay? Chọn một chủ đề để nhận lời gợi mở.</p>
        <button onClick={() => { setDismissedReminder(dayKey); try { localStorage.setItem("quan-daily-reminder", dayKey); } catch { /* Keep the dismissal for this visit. */ } }}>Ẩn lời nhắc hôm nay</button>
      </aside>}<p>Một lời gợi mở mỗi ngày. Dùng để suy ngẫm, không thay thế quyết định của bạn.</p><div className={styles.row}>{[["career", "Công việc"], ["love", "Tình cảm"], ["money", "Tài chính"]].map(([topic, name]) => <button disabled={busy} key={topic} onClick={() => void perform("daily", { topic })}>{name}</button>)}</div><Reading value={data?.daily} />{data?.daily && <button onClick={() => chooseShare(data.daily)}>Tạo thiệp lời gợi mở</button>}<h3>Một phút an lành</h3><label>Lời nhắc riêng (tùy chọn)<input value={ritualNote} onChange={event => setRitualNote(event.target.value)} maxLength={120} /></label><div className={styles.row}>{[1, 3].map(count => <button key={count} disabled={busy} onClick={() => void ritual("incense", count)}>Thắp {count} nén hương</button>)}<button disabled={busy} onClick={() => void ritual("greet")}>Chắp tay chào</button></div><button disabled={busy || data?.meditation?.completed || remaining(ritualUntil) > 0} onClick={() => void ritual(ritualUntil ? "meditate_finish" : "meditate_start")}>{data?.meditation?.completed ? "Đã tĩnh tâm hôm nay" : ritualUntil ? remaining(ritualUntil) ? `Thở chậm · còn ${remaining(ritualUntil)} giây` : "Hoàn thành một phút tĩnh tâm" : "Bắt đầu một phút tĩnh tâm"}</button><p>Điểm mỗi ngày: lời gợi mở 10 · hương 5 · tĩnh tâm 5. Tarot và chia sẻ không cộng điểm.</p></>}
      {tab === "divination" && <><h3>Lá số cơ bản · Miễn phí</h3><p>Lập lá số, xem 12 cung và vận trình năm ngay trong quán.</p>{Boolean(data?.charts?.length) && <form className={styles.form} onSubmit={event => {
        event.preventDefault();
        if (!chartId) return;
        setAnnual(undefined);
        void perform("birth", { chartId });
      }}>
        <label>Dùng lá số đã lưu<select value={chartId} onChange={event => setChartId(event.target.value)} required>
          <option value="">Chọn lá số</option>
          {data?.charts?.map(chart => <option key={chart.id} value={chart.id}>{chart.label} · {chart.year}</option>)}
        </select></label>
        <div className={styles.row}><button disabled={busy || !chartId}>Dùng ngày giờ sinh từ lá số</button>
        {chartId && <Link href={`/la-so/${encodeURIComponent(chartId)}`}>Mở lá số đã lưu</Link>}</div>
      </form>}<div className={styles.row}><Link href="/xem-tuoi">Xem các công cụ hợp tuổi</Link></div><BirthForm input={data?.profile.birthInput} disabled={busy} onSave={input => { setChartId(""); setAnnual(undefined); void perform("birth", { input }); }} /><button disabled={busy || !data?.profile.birthInput} onClick={() => { setDrawExperience("personal"); void perform("horoscope", { year: Number(new Intl.DateTimeFormat("en", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric" }).format(new Date())) }); }}>Xem vận trình năm nay miễn phí</button><ChartSummary value={chartSummary} /><Horoscope value={annual} /><ReadingOffer input={data?.profile.birthInput} savedId={chartId} price={readingPrice} /><h3>Tarot · một khoảng dừng để tự hỏi</h3><p>Chọn một lá hoặc trải ba lá. Kết quả được giữ trong ngày.</p><div className={styles.row}>{([1, 3] as const).map(count => <button key={count} aria-pressed={cards === count} onClick={() => { setCards(count); setSelected([]); setDrawStage("idle"); }}>{count} lá</button>)}<button disabled={busy} onClick={() => { setDrawExperience("tarot"); setSelected([]); setDrawStage("choose"); }}>Xào bài và chọn</button></div>{drawStage === "choose" && <div className={styles.deck}>{Array.from({ length: 7 }, (_, i) => <button key={i} className={styles.tarotCard} aria-label={`Chọn lá ${i + 1}`} aria-pressed={selected.includes(i)} disabled={selected.includes(i) || selected.length >= cards || busy} onClick={async () => { const next = [...selected, i]; setSelected(next); if (next.length === cards) { if (await perform("tarot", { count: cards })) setDrawStage("reveal"); else setSelected([]); } }}>✦<span>Lá {i + 1}</span></button>)}</div>}{drawStage === "reveal" && <div className={styles.reveal}><TarotFaces value={latest} /><Reading value={latest} /><button onClick={() => chooseShare(latest)}>Tạo thiệp Tarot</button></div>}<h3>Kinh Dịch · gieo sáu hào</h3><p>Ba đồng xu mỗi hào được gieo tại máy chủ. Sáu hào và quẻ được ghi trong sổ.</p><button disabled={busy} onClick={() => { setDrawExperience("iching"); setDrawStage("idle"); setLatest(undefined); void perform("iching"); }}>Gieo quẻ</button>{drawStage === "idle" && drawExperience === "iching" && latest && <><CoinCasting key={String(latest && typeof latest === "object" && !Array.isArray(latest) ? latest.id : "cast")} value={latest} reducedMotion={preferences.reducedMotion} /><Reading value={latest} />{latest && <button onClick={() => chooseShare(latest)}>Tạo thiệp quẻ</button>}</>}<button onClick={() => legacy("session")}>Phiên chat riêng với thầy AI</button></>}
      {tab === "wishes" && <><button onClick={() => legacy("support")}>Hòm công đức · Ủng hộ tự nguyện</button><p>Lời nguyện mặc định chỉ mình bạn xem. Lời công khai có thể xuất hiện trên cây nguyện hoặc hồ sen trong 30 ngày.</p><form onSubmit={submitWish} className={styles.form}><label>Lời nguyện ({wish.length}/120)<textarea required maxLength={120} value={wish} onChange={event => setWish(event.target.value)} /></label><label><input type="checkbox" checked={publicWish} disabled={data?.flags?.publicPosting === false} onChange={event => setPublicWish(event.target.checked)} /> Chia sẻ công khai</label><label>Nơi gửi<select value={placement} onChange={event => setPlacement(event.target.value as "tree" | "lotus")}><option value="tree">Cây nguyện</option><option value="lotus">Hồ sen</option></select></label><button disabled={busy}>{edit ? "Lưu lời nguyện" : "Gửi lời nguyện"}</button>{edit && <button type="button" onClick={() => { setEdit(null); setWish(""); }}>Hủy sửa</button>}</form><label>Lọc lời nguyện<select value={filter} onChange={event => setFilter(event.target.value as typeof filter)}><option value="all">Tất cả lời công khai</option><option value="tree">Cây nguyện</option><option value="lotus">Hồ sen</option><option value="mine">Lời của tôi</option></select></label>{wishes?.map(item => <article className={styles.card} key={item.id}><p>{item.text}</p><small>{item.hearts ?? 0} trái tim · {item.blessings ?? 0} lời chúc</small>{filter === "mine" ? <div className={styles.row}><span>{({ public: "Công khai", pending: "Đang chờ duyệt", hidden: "Đã ẩn", private: "Riêng tư" }[item.status || "private"])}</span><button onClick={() => { setEdit(item.id); setWish(item.text || ""); setPublicWish(item.status === "public" || item.status === "pending"); setPlacement(item.placement || "tree"); }}>Sửa</button><button onClick={() => chooseShare({ sourceId: item.id })}>Tạo thiệp lời nguyện</button><button disabled={busy} onClick={() => void perform("wish_delete", { id: item.id })}>Xóa</button></div> : <><div className={styles.row}>{[["heart", "Trái tim"], ["peace", "Bình an"], ["strength", "Vững vàng"], ["joy", "Niềm vui"], ["hope", "Hy vọng"], ["care", "Yêu thương"]].map(([kind, label]) => <button key={kind} aria-pressed={item.myReactions?.includes(kind)} disabled={busy} onClick={() => void perform("wish_react", { id: item.id, kind })}>{label}</button>)}</div><button disabled={busy} onClick={() => void perform("wish_report", { id: item.id })}>Báo lời không phù hợp</button></>}</article>)}</>}
      {tab === "explore" && <><button onClick={() => legacy("map")}>Bản đồ · chọn nơi muốn đến</button><button onClick={() => legacy("support")}>Ủng hộ duy trì quán</button><h3>Buổi nguyện chung</h3>{event && <p><strong>{event.title}</strong> · {new Date(event.startsAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })} (giờ Việt Nam)</p>}<p>Tham gia một phút trong giờ diễn ra để nhận phần quà của buổi nguyện.</p><button disabled={busy || !eventActive || remaining(eventUntil) > 0} onClick={async () => { if (await perform(eventUntil ? "event_claim" : "event_join")) onRitual(eventUntil ? "incense" : "greet"); }}>{event?.claimed ? "Đã nhận quà" : eventUntil ? remaining(eventUntil) ? `Cùng tĩnh tâm · ${remaining(eventUntil)} giây` : "Nhận quà buổi nguyện" : "Tham gia buổi nguyện"}</button><h3>Góc trang trí · {data?.profile.points ?? 0} điểm</h3><p>Chỉ thay đổi diện mạo trong quán. Không làm thay đổi lời luận hay vận trình.</p><div className={styles.shop}>{data?.cosmetics.map(item => { const owned = data.inventory.some(entry => entry.id === item.id); return <article key={item.id} className={styles.card}><div className={styles.cosmeticPreview} data-slot={item.slot} aria-hidden="true">✦</div><h4>{item.title || item.name}</h4><p>{item.description}</p><p>{item.price} điểm</p><button disabled={busy || (!owned && data.profile.points < item.price)} onClick={() => void perform(owned ? "equip" : "buy", { itemId: item.id })}>{owned ? "Dùng vật phẩm" : "Đổi bằng điểm"}</button></article>; })}</div></>}
      {tab === "profile" && <><p><strong>{data?.profile.alias}</strong> · {data?.profile.title} · {data?.profile.points ?? 0} điểm</p>{data?.profile.linked ? <p>Đã gắn với tài khoản Lá số tinh hoa.</p> : <><Link href="/dang-nhap?next=%2Ftu-vi-quan">Đăng nhập tài khoản hiện có</Link><button disabled={busy} onClick={() => void perform("link")}>Gắn hồ sơ quán với tài khoản đã đăng nhập</button></>}<h3>Mã khôi phục hồ sơ quán</h3><p>Giữ mã riêng cho bạn. Người có mã có thể khôi phục hồ sơ.</p><button disabled={busy} onClick={() => void perform("recovery_issue")}>Tạo mã khôi phục mới</button>{data?.recoveryCode && <output className={styles.code}>{data.recoveryCode}</output>}<form onSubmit={event => { event.preventDefault(); void perform("recovery_restore", { code: recovery }); }} className={styles.form}><label>Mã đã lưu<input autoComplete="off" value={recovery} onChange={event => setRecovery(event.target.value)} required /></label><button disabled={busy}>Khôi phục hồ sơ quán</button></form><button onClick={() => legacy("restore")}>Khôi phục lượt xem đã mua</button>{Boolean(data?.sessions?.length) && <section className={styles.card} aria-label="Các phiên đã thanh toán"><h3>Các phiên đã thanh toán</h3>{data?.sessions?.map(session => <a key={session.id} href={`/tu-vi-quan?session=${encodeURIComponent(session.id)}`}>{session.status === "ended" ? "Đọc lại" : "Mở phiên"} {session.minutes} phút{session.paidAt ? ` · ${new Date(session.paidAt).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}` : ""}</a>)}</section>}<h3>Vật phẩm của bạn</h3>{data?.inventory.length ? <div className={styles.row}>{data.inventory.map(item => <button key={item.id} disabled={busy || Boolean(item.slot && data.profile.equipped[item.slot] === item.value)} onClick={() => void perform("equip", { itemId: item.id })}>{item.title}{item.slot && data.profile.equipped[item.slot] === item.value ? " · Đang dùng" : " · Dùng"}</button>)}</div> : <p>Chưa có vật phẩm. Ghé góc trang trí trong Khám phá.</p>}<h3>Sổ trải nghiệm</h3>{data?.history.length ? data.history.map(item => <article className={styles.card} key={item.id}><h4>{({ daily: "Lời gợi mở", tarot1: "Tarot một lá", tarot3: "Tarot ba lá", iching: "Kinh Dịch", incense: "Thắp hương", greet: "Chắp tay", meditate: "Tĩnh tâm" }[item.kind || ""] ?? "Trải nghiệm tại quán")}</h4>{item.createdAt && <time>{new Date(item.createdAt).toLocaleString("vi-VN")}</time>}<Reading value={item.result ?? item.payload} />{["daily","tarot1","tarot3","iching"].includes(item.kind || "") && <button aria-pressed={source === item.id} onClick={() => { setSource(item.id); setPreview(""); }}>Chọn để chia sẻ</button>}</article>) : <p>Những lần ghé quán của bạn sẽ được ghi ở đây.</p>}<h3>Các liên kết đã chia sẻ</h3>{data?.shares?.filter(item => !item.revoked).map(item => <div className={styles.row} key={item.id}><a href={item.url} target="_blank" rel="noreferrer">Mở thiệp</a><button disabled={busy} onClick={async () => { if (await perform("share_revoke", { id: item.id }) && item.id === data?.share?.id) setPreview(""); }}>Thu hồi</button></div>)}<h3 id="quan-share" tabIndex={-1}>Tấm thiệp của bạn</h3><p>Thiệp có liên kết công khai. Nếu bạn chọn một lời nguyện của mình, nội dung lời đó có thể hiện trên thiệp sau khi quán kiểm tra. Các lời nguyện riêng khác và ngày giờ sinh không xuất hiện.</p><label><input type="checkbox" checked={showAlias} onChange={event => setShowAlias(event.target.checked)} /> Hiện bí danh trên thiệp</label><button aria-pressed={source === "achievement"} onClick={() => setSource("achievement")}>Chọn thành tựu</button><button disabled={busy || !source} onClick={() => void share()}>Tạo thiệp 1080 × 1350</button>{preview && <><Image unoptimized className={styles.shareImage} src={preview} alt="Xem trước thiệp Tử Vi Quán" width={1080} height={1350} /><a className={styles.download} href={preview} download="tu-vi-quan.png" onClick={() => { void fetch("/api/tu-vi-quan/ecosystem", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "telemetry", name: "share_image" }), keepalive: true }).catch(() => {}); }}>Tải ảnh</a><button onClick={() => void nativeShare()}>Chia sẻ thiệp</button><a href={data?.share?.url} target="_blank" rel="noreferrer">Mở thiệp</a><button disabled={busy} onClick={async () => { if (data?.share && await perform("share_revoke", { id: data.share.id })) setPreview(""); }}>Thu hồi liên kết</button></>}</>}
      {tab === "settings" && <><p>Các lựa chọn này chỉ thay đổi trải nghiệm trên thiết bị này.</p><label>Chất lượng cảnh<select value={preferences.quality} onChange={event => onPreferences({ ...preferences, quality: event.target.value as QuanPreferences["quality"] })}><option value="low">Nhẹ</option><option value="medium">Vừa</option><option value="high">Cao</option></select></label><label><input type="checkbox" checked={preferences.reducedMotion} onChange={event => onPreferences({ ...preferences, reducedMotion: event.target.checked })} /> Giảm chuyển động</label><label><input type="checkbox" checked={preferences.muted} onChange={event => onPreferences({ ...preferences, muted: event.target.checked })} /> Tắt âm thanh</label><button onClick={() => onLite(!lite)}>{lite ? "Thử lại 3D" : "Chuyển sang giao diện nhẹ"}</button></>}
      </div>
    </section></div>}
  </>;
}

function ReadingOffer({ input, savedId, price }: { input: ChartInput | null | undefined; savedId: string; price: number | null }) {
  return <section className={styles.card} aria-label="Luận giải chuyên sâu">
    <h3>Luận giải chuyên sâu</h3>
    <p>Bản luận 9 chương theo lá số của bạn, lưu để đọc lại. Thanh toán qua PayOS.</p>
    {price !== null && <strong>{new Intl.NumberFormat("vi-VN").format(price)} đ · trả một lần</strong>}
    {price === null ? <p>Chuyên sâu đang tạm đóng thanh toán.</p> : savedId ? (
      <Link className={styles.download} href={`/la-so/${encodeURIComponent(savedId)}?offer=quan-payos`}>Mở luận giải chuyên sâu qua PayOS</Link>
    ) : input ? (
      <form action={createChartAction} data-loading-message="Đang chuẩn bị lá số...">
        <input type="hidden" name="readingOffer" value="quan-payos" />
        {Object.entries(input).map(([key, value]) => value !== undefined && <input type="hidden" name={key} value={String(value)} key={key} />)}
        <LoadingSubmitButton loadingText="Đang chuẩn bị lá số...">Mở luận giải chuyên sâu qua PayOS</LoadingSubmitButton>
      </form>
    ) : <p>Lập lá số miễn phí ở trên để dùng cùng thông tin sinh cho bản chuyên sâu.</p>}
  </section>;
}

function BirthForm({ input, disabled, onSave }: { input: ChartInput | null | undefined; disabled: boolean; onSave: (input: ChartInput | null) => void }) {
  return <details><summary>Lập lá số miễn phí</summary><p>Thông tin này chỉ dành cho hồ sơ của bạn. Chọn đúng lịch và giờ sinh bạn biết.</p><form className={styles.form} onSubmit={event => { event.preventDefault(); const form = new FormData(event.currentTarget); onSave({ fullName: String(form.get("fullName")), gender: form.get("gender") as ChartInput["gender"], calendarType: form.get("calendarType") as ChartInput["calendarType"], day: Number(form.get("day")), month: Number(form.get("month")), year: Number(form.get("year")), birthHour: Number(form.get("birthHour")), birthMinute: Number(form.get("birthMinute")), viewYear: new Date().getFullYear(), timezone: "Asia/Ho_Chi_Minh" }); }}><label>Tên gọi<input name="fullName" required maxLength={80} defaultValue={input?.fullName} /></label><label>Giới tính<select name="gender" defaultValue={input?.gender || "male"}><option value="male">Nam</option><option value="female">Nữ</option></select></label><label>Lịch<select name="calendarType" defaultValue={input?.calendarType || "solar"}><option value="solar">Dương lịch</option><option value="lunar">Âm lịch</option></select></label><div className={styles.row}>{[["day", "Ngày", 1, 31], ["month", "Tháng", 1, 12], ["year", "Năm sinh", 1900, new Date().getFullYear()], ["birthHour", "Giờ", 0, 23], ["birthMinute", "Phút", 0, 59]].map(([name, label, min, max]) => <label key={name}>{label}<input type="number" name={String(name)} required min={Number(min)} max={Number(max)} defaultValue={input?.[name as keyof ChartInput] ?? (name === "year" ? 1990 : Number(min) || 0)} /></label>)}</div><button disabled={disabled}>Lưu ngày giờ sinh</button>{input && <button type="button" disabled={disabled} onClick={() => onSave(null)}>Xóa thông tin ngày sinh</button>}</form></details>;
}

function Horoscope({ value }: { value: Json | undefined }) {
  const [view, setView] = useState<"depth" | "flat" | "table">("flat");
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const areas = Array.isArray(value.areas) ? value.areas.filter((area): area is Record<string, Json> => Boolean(area) && typeof area === "object" && !Array.isArray(area)) : [];
  const count = areas.length;
  const canPlot = count > 2 && areas.every(area => typeof area.score === "number");
  const point = (index: number, radius: number) => { const angle = index * Math.PI * 2 / count - Math.PI / 2; return `${180 + Math.cos(angle) * radius},${180 + Math.sin(angle) * radius}`; };
  return <section className={styles.reading}><h3>Vận trình {String(value.year || "")}</h3><p>Các mức độ là chỉ dẫn từ lá số, không phải xác suất hay lời hứa kết quả.</p><div className={styles.row}>{[["depth", "Chiều sâu"], ["flat", "Hai chiều"], ["table", "Bảng chữ"]].map(([key, label]) => <button key={key} aria-pressed={view === key} onClick={() => setView(key as typeof view)}>{label}</button>)}</div>{view !== "table" && canPlot && <div style={{ perspective: 800 }}><svg role="img" aria-label="Biểu đồ các phương diện; xem số và lời giải trong bảng bên dưới" viewBox="0 0 360 360" style={{ width: "100%", maxWidth: 430, transform: view === "depth" ? "rotateX(25deg) rotateZ(-8deg)" : undefined }}>{[40, 80, 120].map(radius => <polygon key={radius} points={areas.map((_, index) => point(index, radius)).join(" ")} fill="none" stroke="#efbc8140" />)}{areas.map((area, index) => <g key={index}><line x1="180" y1="180" x2={point(index, 120).split(",")[0]} y2={point(index, 120).split(",")[1]} stroke="#efbc8140" /><text x={point(index, 148).split(",")[0]} y={point(index, 148).split(",")[1]} textAnchor="middle" fill="#f9e9ce" fontSize="12">{String(area.title || area.label || "")}</text></g>)}<polygon points={areas.map((area, index) => point(index, Math.max(0, Math.min(100, Number(area.score) || 0)) * 1.2)).join(" ")} fill="#f3c48355" stroke="#f3c483" strokeWidth="2" /></svg></div>}<table className={styles.table}><caption>Các phương diện trong năm</caption><thead><tr><th>Phương diện</th><th>Mức độ</th><th>Lời gợi mở</th></tr></thead><tbody>{areas.map((area, index) => <tr key={index}><th scope="row">{String(area.title || area.key)}</th><td>{area.score === null ? String(area.label || "Chưa đủ dữ liệu") : `${String(area.score ?? "")} · ${String(area.label || "")}`}</td><td>{String(area.body || "")}<p>{String(area.action || "")}</p></td></tr>)}</tbody></table><h3>Lời luận từng tháng</h3><Reading value={value.months} /></section>;
}

function TarotFaces({ value }: { value: Json | undefined }) {
  if (!value || typeof value !== "object" || Array.isArray(value) || !Array.isArray(value.cards)) return null;
  return <div className={styles.deck}>{value.cards.map((card, index) => {
    if (!card || typeof card !== "object" || Array.isArray(card)) return null;
    const rank = Number(String(card.id).split("-").at(-1));
    const petals = Number.isFinite(rank) ? 3 + rank % 9 : 6;
    const shade = ["#e0b673", "#e79781", "#83c7cb", "#c0b1e9", "#a9c483"][rank < 22 ? 0 : 1 + Math.floor((rank - 22) / 14)] || "#e0b673";
    return <figure key={index} className={styles.face}>
      <svg viewBox="0 0 100 110" aria-hidden="true">
        <rect x="4" y="4" width="92" height="102" rx="9" fill="none" stroke={shade} opacity=".42" />
        <circle cx="50" cy="55" r="32" fill="none" stroke={shade} />
        {Array.from({ length: petals }, (_, petal) => <path key={petal} d="M50 54 Q34 37 50 24 Q66 37 50 54Z" transform={`rotate(${petal * 360 / petals} 50 55)`} fill={shade} fillOpacity=".28" stroke={shade} />)}
        <circle cx="50" cy="55" r="7" fill={shade} />
      </svg>
      <figcaption>{String(card.title || "Tarot")}</figcaption>
    </figure>;
  })}</div>;
}

function CoinCasting({ value, reducedMotion }: { value: Json | undefined; reducedMotion: boolean }) {
  const [round, setRound] = useState(0);
  const casts = value && typeof value === "object" && !Array.isArray(value) && Array.isArray(value.casts) ? value.casts : [];
  const count = casts.length;
  useEffect(() => {
    if (reducedMotion || round >= count) return;
    const timer = setTimeout(() => setRound(round + 1), 360);
    return () => clearTimeout(timer);
  }, [count, reducedMotion, round]);
  if (reducedMotion || !count || round >= count) return <Hexagram value={value} />;
  const coins = casts[round];
  return <div className={styles.card}>
    <p role="status">Đang gieo hào {round + 1} / 6</p>
    <div className={styles.coins} key={round} aria-hidden="true">{Array.isArray(coins) && coins.map((coin, index) => <span key={index}>{coin === 3 ? "Dương" : "Âm"}</span>)}</div>
    <button onClick={() => setRound(count)}>Xem sáu hào ngay</button>
  </div>;
}

function Hexagram({ value }: { value: Json | undefined }) {
  if (!value || typeof value !== "object" || Array.isArray(value) || !Array.isArray(value.lines)) return null;
  return <ol className={styles.hexagram} aria-label="Sáu hào Kinh Dịch, hào đầu tiên ở dưới">
    {value.lines.map((line, index) => <li key={index}>
      <span className={styles.coinLine} data-yin={line === 6 || line === 8} data-changing={line === 6 || line === 9} aria-hidden="true" />
      <span>Hào {index + 1} · {line === 6 || line === 8 ? "Âm" : "Dương"}{line === 6 || line === 9 ? " động" : ""}</span>
    </li>)}
  </ol>;
}

function ChartSummary({ value }: { value: QuanSnapshot["chartSummary"] }) {
  if (!value) return null;
  return <article className={styles.card}>
    <h3>Tóm tắt lá số</h3>
    <p>Mệnh {value.menh} · {value.banMenh} · {value.cuc}</p>
    {value.summary.map(text => <p key={text}>{text}</p>)}
    <details><summary>Xem 12 cung và chính tinh</summary>
      <ul>{value.palaces.map(palace => <li key={palace.name}><strong>{palace.name}</strong> tại {palace.branch} · {palace.mainStars.join(", ") || "Không có chính tinh"}</li>)}</ul>
    </details>
  </article>;
}
