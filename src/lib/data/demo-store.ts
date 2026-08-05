import "server-only";

import { articleWithScore, seedArticles, type ArticleCategoryView, type ArticleView } from "@/lib/content";
import type { FeaturePriceMap } from "@/lib/pricing";
import type { OperationSettings, StoredChart, StoredReading, StoredReadingProgress } from "./contracts";

type DemoStoreRegistry = {
  demoCharts?: Map<string, StoredChart>;
  demoReadings?: Map<string, StoredReading>;
  demoReadingProgress?: Map<string, StoredReadingProgress>;
  demoBalances?: Map<string, number>;
  demoArticles?: Map<string, ArticleView>;
  demoArticleCategories?: Map<string, ArticleCategoryView>;
  demoOperationSettings?: OperationSettings;
  demoFeaturePrices?: FeaturePriceMap;
};

const store = globalThis as unknown as DemoStoreRegistry;

const seedArticleCategories: ArticleCategoryView[] = [
  { id: "cat-nhap-mon", name: "Nhập môn tử vi", slug: "nhap-mon-tu-vi", description: "Bài nền tảng cho người mới bắt đầu đọc lá số." },
  { id: "cat-12-cung", name: "12 cung", slug: "12-cung", description: "Kiến thức về từng cung trong lá số tử vi." },
  { id: "cat-van-han", name: "Vận hạn", slug: "van-han", description: "Đại vận, tiểu vận, nguyệt vận và nhịp vận theo thời gian." },
];

export function charts() {
  store.demoCharts ||= new Map();
  return store.demoCharts;
}

export function readings() {
  store.demoReadings ||= new Map();
  return store.demoReadings;
}

export function readingProgressEntries() {
  store.demoReadingProgress ||= new Map();
  return store.demoReadingProgress;
}

export function balances() {
  store.demoBalances ||= new Map();
  return store.demoBalances;
}

export function demoArticles() {
  store.demoArticles ||= new Map(seedArticles.map((article) => [article.slug, articleWithScore(article)]));
  return store.demoArticles;
}

export function demoArticleCategories() {
  store.demoArticleCategories ||= new Map(seedArticleCategories.map((category) => [category.id, category]));
  return store.demoArticleCategories;
}

export function demoOperationSettings(initial: OperationSettings) {
  store.demoOperationSettings ||= { ...initial };
  return store.demoOperationSettings;
}

export function replaceDemoOperationSettings(next: OperationSettings) {
  store.demoOperationSettings = { ...next };
  return store.demoOperationSettings;
}

export function demoFeaturePrices(initial: () => FeaturePriceMap) {
  store.demoFeaturePrices ||= initial();
  return store.demoFeaturePrices;
}

export function replaceDemoFeaturePrices(next: FeaturePriceMap) {
  store.demoFeaturePrices = next;
  return store.demoFeaturePrices;
}
