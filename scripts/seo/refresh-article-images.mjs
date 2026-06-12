import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const contentPath = path.join(repoRoot, "src/lib/content.ts");
const articlesDir = path.join(repoRoot, "public/articles");

const articles = [
  { slug: "xem-ngay-tot-thang-6-2026", label: "Xem ngày tháng 6", theme: "calendar", alt: "Minh họa lịch xem ngày tốt tháng 6 năm 2026 với ngày đẹp và ngày cần tránh" },
  { slug: "cung-phuc-duc-trong-tu-vi", label: "Cung Phúc Đức", theme: "family", alt: "Minh họa cung Phúc Đức trong lá số tử vi với nền phúc, gia đạo và tinh thần" },
  { slug: "cung-dien-trach-trong-tu-vi", label: "Cung Điền Trạch", theme: "home", alt: "Minh họa cung Điền Trạch trong tử vi về nhà cửa đất đai và nơi ở" },
  { slug: "cung-tu-tuc-trong-tu-vi", label: "Cung Tử Tức", theme: "children", alt: "Minh họa cung Tử Tức trong tử vi về con cái nuôi dạy và hậu vận" },
  { slug: "cung-no-boc-trong-tu-vi", label: "Cung Nô Bộc", theme: "network", alt: "Minh họa cung Nô Bộc trong tử vi về bạn bè đồng nghiệp và quý nhân" },
  { slug: "tu-vi-thang-6-2026", label: "Tử vi tháng 6", theme: "month", alt: "Minh họa tử vi tháng 6 năm 2026 theo lá số cá nhân và vận tháng" },
  { slug: "tu-vi-hang-ngay-cach-doc-van-khi", label: "Tử vi hằng ngày", theme: "daily", alt: "Minh họa tử vi hằng ngày và cách đọc vận khí không mê tín" },
  { slug: "cung-menh-cung-than", label: "Mệnh và Thân", theme: "axis", alt: "Minh họa cung Mệnh và cung Thân là hai trục chính khi luận lá số tử vi" },
  { slug: "12-cung-trong-la-so-tu-vi", label: "12 cung tử vi", theme: "palaces", alt: "Minh họa 12 cung trong lá số tử vi và thứ tự đọc cho người mới" },
  { slug: "cung-tai-bach-trong-tu-vi", label: "Cung Tài Bạch", theme: "money", alt: "Minh họa cung Tài Bạch trong tử vi về năng lực kiếm tiền và quản trị tài chính" },
  { slug: "cung-quan-loc-trong-tu-vi", label: "Cung Quan Lộc", theme: "career", alt: "Minh họa cung Quan Lộc trong tử vi về sự nghiệp công danh và môi trường làm việc" },
  { slug: "dai-van-la-gi", label: "Đại vận 10 năm", theme: "decade", alt: "Minh họa đại vận 10 năm trong tử vi và các chu kỳ phát triển" },
  { slug: "nguyet-van-nhat-van", label: "Nguyệt vận Nhật vận", theme: "moonday", alt: "Minh họa nguyệt vận và nhật vận trong tử vi cho kế hoạch tháng ngày" },
  { slug: "gio-sinh-trong-tu-vi", label: "Giờ sinh tử vi", theme: "clock", alt: "Minh họa giờ sinh trong tử vi và ảnh hưởng tới cung Mệnh cung Thân" },
  { slug: "sao-chinh-tinh-tu-vi", label: "14 chính tinh", theme: "stars", alt: "Minh họa 14 chính tinh trong tử vi trên bàn lá số" },
  { slug: "tuan-triet-trong-la-so-tu-vi", label: "Tuần Triệt", theme: "gate", alt: "Minh họa Tuần Triệt trong lá số tử vi và cách hiểu đúng để không lo quá" },
  { slug: "xem-ngay-tot-xau-theo-tuoi", label: "Xem ngày theo tuổi", theme: "agecalendar", alt: "Minh họa xem ngày tốt xấu theo tuổi như một công cụ hỗ trợ lựa chọn" },
  { slug: "seo-cho-website-tu-vi", label: "SEO tử vi", theme: "seo", alt: "Minh họa SEO website tử vi với topic cluster schema và internal link" },
  { slug: "la-so-tu-vi-la-gi", label: "Lá số tử vi là gì", theme: "introchart", alt: "Minh họa lá số tử vi cơ bản với 12 cung và các lớp thông tin nền" },
  { slug: "cach-doc-la-so-tu-vi-cho-nguoi-moi", label: "Cách đọc lá số", theme: "steps", alt: "Minh họa 7 bước đọc lá số tử vi cho người mới" },
  { slug: "cung-phu-the-trong-tu-vi", label: "Cung Phu Thê", theme: "relationship", alt: "Minh họa cung Phu Thê trong tử vi về hôn nhân và người đồng hành" },
  { slug: "cung-tat-ach-trong-tu-vi", label: "Cung Tật Ách", theme: "health", alt: "Minh họa cung Tật Ách trong tử vi về sức khỏe tinh thần và nhịp sống" },
  { slug: "cung-thien-di-trong-tu-vi", label: "Cung Thiên Di", theme: "travel", alt: "Minh họa cung Thiên Di trong tử vi về ra ngoài giao tiếp và cơ hội bên ngoài" },
  { slug: "tao-la-so-tu-vi", label: "Tạo lá số tử vi", theme: "createchart", alt: "Minh họa tạo lá số tử vi với biểu mẫu ngày giờ sinh và bàn lá số 12 cung" },
  { slug: "lap-la-so-tu-vi-chuan", label: "Lập lá số chuẩn", theme: "accuratechart", alt: "Minh họa lập lá số tử vi chuẩn với biểu mẫu ngày giờ sinh và bàn lá số 12 cung", image: "/articles/lap-la-so-tu-vi-chuan.png" },
];

const palette = [
  ["#0f5132", "#c08a2d", "#fff7e6", "#e8f3e6"],
  ["#174a5b", "#d39a3d", "#fff8ed", "#dff2f0"],
  ["#583f2e", "#b98532", "#fff6e8", "#e9f0df"],
  ["#294b35", "#bf7d43", "#fff8eb", "#f1e5d0"],
  ["#49396b", "#c59b3a", "#fff7ef", "#e9e4f4"],
];

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function icon(theme, x, y, color) {
  const stroke = `fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"`;
  const fill = `fill="${color}" opacity="0.18"`;
  if (theme.includes("calendar") || theme === "month" || theme === "daily" || theme === "agecalendar") {
    return `<rect x="${x}" y="${y}" width="150" height="120" rx="18" ${stroke}/><path d="M${x} ${y + 34}h150" ${stroke}/><path d="M${x + 38} ${y - 14}v34M${x + 112} ${y - 14}v34" ${stroke}/><circle cx="${x + 45}" cy="${y + 72}" r="10" ${fill}/><circle cx="${x + 86}" cy="${y + 72}" r="10" ${fill}/><circle cx="${x + 124}" cy="${y + 96}" r="10" ${fill}/>`;
  }
  if (theme === "home") return `<path d="M${x} ${y + 74}l78-62 78 62" ${stroke}/><path d="M${x + 26} ${y + 68}v86h104v-86" ${stroke}/><path d="M${x + 66} ${y + 154}v-48h26v48" ${stroke}/>`;
  if (theme === "money") return `<circle cx="${x + 80}" cy="${y + 70}" r="64" ${stroke}/><path d="M${x + 80} ${y + 28}v84M${x + 52} ${y + 52}c12-20 58-18 58 5 0 27-60 10-60 38 0 25 47 27 64 7" ${stroke}/>`;
  if (theme === "career") return `<rect x="${x + 18}" y="${y + 34}" width="126" height="92" rx="16" ${stroke}/><path d="M${x + 54} ${y + 34}v-24h54v24M${x + 18} ${y + 72}h126M${x + 78} ${y + 68}h8" ${stroke}/>`;
  if (theme === "clock") return `<circle cx="${x + 80}" cy="${y + 70}" r="68" ${stroke}/><path d="M${x + 80} ${y + 30}v44l34 20" ${stroke}/><path d="M${x + 80} ${y + 2}v14M${x + 80} ${y + 124}v14M${x + 12} ${y + 70}h14M${x + 134} ${y + 70}h14" ${stroke}/>`;
  if (theme === "seo") return `<path d="M${x + 10} ${y + 125}V${y + 20}h138v105" ${stroke}/><path d="M${x + 32} ${y + 96}l30-30 25 20 38-48" ${stroke}/><circle cx="${x + 62}" cy="${y + 66}" r="10" ${fill}/><circle cx="${x + 87}" cy="${y + 86}" r="10" ${fill}/><circle cx="${x + 125}" cy="${y + 38}" r="10" ${fill}/>`;
  if (theme === "relationship" || theme === "children" || theme === "family" || theme === "network") return `<circle cx="${x + 58}" cy="${y + 48}" r="32" ${stroke}/><circle cx="${x + 114}" cy="${y + 58}" r="25" ${stroke}/><path d="M${x + 14} ${y + 140}c12-48 78-54 98-14M${x + 76} ${y + 142}c8-32 58-38 76-10" ${stroke}/>`;
  if (theme === "health") return `<path d="M${x + 80} ${y + 140}C${x + 8} ${y + 84} ${x + 16} ${y + 18} ${x + 66} ${y + 18}c22 0 34 12 44 28 10-16 22-28 44-28 50 0 58 66-14 122" ${stroke}/><path d="M${x + 52} ${y + 78}h32l14-24 22 54 15-30h30" ${stroke}/>`;
  if (theme === "travel") return `<path d="M${x + 18} ${y + 110}c36-70 96-70 130 0" ${stroke}/><path d="M${x + 24} ${y + 112}l44-20 22 26 56-62" ${stroke}/><circle cx="${x + 146}" cy="${y + 56}" r="14" ${fill}/>`;
  if (theme === "decade" || theme === "steps") return `<path d="M${x + 20} ${y + 40}h118M${x + 20} ${y + 80}h118M${x + 20} ${y + 120}h118" ${stroke}/><circle cx="${x + 20}" cy="${y + 40}" r="14" ${fill}/><circle cx="${x + 80}" cy="${y + 80}" r="14" ${fill}/><circle cx="${x + 138}" cy="${y + 120}" r="14" ${fill}/>`;
  if (theme === "gate") return `<path d="M${x + 30} ${y + 148}V${y + 28}h100v120" ${stroke}/><path d="M${x + 30} ${y + 72}h100M${x + 80} ${y + 28}v120" ${stroke}/><path d="M${x + 52} ${y + 112}l56-56M${x + 108} ${y + 112}L${x + 52} ${y + 56}" ${stroke}/>`;
  return `<circle cx="${x + 80}" cy="${y + 76}" r="72" ${stroke}/><path d="M${x + 80} ${y + 10}v132M${x + 14} ${y + 76}h132M${x + 34} ${y + 30}l92 92M${x + 126} ${y + 30}l-92 92" ${stroke}/>`;
}

function chartWheel(cx, cy, r, primary, accent) {
  const rings = [r, r * 0.72, r * 0.45, r * 0.18].map((rr) => `<circle cx="${cx}" cy="${cy}" r="${rr.toFixed(1)}" fill="none" stroke="${primary}" stroke-opacity="0.45" stroke-width="2"/>`).join("");
  const lines = Array.from({ length: 12 }, (_, index) => {
    const angle = -Math.PI / 2 + index * Math.PI * 2 / 12;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    return `<path d="M${cx} ${cy}L${x.toFixed(1)} ${y.toFixed(1)}" stroke="${primary}" stroke-opacity="0.22" stroke-width="1.5"/>`;
  }).join("");
  const dots = Array.from({ length: 12 }, (_, index) => {
    const angle = -Math.PI / 2 + (index + 0.5) * Math.PI * 2 / 12;
    const x = cx + Math.cos(angle) * (r * 0.86);
    const y = cy + Math.sin(angle) * (r * 0.86);
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="7" fill="${accent}" opacity="0.7"/>`;
  }).join("");
  return `<g>${rings}${lines}${dots}<path d="M${cx} ${cy - 26}l11 22 25 4-18 17 4 25-22-12-22 12 4-25-18-17 25-4z" fill="${accent}"/></g>`;
}

function makeSvg(article, index) {
  const [primary, accent, bg, soft] = palette[index % palette.length];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675" role="img" aria-label="${esc(article.alt)}">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="${bg}"/><stop offset="0.58" stop-color="#fffaf1"/><stop offset="1" stop-color="${soft}"/></linearGradient>
    <radialGradient id="glow" cx="76%" cy="34%" r="52%"><stop offset="0" stop-color="${accent}" stop-opacity="0.25"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="18" stdDeviation="24" flood-color="#3a2a18" flood-opacity="0.18"/></filter>
  </defs>
  <rect width="1200" height="675" fill="url(#bg)"/>
  <rect width="1200" height="675" fill="url(#glow)"/>
  <path d="M-60 560C160 480 250 650 430 570C620 486 710 604 880 516C1040 432 1120 470 1260 400V735H-60Z" fill="${primary}" opacity="0.07"/>
  <g opacity="0.18" stroke="${primary}" stroke-width="1.2" fill="none">
    <path d="M80 120c70-60 150-64 228-10M900 92c96 30 160 90 190 180M160 602c160-84 280-68 420 0"/>
    <circle cx="1010" cy="138" r="82"/><circle cx="1010" cy="138" r="118"/>
  </g>
  <g filter="url(#shadow)">
    <rect x="82" y="98" width="500" height="420" rx="34" fill="#fffdf6" stroke="${accent}" stroke-width="3"/>
    <rect x="130" y="156" width="318" height="46" rx="18" fill="${soft}" stroke="${primary}" stroke-opacity="0.18"/>
    <rect x="130" y="228" width="186" height="42" rx="16" fill="#fff8eb" stroke="${primary}" stroke-opacity="0.18"/>
    <rect x="340" y="228" width="184" height="42" rx="16" fill="#fff8eb" stroke="${primary}" stroke-opacity="0.18"/>
    <rect x="130" y="300" width="394" height="42" rx="16" fill="${soft}" stroke="${primary}" stroke-opacity="0.18"/>
    ${icon(article.theme, 164, 374, primary)}
    <text x="130" y="116" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="${primary}" opacity="0.72">Lá số tinh hoa</text>
    <text x="130" y="472" font-family="Arial, sans-serif" font-size="38" font-weight="800" fill="${primary}">${esc(article.label)}</text>
  </g>
  <g filter="url(#shadow)">
    <circle cx="835" cy="332" r="230" fill="#fffdf7" stroke="${accent}" stroke-width="8"/>
    ${chartWheel(835, 332, 215, primary, accent)}
    <circle cx="835" cy="332" r="64" fill="${primary}" opacity="0.9"/>
    <path d="M835 280l14 34 37 4-28 24 8 36-31-18-31 18 8-36-28-24 37-4z" fill="${accent}"/>
  </g>
</svg>`;
}

function articleBlockBounds(source, slug) {
  const slugIndex = source.indexOf(`slug: "${slug}"`);
  if (slugIndex === -1) throw new Error(`Missing slug ${slug}`);
  const start = source.lastIndexOf("  article({", slugIndex);
  const end = source.indexOf("\n  }),", slugIndex) + "\n  }),".length;
  if (start === -1 || end === -1) throw new Error(`Cannot find article block ${slug}`);
  return { start, end };
}

function updateArticleBlock(block, article) {
  const image = article.image || `/articles/${article.slug}.svg`;
  let next = block
    .replace(/coverImage: "[^"]+",/, `coverImage: "${image}",`)
    .replace(/coverAlt: "[^"]*",/, `coverAlt: "${article.alt}",`);

  if (/ogImage: "[^"]*",/.test(next)) {
    next = next.replace(/ogImage: "[^"]*",/, `ogImage: "${image}",`);
  } else {
    next = next.replace(/(coverAlt: "[^"]*",\n)/, `$1    ogImage: "${image}",\n`);
  }

  const imageMarkdown = `![${article.alt}](${image})`;
  next = next.replace(/\n\n!\[[^\n]*\]\(\/articles\/[^)]+\)/, "");

  const contentStart = next.indexOf("content: `");
  if (contentStart === -1) throw new Error(`Missing content ${article.slug}`);
  const bodyStart = contentStart + "content: `".length;
  const firstBreak = next.indexOf("\n\n", bodyStart);
  if (firstBreak === -1) throw new Error(`Missing first paragraph break ${article.slug}`);
  return next.slice(0, firstBreak) + `\n\n${imageMarkdown}` + next.slice(firstBreak);
}

fs.mkdirSync(articlesDir, { recursive: true });

for (const [index, article] of articles.entries()) {
  if (!article.image) {
    fs.writeFileSync(path.join(articlesDir, `${article.slug}.svg`), makeSvg(article, index), "utf8");
  }
}

let source = fs.readFileSync(contentPath, "utf8");
for (const article of articles) {
  const { start, end } = articleBlockBounds(source, article.slug);
  source = source.slice(0, start) + updateArticleBlock(source.slice(start, end), article) + source.slice(end);
}

fs.writeFileSync(contentPath, source, "utf8");
console.log(`Generated/linked article imagery for ${articles.length} articles`);
