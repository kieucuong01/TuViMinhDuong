import { APP_URL } from "@/lib/env";
import { buildPseoSitemapIndexXml } from "@/lib/pseo-sitemap";

export async function GET() {
  return new Response(buildPseoSitemapIndexXml(APP_URL), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
