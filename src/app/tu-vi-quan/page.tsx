import type { Metadata } from "next";
import TuViQuan from "@/components/tu-vi-quan";
import { getQuanGuest } from "@/lib/tu-vi-quan-guest";

export const metadata: Metadata = {
  title: "Tử Vi Quán",
  description: "Ghé sân quán, thắp hương, ngồi thiền và trò chuyện riêng với thầy tử vi AI.",
  alternates: { canonical: "/tu-vi-quan" },
  robots: { index: false, follow: true },
  referrer: "no-referrer",
};

export default async function TuViQuanPage() {
  const guest = await getQuanGuest();
  const qr = process.env.TU_VI_QUAN_SUPPORT_QR?.trim();
  const recipient = process.env.TU_VI_QUAN_SUPPORT_RECIPIENT?.trim();
  const support = qr && recipient && (/^\/(?!\/)/.test(qr) || qr.startsWith("https://")) ? { qr, recipient } : null;
  return <TuViQuan initialAlias={guest?.alias || ""} support={support} paymentsEnabled={process.env.TU_VI_QUAN_PAYMENTS_ENABLED === "true"} />;
}
