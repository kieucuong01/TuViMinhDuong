"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { ArrowLeft, BookOpen, CircleHelp, Compass, Flame, Heart, MapPin, Navigation, X } from "lucide-react";
import { QUAN_BLOCKS, QUAN_BOUNDS, QUAN_POND, QUAN_SPAWN, QUAN_STATIONS } from "@/lib/tu-vi-quan-world.mjs";
import styles from "./tu-vi-quan.module.css";
import type { EncounterKind, EncounterVisual } from "./tu-vi-quan-encounter";
import type { QuanSocialMessage } from "./tu-vi-quan-social";
import type { QuanSnapshot, QuanPreferences, QuanExperience, QuanLeader } from "./tu-vi-quan-ecosystem-panel";

const Scene = dynamic(() => import("./tu-vi-quan-scene"), { ssr: false });
const Encounter = dynamic(() => import("./tu-vi-quan-encounter"), { ssr: false });
const Social = dynamic(() => import("./tu-vi-quan-social"), { ssr: false });
const QuanEcosystem = dynamic(() => import("./tu-vi-quan-ecosystem-panel"), { ssr: false });
type Position = { x: number; z: number };
type Player = Position & { id: string; alias: string; action: string };
type Session = {
  id: string; minutes: 15 | 30; amountVnd: number; readingKind?: EncounterKind;
  status: "pending" | "paid" | "queued" | "invited" | "active" | "ended" | "refund" | "cancelled";
  checkoutUrl?: string; qrCode?: string; recoveryCode?: string;
  position?: number; waitSeconds?: number; endsAt?: string; paused?: boolean; remainingSeconds?: number;
  expiresAt?: string; tableNumber?: number; inFlight?: boolean; refundAmountVnd?: number; refundSettledAt?: string;
  messages?: { id: string; question: string; answer: string | null }[];
  chartSummary?: { banMenh: string; menh: string; cuc: string; notes: string[] };
};

const stations = QUAN_STATIONS;
const money = new Intl.NumberFormat("vi-VN");
const origin = QUAN_SPAWN;
const subscribeToHydration = () => () => {};
const hydratedSnapshot = () => true;
const serverSnapshot = () => false;

function CourtyardMap({ position }: { position: Position }) {
  return <svg viewBox={`${QUAN_BOUNDS.minX} ${QUAN_BOUNDS.minZ} ${QUAN_BOUNDS.maxX - QUAN_BOUNDS.minX} ${QUAN_BOUNDS.maxZ - QUAN_BOUNDS.minZ}`} aria-hidden="true" className={styles.mapDrawing}>
    <path d="M0 32V-17 M-27 1H27 M-20 13H10" className={styles.mapPath} />
    {QUAN_BLOCKS.map((block, index) => <rect key={index} x={block.minX} y={block.minZ} width={block.maxX - block.minX} height={block.maxZ - block.minZ} rx="1" className={styles.mapBuilding} />)}
    <ellipse cx={QUAN_POND.x} cy={QUAN_POND.z} rx={QUAN_POND.radiusX} ry={QUAN_POND.radiusZ} className={styles.mapPond} />
    {stations.map((station, index) => <g key={station.id}><circle cx={station.x} cy={station.z} r="2.6" className={styles.mapStation} /><text x={station.x} y={station.z + 1.15} textAnchor="middle">{index + 1}</text></g>)}
    <circle cx={position.x} cy={position.z} r="2.1" className={styles.mapPlayer} />
  </svg>;
}

async function jsonRequest<T>(path: string, body?: object): Promise<T> {
  const response = await fetch(path, body ? {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  } : { cache: "no-store" });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data) throw new Error(data?.error || "Quán chưa kết nối được. Vui lòng thử lại.");
  return data;
}

export default function TuViQuan({ initialAlias, support, paymentsEnabled, ecosystemEnabled = false, voiceEnabled = false, readingPrice = null }: {
  initialAlias: string; support: { qr: string; recipient: string; bankImage?: boolean } | null; paymentsEnabled: boolean; ecosystemEnabled?: boolean; voiceEnabled?: boolean; readingPrice?: number | null;
}) {
  const hydrated = useSyncExternalStore(subscribeToHydration, hydratedSnapshot, serverSnapshot);
  const [host, setHost] = useState<{kind: EncounterKind; orderId?: string; visit: number} | null>(null);
  const [readingKind, setReadingKind] = useState<EncounterKind>("tuvi");
  const [encounterVisual, setEncounterVisual] = useState<EncounterVisual | null>(null);
  const [ritual, setRitual] = useState<{kind: "incense" | "meditate" | "greet" | "tarot" | "iching" | "chart"; requestId: number; count?: number; values?: number[]}>();
  const [ritualBusy, setRitualBusy] = useState(false);
  const [meditationUntil, setMeditationUntil] = useState(0);
  const ritualOperation = useRef(false);
  const pendingRitual = useRef<{kind: "incense" | "meditate" | "greet"; count?: number} | null>(null);
  const [socialMessages, setSocialMessages] = useState<QuanSocialMessage[]>([]);
  const [communityActivity, setCommunityActivity] = useState<{ id: string; text: string }[]>([]);
  const [leaders, setLeaders] = useState<QuanLeader[]>([]);
  const [ownId, setOwnId] = useState<string>();
  const [roomName, setRoomName] = useState<string>();
  const [socialError, setSocialError] = useState("");
  const [socialFocused, setSocialFocused] = useState(false);
  const leaveHost = useCallback(() => { setHost(null); setEncounterVisual(null); }, []);
  const revealRitual = useCallback((kind: "tarot" | "iching", count?: number, values?: number[]) => {
    setRitual({kind, count, values, requestId: Date.now()});
  }, []);
  const publicSpeech = useMemo(() => socialMessages.slice(-2).map(message => ({id: message.playerId, text: `${message.alias}: ${message.text}`})), [socialMessages]);
  const [experience, setExperience] = useState<QuanExperience>("courtyard");
  const [ecosystemOpen, setEcosystemOpen] = useState(false);
  const [activityRequest, setActivityRequest] = useState<{ tab: "today" | "divination" | "wishes" | "ranking" | "calligraphy" | "explore" | "profile" | "settings"; id: number }>();
  const [ecosystem, setEcosystem] = useState<QuanSnapshot | null>(null);
  const communityWishes = useMemo(() => ecosystem?.wishes.map(wish => ({
    id: wish.id, text: wish.text || "", placement: wish.placement || "tree" as const,
  })), [ecosystem?.wishes]);
  const eventEndsAt = ecosystem?.event?.active && ecosystem.event.joinedAt ? Date.parse(ecosystem.event.endsAt) : undefined;
  const [preferences, setPreferences] = useState<QuanPreferences>({ quality: "medium", reducedMotion: false, muted: true });

  const [alias, setAlias] = useState(initialAlias);
  const receiveEcosystem = useCallback((snapshot: QuanSnapshot) => {
    setEcosystem(snapshot); setAlias(snapshot.profile.alias);
    setMeditationUntil(snapshot.meditation?.startedAt && !snapshot.meditation.completed ? Date.now() + Math.max(0, Date.parse(snapshot.meditation.startedAt) + 60000 - Date.parse(snapshot.serverTime)) : 0);
  }, []);
  const [position, setPosition] = useState(origin);
  const [destination, setDestination] = useState<(Position & { requestId: number }) | null>(null);
  const [action, setAction] = useState("idle");
  const [players, setPlayers] = useState<Player[]>([]);
  const [online, setOnline] = useState(false);
  const [courtyardFull, setCourtyardFull] = useState(false);
  const [board, setBoard] = useState<{ tables: number; occupied: number; queued: number } | null>(null);
  const [lite, setLite] = useState(false);

  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [panel, setPanel] = useState<"session" | "support" | "restore" | "incense" | "map" | "hosts" | "activities" | null>(null);
  const [help, setHelp] = useState(false);
  const openEcosystem = useCallback((open: boolean) => { setEcosystemOpen(open); if (open) { setPanel(null); setHelp(false); setDestination(null); } }, []);
  const [session, setSession] = useState<Session | null>(null);
  const [recovery, setRecovery] = useState("");
  const [minutes, setMinutes] = useState<15 | 30>(15);
  const [question, setQuestion] = useState("");
  const [qrImage, setQrImage] = useState("");
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now);
  const socket = useRef<WebSocket | null>(null);
  const latestPosition = useRef(origin);
  const didSpawn = useRef(false);
  const world = useRef<HTMLElement | null>(null);
  const panelHeading = useRef<HTMLHeadingElement | null>(null);
  const questionTurn = useRef<{ question: string; id: string } | null>(null);
  const actionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const operation = useRef(false);
  const pollVersion = useRef(0);
  const navigationRequest = useRef(0);

  useEffect(() => {
    if (!alias) return;
    let live = true;
    let retry: ReturnType<typeof setTimeout>;
    function reconnect(delay = 3000) {
      if (live) retry = setTimeout(connect, delay);
    }
    async function connect() {
      try {
        const { ticket } = await jsonRequest<{ ticket: string }>("/api/tu-vi-quan/socket");
        if (!live) return;
        const local = process.env.NODE_ENV === "development";
        const url = (location.protocol === "https:" ? "wss://" : "ws://") +
          (local ? location.hostname + ":4001" : location.host) + "/tu-vi-quan-ws";
        const ws = new WebSocket(url, ["tu-vi-quan", ticket]);
        let firstSnapshot = true;
        socket.current = ws;
        ws.onmessage = ({ data }) => {
          if (!live) return;
          try {
            const packet = JSON.parse(data);
            if (packet.type === "chat-error") { setSocialError(typeof packet.message === "string" ? packet.message : "Chưa gửi được lời nhắn."); return; }
            if (packet.type !== "snapshot" || !Array.isArray(packet.players)) return;
            if (firstSnapshot) {
              firstSnapshot = false;
              const self = packet.players.find((player: Player) => player.id === packet.selfId);
              if (!didSpawn.current && self && latestPosition.current === origin) {
                latestPosition.current = { x: self.x, z: self.z };
                setPosition(latestPosition.current);
              } else {
                ws.send(JSON.stringify({ type: "move", ...latestPosition.current }));
              }
              didSpawn.current = true;
            }
            setOwnId(packet.selfId);
            setRoomName(packet.room?.name);
            setSocialMessages(Array.isArray(packet.messages) ? packet.messages : []);
            if (Array.isArray(packet.activity)) setCommunityActivity(previous => JSON.stringify(previous) === JSON.stringify(packet.activity) ? previous : packet.activity);
            if (Array.isArray(packet.leaders)) setLeaders(previous => JSON.stringify(previous) === JSON.stringify(packet.leaders) ? previous : packet.leaders);
            setOnline(true);
            setCourtyardFull(false);
            setBoard(packet.board ?? null);
            setPlayers(packet.players.filter((player: Player) => player.id !== packet.selfId));
          } catch { /* Ignore malformed snapshots. */ }
        };
        ws.onclose = (event) => {
          if (!live) return;
          setOnline(false);
          setPlayers([]);
          setSocialMessages([]);
          setCommunityActivity([]); setLeaders([]);
          setSocialFocused(false);
          setBoard(null);
          setCourtyardFull(event.code === 4003);
          if (event.code !== 4000) reconnect(event.code === 4003 ? 10000 : 3000);
        };
      } catch {
        reconnect();
      }
    }
    void connect();
    return () => { live = false; clearTimeout(retry); socket.current?.close(); socket.current = null; };
  }, [alias]);

  useEffect(() => () => { if (actionTimer.current) clearTimeout(actionTimer.current); }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!alias) return;
    let live = true;
    let polling = false;
    async function poll() {
      if (operation.current || polling) return;
      polling = true;
      const version = pollVersion.current;
      const returned = new URLSearchParams(location.search).get("session");
      const id = session?.id || (returned && /^[a-f0-9-]{36}$/i.test(returned) ? returned : null);
      try {
        const path = "/api/tu-vi-quan/session";
        const next = await jsonRequest<Session | { session: null }>(path + (id ? "?id=" + encodeURIComponent(id) : ""));
        if (!live || version !== pollVersion.current || "session" in next) return;
        setSession(next);
        if (!session?.id && returned === next.id) setPanel("session");
      } catch { /* A transient status failure leaves the current panel intact. */ }
      finally { polling = false; }
    }
    void poll();
    const timer = setInterval(poll, session?.id ? 2500 : 10000);
    return () => { live = false; clearInterval(timer); };
  }, [alias, session?.id]);

  useEffect(() => {
    if (panel) panelHeading.current?.focus({ preventScroll: true });
    else if (alias && !help) world.current?.focus({ preventScroll: true });
  }, [alias, help, panel]);

  useEffect(() => {
    if (session?.status !== "active" && session?.status !== "pending" && !meditationUntil) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [session?.status, meditationUntil]);

  useEffect(() => {
    let live = true;
    if (session?.qrCode && session.status === "pending") {
      void import("qrcode").then(({ toDataURL }) => toDataURL(session.qrCode!, { width: 300, margin: 3 }))
        .then((image) => { if (live) setQrImage(image); })
        .catch(() => { if (live) setQrImage(""); });
    }
    return () => { live = false; };
  }, [session?.qrCode, session?.status]);

  function send(payload: object) {
    if (socket.current?.readyState === WebSocket.OPEN) socket.current.send(JSON.stringify(payload));
  }

  function doAction(value: string) {
    if (actionTimer.current) clearTimeout(actionTimer.current);
    setAction(value);
    send({ type: "action", action: value });
    if (value !== "idle" && value !== "meditate") {
      actionTimer.current = setTimeout(() => {
        setAction("idle");
        send({ type: "action", action: "idle" });
      }, 4500);
    }
  }

  function move(target: Position) {
    if (ecosystemOpen || help || host || socialFocused) return;
    latestPosition.current = target;
    setPosition(target);
    send({ type: "move", ...target });
    const pending = pendingRitual.current;
    if (pending) {
      const station = stations.find(item => item.id === pending.kind)!;
      if (Math.hypot(target.x - station.x, target.z - station.z) <= 0.35) { pendingRitual.current = null; void freeRitual(pending.kind, pending.count); return; }
    }
    if (action !== "idle") doAction("idle");
  }

  useEffect(() => {
    if (!ecosystemEnabled || !alias) return;
    const url = new URL(location.href);
    const shareId = url.searchParams.get("tu-vi-share");
    if (!shareId || !/^[A-Za-z0-9_-]{24}$/.test(shareId)) return;
    url.searchParams.delete("tu-vi-share");
    history.replaceState(history.state, "", url);
    void jsonRequest("/api/tu-vi-quan/ecosystem", { action: "telemetry", name: "share_open", shareId }).catch(() => {});
  }, [ecosystemEnabled, alias]);

  async function restoreProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (operation.current) return;
    operation.current = true;
    setBusy(true);
    setError("");
    const code = new FormData(event.currentTarget).get("code");
    try { receiveEcosystem(await jsonRequest<QuanSnapshot>("/api/tu-vi-quan/ecosystem", { action: "recovery_restore", code })); }
    catch (err) { setError((err as Error).message); }
    finally { operation.current = false; setBusy(false); }
  }

  async function submitGuest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (operation.current) return;
    const aliasInput = new FormData(event.currentTarget).get("alias");
    operation.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await jsonRequest<{ alias: string }>("/api/tu-vi-quan/guest", { alias: aliasInput });
      setAlias(result.alias);
      if (window.matchMedia("(pointer: coarse)").matches) setNotice("Kéo nửa trái để đi · Kéo nửa phải để xoay camera");
    } catch (err) { setError((err as Error).message); }
    finally { operation.current = false; setBusy(false); }
  }

  async function sessionAction(body: object) {
    if (operation.current) return false;
    operation.current = true;
    pollVersion.current++;
    setBusy(true);
    setError("");
    try {
      const result = await jsonRequest<Session>("/api/tu-vi-quan/session", body);
      if (result.id !== session?.id) {
        setRecovery(result.recoveryCode || "");
        setQrImage("");
      }
      if (result.recoveryCode) setRecovery(result.recoveryCode);
      setSession(result);
      setNow(Date.now());
      setPanel("session");
      if ("action" in body && body.action === "chat") {
        const turn = "turnId" in body ? result.messages?.find(({ id }) => id === body.turnId) : undefined;
        if (!turn?.answer) {
          setError("Thầy chưa trả lời được. Bạn có thể thử gửi lại câu này.");
          return false;
        }
      }
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    } finally {
      operation.current = false;
      setBusy(false);
    }
  }

  function checkout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!paymentsEnabled) return;
    if (voiceEnabled && readingKind !== "tuvi") {
      void sessionAction({ action: "checkout", minutes, readingKind });
      return;
    }
    const fields = new FormData(event.currentTarget);
    const [year, month, day] = String(fields.get("birthDate")).split("-").map(Number);
    void sessionAction({ action: "checkout", minutes, ...(voiceEnabled ? {readingKind} : {}), chart: {
      fullName: String(fields.get("fullName") || alias),
      gender: fields.get("gender"), calendarType: "solar", day, month, year,
      birthHour: Number(fields.get("hour")),
    } });
  }

  function openPanel(next: typeof panel) {
    pendingRitual.current = null;
    setError("");
    setHelp(false);
    setEcosystemOpen(false);
    setDestination(null);
    setPanel(next);
  }

  function openHost(kind: EncounterKind, orderId?: string) {
    pendingRitual.current = null;
    setReadingKind(kind); setPanel(null); setHelp(false); setEcosystemOpen(false); setDestination(null); setSocialFocused(false); setEncounterVisual(null);
    doAction("idle"); setExperience("courtyard"); setHost({kind, orderId, visit: ++navigationRequest.current});
  }

  function openActivity(tab: NonNullable<typeof activityRequest>["tab"]) {
    openPanel(null);
    setActivityRequest({ tab, id: ++navigationRequest.current });
  }

  async function freeRitual(kind: "incense" | "meditate" | "greet", count?: number) {
    if (ritualOperation.current) return;
    ritualOperation.current = true; setRitualBusy(true); setError("");
    const finishing = kind === "meditate" && Boolean(meditationUntil);
    try {
      if (ecosystemEnabled) receiveEcosystem(await jsonRequest<QuanSnapshot>("/api/tu-vi-quan/ecosystem", {
        action: "ritual", kind: kind === "meditate" ? finishing ? "meditate_finish" : "meditate_start" : kind, count,
      }));
      setDestination(null); doAction(finishing ? "idle" : kind);
      setRitual(finishing ? undefined : {kind, count, requestId: ++navigationRequest.current});
      setNotice(finishing ? "Bạn đã dành một phút tĩnh tâm." : kind === "incense" ? `Bạn đã thắp ${count ?? 1} nén hương trên bàn hương.` : kind === "greet" ? "Bạn đã chắp tay chào khách trong sân." : "Ngồi yên, thả lỏng vai và thở chậm trong một phút.");
    } catch (err) { setNotice((err as Error).message); }
    finally { ritualOperation.current = false; setRitualBusy(false); }
  }

  function requestRitual(kind: "incense" | "meditate" | "greet", count?: number) {
    if (kind === "meditate" && action === "meditate" && !meditationUntil) { doAction("idle"); setRitual(undefined); return; }
    const station = stations.find(item => item.id === kind)!;
    if (lite || Math.hypot(position.x - station.x, position.z - station.z) <= 0.5 || kind === "meditate" && meditationUntil) { void freeRitual(kind, count); return; }
    navigate(station); pendingRitual.current = {kind, count};
    setNotice(`Đang đi đến ${station.label.toLocaleLowerCase("vi-VN")}. Nghi thức bắt đầu khi bạn tới nơi.`);
  }

  function socialSend(body: Record<string, unknown>) {
    setSocialError("");
    if (body.type === "action" && ["greet", "meditate", "idle"].includes(String(body.action))) doAction(String(body.action));
    else send(body);
  }

  function navigate(station: Position & { label: string }) {
    openPanel(null);
    doAction("idle");
    if (lite) {
      setNotice("Chọn Thử lại 3D trong hướng dẫn để dạo quán. Các hoạt động miễn phí vẫn dùng được ở giao diện nhẹ.");
    } else {
      setDestination({ x: station.x, z: station.z, requestId: ++navigationRequest.current });
      setNotice(`Đang đi tới ${station.label.toLocaleLowerCase("vi-VN")}. Kéo nửa trái hoặc dùng WASD để đổi hướng.`);
    }
  }

  const savedBirth = ecosystem?.profile.birthInput;
  const savedSolar = savedBirth?.calendarType === "solar" ? [savedBirth.year, savedBirth.month, savedBirth.day].map((part, index) => String(part).padStart(index === 0 ? 4 : 2, "0")).join("-") : undefined;
  const remaining = session?.paused ? (session.remainingSeconds || 0) :
    Math.max(0, Math.ceil(((session?.endsAt ? Date.parse(session.endsAt) : now) - now) / 1000));
  const clock = Math.floor(remaining / 60) + ":" + String(remaining % 60).padStart(2, "0");
  const expiredQr = session?.status === "pending" && Boolean(session.expiresAt && Date.parse(session.expiresAt) <= now);
  const canOrder = !session || expiredQr || ["cancelled", "ended", "refund"].includes(session.status);
  const stationDistance = (x: number, z: number) => Math.hypot(x - position.x, z - position.z);
  const nearby = stations.filter((station) => stationDistance(station.x, station.z) <= 2.5)
    .sort((a, b) => stationDistance(a.x, a.z) - stationDistance(b.x, b.z))[0];

  function interactStation(station: NonNullable<typeof nearby>) {
    if (ecosystemEnabled && (station.id === "ranking" || station.id === "calligraphy")) {
      openPanel(null);
      setActivityRequest({ tab: station.id, id: ++navigationRequest.current });
      return;
    }
    if (voiceEnabled) {
      if (["teacher", "tea", "iching"].includes(station.id)) { openHost(station.id === "tea" ? "tarot" : station.id === "iching" ? "iching" : "tuvi"); return; }
      if (station.id === "incense" || station.id === "greet" || station.id === "meditate") { requestRitual(station.id); return; }
    }
    if (ecosystemEnabled && ["teacher", "incense", "meditate", "tea", "lotus"].includes(station.id)) {
      openPanel(null);
      setActivityRequest({ tab: station.id === "teacher" || station.id === "tea" ? "divination" : station.id === "lotus" ? "wishes" : "today", id: ++navigationRequest.current });
      return;
    }
    if (station.id === "teacher" || station.id === "support" || station.id === "incense") {
      openPanel(station.id === "teacher" ? "session" : station.id);
      return;
    }
    if (station.id === "tea" || station.id === "lotus") {
      setNotice(station.id === "tea" ? "Mời bạn nghỉ chân bên bàn trà, ngắm vườn trúc." : "Bạn đang ở vườn hồ sen. Hãy dành một phút thảnh thơi.");
      return;
    }
    if (station.id === "meditate" && action === "meditate") {
      doAction("idle");
      setNotice("Bạn đã đứng dậy.");
      return;
    }
    setDestination(null);
    doAction(station.id);
    setNotice(station.id === "greet" ? "Bạn đã chắp tay chào khách." : "Bạn đang ngồi thiền. Hoạt động này miễn phí.");
  }

  function ritualFromMenu(kind: "incense" | "meditate" | "greet", count?: number) {
    if (panel === "activities") openPanel(null);
    requestRitual(kind, count);
  }
  const rituals = <>
    <button disabled={ritualBusy} onClick={() => ritualFromMenu("incense", 1)}>Thắp 1 nén hương</button>
    <button disabled={ritualBusy} onClick={() => ritualFromMenu("incense", 3)}>Thắp 3 nén hương</button>
    <button disabled={ritualBusy || Boolean(meditationUntil && now < meditationUntil)} onClick={() => ritualFromMenu("meditate")}>{meditationUntil ? now < meditationUntil ? `Thở chậm · ${Math.ceil((meditationUntil - now) / 1000)} giây` : "Hoàn thành tĩnh tâm" : action === "meditate" ? "Đứng dậy" : "Ngồi thiền"}</button>
    <button disabled={ritualBusy} onClick={() => ritualFromMenu("greet")}>Chắp tay</button>
    <button onClick={() => openPanel("support")}>Ủng hộ quán</button>
  </>;

  function handleWorldKey(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      if (panel) openPanel(null);
      else if (host) leaveHost();
      else setHelp(false);
      return;
    }
    if (panel && event.key === "Tab") {
      const focusable = event.currentTarget.querySelectorAll<HTMLElement>(
        '[role="dialog"] :is(button, input, textarea, select, a[href]):not(:disabled)',
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (first && ((event.shiftKey && (event.target === first || event.target === panelHeading.current)) ||
          (!event.shiftKey && event.target === last))) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
      return;
    }
    if (event.code === "KeyE" && nearby && alias && !panel && !host && !socialFocused && !help && !ecosystemOpen && !event.repeat &&
        !(event.target instanceof HTMLElement && event.target.closest("input,textarea,select,[contenteditable]"))) {
      event.preventDefault();
      interactStation(nearby);
    }
  }

  return (
    <main ref={world} className={`${styles.page} ${voiceEnabled ? styles.liveGame : ""} ${host ? styles.seated : ""}`} data-quan-world onKeyDown={handleWorldKey} tabIndex={-1}>
      <section className={styles.courtyard} aria-label="Sân Tử Vi Quán">
        {!lite && <Scene encounter={voiceEnabled && host ? encounterVisual ?? {kind: host.kind, state: "greeting", audioLevel: 0} : undefined} onHost={voiceEnabled && alias && !panel && !ecosystemOpen && !help ? openHost : undefined} showHostControls={false} ritual={voiceEnabled ? ritual : undefined} speech={voiceEnabled && !host ? publicSpeech : undefined} ecosystemEnabled={ecosystemEnabled} position={position} destination={destination} action={action} players={players} onMove={move} experience={!voiceEnabled && panel === "session" ? "teacher" : experience} quality={preferences.quality} reducedMotion={preferences.reducedMotion} muted={preferences.muted} appearance={ecosystem?.profile.equipped} leaders={leaders} eventEndsAt={eventEndsAt} communityWishes={communityWishes} interactive={Boolean(alias && !panel && !host && !socialFocused && !help && !ecosystemOpen)} onUnavailable={() => setLite(true)} />}
      </section>
      <header className={styles.mast} inert={Boolean(panel) || ecosystemOpen}>
        <Link href="/" className={styles.icon} aria-label="Về Lá số tinh hoa"><ArrowLeft size={20} /></Link>
        <div className={styles.identity}><h1>Tử Vi Quán</h1><span>{alias ? online ? players.length + 1 + " khách trong sân" : courtyardFull ? "Sân chung đang đông" : "Đang kết nối sân chung" : "Lá số tinh hoa"}</span></div>
        {alias && <button className={styles.icon} aria-label="Hướng dẫn và tùy chọn" aria-expanded={help} onClick={() => setHelp(!help)}><CircleHelp size={22} /></button>}
      </header>
      {!alias ? (
        <section className={styles.welcome}>
          <div className={styles.welcomeInner}>
            <p className={styles.eyebrow}>SÂN QUÁN LÚC CHIỀU XUỐNG</p>
            <h2>Mời bạn ghé quán</h2>
            <p>Dạo sân, thắp hương và ghé bàn thầy để trò chuyện riêng về lá số của bạn.</p>
            <form onSubmit={submitGuest}>
              <label htmlFor="quan-alias">Bí danh của bạn</label>
              <input id="quan-alias" name="alias" autoComplete="nickname" minLength={2} maxLength={24} placeholder="Ví dụ Mây Trắng" required />
              <button disabled={busy || !hydrated} className={styles.primary}>{hydrated ? "Vào quán" : "Đang mở cổng…"}</button>
            </form>
            {ecosystemEnabled && <details><summary>Đã có mã khôi phục hồ sơ?</summary><form onSubmit={restoreProfile}><label>Mã khôi phục<input name="code" required autoComplete="off" maxLength={32} /></label><button disabled={busy}>Khôi phục hồ sơ</button><Link href="/dang-nhap?next=%2Ftu-vi-quan">Đăng nhập nếu đã gắn tài khoản</Link></form></details>}
            <p className={styles.note}>Vào sân và tham gia hoạt động miễn phí. Bạn không cần tài khoản.</p>
            {error && <p role="alert" className={styles.error}>{error}</p>}
          </div>
        </section>
      ) : (
        <>
          {ecosystemEnabled && <div hidden={Boolean(host)}><QuanEcosystem leaders={leaders} online={online} gameMode={voiceEnabled} activityRequest={activityRequest} readingPrice={readingPrice} alias={alias} suspended={Boolean(panel) || help || Boolean(host)} onOpen={openEcosystem} onSnapshot={receiveEcosystem} preferences={preferences} onPreferences={setPreferences} lite={lite} onLite={setLite} onRitual={doAction} onExperience={setExperience} onLegacy={openPanel} /></div>}
          {!ecosystemEnabled && !voiceEnabled && <nav className={styles.actionDock} aria-label="Hoạt động trong quán" inert={Boolean(panel)}>
            <button className={styles.primary} onClick={() => openPanel("session")}><BookOpen size={21} aria-hidden="true" />Xem lá số</button>
            <button onClick={() => openPanel("incense")}><Flame size={21} aria-hidden="true" />Thắp hương</button>
            <button onClick={() => openPanel("support")}><Heart size={21} aria-hidden="true" />Ủng hộ quán</button>
            <button onClick={() => openPanel("map")}><Compass size={21} aria-hidden="true" />Khám phá</button>
          </nav>}
          {voiceEnabled && !host && !panel && !help && !ecosystemOpen && <>
            <nav className={styles.hostChoices} aria-label="Chọn người trò chuyện"><p>Mời bạn ngồi · 5 phút miễn phí mỗi ngày</p><div>{([["tuvi", "Thầy Tử Vi"], ["tarot", "Cô Tarot"], ["iching", "Thầy Dịch"]] as const).map(([kind, label]) => <button key={kind} onClick={() => openHost(kind)}>{label}</button>)}</div></nav>
            <nav className={styles.ritualToolbar} aria-label="Hoạt động miễn phí">{rituals}<button onClick={() => openPanel("map")}>Bản đồ</button></nav>
            <nav className={styles.mobileBar} aria-label="Lối tắt trong sân"><button onClick={() => openActivity("today")}>Quẻ ngày</button><button onClick={() => openPanel("hosts")}>Gặp thầy</button><button onClick={() => openPanel("activities")}>Hoạt động</button><button onClick={() => openPanel("map")}>Bản đồ</button></nav><aside className={styles.communityActivity} aria-live="polite">{communityActivity.slice(0, 2).map(item => <p key={item.id}>{item.text}</p>)}</aside><div className={styles.socialWrap}><Social socketSend={socialSend} messages={socialMessages} ownId={ownId} roomName={roomName} connected={online} error={socialError} onFocusChange={setSocialFocused} /></div>
          </>}
          {voiceEnabled && host && <Encounter key={`${host.kind}-${host.visit}`} kind={host.kind} orderId={host.orderId} muted={preferences.muted} onLeave={leaveHost} onVisual={setEncounterVisual} onRitual={revealRitual} onChartReady={palace => setRitual({ kind: "chart", values: [palace], requestId: Date.now() })} onUpgrade={kind => { leaveHost(); setReadingKind(kind); openPanel("session"); }} />}
          {lite && !host && <section className={styles.lite} inert={Boolean(panel) || ecosystemOpen}><h2>Sân quán</h2><p>Chọn một hoạt động hoặc ghé bàn thầy.</p>
            {players.length > 0 && <p>Khách đang ở sân: {players.map((player) => player.alias).join(", ")}</p>}
            <div className={styles.quickActions}><button onClick={() => interactStation(stations.find((station) => station.id === "meditate")!)}>{action === "meditate" ? "Đứng dậy" : "Ngồi thiền miễn phí"}</button><button onClick={() => openPanel("map")}>Xem các góc trong quán</button></div>
          </section>}
          {!lite && !host && <div className={styles.location}><Compass size={15} /><span>{nearby?.label ?? "Sân quán"}</span></div>}
          {!voiceEnabled && !lite && !panel && !help && !ecosystemOpen && <button className={styles.miniMap} aria-label="Mở bản đồ quán, chấm sáng là vị trí của bạn" onClick={() => openPanel("map")}><CourtyardMap position={position} /><span>Bản đồ quán</span></button>}
          {session && !host && !canOrder && <button className={styles.sessionBadge} inert={Boolean(panel) || ecosystemOpen} onClick={() => openPanel("session")}>{session.status === "invited" ? "Đã đến lượt" : "Lượt xem của bạn"}</button>}
          {help && <aside className={styles.help} aria-label="Hướng dẫn và tùy chọn">
            <strong>Mời bạn thong thả dạo quán</strong><p>{ecosystemEnabled ? "Dùng các nút dưới sân để mở hoạt động. Trong Khám phá, chọn Bản đồ để nhân vật tự đi đến nơi bạn chọn." : "Chọn Xem lá số, Thắp hương hoặc Ủng hộ quán để mở ngay. Vào Khám phá và chọn một nơi, nhân vật sẽ tự đi đến."}</p>
            <p>Trên điện thoại, kéo nửa trái để đi và kéo nửa phải để xoay góc nhìn. Có thể dùng hai ngón cùng lúc hoặc quay ngang máy. Trên máy tính, dùng WASD hoặc bấm nền để đi, kéo chuột để xoay.</p>
            {board && <p>{board.tables ? `${board.occupied}/${board.tables} bàn đang dùng · ${board.queued} lượt chờ` : "Bàn thầy đang tạm nghỉ"}</p>}
            <button onClick={() => { setLite(!lite); setHelp(false); }}>{lite ? "Thử lại 3D" : "Giao diện nhẹ"}</button>
            <button onClick={() => { setHelp(false); openPanel("restore"); }}>Khôi phục lượt đã mua</button>
          </aside>}
          {notice && <p className={styles.notice} role="status">{notice}</p>}
          {!lite && !host && !panel && !help && !ecosystemOpen && <div className={styles.interaction}>
            {nearby ? <button className={styles.primary} onClick={() => interactStation(nearby)}>{nearby.id === "meditate" && action === "meditate" ? "Đứng dậy" : nearby.label}<kbd>E</kbd></button> :
              <span><MapPin size={15} /> Khám phá để chọn nơi muốn tới</span>}
          </div>}
          {panel && <div className={styles.scrim}><section className={styles.panel} role="dialog" aria-modal="true" aria-labelledby="quan-panel-title">
            <div className={styles.panelHead}><h2 id="quan-panel-title" ref={panelHeading} tabIndex={-1}>{panel === "session" ? voiceEnabled ? "Đặt phiên trò chuyện riêng" : "Bàn luận lá số" : panel === "support" ? "Ủng hộ Tử Vi Quán" : panel === "incense" ? "Một nén hương an lành" : panel === "map" ? "Dạo một vòng quanh quán" : panel === "hosts" ? "Chọn bàn trò chuyện" : panel === "activities" ? "Hoạt động trong quán" : "Khôi phục lượt xem"}</h2><button className={styles.icon} aria-label="Đóng" onClick={() => openPanel(null)}><X size={21} /></button></div>
            {panel === "hosts" && <><p>5 phút miễn phí mỗi ngày, dùng chung cho cả ba bàn.</p><nav className={styles.menuGrid} aria-label="Chọn người trò chuyện">{([["tuvi", "Thầy Tử Vi"], ["tarot", "Cô Tarot"], ["iching", "Thầy Dịch"]] as const).map(([kind, label]) => <button key={kind} onClick={() => openHost(kind)}>{label}</button>)}</nav></>}{panel === "activities" && <nav className={styles.menuGrid} aria-label="Hoạt động miễn phí">{rituals}<button onClick={() => openActivity("wishes")}>Cầu an và hoa đăng</button><button onClick={() => openActivity("calligraphy")}>Xin chữ</button><button onClick={() => openActivity("divination")}>Vận trình</button><button onClick={() => openActivity("explore")}>Khám phá</button><button onClick={() => openActivity("profile")}>Hồ sơ</button><button onClick={() => openActivity("settings")}>Tùy chọn</button></nav>}{panel === "support" && <div className={styles.payment}>{support ? <><p>Ủng hộ tự nguyện để duy trì Tử Vi Quán. Bạn tự chọn số tiền khi chuyển khoản.</p><Image className={support.bankImage ? styles.bankQr : undefined} src={support.qr} alt="Mã QR ngân hàng để ủng hộ Tử Vi Quán" width={support.bankImage ? 320 : 250} height={support.bankImage ? 692 : 250} unoptimized /><p>Người nhận <strong>{support.recipient}</strong></p><a className={styles.primary} href={support.qr} target="_blank" rel="noreferrer">Mở hoặc lưu ảnh QR</a></> : <><p><strong>Quán chưa mở nhận ủng hộ.</strong></p><p>Bạn vẫn có thể dạo sân, thắp hương và ngồi thiền miễn phí.</p></>}<button onClick={() => navigate(stations.find((station) => station.id === "support")!)}><Navigation size={18} aria-hidden="true" /> Đi đến hòm công đức</button></div>}
            {panel === "incense" && <div className={styles.incenseActions}><p>Dành một khoảng lặng, gửi gắm một lời nguyện bình an. Thắp hương hoàn toàn miễn phí.</p><div className={styles.packages}>{[1, 3].map((count) => <button className={count === 1 ? styles.primary : undefined} key={count} onClick={() => { openPanel(null); doAction("incense"); setNotice(`Bạn đã thắp ${count === 1 ? "một" : "ba"} nén hương. Chúc bạn một ngày bình an.`); }}><Flame size={20} aria-hidden="true" />Thắp {count} nén</button>)}</div><button onClick={() => navigate(stations.find((station) => station.id === "incense")!)}><Navigation size={18} aria-hidden="true" /> Đi đến bàn hương</button></div>}
            {panel === "map" && <><p>Chọn một nơi để nhân vật tự đi đến. Bạn có thể đổi hướng bất cứ lúc nào.</p><div className={styles.largeMap}><CourtyardMap position={position} /><span><i /> Vị trí của bạn</span></div><ol className={styles.destinationList}>{stations.map((station, index) => <li key={station.id}><span className={styles.destinationNumber}>{index + 1}</span><div><strong>{station.label}</strong><small>{station.description}</small></div><button aria-label={`Đi tới ${station.label}`} onClick={() => navigate(station)}>Đi tới đây</button></li>)}</ol></>}
            {panel === "restore" && <form onSubmit={(event) => {
              event.preventDefault();
              const code = new FormData(event.currentTarget).get("code");
              void sessionAction({ action: "restore", code });
            }}><label htmlFor="quan-code">Mã khôi phục đã nhận khi tạo đơn</label><input id="quan-code" name="code" required maxLength={128} autoComplete="off" /><button className={styles.primary} disabled={busy}>Khôi phục</button></form>}
            {panel === "session" && <>
              {session?.status === "pending" && !expiredQr && <div className={styles.payment}>
                <p><strong>{money.format(session.amountVnd)}đ</strong> · {session.minutes} phút</p>
                {qrImage && <Image src={qrImage} alt="Mã QR thanh toán lượt xem tử vi" width={250} height={250} unoptimized />}
                {session.checkoutUrl && <a className={styles.primary} href={session.checkoutUrl} target="_blank" rel="noreferrer">Mở trang thanh toán</a>}
                <p role="status">Đang chờ xác nhận thanh toán…</p>
              </div>}
              {expiredQr && <p>Mã QR đã hết hạn. Nếu chưa chuyển tiền, bạn có thể tạo mã mới.</p>}
              {recovery && <div className={styles.recovery}><strong>Lưu mã khôi phục trước khi thanh toán</strong><code>{recovery}</code><small>Giữ mã riêng tư để lấy lại lượt hoặc phiên của bạn.</small></div>}
              {!recovery && session && session.status !== "cancelled" && <button disabled={busy} onClick={() => {
                void sessionAction({ action: "reissue", id: session.id });
              }}>Tạo mã khôi phục mới</button>}
              {session?.status === "paid" && <><p>Bạn đã thanh toán phiên {session.minutes} phút.</p><button className={styles.primary} disabled={busy} onClick={() => void sessionAction({ action: "join", id: session.id })}>Lấy số</button></>}
              {session?.status === "queued" && <><p role="status">Bạn đang chờ{session.position ? " ở vị trí " + session.position : ""}{typeof session.waitSeconds === "number" ? " · Khoảng " + Math.ceil(session.waitSeconds / 60) + " phút" : ""}.</p><button disabled={busy} onClick={() => void sessionAction({ action: "leave", id: session.id })}>Rời hàng và giữ lượt</button></>}
              {session?.status === "invited" && <><p role="status">Mời bạn vào bàn {session.tableNumber}. Đồng hồ chạy khi bạn bắt đầu.</p><button className={styles.primary} disabled={busy} onClick={() => {
                if (voiceEnabled) { openHost(session.readingKind ?? readingKind, session.id); return; }
                if (session.tableNumber) move({ x: (session.tableNumber - 2) * 6, z: -15 });
                void sessionAction({ action: "start", id: session.id });
              }}>Bắt đầu xem {session.minutes} phút</button></>}
              {voiceEnabled && session?.status === "active" && <button className={styles.primary} onClick={() => openHost(session.readingKind ?? readingKind, session.id)}>Về bàn trò chuyện</button>}
              {session?.status === "active" && <p className={styles.clock} role="timer">{session.paused ? "Đang tạm dừng · " : "Thời gian còn lại · "}{clock}</p>}
              {session?.status === "ended" && <p>Phiên xem đã kết thúc. {voiceEnabled ? "Bạn có thể quay lại sân và chọn người trò chuyện." : "Bạn có thể đọc lại cuộc trò chuyện bên dưới."}</p>}
              {session?.status === "refund" && <p>Phiên dừng do lỗi hệ thống. Khoản hoàn {money.format(session.refundAmountVnd || 0)}đ {session.refundSettledAt ? "đã được đối soát" : "đang được đối soát"}.</p>}
              {session?.status === "cancelled" && <p>Đơn đã hết hạn hoặc đã được hủy. Bạn có thể tạo đơn mới.</p>}
              {!voiceEnabled && ecosystemEnabled && session?.chartSummary && <details className={styles.recovery}>
                <summary>Tóm tắt lá số của bạn</summary>
                <p>Mệnh {session.chartSummary.menh} · {session.chartSummary.banMenh} · {session.chartSummary.cuc}</p>
                {session.chartSummary.notes.map((note) => <p key={note}>{note}</p>)}
              </details>}
              {!voiceEnabled && session?.messages && session.messages.length > 0 && <div className={styles.messages} aria-label="Cuộc trò chuyện" aria-live="polite">
                {session.messages.map((message) => <article key={message.id}><p><strong>Bạn</strong><br />{message.question}</p>{message.answer && <p><strong>Thầy AI</strong><br />{message.answer}</p>}</article>)}
              </div>}
              {!voiceEnabled && session?.status === "active" && <form onSubmit={async (event) => {
                event.preventDefault();
                if (questionTurn.current?.question !== question) questionTurn.current = { question, id: crypto.randomUUID() };
                if (await sessionAction({ action: "chat", id: session.id, question, turnId: questionTurn.current.id })) {
                  questionTurn.current = null;
                  setQuestion("");
                }
              }}>
                {ecosystemEnabled && <div className={styles.quickActions} aria-label="Gợi ý câu hỏi">
                  {[["Công việc", "Cung Quan Lộc gợi ý gì về hướng phát triển công việc?"], ["Tình cảm", "Tôi có thể nhìn lại điều gì trong chuyện tình cảm?"], ["Gia đình", "Lá số có gợi ý gì để tôi vun đắp quan hệ gia đình?"], ["Tài chính", "Tôi nên để ý điều gì khi sắp xếp tài chính?" ]].map(([label, prompt]) =>
                    <button type="button" key={label} onClick={() => setQuestion(prompt)}>{label}</button>)}
                </div>}
                <label htmlFor="quan-question">Câu hỏi dành cho thầy AI</label>
                <textarea id="quan-question" value={question} onChange={(event) => setQuestion(event.target.value)} required maxLength={1000} rows={3} />
                <button className={styles.primary} disabled={busy || session.inFlight || remaining <= 0 || !question.trim()}>{busy || session.inFlight ? "Thầy đang trả lời…" : "Gửi câu hỏi"}</button>
              </form>}
              {canOrder && <form onSubmit={checkout}>
                <fieldset><legend>{voiceEnabled ? `Trò chuyện với ${readingKind === "tuvi" ? "Thầy Tử Vi" : readingKind === "tarot" ? "Cô Tarot" : "Thầy Dịch"}` : "Chọn phiên xem"}</legend><div className={styles.packages}>
                  {([15, 30] as const).map((duration) => <label key={duration} className={styles.package}>
                    <input type="radio" name="minutes" checked={minutes === duration} onChange={() => setMinutes(duration)} />
                    <span><strong>{duration} phút</strong><br />{duration === 15 ? "100.000đ" : "200.000đ"}</span>
                  </label>)}
                </div></fieldset>
                {!paymentsEnabled && <p role="status">Quán chưa mở nhận thanh toán. Hai mức phí trên để bạn tham khảo; dạo sân, thắp hương và ngồi thiền đều miễn phí.</p>}
                {paymentsEnabled && (!voiceEnabled || readingKind === "tuvi") && <>
                <label>Người được xem<input name="fullName" maxLength={80} placeholder={alias} defaultValue={savedBirth?.fullName} /></label>
                <div className={styles.birth}>
                  <label>Ngày sinh dương lịch<input type="date" name="birthDate" defaultValue={savedSolar} min="1900-01-01" max={new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" })} required /></label>
                  <label>Giờ sinh<select name="hour" defaultValue={savedBirth?.birthHour ?? ""} required><option value="" disabled>Chọn giờ</option>{Array.from({ length: 24 }, (_, hour) => <option key={hour} value={hour}>{hour} giờ</option>)}</select></label>
                  <label>Giới tính<select name="gender" defaultValue={savedBirth?.gender}><option value="male">Nam</option><option value="female">Nữ</option></select></label>
                </div>
                </>}
                <p className={styles.note}>{voiceEnabled ? "Phiên trò chuyện riêng bằng tiếng Việt. Đồng hồ bắt đầu khi bạn đồng ý ngồi trò chuyện; âm thanh phát khi dịch vụ giọng nói sẵn sàng." : "Thầy AI trả lời bằng chữ. Nội dung câu hỏi và dữ liệu luận số được xử lý bằng dịch vụ AI. Phiên mang tính tham khảo."}</p>
                <button className={styles.primary} disabled={busy || !paymentsEnabled}>{!paymentsEnabled ? "Chưa mở nhận thanh toán" : busy ? "Đang tạo mã QR…" : "Tạo mã QR thanh toán"}</button>
              </form>}
            </>}
            {error && <p role="alert" className={styles.error}>{error}</p>}
          </section></div>}
        </>
      )}
    </main>
  );
}
