import { ArrowRight, ArrowUp, ChevronRight } from "lucide-react";
import type { freeLifeTopics } from "@/lib/free-overview-engine";
import { MarkdownContent } from "@/components/markdown-content";
import { premiumReadingModalId } from "@/components/premium-reading-target";

type FreeOverviewSection = {
  number: number;
  navTitle: string;
  id: string;
  body: string;
  evidence: string;
  selfCheck: string;
  premiumPreview: string;
  tone: "identity" | "finance" | "career" | "timing";
};

const SECTION_META = {
  1: { navTitle: "Bản thân", tone: "identity" },
  2: { navTitle: "Tiền bạc", tone: "finance" },
  3: { navTitle: "Sự nghiệp và công danh", tone: "career" },
  4: { navTitle: "Vận năm", tone: "timing" },
} as const;

function cleanMarkdownText(content: string) {
  return content
    .replace(/\[([^\]]+)\]\([^)]+\)/gu, "$1")
    .replace(/[*_~`>#]/gu, "")
    .replace(/^\s*[-+]\s+/gmu, "")
    .replace(/\s+/gu, " ")
    .trim();
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
      .replace(/^(?:[-+]\s+|\*\*(?:Lợi thế nổi bật|Điểm nổi bật|Điểm dễ vướng|Đọc nhanh):\*\*\s*)/gmu, "")
      .trim();
    const premiumPreview = (premiumMarker >= 0
      ? sectionContent.slice(premiumMarker).replace(/^🔒\s*Nâng cấp Premium để xem:\s*/u, "")
      : ""
    ).trim();
    const meta = SECTION_META[number];

    const notes = splitReadingNotes(body);
    return {
      number,
      navTitle: number === 4 ? title.match(/\b20\d{2}\b/u)?.[0] ? `Vận ${title.match(/\b20\d{2}\b/u)?.[0]}` : meta.navTitle : meta.navTitle,
      id: `free-insight-${number}`,
      ...notes,
      premiumPreview,
      tone: meta.tone,
    };
  });
}

function cashLabel(priceCoins: number) {
  return `${new Intl.NumberFormat("vi-VN").format(priceCoins * 1000)}đ`;
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

export function FreeOverviewReadingExperience({
  content,
  fullName,
  chartId,
  canCheckoutFull,
  priceCoins = 199,
  lifeTopics = [],
}: {
  content: string;
  fullName: string;
  chartId: string;
  canCheckoutFull: boolean;
  priceCoins?: number;
  lifeTopics?: ReturnType<typeof freeLifeTopics>;
}) {
  const sections = parseFreeOverviewSections(content);
  if (!sections.length) return <MarkdownContent content={content} />;

  const formattedPrice = cashLabel(priceCoins);
  const additionalTopics = lifeTopics.filter(topic => topic.id !== "cong-viec" || !sections.some(section => section.number === 3));

  return (
    <div className="free-overview-reading-experience">
      <section className="free-reading-index" id="chu-de-luan-giai" aria-labelledby="free-overview-quick-title">
        <h2 id="free-overview-quick-title">Luận giải của {fullName}</h2>
        <nav className="free-reading-topics" aria-label="Điều hướng luận giải miễn phí">
          {sections.map(section => <a key={section.id} href={`#${section.id}`}>{section.navTitle}<ChevronRight size={16} aria-hidden="true" /></a>)}
          {additionalTopics.map(topic => <a key={topic.palace} href={`#luan-${topic.id}`}>{topic.title}<ChevronRight size={16} aria-hidden="true" /></a>)}
        </nav>
        <a className="chart-reading-jump" href="#chart-palaces">Về bàn lá số</a>
      </section>

      {sections.map(section => (
        <section key={section.id} id={section.id} className="free-reading-topic"
          data-ad-view="free_overview_section_viewed" data-reading-section={section.number} data-offer-context={section.tone}>
          <h3 className="text-xl font-semibold">{section.navTitle}</h3>
          <MarkdownContent content={section.body} />
          {section.selfCheck && <p>{cleanMarkdownText(section.selfCheck).replace(/^(Để tự đối chiếu|Tự kiểm tra)[:,]?\s*/iu, "").replace(/^./u, letter => letter.toLocaleUpperCase("vi"))}</p>}
          {section.evidence && <details className="free-overview-evidence">
            <summary>Căn cứ từ lá số</summary>
            <MarkdownContent content={section.evidence} />
          </details>}
          {canCheckoutFull && section.premiumPreview && (
            <p className="free-reading-preview">Bản chuyên sâu xem thêm {section.premiumPreview.split("\n").map(line => cleanMarkdownText(line)).filter(Boolean).slice(0, 2).join(" ").replace(/^./u, letter => letter.toLocaleLowerCase("vi"))}</p>
          )}
          <a className="chart-reading-jump" href="#chu-de-luan-giai"><ArrowUp size={16} aria-hidden="true" /> Về danh sách chủ đề</a>
        </section>
      ))}
      {additionalTopics.map(topic => (
        <section key={topic.palace} id={`luan-${topic.id}`} className="free-reading-topic">
          <h3 className="text-xl font-semibold">{topic.title}</h3>
          {topic.body && <p>{topic.body}</p>}
          <p>{topic.situation}</p>
          {topic.evidence && <details className="free-overview-evidence">
            <summary>Căn cứ từ lá số</summary>
            <p>{topic.evidence}</p>
          </details>}
          {canCheckoutFull && <p className="free-reading-preview">{topic.deeper}</p>}
          <a className="chart-reading-jump" href="#chu-de-luan-giai"><ArrowUp size={16} aria-hidden="true" /> Về danh sách chủ đề</a>
        </section>
      ))}
      {canCheckoutFull && (
        <section className="free-overview-final-offer" data-ad-view="full_offer_bottom_viewed" data-chart-id={chartId}>
          <h2>Bản chuyên sâu giúp bạn xem thêm điều gì?</h2>
          <p>Nếu đang cân nhắc đổi việc, bạn có thể đọc phần công việc cùng tiền bạc và vận năm để biết nên kiểm tra điều gì trước khi quyết. Nếu đang băn khoăn chuyện tình cảm hay gia đình, các chương liên quan giúp bạn đối chiếu cách hai bên nói chuyện, kỳ vọng và chia trách nhiệm.</p>
          <p>Bản đầy đủ gồm 9 chương, phân tích 12 tháng, gợi ý việc cần làm trong 30 và 90 ngày, cùng 3 câu hỏi với Cố vấn AI. Bạn có thể đọc lại sau khi mua.</p>
          <button type="button" className="btn btn-primary btn-large free-overview-final-cta"
            popoverTarget={premiumReadingModalId(chartId)} data-ad-click="full_offer_bottom_clicked"
            data-chart-id={chartId} data-cta-location="free_overview_bottom">
            Xem bản chuyên sâu — {formattedPrice} <ArrowRight size={18} aria-hidden="true" />
          </button>
        </section>
      )}
    </div>
  );
}
