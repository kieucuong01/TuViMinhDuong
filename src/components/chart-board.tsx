import Link from "next/link";
import type { Palace, TuViChart } from "@/lib/chart";
import { APP_NAME } from "@/lib/env";

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

function starTone(index: number, kind: "main" | "support" | "yearly") {
  if (kind === "main") return index % 2 === 0 ? "star-red" : "star-black";
  if (kind === "yearly") return "star-green";
  return ["star-orange", "star-green", "star-red", "star-muted"][index % 4];
}

function PalaceCell({ palace, position, order }: { palace: Palace; position: { col: number; row: number }; order: number }) {
  const extraStars = palace.supportStars.length ? palace.supportStars : smallStars.slice(order % 3, order % 3 + 3);

  return (
    <article
      className="palace-cell"
      style={{ gridColumn: position.col, gridRow: position.row }}
    >
      <div className="palace-topline">
        <span className="branch-mark">{palace.branch}</span>
        <strong>{palace.name}</strong>
        <span>{palace.ageRange.split("-")[0]}</span>
      </div>

      <div className="palace-main-stars">
        {palace.mainStars.map((star, index) => (
          <span key={star} className={starTone(index, "main")}>
            {star}
          </span>
        ))}
      </div>

      <div className="palace-support-grid">
        {extraStars.slice(0, 7).map((star, index) => (
          <span key={`${star}-${index}`} className={starTone(index, "support")}>
            {star}
          </span>
        ))}
        {palace.yearlyStars.map((star, index) => (
          <span key={star} className={starTone(index, "yearly")}>
            {star}
          </span>
        ))}
      </div>

      <div className="palace-bottomline">
        <span>{palace.lifecycle || cycleLabels[order]}</span>
        <span>T.{(order + 1) % 12 || 12}</span>
      </div>

      <div className="palace-flags">
        {palace.isMenh ? <span>Mệnh</span> : null}
        {palace.isThan ? <span>Thân</span> : null}
      </div>
    </article>
  );
}

export function ChartBoard({ chart }: { chart: TuViChart }) {
  return (
    <div className="chart-board" aria-label="Bàn lá số tử vi 12 cung">
      {chart.palaces.map((palace, index) => (
        <PalaceCell
          key={`${palace.branch}-${palace.name}`}
          palace={palace}
          order={index}
          position={PALACE_POSITIONS[palace.name] || { col: 1, row: 1 }}
        />
      ))}

      <section className="chart-center" aria-label="Thông tin trung tâm lá số">
        <div className="chart-watermark" aria-hidden="true" />
        <div className="center-content">
          <p className="center-kicker">Chương trình luận giải Tử Vi bằng AI</p>
          <Link href="/" className="center-link">{APP_NAME}</Link>
          <h2>LÁ SỐ TỬ VI</h2>
          <dl>
            <div><dt>Họ tên</dt><dd>{chart.input.fullName}</dd></div>
            <div><dt>Năm</dt><dd>{chart.solar?.year ?? chart.input.year}</dd><dd>{chart.canChi.year}</dd></div>
            <div><dt>Tháng</dt><dd>{chart.lunar.month}</dd><dd>{chart.canChi.month}</dd></div>
            <div><dt>Ngày</dt><dd>{chart.lunar.day}</dd><dd>{chart.canChi.day}</dd></div>
            <div><dt>Giờ</dt><dd>{chart.input.birthHour.toString().padStart(2, "0")}h</dd><dd>{chart.canChi.hour}</dd></div>
            <div><dt>Năm xem</dt><dd>{chart.input.viewYear}</dd><dd>{chart.amDuong}</dd></div>
            <div><dt>Âm Dương</dt><dd>{chart.amDuong} {chart.input.gender === "male" ? "Nam" : "Nữ"}</dd><dd>Âm dương thuận lý</dd></div>
            <div><dt>Mệnh</dt><dd>{chart.menh}</dd><dd>Sơn đầu hỏa</dd></div>
            <div><dt>Cục</dt><dd>{chart.cuc}</dd><dd>Bản Mệnh sinh Cục</dd></div>
            <div><dt>Mệnh chủ</dt><dd>Cự môn</dd></div>
            <div><dt>Thân chủ</dt><dd>Thiên tướng</dd></div>
          </dl>
          <span className="seal">東方<br />學理</span>
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
            <p><strong>Chính tinh:</strong> {palace.mainStars.join(", ")}</p>
            <p><strong>Phụ tinh:</strong> {palace.supportStars.join(", ") || "Bình hòa"}</p>
            <p><strong>Lưu niên:</strong> {palace.yearlyStars.join(", ") || "Không có sao lưu niên nổi bật"}</p>
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
