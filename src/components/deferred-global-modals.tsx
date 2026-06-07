"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";

const DynamicCoinTopupModal = dynamic(() => import("@/components/coin-topup-modal").then((mod) => mod.CoinTopupModal), {
  ssr: false,
  loading: () => null,
});

const DynamicLoginModal = dynamic(() => import("@/components/login-modal").then((mod) => mod.LoginModal), {
  ssr: false,
  loading: () => null,
});

export function DeferredGlobalModals({ coinTopupEnabled }: { coinTopupEnabled: boolean }) {
  const searchParams = useSearchParams();
  const showCoinTopup = searchParams.get("topup") === "1" || searchParams.get("paywall") === "coins";
  const showLogin = searchParams.get("login") === "1";

  return (
    <>
      {showCoinTopup ? <DynamicCoinTopupModal enabled={coinTopupEnabled} /> : null}
      {showLogin ? <DynamicLoginModal /> : null}
    </>
  );
}
