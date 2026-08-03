"use client";

import Link from "next/link";
import { useEffect } from "react";

export type FateView = "la-so" | "tai-loc" | "luan-cung" | "dai-van" | "tieu-van" | "nguyet-van" | "nhat-van";

const tabs: { key: FateView; label: string }[] = [
  { key: "la-so", label: "Lá số" },
  { key: "tai-loc", label: "Tài lộc" },
  { key: "luan-cung", label: "Luận cung" },
  { key: "dai-van", label: "Đại vận" },
  { key: "tieu-van", label: "Tiểu vận" },
  { key: "nguyet-van", label: "Nguyệt vận" },
  { key: "nhat-van", label: "Nhật vận" },
];

export function FateTabs({ chartId, active, visibleViews }: { chartId: string; active: FateView; visibleViews: FateView[] }) {
  useEffect(() => {
    const scroller = document.querySelector<HTMLElement>(".chart-tabbar");
    const activeNode = scroller?.querySelector<HTMLElement>(".chart-tab.active");
    if (!activeNode || !scroller) return;
    scroller.scrollTo({
      left: activeNode.offsetLeft - scroller.clientWidth / 2 + activeNode.clientWidth / 2,
      behavior: "auto",
    });
  }, [active, visibleViews]);

  return (
    <nav className="chart-tabbar" aria-label="Các mục lá số">
      {tabs.filter((tab) => visibleViews.includes(tab.key)).map((tab) => (
        <Link
          key={tab.key}
          href={tab.key === "la-so" ? `/la-so/${chartId}` : `/la-so/${chartId}?view=${tab.key}`}
          className={active === tab.key ? "chart-tab active" : "chart-tab"}
          aria-current={active === tab.key ? "page" : undefined}
          prefetch={false}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
