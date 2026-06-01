"use client";

import Link from "next/link";
import { useState } from "react";
import { Download, Pencil, Search, Share2 } from "lucide-react";
import type { Palace, TuViChart } from "@/lib/chart";

type ChartActionPanelProps = {
  chartId: string;
  chart: TuViChart;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundSvgNumber(value: number) {
  return Number(value.toFixed(3));
}

function palaceScore(palace: Palace) {
  const states = Object.values(palace.starStates);
  const stateScore = states.reduce((total, state) => {
    if (state === "M") return total + 8;
    if (state === "V") return total + 7;
    if (state === "Đ") return total + 5;
    if (state === "B") return total + 2;
    if (state === "H") return total - 7;
    return total;
  }, 0);

  return clamp(38 + palace.mainStars.length * 9 + Math.min(palace.supportStars.length, 12) * 2 + Math.min(palace.yearlyStars.length, 8) * 1.5 + stateScore, 18, 96);
}

function polarPoint(index: number, total: number, radius: number, score = 100) {
  const angle = -Math.PI / 2 + (index * Math.PI * 2) / total;
  const scaled = radius * (score / 100);
  return {
    x: roundSvgNumber(170 + Math.cos(angle) * scaled),
    y: roundSvgNumber(170 + Math.sin(angle) * scaled),
  };
}

function polygonPoints(scores: number[]) {
  return scores
    .map((score, index) => {
      const point = polarPoint(index, scores.length, 118, score);
      return `${point.x.toFixed(1)},${point.y.toFixed(1)}`;
    })
    .join(" ");
}

const EXPORT_WIDTH = 1600;
const EXPORT_MARGIN = 34;
const EXPORT_CELL_WIDTH = (EXPORT_WIDTH - EXPORT_MARGIN * 2) / 4;
const EXPORT_CELL_HEIGHT = 410;
const EXPORT_FOOTER_HEIGHT = 92;
const EXPORT_HEIGHT = EXPORT_MARGIN * 2 + EXPORT_CELL_HEIGHT * 4 + EXPORT_FOOTER_HEIGHT;

const EXPORT_PALACE_POSITIONS: Record<string, { col: number; row: number }> = {
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

const EXPORT_FALLBACK_POSITIONS = [
  { col: 1, row: 3 },
  { col: 1, row: 4 },
  { col: 2, row: 4 },
  { col: 3, row: 4 },
  { col: 4, row: 4 },
  { col: 4, row: 3 },
  { col: 4, row: 2 },
  { col: 4, row: 1 },
  { col: 3, row: 1 },
  { col: 2, row: 1 },
  { col: 1, row: 1 },
  { col: 1, row: 2 },
];

const EXPORT_HOUR_BRANCH_RANGES = [
  "Tý: 23h - 1h",
  "Sửu: 1h - 3h",
  "Dần: 3h - 5h",
  "Mão: 5h - 7h",
  "Thìn: 7h - 9h",
  "Tỵ: 9h - 11h",
  "Ngọ: 11h - 13h",
  "Mùi: 13h - 15h",
  "Thân: 15h - 17h",
  "Dậu: 17h - 19h",
  "Tuất: 19h - 21h",
  "Hợi: 21h - 23h",
];

const EXPORT_POSITIVE_STAR_HINTS = ["Lộc", "Khoa", "Quyền", "Khôi", "Việt", "Tả", "Hữu", "Xương", "Khúc", "Long", "Phượng", "Giải"];
const EXPORT_CHALLENGE_STAR_HINTS = ["Kỵ", "Không", "Kiếp", "Kình", "Đà", "Hỏa", "Linh", "Tang", "Bạch", "Hao", "Hình", "Tuế"];

function createChartFileName(chartId: string, chart: TuViChart) {
  const normalizedName = chart.input.fullName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return `la-so-${normalizedName || chartId}-${chart.input.viewYear}.png`;
}

function canvasToPngBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }

      reject(new Error("Không thể xuất file PNG."));
    }, "image/png");
  });
}

function setCanvasFont(context: CanvasRenderingContext2D, size: number, weight = 700) {
  context.font = `${weight} ${size}px Arial, "Helvetica Neue", sans-serif`;
}

function drawRoundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.lineTo(x + width - safeRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  context.lineTo(x + width, y + height - safeRadius);
  context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  context.lineTo(x + safeRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  context.lineTo(x, y + safeRadius);
  context.quadraticCurveTo(x, y, x + safeRadius, y);
  context.closePath();
}

function fillRoundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number, fillStyle: string | CanvasGradient) {
  drawRoundedRect(context, x, y, width, height, radius);
  context.fillStyle = fillStyle;
  context.fill();
}

function strokeRoundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number, strokeStyle: string, lineWidth = 2) {
  drawRoundedRect(context, x, y, width, height, radius);
  context.strokeStyle = strokeStyle;
  context.lineWidth = lineWidth;
  context.stroke();
}

function wrapCanvasText(context: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const nextLine = line ? `${line} ${word}` : word;
    if (context.measureText(nextLine).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines) break;
    } else {
      line = nextLine;
    }
  }

  if (line && lines.length < maxLines) lines.push(line);
  return lines;
}

function drawWrappedCanvasText(context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines: number) {
  const lines = wrapCanvasText(context, text, maxWidth, maxLines);
  lines.forEach((line, index) => context.fillText(line, x, y + index * lineHeight));
  return y + lines.length * lineHeight;
}

function starLabelForExport(palace: Palace, star: string) {
  const state = palace.starStates?.[star];
  return state ? `${star} (${state})` : star;
}

function starColorForExport(star: string) {
  if (EXPORT_POSITIVE_STAR_HINTS.some((hint) => star.includes(hint))) return "#047857";
  if (EXPORT_CHALLENGE_STAR_HINTS.some((hint) => star.includes(hint))) return "#b91c1c";
  return "#57534e";
}

function getExportHourBranchIndex(hour: number) {
  if (hour < 0 || hour > 23) return 0;
  return Math.floor(((hour + 1) % 24) / 2);
}

function exportBirthTimeLabel(chart: TuViChart) {
  if (typeof chart.input.birthMinute === "number") {
    return `${chart.input.birthHour} giờ ${String(chart.input.birthMinute).padStart(2, "0")} phút`;
  }

  return EXPORT_HOUR_BRANCH_RANGES[getExportHourBranchIndex(chart.input.birthHour)];
}

function drawExportPill(context: CanvasRenderingContext2D, text: string, x: number, y: number, fillStyle: string, color = "#7c2d12") {
  setCanvasFont(context, 17, 900);
  const width = context.measureText(text).width + 24;
  fillRoundedRect(context, x, y, width, 30, 15, fillStyle);
  context.fillStyle = color;
  context.fillText(text, x + 12, y + 6);
  return width;
}

function drawExportPalaceCell(context: CanvasRenderingContext2D, chart: TuViChart, palace: Palace, index: number) {
  const position = EXPORT_PALACE_POSITIONS[palace.name] || EXPORT_FALLBACK_POSITIONS[index % EXPORT_FALLBACK_POSITIONS.length];
  const x = EXPORT_MARGIN + (position.col - 1) * EXPORT_CELL_WIDTH;
  const y = EXPORT_MARGIN + (position.row - 1) * EXPORT_CELL_HEIGHT;
  const width = EXPORT_CELL_WIDTH;
  const height = EXPORT_CELL_HEIGHT;
  const padding = 18;

  context.save();
  context.beginPath();
  context.rect(x, y, width, height);
  context.clip();

  const cellGradient = context.createLinearGradient(x, y, x, y + height);
  cellGradient.addColorStop(0, "#fffaf0");
  cellGradient.addColorStop(1, "#f8f1e3");
  context.fillStyle = cellGradient;
  context.fillRect(x, y, width, height);
  context.strokeStyle = "#8a7c65";
  context.lineWidth = 2;
  context.strokeRect(x, y, width, height);

  context.fillStyle = "#92400e";
  setCanvasFont(context, 18, 900);
  context.textAlign = "left";
  context.fillText(palace.branch, x + padding, y + 17);
  context.textAlign = "right";
  context.fillStyle = "#78716c";
  context.fillText(palace.ageRange, x + width - padding, y + 17);
  context.textAlign = "left";

  const titleColor = palace.isMenh ? "#047857" : palace.isThan ? "#b45309" : "#111827";
  context.fillStyle = titleColor;
  setCanvasFont(context, 25, 950);
  context.fillText(palace.name, x + padding, y + 52);
  if (palace.isThan) drawExportPill(context, "Thân", x + width - 78, y + 50, "#ffedd5");

  let textY = y + 94;
  const mainStars = palace.mainStars.length ? palace.mainStars : ["Vô chính diệu"];
  setCanvasFont(context, 25, 950);
  context.fillStyle = mainStars[0] === "Vô chính diệu" ? "#9ca3af" : "#ea580c";
  for (const star of mainStars.slice(0, 4)) {
    textY = drawWrappedCanvasText(context, starLabelForExport(palace, star), x + padding, textY, width - padding * 2, 30, 2) + 3;
  }

  const supportStars = [...palace.supportStars.filter((star) => star !== "Tuần" && star !== "Triệt"), ...palace.yearlyStars].slice(0, 14);
  const columnWidth = (width - padding * 2 - 18) / 2;
  const supportTop = Math.max(textY + 8, y + 190);
  setCanvasFont(context, 18, 720);
  supportStars.forEach((star, starIndex) => {
    const column = starIndex % 2;
    const row = Math.floor(starIndex / 2);
    const starX = x + padding + column * (columnWidth + 18);
    const starY = supportTop + row * 27;
    context.fillStyle = starColorForExport(star);
    drawWrappedCanvasText(context, starLabelForExport(palace, star), starX, starY, columnWidth, 20, 1);
  });

  context.fillStyle = "#57534e";
  setCanvasFont(context, 17, 800);
  context.fillText(palace.lifecycle || "Đang cập nhật", x + padding, y + height - 34);
  context.textAlign = "right";
  context.fillText(chart.input.viewYear.toString(), x + width - padding, y + height - 34);
  context.textAlign = "left";
  context.restore();
}

function drawExportCenter(context: CanvasRenderingContext2D, chart: TuViChart) {
  const x = EXPORT_MARGIN + EXPORT_CELL_WIDTH;
  const y = EXPORT_MARGIN + EXPORT_CELL_HEIGHT;
  const width = EXPORT_CELL_WIDTH * 2;
  const height = EXPORT_CELL_HEIGHT * 2;
  const gradient = context.createLinearGradient(x, y, x + width, y + height);
  gradient.addColorStop(0, "#151126");
  gradient.addColorStop(0.55, "#1f1b2e");
  gradient.addColorStop(1, "#2f2415");

  fillRoundedRect(context, x + 10, y + 10, width - 20, height - 20, 24, gradient);
  strokeRoundedRect(context, x + 10, y + 10, width - 20, height - 20, 24, "rgba(251, 191, 36, 0.45)", 2);

  context.save();
  context.strokeStyle = "rgba(251, 191, 36, 0.14)";
  context.lineWidth = 2;
  for (let radius = 110; radius <= 330; radius += 72) {
    context.beginPath();
    context.arc(x + width / 2, y + height / 2, radius, 0, Math.PI * 2);
    context.stroke();
  }
  context.restore();

  context.textAlign = "center";
  context.fillStyle = "#f8d46a";
  setCanvasFont(context, 22, 850);
  context.fillText("LÁ SỐ TINH HOA", x + width / 2, y + 78);
  setCanvasFont(context, 42, 950);
  context.fillText("LÁ SỐ TỬ VI", x + width / 2, y + 128);
  context.fillStyle = "#ffffff";
  setCanvasFont(context, 28, 950);
  context.fillText(chart.input.fullName.toUpperCase(), x + width / 2, y + 184);

  context.strokeStyle = "rgba(255, 255, 255, 0.18)";
  context.beginPath();
  context.moveTo(x + 90, y + 224);
  context.lineTo(x + width - 90, y + 224);
  context.stroke();

  const rows = [
    ["Năm sinh", `${chart.solar.year} - ${chart.canChi.year}`],
    ["Tháng sinh", `${chart.solar.month} (âm ${chart.lunar.month})`],
    ["Ngày sinh", `${chart.solar.day} (âm ${chart.lunar.day})`],
    ["Giờ sinh", `${exportBirthTimeLabel(chart)} - ${chart.canChi.hour}`],
    ["Âm dương", `${chart.amDuong} ${chart.input.gender === "male" ? "Nam" : "Nữ"}`],
    ["Bản mệnh", chart.banMenh || "Đang cập nhật"],
    ["Cục mệnh", chart.cuc],
    ["Chủ mệnh", chart.menhChu || "Đang cập nhật"],
    ["Chủ thân", chart.thanChu || "Đang cập nhật"],
    ["Cân lượng", chart.boneWeight?.label || "Đang cập nhật"],
    ["Lai nhân", chart.laiNhan ? `cung ${chart.laiNhan}` : "Đang cập nhật"],
    ["Năm xem", `${chart.input.viewYear}`],
  ];

  context.textAlign = "left";
  const leftX = x + 82;
  const rightX = x + width / 2 + 24;
  let leftY = y + 268;
  let rightY = y + 268;

  const drawCenterRow = (columnX: number, rowY: number, label: string, value: string) => {
    context.fillStyle = "#cbd5e1";
    setCanvasFont(context, 16, 800);
    context.fillText(label.toUpperCase(), columnX, rowY);
    context.fillStyle = "#fbbf24";
    setCanvasFont(context, 22, 950);
    const valueBottom = drawWrappedCanvasText(context, value, columnX, rowY + 24, width / 2 - 110, 27, 2);
    return Math.max(rowY + 72, valueBottom + 18);
  };

  rows.forEach(([label, value], index) => {
    const columnX = index < 6 ? leftX : rightX;
    const rowY = index < 6 ? leftY : rightY;
    const nextY = drawCenterRow(columnX, rowY, label, value);
    if (index < 6) leftY = nextY;
    else rightY = nextY;
  });

  context.textAlign = "center";
  context.fillStyle = "rgba(255, 255, 255, 0.5)";
  setCanvasFont(context, 17, 700);
  context.fillText("Ảnh PNG tải xuống từ lasotinhhoa.vn", x + width / 2, y + height - 54);
}

function renderChartPngCanvas(chart: TuViChart) {
  const canvas = document.createElement("canvas");
  canvas.width = EXPORT_WIDTH;
  canvas.height = EXPORT_HEIGHT;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Trình duyệt không hỗ trợ tạo ảnh PNG.");
  }

  context.textBaseline = "top";
  context.fillStyle = "#f8f1e3";
  context.fillRect(0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);

  const pageGradient = context.createLinearGradient(0, 0, 0, EXPORT_HEIGHT);
  pageGradient.addColorStop(0, "#fffaf0");
  pageGradient.addColorStop(1, "#f3ead8");
  context.fillStyle = pageGradient;
  context.fillRect(0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);

  chart.palaces.forEach((palace, index) => drawExportPalaceCell(context, chart, palace, index));
  drawExportCenter(context, chart);

  const footerY = EXPORT_MARGIN + EXPORT_CELL_HEIGHT * 4 + 28;
  context.fillStyle = "#7c2d12";
  setCanvasFont(context, 20, 900);
  context.textAlign = "left";
  context.fillText("Chú giải: M Miếu · V Vượng · Đ Đắc · B Bình hòa · H Hãm", EXPORT_MARGIN, footerY);
  context.textAlign = "right";
  context.fillText(`Năm xem ${chart.input.viewYear}`, EXPORT_WIDTH - EXPORT_MARGIN, footerY);

  context.textAlign = "left";
  context.fillStyle = "#57534e";
  setCanvasFont(context, 17, 700);
  context.fillText("Màu cam: chính tinh · Xanh: sao hỗ trợ · Đỏ: sao thử thách", EXPORT_MARGIN, footerY + 36);

  return canvas;
}

async function downloadChartAsPng(chartId: string, chart: TuViChart) {
  const pngBlob = await canvasToPngBlob(renderChartPngCanvas(chart));
  const pngUrl = URL.createObjectURL(pngBlob);
  const downloadLink = document.createElement("a");
  downloadLink.href = pngUrl;
  downloadLink.download = createChartFileName(chartId, chart);
  document.body.append(downloadLink);
  downloadLink.click();
  downloadLink.remove();

  window.setTimeout(() => URL.revokeObjectURL(pngUrl), 1000);
}

export function ChartActionPanel({ chartId, chart }: ChartActionPanelProps) {
  const scores = chart.palaces.map(palaceScore);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloadError(null);

    try {
      await downloadChartAsPng(chartId, chart);
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : "Không thể tải ảnh lá số lúc này.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/la-so/${chartId}`;
    const title = `Lá số tử vi của ${chart.input.fullName}`;

    if (navigator.share) {
      await navigator.share({ title, url });
      return;
    }

    await navigator.clipboard.writeText(url);
  };

  return (
    <section className="chart-action-panel" aria-label="Thao tác với lá số" data-testid="chart-action-panel">
      <div className="chart-action-row">
        <Link className="chart-action-button" href="/#lap-la-so">
          <Pencil size={18} />
          <span>Chỉnh sửa lá số</span>
        </Link>
        <a className="chart-action-button" href="#luan-giai">
          <Search size={18} />
          <span>Tra cứu</span>
        </a>
        <button className="chart-action-button" type="button" onClick={handleDownload} disabled={isDownloading}>
          <Download size={18} />
          <span>{isDownloading ? "Đang tạo ảnh..." : "Tải ảnh lá số"}</span>
        </button>
        <button className="chart-action-button" type="button" onClick={handleShare}>
          <Share2 size={18} />
          <span>Chia sẻ lá số</span>
        </button>
      </div>
      {downloadError ? (
        <p className="chart-download-error" role="status">
          {downloadError}
        </p>
      ) : null}

      <div className="palace-radar-card">
        <span className="palace-radar-pill">Biểu đồ 12 cung</span>
        <svg className="palace-radar" viewBox="0 0 340 340" role="img" aria-label="Biểu đồ điểm tham khảo 12 cung">
          {[20, 40, 60, 80, 100].map((level) => (
            <polygon
              key={level}
              points={polygonPoints(Array.from({ length: chart.palaces.length }, () => level))}
              fill="none"
              stroke="#e7dfd4"
              strokeWidth="1"
            />
          ))}
          {chart.palaces.map((palace, index) => {
            const outer = polarPoint(index, chart.palaces.length, 118);
            const label = polarPoint(index, chart.palaces.length, 145);
            const anchor = label.x > 182 ? "start" : label.x < 158 ? "end" : "middle";
            const isKey = palace.isMenh || palace.isThan;

            return (
              <g key={palace.name}>
                <line x1="170" y1="170" x2={outer.x} y2={outer.y} stroke="#e7dfd4" strokeWidth="1" />
                <circle cx={outer.x} cy={outer.y} r="2.8" fill="#cbd5e1" />
                <text
                  x={label.x}
                  y={label.y}
                  textAnchor={anchor}
                  dominantBaseline="middle"
                  className={isKey ? "palace-radar-label key" : "palace-radar-label"}
                >
                  {palace.name}
                  {palace.isThan ? " (Thân)" : ""}
                </text>
              </g>
            );
          })}
          <polygon points={polygonPoints(scores)} fill="url(#palaceRadarFill)" stroke="#f97316" strokeWidth="2.4" />
          {scores.map((score, index) => {
            const point = polarPoint(index, scores.length, 118, score);
            return <circle key={`${chart.palaces[index].name}-${score}`} cx={point.x} cy={point.y} r="4.5" fill="#fdba74" stroke="#fff" strokeWidth="1.5" />;
          })}
          <text x="170" y="169" textAnchor="middle" className="palace-radar-center">
            12 cung
          </text>
          <defs>
            <linearGradient id="palaceRadarFill" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#fb923c" stopOpacity="0.68" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.48" />
            </linearGradient>
          </defs>
        </svg>
        <p>Biểu đồ giúp nhìn nhanh cung nổi bật và cung cần đọc kỹ hơn trong phần luận giải.</p>
      </div>
    </section>
  );
}
