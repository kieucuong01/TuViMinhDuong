"use client";

import Link from "next/link";
import type { ComponentType } from "react";
import { useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Compass,
  FileSignature,
  HeartHandshake,
  Map,
  ShieldCheck,
  Sparkles,
  Store,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import { analyzeDate, monthDays, parseInputDate, toInputDate, type DateTaskKey, type FortuneTone } from "@/lib/date-fortune";

const toneClass: Record<FortuneTone, string> = {
  good: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  neutral: "bg-amber-50 text-amber-700 ring-amber-200",
  bad: "bg-rose-50 text-rose-700 ring-rose-200",
};

const taskIcons: Record<DateTaskKey, ComponentType<{ size?: number; className?: string }>> = {
  general: Sparkles,
  wedding: HeartHandshake,
  opening: Store,
  contract: FileSignature,
  travel: Map,
  groundbreaking: ShieldCheck,
};

function shiftDate(input: string, amount: number) {
  const date = parseInputDate(input);
  date.setDate(date.getDate() + amount);
  return toInputDate(date);
}

function parseBirthYear(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1900 && parsed <= 2100 ? parsed : undefined;
}

function safeBirthYear(value: string | string[] | null | undefined) {
  if (Array.isArray(value)) return safeBirthYear(value[0]);
  return parseBirthYear(value || "") ? value || "" : "";
}

function safeInputDate(value: string | string[] | null | undefined) {
  if (Array.isArray(value)) return safeInputDate(value[0]);
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return toInputDate(new Date());
  const parsed = parseInputDate(value);
  return Number.isNaN(parsed.getTime()) ? toInputDate(new Date()) : value;
}

function formatLunarDate(lunar: { day: number; month: number; year: number; leap: boolean }) {
  return `${lunar.day} Tháng ${lunar.month}${lunar.leap ? " nhuận" : ""} âm`;
}

function TaskIcon({ type }: { type: DateTaskKey }) {
  const Icon = taskIcons[type];
  return <Icon size={19} className="date-task-icon" />;
}

export function DateView({ initialDate, initialBirthYear }: { initialDate?: string | string[]; initialBirthYear?: string | string[] }) {
  const [selectedDate, setSelectedDate] = useState(() => safeInputDate(initialDate));
  const [birthYear, setBirthYear] = useState(() => safeBirthYear(initialBirthYear));
  const [selectedTask, setSelectedTask] = useState<DateTaskKey>("general");
  const parsedBirthYear = parseBirthYear(birthYear);
  const date = useMemo(() => parseInputDate(selectedDate), [selectedDate]);
  const fortune = useMemo(() => analyzeDate(date, parsedBirthYear), [date, parsedBirthYear]);
  const days = useMemo(() => monthDays(fortune.solar.year, fortune.solar.month), [fortune.solar.month, fortune.solar.year]);
  const firstWeekday = useMemo(() => new Date(`${fortune.solar.year}-${String(fortune.solar.month).padStart(2, "0")}-01T12:00:00+07:00`).getDay(), [fortune.solar.month, fortune.solar.year]);
  const starHits = [...fortune.goodStars, ...fortune.badStars];
  const selectedTaskScore = useMemo(() => fortune.taskScores.find((task) => task.key === selectedTask) ?? fortune.taskScores[0], [fortune.taskScores, selectedTask]);

  return (
    <div className="date-view-shell" data-testid="date-view">
      <section className="date-quick-start">
        <div className="date-quick-copy">
          <p className="eyebrow">Xem ngày tốt xấu</p>
          <h1>Xem ngày tốt xấu theo tuổi</h1>
          <p>Chọn ngày, nhập năm sinh và chọn việc đang chuẩn bị. Kết quả hiện ngay để bạn biết nên làm, nên tránh và nên đọc phần nào tiếp theo.</p>
          <div className="date-quick-status">
            <strong>{fortune.weekday}, {fortune.solar.day}/{fortune.solar.month}/{fortune.solar.year}</strong>
            <span className={`rounded-full px-3 py-1 text-sm font-black ring-1 ${toneClass[fortune.status.tone]}`}>{fortune.status.label}</span>
          </div>
          <div className="date-quick-advice" aria-label="Tóm tắt việc nên làm và nên tránh">
            <article>
              <CheckCircle2 size={18} />
              <span>Nên ưu tiên</span>
              <strong>{fortune.goodThings[0] || "Việc quen thuộc"}</strong>
            </article>
            <article>
              <XCircle size={18} />
              <span>Nên cân nhắc</span>
              <strong>{fortune.avoidThings[0] || "Quyết định nóng"}</strong>
            </article>
            <article>
              <Clock3 size={18} />
              <span>Giờ tốt gần nhất</span>
              <strong>{fortune.goodHours[0]?.branch} {fortune.goodHours[0]?.range}</strong>
            </article>
          </div>
        </div>

        <div className="date-quick-score" aria-label={`Cát hung ${fortune.score} phần trăm`}>
          <div
            className="fortune-gauge"
            style={{ background: `conic-gradient(#34d399 ${fortune.score * 3.6}deg, #fde68a ${fortune.score * 3.6}deg)` }}
          >
            <div>
              <strong>{fortune.score}<span>%</span></strong>
              <small>Cát - Hung</small>
            </div>
          </div>
          <p>{formatLunarDate(fortune.lunar)}<span>{fortune.canChi.day}</span></p>
        </div>

        <aside className="date-quick-controls">
          <div className="date-control-grid">
            <label>
              <span>Chọn ngày</span>
              <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} data-testid="date-input" />
            </label>
            <label>
              <span>Năm sinh để xét tuổi</span>
              <input
                type="number"
                inputMode="numeric"
                min="1900"
                max="2100"
                placeholder="Ví dụ 1994"
                value={birthYear}
                onChange={(event) => setBirthYear(event.target.value)}
                data-testid="birth-year-input"
              />
            </label>
          </div>
          <div className="date-jump-row">
            <button type="button" className="btn btn-ghost btn-small" onClick={() => setSelectedDate(shiftDate(selectedDate, -1))} data-testid="date-prev-button">
              <ChevronLeft size={16} /> Trước
            </button>
            <button type="button" className="btn btn-ghost btn-small" onClick={() => setSelectedDate(toInputDate(new Date()))} data-testid="date-today-button">
              Hôm nay
            </button>
            <button type="button" className="btn btn-ghost btn-small" onClick={() => setSelectedDate(shiftDate(selectedDate, 1))} data-testid="date-next-button">
              Sau <ChevronRight size={16} />
            </button>
          </div>

          <div className="date-task-picker" aria-label="Chọn việc cần xem">
            <span>Việc đang xem</span>
            <div>
              {fortune.taskScores.map((task) => (
                <button
                  key={task.key}
                  type="button"
                  className="date-task-choice"
                  data-active={task.key === selectedTask}
                  data-task-key={task.key}
                  data-tone={task.tone}
                  onClick={() => setSelectedTask(task.key)}
                >
                  <TaskIcon type={task.key} />
                  {task.label}
                </button>
              ))}
            </div>
          </div>

          <div className="date-selected-task" data-tone={selectedTaskScore.tone}>
            <span>{selectedTaskScore.label}</span>
            <strong>{selectedTaskScore.score}%</strong>
            <p>{selectedTaskScore.verdict}</p>
          </div>
        </aside>
      </section>

      <section className="date-month-overview">
        <div className="date-month-calendar-card">
          <div className="date-month-calendar-head">
            <div>
              <p className="eyebrow">Tổng quan tháng</p>
              <h2>Tháng {fortune.solar.month}/{fortune.solar.year}</h2>
              <p>Nhìn nhanh ngày tốt, ngày cần cân nhắc rồi chọn ngày để xem chi tiết.</p>
            </div>
            <CalendarDays className="text-orange-600" size={28} />
          </div>
          <div className="date-calendar mt-5">
            {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((item) => (
              <span key={item} className="date-calendar-head">{item}</span>
            ))}
            {Array.from({ length: firstWeekday }, (_, index) => (
              <span key={`empty-${index}`} />
            ))}
            {days.map((day) => (
              <button
                key={day.solar.day}
                type="button"
                className={day.solar.day === fortune.solar.day ? "date-calendar-day active" : "date-calendar-day"}
                data-tone={day.status.tone}
                onClick={() => setSelectedDate(toInputDate(day.date))}
                title={`${day.solar.day}/${day.solar.month}: ${day.status.label}`}
              >
                <strong>{day.solar.day}</strong>
                <span>{day.score}</span>
              </button>
            ))}
          </div>
          <div className="date-calendar-legend" aria-label="Chú thích màu lịch">
            <span><i data-tone="good" /> Ngày tốt</span>
            <span><i data-tone="neutral" /> Trung bình</span>
            <span><i data-tone="bad" /> Nên cân nhắc</span>
          </div>
        </div>

        <aside className="date-picker-card">
          <p className="eyebrow">Ngày đang xem</p>
          <strong className="date-picker-current">{fortune.weekday}, {fortune.solar.day}/{fortune.solar.month}/{fortune.solar.year}</strong>
          <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-sm font-black ring-1 ${toneClass[fortune.status.tone]}`}>{fortune.status.label}</span>
          <label className="mt-5 block">
            <span>Chọn ngày</span>
            <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
          </label>
          <label className="mt-3 block">
            <span>Năm sinh để xét tuổi</span>
            <input
              type="number"
              inputMode="numeric"
              min="1900"
              max="2100"
              placeholder="Ví dụ 1994"
              value={birthYear}
              onChange={(event) => setBirthYear(event.target.value)}
            />
          </label>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <button type="button" className="btn btn-ghost btn-small" onClick={() => setSelectedDate(shiftDate(selectedDate, -1))}>
              <ChevronLeft size={16} /> Trước
            </button>
            <button type="button" className="btn btn-ghost btn-small" onClick={() => setSelectedDate(toInputDate(new Date()))}>
              Hôm nay
            </button>
            <button type="button" className="btn btn-ghost btn-small" onClick={() => setSelectedDate(shiftDate(selectedDate, 1))}>
              Sau <ChevronRight size={16} />
            </button>
          </div>
        </aside>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="date-score-panel">
          <div>
            <p className="text-lg font-black text-orange-900">{fortune.weekday}</p>
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <strong className="text-8xl font-black leading-none text-orange-900">{fortune.solar.day}</strong>
              <div className="pb-3">
                <p className="text-2xl font-black text-orange-900">Tháng {fortune.solar.month} năm {fortune.solar.year}</p>
                <p className="mt-1 text-base font-semibold text-stone-500">Âm lịch {fortune.lunar.day}/{fortune.lunar.month}/{fortune.lunar.year}</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className={`rounded-full px-3 py-1 text-sm font-black ring-1 ${toneClass[fortune.status.tone]}`}>{fortune.status.label}</span>
              <span className={`rounded-full px-3 py-1 text-sm font-black ring-1 ${toneClass[fortune.directInfo.tone]}`}>Trực {fortune.direct}</span>
              <span className={`rounded-full px-3 py-1 text-sm font-black ring-1 ${toneClass[fortune.zodiac.tone]}`}>{fortune.zodiac.name}</span>
              <span className={`rounded-full px-3 py-1 text-sm font-black ring-1 ${toneClass[fortune.mansion.tone]}`}>Sao {fortune.mansion.name}</span>
            </div>
          </div>

          <div className="grid place-items-center">
            <div
              className="fortune-gauge grid h-44 w-44 place-items-center rounded-full p-3"
              style={{ background: `conic-gradient(#34d399 ${fortune.score * 3.6}deg, #fde68a ${fortune.score * 3.6}deg)` }}
              aria-label={`Cát hung ${fortune.score} phần trăm`}
            >
              <div className="grid h-full w-full place-items-center rounded-full bg-[#fff7ed]/95 text-center shadow-inner">
                <div>
                  <strong className="text-5xl font-black text-emerald-600">
                    {fortune.score}<span className="text-2xl">%</span>
                  </strong>
                  <p className="mt-1 text-sm font-semibold text-emerald-800">Cát - Hung</p>
                </div>
              </div>
            </div>
            <p className="mt-4 text-center text-xl font-black text-orange-900">
              {formatLunarDate(fortune.lunar)}
              <span className="block text-sm text-orange-800/80">{fortune.canChi.day}</span>
            </p>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="date-info-card">
            <CalendarDays className="text-orange-600" size={24} />
            <div>
              <p className="text-sm font-semibold text-stone-500">Can chi</p>
              <p className="mt-1 font-black text-stone-950">Ngày {fortune.canChi.day} · Tháng {fortune.canChi.month} · Năm {fortune.canChi.year}</p>
            </div>
          </div>
          <div className="date-info-card">
            <Compass className="text-orange-600" size={24} />
            <div>
              <p className="text-sm font-semibold text-stone-500">Tiết khí và xung</p>
              <p className="mt-1 font-black text-stone-950">{fortune.solarTerm} · Xung tuổi {fortune.clash}</p>
            </div>
          </div>
          <div className="date-info-card">
            <Sparkles className="text-orange-600" size={24} />
            <div>
              <p className="text-sm font-semibold text-stone-500">Nhận định nhanh</p>
              <p className="mt-1 leading-7 text-stone-700">{fortune.status.summary}</p>
            </div>
          </div>
          <div className="date-info-card">
            <ShieldCheck className="text-orange-600" size={24} />
            <div>
              <p className="text-sm font-semibold text-stone-500">Xét theo tuổi</p>
              {fortune.ageRelation ? (
                <p className="mt-1 leading-7 text-stone-700">
                  Tuổi {fortune.ageRelation.canChi}: {fortune.ageRelation.notes.join("; ")}.
                </p>
              ) : (
                <p className="mt-1 leading-7 text-stone-700">Nhập năm sinh để xét tam hợp, lục hợp, lục xung, hại, phá và thiên can.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="panel mt-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Theo việc cần làm</p>
            <h2 className="text-2xl font-black text-stone-950">Điểm riêng cho cưới hỏi, khai trương, ký kết, xuất hành</h2>
          </div>
          <span className="rounded-full bg-orange-50 px-3 py-1 text-sm font-black text-orange-700 ring-1 ring-orange-100">Có giải thích từng điểm</span>
        </div>
        <div className="date-task-grid mt-5">
          {fortune.taskScores.map((task) => (
            <article key={task.key} className="date-task-card" data-tone={task.tone}>
              <div className="flex items-start justify-between gap-3">
                <span className="date-task-icon-wrap">
                  <TaskIcon type={task.key} />
                </span>
                <strong>{task.score}%</strong>
              </div>
              <h3>{task.label}</h3>
              <p>{task.verdict}</p>
              <div className="date-task-signals">
                {task.goodSignals.slice(0, 2).map((signal) => (
                  <span key={`good-${task.key}-${signal}`} className="good">+ {signal}</span>
                ))}
                {task.badSignals.slice(0, 2).map((signal) => (
                  <span key={`bad-${task.key}-${signal}`} className="bad">- {signal}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <section className="panel">
            <div className="flex items-center gap-2">
              <Clock3 className="text-orange-600" size={24} />
              <h2 className="text-2xl font-black text-stone-950">Giờ hoàng đạo</h2>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {fortune.goodHours.map((hour) => (
                <div key={hour.branch} className="date-hour-card">
                  <strong>{hour.branch}</strong>
                  <span>{hour.range}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-6 md:grid-cols-2">
            <div className="panel">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-emerald-600" size={23} />
                <h2 className="text-xl font-black text-stone-950">Nên ưu tiên</h2>
              </div>
              <ul className="mt-4 grid gap-2">
                {fortune.goodThings.map((item) => (
                  <li key={item} className="date-list-item good">{item}</li>
                ))}
              </ul>
            </div>
            <div className="panel">
              <div className="flex items-center gap-2">
                <XCircle className="text-rose-600" size={23} />
                <h2 className="text-xl font-black text-stone-950">Nên cân nhắc</h2>
              </div>
              <ul className="mt-4 grid gap-2">
                {fortune.avoidThings.map((item) => (
                  <li key={item} className="date-list-item bad">{item}</li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </section>

      <section className="mt-6">
        <div className="panel">
          <p className="eyebrow">Sao tốt/xấu</p>
          <h2 className="text-2xl font-black text-stone-950">Ngọc Hạp và nhị thập bát tú</h2>
          <div className="date-rule-card mt-4">
            <strong>Sao {fortune.mansion.fullName}</strong>
            <p>{fortune.mansion.tone === "good" ? "Cát tú" : fortune.mansion.tone === "bad" ? "Hung tú" : "Bình tú"} · Hành {fortune.mansion.element}. Hợp: {fortune.mansion.goodFor.join(", ")}. Kỵ: {fortune.mansion.avoidFor.join(", ")}.</p>
          </div>
          <div className="date-star-list mt-4">
            {starHits.length ? starHits.map((star) => (
              <div key={star.name} className="date-star-chip" data-tone={star.tone}>
                <strong>{star.name}</strong>
                <span>{star.summary}</span>
              </div>
            )) : (
              <div className="date-star-chip" data-tone="neutral">
                <strong>Không có sao mạnh</strong>
                <span>Ngày này không rơi vào nhóm sao tốt/xấu phổ biến trong bảng hiện tại.</span>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-orange-100 bg-stone-950 p-6 text-white shadow-2xl shadow-stone-950/10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="eyebrow text-orange-300">Cá nhân hóa sâu hơn</p>
            <h2 className="text-2xl font-black">Muốn ghép ngày này với lá số riêng?</h2>
            <p className="mt-2 max-w-2xl text-stone-300">Lập lá số để đối chiếu Mệnh, Thân, đại vận và nhật vận cá nhân trước khi quyết định việc quan trọng.</p>
          </div>
          <Link href="/#lap-la-so" className="btn btn-primary">
            <TriangleAlert size={18} /> Lập lá số để đối chiếu
          </Link>
        </div>
      </section>
    </div>
  );
}
