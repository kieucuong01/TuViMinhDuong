"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { revalidatePath, revalidateTag } from "next/cache";
import { after } from "next/server";
import { clearSession, createMagicSession, getCurrentUser, getOrCreateEmailUser, isCheckoutGuestUser, loginOrRegister, normalizeCheckoutEmail, setSession, type SessionUser } from "@/lib/auth";
import { ARTICLES_CACHE_TAG, FEATURE_PRICES_CACHE_TAG, OPERATION_SETTINGS_CACHE_TAG, claimGuestChartForCheckout, claimGuestChartForUserFromPath, countRecentChartsForIp, generateAndStoreFreeOverview, getCachedReading, getChart, getFeaturePrice, getOperationSettings, getUserBalance, saveArticleCategoryFromForm, saveArticleFromForm, saveChart, saveReading, adjustCoins, deleteArticleBySlug, deleteUserChart, getReadingJobByScope, createPendingReading, updateOperationSettings, updateFeaturePrices, getCompletedReadingsForScopes, hasReadingBundleAccess, type ChartCreationMetadata } from "@/lib/data";
import { generateReading } from "@/lib/ai";
import { getDb } from "@/lib/db";
import { completePaidReadingOrder, createPayOSCheckout, createPayOSCustomCheckout, retryPaidFullReading } from "@/lib/payos";
import { COIN_PACKAGES, TEMPORARY_FULL_ACCESS } from "@/lib/pricing";
import { databaseEnvState, isPayOSEnabled } from "@/lib/env";
import { startFullReadingJobForUser, unlockReadingBundleForUser, unlockReadingForUser } from "@/lib/reading-unlock";
import { isReadingBundleKey } from "@/lib/reading-bundles";
import { adminAdjustUserCoins, adminDeleteUser } from "@/lib/admin-user-management";
import { createPerfTimer, logPerfEvent } from "@/lib/perf";
import { ActionTimeoutError, withActionTimeout } from "@/lib/action-timeout";
import { savePseoPageFromForm } from "@/lib/pseo-data";
import { chartCreationRateLimitExceeded, chartCreationRateLimitWindowStart, normalizeRequestIp, normalizeUserAgent, validateChartFullName } from "@/lib/chart-submission-guard";
import { normalizeChartAttribution } from "@/lib/chart-attribution";
import { AUTH_RATE_LIMIT_WINDOW_MS, LOGIN_RATE_LIMIT, checkRateLimit, rateLimitKeyFromHeaders } from "@/lib/rate-limit";
import { parseChartActionInput, parseFeaturePriceUpdates, parseOperationSettingsInput, parseReadingBundleInput, parseReadingRequestInput, safeNextPath } from "@/lib/action-input";
import { runCoinTopupCheckout, runFullReadingCheckout, runQuickReadingCheckout } from "@/lib/reading-checkout";

function createChartTimeoutMs(value = process.env.CREATE_CHART_ACTION_TIMEOUT_MS) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 1000 ? parsed : 12000;
}

const CREATE_CHART_ACTION_TIMEOUT_MS = createChartTimeoutMs();

const readingUnlockDependencies = {
  getChart,
  getCachedReading,
  getReadingJobByScope,
  getFeaturePrice,
  getUserBalance,
  adjustCoins,
  hasReadingBundleAccess,
  getCompletedReadingsForScopes,
  generateReading,
  createPendingReading,
  saveReading,
};

class ChartSubmissionRejectedError extends Error {
  constructor(public code: "invalid" | "rate_limited") {
    super(code);
    this.name = "ChartSubmissionRejectedError";
  }
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const next = safeNextPath(formData.get("next"), "/");
  const mode = String(formData.get("mode") || "page");
  let loginResult: Awaited<ReturnType<typeof loginOrRegister>> | null = null;
  let authError = "";

  try {
    const headerList = await headers();
    const rateLimit = checkRateLimit(rateLimitKeyFromHeaders("login", headerList), {
      limit: LOGIN_RATE_LIMIT,
      windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
    });
    if (rateLimit.rateLimited) {
      throw new Error("Bạn thử đăng nhập quá nhiều lần. Vui lòng chờ ít phút rồi thử lại.");
    }
    loginResult = await loginOrRegister(email, password);
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "";
    const normalizedMessage = rawMessage.toLocaleLowerCase("vi-VN");
    const isExpectedAuthError =
      rawMessage.includes("Email") ||
      normalizedMessage.includes("mật khẩu") ||
      normalizedMessage.includes("mat khau") ||
      normalizedMessage.includes("password") ||
      normalizedMessage.includes("quá nhiều") ||
      rawMessage.includes("Tài khoản này");
    authError = isExpectedAuthError
      ? rawMessage
      : "Chưa đăng nhập được. Bạn kiểm tra lại email, mật khẩu rồi thử lần nữa nhé.";

    if (!isExpectedAuthError) {
      console.error(JSON.stringify({
        level: "error",
        event: "login_action_failed",
        message: rawMessage || "Unknown login error",
      }));
    }
  }

  if (!loginResult) {
    if (mode === "modal") {
      redirect(withQueryParams(next, { login: "1", next, authError }));
    }
    redirect(`/dang-nhap?next=${encodeURIComponent(next)}&error=${encodeURIComponent(authError)}`);
  }

  let claimed = false;
  try {
    claimed = await claimGuestChartForUserFromPath(next, loginResult.user);
  } catch (error) {
    console.error(JSON.stringify({
      level: "error",
      event: "claim_guest_chart_after_login_failed",
      next,
      userId: loginResult.user.id,
      message: error instanceof Error ? error.message : String(error),
    }));
  }

  redirect(withQueryParams(next, {
    account: loginResult.accountResult,
    claimed: claimed ? "1" : null,
  }));
}

export async function logoutAction() {
  await clearSession();
  redirect("/");
}

function safeChartExperience(value: FormDataEntryValue | null): "default" | "wealth" {
  return value === "wealth" ? "wealth" : "default";
}

function chartCreationPaths(experience: "default" | "wealth", chartId?: string) {
  if (experience === "wealth") {
    return {
      error: "/tu-vi-tai-loc-dau-tu#lap-la-so-tai-loc",
      success: chartId ? `/la-so/${chartId}?view=tai-loc` : "/tu-vi-tai-loc-dau-tu",
    };
  }
  return { error: "/#lap-la-so", success: chartId ? `/la-so/${chartId}` : "/" };
}

function withReadingParam(path: string, readingId: string) {
  const [withoutHash, hash] = path.split("#");
  const separator = withoutHash.includes("?") ? "&" : "?";
  return `${withoutHash}${separator}reading=${encodeURIComponent(readingId)}${hash ? `#${hash}` : ""}`;
}

function withQueryParams(path: string, params: Record<string, string | number | null | undefined>) {
  const [withoutHash, hash] = path.split("#");
  const [basePath, existingQuery] = withoutHash.split("?");
  const query = new URLSearchParams(existingQuery || "");
  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") {
      query.delete(key);
      return;
    }
    query.set(key, String(value));
  });
  const qs = query.toString();
  return `${basePath}${qs ? `?${qs}` : ""}${hash ? `#${hash}` : ""}`;
}

function safeAdSource(value: FormDataEntryValue | null) {
  const source = String(value || "chart_form").trim();
  return /^[a-z0-9_-]{1,64}$/i.test(source) ? source : "chart_form";
}

function textField(formData: FormData, name: string) {
  return String(formData.get(name) || "");
}

function chartAttributionFromForm(formData: FormData, adSource: string) {
  return normalizeChartAttribution({
    utmSource: textField(formData, "utm_source"),
    utmMedium: textField(formData, "utm_medium"),
    utmCampaign: textField(formData, "utm_campaign"),
    utmContent: textField(formData, "utm_content"),
    utmTerm: textField(formData, "utm_term"),
    sourceParam: textField(formData, "source"),
    referrer: textField(formData, "referrer"),
    landingPath: textField(formData, "landing_path"),
    placement: adSource,
    sourceSlug: textField(formData, "source_slug"),
    entryArticle: textField(formData, "entry_article"),
    ctaLocation: textField(formData, "cta_location"),
  });
}

async function getChartCreationMetadata(formData: FormData, adSource: string): Promise<ChartCreationMetadata> {
  const headerList = await headers();
  return {
    requestIp: normalizeRequestIp(
      headerList.get("x-forwarded-for") ||
        headerList.get("x-real-ip") ||
        headerList.get("cf-connecting-ip") ||
        headerList.get("x-client-ip"),
    ),
    userAgent: normalizeUserAgent(headerList.get("user-agent")),
    attribution: chartAttributionFromForm(formData, adSource),
  };
}

async function guardChartSubmission(input: ReturnType<typeof parseChartActionInput>, formData: FormData, adSource: string) {
  const validation = validateChartFullName(input.fullName);
  if (!validation.ok) throw new ChartSubmissionRejectedError("invalid");
  input.fullName = validation.fullName;

  const metadata = await getChartCreationMetadata(formData, adSource);
  const recentCount = await countRecentChartsForIp(metadata.requestIp, chartCreationRateLimitWindowStart());
  if (chartCreationRateLimitExceeded(recentCount)) throw new ChartSubmissionRejectedError("rate_limited");
  return metadata;
}

function chartSubmissionErrorParam(error: unknown) {
  if (error instanceof ChartSubmissionRejectedError) return error.code;
  if (error instanceof ActionTimeoutError) return "timeout";
  return "failed";
}

export async function createChartAction(formData: FormData) {
  const timer = createPerfTimer();
  const input = parseChartActionInput(formData);
  const adSource = safeAdSource(formData.get("adSource"));
  const experience = safeChartExperience(formData.get("chartExperience"));
  const paths = chartCreationPaths(experience);
  let result: { user: SessionUser | null; chart: Awaited<ReturnType<typeof saveChart>> };

  try {
    result = await withActionTimeout("createChartAction", CREATE_CHART_ACTION_TIMEOUT_MS, async () => {
      const metadata = await timer.time("guardChartSubmission", () => guardChartSubmission(input, formData, adSource));
      const user = await timer.time("getCurrentUser", () => getCurrentUser());
      const chart = await timer.time("saveChart", () => saveChart(input, user, metadata));
      return { user, chart };
    });
  } catch (error) {
    const chartError = chartSubmissionErrorParam(error);
    logPerfEvent("create_chart_action_failed", timer.total(), {
      force: true,
      reason: chartError,
      timeoutMs: CREATE_CHART_ACTION_TIMEOUT_MS,
      dbEnvState: databaseEnvState(),
      error: error instanceof Error ? error.message : String(error),
      timings: timer.timings(),
    });
    redirect(withQueryParams(paths.error, { chartError, adSource }));
  }

  logPerfEvent("create_chart_action_timing", timer.total(), {
    hasUser: Boolean(result.user),
    chartId: result.chart.id,
    dbEnvState: databaseEnvState(),
    timeoutMs: CREATE_CHART_ACTION_TIMEOUT_MS,
    timings: timer.timings(),
  });
  after(() => {
    void generateAndStoreFreeOverview(result.chart.id).catch((error) => {
      console.error("free_overview_early_generation_failed", error);
    });
  });
  redirect(withQueryParams(chartCreationPaths(experience, result.chart.id).success, { created: "1", adSource }));
}

export async function quickReadingCheckoutAction(formData: FormData) {
  const operationSettings = await getOperationSettings();
  if (!operationSettings.paymentsEnabled || !operationSettings.paidReadingsEnabled) redirect("/?paid=disabled");

  const input = parseChartActionInput(formData);
  const adSource = safeAdSource(formData.get("adSource"));
  let metadata: ChartCreationMetadata;
  try {
    metadata = await guardChartSubmission(input, formData, adSource);
  } catch (error) {
    redirect(withQueryParams("/#lap-la-so", { chartError: chartSubmissionErrorParam(error) }));
  }
  const email = String(formData.get("email") || "");
  const user = await getOrCreateEmailUser(email, input.fullName);
  await setSession(user);

  const chart = await saveChart(input, user, metadata);
  const price = await getFeaturePrice("FULL");
  const token = await createMagicSession(user);
  const checkout = await runQuickReadingCheckout(
    { getDb, createPayOSCustomCheckout, isPayOSEnabled, generateReading, saveReading },
    { user, chart, token, price },
  );

  if (checkout.status === "error") {
    redirect(withQueryParams("/#lap-la-so", { checkout: checkout.code }));
  }
  if ("revalidatePath" in checkout && checkout.revalidatePath) {
    revalidatePath(checkout.revalidatePath);
  }
  redirect(checkout.location);
}

export async function deleteChartAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/dang-nhap?next=/la-so");
  const chartId = String(formData.get("chartId") || "");
  if (chartId) await deleteUserChart(user, chartId);
  revalidatePath("/la-so");
  redirect("/la-so");
}

async function getReadingUser(chartId: string, nextPath: string, currentUser?: SessionUser | null): Promise<SessionUser> {
  const user = currentUser === undefined ? await getCurrentUser() : currentUser;
  if (user) return user;
  if (!TEMPORARY_FULL_ACCESS) {
    redirect(withQueryParams(nextPath, { paywall: "login", login: "1", next: nextPath }));
  }

  const db = getDb();
  if (db) {
    const created = await db.user.upsert({
      where: { email: `guest-${chartId}@lasotinhhoa.local` },
      update: {},
      create: {
        email: `guest-${chartId}@lasotinhhoa.local`,
        name: "Khách xem lá số",
        coinBalance: 0,
      },
    });
    const dbGuest: SessionUser = {
      id: created.id,
      email: created.email,
      name: created.name || "Khách xem lá số",
      role: created.role,
      coinBalance: created.coinBalance,
    };
    await setSession(dbGuest);
    return dbGuest;
  }

  const guest: SessionUser = {
    id: `guest-${chartId}`,
    email: "guest@lasotinhhoa.local",
    name: "Khách xem lá số",
    role: "USER",
    coinBalance: 0,
  };
  await setSession(guest);
  return guest;
}

export async function checkoutFullReadingAction(formData: FormData) {
  const chartId = String(formData.get("chartId") || "").trim();
  const nextPath = `/la-so/${chartId}`;
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(chartId)) redirect("/la-so?checkout=invalid");

  const [currentUser, operationSettings] = await Promise.all([getCurrentUser(), getOperationSettings()]);
  if (!operationSettings.paymentsEnabled || !operationSettings.paidReadingsEnabled) {
    redirect(withQueryParams(nextPath, { checkout: "disabled" }));
  }

  const record = await getChart(chartId);
  if (!record) {
    redirect(withQueryParams(nextPath, { checkout: "forbidden" }));
  }

  const requiresCheckoutEmail = !currentUser || isCheckoutGuestUser(currentUser);
  const buyerEmail = requiresCheckoutEmail
    ? normalizeCheckoutEmail(formData.get("email"))
    : currentUser.email;
  if (!buyerEmail) {
    redirect(withQueryParams(nextPath, { checkout: "email-invalid" }));
  }

  let user = currentUser, checkoutRecord = record;
  if (!user) {
    user = await claimGuestChartForCheckout(chartId, record.chart.input.fullName);
    if (!user) redirect(withQueryParams(nextPath, { checkout: "forbidden" }));
    checkoutRecord = { ...record, userId: user.id };
    await setSession(user);
  } else if (record.userId !== user.id && user.role !== "ADMIN") {
    redirect(withQueryParams(nextPath, { checkout: "forbidden" }));
  }

  const checkout = await runFullReadingCheckout(
    {
      getDb,
      getCachedReading,
      getReadingJobByScope,
      getFeaturePrice,
      retryPaidFullReading,
      createPayOSCustomCheckout,
      createPendingReading,
      completePaidReadingOrder,
    },
    {
      record: checkoutRecord,
      user,
      chartId,
      buyerEmail,
      requiresCheckoutEmail,
      getReturnToken: async () => requiresCheckoutEmail ? createMagicSession(user, "checkout") : null,
    },
  );

  if (checkout.status === "error") {
    redirect(withQueryParams(nextPath, { checkout: checkout.code }));
  }
  redirect(checkout.location);
}

export async function requestReadingAction(formData: FormData) {
  const { chartId, type, scopeKey, nextPath } = parseReadingRequestInput(formData);
  const [currentUser, operationSettings] = await Promise.all([getCurrentUser(), getOperationSettings()]);

  if (!operationSettings.paidReadingsEnabled && currentUser?.role !== "ADMIN") {
    redirect(withQueryParams(nextPath, { paid: "disabled" }));
  }

  const user = await getReadingUser(chartId, nextPath, currentUser);

  if (type === "FULL" && scopeKey === "all") {
    const result = await startFullReadingJobForUser(
      readingUnlockDependencies,
      { user, chartId, temporaryFullAccess: TEMPORARY_FULL_ACCESS, paidReadingsEnabled: operationSettings.paidReadingsEnabled },
    );

    if (result.status === "disabled") {
      redirect(withQueryParams(nextPath, { paid: "disabled" }));
    }

    if (result.status === "forbidden") {
      redirect(withQueryParams(nextPath, { paid: "forbidden" }));
    }

    if (result.status === "insufficient_coins") {
      redirect(withQueryParams(nextPath, { paywall: "coins", need: result.needCoins }));
    }

    revalidatePath(`/la-so/${chartId}`);
    const advancedPath = `/la-so/${chartId}/nang-cao`;
    redirect(withQueryParams(advancedPath, { reading: result.readingId, ...(result.status === "cached" ? {} : { generating: "1" }) }));
  }

  const result = await unlockReadingForUser(
    readingUnlockDependencies,
    { user, chartId, type, scopeKey, temporaryFullAccess: TEMPORARY_FULL_ACCESS, paidReadingsEnabled: operationSettings.paidReadingsEnabled },
  );

  if (result.status === "disabled") {
    redirect(withQueryParams(nextPath, { paid: "disabled" }));
  }

  if (result.status === "forbidden") {
    redirect(withQueryParams(nextPath, { paid: "forbidden" }));
  }

  if (result.status === "insufficient_coins") {
    redirect(withQueryParams(nextPath, { paywall: "coins", need: result.needCoins }));
  }

  revalidatePath(`/la-so/${chartId}`);
  redirect(withReadingParam(nextPath, result.readingId));
}

export async function requestReadingBundleAction(formData: FormData) {
  const { chartId, type: rawType, nextPath } = parseReadingBundleInput(formData);
  if (!isReadingBundleKey(rawType)) redirect(nextPath);

  const [currentUser, operationSettings] = await Promise.all([getCurrentUser(), getOperationSettings()]);

  if (!operationSettings.paidReadingsEnabled && currentUser?.role !== "ADMIN") {
    redirect(withQueryParams(nextPath, { paid: "disabled" }));
  }

  const user = await getReadingUser(chartId, nextPath, currentUser);
  const result = await unlockReadingBundleForUser(
    readingUnlockDependencies,
    { user, chartId, type: rawType, temporaryFullAccess: TEMPORARY_FULL_ACCESS, paidReadingsEnabled: operationSettings.paidReadingsEnabled },
  );

  if (result.status === "disabled") {
    redirect(withQueryParams(nextPath, { paid: "disabled" }));
  }

  if (result.status === "forbidden") {
    redirect(withQueryParams(nextPath, { paid: "forbidden" }));
  }

  if (result.status === "insufficient_coins") {
    redirect(withQueryParams(nextPath, { paywall: "coins", need: result.needCoins }));
  }

  revalidatePath(`/la-so/${chartId}`);
  redirect(withQueryParams(nextPath, { bundle: rawType }));
}

export async function saveArticleAction(formData: FormData) {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") redirect("/dang-nhap?next=/admin");
  const originalSlug = String(formData.get("originalSlug") || "");
  const article = await saveArticleFromForm(formData);
  revalidateTag(ARTICLES_CACHE_TAG, "max");
  revalidatePath("/kien-thuc-tu-vi");
  if (originalSlug && originalSlug !== article.slug) revalidatePath(`/kien-thuc-tu-vi/${originalSlug}`);
  revalidatePath(`/kien-thuc-tu-vi/${article.slug}`);
  redirect(`/admin?tab=content&edit=${article.slug}&saved=${article.slug}`);
}

export async function savePseoPageAction(formData: FormData) {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") redirect("/dang-nhap?next=/admin/tra-cuu");
  const result = await savePseoPageFromForm(formData);
  revalidatePath("/tra-cuu");
  revalidatePath(`/tra-cuu/${result.page.slug}`);
  revalidatePath("/sitemap-index.xml");
  redirect(`/admin/tra-cuu?edit=${encodeURIComponent(result.page.slug)}&saved=${encodeURIComponent(result.page.slug)}`);
}

export async function deleteArticleAction(formData: FormData) {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") redirect("/dang-nhap?next=/admin");
  const slug = String(formData.get("slug") || "");
  if (slug) {
    await deleteArticleBySlug(slug);
    revalidateTag(ARTICLES_CACHE_TAG, "max");
    revalidatePath("/admin");
    revalidatePath("/kien-thuc-tu-vi");
    revalidatePath(`/kien-thuc-tu-vi/${slug}`);
  }
  redirect(`/admin?tab=content${slug ? `&deleted=${encodeURIComponent(slug)}` : ""}`);
}

function adminUserErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message === "INVALID_AMOUNT") return "Số xu cần là số nguyên khác 0.";
  if (message === "INSUFFICIENT_COINS") return "Không thể thu hồi nhiều hơn số xu hiện có.";
  if (message === "USER_NOT_FOUND") return "Không tìm thấy user này.";
  if (message === "CANNOT_DELETE_SELF") return "Admin không thể tự xóa tài khoản đang đăng nhập.";
  if (message === "CANNOT_DELETE_ADMIN") return "Không thể xóa tài khoản admin.";
  if (message === "DATABASE_REQUIRED") return "Chức năng này cần kết nối database thật.";
  return "Chưa xử lý được thao tác user. Vui lòng thử lại.";
}

export async function adjustUserCoinsAction(formData: FormData) {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") redirect("/dang-nhap?next=/admin");

  const userId = String(formData.get("userId") || "");
  const direction = String(formData.get("direction") || "credit");
  const amountValue = Number(formData.get("amount"));
  const amount = direction === "debit" ? -Math.abs(amountValue) : Math.abs(amountValue);
  const reason = String(formData.get("reason") || "");

  let result: Awaited<ReturnType<typeof adminAdjustUserCoins>>;
  try {
    result = await adminAdjustUserCoins(user, { userId, amount, reason });
  } catch (error) {
    redirect(`/admin?tab=users&userError=${encodeURIComponent(adminUserErrorMessage(error))}`);
  }

  revalidatePath("/admin");
  redirect(`/admin?tab=users&userAdjusted=${encodeURIComponent(result.email)}`);
}

export async function deleteUserAction(formData: FormData) {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") redirect("/dang-nhap?next=/admin");

  const userId = String(formData.get("userId") || "");
  let result: Awaited<ReturnType<typeof adminDeleteUser>>;
  try {
    result = await adminDeleteUser(user, { userId });
  } catch (error) {
    redirect(`/admin?tab=users&userError=${encodeURIComponent(adminUserErrorMessage(error))}`);
  }

  revalidatePath("/admin");
  redirect(`/admin?tab=users&userDeleted=${encodeURIComponent(result.email)}`);
}

export async function saveArticleCategoryAction(formData: FormData) {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") redirect("/dang-nhap?next=/admin");
  const category = await saveArticleCategoryFromForm(formData);
  revalidateTag(ARTICLES_CACHE_TAG, "max");
  revalidatePath("/admin");
  revalidatePath("/kien-thuc-tu-vi");
  redirect(`/admin?tab=content&categorySaved=${category.slug}`);
}

export async function saveOperationSettingsAction(formData: FormData) {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") redirect("/dang-nhap?next=/admin");

  const settings = parseOperationSettingsInput(formData);

  await updateOperationSettings(settings);
  revalidateTag(OPERATION_SETTINGS_CACHE_TAG, "max");
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/nap-xu");
  revalidatePath("/pricing");
  redirect("/admin?tab=settings&settingsSaved=1");
}

function adminPricingErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message === "INVALID_PRICE_KEY") return "Không nhận diện được loại luận giải cần cập nhật.";
  if (message === "INVALID_PRICE") return "Giá phải là số xu nguyên, không âm.";
  return "Chưa lưu được bảng giá. Vui lòng thử lại.";
}

export async function saveFeaturePricesAction(formData: FormData) {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") redirect("/dang-nhap?next=/admin");

  const updates = parseFeaturePriceUpdates(formData);

  try {
    await updateFeaturePrices(updates);
  } catch (error) {
    redirect(`/admin?tab=settings&pricingError=${encodeURIComponent(adminPricingErrorMessage(error))}`);
  }

  revalidateTag(FEATURE_PRICES_CACHE_TAG, "max");
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/pricing");
  redirect("/admin?tab=settings&pricingSaved=1");
}

export async function createCheckoutAction(formData: FormData) {
  if (TEMPORARY_FULL_ACCESS) redirect("/nap-xu?status=disabled");
  const operationSettings = await getOperationSettings();
  if (!operationSettings.paymentsEnabled || !operationSettings.coinTopupEnabled) redirect("/nap-xu?status=disabled");

  const packageKey = String(formData.get("packageKey") || "full-reading");
  const returnTo = safeNextPath(formData.get("returnTo"), "/nap-xu");
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/dang-nhap?next=${encodeURIComponent(withQueryParams(returnTo, { topup: "1" }))}&paywall=login`);
  }
  if (isCheckoutGuestUser(user)) redirect("/la-so");
  const pack = COIN_PACKAGES.find((item) => item.key === packageKey) || COIN_PACKAGES[1];
  const adsReturnTo = withQueryParams(returnTo, { adPackage: pack.key, adValue: pack.priceVnd });
  const checkout = await runCoinTopupCheckout(
    { getDb, createPayOSCheckout, adjustCoins },
    { user, packageKey, pack, returnTo: adsReturnTo },
  );
  redirect(checkout.location);
}
