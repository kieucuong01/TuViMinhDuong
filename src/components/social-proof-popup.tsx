"use client";

import Link from "next/link";
import { Sparkles, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

const FIRST_DELAY_MS = 18000;
const CHART_DELAY_MS = 45000;
const LOOP_DELAY_MS = 120000;
const VISIBLE_MS = 11500;
const PAUSE_AFTER_SUBMIT_MS = 24000;

const names = [
  "maih***nh@gmail.com",
  "linh***1996@gmail.com",
  "duc***tran@gmail.com",
  "ngoc***anh@gmail.com",
  "hieu***88@gmail.com",
  "thu***mai@gmail.com",
];

const contextActions = {
  chart: [
    "vừa đọc Luận cung Mệnh",
    "vừa xem Đại vận 10 năm",
    "vừa mở Nguyệt vận tháng này",
    "vừa xem tổng quan luận giải lá số",
  ],
  date: [
    "vừa xem ngày tốt xấu hôm nay",
    "vừa tra giờ hoàng đạo",
    "vừa xem Nhật vận cá nhân",
  ],
  knowledge: [
    "vừa đọc bài về Cung Mệnh",
    "vừa xem kiến thức Đại vận",
    "vừa lưu bài viết tử vi ứng dụng",
  ],
  home: [
    "vừa lập lá số tử vi",
    "vừa đọc luận giải chuyên sâu",
    "vừa tạo lá số mới",
  ],
};

function pickRandom(items: string[]) {
  return items[Math.floor(Math.random() * items.length)] || items[0];
}

function getContext(pathname: string) {
  if (pathname.startsWith("/la-so/")) return "chart";
  if (pathname.startsWith("/xem-ngay")) return "date";
  if (pathname.startsWith("/kien-thuc-tu-vi")) return "knowledge";
  return "home";
}

function getHref(context: keyof typeof contextActions) {
  if (context === "date") return "/xem-ngay";
  if (context === "knowledge") return "/kien-thuc-tu-vi";
  return "/#lap-la-so";
}

export function SocialProofPopup() {
  const pathname = usePathname();
  const context = getContext(pathname);
  const [visible, setVisible] = useState(false);
  const [dismissedUntilNext, setDismissedUntilNext] = useState(false);
  const [event, setEvent] = useState({ email: names[0], action: contextActions[context][0] });
  const pauseUntilRef = useRef(0);

  const schedule = useMemo(() => ({
    first: context === "chart" ? CHART_DELAY_MS : FIRST_DELAY_MS,
    loop: LOOP_DELAY_MS,
    visible: VISIBLE_MS,
  }), [context]);

  useEffect(() => {
    function pauseForSubmit() {
      pauseUntilRef.current = Date.now() + PAUSE_AFTER_SUBMIT_MS;
      setVisible(false);
    }

    document.addEventListener("submit", pauseForSubmit);
    return () => document.removeEventListener("submit", pauseForSubmit);
  }, []);

  useEffect(() => {
    if (pathname.startsWith("/admin") || pathname.startsWith("/dang-nhap")) return;

    let hideTimer: ReturnType<typeof setTimeout> | undefined;

    function showPopup() {
      const isPaused = Date.now() < pauseUntilRef.current;
      const hasLoadingToast = Boolean(document.querySelector(".global-loading-toast"));
      const assistantOpen = Boolean(document.querySelector(".assistant-panel"));
      if (dismissedUntilNext || isPaused || hasLoadingToast || assistantOpen) return;

      setEvent({ email: pickRandom(names), action: pickRandom(contextActions[context]) });
      setVisible(true);
      hideTimer = setTimeout(() => setVisible(false), schedule.visible);
    }

    const firstTimer = setTimeout(showPopup, schedule.first);
    const interval = setInterval(() => {
      setDismissedUntilNext(false);
      showPopup();
    }, schedule.loop);

    return () => {
      clearTimeout(firstTimer);
      clearInterval(interval);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [context, dismissedUntilNext, pathname, schedule]);

  if (!visible) return null;

  return (
    <aside className="social-proof-popup" aria-live="polite">
      <div className="social-proof-icon" aria-hidden="true">
        <Sparkles size={18} />
      </div>
      <div className="social-proof-body">
        <p className="social-proof-email">{event.email}</p>
        <div className="social-proof-action-row">
          <p>{event.action}</p>
          <Link className="social-proof-cta" href={getHref(context)} onClick={() => setVisible(false)}>
            Xem ngay
          </Link>
        </div>
      </div>
      <button
        className="social-proof-close"
        type="button"
        aria-label="Đóng thông báo"
        onClick={() => {
          setVisible(false);
          setDismissedUntilNext(true);
        }}
      >
        <X size={18} />
      </button>
    </aside>
  );
}
