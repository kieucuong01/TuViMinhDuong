"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronDown, Coins, FileText, LogOut, ShieldCheck, UserCircle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { logoutAction } from "@/app/actions";
import { loginModalHref } from "@/components/login-modal-link";
import { LoadingSubmitButton } from "@/components/loading-submit-button";
import { useCloseDetailsOnOutsideClick } from "@/components/use-close-details-on-outside-click";
import { fetchClientSession, type ClientSessionUser } from "@/components/client-user-session";
import { formatCoins } from "@/lib/format";

export function UserHeaderBadge() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<ClientSessionUser | null>(null);
  const [loaded, setLoaded] = useState(false);
  const hasFetchedRef = useRef(false);
  const detailsRef = useRef<HTMLDetailsElement>(null);
  useCloseDetailsOnOutsideClick(detailsRef);

  useEffect(() => {
    let cancelled = false;
    const force = hasFetchedRef.current;
    hasFetchedRef.current = true;
    fetchClientSession({ force })
      .then((data) => {
        if (cancelled) return;
        setUser(data.user || null);
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname, searchParams]);

  useEffect(() => {
    if (detailsRef.current?.open) detailsRef.current.open = false;
  }, [pathname, searchParams]);

  useEffect(() => {
    function refreshUser() {
      fetchClientSession({ force: true })
        .then((data) => {
          setUser(data.user || null);
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
      <Link href={loginHref} className="login-link btn btn-small btn-ghost" aria-label="Tài khoản" title="Tài khoản" prefetch={false}>
        <UserCircle size={16} />
        <span>Đăng nhập</span>
      </Link>
    );
  }

  const coinLabel = formatCoins(user.coinBalance ?? 0);

  return (
    <div className="user-header-badge">
      <Link href="/la-so" className="user-charts-pill" title="Lá số của tôi" aria-label="Lá số của tôi" prefetch={false}>
        <FileText size={15} />
        <span className="user-charts-label">Lá số</span>
      </Link>
      <Link href="/nap-xu" className="user-coin-pill" title={`Số dư ${coinLabel}. Bấm để nạp xu`} aria-label={`Số dư ${coinLabel}. Nạp xu`} prefetch={false}>
        <Coins size={15} aria-hidden="true" />
        <span>{coinLabel}</span>
      </Link>
      <details ref={detailsRef} className="user-account-menu">
        <summary className="user-name-pill" title={user.name || user.email} aria-label={`Tài khoản ${user.name || user.email}`}>
          <UserCircle size={16} />
          <span className="user-account-value">{user.name || user.email}</span>
          <span className="user-account-mobile-coins">{coinLabel}</span>
          {user.role === "ADMIN" ? <ShieldCheck className="user-admin-mini" size={14} aria-label="Admin" /> : null}
          <ChevronDown className="user-account-chevron" size={14} />
        </summary>
        <div className="user-account-popover">
          <Link href="/la-so" prefetch={false}>
            <FileText size={15} /> Lá số của tôi
          </Link>
          <Link href="/nap-xu" prefetch={false}>
            <Coins size={15} /> Nạp xu <span className="user-account-popover-value">{coinLabel}</span>
          </Link>
          {user.role === "ADMIN" ? (
            <Link href="/admin" prefetch={false}>
              <ShieldCheck size={15} /> Admin
            </Link>
          ) : null}
          <form action={logoutAction} className="user-account-logout-form" data-loading-message="Đang đăng xuất...">
            <LoadingSubmitButton className="user-account-menu-button" loadingText="Đang thoát...">
              <LogOut size={15} /> Đăng xuất
            </LoadingSubmitButton>
          </form>
        </div>
      </details>
    </div>
  );
}
