import {
  extractPageSeo,
  extractSitemapUrls,
  summarizeSeoSnapshot,
} from "./seo-autopilot-core.mjs";

export async function buildSnapshot({
  baseUrl,
  sampleSize,
  fetchImpl = fetch,
  concurrency = 8,
  maxAttempts = 2,
  timeoutMs = 8_000,
}) {
  const fetchOptions = { fetchImpl, maxAttempts, timeoutMs };
  const [robotsText, sitemapXml] = await Promise.all([
    fetchText(`${baseUrl}/robots.txt`, fetchOptions),
    fetchText(`${baseUrl}/sitemap.xml`, fetchOptions),
  ]);
  const sitemapUrls = extractSitemapUrls(sitemapXml);
  const sampleUrls = chooseSampleUrls(baseUrl, sitemapUrls, sampleSize);
  const pages = await mapWithConcurrency(sampleUrls, concurrency, async (url) => {
    try {
      const html = await fetchText(url, fetchOptions);
      return extractPageSeo(url, html);
    } catch (error) {
      return {
        url,
        title: "",
        metaDescription: "",
        canonical: "",
        h1: [],
        jsonLdCount: 0,
        htmlLength: 0,
        error: error instanceof Error ? error.message : String(error),
        errorClass: error instanceof Error ? error.name : "UnknownError",
        attempts: maxAttempts,
      };
    }
  });
  const successfulPages = pages.filter((page) => !page.error);
  const fetchErrors = pages
    .filter((page) => page.error)
    .map(({ url, error, errorClass, attempts }) => ({
      url,
      error,
      errorClass,
      attempts,
    }));
  const summary = summarizeSeoSnapshot({
    baseUrl,
    robotsText,
    sitemapUrls,
    pages: successfulPages,
  });
  const warnings = [
    ...summary.warnings,
    ...(fetchErrors.length
      ? [
          `${fetchErrors.length} page fetch errors remain after ${maxAttempts} ${
            maxAttempts === 1 ? "attempt" : "attempts"
          }.`,
        ]
      : []),
  ];

  return {
    generatedAt: new Date().toISOString(),
    ...summary,
    status: warnings.length ? "warning" : "ok",
    checkedPageCount: pages.length,
    fetchedPageCount: successfulPages.length,
    fetchErrorCount: fetchErrors.length,
    warnings,
    fetchErrors,
    pages,
  };
}

export async function mapWithConcurrency(items, concurrency, task) {
  const limit = Math.max(1, Math.min(Number(concurrency) || 1, items.length || 1));
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await task(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: limit }, () => worker()));
  return results;
}

export async function fetchText(
  url,
  {
    fetchImpl = fetch,
    maxAttempts = 2,
    timeoutMs = 8_000,
  } = {},
) {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(url, {
        headers: {
          "user-agent": "LaSoTinhHoa-SEO-Autopilot/1.0",
        },
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`.trim());
      }
      return await response.text();
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

function chooseSampleUrls(baseUrl, sitemapUrls, sampleSize) {
  const priorityPaths = [
    baseUrl,
    `${baseUrl}/kien-thuc-tu-vi`,
    `${baseUrl}/xem-ngay`,
  ];
  const ordered = [...priorityPaths, ...sitemapUrls];
  return [...new Set(ordered)].slice(0, Math.max(1, sampleSize));
}
