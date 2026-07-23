"use client";

import Image from "next/image";
import Link from "next/link";
import { BookOpenText, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl bg-orange-50/70 p-4">
              <h4 className="font-black text-stone-950">Tổng quan trọn đời</h4>
              <p className="mt-2 leading-7 text-stone-700">{item.overview}</p>
            </div>
            <div className="rounded-2xl bg-stone-50 p-4">
              <h4 className="font-black text-stone-950">Công việc và tiền bạc</h4>
              <p className="mt-2 leading-7 text-stone-700">{item.work}</p>
            </div>
            <div className="rounded-2xl bg-stone-50 p-4">
              <h4 className="font-black text-stone-950">Tình cảm và gia đạo</h4>
              <p className="mt-2 leading-7 text-stone-700">{item.family}</p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-4">
              <h4 className="font-black text-stone-950">Lưu ý vận hạn</h4>
              <p className="mt-2 leading-7 text-stone-700">{item.caution}</p>
            </div>
          </div>

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

export function LifetimeCardList({ cards, itemsPerPage }: LifetimeCardListProps) {
  const totalPages = Math.max(1, Math.ceil(cards.length / itemsPerPage));
  const [page, setPage] = useState(1);
  const listRef = useRef<HTMLDivElement>(null);
  const firstRenderRef = useRef(true);

  useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    listRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }, [page]);

  const start = (page - 1) * itemsPerPage;
  const visibleCards = cards.slice(start, start + itemsPerPage);

  function goToPage(nextPage: number) {
    setPage(Math.min(totalPages, Math.max(1, nextPage)));
  }

  return (
    <>
      <div ref={listRef} className="grid gap-5">
        {visibleCards.map((item) => (
          <LifetimeCard key={item.id} item={item} />
        ))}
      </div>

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

            {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                className={pageNumber === page ? "btn btn-primary" : "btn btn-ghost"}
                onClick={() => goToPage(pageNumber)}
                aria-current={pageNumber === page ? "page" : undefined}
              >
                {pageNumber}
              </button>
            ))}

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
    </>
  );
}
