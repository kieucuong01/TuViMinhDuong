import "dotenv/config";

import { randomBytes, randomUUID, scryptSync } from "node:crypto";
import pg from "pg";

const { Client } = pg;

const databaseUrl = process.env.DATABASE_URL || "";

if (!databaseUrl || databaseUrl.includes("johndoe:randompassword")) {
  throw new Error("DATABASE_URL chưa phải Postgres production thật.");
}

const adminEmail = (process.env.ADMIN_EMAIL || "kieucuong01@gmail.com").toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD;

if (!adminPassword) {
  throw new Error("ADMIN_PASSWORD bắt buộc phải có khi seed production.");
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

function id(prefix) {
  return `${prefix}_${randomUUID().replaceAll("-", "")}`;
}

const featurePrices = [
  ["FULL", "Luận giải toàn bộ", 199],
  ["PALACE", "Luận cung", 29],
  ["DAI_VAN", "Luận đại vận", 49],
  ["TIEU_VAN", "Luận tiểu vận", 39],
  ["NGUYET_VAN", "Luận nguyệt vận", 19],
  ["NHAT_VAN", "Luận nhật vận", 9],
];

const coinPackages = [
  ["starter", "Gói khởi đầu", 99, 99000, 0],
  ["full-reading", "Gói luận toàn bộ", 199, 199000, 10],
  ["pro", "Gói chuyên sâu", 499, 499000, 60],
];

const articles = [
  {
    title: "Tử vi hằng ngày: Cách đọc vận khí không mê tín",
    slug: "tu-vi-hang-ngay-cach-doc-van-khi",
    excerpt: "Cách đọc tử vi hằng ngày theo hướng ứng dụng: kết hợp lá số gốc, nhịp tháng, nhịp ngày và quyết định thực tế.",
    content:
      "Tử vi hằng ngày nên được dùng như một công cụ tham khảo để quan sát nhịp hành động. Hãy kết hợp dữ liệu lá số gốc, vận tháng, vận ngày và bối cảnh thực tế trước khi đưa ra quyết định.\n\n## Cách ứng dụng\n\nNgười đọc có thể dùng phần xem ngày để chọn việc nên ưu tiên, việc cần kiểm tra kỹ và thời điểm nên giữ sức.\n\n## Lưu ý\n\nNội dung chỉ có tính chất tham khảo, không thay thế lời khuyên chuyên môn.",
    coverImage: "/articles/tu-vi-hang-ngay.svg",
    coverAlt: "Vòng can chi và lịch xem ngày tốt xấu",
    focusKeyword: "tử vi hằng ngày",
  },
  {
    title: "Cung Mệnh và Cung Thân trong lá số tử vi",
    slug: "cung-menh-cung-than",
    excerpt: "Cung Mệnh cho thấy nền tính cách, Cung Thân phản ánh cách con người nhập cuộc và hành động trong đời sống.",
    content:
      "Cung Mệnh và Cung Thân là hai trục quan trọng khi đọc lá số. Mệnh cho thấy nền tảng khí chất, Thân cho thấy cách năng lượng đó thể hiện rõ hơn trong đời sống.\n\n## Nên đọc thế nào\n\nHãy đọc Mệnh, Thân cùng với Tài Bạch, Quan Lộc và Đại vận để có bức tranh đầy đủ hơn.",
    coverImage: "/articles/cung-menh-than.svg",
    coverAlt: "Bàn lá số tử vi với cung Mệnh và cung Thân",
    focusKeyword: "cung mệnh cung thân",
  },
  {
    title: "Đại vận là gì? Cách đọc chu kỳ 10 năm trong tử vi",
    slug: "dai-van-la-gi",
    excerpt: "Đại vận cho biết nhịp 10 năm, giai đoạn mở rộng, tích lũy hay cần thận trọng trong đời sống.",
    content:
      "Đại vận là lớp thời gian dài, thường dùng để đọc xu hướng 10 năm. Nó không thay thế quyết định cá nhân, nhưng giúp người xem hiểu giai đoạn nào nên mở rộng và giai đoạn nào nên tích lũy.\n\n## Ứng dụng\n\nHãy biến luận giải thành kế hoạch: học gì, giữ gì, tránh rủi ro nào và ưu tiên nguồn lực ra sao.",
    coverImage: "/articles/dai-van.svg",
    coverAlt: "Biểu đồ đại vận 10 năm trong tử vi",
    focusKeyword: "đại vận",
  },
];

const client = new Client({ connectionString: databaseUrl });

await client.connect();

try {
  await client.query("BEGIN");

  await client.query(
    `INSERT INTO "User" ("id", "email", "name", "passwordHash", "coinBalance", "role", "createdAt", "updatedAt")
     VALUES ($1, $2, 'Admin', $3, 999999, 'ADMIN', now(), now())
     ON CONFLICT ("email") DO UPDATE SET
       "passwordHash" = EXCLUDED."passwordHash",
       "coinBalance" = GREATEST("User"."coinBalance", 999999),
       "role" = 'ADMIN',
       "updatedAt" = now()`,
    [id("admin"), adminEmail, hashPassword(adminPassword)],
  );

  for (const [key, label, coins, priceVnd, bonusCoins] of coinPackages) {
    await client.query(
      `INSERT INTO "CoinPackage" ("id", "key", "label", "coins", "priceVnd", "bonusCoins", "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, true, now(), now())
       ON CONFLICT ("key") DO UPDATE SET
         "label" = EXCLUDED."label",
         "coins" = EXCLUDED."coins",
         "priceVnd" = EXCLUDED."priceVnd",
         "bonusCoins" = EXCLUDED."bonusCoins",
         "isActive" = true,
         "updatedAt" = now()`,
      [id("pkg"), key, label, coins, priceVnd, bonusCoins],
    );
  }

  for (const [key, label, priceCoins] of featurePrices) {
    await client.query(
      `INSERT INTO "FeaturePrice" ("key", "label", "priceCoins", "isActive", "updatedAt")
       VALUES ($1, $2, $3, true, now())
       ON CONFLICT ("key") DO UPDATE SET
         "label" = EXCLUDED."label",
         "priceCoins" = EXCLUDED."priceCoins",
         "isActive" = true,
         "updatedAt" = now()`,
      [key, label, priceCoins],
    );
  }

  for (const article of articles) {
    const metaTitle = article.title;
    const metaDescription = article.excerpt;
    const canonicalUrl = `/kien-thuc-tu-vi/${article.slug}`;
    await client.query(
      `INSERT INTO "Article" (
        "id", "title", "slug", "excerpt", "content", "status", "coverImage", "coverAlt",
        "focusKeyword", "metaTitle", "metaDescription", "canonicalUrl", "robots",
       "schemaType", "seoScore", "seoChecklist", "publishedAt", "createdAt", "updatedAt"
      )
       VALUES (
        $1, $2, $3, $4, $5, 'published', $6, $7,
        $8, $9, $10, $11, 'index,follow', 'Article', 80, '[]'::jsonb, now(), now(), now()
      )
       ON CONFLICT ("slug") DO UPDATE SET
        "title" = EXCLUDED."title",
        "excerpt" = EXCLUDED."excerpt",
        "content" = EXCLUDED."content",
        "status" = 'published',
        "coverImage" = EXCLUDED."coverImage",
        "coverAlt" = EXCLUDED."coverAlt",
        "focusKeyword" = EXCLUDED."focusKeyword",
        "metaTitle" = EXCLUDED."metaTitle",
        "metaDescription" = EXCLUDED."metaDescription",
        "canonicalUrl" = EXCLUDED."canonicalUrl",
        "robots" = 'index,follow',
        "updatedAt" = now()`,
      [
        id("article"),
        article.title,
        article.slug,
        article.excerpt,
        article.content,
        article.coverImage,
        article.coverAlt,
        article.focusKeyword,
        metaTitle,
        metaDescription,
        canonicalUrl,
      ],
    );
  }

  await client.query("COMMIT");
  console.log(`Seeded admin, ${coinPackages.length} coin packages, ${featurePrices.length} feature prices, ${articles.length} articles.`);
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  await client.end();
}
