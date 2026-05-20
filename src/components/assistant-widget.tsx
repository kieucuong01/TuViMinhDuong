"use client";

import { Bot, Loader2, Send, X } from "lucide-react";
import { useState, useTransition } from "react";

const starterQuestions = [
  "Tóm tắt điểm mạnh của lá số này",
  "Năm nay nên chú ý điều gì?",
  "Cung Quan Lộc nói gì về công việc?",
];

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export function AssistantWidget({ chartId }: { chartId: string }) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Mình có thể đọc nhanh lá số này và gợi ý bạn nên xem phần nào trước.",
    },
  ]);
  const [isPending, startTransition] = useTransition();

  function ask(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    setQuestion("");
    setMessages((current) => [...current, { role: "user", content: trimmed }]);
    startTransition(async () => {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chartId, question: trimmed }),
      });
      const data = await response.json();
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: data.answer || "Mình chưa đọc được phần này. Bạn thử hỏi ngắn hơn nhé.",
        },
      ]);
    });
  }

  return (
    <div className="fixed bottom-5 right-4 z-50 sm:right-6">
      {open ? (
        <section className="assistant-panel">
          <header className="flex items-center justify-between border-b border-orange-100 p-4">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-2xl bg-orange-100 text-orange-700">
                <Bot size={19} />
              </span>
              <div>
                <h2 className="text-sm font-black text-stone-950">Trợ lý Tử Vi</h2>
                <p className="text-xs text-stone-500">Hỏi nhanh theo lá số hiện tại</p>
              </div>
            </div>
            <button className="icon-button" type="button" aria-label="Đóng trợ lý" onClick={() => setOpen(false)}>
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
                <Loader2 className="animate-spin" size={15} /> Đang luận nhanh...
              </div>
            ) : null}
          </div>

          <div className="grid gap-2 px-4 pb-3">
            {starterQuestions.map((item) => (
              <button key={item} type="button" className="assistant-suggestion" onClick={() => ask(item)}>
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
            <input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Nhập câu hỏi của bạn..." />
            <button className="btn btn-primary aspect-square px-0" type="submit" aria-label="Gửi câu hỏi">
              <Send size={17} />
            </button>
          </form>
        </section>
      ) : (
        <button className="assistant-fab" type="button" onClick={() => setOpen(true)}>
          <Bot size={22} />
          Trợ lý Tử Vi
        </button>
      )}
    </div>
  );
}
