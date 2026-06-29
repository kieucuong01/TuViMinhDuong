"use client";

import Link from "next/link";
import { Bot, Loader2, Send, X } from "lucide-react";
import { useState, useTransition } from "react";

const starterQuestions = [
  "Điểm mạnh nào tôi nên dùng nhiều hơn trong công việc?",
  "Tài chính năm nay cần kiểm soát rủi ro gì?",
  "Thời điểm nào trong năm nên đi chậm lại?",
];

export type AssistantHistoryItem = {
  id: string;
  slot: number;
  question: string;
  answer: string | null;
  model: string | null;
};

export type AssistantAccess = {
  status: "login-required" | "full-required" | "ready" | "exhausted";
  remaining: number;
  history: AssistantHistoryItem[];
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function historyMessages(history: AssistantHistoryItem[]): ChatMessage[] {
  return history.flatMap((item) => [
    { role: "user" as const, content: item.question },
    ...(item.answer ? [{ role: "assistant" as const, content: item.answer }] : []),
  ]);
}

function initialMessages(access: AssistantAccess): ChatMessage[] {
  const persisted = historyMessages(access.history);
  if (persisted.length) return persisted;
  if (access.status === "login-required") {
    return [{ role: "assistant", content: "Đăng nhập để mở Hồ sơ VIP và nhận 3 câu hỏi theo đúng lá số của bạn." }];
  }
  if (access.status === "full-required") {
    return [{ role: "assistant", content: "Cố vấn AI là quyền lợi đi kèm Hồ sơ VIP. Sau khi mở hồ sơ, bạn có 3 câu hỏi cho lá số này." }];
  }
  return [{ role: "assistant", content: "Bạn có 3 câu hỏi để làm rõ chính lá số và Hồ sơ VIP này." }];
}

export function AssistantWidget({
  chartId,
  initialAccess,
}: {
  chartId: string;
  initialAccess: AssistantAccess;
}) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [access, setAccess] = useState(initialAccess);
  const [messages, setMessages] = useState<ChatMessage[]>(() => initialMessages(initialAccess));
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const canAsk = access.status === "ready" && access.remaining > 0;

  function ask(value: string) {
    const trimmed = value.trim();
    if (!trimmed || !canAsk) return;
    setError("");
    setQuestion("");
    setMessages((current) => [...current, { role: "user", content: trimmed }]);
    startTransition(async () => {
      try {
        const response = await fetch("/api/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chartId, question: trimmed }),
        });
        const data = (await response.json()) as {
          answer?: string;
          error?: string;
          remaining?: number;
          history?: AssistantHistoryItem[];
        };
        if (!response.ok) throw new Error(data.error || "Không thể gửi câu hỏi lúc này.");

        const nextHistory = data.history || [];
        const remaining = Number(data.remaining ?? Math.max(0, access.remaining - 1));
        setAccess({
          status: remaining > 0 ? "ready" : "exhausted",
          remaining,
          history: nextHistory,
        });
        setMessages(
          nextHistory.length
            ? historyMessages(nextHistory)
            : (current) => [...current, { role: "assistant", content: data.answer || "Chưa có câu trả lời." }],
        );
      } catch (requestError) {
        setQuestion(trimmed);
        setError(requestError instanceof Error ? requestError.message : "Không thể gửi câu hỏi lúc này.");
      }
    });
  }

  return (
    <div className="assistant-widget fixed bottom-5 right-4 z-50 sm:right-6">
      {open ? (
        <section className="assistant-panel">
          <header className="flex items-center justify-between border-b border-orange-100 p-4">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-2xl bg-orange-100 text-orange-700">
                <Bot size={19} />
              </span>
              <div>
                <h2 className="text-sm font-black text-stone-950">Cố vấn AI theo lá số</h2>
                <p className="assistant-quota">Còn {access.remaining}/3 câu hỏi</p>
              </div>
            </div>
            <button className="icon-button" type="button" aria-label="Đóng cố vấn" onClick={() => setOpen(false)}>
              <X size={16} />
            </button>
          </header>

          <div className="max-h-72 space-y-3 overflow-y-auto p-4">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={message.role === "user" ? "chat-bubble user" : "chat-bubble assistant"}>
                {message.content}
              </div>
            ))}
            {isPending ? (
              <div className="chat-bubble assistant inline-flex items-center gap-2">
                <Loader2 className="animate-spin" size={15} /> Đang đối chiếu hồ sơ...
              </div>
            ) : null}
            {error ? <p className="assistant-inline-error" role="alert">{error}</p> : null}
          </div>

          {access.status === "login-required" ? (
            <div className="p-4 pt-0">
              <Link className="btn btn-primary w-full" href={`/dang-nhap?next=${encodeURIComponent(`/la-so/${chartId}`)}`}>
                Đăng nhập để tiếp tục
              </Link>
            </div>
          ) : null}

          {access.status === "full-required" ? (
            <div className="p-4 pt-0">
              <Link className="btn btn-primary w-full" href="#mo-khoa-ho-so-vip" onClick={() => setOpen(false)}>
                Mở Hồ sơ VIP
              </Link>
            </div>
          ) : null}

          {canAsk ? (
            <>
              <div className="grid gap-2 px-4 pb-3">
                {starterQuestions.map((item) => (
                  <button key={item} type="button" className="assistant-suggestion" onClick={() => ask(item)} disabled={isPending}>
                    {item}
                  </button>
                ))}
              </div>

              <form
                data-no-loading-toast="true"
                className="flex gap-2 border-t border-orange-100 p-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  ask(question);
                }}
              >
                <input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Nhập câu hỏi của bạn..." disabled={isPending} />
                <button className="btn btn-primary aspect-square px-0" type="submit" aria-label="Gửi câu hỏi" disabled={isPending || !question.trim()}>
                  {isPending ? <Loader2 className="animate-spin" size={17} /> : <Send size={17} />}
                </button>
              </form>
            </>
          ) : null}

          {access.status === "exhausted" ? (
            <p className="assistant-exhausted">Bạn đã dùng đủ 3 câu hỏi. Các câu trả lời phía trên vẫn được lưu để xem lại.</p>
          ) : null}
        </section>
      ) : (
        <button className="assistant-fab" type="button" onClick={() => setOpen(true)}>
          <Bot size={22} />
          Cố vấn AI {access.status === "ready" ? `· ${access.remaining}/3` : ""}
        </button>
      )}
    </div>
  );
}
