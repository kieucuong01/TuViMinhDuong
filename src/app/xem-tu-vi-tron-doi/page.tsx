import Link from "next/link";
import {
  BookOpenText,
  CalendarDays,
  CheckCircle2,
  Compass,
  Layers3,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { ChartForm } from "@/components/chart-form";
import { routeMetadata } from "@/lib/metadata";
import { faqJsonLd, itemListJsonLd, webPageJsonLd } from "@/lib/seo";

export const revalidate = 300;

export const metadata = routeMetadata({
  title: "Tử vi trọn đời cho nam nữ theo lá số cá nhân",
  description:
    "Xem Tử vi trọn đời cho nam nữ theo năm sinh, giới tính và lá số cá nhân. Lập lá số miễn phí, đọc 12 cung, đại vận và bản FULL khi cần luận sâu.",
  path: "/xem-tu-vi-tron-doi",
  imageSubtitle: "Tử vi trọn đời cho nam nữ theo năm sinh, giới tính, 12 cung và đại vận",
});

const updatedAt = "22/07/2026";

const readingLayers = [
  {
    title: "Nền lá số",
    body: "Khóa đúng ngày giờ sinh, giới tính, lịch âm/dương và bố cục 12 cung trước khi đọc dài hạn.",
  },
  {
    title: "Trục đời sống",
    body: "Ghép Mệnh - Thân với Tài Bạch, Quan Lộc, Phu Thê, Phúc Đức, Điền Trạch thay vì phán từng cung riêng lẻ.",
  },
  {
    title: "Vận theo thời gian",
    body: "Đặt đại vận, tiểu vận và năm đang xem lên nền lá số để phân biệt xu hướng dài hạn với nhịp tạm thời.",
  },
];

const lifetimeCards = [
  {
    id: "tu-vi-tron-doi-ky-dau-1969-nam-mang",
    title: "Tử vi trọn đời tuổi Kỷ Dậu 1969 nam mạng",
    year: "1969",
    canChi: "Kỷ Dậu",
    gender: "Nam mạng",
    body: "Gợi ý cách nhìn công việc, tiền bạc, gia đạo và đại vận theo lá số cá nhân thay vì chỉ dựa vào tuổi âm.",
  },
  {
    id: "tu-vi-tron-doi-ky-dau-1969-nu-mang",
    title: "Tử vi trọn đời tuổi Kỷ Dậu 1969 nữ mạng",
    year: "1969",
    canChi: "Kỷ Dậu",
    gender: "Nữ mạng",
    body: "Tập trung đọc Mệnh - Thân, Phu Thê, Tài Bạch và các giai đoạn dễ đổi hướng trong đời sống.",
  },
  {
    id: "tu-vi-tron-doi-nham-thin-2012-nam-mang",
    title: "Tử vi trọn đời tuổi Nhâm Thìn 2012 nam mạng",
    year: "2012",
    canChi: "Nhâm Thìn",
    gender: "Nam mạng",
    body: "Phù hợp để phụ huynh tham khảo nền tính cách, học tập, môi trường phát triển và nhịp vận theo từng chặng.",
  },
  {
    id: "tu-vi-tron-doi-nham-thin-2012-nu-mang",
    title: "Tử vi trọn đời tuổi Nhâm Thìn 2012 nữ mạng",
    year: "2012",
    canChi: "Nhâm Thìn",
    gender: "Nữ mạng",
    body: "Đọc theo lá số đầy đủ giúp tránh kết luận quá sớm chỉ vì cùng năm sinh hoặc cùng can chi.",
  },
  {
    id: "tu-vi-tron-doi-tan-mao-2011-nam-mang",
    title: "Tử vi trọn đời tuổi Tân Mão 2011 nam mạng",
    year: "2011",
    canChi: "Tân Mão",
    gender: "Nam mạng",
    body: "Xem nền Mệnh, cung học tập, quan hệ gia đình và các đại vận đầu đời trên dữ liệu sinh cụ thể.",
  },
  {
    id: "tu-vi-tron-doi-tan-mao-2011-nu-mang",
    title: "Tử vi trọn đời tuổi Tân Mão 2011 nữ mạng",
    year: "2011",
    canChi: "Tân Mão",
    gender: "Nữ mạng",
    body: "Dùng lá số cá nhân để đọc khuynh hướng dài hạn, không gom mọi người cùng tuổi vào một mẫu cố định.",
  },
  {
    id: "tu-vi-tron-doi-at-hoi-1995-nam-mang",
    title: "Tử vi trọn đời tuổi Ất Hợi 1995 nam mạng",
    year: "1995",
    canChi: "Ất Hợi",
    gender: "Nam mạng",
    body: "Nên xem kỹ trục Quan Lộc - Tài Bạch - Thiên Di khi đang xây sự nghiệp, đổi việc hoặc tự kinh doanh.",
  },
  {
    id: "tu-vi-tron-doi-at-hoi-1995-nu-mang",
    title: "Tử vi trọn đời tuổi Ất Hợi 1995 nữ mạng",
    year: "1995",
    canChi: "Ất Hợi",
    gender: "Nữ mạng",
    body: "Đọc cân bằng giữa công việc, tài chính, tình cảm và nhịp đại vận để có góc nhìn thực tế hơn.",
  },
  {
    id: "tu-vi-tron-doi-at-suu-1985-nam-mang",
    title: "Tử vi trọn đời tuổi Ất Sửu 1985 nam mạng",
    year: "1985",
    canChi: "Ất Sửu",
    gender: "Nam mạng",
    body: "Phù hợp khi cần soi lại giai đoạn giữa đời: trách nhiệm gia đình, tài sản, sự nghiệp và sức bền tinh thần.",
  },
  {
    id: "tu-vi-tron-doi-at-suu-1985-nu-mang",
    title: "Tử vi trọn đời tuổi Ất Sửu 1985 nữ mạng",
    year: "1985",
    canChi: "Ất Sửu",
    gender: "Nữ mạng",
    body: "Kết hợp 12 cung với vận hạn để đọc các lựa chọn lớn, không dùng tử vi thay cho quyết định cá nhân.",
  },
  {
    id: "tu-vi-tron-doi-at-mao-1975-nam-mang",
    title: "Tử vi trọn đời tuổi Ất Mão 1975 nam mạng",
    year: "1975",
    canChi: "Ất Mão",
    gender: "Nam mạng",
    body: "Gợi ý các cung nên đối chiếu khi nhìn lại sự nghiệp, tài sản, con cái và kế hoạch cho chặng sau.",
  },
  {
    id: "tu-vi-tron-doi-at-mao-1975-nu-mang",
    title: "Tử vi trọn đời tuổi Ất Mão 1975 nữ mạng",
    year: "1975",
    canChi: "Ất Mão",
    gender: "Nữ mạng",
    body: "Đọc theo lá số giúp tách bạch nền tuổi, môi trường sống và lựa chọn thực tế của từng người.",
  },
];

const relatedLinks = [
  {
    href: "/kien-thuc-tu-vi/la-so-tu-vi-tron-doi",
    title: "Lá số tử vi trọn đời là gì?",
    body: "Nền tảng để hiểu vì sao cần ngày giờ sinh trước khi luận dài hạn.",
  },
  {
    href: "/kien-thuc-tu-vi/cach-doc-la-so-tu-vi-cho-nguoi-moi",
    title: "Cách đọc lá số tử vi cho người mới",
    body: "Bắt đầu từ Mệnh, Thân, tam hợp, xung chiếu và các cung trọng tâm.",
  },
  {
    href: "/kien-thuc-tu-vi/cung-menh-cung-than",
    title: "Cung Mệnh và cung Thân",
    body: "Hai trục quan trọng khi đọc nền tính cách và hướng đời sống.",
  },
  {
    href: "/kien-thuc-tu-vi/12-cung-trong-la-so-tu-vi",
    title: "12 cung trong lá số tử vi",
    body: "Bản đồ để đối chiếu công việc, tiền bạc, gia đình và quan hệ.",
  },
  {
    href: "/kien-thuc-tu-vi/dai-van-la-gi",
    title: "Đại vận là gì?",
    body: "Cách nhìn các chặng vận dài hạn mà không phán tuyệt đối.",
  },
  {
    href: "/xem-ngay",
    title: "Xem ngày tốt xấu",
    body: "Tra cứu ngày theo việc cụ thể khi cần chọn thời điểm hành động.",
  },
];

const fullReportItems = [
  "Tổng quan khí chất, điểm mạnh và phần cần tự điều chỉnh.",
  "12 cung chính với trọng tâm công việc, tiền bạc, gia đình, tình cảm và sức khỏe.",
  "Đại vận, vận năm và gợi ý hành động thực tế để tự đối chiếu.",
  "Bản đọc được lưu trong tài khoản; đã mở thì xem lại không trừ thêm xu.",
];

const futureTools = ["Xem Tử vi 2026", "Tử vi tài lộc & Đầu tư", "Tương hợp lá số"];

const faqs = [
  {
    question: "Tử vi trọn đời cho nam nữ có giống nhau nếu cùng năm sinh không?",
    answer:
      "Không hoàn toàn giống nhau. Cùng năm sinh chỉ cho một phần nền can chi; lá số còn phụ thuộc ngày sinh, giờ sinh, giới tính, cục, 12 cung, sao và vận hạn từng giai đoạn.",
  },
  {
    question: "Xem Tử vi trọn đời có phải là lời khẳng định chắc chắn về tương lai không?",
    answer:
      "Không. Trang đọc theo hướng tham khảo có điều kiện: xem xu hướng dài hạn, đối chiếu dữ liệu sinh và bối cảnh thật, không dùng lá số như một bản án số phận.",
  },
  {
    question: "Tôi cần chuẩn bị gì trước khi xem Tử vi trọn đời?",
    answer:
      "Bạn nên chuẩn bị ngày sinh, giờ sinh gần đúng, giới tính và biết mình dùng lịch âm hay dương. Nếu chưa chắc giờ sinh, hãy chọn khung giờ gần nhất rồi đối chiếu lại sau.",
  },
  {
    question: "Trang này khác gì các bài tử vi trọn đời theo tuổi cố định?",
    answer:
      "Các bài theo tuổi giúp tra cứu nhanh. Lá số cá nhân giúp đọc sâu hơn vì xét ngày giờ sinh, bố cục sao, cung Mệnh - Thân, đại vận và các cung đời sống của riêng từng người.",
  },
];

export default function LifetimeTuViPage() {
  const pageLd = webPageJsonLd({
    name: "Tử vi trọn đời cho nam nữ theo lá số cá nhân",
    description:
      "Hub xem Tử vi trọn đời cho nam nữ theo năm sinh, giới tính và lá số cá nhân, có form lập lá số miễn phí và các chủ đề đọc liên quan.",
    url: "/xem-tu-vi-tron-doi",
    breadcrumb: [
      { name: "Trang chủ", url: "/" },
      { name: "Tử vi", url: "/xem-tu-vi-tron-doi" },
      { name: "Tử vi trọn đời cho nam nữ", url: "/xem-tu-vi-tron-doi" },
    ],
  });

  const listLd = itemListJsonLd(
    lifetimeCards.map((item) => ({
      name: item.title,
      url: `/xem-tu-vi-tron-doi#${item.id}`,
    })),
  );

  return (
    <main>
      <script id="lifetime-tuvi-page-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageLd) }} />
      <script id="lifetime-tuvi-list-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(listLd) }} />
      <script id="lifetime-tuvi-faq-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(faqs)) }} />

      <section className="section bg-gradient-to-b from-white via-orange-50/70 to-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_0.85fr] lg:px-8">
          <div>
            <p className="eyebrow">Tử vi trọn đời cho nam nữ</p>
            <h1 className="section-title max-w-4xl">Tử vi trọn đời cho nam nữ theo năm sinh và lá số cá nhân</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-stone-600" data-answer-block="true">
              Tử vi trọn đời cho nam nữ là cách đọc lá số theo năm sinh, giới tính, 12 cung, sao chính phụ và đại vận để nhìn các xu hướng dài hạn về tính cách, công việc, tiền bạc, tình cảm, gia đạo và sức khỏe. Trên Lá số tinh hoa, bạn lập lá số trước rồi mới đọc luận giải để tránh phán chung chung theo tuổi.
            </p>
            <p className="mt-3 text-sm font-semibold text-stone-500">Cập nhật nội dung: {updatedAt}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="#lap-la-so-tron-doi" className="btn btn-primary btn-large">
                <Sparkles size={20} /> Lập lá số để xem trọn đời
              </Link>
              <Link href="#danh-sach-tuoi" className="btn btn-ghost btn-large">
                <Search size={20} /> Tra theo tuổi phổ biến
              </Link>
            </div>
          </div>

          <aside className="panel">
            <div className="flex items-start gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-100 text-orange-700">
                <Layers3 size={24} />
              </span>
              <div>
                <h2 className="text-2xl font-black text-stone-950">Đọc theo 3 lớp</h2>
                <p className="mt-2 text-stone-600">Không tách một sao hay một cung để kết luận cả đời.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              {readingLayers.map((item, index) => (
                <article key={item.title} className="rounded-2xl border border-orange-100 bg-white/80 p-4">
                  <span className="text-sm font-black text-orange-600">Lớp {index + 1}</span>
                  <h3 className="mt-1 text-lg font-black text-stone-950">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-stone-600">{item.body}</p>
                </article>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section id="danh-sach-tuoi" className="section">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="section-heading">
            <p className="eyebrow">Danh mục tra cứu</p>
            <h2>Xem tử vi trọn đời theo tuổi, năm sinh và nam nữ</h2>
            <p className="mt-4 text-stone-600">
              Các nhóm tuổi dưới đây được trình bày như mục tra cứu nhanh. Khi bấm xem chi tiết, hệ thống đưa bạn về form lập lá số để đọc theo ngày giờ sinh thật, không tạo trang mỏng chỉ đổi năm sinh.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {lifetimeCards.map((item) => (
              <article id={item.id} key={item.id} className="feature-card scroll-mt-24">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-black text-orange-700">{item.year}</span>
                  <span className="text-sm font-black text-stone-500">{item.gender}</span>
                </div>
                <h3>{item.title}</h3>
                <dl className="grid grid-cols-2 gap-2 text-sm text-stone-600">
                  <div className="rounded-xl bg-stone-50 p-3">
                    <dt className="font-black text-stone-950">Tuổi</dt>
                    <dd>{item.canChi}</dd>
                  </div>
                  <div className="rounded-xl bg-stone-50 p-3">
                    <dt className="font-black text-stone-950">Giới tính</dt>
                    <dd>{item.gender}</dd>
                  </div>
                </dl>
                <p>{item.body}</p>
                <Link href="#lap-la-so-tron-doi" className="btn btn-ghost mt-2 w-full justify-center">
                  <UserRound size={18} /> Lập lá số tuổi {item.canChi}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="lap-la-so-tron-doi" className="section bg-white/70">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <p className="eyebrow">Bước đầu tiên</p>
            <h2 className="section-title">Lập lá số trước, rồi mới đọc phần trọn đời</h2>
            <p className="mt-4 text-lg leading-8 text-stone-600">
              Phần trọn đời chỉ có giá trị khi dữ liệu sinh đủ rõ. Sau khi tạo lá số, bạn sẽ thấy bản tổng quan miễn phí và nút mở bản FULL nếu muốn đi vào 9 chương cá nhân hóa.
            </p>
            <ul className="mt-6 grid gap-3 text-stone-700">
              {fullReportItems.map((item) => (
                <li key={item} className="flex gap-3 rounded-2xl border border-orange-100 bg-orange-50/50 p-4">
                  <CheckCircle2 className="mt-1 shrink-0 text-emerald-600" size={20} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="hero-form-card">
            <div className="mb-5 text-center">
              <p className="eyebrow">Nhập thông tin sinh</p>
              <h2 className="text-2xl font-black text-stone-950">Tạo lá số tử vi miễn phí</h2>
              <p className="mt-2 text-stone-600">Dùng chính flow lập lá số của Lá số tinh hoa, không cần tạo tài khoản trước.</p>
            </div>
            <ChartForm compact adSource="tu_vi_tron_doi" />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="eyebrow">Cách đọc đúng</p>
              <h2 className="section-title">Tử vi trọn đời không chỉ là năm sinh</h2>
              <p className="mt-4 text-lg leading-8 text-stone-600">
                Các truy vấn như “tử vi trọn đời tuổi Ất Hợi 1995 nữ mạng” hay “Kỷ Dậu 1969 nam mạng” có giá trị tra cứu, nhưng để luận sâu cần thêm giờ sinh, vị trí sao và mối liên hệ giữa các cung.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  icon: CalendarDays,
                  title: "Năm sinh",
                  body: "Cho nền can chi, mệnh nạp âm và nhóm tuổi để bắt đầu tra cứu.",
                },
                {
                  icon: UserRound,
                  title: "Nam nữ",
                  body: "Ảnh hưởng cách an lá số và cách nhìn một số cung đời sống.",
                },
                {
                  icon: Compass,
                  title: "Lá số",
                  body: "Quyết định phần đọc sâu qua 12 cung, sao, tam hợp và đại vận.",
                },
              ].map((item) => (
                <article key={item.title} className="feature-card">
                  <item.icon className="text-orange-600" size={24} />
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section bg-white/70">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="section-heading">
            <p className="eyebrow">Đọc thêm</p>
            <h2>Chủ đề liên quan đến tử vi trọn đời</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {relatedLinks.map((item) => (
              <Link key={item.href} href={item.href} className="feature-card group">
                <BookOpenText className="text-orange-600" size={24} />
                <h3 className="group-hover:text-orange-700">{item.title}</h3>
                <p>{item.body}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-7">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 shrink-0 text-emerald-600" size={24} />
              <div>
                <p className="eyebrow">Làm sau</p>
                <h2 className="text-2xl font-black text-stone-950">Các mục còn lại đã đặt trong tab Tử vi, nhưng chưa mở route riêng</h2>
                <p className="mt-2 text-stone-600">Tôi giữ chúng ở trạng thái sắp làm để không sinh trang mỏng hoặc công cụ chưa có logic thật.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {futureTools.map((tool) => (
                <span key={tool} className="rounded-2xl bg-stone-50 p-4 font-black text-stone-600">
                  {tool}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section pt-0">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="section-heading">
            <p className="eyebrow">Câu hỏi thường gặp</p>
            <h2>Trước khi xem lá số trọn đời</h2>
          </div>
          <div className="grid gap-3">
            {faqs.map((item) => (
              <details key={item.question} className="date-faq-item rounded-2xl border border-orange-100 bg-orange-50/50 p-4">
                <summary className="cursor-pointer text-base font-black text-stone-950">{item.question}</summary>
                <p className="mt-2 text-stone-600">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
