"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenText, CalendarDays, ChevronDown, Menu, Search, Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";
import { CoinTopupLink } from "@/components/coin-topup-link";
import { useCloseDetailsOnOutsideClick } from "@/components/use-close-details-on-outside-click";

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
