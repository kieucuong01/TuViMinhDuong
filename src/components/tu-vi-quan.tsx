"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, CircleHelp, Compass, MapPin, X } from "lucide-react";
import styles from "./tu-vi-quan.module.css";

const Scene = dynamic(() => import("./tu-vi-quan-scene"), { ssr: false });
type Position = { x: number; z: number };
type Player = Position & { id: string; alias: string; action: string };
type Session = {
  id: string; minutes: 15 | 30; amountVnd: number;
  status: "pending" | "paid" | "queued" | "invited" | "active" | "ended" | "refund" | "cancelled";
  checkoutUrl?: string; qrCode?: string; recoveryCode?: string;
  position?: number; waitSeconds?: number; endsAt?: string; paused?: boolean; remainingSeconds?: number;
  expiresAt?: string; tableNumber?: number; inFlight?: boolean; refundAmountVnd?: number; refundSettledAt?: string;
  messages?: { id: string; question: string; answer: string | null }[];
};

const stations = [
  { action: "incense", label: "Thắp hương", x: -5, z: 1 },
  { action: "greet", label: "Chắp tay", x: 0, z: 2 },
  { action: "meditate", label: "Ngồi thiền", x: 5, z: 1 },
] as const;
const money = new Intl.NumberFormat("vi-VN");
const origin = { x: 0, z: 7 };

async function jsonRequest<T>(path: string, body?: object): Promise<T> {
  const response = await fetch(path, body ? {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  } : { cache: "no-store" });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data) throw new Error(data?.error || "Quán chưa kết nối được. Vui lòng thử lại.");
  return data;
}

export default function TuViQuan({ initialAlias, support, paymentsEnabled }: {
  initialAlias: string; support: { qr: string; recipient: string } | null; paymentsEnabled: boolean;
}) {
  const [alias, setAlias] = useState(initialAlias);
  const [position, setPosition] = useState(origin);
  const [action, setAction] = useState("idle");
  const [players, setPlayers] = useState<Player[]>([]);
  const [online, setOnline] = useState(false);
  const [courtyardFull, setCourtyardFull] = useState(false);
  const [board, setBoard] = useState<{ tables: number; occupied: number; queued: number } | null>(null);
  const [lite, setLite] = useState(false);
  const [help, setHelp] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [panel, setPanel] = useState<"session" | "support" | "restore" | null>(null);
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
    if (session?.status !== "active" && session?.status !== "pending") return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [session?.status]);

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
    latestPosition.current = target;
    setPosition(target);
    send({ type: "move", ...target });
    if (action !== "idle") doAction("idle");
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
    const fields = new FormData(event.currentTarget);
    const [year, month, day] = String(fields.get("birthDate")).split("-").map(Number);
    void sessionAction({ action: "checkout", minutes, chart: {
      fullName: String(fields.get("fullName") || alias),
      gender: fields.get("gender"), calendarType: "solar", day, month, year,
      birthHour: Number(fields.get("hour")),
    } });
  }

  function openPanel(next: typeof panel) {
    setError("");
    setPanel(next);
  }

  const remaining = session?.paused ? (session.remainingSeconds || 0) :
    Math.max(0, Math.ceil(((session?.endsAt ? Date.parse(session.endsAt) : now) - now) / 1000));
  const clock = Math.floor(remaining / 60) + ":" + String(remaining % 60).padStart(2, "0");
  const expiredQr = session?.status === "pending" && Boolean(session.expiresAt && Date.parse(session.expiresAt) <= now);
  const canOrder = !session || expiredQr || ["cancelled", "ended", "refund"].includes(session.status);
  const stationDistance = (x: number, z: number) => Math.hypot(x - position.x, z - position.z);
  const nearby = [
    ...stations,
    { action: "teacher" as const, label: "Xem lá số", x: 0, z: -5 },
    ...(support ? [{ action: "support" as const, label: "Hòm công đức", x: 5, z: -4 }] : []),
  ].filter((station) => stationDistance(station.x, station.z) <= 2.05)
    .sort((a, b) => stationDistance(a.x, a.z) - stationDistance(b.x, b.z))[0];

  function interactStation(station: NonNullable<typeof nearby>, shortcut = false) {
    if (station.action === "teacher" || station.action === "support") {
      if (shortcut) move(station);
      openPanel(station.action === "teacher" ? "session" : "support");
      return;
    }
    if (station.action === "meditate" && action === "meditate") {
      doAction("idle");
      setNotice("Bạn đã đứng dậy.");
      return;
    }
    if (shortcut) move(station);
    doAction(station.action);
    setNotice(station.action === "incense" ? "Bạn đã thắp một nén hương." : station.action === "greet" ? "Bạn đã chắp tay chào khách." : "Bạn đang ngồi thiền.");
  }

  function handleWorldKey(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      if (panel) openPanel(null);
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
    if (event.code === "KeyE" && nearby && alias && !panel && !help && !event.repeat &&
        !(event.target instanceof HTMLElement && event.target.closest("input,textarea,select,[contenteditable]"))) {
      event.preventDefault();
      interactStation(nearby);
    }
  }

  return (
    <main ref={world} className={styles.page} data-quan-world onKeyDown={handleWorldKey} tabIndex={-1}>
      <section className={styles.courtyard} aria-label="Sân Tử Vi Quán">
        {!lite && <Scene position={position} action={action} players={players} onMove={move} interactive={Boolean(alias && !panel && !help)} onUnavailable={() => setLite(true)} />}
      </section>
      <header className={styles.mast}>
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
              <button disabled={busy} className={styles.primary}>Vào quán</button>
            </form>
            <p className={styles.note}>Vào sân và tham gia hoạt động miễn phí. Bạn không cần tài khoản.</p>
            {error && <p role="alert" className={styles.error}>{error}</p>}
          </div>
        </section>
      ) : (
        <>
          {lite && <section className={styles.lite}><h2>Sân quán</h2><p>Chọn một hoạt động hoặc ghé bàn thầy.</p>
            {players.length > 0 && <p>Khách đang ở sân: {players.map((player) => player.alias).join(", ")}</p>}
            <div className={styles.quickActions}>{stations.map((station) => <button key={station.action} onClick={() => interactStation(station, true)}>{station.action === "meditate" && action === "meditate" ? "Đứng dậy" : station.label}</button>)}
              <button className={styles.primary} onClick={() => openPanel("session")}>Xem lá số</button>
              {support && <button onClick={() => openPanel("support")}>Hòm công đức</button>}
            </div>
          </section>}
          {!lite && <div className={styles.location}><Compass size={15} /><span>{nearby?.label ?? "Sân quán"}</span></div>}
          {session && !canOrder && <button className={styles.sessionBadge} onClick={() => openPanel("session")}>{session.status === "invited" ? "Đã đến lượt" : "Lượt xem của bạn"}</button>}
          {help && <aside className={styles.help} aria-label="Hướng dẫn và tùy chọn">
            <strong>Đi lại trong quán</strong><p>Dùng cần điều khiển hoặc phím WASD. Chạm nền để đi, kéo cảnh để xoay góc nhìn.</p>
            <p>Đến gần bàn hương, góc thiền hoặc bàn thầy để hiện nút tương tác.</p>
            {board && <p>{board.tables ? `${board.occupied}/${board.tables} bàn đang dùng · ${board.queued} lượt chờ` : "Bàn thầy đang tạm nghỉ"}</p>}
            <button onClick={() => { setLite(!lite); setHelp(false); }}>{lite ? "Thử lại 3D" : "Giao diện nhẹ"}</button>
            <button onClick={() => { setHelp(false); openPanel("restore"); }}>Khôi phục lượt đã mua</button>
          </aside>}
          {notice && <p className={styles.notice} role="status">{notice}</p>}
          {!lite && !panel && !help && <div className={styles.interaction}>
            {nearby ? <button className={styles.primary} onClick={() => interactStation(nearby)}>{nearby.action === "meditate" && action === "meditate" ? "Đứng dậy" : nearby.label}<kbd>E</kbd></button> :
              <span><MapPin size={15} /> Ghé bàn thầy dưới mái ngói</span>}
          </div>}
          {panel && <div className={styles.scrim}><section className={styles.panel} role="dialog" aria-modal="true" aria-labelledby="quan-panel-title">
            <div className={styles.panelHead}><h2 id="quan-panel-title" ref={panelHeading} tabIndex={-1}>{panel === "session" ? "Bàn luận lá số" : panel === "support" ? "Hòm công đức" : "Khôi phục lượt xem"}</h2><button className={styles.icon} aria-label="Đóng" onClick={() => openPanel(null)}><X size={21} /></button></div>
            {panel === "support" && support && <div className={styles.payment}><p>Ủng hộ tự nguyện để duy trì Tử Vi Quán.</p><Image src={support.qr} alt="QR ủng hộ vận hành Tử Vi Quán" width={250} height={250} unoptimized /><p>Người nhận: <strong>{support.recipient}</strong></p></div>}
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
                if (session.tableNumber) move({ x: (session.tableNumber - 2) * 4.3, z: -5.8 });
                void sessionAction({ action: "start", id: session.id });
              }}>Bắt đầu xem {session.minutes} phút</button></>}
              {session?.status === "active" && <p className={styles.clock} role="timer">{session.paused ? "Đang tạm dừng · " : "Thời gian còn lại · "}{clock}</p>}
              {session?.status === "ended" && <p>Phiên xem đã kết thúc. Bạn có thể đọc lại cuộc trò chuyện bên dưới.</p>}
              {session?.status === "refund" && <p>Phiên dừng do lỗi hệ thống. Khoản hoàn {money.format(session.refundAmountVnd || 0)}đ {session.refundSettledAt ? "đã được đối soát" : "đang được đối soát"}.</p>}
              {session?.status === "cancelled" && <p>Đơn đã hết hạn hoặc đã được hủy. Bạn có thể tạo đơn mới.</p>}
              {session?.messages && session.messages.length > 0 && <div className={styles.messages} aria-label="Cuộc trò chuyện" aria-live="polite">
                {session.messages.map((message) => <article key={message.id}><p><strong>Bạn</strong><br />{message.question}</p>{message.answer && <p><strong>Thầy AI</strong><br />{message.answer}</p>}</article>)}
              </div>}
              {session?.status === "active" && <form onSubmit={async (event) => {
                event.preventDefault();
                if (questionTurn.current?.question !== question) questionTurn.current = { question, id: crypto.randomUUID() };
                if (await sessionAction({ action: "chat", id: session.id, question, turnId: questionTurn.current.id })) {
                  questionTurn.current = null;
                  setQuestion("");
                }
              }}>
                <label htmlFor="quan-question">Câu hỏi dành cho thầy AI</label>
                <textarea id="quan-question" value={question} onChange={(event) => setQuestion(event.target.value)} required maxLength={1000} rows={3} />
                <button className={styles.primary} disabled={busy || session.inFlight || remaining <= 0 || !question.trim()}>{busy || session.inFlight ? "Thầy đang trả lời…" : "Gửi câu hỏi"}</button>
              </form>}
              {canOrder && (paymentsEnabled ? <form onSubmit={checkout}>
                <fieldset><legend>Chọn phiên xem</legend><div className={styles.packages}>
                  {([15, 30] as const).map((duration) => <label key={duration} className={styles.package}>
                    <input type="radio" name="minutes" checked={minutes === duration} onChange={() => setMinutes(duration)} />
                    <span><strong>{duration} phút</strong><br />{duration === 15 ? "100.000đ" : "200.000đ"}</span>
                  </label>)}
                </div></fieldset>
                <label>Người được xem<input name="fullName" maxLength={80} placeholder={alias} /></label>
                <div className={styles.birth}>
                  <label>Ngày sinh dương lịch<input type="date" name="birthDate" min="1900-01-01" max={new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" })} required /></label>
                  <label>Giờ sinh<select name="hour" defaultValue="" required><option value="" disabled>Chọn giờ</option>{Array.from({ length: 24 }, (_, hour) => <option key={hour} value={hour}>{hour} giờ</option>)}</select></label>
                  <label>Giới tính<select name="gender"><option value="male">Nam</option><option value="female">Nữ</option></select></label>
                </div>
                <p className={styles.note}>Thầy AI trả lời bằng chữ. Nội dung câu hỏi và dữ liệu luận số được xử lý bằng dịch vụ AI. Phiên mang tính tham khảo.</p>
                <button className={styles.primary} disabled={busy}>{busy ? "Đang tạo mã QR…" : "Tạo mã QR thanh toán"}</button>
              </form> : <p>Quán chưa mở nhận thanh toán. Bạn vẫn có thể ghé sân và tham gia các hoạt động miễn phí.</p>)}
            </>}
            {error && <p role="alert" className={styles.error}>{error}</p>}
          </section></div>}
        </>
      )}
    </main>
  );
}
