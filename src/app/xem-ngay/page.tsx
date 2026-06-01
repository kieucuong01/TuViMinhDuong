import { DateView } from "@/components/date-view";
import { routeMetadata } from "@/lib/metadata";
import { faqJsonLd, webPageJsonLd } from "@/lib/seo";

export const metadata = routeMetadata({
  title: "Xem ngày tốt xấu theo tuổi",
  description: "Xem ngày tốt xấu theo âm lịch, can chi, 12 trực, hoàng đạo, sao tốt xấu và việc nên làm trong ngày.",
  path: "/xem-ngay",
  imageSubtitle: "Âm lịch, can chi, hoàng đạo, việc nên làm và nên tránh",
});

const faqs = [
  {
    question: "Xem ngày tốt xấu dựa trên những yếu tố nào?",
    answer: "Trang xem ngày kết hợp âm lịch Việt Nam, can chi ngày tháng năm, 12 trực, hoàng đạo hắc đạo, nhị thập bát tú, sao tốt xấu và xung hợp theo tuổi.",
  },
  {
    question: "Có nên quyết định việc lớn chỉ dựa vào ngày tốt xấu không?",
    answer: "Không nên. Kết quả xem ngày nên dùng như một lớp tham khảo để chọn thời điểm thuận hơn, vẫn cần cân nhắc sức khỏe, tài chính, pháp lý và hoàn cảnh thực tế.",
  },
  {
    question: "Vì sao cùng một ngày nhưng mỗi việc lại có điểm khác nhau?",
    answer: "Mỗi loại việc như cưới hỏi, khai trương, ký hợp đồng hay xuất hành chịu tác động khác nhau từ trực, sao tốt xấu và can chi xung hợp, nên điểm đánh giá được tách riêng theo từng mục đích.",
  },
];

export default async function DateViewPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string | string[] }>;
}) {
  const query = await searchParams;
  const pageLd = webPageJsonLd({
    name: "Xem ngày tốt xấu theo tuổi",
    description: "Xem ngày tốt xấu theo âm lịch, can chi, 12 trực, hoàng đạo, sao tốt xấu và việc nên làm trong ngày.",
    url: "/xem-ngay",
    breadcrumb: [
      { name: "Trang chủ", url: "/" },
      { name: "Xem ngày tốt xấu", url: "/xem-ngay" },
    ],
  });

  return (
    <main className="date-page-surface min-h-screen bg-[#fbfaf7]">
      <div className="date-page-aura" aria-hidden="true" />
      <script id="date-page-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageLd) }} />
      <script id="date-faq-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(faqs)) }} />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <DateView initialDate={query.date} />
        <section className="date-guide-panel panel mt-8">
          <p className="eyebrow">Hướng dẫn đọc kết quả</p>
          <h2 className="text-2xl font-black text-stone-950">Xem ngày tốt xấu nên dùng như bản tham khảo có điều kiện</h2>
          <div className="mt-4 grid gap-4 text-base leading-8 text-stone-700 md:grid-cols-3">
            <article className="date-guide-card">
              <h3 className="font-black text-stone-950">Xem theo việc cần làm</h3>
              <p>Một ngày có thể tốt cho xuất hành nhưng chưa chắc phù hợp để ký hợp đồng hoặc cưới hỏi. Vì vậy điểm được tách theo từng nhóm việc.</p>
            </article>
            <article className="date-guide-card">
              <h3 className="font-black text-stone-950">Nhập tuổi để xét xung hợp</h3>
              <p>Năm sinh giúp hệ thống xét thêm tam hợp, lục hợp, lục xung, hình, hại, phá và thiên can để kết quả sát với người xem hơn.</p>
            </article>
            <article className="date-guide-card">
              <h3 className="font-black text-stone-950">Chọn giờ tốt nếu ngày trung bình</h3>
              <p>Nếu ngày không quá đẹp nhưng vẫn cần làm việc, hãy ưu tiên giờ hoàng đạo và giảm quy mô các quyết định quan trọng.</p>
            </article>
          </div>
          <div className="mt-6 grid gap-3">
            {faqs.map((item) => (
              <details key={item.question} className="date-faq-item rounded-2xl border border-orange-100 bg-orange-50/50 p-4">
                <summary className="cursor-pointer text-base font-black text-stone-950">{item.question}</summary>
                <p className="mt-3 text-base leading-7 text-stone-700">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
