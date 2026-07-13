"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
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
  Menu,
  MoonStar,
  Search,
  Sparkles,
  TreePine,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { CoinTopupLink } from "@/components/coin-topup-link";
import { useCloseDetailsOnOutsideClick } from "@/components/use-close-details-on-outside-click";
import { dateCountdownMenuLinks, dateTaskMenuLinks, type DateMenuIcon } from "@/lib/date-menu";

type MobileSiteMenuItem = {
  href: string;
  label: string;
  modal?: boolean;
  tone?: string;
};

type MobileSiteMenuProps = {
  items: MobileSiteMenuItem[];
  lookupLinks: { href: string; label: string }[];
};

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

export function MobileSiteMenu({ items, lookupLinks }: MobileSiteMenuProps) {
  const pathname = usePathname();
  const detailsRef = useRef<HTMLDetailsElement>(null);
  useCloseDetailsOnOutsideClick(detailsRef);

  const closeMenu = () => {
    if (detailsRef.current?.open) detailsRef.current.open = false;
  };

  useEffect(() => {
    closeMenu();
  }, [pathname]);

  return (
    <details ref={detailsRef} className="mobile-site-menu relative lg:hidden">
      <summary className="icon-button list-none" aria-label="Mở menu điều hướng">
        <Menu size={20} />
      </summary>
      <div className="mobile-site-menu-panel absolute left-0 mt-3 grid w-60 gap-1 rounded-2xl border border-orange-100 bg-white/95 p-2 shadow-2xl shadow-orange-950/10 backdrop-blur-xl">
        {items.map((item) => {
          const Icon = item.tone === "date" ? CalendarDays : item.tone === "knowledge" ? BookOpenText : item.tone === "primary" ? Sparkles : null;
          const itemClass = `mobile-menu-link rounded-xl px-3 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-orange-50 hover:text-orange-700 ${item.tone === "date" ? "mobile-menu-date" : ""} ${item.tone === "knowledge" ? "mobile-menu-knowledge" : ""}`;

          if (item.tone === "date") {
            return (
              <details key={item.href} className="mobile-date-group">
                <summary className={itemClass}>
                  <CalendarDays aria-hidden="true" size={16} strokeWidth={2.4} />
                  <span>Xem ngày</span>
                  <ChevronDown aria-hidden="true" size={15} />
                </summary>
                <div>
                  {dateTaskMenuLinks.map((link) => {
                    const MenuIcon = dateMenuIcons[link.icon];
                    return (
                      <Link key={link.href} href={link.href} prefetch={false} onClick={closeMenu}>
                        <MenuIcon aria-hidden={true} size={15} strokeWidth={2.35} />
                        <span>{link.label}</span>
                      </Link>
                    );
                  })}
                  <p>Xem thêm</p>
                  {dateCountdownMenuLinks.map((link) => {
                    const MenuIcon = dateMenuIcons[link.icon];
                    return (
                      <Link key={link.href} href={link.href} prefetch={false} onClick={closeMenu}>
                        <MenuIcon aria-hidden={true} size={15} strokeWidth={2.35} />
                        <span>{link.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </details>
            );
          }

          return item.modal ? (
            <CoinTopupLink key={item.href} className={itemClass} onClick={closeMenu}>
              {Icon ? <Icon aria-hidden="true" size={16} strokeWidth={2.4} /> : null}
              <span>{item.label}</span>
            </CoinTopupLink>
          ) : (
            <Link key={item.href} href={item.href} className={itemClass} prefetch={false} onClick={closeMenu}>
              {Icon ? <Icon aria-hidden="true" size={16} strokeWidth={2.4} /> : null}
              <span>{item.label}</span>
            </Link>
          );
        })}
        <details className="mobile-lookup-group">
          <summary className="mobile-menu-link rounded-xl px-3 py-2.5 text-sm font-semibold text-stone-700">
            <Search aria-hidden="true" size={16} strokeWidth={2.4} />
            <span>Tra cứu</span>
            <ChevronDown aria-hidden="true" size={15} />
          </summary>
          <div>
            {lookupLinks.map((item) => (
              <Link key={item.href} href={item.href} prefetch={false} onClick={closeMenu}>
                {item.label}
              </Link>
            ))}
          </div>
        </details>
      </div>
    </details>
  );
}
