const baseUrl = (process.env.PERF_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:4000").replace(/\/$/, "");

const routes = [
  "/",
  "/kien-thuc-tu-vi",
  "/kien-thuc-tu-vi/cung-menh-cung-than",
  "/kien-thuc-tu-vi/gio-sinh-trong-tu-vi",
  "/xem-ngay",
];

if (process.env.PERF_CHART_PATH) {
  routes.push(process.env.PERF_CHART_PATH);
}

async function checkRoute(pathname) {
  const url = `${baseUrl}${pathname}`;
  const started = performance.now();
  const response = await fetch(url, {
    headers: { "user-agent": "lasotinhhoa-performance-smoke/1.0" },
    redirect: "follow",
  });
  const text = await response.text();
  const ms = Math.round(performance.now() - started);
  return {
    route: pathname,
    status: response.status,
    ms,
    kb: Math.round(Buffer.byteLength(text) / 1024),
    cache: response.headers.get("x-vercel-cache") || response.headers.get("cache-control") || "-",
  };
}

const results = [];
for (const route of routes) {
  results.push(await checkRoute(route));
}

console.table(results);

const failed = results.filter((item) => item.status >= 400 || item.ms > 5000);
if (failed.length) {
  console.error("Performance smoke failed for:", failed.map((item) => `${item.route} (${item.status}, ${item.ms}ms)`).join(", "));
  process.exit(1);
}
