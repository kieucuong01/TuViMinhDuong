import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, Scale, ShieldCheck } from "lucide-react";
import { AGE_TOOL_PAGES } from "@/lib/age-tools";
import { routeMetadata } from "@/lib/metadata";
import { itemListJsonLd, webPageJsonLd } from "@/lib/seo";

const title = "Xem tuổi theo Can Chi, Ngũ hành";
const description = "Xem tuổi theo Can Chi, Ngũ hành cho vợ chồng, sinh con, kết hôn, làm ăn, làm nhà và xông đất; có giải thích từng tiêu chí.";

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
            <p>Xem tuổi theo Can Chi, Ngũ hành giúp đối chiếu tuổi cho đúng việc: vợ chồng, sinh con, kết hôn, làm ăn, làm nhà hoặc xông đất. Mỗi công cụ tách rõ Nạp âm, Thiên Can, Địa Chi và Cung Phi khi cần, để người đọc hiểu lý do thay vì chỉ nhìn một điểm số.</p>
            <Link href="/xem-tuoi/vo-chong" className="btn btn-primary">Bắt đầu xem tuổi <ArrowRight aria-hidden="true" size={18} /></Link>
            <Link href="/?source=tool&source_slug=xem-tuoi&entry_article=xem-tuoi&cta_location=xem_tuoi_hub_hero#lap-la-so" className="btn btn-ghost" prefetch={false}>Lập lá số để đối chiếu</Link>
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

      <section className="age-page-container age-hub-intent" aria-labelledby="age-intent-title">
        <div className="age-section-head">
          <span>Chọn đúng intent</span>
          <h2 id="age-intent-title">Xem tuổi nên bắt đầu từ câu hỏi thực tế</h2>
          <p>Không nên dùng một công cụ chung cho mọi việc. Xem tuổi vợ chồng cần đối chiếu hai người; xem tuổi kết hôn hoặc làm nhà lại là bài toán chọn năm. Bảng dưới giúp chọn đúng trang trước khi nhập dữ liệu.</p>
        </div>
        <div className="age-intent-table-wrap" role="region" aria-label="Bảng chọn công cụ xem tuổi theo nhu cầu">
          <table className="age-intent-table">
            <thead>
              <tr>
                <th>Nhu cầu</th>
                <th>Công cụ nên dùng</th>
                <th>Lưu ý khi đọc</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Đối chiếu hai người</td>
                <td><Link href="/xem-tuoi/vo-chong">Xem tuổi vợ chồng</Link> hoặc <Link href="/xem-tuoi/lam-an">xem tuổi làm ăn</Link></td>
                <td>Đọc từng tiêu chí hợp - xung; không kết luận quan hệ chỉ bằng tuổi.</td>
              </tr>
              <tr>
                <td>Chọn năm cho việc lớn</td>
                <td><Link href="/xem-tuoi/ket-hon">Xem tuổi kết hôn</Link>, <Link href="/xem-tuoi/lam-nha">làm nhà</Link>, <Link href="/xem-tuoi/sinh-con">sinh con</Link></td>
                <td>Ưu tiên năm ít cảnh báo, rồi kiểm tra sức khỏe, pháp lý, tài chính và lịch gia đình.</td>
              </tr>
              <tr>
                <td>Tết và khởi đầu năm mới</td>
                <td><Link href="/xem-tuoi/xong-dat">Xem tuổi xông đất</Link></td>
                <td>Tuổi hợp chỉ là một lớp tham khảo; hòa khí và hoàn cảnh thực tế vẫn quan trọng.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="age-hub-chart-cta">
          <div>
            <span>Muốn đọc sâu hơn tuổi và lá số?</span>
            <h2>Lập lá số để đối chiếu Mệnh, Thân và đại vận</h2>
            <p>Xem tuổi trả lời một lớp Can Chi. Lá số cá nhân giúp đọc thêm nền tính cách, cung liên quan và nhịp vận hiện tại.</p>
          </div>
          <Link href="/?source=tool&source_slug=xem-tuoi&entry_article=xem-tuoi&cta_location=xem_tuoi_hub_table#lap-la-so" className="btn btn-primary" prefetch={false}>Lập lá số miễn phí</Link>
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
