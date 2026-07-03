"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BookOpen } from "lucide-react";
import { MarkdownContent } from "@/components/markdown-content";
import type { PaidReadingDisplayChapter } from "@/lib/paid-reading-presentation";
import {
  calculateReadingPercent,
  type ReadingProgressInput,
} from "@/lib/reading-progress";

type PaidReadingExperienceProps = {
  readingId: string;
  content: string;
  chapters: PaidReadingDisplayChapter[];
  initialProgress: ReadingProgressInput | null;
};

function progressSignature(progress: ReadingProgressInput) {
  return `${progress.chapterKey}:${progress.chapterIndex}:${progress.percent}:${progress.chapterOffset.toFixed(3)}`;
}

export function PaidReadingExperience({
  readingId,
  content,
  chapters,
  initialProgress,
}: PaidReadingExperienceProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const reportRef = useRef<HTMLElement>(null);
  const frameRef = useRef<number | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasInteractedRef = useRef(false);
  const initialState: ReadingProgressInput = initialProgress || {
    chapterKey: chapters[0]?.key || "section",
    chapterIndex: 0,
    percent: 0,
    chapterOffset: 0,
  };
  const latestProgressRef = useRef<ReadingProgressInput>(initialState);
  const pendingSaveRef = useRef<ReadingProgressInput | null>(null);
  const lastSavedRef = useRef(initialProgress ? progressSignature(initialProgress) : "");
  const [progress, setProgress] = useState(initialState);
  const [resumeDismissed, setResumeDismissed] = useState(false);

  const persistProgress = useCallback(async (next: ReadingProgressInput, keepalive = false) => {
    const signature = progressSignature(next);
    if (signature === lastSavedRef.current) return;
    pendingSaveRef.current = next;

    try {
      const response = await fetch(`/api/readings/${readingId}/progress`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(next),
        keepalive,
      });
      if (!response.ok) throw new Error(`READING_PROGRESS_${response.status}`);
      lastSavedRef.current = signature;
      pendingSaveRef.current = null;
    } catch {
      pendingSaveRef.current = next;
    }
  }, [readingId]);

  useEffect(() => {
    const report = reportRef.current;
    if (!report || chapters.length === 0) return;

    const headings = chapters
      .map((chapter) => document.getElementById(chapter.id))
      .filter((heading): heading is HTMLElement => Boolean(heading));

    const measure = () => {
      frameRef.current = null;
      const rect = report.getBoundingClientRect();
      const readingLine = window.scrollY + window.innerHeight * 0.35;
      const reportTop = window.scrollY + rect.top;
      const reportBottom = Math.max(
        reportTop + 1,
        reportTop + report.scrollHeight - window.innerHeight * 0.65,
      );
      const percent = calculateReadingPercent(readingLine, reportTop, reportBottom);

      let activeIndex = 0;
      headings.forEach((heading, index) => {
        const headingTop = window.scrollY + heading.getBoundingClientRect().top;
        if (headingTop <= readingLine + 8) activeIndex = index;
      });

      const activeHeading = headings[activeIndex];
      const nextHeading = headings[activeIndex + 1];
      const chapterTop = activeHeading
        ? window.scrollY + activeHeading.getBoundingClientRect().top
        : reportTop;
      const chapterBottom = nextHeading
        ? window.scrollY + nextHeading.getBoundingClientRect().top
        : reportTop + report.scrollHeight;
      const chapterDistance = Math.max(1, chapterBottom - chapterTop);
      const chapterOffset = Math.max(0, Math.min(1, (readingLine - chapterTop) / chapterDistance));
      const chapter = chapters[activeIndex] || chapters[0];
      const nextProgress = {
        chapterKey: chapter.key,
        chapterIndex: activeIndex,
        percent,
        chapterOffset: Number(chapterOffset.toFixed(4)),
      };

      latestProgressRef.current = nextProgress;
      setProgress((current) => progressSignature(current) === progressSignature(nextProgress) ? current : nextProgress);
    };

    const scheduleMeasure = () => {
      if (frameRef.current !== null) return;
      frameRef.current = window.requestAnimationFrame(measure);
    };
    const handleScroll = () => {
      hasInteractedRef.current = true;
      scheduleMeasure();
    };
    const observer = new IntersectionObserver(scheduleMeasure, {
      rootMargin: "-18% 0px -68% 0px",
      threshold: [0, 1],
    });

    headings.forEach((heading) => observer.observe(heading));
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", scheduleMeasure);
    scheduleMeasure();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", scheduleMeasure);
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, [chapters]);

  useEffect(() => {
    if (!hasInteractedRef.current) return;
    pendingSaveRef.current = progress;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void persistProgress(latestProgressRef.current);
    }, 2_000);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [persistProgress, progress]);

  useEffect(() => {
    const handlePageHide = () => {
      const pending = pendingSaveRef.current || (hasInteractedRef.current ? latestProgressRef.current : null);
      if (pending) void persistProgress(pending, true);
    };
    window.addEventListener("pagehide", handlePageHide);
    return () => window.removeEventListener("pagehide", handlePageHide);
  }, [persistProgress]);

  const scrollToChapter = (chapter: PaidReadingDisplayChapter) => {
    document.getElementById(chapter.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", `#${chapter.id}`);
  };

  const resumeReading = () => {
    if (!initialProgress || !reportRef.current) return;
    const chapter = chapters.find((item) => item.key === initialProgress.chapterKey);
    const heading = chapter ? document.getElementById(chapter.id) : null;

    if (heading) {
      const nextChapter = chapters[(chapter?.index || 0) + 1];
      const nextHeading = nextChapter ? document.getElementById(nextChapter.id) : null;
      const top = window.scrollY + heading.getBoundingClientRect().top;
      const bottom = nextHeading
        ? window.scrollY + nextHeading.getBoundingClientRect().top
        : window.scrollY + reportRef.current.getBoundingClientRect().bottom;
      window.scrollTo({
        top: Math.max(0, top + (bottom - top) * initialProgress.chapterOffset - 110),
        behavior: "smooth",
      });
    } else {
      const reportTop = window.scrollY + reportRef.current.getBoundingClientRect().top;
      window.scrollTo({
        top: reportTop + reportRef.current.scrollHeight * (initialProgress.percent / 100) - 110,
        behavior: "smooth",
      });
    }
    setResumeDismissed(true);
  };

  const resumeChapterNumber = Math.min(
    chapters.length,
    Math.max(1, (initialProgress?.chapterIndex || 0) + 1),
  );
  const showResume = Boolean(initialProgress && initialProgress.percent >= 2 && !resumeDismissed);
  const displayPercent = showResume ? initialProgress!.percent : progress.percent;
  const displayChapter = showResume
    ? resumeChapterNumber
    : Math.min(chapters.length, progress.chapterIndex + 1);

  return (
    <div className="paid-reading-experience" ref={rootRef}>
      <div className="paid-reading-layout">
        <aside className="paid-reading-toc" data-testid="advanced-reading-toc">
          <p>
            <BookOpen size={17} aria-hidden="true" /> Mục lục
          </p>
          <nav aria-label="Mục lục luận giải nâng cao">
            {chapters.map((chapter, index) => (
              <a
                key={chapter.key}
                href={`#${chapter.id}`}
                className={index === progress.chapterIndex ? "is-active" : undefined}
                aria-current={index === progress.chapterIndex ? "location" : undefined}
                onClick={(event) => {
                  event.preventDefault();
                  scrollToChapter(chapter);
                }}
              >
                {chapter.title}
              </a>
            ))}
          </nav>
        </aside>

        <article ref={reportRef} data-testid="advanced-reading-chapter-list">
          <p className="eyebrow">Bản luận giải toàn bộ</p>
          <MarkdownContent content={content} />
        </article>
      </div>

      <button
        type="button"
        data-testid="paid-reading-progress-fab"
        className="paid-reading-progress-fab is-visible"
        onClick={() => {
          if (showResume) {
            resumeReading();
            return;
          }
          const currentChapter = chapters[progress.chapterIndex] || chapters[0];
          if (currentChapter) scrollToChapter(chapters[progress.chapterIndex] || chapters[0]);
        }}
        aria-label={showResume ? `Đọc tiếp từ chương ${displayChapter}, tiến độ ${displayPercent}%` : `Tiến độ đọc ${displayPercent}%, chương ${displayChapter}`}
      >
        <span className="paid-reading-progress-fab-copy">
          <strong>{showResume ? "Đọc tiếp · " : ""}{displayPercent}%</strong>
          <small>Chương {displayChapter}/{chapters.length}</small>
        </span>
        <span
          className="paid-reading-progress-fab-track"
          role="progressbar"
          aria-label="Tiến độ đọc luận giải"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={displayPercent}
        >
          <i style={{ width: `${displayPercent}%` }} />
        </span>
      </button>
    </div>
  );
}
