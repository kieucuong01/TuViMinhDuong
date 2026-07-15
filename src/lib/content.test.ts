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
    expect(slugs).toContain("la-so-tu-vi-online");
    expect(slugs).toContain("lap-la-so-bat-tu");
    expect(slugs).toContain("phan-tich-la-so-tu-vi");
    expect(slugs).toContain("la-so-bat-tu-va-tu-vi");
    expect(slugs).toContain("chiem-tinh-la-so-va-tu-vi");
    expect(slugs).toContain("la-so-tu-vi-mien-phi");
    expect(slugs).toContain("giai-ma-la-so-tu-vi");
    expect(slugs).toContain("binh-giai-la-so-tu-vi");
    expect(slugs).toContain("an-sao-la-so-tu-vi");
    expect(slugs).toContain("sao-tu-vi");
    expect(slugs).toContain("menh-vo-chinh-dieu");
    expect(slugs).toContain("tieu-van-la-gi");
    expect(slugs).toContain("cung-phu-mau-trong-tu-vi");
    expect(slugs).toContain("lap-la-so-tu-vi-can-gi");
    expect(slugs).toContain("la-so-tu-vi-tron-doi");
    expect(slugs).toContain("la-so-tu-vi-co-thay-doi-khong");
    expect(slugs).toContain("menh-tham-lang-la-gi");
    expect(slugs).toContain("sao-vu-khuc");
    expect(slugs).toContain("sao-thai-am");
    expect(slugs).toContain("sao-thien-dong");
    expect(slugs).toContain("sao-liem-trinh");
    expect(slugs).toContain("sao-thien-co");
    expect(slugs).toContain("sao-thai-duong");
    expect(slugs).toContain("sao-tham-lang-trong-tu-vi");
    expect(slugs).toContain("cac-sao-trong-la-so-tu-vi");
  });

  it("links the beginner cluster back to conversion and related evergreen pages", () => {
    const hub = seedArticles.find((article) => article.slug === "la-so-tu-vi-la-gi");
    const guide = seedArticles.find((article) => article.slug === "cach-doc-la-so-tu-vi-cho-nguoi-moi");
    const preciseSetup = seedArticles.find((article) => article.slug === "lap-la-so-tu-vi-chuan");
    const analysisGuide = seedArticles.find((article) => article.slug === "phan-tich-la-so-tu-vi");
    const batTuGuide = seedArticles.find((article) => article.slug === "la-so-bat-tu-va-tu-vi");
    const lapBatTuGuide = seedArticles.find((article) => article.slug === "lap-la-so-bat-tu");
    const astrologyGuide = seedArticles.find((article) => article.slug === "chiem-tinh-la-so-va-tu-vi");
    const freeGuide = seedArticles.find((article) => article.slug === "la-so-tu-vi-mien-phi");
    const decodingGuide = seedArticles.find((article) => article.slug === "giai-ma-la-so-tu-vi");
    const interpretationGuide = seedArticles.find((article) => article.slug === "binh-giai-la-so-tu-vi");
    const starPlacementGuide = seedArticles.find((article) => article.slug === "an-sao-la-so-tu-vi");
    const saoTuViGuide = seedArticles.find((article) => article.slug === "sao-tu-vi");
    const menhVoChinhDieuGuide = seedArticles.find((article) => article.slug === "menh-vo-chinh-dieu");
    const tieuVanGuide = seedArticles.find((article) => article.slug === "tieu-van-la-gi");
    const cungPhuMauGuide = seedArticles.find((article) => article.slug === "cung-phu-mau-trong-tu-vi");
    const setupChecklistGuide = seedArticles.find((article) => article.slug === "lap-la-so-tu-vi-can-gi");
    const tronDoiGuide = seedArticles.find((article) => article.slug === "la-so-tu-vi-tron-doi");
    const changingChartGuide = seedArticles.find((article) => article.slug === "la-so-tu-vi-co-thay-doi-khong");
    const mainStarsPillar = seedArticles.find((article) => article.slug === "sao-chinh-tinh-tu-vi");
    const saoThienCoGuide = seedArticles.find((article) => article.slug === "sao-thien-co");
    const saoThaiDuongGuide = seedArticles.find((article) => article.slug === "sao-thai-duong");
    const saoThamLangGuide = seedArticles.find((article) => article.slug === "sao-tham-lang-trong-tu-vi");
    const menhThamLangGuide = seedArticles.find((article) => article.slug === "menh-tham-lang-la-gi");
    const saoVuKhucGuide = seedArticles.find((article) => article.slug === "sao-vu-khuc");
    const saoThaiAmGuide = seedArticles.find((article) => article.slug === "sao-thai-am");
    const saoLiemTrinhGuide = seedArticles.find((article) => article.slug === "sao-liem-trinh");

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
    expect(lapBatTuGuide?.content).toContain("/#lap-la-so");
    expect(lapBatTuGuide?.content).toContain("/kien-thuc-tu-vi/la-so-bat-tu-va-tu-vi");
    expect(lapBatTuGuide?.content).toContain("/kien-thuc-tu-vi/lap-la-so-tu-vi-can-gi");
    expect(astrologyGuide?.content).toContain("/#lap-la-so");
    expect(astrologyGuide?.content).toContain("/kien-thuc-tu-vi/la-so-bat-tu-va-tu-vi");
    expect(astrologyGuide?.content).toContain("/kien-thuc-tu-vi/lap-la-so-tu-vi-chuan");
    expect(freeGuide?.content).toContain("/#lap-la-so");
    expect(freeGuide?.content).toContain("/kien-thuc-tu-vi/lap-la-so-tu-vi-chuan");
    expect(freeGuide?.content).toContain("/kien-thuc-tu-vi/phan-tich-la-so-tu-vi");
    expect(decodingGuide?.content).toContain("/#lap-la-so");
    expect(decodingGuide?.content).toContain("/kien-thuc-tu-vi/cung-menh-cung-than");
    expect(decodingGuide?.content).toContain("/kien-thuc-tu-vi/sao-chinh-tinh-tu-vi");
    expect(interpretationGuide?.content).toContain("/#lap-la-so");
    expect(interpretationGuide?.content).toContain("/kien-thuc-tu-vi/giai-ma-la-so-tu-vi");
    expect(interpretationGuide?.content).toContain("/kien-thuc-tu-vi/phan-tich-la-so-tu-vi");
    expect(starPlacementGuide?.content).toContain("/#lap-la-so");
    expect(starPlacementGuide?.content).toContain("/kien-thuc-tu-vi/cung-menh-cung-than");
    expect(starPlacementGuide?.content).toContain("/kien-thuc-tu-vi/gio-sinh-trong-tu-vi");
    expect(saoTuViGuide?.content).toContain("/#lap-la-so");
    expect(saoTuViGuide?.content).toContain("/kien-thuc-tu-vi/sao-chinh-tinh-tu-vi");
    expect(saoTuViGuide?.content).toContain("/kien-thuc-tu-vi/cung-quan-loc-trong-tu-vi");
    expect(menhVoChinhDieuGuide?.content).toContain("/#lap-la-so");
    expect(menhVoChinhDieuGuide?.content).toContain("/kien-thuc-tu-vi/cung-menh-cung-than");
    expect(menhVoChinhDieuGuide?.content).toContain("/kien-thuc-tu-vi/cung-quan-loc-trong-tu-vi");
    expect(tieuVanGuide?.content).toContain("/#lap-la-so");
    expect(tieuVanGuide?.content).toContain("/kien-thuc-tu-vi/dai-van-la-gi");
    expect(tieuVanGuide?.content).toContain("/kien-thuc-tu-vi/nguyet-van-nhat-van");
    expect(cungPhuMauGuide?.content).toContain("/#lap-la-so");
    expect(cungPhuMauGuide?.content).toContain("/kien-thuc-tu-vi/cung-phuc-duc-trong-tu-vi");
    expect(cungPhuMauGuide?.content).toContain("/kien-thuc-tu-vi/cung-quan-loc-trong-tu-vi");
    expect(setupChecklistGuide?.content).toContain("/#lap-la-so");
    expect(setupChecklistGuide?.content).toContain("/kien-thuc-tu-vi/lap-la-so-tu-vi-chuan");
    expect(setupChecklistGuide?.content).toContain("/kien-thuc-tu-vi/cung-menh-cung-than");
    expect(tronDoiGuide?.content).toContain("/#lap-la-so");
    expect(tronDoiGuide?.content).toContain("/kien-thuc-tu-vi/lap-la-so-tu-vi-chuan");
    expect(tronDoiGuide?.content).toContain("/kien-thuc-tu-vi/dai-van-la-gi");
    expect(changingChartGuide?.content).toContain("/#lap-la-so");
    expect(changingChartGuide?.content).toContain("/kien-thuc-tu-vi/lap-la-so-tu-vi-chuan");
    expect(changingChartGuide?.content).toContain("/kien-thuc-tu-vi/tieu-van-la-gi");
    expect(changingChartGuide?.content).toContain("| Tình huống | Có làm lá số gốc thay đổi không? | Vì sao kết quả khác đi |");
    expect(changingChartGuide?.content).toContain(
      "| Dấu hiệu đang gặp | Có thể giữ lá số hiện tại để đọc tiếp | Nên lập thêm lá số thứ hai để so |",
    );
    expect(mainStarsPillar?.content).toContain("/kien-thuc-tu-vi/sao-tu-vi");
    expect(mainStarsPillar?.content).toContain("/kien-thuc-tu-vi/sao-thien-co");
    expect(mainStarsPillar?.content).toContain("/kien-thuc-tu-vi/sao-thai-duong");
    expect(saoThienCoGuide?.content).toContain("/kien-thuc-tu-vi/sao-chinh-tinh-tu-vi");
    expect(saoThienCoGuide?.content).toContain("| Tình huống cần đọc |");
    expect(saoThienCoGuide?.content).toContain("| Điều kiện làm Thiên Cơ đổi sắc thái |");
    expect(saoThaiDuongGuide?.content).toContain("/kien-thuc-tu-vi/sao-chinh-tinh-tu-vi");
    expect(saoThaiDuongGuide?.content).toContain("| Câu hỏi về vai trò |");
    expect(saoThaiDuongGuide?.content).toContain("| Bối cảnh làm Thái Dương biểu hiện khác |");
    expect(saoThamLangGuide?.content).toContain("/#lap-la-so");
    expect(saoThamLangGuide?.content).toContain("/kien-thuc-tu-vi/an-sao-la-so-tu-vi");
    expect(saoThamLangGuide?.content).toContain("| Tình huống cần đọc |");
    expect(saoThamLangGuide?.content).toContain("| Điều kiện làm Tham Lang đổi sắc thái |");
    expect(menhThamLangGuide?.content).toContain("/#lap-la-so");
    expect(menhThamLangGuide?.content).toContain("/kien-thuc-tu-vi/sao-tham-lang-trong-tu-vi");
    expect(menhThamLangGuide?.content).toContain("/kien-thuc-tu-vi/cung-menh-cung-than");
    expect(menhThamLangGuide?.content).toContain("| Dữ liệu nền cần khóa |");
    expect(menhThamLangGuide?.content).toContain("| Tình huống người đọc đang gặp |");
    expect(saoVuKhucGuide?.content).toContain("/#lap-la-so");
    expect(saoVuKhucGuide?.content).toContain("/kien-thuc-tu-vi/cung-tai-bach-trong-tu-vi");
    expect(saoVuKhucGuide?.content).toContain("/kien-thuc-tu-vi/cung-quan-loc-trong-tu-vi");
    expect(saoVuKhucGuide?.content).toContain("| Dữ liệu nền cần khóa |");
    expect(saoVuKhucGuide?.content).toContain("| Điều kiện cần đối chiếu |");
    expect(saoThaiAmGuide?.content).toContain("/#lap-la-so");
    expect(saoThaiAmGuide?.content).toContain("/kien-thuc-tu-vi/cung-dien-trach-trong-tu-vi");
    expect(saoThaiAmGuide?.content).toContain("/kien-thuc-tu-vi/cung-phuc-duc-trong-tu-vi");
    expect(saoThaiAmGuide?.content).toContain("| Dữ liệu nền cần khóa |");
    expect(saoThaiAmGuide?.content).toContain("| Điều kiện cần đối chiếu |");
    expect(saoLiemTrinhGuide?.content).toContain("/#lap-la-so");
    expect(saoLiemTrinhGuide?.content).toContain("/kien-thuc-tu-vi/cung-quan-loc-trong-tu-vi");
    expect(saoLiemTrinhGuide?.content).toContain("/kien-thuc-tu-vi/cung-tai-bach-trong-tu-vi");
    expect(saoLiemTrinhGuide?.content).toContain("| Dữ liệu nền cần khóa |");
    expect(saoLiemTrinhGuide?.content).toContain("| Điều kiện cần đối chiếu |");
  });

  it("keeps the all-stars guide practical, grouped, and tied to reading order", () => {
    const allStarsGuide = seedArticles.find((article) => article.slug === "cac-sao-trong-la-so-tu-vi");

    expect(allStarsGuide).toBeTruthy();
    expect(allStarsGuide?.coverImage).toBe("/articles/cac-sao-trong-la-so-tu-vi.webp");
    expect(allStarsGuide?.ogImage).toBe("/articles/cac-sao-trong-la-so-tu-vi.webp");
    expect(allStarsGuide?.coverAlt).toContain("các nhóm sao");
    expect(allStarsGuide?.coverAlt).toContain("thứ tự đọc");
    expect(allStarsGuide?.content).toContain("/#lap-la-so");
    expect(allStarsGuide?.content).toContain("/kien-thuc-tu-vi/sao-chinh-tinh-tu-vi");
    expect(allStarsGuide?.content).toContain("/kien-thuc-tu-vi/an-sao-la-so-tu-vi");
    expect(allStarsGuide?.content).toContain("| Nhóm sao / dấu hiệu |");
    expect(allStarsGuide?.content).toContain("| Dữ liệu nền cần khóa |");
  });

  it("ships the changing-chart article as a distinct troubleshooting guide with clear data blocks", () => {
    const changingChartGuide = seedArticles.find((article) => article.slug === "la-so-tu-vi-co-thay-doi-khong");

    expect(changingChartGuide).toBeTruthy();
    expect(changingChartGuide?.coverImage).toBe("/articles/la-so-tu-vi-co-thay-doi-khong.webp");
    expect(changingChartGuide?.ogImage).toBe("/articles/la-so-tu-vi-co-thay-doi-khong.webp");
    expect(changingChartGuide?.coverAlt).toContain("hai phiên bản lá số tử vi");
    expect(changingChartGuide?.coverAlt).toContain("giờ sinh");
    expect(changingChartGuide?.content).toContain("/kien-thuc-tu-vi/gio-sinh-trong-tu-vi");
    expect(changingChartGuide?.content).toContain("/kien-thuc-tu-vi/la-so-tu-vi-tron-doi");
    expect(changingChartGuide?.content).toContain("/kien-thuc-tu-vi/nguyet-van-nhat-van");
    expect(changingChartGuide?.content).toContain("## Khung causal analysis để kiểm tra “đổi” hay “không đổi”");
    expect(changingChartGuide?.faqs?.length).toBeGreaterThanOrEqual(3);
  });

  it("ships the menh Tham Lang article as a distinct intent page with chart-check workflow", () => {
    const menhThamLangGuide = seedArticles.find((article) => article.slug === "menh-tham-lang-la-gi");

    expect(menhThamLangGuide).toBeTruthy();
    expect(menhThamLangGuide?.coverImage).toBe("/articles/menh-tham-lang-la-gi.webp");
    expect(menhThamLangGuide?.ogImage).toBe("/articles/menh-tham-lang-la-gi.webp");
    expect(menhThamLangGuide?.coverAlt).toContain("cung Mệnh");
    expect(menhThamLangGuide?.coverAlt).toContain("đối chiếu Mệnh Tham Lang");
    expect(menhThamLangGuide?.content).toContain("/kien-thuc-tu-vi/sao-tham-lang-trong-tu-vi");
    expect(menhThamLangGuide?.content).toContain("/kien-thuc-tu-vi/cung-quan-loc-trong-tu-vi");
    expect(menhThamLangGuide?.content).toContain("/kien-thuc-tu-vi/cung-tai-bach-trong-tu-vi");
    expect(menhThamLangGuide?.content).toContain("## Khung causal analysis để đọc Mệnh Tham Lang không bị cuốn theo nhãn");
    expect(menhThamLangGuide?.faqs?.length).toBeGreaterThanOrEqual(3);
  });

  it("ships the sao Vũ Khúc article as a distinct star-intent page with finance and discipline context", () => {
    const saoVuKhucGuide = seedArticles.find((article) => article.slug === "sao-vu-khuc");

    expect(saoVuKhucGuide).toBeTruthy();
    expect(saoVuKhucGuide?.coverImage).toBe("/articles/sao-vu-khuc.webp");
    expect(saoVuKhucGuide?.ogImage).toBe("/articles/sao-vu-khuc.webp");
    expect(saoVuKhucGuide?.coverAlt).toContain("đọc sao Vũ Khúc");
    expect(saoVuKhucGuide?.coverAlt).toContain("quản trị nguồn lực");
    expect(saoVuKhucGuide?.content).toContain("/kien-thuc-tu-vi/an-sao-la-so-tu-vi");
    expect(saoVuKhucGuide?.content).toContain("/kien-thuc-tu-vi/cung-tai-bach-trong-tu-vi");
    expect(saoVuKhucGuide?.content).toContain("/kien-thuc-tu-vi/cung-quan-loc-trong-tu-vi");
    expect(saoVuKhucGuide?.content).toContain("| Vị trí hoặc câu hỏi đang hỏi |");
    expect(saoVuKhucGuide?.content).toContain("| Điều kiện cần đối chiếu |");
    expect(saoVuKhucGuide?.content).toContain("## Khung causal analysis để đọc sao Vũ Khúc không thành nhãn \"giàu nghèo\"");
    expect(saoVuKhucGuide?.faqs?.length).toBeGreaterThanOrEqual(3);
  });

  it("ships the sao Thái Âm article as a distinct star-intent page with inner-life and stability context", () => {
    const saoThaiAmGuide = seedArticles.find((article) => article.slug === "sao-thai-am");
    const saoThienDongGuide = seedArticles.find((article) => article.slug === "sao-thien-dong");

    expect(saoThaiAmGuide).toBeTruthy();
    expect(saoThaiAmGuide?.coverImage).toBe("/articles/sao-thai-am.webp");
    expect(saoThaiAmGuide?.ogImage).toBe("/articles/sao-thai-am.webp");
    expect(saoThaiAmGuide?.coverAlt).toContain("ảnh gia đình");
    expect(saoThaiAmGuide?.coverAlt).toContain("đọc sao Thai Am");
    expect(saoThaiAmGuide?.content).toContain("/kien-thuc-tu-vi/cung-dien-trach-trong-tu-vi");
    expect(saoThaiAmGuide?.content).toContain("/kien-thuc-tu-vi/cung-tai-bach-trong-tu-vi");
    expect(saoThaiAmGuide?.content).toContain("/kien-thuc-tu-vi/cung-phu-the-trong-tu-vi");
    expect(saoThienDongGuide?.content).toContain("/#lap-la-so");
    expect(saoThienDongGuide?.content).toContain("/kien-thuc-tu-vi/cung-quan-loc-trong-tu-vi");
    expect(saoThienDongGuide?.content).toContain("/kien-thuc-tu-vi/cung-thien-di-trong-tu-vi");
    expect(saoThienDongGuide?.content).toContain("| Dữ liệu nền cần khóa |");
    expect(saoThienDongGuide?.content).toContain("| Điều kiện cần đối chiếu |");
    expect(saoThaiAmGuide?.content).toContain("| Vị trí hoặc câu hỏi đang hỏi |");
    expect(saoThaiAmGuide?.content).toContain("| Điều kiện cần đối chiếu |");
    expect(saoThaiAmGuide?.content).toContain("## Khung causal analysis để đọc sao Thái Âm không thành nhãn \"hiền hay yếu\"");
    expect(saoThaiAmGuide?.faqs?.length).toBeGreaterThanOrEqual(3);
  });

  it("ships the sao Thiên Đồng article as a distinct star-intent page with adaptability and environment context", () => {
    const saoThienDongGuide = seedArticles.find((article) => article.slug === "sao-thien-dong");

    expect(saoThienDongGuide).toBeTruthy();
    expect(saoThienDongGuide?.coverImage).toBe("/articles/sao-thien-dong.webp");
    expect(saoThienDongGuide?.ogImage).toBe("/articles/sao-thien-dong.webp");
    expect(saoThienDongGuide?.coverAlt).toContain("sổ tay");
    expect(saoThienDongGuide?.coverAlt).toContain("đọc sao Thiên Đồng");
    expect(saoThienDongGuide?.content).toContain("/kien-thuc-tu-vi/cung-quan-loc-trong-tu-vi");
    expect(saoThienDongGuide?.content).toContain("/kien-thuc-tu-vi/cung-thien-di-trong-tu-vi");
    expect(saoThienDongGuide?.content).toContain("/kien-thuc-tu-vi/cung-tai-bach-trong-tu-vi");
    expect(saoThienDongGuide?.content).toContain("| Vị trí hoặc câu hỏi đang hỏi |");
    expect(saoThienDongGuide?.content).toContain("| Điều kiện cần đối chiếu |");
    expect(saoThienDongGuide?.content).toContain("## Khung causal analysis để đọc sao Thiên Đồng không thành nhãn “dễ thay đổi”");
    expect(saoThienDongGuide?.faqs?.length).toBeGreaterThanOrEqual(3);
  });

  it("ships the sao Liêm Trinh article as a distinct star-intent page with discipline and boundary context", () => {
    const saoLiemTrinhGuide = seedArticles.find((article) => article.slug === "sao-liem-trinh");

    expect(saoLiemTrinhGuide).toBeTruthy();
    expect(saoLiemTrinhGuide?.coverImage).toBe("/articles/sao-liem-trinh.webp");
    expect(saoLiemTrinhGuide?.ogImage).toBe("/articles/sao-liem-trinh.webp");
    expect(saoLiemTrinhGuide?.coverAlt).toContain("lá số tử vi");
    expect(saoLiemTrinhGuide?.coverAlt).toContain("kỷ luật cá nhân");
    expect(saoLiemTrinhGuide?.content).toContain("/kien-thuc-tu-vi/an-sao-la-so-tu-vi");
    expect(saoLiemTrinhGuide?.content).toContain("/kien-thuc-tu-vi/cung-phu-the-trong-tu-vi");
    expect(saoLiemTrinhGuide?.content).toContain("/kien-thuc-tu-vi/cung-phuc-duc-trong-tu-vi");
    expect(saoLiemTrinhGuide?.content).toContain("| Vị trí hoặc câu hỏi đang hỏi |");
    expect(saoLiemTrinhGuide?.content).toContain("| Điều kiện cần đối chiếu |");
    expect(saoLiemTrinhGuide?.content).toContain("## Khung causal analysis để đọc sao Liêm Trinh không thành nhãn “người cứng” hoặc “người nhiều thị phi”");
    expect(saoLiemTrinhGuide?.faqs?.length).toBeGreaterThanOrEqual(3);
  });

  it("ships the interpretation guide as a distinct middle-funnel article with chart-confidence checks", () => {
    const interpretationGuide = seedArticles.find((article) => article.slug === "binh-giai-la-so-tu-vi");

    expect(interpretationGuide).toBeTruthy();
    expect(interpretationGuide?.coverImage).toBe("/articles/binh-giai-la-so-tu-vi.webp");
    expect(interpretationGuide?.ogImage).toBe("/articles/binh-giai-la-so-tu-vi.webp");
    expect(interpretationGuide?.coverAlt).toContain("đối chiếu lá số tử vi");
    expect(interpretationGuide?.coverAlt).toContain("ghi chú giờ sinh");
    expect(interpretationGuide?.content).toContain("/kien-thuc-tu-vi/giai-ma-la-so-tu-vi");
    expect(interpretationGuide?.content).toContain("/kien-thuc-tu-vi/phan-tich-la-so-tu-vi");
    expect(interpretationGuide?.content).toContain("/kien-thuc-tu-vi/gio-sinh-trong-tu-vi");
    expect(interpretationGuide?.content).toContain("| Lớp thông tin trong phần bình giải |");
    expect(interpretationGuide?.content).toContain("| Tình huống người đọc đang gặp |");
    expect(interpretationGuide?.content).toContain("## Khung causal analysis để dùng bình giải đúng cách");
    expect(interpretationGuide?.faqs?.length).toBeGreaterThanOrEqual(3);
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

  it("keeps the precise chart setup article as a material refresh instead of a thin duplicate", () => {
    const preciseSetup = seedArticles.find((article) => article.slug === "lap-la-so-tu-vi-chuan");

    expect(preciseSetup?.date).toBe("2026-06-29");
    expect(preciseSetup?.content).toContain("## Nếu bạn đang phân vân giữa hai khung giờ sinh sát nhau");
    expect(preciseSetup?.content).toContain(
      "| Dấu hiệu khi đối chiếu | Nghiêng về giữ nguyên giờ đang nhập | Nên lập thêm lá số thứ hai để so |",
    );
    expect(preciseSetup?.content).toContain("/kien-thuc-tu-vi/la-so-tu-vi-tron-doi");
  });

  it("keeps the create-chart article as a material refresh with decision support", () => {
    const creationGuide = seedArticles.find((article) => article.slug === "tao-la-so-tu-vi");

    expect(creationGuide?.updatedAt?.toISOString()).toContain("2026-06-29T17:00:00.000Z");
    expect(creationGuide?.content).toContain("## Tạo ngay hay xác minh lại trước?");
    expect(creationGuide?.content).toContain(
      "| Tình huống trước khi nhập lá số | Bạn có thể tạo ngay | Nên dừng lại kiểm tra thêm |",
    );
    expect(creationGuide?.content).toContain("## Ba lỗi người mới hay gặp khi tạo lá số online");
    expect(creationGuide?.content).toContain("/kien-thuc-tu-vi/lap-la-so-tu-vi-chuan");
    expect(creationGuide?.content).toContain("/kien-thuc-tu-vi/phan-tich-la-so-tu-vi");
  });

  it("ships the online chart article as a distinct conversion-support guide with data blocks", () => {
    const onlineGuide = seedArticles.find((article) => article.slug === "la-so-tu-vi-online");

    expect(onlineGuide).toBeTruthy();
    expect(onlineGuide?.coverImage).toBe("/articles/la-so-tu-vi-online.webp");
    expect(onlineGuide?.ogImage).toBe("/articles/la-so-tu-vi-online.webp");
    expect(onlineGuide?.coverAlt).toContain("lá số tử vi online");
    expect(onlineGuide?.coverAlt).toContain("giờ sinh");
    expect(onlineGuide?.content).toContain("| Dữ liệu cần khóa | Vì sao ảnh hưởng mạnh đến phần online | Nếu chưa chắc thì xử lý thế nào |");
    expect(onlineGuide?.content).toContain("| Mục tiêu khi xem | Bản online làm tốt | Khi nào cần đối chiếu thêm |");
    expect(onlineGuide?.content).toContain("/kien-thuc-tu-vi/tao-la-so-tu-vi");
    expect(onlineGuide?.content).toContain("/kien-thuc-tu-vi/lap-la-so-tu-vi-chuan");
    expect(onlineGuide?.content).toContain("/kien-thuc-tu-vi/phan-tich-la-so-tu-vi");
    expect(onlineGuide?.content).toContain("/kien-thuc-tu-vi/la-so-bat-tu-va-tu-vi");
    expect(onlineGuide?.content).toContain("/#lap-la-so");
    expect(onlineGuide?.faqs?.length).toBeGreaterThanOrEqual(3);
  });

  it("ships the bat tu setup article as a distinct workflow guide with data blocks", () => {
    const lapBatTuGuide = seedArticles.find((article) => article.slug === "lap-la-so-bat-tu");

    expect(lapBatTuGuide).toBeTruthy();
    expect(lapBatTuGuide?.coverImage).toBe("/articles/lap-la-so-bat-tu.webp");
    expect(lapBatTuGuide?.ogImage).toBe("/articles/lap-la-so-bat-tu.webp");
    expect(lapBatTuGuide?.coverAlt).toContain("lập lá số bát tự");
    expect(lapBatTuGuide?.coverAlt).toContain("giờ sinh");
    expect(lapBatTuGuide?.content).toContain("| Bước chuẩn bị | Vì sao cần làm trước khi lập bát tự | Nếu còn mơ hồ thì xử lý thế nào |");
    expect(lapBatTuGuide?.content).toContain("| Tình huống người đọc | Nên bắt đầu bằng bát tự | Nên quay về tử vi hoặc kiểm tra thêm |");
    expect(lapBatTuGuide?.content).toContain("/kien-thuc-tu-vi/la-so-bat-tu-va-tu-vi");
    expect(lapBatTuGuide?.content).toContain("/kien-thuc-tu-vi/lap-la-so-tu-vi-can-gi");
    expect(lapBatTuGuide?.content).toContain("/kien-thuc-tu-vi/gio-sinh-trong-tu-vi");
    expect(lapBatTuGuide?.content).toContain("/#lap-la-so");
    expect(lapBatTuGuide?.content).toContain("## Quy trình 5 bước để lập lá số bát tự mà không bị trộn hệ");
    expect(lapBatTuGuide?.faqs?.length).toBeGreaterThanOrEqual(3);
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
          "la-so-tu-vi-online",
          "lap-la-so-bat-tu",
          "lap-la-so-tu-vi-chuan",
          "phan-tich-la-so-tu-vi",
          "la-so-bat-tu-va-tu-vi",
          "chiem-tinh-la-so-va-tu-vi",
          "la-so-tu-vi-mien-phi",
          "giai-ma-la-so-tu-vi",
          "an-sao-la-so-tu-vi",
          "sao-tu-vi",
          "menh-vo-chinh-dieu",
          "tieu-van-la-gi",
          "cung-phu-mau-trong-tu-vi",
          "lap-la-so-tu-vi-can-gi",
          "la-so-tu-vi-tron-doi",
          "la-so-tu-vi-co-thay-doi-khong",
          "menh-tham-lang-la-gi",
          "sao-vu-khuc",
          "sao-tham-lang-trong-tu-vi",
          "cac-sao-trong-la-so-tu-vi",
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

  it("ships the decoding guide as a distinct interpretation-support article with data blocks", () => {
    const decodingGuide = seedArticles.find((article) => article.slug === "giai-ma-la-so-tu-vi");

    expect(decodingGuide).toBeTruthy();
    expect(decodingGuide?.coverImage).toBe("/articles/giai-ma-la-so-tu-vi.webp");
    expect(decodingGuide?.ogImage).toBe("/articles/giai-ma-la-so-tu-vi.webp");
    expect(decodingGuide?.coverAlt).toContain("lá số tử vi");
    expect(decodingGuide?.coverAlt).toContain("Mệnh Thân");
    expect(decodingGuide?.content).toContain("| Ký hiệu hoặc lớp dữ liệu |");
    expect(decodingGuide?.content).toContain("| Tình huống khi đọc lá số |");
    expect(decodingGuide?.content).toContain("/kien-thuc-tu-vi/cung-menh-cung-than");
    expect(decodingGuide?.content).toContain("/kien-thuc-tu-vi/12-cung-trong-la-so-tu-vi");
    expect(decodingGuide?.content).toContain("/kien-thuc-tu-vi/an-sao-la-so-tu-vi");
    expect(decodingGuide?.content).toContain("/kien-thuc-tu-vi/phan-tich-la-so-tu-vi");
    expect(decodingGuide?.content).toContain("/#lap-la-so");
    expect(decodingGuide?.content).toContain("## Khung causal analysis");
    expect(decodingGuide?.faqs?.length).toBeGreaterThanOrEqual(3);
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
    expect(saoTuViGuide?.coverAlt).toContain("laptop");
    expect(saoTuViGuide?.content).toContain("| Câu hỏi thật của người đọc |");
    expect(saoTuViGuide?.content).toContain("| Điều kiện cần kiểm tra |");
    expect(saoTuViGuide?.content).toContain("## Trước khi luận sao Tử Vi, hãy khóa ba dữ liệu nền");
    expect(saoTuViGuide?.content).toContain("| Dữ liệu nền cần khóa |");
    expect(saoTuViGuide?.content).toContain("/kien-thuc-tu-vi/cung-menh-cung-than");
    expect(saoTuViGuide?.content).toContain("/kien-thuc-tu-vi/cung-phu-the-trong-tu-vi");
    expect(saoTuViGuide?.content).toContain("/kien-thuc-tu-vi/gio-sinh-trong-tu-vi");
    expect(saoTuViGuide?.content).toContain("/kien-thuc-tu-vi/lap-la-so-tu-vi-can-gi");
    expect(saoTuViGuide?.content).toContain("/kien-thuc-tu-vi/an-sao-la-so-tu-vi");
    expect(saoTuViGuide?.content).toContain("## Thử ngay trên lá số của bạn");
    expect(saoTuViGuide?.faqs?.length).toBeGreaterThanOrEqual(3);
  });

  it("keeps the sao Tham Lang guide practical, data-rich, and tied to reader intent", () => {
    const saoThamLangGuide = seedArticles.find((article) => article.slug === "sao-tham-lang-trong-tu-vi");

    expect(saoThamLangGuide).toBeTruthy();
    expect(saoThamLangGuide?.coverImage).toBe("/articles/sao-tham-lang-trong-tu-vi.webp");
    expect(saoThamLangGuide?.ogImage).toBe("/articles/sao-tham-lang-trong-tu-vi.webp");
    expect(saoThamLangGuide?.coverAlt).toContain("sao Tham Lang");
    expect(saoThamLangGuide?.coverAlt).toContain("tiền bạc");
    expect(saoThamLangGuide?.content).toContain("| Dữ liệu nền cần khóa |");
    expect(saoThamLangGuide?.content).toContain("| Tình huống cần đọc |");
    expect(saoThamLangGuide?.content).toContain("| Điều kiện làm Tham Lang đổi sắc thái |");
    expect(saoThamLangGuide?.content).toContain("/kien-thuc-tu-vi/cung-tai-bach-trong-tu-vi");
    expect(saoThamLangGuide?.content).toContain("/kien-thuc-tu-vi/cung-quan-loc-trong-tu-vi");
    expect(saoThamLangGuide?.content).toContain("/kien-thuc-tu-vi/cung-phu-the-trong-tu-vi");
    expect(saoThamLangGuide?.content).toContain("/kien-thuc-tu-vi/an-sao-la-so-tu-vi");
    expect(saoThamLangGuide?.content).toContain("## Khung causal analysis");
    expect(saoThamLangGuide?.faqs?.length).toBeGreaterThanOrEqual(3);
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

  it("keeps the tiểu vận guide tied to yearly context, time-layer comparisons, and reader workflow", () => {
    const tieuVanGuide = seedArticles.find((article) => article.slug === "tieu-van-la-gi");

    expect(tieuVanGuide).toBeTruthy();
    expect(tieuVanGuide?.coverImage).toBe("/articles/tieu-van-la-gi.webp");
    expect(tieuVanGuide?.ogImage).toBe("/articles/tieu-van-la-gi.webp");
    expect(tieuVanGuide?.content).toContain("| Lớp vận |");
    expect(tieuVanGuide?.content).toContain("| Điều kiện cần kiểm tra |");
    expect(tieuVanGuide?.content).toContain("/kien-thuc-tu-vi/cung-tai-bach-trong-tu-vi");
    expect(tieuVanGuide?.content).toContain("/kien-thuc-tu-vi/cung-thien-di-trong-tu-vi");
    expect(tieuVanGuide?.content).toContain("## Khung causal analysis");
    expect(tieuVanGuide?.faqs?.length).toBeGreaterThanOrEqual(3);
  });

  it("keeps the Cung Phụ Mẫu guide practical, context-rich, and tied to family-pattern checks", () => {
    const cungPhuMauGuide = seedArticles.find((article) => article.slug === "cung-phu-mau-trong-tu-vi");

    expect(cungPhuMauGuide).toBeTruthy();
    expect(cungPhuMauGuide?.coverImage).toBe("/articles/cung-phu-mau-trong-tu-vi.webp");
    expect(cungPhuMauGuide?.ogImage).toBe("/articles/cung-phu-mau-trong-tu-vi.webp");
    expect(cungPhuMauGuide?.content).toContain("| Câu hỏi thật của người đọc |");
    expect(cungPhuMauGuide?.content).toContain("| Điều kiện cần kiểm tra |");
    expect(cungPhuMauGuide?.content).toContain("/kien-thuc-tu-vi/cung-dien-trach-trong-tu-vi");
    expect(cungPhuMauGuide?.content).toContain("/kien-thuc-tu-vi/cung-phu-the-trong-tu-vi");
    expect(cungPhuMauGuide?.content).toContain("## Khung causal analysis");
    expect(cungPhuMauGuide?.faqs?.length).toBeGreaterThanOrEqual(3);
  });

  it("keeps the setup checklist guide practical, data-rich, and tied to input verification", () => {
    const setupChecklistGuide = seedArticles.find((article) => article.slug === "lap-la-so-tu-vi-can-gi");

    expect(setupChecklistGuide).toBeTruthy();
    expect(setupChecklistGuide?.coverImage).toBe("/articles/lap-la-so-tu-vi-can-gi.webp");
    expect(setupChecklistGuide?.ogImage).toBe("/articles/lap-la-so-tu-vi-can-gi.webp");
    expect(setupChecklistGuide?.content).toContain("| Dữ liệu cần có |");
    expect(setupChecklistGuide?.content).toContain("| Tình huống đầu vào |");
    expect(setupChecklistGuide?.content).toContain("/kien-thuc-tu-vi/gio-sinh-trong-tu-vi");
    expect(setupChecklistGuide?.content).toContain("/kien-thuc-tu-vi/lap-la-so-tu-vi-chuan");
    expect(setupChecklistGuide?.content).toContain("## Khung causal analysis");
    expect(setupChecklistGuide?.faqs?.length).toBeGreaterThanOrEqual(3);
  });

  it("keeps the birth-date-only guide scoped, data-rich, and clear about confidence limits", () => {
    const birthDateGuide = seedArticles.find((article) => article.slug === "la-so-tu-vi-theo-ngay-thang-nam-sinh");

    expect(birthDateGuide).toBeTruthy();
    expect(birthDateGuide?.coverImage).toBe("/articles/la-so-tu-vi-theo-ngay-thang-nam-sinh.webp");
    expect(birthDateGuide?.ogImage).toBe("/articles/la-so-tu-vi-theo-ngay-thang-nam-sinh.webp");
    expect(birthDateGuide?.content).toContain("| Dữ liệu hiện có |");
    expect(birthDateGuide?.content).toContain("| Phần của lá số |");
    expect(birthDateGuide?.content).toContain("| Lớp dữ liệu trên app |");
    expect(birthDateGuide?.content).toContain("/kien-thuc-tu-vi/gio-sinh-trong-tu-vi");
    expect(birthDateGuide?.content).toContain("/kien-thuc-tu-vi/lap-la-so-tu-vi-chuan");
    expect(birthDateGuide?.content).toContain("## Khung causal analysis");
    expect(birthDateGuide?.content).toContain("đừng chờ đủ hoàn hảo mới bắt đầu");
    expect(birthDateGuide?.faqs?.length).toBeGreaterThanOrEqual(3);
  });

  it("keeps the trọn đời guide long-horizon, data-rich, and bounded by real-life checks", () => {
    const tronDoiGuide = seedArticles.find((article) => article.slug === "la-so-tu-vi-tron-doi");

    expect(tronDoiGuide).toBeTruthy();
    expect(tronDoiGuide?.coverImage).toBe("/articles/la-so-tu-vi-tron-doi.webp");
    expect(tronDoiGuide?.ogImage).toBe("/articles/la-so-tu-vi-tron-doi.webp");
    expect(tronDoiGuide?.content).toContain("| Lớp dữ liệu |");
    expect(tronDoiGuide?.content).toContain("| Câu hỏi người đọc hay đặt |");
    expect(tronDoiGuide?.content).toContain("/kien-thuc-tu-vi/cung-menh-cung-than");
    expect(tronDoiGuide?.content).toContain("/kien-thuc-tu-vi/cung-quan-loc-trong-tu-vi");
    expect(tronDoiGuide?.content).toContain("/kien-thuc-tu-vi/tieu-van-la-gi");
    expect(tronDoiGuide?.content).toContain("## Khung causal analysis để đọc lá số tử vi trọn đời cho đúng");
    expect(tronDoiGuide?.content).toContain("không phải lời đóng đinh cho toàn bộ tương lai");
    expect(tronDoiGuide?.faqs?.length).toBeGreaterThanOrEqual(3);
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
