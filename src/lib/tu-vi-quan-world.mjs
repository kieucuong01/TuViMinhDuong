export const QUAN_BOUNDS = { minX: -52, maxX: 32, minZ: -28, maxZ: 34 };
export const QUAN_SPAWN = { x: 0, z: 22 };
export const QUAN_MONASTERY_SEATS = Array.from({ length: 28 }, (_, index) => ({ index, x: -9 + index % 7 * 3, z: -6 + Math.floor(index / 7) * 3.5 }));
export const QUAN_STATIONS = [
  { id: "teacher", label: "Chính điện Tử Vi", x: 0, z: -15, description: "Gặp Thầy Tử Vi và xem lá số" },
  { id: "incense", label: "Bàn thờ Thần Tài", x: -18, z: 26.5, description: "Thắp hương bên vườn trúc, xin lộc đầu ngày" },
  { id: "monastery", label: "Tu viện An Nhiên", x: -36, z: -8, description: "Chọn đệm ngồi để thiền, lần tràng hạt hoặc tụng kinh" },
  { id: "iching", label: "Viện Kinh Dịch", x: 20, z: 3.7, description: "Gieo quẻ và trò chuyện cùng Thầy Dịch" },
  { id: "support", label: "Hòm công đức", x: 0, z: -7.5, description: "Ủng hộ duy trì quán tự nguyện" },
  { id: "tea", label: "Viện Tarot", x: -20, z: 13, description: "Trải bài và trò chuyện cùng Cô Tarot" },
  { id: "lotus", label: "Vườn hồ sen", x: 10, z: 19, description: "Ngắm hồ sen và đèn hoa đăng" },
  { id: "ranking", label: "Bảng vàng công đức", x: -10, z: -2, description: "Xem năm khách có nhiều Điểm An Nhiên" },
  { id: "calligraphy", label: "Xin chữ", x: -14, z: 14, description: "Nhận một chữ đầu ngày hoặc một câu vui" },
];
export const QUAN_BLOCKS = [
  { minX: -49.5, maxX: -22.5, minZ: -26, maxZ: -9.5 },
  { minX: -13, maxX: 13, minZ: -27, maxZ: -17.4 },
  { minX: -19.9, maxX: -16.1, minZ: 21.5, maxZ: 24.5 },
  { minX: -13, maxX: -7, minZ: -6.8, maxZ: -5.8 },
  { minX: -1.05, maxX: 1.05, minZ: -10.5, maxZ: -9.2 },
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
