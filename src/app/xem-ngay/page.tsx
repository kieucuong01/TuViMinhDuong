import { DateView } from "@/components/date-view";

export const metadata = {
  title: "Xem ngày tốt xấu",
  description: "Xem ngày tốt xấu, âm lịch, can chi, giờ hoàng đạo, việc nên làm và nên tránh theo tử vi ứng dụng.",
  alternates: { canonical: "/xem-ngay" },
};

export default function DateViewPage() {
  return (
    <main className="min-h-screen bg-[#fbfaf7]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <DateView />
      </div>
    </main>
  );
}
