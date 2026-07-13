"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarSearch, CheckCircle2, Clock3, Search, TriangleAlert } from "lucide-react";
import { useState, type FormEvent } from "react";
import {
  rankDateRange,
  toInputDate,
  type RankedDateResult,
  type SpecificDateTaskKey,
} from "@/lib/date-fortune";
import { trackOrganicToolEvent } from "@/lib/client-analytics";

const FINDER_TASKS: { key: SpecificDateTaskKey; label: string }[] = [
  { key: "wedding", label: "Cưới hỏi" },
  { key: "opening", label: "Khai trương" },
  { key: "contract", label: "Ký hợp đồng" },
  { key: "travel", label: "Xuất hành" },
  { key: "groundbreaking", label: "Động thổ" },
  { key: "houseMoving", label: "Nhập trạch" },
  { key: "vehiclePurchase", label: "Mua xe" },
  { key: "funeral", label: "An táng" },
];

function safeTask(value?: string | string[]): SpecificDateTaskKey {
  const normalized = Array.isArray(value) ? value[0] : value;
  return FINDER_TASKS.some((item) => item.key === normalized) ? normalized as SpecificDateTaskKey : "opening";
}

function safeDate(value: string | string[] | undefined, fallback: string) {
  const normalized = Array.isArray(value) ? value[0] : value;
  return normalized && /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : fallback;
}

function safeBirthYear(value?: string | string[]) {
  const normalized = Array.isArray(value) ? value[0] : value;
  const parsed = Number(normalized);
  return Number.isInteger(parsed) && parsed >= 1900 && parsed <= 2100 ? String(parsed) : "";
}

function defaultRange() {
  const from = new Date();
  const to = new Date(from);
  to.setDate(to.getDate() + 29);
  return { from: toInputDate(from), to: toInputDate(to) };
}

function initialResults(from: string, to: string, task: SpecificDateTaskKey, birthYear: string, enabled: boolean) {
  if (!enabled) return [];
  try {
    return rankDateRange({ from, to, task, birthYear: birthYear ? Number(birthYear) : undefined });
  } catch {
    return [];
  }
}

function rangeDays(from: string, to: string) {
  const start = new Date(`${from}T12:00:00+07:00`).getTime();
  const end = new Date(`${to}T12:00:00+07:00`).getTime();
  return Math.round((end - start) / 86400000) + 1;
}

function scoreBand(score: number) {
  if (score >= 75) return "high";
  if (score >= 50) return "medium";
  return "low";
}

export function DateRangeFinder({
  initialMode,
  initialTask,
  initialFrom,
  initialTo,
  initialBirthYear,
  onViewDate,
}: {
  initialMode?: string | string[];
  initialTask?: string | string[];
  initialFrom?: string | string[];
  initialTo?: string | string[];
  initialBirthYear?: string | string[];
  onViewDate: (dateKey: string, birthYear: string) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const defaults = defaultRange();
  const initialModeValue = Array.isArray(initialMode) ? initialMode[0] : initialMode;
  const [task, setTask] = useState<SpecificDateTaskKey>(() => safeTask(initialTask));
  const [from, setFrom] = useState(() => safeDate(initialFrom, defaults.from));
  const [to, setTo] = useState(() => safeDate(initialTo, defaults.to));
  const [birthYear, setBirthYear] = useState(() => safeBirthYear(initialBirthYear));
  const [results, setResults] = useState<RankedDateResult[]>(() => initialResults(
    safeDate(initialFrom, defaults.from),
    safeDate(initialTo, defaults.to),
    safeTask(initialTask),
    safeBirthYear(initialBirthYear),
    initialModeValue === "finder",
  ));
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const ranked = rankDateRange({ from, to, task, birthYear: birthYear ? Number(birthYear) : undefined });
      setResults(ranked);
      setError("");
      trackOrganicToolEvent("date_finder_submitted", {
        task,
        range_days: rangeDays(from, to),
        has_birth_year: Boolean(birthYear),
      });
      const params = new URLSearchParams(window.location.search);
      params.set("mode", "finder");
      params.set("task", task);
      params.set("from", from);
      params.set("to", to);
      if (birthYear) params.set("birthYear", birthYear);
      else params.delete("birthYear");
      params.delete("date");
      router.replace(`${pathname}?${params.toString()}#date-finder`, { scroll: false });
    } catch (caught) {
      setResults([]);
      setError(caught instanceof Error ? caught.message : "Không thể tìm ngày trong khoảng đã chọn.");
    }
  }

  return (
    <section id="date-finder" className="date-finder-panel" aria-labelledby="date-finder-title">
      <div className="date-finder-heading">
        <div>
          <p className="eyebrow">Tìm trong một khoảng</p>
          <h2 id="date-finder-title">Tìm ngày phù hợp nhất cho việc đang chuẩn bị</h2>
          <p>So sánh tối đa 60 ngày bằng cùng bộ tiêu chí, sau đó xem kỹ lý do thuận và điểm cần cân nhắc.</p>
        </div>
        <CalendarSearch size={32} aria-hidden="true" />
      </div>

      <form className="date-finder-form" onSubmit={handleSubmit} data-testid="date-finder-form">
        <label>
          <span>Việc cần xem</span>
          <select value={task} onChange={(event) => setTask(event.target.value as SpecificDateTaskKey)} data-testid="date-finder-task">
            {FINDER_TASKS.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
          </select>
        </label>
        <label>
          <span>Từ ngày</span>
          <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} data-testid="date-finder-from" required />
        </label>
        <label>
          <span>Đến ngày</span>
          <input type="date" value={to} onChange={(event) => setTo(event.target.value)} data-testid="date-finder-to" required />
        </label>
        <label>
          <span>Năm sinh chủ sự <small>không bắt buộc</small></span>
          <input type="number" min="1900" max="2100" inputMode="numeric" value={birthYear} onChange={(event) => setBirthYear(event.target.value)} placeholder="Ví dụ 1990" />
        </label>
        <button type="submit" className="btn btn-primary date-finder-submit">
          <Search size={18} aria-hidden="true" /> Tìm 5 ngày phù hợp
        </button>
        <p className="date-finder-limit">Tối đa 60 ngày · Kết quả dùng để tham khảo cùng điều kiện thực tế.</p>
      </form>

      {error ? <p className="date-finder-error" role="alert"><TriangleAlert size={18} /> {error}</p> : null}

      {results.length ? (
        <div className="date-finder-results" data-testid="date-finder-results">
          <div className="date-finder-results-head">
            <h3>Năm ngày nên ưu tiên xem kỹ</h3>
            <span>Xếp theo điểm {results[0].taskLabel.toLowerCase()}</span>
          </div>
          <div className="date-finder-result-grid">
            {results.map((item, index) => (
              <article key={item.dateKey} className="date-finder-result-card" data-tone={item.tone}>
                <div className="date-finder-rank">#{index + 1}</div>
                <div className="date-finder-result-date">
                  <span>{item.weekday}</span>
                  <strong>{item.date.getDate()}/{item.date.getMonth() + 1}/{item.date.getFullYear()}</strong>
                  <small>{item.lunar.day}/{item.lunar.month} âm · {item.canChiDay}</small>
                </div>
                <div className="date-finder-result-score"><strong>{item.taskScore}</strong><span>/100</span></div>
                <p>{item.verdict}</p>
                <div className="date-finder-signals">
                  {item.goodSignals.map((signal) => <span key={`good-${item.dateKey}-${signal}`}><CheckCircle2 size={16} /> {signal}</span>)}
                  {item.badSignals.map((signal) => <span key={`bad-${item.dateKey}-${signal}`} className="warning"><TriangleAlert size={16} /> {signal}</span>)}
                </div>
                <div className="date-finder-hours"><Clock3 size={16} /> Giờ tốt: {item.goodHours.slice(0, 3).map((hour) => `${hour.branch} ${hour.range}`).join(", ")}</div>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    trackOrganicToolEvent("date_finder_result_selected", {
                      task,
                      rank: index + 1,
                      score_band: scoreBand(item.taskScore),
                    });
                    onViewDate(item.dateKey, birthYear);
                  }}
                >
                  Xem chi tiết ngày
                </button>
              </article>
            ))}
          </div>
          <div className="date-finder-chart-cta">
            <div>
              <strong>Ngày tốt chung chưa phải toàn bộ bối cảnh cá nhân</strong>
              <p>Lập lá số miễn phí để đối chiếu thêm Mệnh, Thân và vận hiện tại trước việc quan trọng.</p>
            </div>
            <Link href="/?source=date_finder#lap-la-so" className="btn btn-primary">Đối chiếu thêm với lá số</Link>
          </div>
        </div>
      ) : null}
    </section>
  );
}
