import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import type { PseoEntityDefinition } from "@/lib/pseo-registry";

const supportStarFaqs = [
  {
    question: "Phụ tinh có thể tự quyết định tốt xấu của một lá số không?",
    answer:
      "Không. Phụ tinh chỉ là lớp bổ sung sắc thái. Cần đọc cùng cung, chính tinh, tam hợp, xung chiếu, trạng thái sao và vận đang tác động.",
  },
  {
    question: "Gặp phụ tinh gây áp lực có nên lo không?",
    answer:
      "Không nên kết luận vội từ tên sao. Những tín hiệu này giúp biết điểm cần kiểm tra kỹ hơn, không phải lời khẳng định một biến cố chắc chắn xảy ra.",
  },
];

export function PseoSupportStarPage({ entity }: { entity: PseoEntityDefinition }) {
  const canonicalPath = entity.canonicalPath || `/tra-cuu/phu-tinh/${entity.slug}`;

  return (
    <main className="pseo-hub pseo-entity-page section">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav className="article-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Trang chủ</Link>
          <span>/</span>
          <Link href="/tra-cuu">Tra cứu</Link>
          <span>/</span>
          <Link href="/tra-cuu/phu-tinh">Phụ Tinh</Link>
          <span>/</span>
          <span>Sao {entity.name}</span>
        </nav>

        <header>
          <p className="eyebrow">Tra cứu Phụ Tinh</p>
          <h1>Sao {entity.name} trong tử vi</h1>
          <p>
            Tra cứu vai trò của {entity.name}, cách đặt phụ tinh này vào cung, chính tinh và bối cảnh lá số để tránh đọc vội theo nhãn tốt xấu.
          </p>
        </header>

        <section className="pseo-entity-summary">
          <div>
            <span>Nhóm ý nghĩa</span>
            <strong>{entity.element}</strong>
          </div>
          <div>
            <span>Vai trò nền</span>
            <strong>{entity.summary}</strong>
          </div>
          <div>
            <span>Đường dẫn tra cứu</span>
            <strong>{canonicalPath}</strong>
          </div>
        </section>

        <section className="pseo-entity-content">
          <article>
            <p className="pseo-entity-reading-note">
              Đây là lớp tra cứu phụ tinh. Muốn luận đúng, hãy đọc {entity.name} sau khi đã xác định cung, chính tinh, bộ sao đi cùng và câu hỏi thực tế.
              Phụ tinh làm rõ điều kiện vận hành, không nên dùng riêng để phán đoán chắc chắn.
            </p>

            <h2>Vai trò của {entity.name} trong lá số</h2>
            <p>
              {entity.name} thường được dùng để nhận diện một lớp điều chỉnh trên nền chính tinh và cung. Nếu chính tinh cho biết loại năng lượng chính,
              còn cung cho biết lĩnh vực đời sống, thì {entity.name} giúp người đọc thấy sắc thái vận hành: điểm được hỗ trợ, điểm bị làm chậm hoặc nơi
              cần kiểm tra dữ kiện kỹ hơn.
            </p>
            <p>
              Khi đọc phụ tinh, điều quan trọng là không tách sao khỏi cấu trúc lá số. Cùng một {entity.name} có thể biểu hiện khác nhau nếu nằm tại Mệnh,
              Quan Lộc, Tài Bạch hay Phu Thê; đồng cung với chính tinh mạnh hay yếu; được tam hợp nâng đỡ hay bị xung chiếu tạo áp lực.
            </p>

            <h2>Cách dùng {entity.name} khi tra cứu</h2>
            <div className="prose-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Lớp đọc</th>
                    <th scope="col">Việc cần kiểm tra</th>
                    <th scope="col">Cách dùng an toàn</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Cung</td>
                    <td>{entity.name} đang tác động vào lĩnh vực nào của đời sống.</td>
                    <td>Luôn đọc cùng ý nghĩa 12 cung trước khi kết luận.</td>
                  </tr>
                  <tr>
                    <td>Chính tinh</td>
                    <td>Phụ tinh này đang bổ sung, làm chậm hay khuếch đại đặc tính của sao nào.</td>
                    <td>Không đảo ngược thứ tự đọc: chính tinh và cung đi trước, phụ tinh đi sau.</td>
                  </tr>
                  <tr>
                    <td>Vận hạn</td>
                    <td>{entity.name} có được kích hoạt trong đại vận, tiểu vận hoặc lưu niên hay không.</td>
                    <td>Dùng như tín hiệu cần quan sát, không dùng như lời dự báo tuyệt đối.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2>Điểm có thể phát huy</h2>
            <div className="pseo-entity-detail-grid">
              {entity.strengths.map((item) => (
                <section key={item}>
                  <h3>{item}</h3>
                  <p>
                    Ghi nhận điểm này như một gợi ý kiểm tra hành vi và bối cảnh thật. Nếu có dữ kiện phù hợp, {entity.name} giúp phần luận giải cụ thể hơn.
                  </p>
                </section>
              ))}
            </div>

            <h2>Điều cần thận trọng</h2>
            <div className="pseo-entity-detail-grid">
              {entity.cautions.map((item) => (
                <section key={item}>
                  <h3>{item}</h3>
                  <p>
                    Đây là nguyên tắc để tránh thin reading: không biến một phụ tinh thành nhãn định mệnh, tài chính, sức khỏe hay quan hệ chắc chắn.
                  </p>
                </section>
              ))}
            </div>

            <h2>Nên đọc tiếp ở đâu?</h2>
            <div className="pseo-related-group">
              <div>
                <Link href="/tra-cuu/y-nghia-14-chinh-tinh">
                  <span>Tra cứu 14 Chính Tinh</span>
                  <ArrowRight aria-hidden="true" size={18} />
                </Link>
                <Link href="/tra-cuu/y-nghia-12-cung">
                  <span>Tra cứu 12 Cung</span>
                  <ArrowRight aria-hidden="true" size={18} />
                </Link>
                <Link href="/tra-cuu/phu-tinh">
                  <span>Quay lại hub Phụ Tinh</span>
                  <ArrowRight aria-hidden="true" size={18} />
                </Link>
              </div>
            </div>

            <h2>Câu hỏi thường gặp</h2>
            <div className="pseo-entity-faq">
              {supportStarFaqs.map((item) => (
                <section key={item.question}>
                  <h3>{item.question}</h3>
                  <p>{item.answer}</p>
                </section>
              ))}
            </div>
          </article>

          <aside className="pseo-vip-sidebar">
            <Sparkles aria-hidden="true" size={28} />
            <h2>Luận giải VIP theo lá số riêng</h2>
            <p>Trang tra cứu chỉ là lớp nghĩa nền. Hồ sơ VIP sẽ ghép ngày giờ sinh, cung sao và vận hạn để đọc sát trường hợp của bạn hơn.</p>
            <Link href="/pricing" className="pseo-vip-link">
              Xem luận giải VIP
            </Link>
          </aside>
        </section>
      </div>
    </main>
  );
}

export function getPseoSupportStarFaqs() {
  return supportStarFaqs;
}
