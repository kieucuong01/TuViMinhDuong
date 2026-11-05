import { Group, Sprite, Vector3 } from "three";
import { expect, it } from "vitest";
import { poseQuanAvatar } from "./tu-vi-quan-avatar-motion";
import { QUAN_MONASTERY_SEATS, quanMonasteryToWorld, QUAN_SPAWN, QUAN_TEMPLE_INCENSE_POINT, findQuanPath, getQuanZone, QUAN_STATIONS } from "./tu-vi-quan-world.mjs";

it("bows at the waist with grounded knees and restores the standing skeleton", () => {
  const body = new Group(), torso = new Group(), head = new Group();
  torso.position.y = .74; head.position.y = .84; body.add(torso); torso.add(head);
  const legs = [new Group(), new Group()], knees = [new Group(), new Group()];
  const arms = [new Group(), new Group()], elbows = [new Group(), new Group()];
  legs.forEach((leg, i) => { leg.position.set(i ? .13 : -.13, .72, 0); body.add(leg); knees[i].position.y = -.32; leg.add(knees[i]); torso.add(arms[i]); arms[i].add(elbows[i]); });
  const rig = { body, torso, head, legs, knees, arms, elbows, badge: new Sprite() };
  let deepest = 0;
  for (let t = 0; t < 8; t += .1) {
    poseQuanAvatar(rig, "idle", t, false, false);
    poseQuanAvatar(rig, "bow", t, false, false); body.updateMatrixWorld(true);
    deepest = Math.max(deepest, torso.rotation.x);
    expect(body.rotation.x).toBe(0);
    expect(torso.rotation.x).toBeGreaterThan(0);
    expect(head.getWorldPosition(new Vector3()).y).toBeGreaterThan(.4);
    for (const knee of knees) expect(knee.getWorldPosition(new Vector3()).y).toBeGreaterThan(0);
  }
  expect(deepest).toBeGreaterThan(1.4);
  poseQuanAvatar(rig, "bow", 8.1, false, false);
  expect(torso.rotation.x).toBeGreaterThan(.15);
  poseQuanAvatar(rig, "idle", 0, false, false);
  expect(body.position.y).toBe(0); expect(torso.rotation.x).toBe(0);
  expect(knees.every(knee => knee.rotation.x === 0)).toBe(true);
});

it("can walk from courtyard and every cushion approach to the temple incense burner", () => {
  expect(getQuanZone(QUAN_TEMPLE_INCENSE_POINT.x, QUAN_TEMPLE_INCENSE_POINT.z)).toBe("monastery");
  expect(findQuanPath(QUAN_SPAWN, QUAN_TEMPLE_INCENSE_POINT).length).toBeGreaterThan(0);
  expect(findQuanPath({ x: 0, z: -18 }, QUAN_TEMPLE_INCENSE_POINT).length).toBeGreaterThan(0);
  for (const seat of QUAN_MONASTERY_SEATS) expect(findQuanPath(quanMonasteryToWorld({ x: seat.x, z: seat.z + 1.3 }), QUAN_TEMPLE_INCENSE_POINT).length).toBeGreaterThan(0);
  const outdoor = QUAN_STATIONS.find(station => station.id === "incense")!;
  expect(findQuanPath(QUAN_SPAWN, outdoor).length).toBeGreaterThan(0);
  expect(Math.abs(outdoor.z - 23)).toBeLessThan(2);
});
