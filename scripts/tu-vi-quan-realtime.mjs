import { createServer } from "node:http";
import { isIP } from "node:net";
import dotenv from "dotenv";
import pg from "pg";
import { WebSocket, WebSocketServer } from "ws";
import { quanPresenceSecret, verifyQuanSocketTicket } from "../src/lib/tu-vi-quan-presence.mjs";

const MAX_GUESTS = 24;
const MAX_PER_IP = 6;
const ACTIONS = new Set(["idle", "incense", "greet", "meditate"]);
const CHANNEL = "tu-vi-quan";
const SOCKET_PATH = "/tu-vi-quan-ws";
const SPAWN_COLUMNS = [0, 1.75, -1.75, 3.5, -3.5, 5.25, -5.25, 7, -7];

export function createQuanPresenceServer({ secret, origins, readBoard = async () => null }) {
  if (!secret) throw new Error("Tử Vi Quán requires AUTH_SECRET in production.");
  const allowedOrigins = new Set(origins);
  const guests = new Map();
  let dirty = false;
  let board = null;
  let readingBoard = false;

  const server = createServer({ headersTimeout: 5_000, requestTimeout: 10_000, maxHeaderSize: 8_192 }, (request, response) => {
    if (request.method === "GET" && request.url === "/health") {
      response.writeHead(200, { "Content-Type": "text/plain", "Cache-Control": "no-store" }).end("ok");
      return;
    }
    response.writeHead(404).end();
  });
  server.maxConnections = 192;
  const ws = new WebSocketServer({
    noServer: true,
    maxPayload: 256,
    perMessageDeflate: false,
    handleProtocols: (protocols) => protocols.has(CHANNEL) ? CHANNEL : false,
  });

  function snapshot(socket, selfId) {
    if (socket.readyState !== WebSocket.OPEN) return;
    if (socket.bufferedAmount > 64 * 1024) {
      socket.terminate();
      return;
    }
    const players = [...guests.values()].map(({ player }) => player);
    socket.send(JSON.stringify({ type: "snapshot", selfId, players, board }));
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
      if ((!prior && guests.size >= MAX_GUESTS) || sameSource >= MAX_PER_IP) {
        client.on("error", () => client.terminate());
        client.close(4003, "Courtyard full");
        return;
      }
      const spawnX = SPAWN_COLUMNS.find((x) => ![...guests.values()].some(
        ({ player }) => Math.hypot(player.x - x, player.z - 7) < 1.3,
      )) ?? 0;
      const player = {
        ...identity,
        x: prior?.player.x ?? spawnX,
        z: prior?.player.z ?? 7,
        action: "idle",
      };
      const presence = { client, player, ip, alive: true, actionUntil: 0 };
      guests.set(player.id, presence);
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
            Number.isFinite(data.x) && Math.abs(data.x) <= 12 &&
            Number.isFinite(data.z) && Math.abs(data.z) <= 12
          ) {
            player.x = Math.round(data.x * 100) / 100;
            player.z = Math.round(data.z * 100) / 100;
            player.action = "idle";
            presence.actionUntil = 0;
            dirty = true;
          } else if (data.type === "action" && ACTIONS.has(data.action)) {
            player.action = data.action;
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
  const server = createQuanPresenceServer({
    secret: quanPresenceSecret(), origins,
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
      return board;
    },
  });
  server.listen(port, "127.0.0.1", () => console.log(`Tử Vi Quán presence listening on 127.0.0.1:${port}`));
}
