#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { extractSeedArticleSlugs } from "../seo/seo-autopilot-core.mjs";

const REPO_ROOT = fileURLToPath(new URL("../..", import.meta.url));
const CONTENT_PATH = resolve(REPO_ROOT, "src/lib/content.ts");
const SEO_STATE_PATH = resolve(REPO_ROOT, "docs/seo-autopilot/state.json");
const PRODUCT_MARKETING_PATH = resolve(REPO_ROOT, ".agents/product-marketing.md");
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
  const stateSlug = seoState?.lastPublishedSlug || seoState?.selectedSlug || seoState?.slug;
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
  const utmLink = `${selected.absoluteUrl}?utm_source=organic_social&utm_medium=community&utm_campaign=traffic_autopilot`;

  return [
    {
      channel: "facebook-zalo-community",
      link: selected.url,
      copy:
        `Mot loi nhac nho nho khi xem tu vi: dung doc tung sao rieng le, hay dat no trong boi canh cung, gio sinh va van han. ` +
        `Minh vua tong hop mot bai ngan ve "${selected.title}" de nguoi moi doc de hon: ${utmLink}. ` +
        `Neu muon doi chieu voi la so ca nhan, co the lap mien phi tai /#lap-la-so.`,
      checklist: [
        "Dang vao nhom phu hop va co noi dung trao doi that, khong spam nhieu nhom trong cung mot ngay.",
        "Tra loi binh luan bang giai thich chung, khong hua chac ket qua doi tuong ca nhan.",
      ],
    },
    {
      channel: "short-video",
      link: selected.url,
      script: [
        `Hook 3s: Neu ban moi lap la so, dung voi ket luan chi tu mot sao hoac mot cung.`,
        `Than bai 20s: Neu muon doc "${selected.title}", hay kiem tra 3 lop: thong tin sinh co dung khong, cung nao dang xet, va co sao/phu tinh nao lam doi nghia khong.`,
        `CTA 5s: Doc bai tai ${selected.url}, sau do thu lap la so rieng tai /#lap-la-so de doi chieu boi canh.`,
      ],
      checklist: ["Dung caption ngan, them link bai viet, khong dung ngon tu khang dinh so menh."],
    },
    {
      channel: "internal-link-flow",
      link: selected.url,
      copy:
        `Khi co bai moi hoac bai dang co impression, them 1-2 link noi bo tu hub kien thuc hoac bai lien quan den ${selected.url}. ` +
        `Anchor nen tu nhien, uu tien cau hoi nguoi doc dang co, va ket bai dat CTA gon den /#lap-la-so.`,
      checklist: ["Chi sua link neu bai lien quan that su.", "Khong nhoi anchor trung khop qua 2 lan."],
    },
  ];
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
      "SEO content compounding via existing Mon/Wed/Fri publisher",
      "Organic Facebook/Zalo/community distribution from existing useful articles",
      "Internal links and compact CTAs toward chart creation",
      "Weekly Search Console and Lighthouse-style regression review",
    ],
    marketingFrameworks: buildMarketingFrameworks({ hasProductMarketingContext }),
    socialDistribution,
    qualityGate: [
      "People-first content: answer one real reader question and add a next useful action.",
      "No doorway variants, no thin AI rewrites, no one-page-per-keyword spam.",
      "Every social/community task must add context, not only drop a link.",
      "Use Search Console or repo evidence before refreshing/publishing; report blockers honestly.",
    ],
    hardStops: [
      "Khong tu dong dang bai len Facebook/Zalo/forum khi chua co kenh va chinh sach duoc duyet.",
      "Khong chay quang cao tra phi hoac dung paid API khi chua co ngan sach va phe duyet ro rang.",
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
        `Theo doi publisher 21:00, chon 1 URL vua publish/refresh hoac ${article.url} de phan phoi lai va them link noi bo neu huu ich.`,
      why:
        "Mon/Wed/Fri already have the dedicated SEO publisher; this daily traffic run should not duplicate article generation.",
      commands: ["npm run traffic:autopilot"],
      optionalCommands: ["npm run seo:autopilot:publisher # only if the dedicated publisher automation failed or is disabled"],
    };
  }

  if (mode === "weekly-measurement") {
    return {
      ...basePlan,
      primaryTask:
        "Doc ket qua Sunday strategy, chon 1 insight can hanh dong: refresh title/meta, them link noi bo, hoac ghi nhan blocker GSC/Lighthouse.",
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
      `Tao 1 goi phan phoi organic cho ${article.url}: community post, short-video outline, va 1 internal-link/CTA task.`,
    why:
      "Non-publisher days should extract more traffic from existing content before creating more pages.",
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
      "Social: repurpose pillar content into standalone content atoms instead of creating disconnected posts from scratch.",
      "Free tools: prefer simple tools adjacent to chart creation with immediate value and low maintenance.",
      "Community: provide member value before promotion; no link drops without useful context.",
      "CRO: keep one clear primary CTA and reduce friction toward free chart creation.",
      "Analytics: measure clicks, engagement, and conversion path impact before scaling a tactic.",
      "AI SEO: use structured, source-backed, brand-consistent explanations that can be cited, not generic filler.",
    ],
  };
}

export function readExistingArticleSlugs(contentPath = CONTENT_PATH) {
  if (!existsSync(contentPath)) return [];
  return extractSeedArticleSlugs(readFileSync(contentPath, "utf8"));
}

export function readSeoState(statePath = SEO_STATE_PATH) {
  if (!existsSync(statePath)) return null;
  try {
    return JSON.parse(readFileSync(statePath, "utf8"));
  } catch {
    return null;
  }
}

function getModeForWeekday(weekday) {
  if (["Mon", "Wed", "Fri"].includes(weekday)) return "seo-publisher-followup";
  if (weekday === "Sun") return "weekly-measurement";
  return "organic-distribution";
}

function titleFromSlug(slug) {
  return String(slug || "la-so-tu-vi")
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function main() {
  const existingSlugs = readExistingArticleSlugs();
  const seoState = readSeoState();
  const plan = buildTrafficAutopilotPlan({ existingSlugs, seoState });
  process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main();
}
