"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { BookOpenText, CalendarDays, Coins, FileText, LogOut, Sparkles, UserCircle, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { logoutAction } from "@/app/actions";
import { loginModalHref } from "@/components/login-modal-link";
import { LoadingSubmitButton } from "@/components/loading-submit-button";
import { formatCoins } from "@/lib/format";

type MobileNavUser = {
  id: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN";
  coinBalance: number;
};

function activeFor(pathname: string, href: string) {
  if (href === "/") return pathname === "/" || pathname.startsWith("/la-so");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<MobileNavUser | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [accountSheet, setAccountSheet] = useState({ open: false, routeKey: "" });
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const accountOpen = accountSheet.open && accountSheet.routeKey === routeKey;

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/me", { credentials: "same-origin", cache: "no-store", signal: controller.signal })
      .then((response) => response.json())
      .then((data) => {
        setUser(data.user || null);
        setLoaded(true);
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoaded(true);
      });

    return () => controller.abort();
  }, [pathname, searchParams]);

  const loginHref = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    ["login", "next", "authError"].forEach((key) => params.delete(key));
    const returnTo = `${pathname}${params.toString() ? `?${params}` : ""}`;
    return loginModalHref(pathname, searchParams, returnTo);
  }, [pathname, searchParams]);

  const chartHref = user ? "/la-so" : "/#lap-la-so";
  const coinLabel = formatCoins(user?.coinBalance ?? 0);

  return (
    <>
      {accountOpen ? <button type="button" className="mobile-account-backdrop" aria-label="Đóng tài khoản" onClick={() => setAccountSheet({ open: false, routeKey })} /> : null}
      {accountOpen && user ? (
        <section id="mobile-account-sheet" className="mobile-account-sheet" aria-label="Tài khoản">
          <div className="mobile-account-sheet-head">
            <div>
              <span>Tài khoản</span>
              <strong>{user.name || user.email}</strong>
            </div>
            <button type="button" aria-label="Đóng tài khoản" onClick={() => setAccountSheet({ open: false, routeKey })}>
              <X size={18} />
            </button>
          </div>
          <Link href="/la-so" prefetch={false}>
            <FileText size={18} /> Lá số đã lưu
          </Link>
          <Link href="/nap-xu" prefetch={false}>
            <Coins size={18} /> Nạp xu <span>{coinLabel}</span>
          </Link>
          <form action={logoutAction} className="mobile-account-logout-form" data-loading-message="Đang đăng xuất...">
            <LoadingSubmitButton loadingText="Đang thoát...">
              <LogOut size={18} /> Đăng xuất
            </LoadingSubmitButton>
          </form>
        </section>
      ) : null}

      <nav className="mobile-bottom-nav" aria-label="Điều hướng chính trên điện thoại" data-testid="mobile-bottom-nav">
        <Link href={chartHref} className={activeFor(pathname, "/") ? "is-active" : ""} prefetch={false}>
          <Sparkles size={20} />
          <span>Lá số</span>
        </Link>
        <Link href="/xem-ngay" className={activeFor(pathname, "/xem-ngay") ? "is-active" : ""} prefetch={false}>
          <CalendarDays size={20} />
          <span>Xem ngày</span>
        </Link>
        <Link href="/kien-thuc-tu-vi" className={activeFor(pathname, "/kien-thuc-tu-vi") ? "is-active" : ""} prefetch={false}>
          <BookOpenText size={20} />
          <span>Kiến thức</span>
        </Link>
        {!loaded ? (
          <button type="button" aria-label="Đang tải tài khoản" disabled>
            <UserCircle size={20} />
            <span>Tài khoản</span>
          </button>
        ) : user ? (
          <button
            type="button"
            className={accountOpen ? "is-active" : ""}
            aria-expanded={accountOpen}
            aria-controls="mobile-account-sheet"
            onClick={() => setAccountSheet((value) => ({ open: value.routeKey === routeKey ? !value.open : true, routeKey }))}
          >
            <UserCircle size={20} />
            <span>Tài khoản</span>
          </button>
        ) : (
          <Link href={loginHref} prefetch={false}>
            <UserCircle size={20} />
            <span>Tài khoản</span>
          </Link>
        )}
      </nav>
    </>
  );
}
