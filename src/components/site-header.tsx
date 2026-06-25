import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { BookOpenText, CalendarDays, ChevronDown, Search } from "lucide-react";
import { UserHeaderBadge } from "@/components/user-header-badge";
import { MobileSiteMenu } from "@/components/mobile-site-menu";
import { APP_NAME } from "@/lib/env";

const baseNav = [
  { href: "/", label: "Lập lá số", tone: "primary" },
  { href: "/xem-ngay", label: "Xem ngày", tone: "date" },
  { href: "/kien-thuc-tu-vi", label: "Kiến thức", tone: "knowledge" },
];

const lookupLinks = [
  { href: "/tra-cuu/y-nghia-14-chinh-tinh", label: "Tra cứu Ý nghĩa 14 Chính Tinh" },
  { href: "/tra-cuu/y-nghia-12-cung", label: "Tra cứu Ý nghĩa 12 Cung" },
  { href: "/tra-cuu/phu-tinh", label: "Tra cứu Phụ Tinh" },
];

export async function SiteHeader() {
  const nav = baseNav;

  return (
    <header className="site-header sticky top-0 z-50 border-b border-orange-100/70 bg-white/75 shadow-sm shadow-orange-950/5 backdrop-blur-2xl supports-[backdrop-filter]:bg-white/70">
      <div className="site-header-shell mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="site-header-menu-slot">
          <MobileSiteMenu items={nav} lookupLinks={lookupLinks} />
        </div>

        <Link href="/" className="site-brand group flex min-w-0 items-center gap-2 font-semibold text-stone-950" prefetch={false}>
          <span className="site-brand-mark grid h-10 w-10 place-items-center overflow-hidden rounded-2xl bg-orange-50 shadow-inner shadow-white ring-1 ring-orange-200/70 transition-transform group-hover:-rotate-6 group-hover:scale-105">
            <Image src="/brand/laso-tinhhoa-mark.svg" alt="" width={40} height={40} priority />
          </span>
          <span className="site-brand-copy min-w-0 leading-tight">
            <span className="inline-block max-w-[10.5rem] truncate align-middle sm:max-w-none">{APP_NAME}</span>{" "}
            <span className="site-brand-beta rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold text-orange-700">Beta</span>
          </span>
        </Link>

        <nav className="site-nav hidden items-center rounded-full border border-orange-100 bg-white/70 p-1 text-sm font-semibold text-stone-600 shadow-sm lg:flex">
          {nav.map((item, index) => {
            const Icon = item.tone === "date" ? CalendarDays : item.tone === "knowledge" ? BookOpenText : null;
            const linkClass = `site-nav-link rounded-full px-3.5 py-2 transition hover:bg-orange-50 hover:text-orange-700 ${index === 0 ? "site-nav-primary" : ""} ${item.tone === "date" ? "site-nav-date" : ""} ${item.tone === "knowledge" ? "site-nav-knowledge" : ""}`;

            return (
              <Link key={item.href} href={item.href} className={linkClass} prefetch={false}>
                {Icon ? <Icon aria-hidden="true" size={16} strokeWidth={2.4} /> : null}
                <span>{item.label}</span>
              </Link>
            );
          })}
          <details className="site-lookup-menu">
            <summary className="site-nav-link site-nav-lookup rounded-full px-3.5 py-2">
              <Search aria-hidden="true" size={16} strokeWidth={2.4} />
              <span>Tra cứu</span>
              <ChevronDown aria-hidden="true" size={14} />
            </summary>
            <div className="site-lookup-panel">
              {lookupLinks.map((item) => (
                <Link key={item.href} href={item.href} prefetch={false}>{item.label}</Link>
              ))}
            </div>
          </details>
        </nav>

        <div className="site-header-actions flex items-center gap-2">
          <Suspense fallback={<div className="user-header-skeleton" aria-hidden="true"><span /></div>}>
            <UserHeaderBadge />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
