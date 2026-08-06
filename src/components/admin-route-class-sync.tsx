"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function AdminRouteClassSync() {
  const pathname = usePathname();

  useEffect(() => {
    const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
    document.documentElement.classList.toggle("admin-route", isAdminRoute);
    return () => {
      if (isAdminRoute) document.documentElement.classList.remove("admin-route");
    };
  }, [pathname]);

  return null;
}
