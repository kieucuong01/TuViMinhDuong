import { describe, expect, it } from "vitest";
import { auditArticles } from "@/lib/content-audit";
import { articleWithScore, seedArticles } from "@/lib/content";

describe("SEO content cluster", () => {
  it("passes the production content quality audit", () => {
    const errors = auditArticles(seedArticles).filter((finding) => finding.severity === "error");

    expect(errors).toEqual([]);
  });

  it("contains the beginner hub and palace support articles", () => {
    const slugs = new Set(seedArticles.map((article) => article.slug));

    expect(slugs).toContain("la-so-tu-vi-la-gi");
    expect(slugs).toContain("cach-doc-la-so-tu-vi-cho-nguoi-moi");
    expect(slugs).toContain("cung-phu-the-trong-tu-vi");
    expect(slugs).toContain("cung-phuc-duc-trong-tu-vi");
    expect(slugs).toContain("cung-dien-trach-trong-tu-vi");
    expect(slugs).toContain("cung-tu-tuc-trong-tu-vi");
    expect(slugs).toContain("cung-no-boc-trong-tu-vi");
    expect(slugs).toContain("cung-tat-ach-trong-tu-vi");
    expect(slugs).toContain("cung-thien-di-trong-tu-vi");
    expect(slugs).toContain("lap-la-so-tu-vi-chuan");
    expect(slugs).toContain("phan-tich-la-so-tu-vi");
    expect(slugs).toContain("la-so-bat-tu-va-tu-vi");
    expect(slugs).toContain("chiem-tinh-la-so-va-tu-vi");
    expect(slugs).toContain("la-so-tu-vi-mien-phi");
    expect(slugs).toContain("an-sao-la-so-tu-vi");
    expect(slugs).toContain("sao-tu-vi");
    expect(slugs).toContain("menh-vo-chinh-dieu");
    expect(slugs).toContain("sao-thien-co");
    expect(slugs).toContain("sao-thai-duong");
  });

  it("links the beginner cluster back to conversion and related evergreen pages", () => {
    const hub = seedArticles.find((article) => article.slug === "la-so-tu-vi-la-gi");
    const guide = seedArticles.find((article) => article.slug === "cach-doc-la-so-tu-vi-cho-nguoi-moi");
    const preciseSetup = seedArticles.find((article) => article.slug === "lap-la-so-tu-vi-chuan");
    const analysisGuide = seedArticles.find((article) => article.slug === "phan-tich-la-so-tu-vi");
    const batTuGuide = seedArticles.find((article) => article.slug === "la-so-bat-tu-va-tu-vi");
    const astrologyGuide = seedArticles.find((article) => article.slug === "chiem-tinh-la-so-va-tu-vi");
    const freeGuide = seedArticles.find((article) => article.slug === "la-so-tu-vi-mien-phi");
    const starPlacementGuide = seedArticles.find((article) => article.slug === "an-sao-la-so-tu-vi");
    const saoTuViGuide = seedArticles.find((article) => article.slug === "sao-tu-vi");
    const menhVoChinhDieuGuide = seedArticles.find((article) => article.slug === "menh-vo-chinh-dieu");
    const mainStarsPillar = seedArticles.find((article) => article.slug === "sao-chinh-tinh-tu-vi");
    const saoThienCoGuide = seedArticles.find((article) => article.slug === "sao-thien-co");
    const saoThaiDuongGuide = seedArticles.find((article) => article.slug === "sao-thai-duong");

    expect(hub?.content).toContain("/#lap-la-so");
    expect(hub?.content).toContain("/kien-thuc-tu-vi/cung-menh-cung-than");
    expect(hub?.content).toContain("/kien-thuc-tu-vi/12-cung-trong-la-so-tu-vi");
    expect(guide?.content).toContain("/kien-thuc-tu-vi/cung-phu-the-trong-tu-vi");
    expect(guide?.content).toContain("/kien-thuc-tu-vi/cung-tat-ach-trong-tu-vi");
    expect(guide?.content).toContain("/kien-thuc-tu-vi/cung-thien-di-trong-tu-vi");
    expect(preciseSetup?.content).toContain("/#lap-la-so");
    expect(preciseSetup?.content).toContain("/kien-thuc-tu-vi/tao-la-so-tu-vi");
    expect(preciseSetup?.content).toContain("/kien-thuc-tu-vi/gio-sinh-trong-tu-vi");
    expect(analysisGuide?.content).toContain("/#lap-la-so");
    expect(analysisGuide?.content).toContain("/kien-thuc-tu-vi/cung-menh-cung-than");
    expect(analysisGuide?.content).toContain("/kien-thuc-tu-vi/sao-chinh-tinh-tu-vi");
    expect(batTuGuide?.content).toContain("/#lap-la-so");
    expect(batTuGuide?.content).toContain("/kien-thuc-tu-vi/la-so-tu-vi-la-gi");
    expect(batTuGuide?.content).toContain("/kien-thuc-tu-vi/cung-menh-cung-than");
    expect(astrologyGuide?.content).toContain("/#lap-la-so");
    expect(astrologyGuide?.content).toContain("/kien-thuc-tu-vi/la-so-bat-tu-va-tu-vi");
    expect(astrologyGuide?.content).toContain("/kien-thuc-tu-vi/lap-la-so-tu-vi-chuan");
    expect(freeGuide?.content).toContain("/#lap-la-so");
    expect(freeGuide?.content).toContain("/kien-thuc-tu-vi/lap-la-so-tu-vi-chuan");
    expect(freeGuide?.content).toContain("/kien-thuc-tu-vi/phan-tich-la-so-tu-vi");
    expect(starPlacementGuide?.content).toContain("/#lap-la-so");
    expect(starPlacementGuide?.content).toContain("/kien-thuc-tu-vi/cung-menh-cung-than");
    expect(starPlacementGuide?.content).toContain("/kien-thuc-tu-vi/gio-sinh-trong-tu-vi");
    expect(saoTuViGuide?.content).toContain("/#lap-la-so");
    expect(saoTuViGuide?.content).toContain("/kien-thuc-tu-vi/sao-chinh-tinh-tu-vi");
    expect(saoTuViGuide?.content).toContain("/kien-thuc-tu-vi/cung-quan-loc-trong-tu-vi");
    expect(menhVoChinhDieuGuide?.content).toContain("/#lap-la-so");
    expect(menhVoChinhDieuGuide?.content).toContain("/kien-thuc-tu-vi/cung-menh-cung-than");
    expect(menhVoChinhDieuGuide?.content).toContain("/kien-thuc-tu-vi/cung-quan-loc-trong-tu-vi");
    expect(mainStarsPillar?.content).toContain("/kien-thuc-tu-vi/sao-tu-vi");
    expect(mainStarsPillar?.content).toContain("/kien-thuc-tu-vi/sao-thien-co");
    expect(mainStarsPillar?.content).toContain("/kien-thuc-tu-vi/sao-thai-duong");
    expect(saoThienCoGuide?.content).toContain("/kien-thuc-tu-vi/sao-chinh-tinh-tu-vi");
    expect(saoThienCoGuide?.content).toContain("| Tình huống cần đọc |");
    expect(saoThienCoGuide?.content).toContain("| Điều kiện làm Thiên Cơ đổi sắc thái |");
    expect(saoThaiDuongGuide?.content).toContain("/kien-thuc-tu-vi/sao-chinh-tinh-tu-vi");
    expect(saoThaiDuongGuide?.content).toContain("| Câu hỏi về vai trò |");
    expect(saoThaiDuongGuide?.content).toContain("| Bối cảnh làm Thái Dương biểu hiện khác |");
  });

  it("uses dedicated SEO images for every public knowledge article", () => {
    const coverImages = new Set<string>();

    for (const article of seedArticles) {
      expect(article.coverImage, `${article.slug} should have a local thumbnail`).toMatch(/^\/articles\/.+\.(svg|png|webp)$/);
      expect(article.ogImage, `${article.slug} should use the same image for social sharing`).toBe(article.coverImage);
      expect(article.coverAlt, `${article.slug} should have descriptive alt text`).toMatch(/^Minh họa .{24,}$/);
      expect(article.coverAlt, `${article.slug} alt should not contain mojibake`).not.toMatch(/Ã|Â|á»|Ä|Æ|�|\?/);
      expect(article.content, `${article.slug} should include the cover as an in-article illustration`).toContain(
        `![${article.coverAlt}](${article.coverImage})`,
      );
      coverImages.add(article.coverImage || "");
    }

    expect(coverImages.size).toBe(seedArticles.length);
  });

  it("uses a dedicated raster SEO cover for the precise chart setup article", () => {
    const preciseSetup = seedArticles.find((article) => article.slug === "lap-la-so-tu-vi-chuan");

    expect(preciseSetup?.coverImage).toBe("/articles/lap-la-so-tu-vi-chuan.webp");
    expect(preciseSetup?.ogImage).toBe("/articles/lap-la-so-tu-vi-chuan.webp");
    expect(preciseSetup?.coverAlt).toContain("lập lá số tử vi chuẩn");
    expect(preciseSetup?.coverAlt).toContain("ngày giờ sinh");
    expect(preciseSetup?.coverAlt).toContain("bàn lá số 12 cung");
  });

  it("does not expose SEO implementation notes in public article copy", () => {
    for (const article of seedArticles) {
      expect(article.content).not.toContain("Nguồn tham khảo và kỹ thuật SEO");
      expect(article.content).not.toContain("Website dùng canonical URL");
      expect(article.content).not.toContain("qualify outbound links");
    }
  });

  it("keeps new evergreen articles above the minimum SEO score", () => {
    const newCluster = seedArticles
      .filter((article) =>
        [
          "la-so-tu-vi-la-gi",
          "cach-doc-la-so-tu-vi-cho-nguoi-moi",
          "cung-phu-the-trong-tu-vi",
          "cung-phuc-duc-trong-tu-vi",
          "cung-dien-trach-trong-tu-vi",
          "cung-tu-tuc-trong-tu-vi",
          "cung-no-boc-trong-tu-vi",
          "cung-tat-ach-trong-tu-vi",
          "cung-thien-di-trong-tu-vi",
          "lap-la-so-tu-vi-chuan",
          "phan-tich-la-so-tu-vi",
          "la-so-bat-tu-va-tu-vi",
          "chiem-tinh-la-so-va-tu-vi",
          "la-so-tu-vi-mien-phi",
          "an-sao-la-so-tu-vi",
          "sao-tu-vi",
          "menh-vo-chinh-dieu",
        ].includes(article.slug),
      )
      .map(articleWithScore);

    for (const article of newCluster) {
      expect(article.seoScore).toBeGreaterThanOrEqual(70);
    }
  });

  it("keeps public knowledge articles above thin-content thresholds", () => {
    for (const article of seedArticles) {
      const plainText = article.content
        .replace(/\[[^\]]+]\([^)]+\)/g, " ")
        .replace(/[#>*`|\-]+/g, " ");
      const wordCount = plainText.match(/[\wÀ-ỹ]+/gu)?.length ?? 0;
      const internalLinks = article.content.match(/]\(\/[^)]+\)/g)?.length ?? 0;
      const h2Count = article.content.match(/^##\s+/gm)?.length ?? 0;

      expect(article.content.length, `${article.slug} should not be thin`).toBeGreaterThanOrEqual(4500);
      expect(wordCount, `${article.slug} should have enough editorial depth`).toBeGreaterThanOrEqual(800);
      expect(internalLinks, `${article.slug} should have contextual internal links`).toBeGreaterThanOrEqual(5);
      expect(h2Count, `${article.slug} should have a scannable H2 structure`).toBeGreaterThanOrEqual(5);
    }
  });

  it("keeps the free chart article anchored to conversion and data-rich guidance", () => {
    const freeGuide = seedArticles.find((article) => article.slug === "la-so-tu-vi-mien-phi");

    expect(freeGuide).toBeTruthy();
    expect(freeGuide?.coverImage).toBe("/articles/la-so-tu-vi-mien-phi.webp");
    expect(freeGuide?.ogImage).toBe("/articles/la-so-tu-vi-mien-phi.webp");
    expect(freeGuide?.content).toContain("| Phần người mới thường muốn xem |");
    expect(freeGuide?.content).toContain("| Dấu hiệu sau khi xem lá số miễn phí |");
    expect(freeGuide?.content).toContain("/kien-thuc-tu-vi/cung-menh-cung-than");
    expect(freeGuide?.content).toContain("/kien-thuc-tu-vi/cung-quan-loc-trong-tu-vi");
    expect(freeGuide?.content).toContain("/kien-thuc-tu-vi/cung-phu-the-trong-tu-vi");
    expect(freeGuide?.content).toContain("/kien-thuc-tu-vi/gio-sinh-trong-tu-vi");
    expect(freeGuide?.faqs?.length).toBeGreaterThanOrEqual(3);
  });

  it("keeps the star-placement guide practical, data-rich, and tied to the reader workflow", () => {
    const starPlacementGuide = seedArticles.find((article) => article.slug === "an-sao-la-so-tu-vi");

    expect(starPlacementGuide).toBeTruthy();
    expect(starPlacementGuide?.coverImage).toBe("/articles/an-sao-la-so-tu-vi.webp");
    expect(starPlacementGuide?.ogImage).toBe("/articles/an-sao-la-so-tu-vi.webp");
    expect(starPlacementGuide?.content).toContain("| Câu hỏi thật của người đọc |");
    expect(starPlacementGuide?.content).toContain("| Dấu hiệu về dữ liệu sinh |");
    expect(starPlacementGuide?.content).toContain("/kien-thuc-tu-vi/cung-quan-loc-trong-tu-vi");
    expect(starPlacementGuide?.content).toContain("/kien-thuc-tu-vi/cung-phu-the-trong-tu-vi");
    expect(starPlacementGuide?.content).toContain("/kien-thuc-tu-vi/dai-van-la-gi");
    expect(starPlacementGuide?.content).toContain("/kien-thuc-tu-vi/lap-la-so-tu-vi-chuan");
    expect(starPlacementGuide?.content).toContain("năm lớp");
    expect(starPlacementGuide?.faqs?.length).toBeGreaterThanOrEqual(3);
  });

  it("keeps the sao Tu Vi primer tied to context, data blocks, and next-step links", () => {
    const saoTuViGuide = seedArticles.find((article) => article.slug === "sao-tu-vi");

    expect(saoTuViGuide).toBeTruthy();
    expect(saoTuViGuide?.coverImage).toBe("/articles/sao-tu-vi.webp");
    expect(saoTuViGuide?.ogImage).toBe("/articles/sao-tu-vi.webp");
    expect(saoTuViGuide?.content).toContain("| Câu hỏi thật của người đọc |");
    expect(saoTuViGuide?.content).toContain("| Điều kiện cần kiểm tra |");
    expect(saoTuViGuide?.content).toContain("/kien-thuc-tu-vi/cung-menh-cung-than");
    expect(saoTuViGuide?.content).toContain("/kien-thuc-tu-vi/cung-phu-the-trong-tu-vi");
    expect(saoTuViGuide?.content).toContain("/kien-thuc-tu-vi/gio-sinh-trong-tu-vi");
    expect(saoTuViGuide?.content).toContain("## Thử ngay trên lá số của bạn");
    expect(saoTuViGuide?.faqs?.length).toBeGreaterThanOrEqual(3);
  });

  it("keeps the Mệnh vô chính diệu guide practical, data-rich, and tied to verification steps", () => {
    const menhVoChinhDieuGuide = seedArticles.find((article) => article.slug === "menh-vo-chinh-dieu");

    expect(menhVoChinhDieuGuide).toBeTruthy();
    expect(menhVoChinhDieuGuide?.coverImage).toBe("/articles/menh-vo-chinh-dieu.webp");
    expect(menhVoChinhDieuGuide?.ogImage).toBe("/articles/menh-vo-chinh-dieu.webp");
    expect(menhVoChinhDieuGuide?.content).toContain("| Câu hỏi thật của người đọc |");
    expect(menhVoChinhDieuGuide?.content).toContain("| Điều kiện cần kiểm tra |");
    expect(menhVoChinhDieuGuide?.content).toContain("/kien-thuc-tu-vi/gio-sinh-trong-tu-vi");
    expect(menhVoChinhDieuGuide?.content).toContain("/kien-thuc-tu-vi/cung-phu-the-trong-tu-vi");
    expect(menhVoChinhDieuGuide?.content).toContain("/kien-thuc-tu-vi/phan-tich-la-so-tu-vi");
    expect(menhVoChinhDieuGuide?.content).toContain("## Khung causal analysis");
    expect(menhVoChinhDieuGuide?.faqs?.length).toBeGreaterThanOrEqual(3);
  });

  it("refreshes the core pillars with depth, trust framing, and contextual anchors", () => {
    const corePillars = [
      "la-so-tu-vi-la-gi",
      "12-cung-trong-la-so-tu-vi",
      "cung-menh-cung-than",
    ].map((slug) => seedArticles.find((article) => article.slug === slug));

    for (const article of corePillars) {
      expect(article, "pillar article should exist").toBeTruthy();
      expect(article!.content.length, `${article!.slug} should not be a thin pillar`).toBeGreaterThanOrEqual(5000);
      expect(article!.content, `${article!.slug} should explain editorial trust`).toContain("Cách Lá số tinh hoa biên tập");
      expect(article!.content, `${article!.slug} should keep reader-first caveats`).toContain("không thay thế");
      expect(article!.content, `${article!.slug} should include the conversion path`).toContain("[lập lá số tử vi miễn phí](/#lap-la-so)");
      expect(article!.faqs?.length ?? 0, `${article!.slug} should have visible FAQ support`).toBeGreaterThanOrEqual(3);
    }

    expect(corePillars[0]!.content).toContain("[Cung Mệnh và Cung Thân là hai trục đọc đầu tiên](/kien-thuc-tu-vi/cung-menh-cung-than)");
    expect(corePillars[1]!.content).toContain("[Cung Quan Lộc khi đang hỏi về công việc](/kien-thuc-tu-vi/cung-quan-loc-trong-tu-vi)");
    expect(corePillars[2]!.content).toContain("[12 cung trong lá số tử vi để đặt Mệnh - Thân vào bức tranh đầy đủ](/kien-thuc-tu-vi/12-cung-trong-la-so-tu-vi)");
  });
});
