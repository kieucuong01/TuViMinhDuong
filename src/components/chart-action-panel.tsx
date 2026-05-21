"use client";

import Link from "next/link";
import { Download, Pencil, Search, Share2 } from "lucide-react";
import type { Palace, TuViChart } from "@/lib/chart";

type ChartActionPanelProps = {
  chartId: string;
  chart: TuViChart;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
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
    x: 170 + Math.cos(angle) * scaled,
    y: 170 + Math.sin(angle) * scaled,
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

export function ChartActionPanel({ chartId, chart }: ChartActionPanelProps) {
  const scores = chart.palaces.map(palaceScore);

  const handleDownload = () => {
    window.print();
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
    <section className="chart-action-panel" aria-label="Thao tác với lá số">
      <div className="chart-action-row">
        <Link className="chart-action-button" href="/#lap-la-so">
          <Pencil size={18} />
          <span>Chỉnh sửa lá số</span>
        </Link>
        <a className="chart-action-button" href="#luan-giai">
          <Search size={18} />
          <span>Tra cứu</span>
        </a>
        <button className="chart-action-button" type="button" onClick={handleDownload}>
          <Download size={18} />
          <span>Tải xuống lá số</span>
        </button>
        <button className="chart-action-button" type="button" onClick={handleShare}>
          <Share2 size={18} />
          <span>Chia sẻ lá số</span>
        </button>
      </div>

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
