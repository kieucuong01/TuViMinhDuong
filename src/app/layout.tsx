import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { GlobalLoadingToast } from "@/components/global-loading-toast";
import { CoinTopupModal } from "@/components/coin-topup-modal";
import { LoginModal } from "@/components/login-modal";
import { ClientErrorReporter } from "@/components/client-error-reporter";
import { GoogleAnalytics } from "@/components/google-analytics";
import { APP_NAME, APP_URL, GOOGLE_SITE_VERIFICATION } from "@/lib/env";
import "./globals.css";

const defaultOgImage = `/api/og?title=${encodeURIComponent("Lập lá số tử vi miễn phí")}&subtitle=${encodeURIComponent("Xem lá số, xem ngày và luận giải dễ hiểu")}`;

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: `${APP_NAME} - Lập lá số tử vi miễn phí`,
    template: `%s | ${APP_NAME}`,
  },
  description:
    "Lập lá số tử vi, xem luận giải dễ hiểu, kiến thức tử vi và nạp xu nhanh cho người dùng Việt Nam.",
  openGraph: {
    title: `${APP_NAME} - Lập lá số tử vi miễn phí`,
    description: "Tra cứu lá số tử vi chuẩn phổ thông, xem ngày và kiến thức tử vi dễ hiểu.",
    url: APP_URL,
    siteName: APP_NAME,
    images: [defaultOgImage],
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} - Lập lá số tử vi miễn phí`,
    description: "Tra cứu lá số tử vi chuẩn phổ thông, xem ngày và kiến thức tử vi dễ hiểu.",
    images: [defaultOgImage],
  },
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
  },
  ...(GOOGLE_SITE_VERIFICATION
    ? {
        verification: {
          google: GOOGLE_SITE_VERIFICATION,
        },
      }
    : {}),
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
          <CoinTopupModal />
        </Suspense>
        <Suspense fallback={null}>
          <LoginModal />
        </Suspense>
        <ClientErrorReporter />
        <GoogleAnalytics />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
