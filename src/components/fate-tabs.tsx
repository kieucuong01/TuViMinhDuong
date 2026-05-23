"use client";

import Link from "next/link";
import { useEffect } from "react";

export type FateView = "la-so" | "luan-cung" | "dai-van" | "tieu-van" | "nguyet-van" | "nhat-van" | "chuyen-de";

const tabs: { key: FateView; label: string }[] = [
  { key: "la-so", label: "Lá số" },
  { key: "luan-cung", label: "Luận cung" },
  { key: "dai-van", label: "Đại vận" },
  { key: "tieu-van", label: "Tiểu vận" },
  { key: "nguyet-van", label: "Nguyệt vận" },
  { key: "nhat-van", label: "Nhật vận" },
  { key: "chuyen-de", label: "Chuyên đề" },
];

export function FateTabs({ chartId, active }: { chartId: string; active: FateView }) {
  useEffect(() => {
    const scroller = document.querySelector<HTMLElement>(".chart-tabbar");
    const activeNode = scroller?.querySelector<HTMLElement>(".chart-tab.active");
    if (!activeNode || !scroller) return;
    scroller.scrollTo({
      left: activeNode.offsetLeft - scroller.clientWidth / 2 + activeNode.clientWidth / 2,
      behavior: "auto",
    });
  }, [active]);

  return (
    <nav className="chart-tabbar" aria-label="Các mục lá số">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.key === "la-so" ? `/la-so/${chartId}` : `/la-so/${chartId}?view=${tab.key}`}
          className={active === tab.key ? "chart-tab active" : "chart-tab"}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
