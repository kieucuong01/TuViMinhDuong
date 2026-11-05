import type { Metadata } from "next";
import TuViQuanEntry from "@/components/tu-vi-quan-entry";

export const metadata: Metadata = {
  title: "Tử Vi Quán · Thế giới chiêm nghiệm 3D",
  description: "Gặp thầy Tử Vi, Tarot, Kinh Dịch và cùng thực hành trong Tu viện An Nhiên.",
  alternates: { canonical: "/" },
  robots: { index: false, follow: true },
  referrer: "no-referrer",
};

export default function TuViQuanPage() { return <TuViQuanEntry />; }