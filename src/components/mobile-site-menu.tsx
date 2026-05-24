"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useEffect, useRef } from "react";
import { CoinTopupLink } from "@/components/coin-topup-link";

type MobileSiteMenuItem = {
  href: string;
  label: string;
  modal?: boolean;
};

type MobileSiteMenuProps = {
  items: MobileSiteMenuItem[];
};

export function MobileSiteMenu({ items }: MobileSiteMenuProps) {
  const pathname = usePathname();
  const detailsRef = useRef<HTMLDetailsElement>(null);

  const closeMenu = () => {
    if (detailsRef.current?.open) detailsRef.current.open = false;
  };

  useEffect(() => {
    closeMenu();
  }, [pathname]);

  return (
    <details ref={detailsRef} className="relative lg:hidden">
      <summary className="icon-button list-none" aria-label="Mở menu">
        <Menu size={20} />
      </summary>
      <div className="absolute right-0 mt-3 grid w-60 gap-1 rounded-2xl border border-orange-100 bg-white/95 p-2 shadow-2xl shadow-orange-950/10 backdrop-blur-xl">
        {items.map((item) =>
          item.modal ? (
            <CoinTopupLink key={item.href} className="rounded-xl px-3 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-orange-50 hover:text-orange-700" onClick={closeMenu}>
              {item.label}
            </CoinTopupLink>
          ) : (
            <Link key={item.href} href={item.href} className="rounded-xl px-3 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-orange-50 hover:text-orange-700" prefetch={false} onClick={closeMenu}>
              {item.label}
            </Link>
          )
        )}
      </div>
    </details>
  );
}
