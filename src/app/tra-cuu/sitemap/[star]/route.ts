import { notFound } from "next/navigation";
import { APP_URL } from "@/lib/env";
import { listPublishedPseoPages } from "@/lib/pseo-data";
import { MAIN_STARS } from "@/lib/pseo-registry";
import { buildPseoSitemapXml } from "@/lib/pseo-sitemap";

export async function generateStaticParams() {
  return MAIN_STARS.map((star) => ({ star: star.slug }));
}

export async function GET(_: Request, { params }: { params: Promise<{ star: string }> }) {
  const { star } = await params;
  if (!MAIN_STARS.some((item) => item.slug === star)) notFound();
  const xml = buildPseoSitemapXml(APP_URL, star, await listPublishedPseoPages());
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
