import TuViQuanEntry from "@/components/tu-vi-quan-entry";
import { routeMetadata } from "@/lib/metadata";
import { organizationJsonLd, websiteJsonLd, webPageJsonLd } from "@/lib/seo";

const description = "Ghé Tử Vi Quán 3D, trò chuyện bằng giọng nói với tám Thầy Tử Vi; thắp hương, thiền và gửi lời nguyện trong Tu viện An Nhiên.";
export const metadata = {
  ...routeMetadata({ title: "Tử Vi Quán 3D · Gặp thầy, trò chuyện và chiêm nghiệm", description, path: "/", imageTitle: "Tử Vi Quán 3D", imageSubtitle: "Gặp thầy Tử Vi · Hai viện · Tám bàn Thầy · Tu viện An Nhiên", robots: { index: true, follow: true } }),
  referrer: "no-referrer" as const,
};

export default function Home() {
  const structured = [organizationJsonLd(), websiteJsonLd(), webPageJsonLd({ name: "Tử Vi Quán 3D", description, url: "/" })];
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structured).replace(/</g, "\\u003c") }} />
    <TuViQuanEntry />
  </>;
}