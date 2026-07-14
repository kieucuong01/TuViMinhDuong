import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO_ROOT = fileURLToPath(new URL("../..", import.meta.url));
const CONTENT_PATH = resolve(REPO_ROOT, "src/lib/content.ts");
const SEO_STATE_PATH = resolve(REPO_ROOT, "docs/seo-autopilot/state.json");
const PRODUCT_MARKETING_PATH = resolve(REPO_ROOT, ".agents/product-marketing.md");
const TRAFFIC_REPORTS_DIR = resolve(REPO_ROOT, "docs/traffic-autopilot/reports");
const SITE_URL = "https://lasotinhhoa.vn";
const MARKETINGSKILLS_SOURCE = "coreyhaines31/marketingskills";

const PREFERRED_TRAFFIC_SLUGS = [
  "tao-la-so-tu-vi",
  "lap-la-so-tu-vi-chuan",
  "la-so-tu-vi-mien-phi",
  "la-so-tu-vi-la-gi",
  "cach-doc-la-so-tu-vi-cho-nguoi-moi",
  "phan-tich-la-so-tu-vi",
];

const TITLE_BY_SLUG = new Map([
  ["tao-la-so-tu-vi", "Tao la so tu vi online can chuan bi gi"],
  ["lap-la-so-tu-vi-chuan", "Lap la so tu vi chuan can nhung thong tin nao"],
  ["la-so-tu-vi-mien-phi", "La so tu vi mien phi xem duoc phan nao"],
  ["la-so-tu-vi-la-gi", "La so tu vi la gi"],
  ["cach-doc-la-so-tu-vi-cho-nguoi-moi", "Cach doc la so tu vi cho nguoi moi"],
  ["phan-tich-la-so-tu-vi", "Phan tich la so tu vi theo thu tu nao"],
]);

export function getHoChiMinhWeekday(now = new Date()) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    weekday: "short",
  }).format(now);
}

export function pickTrafficArticle({ existingSlugs = [], preferredSlug, seoState } = {}) {
  const uniqueSlugs = [...new Set(existingSlugs.filter(Boolean))];
  const stateSlug = seoState?.lastPublishedSlug;
  const candidates = [preferredSlug, stateSlug, ...PREFERRED_TRAFFIC_SLUGS, ...uniqueSlugs].filter(Boolean);
  const slug = candidates.find((candidate) => uniqueSlugs.includes(candidate)) || candidates[0] || "la-so-tu-vi-la-gi";

  return {
    slug,
    title: TITLE_BY_SLUG.get(slug) || titleFromSlug(slug),
    url: `/kien-thuc-tu-vi/${slug}`,
    absoluteUrl: `${SITE_URL}/kien-thuc-tu-vi/${slug}`,
    chartCta: "/#lap-la-so",
  };
}

export function buildSocialDistribution({ article } = {}) {
  const selected = article || pickTrafficArticle();
  const shortVideoPack = buildShortVideoPack({ article: selected });

  return [
    {
      channel: "tiktok-short",
      link: selected.url,
      platform: "TikTok",
      copy: shortVideoPack.platformCaptions.tiktok,
      script: shortVideoPack.script,
      checklist: [
        "Dang dang video doc/ghi man hinh doc tu nhien, khong can san xuat cau ky.",
        "Pin comment voi link bio hoac URL ngan ve trang lap la so.",
        "Khong dung ngon tu cam ket van menh, tien bac, hon nhan, suc khoe.",
      ],
    },
    {
      channel: "youtube-shorts",
      link: selected.url,
      platform: "YouTube Shorts",
      copy: shortVideoPack.platformCaptions.youtubeShorts,
      script: shortVideoPack.script,
      checklist: [
        "Dat title ngan duoi 100 ky tu, co y dinh tim kiem ro.",
        "Them related link ve bai kien thuc hoac landing lap la so khi kenh du dieu kien.",
        "Theo doi engaged views thay vi chi nhin raw views.",
      ],
    },
    {
      channel: "facebook-reels",
      link: selected.url,
      platform: "Facebook Reels",
      copy: shortVideoPack.platformCaptions.facebookReels,
      script: shortVideoPack.script,
      checklist: [
        "Dang lai ban clean, khong watermark TikTok.",
        "Caption them cau hoi de keo comment that.",
        "Dat link trong comment dau tien hoac bio/page CTA.",
      ],
    },
    {
      channel: "website-cta-flow",
      link: selected.url,
      copy:
        `Moi video short nen co mot duong ve website: link bio/page, comment ghim, hoac caption ngan den ${selected.url}. ` +
        `Trang dich chinh van la /#lap-la-so de nguoi xem lap la so mien phi ngay sau khi xem.`,
      checklist: ["Gan UTM rieng cho tung nen tang.", "Khong tao landing moi neu trang lap la so hien tai da du dung."],
    },
  ];
}

export function buildShortVideoPack({ article } = {}) {
  const selected = article || pickTrafficArticle();
  const landingUrl = `${SITE_URL}/#lap-la-so`;
  const articleUrl = selected.absoluteUrl;

  return {
    phase: "organic-short-video",
    goal: "Keo nguoi xem tu video ngan ve website de lap la so mien phi.",
    format: {
      aspectRatio: "9:16",
      targetLengthSeconds: "20-35",
      structure: ["Hook 0-3s", "One idea 3-18s", "Example 18-27s", "CTA 27-35s"],
      productionRule: "Dung mot script goc, xuat 3 caption/CTA rieng cho TikTok, YouTube Shorts, Facebook Reels.",
    },
    sourceArticle: selected,
    landingUrl,
    articleUrl,
    script: [
      "Hook 3s: Neu ban moi xem la so, dung voi ket luan chi tu mot sao hoac mot cung.",
      `Than bai 15s: Voi chu de "${selected.title}", hay kiem tra 3 lop: thong tin sinh co dung khong, cung nao dang xet, va co sao/phu tinh nao lam doi nghia khong.`,
      "Vi du 7s: Cung co mot dau hieu, nhung khac gio sinh hoac khac boi canh thi cach doc se khac.",
      "CTA 5s: Vao website lap la so mien phi, roi doi chieu voi bai huong dan thay vi doan bang mot cau.",
    ],
    shotList: [
      "Canh 1: mat nguoi noi truc dien hoac text lon tren nen la so mo.",
      "Canh 2: quay man hinh landing lap la so, che thong tin ca nhan.",
      "Canh 3: zoom vao mot cum noi dung trong bai viet, them text 'doc theo boi canh'.",
      "Canh 4: man hinh CTA 'Lap la so mien phi - link bio'.",
    ],
    platformCaptions: {
      tiktok:
        `Dung doc la so bang mot dau hieu rieng le. Xem boi canh truoc, roi vao link bio lap la so mien phi de doi chieu. ` +
        `${buildTrackedUrl({ target: landingUrl, source: "tiktok", content: selected.slug })}`,
      youtubeShorts:
        `Moi xem la so? Bat dau bang gio sinh, cung dang xet va boi canh sao di kem. Lap la so mien phi: ` +
        `${buildTrackedUrl({ target: landingUrl, source: "youtube_shorts", content: selected.slug })}`,
      facebookReels:
        `Mot la so khong nen doc bang mot sao duy nhat. Neu muon tu doi chieu, vao website lap la so mien phi roi doc tiep bai huong dan: ` +
        `${buildTrackedUrl({ target: landingUrl, source: "facebook_reels", content: selected.slug })}`,
    },
    metrics: [
      "3-second hold",
      "average watch time",
      "completion rate",
      "profile/bio clicks",
      "utm sessions",
      "chart creation starts",
      "chart creation completes",
    ],
  };
}

export function buildTrafficAutopilotPlan({ now = new Date(), existingSlugs = [], seoState = null } = {}) {
  const weekday = getHoChiMinhWeekday(now);
  const article = pickTrafficArticle({ existingSlugs, seoState });
  const socialDistribution = buildSocialDistribution({ article });
  const mode = getModeForWeekday(weekday);
  const hasProductMarketingContext = existsSync(PRODUCT_MARKETING_PATH);

  const basePlan = {
    generatedAt: now.toISOString(),
    timezone: "Asia/Ho_Chi_Minh",
    weekday,
    siteUrl: SITE_URL,
    mode,
    selectedArticle: article,
    dailyWorkLimit: {
      maxPrimaryTasks: 1,
      reason: "80/20: one useful traffic action per day, no repeated heavy planning when existing automations already run.",
    },
    trafficChannels: [
      "SEO content compounding via the daily 21:00 publisher",
      "Organic short-video distribution on TikTok, YouTube Shorts, and Facebook Reels",
      "Internal links and compact CTAs toward chart creation",
      "Weekly Search Console and Lighthouse-style regression review",
    ],
    marketingFrameworks: buildMarketingFrameworks({ hasProductMarketingContext }),
    shortVideoPack: buildShortVideoPack({ article }),
    socialDistribution,
    qualityGate: [
      "People-first content: answer one real reader question and add a next useful action.",
      "No doorway variants, no thin AI rewrites, no one-page-per-keyword spam.",
      "Every social/community task must add context, not only drop a link.",
      "Short videos must point to a helpful next step on the website, not make guaranteed personal claims.",
      "Use Search Console or repo evidence before refreshing/publishing; report blockers honestly.",
    ],
    hardStops: [
      "Khong tu dong dang bai len Facebook/Zalo/forum khi chua co kenh va chinh sach duoc duyet.",
      "Khong chay quang cao tra phi trong phase video short organic hien tai; ads de phase sau.",
      "Khong tao noi dung hang loat bang cach thay ten sao/cung/tu khoa vao cung mot khung.",
      "Khong sua payment, auth, coin gate, chart engine, date engine trong workflow traffic.",
    ],
    reportTemplate: [
      "Traffic Autopilot Report",
      "Status: OK / Skipped / Blocked",
      "Primary task:",
      "Evidence:",
      "Output/link:",
      "Next 24h priority:",
    ].join("\n"),
  };

  if (mode === "seo-publisher-followup") {
    return {
      ...basePlan,
      primaryTask:
        `Theo doi publisher 21:00, chon 1 URL vua publish/refresh hoac ${article.url} de bien thanh 1 goi TikTok/YouTube Shorts/Facebook Reels.`,
      why:
        "The dedicated SEO publisher now runs daily; this traffic run should turn useful SEO work into short videos instead of duplicating article generation.",
      commands: ["npm run traffic:autopilot"],
      optionalCommands: ["npm run seo:autopilot:publisher # only if the dedicated publisher automation failed or is disabled"],
    };
  }

  if (mode === "weekly-measurement") {
    return {
      ...basePlan,
      primaryTask:
        "Doc ket qua Sunday strategy va daily publisher, chon 1 URL hoac insight de bien thanh lich video short cho tuan toi.",
      why:
        "Sunday is for measurement and next-week prioritization; keep it light unless a public SEO regression is visible.",
      commands: ["npm run traffic:autopilot"],
      optionalCommands: [
        "npm run seo:autopilot:execute # weekly strategy only, not a second publish batch",
        "npm run seo:lighthouse # weekly/manual technical regression check when useful",
      ],
    };
  }

  return {
    ...basePlan,
    primaryTask:
      `Tao 1 goi video short organic cho ${article.url}: 1 script goc, 3 caption rieng cho TikTok/YouTube Shorts/Facebook Reels, va CTA ve website.`,
    why:
      "Current phase prioritizes short-form video to pull new visitors to the website before testing paid ads.",
    commands: ["npm run traffic:autopilot"],
  };
}

export function buildMarketingFrameworks({ hasProductMarketingContext = false } = {}) {
  return {
    source: MARKETINGSKILLS_SOURCE,
    installedSkills: [
      "product-marketing",
      "content-strategy",
      "social",
      "community-marketing",
      "free-tools",
      "cro",
      "analytics",
      "ai-seo",
    ],
    context: {
      path: ".agents/product-marketing.md",
      available: Boolean(hasProductMarketingContext),
      rule:
        "Read product context before choosing traffic tasks so content, social, CRO, and free-tool ideas stay aligned with the funnel.",
    },
    appliedPrinciples: [
      "Content strategy: every asset should be searchable, shareable, or both; search traffic remains the foundation.",
      "Social: repurpose pillar content into short-video atoms for TikTok, YouTube Shorts, and Facebook Reels.",
      "Free tools: prefer simple tools adjacent to chart creation with immediate value and low maintenance.",
      "Community: provide member value before promotion; no link drops without useful context.",
      "CRO: keep one clear primary CTA and reduce friction toward free chart creation.",
      "Analytics: measure clicks, engagement, and conversion path impact before scaling a tactic.",
      "AI SEO: use structured, source-backed, brand-consistent explanations that can be cited, not generic filler.",
    ],
  };
}

function buildTrackedUrl({ target, source, content }) {
  const url = new URL(target);
  url.searchParams.set("utm_source", source);
  url.searchParams.set("utm_medium", "organic_short_video");
  url.searchParams.set("utm_campaign", "shorts_phase_1");
  url.searchParams.set("utm_content", content);
  return url.toString();
}

export function readExistingArticleSlugs(contentPath = CONTENT_PATH) {
  if (!existsSync(contentPath)) return [];
  return extractSeedArticleSlugs(readFileSync(contentPath, "utf8"));
}

function extractSeedArticleSlugs(source) {
  return [...String(source || "").matchAll(/\bslug:\s*["']([^"']+)["']/g)]
    .map((match) => match[1])
    .filter(Boolean);
}

export function readSeoState(statePath = SEO_STATE_PATH) {
  if (!existsSync(statePath)) return null;
  try {
    return JSON.parse(readFileSync(statePath, "utf8"));
  } catch {
    return null;
  }
}

export function createTrafficReport({ plan, reportsDir = TRAFFIC_REPORTS_DIR } = {}) {
  if (!plan) {
    throw new Error("createTrafficReport requires a plan.");
  }

  const reportDate = String(plan.generatedAt || new Date().toISOString()).slice(0, 10);
  const filePath = resolve(reportsDir, `${reportDate}-${plan.selectedArticle.slug}.md`);
  mkdirSync(reportsDir, { recursive: true });

  const shortVideoPack = plan.shortVideoPack;
  const article = plan.selectedArticle;
  const youtubeTitle = `${article.title} | 3 dieu can kiem tra truoc khi doc la so`;
  const youtubeCaption =
    `${shortVideoPack.platformCaptions.youtubeShorts}\n` +
    `Doc bai goc: ${article.absoluteUrl}`;
  const facebookCaption =
    `${shortVideoPack.platformCaptions.facebookReels}\n` +
    `Cau hoi goi binh luan: Ban hay bi roi o thong tin nao khi moi lap la so?`;

  const lines = [
    "# Traffic Autopilot Report",
    `Generated: ${plan.generatedAt}`,
    `Status: OK`,
    `Mode: ${plan.mode}`,
    `Primary task: ${plan.primaryTask}`,
    `Why: ${plan.why}`,
    "## Evidence",
    `- Weekday: ${plan.weekday}`,
    `- Selected article: ${article.absoluteUrl}`,
    `- Product context: ${plan.marketingFrameworks.context.available ? "available" : "missing"}`,
    `- Framework source: ${plan.marketingFrameworks.source}`,
    "## Ready-To-Record Short Video Pack",
    `- Source article: ${article.title}`,
    `- Article URL: ${article.absoluteUrl}`,
    `- Website CTA: ${shortVideoPack.landingUrl}`,
    `- Target length: ${shortVideoPack.format.targetLengthSeconds}s`,
    "### Script",
    ...shortVideoPack.script.map((line) => `- ${line}`),
    "### Shot List",
    ...shortVideoPack.shotList.map((line) => `- ${line}`),
    "### TikTok Caption",
    shortVideoPack.platformCaptions.tiktok,
    "### YouTube Shorts Title",
    youtubeTitle,
    "### YouTube Shorts Caption",
    youtubeCaption,
    "### Facebook Reels Caption",
    facebookCaption,
    "### UTM Links",
    `- TikTok: ${extractUrl(shortVideoPack.platformCaptions.tiktok)}`,
    `- YouTube Shorts: ${extractUrl(shortVideoPack.platformCaptions.youtubeShorts)}`,
    `- Facebook Reels: ${extractUrl(shortVideoPack.platformCaptions.facebookReels)}`,
    "## Metrics To Watch",
    ...shortVideoPack.metrics.map((line) => `- ${line}`),
    "## Next 24h Priority",
    "Xem publisher toi 21:00 va uu tien dang 1 video native clean len 3 kenh, sau do theo doi UTM sessions va chart creation starts.",
    "",
  ];

  writeFileSync(filePath, `${lines.join("\n")}\n`, "utf8");
  return filePath;
}

function getModeForWeekday(weekday) {
  if (["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].includes(weekday)) return "seo-publisher-followup";
  return "organic-distribution";
}

function titleFromSlug(slug) {
  return String(slug || "la-so-tu-vi")
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function extractUrl(text) {
  return text.match(/https?:\/\/\S+/)?.[0] || "";
}

function main() {
  const existingSlugs = readExistingArticleSlugs();
  const seoState = readSeoState();
  const plan = buildTrafficAutopilotPlan({ existingSlugs, seoState });
  const reportPath = createTrafficReport({ plan });
  process.stdout.write(`${JSON.stringify({ ...plan, artifacts: { reportPath } }, null, 2)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main();
}
