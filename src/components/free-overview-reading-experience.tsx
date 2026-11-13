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
import { FreeOverviewSectionLink } from "@/components/free-overview-section-link";
import { premiumReadingModalId } from "@/components/premium-reading-target";

type FreeOverviewSection = {
  number: number;
  title: string;
  navTitle: string;
  id: string;
  body: string;
  evidence: string;
  selfCheck: string;
  takeaway: string;
  premiumPreview: string;
  ctaLabel: string;
  tone: "identity" | "finance" | "career" | "timing";
};

const SECTION_META = {
  1: { navTitle: "Bản thân", question: "Bạn thường quyết định và phản ứng ra sao?", ctaLabel: "Hiểu kỹ hơn về bản thân", tone: "identity" },
  2: { navTitle: "Tiền bạc", question: "Cách kiếm và giữ tiền nào hợp với bạn?", ctaLabel: "Đọc sâu về tiền bạc và công việc", tone: "finance" },
  3: { navTitle: "Công việc", question: "Bạn làm tốt hơn trong môi trường nào?", ctaLabel: "Đọc sâu về hướng đi công việc", tone: "career" },
  4: { navTitle: "Vận năm", question: "Năm đang xem, bạn nên cân nhắc điều gì?", ctaLabel: "Đọc phân tích năm và từng tháng", tone: "timing" },
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

    const notes = splitReadingNotes(body);
    return {
      number,
      title,
      navTitle: number === 4 ? title.match(/\b20\d{2}\b/u)?.[0] ? `Vận ${title.match(/\b20\d{2}\b/u)?.[0]}` : meta.navTitle : meta.navTitle,
      id: `free-insight-${number}`,
      ...notes,
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
  return Math.max(1, Math.ceil(words / 190));
}

function splitReadingNotes(body: string) {
  const paragraphs = body.split(/\n{2,}/u).map((part) => part.trim()).filter(Boolean);
  const selfCheckIndex = paragraphs.findIndex((part) => /^(Để tự đối chiếu|Tự kiểm tra|Bạn có thể tự kiểm tra)/iu.test(cleanMarkdownText(part)));
  const evidenceIndex = paragraphs.findIndex((part) => /^Căn cứ (từ lá số:|trực tiếp)/iu.test(cleanMarkdownText(part)));
  return {
    body: paragraphs.filter((_, index) => index !== selfCheckIndex && index !== evidenceIndex).join("\n\n"),
    selfCheck: selfCheckIndex < 0 ? "" : paragraphs[selfCheckIndex],
    evidence: evidenceIndex < 0 ? "" : paragraphs[evidenceIndex].replace(/^Căn cứ từ lá số:\s*/iu, ""),
  };
}

function defaultSelfCheck(section: FreeOverviewSection) {
  if (section.tone === "finance") return "Nhìn lại tháng vừa rồi: điều làm bạn lo hơn là thu nhập chưa đủ hay những khoản đã nhận lời chi?";
  if (section.tone === "career") return "Bạn mệt vì công việc khó, hay vì yêu cầu và quyền quyết định chưa rõ?";
  if (section.tone === "timing") return "Việc bạn đang cân nhắc còn thiếu điều kiện gì để bắt đầu?";
  return "Trong một quyết định gần đây, điều gì đã khiến bạn nhận lời hoặc từ chối?";
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

  const formattedPrice = cashLabel(priceCoins);
  const readMinutes = estimatedReadMinutes(content);

  return (
    <div className="free-overview-reading-experience">
      <section id="chu-de-luan-giai" className="free-overview-quick-summary" aria-labelledby="free-overview-quick-title">
        <div className="free-overview-quick-heading">
          <h2 id="free-overview-quick-title">Luận giải của {fullName}</h2>
          <p>Chọn chủ đề bạn muốn đọc trước.</p>
        </div>
        <nav aria-label="Điều hướng luận giải miễn phí"><ol className="free-overview-quick-grid">
          {sections.map(section => (
            <li key={section.id} className={`free-overview-quick-card is-${section.tone}`}>
              <span>{sectionIcon(section.number)}</span>
              <div>
                <strong><FreeOverviewSectionLink targetId={section.id}>{section.navTitle}</FreeOverviewSectionLink></strong>
                <p>{section.takeaway}</p>
              </div>
            </li>
          ))}
        </ol></nav>
        <div className="free-overview-trust-strip" aria-label="Cam kết chất lượng bản miễn phí">
          <span><Clock3 size={16} aria-hidden="true" /> Khoảng {readMinutes} phút đọc</span>
          <span><BookOpenText size={16} aria-hidden="true" /> {sections.length} phần miễn phí</span>
          <span><ShieldCheck size={16} aria-hidden="true" /> Có thể mở xem căn cứ từ lá số</span>
        </div>
        <div className="flex flex-wrap gap-x-5">
          <a className="chart-reading-jump" href="#chart-palaces">Về bàn lá số</a>
          <a className="chart-reading-jump" href="#chon-cach-xem">Chọn cách xem</a>
        </div>
      </section>

      <div className="free-overview-chapter-list">
        {sections.map((section, index) => {
          const showPremiumPreview = canCheckoutFull && Boolean(section.premiumPreview);
          const showContextualCta = showPremiumPreview && (section.number === 2 || section.number === 4);
          const headingId = `${section.id}-title`;
          const selfCheckCopy = section.selfCheck ? cleanMarkdownText(section.selfCheck).replace(/^Để tự đối chiếu[:,]?\s*/iu, "") : defaultSelfCheck(section);
          const nextSection = sections[index + 1];

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
                  <h2 id={headingId}>{SECTION_META[section.number as keyof typeof SECTION_META].question}</h2>
                  <p>{section.title}</p>
                </div>
              </summary>
              <div className="free-overview-card-body">
                <MarkdownContent content={section.body} />
                <aside className="free-overview-self-check" aria-label={`Tự đối chiếu phần ${section.number}`}>
                  <strong>Bạn có gặp điều này không?</strong>
                  <p>{selfCheckCopy}</p>
                </aside>
                {section.evidence ? (
                  <details className="free-overview-evidence">
                    <summary>Vì sao lá số có nhận định này?</summary>
                    <MarkdownContent content={section.evidence} />
                  </details>
                ) : null}
                {showPremiumPreview ? (
                  <aside className="free-overview-premium-preview" aria-label={`Gợi ý nội dung bản FULL cho ${section.navTitle}`}>
                    <div className="free-overview-premium-heading">
                      <span><Sparkles size={17} aria-hidden="true" /></span>
                      <div>
                        <strong>Nếu đây là điều bạn đang muốn hiểu rõ hơn</strong>
                        <p>Bản chuyên sâu sẽ xem thêm các cung liên quan:</p>
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
                {nextSection ? (
                  <FreeOverviewSectionLink targetId={nextSection.id} className="free-overview-read-next">
                    Đọc tiếp: {nextSection.navTitle.toLocaleLowerCase("vi")} <ArrowRight size={17} aria-hidden="true" />
                  </FreeOverviewSectionLink>
                ) : null}
                <a className="chart-reading-jump" href="#chu-de-luan-giai">Về danh sách chủ đề</a>
              </div>
            </details>
          );
        })}
      </div>

      {canCheckoutFull ? (
        <section className="free-overview-final-offer" aria-labelledby="free-overview-final-offer-title" data-ad-view="full_offer_bottom_viewed" data-chart-id={chartId}>
          <div>
            <span className="free-overview-ai-badge"><BadgeCheck size={15} aria-hidden="true" /> Khi bạn muốn đọc sâu hơn</span>
            <h2 id="free-overview-final-offer-title">Muốn hiểu rõ hơn chuyện bạn đang cân nhắc?</h2>
            <p>
              Phần miễn phí giúp bạn nhận ra một vài cách nghĩ và cách làm quen thuộc. Bản chuyên sâu nối các phần đó với công việc, tiền bạc, tình cảm và năm đang xem, để bạn có thêm góc nhìn cho chuyện đang cân nhắc.
            </p>
          </div>
          <ul>
            <li><BadgeCheck size={16} aria-hidden="true" /> 9 chương đọc cùng các cung liên quan, thay vì tách riêng từng sao</li>
            <li><BadgeCheck size={16} aria-hidden="true" /> Phân tích 12 tháng và gợi ý kế hoạch 30/90 ngày</li>
            <li><BadgeCheck size={16} aria-hidden="true" /> 3 câu hỏi với Cố vấn AI để hỏi thêm về điều bạn quan tâm</li>
          </ul>
          <button
            type="button"
            className="btn btn-primary btn-large free-overview-final-cta"
            popoverTarget={premiumReadingModalId(chartId)}
            data-ad-click="full_offer_bottom_clicked"
            data-chart-id={chartId}
            data-cta-location="free_overview_bottom"
          >
            Xem bản chuyên sâu — {formattedPrice}
            <ArrowRight size={18} aria-hidden="true" />
          </button>
          <p className="free-overview-offer-note">Mua một lần, đọc lại không mất phí. {isSignedIn ? "Thanh toán PayOS hoặc dùng xu nếu đủ." : "Không cần đăng nhập trước."}</p>
        </section>
      ) : null}
    </div>
  );
}
