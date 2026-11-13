import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { GlobalLoadingToast } from "@/components/global-loading-toast";
import { DeferredGlobalModals } from "@/components/deferred-global-modals";
import { ClientErrorReporter } from "@/components/client-error-reporter";
import { GoogleAnalytics } from "@/components/google-analytics";
import { AdminRouteClassSync } from "@/components/admin-route-class-sync";
import { APP_NAME, APP_URL } from "@/lib/env";
import { getOperationSettings } from "@/lib/data";
import "./globals.css";

const defaultTitle = `${APP_NAME} - Lập lá số tử vi`;
const defaultDescription = "Lập lá số tử vi, đọc luận giải hoặc trò chuyện với Thầy trong Tử Vi Quán 3D.";
const defaultOgImage = `/api/og?title=${encodeURIComponent(APP_NAME)}&subtitle=${encodeURIComponent("Lập lá số · Đọc luận giải · Tử Vi Quán 3D")}`;

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: defaultTitle,
    template: `%s | ${APP_NAME}`,
  },
  description: defaultDescription,
  openGraph: {
    title: defaultTitle,
    description: defaultDescription,
    url: APP_URL,
    siteName: APP_NAME,
    images: [defaultOgImage],
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
    images: [defaultOgImage],
  },
  alternates: {
    canonical: "/",
  },
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const operationSettings = await getOperationSettings();
  const coinTopupEnabled = operationSettings.paymentsEnabled && operationSettings.coinTopupEnabled;

  return (
    <html
      lang="vi"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full bg-[#fffaf0] text-stone-950">
        <script
          dangerouslySetInnerHTML={{
            __html: "try{if(location.pathname==='/admin'||location.pathname.startsWith('/admin/'))document.documentElement.classList.add('admin-route')}catch(e){}",
          }}
        />
        <AdminRouteClassSync />
        <SiteHeader />
        {children}
        <SiteFooter />
        <Suspense fallback={null}>
          <GlobalLoadingToast />
        </Suspense>
        <Suspense fallback={null}>
          <DeferredGlobalModals coinTopupEnabled={coinTopupEnabled} />
        </Suspense>
        <ClientErrorReporter />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
