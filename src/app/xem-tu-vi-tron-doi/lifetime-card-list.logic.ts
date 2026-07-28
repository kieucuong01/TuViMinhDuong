export type LifetimeFilterableCard = {
  title: string;
  year: string;
  canChi: string;
  gender: string;
};

export type LifetimePaginationToken = number | "ellipsis-start" | "ellipsis-end";

const COMBINING_MARKS_PATTERN = /[\u0300-\u036f]/g;
const POSITIVE_INTEGER_PATTERN = /^\d+$/;

export function normalizeLifetimeFilter(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(COMBINING_MARKS_PATTERN, "")
    .replace(/đ/g, "d")
    .trim();
}

export function filterLifetimeCards<T extends LifetimeFilterableCard>(cards: T[], query: string) {
  const normalizedQuery = normalizeLifetimeFilter(query);
  if (!normalizedQuery) return cards;

  return cards.filter((item) =>
    normalizeLifetimeFilter(`${item.title} ${item.year} ${item.canChi} ${item.gender}`).includes(
      normalizedQuery,
    ),
  );
}

export function parseLifetimePage(value: string | null, totalPages: number) {
  const safeTotalPages = Math.max(1, totalPages);
  if (!value || !POSITIVE_INTEGER_PATTERN.test(value)) return 1;

  return Math.min(safeTotalPages, Math.max(1, Number(value)));
}

export function buildLifetimeSearchUrl(
  pathname: string,
  currentSearchParams: URLSearchParams,
  query: string,
  page: number,
) {
  const params = new URLSearchParams(currentSearchParams.toString());
  const trimmedQuery = query.trim();

  if (trimmedQuery) {
    params.set("q", trimmedQuery);
  } else {
    params.delete("q");
  }

  if (page > 1) {
    params.set("page", String(page));
  } else {
    params.delete("page");
  }

  const serializedParams = params.toString();
  return `${pathname}${serializedParams ? `?${serializedParams}` : ""}#tim-tuoi`;
}

export function getLifetimePaginationTokens(
  currentPage: number,
  totalPages: number,
): LifetimePaginationToken[] {
  if (totalPages <= 7) {
    return Array.from({ length: Math.max(0, totalPages) }, (_, index) => index + 1);
  }

  let rangeStart = currentPage - 1;
  let rangeEnd = currentPage + 1;

  if (currentPage <= 2) {
    rangeStart = 2;
    rangeEnd = 3;
  } else if (currentPage >= totalPages - 1) {
    rangeStart = totalPages - 2;
    rangeEnd = totalPages - 1;
  }

  const tokens: LifetimePaginationToken[] = [1];
  if (rangeStart > 2) tokens.push("ellipsis-start");

  for (let page = Math.max(2, rangeStart); page <= Math.min(totalPages - 1, rangeEnd); page += 1) {
    tokens.push(page);
  }

  if (rangeEnd < totalPages - 1) tokens.push("ellipsis-end");
  tokens.push(totalPages);

  return tokens;
}
