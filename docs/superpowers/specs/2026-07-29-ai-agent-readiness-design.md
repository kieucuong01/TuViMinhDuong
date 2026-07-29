# AI Agent Readiness Design

## Goal

Make `lasotinhhoa.vn` easier for search engines and AI agents to crawl, extract, cite, and explain while preserving every current traffic-bearing URL, canonical, indexing rule, astrology engine, conversion funnel, and payment boundary.

## Approved Scope

The approved option is the broader package:

1. Repair the traffic-protection audit and the confirmed semantic/metadata defects.
2. Preserve and extend the current `llms.txt` discovery surface.
3. Add clear editorial, source, citation, update, and correction policies.
4. Publish compact public JSON resources that agents can read without scraping UI state.
5. Release through the existing GitHub to VPS/PM2 production path and verify the public result.

## Verified Baseline

- The public sitemap currently exposes 180 unique URLs.
- The current `llms.txt` contains 148 unique linked resources; all 148 returned HTTP 200 during the audit.
- The priority-page snapshot found title, description, canonical, H1, and JSON-LD on all eight priority URLs.
- Nginx recorded 1,048 requests carrying OpenAI, ChatGPT, Claude, Perplexity, or GPTBot user agents over the audited 15-day window; 961 returned HTTP 200.
- Public robots rules already allow these crawlers to read public content.
- Existing trust pages `/gioi-thieu`, `/phuong-phap-luan`, and `/tac-gia` are live and already have an H1, answer block, disclaimer, internal links, update copy, and JSON-LD.

These values are release guards, not targets to reduce. User-agent strings in logs are operational evidence only and are not treated as cryptographic proof of crawler identity.

## Traffic-Safety Invariants

- Do not change any live slug, canonical, `noindex`, robots rule, sitemap hostname, chart/date calculation, auth/payment behavior, or paid-content gate.
- Do not remove or rewrite any of the 148 currently valid `llms.txt` links.
- Do not revive deleted CMS rows or create multiple pages targeting the same search intent.
- Do not redirect test/smoke slugs that never represented durable public content.
- Structured data must describe visible content on the same page.
- Public JSON must expose only already-public facts and links; it must not expose user data, credentials, internal APIs, database identifiers, or operational details.
- Vietnamese copy must remain calm, clear, and explicit that tử vi content is for reference rather than a guaranteed prediction.
- Stage and commit only files created or changed for this release.

## Workstream 1: Reliable Whole-Site Audit

The SEO snapshot tool will stop treating a network failure as a missing SEO element.

- Limit concurrent page fetches to a small fixed pool instead of launching the full sitemap at once.
- Retry transient timeout/network failures with a bounded attempt count.
- Report `fetchErrors` separately from pages whose fetched HTML truly lacks title, description, canonical, H1, or JSON-LD.
- Preserve the current priority sample and JSON output contract where possible.
- Return a failing process status only for real SEO defects or unresolved fetch failures, with separate counts so an operator cannot mistake one for the other.

This change is a release guard: it prevents a temporary network limit from triggering broad, unnecessary page edits.

## Workstream 2: Metadata and Legacy URL Recovery

### Title normalization

The article metadata boundary will remove one trailing site-brand suffix from a CMS `metaTitle` before the root layout applies its title template. The visible result contains exactly one `| Lá số tinh hoa`. The CMS row, slug, H1, canonical, and article body remain unchanged.

### Permanent redirects

Only the nine meaningful deleted legacy slugs receive permanent redirects:

| Legacy path | Destination |
| --- | --- |
| `/kien-thuc-tu-vi/cach-luan-giai-la-so-tu-vi` | `/kien-thuc-tu-vi/luan-giai-la-so-tu-vi` |
| `/kien-thuc-tu-vi/giai-ma-la-so-tu-vi` | `/kien-thuc-tu-vi/cach-doc-la-so-tu-vi-cho-nguoi-moi` |
| `/kien-thuc-tu-vi/phan-tich-la-so-tu-vi` | `/kien-thuc-tu-vi/binh-giai-la-so-tu-vi` |
| `/kien-thuc-tu-vi/sao-liem-trinh` | `/kien-thuc-tu-vi/sao-liem-trinh-trong-tu-vi` |
| `/kien-thuc-tu-vi/sao-thai-am` | `/kien-thuc-tu-vi/sao-thai-am-trong-tu-vi` |
| `/kien-thuc-tu-vi/sao-thien-co` | `/kien-thuc-tu-vi/sao-thien-co-trong-tu-vi` |
| `/kien-thuc-tu-vi/sao-thien-phu` | `/kien-thuc-tu-vi/sao-thien-phu-trong-tu-vi` |
| `/kien-thuc-tu-vi/sao-tu-vi` | `/kien-thuc-tu-vi/sao-tu-vi-trong-tu-vi` |
| `/kien-thuc-tu-vi/sao-vu-khuc` | `/kien-thuc-tu-vi/sao-vu-khuc-trong-tu-vi` |

Each destination must be verified as a current self-canonical public page before release. Deleted smoke/SEO-test slugs continue returning 404.

## Workstream 3: Extractable Article and Lookup Semantics

### Knowledge and lifetime articles

The shared article renderer will add:

- `data-answer-block="true"` to the existing visible excerpt;
- a visible organizational byline linking to `/tac-gia`;
- a semantic `<time dateTime="...">` for the visible update date;
- the same author URL/identity in Article JSON-LD.

No personal author, credential, review, or source is invented. The author remains the existing editorial organization.

### Programmatic lookup pages

- Keep the route-level `<main>` landmark.
- Replace the nested `<main>` inside the shared pSEO article funnel with a neutral container.
- Mark the existing hero summary as the page answer block.
- Do not change generated copy, heading order, canonical, schema type, internal links, or route inventory.

## Workstream 4: Discovery and Editorial Trust

### `llms.txt`

Treat `public/llms.txt` as a curated discovery guide rather than a duplicate sitemap.

- Preserve all 148 existing valid resource links.
- Add the existing trust pages, pricing page, editorial-policy page, agent JSON resources, and recent high-value knowledge pages omitted from the current file.
- Keep the existing Vietnamese usage guidance and disclaimer.
- Add a test proving the protected baseline URLs remain present and all curated local URLs use the production origin.

### Editorial policy page

Add `/chinh-sach-bien-tap` with:

- what the site publishes and what it does not claim;
- the distinction between deterministic calendar/chart calculations and interpretive tử vi content;
- how sources and internal links are selected;
- requirements for visible update dates and material corrections;
- a correction path through `/lien-he`;
- privacy and commercial-independence statements;
- concise answer block, disclaimer, last-updated time, internal links, and `WebPage`/`Organization`-aligned JSON-LD.

Add the page to the sitemap and to trust-page navigation. It is a trust surface, not a new keyword-cluster landing page.

### Existing trust pages

- Expand `/phuong-phap-luan` with the calculation-versus-interpretation boundary, uncertainty, source handling, and a link to the editorial policy.
- Expand `/tac-gia` with the organizational editorial workflow and correction path.
- Keep the existing route names, canonical URLs, disclaimers, and simple public copy.

## Workstream 5: Public Agent Data

Add two read-only, versioned JSON resources outside `/api` so the existing robots rule does not block them:

### `GET /agent/site.json`

Returns:

- `schemaVersion`;
- site name, canonical origin, language, and short description;
- public trust/policy/contact URLs;
- public discovery URLs for sitemap and `llms.txt`;
- content limitations and citation guidance;
- public topic hubs;
- `lastModified` derived from a code-owned release date.

### `GET /agent/pricing.json`

Returns:

- `schemaVersion`;
- currency and the public xu-to-VND explanation;
- current public reading packages derived from the same pricing module used by the application;
- pricing page URL;
- statement that checkout availability and final payable amount must be confirmed on the live pricing/checkout page;
- `lastModified` from the same code-owned release date.

Both resources return UTF-8 JSON, a stable schema, explicit cache headers, and no secrets or user-specific data. They are linked from `llms.txt` and the editorial policy page but are not added to the XML sitemap.

## Data and Component Boundaries

- A small metadata helper owns site-brand title normalization and is reusable by article metadata generation.
- A legacy-redirect constant owns the nine reviewed mappings and is consumed by Next.js redirect configuration.
- Article trust identity is defined once and reused by visible byline and JSON-LD.
- Agent resource builders are pure functions so unit tests can assert their exact public shape without starting a server.
- Pricing JSON consumes the existing public pricing source rather than duplicating amounts.
- Editorial/trust copy remains in route components following the existing static-page pattern.

## Failure Handling

- Audit fetch failures report the URL, attempt count, and error class without converting them into missing-element warnings.
- A failed redirect target verification blocks release.
- Agent resource builders omit unavailable optional fields rather than serializing `undefined`; required fields cause tests/build to fail.
- The pricing resource never falls back to hard-coded alternate prices.
- Production deployment stops if lint, tests, build, push, PM2 verification, or public smoke checks fail.

## Testing and Verification

### Automated

- Red/green unit tests for bounded audit concurrency, retry behavior, and fetch-error classification.
- Metadata tests proving zero or one brand suffix becomes exactly one rendered suffix.
- Redirect tests proving all nine mappings are permanent and targets are distinct from sources.
- Article tests for answer block, visible organizational author, semantic time, and aligned JSON-LD author URL.
- pSEO tests proving one `<main>` and an answer block.
- Discovery tests proving baseline `llms.txt` links are retained and new trust/agent resources are present.
- Agent-resource tests for schema stability, public-only fields, current package derivation, and cache headers.
- Sitemap/schema tests for `/chinh-sach-bien-tap`.
- Full `npm run lint`, `npm test`, and `npm run build`.

### Browser and production

- Desktop and mobile rendered checks for one representative knowledge article, one pSEO page, and all trust pages.
- Confirm exactly one main landmark, one H1, visible answer block, author/time where applicable, canonical, and matching JSON-LD.
- Confirm all 148 protected `llms.txt` links remain and all new local links return 200.
- Confirm each legacy path returns a permanent redirect to a 200 self-canonical destination.
- Confirm both agent JSON resources return valid UTF-8 JSON and no private fields.
- Confirm robots behavior is unchanged and the sitemap count only increases by the approved editorial page.
- Release with the documented `npm run ship` path, then verify pushed master, VPS release, PM2 `lasotinhhoa`, public URLs, and absence of new 5xx errors.

## Non-Goals

- No redesign of the homepage, navigation, chart form, article body, pricing UI, checkout, or account flow.
- No new AI chatbot, MCP server, browser action protocol, autonomous purchase action, or write-capable agent endpoint.
- No claim that `llms.txt` or JSON resources guarantee AI citation or ranking.
- No broad content rewrite, schema inflation, keyword-page generation, backlink work, or deletion of existing indexed URLs.
- No infrastructure, Nginx, WAF, DNS, or database migration.

## Rollback

The release is one additive code slice. If production checks regress, deploy the previous release through the existing release mechanism. Permanent redirects, the new policy page, agent resources, semantic annotations, and `llms.txt` additions can each be reverted without changing database state or user-owned content.
