import { once } from "node:events";
import { afterEach, describe, expect, it } from "vitest";
import WebSocket from "ws";
import { issueQuanSocketTicket, verifyQuanSocketTicket } from "./tu-vi-quan-presence.mjs";
import { createQuanPresenceServer } from "../../scripts/tu-vi-quan-realtime.mjs";

const secret = "test-key";
const origin = "https://example.test";
const guest = { id: "private-guest-id", alias: "Khách Trà" };
const cleanups = [];

afterEach(async () => {
  while (cleanups.length) await cleanups.pop()();
});

async function listen() {
  const server = createQuanPresenceServer({ secret, origins: [origin] });
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
