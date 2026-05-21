import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, Clock3, Mars, Plus, Sparkles, Star, Venus } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { listUserCharts, type ChartHistoryItem } from "@/lib/data";
import { ChartHistoryList, type ChartHistoryViewItem } from "@/components/chart-history-list";

export const metadata = {
  title: "Lịch sử lá số",
  robots: { index: false, follow: false },
};

const branches = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

function solarDate(chart: ChartHistoryItem) {
  const solar = chart.chart.solar || { day: chart.input.day, month: chart.input.month, year: chart.input.year };
  return `${pad(solar.day)}/${pad(solar.month)}/${solar.year}`;
}

function lunarDate(chart: ChartHistoryItem) {
  const lunar = chart.chart.lunar;
  return `${pad(lunar.day)}/${pad(lunar.month)}/${lunar.year}${lunar.leap ? " nhuận" : ""}`;
}

function hourLabel(hour: number) {
  const index = Math.floor(((hour + 1) % 24) / 2);
  const start = index === 0 ? 23 : index * 2 - 1;
  const end = index === 0 ? "00h59" : `${pad(index * 2)}h59`;
  return `${branches[index]} (${pad(start)}h - ${end})`;
}

function genderLabel(gender: string) {
  return gender === "female" ? "Nữ giới" : "Nam giới";
}

function GenderIcon({ gender }: { gender: string }) {
  return gender === "female" ? <Venus size={20} /> : <Mars size={20} />;
}

function PrimaryChartCard({ chart }: { chart: ChartHistoryItem }) {
  return (
    <section className="chart-history-primary">
      <div className="flex justify-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-black uppercase tracking-wide text-orange-700 shadow-sm">
          <Star className="fill-amber-300 text-amber-300" size={20} /> Lá số chính
        </span>
      </div>
      <h1 className="mt-5 text-center text-3xl font-black text-stone-950">{chart.chart.input.fullName}</h1>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-base font-semibold text-stone-700">
        <span className="inline-flex items-center gap-2"><CalendarDays size={21} /> {solarDate(chart)} <span className="text-stone-400">(Âm lịch: {lunarDate(chart)})</span></span>
        <span className="text-stone-300">•</span>
        <span className="inline-flex items-center gap-2"><Clock3 size={21} /> {hourLabel(chart.chart.input.birthHour)}</span>
        <span className="text-stone-300">•</span>
        <span className="inline-flex items-center gap-2"><GenderIcon gender={chart.chart.input.gender} /> {genderLabel(chart.chart.input.gender)}</span>
      </div>
      <div className="mt-7 grid gap-4 md:grid-cols-2">
        <div className="chart-history-stat">
          <Sparkles className="text-orange-600" size={22} />
          <span>{chart.hasAdvancedReading ? "Đã có luận giải nâng cao" : "Chưa mở luận giải nâng cao"}</span>
          <strong>{chart.hasAdvancedReading ? "Sẵn sàng" : "Miễn phí"}</strong>
        </div>
        <div className="chart-history-stat">
          <Clock3 className="text-orange-600" size={22} />
          <span>Lần tạo gần nhất</span>
          <strong>{chart.createdAt.toLocaleDateString("vi-VN")}</strong>
        </div>
      </div>
      <div className="mt-8 flex justify-center">
        <Link href={chart.hasAdvancedReading ? `/la-so/${chart.id}/nang-cao` : `/la-so/${chart.id}`} className="text-base font-semibold text-stone-500 transition hover:text-orange-700">
          {chart.hasAdvancedReading ? "Xem luận giải nâng cao" : "Xem tổng quan luận giải"}
        </Link>
      </div>
    </section>
  );
}

function toHistoryViewItem(chart: ChartHistoryItem): ChartHistoryViewItem {
  return {
    id: chart.id,
    fullName: chart.chart.input.fullName,
    solarDate: solarDate(chart),
    lunarDate: lunarDate(chart),
    hourLabel: hourLabel(chart.chart.input.birthHour),
    gender: chart.chart.input.gender,
    genderLabel: genderLabel(chart.chart.input.gender),
    yearCanChi: chart.chart.canChi.year,
    hasAdvancedReading: chart.hasAdvancedReading,
  };
}

export default async function ChartHistoryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/dang-nhap?next=/la-so");
  const charts = await listUserCharts(user.id, user.role === "ADMIN");
  const primary = charts[0];

  return (
    <main className="min-h-screen bg-[#fbfaf7]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {primary ? <PrimaryChartCard chart={primary} /> : null}

        <section className="mt-12">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-3xl font-black text-stone-950">Danh sách lá số</h1>
            <Link href="/#lap-la-so" className="btn btn-primary">
              <Plus size={19} /> Tạo mới
            </Link>
          </div>

          {charts.length ? (
            <ChartHistoryList charts={charts.map(toHistoryViewItem)} />
          ) : (
            <div className="panel mt-8 text-center">
              <h2 className="text-2xl font-black text-stone-950">Bạn chưa có lá số nào</h2>
              <p className="mx-auto mt-3 max-w-xl text-stone-600">Tạo lá số đầu tiên để lưu lịch sử theo tài khoản và quay lại xem luận giải bất cứ lúc nào.</p>
              <Link href="/#lap-la-so" className="btn btn-primary mt-5">
                <Plus size={19} /> Tạo lá số mới
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
