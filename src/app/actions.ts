"use server";

import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { clearSession, createMagicSession, getCurrentUser, getOrCreateEmailUser, loginOrRegister, setSession, type SessionUser } from "@/lib/auth";
import { ARTICLES_CACHE_TAG, FEATURE_PRICES_CACHE_TAG, OPERATION_SETTINGS_CACHE_TAG, getCachedReading, getChart, getFeaturePrice, getOperationSettings, getUserBalance, saveArticleCategoryFromForm, saveArticleFromForm, saveChart, saveReading, adjustCoins, deleteArticleBySlug, deleteUserChart, getReadingJobByScope, createPendingReading, updateOperationSettings, updateFeaturePrices, getCompletedReadingsForScopes, hasReadingBundleAccess } from "@/lib/data";
import { generateReading } from "@/lib/ai";
import { getDb } from "@/lib/db";
import { createPayOSCheckout, createPayOSCustomCheckout } from "@/lib/payos";
import type { CalendarType, Gender } from "@/lib/chart";
import { COIN_PACKAGES, FEATURE_PRICE_KEYS, TEMPORARY_FULL_ACCESS } from "@/lib/pricing";
import type { ReadingKey } from "@/lib/pricing";
import { databaseEnvState, isPayOSEnabled } from "@/lib/env";
import { startFullReadingJobForUser, unlockReadingBundleForUser, unlockReadingForUser } from "@/lib/reading-unlock";
import { isReadingBundleKey } from "@/lib/reading-bundles";
import { adminAdjustUserCoins, adminDeleteUser } from "@/lib/admin-user-management";
import { createPerfTimer, logPerfEvent } from "@/lib/perf";
import { ActionTimeoutError, withActionTimeout } from "@/lib/action-timeout";
import { savePseoPageFromForm } from "@/lib/pseo-data";

function createChartTimeoutMs(value = process.env.CREATE_CHART_ACTION_TIMEOUT_MS) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 1000 ? parsed : 12000;
}

const CREATE_CHART_ACTION_TIMEOUT_MS = createChartTimeoutMs();

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const next = safeNextPath(formData.get("next"), "/");
  const mode = String(formData.get("mode") || "page");

  try {
    await loginOrRegister(email, password);
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "";
    const isExpectedAuthError =
      rawMessage.includes("Email") ||
      rawMessage.includes("Mật khẩu") ||
      rawMessage.includes("mat khau") ||
      rawMessage.includes("password");
    const message = isExpectedAuthError
      ? rawMessage
      : "Chưa đăng nhập được. Bạn kiểm tra lại email, mật khẩu rồi thử lần nữa nhé.";

    if (!isExpectedAuthError) {
      console.error(JSON.stringify({
        level: "error",
        event: "login_action_failed",
        message: rawMessage || "Unknown login error",
      }));
    }

    if (mode === "modal") {
      redirect(withQueryParams(next, { login: "1", next, authError: message }));
    }
    redirect(`/dang-nhap?next=${encodeURIComponent(next)}&error=${encodeURIComponent(message)}`);
  }

  redirect(next);
}

export async function logoutAction() {
  await clearSession();
  redirect("/");
}

function safeNextPath(value: FormDataEntryValue | null, fallback: string) {
  const next = String(value || fallback);
  return next.startsWith("/") && !next.startsWith("//") ? next : fallback;
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

function chartInputFromForm(formData: FormData) {
  return {
    fullName: String(formData.get("fullName") || ""),
    gender: String(formData.get("gender") || "male") as Gender,
    calendarType: String(formData.get("calendarType") || "solar") as CalendarType,
    day: Number(formData.get("day") || 1),
    month: Number(formData.get("month") || 1),
    year: Number(formData.get("year") || 1990),
    birthHour: Number(formData.get("birthHour") || 0),
    birthMinute: Number(formData.get("birthMinute") || 0),
    viewYear: Number(formData.get("viewYear") || new Date().getFullYear()),
    timezone: "Asia/Bangkok",
  };
}

export async function createChartAction(formData: FormData) {
  const timer = createPerfTimer();
  const input = chartInputFromForm(formData);
  const adSource = safeAdSource(formData.get("adSource"));
  let result: { user: SessionUser | null; chart: Awaited<ReturnType<typeof saveChart>> };

  try {
    result = await withActionTimeout("createChartAction", CREATE_CHART_ACTION_TIMEOUT_MS, async () => {
      const user = await timer.time("getCurrentUser", () => getCurrentUser());
      const chart = await timer.time("saveChart", () => saveChart(input, user));
      return { user, chart };
    });
  } catch (error) {
    const isTimeout = error instanceof ActionTimeoutError;
    logPerfEvent("create_chart_action_failed", timer.total(), {
      force: true,
      reason: isTimeout ? "timeout" : "error",
      timeoutMs: CREATE_CHART_ACTION_TIMEOUT_MS,
      dbEnvState: databaseEnvState(),
      error: error instanceof Error ? error.message : String(error),
      timings: timer.timings(),
    });
    redirect(withQueryParams("/#lap-la-so", { chartError: isTimeout ? "timeout" : "failed", adSource }));
  }

  logPerfEvent("create_chart_action_timing", timer.total(), {
    hasUser: Boolean(result.user),
    chartId: result.chart.id,
    dbEnvState: databaseEnvState(),
    timeoutMs: CREATE_CHART_ACTION_TIMEOUT_MS,
    timings: timer.timings(),
  });
  redirect(withQueryParams(`/la-so/${result.chart.id}`, { created: "1", adSource }));
}

export async function quickReadingCheckoutAction(formData: FormData) {
  const operationSettings = await getOperationSettings();
  if (!operationSettings.paymentsEnabled || !operationSettings.paidReadingsEnabled) redirect("/?paid=disabled");

  const input = chartInputFromForm(formData);
  const email = String(formData.get("email") || "");
  const user = await getOrCreateEmailUser(email, input.fullName);
  await setSession(user);

  const chart = await saveChart(input, user);
  const price = await getFeaturePrice("FULL");
  const amountVnd = price.priceCoins * 1000;
  const token = await createMagicSession(user);
  const successNext = `/la-so/${chart.id}/nang-cao`;
  const magicPath = `/api/auth/magic?token=${encodeURIComponent(token)}&next=${encodeURIComponent(successNext)}`;
  const cancelPath = `/la-so/${chart.id}?status=cancelled`;
  const checkout = await createPayOSCustomCheckout({
    amountVnd,
    description: "Luan giai la so",
    itemName: price.label,
    buyerName: user.name,
    buyerEmail: user.email,
    returnPath: magicPath,
    cancelPath,
  });

  const db = getDb();
  const isDemoCheckout = checkout.raw && typeof checkout.raw === "object" && "mode" in checkout.raw;
  if (db) {
    await db.paymentOrder.create({
      data: {
        userId: user.id,
        orderCode: BigInt(checkout.orderCode),
        paymentLinkId: checkout.paymentLinkId,
        amountVnd,
        coins: 0,
        status: isDemoCheckout ? "PAID" : "PENDING",
        paidAt: isDemoCheckout ? new Date() : undefined,
        checkoutUrl: checkout.checkoutUrl,
        rawPayload: {
          raw: checkout.raw,
          quickReading: {
            chartId: chart.id,
            type: "FULL",
            scopeKey: "all",
            email: user.email,
            token,
          },
        },
      },
    });
  }

  if (!isPayOSEnabled()) {
    const result = await generateReading(chart.chart, "FULL", "all");
    await saveReading(user, chart.id, "FULL", "all", price.priceCoins, result.content, {
      type: "FULL",
      scopeKey: "all",
      model: result.model,
      source: "quick-email-demo",
    });
    revalidatePath(`/la-so/${chart.id}`);
    redirect(`/la-so/${chart.id}/nang-cao?status=demo-paid`);
  }

  redirect(checkout.checkoutUrl);
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

export async function requestReadingAction(formData: FormData) {
  const chartId = String(formData.get("chartId") || "");
  const type = String(formData.get("type") || "FULL") as ReadingKey;
  const scopeKey = String(formData.get("scopeKey") || "all");
  const nextPath = safeNextPath(formData.get("next"), `/la-so/${chartId}`);
  const [currentUser, operationSettings] = await Promise.all([getCurrentUser(), getOperationSettings()]);

  if (!operationSettings.paidReadingsEnabled && currentUser?.role !== "ADMIN") {
    redirect(withQueryParams(nextPath, { paid: "disabled" }));
  }

  const user = await getReadingUser(chartId, nextPath, currentUser);

  if (type === "FULL" && scopeKey === "all") {
    const result = await startFullReadingJobForUser(
      {
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
      },
      { user, chartId, temporaryFullAccess: TEMPORARY_FULL_ACCESS, paidReadingsEnabled: operationSettings.paidReadingsEnabled },
    );

    if (result.status === "disabled") {
      redirect(withQueryParams(nextPath, { paid: "disabled" }));
    }

    if (result.status === "insufficient_coins") {
      redirect(withQueryParams(nextPath, { paywall: "coins", need: result.needCoins }));
    }

    revalidatePath(`/la-so/${chartId}`);
    const advancedPath = `/la-so/${chartId}/nang-cao`;
    redirect(withQueryParams(advancedPath, { reading: result.readingId, ...(result.status === "cached" ? {} : { generating: "1" }) }));
  }

  const result = await unlockReadingForUser(
    {
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
    },
    { user, chartId, type, scopeKey, temporaryFullAccess: TEMPORARY_FULL_ACCESS, paidReadingsEnabled: operationSettings.paidReadingsEnabled },
  );

  if (result.status === "disabled") {
    redirect(withQueryParams(nextPath, { paid: "disabled" }));
  }

  if (result.status === "insufficient_coins") {
    redirect(withQueryParams(nextPath, { paywall: "coins", need: result.needCoins }));
  }

  revalidatePath(`/la-so/${chartId}`);
  redirect(withReadingParam(nextPath, result.readingId));
}

export async function requestReadingBundleAction(formData: FormData) {
  const chartId = String(formData.get("chartId") || "");
  const rawType = String(formData.get("type") || "") as ReadingKey;
  const nextPath = safeNextPath(formData.get("next"), `/la-so/${chartId}`);
  if (!isReadingBundleKey(rawType)) redirect(nextPath);

  const [currentUser, operationSettings] = await Promise.all([getCurrentUser(), getOperationSettings()]);

  if (!operationSettings.paidReadingsEnabled && currentUser?.role !== "ADMIN") {
    redirect(withQueryParams(nextPath, { paid: "disabled" }));
  }

  const user = await getReadingUser(chartId, nextPath, currentUser);
  const result = await unlockReadingBundleForUser(
    {
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
    },
    { user, chartId, type: rawType, temporaryFullAccess: TEMPORARY_FULL_ACCESS, paidReadingsEnabled: operationSettings.paidReadingsEnabled },
  );

  if (result.status === "disabled") {
    redirect(withQueryParams(nextPath, { paid: "disabled" }));
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

  const mode = String(formData.get("mode") || "custom");
  const settings =
    mode === "basic-free"
      ? { paymentsEnabled: false, coinTopupEnabled: false, paidReadingsEnabled: false }
      : mode === "commercial"
        ? { paymentsEnabled: true, coinTopupEnabled: true, paidReadingsEnabled: true }
        : {
            paymentsEnabled: formData.get("paymentsEnabled") === "1",
            coinTopupEnabled: formData.get("coinTopupEnabled") === "1",
            paidReadingsEnabled: formData.get("paidReadingsEnabled") === "1",
          };

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

  const updates = FEATURE_PRICE_KEYS.map((key) => ({
    key,
    priceCoins: Number(formData.get(`priceCoins:${key}`)),
  }));

  try {
    await updateFeaturePrices(updates);
  } catch (error) {
    redirect(`/admin?tab=pricing&pricingError=${encodeURIComponent(adminPricingErrorMessage(error))}`);
  }

  revalidateTag(FEATURE_PRICES_CACHE_TAG, "max");
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/pricing");
  redirect("/admin?tab=pricing&pricingSaved=1");
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
  const pack = COIN_PACKAGES.find((item) => item.key === packageKey) || COIN_PACKAGES[1];
  const adsReturnTo = withQueryParams(returnTo, { adPackage: pack.key, adValue: pack.priceVnd });
  const checkout = await createPayOSCheckout(packageKey, user, adsReturnTo);
  const db = getDb();

  if (db) {
    const packageRecord = await db.coinPackage.upsert({
      where: { key: pack.key },
      update: {
        label: pack.label,
        coins: pack.coins,
        bonusCoins: pack.bonusCoins,
        priceVnd: pack.priceVnd,
        isActive: true,
      },
      create: {
        key: pack.key,
        label: pack.label,
        coins: pack.coins,
        bonusCoins: pack.bonusCoins,
        priceVnd: pack.priceVnd,
        isActive: true,
      },
    });
    await db.paymentOrder.create({
      data: {
        userId: user.id,
        packageId: packageRecord.id,
        orderCode: BigInt(checkout.orderCode),
        paymentLinkId: checkout.paymentLinkId,
        amountVnd: checkout.amountVnd,
        coins: checkout.coins,
        checkoutUrl: checkout.checkoutUrl,
        rawPayload: checkout.raw,
      },
    });
  } else if (checkout.raw && typeof checkout.raw === "object" && "mode" in checkout.raw) {
    await adjustCoins(user, checkout.coins, "Demo nạp xu", String(checkout.orderCode));
    redirect(withQueryParams(adsReturnTo, { status: "demo-paid", orderCode: checkout.orderCode }));
  }

  redirect(checkout.checkoutUrl);
}
