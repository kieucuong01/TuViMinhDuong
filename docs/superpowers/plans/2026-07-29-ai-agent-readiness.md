# AI Agent Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve whole-site AI crawlability, extractability, editorial trust, and machine-readable public data without changing current traffic-bearing URLs, canonicals, indexing rules, astrology logic, or commercial boundaries.

**Architecture:** Keep the release additive and split it into small pure boundaries: a reliable audit runner, metadata/redirect helpers, shared editorial identity, static trust content, and pure agent-resource builders exposed by two read-only route handlers. Existing page components consume these helpers while `llms.txt`, sitemap tests, full build, browser checks, and production smoke protect current discovery behavior.

**Tech Stack:** Next.js 16.2.11 App Router, React 19.2.4, TypeScript, Node.js 24 bundled runtime, Vitest 4.1.6, Playwright, Prisma-backed pricing reads, PowerShell production release script.

## Global Constraints

- Work only in `C:\Users\ASUS\Documents\Claude\Projects\Tu vi\.worktrees\ai-agent-readiness-b` until the release-integration step.
- Do not change live slugs, canonical behavior, robots rules, sitemap hostname, chart/date calculations, authentication, payments, paid-content gates, or database schema.
- Preserve every URL already linked by the pre-change `public/llms.txt`.
- Structured data must match visible page content.
- Public JSON may expose only already-public facts, routes, prices, and availability; never user data, secrets, internal identifiers, or operational details.
- Use the organizational identity `Đội ngũ biên tập Lá số tinh hoa`; do not invent a personal author or credentials.
- Public copy must state that tử vi is for reference and does not guarantee health, finance, marriage, or fate outcomes.
- Use the bundled Node 24 runtime for install, test, lint, build, and release.
- Run every behavior change red-green: write a focused failing test, observe the expected failure, implement the minimum, and re-run.
- Stage explicit paths only; never stage user-owned dirty files from the main `master` checkout.

---

### Task 1: Make the whole-site snapshot reliable

**Files:**
- Create: `src/lib/seo-autopilot-snapshot-script.test.ts`
- Create: `scripts/seo/seo-autopilot-snapshot-runner.mjs`
- Modify: `scripts/seo/seo-autopilot-snapshot.mjs`

**Interfaces:**
- Consumes: `extractPageSeo`, `extractSitemapUrls`, and `summarizeSeoSnapshot` from `scripts/seo/seo-autopilot-core.mjs`.
- Produces: `buildSnapshot({ baseUrl, sampleSize, fetchImpl?, concurrency?, maxAttempts?, timeoutMs? })`, exported `fetchText`, and exported `mapWithConcurrency`.

- [ ] **Step 1: Read the test rules before editing**

Read completely:

```text
C:\Users\ASUS\.codex\plugins\cache\openai-curated-remote\superpowers\6.2.0\skills\test-driven-development\writing-good-tests.md
```

- [ ] **Step 2: Prepare the isolated worktree with bundled Node 24**

Put the bundled Node directory first in `PATH`, confirm `node --version` reports Node 24, then run:

```powershell
npm install
```

Confirm `git status --short` shows no lockfile change because this release adds no dependency.

- [ ] **Step 3: Write failing audit tests**

Create `src/lib/seo-autopilot-snapshot-script.test.ts` with real fake `Response` objects:

```ts
import { describe, expect, it } from "vitest";
import {
  buildSnapshot,
  fetchText,
  mapWithConcurrency,
} from "../../scripts/seo/seo-autopilot-snapshot-runner.mjs";

describe("SEO snapshot networking", () => {
  it("never exceeds the configured page concurrency", async () => {
    let active = 0;
    let peak = 0;
    const values = await mapWithConcurrency([1, 2, 3, 4, 5], 2, async (value) => {
      active += 1;
      peak = Math.max(peak, active);
      await Promise.resolve();
      active -= 1;
      return value * 2;
    });

    expect(values).toEqual([2, 4, 6, 8, 10]);
    expect(peak).toBeLessThanOrEqual(2);
  });

  it("retries one transient fetch failure", async () => {
    let attempts = 0;
    const fetchImpl = async () => {
      attempts += 1;
      if (attempts === 1) throw new TypeError("temporary network error");
      return new Response("ok", { status: 200 });
    };

    await expect(fetchText("https://example.com", {
      fetchImpl,
      maxAttempts: 2,
      timeoutMs: 100,
    })).resolves.toBe("ok");
    expect(attempts).toBe(2);
  });

  it("reports fetch failures separately from missing SEO fields", async () => {
    const baseUrl = "https://example.com";
    const fetchImpl = async (input: string | URL | Request) => {
      const url = String(input);
      if (url.endsWith("/robots.txt")) return new Response("User-agent: *\nAllow: /", { status: 200 });
      if (url.endsWith("/sitemap.xml")) {
        return new Response("<urlset><url><loc>https://example.com/broken</loc></url></urlset>", { status: 200 });
      }
      throw new TypeError("socket closed");
    };

    const snapshot = await buildSnapshot({
      baseUrl,
      sampleSize: 2,
      fetchImpl,
      concurrency: 1,
      maxAttempts: 1,
      timeoutMs: 100,
    });

    expect(snapshot.fetchErrors).toHaveLength(2);
    expect(snapshot.warnings.join("\n")).toContain("fetch");
    expect(snapshot.warnings.join("\n")).not.toContain("missing title");
  });
});
```

- [ ] **Step 4: Run the audit tests and observe RED**

Run:

```powershell
npm test -- src/lib/seo-autopilot-snapshot-script.test.ts
```

Expected: FAIL because `fetchText` and `mapWithConcurrency` are not exported and `buildSnapshot` does not accept injected networking controls.

- [ ] **Step 5: Implement bounded concurrency, retry, and error separation**

In `scripts/seo/seo-autopilot-snapshot-runner.mjs`:

```js
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
```

Move `buildSnapshot`, `chooseSampleUrls`, and `fetchText` from the CLI file into the runner module. Change `buildSnapshot` to default to `concurrency = 8`, `maxAttempts = 2`, and `timeoutMs = 8_000`; fetch pages through `mapWithConcurrency`. Store failed page records in `fetchErrors`, pass only successful pages to `summarizeSeoSnapshot`, and add one explicit warning such as `2 page fetch errors remain after retry.` without emitting missing-field warnings for those URLs. Import `buildSnapshot` back into the CLI file so its command contract stays unchanged.

Change `fetchText` to:

```js
export async function fetchText(url, {
  fetchImpl = fetch,
  maxAttempts = 2,
  timeoutMs = 8_000,
} = {}) {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(url, {
        headers: { "user-agent": "LaSoTinhHoa-SEO-Autopilot/1.0" },
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`.trim());
      return await response.text();
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastError;
}
```

- [ ] **Step 6: Run focused and existing SEO tests GREEN**

Run:

```powershell
npm test -- src/lib/seo-autopilot-snapshot-script.test.ts src/lib/seo-autopilot-core.test.ts
```

Expected: all selected tests pass with zero failures.

- [ ] **Step 7: Commit the audit guard**

```powershell
git add -- scripts/seo/seo-autopilot-snapshot.mjs scripts/seo/seo-autopilot-snapshot-runner.mjs src/lib/seo-autopilot-snapshot-script.test.ts docs/superpowers/plans/2026-07-29-ai-agent-readiness.md
git commit -m "fix: make whole-site SEO snapshots reliable"
```

---

### Task 2: Normalize article titles and recover meaningful legacy URLs

**Files:**
- Create: `src/lib/article-metadata.ts`
- Create: `src/lib/legacy-article-redirects.ts`
- Create: `src/lib/legacy-article-redirects.test.ts`
- Modify: `src/app/kien-thuc-tu-vi/[slug]/page.tsx`
- Modify: `src/app/xem-tu-vi-tron-doi/[slug]/page.tsx`
- Modify: `next.config.ts`
- Modify: `src/lib/seo.test.ts`

**Interfaces:**
- Produces: `normalizeArticleMetadataTitle(value: string): string`.
- Produces: `LEGACY_ARTICLE_REDIRECTS: ReadonlyArray<{ source: string; destination: string; permanent: true }>` consumed by `next.config.ts`.

- [ ] **Step 1: Read the installed Next.js redirect and metadata guides**

Read completely:

```text
node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/redirects.md
node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md
```

- [ ] **Step 2: Write failing title-normalization tests**

Add to `src/lib/seo.test.ts`:

```ts
import { normalizeArticleMetadataTitle } from "@/lib/article-metadata";

it("lets the root layout add the site brand exactly once", () => {
  expect(normalizeArticleMetadataTitle("Cách đọc lá số")).toBe("Cách đọc lá số");
  expect(normalizeArticleMetadataTitle("Cách đọc lá số | Lá số tinh hoa")).toBe("Cách đọc lá số");
  expect(normalizeArticleMetadataTitle("Cách đọc lá số | Lá số tinh hoa | Lá số tinh hoa")).toBe("Cách đọc lá số");
});
```

- [ ] **Step 3: Write failing redirect tests**

Create `src/lib/legacy-article-redirects.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";
import { LEGACY_ARTICLE_REDIRECTS } from "@/lib/legacy-article-redirects";

describe("legacy article redirects", () => {
  it("contains the nine reviewed permanent mappings", () => {
    expect(LEGACY_ARTICLE_REDIRECTS).toHaveLength(9);
    expect(LEGACY_ARTICLE_REDIRECTS).toContainEqual({
      source: "/kien-thuc-tu-vi/giai-ma-la-so-tu-vi",
      destination: "/kien-thuc-tu-vi/cach-doc-la-so-tu-vi-cho-nguoi-moi",
      permanent: true,
    });
    expect(new Set(LEGACY_ARTICLE_REDIRECTS.map((item) => item.source)).size).toBe(9);
    expect(LEGACY_ARTICLE_REDIRECTS.every((item) => item.source !== item.destination)).toBe(true);
  });

  it("publishes every reviewed mapping through Next config", async () => {
    await expect(nextConfig.redirects?.()).resolves.toEqual(LEGACY_ARTICLE_REDIRECTS);
  });
});
```

- [ ] **Step 4: Run both tests and observe RED**

Run:

```powershell
npm test -- src/lib/seo.test.ts src/lib/legacy-article-redirects.test.ts
```

Expected: FAIL because the helper, redirect constant, and `nextConfig.redirects` do not exist.

- [ ] **Step 5: Implement the metadata helper**

Create `src/lib/article-metadata.ts`:

```ts
const TRAILING_SITE_BRAND = /(?:\s*\|\s*Lá số tinh hoa)+\s*$/iu;

export function normalizeArticleMetadataTitle(value: string) {
  return value.replace(TRAILING_SITE_BRAND, "").trim();
}
```

Use it only for the returned document `title` in both article `generateMetadata` functions:

```ts
title: normalizeArticleMetadataTitle(article.metaTitle || article.title),
```

Keep current Open Graph and Twitter title selection unchanged.

- [ ] **Step 6: Implement the exact redirect constant**

Create `src/lib/legacy-article-redirects.ts` with the nine mappings from the approved design and `permanent: true as const`. Import it with a relative path from `next.config.ts` and add:

```ts
async redirects() {
  return [...LEGACY_ARTICLE_REDIRECTS];
},
```

- [ ] **Step 7: Run focused tests GREEN**

Run:

```powershell
npm test -- src/lib/seo.test.ts src/lib/legacy-article-redirects.test.ts src/lib/lifetime-tuvi-articles.test.ts
```

Expected: all selected tests pass.

- [ ] **Step 8: Commit metadata and redirects**

```powershell
git add -- next.config.ts src/lib/article-metadata.ts src/lib/legacy-article-redirects.ts src/lib/legacy-article-redirects.test.ts src/lib/seo.test.ts 'src/app/kien-thuc-tu-vi/[slug]/page.tsx' 'src/app/xem-tu-vi-tron-doi/[slug]/page.tsx'
git commit -m "fix: preserve article traffic signals"
```

---

### Task 3: Align visible article trust with Article JSON-LD

**Files:**
- Create: `src/lib/editorial-identity.ts`
- Modify: `src/lib/seo.ts`
- Modify: `src/lib/seo.test.ts`
- Modify: `src/components/article-page-content.tsx`
- Modify: `src/components/seo-page-markup.test.ts`

**Interfaces:**
- Produces: `EDITORIAL_ORGANIZATION = { name: string; url: string }`.
- `articleJsonLd` consumes the shared identity; `ArticlePageContent` renders the same name and URL.

- [ ] **Step 1: Write failing structured-data and markup tests**

Add to `src/lib/seo.test.ts`:

```ts
it("identifies the visible editorial organization as article author", () => {
  const jsonLd = articleJsonLd({
    title: "Cách đọc cung Mệnh tử vi",
    slug: "cach-doc-cung-menh-tu-vi",
    excerpt: "Hướng dẫn đọc cung Mệnh tử vi dễ hiểu.",
  });

  expect(jsonLd.author).toMatchObject({
    "@type": "Organization",
    name: "Đội ngũ biên tập Lá số tinh hoa",
    url: expect.stringMatching(/\/tac-gia$/),
  });
});
```

Add source assertions to `src/components/seo-page-markup.test.ts`:

```ts
expect(articlePageSource).toContain('data-answer-block="true"');
expect(articlePageSource).toContain('href="/tac-gia"');
expect(articlePageSource).toContain("<time");
expect(articlePageSource).toContain("dateTime=");
expect(articlePageSource).toContain("EDITORIAL_ORGANIZATION.name");
```

- [ ] **Step 2: Run focused tests and observe RED**

Run:

```powershell
npm test -- src/lib/seo.test.ts src/components/seo-page-markup.test.ts
```

Expected: FAIL on the missing author URL, answer-block marker, author link, and semantic time.

- [ ] **Step 3: Add the shared editorial identity**

Create `src/lib/editorial-identity.ts`:

```ts
import { APP_NAME, APP_URL } from "@/lib/env";

export const EDITORIAL_ORGANIZATION = {
  name: `Đội ngũ biên tập ${APP_NAME}`,
  url: `${APP_URL}/tac-gia`,
} as const;
```

Use it in `articleJsonLd`:

```ts
author: {
  "@type": "Organization",
  name: EDITORIAL_ORGANIZATION.name,
  url: EDITORIAL_ORGANIZATION.url,
},
```

- [ ] **Step 4: Render extractable visible trust signals**

In `ArticlePageContent`:

```tsx
<p
  className="mt-4 text-pretty text-lg leading-8 text-stone-700"
  data-answer-block="true"
>
  {article.excerpt}
</p>
```

Render one visible author/update line using the existing `displayDate`:

```tsx
<p className="mt-4 text-sm leading-6 text-stone-600">
  Biên tập bởi{" "}
  <Link href="/tac-gia" className="font-bold text-orange-700">
    {EDITORIAL_ORGANIZATION.name}
  </Link>
  {displayDate ? (
    <>
      {" · "}
      <time dateTime={new Date(displayDate).toISOString()}>
        Cập nhật {new Date(displayDate).toLocaleDateString("vi-VN")}
      </time>
    </>
  ) : null}
</p>
```

Keep the category tag but remove the old duplicate date tag.

- [ ] **Step 5: Run focused tests GREEN**

Run:

```powershell
npm test -- src/lib/seo.test.ts src/components/seo-page-markup.test.ts src/components/article-personalized-cta.test.ts
```

Expected: all selected tests pass.

- [ ] **Step 6: Commit article trust alignment**

```powershell
git add -- src/lib/editorial-identity.ts src/lib/seo.ts src/lib/seo.test.ts src/components/article-page-content.tsx src/components/seo-page-markup.test.ts
git commit -m "feat: expose article editorial trust signals"
```

---

### Task 4: Repair pSEO landmarks and mark the answer block

**Files:**
- Modify: `src/components/pseo-article-funnel.tsx`
- Modify: `src/components/pseo-pages-ui.test.tsx`

**Interfaces:**
- Consumes: the existing route-level `<main className="pseo-page">`.
- Produces: a pSEO funnel with no nested main landmark and one `data-answer-block="true"` excerpt.

- [ ] **Step 1: Write the failing rendered-markup test**

Extend the existing `uses a data strip` test:

```ts
expect(withRelatedHtml).not.toContain("<main");
expect(withRelatedHtml).toContain('data-answer-block="true"');
expect(withRelatedHtml.match(/<h1/g)).toHaveLength(1);
```

- [ ] **Step 2: Run the test and observe RED**

Run:

```powershell
npm test -- src/components/pseo-pages-ui.test.tsx
```

Expected: FAIL because `PseoArticleFunnel` currently renders an inner `<main>` and the excerpt has no answer marker.

- [ ] **Step 3: Make the semantic-only component change**

Replace the component’s inner `<main>`/`</main>` with `<div className="pseo-article-main">`/`</div>`, leaving the route-level main intact. Change the hero excerpt to:

```tsx
<p data-answer-block="true">{page.excerpt}</p>
```

- [ ] **Step 4: Run pSEO tests GREEN**

Run:

```powershell
npm test -- src/components/pseo-pages-ui.test.tsx src/app/tra-cuu/pseo-routes.test.ts
```

Expected: all selected tests pass.

- [ ] **Step 5: Commit semantic markup**

```powershell
git add -- src/components/pseo-article-funnel.tsx src/components/pseo-pages-ui.test.tsx
git commit -m "fix: clarify pSEO page semantics"
```

---

### Task 5: Publish editorial, source, update, and correction policy

**Files:**
- Create: `src/app/chinh-sach-bien-tap/page.tsx`
- Modify: `src/app/phuong-phap-luan/page.tsx`
- Modify: `src/app/tac-gia/page.tsx`
- Modify: `src/app/sitemap.ts`
- Modify: `src/app/ai-discovery.test.ts`
- Modify: `src/lib/data.ts`
- Modify: `src/lib/admin-business-dashboard.test.ts`

**Interfaces:**
- Produces: public self-canonical route `/chinh-sach-bien-tap`.
- Consumes: existing `routeMetadata`, `absoluteUrl`, `APP_NAME`, and trust-page styling patterns.

- [ ] **Step 1: Write failing trust-page and sitemap tests**

In `src/app/ai-discovery.test.ts`, include `chinh-sach-bien-tap` in the extractable-page loop and add assertions for:

```ts
expect(source).toContain("nguồn");
expect(source).toContain("đính chính");
expect(source).toContain('href="/lien-he"');
expect(source).toContain("<time");
```

Require `/chinh-sach-bien-tap` in the sitemap-source loop. Update `src/lib/admin-business-dashboard.test.ts` to expect `TRUST_SITEMAP_URLS = 8` through the existing dashboard sitemap-count behavior.

- [ ] **Step 2: Run trust and dashboard tests and observe RED**

Run:

```powershell
npm test -- src/app/ai-discovery.test.ts src/lib/admin-business-dashboard.test.ts
```

Expected: FAIL because the policy page and eighth trust sitemap route do not exist.

- [ ] **Step 3: Create the editorial policy page**

Follow the existing trust-page pattern with:

```ts
export const metadata = routeMetadata({
  title: "Chính sách biên tập, nguồn và đính chính",
  description: "Cách Lá số tinh hoa biên tập nội dung, trình bày nguồn, cập nhật và sửa sai để người đọc và AI agent sử dụng đúng giới hạn.",
  path: "/chinh-sach-bien-tap",
});
```

The rendered page must include:

- one H1;
- a 40–60 word `data-answer-block`;
- separate visible sections for phạm vi nội dung, dữ liệu tính toán và diễn giải, nguồn/liên kết, cập nhật/đính chính, quyền riêng tư, and giới hạn thương mại;
- a `/lien-he` correction link;
- a `<time dateTime="2026-07-29">Cập nhật lần cuối: 29/07/2026</time>`;
- the standard reference-only disclaimer;
- `WebPage` and `Organization`-aligned JSON-LD matching the visible policy.

- [ ] **Step 4: Expand the existing methodology and author pages**

In `/phuong-phap-luan`, add visible sections for deterministic chart/calendar calculations versus interpretation, uncertainty, source handling, and a link to `/chinh-sach-bien-tap`.

In `/tac-gia`, add the organizational review workflow, update/correction path, and a link to `/chinh-sach-bien-tap`. Replace plain update text on both pages with semantic `<time dateTime="2026-07-29">`.

- [ ] **Step 5: Add the policy route to discovery counts**

Append this route to `TRUST_ROUTES`:

```ts
{ path: "/chinh-sach-bien-tap", changeFrequency: "monthly" as const, priority: 0.56 },
```

Change `TRUST_SITEMAP_URLS` from `7` to `8`.

- [ ] **Step 6: Run trust tests GREEN**

Run:

```powershell
npm test -- src/app/ai-discovery.test.ts src/lib/admin-business-dashboard.test.ts
```

Expected: all selected tests pass.

- [ ] **Step 7: Commit editorial trust pages**

```powershell
git add -- src/app/chinh-sach-bien-tap/page.tsx src/app/phuong-phap-luan/page.tsx src/app/tac-gia/page.tsx src/app/sitemap.ts src/app/ai-discovery.test.ts src/lib/data.ts src/lib/admin-business-dashboard.test.ts
git commit -m "feat: publish editorial and correction policy"
```

---

### Task 6: Add stable public JSON resources for agents

**Files:**
- Create: `src/lib/agent-resources.ts`
- Create: `src/lib/agent-resources.test.ts`
- Create: `src/app/agent/site.json/route.ts`
- Create: `src/app/agent/pricing.json/route.ts`
- Create: `src/app/agent/agent-routes.test.ts`

**Interfaces:**
- Produces: `buildAgentSiteResource()` and `buildAgentPricingResource({ featurePrices, coinPackages, commercialEnabled })`.
- Route handlers consume `getFeaturePrices()` and `getOperationSettings()` for current public pricing/availability.
- Produces: `GET /agent/site.json` and `GET /agent/pricing.json`.

- [ ] **Step 1: Read the installed Next.js route-handler guide**

Read completely:

```text
node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md
```

- [ ] **Step 2: Write failing pure-resource tests**

Create `src/lib/agent-resources.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { COIN_PACKAGES, FEATURE_PRICES } from "@/lib/pricing";
import {
  buildAgentPricingResource,
  buildAgentSiteResource,
} from "@/lib/agent-resources";

describe("public agent resources", () => {
  it("describes the public site without private or write-capable fields", () => {
    const resource = buildAgentSiteResource();
    expect(resource).toMatchObject({
      schemaVersion: "1.0",
      language: "vi-VN",
      site: { name: "Lá số tinh hoa", url: expect.stringMatching(/^https:\/\//) },
      discovery: {
        llms: expect.stringMatching(/\/llms\.txt$/),
        sitemap: expect.stringMatching(/\/sitemap\.xml$/),
      },
    });
    expect(JSON.stringify(resource)).not.toMatch(/secret|token|password|userId|database/i);
  });

  it("derives current public pricing from supplied application data", () => {
    const resource = buildAgentPricingResource({
      featurePrices: FEATURE_PRICES,
      coinPackages: COIN_PACKAGES,
      commercialEnabled: true,
    });
    expect(resource.coin).toEqual({ unit: "xu", vndPerCoin: 1000 });
    expect(resource.readings).toContainEqual({
      key: "FULL",
      label: "Luận giải toàn bộ",
      priceCoins: 199,
    });
    expect(resource.packages).toEqual(COIN_PACKAGES);
    expect(resource.confirmationUrl).toMatch(/\/pricing$/);
  });
});
```

- [ ] **Step 3: Write failing route tests**

Create `src/app/agent/agent-routes.test.ts` that imports both `GET` handlers, calls them, and asserts:

```ts
expect(response.status).toBe(200);
expect(response.headers.get("content-type")).toContain("application/json");
expect(response.headers.get("cache-control")).toBe(
  "public, s-maxage=300, stale-while-revalidate=86400",
);
```

Mock only `getFeaturePrices` and `getOperationSettings` at the module boundary with values matching the public pricing constants.

- [ ] **Step 4: Run resource tests and observe RED**

Run:

```powershell
npm test -- src/lib/agent-resources.test.ts src/app/agent/agent-routes.test.ts
```

Expected: FAIL because builders and route handlers do not exist.

- [ ] **Step 5: Implement pure resource builders**

Use:

```ts
export const AGENT_RESOURCE_LAST_MODIFIED = "2026-07-29";
export const AGENT_RESOURCE_SCHEMA_VERSION = "1.0";
```

`buildAgentSiteResource()` returns only: schema version, last modified, language, site identity, discovery URLs, trust/policy/contact URLs, primary topic hubs, citation guidance, and reference-only limitations.

`buildAgentPricingResource()` maps `FEATURE_PRICE_KEYS` from the supplied `featurePrices`, copies the supplied public `coinPackages`, includes `commercialEnabled`, the xu conversion, and a statement that final availability/amount must be checked at `/pricing`.

- [ ] **Step 6: Implement both read-only handlers**

Each handler returns:

```ts
return Response.json(resource, {
  headers: {
    "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
  },
});
```

The pricing handler awaits `getFeaturePrices()` and `getOperationSettings()`, then computes `commercialEnabled` with the same three public flags used by the pricing page. It uses `COIN_PACKAGES` for the package list because that is the same list rendered publicly.

- [ ] **Step 7: Run resource and pricing tests GREEN**

Run:

```powershell
npm test -- src/lib/agent-resources.test.ts src/app/agent/agent-routes.test.ts src/lib/pricing.test.ts
```

Expected: all selected tests pass.

- [ ] **Step 8: Commit agent resources**

```powershell
git add -- src/lib/agent-resources.ts src/lib/agent-resources.test.ts src/app/agent/site.json/route.ts src/app/agent/pricing.json/route.ts src/app/agent/agent-routes.test.ts
git commit -m "feat: expose public agent resources"
```

---

### Task 7: Preserve and extend `llms.txt`

**Files:**
- Create: `src/app/llms-protected-urls.json`
- Modify: `public/llms.txt`
- Modify: `src/app/ai-discovery.test.ts`
- Modify: `src/app/chinh-sach-bien-tap/page.tsx`

**Interfaces:**
- The JSON file freezes all unique production-origin URLs present in `public/llms.txt` before this task.
- The discovery test verifies every frozen URL remains in the final file.

- [ ] **Step 1: Freeze the pre-change URL set**

Extract every unique `https://lasotinhhoa.vn...` URL from the current `public/llms.txt`, keep first-seen order, and create valid UTF-8 JSON:

```json
{
  "capturedAt": "2026-07-29",
  "origin": "https://lasotinhhoa.vn",
  "urls": []
}
```

Populate `urls` with the complete extracted set before changing `public/llms.txt`. Assert the array length is `148`.

- [ ] **Step 2: Write the failing preservation/discovery test**

In `src/app/ai-discovery.test.ts`:

```ts
import protectedLlmsUrls from "./llms-protected-urls.json";

it("preserves every previously published llms resource", () => {
  const source = readFileSync("public/llms.txt", "utf8");
  expect(protectedLlmsUrls.urls).toHaveLength(148);
  for (const url of protectedLlmsUrls.urls) expect(source).toContain(url);
});

it("advertises editorial and machine-readable agent resources", () => {
  const source = readFileSync("public/llms.txt", "utf8");
  for (const route of [
    "/gioi-thieu",
    "/phuong-phap-luan",
    "/tac-gia",
    "/chinh-sach-bien-tap",
    "/pricing",
    "/agent/site.json",
    "/agent/pricing.json",
  ]) {
    expect(source).toContain(`https://lasotinhhoa.vn${route}`);
  }
});
```

- [ ] **Step 3: Run the discovery test and observe RED**

Run:

```powershell
npm test -- src/app/ai-discovery.test.ts
```

Expected: the preservation assertion passes but the new editorial/agent-resource assertion fails.

- [ ] **Step 4: Curate `llms.txt` without replacing its baseline**

Keep every existing line and add a concise section containing:

- `/gioi-thieu`
- `/phuong-phap-luan`
- `/tac-gia`
- `/chinh-sach-bien-tap`
- `/pricing`
- `/agent/site.json`
- `/agent/pricing.json`
- `/chinh-sach-bao-mat`
- `/dieu-khoan-su-dung`
- `/lien-he`
- `/tra-cuu/phu-tinh/tuan`
- `/tra-cuu/phu-tinh/triet`
- `/kien-thuc-tu-vi/binh-giai-la-so-tu-vi`
- `/kien-thuc-tu-vi/cac-sao-trong-la-so-tu-vi`
- `/kien-thuc-tu-vi/chiem-tinh-la-so-va-tu-vi`
- `/kien-thuc-tu-vi/hoa-khoa-trong-tu-vi`
- `/kien-thuc-tu-vi/hoa-ky-trong-tu-vi`
- `/kien-thuc-tu-vi/hoa-tinh-linh-tinh-trong-tu-vi`
- `/kien-thuc-tu-vi/kinh-duong-da-la-trong-tu-vi`
- `/kien-thuc-tu-vi/lap-la-so-bat-tu`
- `/kien-thuc-tu-vi/lap-la-so-tu-vi-can-gi`
- `/kien-thuc-tu-vi/la-so-bat-tu-va-tu-vi`
- `/kien-thuc-tu-vi/la-so-tu-vi-co-thay-doi-khong`
- `/kien-thuc-tu-vi/la-so-tu-vi-mien-phi`
- `/kien-thuc-tu-vi/la-so-tu-vi-online`
- `/kien-thuc-tu-vi/la-so-tu-vi-theo-ngay-thang-nam-sinh`
- `/kien-thuc-tu-vi/la-so-tu-vi-tron-doi`
- `/kien-thuc-tu-vi/la-so-tu-vi-viet-nam`
- `/kien-thuc-tu-vi/menh-tham-lang-la-gi`
- `/kien-thuc-tu-vi/menh-vo-chinh-dieu`
- `/kien-thuc-tu-vi/sat-pha-liem-tham-trong-tu-vi`
- `/kien-thuc-tu-vi/thien-khoi-thien-viet-trong-tu-vi`
- `/kien-thuc-tu-vi/tieu-van-la-gi`
- `/kien-thuc-tu-vi/tu-vi-hang-ngay-cach-doc-van-khi`
- `/kien-thuc-tu-vi/tu-vi-thang-6-2026`
- `/kien-thuc-tu-vi/van-xuong-van-khuc-trong-tu-vi`
- `/kien-thuc-tu-vi/xem-ngay-tot-thang-6-2026`
- `/kien-thuc-tu-vi/xem-ngay-tot-xau-theo-tuoi`

Update the visible file date to `29/07/2026`. Do not add deleted, redirected, noindex, API, admin, account, checkout, or user-specific URLs.

Add links to both JSON resources from the editorial-policy page.

- [ ] **Step 5: Run discovery tests GREEN**

Run:

```powershell
npm test -- src/app/ai-discovery.test.ts
```

Expected: all AI discovery tests pass and the protected list remains 148 URLs.

- [ ] **Step 6: Commit curated discovery**

```powershell
git add -- public/llms.txt src/app/llms-protected-urls.json src/app/ai-discovery.test.ts src/app/chinh-sach-bien-tap/page.tsx
git commit -m "feat: expand curated AI discovery"
```

---

### Task 8: Complete local verification and rendered QA

**Files:**
- Modify only if a failing verification reveals an in-scope regression, with a new failing regression test first.

**Interfaces:**
- Consumes all previous tasks.
- Produces fresh evidence that the branch is releasable.

- [ ] **Step 1: Confirm the bundled runtime and clean dependency state**

Put the bundled Node directory first in `PATH`, then run:

```powershell
node --version
npm --version
git status --short
```

Confirm Node 24 is active and no package-lock or dependency change exists.

- [ ] **Step 2: Run full static verification**

Run each command separately and require exit code 0:

```powershell
npm run lint
npm test
npm run build
```

- [ ] **Step 3: Run the full production snapshot safely**

Run:

```powershell
node scripts/seo/seo-autopilot-snapshot.mjs --sample-size 181 --json
```

Expected:

- 181 sitemap URLs after adding the editorial policy;
- no false missing-field warnings caused by fetch failures;
- `fetchErrors` is empty, or any unresolved network failure is reported only in `fetchErrors` and retried once before failure.

- [ ] **Step 4: Start local production rendering on port 4000**

Run a clean production server from the successful build:

```powershell
npm run start -- -p 4000
```

Use the browser controller to inspect:

- `/kien-thuc-tu-vi/lap-la-so-tu-vi-chuan`
- `/tra-cuu/sao-tu-vi-cung-menh`
- `/phuong-phap-luan`
- `/tac-gia`
- `/chinh-sach-bien-tap`
- `/agent/site.json`
- `/agent/pricing.json`

Assert one H1 per HTML page, one main landmark, visible answer block, visible author/time on the article, single brand suffix in `document.title`, matching JSON-LD, valid JSON resources, no horizontal overflow at 375px, and no console errors caused by this release.

- [ ] **Step 5: Verify legacy redirects locally**

For all nine legacy paths, require an HTTP 307/308 response whose `Location` matches the reviewed destination, then require the destination to return HTTP 200 and a self-canonical link.

- [ ] **Step 6: Confirm branch scope**

Run:

```powershell
git status --short
git diff origin/master...HEAD --stat
git diff origin/master...HEAD --check
```

Confirm no `.env`, `.next`, `node_modules`, log, generated Prisma, user-owned lifetime assets, or unrelated application file appears.

---

### Task 9: Integrate, ship, and prove production

**Files:**
- No source changes unless a production-specific defect is reproduced with a regression test.

**Interfaces:**
- Consumes a clean, verified feature branch.
- Produces pushed `origin/master`, a VPS release, PM2 online state, and public proof.

- [ ] **Step 1: Refresh and prove fast-forward safety**

Fetch `origin/master` and inspect:

```powershell
git fetch origin master
git rev-list --left-right --count origin/master...HEAD
```

If the left count is non-zero, rebase the feature branch onto current `origin/master`, rerun focused tests plus lint/test/build, and re-check scope. Do not force-push master.

- [ ] **Step 2: Push the verified commit chain to master**

Push only when the history is a fast-forward:

```powershell
git push origin HEAD:master
```

Verify:

```powershell
git ls-remote origin refs/heads/master
git rev-parse HEAD
```

The two SHA values must match.

- [ ] **Step 3: Create a clean independent release checkout**

Because the user’s main `master` checkout contains unrelated dirty work and `npm run ship` stages all changes, do not release from it. Clone the GitHub origin into a new ignored temporary directory under `.worktrees`, check out `master`, and confirm its HEAD matches the pushed SHA:

```powershell
$originUrl = git remote get-url origin
git clone --branch master --single-branch $originUrl .worktrees/ai-agent-readiness-release
git -C .worktrees/ai-agent-readiness-release rev-parse HEAD
```

The independent clone must have `origin` set to the GitHub repository, not the local checkout.

- [ ] **Step 4: Run the authoritative production release**

In the clean release checkout, with bundled Node 24 first in `PATH`, run:

```powershell
npm install
npm run ship -- "feat: improve AI agent readiness"
```

The release script must complete lint, tests, build, GitHub master push confirmation, VPS source sync, release build, PM2 restart, and public smoke.

- [ ] **Step 5: Verify production AI and traffic surfaces**

Require:

- `/robots.txt` remains HTTP 200 with the same allow/disallow behavior;
- `/sitemap.xml` contains `/chinh-sach-bien-tap` and retains existing core URLs;
- every protected `llms.txt` URL remains in the live file;
- new trust and agent-resource URLs return HTTP 200;
- both JSON resources have `application/json` and the expected cache header;
- all nine legacy paths permanently redirect to 200 self-canonical destinations;
- the representative article title contains one site-brand suffix;
- article DOM exposes answer block, author link, and semantic time;
- representative pSEO DOM has exactly one main landmark;
- PM2 `lasotinhhoa` is online from the new release path;
- recent Nginx responses for the deployed paths contain no new 5xx.

- [ ] **Step 6: Record final evidence**

Report separately:

- local lint/test/build results;
- pushed GitHub SHA;
- VPS release path and PM2 state;
- public HTTP/DOM/JSON evidence;
- any limitation such as third-party crawler identity not being cryptographically verifiable.
