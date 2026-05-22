"use client";

import Link from "next/link";
import { Coins, LogOut, ShieldCheck, UserCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { logoutAction } from "@/app/actions";
import { CoinTopupLink } from "@/components/coin-topup-link";

type HeaderUser = {
  id: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN";
  coinBalance: number;
};

export function UserHeaderBadge() {
  const [user, setUser] = useState<HeaderUser | null>(null);
  const [temporaryFullAccess, setTemporaryFullAccess] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/me", { credentials: "same-origin" })
      .then((response) => response.json())
      .then((data) => {
        if (!active) return;
        setUser(data.user || null);
        setTemporaryFullAccess(Boolean(data.temporaryFullAccess));
        setLoaded(true);
      })
      .catch(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  if (!loaded) {
    return (
      <div className="user-header-skeleton" aria-hidden="true">
        <span />
      </div>
    );
  }

  if (!user) {
    return (
      <Link href="/dang-nhap" className="login-link btn btn-small btn-ghost" prefetch={false}>
        Đăng nhập
      </Link>
    );
  }

  return (
    <div className="user-header-badge">
      {temporaryFullAccess ? (
        <span className="user-coin-pill free"><Coins size={15} /> Miễn phí</span>
      ) : (
        <CoinTopupLink className="user-coin-pill" aria-label="Nạp xu nhanh">
          <Coins size={15} /> {user.coinBalance} xu
        </CoinTopupLink>
      )}
      {user.role === "ADMIN" ? (
        <Link href="/admin" className="user-admin-pill" title="Admin" prefetch={false}>
          <ShieldCheck size={15} /> Admin
        </Link>
      ) : null}
      <Link href="/la-so" className="user-name-pill" prefetch={false}>
        <UserCircle size={16} />
        <span className="user-account-label">Tài khoản</span>
        <span className="user-account-value">{user.name || user.email}</span>
      </Link>
      <form action={logoutAction} data-loading-message="Đang đăng xuất...">
        <button className="icon-button" type="submit" aria-label="Đăng xuất" title="Đăng xuất">
          <LogOut size={17} />
        </button>
      </form>
    </div>
  );
}
