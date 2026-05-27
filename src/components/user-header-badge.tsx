"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronDown, Coins, FileText, LogOut, ShieldCheck, UserCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { logoutAction } from "@/app/actions";
import { CoinTopupLink } from "@/components/coin-topup-link";
import { loginModalHref } from "@/components/login-modal-link";
import { LoadingSubmitButton } from "@/components/loading-submit-button";

type HeaderUser = {
  id: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN";
  coinBalance: number;
};

type HeaderOperationSettings = {
  paymentsEnabled: boolean;
  coinTopupEnabled: boolean;
  paidReadingsEnabled: boolean;
};

export function UserHeaderBadge() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<HeaderUser | null>(null);
  const [temporaryFullAccess, setTemporaryFullAccess] = useState(false);
  const [operationSettings, setOperationSettings] = useState<HeaderOperationSettings | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/me", { credentials: "same-origin", cache: "no-store", signal: controller.signal })
      .then((response) => response.json())
      .then((data) => {
        setUser(data.user || null);
        setTemporaryFullAccess(Boolean(data.temporaryFullAccess));
        setOperationSettings(data.operationSettings || null);
        setLoaded(true);
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoaded(true);
      });
    return () => {
      controller.abort();
    };
  }, [pathname, searchParams]);

  useEffect(() => {
    function refreshUser() {
      fetch("/api/me", { credentials: "same-origin", cache: "no-store" })
        .then((response) => response.json())
        .then((data) => {
          setUser(data.user || null);
          setTemporaryFullAccess(Boolean(data.temporaryFullAccess));
          setOperationSettings(data.operationSettings || null);
          setLoaded(true);
        })
        .catch(() => setLoaded(true));
    }

    function onVisibilityChange() {
      if (document.visibilityState === "visible") refreshUser();
    }

    const onFocus = refreshUser;

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  const loginHref = useMemo(() => {
    if (pathname.startsWith("/dang-nhap")) return "/dang-nhap";
    const params = new URLSearchParams(searchParams.toString());
    ["login", "next", "authError"].forEach((key) => params.delete(key));
    const returnTo = `${pathname}${params.toString() ? `?${params}` : ""}`;
    return loginModalHref(pathname, searchParams, returnTo);
  }, [pathname, searchParams]);

  if (!loaded) {
    return (
      <div className="user-header-skeleton" aria-hidden="true">
        <span />
      </div>
    );
  }

  if (!user) {
    return (
      <Link href={loginHref} className="login-link btn btn-small btn-ghost" prefetch={false}>
        Đăng nhập
      </Link>
    );
  }

  const canTopUp = Boolean(operationSettings?.paymentsEnabled && operationSettings.coinTopupEnabled);

  return (
    <div className="user-header-badge">
      {temporaryFullAccess || !canTopUp ? (
        <span className="user-coin-pill free"><Coins size={15} /> Cơ bản</span>
      ) : (
        <CoinTopupLink className="user-coin-pill" aria-label="Nạp xu nhanh">
          <Coins size={15} /> {user.coinBalance} xu
        </CoinTopupLink>
      )}
      <Link href="/la-so" className="user-charts-pill" title="Lá số của tôi" aria-label="Lá số của tôi" prefetch={false}>
        <FileText size={15} />
        Lá số
      </Link>
      <details className="user-account-menu">
        <summary className="user-name-pill" title={user.name || user.email} aria-label={`Tài khoản ${user.name || user.email}`}>
          <UserCircle size={16} />
          <span className="user-account-value">{user.name || user.email}</span>
          {user.role === "ADMIN" ? <ShieldCheck className="user-admin-mini" size={14} aria-label="Admin" /> : null}
          <ChevronDown size={14} />
        </summary>
        <div className="user-account-popover">
          <Link href="/la-so" prefetch={false}>
            <FileText size={15} /> Lá số của tôi
          </Link>
          {user.role === "ADMIN" ? (
            <Link href="/admin" prefetch={false}>
              <ShieldCheck size={15} /> Admin
            </Link>
          ) : null}
          <form action={logoutAction} data-loading-message="Đang đăng xuất...">
            <LoadingSubmitButton className="user-account-menu-button" loadingText="Đang thoát...">
              <LogOut size={15} /> Đăng xuất
            </LoadingSubmitButton>
          </form>
        </div>
      </details>
    </div>
  );
}
