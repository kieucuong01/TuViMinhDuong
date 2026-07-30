import {
  ArrowRight,
  BadgeCheck,
  BookOpenText,
  BriefcaseBusiness,
  CalendarRange,
  Clock3,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from "lucide-react";
import { MarkdownContent } from "@/components/markdown-content";
import { premiumReadingModalId } from "@/components/premium-reading-target";

type FreeOverviewSection = {
  number: number;
  title: string;
  navTitle: string;
  id: string;
  body: string;
  takeaway: string;
  premiumPreview: string;
  ctaLabel: string;
  tone: "identity" | "finance" | "career" | "timing";
};

const SECTION_META = {
  1: { navTitle: "Tổng quan", ctaLabel: "Xem bản đồ điểm mạnh", tone: "identity" },
  2: { navTitle: "Tiền bạc", ctaLabel: "Xem dòng tiền 12 tháng", tone: "finance" },
  3: { navTitle: "Công việc", ctaLabel: "Xem thời điểm phát triển công việc", tone: "career" },
  4: { navTitle: "Vận năm", ctaLabel: "Xem lộ trình vận hạn 12 tháng", tone: "timing" },
} as const;

function cleanMarkdownText(content: string) {
  return content
    .replace(/\[([^\]]+)\]\([^)]+\)/gu, "$1")
    .replace(/[*_~`>#]/gu, "")
    .replace(/^\s*[-+]\s+/gmu, "")
    .replace(/\s+/gu, " ")
    .trim();
}

function conciseSentence(content: string) {
  const clean = cleanMarkdownText(content);
  if (!clean) return "Tiếp tục đọc để xem nhận định cá nhân hóa theo chính lá số của bạn.";
  const firstSentence = clean.split(/(?<=[.!?])\s+/u)[0] || clean;
  if (firstSentence.length <= 180) return firstSentence;
  const shortened = firstSentence.slice(0, 177).replace(/\s+\S*$/u, "").trim();
  return `${shortened}…`;
}

function sectionTakeaway(body: string) {
  const highlighted = body.match(/\*\*(?:Lợi thế nổi bật|Điểm nổi bật|Đọc nhanh):\*\*\s*([^\n]+)/u)?.[1];
  if (highlighted) return conciseSentence(highlighted);

  const firstParagraph = body
    .split(/\n\s*\n/u)
    .map((part) => part.trim())
    .find((part) => part && !part.startsWith("#") && !part.startsWith("**"));
  return conciseSentence(firstParagraph || body);
}

export function parseFreeOverviewSections(content: string): FreeOverviewSection[] {
  const matches = Array.from(content.matchAll(/^##\s+([1-4])\.\s+(.+)$/gmu));

  return matches.map((match, index) => {
    const number = Number(match[1]) as keyof typeof SECTION_META;
    const title = match[2].trim();
    const start = (match.index || 0) + match[0].length;
    const end = matches[index + 1]?.index ?? content.length;
    let sectionContent = content.slice(start, end).trim();
    const trailingSalesHeading = sectionContent.search(/^##\s+/mu);
    if (trailingSalesHeading >= 0) sectionContent = sectionContent.slice(0, trailingSalesHeading).trim();

    const premiumMarker = sectionContent.search(/^🔒\s*Nâng cấp Premium để xem:\s*$/mu);
    const body = (premiumMarker >= 0 ? sectionContent.slice(0, premiumMarker) : sectionContent)
      .replace(/^\[Block Nội dung - .+\]:\s*$/gmu, "")
      .trim();
    const premiumPreview = (premiumMarker >= 0
      ? sectionContent.slice(premiumMarker).replace(/^🔒\s*Nâng cấp Premium để xem:\s*/u, "")
      : ""
    ).trim();
    const meta = SECTION_META[number];

    return {
      number,
      title,
      navTitle: number === 4 ? title.match(/\b20\d{2}\b/u)?.[0] ? `Vận ${title.match(/\b20\d{2}\b/u)?.[0]}` : meta.navTitle : meta.navTitle,
      id: `free-insight-${number}`,
      body,
      takeaway: sectionTakeaway(body),
      premiumPreview,
      ctaLabel: meta.ctaLabel,
      tone: meta.tone,
    };
  });
}

function cashLabel(priceCoins: number) {
  return `${new Intl.NumberFormat("vi-VN").format(priceCoins * 1000)}đ`;
}

function sectionIcon(number: number) {
  if (number === 2) return <WalletCards size={20} aria-hidden="true" />;
  if (number === 3) return <BriefcaseBusiness size={20} aria-hidden="true" />;
  if (number === 4) return <CalendarRange size={20} aria-hidden="true" />;
  return <Sparkles size={20} aria-hidden="true" />;
}

function estimatedReadMinutes(content: string) {
  const words = cleanMarkdownText(content).split(/\s+/u).filter(Boolean).length;
  return Math.max(5, Math.min(9, Math.ceil(words / 190)));
}

function splitSelfCheck(body: string) {
  const paragraphs = body.split(/\n{2,}/u).map((part) => part.trim()).filter(Boolean);
  const selfCheckIndex = paragraphs.findIndex((part) => /^(Để tự đối chiếu|Tự kiểm tra|Bạn có thể tự kiểm tra)/iu.test(cleanMarkdownText(part)));
  if (selfCheckIndex < 0) return { body, selfCheck: "" };
  const selfCheck = paragraphs[selfCheckIndex];
  const bodyWithoutSelfCheck = paragraphs.filter((_, index) => index !== selfCheckIndex).join("\n\n");
  return { body: bodyWithoutSelfCheck, selfCheck };
}

function defaultSelfCheck(section: FreeOverviewSection) {
  if (section.tone === "finance") return "Hãy tự hỏi: khoản tiền nào đến nhờ năng lực thật của bạn, khoản nào đến rồi đi vì cảm xúc hoặc thiếu kế hoạch? Nếu hai vế này lệch nhau, phần Tài Bạch cần được đọc cùng Mệnh và Quan Lộc.";
  if (section.tone === "career") return "Hãy tự hỏi: bạn phát triển tốt hơn khi được trao quyền chủ động, hay khi có khuôn mẫu rõ để làm theo? Câu trả lời này giúp kiểm tra nhận định về cung Quan Lộc trong thực tế.";
  if (section.tone === "timing") return "Hãy tự hỏi: việc nào trong năm nay nên tiến, việc nào nên giữ lại thêm một nhịp? Nếu câu trả lời chưa rõ, bản FULL cần soi kỹ hơn theo từng tháng.";
  return "Hãy tự hỏi: điểm mạnh này đang giúp bạn tiến lên ở đâu, và đang khiến bạn phải gồng ở đâu? Một lá số tốt nên giúp bạn nhận ra cả lợi thế lẫn điểm cần tiết chế.";
}

export function FreeOverviewReadingExperience({
  content,
  fullName,
  chartId,
  canCheckoutFull,
  isSignedIn,
  priceCoins = 199,
}: {
  content: string;
  fullName: string;
  chartId: string;
  canCheckoutFull: boolean;
  isSignedIn: boolean;
  priceCoins?: number;
}) {
  const sections = parseFreeOverviewSections(content);
  if (!sections.length) return <MarkdownContent content={content} />;

  const quickSections = [sections[0], sections[1], sections[3] || sections[2]].filter(Boolean);
  const quickYear = sections[3]?.title.match(/\b20\d{2}\b/u)?.[0];
  const quickLabels = ["Thế mạnh cốt lõi", "Cách tạo giá trị", quickYear ? `Trọng tâm năm ${quickYear}` : "Trọng tâm hiện tại"];
  const formattedPrice = cashLabel(priceCoins);
  const readMinutes = estimatedReadMinutes(content);

  return (
    <div className="free-overview-reading-experience">
      <section className="free-overview-quick-summary" aria-labelledby="free-overview-quick-title">
        <div className="free-overview-quick-heading">
          <span className="free-overview-ai-badge"><Sparkles size={15} aria-hidden="true" /> Cá nhân hóa theo lá số</span>
          <h2 id="free-overview-quick-title">Lá số của {fullName} trong 30 giây</h2>
          <p>{quickSections.length === 3 ? "Ba điểm quan trọng" : "Những điểm quan trọng"} để bạn nắm nhanh trước khi đọc sâu từng phần.</p>
        </div>
        <ol className="free-overview-quick-grid">
          {quickSections.map((section, index) => (
            <li key={section.id} className={`free-overview-quick-card is-${section.tone}`}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <strong>{quickLabels[index]}</strong>
                <p>{section.takeaway}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="free-overview-trust-strip" aria-label="Cam kết chất lượng bản miễn phí">
          <span><Clock3 size={16} aria-hidden="true" /> {readMinutes} phút đọc thật</span>
          <span><BookOpenText size={16} aria-hidden="true" /> 4 phần có bằng chứng cung/sao</span>
          <span><ShieldCheck size={16} aria-hidden="true" /> Gợi ý thực tế, không phán hù dọa</span>
        </div>
      </section>

      <nav className="free-overview-section-nav" aria-label="Điều hướng luận giải miễn phí">
        <div className="free-overview-nav-copy">
          <span>Đọc theo chủ đề</span>
          <strong>{sections.length}/4 phần miễn phí</strong>
        </div>
        <ol>
          {sections.map((section) => (
            <li key={section.id}>
              <a href={`#${section.id}`}>
                <span className="free-overview-nav-index">{section.number}</span>
                <span>{section.navTitle}</span>
              </a>
            </li>
          ))}
        </ol>
        <div className="free-overview-progress" aria-hidden="true">
          <span style={{ width: `${Math.min(sections.length, 4) * 25}%` }} />
        </div>
      </nav>

      <div className="free-overview-chapter-list">
        {sections.map((section) => {
          const showPremiumPreview = canCheckoutFull && Boolean(section.premiumPreview);
          const showContextualCta = showPremiumPreview && (section.number === 2 || section.number === 4);
          const headingId = `${section.id}-title`;
          const { body, selfCheck } = splitSelfCheck(section.body);
          const selfCheckCopy = selfCheck ? cleanMarkdownText(selfCheck) : defaultSelfCheck(section);

          return (
            <details
              key={section.id}
              id={section.id}
              className={`free-overview-insight-card is-${section.tone}`}
              open={section.number === 1}
              data-ad-view="free_overview_section_viewed"
              data-reading-section={section.number}
              data-offer-context={section.tone}
              aria-labelledby={headingId}
            >
              <summary
                className="free-overview-card-header"
                data-ad-click="free_overview_section_toggle"
                data-reading-section={section.number}
                data-offer-context={section.tone}
              >
                <span className="free-overview-card-icon">{sectionIcon(section.number)}</span>
                <div className="free-overview-card-title">
                  <small>Phần {section.number}/4</small>
                  <h2 id={headingId}>{section.title}</h2>
                  <p>{section.takeaway}</p>
                </div>
              </summary>
              <div className="free-overview-card-body">
                <MarkdownContent content={body} />
                <aside className="free-overview-self-check" aria-label={`Tự đối chiếu phần ${section.number}`}>
                  <strong>Tự kiểm tra nhanh</strong>
                  <p>{selfCheckCopy}</p>
                </aside>
                {showPremiumPreview ? (
                  <aside className="free-overview-premium-preview" aria-label={`Gợi ý nội dung bản FULL cho ${section.navTitle}`}>
                    <div className="free-overview-premium-heading">
                      <span><Sparkles size={17} aria-hidden="true" /></span>
                      <div>
                        <strong>Bản FULL sẽ trả lời</strong>
                        <p>Phần chuyên sâu nối trực tiếp với nhận định bạn vừa đọc.</p>
                      </div>
                    </div>
                    <MarkdownContent content={section.premiumPreview} />
                    {showContextualCta ? (
                      <div className="free-overview-contextual-offer">
                        <button
                          type="button"
                          className="btn btn-primary free-overview-secondary-cta"
                          popoverTarget={premiumReadingModalId(chartId)}
                          data-ad-click="full_offer_context_clicked"
                          data-chart-id={chartId}
                          data-offer-context={section.tone}
                        >
                          {section.ctaLabel} — {formattedPrice}
                          <ArrowRight size={17} aria-hidden="true" />
                        </button>
                        <span>
                          <BadgeCheck size={15} aria-hidden="true" />
                          {isSignedIn ? "Thanh toán PayOS hoặc dùng xu nếu đủ" : "Thanh toán PayOS · Không cần đăng nhập"}
                        </span>
                      </div>
                    ) : null}
                  </aside>
                ) : null}
              </div>
            </details>
          );
        })}
      </div>

      {canCheckoutFull ? (
        <section className="free-overview-final-offer" aria-labelledby="free-overview-final-offer-title" data-ad-view="full_offer_bottom_viewed" data-chart-id={chartId}>
          <div>
            <span className="free-overview-ai-badge"><BadgeCheck size={15} aria-hidden="true" /> Sau khi đọc 4 phần miễn phí</span>
            <h2 id="free-overview-final-offer-title">Muốn biết tháng nào nên tiến, tháng nào nên giữ?</h2>
            <p>
              Bản FULL không chỉ “xem tiếp”; nó mở 9 chương cá nhân hóa, lộ trình 12 tháng, kế hoạch 30/90 ngày và 3 câu hỏi riêng với Cố vấn AI.
            </p>
          </div>
          <ul>
            <li><BadgeCheck size={16} aria-hidden="true" /> Xem lại không mất phí sau khi mua</li>
            <li><BadgeCheck size={16} aria-hidden="true" /> {isSignedIn ? "Thanh toán PayOS hoặc dùng xu nếu đủ" : "Thanh toán PayOS, không cần đăng nhập trước"}</li>
            <li><BadgeCheck size={16} aria-hidden="true" /> Nối Mệnh - Tài - Quan - Vận thành kế hoạch dễ làm</li>
          </ul>
          <button
            type="button"
            className="btn btn-primary btn-large free-overview-final-cta"
            popoverTarget={premiumReadingModalId(chartId)}
            data-ad-click="full_offer_bottom_clicked"
            data-chart-id={chartId}
            data-cta-location="free_overview_bottom"
          >
            Mở bản FULL — {formattedPrice}
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </section>
      ) : null}
    </div>
  );
}
