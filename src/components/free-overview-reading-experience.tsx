import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarRange,
  ChevronDown,
  LockKeyhole,
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
  if (!clean) return "Mở phần này để xem nhận định cá nhân hóa theo chính lá số của bạn.";
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
    const body = (premiumMarker >= 0 ? sectionContent.slice(0, premiumMarker) : sectionContent).trim();
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
      </section>

      <nav className="free-overview-section-nav" aria-label="Điều hướng luận giải miễn phí">
        <span>Đọc theo chủ đề</span>
        <div>
          {sections.map((section) => (
            <a key={section.id} href={`#${section.id}`}>{section.navTitle}</a>
          ))}
          <a href="#personal-report-outline">Bản FULL</a>
        </div>
      </nav>

      <div className="free-overview-card-list">
        {sections.map((section, index) => {
          const showContextualCta = canCheckoutFull && (section.number === 2 || section.number === 4);
          return (
            <details
              key={section.id}
              id={section.id}
              className={`free-overview-insight-card is-${section.tone}`}
              data-reading-section={section.number}
              open={index === 0}
            >
              <summary>
                <span className="free-overview-card-icon">{sectionIcon(section.number)}</span>
                <span className="free-overview-card-title">
                  <small>Phần {section.number}/4</small>
                  <strong>{section.title}</strong>
                  <em>{section.takeaway}</em>
                </span>
                <span className="free-overview-card-state">
                  <span className="is-closed">Đọc phần này</span>
                  <span className="is-open">Thu gọn</span>
                  <ChevronDown size={18} aria-hidden="true" />
                </span>
              </summary>
              <div className="free-overview-card-body">
                <MarkdownContent content={section.body} />
                {section.premiumPreview ? (
                  <aside className="free-overview-locked-preview">
                    <div className="free-overview-locked-heading">
                      <span><LockKeyhole size={17} aria-hidden="true" /></span>
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
                          className="btn btn-primary"
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
    </div>
  );
}
