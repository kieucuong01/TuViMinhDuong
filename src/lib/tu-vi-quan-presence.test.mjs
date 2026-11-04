import { once } from "node:events";
import { afterEach, describe, expect, it, vi } from "vitest";
import WebSocket from "ws";
import { issueQuanSocketTicket, verifyQuanSocketTicket } from "./tu-vi-quan-presence.mjs";
import { createQuanPresenceServer } from "../../scripts/tu-vi-quan-realtime.mjs";

const secret = "test-key";
const origin = "https://example.test";
const guest = { id: "private-guest-id", alias: "Khách Trà" };
const cleanups = [];

afterEach(async () => {
  while (cleanups.length) await cleanups.pop()();
  vi.restoreAllMocks();
});

async function listen(options = {}) {
  const server = createQuanPresenceServer({ secret, origins: [origin], ...options });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  cleanups.push(() => new Promise((resolve) => server.close(resolve)));
  return `ws://127.0.0.1:${server.address().port}/tu-vi-quan-ws`;
}

function connect(url, user, headers = { origin }) {
  const ticket = issueQuanSocketTicket(user, secret);
  const client = new WebSocket(url, ["tu-vi-quan", ticket], { headers });
  cleanups.push(async () => {
    if (client.readyState === WebSocket.CLOSED) return;
    const closed = once(client, "close");
    client.terminate();
    await closed;
  });
  return client;
}

function snapshot(client, predicate = () => true) {
  return new Promise((resolve) => {
    const receive = (data) => {
      const frame = JSON.parse(data);
      if (!predicate(frame)) return;
      client.off("message", receive);
      resolve(frame);
    };
    client.on("message", receive);
  });
}

describe("Tử Vi Quán presence", () => {
  it("rejects expired and tampered tickets and never embeds the private guest ID", () => {
    const ticket = issueQuanSocketTicket(guest, secret, 1000);
    expect(verifyQuanSocketTicket(ticket, secret, 1001)).toMatchObject({ alias: guest.alias });
    expect(verifyQuanSocketTicket(ticket, secret, 31_000)).toBeNull();
    expect(verifyQuanSocketTicket(ticket, "wrong-key", 1001)).toBeNull();
    expect(Buffer.from(ticket.split(".")[0], "base64url").toString()).not.toContain(guest.id);
  });

  it("sends positions and actions between two guests without exposing their private IDs", async () => {
    const url = await listen();
    const first = connect(url, guest);
    const initial = await snapshot(first);
    const second = connect(url, { id: "second-private-id", alias: "Bạn Mộc" });
    const joined = await snapshot(second, (frame) => frame.players.length === 2);
    expect(joined.players.map(({ alias }) => alias)).toEqual(["Khách Trà", "Bạn Mộc"]);
    expect(initial.selfId).not.toBe(guest.id);

    const updated = snapshot(first, (frame) => frame.players.some((player) => player.action === "meditate"));
    second.send(JSON.stringify({ type: "move", x: 500, z: 0 }));
    second.send(JSON.stringify({ type: "move", x: 5, z: 1 }));
    second.send(JSON.stringify({ type: "action", action: "meditate" }));
    expect((await updated).players[1]).toMatchObject({ x: 5, z: 1, action: "meditate" });
  });

  it("rejects a handshake from a different website even with a valid ticket", async () => {
    const client = connect(await listen(), guest, { origin: "https://other.test" });
    const [error] = await once(client, "error");
    expect(error.message).toContain("403");
  });

  it("synchronizes the expanded grounds and rejects lake and outside-world positions", async () => {
    const url = await listen();
    const first = connect(url, guest);
    await snapshot(first);
    const second = connect(url, { id: "wide-garden", alias: "Khách Vườn" });
    await snapshot(second, (frame) => frame.players.length === 2);
    const travelled = snapshot(first, frame => frame.players.some(player => player.x === -26 && player.z === 20));
    second.send(JSON.stringify({ type: "move", x: -26, z: 20 }));
    await travelled;
    const rejected = snapshot(first, frame => frame.players.some(player => player.action === "meditate"));
    second.send(JSON.stringify({ type: "move", x: 20, z: 18 }));
    second.send(JSON.stringify({ type: "move", x: 1000, z: 20 }));
    second.send(JSON.stringify({ type: "action", action: "meditate" }));
    expect((await rejected).players[1]).toMatchObject({ x: -26, z: 20 });
  });

  it("limits shared-room occupancy from one source without blocking another source", async () => {
    const url = await listen();
    const headers = { origin, "x-quan-client-ip": "192.0.2.9" };
    for (let i = 0; i < 6; i++) await snapshot(connect(url, { id: "guest-" + i, alias: "Khách Trà" }, headers));
    const blocked = connect(url, { id: "guest-7", alias: "Khách Mới" }, headers);
    expect((await once(blocked, "close"))[0]).toBe(4003);
    const other = connect(url, { id: "guest-8", alias: "Khách Mộc" }, { origin, "x-quan-client-ip": "192.0.2.10" });
    expect((await snapshot(other)).players).toHaveLength(7);
  });
});


describe("four courtyards at capacity", () => {
  it("isolates 96 visitors into four rooms, keeps the paid board global, and reuses a vacancy", async () => {
    const board = { tables: 3, queued: 1, occupied: 2 };
    let publishBoard = false;
    const url = await listen({ readBoard: async () => publishBoard ? board : null });
    const clients = [];
    const frames = [];
    for (let i = 0; i < 96; i++) {
      const client = connect(url, { id: `load-${i}`, alias: `Khách ${i}` }, { origin, "x-quan-client-ip": `192.0.2.${i + 1}` });
      clients.push(client);
      frames.push(await snapshot(client));
    }
    expect(frames.map(frame => frame.room.id)).toEqual(Array.from({ length: 96 }, (_, i) => Math.floor(i / 24)));
    expect(frames[95].rooms.map(room => room.count)).toEqual([24, 24, 24, 24]);
    expect(frames[95].players).toHaveLength(24);
    expect(frames[95].players.every(player => !/^private|^load-/.test(player.id))).toBe(true);
    const firstUpdate = snapshot(clients[0], frame => frame.rooms.every(room => room.count === 24));
    const full = await firstUpdate;
    expect(full.players.every(player => Number(player.alias.split(" ")[1]) < 24)).toBe(true);
    const boardUpdates = Promise.all([clients[0], clients[95]].map(client => snapshot(client, frame => frame.board !== null)));
    publishBoard = true;
    for (const frame of await boardUpdates) expect(frame.board).toEqual(board);
    const blocked = connect(url, { id: "overflow", alias: "Khách mới" }, { origin, "x-quan-client-ip": "198.51.100.1" });
    expect((await once(blocked, "close"))[0]).toBe(4003);
    const departed = once(clients[24], "close"); clients[24].close(); await departed;
    const replacement = await snapshot(connect(url, { id: "replacement", alias: "Khách thay" }, { origin, "x-quan-client-ip": "198.51.100.2" }));
    expect(replacement.room).toMatchObject({id:1,count:24,capacity:24});
    expect(replacement.players.some(player => player.alias === "Khách 0")).toBe(false);
  }, 20_000);
});


it("preserves the original single-room payload and capacity when the ecosystem is disabled", async () => {
  const url = await listen({ ecosystemEnabled: false });
  for (let i = 0; i < 24; i++) {
    const client = connect(url, { id: `legacy-${i}`, alias: "Legacy" }, { origin, "x-quan-client-ip": `192.0.2.${i + 1}` });
    const frame = await snapshot(client);
    expect(frame.room).toBeUndefined();
    expect(frame.messages).toBeUndefined();
    expect(frame.players).toHaveLength(i + 1);
  }
  const overflow = connect(url, { id: "legacy-overflow", alias: "Overflow" }, { origin, "x-quan-client-ip": "192.0.2.25" });
  expect((await once(overflow, "close"))[0]).toBe(4003);
});


describe("ephemeral courtyard conversation", () => {
  it("shares moderated text with a real second guest, ignores spoofed identity and private voice payloads, and rate limits reconnects", async () => {
    const url = await listen();
    const first = connect(url, guest);
    const initial = await snapshot(first);
    const second = connect(url, { id: "social-two", alias: "Bạn Mộc" });
    await snapshot(second);
    const received = snapshot(second, frame => frame.messages?.length === 1);
    first.send(JSON.stringify({ type: "chat", text: "Chào bạn!", alias: "Giả mạo", playerId: "other", transcript: "PRIVATE", audio: "PRIVATE" }));
    const frame = await received;
    expect(frame.messages[0]).toMatchObject({ playerId: initial.selfId, alias: guest.alias, text: "Chào bạn!" });
    expect(JSON.stringify(frame)).not.toContain("PRIVATE");
    expect(JSON.stringify(frame)).not.toContain("Giả mạo");
    const rateError = snapshot(first, frame => frame.type === "chat-error");
    first.send(JSON.stringify({ type: "chat", text: "Gửi quá nhanh" }));
    expect((await rateError).message).toContain("đợi");
    const replacement = connect(url, guest);
    await snapshot(replacement);
    const reconnectError = snapshot(replacement, frame => frame.type === "chat-error");
    replacement.send(JSON.stringify({ type: "chat", text: "Thử đổi thẻ" }));
    expect((await reconnectError).message).toContain("đợi");
  });

  it("rejects URLs, phones, profanity, malformed text and oversized text without publishing them", async () => {
    const url = await listen();
    const first = connect(url, guest);
    await snapshot(first);
    let now = Date.now();
    vi.spyOn(Date, "now").mockImplementation(() => now);
    for (const text of ["https://example.com", "0901234567", "đồ ngu", "a".repeat(121), 42, "<script>"]) {
      now += 11_000;
      const error = snapshot(first, frame => frame.type === "chat-error");
      first.send(JSON.stringify({ type: "chat", text }));
      expect((await error).message).toContain("120");
    }
    const second = connect(url, { id: "social-clean", alias: "Khách" });
    expect((await snapshot(second)).messages).toEqual([]);
  });

  it("keeps only 20 messages per room, isolates a second courtyard and expires messages after 60 seconds", async () => {
    const url = await listen();
    const clients = [];
    for (let i = 0; i < 25; i++) {
      const client = connect(url, { id: `social-${i}`, alias: `Khách ${i}` }, { origin, "x-quan-client-ip": `192.0.2.${i + 1}` });
      clients.push(client);
      await snapshot(client);
    }
    let now = Date.now();
    vi.spyOn(Date, "now").mockImplementation(() => now);
    for (let i = 0; i < 21; i++) {
      const received = snapshot(clients[1], frame => frame.messages?.at(-1)?.text === `Lời chào ${i}`);
      clients[i].send(JSON.stringify({ type: "chat", text: `Lời chào ${i}` }));
      const frame = await received;
      expect(frame.messages.length).toBeLessThanOrEqual(20);
      if (i === 20) expect(frame.messages[0].text).toBe("Lời chào 1");
    }
    const privateRoom = snapshot(clients[24], frame => frame.messages?.length === 1);
    clients[24].send(JSON.stringify({ type: "chat", text: "Sân riêng" }));
    expect((await privateRoom).messages.map(message => message.text)).toEqual(["Sân riêng"]);
    const expired = snapshot(clients[1], frame => frame.messages?.length === 0);
    now += 60_001;
    expect((await expired).messages).toEqual([]);
  }, 20_000);

  it("allows at most three messages in ten seconds even with two-second spacing", async () => {
    const first = connect(await listen(), guest);
    await snapshot(first);
    let now = Date.now();
    vi.spyOn(Date, "now").mockImplementation(() => now);
    for (let i = 0; i < 3; i++) {
      const published = snapshot(first, frame => frame.messages?.length === i + 1);
      first.send(JSON.stringify({ type: "chat", text: `Xin chào ${i}` }));
      await published;
      now += 2100;
    }
    const limited = snapshot(first, frame => frame.type === "chat-error");
    first.send(JSON.stringify({ type: "chat", text: "Lời thứ tư" }));
    expect((await limited).message).toContain("đợi");
  });
});
