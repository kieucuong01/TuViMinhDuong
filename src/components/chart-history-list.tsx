"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { CalendarDays, Clock3, Copy, Mars, Search, Sparkles, Trash2, Venus } from "lucide-react";
import { deleteChartAction } from "@/app/actions";

export type ChartHistoryViewItem = {
  id: string;
  fullName: string;
  solarDate: string;
  lunarDate: string;
  hourLabel: string;
  genderLabel: string;
  gender: string;
  yearCanChi: string;
  hasAdvancedReading: boolean;
};

function GenderIcon({ gender }: { gender: string }) {
  return gender === "female" ? <Venus size={20} /> : <Mars size={20} />;
}

function normalized(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

function ChartListItem({ chart }: { chart: ChartHistoryViewItem }) {
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const chartPath = `/la-so/${chart.id}`;

  function copyLink() {
    const url = `${window.location.origin}${chartPath}`;
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    });
  }

  return (
    <article className="chart-history-item">
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-xl font-black text-stone-950">{chart.fullName}</h2>
        <div className="mt-3 grid gap-2 text-sm font-semibold text-stone-700 sm:grid-cols-2">
          <span className="inline-flex items-center gap-2">
            <CalendarDays size={19} /> {chart.solarDate} <span className="text-stone-400">(Âm lịch: {chart.lunarDate})</span>
          </span>
          <span className="inline-flex items-center gap-2">
            <Clock3 size={19} /> {chart.hourLabel}
          </span>
          <span className="inline-flex items-center gap-2">
            <GenderIcon gender={chart.gender} /> {chart.genderLabel}
          </span>
          <span className="inline-flex items-center gap-2">
            <Sparkles size={19} /> {chart.yearCanChi}
          </span>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href={chartPath} className={chart.hasAdvancedReading ? "btn btn-ghost btn-small" : "btn btn-primary btn-small"}>
            Luận giải miễn phí
          </Link>
          {chart.hasAdvancedReading ? (
            <Link href={`${chartPath}/nang-cao`} className="btn btn-primary btn-small">
              Xem lại luận giải nâng cao
            </Link>
          ) : null}
        </div>
      </div>
      <div className="flex items-start gap-2 text-stone-400">
        <button className="icon-button" type="button" aria-label="Sao chép liên kết lá số" title={copied ? "Đã sao chép" : "Sao chép liên kết"} onClick={copyLink}>
          <Copy size={17} />
        </button>
        <form
          action={(formData) => {
            startTransition(() => deleteChartAction(formData));
          }}
          data-loading-message="Đang xóa lá số..."
          data-loading-label="Đang xóa..."
        >
          <input type="hidden" name="chartId" value={chart.id} />
          <button className="icon-button" type="submit" aria-label="Xóa lá số" title="Xóa lá số" disabled={isPending}>
            <Trash2 size={17} />
          </button>
        </form>
      </div>
    </article>
  );
}

export function ChartHistoryList({ charts }: { charts: ChartHistoryViewItem[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const needle = normalized(query.trim());
    if (!needle) return charts;
    return charts.filter((chart) =>
      normalized(`${chart.fullName} ${chart.solarDate} ${chart.lunarDate} ${chart.hourLabel} ${chart.genderLabel} ${chart.yearCanChi}`).includes(needle),
    );
  }, [charts, query]);

  return (
    <>
      <label className="mt-6 block">
        <span className="sr-only">Tìm kiếm lá số</span>
        <span className="chart-history-search relative block">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={22} />
          <input className="pl-12" placeholder="Tìm theo tên, ngày sinh, giờ sinh..." value={query} onChange={(event) => setQuery(event.target.value)} />
        </span>
      </label>

      <div className="mt-8 grid gap-4">
        {filtered.map((chart) => (
          <ChartListItem key={chart.id} chart={chart} />
        ))}
      </div>

      {!filtered.length ? (
        <div className="mt-6 rounded-2xl border border-orange-100 bg-white/80 p-6 text-center text-sm font-semibold text-stone-600">
          Không tìm thấy lá số phù hợp.
        </div>
      ) : null}
    </>
  );
}
