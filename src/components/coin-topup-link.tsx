"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";
import { topupHref } from "@/components/coin-topup-modal";

type CoinTopupLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  need?: number;
};

export function CoinTopupLink({ need, children, ...props }: CoinTopupLinkProps) {
  const router = useRouter();

  return (
    <Link
      {...props}
      href="/nap-xu"
      prefetch={false}
      onClick={(event) => {
        props.onClick?.(event);
        if (event.defaultPrevented) return;
        event.preventDefault();
        const href = topupHref(window.location.pathname, window.location.search, need ? { need } : undefined);
        router.push(href, { scroll: false });
      }}
    >
      {children}
    </Link>
  );
}
