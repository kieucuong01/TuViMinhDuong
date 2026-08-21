"use client";

import { useState } from "react";

import type { AiDiscoveryPlatform, AiDiscoverySource } from "@/lib/ai-discovery";

type AiDiscoverySurveyProps = {
  chartId: string;
};

const sources: Array<{ value: AiDiscoverySource; label: string }> = [
  { value: "ai", label: "ChatGPT hoặc trợ lý AI" },
  { value: "organic_search", label: "Google hoặc công cụ tìm kiếm" },
  { value: "youtube", label: "YouTube" },
  { value: "facebook", label: "Facebook" },
  { value: "friend", label: "Bạn bè/người quen" },
  { value: "other", label: "Nguồn khác" },
];

const platforms: Array<{ value: AiDiscoveryPlatform; label: string }> = [
  { value: "chatgpt", label: "ChatGPT" },
  { value: "gemini", label: "Gemini" },
  { value: "claude", label: "Claude" },
  { value: "perplexity", label: "Perplexity" },
  { value: "other", label: "AI khác" },
];

export function AiDiscoverySurvey({ chartId }: AiDiscoverySurveyProps) {
  const [source, setSource] = useState<AiDiscoverySource | "">("");
  const [aiPlatform, setAiPlatform] = useState<AiDiscoveryPlatform>("chatgpt");
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  if (status === "saved") {
    return (
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900" aria-live="polite">
        Cảm ơn bạn. Phản hồi này giúp Lá Số Tinh Hoa cải thiện nội dung cho những người tìm qua AI và các kênh khác.
      </section>
    );
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!source || status === "saving") return;
    setStatus("saving");
    const payload = source === "ai"
      ? { chartId, source, aiPlatform, ...(prompt.trim() ? { prompt: prompt.trim() } : {}) }
      : { chartId, source };

    try {
      const response = await fetch("/api/analytics/ai-discovery", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });
      setStatus(response.ok ? "saved" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm" aria-labelledby="ai-discovery-survey-title">
      <p className="eyebrow">Một câu ngắn để cải thiện trải nghiệm</p>
      <h2 id="ai-discovery-survey-title" className="mt-1 text-lg font-bold text-stone-900">Bạn biết Lá Số Tinh Hoa qua đâu?</h2>
      <form className="mt-3 space-y-3" onSubmit={submit}>
        <label className="block text-sm font-semibold text-stone-700" htmlFor="ai-discovery-source">
          Nguồn bạn biết đến trang
          <select
            id="ai-discovery-source"
            className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-base font-normal"
            value={source}
            onChange={(event) => setSource(event.target.value as AiDiscoverySource | "")}
            required
          >
            <option value="" disabled>Chọn một nguồn</option>
            {sources.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>

        {source === "ai" ? (
          <>
            <label className="block text-sm font-semibold text-stone-700" htmlFor="ai-discovery-platform">
              Bạn dùng AI nào?
              <select
                id="ai-discovery-platform"
                className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-base font-normal"
                value={aiPlatform}
                onChange={(event) => setAiPlatform(event.target.value as AiDiscoveryPlatform)}
              >
                {platforms.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>
            <label className="block text-sm font-semibold text-stone-700" htmlFor="ai-discovery-prompt">
              Nếu còn nhớ, bạn đã hỏi AI câu gì? <span className="font-normal text-stone-500">(không bắt buộc)</span>
              <textarea
                id="ai-discovery-prompt"
                className="mt-1 min-h-20 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-base font-normal"
                value={prompt}
                maxLength={500}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Ví dụ: web lập lá số tử vi miễn phí nào dễ hiểu?"
              />
            </label>
            <p className="text-xs leading-5 text-stone-500">Không nhập họ tên, ngày/giờ sinh, số điện thoại hoặc email.</p>
          </>
        ) : null}

        {status === "error" ? <p className="text-sm text-red-700" role="alert">Chưa lưu được phản hồi. Bạn có thể thử lại, việc xem lá số không bị ảnh hưởng.</p> : null}
        <button className="btn btn-ghost" type="submit" disabled={!source || status === "saving"}>
          {status === "saving" ? "Đang gửi..." : "Gửi phản hồi"}
        </button>
      </form>
    </section>
  );
}
