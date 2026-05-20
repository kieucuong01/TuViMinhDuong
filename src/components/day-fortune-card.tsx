"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronRight, Sparkles } from "lucide-react";

const stems = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
const branches = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
const weekdays = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
const solarTerms = ["Tiểu Hàn", "Lập Xuân", "Kinh Trập", "Thanh Minh", "Lập Hạ", "Mang Chủng", "Tiểu Thử", "Lập Thu", "Bạch Lộ", "Hàn Lộ", "Lập Đông", "Đại Tuyết"];

function toInputDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getCanChi(seed: number) {
  return `${stems[((seed % 10) + 10) % 10]} ${branches[((seed % 12) + 12) % 12]}`;
}

function calculateFortune(date: Date) {
  const daySeed = Math.floor(date.getTime() / 86400000);
  const score = clamp(18 + ((daySeed * 37 + date.getMonth() * 11 + date.getDate() * 7) % 73), 12, 92);
  const monthSeed = date.getFullYear() * 12 + date.getMonth();
  const status = score >= 68 ? "Ngày tốt" : score >= 42 ? "Trung bình" : "Ngày xấu";
  const statusClass =
    score >= 68
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : score >= 42
        ? "bg-amber-50 text-amber-700 ring-amber-200"
        : "bg-rose-50 text-rose-700 ring-rose-200";

  return {
    weekday: weekdays[date.getDay()],
    day: date.getDate(),
    month: date.getMonth() + 1,
    year: date.getFullYear(),
    dayCanChi: getCanChi(daySeed + 40),
    monthCanChi: getCanChi(monthSeed + 16),
    term: solarTerms[date.getMonth()],
    score,
    status,
    statusClass,
    note:
      score >= 68
        ? "Hợp khởi sự nhẹ, gặp gỡ và lên kế hoạch."
        : score >= 42
          ? "Nên làm việc quen thuộc, tránh quyết định vội."
          : "Ưu tiên giữ nhịp ổn định, hạn chế việc lớn.",
  };
}

export function DayFortuneCard() {
  const [selectedDate, setSelectedDate] = useState(() => toInputDate(new Date()));
  const date = useMemo(() => new Date(`${selectedDate}T12:00:00+07:00`), [selectedDate]);
  const fortune = useMemo(() => calculateFortune(date), [date]);

  return (
    <section className="day-fortune-card relative overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/70 p-5 shadow-2xl shadow-orange-950/10 ring-1 ring-orange-100/70 backdrop-blur-xl sm:p-6">
      <div className="pointer-events-none absolute -left-16 top-10 h-40 w-72 rotate-[-10deg] rounded-full bg-white/70 blur-xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-20 h-52 w-52 rounded-full border-[22px] border-orange-200/30" />

      <div className="relative grid gap-6 sm:grid-cols-[1fr_13rem] sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-orange-900">
            <CalendarDays size={18} />
            <span>{fortune.weekday}</span>
          </div>
          <div className="mt-4 flex items-end gap-3">
            <strong className="text-7xl font-black leading-none text-orange-900">{fortune.day}</strong>
            <span className="pb-2 text-xl font-black text-orange-900">Tháng {fortune.month} năm {fortune.year}</span>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-rose-600">Ngày sinh Chủ tịch Hồ Chí Minh</span>
            <span className={`rounded-full px-3 py-1 text-sm font-bold ring-1 ${fortune.statusClass}`}>
              {fortune.status}
            </span>
          </div>
        </div>

        <div className="grid place-items-center">
          <div
            data-testid="fortune-gauge"
            className="fortune-gauge grid h-40 w-40 place-items-center rounded-full p-3"
            style={{ background: `conic-gradient(#34d399 ${fortune.score * 3.6}deg, #bbf7d0 ${fortune.score * 3.6}deg)` }}
            aria-label={`Cát hung ${fortune.score} phần trăm`}
          >
            <div className="grid h-full w-full place-items-center rounded-full bg-[#fff7ed]/95 text-center shadow-inner">
              <div>
                <strong className="text-4xl font-black text-emerald-600">{fortune.score}<span className="text-xl">%</span></strong>
                <p className="mt-1 text-sm font-semibold text-emerald-800">Cát - Hung</p>
              </div>
            </div>
          </div>
          <p className="mt-3 text-center text-lg font-black text-orange-900">
            {fortune.day} Tháng {fortune.month}, {fortune.dayCanChi}
          </p>
        </div>
      </div>

      <div className="relative mt-6 grid gap-3 border-t border-white/80 pt-5 sm:grid-cols-3">
        <div className="rounded-2xl bg-white/60 p-3 text-center ring-1 ring-orange-100">
          <p className="text-xs font-medium text-stone-500">Ngày</p>
          <strong className="mt-1 block text-lg text-orange-900">{fortune.dayCanChi}</strong>
        </div>
        <div className="rounded-2xl bg-white/60 p-3 text-center ring-1 ring-orange-100">
          <p className="text-xs font-medium text-stone-500">Tháng</p>
          <strong className="mt-1 block text-lg text-orange-900">{fortune.monthCanChi}</strong>
        </div>
        <div className="rounded-2xl bg-white/60 p-3 text-center ring-1 ring-orange-100">
          <p className="text-xs font-medium text-stone-500">Tiết khí</p>
          <strong className="mt-1 block text-lg text-orange-900">{fortune.term}</strong>
        </div>
      </div>

      <form className="relative mt-5 flex flex-col gap-3 sm:flex-row">
        <label className="flex-1">
          <span>Chọn ngày</span>
          <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
        </label>
        <button type="button" className="btn btn-ghost self-end">
          Xem chi tiết <ChevronRight size={17} />
        </button>
      </form>

      <p className="relative mt-3 flex items-start gap-2 text-sm leading-6 text-stone-600">
        <Sparkles className="mt-0.5 shrink-0 text-orange-500" size={16} />
        {fortune.note}
      </p>
    </section>
  );
}
