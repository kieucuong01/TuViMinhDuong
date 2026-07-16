# Xem Tuổi Tool Cluster Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a public `/xem-tuoi` hub, six transparent Vietnamese age-comparison tools, header navigation, SEO, privacy-safe analytics, tests, and production verification.

**Architecture:** Keep all calendar and compatibility rules in one pure TypeScript module that reuses the existing Vietnamese lunar conversion. Keep page copy and tool inputs in one bounded registry. Render metadata and editorial content in Server Components; hydrate only one shared form/result Client Component, with no API, database, query-string birth data, or new dependency.

**Tech Stack:** Next.js 16.2 App Router, React 19, TypeScript, Tailwind/CSS, Vitest, existing `lucide-react`, existing `src/lib/lunar.ts`, existing analytics helper.

## Global Constraints

- Use only the seven approved canonical URLs: `/xem-tuoi` plus `xong-dat`, `vo-chong`, `sinh-con`, `ket-hon`, `lam-an`, `lam-nha`.
- Do not expose a percentage, score out of 10/100, guaranteed prediction, health claim, profit claim, or paid “remedy”.
- Do not store or transmit birth date, birth year, gender, Can–Chi, or result text.
- Accept birth dates from `1900-01-01` through today and target years from the current year through current year + 20.
- Use GMT+7 lunar-year conversion from `src/lib/lunar.ts`.
- No new dependency, API route, server action, database table, generated year page, or query-string result page.
- Preserve unrelated dirty files. Stage and commit only paths named in each task.
- Before release, do not run `npm run ship` while unrelated dirty files are present because it executes `git add --all`.

---

## File Map

- Create `src/lib/age-compatibility.ts`: pure rule engine and six analysis functions.
- Create `src/lib/age-compatibility.test.ts`: deterministic domain fixtures.
- Create `src/lib/age-tools.ts`: six-page registry, navigation data, unique copy, input and CTA definitions.
- Create `src/components/age-tool.tsx`: shared interactive form/result renderer.
- Create `src/app/xem-tuoi/page.tsx`: static hub and ItemList/WebPage structured data.
- Create `src/app/xem-tuoi/[tool]/page.tsx`: six static leaf pages, metadata, breadcrumb, visible FAQ, WebPage/WebApplication data.
- Create `src/app/xem-tuoi/age-tool-pages.test.ts`: route, registry, metadata, sitemap, nav, privacy and copy regression.
- Modify `src/components/site-header.tsx`: desktop Xem tuổi flyout.
- Modify `src/components/mobile-site-menu.tsx`: mobile Xem tuổi group.
- Modify `src/components/site-header-effects.test.ts`: nav regression.
- Modify `src/lib/client-analytics.ts`: allow five age-tool event names and block gender keys.
- Modify `src/components/organic-tools-analytics.test.ts`: privacy regression.
- Modify `src/app/sitemap.ts`: seven canonical entries.
- Modify `src/app/globals.css`: age hub/tool/nav responsive styling.
- Modify `.agents/product-marketing.md`: add Xem tuổi use case and secondary action.

---

### Task 1: Build the deterministic age compatibility engine

**Files:**
- Create: `src/lib/age-compatibility.test.ts`
- Create: `src/lib/age-compatibility.ts`

**Interfaces:**
- Produces: `profileFromSolarDate(date, gender?)`, `profileFromLunarYear(year, gender?)`, `comparePeople(left, right, includeCungPhi?)`, `analyzeXongDat`, `analyzeVoChong`, `analyzeSinhCon`, `analyzeKetHon`, `analyzeLamAn`, `analyzeLamNha`.
- Produces types: `Gender`, `Element`, `CriterionStatus`, `Criterion`, `LunarYearProfile`, `AnalysisSummary`, `RankedYearResult`, `AgeToolAnalysis`.
- Consumes: `solarToLunar` from `src/lib/lunar.ts`.

- [ ] **Step 1: Write the failing cycle/profile tests**

```ts
import { describe, expect, it } from "vitest";
import {
  profileFromLunarYear,
  profileFromSolarDate,
  comparePeople,
  analyzeKetHon,
  analyzeLamNha,
} from "@/lib/age-compatibility";

describe("age profile", () => {
  it("keeps the 60-year Can-Chi and Nap-am cycle", () => {
    expect(profileFromLunarYear(1984).canChi).toBe("Giáp Tý");
    expect(profileFromLunarYear(1984).napAm).toBe("Hải Trung Kim");
    expect(profileFromLunarYear(2044).canChi).toBe("Giáp Tý");
    expect(profileFromLunarYear(2044).napAm).toBe("Hải Trung Kim");
    expect(profileFromLunarYear(2026).canChi).toBe("Bính Ngọ");
    expect(profileFromLunarYear(2026).napAm).toBe("Thiên Hà Thủy");
  });

  it("uses the Vietnamese lunar year around Tet", () => {
    expect(profileFromSolarDate("2026-02-16").lunarYear).toBe(2025);
    expect(profileFromSolarDate("2026-02-17").lunarYear).toBe(2026);
  });

  it("computes the approved Cung Phi fixtures", () => {
    expect(profileFromLunarYear(1990, "male").cungPhi?.name).toBe("Khảm");
    expect(profileFromLunarYear(1990, "female").cungPhi?.name).toBe("Cấn");
    expect(profileFromLunarYear(1995, "male").cungPhi?.name).toBe("Khôn");
    expect(profileFromLunarYear(1995, "female").cungPhi?.name).toBe("Khảm");
    expect(profileFromLunarYear(2000, "male").cungPhi?.name).toBe("Ly");
    expect(profileFromLunarYear(2000, "female").cungPhi?.name).toBe("Càn");
  });
});
```

- [ ] **Step 2: Run the focused test and confirm it fails because the module is absent**

Run:

```powershell
& "C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" .\node_modules\vitest\vitest.mjs run src/lib/age-compatibility.test.ts
```

Expected: FAIL resolving `@/lib/age-compatibility`.

- [ ] **Step 3: Implement year profiles and exact static tables**

Use these public signatures and literal tables:

```ts
export type Gender = "male" | "female";
export type Element = "Kim" | "Mộc" | "Thủy" | "Hỏa" | "Thổ";
export type CriterionStatus = "favorable" | "neutral" | "caution";
export type CriterionRole = "primary" | "supporting";

export type Criterion = {
  key: string;
  label: string;
  status: CriterionStatus;
  role: CriterionRole;
  explanation: string;
};

export type LunarYearProfile = {
  lunarYear: number;
  canChi: string;
  stem: string;
  branch: string;
  polarity: "Dương" | "Âm";
  stemElement: Element;
  branchElement: Element;
  napAm: string;
  napAmElement: Element;
  cungPhi?: { number: number; name: string; group: "Đông tứ mệnh" | "Tây tứ mệnh" };
};

const NAP_AM = [
  ["Hải Trung Kim", "Kim"], ["Lư Trung Hỏa", "Hỏa"], ["Đại Lâm Mộc", "Mộc"],
  ["Lộ Bàng Thổ", "Thổ"], ["Kiếm Phong Kim", "Kim"], ["Sơn Đầu Hỏa", "Hỏa"],
  ["Giản Hạ Thủy", "Thủy"], ["Thành Đầu Thổ", "Thổ"], ["Bạch Lạp Kim", "Kim"],
  ["Dương Liễu Mộc", "Mộc"], ["Tuyền Trung Thủy", "Thủy"], ["Ốc Thượng Thổ", "Thổ"],
  ["Tích Lịch Hỏa", "Hỏa"], ["Tùng Bách Mộc", "Mộc"], ["Trường Lưu Thủy", "Thủy"],
  ["Sa Trung Kim", "Kim"], ["Sơn Hạ Hỏa", "Hỏa"], ["Bình Địa Mộc", "Mộc"],
  ["Bích Thượng Thổ", "Thổ"], ["Kim Bạch Kim", "Kim"], ["Phúc Đăng Hỏa", "Hỏa"],
  ["Thiên Hà Thủy", "Thủy"], ["Đại Trạch Thổ", "Thổ"], ["Thoa Xuyến Kim", "Kim"],
  ["Tang Đố Mộc", "Mộc"], ["Đại Khê Thủy", "Thủy"], ["Sa Trung Thổ", "Thổ"],
  ["Thiên Thượng Hỏa", "Hỏa"], ["Thạch Lựu Mộc", "Mộc"], ["Đại Hải Thủy", "Thủy"],
] as const satisfies readonly (readonly [string, Element])[];
```

Implement `cycleIndex = mod(lunarYear - 4, 60)` and select `NAP_AM[Math.floor(cycleIndex / 2)]`. Implement the approved Cung Phi formula from the spec, with trigram numbers `1 Khảm, 2 Khôn, 3 Chấn, 4 Tốn, 6 Càn, 7 Đoài, 8 Cấn, 9 Ly` and gender-specific mapping for result 5.

- [ ] **Step 4: Add failing relation, Tam Tai, Kim Lâu and Hoang Ốc tests**

```ts
it("does not call identical branches Tam Hop", () => {
  const report = comparePeople(profileFromLunarYear(1990), profileFromLunarYear(1930));
  expect(report.criteria.find((item) => item.key === "dia-chi")?.explanation).toContain("đồng chi Ngọ");
  expect(report.criteria.find((item) => item.key === "dia-chi")?.explanation).not.toContain("tam hợp");
});

it("uses transparent Kim Lau and Hoang Oc cycles", () => {
  expect(analyzeKetHon("1999-06-01", "female", 2026, 2026).years[0].details.kimLau.remainder).toBe(1);
  expect(analyzeLamNha("1996-06-01", "male", 2026, 2026).years[0].details.hoangOc.name).toBe("Tứ Tấn Tài");
});
```

Add fixtures for all branch relations, five-element generate/control/same relations, all four Tam Tai groups, all Kim Lâu remainders, and all six Hoang Ốc positions.

- [ ] **Step 5: Implement relationship and tool analyses**

Use these exact branch groups:

```ts
const BRANCH_TRIADS = [[8, 0, 4], [2, 6, 10], [11, 3, 7], [5, 9, 1]] as const;
const BRANCH_HARMONY = [[0, 1], [2, 11], [3, 10], [4, 9], [5, 8], [6, 7]] as const;
const BRANCH_CLASH = [[0, 6], [1, 7], [2, 8], [3, 9], [4, 10], [5, 11]] as const;
const BRANCH_HARM = [[0, 7], [1, 6], [2, 5], [3, 4], [8, 11], [9, 10]] as const;
const BRANCH_BREAK = [[0, 9], [1, 4], [2, 11], [3, 6], [5, 8], [7, 10]] as const;
```

Check identical branches before triads. Derive Cung Phi Du Niên symmetrically from trigram XOR:

```ts
const DU_NIEN_BY_XOR = {
  0b000: ["Phục Vị", "favorable"],
  0b001: ["Sinh Khí", "favorable"],
  0b110: ["Thiên Y", "favorable"],
  0b111: ["Diên Niên", "favorable"],
  0b100: ["Họa Hại", "caution"],
  0b011: ["Ngũ Quỷ", "caution"],
  0b101: ["Lục Sát", "caution"],
  0b010: ["Tuyệt Mệnh", "caution"],
} as const;
```

Implement result bands exactly as approved: no primary caution plus more favorable than neutral → `favorable`; at least two primary cautions → `caution`; otherwise `mixed`. Rank candidate years by primary caution count ascending, primary favorable count descending, then target year ascending.

- [ ] **Step 6: Run focused tests and commit the engine**

Run the focused Vitest command. Expected: PASS.

Commit only:

```powershell
git add -- src/lib/age-compatibility.ts src/lib/age-compatibility.test.ts
git commit -m "feat: add transparent xem tuoi engine"
```

---

### Task 2: Add the six-tool registry and interactive component

**Files:**
- Create: `src/lib/age-tools.ts`
- Create: `src/components/age-tool.tsx`
- Extend test: `src/lib/age-compatibility.test.ts`

**Interfaces:**
- `AGE_TOOL_PAGES: AgeToolPage[]`
- `getAgeToolPage(slug: string): AgeToolPage | undefined`
- `AGE_TOOL_LINKS` for header/hub.
- `<AgeTool tool={page.slug} />` consumes only a serializable slug and resolves the registry client-side.

- [ ] **Step 1: Add registry assertions before the registry exists**

```ts
import { AGE_TOOL_PAGES } from "@/lib/age-tools";

it("publishes exactly six distinct tool intents", () => {
  expect(AGE_TOOL_PAGES.map((page) => page.slug)).toEqual([
    "xong-dat", "vo-chong", "sinh-con", "ket-hon", "lam-an", "lam-nha",
  ]);
  expect(new Set(AGE_TOOL_PAGES.map((page) => page.title)).size).toBe(6);
  expect(AGE_TOOL_PAGES.every((page) => page.faqs.length >= 3)).toBe(true);
});
```

- [ ] **Step 2: Implement the exact registry fields**

```ts
export type AgeToolSlug = "xong-dat" | "vo-chong" | "sinh-con" | "ket-hon" | "lam-an" | "lam-nha";
export type AgeToolPage = {
  slug: AgeToolSlug;
  label: string;
  shortDescription: string;
  title: string;
  description: string;
  heading: string;
  intro: string;
  method: string[];
  readingTips: string[];
  example: string;
  faqs: { question: string; answer: string }[];
  related: AgeToolSlug[];
  cta: { href: string; label: string; description: string };
};
```

Use these CTA paths: xông đất `/xem-ngay`; vợ chồng `/?source=xem_tuoi_vo_chong#lap-la-so`; sinh con `/?source=xem_tuoi_sinh_con#lap-la-so`; kết hôn `/xem-ngay/cuoi-hoi`; làm ăn `/xem-ngay?mode=finder&task=contract#date-finder`; làm nhà `/xem-ngay/dong-tho`.

Each page must explicitly name only the rules it runs and carry at least three unique FAQ answers. Do not copy Tuvi.vn prose.

- [ ] **Step 3: Implement the shared client component**

The form chooses fields by slug:

| Tool | Fields |
| --- | --- |
| xong-dat | owner date, target year |
| vo-chong | person A date/gender, person B date/gender |
| sinh-con | father date, mother date, from year, to year |
| ket-hon | birth date, gender, from year, to year |
| lam-an | person A date, person B date |
| lam-nha | owner date, gender, from year, to year |

Use native `input type="date"` and `select`. Validate in the engine. Render one `role="alert"` error, then `aria-live="polite"` result cards. Never call `router.replace` or write result inputs to the URL.

On successful submit send only:

```ts
trackOrganicToolEvent("age_tool_submit", { tool });
trackOrganicToolEvent("age_tool_result", { tool, result_band: analysis.band });
```

Related and CTA clicks send only `tool`, `target_tool` or `cta_position`.

- [ ] **Step 4: Run focused tests and commit**

Expected: registry and engine tests PASS.

```powershell
git add -- src/lib/age-tools.ts src/components/age-tool.tsx src/lib/age-compatibility.test.ts
git commit -m "feat: add shared xem tuoi tools"
```

---

### Task 3: Add the hub, six static leaf pages, SEO and styles

**Files:**
- Create: `src/app/xem-tuoi/page.tsx`
- Create: `src/app/xem-tuoi/[tool]/page.tsx`
- Create: `src/app/xem-tuoi/age-tool-pages.test.ts`
- Modify: `src/app/globals.css`

**Interfaces:**
- Hub imports `AGE_TOOL_PAGES` and renders six direct links.
- Leaf route exports `dynamicParams = false`, `generateStaticParams`, `generateMetadata` and calls `notFound()` for unknown slugs.

- [ ] **Step 1: Write failing route-source assertions**

```ts
it("statically publishes the six canonical pages", () => {
  expect(leafSource).toContain("generateStaticParams");
  expect(leafSource).toContain("dynamicParams = false");
  expect(leafSource).toContain("generateMetadata");
  expect(leafSource).toContain("notFound()");
  expect(sitemapSource).toContain("AGE_TOOL_PAGES");
});

it("keeps private inputs out of URL and markup data", () => {
  expect(componentSource).not.toContain("router.replace");
  expect(componentSource).not.toContain("URLSearchParams");
  expect(componentSource).not.toContain("localStorage");
});
```

- [ ] **Step 2: Implement the hub**

Use `routeMetadata`, `webPageJsonLd`, and `itemListJsonLd`. Render a short answer-first H1, six cards, a three-step explanation, a trust/limits section, and direct links. Keep the hub a Server Component.

- [ ] **Step 3: Implement the leaf route using the documented Next.js 16 shape**

```ts
export const dynamicParams = false;

export function generateStaticParams() {
  return AGE_TOOL_PAGES.map((page) => ({ tool: page.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ tool: string }> }): Promise<Metadata> {
  const page = getAgeToolPage((await params).tool);
  if (!page) return {};
  return routeMetadata({ title: page.title, description: page.description, path: `/xem-tuoi/${page.slug}` });
}
```

Render WebPage and WebApplication JSON-LD, visible breadcrumb, form, method, reading tips, unique example, visible FAQ, related links and CTA. Do not add fake Review/Rating data.

- [ ] **Step 4: Add bounded responsive CSS**

Add a single `/* Xem tuoi tools */` section. Use existing palette and `panel`/`btn` conventions. Required selectors: `.age-hub`, `.age-tool-grid`, `.age-tool-shell`, `.age-tool-form`, `.age-tool-results`, `.age-criterion`, `.age-year-card`, `.age-tool-faq`, `.age-tool-related`. At `max-width: 767px`, forms and results are one column and no element has fixed width.

- [ ] **Step 5: Run route tests and commit**

```powershell
git add -- src/app/xem-tuoi/page.tsx "src/app/xem-tuoi/[tool]/page.tsx" src/app/xem-tuoi/age-tool-pages.test.ts src/app/globals.css
git commit -m "feat: publish xem tuoi SEO pages"
```

---

### Task 4: Wire navigation, sitemap, analytics privacy and marketing context

**Files:**
- Modify: `src/components/site-header.tsx`
- Modify: `src/components/mobile-site-menu.tsx`
- Modify: `src/components/site-header-effects.test.ts`
- Modify: `src/lib/client-analytics.ts`
- Modify: `src/components/organic-tools-analytics.test.ts`
- Modify: `src/app/sitemap.ts`
- Modify: `.agents/product-marketing.md`
- Modify: `src/app/xem-tuoi/age-tool-pages.test.ts`

- [ ] **Step 1: Extend failing nav/sitemap/privacy tests**

Assert header has `href: "/xem-tuoi"`, all six links come from `AGE_TOOL_LINKS`, desktop has `site-age-menu`, mobile has `mobile-age-group`, sitemap contains hub and all registry pages, and analytics blocks `gender`, `sex`, `personGender`, `birthYear`, `birth_date`.

- [ ] **Step 2: Add the desktop and mobile menus by reusing existing patterns**

Add `{ href: "/xem-tuoi", label: "Xem tuổi", tone: "age" }` immediately after Xem ngày. Reuse the existing flyout structure and icon components; do not build a new dropdown abstraction. The desktop menu shows six registry links. The mobile menu shows the same six links inside one `details` group.

- [ ] **Step 3: Extend privacy-safe analytics**

Add exact names:

```ts
| "age_tool_view"
| "age_tool_submit"
| "age_tool_result"
| "age_tool_related_click"
| "age_tool_chart_cta"
```

Add `gender`, `sex`, `personGender`, `person_gender`, `lunarYear`, `lunar_year`, `canChi`, and `can_chi` to `BLOCKED_PARAM_KEYS`. Test one allowed call and one blocked payload.

- [ ] **Step 4: Add seven sitemap entries and product context**

Add hub priority `0.82`, weekly frequency; leaf priority `0.74`, weekly frequency. In `.agents/product-marketing.md`, add the use case “Đối chiếu tuổi theo quy tắc Can–Chi/Ngũ hành cho gia đình, công việc và nhà cửa” and secondary action “Dùng công cụ Xem tuổi”. Do not rewrite unrelated positioning.

- [ ] **Step 5: Run focused tests and commit**

```powershell
git add -- src/components/site-header.tsx src/components/mobile-site-menu.tsx src/components/site-header-effects.test.ts src/lib/client-analytics.ts src/components/organic-tools-analytics.test.ts src/app/sitemap.ts src/app/xem-tuoi/age-tool-pages.test.ts .agents/product-marketing.md src/app/globals.css
git commit -m "feat: connect xem tuoi discovery funnel"
```

---

### Task 5: Full verification, browser QA and production release

**Files:**
- Verify all files above.
- No new implementation file unless a check exposes a real defect.

- [ ] **Step 1: Run focused tests**

```powershell
& "C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" .\node_modules\vitest\vitest.mjs run src/lib/age-compatibility.test.ts src/app/xem-tuoi/age-tool-pages.test.ts src/components/site-header-effects.test.ts src/components/organic-tools-analytics.test.ts
```

Expected: all PASS.

- [ ] **Step 2: Run lint, full tests and build with bundled Node**

```powershell
$env:PATH="C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;$env:PATH"
npm run lint
npm test
npm run build
```

Expected: exit 0 for all three. Compress large output through Headroom before analysis.

- [ ] **Step 3: Run local browser QA on port 4000**

Check desktop and mobile:

- header tab position and keyboard/focus behavior;
- mobile menu open/close;
- hub and all six routes;
- invalid dates and year ranges;
- one successful result per tool;
- no birth data in address bar;
- CTA and related links;
- console errors and horizontal overflow.

- [ ] **Step 4: Audit the intended commit scope**

Run `git status --short` and `git diff --name-only HEAD~4..HEAD`. Confirm feature commits contain only planned files. Do not stage unrelated existing changes.

- [ ] **Step 5: Resolve the release worktree blocker safely**

`npm run ship` stages every dirty file. If unrelated dirty changes remain, stop before release and request explicit approval either to temporarily stash only those listed paths and restore them after deploy, or to postpone production release. Never let `ship` include them silently.

- [ ] **Step 6: Deploy and verify production after the tree is safe**

Run:

```powershell
npm run ship -- "feat: add xem tuoi tool cluster"
```

Then verify PM2/release commit and public HTTP/HTML for the hub, all six leaf pages and `/sitemap.xml`. Confirm canonical tags, menu links and one real client-side calculation in the public browser.
