"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { clearSession, getCurrentUser, loginOrRegister, setSession, type SessionUser } from "@/lib/auth";
import { getCachedReading, getChart, getFeaturePrice, getUserBalance, saveArticleFromForm, saveChart, saveReading, adjustCoins } from "@/lib/data";
import { generateReading } from "@/lib/ai";
import { getDb } from "@/lib/db";
import { createPayOSCheckout } from "@/lib/payos";
import type { CalendarType, Gender } from "@/lib/chart";
import { COIN_PACKAGES, TEMPORARY_FULL_ACCESS } from "@/lib/pricing";
import type { ReadingKey } from "@/lib/pricing";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/");
  await loginOrRegister(email, password);
  redirect(next.startsWith("/") ? next : "/");
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
  return `${path}${path.includes("?") ? "&" : "?"}reading=${encodeURIComponent(readingId)}`;
}

function withQueryParams(path: string, params: Record<string, string | number>) {
  const [withoutHash, hash] = path.split("#");
  const query = new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)]));
  return `${withoutHash}${withoutHash.includes("?") ? "&" : "?"}${query}${hash ? `#${hash}` : ""}`;
}

export async function createChartAction(formData: FormData) {
  const user = await getCurrentUser();
  const chart = await saveChart(
    {
      fullName: String(formData.get("fullName") || ""),
      gender: String(formData.get("gender") || "male") as Gender,
      calendarType: String(formData.get("calendarType") || "solar") as CalendarType,
      day: Number(formData.get("day") || 1),
      month: Number(formData.get("month") || 1),
      year: Number(formData.get("year") || 1990),
      birthHour: Number(formData.get("birthHour") || 0),
      viewYear: Number(formData.get("viewYear") || new Date().getFullYear()),
      timezone: "Asia/Bangkok",
    },
    user,
  );
  redirect(`/la-so/${chart.id}`);
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
      where: { email: `guest-${chartId}@tuviminhduong.local` },
      update: {},
      create: {
        email: `guest-${chartId}@tuviminhduong.local`,
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
    email: "guest@tuviminhduong.local",
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
  const chartRecord = await getChart(chartId);
  if (!chartRecord) throw new Error("Không tìm thấy lá số.");

  const cached = await getCachedReading(user.id, chartId, type, scopeKey);
  if (cached) {
    revalidatePath(`/la-so/${chartId}`);
    redirect(withReadingParam(nextPath, cached.id));
  }

  const price = await getFeaturePrice(type);
  const shouldCharge = !TEMPORARY_FULL_ACCESS && user.role !== "ADMIN";
  const balance = shouldCharge ? await getUserBalance(user) : 0;
  if (shouldCharge && balance < price.priceCoins) {
    redirect(withQueryParams(nextPath, { paywall: "coins", need: price.priceCoins - balance }));
  }

  let debited = false;
  let readingId = "";
  try {
    if (shouldCharge) {
      await adjustCoins(user, -price.priceCoins, price.label, `${chartId}:${type}:${scopeKey}`);
      debited = true;
    }
    const result = await generateReading(chartRecord.chart, type, scopeKey);
    const reading = await saveReading(user, chartId, type, scopeKey, shouldCharge ? price.priceCoins : 0, result.content, {
      type,
      scopeKey,
      model: result.model,
    });
    readingId = reading.id;
  } catch (error) {
    if (debited) {
      await adjustCoins(user, price.priceCoins, "Hoàn xu do AI lỗi", `${chartId}:${type}:${scopeKey}`);
    }
    throw error;
  }
  revalidatePath(`/la-so/${chartId}`);
  redirect(withReadingParam(nextPath, readingId));
}

export async function saveArticleAction(formData: FormData) {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") redirect("/dang-nhap?next=/admin");
  const article = await saveArticleFromForm(formData);
  revalidatePath("/kien-thuc-tu-vi");
  revalidatePath(`/kien-thuc-tu-vi/${article.slug}`);
  redirect(`/admin?saved=${article.slug}`);
}

export async function createCheckoutAction(formData: FormData) {
  if (TEMPORARY_FULL_ACCESS) redirect("/nap-xu?status=disabled");

  const user = await getCurrentUser();
  if (!user) redirect("/dang-nhap?next=/nap-xu");
  const packageKey = String(formData.get("packageKey") || "full-reading");
  const returnTo = safeNextPath(formData.get("returnTo"), "/nap-xu");
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
