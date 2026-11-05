import { randomUUID } from "node:crypto";
import { moderateWish } from "../src/lib/tu-vi-quan-moderation.mjs";
import { createServer } from "node:http";
import { isIP } from "node:net";
import dotenv from "dotenv";
import pg from "pg";
import { WebSocket, WebSocketServer } from "ws";
import { quanPresenceSecret, quanSeatCheckToken, verifyQuanSocketTicket } from "../src/lib/tu-vi-quan-presence.mjs";
import { isQuanWalkable, QUAN_SPAWN, QUAN_MONASTERY_SEATS } from "../src/lib/tu-vi-quan-world.mjs";

const MAX_GUESTS = 24;
const ROOM_NAMES = ["Sân Trúc", "Sân Sen", "Sân Mai", "Sân Trà"];
const MAX_PER_IP = 6;
const ACTIONS = new Set(["idle", "incense", "greet", "meditate", "monastery"]);
const CHANNEL = "tu-vi-quan";
const SOCKET_PATH = "/tu-vi-quan-ws";
const SPAWN_COLUMNS = [0, 1.75, -1.75, 3.5, -3.5, 5.25, -5.25, 7, -7];

export function createQuanPresenceServer({ secret, origins, readBoard = async () => null, ecosystemEnabled = true }) {
  if (!secret) throw new Error("Tá»­ Vi QuÃ¡n requires AUTH_SECRET in production.");
  const roomNames = ecosystemEnabled ? ROOM_NAMES : ROOM_NAMES.slice(0, 1);
  const allowedOrigins = new Set(origins);
  const guests = new Map();
  const messages = roomNames.map(() => []);
  const arrivals = roomNames.map(() => []);
  const chatRates = new Map();
  let dirty = false;
  let board = null;
  let readingBoard = false;

  const server = createServer({ headersTimeout: 5_000, requestTimeout: 10_000, maxHeaderSize: 8_192 }, (request, response) => {
    if (request.method === "GET" && request.url === "/health") {
      response.writeHead(200, { "Content-Type": "text/plain", "Cache-Control": "no-store" }).end("ok");
      return;
    }
    const seatId = request.method === "GET" && request.url?.match(/^\/monastery-seat\/([A-Za-z0-9_-]{22})$/)?.[1];
    if (seatId && ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(request.socket.remoteAddress) && request.headers.authorization === "Bearer " + quanSeatCheckToken(secret)) {
      const person = guests.get(seatId);
      const seated = person?.player.action === "monastery" && Number.isInteger(person.player.seatIndex);
      response.writeHead(seated ? 200 : 409, { "Content-Type": "application/json", "Cache-Control": "no-store" }).end(JSON.stringify(seated ? { index: person.player.seatIndex, room: person.room } : { error: "Chọn một đệm trống trước khi thực hành." }));
      return;
    }
    response.writeHead(404).end();
  });
  server.maxConnections = 192;
  const ws = new WebSocketServer({
    noServer: true,
    maxPayload: 1024,
    perMessageDeflate: false,
    handleProtocols: (protocols) => protocols.has(CHANNEL) ? CHANNEL : false,
  });

  function snapshot(socket, selfId) {
    if (socket.readyState !== WebSocket.OPEN) return;
    if (socket.bufferedAmount > 64 * 1024) {
      socket.terminate();
      return;
    }
    const room = guests.get(selfId)?.room ?? 0;
    const players = [...guests.values()].filter(presence => presence.room === room).map(({ player }) => player);
    const rooms = roomNames.map((name, id) => ({ id, name, count: [...guests.values()].filter(presence => presence.room === id).length, capacity: MAX_GUESTS }));
    const activity = [...arrivals[room].filter(item => item.playerId !== selfId), ...(board?.activities ?? [])]
      .sort((a, b) => b.at - a.at).slice(0, 4).map(({ id, text }) => ({ id, text }));
    const seats = board && { tables: board.tables, queued: board.queued, occupied: board.occupied };
    socket.send(JSON.stringify({ type: "snapshot", selfId, players, board: seats, ...(ecosystemEnabled ? { room: rooms[room], rooms, messages: messages[room], activity, leaders: board?.leaders ?? [] } : {}) }));
  }

  function reject(socket, status) {
    socket.end(`HTTP/1.1 ${status}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`);
  }

  server.on("upgrade", (request, socket, head) => {
    socket.on("error", () => socket.destroy());
    if (request.url !== SOCKET_PATH) return reject(socket, "404 Not Found");
    if (!allowedOrigins.has(request.headers.origin)) return reject(socket, "403 Forbidden");
    const [channel, ticket, ...other] = (request.headers["sec-websocket-protocol"] || "").split(/,\s*/);
    const identity = channel === CHANNEL && !other.length ? verifyQuanSocketTicket(ticket, secret) : null;
    if (!identity) return reject(socket, "401 Unauthorized");
    const prior = guests.get(identity.id);
    const forwardedIp = request.headers["x-quan-client-ip"];
    const ip = typeof forwardedIp === "string" && isIP(forwardedIp) ? forwardedIp : request.socket.remoteAddress;
    const sameSource = [...guests.values()].filter((presence) => presence !== prior && presence.ip === ip).length;

    ws.handleUpgrade(request, socket, head, (client) => {
      if ((!prior && guests.size >= MAX_GUESTS * roomNames.length) || sameSource >= MAX_PER_IP) {
        client.on("error", () => client.terminate());
        client.close(4003, "Courtyard full");
        return;
      }
      const room = prior?.room ?? roomNames.findIndex((_, id) => [...guests.values()].filter(presence => presence.room === id).length < MAX_GUESTS);
      const spawnX = SPAWN_COLUMNS.find((x) => ![...guests.values()].some(
        ({ player, room: occupiedRoom }) => occupiedRoom === room && Math.hypot(player.x - x, player.z - QUAN_SPAWN.z) < 1.3,
      )) ?? 0;
      const player = {
        ...identity,
        x: prior?.player.x ?? spawnX,
        z: prior?.player.z ?? QUAN_SPAWN.z,
        action: "idle",
        seatIndex: null,
        monasteryPose: "idle",
      };
      const presence = { client, player, room, ip, alive: true, actionUntil: 0 };
      guests.set(player.id, presence);
      if (ecosystemEnabled && !prior && !arrivals[room].some(item => item.playerId === player.id)) {
        const name = moderateWish(player.alias).ok ? player.alias : "Một vị khách";
        arrivals[room] = [...arrivals[room], { id: randomUUID(), playerId: player.id, at: Date.now(), text: `${name} vừa ghé quán.` }].slice(-8);
      }
      prior?.client.close(4000, "Replaced by another tab");
      dirty = true;
      let windowStart = Date.now();
      let frameCount = 0;

      client.on("pong", () => { presence.alive = true; });
      client.on("error", () => client.terminate());
      client.on("close", () => {
        if (guests.get(player.id) !== presence) return;
        guests.delete(player.id);
        dirty = true;
      });
      client.on("message", (raw, binary) => {
        if (guests.get(player.id) !== presence) return;
        const now = Date.now();
        if (now - windowStart >= 1_000) {
          windowStart = now;
          frameCount = 0;
        }
        frameCount++;
        if (frameCount > 80) {
          client.close(1008, "Too many messages");
          return;
        }
        if (binary || frameCount > 20) return;
        try {
          const data = JSON.parse(raw.toString("utf8"));
          if (!data || typeof data !== "object") return;
          if (
            data.type === "move" &&
            typeof data.x === "number" && typeof data.z === "number" && isQuanWalkable(data.x, data.z)
          ) {
            player.x = Math.round(data.x * 100) / 100;
            player.z = Math.round(data.z * 100) / 100;
            player.action = "idle";
            player.seatIndex = null; player.monasteryPose = "idle";
            presence.actionUntil = 0;
            dirty = true;
          } else if (ecosystemEnabled && data.type === "chat") {
            const recent = (chatRates.get(player.id) || []).filter(at => now - at < 10_000);
            if (recent.length >= 3 || (recent.length && now - recent.at(-1) < 2_000)) {
              client.send(JSON.stringify({ type: "chat-error", message: "Bạn đợi một chút rồi gửi tiếp nhé." }));
              return;
            }
            // Count rejected text too: moderation attempts have the same rate limit.
            chatRates.set(player.id, [...recent, now]);
            const verdict = typeof data.text === "string" ? moderateWish(data.text) : { ok: false };
            if (!verdict.ok) {
              client.send(JSON.stringify({ type: "chat-error", message: "Viết tối đa 120 ký tự, không gửi liên kết, số điện thoại hay lời xúc phạm." }));
              return;
            }
            messages[presence.room] = [...messages[presence.room].filter(message => now - message.createdAt < 60_000), {
              id: randomUUID(), playerId: player.id, alias: player.alias, text: verdict.text, createdAt: now,
            }].slice(-20);
            dirty = true;
          } else if (ecosystemEnabled && data.type === "monastery-seat") {
            if (data.seatIndex !== null && (!Number.isInteger(data.seatIndex) || !QUAN_MONASTERY_SEATS[data.seatIndex])) return;
            if (data.seatIndex !== null && [...guests.values()].some(other => other !== presence && other.room === presence.room && other.player.seatIndex === data.seatIndex)) {
              client.send(JSON.stringify({ type: "seat-error", message: "Chỗ này vừa có người ngồi. Bạn chọn đệm khác nhé." }));
              return;
            }
            player.seatIndex = data.seatIndex;
            player.action = "monastery";
            player.monasteryPose = "idle";
            dirty = true;
          } else if (ecosystemEnabled && data.type === "monastery-pose" && player.action === "monastery" && ["idle", "greet", "bow", "incense", "meditate", "beads", "chant"].includes(data.pose)) {
            if (["meditate", "beads", "chant"].includes(data.pose) && player.seatIndex === null) return;
            player.monasteryPose = data.pose; dirty = true;
          } else if (data.type === "action" && ACTIONS.has(data.action)) {
            player.action = data.action;
            if (data.action !== "monastery") { player.seatIndex = null; player.monasteryPose = "idle"; }
            presence.actionUntil = data.action === "incense" || data.action === "greet" ? now + 4_000 : 0;
            dirty = true;
          }
        } catch {
          // Malformed frames do not change shared state.
        }
      });
      snapshot(client, player.id);
    });
  });

  const updates = setInterval(() => {
    const now = Date.now();
    for (const [id, recent] of chatRates) {
      if (!recent.length || now - recent.at(-1) >= 10_000) chatRates.delete(id);
    }
    for (let room = 0; room < messages.length; room++) {
      const active = messages[room].filter(message => now - message.createdAt < 60_000);
      if (active.length !== messages[room].length) { messages[room] = active; dirty = true; }
      const recent = arrivals[room].filter(item => now - item.at < 30_000);
      if (recent.length !== arrivals[room].length) { arrivals[room] = recent; dirty = true; }
    }
    for (const presence of guests.values()) {
      if (presence.actionUntil && presence.actionUntil <= now) {
        presence.player.action = "idle";
        presence.actionUntil = 0;
        dirty = true;
      }
    }
    if (!dirty) return;
    dirty = false;
    for (const [id, { client }] of guests) snapshot(client, id);
  }, 100).unref();
  const heartbeat = setInterval(() => {
    for (const presence of guests.values()) {
      if (!presence.alive) {
        presence.client.terminate();
        continue;
      }
      presence.alive = false;
      presence.client.ping();
    }
  }, 20_000).unref();
  const boardUpdates = setInterval(async () => {
    if (!guests.size || readingBoard) return;
    readingBoard = true;
    try {
      const next = await readBoard();
      if (JSON.stringify(next) !== JSON.stringify(board)) {
        board = next;
        dirty = true;
      }
    } catch {
      if (board) { board = null; dirty = true; }
    } finally {
      readingBoard = false;
    }
  }, 2500).unref();
  server.once("close", () => {
    clearInterval(updates);
    clearInterval(heartbeat);
    clearInterval(boardUpdates);
    ws.close();
  });
  return server;
}

if (process.argv.includes("--serve")) {
  const production = process.env.NODE_ENV === "production";
  const mode = production ? "production" : "development";
  dotenv.config({ path: [`.env.${mode}.local`, ".env.local", `.env.${mode}`, ".env"], quiet: true });
  const configuredOrigin = new URL(process.env.NEXT_PUBLIC_APP_URL || (production ? "https://lasotinhhoa.vn" : "http://localhost:4000")).origin;
  const origins = production ? [configuredOrigin] : [configuredOrigin, "http://localhost:4000", "http://127.0.0.1:4000"];
  const port = production ? 4101 : 4001;
  const pool = process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("johndoe:randompassword")
    ? new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1, connectionTimeoutMillis: 2000, query_timeout: 2000 })
    : null;
  pool?.on("error", () => { /* A later board refresh retries the connection. */ });
  const ecosystemEnabled = process.env.TU_VI_QUAN_ECOSYSTEM_ENABLED === "true" || (!production && process.env.TU_VI_QUAN_ECOSYSTEM_ENABLED !== "false");
  const server = createQuanPresenceServer({
    secret: quanPresenceSecret(), origins, ecosystemEnabled,
    async readBoard() {
      if (!pool) return null;
      const { rows: [board] } = await pool.query(`
        SELECT COALESCE((SELECT "maxTables" FROM "QuanSettings" WHERE id = 'global'), 3) AS tables,
          COUNT(*) FILTER (WHERE status = 'QUEUED')::int AS queued,
          COUNT(*) FILTER (WHERE status = 'INVITED' AND "inviteExpiresAt" > NOW()
            OR status = 'ACTIVE' AND (
              ("outageSince" IS NULL AND "endsAt" + INTERVAL '30 seconds' > NOW())
              OR "outageSince" + INTERVAL '2 minutes' > NOW()
            ))::int AS occupied
        FROM "QuanOrder" WHERE status IN ('QUEUED', 'INVITED', 'ACTIVE')
      `);
      if (!ecosystemEnabled) return board;
      const { rows: leaders } = await pool.query(`
        SELECT p.alias, SUM(e.points)::int AS points
        FROM "QuanEntry" e JOIN "QuanProfile" p ON p.id = e."profileId"
        WHERE e.kind IN ('daily','incense','meditate','check_in','chant','monastery_meditate','monastery_chant','monastery_garden') AND e.points > 0 AND NOT p.blocked
          AND EXISTS (SELECT 1 FROM "QuanEntry" o WHERE o."profileId" = p.id AND o.kind = 'ranking_opt_in' AND o."dayKey" = 'profile')
        GROUP BY p.id, p.alias ORDER BY points DESC, p.id ASC LIMIT 5
      `);
      const { rows: notices } = await pool.query(`
        SELECT w.id, w."createdAt" AT TIME ZONE 'UTC' AS at, w.placement AS kind, NULL::text AS alias, NULL::text AS title
        FROM "QuanWish" w WHERE w.status = 'public' AND w."expiresAt" > timezone('UTC', NOW()) AND w."createdAt" > timezone('UTC', NOW()) - INTERVAL '30 seconds'
        UNION ALL
        SELECT e.id, e."createdAt" AT TIME ZONE 'UTC', 'level', p.alias, e.data->>'title'
        FROM "QuanEntry" e JOIN "QuanProfile" p ON p.id = e."profileId"
        WHERE e.kind = 'public_level' AND NOT p.blocked AND e."createdAt" > timezone('UTC', NOW()) - INTERVAL '30 seconds'
          AND EXISTS (SELECT 1 FROM "QuanEntry" o WHERE o."profileId" = p.id AND o.kind = 'ranking_opt_in' AND o."dayKey" = 'profile')
        ORDER BY at DESC LIMIT 4
      `);
      const activities = notices.map(({ id, at, kind, alias, title }) => ({ id, at: at.getTime(), text:
        kind === "level" && moderateWish(alias ?? "").ok ? `${alias} nhận danh hiệu ${title}.`
          : kind === "lotus" ? "Một vị khách vừa thả hoa đăng." : "Một vị khách vừa treo lời nguyện công khai." }));
      return { ...board, activities, leaders: leaders.filter(({alias}) => moderateWish(alias).ok) };
    },
  });
  server.listen(port, "127.0.0.1", () => console.log(`Tá»­ Vi QuÃ¡n presence listening on 127.0.0.1:${port}`));
}
