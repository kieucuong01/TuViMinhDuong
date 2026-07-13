"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AdminTrendGroups, AdminTrendPeriod, AdminTrendPoint } from "@/lib/data";

const trendPeriodOptions: Array<{ id: AdminTrendPeriod; label: string; noun: string }> = [
  { id: "day", label: "Ngày", noun: "ngày" },
  { id: "week", label: "Tuần", noun: "tuần" },
  { id: "month", label: "Tháng", noun: "tháng" },
];

const CHART_HEIGHT = 304;
const chartFrameStyle = { width: "100%", height: `${CHART_HEIGHT}px`, minWidth: 0, marginTop: "1rem" };

type TooltipPayload = Array<{
  color?: string;
  dataKey?: string;
  name?: string;
  value?: number;
}>;

function formatInteger(value = 0) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

function periodNoun(period: AdminTrendPeriod) {
  return trendPeriodOptions.find((option) => option.id === period)?.noun || "ngày";
}

function toChartRows(points: AdminTrendPoint[]) {
  return points.map((point) => ({
    label: point.label,
    "Tài khoản mới": point.newUsers,
    "Lá số": point.charts,
    "Tài khoản cộng dồn": point.cumulativeUsers,
    "Lá số cộng dồn": point.cumulativeCharts,
  }));
}

function updateTrendUrl(period: AdminTrendPeriod) {
  const url = new URL(window.location.href);
  url.searchParams.set("tab", "overview");
  url.searchParams.set("trend", period);
  window.history.replaceState(null, "", `${url.pathname}?${url.searchParams.toString()}`);
}

function AdminChartTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayload; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="admin-chart-tooltip">
      <strong>{label}</strong>
      {payload.map((item) => (
        <span key={`${item.dataKey || item.name}`}>
          <i style={{ background: item.color }} />
          {item.name}: {formatInteger(Number(item.value || 0))}
        </span>
      ))}
    </div>
  );
}

function useMeasuredWidth() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const updateWidth = () => {
      setWidth(Math.max(1, Math.round(node.getBoundingClientRect().width)));
    };
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, width };
}

function ChartFrame({ ariaLabel, children }: { ariaLabel: string; children: (width: number) => ReactNode }) {
  const { ref, width } = useMeasuredWidth();
  return (
    <div ref={ref} className="admin-recharts-frame" style={chartFrameStyle} aria-label={ariaLabel}>
      {width ? children(width) : null}
    </div>
  );
}

export function AdminTrendCharts({ initialPeriod, trendGroups }: { initialPeriod: AdminTrendPeriod; trendGroups: AdminTrendGroups }) {
  const [period, setPeriod] = useState<AdminTrendPeriod>(initialPeriod);
  const trends = useMemo(() => trendGroups[period] || trendGroups.day || [], [period, trendGroups]);
  const chartRows = useMemo(() => toChartRows(trends), [trends]);
  const currentNoun = periodNoun(period);

  function selectPeriod(nextPeriod: AdminTrendPeriod) {
    setPeriod(nextPeriod);
    updateTrendUrl(nextPeriod);
  }

  return (
    <>
      <div className="admin-trend-head">
        <div>
          <p className="eyebrow">Xu hướng</p>
          <h2>Tài khoản mới và lá số theo {currentNoun}</h2>
        </div>
        <div className="admin-trend-tabs" aria-label="Chọn kỳ báo cáo">
          {trendPeriodOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              className={option.id === period ? "active" : ""}
              aria-pressed={option.id === period}
              onClick={() => selectPeriod(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-trend-grid">
        <article className="panel admin-trend-panel">
          <div className="admin-panel-head">
            <div>
              <p className="eyebrow">Chart 1</p>
              <h3>Cộng dồn số liệu</h3>
            </div>
          </div>
          <ChartFrame ariaLabel="Biểu đồ cộng dồn tài khoản và lá số">
            {(width) => (
              <LineChart width={width} height={CHART_HEIGHT} data={chartRows} margin={{ top: 12, right: 18, left: 0, bottom: 4 }}>
                <CartesianGrid stroke="#e7e5e4" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: "#d6d3d1" }} tick={{ fill: "#78716c", fontSize: 12, fontWeight: 700 }} interval="preserveStartEnd" />
                <YAxis tickLine={false} axisLine={{ stroke: "#d6d3d1" }} tick={{ fill: "#78716c", fontSize: 12, fontWeight: 700 }} width={48} allowDecimals={false} />
                <Tooltip content={<AdminChartTooltip />} cursor={{ stroke: "#f97316", strokeWidth: 1 }} />
                <Legend iconType="circle" wrapperStyle={{ color: "#57534e", fontSize: "12px", fontWeight: 800 }} />
                <Line type="monotone" dataKey="Tài khoản cộng dồn" stroke="#2563eb" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Lá số cộng dồn" stroke="#ea580c" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />
              </LineChart>
            )}
          </ChartFrame>
        </article>

        <article className="panel admin-trend-panel">
          <div className="admin-panel-head">
            <div>
              <p className="eyebrow">Chart 2</p>
              <h3>Số liệu theo {currentNoun}</h3>
            </div>
          </div>
          <ChartFrame ariaLabel="Biểu đồ tài khoản mới và lá số theo kỳ">
            {(width) => (
              <BarChart width={width} height={CHART_HEIGHT} data={chartRows} margin={{ top: 12, right: 18, left: 0, bottom: 4 }}>
                <CartesianGrid stroke="#e7e5e4" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: "#d6d3d1" }} tick={{ fill: "#78716c", fontSize: 12, fontWeight: 700 }} interval="preserveStartEnd" />
                <YAxis tickLine={false} axisLine={{ stroke: "#d6d3d1" }} tick={{ fill: "#78716c", fontSize: 12, fontWeight: 700 }} width={48} allowDecimals={false} />
                <Tooltip content={<AdminChartTooltip />} cursor={{ fill: "rgba(251, 146, 60, 0.12)" }} />
                <Legend iconType="circle" wrapperStyle={{ color: "#57534e", fontSize: "12px", fontWeight: 800 }} />
                <Bar dataKey="Tài khoản mới" fill="#2563eb" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Lá số" fill="#ea580c" radius={[6, 6, 0, 0]} />
              </BarChart>
            )}
          </ChartFrame>
        </article>
      </div>

      <div className="panel admin-trend-table-panel compact">
        <div className="admin-panel-head">
          <div>
            <p className="eyebrow">Bảng</p>
            <h3>Dữ liệu chart</h3>
          </div>
          <span className="admin-overview-note">Đang xem theo {currentNoun}</span>
        </div>
        <div className="admin-table-wrap admin-compact-chart-data">
          <table className="admin-data-table admin-data-table-compact">
            <thead>
              <tr>
                <th>Ngày</th>
                <th>Tài khoản mới</th>
                <th>Lá số</th>
                <th>Tài khoản cộng dồn</th>
                <th>Lá số cộng dồn</th>
              </tr>
            </thead>
            <tbody>
              {trends.map((point) => (
                <tr key={`trend-row-${period}-${point.label}`}>
                  <td><strong>{point.label}</strong></td>
                  <td>{formatInteger(point.newUsers)}</td>
                  <td>{formatInteger(point.charts)}</td>
                  <td>{formatInteger(point.cumulativeUsers)}</td>
                  <td>{formatInteger(point.cumulativeCharts)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
