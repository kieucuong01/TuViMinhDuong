export const QUAN_BOUNDS = { minX: -49, maxX: 49, minZ: -42, maxZ: 29 };
export const QUAN_TEACHER_HALLS = [-31.5, 31.5].map(x => ({ x, z: -17.5 }));
export const QUAN_TEACHER_DESKS = QUAN_TEACHER_HALLS.flatMap((hall, wing) =>
  [-8.25, -2.75, 2.75, 8.25].map((offset, index) => ({ desk: wing * 4 + index + 1, x: hall.x + offset, z: hall.z + 4.05 })));
export const QUAN_TEMPLE_INCENSE_POINT = { x: 1.1, z: -31.1, label: "lư hương điện Phật" };
export const QUAN_SPAWN = { x: 0, z: 19 };
export const QUAN_MONASTERY_SEATS = Array.from({ length: 28 }, (_, index) => ({ index, x: -9 + index % 7 * 3, z: -6 + Math.floor(index / 7) * 3.5 }));
export const QUAN_MONASTERY_ENTRY = { x: 0, z: 10 };
export const QUAN_MONASTERY_SPACE = { x: 0, z: -26.8, depthScale: 0.62, floor: 1.2 };
export function quanMonasteryToWorld(/** @type {{x:number,z:number}} */ point) {
  return { x: point.x + QUAN_MONASTERY_SPACE.x, z: point.z * QUAN_MONASTERY_SPACE.depthScale + QUAN_MONASTERY_SPACE.z };
}
export function quanWorldToMonastery(/** @type {{x:number,z:number}} */ point) {
  return { x: point.x - QUAN_MONASTERY_SPACE.x, z: (point.z - QUAN_MONASTERY_SPACE.z) / QUAN_MONASTERY_SPACE.depthScale };
}
export function getQuanZone(/** @type {number} */ x, /** @type {number} */ z) {
  if (Math.abs(x) <= 15.5 && z >= -38 && z <= -17) return "monastery";
  if (QUAN_TEACHER_HALLS.some(hall => Math.abs(x - hall.x) <= 12.5 && z >= hall.z - 4.5 && z <= hall.z + 4.6)) return "tuvi";
  return null;
}
export function isQuanMonasteryWalkable(/** @type {number} */ x, /** @type {number} */ z) {
  return Number.isFinite(x) && Number.isFinite(z) && x >= -14 && x <= 14 && z >= -7.5 && z <= 16 && QUAN_MONASTERY_SEATS.every(seat => Math.hypot(x - seat.x, z - seat.z) >= 0.9) && [-12.8, 12.8].every(columnX => [-1, 6, 13].every(columnZ => Math.hypot(x - columnX, z - columnZ) >= .85));
}
export function quanGroundHeight(/** @type {number} */ x, /** @type {number} */ z) {
  if (Math.abs(x) <= 17 && z >= -39 && z <= -17) return 1.2;
  if (Math.abs(x) <= 6.25 && z >= -17 && z < -13) return Math.min(1.2, Math.ceil((-z - 13) / 0.8) * 0.24);
  const zone = getQuanZone(x, z);
  if (zone === "tuvi") return .4;
  return 0;
}
export const QUAN_STATIONS = [
  { id: "teacher", label: "Tử Vi Quán · Tây viện", x: QUAN_TEACHER_HALLS[0].x, z: QUAN_TEACHER_HALLS[0].z + 4.2, description: "Gặp bốn Thầy Tử Vi, nói hoặc nhập thông tin lập lá số" },
  { id: "incense", label: "Bàn thờ Thần Tài", x: -18, z: 24.95, description: "Thắp hương bên vườn trúc, xin lộc đầu ngày" },
  { id: "monastery", label: "Tu viện An Nhiên", x: 0, z: -18, description: "Lên bậc thang, vào điện và đi đến đệm trống để ngồi" },
  { id: "teacher-east", label: "Tử Vi Quán · Đông viện", x: QUAN_TEACHER_HALLS[1].x, z: QUAN_TEACHER_HALLS[1].z + 4.2, description: "Bốn bàn Thầy Tử Vi bên phải Tu viện" },
  { id: "support", label: "Hòm công đức", x: 4, z: -16, description: "Ủng hộ tự nguyện bên lối lên Tu viện" },
  { id: "lotus", label: "Vườn hồ sen", x: 10, z: 19, description: "Ngắm hồ sen và đèn hoa đăng" },
  { id: "ranking", label: "Bảng vàng công đức", x: -10, z: -2, description: "Xem năm khách có nhiều Điểm An Nhiên" },
  { id: "calligraphy", label: "Xin chữ", x: -14, z: 14, description: "Nhận một chữ đầu ngày hoặc một câu vui" },
];
export const QUAN_BLOCKS = [
  ...QUAN_TEACHER_HALLS.flatMap(({x, z}) => [
    { minX: x - 13, maxX: x + 13, minZ: z - 5, maxZ: z - 4.6 },
    { minX: x - 13, maxX: x - 12.6, minZ: z - 5, maxZ: z + 4.3 },
    { minX: x + 12.6, maxX: x + 13, minZ: z - 5, maxZ: z + 4.3 },
  ]),
  ...QUAN_TEACHER_DESKS.map(({x, z}) => ({ minX: x - 1.55, maxX: x + 1.55, minZ: z - 2.175, maxZ: z - .925 })),
  { minX: -17, maxX: 17, minZ: -40, maxZ: -38 },
  { minX: -17, maxX: -15.5, minZ: -39, maxZ: -17.1 },
  { minX: 15.5, maxX: 17, minZ: -39, maxZ: -17.1 },
  { minX: -13, maxX: 13, minZ: -38, maxZ: -32.9 },
  { minX: -19.9, maxX: -16.1, minZ: 21.5, maxZ: 24.5 },
  { minX: -13, maxX: -7, minZ: -6.8, maxZ: -5.8 },
  { minX: 3, maxX: 5, minZ: -18.4, maxZ: -17.1 },
];
export const QUAN_POND = { x: 20, z: 18, radiusX: 7, radiusZ: 9 };

/** @param {number} x @param {number} z */
export function isQuanWalkable(x, z) {
  if (!Number.isFinite(x) || !Number.isFinite(z) || x < QUAN_BOUNDS.minX || x > QUAN_BOUNDS.maxX ||
      z < QUAN_BOUNDS.minZ || z > QUAN_BOUNDS.maxZ) return false;
  if (QUAN_BLOCKS.some(b => x > b.minX - 0.3 && x < b.maxX + 0.3 && z > b.minZ - 0.3 && z < b.maxZ + 0.3)) return false;
  if (getQuanZone(x, z) === "monastery") {
    const local = quanWorldToMonastery({ x, z });
    if (!isQuanMonasteryWalkable(local.x, local.z)) return false;
  }
  const pond = QUAN_POND;
  return ((x - pond.x) / (pond.radiusX + 0.3)) ** 2 + ((z - pond.z) / (pond.radiusZ + 0.3)) ** 2 >= 1;
}

/** Grid routing runs only on a new destination, never per frame.
 * @param {{x:number,z:number}} from @param {{x:number,z:number}} to
 * @returns {{x:number,z:number}[]}
 */
export function findQuanPath(from, to) {
  return findPath(from, to, isQuanWalkable);
}
export function findQuanMonasteryPath(/** @type {{x:number,z:number}} */ from, /** @type {{x:number,z:number}} */ to) {
  return findPath(from, to, isQuanMonasteryWalkable);
}
/** @param {{x:number,z:number}} from @param {{x:number,z:number}} to @param {(x:number,z:number)=>boolean} walkable */
function findPath(from, to, walkable) {
  if (!walkable(from.x, from.z) || !walkable(to.x, to.z)) return [];
  const snap = (/** @type {{x:number,z:number}} */ point) => {
    const candidates = [];
    for (let x = Math.floor(point.x); x <= Math.ceil(point.x); x++) {
      for (let z = Math.floor(point.z); z <= Math.ceil(point.z); z++) {
        if (walkable(x, z) && [0.25, 0.5, 0.75].every(t =>
          walkable(point.x + (x - point.x) * t, point.z + (z - point.z) * t))) {
          candidates.push({ x, z });
        }
      }
    }
    return candidates.sort((a, b) => Math.hypot(a.x - point.x, a.z - point.z) - Math.hypot(b.x - point.x, b.z - point.z))[0];
  };
  const start = snap(from);
  const goal = snap(to);
  if (!start || !goal) return [];
  const key = (/** @type {{x:number,z:number}} */ p) => p.x + "," + p.z;
  const startKey = key(start);
  const goalKey = key(goal);
  const parent = new Map([[startKey, ""]]);
  const pending = [start];
  for (let cursor = 0; cursor < pending.length; cursor++) {
    const at = pending[cursor];
    const atKey = key(at);
    if (atKey === goalKey) {
      const path = [{ x: to.x, z: to.z }];
      let current = atKey;
      while (current !== startKey) {
        const [x, z] = current.split(",").map(Number);
        path.push({ x, z });
        current = parent.get(current) || startKey;
      }
      path.push(start);
      return path.reverse();
    }
    for (const [dx, dz] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
      const next = { x: at.x + dx, z: at.z + dz };
      const nextKey = key(next);
      if (parent.has(nextKey) || !walkable(next.x, next.z)) continue;
      parent.set(nextKey, atKey);
      pending.push(next);
    }
  }
  return [];
}
