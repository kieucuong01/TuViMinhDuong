import Link from "next/link";
import Image from "next/image";
import type { ComponentType } from "react";
import { Suspense } from "react";
import {
  BookOpenText,
  CalendarCheck2,
  CalendarDays,
  Car,
  ChevronDown,
  Flower2,
  Ghost,
  Gift,
  Hammer,
  HeartHandshake,
  Home,
  Map,
  MoonStar,
  Search,
  Sparkles,
  TrendingUp,
  Users,
  TreePine,
} from "lucide-react";
import { UserHeaderBadge } from "@/components/user-header-badge";
import { MobileSiteMenu } from "@/components/mobile-site-menu";
import { SiteNavShell } from "@/components/site-nav-shell";
import { dateCountdownMenuLinks, dateTaskMenuLinks, type DateMenuIcon } from "@/lib/date-menu";
import { AGE_TOOL_LINKS, type AgeToolSlug } from "@/lib/age-tools";
import { APP_NAME } from "@/lib/env";

const baseNav = [
  { href: "/", label: "Lập lá số", tone: "primary" },
  { href: "/xem-tu-vi-tron-doi", label: "Tử vi", tone: "tuvi" },
  { href: "/xem-ngay", label: "Xem ngày", tone: "date" },
  { href: "/xem-tuoi", label: "Xem tuổi", tone: "age" },
  { href: "/kien-thuc-tu-vi", label: "Bài Viết", tone: "knowledge" },
];

const tuViLinks = [
  { href: "/xem-tu-vi-tron-doi", label: "Xem Tử vi trọn đời", description: "Lập lá số, đọc tổng quan và mở bản FULL 9 chương.", icon: "spark" },
  { label: "Xem Tử vi 2026", description: "Sẽ làm sau.", icon: "calendar" },
  { label: "Tử vi tài lộc & Đầu tư", description: "Chấm Tài - Quan - Di và biểu đồ 5 năm tới.", icon: "trend" },
  { label: "Tương hợp lá số", description: "So 2 lá số theo sao cụ thể.", icon: "users" },
];

const lookupLinks = [
  { href: "/tra-cuu/y-nghia-14-chinh-tinh", label: "Tra cứu Ý nghĩa 14 Chính Tinh", icon: "star" },
  { href: "/tra-cuu/y-nghia-12-cung", label: "Tra cứu Ý nghĩa 12 Cung", icon: "book" },
  { href: "/tra-cuu/phu-tinh", label: "Tra cứu Phụ Tinh", icon: "spark" },
];

const dateMenuIcons: Record<DateMenuIcon, ComponentType<{ size?: number; strokeWidth?: number; "aria-hidden"?: boolean }>> = {
  calendar: CalendarCheck2,
  heart: HeartHandshake,
  hammer: Hammer,
  map: Map,
  home: Home,
  car: Car,
  flower: Flower2,
  gift: Gift,
  ghost: Ghost,
  tree: TreePine,
  moon: MoonStar,
};

const lookupMenuIcons: Record<string, ComponentType<{ size?: number; strokeWidth?: number; "aria-hidden"?: boolean }>> = {
  star: MoonStar,
  book: BookOpenText,
  spark: Sparkles,
};

const tuViMenuIcons: Record<string, ComponentType<{ size?: number; strokeWidth?: number; "aria-hidden"?: boolean }>> = {
  spark: Sparkles,
  calendar: CalendarDays,
  trend: TrendingUp,
  users: Users,
};

const ageMenuIcons: Record<AgeToolSlug, ComponentType<{ size?: number; strokeWidth?: number; "aria-hidden"?: boolean }>> = {
  "xong-dat": Gift,
  "vo-chong": HeartHandshake,
  "sinh-con": Flower2,
  "ket-hon": CalendarCheck2,
  "lam-an": Sparkles,
  "lam-nha": Hammer,
};

export async function SiteHeader() {
  const nav = baseNav;

  return (
    <header className="site-header sticky top-0 z-50 border-b border-orange-100/70 bg-white/75 shadow-sm shadow-orange-950/5 backdrop-blur-2xl supports-[backdrop-filter]:bg-white/70">
      <div className="site-header-shell mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="site-header-menu-slot">
          <MobileSiteMenu items={nav} lookupLinks={lookupLinks} tuViLinks={tuViLinks} />
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

        <SiteNavShell>
          {nav.map((item, index) => {
            const Icon = item.tone === "tuvi" ? Sparkles : item.tone === "date" ? CalendarDays : item.tone === "age" ? HeartHandshake : item.tone === "knowledge" ? BookOpenText : null;
            const linkClass = `site-nav-link rounded-full px-3.5 py-2 transition hover:bg-orange-50 hover:text-orange-700 ${index === 0 ? "site-nav-primary" : ""} ${item.tone === "tuvi" ? "site-nav-tuvi" : ""} ${item.tone === "date" ? "site-nav-date" : ""} ${item.tone === "age" ? "site-nav-age" : ""} ${item.tone === "knowledge" ? "site-nav-knowledge" : ""}`;

            if (item.tone === "tuvi") {
              return (
                <div key={item.href} className="site-nav-flyout site-tuvi-menu">
                  <Link href={item.href} className={`${linkClass} site-tuvi-menu-trigger`} prefetch={false} aria-haspopup="true">
                    <Sparkles aria-hidden="true" size={16} strokeWidth={2.4} />
                    <span>{item.label}</span>
                    <ChevronDown aria-hidden="true" size={14} />
                  </Link>
                  <div className="site-date-panel site-tuvi-panel" aria-label="Chọn mục tử vi">
                    <div className="site-date-panel-grid">
                      {tuViLinks.map((link) => {
                        const MenuIcon = tuViMenuIcons[link.icon];
                        return link.href ? (
                          <Link key={link.label} href={link.href} className="site-date-panel-link" prefetch={false}>
                            <span className="site-date-panel-icon"><MenuIcon aria-hidden={true} size={17} strokeWidth={2.35} /></span>
                            <span><strong>{link.label}</strong><small>{link.description}</small></span>
                          </Link>
                        ) : (
                          <span key={link.label} className="site-date-panel-link disabled" aria-disabled="true">
                            <span className="site-date-panel-icon"><MenuIcon aria-hidden={true} size={17} strokeWidth={2.35} /></span>
                            <span><strong>{link.label}</strong><small>{link.description}</small></span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            }

            if (item.tone === "date") {
              return (
                <div key={item.href} className="site-nav-flyout site-date-menu">
                  <Link href={item.href} className={`${linkClass} site-date-menu-trigger`} prefetch={false} aria-haspopup="true">
                    <CalendarDays aria-hidden="true" size={16} strokeWidth={2.4} />
                    <span>{item.label}</span>
                    <ChevronDown aria-hidden="true" size={14} />
                  </Link>
                  <div className="site-date-panel" aria-label="Chọn công cụ xem ngày">
                    <div className="site-date-panel-grid">
                      {dateTaskMenuLinks.map((link) => {
                        const MenuIcon = dateMenuIcons[link.icon];
                        return (
                          <Link key={link.href} href={link.href} className="site-date-panel-link" prefetch={false}>
                            <span className="site-date-panel-icon"><MenuIcon aria-hidden={true} size={17} strokeWidth={2.35} /></span>
                            <span>
                              <strong>{link.label}</strong>
                              {link.description ? <small>{link.description}</small> : null}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                    <div className="site-date-panel-more"><span /> Xem thêm <span /></div>
                    <div className="site-date-panel-grid site-date-panel-countdowns">
                      {dateCountdownMenuLinks.map((link) => {
                        const MenuIcon = dateMenuIcons[link.icon];
                        return (
                          <Link key={link.href} href={link.href} className="site-date-panel-link compact" prefetch={false}>
                            <span className="site-date-panel-icon"><MenuIcon aria-hidden={true} size={17} strokeWidth={2.35} /></span>
                            <strong>{link.label}</strong>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            }

            if (item.tone === "age") {
              return (
                <div key={item.href} className="site-nav-flyout site-age-menu">
                  <Link href={item.href} className={`${linkClass} site-age-menu-trigger`} prefetch={false} aria-haspopup="true">
                    <HeartHandshake aria-hidden="true" size={16} strokeWidth={2.4} />
                    <span>{item.label}</span>
                    <ChevronDown aria-hidden="true" size={14} />
                  </Link>
                  <div className="site-date-panel site-age-panel" aria-label="Chọn công cụ xem tuổi">
                    <div className="site-date-panel-grid">
                      {AGE_TOOL_LINKS.map((link) => {
                        const MenuIcon = ageMenuIcons[link.slug];
                        return (
                          <Link key={link.href} href={link.href} className="site-date-panel-link" prefetch={false}>
                            <span className="site-date-panel-icon"><MenuIcon aria-hidden={true} size={17} strokeWidth={2.35} /></span>
                            <span><strong>{link.label}</strong><small>{link.description}</small></span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            }

            if (item.tone === "knowledge") {
              return (
                <div key={item.href} className="site-nav-flyout site-lookup-menu site-article-menu">
                  <Link href={item.href} className={linkClass} prefetch={false} aria-haspopup="true">
                    <BookOpenText aria-hidden="true" size={16} strokeWidth={2.4} />
                    <span>{item.label}</span>
                    <ChevronDown aria-hidden="true" size={14} />
                  </Link>
                  <div className="site-lookup-panel">
                    <Link href="/kien-thuc-tu-vi" prefetch={false}>
                      <span className="site-lookup-panel-icon"><BookOpenText aria-hidden={true} size={16} strokeWidth={2.35} /></span>
                      <strong>Kiến thức tử vi</strong>
                    </Link>
                    <Link href="/tra-cuu" prefetch={false}>
                      <span className="site-lookup-panel-icon"><Search aria-hidden={true} size={16} strokeWidth={2.35} /></span>
                      <strong>Tra cứu tổng quan</strong>
                    </Link>
                    {lookupLinks.map((lookupItem) => {
                      const LookupIcon = lookupMenuIcons[lookupItem.icon];
                      return (
                        <Link key={lookupItem.href} href={lookupItem.href} prefetch={false}>
                          <span className="site-lookup-panel-icon"><LookupIcon aria-hidden={true} size={16} strokeWidth={2.35} /></span>
                          <strong>{lookupItem.label}</strong>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            }

            return (
              <Link key={item.href} href={item.href} className={linkClass} prefetch={false}>
                {Icon ? <Icon aria-hidden="true" size={16} strokeWidth={2.4} /> : null}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </SiteNavShell>

        <div className="site-header-actions flex items-center gap-2">
          <Suspense fallback={<div className="user-header-skeleton" aria-hidden="true"><span /></div>}>
            <UserHeaderBadge />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
