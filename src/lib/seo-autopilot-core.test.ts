import { describe, expect, it } from "vitest";
import {
  extractSitemapUrls,
  extractPageSeo,
  buildContentBrief,
  buildKeywordIntelligence,
  buildKeywordDrivenOpportunities,
  buildWeeklyContentPlan,
  extractSeedArticleSlugs,
  normalizePublisherSelection,
  planSeoAutopilotRun,
  parseSemrushKeywordCsv,
  rankTopicOpportunities,
  renderContentDraft,
  renderRunReport,
  summarizeSeoSnapshot,
} from "../../scripts/seo/seo-autopilot-core.mjs";

describe("SEO Autopilot core", () => {
  it("extracts URL locations from a sitemap", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://lasotinhhoa.vn</loc></url>
  <url><loc>https://lasotinhhoa.vn/kien-thuc-tu-vi/la-so-tu-vi-la-gi</loc></url>
</urlset>`;

    expect(extractSitemapUrls(xml)).toEqual([
      "https://lasotinhhoa.vn",
      "https://lasotinhhoa.vn/kien-thuc-tu-vi/la-so-tu-vi-la-gi",
    ]);
  });

  it("parses SEMrush keyword CSV and builds a Google-safe pillar funnel", () => {
    const csv = [
      "keyword,intent,volume,kd_percent,cpc_usd",
      "lá số tử vi,I,368.0K,61,0.01",
      "tạo lá số tử vi,I,8.1K,44,0.01",
      "lá số bát tự,I,12.1K,30,0.01",
      "lập lá số bát tự,I,5.4K,22,0.01",
      "lá số tử vi 2024,I,14.8K,66,0.01",
      "tuvivietnam vn lấy lá số tử vi,N T,5.4K,32,0.01",
    ].join("\n");

    const rows = parseSemrushKeywordCsv(csv);
    const intelligence = buildKeywordIntelligence(rows);

    expect(rows).toHaveLength(6);
    expect(intelligence.rowCount).toBe(6);
    expect(intelligence.excludedSummary.map((item) => item.id)).toEqual(
      expect.arrayContaining(["stale-year", "competitor-navigation"]),
    );
    expect(intelligence.pillarFunnel.primaryPillar.slug).toBe("la-so-tu-vi-la-gi");
    expect(intelligence.pillarFunnel.doNotPublishPatterns.join(" ")).toContain("Separate pages");
    expect(intelligence.clusters.map((cluster) => cluster.id)).toEqual(
      expect.arrayContaining(["core-la-so-tu-vi", "bat-tu-tu-tru", "lap-lay-tao-la-so"]),
    );
  });

  it("uses SEMrush keyword opportunities ahead of default star topics", () => {
    const rows = parseSemrushKeywordCsv(
      [
        "keyword,intent,volume,kd_percent,cpc_usd",
        "lá số tử vi,I,368.0K,61,0.01",
        "tạo lá số tử vi,I,8.1K,44,0.01",
        "lá số bát tự,I,12.1K,30,0.01",
        "phân tích lá số tử vi,I,590,33,0.02",
      ].join("\n"),
    );
    const { opportunities } = buildKeywordDrivenOpportunities({
      keywordRows: rows,
      existingSlugs: ["la-so-tu-vi-la-gi"],
    });
    const plan = planSeoAutopilotRun({
      snapshot: { status: "ok", sitemapUrlCount: 30, warnings: [] },
      existingSlugs: ["la-so-tu-vi-la-gi"],
      keywordRows: rows,
    });

    expect(opportunities[0].slug).toBe("tao-la-so-tu-vi");
    expect(plan.weeklyContentPlan.strategy).toBe("semrush-keyword-intent-funnel");
    expect(plan.nextAction.slugs[0]).toBe("tao-la-so-tu-vi");
    expect(plan.keywordIntelligence.clusters[0].totalVolume).toBeGreaterThan(300000);
    expect(plan.brief.keywordEvidence.topKeywords[0].keyword).toBe("lá số tử vi");
  });

  it("uses the remaining new CSV-derived topic when no equivalent reader intent exists yet", () => {
    const rows = parseSemrushKeywordCsv(
      [
        "keyword,intent,volume,kd_percent,cpc_usd",
        "lÃ¡ sá»‘ tá»­ vi,I,368.0K,61,0.01",
        "táº¡o lÃ¡ sá»‘ tá»­ vi,I,8.1K,44,0.01",
        "xem lÃ¡ sá»‘ tá»­ vi,I,6.6K,54,0.01",
        "cÃ¡ch xem lÃ¡ sá»‘ tá»­ vi,I,2.9K,51,0.01",
        "lÃ¡ sá»‘ tá»­ vi online,I,3.6K,57,0.01",
        "luen giáº£i lÃ¡ sá»‘ tá»­ vi,I,2.9K,50,0.01",
      ].join("\n"),
    );

    const plan = planSeoAutopilotRun({
      snapshot: { status: "ok", sitemapUrlCount: 30, warnings: [] },
      existingSlugs: [
        "la-so-tu-vi-la-gi",
        "tao-la-so-tu-vi",
        "phan-tich-la-so-tu-vi",
        "sao-tu-vi",
        "sao-thien-co",
        "sao-thai-duong",
        "menh-vo-chinh-dieu",
        "cung-phu-mau-trong-tu-vi",
        "tieu-van-la-gi",
        "lap-la-so-tu-vi-can-gi",
      ],
      keywordRows: rows,
      articlesPerWeek: 1,
    });

    expect(plan.nextAction.type).toBe("single_article_publish");
    expect(plan.nextAction.slug).not.toBe("tao-la-so-tu-vi");
    expect(plan.nextAction.slug).not.toBe("phan-tich-la-so-tu-vi");
    expect([
      "xem-la-so-tu-vi-online",
      "xem-la-so-tu-vi-mien-phi",
      "la-so-tu-vi-online",
      "la-so-tu-vi-mien-phi",
    ]).toContain(
      plan.nextAction.slug,
    );
    expect(plan.nextAction.slugs).toEqual([plan.nextAction.slug]);
    expect(plan.brief.slug).toBe(plan.nextAction.slug);
  });

  it("excludes overlapping online and mien-phi variants when equivalent intents already exist", () => {
    const rows = parseSemrushKeywordCsv(
      [
        "keyword,intent,volume,kd_percent,cpc_usd",
        "xem lÃ¡ sá»‘ tá»­ vi,I,6.6K,54,0.01",
        "cÃ¡ch xem lÃ¡ sá»‘ tá»­ vi,I,2.9K,51,0.01",
        "xem lÃ¡ sá»‘ tá»­ vi miá»…n phÃ­,I,1.3K,50,0.01",
      ].join("\n"),
    );

    const { opportunities } = buildKeywordDrivenOpportunities({
      keywordRows: rows,
      existingSlugs: ["la-so-tu-vi-online", "la-so-tu-vi-mien-phi"],
    });

    expect(opportunities.map((item) => item.slug)).not.toContain("xem-la-so-tu-vi-online");
    expect(opportunities.map((item) => item.slug)).not.toContain("xem-la-so-tu-vi-mien-phi");
  });

  it("selects the birth-date-only setup intent when higher-volume synonym clusters already exist", () => {
    const rows = parseSemrushKeywordCsv(
      [
        "keyword,intent,volume,kd_percent,cpc_usd",
        "lập lá số tử vi,I,74.0K,59,0.01",
        "xem lá số tử vi,I,6.6K,54,0.01",
        "lá số tử vi miễn phí,I,4.4K,56,0.01",
        "lá số tử vi theo ngày tháng năm sinh,C,260,25,0.01",
      ].join("\n"),
    );

    const plan = planSeoAutopilotRun({
      snapshot: {
        status: "ok",
        sitemapUrlCount: 67,
        warnings: [],
      },
      existingSlugs: [
        "lap-la-so-tu-vi-chuan",
        "tao-la-so-tu-vi",
        "la-so-tu-vi-online",
        "la-so-tu-vi-mien-phi",
        "phan-tich-la-so-tu-vi",
        "cach-doc-la-so-tu-vi-cho-nguoi-moi",
        "lap-la-so-tu-vi-can-gi",
      ],
      keywordRows: rows,
      articlesPerWeek: 1,
    });

    expect(plan.nextAction.type).toBe("single_article_publish");
    expect(plan.nextAction.slug).toBe("la-so-tu-vi-theo-ngay-thang-nam-sinh");
    expect(plan.brief.slug).toBe("la-so-tu-vi-theo-ngay-thang-nam-sinh");
    expect(plan.brief.focusKeyword).toBe("lá số tử vi theo ngày tháng năm sinh");
  });

  it("extracts page SEO signals from rendered HTML", () => {
    const html = `
      <html>
        <head>
          <title>Lá số tử vi là gì? | Lá số tinh hoa</title>
          <meta name="description" content="Tìm hiểu lá số tử vi là gì cho người mới." />
          <link rel="canonical" href="https://lasotinhhoa.vn/kien-thuc-tu-vi/la-so-tu-vi-la-gi" />
          <script type="application/ld+json">{}</script>
        </head>
        <body><h1>Lá số tử vi là gì?</h1></body>
      </html>`;

    expect(extractPageSeo("https://lasotinhhoa.vn/kien-thuc-tu-vi/la-so-tu-vi-la-gi", html)).toMatchObject({
      url: "https://lasotinhhoa.vn/kien-thuc-tu-vi/la-so-tu-vi-la-gi",
      title: "Lá số tử vi là gì? | Lá số tinh hoa",
      metaDescription: "Tìm hiểu lá số tử vi là gì cho người mới.",
      canonical: "https://lasotinhhoa.vn/kien-thuc-tu-vi/la-so-tu-vi-la-gi",
      h1: ["Lá số tử vi là gì?"],
      jsonLdCount: 1,
    });
  });

  it("summarizes technical warnings and thin content risk", () => {
    const summary = summarizeSeoSnapshot({
      baseUrl: "https://lasotinhhoa.vn",
      robotsText: "User-Agent: *\nAllow: /\nSitemap: https://lasotinhhoa.vn/sitemap.xml",
      sitemapUrls: ["https://lasotinhhoa.vn/kien-thuc-tu-vi/bai-mong"],
      pages: [
        {
          url: "https://lasotinhhoa.vn/kien-thuc-tu-vi/bai-mong",
          title: "",
          metaDescription: "",
          canonical: "",
          h1: [],
          jsonLdCount: 0,
          htmlLength: 6000,
        },
      ],
    });

    expect(summary.status).toBe("warning");
    expect(summary.checks).toContain("robots.txt references sitemap.xml");
    expect(summary.warnings).toEqual(
      expect.arrayContaining([
        "1 page missing title",
        "1 page missing meta description",
        "1 page missing canonical",
        "1 page missing H1",
        "1 page has no JSON-LD",
        "1 page may be thin content",
      ]),
    );
  });

  it("formats plural page warnings clearly", () => {
    const summary = summarizeSeoSnapshot({
      baseUrl: "https://lasotinhhoa.vn",
      robotsText: "User-Agent: *\nSitemap: https://lasotinhhoa.vn/sitemap.xml",
      sitemapUrls: [
        "https://lasotinhhoa.vn/kien-thuc-tu-vi/a",
        "https://lasotinhhoa.vn/kien-thuc-tu-vi/b",
      ],
      pages: [
        { url: "a", title: "A", metaDescription: "A", canonical: "a", h1: ["A"], jsonLdCount: 0, htmlLength: 40000 },
        { url: "b", title: "B", metaDescription: "B", canonical: "b", h1: ["B"], jsonLdCount: 0, htmlLength: 40000 },
      ],
    });

    expect(summary.warnings).toContain("2 pages have no JSON-LD");
  });

  it("ranks missing topic opportunities for the Tu vi content cluster", () => {
    const opportunities = rankTopicOpportunities([
      "https://lasotinhhoa.vn/kien-thuc-tu-vi/la-so-tu-vi-la-gi",
      "https://lasotinhhoa.vn/kien-thuc-tu-vi/sao-chinh-tinh-tu-vi",
      "https://lasotinhhoa.vn/kien-thuc-tu-vi/cung-no-boc-trong-tu-vi",
    ]);

    expect(opportunities[0]).toMatchObject({
      slug: "sao-tu-vi",
      cluster: "14 chính tinh",
      intent: "Người đọc muốn hiểu ý nghĩa sao Tử Vi trong lá số và cách đọc theo cung.",
    });
    expect(opportunities.map((item) => item.slug)).not.toContain("la-so-tu-vi-la-gi");
    expect(opportunities.map((item) => item.slug)).toContain("cung-phu-mau-trong-tu-vi");
    expect(opportunities.map((item) => item.slug)).not.toContain("cung-noboc-trong-tu-vi");
  });

  it("extracts seed article slugs from the content source", () => {
    const source = `
export const seedArticles = [
  { title: "Lá số tử vi là gì?", slug: "la-so-tu-vi-la-gi" },
  { title: "Sao Tử Vi", slug: "sao-tu-vi" },
];`;

    expect(extractSeedArticleSlugs(source)).toEqual(["la-so-tu-vi-la-gi", "sao-tu-vi"]);
  });

  it("builds a publish-ready brief for the highest priority topic", () => {
    const brief = buildContentBrief({
      slug: "sao-tu-vi",
      cluster: "14 chính tinh",
      priority: 100,
      focusKeyword: "sao Tử Vi",
      intent: "Người đọc muốn hiểu ý nghĩa sao Tử Vi trong lá số và cách đọc theo cung.",
    });

    expect(brief.slug).toBe("sao-tu-vi");
    expect(brief.metaTitle).toContain("Sao Tử Vi");
    expect(brief.outline).toEqual(
      expect.arrayContaining([
        "Sao Tử Vi là gì?",
        "Ý nghĩa sao Tử Vi tại Mệnh, Quan Lộc, Tài Bạch và Phu Thê",
        "Cách tự kiểm tra sao Tử Vi trong lá số cá nhân",
      ]),
    );
    expect(brief.internalLinks).toEqual(
      expect.arrayContaining([
        "/#lap-la-so",
        "/kien-thuc-tu-vi/sao-chinh-tinh-tu-vi",
        "/kien-thuc-tu-vi/cach-doc-la-so-tu-vi-cho-nguoi-moi",
      ]),
    );
    expect(brief.faqs).toHaveLength(3);
    expect(brief.safetyGuards).toContain("Không hứa chắc kết quả hôn nhân, tài chính, sức khỏe hoặc vận mệnh.");
    expect(brief.targetCharacterRange).toEqual({ min: 6500, max: 9500 });
    expect(brief.internalLinkPolicy).toMatchObject({
      minInternalLinks: 5,
      maxExactMatchAnchors: 2,
      requiredLinks: ["/#lap-la-so", "/kien-thuc-tu-vi"],
    });
    expect(brief.uniqueValueRequirements).toMatchObject({
      minDataEnrichmentBlocks: 2,
      interactiveElement: {
        required: true,
        targetLink: "/#lap-la-so",
      },
    });
    expect(brief.uniqueValueRequirements.requiredDataBlocks).toEqual(
      expect.arrayContaining(["structured-score-table", "modifier-stars-or-context"]),
    );
    expect(brief.uniqueValueRequirements.expertPromptFrame.join(" ")).toContain("logic nhan qua");
    expect(brief.coverAssetRequirements).toMatchObject({
      preferredPath: "public/articles/sao-tu-vi.webp",
      publicPath: "/articles/sao-tu-vi.webp",
      format: "webp",
      dimensions: { width: 1200, height: 675 },
    });
    expect(brief.coverAssetRequirements.subject).toContain("photo-editorial");
    expect(brief.coverAssetRequirements.subject).toContain("real-world Vietnamese scene");
    expect(brief.coverAssetRequirements.composition).toContain(
      "Prefer no text overlay on the image; let the scene carry the meaning when possible.",
    );
    expect(brief.coverAssetRequirements.composition.join(" ")).toContain("real-looking photographic");
    expect(brief.coverAssetRequirements.composition.join(" ")).toContain("vector art");
    expect(brief.coverAssetRequirements.usage).toContain(
      "If the cover includes visible text, it must be proper Vietnamese with diacritics; never ship ASCII-only Vietnamese text on the final asset.",
    );
    expect(brief.coverAssetRequirements.noGo.join(" ")).toContain("text-only SVG");
    expect(brief.coverAssetRequirements.noGo.join(" ")).toContain("vector-style layout");
    expect(brief.coverAssetRequirements.noGo.join(" ")).toContain("abstract stand-in scene");
    expect(brief.coverAssetRequirements.noGo.join(" ")).toContain("without diacritics");
    expect(brief.programmaticSeoGuardrails.join(" ")).toContain("Doorway");
    expect(brief.googleQualityPolicy).toEqual(
      expect.arrayContaining([
        "People-first: giải quyết câu hỏi thật của người đọc trước khi tối ưu keyword.",
        "Không sản xuất nội dung hàng loạt mỏng chỉ để thao túng thứ hạng.",
        "Không đặt word count cố định như tín hiệu ranking; range ký tự chỉ để tránh bài quá mỏng so với intent.",
      ]),
    );
  });

  it("builds a weekly plan with 3 articles mapped to keyword funnel stages", () => {
    const opportunities = rankTopicOpportunities([
      "https://lasotinhhoa.vn/kien-thuc-tu-vi/la-so-tu-vi-la-gi",
      "https://lasotinhhoa.vn/kien-thuc-tu-vi/sao-chinh-tinh-tu-vi",
    ]);
    const plan = buildWeeklyContentPlan({ opportunities, articlesPerWeek: 3 });

    expect(plan.articlesPerWeek).toBe(3);
    expect(plan.strategy).toBe("topic-cluster-funnel");
    expect(plan.measurementCadence).toBe("weekly");
    expect(plan.articles).toHaveLength(3);
    expect(plan.articles.map((item) => item.funnelStage)).toEqual(["top", "middle", "conversion-support"]);
    for (const item of plan.articles) {
      expect(item.brief.targetCharacterRange.min).toBeGreaterThanOrEqual(4500);
      expect(item.brief.internalLinkPolicy.minInternalLinks).toBeGreaterThanOrEqual(5);
      expect(item.brief.googleQualityPolicy.join(" ")).toContain("People-first");
      expect(item.measurementPlan).toEqual(
        expect.arrayContaining([
          "Track impressions, clicks, CTR, and average position after indexing.",
          "Refresh title/meta/internal links if impressions rise but CTR stays weak.",
        ]),
      );
    }
  });

  it("plans an autonomous SEO run from live snapshot and repo inventory", () => {
    const plan = planSeoAutopilotRun({
      snapshot: {
        status: "warning",
        sitemapUrlCount: 29,
        warnings: ["4 pages have no JSON-LD"],
        opportunities: rankTopicOpportunities([
          "https://lasotinhhoa.vn/kien-thuc-tu-vi/la-so-tu-vi-la-gi",
        ]),
      },
      existingSlugs: ["la-so-tu-vi-la-gi", "sao-chinh-tinh-tu-vi"],
    });

    expect(plan.mode).toBe("auto-safe");
    expect(plan.nextAction).toMatchObject({
      type: "weekly_content_batch",
      approvalRequired: false,
    });
    expect(plan.nextAction.slugs.slice(0, 3)).toEqual(["sao-tu-vi", "sao-thien-co", "sao-thai-duong"]);
    expect(plan.weeklyContentPlan.articles).toHaveLength(7);
    expect(plan.weeklyContentPlan.articles.map((item) => item.day)).toEqual([
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ]);
    expect(plan.brief.focusKeyword).toBe("sao Tử Vi");
    expect(plan.verificationCommands).toEqual(
      expect.arrayContaining([
        "npm run seo:autopilot",
        "npm test -- src/lib/content.test.ts src/lib/article-cover-assets.test.ts src/lib/seo-autopilot-core.test.ts",
        "npm run build",
      ]),
    );
  });

  it("can plan a single publisher task to avoid repeated batch work", () => {
    const plan = planSeoAutopilotRun({
      snapshot: {
        status: "ok",
        sitemapUrlCount: 30,
        warnings: [],
      },
      existingSlugs: ["la-so-tu-vi-la-gi", "sao-chinh-tinh-tu-vi"],
      articlesPerWeek: 1,
    });

    expect(plan.nextAction.slugs).toHaveLength(1);
    expect(plan.nextAction.type).toBe("single_article_publish");
    expect(plan.weeklyContentPlan.articles).toHaveLength(1);
    expect(plan.nextAction.reason).toContain("Publish 1 people-first");
  });

  it("reports blocked when the daily publisher has no distinct SEMrush-backed topic left", () => {
    const rows = parseSemrushKeywordCsv(
      [
        "keyword,intent,volume,kd_percent,cpc_usd",
        "lÃ¡ sá»‘ tá»­ vi,I,368.0K,61,0.01",
        "táº¡o lÃ¡ sá»‘ tá»­ vi,I,8.1K,44,0.01",
        "phÃ¢n tÃ­ch lÃ¡ sá»‘ tá»­ vi,I,590,33,0.02",
      ].join("\n"),
    );

    const plan = planSeoAutopilotRun({
      snapshot: {
        status: "ok",
        sitemapUrlCount: 30,
        warnings: [],
      },
      existingSlugs: [
        "la-so-tu-vi-la-gi",
        "tao-la-so-tu-vi",
        "phan-tich-la-so-tu-vi",
        "la-so-tu-vi-online",
        "la-so-tu-vi-mien-phi",
        "sao-tu-vi",
        "sao-thien-co",
        "sao-thai-duong",
        "menh-vo-chinh-dieu",
        "cung-phu-mau-trong-tu-vi",
        "tieu-van-la-gi",
        "lap-la-so-tu-vi-can-gi",
      ],
      keywordRows: rows,
      articlesPerWeek: 1,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.nextAction.type).toBe("blocked");
    expect(plan.nextAction.reason).toContain("No safe new SEO article opportunities remain");
    expect(plan.weeklyContentPlan.articles).toEqual([]);
  });

  it("requires an explicit bounded cluster mode for multi-article publishing", () => {
    expect(normalizePublisherSelection({ articles: 5, clusterMode: true })).toEqual({
      articles: 5,
      clusterMode: true,
    });
    expect(normalizePublisherSelection({ articles: 9, clusterMode: true })).toEqual({
      articles: 5,
      clusterMode: true,
    });
    expect(() => normalizePublisherSelection({ articles: 1, clusterMode: true })).toThrow(
      "Cluster mode requires between 2 and 5 articles.",
    );
  });

  it("marks an explicitly authorized cluster as one atomic publish action", () => {
    const plan = planSeoAutopilotRun({
      snapshot: {
        status: "ok",
        sitemapUrlCount: 30,
        warnings: [],
      },
      existingSlugs: ["la-so-tu-vi-la-gi"],
      articlesPerWeek: 3,
      clusterMode: true,
    });

    expect(plan.nextAction.type).toBe("cluster_article_publish");
    expect(plan.nextAction.slugs).toHaveLength(3);
    expect(plan.nextAction).toMatchObject({
      explicitAuthorizationRequired: true,
      atomicRelease: true,
      distinctIntentRequired: true,
    });
  });

  it("falls back to the next publisher slug when the last single-task run picked the same article", () => {
    const plan = planSeoAutopilotRun({
      snapshot: {
        status: "ok",
        sitemapUrlCount: 30,
        warnings: [],
        opportunities: [
          {
            slug: "tao-la-so-tu-vi",
            cluster: "Lá số tử vi",
            priority: 98,
            focusKeyword: "tạo lá số tử vi",
            intent: "Người đọc muốn tạo lá số tử vi online.",
            funnelStage: "conversion-support",
          },
          {
            slug: "la-so-bat-tu-va-tu-vi",
            cluster: "Bát tự và tử vi",
            priority: 94,
            focusKeyword: "lá số bát tự",
            intent: "Người đọc cần phân biệt bát tự với lá số tử vi.",
            funnelStage: "middle",
          },
        ],
      },
      existingSlugs: ["la-so-tu-vi-la-gi"],
      articlesPerWeek: 1,
      previousState: {
        lastAction: {
          slug: "tao-la-so-tu-vi",
        },
      },
    });

    expect(plan.nextAction.slug).toBe("la-so-bat-tu-va-tu-vi");
    expect(plan.nextAction.slugs).toEqual(["la-so-bat-tu-va-tu-vi"]);
    expect(plan.brief.slug).toBe("la-so-bat-tu-va-tu-vi");
  });

  it("chooses a different candidate when the last publisher slug repeats", () => {
    const rows = parseSemrushKeywordCsv(
      [
        "keyword,intent,volume,kd_percent,cpc_usd",
        "lá số tử vi,I,368.0K,61,0.01",
        "tạo lá số tử vi,I,8.1K,44,0.01",
        "lá số bát tự,I,12.1K,30,0.01",
        "chiêm tinh lá số,I,4.2K,40,0.01",
        "an sao lá số tử vi,I,3.0K,35,0.01",
      ].join("\n"),
    );

    const plan = planSeoAutopilotRun({
      snapshot: {
        status: "warning",
        sitemapUrlCount: 47,
        warnings: ["4 pages have no JSON-LD"],
        opportunities: [],
      },
      existingSlugs: [
        "lap-la-so-tu-vi-chuan",
        "tao-la-so-tu-vi",
        "la-so-bat-tu-va-tu-vi",
        "chiem-tinh-la-so-va-tu-vi",
        "an-sao-la-so-tu-vi",
        "sao-tu-vi",
        "sao-thien-co",
        "sao-thai-duong",
        "menh-vo-chinh-dieu",
        "cung-phu-mau-trong-tu-vi",
        "tieu-van-la-gi",
        "lap-la-so-tu-vi-can-gi",
      ],
      keywordRows: rows,
      articlesPerWeek: 1,
      previousState: {
        lastAction: {
          slug: "sao-tu-vi",
        },
      },
    });

    expect(plan.nextAction.type).toBe("single_article_publish");
    expect(plan.nextAction.slug).not.toBe("sao-tu-vi");
    expect(plan.nextAction.slugs).toHaveLength(1);
    expect(plan.brief.slug).toBe(plan.nextAction.slug);
  });

  it("renders a content draft artifact that automation can publish later", () => {
    const draft = renderContentDraft(
      buildContentBrief({
        slug: "sao-tu-vi",
        cluster: "14 chính tinh",
        priority: 100,
        focusKeyword: "sao Tử Vi",
        intent: "Người đọc muốn hiểu ý nghĩa sao Tử Vi trong lá số và cách đọc theo cung.",
      }),
      { generatedAt: "2026-06-09T00:00:00.000Z" },
    );

    expect(draft).toContain("slug: sao-tu-vi");
    expect(draft).toContain("# Sao Tử Vi trong lá số: ý nghĩa và cách đọc dễ hiểu");
    expect(draft).toContain("## Outline");
    expect(draft).toContain("## FAQ");
    expect(draft).toContain("## Unique Value Requirements");
    expect(draft).toContain("structured-score-table");
    expect(draft).toContain("expert prompt frame");
    expect(draft).toContain("interactive CTA");
    expect(draft).toContain("## Cover Asset Requirements");
    expect(draft).toContain("Preferred file: public/articles/sao-tu-vi.webp");
    expect(draft).toContain("Public path: /articles/sao-tu-vi.webp");
    expect(draft).toContain("/#lap-la-so");
    expect(draft).toContain("Không hứa chắc kết quả hôn nhân, tài chính, sức khỏe hoặc vận mệnh.");
  });

  it("renders a run report with next action and verification checklist", () => {
    const report = renderRunReport({
      generatedAt: "2026-06-09T00:00:00.000Z",
      baseUrl: "https://lasotinhhoa.vn",
      contentInventory: { seedArticleCount: 23 },
      plan: {
        status: "warning",
        nextAction: {
          type: "draft_article",
          slug: "sao-tu-vi",
          reason: "Missing 14 chính tinh coverage",
          approvalRequired: false,
        },
        verificationCommands: ["npm run seo:autopilot", "npm run build"],
      },
      snapshot: {
        sitemapUrlCount: 29,
        warnings: ["4 pages have no JSON-LD"],
      },
      artifacts: {
        draftPath: "docs/seo-autopilot/drafts/sao-tu-vi.md",
      },
    });

    expect(report).toContain("# SEO Autopilot Report");
    expect(report).toContain("Status: warning");
    expect(report).toContain("Next action: draft_article `sao-tu-vi`");
    expect(report).toContain("Draft: `docs/seo-autopilot/drafts/sao-tu-vi.md`");
    expect(report).toContain("## Programmatic SEO Guardrails");
    expect(report).toContain("Doorway");
    expect(report).toContain("npm run build");
  });
});
