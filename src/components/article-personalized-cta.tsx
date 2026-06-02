import Link from "next/link";
import { CalendarDays, Sparkles } from "lucide-react";

type ArticlePersonalizedCtaProps = {
  articleTitle: string;
  categoryName?: string;
};

export function ArticlePersonalizedCta({ articleTitle, categoryName }: ArticlePersonalizedCtaProps) {
  const topic = categoryName || articleTitle;

  return (
    <aside className="article-personalized-cta" aria-label="Cá nhân hóa bài viết này">
      <div>
        <p className="eyebrow">Cá nhân hóa bài viết</p>
        <strong>Muốn đọc chủ đề này theo lá số của bạn?</strong>
        <span>Chủ đề “{topic}” sẽ hữu ích hơn khi đặt cạnh ngày giờ sinh, Mệnh, Thân và vận đang đi qua.</span>
      </div>
      <div className="article-personalized-actions">
        <Link href="/#lap-la-so" className="btn btn-primary">
          <Sparkles size={18} />
          Lập lá số miễn phí
        </Link>
        <Link href="/xem-ngay" className="btn btn-ghost">
          <CalendarDays size={18} />
          Xem ngày theo tuổi
        </Link>
      </div>
    </aside>
  );
}
