"use client";

import { MessageCircle, ThumbsDown, ThumbsUp } from "lucide-react";
import { useState } from "react";

export function FeedbackActions({ label = "đoạn luận" }: { label?: string }) {
  const [state, setState] = useState<"like" | "dislike" | "comment" | null>(null);

  return (
    <div className="mt-5 flex items-center justify-center gap-2 border-t border-orange-100 pt-4 text-stone-500">
      <button
        type="button"
        aria-label={`Thích ${label}`}
        className={state === "like" ? "feedback-button active" : "feedback-button"}
        onClick={() => setState("like")}
      >
        <ThumbsUp size={16} />
      </button>
      <button
        type="button"
        aria-label={`Không thích ${label}`}
        className={state === "dislike" ? "feedback-button active" : "feedback-button"}
        onClick={() => setState("dislike")}
      >
        <ThumbsDown size={16} />
      </button>
      <button
        type="button"
        aria-label={`Góp ý ${label}`}
        className={state === "comment" ? "feedback-button active" : "feedback-button"}
        onClick={() => setState("comment")}
      >
        <MessageCircle size={16} />
      </button>
      {state ? <span className="ml-2 text-xs font-semibold text-emerald-700">Đã ghi nhận phản hồi</span> : null}
    </div>
  );
}
