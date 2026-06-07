"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchClientSession } from "@/components/client-user-session";

export function FooterAccountPolicyLink() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchClientSession()
      .then((data) => {
        if (!cancelled) setIsLoggedIn(Boolean(data.user));
      })
      .catch(() => {
        if (!cancelled) setIsLoggedIn(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!isLoggedIn) return null;

  return (
    <li>
      <Link href="/chinh-sach-thanh-toan-hoan-xu" prefetch={false}>Thanh toán và hoàn xu</Link>
    </li>
  );
}
