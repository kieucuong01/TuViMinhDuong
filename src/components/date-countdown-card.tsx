"use client";

import Link from "next/link";
import { CalendarDays, Clock3 } from "lucide-react";
import { useMemo } from "react";
import { solarToLunar } from "@/lib/lunar";

export type DateCountdownKind = "tet" | "halloween" | "christmas" | "midAutumn";

type CountdownConfig = {
  title: string;
  label: string;
  intro: string;
  type: "solar" | "lunar";
  month: number;
  day: number;
};

const countdowns: Record<DateCountdownKind, CountdownConfig> = {
  tet: {
    title: "Bao nhiêu ngày nữa đến Tết?",
    label: "Tết Nguyên đán",
    intro: "Đếm số ngày còn lại đến mùng 1 Tết âm lịch gần nhất theo lịch Việt Nam.",
    type: "lunar",
    month: 1,
    day: 1,
  },
  halloween: {
    title: "Bao nhiêu ngày nữa đến Halloween?",
    label: "Halloween",
    intro: "Đếm số ngày còn lại đến Halloween, ngày 31/10 dương lịch hằng năm.",
    type: "solar",
    month: 10,
    day: 31,
  },
  christmas: {
    title: "Bao nhiêu ngày nữa đến Giáng sinh?",
    label: "Giáng sinh",
    intro: "Đếm số ngày còn lại đến Giáng sinh, ngày 25/12 dương lịch hằng năm.",
    type: "solar",
    month: 12,
    day: 25,
  },
  midAutumn: {
    title: "Bao nhiêu ngày nữa đến Trung thu?",
    label: "Tết Trung thu",
    intro: "Đếm số ngày còn lại đến rằm tháng 8 âm lịch theo lịch Việt Nam.",
    type: "lunar",
    month: 8,
    day: 15,
  },
};

function vietnamToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  return new Date(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T12:00:00+07:00`);
}

function dayKey(date: Date) {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function nextSolarDate(today: Date, month: number, day: number) {
  const candidate = new Date(`${today.getFullYear()}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T12:00:00+07:00`);
  if (dayKey(candidate) < dayKey(today)) {
    return new Date(`${today.getFullYear() + 1}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T12:00:00+07:00`);
  }
  return candidate;
}

function nextLunarDate(today: Date, lunarMonth: number, lunarDay: number) {
  for (let offset = 0; offset <= 430; offset += 1) {
    const candidate = new Date(today);
    candidate.setDate(today.getDate() + offset);
    const lunar = solarToLunar(candidate.getDate(), candidate.getMonth() + 1, candidate.getFullYear(), 7);
    if (!lunar.leap && lunar.month === lunarMonth && lunar.day === lunarDay) return candidate;
  }
  return today;
}

export function DateCountdownCard({ kind }: { kind: DateCountdownKind }) {
  const config = countdowns[kind];
  const countdown = useMemo(() => {
    const today = vietnamToday();
    const target = config.type === "solar"
      ? nextSolarDate(today, config.month, config.day)
      : nextLunarDate(today, config.month, config.day);
    const days = Math.round((dayKey(target) - dayKey(today)) / 86_400_000);
    return { today, target, days };
  }, [config]);

  return (
    <main className="date-page-surface min-h-screen bg-[#fbfaf7]">
      <div className="date-page-aura" aria-hidden="true" />
      <section className="date-countdown-page mx-auto grid max-w-4xl gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <div className="date-countdown-hero panel">
          <p className="eyebrow">Xem thêm</p>
          <h1>{config.title}</h1>
          <p>{config.intro}</p>
        </div>
        <section className="date-countdown-card panel" aria-label={`Còn ${countdown.days} ngày nữa đến ${config.label}`}>
          <div className="date-countdown-icon" aria-hidden="true"><Clock3 size={34} /></div>
          <div>
            <span>Còn</span>
            <strong>{countdown.days}</strong>
            <em>ngày nữa đến {config.label}</em>
          </div>
        </section>
        <div className="date-countdown-detail">
          <article>
            <CalendarDays size={20} aria-hidden="true" />
            <div>
              <strong>Hôm nay</strong>
              <span>{formatDate(countdown.today)}</span>
            </div>
          </article>
          <article>
            <CalendarDays size={20} aria-hidden="true" />
            <div>
              <strong>{config.label}</strong>
              <span>{formatDate(countdown.target)}</span>
            </div>
          </article>
        </div>
        <div className="date-countdown-actions">
          <Link href="/xem-ngay" className="btn btn-ghost">Xem ngày tốt xấu</Link>
          <Link href="/xem-ngay?mode=finder#date-finder" className="btn btn-primary">Tìm ngày phù hợp</Link>
        </div>
      </section>
    </main>
  );
}
