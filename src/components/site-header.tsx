import Link from "next/link";
import Image from "next/image";
import { Menu } from "lucide-react";
import { TEMPORARY_FULL_ACCESS } from "@/lib/pricing";
import { UserHeaderBadge } from "@/components/user-header-badge";
import { CoinTopupLink } from "@/components/coin-topup-link";
import { APP_NAME } from "@/lib/env";

const nav = [
  { href: "/", label: "Lập lá số tử vi" },
  { href: "/la-so", label: "Lá số" },
  { href: "/xem-ngay", label: "Xem ngày" },
  { href: "/kien-thuc-tu-vi", label: "Kiến thức" },
  ...(TEMPORARY_FULL_ACCESS
    ? []
    : [
        { href: "/pricing", label: "Bảng giá" },
        { href: "/nap-xu", label: "Nạp xu", modal: true },
      ]),
];

export function SiteHeader() {
  return (
    <header className="site-header sticky top-0 z-50 border-b border-orange-100/70 bg-white/75 shadow-sm shadow-orange-950/5 backdrop-blur-2xl supports-[backdrop-filter]:bg-white/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
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
          {nav.map((item, index) =>
            "modal" in item && item.modal ? (
              <CoinTopupLink key={item.href} className={`site-nav-link rounded-full px-3.5 py-2 transition hover:bg-orange-50 hover:text-orange-700 ${index === 0 ? "site-nav-primary" : ""}`}>
                {item.label}
              </CoinTopupLink>
            ) : (
              <Link key={item.href} href={item.href} className={`site-nav-link rounded-full px-3.5 py-2 transition hover:bg-orange-50 hover:text-orange-700 ${index === 0 ? "site-nav-primary" : ""}`} prefetch={false}>
                {item.label}
              </Link>
            )
          )}
        </nav>

        <div className="flex items-center gap-2">
          <UserHeaderBadge />

          <details className="relative lg:hidden">
            <summary className="icon-button list-none" aria-label="Mở menu">
              <Menu size={20} />
            </summary>
            <div className="absolute right-0 mt-3 grid w-60 gap-1 rounded-2xl border border-orange-100 bg-white/95 p-2 shadow-2xl shadow-orange-950/10 backdrop-blur-xl">
              {nav.map((item) =>
                "modal" in item && item.modal ? (
                  <CoinTopupLink key={item.href} className="rounded-xl px-3 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-orange-50 hover:text-orange-700">
                    {item.label}
                  </CoinTopupLink>
                ) : (
                  <Link key={item.href} href={item.href} className="rounded-xl px-3 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-orange-50 hover:text-orange-700" prefetch={false}>
                    {item.label}
                  </Link>
                )
              )}
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
