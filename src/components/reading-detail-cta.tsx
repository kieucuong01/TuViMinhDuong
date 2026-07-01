"use client";

import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import { loginModalHref } from "@/components/login-modal-link";
import { PREMIUM_READING_HASH, PREMIUM_READING_TARGET_ID } from "@/components/premium-reading-target";

function preferredScrollBehavior(): ScrollBehavior {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
}

export function scrollToPremiumReading() {
  document.getElementById(PREMIUM_READING_TARGET_ID)?.scrollIntoView({
    behavior: preferredScrollBehavior(),
    block: "start",
  });
}

export function ReadingHashScrollRestorer() {
  useEffect(() => {
    if (window.location.hash !== PREMIUM_READING_HASH) return;
    requestAnimationFrame(scrollToPremiumReading);
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
    <button type="button" className="btn btn-small btn-primary" onClick={scrollToPremiumReading}>
      {children}
    </button>
  );
}
