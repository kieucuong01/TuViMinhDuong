#!/usr/bin/env node
import { pathToFileURL } from "node:url";
import {
  extractPageSeo,
  extractSitemapUrls,
  summarizeSeoSnapshot,
} from "./seo-autopilot-core.mjs";

if (isCli()) {
  const args = parseArgs(process.argv.slice(2));
  const baseUrl = normalizeBaseUrl(args.baseUrl || "https://lasotinhhoa.vn");
  const sampleSize = Number.parseInt(args.sampleSize || "8", 10);

  try {
    const snapshot = await buildSnapshot({ baseUrl, sampleSize });
    if (args.json) {
      console.log(JSON.stringify(snapshot, null, 2));
    } else {
      console.log(formatMarkdown(snapshot));
    }
  } catch (error) {
    console.error(`SEO Autopilot snapshot failed: ${error.message}`);
    process.exitCode = 1;
  }
}

export async function buildSnapshot({ baseUrl, sampleSize }) {
  const [robotsText, sitemapXml] = await Promise.all([
    fetchText(`${baseUrl}/robots.txt`),
    fetchText(`${baseUrl}/sitemap.xml`),
  ]);
  const sitemapUrls = extractSitemapUrls(sitemapXml);
  const sampleUrls = chooseSampleUrls(baseUrl, sitemapUrls, sampleSize);
  const pages = await Promise.all(sampleUrls.map(async (url) => {
    try {
      const html = await fetchText(url);
      return extractPageSeo(url, html);
    } catch (error) {
      return {
        url,
        title: "",
        metaDescription: "",
        canonical: "",
        h1: [],
        jsonLdCount: 0,
        htmlLength: 0,
        error: error.message,
      };
    }
  }));

  return {
    generatedAt: new Date().toISOString(),
    ...summarizeSeoSnapshot({ baseUrl, robotsText, sitemapUrls, pages }),
    pages,
  };
}

function chooseSampleUrls(baseUrl, sitemapUrls, sampleSize) {
  const priorityPaths = [
    baseUrl,
    `${baseUrl}/kien-thuc-tu-vi`,
    `${baseUrl}/xem-ngay`,
  ];
  const ordered = [...priorityPaths, ...sitemapUrls];
  return [...new Set(ordered)].slice(0, Math.max(1, sampleSize));
}

async function fetchText(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(url, {
      headers: {
        "user-agent": "LaSoTinhHoa-SEO-Autopilot/1.0",
      },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`.trim());
    }
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

function formatMarkdown(snapshot) {
  const lines = [
    "# SEO Autopilot Snapshot",
    "",
    `- Status: ${snapshot.status}`,
    `- Generated: ${snapshot.generatedAt}`,
    `- Base URL: ${snapshot.baseUrl}`,
    `- Sitemap URLs: ${snapshot.sitemapUrlCount}`,
    `- Checked pages: ${snapshot.checkedPageCount}`,
    "",
    "## Warnings",
    ...snapshot.warnings.map((warning) => `- ${warning}`),
    "",
    "## Top Opportunities",
    ...snapshot.opportunities.map(
      (item) => `- ${item.slug} (${item.cluster}): ${item.intent}`,
    ),
    "",
    "## Checked Pages",
    ...snapshot.pages.map(
      (page) =>
        `- ${page.url} | title=${page.title ? "yes" : "no"} | description=${
          page.metaDescription ? "yes" : "no"
        } | canonical=${page.canonical ? "yes" : "no"} | h1=${page.h1.length} | jsonld=${
          page.jsonLdCount
        }`,
    ),
  ];
  return lines.join("\n");
}

function normalizeBaseUrl(value) {
  return String(value || "").replace(/\/$/, "");
}

function parseArgs(values) {
  const parsed = {};
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === "--json") {
      parsed.json = true;
    } else if (value === "--base-url") {
      parsed.baseUrl = values[index + 1];
      index += 1;
    } else if (value === "--sample-size") {
      parsed.sampleSize = values[index + 1];
      index += 1;
    }
  }
  return parsed;
}

function isCli() {
  return process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
}
