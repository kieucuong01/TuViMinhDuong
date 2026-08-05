import "server-only";

export {
  claimGuestChartForCheckout,
  claimGuestChartForUserFromPath,
  countRecentChartsForIp,
  deleteUserChart,
  getChart,
  listUserCharts,
  saveChart,
} from "@/lib/data/charts";

export {
  claimFreeOverviewBlockGeneration,
  claimFreeOverviewGeneration,
  failFreeOverviewGeneration,
  generateAndStoreFreeOverview,
  generateAndStoreFreeOverviewBlock,
  getFreeOverviewStatus,
  getOrCreateFreeOverview,
} from "@/lib/data/free-overview";

export {
  DEFAULT_OPERATION_SETTINGS,
  FEATURE_PRICES_CACHE_TAG,
  OPERATION_SETTINGS_CACHE_TAG,
  getFeaturePrice,
  getFeaturePrices,
  getOperationSettings,
  updateFeaturePrices,
  updateOperationSettings,
} from "@/lib/data/settings";

export {
  adjustCoins,
  completeReadingJob,
  createPendingReading,
  failReadingJob,
  getAnyCompletedReading,
  getCachedReading,
  getCompletedReadingsForScopes,
  getReadingById,
  getReadingJobById,
  getReadingJobByScope,
  getReadingProgress,
  getUserBalance,
  hasReadingBundleAccess,
  saveReading,
  saveReadingProgress,
  updateReadingJobProgress,
} from "@/lib/data/readings";

export {
  ARTICLES_CACHE_TAG,
  deleteArticleBySlug,
  getAdminArticleBySlug,
  getArticleBySlug,
  listAdminArticles,
  listArticleCategories,
  listArticleIndex,
  listArticleSummaries,
  listArticles,
  saveArticleCategoryFromForm,
  saveArticleFromForm,
} from "@/lib/data/articles";

export {
  getAdminBusinessDashboard,
  getAdminOverview,
  listAdminChartSubmissions,
  normalizeAdminTrendPeriod,
} from "@/lib/data/admin";

export type {
  AdminBusinessDashboard,
  AdminChartSubmission,
  AdminPaymentSource,
  AdminRecentPayment,
  AdminRecentUser,
  AdminRevenueMetrics,
  AdminTrendGroups,
  AdminTrendPeriod,
  AdminTrendPoint,
  ArticleIndexEntry,
  ArticleSummary,
  ChartCreationMetadata,
  ChartHistoryItem,
  FreeOverviewBlockProgress,
  FreeOverviewGenerationClaim,
  FreeOverviewStatus,
  OperationSettings,
  ReadingScopeKey,
  StoredReading,
  StoredReadingProgress,
} from "@/lib/data/contracts";
