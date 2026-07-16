import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, Scale, ShieldCheck } from "lucide-react";
import { AGE_TOOL_PAGES } from "@/lib/age-tools";
import { routeMetadata } from "@/lib/metadata";
import { itemListJsonLd, webPageJsonLd } from "@/lib/seo";

const title = "Xem tuổi theo Can Chi, Ngũ hành";
const description = "Bộ công cụ xem tuổi xông đất, vợ chồng, sinh con, kết hôn, làm ăn và làm nhà; giải thích rõ Can Chi, Nạp âm, Cung Phi và cách chọn năm.";

export const metadata: Metadata = routeMetadata({
  title,
  description,
  path: "/xem-tuoi",
  imageSubtitle: "6 công cụ xem tuổi minh bạch, không chấm điểm tùy ý",
});

export default function AgeToolsHubPage() {
  const pageLd = webPageJsonLd({
    name: title,
    description,
    url: "/xem-tuoi",
    breadcrumb: [
      { name: "Trang chủ", url: "/" },
      { name: "Xem tuổi", url: "/xem-tuoi" },
    ],
  });
  const listLd = itemListJsonLd(AGE_TOOL_PAGES.map((page) => ({
    name: page.label,
    url: `/xem-tuoi/${page.slug}`,
  })));

  return (
    <main className="age-page age-hub">
      <script id="age-hub-page-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageLd) }} />
      <script id="age-hub-list-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(listLd) }} />

      <section className="age-hub-hero">
        <div className="age-page-container">
          <div className="age-hub-hero-copy">
            <h1>Xem tuổi đúng việc, hiểu rõ từng tiêu chí</h1>
            <p>Chọn công cụ theo câu hỏi của bạn. Mỗi kết quả đều tách rõ Can Chi, Nạp âm, Ngũ hành và các phép tính chọn năm — không dùng phần trăm hợp tuổi hoặc lời hứa đổi vận.</p>
            <Link href="/xem-tuoi/vo-chong" className="btn btn-primary">Bắt đầu xem tuổi <ArrowRight aria-hidden="true" size={18} /></Link>
          </div>
          <aside className="age-hub-principles" aria-label="Nguyên tắc của bộ công cụ">
            <ShieldCheck aria-hidden="true" />
            <strong>Dữ liệu ở lại trên thiết bị</strong>
            <p>Ngày sinh chỉ được tính trong trình duyệt, không lưu vào tài khoản và không đưa vào địa chỉ trang.</p>
          </aside>
        </div>
      </section>

      <section className="age-page-container age-hub-tools" aria-labelledby="age-tools-title">
        <div className="age-section-head">
          <span>6 nhu cầu riêng biệt</span>
          <h2 id="age-tools-title">Bạn đang muốn xem việc gì?</h2>
          <p>Vợ chồng là đối chiếu hai người; kết hôn là chọn năm cưới. Mỗi trang dùng bộ tiêu chí phù hợp với đúng mục đích.</p>
        </div>
        <div className="age-tool-grid">
          {AGE_TOOL_PAGES.map((page, index) => (
            <Link key={page.slug} href={`/xem-tuoi/${page.slug}`} className="age-tool-card">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h2>{page.label}</h2>
              <p>{page.shortDescription}</p>
              <strong>Xem công cụ <ArrowRight aria-hidden="true" size={17} /></strong>
            </Link>
          ))}
        </div>
      </section>

      <section className="age-hub-method">
        <div className="age-page-container">
          <div className="age-section-head">
            <span>Cách công cụ hoạt động</span>
            <h2>Ba bước, không có điểm số bí ẩn</h2>
          </div>
          <ol className="age-method-steps">
            <li><span>1</span><div><strong>Đổi sang năm âm lịch</strong><p>Ngày dương được đổi theo múi giờ Việt Nam, nên người sinh trước Tết không bị gán nhầm Can Chi của năm mới.</p></div></li>
            <li><span>2</span><div><strong>Chạy đúng bảng quy tắc</strong><p>Công cụ nêu rõ Nạp âm sinh khắc, Can tương hợp, Chi hợp–xung–hại–phá và tiêu chí chọn năm nếu có.</p></div></li>
            <li><span>3</span><div><strong>Đọc từng lý do</strong><p>Thứ tự gợi ý ưu tiên ít cảnh báo chính hơn; người xem vẫn thấy toàn bộ điểm thuận, trung tính và cần cân nhắc.</p></div></li>
          </ol>
        </div>
      </section>

      <section className="age-page-container age-hub-trust" aria-labelledby="age-trust-title">
        <article>
          <BookOpenCheck aria-hidden="true" />
          <div><h2 id="age-trust-title">Phạm vi được nói rõ</h2><p>Chỉ dùng những lớp có thể tính nhất quán từ ngày sinh, năm mục tiêu và giới tính khi Cung Phi thực sự liên quan.</p></div>
        </article>
        <article>
          <Scale aria-hidden="true" />
          <div><h2>Tham khảo, không phán quyết</h2><p>Tuổi không thay thế sự đồng thuận trong hôn nhân, tư vấn y khoa, thẩm định đối tác, pháp lý đất đai hoặc an toàn thi công.</p></div>
        </article>
      </section>
    </main>
  );
}
