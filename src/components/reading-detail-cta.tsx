"use client";

import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import { loginModalHref } from "@/components/login-modal-link";
import { PREMIUM_READING_HASH, PREMIUM_READING_TARGET_ID } from "@/components/premium-reading-target";

function preferredScrollBehavior(): ScrollBehavior {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
}

export function scrollToPremiumReading(behavior = preferredScrollBehavior()) {
  document.getElementById(PREMIUM_READING_TARGET_ID)?.scrollIntoView({
    behavior,
    block: "start",
  });
}

export function ReadingHashScrollRestorer() {
  useEffect(() => {
    if (window.location.hash !== PREMIUM_READING_HASH) return;

    let active = true;
    let firstScroll = true;
    let frameId = 0;

    function alignTarget() {
      if (!active) return;
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        scrollToPremiumReading(firstScroll ? preferredScrollBehavior() : "auto");
        firstScroll = false;
      });
    }

    const observer = new ResizeObserver(alignTarget);
    observer.observe(document.body);

    function cancelRestoration() {
      if (!active) return;
      active = false;
      observer.disconnect();
      cancelAnimationFrame(frameId);
      window.clearTimeout(stopTimer);
      window.removeEventListener("wheel", cancelRestoration);
      window.removeEventListener("touchstart", cancelRestoration);
      window.removeEventListener("pointerdown", cancelRestoration);
      window.removeEventListener("keydown", cancelRestoration);
    }

    window.addEventListener("wheel", cancelRestoration, { passive: true, once: true });
    window.addEventListener("touchstart", cancelRestoration, { passive: true, once: true });
    window.addEventListener("pointerdown", cancelRestoration, { passive: true, once: true });
    window.addEventListener("keydown", cancelRestoration, { once: true });

    const stopTimer = window.setTimeout(cancelRestoration, 4000);
    alignTarget();

    return cancelRestoration;
  }, []);

  return null;
}

export function ReadingDetailCta({
  chartId,
  isSignedIn,
  children,
}: {
  chartId: string;
  isSignedIn: boolean;
  children: ReactNode;
}) {
  const chartPath = `/la-so/${chartId}`;
  const nextPath = `${chartPath}${PREMIUM_READING_HASH}`;

  if (!isSignedIn) {
    return (
      <Link className="btn btn-small btn-primary" href={loginModalHref(chartPath, undefined, nextPath)} scroll={false}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className="btn btn-small btn-primary" onClick={() => scrollToPremiumReading()}>
      {children}
    </button>
  );
}
