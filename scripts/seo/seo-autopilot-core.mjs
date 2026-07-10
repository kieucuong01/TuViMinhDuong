import { existsSync, readFileSync } from "node:fs";

const DEFAULT_KEYWORD_CSV_PATHS = [
  "data/seo/semrush_la_so_keywords.csv",
  "D:\\DU AN CA NHAN WEBSITE\\tsh\\semrush_la_so_keywords.csv",
];

const DEFAULT_TOPIC_OPPORTUNITIES = [
  {
    slug: "sao-tu-vi",
    cluster: "14 chính tinh",
    priority: 100,
    focusKeyword: "sao Tử Vi",
    intent: "Người đọc muốn hiểu ý nghĩa sao Tử Vi trong lá số và cách đọc theo cung.",
  },
  {
    slug: "sao-thien-co",
    cluster: "14 chính tinh",
    priority: 96,
    focusKeyword: "sao Thiên Cơ",
    intent: "Người đọc muốn biết sao Thiên Cơ nói gì về tư duy, nghề nghiệp và biến động.",
  },
  {
    slug: "sao-thai-duong",
    cluster: "14 chính tinh",
    priority: 94,
    focusKeyword: "sao Thái Dương",
    intent: "Người đọc muốn hiểu sao Thái Dương tại Mệnh, Quan Lộc, Tài Bạch và Phu Thê.",
  },
  {
    slug: "menh-vo-chinh-dieu",
    cluster: "Cách cục lá số",
    priority: 92,
    focusKeyword: "Mệnh vô chính diệu",
    intent: "Người đọc có cung Mệnh không chính tinh và muốn biết cách đọc đúng.",
  },
  {
    slug: "cung-phu-mau-trong-tu-vi",
    cluster: "12 cung",
    priority: 88,
    focusKeyword: "cung Phụ Mẫu",
    intent: "Người đọc muốn hiểu duyên với cha mẹ, nền gia đình và sự hỗ trợ trưởng bối.",
  },
  {
    slug: "tieu-van-la-gi",
    cluster: "Vận hạn",
    priority: 86,
    focusKeyword: "tiểu vận là gì",
    intent: "Người đọc muốn phân biệt đại vận, tiểu vận, nguyệt vận và nhật vận.",
  },
  {
    slug: "lap-la-so-tu-vi-can-gi",
    cluster: "Chuyển đổi",
    priority: 84,
    focusKeyword: "lập lá số tử vi cần gì",
    intent: "Người đọc muốn biết cần ngày giờ sinh nào trước khi lập lá số.",
  },
];

const KEYWORD_CLUSTER_RULES = [
  {
    id: "core-la-so-tu-vi",
    label: "Core la so tu vi",
    pattern: /\bla so tu vi\b|\btu vi la so\b/,
    stage: "top",
    pillarSlug: "la-so-tu-vi-la-gi",
    opportunity: {
      slug: "tao-la-so-tu-vi",
      cluster: "Lá số tử vi",
      focusKeyword: "tạo lá số tử vi",
      intent:
        "Người đọc muốn tạo lá số tử vi online nhưng cần hiểu nên chuẩn bị ngày giờ sinh, giới tính và cách đọc kết quả.",
      funnelStage: "conversion-support",
      priority: 98,
    },
    secondaryOpportunities: [
      {
        slug: "la-so-tu-vi-online",
        cluster: "LÃ¡ sá»‘ tá»­ vi",
        focusKeyword: "lÃ¡ sá»‘ tá»­ vi online",
        intent:
          "NgÆ°á»i Ä‘á»c muá»‘n xem lÃ¡ sá»‘ tá»­ vi online nhÆ°ng cáº§n biáº¿t nÃªn chuáº©n bá»‹ dá»¯ liá»‡u nÃ o, kÃ¬ vá»ng Ä‘Æ°á»£c gÃ¬ vÃ  giá»›i háº¡n cá»§a cÃ´ng cá»¥ online á»Ÿ Ä‘Ã¢u.",
        funnelStage: "conversion-support",
        priority: 93,
      },
    ],
  },
  {
    id: "lap-lay-tao-la-so",
    label: "Lap lay tao la so",
    pattern: /\b(lap|lay|tao|tra|cham|ve|ke)\b.*\bla so\b|\bla so\b.*\b(lap|lay|tao|tra|cham|ve|ke)\b/,
    stage: "conversion-support",
    pillarSlug: "lap-la-so-tu-vi-chuan",
    opportunity: {
      slug: "lap-la-so-tu-vi-chuan",
      cluster: "Lập lá số tử vi",
      focusKeyword: "lập lá số tử vi chuẩn",
      intent:
        "Người đọc muốn biết lập lá số tử vi chuẩn cần thông tin nào và vì sao giờ sinh, lịch sinh ảnh hưởng kết quả.",
      funnelStage: "conversion-support",
      priority: 96,
    },
  },
  {
    id: "theo-ngay-thang-nam-sinh",
    label: "Theo ngay thang nam sinh",
    pattern: /\bla so tu vi\b.*\btheo ngay thang nam sinh\b|\btheo ngay thang nam sinh\b.*\bla so tu vi\b/,
    stage: "conversion-support",
    pillarSlug: "lap-la-so-tu-vi-can-gi",
    opportunity: {
      slug: "la-so-tu-vi-theo-ngay-thang-nam-sinh",
      cluster: "Chuyển đổi",
      focusKeyword: "lá số tử vi theo ngày tháng năm sinh",
      intent:
        "Người đọc muốn biết chỉ với ngày tháng năm sinh thì lập lá số tử vi được đến đâu, thiếu giờ sinh sẽ lệch phần nào và nên kiểm tra gì trước khi tin vào kết quả.",
      funnelStage: "conversion-support",
      priority: 83,
    },
  },
  {
    id: "xem-giai-luan-doc",
    label: "Xem giai luan doc la so",
    pattern: /\b(xem|giai|luan|doc|phan tich|cach xem|cach doc)\b.*\bla so\b|\bla so\b.*\b(xem|giai|luan|doc|phan tich)\b/,
    stage: "middle",
    pillarSlug: "cach-doc-la-so-tu-vi-cho-nguoi-moi",
    opportunity: {
      slug: "phan-tich-la-so-tu-vi",
      cluster: "Đọc và giải lá số",
      focusKeyword: "phân tích lá số tử vi",
      intent:
        "Người đọc đã có lá số và muốn biết nên phân tích Mệnh, Thân, 12 cung, chính tinh và vận hạn theo thứ tự nào.",
      funnelStage: "middle",
      priority: 90,
    },
    secondaryOpportunities: [
      {
        slug: "xem-la-so-tu-vi-online",
        cluster: "Äá»c vÃ  giáº£i lÃ¡ sá»‘",
        focusKeyword: "xem lÃ¡ sá»‘ tá»­ vi",
        intent:
          "NgÆ°á»i Ä‘á»c Ä‘Ã£ cÃ³ lÃ¡ sá»‘ vÃ  muá»‘n biáº¿t nÃªn xem online pháº§n nÃ o trÆ°á»›c, Ä‘á»‘i chiáº¿u Má»‡nh - ThÃ¢n ra sao vÃ  trÃ¡nh hiá»ƒu sai khi tá»± Ä‘á»c.",
        funnelStage: "middle",
        priority: 89,
      },
    ],
  },
  {
    id: "binh-giai-luan-giai",
    label: "Binh giai luan giai la so",
    pattern:
      /\b(binh giai|luan giai|giai la so|dich la so)\b.*\bla so\b|\bla so\b.*\b(binh giai|luan giai|giai la so|dich la so)\b/,
    stage: "middle",
    pillarSlug: "giai-ma-la-so-tu-vi",
    opportunity: {
      slug: "binh-giai-la-so-tu-vi",
      cluster: "Doc va luan la so",
      focusKeyword: "bình giải lá số tử vi",
      intent:
        "Người đọc đã có lá số và muốn hiểu phần bình giải nên dùng như thế nào, câu hỏi nào có thể đọc sâu hơn và khi nào cần quay lại kiểm tra dữ liệu nền trước khi tin kết luận.",
      funnelStage: "middle",
      priority: 91,
    },
  },
  {
    id: "bat-tu-tu-tru",
    label: "Bat tu tu tru",
    pattern: /\bbat tu\b|\btu tru\b|\btu try\b|\btu tru\b/,
    stage: "middle",
    pillarSlug: "la-so-bat-tu-va-tu-vi",
    opportunity: {
      slug: "la-so-bat-tu-va-tu-vi",
      cluster: "Bát tự và tử vi",
      focusKeyword: "lá số bát tự",
      intent:
        "Người đọc tìm lá số bát tự và cần phân biệt bát tự, tứ trụ với lá số tử vi trước khi chọn cách xem phù hợp.",
      funnelStage: "middle",
      priority: 94,
    },
    secondaryOpportunities: [
      {
        slug: "lap-la-so-bat-tu",
        cluster: "BÃ¡t tá»± vÃ  tá»­ vi",
        focusKeyword: "láº­p lÃ¡ sá»‘ bÃ¡t tá»±",
        intent:
          "NgÆ°á»i Ä‘á»c muá»‘n láº­p lÃ¡ sá»‘ bÃ¡t tá»± vÃ  cáº§n hiá»ƒu dÃ¹ng ngÃ y giá» sinh ra sao, khÃ¡c gÃ¬ vá»›i tá»­ vi vÃ  khi nÃ o nÃªn chá»n bÃ¡t tá»±.",
        funnelStage: "middle",
        priority: 87,
      },
    ],
  },
  {
    id: "mien-phi-online",
    label: "Mien phi online",
    pattern: /\bmien phi\b|\bonline\b/,
    stage: "conversion-support",
    pillarSlug: "la-so-tu-vi-mien-phi",
    opportunity: {
      slug: "la-so-tu-vi-mien-phi",
      cluster: "Lập lá số tử vi",
      focusKeyword: "lá số tử vi miễn phí",
      intent:
        "Người đọc muốn biết lá số tử vi miễn phí xem được phần nào và khi nào nên đọc thêm phần phân tích chuyên sâu.",
      funnelStage: "conversion-support",
      priority: 88,
    },
    secondaryOpportunities: [
      {
        slug: "xem-la-so-tu-vi-mien-phi",
        cluster: "LÃ¡ sá»‘ tá»­ vi miá»…n phÃ­",
        focusKeyword: "xem lÃ¡ sá»‘ tá»­ vi miá»…n phÃ­",
        intent:
          "NgÆ°á»i Ä‘á»c muá»‘n xem lÃ¡ sá»‘ tá»­ vi miá»…n phÃ­ online vÃ  cáº§n biáº¿t nÃªn xem pháº§n nÃ o trÆ°á»›c, pháº§n nÃ o chá»‰ nÃªn dÃ¹ng nhÆ° tham kháº£o.",
        funnelStage: "conversion-support",
        priority: 85,
      },
    ],
  },
  {
    id: "tron-doi",
    label: "Tron doi",
    pattern: /\btron doi\b/,
    stage: "middle",
    pillarSlug: "la-so-tu-vi-tron-doi",
    opportunity: {
      slug: "la-so-tu-vi-tron-doi",
      cluster: "Đọc và giải lá số",
      focusKeyword: "lá số tử vi trọn đời",
      intent:
        "Người đọc muốn hiểu khái niệm lá số trọn đời theo hướng tham khảo dài hạn, không phải lời khẳng định số phận.",
      funnelStage: "middle",
      priority: 84,
    },
  },
  {
    id: "chiem-tinh",
    label: "Chiem tinh la so",
    pattern: /\bchiem tinh\b/,
    stage: "top",
    pillarSlug: "chiem-tinh-la-so-va-tu-vi",
    opportunity: {
      slug: "chiem-tinh-la-so-va-tu-vi",
      cluster: "So sánh hệ thống lá số",
      focusKeyword: "chiêm tinh lá số",
      intent:
        "Người đọc đang tìm lá số chiêm tinh và cần hiểu khác biệt giữa chiêm tinh, tử vi và bát tự trước khi đi sâu.",
      funnelStage: "top",
      priority: 82,
    },
  },
  {
    id: "an-sao",
    label: "An sao la so",
    pattern: /\ban sao\b|\bcac sao\b|\bsao trong la so\b/,
    stage: "middle",
    pillarSlug: "an-sao-la-so-tu-vi",
    opportunity: {
      slug: "an-sao-la-so-tu-vi",
      cluster: "Đọc và giải lá số",
      focusKeyword: "an sao lá số tử vi",
      intent:
        "Người đọc muốn hiểu an sao là gì, vì sao vị trí sao thay đổi theo giờ sinh và nên đọc sao trong ngữ cảnh nào.",
      funnelStage: "middle",
      priority: 80,
    },
    secondaryOpportunities: [
      {
        slug: "cac-sao-trong-la-so-tu-vi",
        cluster: "Äá»c vÃ  giáº£i lÃ¡ sá»‘",
        focusKeyword: "cÃ¡c sao trong lÃ¡ sá»‘ tá»­ vi",
        intent:
          "NgÆ°á»i Ä‘á»c muá»‘n hiá»ƒu nhÃ³m sao trong lÃ¡ sá»‘ tá»­ vi nÃªn Ä‘á»c theo thá»© tá»± nÃ o, sao nÃ o lÃ  chá»§ tinh vÃ  sao nÃ o chá»‰ nÃªn xem nhÆ° yáº¿u tá»‘ bá»• sung.",
        funnelStage: "middle",
        priority: 78,
      },
    ],
  },
];

const KEYWORD_EXCLUSION_RULES = [
  {
    id: "stale-year",
    label: "Stale year keywords",
    pattern: /\b20(19|20|21|22|23|24|25)\b/,
    reason: "Avoid stale year pages that invite thin freshness-only content.",
  },
  {
    id: "competitor-navigation",
    label: "Competitor or navigational keywords",
    pattern: /\btuvivietnam\b|\bco hoc\b|\bcao anh\b|\bxemtuong\b|\blyso\b|\bthang long\b|\bthien phu\b/,
    reason: "Avoid competitor/navigation pages and brand-confusing search capture.",
  },
  {
    id: "birth-year-doorway",
    label: "Birth-year doorway risk",
    pattern: /\btuoi\b.*\b(19|20)\d{2}\b|\b(19|20)\d{2}\b.*\btuoi\b/,
    reason: "Avoid mass-producing age/year pages with near-identical claims.",
  },
];

const OVERLAPPING_INTENT_SLUG_GROUPS = [
  ["la-so-tu-vi-online", "xem-la-so-tu-vi-online"],
  ["la-so-tu-vi-mien-phi", "xem-la-so-tu-vi-mien-phi"],
];

const PROGRAMMATIC_SEO_GUARDRAILS = [
  "Doorway Pages: do not create near-duplicate pages by swapping star, palace, birth-year, or keyword variables into the same frame.",
  "Helpful Content: reject thin generic AI advice; every publishable article must add structured data, expert causal logic, and a next useful action.",
  "One search intent, one useful URL: merge close variants instead of making separate pages for lap, lay, tao, tra, ve, or ke when the user need is the same.",
  "Programmatic content needs unique value from the product: score tables, modifier-star context, chart-form interaction, and clear limits of interpretation.",
];

export function readSemrushKeywordRows({ csvPath, candidatePaths = DEFAULT_KEYWORD_CSV_PATHS } = {}) {
  const paths = [csvPath, process.env.SEO_KEYWORD_CSV_PATH, ...candidatePaths].filter(Boolean);
  const selectedPath = paths.find((path) => existsSync(path));
  if (!selectedPath) {
    return { sourcePath: null, rows: [], warning: "No SEMrush keyword CSV found; using built-in topic opportunities." };
  }
  const csv = readFileSync(selectedPath, "utf8");
  return { sourcePath: selectedPath, rows: parseSemrushKeywordCsv(csv), warning: null };
}

export function parseSemrushKeywordCsv(csv) {
  const records = parseCsvRecords(csv);
  if (records.length < 2) return [];
  const headers = records[0].map((value) => value.trim());
  return records
    .slice(1)
    .map((record) =>
      Object.fromEntries(headers.map((header, index) => [header, record[index] ? record[index].trim() : ""])),
    )
    .filter((row) => row.keyword);
}

export function buildKeywordIntelligence(keywordRows = []) {
  const rows = keywordRows.map(normalizeKeywordRow).filter((row) => row.keyword);
  const excluded = [];
  const included = [];

  for (const row of rows) {
    const exclusion = KEYWORD_EXCLUSION_RULES.find((rule) => rule.pattern.test(row.normalizedKeyword));
    if (exclusion) {
      excluded.push({ ...row, exclusionId: exclusion.id, exclusionReason: exclusion.reason });
    } else {
      included.push(row);
    }
  }

  const clusters = KEYWORD_CLUSTER_RULES.map((rule) => {
    const matches = included.filter((row) => rule.pattern.test(row.normalizedKeyword));
    const totalVolume = sum(matches.map((row) => row.volume));
    const weightedKd = weightedAverage(matches.map((row) => [row.kd, row.volume]));
    const topKeywords = matches
      .slice()
      .sort((left, right) => right.volume - left.volume)
      .slice(0, 8)
      .map((row) => ({
        keyword: row.keyword,
        volume: row.volume,
        kd: row.kd,
        intent: row.intent,
      }));
    const opportunityScore = Math.round(totalVolume / Math.max(1, weightedKd || 35));
    const opportunities = [rule.opportunity, ...(rule.secondaryOpportunities || [])].map((opportunity, index) => ({
      ...opportunity,
      funnelStage: opportunity.funnelStage || rule.stage,
      priority: opportunity.priority + opportunityScore - index,
      keywordEvidence: {
        clusterId: rule.id,
        totalVolume,
        keywordCount: matches.length,
        averageKd: weightedKd,
        topKeywords,
      },
    }));

    return {
      id: rule.id,
      label: rule.label,
      stage: rule.stage,
      pillarSlug: rule.pillarSlug,
      totalVolume,
      keywordCount: matches.length,
      averageKd: weightedKd,
      opportunityScore,
      topKeywords,
      opportunity: opportunities[0],
      opportunities,
    };
  })
    .filter((cluster) => cluster.keywordCount > 0)
    .sort((left, right) => right.opportunityScore - left.opportunityScore);

  return {
    source: "semrush_la_so_keywords",
    rowCount: rows.length,
    includedCount: included.length,
    excludedCount: excluded.length,
    totalIncludedVolume: sum(included.map((row) => row.volume)),
    clusters,
    excludedSummary: summarizeExcludedKeywords(excluded),
    googleSafeRules: [
      "Build pillar pages and supporting articles by search intent, not by every keyword variation.",
      "Merge synonyms such as lap, lay, tao, tra, ve, ke la so into one helpful conversion-support page when intent overlaps.",
      "Skip stale year, competitor-navigation, and birth-year doorway keywords unless a genuinely useful evergreen angle exists.",
      "Use target character ranges as anti-thin-content safeguards, not ranking promises.",
    ],
    pillarFunnel: buildPillarFunnel(clusters),
  };
}

export function buildKeywordDrivenOpportunities({ keywordRows, existingSlugs = [] } = {}) {
  const intelligence = buildKeywordIntelligence(keywordRows || []);
  const existing = new Set(existingSlugs || []);
  const dedupedOpportunities = new Map();

  for (const cluster of intelligence.clusters) {
    for (const item of cluster.opportunities || [cluster.opportunity]) {
      if (!item?.slug || existing.has(item.slug) || overlapsExistingIntent(item.slug, existing)) continue;
      const current = dedupedOpportunities.get(item.slug);
      if (!current || item.priority > current.priority) {
        dedupedOpportunities.set(item.slug, item);
      }
    }
  }

  const opportunities = [...dedupedOpportunities.values()].sort((left, right) => right.priority - left.priority);
  return { opportunities, intelligence };
}

function rankRefreshTopicOpportunities(existingSlugs, keywordPlan) {
  const existing = new Set(existingSlugs || []);
  const keywordRefreshes = (keywordPlan?.intelligence?.clusters || [])
    .map((cluster) => cluster.opportunity)
    .filter((item) => existing.has(item.slug))
    .sort((left, right) => right.priority - left.priority);

  if (keywordRefreshes.length) {
    return keywordRefreshes;
  }

  return DEFAULT_TOPIC_OPPORTUNITIES.filter((item) => existing.has(item.slug)).sort(
    (left, right) => right.priority - left.priority,
  );
}

export function extractSitemapUrls(xml) {
  if (!xml) return [];
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((match) => decodeHtml(match[1].trim()));
}

export function extractPageSeo(url, html) {
  const source = html || "";
  return {
    url,
    title: normalizeWhitespace(matchFirst(source, /<title[^>]*>([\s\S]*?)<\/title>/i)),
    metaDescription: normalizeWhitespace(
      matchFirst(source, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i) ||
        matchFirst(source, /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["'][^>]*>/i),
    ),
    canonical: normalizeWhitespace(
      matchFirst(source, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["'][^>]*>/i) ||
        matchFirst(source, /<link[^>]+href=["']([^"']*)["'][^>]+rel=["']canonical["'][^>]*>/i),
    ),
    h1: [...source.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map((match) =>
      normalizeWhitespace(stripTags(match[1])),
    ),
    jsonLdCount: [...source.matchAll(/application\/ld\+json/gi)].length,
    htmlLength: source.length,
  };
}

export function summarizeSeoSnapshot({ baseUrl, robotsText, sitemapUrls, pages }) {
  const checks = [];
  const warnings = [];
  const normalizedRobots = robotsText || "";
  const pageList = pages || [];

  if (!normalizedRobots.trim()) {
    warnings.push("robots.txt is empty or unavailable");
  } else if (!/sitemap:\s*\S*\/sitemap\.xml/i.test(normalizedRobots)) {
    warnings.push("robots.txt does not reference sitemap.xml");
  } else {
    checks.push("robots.txt references sitemap.xml");
  }

  if (!Array.isArray(sitemapUrls) || sitemapUrls.length === 0) {
    warnings.push("sitemap has no URLs");
  }

  addPageWarning(warnings, pageList, (page) => !page.title, "missing title");
  addPageWarning(warnings, pageList, (page) => !page.metaDescription, "missing meta description");
  addPageWarning(warnings, pageList, (page) => !page.canonical, "missing canonical");
  addPageWarning(warnings, pageList, (page) => !page.h1?.length, "missing H1");
  addPageWarning(warnings, pageList, (page) => page.jsonLdCount === 0, "has no JSON-LD");
  addPageWarning(warnings, pageList, (page) => page.htmlLength > 0 && page.htmlLength < 12000, "may be thin content");

  return {
    baseUrl,
    status: warnings.length ? "warning" : "ok",
    sitemapUrlCount: sitemapUrls?.length || 0,
    checkedPageCount: pageList.length,
    checks,
    warnings,
    opportunities: rankTopicOpportunities(sitemapUrls || []).slice(0, 5),
  };
}

export function rankTopicOpportunities(existingUrls) {
  const existingSlugs = new Set(
    (existingUrls || [])
      .map((value) => String(value).split("?")[0].replace(/\/$/, "").split("/").pop())
      .filter(Boolean),
  );

  return DEFAULT_TOPIC_OPPORTUNITIES.filter((item) => !existingSlugs.has(item.slug)).sort(
    (left, right) => right.priority - left.priority,
  );
}

export function extractSeedArticleSlugs(source) {
  return [...String(source || "").matchAll(/\bslug:\s*["']([^"']+)["']/g)]
    .map((match) => match[1])
    .filter(Boolean);
}

export function buildContentBrief(opportunity) {
  const topic = opportunity || DEFAULT_TOPIC_OPPORTUNITIES[0];
  const focusKeyword = topic.focusKeyword || topic.slug;
  const titleTopic = uppercaseFirst(focusKeyword);
  const targetCharacterRange = characterRangeForTopic(topic);
  const overrides = briefOverridesForTopic(topic, { focusKeyword, titleTopic });
  const title = overrides.title || `${titleTopic} trong lá số: ý nghĩa và cách đọc dễ hiểu`;
  const metaTitle = overrides.metaTitle || `${titleTopic} trong lá số: ý nghĩa và cách đọc | Lá số tinh hoa`;
  const metaDescription =
    overrides.metaDescription ||
    `Tìm hiểu ${focusKeyword} trong tử vi, ý nghĩa khi nằm ở các cung quan trọng, cách tự kiểm tra trên lá số và những điểm cần đọc cùng vận hạn.`;

  const uniqueValueRequirements = buildUniqueValueRequirements({ focusKeyword, titleTopic, topic });
  const coverAssetRequirements = buildCoverAssetRequirements({ focusKeyword, titleTopic, topic });

  return {
    slug: topic.slug,
    cluster: topic.cluster,
    focusKeyword,
    intent: topic.intent,
    recommendedStatus: "published",
    title,
    metaTitle,
    metaDescription,
    canonicalUrl: `/kien-thuc-tu-vi/${topic.slug}`,
    funnelStage: topic.funnelStage || "top",
    targetCharacterRange,
    internalLinkPolicy: {
      minInternalLinks: 5,
      maxInternalLinks: 9,
      maxExactMatchAnchors: 2,
      requiredLinks: ["/#lap-la-so", "/kien-thuc-tu-vi"],
      notes: [
        "Link theo ngữ cảnh tự nhiên, không nhồi exact-match anchor.",
        "Mỗi bài phải có ít nhất một link về chuyển đổi và hai link sang bài kiến thức liên quan.",
      ],
    },
    googleQualityPolicy: [
      "People-first: giải quyết câu hỏi thật của người đọc trước khi tối ưu keyword.",
      "Không sản xuất nội dung hàng loạt mỏng chỉ để thao túng thứ hạng.",
      "Không đặt word count cố định như tín hiệu ranking; range ký tự chỉ để tránh bài quá mỏng so với intent.",
      "Không lặp keyword máy móc, không cloaking, không doorway page, không nội dung sao chép.",
      "Bài phải có trải nghiệm/giải thích riêng cho Lá số tinh hoa và đường dẫn hữu ích cho người đọc.",
    ],
    programmaticSeoGuardrails: PROGRAMMATIC_SEO_GUARDRAILS,
    uniqueValueRequirements,
    coverAssetRequirements,
    outline: overrides.outline || [
      `${titleTopic} là gì?`,
      `Ý nghĩa ${focusKeyword} tại Mệnh, Quan Lộc, Tài Bạch và Phu Thê`,
      `Khi ${focusKeyword} gặp sao tốt, sao xấu hoặc vận hạn`,
      `Cách tự kiểm tra ${focusKeyword} trong lá số cá nhân`,
      "Nên đọc thêm những bài nào để hiểu đầy đủ hơn",
    ],
    internalLinks: overrides.internalLinks || [
      "/#lap-la-so",
      "/kien-thuc-tu-vi/sao-chinh-tinh-tu-vi",
      "/kien-thuc-tu-vi/cach-doc-la-so-tu-vi-cho-nguoi-moi",
      "/kien-thuc-tu-vi/cung-menh-cung-than",
      "/kien-thuc-tu-vi/dai-van-la-gi",
    ],
    keywordEvidence: topic.keywordEvidence || null,
    faqs: overrides.faqs || [
      {
        question: `${titleTopic} có phải luôn tốt không?`,
        answer:
          "Không nên đọc một sao theo kiểu tốt xấu tuyệt đối. Cần xem sao nằm ở cung nào, trạng thái mạnh yếu, bộ sao đi cùng và vận hạn đang kích hoạt.",
      },
      {
        question: `Muốn biết mình có ${focusKeyword} thì làm gì?`,
        answer:
          "Bạn cần lập lá số bằng ngày sinh, giờ sinh, giới tính và lịch sinh. Sau đó kiểm tra vị trí sao trong từng cung và đọc cùng cung Mệnh, Thân, Quan Lộc, Tài Bạch.",
      },
      {
        question: `${titleTopic} nên đọc cùng phần nào?`,
        answer:
          "Nên đọc cùng chính tinh, 12 cung, đại vận và các bài hướng dẫn đọc lá số cho người mới để tránh kết luận rời rạc.",
      },
    ],
    conversionCta:
      overrides.conversionCta ||
      "Nếu chưa có lá số, hãy lập lá số tử vi miễn phí trước rồi quay lại đối chiếu vị trí sao trong từng cung.",
    safetyGuards: [
      "Không hứa chắc kết quả hôn nhân, tài chính, sức khỏe hoặc vận mệnh.",
      "Không dùng ngôn ngữ gây sợ hãi để ép người đọc mua luận giải.",
      "Nội dung phải giải thích theo hướng tham khảo, dễ hiểu và có ngữ cảnh.",
    ],
  };
}

export function normalizePublisherSelection({ articles, clusterMode = false }) {
  const parsed = Number.parseInt(String(articles), 10);
  const fallback = clusterMode ? 2 : 7;
  const normalized = Number.isFinite(parsed) ? parsed : fallback;
  if (clusterMode && normalized < 2) {
    throw new Error("Cluster mode requires between 2 and 5 articles.");
  }
  return {
    articles: clusterMode ? Math.min(normalized, 5) : Math.min(Math.max(normalized, 1), 7),
    clusterMode: Boolean(clusterMode),
  };
}

export function planSeoAutopilotRun({
  snapshot,
  existingSlugs,
  keywordRows,
  searchConsole,
  articlesPerWeek = 7,
  previousState,
  clusterMode = false,
}) {
  const publisherSelection = normalizePublisherSelection({ articles: articlesPerWeek, clusterMode });
  articlesPerWeek = publisherSelection.articles;
  const isSinglePublisherRun = articlesPerWeek === 1 && !clusterMode;
  const currentSlugs = new Set(existingSlugs || []);
  const snapshotOpportunities = Array.isArray(snapshot?.opportunities) ? snapshot.opportunities : [];
  const inputKeywordRows = Array.isArray(keywordRows) ? keywordRows : [];
  const keywordPlan = inputKeywordRows.length
    ? buildKeywordDrivenOpportunities({ keywordRows: inputKeywordRows, existingSlugs: [...currentSlugs] })
    : null;
  const keywordOpportunities = keywordPlan?.opportunities || [];
  const keywordIntelligence = keywordPlan?.intelligence || null;
  const refreshOpportunities = rankRefreshTopicOpportunities([...currentSlugs], keywordPlan);
  const opportunities = keywordOpportunities.length
    ? keywordOpportunities
    : snapshotOpportunities.length
      ? snapshotOpportunities.filter((item) => !currentSlugs.has(item.slug))
      : rankTopicOpportunities([...currentSlugs]).length
        ? rankTopicOpportunities([...currentSlugs])
        : isSinglePublisherRun
          ? []
          : refreshOpportunities;
  const normalizedOpportunities = avoidImmediateRepeat({
    opportunities,
    previousState,
    articlesPerWeek,
  });
  if (isSinglePublisherRun && normalizedOpportunities.length === 0) {
    return {
      mode: "auto-safe",
      status: "blocked",
      summary: [
        `Sitemap URLs: ${snapshot?.sitemapUrlCount ?? "unknown"}`,
        ...(snapshot?.warnings || []),
      ],
      nextAction: {
        type: "blocked",
        slug: "",
        slugs: [],
        reason:
          "No safe new SEO article opportunities remain for the daily publisher run after excluding existing slugs and overlapping reader intents.",
        approvalRequired: false,
        allowedToCommitDeployAfterVerification: false,
      },
      brief: null,
      weeklyContentPlan: {
        strategy: keywordPlan?.opportunities?.length ? "semrush-keyword-intent-funnel" : "topic-cluster-funnel",
        articlesPerWeek,
        measurementCadence: "weekly",
        strategyNotes: [
          "Daily publisher must stop with Blocked when no distinct SEMrush-backed topic remains after intent deduplication.",
        ],
        articles: [],
      },
      keywordIntelligence,
      searchConsole,
      verificationCommands: ["npm run seo:autopilot"],
      hardStops: [
        "Do not change payment, auth, database schema, chart engine, or date engine.",
        "Do not delete indexed URLs or change URL structure without user approval.",
        "Do not deploy if tests or build fail.",
      ],
    };
  }
  const weeklyContentPlan = buildWeeklyContentPlan({ opportunities: normalizedOpportunities, articlesPerWeek });
  const selected = weeklyContentPlan.articles[0]?.brief || buildContentBrief(rankTopicOpportunities([...currentSlugs])[0]);
  const brief = buildContentBrief(selected);
  const slugs = weeklyContentPlan.articles.map((item) => item.slug);
  if (clusterMode) assertDistinctClusterArticles(weeklyContentPlan.articles);

  return {
    mode: "auto-safe",
    status: snapshot?.status || "unknown",
    summary: [
      `Sitemap URLs: ${snapshot?.sitemapUrlCount ?? "unknown"}`,
      ...(snapshot?.warnings || []),
    ],
    nextAction: {
      type: clusterMode
        ? "cluster_article_publish"
        : isSinglePublisherRun
          ? "single_article_publish"
          : "weekly_content_batch",
      slug: brief.slug,
      slugs,
      reason: keywordIntelligence
        ? `Publish ${slugs.length} people-first articles from SEMrush intent clusters; first topic: ${brief.intent}`
        : `Publish ${slugs.length} people-first articles this week across the keyword funnel; first topic: ${brief.intent}`,
      approvalRequired: false,
      allowedToCommitDeployAfterVerification: true,
      ...(clusterMode
        ? {
            explicitAuthorizationRequired: true,
            atomicRelease: true,
            distinctIntentRequired: true,
          }
        : {}),
    },
    brief,
    weeklyContentPlan,
    keywordIntelligence,
    searchConsole,
    verificationCommands: [
      "npm run seo:autopilot",
      "npm test -- src/lib/content.test.ts src/lib/article-cover-assets.test.ts src/lib/seo-autopilot-core.test.ts",
      "npm run build",
    ],
    hardStops: [
      "Do not change payment, auth, database schema, chart engine, or date engine.",
      "Do not delete indexed URLs or change URL structure without user approval.",
      "Do not deploy if tests or build fail.",
    ],
  };
}

function assertDistinctClusterArticles(articles) {
  const slugs = new Set();
  const intents = new Set();
  for (const article of articles) {
    const slug = article.slug?.trim();
    const intent = article.brief?.intent?.trim().toLocaleLowerCase("vi");
    if (!slug || slugs.has(slug)) throw new Error(`Cluster mode contains a duplicate slug: ${slug || "unknown"}`);
    if (!intent || intents.has(intent)) throw new Error(`Cluster mode contains a duplicate intent: ${intent || "unknown"}`);
    slugs.add(slug);
    intents.add(intent);
  }
}

export function buildWeeklyContentPlan({ opportunities, articlesPerWeek = 7 }) {
  const selected = (opportunities?.length ? opportunities : DEFAULT_TOPIC_OPPORTUNITIES).slice(0, articlesPerWeek);
  const stages = ["top", "middle", "conversion-support"];
  const dayLabels = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  return {
    strategy: selected.some((topic) => topic.keywordEvidence) ? "semrush-keyword-intent-funnel" : "topic-cluster-funnel",
    articlesPerWeek,
    measurementCadence: "weekly",
    strategyNotes: [
      "Build topical authority in one cluster before scattering into unrelated keywords.",
      "Use SEMrush data to choose intent clusters, then write one complete page per intent instead of one page per keyword variant.",
      "Use broad informational topics for discovery, comparison/how-to topics for middle funnel, and practical preparation topics for conversion support.",
      "Measure by Search Console query/page movement and refresh pages instead of blindly increasing publishing volume.",
    ],
    articles: selected.map((topic, index) => {
      const funnelStage = topic.funnelStage || stages[index] || "top";
      const brief = buildContentBrief({ ...topic, funnelStage });
      return {
        day: dayLabels[index] || `Slot ${index + 1}`,
        funnelStage,
        slug: brief.slug,
        focusKeyword: brief.focusKeyword,
        brief,
        measurementPlan: [
          "Track impressions, clicks, CTR, and average position after indexing.",
          "Compare Search Console queries against the SEMrush cluster to decide whether to refresh the pillar or add one support article.",
          "Refresh title/meta/internal links if impressions rise but CTR stays weak.",
          "Expand sections or add FAQ if average position stalls with relevant impressions.",
          "Route internal links toward /#lap-la-so only where it helps the reader continue the task.",
        ],
      };
    }),
  };
}

function avoidImmediateRepeat({ opportunities, previousState, articlesPerWeek }) {
  if (articlesPerWeek !== 1 || !Array.isArray(opportunities) || opportunities.length < 2) {
    return opportunities;
  }

  const lastSlug = previousState?.lastAction?.slug;
  if (!lastSlug || opportunities[0]?.slug !== lastSlug) {
    return opportunities;
  }

  const nextTopics = opportunities.filter((item) => item.slug !== lastSlug);
  const repeatedTopics = opportunities.filter((item) => item.slug === lastSlug);
  return nextTopics.length ? [...nextTopics, ...repeatedTopics] : opportunities;
}

function overlapsExistingIntent(slug, existingSlugs) {
  if (!slug || !existingSlugs?.size) return false;
  return OVERLAPPING_INTENT_SLUG_GROUPS.some((group) => group.includes(slug) && group.some((item) => existingSlugs.has(item)));
}

export function renderContentDraft(brief, { generatedAt } = {}) {
  const timestamp = generatedAt || new Date().toISOString();
  return [
    "---",
    `slug: ${brief.slug}`,
    "status: draft",
    `cluster: ${brief.cluster}`,
    `focusKeyword: ${brief.focusKeyword}`,
    `canonicalUrl: ${brief.canonicalUrl}`,
    `funnelStage: ${brief.funnelStage}`,
    `targetCharacters: ${brief.targetCharacterRange.min}-${brief.targetCharacterRange.max}`,
    `generatedAt: ${timestamp}`,
    "---",
    "",
    `# ${brief.title}`,
    "",
    `**Intent:** ${brief.intent}`,
    "",
    ...(brief.keywordEvidence
      ? [
          "## Keyword Evidence",
          "",
          `Cluster: ${brief.keywordEvidence.clusterId}`,
          `Cluster volume: ${brief.keywordEvidence.totalVolume}`,
          `Keyword count: ${brief.keywordEvidence.keywordCount}`,
          `Average KD: ${brief.keywordEvidence.averageKd}`,
          "",
          "Top source keywords:",
          ...brief.keywordEvidence.topKeywords
            .slice(0, 6)
            .map((item) => `- ${item.keyword} (volume ${item.volume}, KD ${item.kd})`),
          "",
        ]
      : []),
    `**Meta title:** ${brief.metaTitle}`,
    "",
    `**Meta description:** ${brief.metaDescription}`,
    "",
    "## Outline",
    ...brief.outline.map((item) => `- ${item}`),
    "",
    "## Internal Links",
    "",
    `Minimum internal links: ${brief.internalLinkPolicy.minInternalLinks}`,
    `Maximum exact-match anchors: ${brief.internalLinkPolicy.maxExactMatchAnchors}`,
    ...brief.internalLinks.map((item) => `- ${item}`),
    "",
    "## Google Quality Policy",
    ...brief.googleQualityPolicy.map((item) => `- ${item}`),
    "",
    "## Programmatic SEO Guardrails",
    ...(brief.programmaticSeoGuardrails || PROGRAMMATIC_SEO_GUARDRAILS).map((item) => `- ${item}`),
    "",
    "## Unique Value Requirements",
    "",
    `Minimum data enrichment blocks: ${brief.uniqueValueRequirements?.minDataEnrichmentBlocks || 2}`,
    "",
    "Required data blocks:",
    ...(brief.uniqueValueRequirements?.requiredDataBlocks || []).map((item) => `- ${item}`),
    "",
    "Data enrichment examples:",
    ...(brief.uniqueValueRequirements?.dataEnrichmentExamples || []).map((item) => `- ${item}`),
    "",
    "expert prompt frame:",
    ...(brief.uniqueValueRequirements?.expertPromptFrame || []).map((item) => `- ${item}`),
    "",
    `interactive CTA: ${brief.uniqueValueRequirements?.interactiveElement?.prompt || brief.conversionCta}`,
    `interactive target: ${brief.uniqueValueRequirements?.interactiveElement?.targetLink || "/#lap-la-so"}`,
    "",
    "## Cover Asset Requirements",
    "",
    `Preferred file: ${brief.coverAssetRequirements?.preferredPath}`,
    `Public path: ${brief.coverAssetRequirements?.publicPath}`,
    `Format: ${brief.coverAssetRequirements?.format}`,
    `Dimensions: ${brief.coverAssetRequirements?.dimensions?.width}x${brief.coverAssetRequirements?.dimensions?.height}`,
    `Subject: ${brief.coverAssetRequirements?.subject}`,
    `Style: ${brief.coverAssetRequirements?.style}`,
    "Composition:",
    ...(brief.coverAssetRequirements?.composition || []).map((item) => `- ${item}`),
    "Usage:",
    ...(brief.coverAssetRequirements?.usage || []).map((item) => `- ${item}`),
    "No-go:",
    ...(brief.coverAssetRequirements?.noGo || []).map((item) => `- ${item}`),
    "",
    "## CTA",
    "",
    brief.conversionCta,
    "",
    "## FAQ",
    ...brief.faqs.flatMap((item) => [`- **${item.question}**`, `  ${item.answer}`]),
    "",
    "## Safety Guards",
    ...brief.safetyGuards.map((item) => `- ${item}`),
    "",
    "## Publishing Notes",
    "",
    "- Add the final article to `src/lib/content.ts` through the existing `article({ ... })` seed pattern.",
    "- Add or update `src/lib/content.test.ts` coverage for the new slug and SEO score floor.",
    "- Run the verification commands from the SEO Autopilot report before commit/push/deploy.",
  ].join("\n");
}

export function renderRunReport(result) {
  const { plan, snapshot, contentInventory, artifacts, keywordSource, searchConsole } = result;
  const keywordIntelligence = plan.keywordIntelligence;
  const lines = [
    "# SEO Autopilot Report",
    "",
    `Generated: ${result.generatedAt}`,
    `Base URL: ${result.baseUrl}`,
    `Status: ${plan.status}`,
    `Mode: ${plan.mode || "auto-safe"}`,
    `Sitemap URLs: ${snapshot.sitemapUrlCount}`,
    `Seed articles: ${contentInventory.seedArticleCount}`,
    "",
    "## Keyword Intelligence",
    keywordSource?.sourcePath
      ? `Source: ${keywordSource.sourcePath} (${keywordSource.rowCount} rows)`
      : `Source: unavailable (${keywordSource?.warning || "not configured"})`,
    ...(keywordIntelligence?.clusters?.length
      ? [
          `Included keyword volume: ${keywordIntelligence.totalIncludedVolume}`,
          "",
          "Top clusters:",
          ...keywordIntelligence.clusters.slice(0, 6).map(
            (cluster) =>
              `- ${cluster.label}: ${cluster.keywordCount} keywords, volume ${cluster.totalVolume}, avg KD ${cluster.averageKd}, pillar \`${cluster.pillarSlug}\``,
          ),
          "",
          "Pillar funnel:",
          `- Primary pillar: \`${keywordIntelligence.pillarFunnel.primaryPillar.slug}\``,
          ...keywordIntelligence.pillarFunnel.primaryPillar.supportingClusters.map(
            (cluster) => `- ${cluster.stage}: \`${cluster.pillarSlug}\` (${cluster.label}, volume ${cluster.totalVolume})`,
          ),
          "",
          "Do not publish:",
          ...keywordIntelligence.pillarFunnel.doNotPublishPatterns.map((item) => `- ${item}`),
        ]
      : ["- Not available; using built-in topic opportunities."]),
    "",
    "## Search Console Feedback",
    ...(renderSearchConsoleReportLines(searchConsole || plan.searchConsole)),
    "",
    "## Next Action",
    "",
    plan.nextAction.slug
      ? `Next action: ${plan.nextAction.type} \`${plan.nextAction.slug}\``
      : `Next action: ${plan.nextAction.type}`,
    plan.nextAction.slugs?.length ? `Weekly batch: ${plan.nextAction.slugs.map((slug) => `\`${slug}\``).join(", ")}` : null,
    `Approval required: ${plan.nextAction.approvalRequired ? "yes" : "no"}`,
    `Reason: ${plan.nextAction.reason}`,
    "",
    "## Warnings",
    ...(snapshot.warnings?.length ? snapshot.warnings.map((item) => `- ${item}`) : ["- None"]),
    "",
    "## Programmatic SEO Guardrails",
    ...(plan.brief?.programmaticSeoGuardrails || PROGRAMMATIC_SEO_GUARDRAILS).map((item) => `- ${item}`),
    "",
    "## Artifacts",
    ...(artifacts?.draftPaths?.length
      ? artifacts.draftPaths.map((path) => `- Batch draft: \`${path}\``)
      : [`- Draft: \`${artifacts?.draftPath || "not generated"}\``]),
    "",
    "## Weekly Content Plan",
    ...(plan.weeklyContentPlan?.articles?.length
      ? plan.weeklyContentPlan.articles.map(
          (article) =>
            `- ${article.day}: \`${article.slug}\` (${article.funnelStage}, ${article.brief.targetCharacterRange.min}-${article.brief.targetCharacterRange.max} chars, cover ${article.brief.coverAssetRequirements?.publicPath})`,
        )
      : ["- Not generated"]),
    "",
    "## Verification Checklist",
    ...plan.verificationCommands.map((item) => `- ${item}`),
    "",
    "## Hard Stops",
    ...(plan.hardStops || []).map((item) => `- ${item}`),
  ];
  return lines.filter(Boolean).join("\n");
}

function addPageWarning(warnings, pages, predicate, message) {
  const count = pages.filter(predicate).length;
  if (!count) return;
  const phrase = count === 1 ? `1 page ${message}` : `${count} pages ${pluralizeMessage(message)}`;
  warnings.push(phrase);
}

function renderSearchConsoleReportLines(searchConsole) {
  if (!searchConsole) return ["- Skipped or not configured."];
  if (searchConsole.status !== "ok") {
    return [
      `- Status: unavailable`,
      ...(searchConsole.warnings?.length ? searchConsole.warnings.map((warning) => `- Warning: ${warning}`) : []),
    ];
  }
  const totals = searchConsole.totals || { clicks: 0, impressions: 0, ctr: 0, position: 0 };
  const lines = [
    `- Status: ok`,
    `- Site: ${searchConsole.siteUrl}`,
    `- Range: ${searchConsole.dateRange.startDate} to ${searchConsole.dateRange.endDate}`,
    `- Totals: ${totals.clicks} clicks, ${totals.impressions} impressions, ${(totals.ctr * 100).toFixed(2)}% CTR, avg position ${totals.position}`,
    "",
    "Top pages:",
    ...formatMetricRows(searchConsole.topPages?.slice(0, 5) || [], "page"),
    "",
    "Top queries:",
    ...formatMetricRows(searchConsole.topQueries?.slice(0, 8) || [], "query"),
    "",
    "Data-driven opportunities:",
    ...(searchConsole.opportunities?.length
      ? searchConsole.opportunities.slice(0, 8).map(
          (item) =>
            `- ${item.type}: ${item.page || item.query || "unknown"} (${item.impressions} impressions, ${(item.ctr * 100).toFixed(2)}% CTR, position ${item.position})`,
        )
      : ["- No strong Search Console refresh opportunity detected in the selected range."]),
  ];
  return lines;
}

function formatMetricRows(rows, key) {
  if (!rows.length) return ["- No data."];
  return rows.map(
    (row) =>
      `- ${row[key] || "unknown"}: ${row.clicks} clicks, ${row.impressions} impressions, ${(row.ctr * 100).toFixed(2)}% CTR, position ${row.position}`,
  );
}

function buildUniqueValueRequirements({ focusKeyword, titleTopic, topic }) {
  return {
    minDataEnrichmentBlocks: 2,
    requiredDataBlocks: [
      "structured-score-table",
      "modifier-stars-or-context",
      "algorithmic-source-notes",
    ],
    dataEnrichmentExamples: [
      `Create a compact score table for ${focusKeyword}: risk, stability, accumulation/relationship/career fit, and reading confidence.`,
      "List modifier stars, palace context, or chart conditions that can change the interpretation; do not present one-star claims as absolute.",
      "Name the internal calculation/data source when relevant, such as chart input, palace position, star state, companion stars, or date-fortune output.",
    ],
    expertPromptFrame: [
      `Expert prompt frame for ${titleTopic}: analyze by logic nhan qua from star/palace nature, activation condition, likely expression, limitation, then practical advice.`,
      "Force three concrete sections: what pattern can be read, what can reverse or weaken it, and what the reader should check in their own chart.",
      "Use objective, bounded language; no vague AI filler like 'be careful with money' unless the causal reason is explained.",
    ],
    interactiveElement: {
      required: true,
      type: "chart-form-cta",
      targetLink: "/#lap-la-so",
      prompt:
        `Invite the reader to enter birth date/time to check whether ${focusKeyword} appears in their chart and what palace/modifier context changes the reading.`,
    },
    noGoPatterns: [
      `Do not make a separate thin page for every minor variant of ${topic?.slug || focusKeyword}.`,
      "Do not rewrite the same article by replacing only star, palace, or year variables.",
      "Do not publish until the page has at least one data block and one interactive next step that help the reader beyond plain prose.",
    ],
  };
}

function buildCoverAssetRequirements({ focusKeyword, titleTopic, topic }) {
  const slug = topic?.slug || normalizeSearchText(focusKeyword).replace(/\s+/g, "-");
  return {
    preferredPath: `public/articles/${slug}.webp`,
    publicPath: `/articles/${slug}.webp`,
    format: "webp",
    dimensions: {
      width: 1200,
      height: 675,
    },
    subject: `Create a photo-editorial cover for ${titleTopic}: a believable real-world Vietnamese scene connected to ${focusKeyword}, with a chart, paper la so, family/home/work object, or reading context visible.`,
    style:
      "Warm premium photo-editorial style aligned with lasotinhhoa.vn: natural light, grounded Vietnamese context, practical astrology details, no generic stock collage.",
    composition: [
      "Use a real-looking photographic or photo-editorial scene, not a symbolic illustration.",
      "Leave enough uncluttered space for article-card cropping and social previews.",
      "Show the topic context visually: chart grid, birth-time notes, comparison table, palace/star cue, or reading workflow.",
      "Prefer no text overlay on the image; let the scene carry the meaning when possible.",
      "Before release, visually inspect the local cover and reject it if it still reads like vector art, iconography, abstract symbolism, or a flat AI illustration.",
    ],
    usage: [
      "Set article.coverImage to the public path.",
      "Set article.ogImage to the same public path unless a separate social asset is intentionally created.",
      "Use a descriptive coverAlt that starts with Minh hoa and names the actual visual subject.",
      "Include the image in the article body when following the current content pattern.",
      "If the cover includes visible text, it must be proper Vietnamese with diacritics; never ship ASCII-only Vietnamese text on the final asset.",
    ],
    noGo: [
      "No generic gradient, text-only SVG, horoscope clipart, or unrelated stock photo.",
      "No vector-style layout, flat symbolic objects, icon-only composition, or abstract stand-in scene that avoids showing a believable real setting.",
      "No fear-based fate, money, marriage, career, or health promise in the visual.",
      "No unreadable embedded text that carries SEO meaning.",
      "No Vietnamese text without diacritics on the final thumbnail or OG asset.",
    ],
  };
}

function pluralizeMessage(message) {
  if (message.startsWith("has ")) return `have ${message.slice(4)}`;
  return message;
}

function matchFirst(source, pattern) {
  const match = pattern.exec(source);
  return match ? decodeHtml(match[1]) : "";
}

function normalizeWhitespace(value) {
  return decodeHtml(String(value || ""))
    .replace(/\s+/g, " ")
    .trim();
}

function stripTags(value) {
  return String(value || "").replace(/<[^>]+>/g, " ");
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function uppercaseFirst(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function characterRangeForTopic(topic) {
  if (topic?.slug === "tao-la-so-tu-vi") return { min: 4500, max: 7000 };
  if (topic?.cluster === "Lập lá số tử vi") return { min: 4500, max: 7000 };
  if (topic?.cluster === "Bát tự và tử vi") return { min: 5500, max: 8500 };
  if (topic?.cluster === "So sánh hệ thống lá số") return { min: 5500, max: 8500 };
  if (topic?.cluster === "Đọc và giải lá số") return { min: 5500, max: 8500 };
  if (topic?.cluster === "Chuyển đổi") return { min: 4500, max: 7000 };
  if (topic?.cluster === "14 chính tinh") return { min: 6500, max: 9500 };
  if (topic?.cluster === "Cách cục lá số") return { min: 7000, max: 10000 };
  return { min: 5500, max: 8500 };
}

function parseCsvRecords(csv) {
  const records = [];
  let record = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < String(csv || "").length; index += 1) {
    const char = csv[index];
    const next = csv[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      record.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      record.push(field);
      if (record.some((value) => value !== "")) records.push(record);
      record = [];
      field = "";
    } else {
      field += char;
    }
  }

  record.push(field);
  if (record.some((value) => value !== "")) records.push(record);
  return records;
}

function normalizeKeywordRow(row) {
  const keyword = String(row.keyword || "").trim();
  return {
    keyword,
    normalizedKeyword: normalizeSearchText(keyword),
    intent: String(row.intent || "").trim(),
    volume: parseVolume(row.volume),
    kd: parseKd(row.kd_percent),
    cpc: Number.parseFloat(row.cpc_usd || "0") || 0,
  };
}

function normalizeSearchText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function parseVolume(value) {
  const text = String(value || "").trim().toUpperCase();
  if (!text || text === "N/A") return 0;
  const number = Number.parseFloat(text.replace(/,/g, ""));
  if (Number.isNaN(number)) return 0;
  if (text.endsWith("K")) return Math.round(number * 1000);
  if (text.endsWith("M")) return Math.round(number * 1000000);
  return Math.round(number);
}

function parseKd(value) {
  const number = Number.parseInt(String(value || "").replace(/[^\d]/g, ""), 10);
  return Number.isNaN(number) ? 50 : number;
}

function sum(values) {
  return values.reduce((total, value) => total + (Number.isFinite(value) ? value : 0), 0);
}

function weightedAverage(pairs) {
  const validPairs = pairs.filter(([value, weight]) => Number.isFinite(value) && Number.isFinite(weight) && weight > 0);
  const totalWeight = sum(validPairs.map(([, weight]) => weight));
  if (!totalWeight) return 0;
  return Math.round(sum(validPairs.map(([value, weight]) => value * weight)) / totalWeight);
}

function summarizeExcludedKeywords(rows) {
  const byReason = new Map();
  for (const row of rows) {
    const current = byReason.get(row.exclusionId) || {
      id: row.exclusionId,
      reason: row.exclusionReason,
      keywordCount: 0,
      totalVolume: 0,
      examples: [],
    };
    current.keywordCount += 1;
    current.totalVolume += row.volume;
    if (current.examples.length < 5) current.examples.push(row.keyword);
    byReason.set(row.exclusionId, current);
  }
  return [...byReason.values()].sort((left, right) => right.totalVolume - left.totalVolume);
}

function buildPillarFunnel(clusters) {
  return {
    primaryPillar: {
      slug: "la-so-tu-vi-la-gi",
      role: "primary-pillar",
      goal: "Own the broad la so tu vi intent and route readers to chart creation plus interpretation guides.",
      supportingClusters: clusters.slice(0, 6).map((cluster) => ({
        clusterId: cluster.id,
        label: cluster.label,
        pillarSlug: cluster.pillarSlug,
        stage: cluster.stage,
        totalVolume: cluster.totalVolume,
      })),
    },
    cadence: [
      "Daily audit: refresh live SEO signals, keyword clusters, duplicate-intent risks, and production content gaps.",
      "Daily publish: one strong article or material refresh per run, never thin pages just to fill schedule.",
      "Weekly measurement: inspect impressions, clicks, CTR, average position, indexed status, and internal clicks toward /#lap-la-so.",
    ],
    doNotPublishPatterns: [
      "Separate pages for lap, lay, tao, tra, ve, ke when the user intent is the same.",
      "Old-year pages such as la so tu vi 2022/2023/2024 unless rewritten as an evergreen history or update guide.",
      "Competitor navigation pages targeting tuvivietnam, xemtuong, cao anh, or similar brand queries.",
      "Mass birth-year or age pages where only the year changes.",
    ],
  };
}

function briefOverridesForTopic(topic, { focusKeyword, titleTopic }) {
  if (topic?.slug === "tao-la-so-tu-vi" || topic?.cluster === "Lập lá số tử vi") {
    return {
      title: `${titleTopic}: cần chuẩn bị gì để xem đúng hơn?`,
      metaTitle: `${titleTopic}: cách chuẩn bị ngày giờ sinh | Lá số tinh hoa`,
      metaDescription: `Hướng dẫn ${focusKeyword} theo hướng dễ hiểu: cần ngày sinh, giờ sinh, giới tính, lịch sinh nào, sai giờ sinh ảnh hưởng ra sao và nên đọc kết quả thế nào.`,
      outline: [
        `${titleTopic} là nhu cầu gì của người mới?`,
        "Cần chuẩn bị ngày sinh, giờ sinh, giới tính và lịch sinh thế nào",
        "Vì sao sai giờ sinh có thể làm lệch Cung Mệnh, Cung Thân và vị trí sao",
        "Sau khi tạo lá số, nên đọc 12 cung và chính tinh theo thứ tự nào",
        "Khi nào nên đọc miễn phí, khi nào nên cần phần luận giải sâu hơn",
      ],
      internalLinks: [
        "/#lap-la-so",
        "/kien-thuc-tu-vi/la-so-tu-vi-la-gi",
        "/kien-thuc-tu-vi/cach-doc-la-so-tu-vi-cho-nguoi-moi",
        "/kien-thuc-tu-vi/12-cung-trong-la-so-tu-vi",
        "/kien-thuc-tu-vi/sao-chinh-tinh-tu-vi",
        "/kien-thuc-tu-vi/gio-sinh-trong-tu-vi",
      ],
      faqs: [
        {
          question: `${titleTopic} có cần giờ sinh chính xác không?`,
          answer:
            "Nên có giờ sinh càng gần thực tế càng tốt, vì giờ sinh ảnh hưởng đến Cung Mệnh, Cung Thân và cách an sao. Nếu không chắc giờ sinh, hãy đọc kết quả theo hướng tham khảo và kiểm tra các mốc đời sống để đối chiếu.",
        },
        {
          question: "Lá số miễn phí xem được những phần nào?",
          answer:
            "Một lá số miễn phí nên giúp bạn thấy 12 cung, chính tinh, một số thông tin nền và đường dẫn để học cách đọc. Những phần phân tích sâu nên giải thích rõ giới hạn, không hứa chắc vận mệnh.",
        },
        {
          question: "Sau khi tạo lá số nên đọc bài nào trước?",
          answer:
            "Người mới nên đọc bài lá số tử vi là gì, cách đọc lá số cho người mới, 12 cung trong lá số và sao chính tinh trước khi đi vào từng sao hoặc từng cung riêng.",
        },
      ],
      conversionCta:
        "Bạn có thể bắt đầu bằng cách lập lá số tử vi miễn phí tại phần tạo lá số, sau đó quay lại bài hướng dẫn để đọc từng cung theo thứ tự.",
    };
  }

  if (topic?.cluster === "Bát tự và tử vi" || topic?.cluster === "So sánh hệ thống lá số") {
    return {
      title: `${titleTopic}: khác gì với lá số tử vi?`,
      metaTitle: `${titleTopic}: khác gì với tử vi? | Lá số tinh hoa`,
      metaDescription: `So sánh ${focusKeyword} với lá số tử vi theo dữ liệu đầu vào, cách đọc, điểm mạnh và giới hạn để người mới chọn hướng tìm hiểu phù hợp.`,
      outline: [
        `${titleTopic} là gì và vì sao người đọc hay nhầm với tử vi`,
        "Dữ liệu đầu vào: ngày sinh, giờ sinh, lịch âm dương và hệ quy chiếu",
        "Cách đọc kết quả: điểm giống và khác với lá số tử vi",
        "Nên dùng bài viết này để chọn hướng học, không dùng để kết luận số phận",
        "Nếu muốn xem theo tử vi, nên bắt đầu từ lá số cá nhân thế nào",
      ],
      internalLinks: [
        "/#lap-la-so",
        "/kien-thuc-tu-vi/la-so-tu-vi-la-gi",
        "/kien-thuc-tu-vi/cach-doc-la-so-tu-vi-cho-nguoi-moi",
        "/kien-thuc-tu-vi/12-cung-trong-la-so-tu-vi",
        "/kien-thuc-tu-vi/gio-sinh-trong-tu-vi",
      ],
      conversionCta:
        "Nếu mục tiêu của bạn là đọc theo tử vi, hãy lập lá số tử vi miễn phí trước để có dữ liệu 12 cung rồi mới đối chiếu các bài giải nghĩa.",
    };
  }

  if (topic?.cluster === "Đọc và giải lá số") {
    return {
      title: `${titleTopic}: nên đọc theo thứ tự nào?`,
      metaTitle: `${titleTopic}: thứ tự đọc dễ hiểu | Lá số tinh hoa`,
      metaDescription: `Cách ${focusKeyword} theo hướng có hệ thống: đọc Mệnh, Thân, 12 cung, chính tinh, đại vận và lưu ý để tránh kết luận rời rạc.`,
      outline: [
        `${titleTopic} nên bắt đầu từ câu hỏi nào?`,
        "Bước 1: xem Cung Mệnh, Cung Thân và tổng quan 12 cung",
        "Bước 2: đọc chính tinh, phụ tinh và trạng thái miếu vượng đắc hãm",
        "Bước 3: đặt kết quả vào đại vận, tiểu vận và hoàn cảnh thực tế",
        "Những lỗi thường gặp khi tự giải lá số",
      ],
      internalLinks: [
        "/#lap-la-so",
        "/kien-thuc-tu-vi/la-so-tu-vi-la-gi",
        "/kien-thuc-tu-vi/cach-doc-la-so-tu-vi-cho-nguoi-moi",
        "/kien-thuc-tu-vi/12-cung-trong-la-so-tu-vi",
        "/kien-thuc-tu-vi/sao-chinh-tinh-tu-vi",
        "/kien-thuc-tu-vi/dai-van-la-gi",
      ],
    };
  }

  return {};
}
