export const QUAN_BOUNDS = { minX: -56, maxX: 40, minZ: -42, maxZ: 34 };
export const QUAN_SPAWN = { x: 0, z: 22 };
export const QUAN_MONASTERY_SEATS = Array.from({ length: 28 }, (_, index) => ({ index, x: -9 + index % 7 * 3, z: -6 + Math.floor(index / 7) * 3.5 }));
export const QUAN_MONASTERY_ENTRY = { x: 0, z: 10 };
export function isQuanMonasteryWalkable(/** @type {number} */ x, /** @type {number} */ z) {
  return Number.isFinite(x) && Number.isFinite(z) && x >= -14 && x <= 14 && z >= -7.5 && z <= 12 && QUAN_MONASTERY_SEATS.every(seat => Math.hypot(x - seat.x, z - seat.z) >= 0.9);
}
export function quanGroundHeight(/** @type {number} */ x, /** @type {number} */ z) {
  if (Math.abs(x) <= 17 && z >= -39 && z <= -17) return 1.2;
  if (Math.abs(x) <= 6.25 && z >= -17 && z < -13) return Math.min(1.2, Math.ceil((-z - 13) / 0.8) * 0.24);
  return 0;
}
export const QUAN_STATIONS = [
  { id: "teacher", label: "Tử Vi Quán", x: -36, z: -7, description: "Gặp ba Thầy Tử Vi, nói hoặc nhập thông tin lập lá số" },
  { id: "incense", label: "Bàn thờ Thần Tài", x: -18, z: 26.5, description: "Thắp hương bên vườn trúc, xin lộc đầu ngày" },
  { id: "monastery", label: "Tu viện An Nhiên", x: 0, z: -18, description: "Lên bậc thang, vào điện và đi đến đệm trống để ngồi" },
  { id: "iching", label: "Kinh Dịch Quán", x: 28, z: 3.7, description: "Gieo quẻ và trò chuyện cùng Thầy Dịch" },
  { id: "support", label: "Hòm công đức", x: 4, z: -16, description: "Ủng hộ tự nguyện bên lối lên Tu viện" },
  { id: "tea", label: "Tarot Quán", x: -26, z: 19.5, description: "Trải bài và trò chuyện cùng Cô Tarot" },
  { id: "lotus", label: "Vườn hồ sen", x: 10, z: 19, description: "Ngắm hồ sen và đèn hoa đăng" },
  { id: "ranking", label: "Bảng vàng công đức", x: -10, z: -2, description: "Xem năm khách có nhiều Điểm An Nhiên" },
  { id: "calligraphy", label: "Xin chữ", x: -14, z: 14, description: "Nhận một chữ đầu ngày hoặc một câu vui" },
];
export const QUAN_BLOCKS = [
  { minX: -49, maxX: -23, minZ: -19, maxZ: -9.4 },
  { minX: -17, maxX: 17, minZ: -40, maxZ: -18.5 },
  { minX: -19.9, maxX: -16.1, minZ: 21.5, maxZ: 24.5 },
  { minX: -13, maxX: -7, minZ: -6.8, maxZ: -5.8 },
  { minX: 3, maxX: 5, minZ: -18.4, maxZ: -17.1 },
  { minX: -31, maxX: -21, minZ: 13.5, maxZ: 17 },
];
export const QUAN_POND = { x: 20, z: 18, radiusX: 7, radiusZ: 9 };

/** @param {number} x @param {number} z */
export function isQuanWalkable(x, z) {
  if (!Number.isFinite(x) || !Number.isFinite(z) || x < QUAN_BOUNDS.minX || x > QUAN_BOUNDS.maxX ||
      z < QUAN_BOUNDS.minZ || z > QUAN_BOUNDS.maxZ) return false;
  if (QUAN_BLOCKS.some(b => x > b.minX - 0.3 && x < b.maxX + 0.3 && z > b.minZ - 0.3 && z < b.maxZ + 0.3)) return false;
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
