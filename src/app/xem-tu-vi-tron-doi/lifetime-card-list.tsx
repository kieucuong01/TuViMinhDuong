"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { BookOpenText, ChevronDown, ChevronLeft, ChevronRight, Search, UserRound, X } from "lucide-react";
import { useEffect, useRef } from "react";
import {
  buildLifetimeSearchUrl,
  filterLifetimeCards,
  getLifetimePaginationTokens,
  parseLifetimePage,
} from "./lifetime-card-list.logic";

export type LifetimeCardListItem = {
  id: string;
  detailsPath?: string;
  title: string;
  year: string;
  canChi: string;
  gender: string;
  overview: string;
  work: string;
  family: string;
  caution: string;
  coverImage: string;
  coverAlt: string;
};

type LifetimeCardListProps = {
  cards: LifetimeCardListItem[];
  itemsPerPage: number;
  chartHref: string;
};

function LifetimeCard({ item }: { item: LifetimeCardListItem }) {
  return (
    <article id={item.id} className="scroll-mt-24 rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <div className="overflow-hidden rounded-2xl border border-orange-100 bg-orange-50/50">
          <div className="relative aspect-[16/9]">
            <Image
              src={item.coverImage}
              alt={item.coverAlt}
              fill
              sizes="(min-width: 1024px) 320px, 100vw"
              className="object-cover"
            />
          </div>
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-black text-orange-700">{item.year}</span>
            <span className="rounded-full bg-stone-100 px-3 py-1 text-sm font-black text-stone-700">{item.canChi}</span>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-black text-emerald-700">{item.gender}</span>
          </div>

          <h3 className="mt-4 text-2xl font-black text-stone-950">{item.title}</h3>

          <div className="mt-4 rounded-2xl bg-orange-50/70 p-4">
            <h4 className="font-black text-stone-950">Tổng quan trọn đời</h4>
            <p className="mt-2 leading-7 text-stone-700">{item.overview}</p>
          </div>

          <details className="group mt-4 rounded-2xl border border-stone-200 bg-stone-50/70">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-black text-stone-900">
              Xem công việc, tình cảm và lưu ý
              <ChevronDown className="shrink-0 transition-transform group-open:rotate-180" size={20} />
            </summary>
            <div className="grid gap-4 border-t border-stone-200 p-4 lg:grid-cols-3">
              <div className="rounded-2xl bg-white p-4">
                <h4 className="font-black text-stone-950">Công việc và tiền bạc</h4>
                <p className="mt-2 leading-7 text-stone-700">{item.work}</p>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <h4 className="font-black text-stone-950">Tình cảm và gia đạo</h4>
                <p className="mt-2 leading-7 text-stone-700">{item.family}</p>
              </div>
              <div className="rounded-2xl bg-amber-50 p-4">
                <h4 className="font-black text-stone-950">Lưu ý vận hạn</h4>
                <p className="mt-2 leading-7 text-stone-700">{item.caution}</p>
              </div>
            </div>
          </details>

          {item.detailsPath ? (
            <Link href={item.detailsPath} className="btn btn-primary mt-5">
              <BookOpenText size={18} /> Đọc bài chi tiết
            </Link>
          ) : (
            <span className="mt-5 inline-flex rounded-full bg-stone-100 px-4 py-2 text-sm font-bold text-stone-600">
              Bản xem nhanh trên trang
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export function LifetimeCardList({ cards, itemsPerPage, chartHref }: LifetimeCardListProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const filteredCards = filterLifetimeCards(cards, query);
  const totalPages = Math.max(1, Math.ceil(filteredCards.length / itemsPerPage));
  const page = parseLifetimePage(searchParams.get("page"), totalPages);
  const paginationTokens = getLifetimePaginationTokens(page, totalPages);
  const listRef = useRef<HTMLDivElement>(null);
  const previousStateRef = useRef({ page, query });
  const availableDetailedYears = new Set(
    cards.filter((item) => item.detailsPath).map((item) => item.year),
  ).size;

  useEffect(() => {
    const previousState = previousStateRef.current;
    previousStateRef.current = { page, query };

    if (previousState.page === page || previousState.query !== query) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    listRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }, [page, query]);

  const start = (page - 1) * itemsPerPage;
  const visibleCards = filteredCards.slice(start, start + itemsPerPage);

  function updateHistory(nextQuery: string, nextPage: number, mode: "push" | "replace") {
    const nextUrl = buildLifetimeSearchUrl(
      pathname,
      new URLSearchParams(searchParams.toString()),
      nextQuery,
      nextPage,
    );

    if (mode === "push") {
      window.history.pushState(null, "", nextUrl);
    } else {
      window.history.replaceState(null, "", nextUrl);
    }
  }

  function goToPage(nextPage: number) {
    const boundedPage = Math.min(totalPages, Math.max(1, nextPage));
    if (boundedPage === page) return;
    updateHistory(query, boundedPage, "push");
  }

  function handleQueryChange(value: string) {
    updateHistory(value, 1, "replace");
  }

  return (
    <div id="tim-tuoi" className="scroll-mt-24">
      <div className="mb-5 rounded-2xl border border-orange-100 bg-white p-4 shadow-sm">
        <label htmlFor="lifetime-age-filter" className="text-sm font-black uppercase tracking-[0.18em] text-orange-700">
          Tìm tuổi theo năm sinh
        </label>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
            <input
              id="lifetime-age-filter"
              type="search"
              inputMode="search"
              autoComplete="off"
              value={query}
              onChange={(event) => handleQueryChange(event.target.value)}
              placeholder="Nhập năm sinh, can chi hoặc nam/nữ"
              aria-describedby="lifetime-filter-help lifetime-filter-status"
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 py-3 pl-10 pr-4 text-base font-semibold text-stone-800 outline-none transition focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100"
            />
          </div>
          {query ? (
            <button type="button" className="btn btn-ghost" onClick={() => handleQueryChange("")}>
              <X size={18} /> Xóa tìm kiếm
            </button>
          ) : null}
        </div>
        <p id="lifetime-filter-help" className="mt-2 text-sm leading-6 text-stone-500">
          Có {availableDetailedYears} năm sinh đã có bài chi tiết; một số năm vẫn đang được bổ sung.
        </p>
        <p id="lifetime-filter-status" className="mt-1 text-sm font-semibold text-stone-600" role="status" aria-live="polite">
          Đang hiển thị {filteredCards.length}/{cards.length} mục tử vi trọn đời.
        </p>
      </div>

      <div ref={listRef} className="grid scroll-mt-24 gap-5">
        {visibleCards.map((item) => (
          <LifetimeCard key={item.id} item={item} />
        ))}
      </div>

      {visibleCards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-orange-200 bg-orange-50/60 p-6 text-center">
          <h3 className="text-xl font-black text-stone-950">Chưa có bài trọn đời phù hợp với “{query.trim()}”</h3>
          <p className="mx-auto mt-2 max-w-2xl leading-7 text-stone-600">
            Kho nội dung chưa phủ liên tục mọi năm sinh. Bạn có thể xóa tìm kiếm để xem các tuổi đã có, hoặc lập lá số theo ngày và giờ sinh để nhận phần đối chiếu cá nhân.
          </p>
          <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
            <button type="button" className="btn btn-ghost" onClick={() => handleQueryChange("")}>
              <X size={18} /> Xóa tìm kiếm
            </button>
            <Link href={chartHref} className="btn btn-primary">
              <UserRound size={18} /> Lập lá số cá nhân
            </Link>
          </div>
        </div>
      ) : null}

      {totalPages > 1 ? (
        <nav className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" aria-label="Phân trang tử vi trọn đời">
          <span className="text-sm font-semibold text-stone-500">
            Trang {page}/{totalPages}
          </span>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => goToPage(page - 1)}
              disabled={page === 1}
            >
              <ChevronLeft size={18} /> Trang trước
            </button>

            {paginationTokens.map((token) =>
              typeof token === "number" ? (
                <button
                  key={token}
                  type="button"
                  className={token === page ? "btn btn-primary" : "btn btn-ghost"}
                  onClick={() => goToPage(token)}
                  aria-label={`Trang ${token}`}
                  aria-current={token === page ? "page" : undefined}
                >
                  {token}
                </button>
              ) : (
                <span key={token} className="px-1 text-stone-400" aria-hidden="true">
                  …
                </span>
              ),
            )}

            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => goToPage(page + 1)}
              disabled={page === totalPages}
            >
              Trang sau <ChevronRight size={18} />
            </button>
          </div>
        </nav>
      ) : null}
    </div>
  );
}
