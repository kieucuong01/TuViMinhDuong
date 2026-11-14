import { ArrowRight, ArrowUp, BriefcaseBusiness, CalendarDays, ChevronRight, CircleUserRound, Coins, HeartHandshake, House, BookOpen, MessageCircle } from "lucide-react";
import type { freeLifeTopics } from "@/lib/free-overview-engine";
import { MarkdownContent } from "@/components/markdown-content";
import { premiumReadingModalId } from "@/components/premium-reading-target";

type FreeOverviewSection = {
  number: 1 | 2 | 3 | 4;
  navTitle: string;
  id: string;
  body: string;
  evidence: string;
  selfCheck: string;
  premiumPreview: string;
  tone: "identity" | "finance" | "career" | "timing";
};

const SECTION_META = {
  1: { navTitle: "Bản thân", tone: "identity", icon: CircleUserRound },
  2: { navTitle: "Tiền bạc", tone: "finance", icon: Coins },
  3: { navTitle: "Sự nghiệp và công danh", tone: "career", icon: BriefcaseBusiness },
  4: { navTitle: "Vận năm", tone: "timing", icon: CalendarDays },
} as const;

const LIFE_ICONS = {
  "tinh-duyen": HeartHandshake,
  "gia-dinh": House,
  "cong-viec": BriefcaseBusiness,
};

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

function overviewExcerpt(content: string) {
  const paragraph = cleanMarkdownText(content.split(/\n\s*\n/u)[0] ?? "");
  const sentence = paragraph.split(/(?<=[.!?])\s+/u)[0] ?? "";
  if (sentence.length <= 150) return sentence;
  return `${sentence.slice(0, 150).replace(/\s+\S*$/u, "")}…`;
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
  const topics = [
    ...sections.map(section => ({
      id: section.id,
      title: section.navTitle,
      excerpt: overviewExcerpt(section.body),
      icon: SECTION_META[section.number].icon,
    })),
    ...additionalTopics.map(topic => ({
      id: `luan-${topic.id}`,
      title: topic.title,
      excerpt: overviewExcerpt(topic.body || topic.situation),
      icon: LIFE_ICONS[topic.id],
    })),
  ];

  return (
    <div className="free-overview-reading-experience">
      <header className="free-reading-cover">
        <h2>Luận giải của {fullName}</h2>
        <a href="#chu-de-luan-giai">Xem tóm tắt theo chủ đề <ArrowRight size={17} aria-hidden="true" /></a>
      </header>
      <section className="free-reading-index" id="chu-de-luan-giai" aria-labelledby="free-overview-quick-title">
        <h2 id="free-overview-quick-title">Tóm tắt theo chủ đề</h2>
        <nav aria-label="Điều hướng luận giải miễn phí">
          <table className="free-reading-topics" aria-labelledby="free-overview-quick-title">
            <thead><tr><th scope="col">Chủ đề</th><th scope="col">Điểm đáng chú ý</th></tr></thead>
            <tbody>
              {topics.map(({ id, title, excerpt, icon: Icon }) => (
                <tr key={id}>
                  <th scope="row">
                    <a href={`#${id}`}>
                      <span className="free-reading-icon"><Icon size={19} aria-hidden="true" /></span>
                      <span>{title}</span><ChevronRight className="free-reading-topic-arrow" size={16} aria-hidden="true" />
                    </a>
                  </th>
                  <td>{excerpt || "Mở phần luận giải để đọc chi tiết."}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </nav>
        <a className="chart-reading-jump" href="#chart-palaces">Về bàn lá số</a>
      </section>

      {sections.map(section => {
        const Icon = SECTION_META[section.number].icon;
        return (
          <section key={section.id} id={section.id} className="free-reading-topic"
            data-ad-view="free_overview_section_viewed" data-reading-section={section.number} data-offer-context={section.tone}>
            <h3><span className="free-reading-icon"><Icon size={22} aria-hidden="true" /></span>{section.navTitle}</h3>
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
        );
      })}
      {additionalTopics.map(topic => {
        const Icon = LIFE_ICONS[topic.id];
        return (
          <section key={topic.palace} id={`luan-${topic.id}`} className="free-reading-topic">
            <h3><span className="free-reading-icon"><Icon size={22} aria-hidden="true" /></span>{topic.title}</h3>
            {topic.body && <p>{topic.body}</p>}
            <p>{topic.situation}</p>
            {topic.evidence && <details className="free-overview-evidence">
              <summary>Căn cứ từ lá số</summary>
              <p>{topic.evidence}</p>
            </details>}
            {canCheckoutFull && <p className="free-reading-preview">{topic.deeper}</p>}
            <a className="chart-reading-jump" href="#chu-de-luan-giai"><ArrowUp size={16} aria-hidden="true" /> Về danh sách chủ đề</a>
          </section>
        );
      })}
      {canCheckoutFull && (
        <section className="free-overview-final-offer" data-ad-view="full_offer_bottom_viewed" data-chart-id={chartId}>
          <h2>Bản chuyên sâu giúp bạn xem thêm điều gì?</h2>
          <p>Nếu đang cân nhắc đổi việc, bạn có thể đọc phần công việc cùng tiền bạc và vận năm để biết nên kiểm tra điều gì trước khi quyết. Nếu đang băn khoăn chuyện tình cảm hay gia đình, các chương liên quan giúp bạn đối chiếu cách hai bên nói chuyện, kỳ vọng và chia trách nhiệm.</p>
          <ul className="free-reading-benefits" aria-label="Nội dung bản chuyên sâu">
            <li><BookOpen size={21} aria-hidden="true" /><span><strong>9 chương</strong> luận giải theo các mặt cuộc sống</span></li>
            <li><CalendarDays size={21} aria-hidden="true" /><span><strong>12 tháng</strong> và kế hoạch 30–90 ngày</span></li>
            <li><MessageCircle size={21} aria-hidden="true" /><span><strong>3 câu hỏi</strong> với Cố vấn AI</span></li>
          </ul>
          <p>Bạn có thể đọc lại sau khi mua.</p>
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
