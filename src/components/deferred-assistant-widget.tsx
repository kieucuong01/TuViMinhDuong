"use client";

import dynamic from "next/dynamic";
import { Bot } from "lucide-react";
import { useEffect, useState } from "react";

const AssistantWidget = dynamic(
  () => import("@/components/assistant-widget").then((mod) => mod.AssistantWidget),
  {
    ssr: false,
    loading: () => (
      <div className="fixed bottom-5 right-4 z-50 sm:right-6">
        <button className="assistant-fab" type="button" disabled>
          <Bot size={22} />
          Trợ lý Tử Vi
        </button>
      </div>
    ),
  },
);

export function DeferredAssistantWidget({ chartId }: { chartId: string }) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setEnabled(true), 2500);
    return () => window.clearTimeout(timer);
  }, []);

  return enabled ? <AssistantWidget chartId={chartId} /> : null;
}
