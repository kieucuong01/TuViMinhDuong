#!/usr/bin/env node
import { pathToFileURL } from "node:url";
import { buildSnapshot } from "./seo-autopilot-snapshot-runner.mjs";

export { buildSnapshot };

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
