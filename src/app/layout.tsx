import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { DeferredSocialProof } from "@/components/deferred-social-proof";
import { GlobalLoadingToast } from "@/components/global-loading-toast";
import { PaywallPopup } from "@/components/paywall-popup";
import { APP_NAME, APP_URL } from "@/lib/env";
import "./globals.css";

const defaultOgImage = `/api/og?title=${encodeURIComponent("Lập lá số tử vi AI")}&subtitle=${encodeURIComponent("Tra cứu tử vi, xem ngày và luận giải có cấu trúc")}`;

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: `${APP_NAME} - Lập lá số tử vi AI`,
    template: `%s | ${APP_NAME}`,
  },
  description:
    "Lập lá số tử vi, xem luận giải AI, kiến thức tử vi và nạp xu nhanh cho người dùng Việt Nam.",
  openGraph: {
    title: `${APP_NAME} - Lập lá số tử vi AI`,
    description: "Tra cứu lá số tử vi chuẩn phổ thông, luận giải AI và kiến thức tử vi dễ hiểu.",
    url: APP_URL,
    siteName: APP_NAME,
    images: [defaultOgImage],
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} - Lập lá số tử vi AI`,
    description: "Tra cứu lá số tử vi chuẩn phổ thông, luận giải AI và kiến thức tử vi dễ hiểu.",
    images: [defaultOgImage],
  },
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className="h-full antialiased"
    >
      <body className="min-h-full bg-[#fffaf0] text-stone-950">
        <SiteHeader />
        {children}
        <Suspense fallback={null}>
          <GlobalLoadingToast />
        </Suspense>
        <Suspense fallback={null}>
          <PaywallPopup />
        </Suspense>
        <DeferredSocialProof />
      </body>
    </html>
  );
}
