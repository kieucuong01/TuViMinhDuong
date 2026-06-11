"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Coins, FileText, LogOut, ShieldCheck, UserCircle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { fetchClientSession, notifyClientSessionChanged, onClientSessionChanged, type ClientSessionUser } from "@/components/client-user-session";
import { loginModalHref } from "@/components/login-modal-link";
import { useCloseDetailsOnOutsideClick } from "@/components/use-close-details-on-outside-click";
import { formatCoins } from "@/lib/format";

export function UserHeaderBadge() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<ClientSessionUser | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const hasFetchedRef = useRef(false);
  const requestSeqRef = useRef(0);
  const detailsRef = useRef<HTMLDetailsElement>(null);
  useCloseDetailsOnOutsideClick(detailsRef);

  function refreshSession(force = false) {
    const requestId = ++requestSeqRef.current;
    fetchClientSession({ force })
      .then((data) => {
        if (requestSeqRef.current !== requestId) return;
        setUser(data.user || null);
        setLoaded(true);
      })
      .catch(() => {
        if (requestSeqRef.current !== requestId) return;
        setLoaded(true);
      });
  }

  useEffect(() => {
    const force = hasFetchedRef.current;
    hasFetchedRef.current = true;
    refreshSession(force);
  }, [pathname, searchParams]);

  useEffect(() => {
    if (detailsRef.current?.open) detailsRef.current.open = false;
  }, [pathname, searchParams]);

  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === "visible") refreshSession(true);
    }

    const onFocus = () => refreshSession(true);
    const unsubscribeSession = onClientSessionChanged(() => refreshSession(true));

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      unsubscribeSession();
    };
  }, []);

  const loginHref = useMemo(() => {
    if (pathname.startsWith("/dang-nhap")) return "/dang-nhap";
    const params = new URLSearchParams(searchParams.toString());
    ["login", "next", "authError"].forEach((key) => params.delete(key));
    const returnTo = `${pathname}${params.toString() ? `?${params}` : ""}`;
    return loginModalHref(pathname, searchParams, returnTo);
  }, [pathname, searchParams]);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Logout failed with status ${response.status}`);
      }

      notifyClientSessionChanged();
      setUser(null);
      setLoaded(true);
      if (detailsRef.current) detailsRef.current.open = false;
      router.refresh();
    } catch {
      refreshSession(true);
    } finally {
      setLoggingOut(false);
    }
  }

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
          <button
            type="button"
            className={`user-account-menu-button ${loggingOut ? "is-loading" : ""}`.trim()}
            data-loading-message="Đang đăng xuất..."
            onClick={() => {
              void handleLogout();
            }}
            disabled={loggingOut}
            aria-busy={loggingOut}
          >
            {loggingOut ? "Đang thoát..." : (
              <>
                <LogOut size={15} /> Đăng xuất
              </>
            )}
          </button>
        </div>
      </details>
    </div>
  );
}
