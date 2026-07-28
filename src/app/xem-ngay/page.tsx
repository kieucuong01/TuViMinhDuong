import Link from "next/link";
import { DateView } from "@/components/date-view";
import { routeMetadata } from "@/lib/metadata";
import { faqJsonLd, webPageJsonLd } from "@/lib/seo";

export const metadata = routeMetadata({
  title: "Xem ngày tốt xấu theo tuổi",
  description: "Xem ngày tốt xấu theo tuổi, âm lịch, can chi, 12 trực, hoàng đạo và từng việc như cưới hỏi, khai trương, động thổ.",
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
  searchParams: Promise<{
    date?: string | string[];
    birthYear?: string | string[];
    mode?: string | string[];
    task?: string | string[];
    from?: string | string[];
    to?: string | string[];
  }>;
}) {
  const query = await searchParams;
  const pageLd = webPageJsonLd({
    name: "Xem ngày tốt xấu theo tuổi",
    description: "Xem ngày tốt xấu theo tuổi, âm lịch, can chi, 12 trực, hoàng đạo và từng việc như cưới hỏi, khai trương, động thổ.",
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
        <DateView
          initialDate={query.date}
          initialBirthYear={query.birthYear}
          initialMode={query.mode}
          initialFinderTask={query.task}
          initialFinderFrom={query.from}
          initialFinderTo={query.to}
        />
        <section className="date-guide-panel panel mt-8">
          <p className="eyebrow">Xem ngày tốt xấu theo mục đích</p>
          <h2 className="text-2xl font-black text-stone-950">Chọn đúng công cụ xem ngày trước khi quyết định việc quan trọng</h2>
          <p className="mt-3 max-w-4xl text-base leading-8 text-stone-700">
            Xem ngày tốt xấu theo tuổi nên bắt đầu từ mục đích cụ thể: cưới hỏi, khai trương, động thổ, xuất hành hay ký kết. Cùng một ngày có thể thuận cho việc nhẹ nhưng chưa chắc phù hợp cho việc lớn, vì mỗi nhóm việc chịu tác động khác nhau từ can chi, trực, sao tốt xấu và tuổi của người thực hiện.
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <Link className="date-guide-card block" href="/xem-ngay/cuoi-hoi" prefetch={false}>
              <h3 className="font-black text-stone-950">Xem ngày cưới hỏi</h3>
              <p>Ưu tiên ngày hài hòa cho nghi lễ, gia đình hai bên và tuổi của cặp đôi.</p>
            </Link>
            <Link className="date-guide-card block" href="/xem-ngay/khai-truong" prefetch={false}>
              <h3 className="font-black text-stone-950">Xem ngày khai trương</h3>
              <p>Đọc ngày mở bán, ra mắt, bắt đầu dự án theo hướng thuận khí và thực tế.</p>
            </Link>
            <Link className="date-guide-card block" href="/xem-ngay/dong-tho" prefetch={false}>
              <h3 className="font-black text-stone-950">Xem ngày động thổ</h3>
              <p>Đối chiếu ngày làm nhà, sửa nhà với tuổi, trực ngày và tiêu chí an toàn.</p>
            </Link>
          </div>
          <div className="mt-6 overflow-hidden rounded-2xl border border-orange-100 bg-white">
            <table className="w-full text-left text-sm text-stone-700">
              <thead className="bg-orange-50 text-stone-950">
                <tr>
                  <th className="px-4 py-3 font-black">Nhu cầu</th>
                  <th className="px-4 py-3 font-black">Nên xem gì trước</th>
                  <th className="px-4 py-3 font-black">Cách dùng an toàn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-50">
                <tr>
                  <td className="px-4 py-3 font-semibold">Chọn ngày làm việc lớn</td>
                  <td className="px-4 py-3">Điểm theo việc cần làm + tuổi người đứng việc</td>
                  <td className="px-4 py-3">Chọn ngày thuận, rồi kiểm tra lịch gia đình, pháp lý và sức khỏe.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold">Tìm ngày trong một khoảng</td>
                  <td className="px-4 py-3">Bộ lọc khoảng ngày theo cưới hỏi, khai trương, ký kết</td>
                  <td className="px-4 py-3">Lấy 3-5 ngày tốt để đối chiếu thêm giờ hoàng đạo và điều kiện thực tế.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold">Muốn cá nhân hóa sâu hơn</td>
                  <td className="px-4 py-3">Lập lá số để xem Mệnh, Thân, đại vận và nhật vận</td>
                  <td className="px-4 py-3">Dùng tử vi như lớp tham khảo, không xem là kết luận tuyệt đối.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-6 flex flex-col gap-3 rounded-3xl bg-stone-950 p-5 text-white md:flex-row md:items-center md:justify-between">
            <div>
              <p className="eyebrow text-orange-300">Cá nhân hóa theo lá số</p>
              <h3 className="text-xl font-black">Muốn biết ngày này hợp riêng với mình không?</h3>
              <p className="mt-1 text-sm text-stone-300">Lập lá số miễn phí để đối chiếu ngày đang xem với Mệnh, Thân, đại vận và câu hỏi hiện tại.</p>
            </div>
            <Link className="btn btn-primary" href="/?source=tool&source_slug=xem-ngay&entry_article=xem-ngay&cta_location=xem_ngay_hub#lap-la-so" prefetch={false}>
              Lập lá số để đối chiếu
            </Link>
          </div>
        </section>
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
