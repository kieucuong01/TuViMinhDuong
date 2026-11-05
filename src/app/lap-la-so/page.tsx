import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Gặp thầy Tử Vi", alternates: { canonical: "/" }, robots: { index: false, follow: true } };

export default async function ChartEntry({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams ?? {};
  const query = new URLSearchParams({ visit: "tuvi" });
  for (const key of ["source", "gclid", "gbraid", "wbraid", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "chartError"]) {
    const value = params[key];
    if (typeof value === "string" && value.length <= 512 && !/[\u0000-\u001f\u007f]/.test(value)) query.set(key, value);
  }
  redirect(`/?${query}`);
}