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
import { analyzeDate, formatDate, monthDays, parseInputDate, toInputDate, type DateTaskKey, type FortuneTone } from "@/lib/date-fortune";

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

const sourceLinks = [
  { label: "Âm lịch Việt Nam - Hồ Ngọc Đức", href: "https://xemamlich.uhm.vn/calrules.html" },
  { label: "VNCal đối chiếu lịch pháp", href: "https://xemamlich.uhm.vn/vncal.html" },
  { label: "Bảng 12 trực, nhị thập bát tú", href: "https://amlich.truyenxuatichcu.com/blog-tu-vi-so-menh/ngay-tiet-ngay-truc-ngay-nhi-thap-bat-tu-va-cach-tinh.html" },
];

function shiftDate(input: string, amount: number) {
  const date = parseInputDate(input);
  date.setDate(date.getDate() + amount);
  return toInputDate(date);
}

function parseBirthYear(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1900 && parsed <= 2100 ? parsed : undefined;
}

function TaskIcon({ type }: { type: DateTaskKey }) {
  const Icon = taskIcons[type];
  return <Icon size={19} className="date-task-icon" />;
}

export function DateView() {
  const [selectedDate, setSelectedDate] = useState(() => toInputDate(new Date()));
  const [birthYear, setBirthYear] = useState("");
  const parsedBirthYear = parseBirthYear(birthYear);
  const date = useMemo(() => parseInputDate(selectedDate), [selectedDate]);
  const fortune = useMemo(() => analyzeDate(date, parsedBirthYear), [date, parsedBirthYear]);
  const days = useMemo(() => monthDays(fortune.solar.year, fortune.solar.month), [fortune.solar.month, fortune.solar.year]);
  const firstWeekday = useMemo(() => new Date(`${fortune.solar.year}-${String(fortune.solar.month).padStart(2, "0")}-01T12:00:00+07:00`).getDay(), [fortune.solar.month, fortune.solar.year]);
  const starHits = [...fortune.goodStars, ...fortune.badStars];

  return (
    <div className="date-view-shell" data-testid="date-view">
      <section className="date-hero-panel">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="eyebrow">Xem ngày chuẩn</p>
            <h1 className="text-balance text-4xl font-black text-stone-950 md:text-5xl">Lịch ngày tốt xấu có cơ sở tính rõ ràng</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-stone-600">
              Kết hợp âm lịch Việt Nam, Can Chi, 12 trực, hoàng đạo/hắc đạo, nhị thập bát tú, sao Ngọc Hạp và xung hợp tuổi để đánh giá từng việc cụ thể.
            </p>
          </div>
          <div className="date-picker-card">
            <label>
              <span>Chọn ngày</span>
              <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} data-testid="date-input" />
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
                data-testid="birth-year-input"
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
          </div>
        </div>
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
            <p className="mt-4 text-center text-xl font-black text-orange-900">{formatDate(fortune.date)}, {fortune.canChi.day}</p>
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

      <section className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="panel">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Lịch tháng</p>
              <h2 className="text-2xl font-black text-stone-950">Tháng {fortune.solar.month}/{fortune.solar.year}</h2>
            </div>
            <CalendarDays className="text-orange-600" size={26} />
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
        </div>

        <div className="grid gap-6">
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

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
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

        <div className="panel">
          <p className="eyebrow">Cơ sở tính</p>
          <h2 className="text-2xl font-black text-stone-950">Engine dùng bảng quy tắc có nguồn</h2>
          <div className="date-source-list mt-4">
            {Object.entries(fortune.sources).map(([key, value]) => (
              <div key={key} className="date-source-card">
                <strong>{key}</strong>
                <p>{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {sourceLinks.map((source) => (
              <a key={source.href} href={source.href} target="_blank" rel="noreferrer" className="date-source-link">
                {source.label}
              </a>
            ))}
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
