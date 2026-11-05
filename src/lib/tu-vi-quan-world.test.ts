import { describe, expect, it } from "vitest";
import { QUAN_BOUNDS, QUAN_SPAWN, QUAN_STATIONS, findQuanPath, isQuanWalkable } from "./tu-vi-quan-world.mjs";

describe("expanded Tử Vi Quán world", () => {
  it("keeps every station and spawn in walkable terrain", () => {
    for (const point of [QUAN_SPAWN, ...QUAN_STATIONS]) expect(isQuanWalkable(point.x, point.z)).toBe(true);
    expect(QUAN_BOUNDS.maxX - QUAN_BOUNDS.minX).toBeGreaterThan(60);
    for (const point of [{x:NaN,z:0},{x:0,z:Infinity},{x:100,z:0},{x:20,z:18},{x:0,z:-22},{x:-10,z:-6.3}]) {
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
    const target = { x: 13.35, z: -20.4 };
    const path = findQuanPath(QUAN_SPAWN, target);
    expect(path.length).toBeGreaterThan(0);
    expect(path.at(-1)).toEqual(target);
    expect(path.every(point => isQuanWalkable(point.x, point.z))).toBe(true);
  });
});
