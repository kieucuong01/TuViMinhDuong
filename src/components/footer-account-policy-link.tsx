"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function FooterAccountPolicyLink() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/me", { credentials: "same-origin", cache: "no-store", signal: controller.signal })
      .then((response) => response.json())
      .then((data) => setIsLoggedIn(Boolean(data.user)))
      .catch(() => {
        if (!controller.signal.aborted) setIsLoggedIn(false);
      });

    return () => controller.abort();
  }, []);

  if (!isLoggedIn) return null;

  return (
    <li>
      <Link href="/chinh-sach-thanh-toan-hoan-xu" prefetch={false}>Thanh toán và hoàn xu</Link>
    </li>
  );
}
