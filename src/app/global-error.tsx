"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    void fetch("/api/telemetry/error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "global_error",
        message: error.message,
        stack: error.stack,
        digest: error.digest,
        path: window.location.pathname,
      }),
      keepalive: true,
    }).catch(() => undefined);
  }, [error]);

  return (
    <html lang="vi">
      <body>
        <main className="mx-auto grid min-h-screen max-w-xl place-items-center px-6 text-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-orange-700">Lá số tinh hoa</p>
            <h1 className="mt-3 text-3xl font-black text-stone-950">Trang đang gặp lỗi tạm thời</h1>
            <p className="mt-3 text-base leading-7 text-stone-600">
              Bạn thử tải lại một lần nữa nhé. Hệ thống đã ghi nhận lỗi để kiểm tra.
            </p>
            <button
              type="button"
              onClick={() => unstable_retry()}
              className="mt-6 rounded-2xl bg-orange-600 px-6 py-3 font-black text-white shadow-lg shadow-orange-900/15"
            >
              Thử lại
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
