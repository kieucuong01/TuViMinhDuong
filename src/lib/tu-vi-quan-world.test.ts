import { describe, expect, it } from "vitest";
import { QUAN_TEACHER_DESKS, QUAN_BOUNDS, QUAN_SPAWN, QUAN_STATIONS, QUAN_MONASTERY_SEATS, QUAN_MONASTERY_ENTRY, findQuanPath, findQuanMonasteryPath, isQuanWalkable, isQuanMonasteryWalkable, quanGroundHeight, getQuanZone, quanMonasteryToWorld, quanWorldToMonastery } from "./tu-vi-quan-world.mjs";

describe("expanded Tử Vi Quán world", () => {
  it("keeps every station and spawn in walkable terrain", () => {
    for (const point of [QUAN_SPAWN, ...QUAN_STATIONS]) expect(isQuanWalkable(point.x, point.z)).toBe(true);
    expect(QUAN_BOUNDS.maxX - QUAN_BOUNDS.minX).toBeGreaterThan(60);
    for (const point of [{x:NaN,z:0},{x:0,z:Infinity},{x:100,z:0},{x:20,z:18},{x:0,z:-36},{x:-10,z:-6.3}]) {
      expect(isQuanWalkable(point.x,point.z)).toBe(false);
    }
  });

  it("routes between all destinations without cutting through the hall, altar or lake", () => {
    for (const from of [QUAN_SPAWN, ...QUAN_STATIONS]) {
      for (const to of QUAN_STATIONS) {
        const path = findQuanPath(from,to);
        expect(path.length).toBeGreaterThan(0);
        expect(path.at(-1)).toEqual({x:to.x,z:to.z});
        let previous=from;
        for (const next of path) {
          for (let step=0;step<=10;step++) {
            expect(isQuanWalkable(previous.x+(next.x-previous.x)*step/10,previous.z+(next.z-previous.z)*step/10)).toBe(true);
          }
          previous=next;
        }
      }
    }
  });

  it("rejects invalid routing endpoints", () => {
    expect(findQuanPath(QUAN_SPAWN,{x:20,z:18})).toEqual([]);
    expect(findQuanPath({x:NaN,z:0},QUAN_SPAWN)).toEqual([]);
  });

  it("connects a click just outside an obstacle to a safe grid cell", () => {
    const target = { x: 17.35, z: -20.4 };
    const path = findQuanPath(QUAN_SPAWN, target);
    expect(path.length).toBeGreaterThan(0);
    expect(path.at(-1)).toEqual(target);
    expect(path.every(point => isQuanWalkable(point.x, point.z))).toBe(true);
  });
  it("walks from the monastery entrance to every cushion without crossing another cushion", () => {
    for (const seat of QUAN_MONASTERY_SEATS) {
      const path = findQuanMonasteryPath(QUAN_MONASTERY_ENTRY, { x: seat.x, z: seat.z + 1.3 });
      expect(path.length).toBeGreaterThan(0);
      const worldTarget = quanMonasteryToWorld({ x: seat.x, z: seat.z + 1.3 });
      expect(getQuanZone(worldTarget.x, worldTarget.z)).toBe("monastery");
      expect(findQuanPath(QUAN_SPAWN, worldTarget).length).toBeGreaterThan(0);
      expect(findQuanPath(worldTarget, QUAN_SPAWN).length).toBeGreaterThan(0);
      expect(quanWorldToMonastery(worldTarget).x).toBeCloseTo(seat.x);
      for (let i = 1; i < path.length; i++) for (let t = 0; t <= 1; t += .1) {
        expect(isQuanMonasteryWalkable(path[i-1].x + (path[i].x-path[i-1].x)*t, path[i-1].z + (path[i].z-path[i-1].z)*t)).toBe(true);
      }
    }
    expect(quanGroundHeight(0, -13.4)).toBeCloseTo(.24);
    expect(quanGroundHeight(0, -16.9)).toBeCloseTo(1.2);
    expect(quanGroundHeight(0, -18)).toBeCloseTo(1.2);
    expect(quanGroundHeight(10, 0)).toBe(0);
  });
  it("has eight accessible teacher chairs split equally between two halls", () => {
    expect(QUAN_TEACHER_DESKS).toHaveLength(8);
    expect(QUAN_TEACHER_DESKS.filter(seat => seat.x < 0)).toHaveLength(4);
    for (const seat of QUAN_TEACHER_DESKS) {
      expect(getQuanZone(seat.x, seat.z)).toBe("tuvi");
      expect(findQuanPath(QUAN_SPAWN, seat).length).toBeGreaterThan(0);
    }
    expect(QUAN_STATIONS.some(item => /Tarot|Kinh Dịch/.test(item.label))).toBe(false);
  });
  it("walks directly through every open doorway and identifies the activity zone", () => {
    for (const [zone, point] of [
      ["monastery", { x: 0, z: -22 }], ["tuvi", { x: -36, z: -9.8 }],
      ["tuvi", { x: 34, z: -9.8 }],
    ] as const) {
      expect(getQuanZone(point.x, point.z)).toBe(zone);
      expect(findQuanPath(QUAN_SPAWN, point).length).toBeGreaterThan(0);
      expect(findQuanPath(point, QUAN_SPAWN).length).toBeGreaterThan(0);
    }
    expect(getQuanZone(0, -12)).toBe(null);
  });
});
