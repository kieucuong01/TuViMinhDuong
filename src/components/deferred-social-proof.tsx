"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const SocialProofPopup = dynamic(
  () => import("@/components/social-proof-popup").then((mod) => mod.SocialProofPopup),
  {
    ssr: false,
    loading: () => null,
  },
);

export function DeferredSocialProof() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setEnabled(true), 15000);
    return () => window.clearTimeout(timer);
  }, []);

  return enabled ? <SocialProofPopup /> : null;
}
