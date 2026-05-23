"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { clearSession, createMagicSession, getCurrentUser, getOrCreateEmailUser, loginOrRegister, setSession, type SessionUser } from "@/lib/auth";
import { getCachedReading, getChart, getFeaturePrice, getUserBalance, saveArticleCategoryFromForm, saveArticleFromForm, saveChart, saveReading, adjustCoins, deleteUserChart } from "@/lib/data";
import { generateReading } from "@/lib/ai";
import { getDb } from "@/lib/db";
import { createPayOSCheckout, createPayOSCustomCheckout } from "@/lib/payos";
import type { CalendarType, Gender } from "@/lib/chart";
import { COIN_PACKAGES, TEMPORARY_FULL_ACCESS } from "@/lib/pricing";
import type { ReadingKey } from "@/lib/pricing";
import { isPayOSEnabled } from "@/lib/env";
import { unlockReadingForUser } from "@/lib/reading-unlock";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const next = safeNextPath(formData.get("next"), "/");

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

function withQueryParams(path: string, params: Record<string, string | number>) {
  const [withoutHash, hash] = path.split("#");
  const query = new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)]));
  return `${withoutHash}${withoutHash.includes("?") ? "&" : "?"}${query}${hash ? `#${hash}` : ""}`;
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
  const user = await getCurrentUser();
  const chart = await saveChart(chartInputFromForm(formData), user);
  redirect(`/la-so/${chart.id}`);
}

export async function quickReadingCheckoutAction(formData: FormData) {
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

async function getReadingUser(chartId: string): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (user) return user;
  if (!TEMPORARY_FULL_ACCESS) {
    redirect(`/dang-nhap?next=${encodeURIComponent(`/la-so/${chartId}`)}&paywall=login`);
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
  const user = await getReadingUser(chartId);

  const result = await unlockReadingForUser(
    {
      getChart,
      getCachedReading,
      getFeaturePrice,
      getUserBalance,
      adjustCoins,
      generateReading,
      saveReading,
    },
    { user, chartId, type, scopeKey, temporaryFullAccess: TEMPORARY_FULL_ACCESS },
  );

  if (result.status === "insufficient_coins") {
    redirect(withQueryParams(nextPath, { paywall: "coins", need: result.needCoins }));
  }

  revalidatePath(`/la-so/${chartId}`);
  redirect(withReadingParam(nextPath, result.readingId));
}

export async function saveArticleAction(formData: FormData) {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") redirect("/dang-nhap?next=/admin");
  const originalSlug = String(formData.get("originalSlug") || "");
  const article = await saveArticleFromForm(formData);
  revalidatePath("/kien-thuc-tu-vi");
  if (originalSlug && originalSlug !== article.slug) revalidatePath(`/kien-thuc-tu-vi/${originalSlug}`);
  revalidatePath(`/kien-thuc-tu-vi/${article.slug}`);
  redirect(`/admin?edit=${article.slug}&saved=${article.slug}`);
}

export async function saveArticleCategoryAction(formData: FormData) {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") redirect("/dang-nhap?next=/admin");
  const category = await saveArticleCategoryFromForm(formData);
  revalidatePath("/admin");
  revalidatePath("/kien-thuc-tu-vi");
  redirect(`/admin?categorySaved=${category.slug}`);
}

export async function createCheckoutAction(formData: FormData) {
  if (TEMPORARY_FULL_ACCESS) redirect("/nap-xu?status=disabled");

  const packageKey = String(formData.get("packageKey") || "full-reading");
  const returnTo = safeNextPath(formData.get("returnTo"), "/nap-xu");
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/dang-nhap?next=${encodeURIComponent(withQueryParams(returnTo, { topup: "1" }))}&paywall=login`);
  }
  const checkout = await createPayOSCheckout(packageKey, user, returnTo);
  const pack = COIN_PACKAGES.find((item) => item.key === packageKey) || COIN_PACKAGES[1];
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
    redirect(withQueryParams(returnTo, { status: "demo-paid", orderCode: checkout.orderCode }));
  }

  redirect(checkout.checkoutUrl);
}
