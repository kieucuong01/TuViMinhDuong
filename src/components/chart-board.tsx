import Link from "next/link";
import type { Palace, TuViChart } from "@/lib/chart";
import { APP_NAME } from "@/lib/env";

const STEM_SHORT = ["G", "Ấ", "B", "Đ", "M", "K", "C", "T", "N", "Q"];
const BRANCH_ORDER = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
const HOUR_BRANCH_RANGES = [
  "23h - 00h59",
  "01h - 02h59",
  "03h - 04h59",
  "05h - 06h59",
  "07h - 08h59",
  "09h - 10h59",
  "11h - 12h59",
  "13h - 14h59",
  "15h - 16h59",
  "17h - 18h59",
  "19h - 20h59",
  "21h - 22h59",
];

const MAIN_STAR_SIGNS: Record<string, "+" | "–"> = {
  "Tử Vi": "+",
  "Thiên Phủ": "–",
  "Thái Dương": "+",
  "Thái Âm": "–",
  "Thiên Cơ": "–",
  "Thiên Đồng": "+",
  "Vũ Khúc": "–",
  "Liêm Trinh": "–",
  "Thiên Tướng": "+",
  "Thiên Lương": "–",
  "Cự Môn": "–",
  "Thất Sát": "+",
  "Phá Quân": "–",
  "Tham Lang": "–",
};

const PALACE_POSITIONS: Record<string, { col: number; row: number }> = {
  "Phúc Đức": { col: 1, row: 1 },
  "Điền Trạch": { col: 2, row: 1 },
  "Quan Lộc": { col: 3, row: 1 },
  "Nô Bộc": { col: 4, row: 1 },
  "Thiên Di": { col: 4, row: 2 },
  "Tật Ách": { col: 4, row: 3 },
  "Tài Bạch": { col: 4, row: 4 },
  "Tử Tức": { col: 3, row: 4 },
  "Phu Thê": { col: 2, row: 4 },
  "Huynh Đệ": { col: 1, row: 4 },
  "Mệnh": { col: 1, row: 3 },
  "Phụ Mẫu": { col: 1, row: 2 },
};

const cycleLabels = ["Lâm Quan", "Quan Đới", "Mộc Dục", "Tràng Sinh", "Dưỡng", "Thai", "Tuyệt", "Mộ", "Tử", "Bệnh", "Suy", "Đế Vượng"];
const smallStars = ["Bát Tọa", "Long Đức", "Thiên Tài", "Thiên Hỷ", "Thiên Y", "Thiên Giải", "Quốc Ấn", "Thanh Long"];
const elementLegend = [
  ["Kim", "#9ca3af"],
  ["Mộc", "#10b981"],
  ["Thủy", "#0f172a"],
  ["Hỏa", "#ef4444"],
  ["Thổ", "#f59e0b"],
];

const GOOD_STARS = [
  "Lộc Tồn",
  "Hóa Lộc",
  "Hóa Quyền",
  "Hóa Khoa",
  "Long Trì",
  "Phượng Các",
  "Giải Thần",
  "Thiên Đức",
  "Nguyệt Đức",
  "Thiên Việt",
  "Thiên Khôi",
  "Thiên Quan",
  "Thiên Phúc",
  "Tả Phù",
  "Hữu Bật",
  "Văn Xương",
  "Văn Khúc",
  "Thai Phụ",
  "Phong Cáo",
  "Quốc Ấn",
  "Thiên Giải",
  "Địa Giải",
  "Thiên Quý",
  "Ân Quang",
  "Tam Thai",
  "Bát Tọa",
  "Thanh Long",
  "Đào Hoa",
  "Hồng Loan",
  "Thiên Hỷ",
];
const CHALLENGE_STARS = [
  "Kình Dương",
  "Đà La",
  "Địa Không",
  "Địa Kiếp",
  "Hỏa Tinh",
  "Linh Tinh",
  "Thiên Hình",
  "Thiên Riêu",
  "Thiên La",
  "Địa Võng",
  "Thiên Khốc",
  "Thiên Hư",
  "Tang Môn",
  "Bạch Hổ",
  "Tuế Phá",
  "Điếu Khách",
  "Hóa Kỵ",
  "Thiên Sứ",
  "Thiên Thương",
  "Kiếp Sát",
  "Phá Toái",
  "Đại Hao",
  "Tiểu Hao",
  "Quan Phù",
  "Phục Binh",
];

function mod(value: number, base: number) {
  return ((value % base) + base) % base;
}

function getHourBranchIndex(hour: number) {
  if (hour < 0 || hour > 23) return 0;
  return Math.floor(((hour + 1) % 24) / 2);
}

function palaceCanChiLabel(chart: TuViChart, palace: Palace) {
  const branchIndex = BRANCH_ORDER.indexOf(palace.branch);
  if (branchIndex < 0) return palace.branch;
  const yearStem = mod(chart.lunar.year - 4, 10);
  const stemIndex = mod(yearStem * 2 + 2 + mod(branchIndex - 2, 12), 10);
  return `${STEM_SHORT[stemIndex]}.${palace.branch}`;
}

function palacePolarity(palace: Palace) {
  return BRANCH_ORDER.indexOf(palace.branch) % 2 === 0 ? "+" : "–";
}

function mainStarLabel(palace: Palace, star: string) {
  const sign = MAIN_STAR_SIGNS[star];
  return `${sign ? `${sign} ` : ""}${starLabel(palace, star)}`;
}

function starTone(star: string, kind: "main" | "support" | "yearly") {
  if (kind === "main") return star === "Vô chính diệu" ? "star-muted" : "star-main";
  if (kind === "yearly") return "star-green";
  if (GOOD_STARS.some((item) => star.includes(item))) return "star-green";
  if (CHALLENGE_STARS.some((item) => star.includes(item))) return "star-red";
  return "star-muted";
}

function starLabel(palace: Palace, star: string) {
  const state = palace.starStates?.[star];
  return state ? `${star} (${state})` : star;
}

function starList(palace: Palace, stars: string[], fallback: string) {
  return stars.length ? stars.map((star) => starLabel(palace, star)).join(", ") : fallback;
}

function mainStarList(palace: Palace, stars: string[], fallback: string) {
  return stars.length ? stars.map((star) => mainStarLabel(palace, star)).join(", ") : fallback;
}

function birthTimeLabel(chart: TuViChart) {
  if (typeof chart.input.birthMinute === "number") {
    return `${chart.input.birthHour} giờ ${String(chart.input.birthMinute).padStart(2, "0")} phút (${chart.canChi.hour})`;
  }
  return `${HOUR_BRANCH_RANGES[getHourBranchIndex(chart.input.birthHour)]} (${chart.canChi.hour})`;
}

function palaceNameTone(palace: Palace) {
  if (palace.isMenh) return "palace-name-green";
  if (palace.name === "Tật Ách" || palace.name === "Điền Trạch" || palace.name === "Quan Lộc") return "palace-name-orange";
  return "palace-name-default";
}

function findThanCu(chart: TuViChart) {
  return chart.palaces.find((palace) => palace.isThan)?.name || "Đang cập nhật";
}

function markerPlacement(first: { col: number; row: number }, second?: { col: number; row: number }) {
  if (second && first.col === second.col && Math.abs(first.row - second.row) === 1) {
    return {
      col: first.col,
      row: Math.max(first.row, second.row),
      anchor: "top",
    };
  }

  if (second && first.row === second.row && Math.abs(first.col - second.col) === 1) {
    return {
      col: Math.max(first.col, second.col),
      row: first.row,
      anchor: "left",
    };
  }

  return {
    col: first.col,
    row: first.row,
    anchor: "top",
  };
}

function chartObstructionMarkers(chart: TuViChart) {
  const markerMap = new Map<string, { labels: string[]; col: number; row: number; anchor: string }>();

  for (const label of ["Tuần", "Triệt"]) {
    const affected = chart.palaces
      .filter((palace) => palace.supportStars.includes(label))
      .map((palace) => PALACE_POSITIONS[palace.name])
      .filter(Boolean);

    if (!affected.length) continue;

    const placement = markerPlacement(affected[0], affected[1]);
    const key = `${placement.col}-${placement.row}-${placement.anchor}`;
    const current = markerMap.get(key) || { labels: [], ...placement };
    current.labels.push(label);
    markerMap.set(key, current);
  }

  return Array.from(markerMap.entries()).map(([key, marker]) => ({
    key,
    label: marker.labels.join("/"),
    className: `chart-obstruction-marker anchor-${marker.anchor}`,
    style: { gridColumn: marker.col, gridRow: marker.row },
  }));
}

function PalaceCell({ chart, palace, position, order }: { chart: TuViChart; palace: Palace; position: { col: number; row: number }; order: number }) {
  const extraStars = palace.supportStars.length ? palace.supportStars : smallStars.slice(order % 3, order % 3 + 3);

  return (
    <article
      className="palace-cell"
      style={{ gridColumn: position.col, gridRow: position.row }}
    >
      <div className="palace-topline">
        <span className="branch-mark">{palaceCanChiLabel(chart, palace)}</span>
        <strong className={palaceNameTone(palace)}>
          {palace.name}
          {palace.isThan ? <b>Thân</b> : null}
        </strong>
        <span>{palace.ageRange.split("-")[0]}</span>
      </div>
      <div className="palace-polarity" aria-hidden="true">{palacePolarity(palace)}</div>

      <div className="palace-main-stars">
        {palace.mainStars.map((star, index) => (
          <span key={`${star}-${index}`} className={starTone(star, "main")}>
            {mainStarLabel(palace, star)}
          </span>
        ))}
      </div>

      <div className="palace-support-grid">
        {extraStars.filter((star) => star !== "Tuần" && star !== "Triệt").slice(0, 14).map((star, index) => (
          <span key={`${star}-${index}`} className={starTone(star, "support")}>
            {starLabel(palace, star)}
          </span>
        ))}
        {palace.yearlyStars.map((star, index) => (
          <span key={`${star}-${index}`} className={`${starTone(star, "yearly")} star-yearly`}>
            {starLabel(palace, star)}
          </span>
        ))}
      </div>

      <div className="palace-bottomline">
        <span>{palace.lifecycle || cycleLabels[order]}</span>
        <span>T.{(order + 1) % 12 || 12}</span>
      </div>

      <div className="palace-flags">
        {palace.isMenh ? <span>Mệnh</span> : null}
      </div>
    </article>
  );
}

export function ChartBoard({ chart }: { chart: TuViChart }) {
  const hourLabel = birthTimeLabel(chart);
  const thanCu = findThanCu(chart);
  const obstructionMarkers = chartObstructionMarkers(chart);

  return (
    <div className="chart-board" aria-label="Bàn lá số tử vi 12 cung">
      {chart.palaces.map((palace, index) => (
        <PalaceCell
          key={`${palace.branch}-${palace.name}`}
          chart={chart}
          palace={palace}
          order={index}
          position={PALACE_POSITIONS[palace.name] || { col: 1, row: 1 }}
        />
      ))}

      {obstructionMarkers.map((marker) => (
        <div
          key={marker.key}
          className={marker.className}
          style={marker.style}
          aria-label={marker.label}
        >
          <span>{marker.label}</span>
        </div>
      ))}

      <section className="chart-center" aria-label="Thông tin trung tâm lá số">
        <div className="chart-watermark" aria-hidden="true" />
        <div className="center-content">
          <Link href="/" className="chart-brand-mark" aria-label={APP_NAME}>
            <span>TV</span>
            <strong>{APP_NAME}</strong>
          </Link>
          <p className="center-kicker">TRA CỨU TỬ VI CHÍNH XÁC NHẤT VIỆT NAM</p>
          <Link href="/" className="center-link">https://tu-vi-minh-duong.vercel.app</Link>
          <dl>
            <div><dt>Họ tên</dt><dd>{chart.input.fullName}</dd></div>
            <div><dt>Năm sinh</dt><dd>{chart.solar.year} - {chart.canChi.year}</dd></div>
            <div><dt>Tháng sinh</dt><dd>{chart.solar.month} (tháng {chart.lunar.month} âm - {chart.canChi.month})</dd></div>
            <div><dt>Ngày sinh</dt><dd>{chart.solar.day} (ngày {chart.lunar.day} âm - {chart.canChi.day})</dd></div>
            <div><dt>Giờ sinh</dt><dd>{hourLabel} ({chart.canChi.hour})</dd></div>
            <div><dt>Âm dương</dt><dd>{chart.amDuong} {chart.input.gender === "male" ? "Nam" : "Nữ"}</dd></div>
            <div><dt>Bản mệnh</dt><dd>{chart.banMenh || "Đang cập nhật"}</dd></div>
            <div><dt>Cục mệnh</dt><dd>{chart.cuc} <em>({chart.menhCucRelation || "Đang cập nhật"})</em></dd></div>
            <div><dt>Chủ mệnh</dt><dd>{chart.menhChu || "Đang cập nhật"}</dd></div>
            <div><dt>Chủ thân</dt><dd>{chart.thanChu || "Đang cập nhật"}</dd></div>
            <div><dt>Cân lượng</dt><dd>{chart.boneWeight?.label || "Đang cập nhật"}</dd></div>
            <div><dt>Lai nhân</dt><dd>cung {chart.laiNhan || "Đang cập nhật"}</dd></div>
            <div><dt>Thân cư</dt><dd>{thanCu}</dd></div>
            <div><dt>Xem thêm</dt><dd>Nguyệt vận tháng {chart.lunar.month}<em>& tiểu vận năm {chart.input.viewYear} âm lịch</em></dd></div>
          </dl>
          <small>© 2026 - {APP_NAME}</small>
        </div>
      </section>

      <footer className="chart-legend">
        <span><strong>M:</strong> Miếu</span>
        <span><strong>V:</strong> Vượng</span>
        <span><strong>Đ:</strong> Đắc</span>
        <span><strong>B:</strong> Bình hòa</span>
        <span><strong>H:</strong> Hãm</span>
        <span className="legend-elements">
          {elementLegend.map(([label, color]) => (
            <span key={label}><i style={{ backgroundColor: color }} />{label}</span>
          ))}
        </span>
      </footer>
    </div>
  );
}

export function PalaceAccordion({ chart }: { chart: TuViChart }) {
  return (
    <div className="mobile-palace-list grid gap-3 md:hidden">
      {chart.palaces.map((palace) => (
        <details key={palace.branch} className="mobile-palace-card">
          <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">
            <span>
              {palace.name} ({palace.branch})
              {palace.isMenh ? <b>Mệnh</b> : null}
              {palace.isThan ? <b>Thân</b> : null}
            </span>
            <span>{palace.ageRange}</span>
          </summary>
          <div className="mobile-palace-body">
            <p><strong>Chính tinh:</strong> {mainStarList(palace, palace.mainStars, "Không có")}</p>
            <p><strong>Phụ tinh:</strong> {starList(palace, palace.supportStars, "Bình hòa")}</p>
            <p><strong>Lưu niên:</strong> {starList(palace, palace.yearlyStars, "Không có sao lưu niên nổi bật")}</p>
            <p><strong>Vòng trường sinh:</strong> {palace.lifecycle}</p>
          </div>
        </details>
      ))}
    </div>
  );
}

export function MobileChartReader({ chart }: { chart: TuViChart }) {
  const menh = chart.palaces.find((palace) => palace.isMenh);
  const than = chart.palaces.find((palace) => palace.isThan);

  return (
    <section className="mobile-chart-reader md:hidden">
      <div className="mobile-chart-summary">
        <p className="eyebrow">Đọc nhanh lá số</p>
        <h2>{chart.input.fullName}</h2>
        <dl>
          <div><dt>Âm lịch</dt><dd>{chart.lunar.day}/{chart.lunar.month}/{chart.lunar.year}</dd></div>
          <div><dt>Can chi</dt><dd>{chart.canChi.year}</dd></div>
          <div><dt>Mệnh</dt><dd>{chart.menh}</dd></div>
          <div><dt>Thân</dt><dd>{chart.than}</dd></div>
          <div><dt>Cục</dt><dd>{chart.cuc}</dd></div>
          <div><dt>Cân lượng</dt><dd>{chart.boneWeight?.label || "Đang cập nhật"}</dd></div>
          <div><dt>Lai nhân</dt><dd>{chart.laiNhan || "Đang cập nhật"}</dd></div>
        </dl>
        <div className="mobile-focus-grid">
          <span><strong>Cung Mệnh</strong>{menh ? `${menh.name} tại ${menh.branch}` : "Đang cập nhật"}</span>
          <span><strong>Cung Thân</strong>{than ? `${than.name} tại ${than.branch}` : "Đang cập nhật"}</span>
        </div>
      </div>

      <nav className="mobile-chart-jump" aria-label="Đi nhanh phần luận giải">
        <a href="#mobile-palaces">12 cung</a>
        <a href="?view=luan-cung">Luận cung</a>
        <a href="?view=dai-van">Đại vận</a>
        <a href="?view=nhat-van">Nhật vận</a>
      </nav>

      <div id="mobile-palaces">
        <PalaceAccordion chart={chart} />
      </div>

      <details className="mobile-full-board">
        <summary>Xem bàn lá số 12 cung</summary>
        <div className="chart-frame">
          <div className="min-w-[980px]">
            <ChartBoard chart={chart} />
          </div>
        </div>
      </details>
    </section>
  );
}
