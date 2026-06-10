"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchClientSession, onClientSessionChanged } from "@/components/client-user-session";

export function FooterAccountPolicyLink() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const refresh = () =>
      fetchClientSession({ force: true })
      .then((data) => {
        if (!cancelled) setIsLoggedIn(Boolean(data.user));
      })
      .catch(() => {
        if (!cancelled) setIsLoggedIn(false);
      });

    refresh();
    const unsubscribeSession = onClientSessionChanged(refresh);

    return () => {
      cancelled = true;
      unsubscribeSession();
    };
  }, []);

  if (!isLoggedIn) return null;

  return (
    <li>
      <Link href="/chinh-sach-thanh-toan-hoan-xu" prefetch={false}>Thanh toán và hoàn xu</Link>
    </li>
  );
}
