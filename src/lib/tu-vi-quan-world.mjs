export const QUAN_BOUNDS = { minX: -32, maxX: 32, minZ: -28, maxZ: 34 };
export const QUAN_SPAWN = { x: 0, z: 22 };
export const QUAN_STATIONS = [
  { id: "teacher", label: "Xem lá số", x: 0, z: -15, description: "Trò chuyện riêng với thầy AI" },
  { id: "incense", label: "Thắp hương", x: -10, z: -2, description: "Một khoảng lặng giữa sân quán" },
  { id: "meditate", label: "Ngồi thiền", x: 18, z: 4, description: "Nghỉ chân dưới hiên vườn" },
  { id: "support", label: "Hòm công đức", x: 9, z: -15, description: "Ủng hộ duy trì quán tự nguyện" },
  { id: "greet", label: "Chắp tay", x: 0, z: 10, description: "Gửi lời chào đến khách trong sân" },
  { id: "tea", label: "Trà đình", x: -20, z: 13, description: "Dạo vườn trúc và nghỉ bên bàn trà" },
  { id: "lotus", label: "Vườn hồ sen", x: 10, z: 19, description: "Ngắm hồ sen và đèn hoa đăng" },
];
export const QUAN_BLOCKS = [
  { minX: -13, maxX: 13, minZ: -27, maxZ: -17.4 },
  { minX: -11.9, maxX: -8.1, minZ: -7, maxZ: -4 },
  { minX: -25, maxX: -15, minZ: 7, maxZ: 10.5 },
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
  if (!isQuanWalkable(from.x, from.z) || !isQuanWalkable(to.x, to.z)) return [];
  const snap = (/** @type {{x:number,z:number}} */ point) => {
    const candidates = [];
    for (let x = Math.floor(point.x); x <= Math.ceil(point.x); x++) {
      for (let z = Math.floor(point.z); z <= Math.ceil(point.z); z++) {
        if (isQuanWalkable(x, z) && [0.25, 0.5, 0.75].every(t =>
          isQuanWalkable(point.x + (x - point.x) * t, point.z + (z - point.z) * t))) {
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
      if (parent.has(nextKey) || !isQuanWalkable(next.x, next.z)) continue;
      parent.set(nextKey, atKey);
      pending.push(next);
    }
  }
  return [];
}
