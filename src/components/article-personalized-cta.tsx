import Link from "next/link";
import { CalendarDays, Sparkles } from "lucide-react";

type ArticlePersonalizedCtaProps = {
  articleSlug: string;
  articleTitle: string;
  categoryName?: string;
  variant?: "inline" | "final";
};

export function ArticlePersonalizedCta({ articleSlug, articleTitle, categoryName, variant = "inline" }: ArticlePersonalizedCtaProps) {
  const topic = categoryName || articleTitle;
  const isFinal = variant === "final";

  return (
    <aside className={`article-personalized-cta article-personalized-cta-${variant}`} aria-label="Cá nhân hóa bài viết này">
      <div>
        <p className="eyebrow">{isFinal ? "Bước tiếp theo" : "Cá nhân hóa bài viết"}</p>
        <strong>{isFinal ? "Đọc xong, hãy đối chiếu với lá số của bạn" : "Muốn đọc chủ đề này theo lá số của bạn?"}</strong>
        <span>
          {isFinal
            ? `Chủ đề “${topic}” sẽ rõ hơn khi bạn xem trực tiếp Mệnh, Thân, cung liên quan và vận đang đi qua.`
            : `Chủ đề “${topic}” sẽ hữu ích hơn khi đặt cạnh ngày giờ sinh, Mệnh, Thân và vận đang đi qua.`}
        </span>
      </div>
      <div className="article-personalized-actions">
        <Link
          href="/?source=seo_article#lap-la-so"
          className="btn btn-primary"
          data-ad-click="article_chart_cta_click"
          data-ad-placement={articleSlug}
        >
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
