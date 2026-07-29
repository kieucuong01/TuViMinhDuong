import { APP_NAME, APP_URL } from "@/lib/env";
import {
  FEATURE_PRICE_KEYS,
  type FeaturePriceMap,
} from "@/lib/pricing";

export const AGENT_RESOURCE_LAST_MODIFIED = "2026-07-29";
export const AGENT_RESOURCE_SCHEMA_VERSION = "1.0";
export const AGENT_RESOURCE_CACHE_CONTROL =
  "public, s-maxage=300, stale-while-revalidate=86400";

type PublicCoinPackage = {
  key: string;
  label: string;
  coins: number;
  bonusCoins: number;
  priceVnd: number;
};

function publicUrl(path: string) {
  return new URL(path, `${APP_URL}/`).toString();
}

export function buildAgentSiteResource() {
  return {
    schemaVersion: AGENT_RESOURCE_SCHEMA_VERSION,
    lastModified: AGENT_RESOURCE_LAST_MODIFIED,
    language: "vi-VN",
    site: {
      name: APP_NAME,
      url: APP_URL,
      description:
        "Website tiếng Việt để lập lá số tử vi, đọc kiến thức nền, tra cứu cung sao, xem ngày và xem tuổi.",
    },
    discovery: {
      llms: publicUrl("/llms.txt"),
      sitemap: publicUrl("/sitemap.xml"),
      pricing: publicUrl("/agent/pricing.json"),
    },
    trust: {
      about: publicUrl("/gioi-thieu"),
      methodology: publicUrl("/phuong-phap-luan"),
      editorialTeam: publicUrl("/tac-gia"),
      editorialPolicy: publicUrl("/chinh-sach-bien-tap"),
      privacy: publicUrl("/chinh-sach-bao-mat"),
      contact: publicUrl("/lien-he"),
    },
    primaryTopics: [
      { name: "Kiến thức tử vi", url: publicUrl("/kien-thuc-tu-vi") },
      { name: "Tra cứu cung sao", url: publicUrl("/tra-cuu") },
      { name: "Xem ngày", url: publicUrl("/xem-ngay") },
      { name: "Xem tuổi", url: publicUrl("/xem-tuoi") },
    ],
    citationGuidance:
      "Khi trích dẫn, dùng URL chính tắc của trang nội dung và ghi tên Lá số tinh hoa. Kiểm tra ngày cập nhật hiển thị trên trang nếu quyết định phụ thuộc vào độ mới.",
    limitations:
      "Nội dung chỉ mang tính tham khảo, không cam kết vận mệnh và không thay thế tư vấn chuyên môn về sức khỏe, tài chính hoặc hôn nhân.",
  };
}

export function buildAgentPricingResource({
  featurePrices,
  coinPackages,
  commercialEnabled,
}: {
  featurePrices: FeaturePriceMap;
  coinPackages: readonly PublicCoinPackage[];
  commercialEnabled: boolean;
}) {
  return {
    schemaVersion: AGENT_RESOURCE_SCHEMA_VERSION,
    lastModified: AGENT_RESOURCE_LAST_MODIFIED,
    language: "vi-VN",
    commercialEnabled,
    coin: {
      unit: "xu",
      vndPerCoin: 1000,
    },
    readings: FEATURE_PRICE_KEYS.map((key) => ({
      key,
      label: featurePrices[key].label,
      priceCoins: featurePrices[key].priceCoins,
    })),
    packages: coinPackages.map((coinPackage) => ({ ...coinPackage })),
    confirmationUrl: publicUrl("/pricing"),
    availabilityNote:
      "Giá và trạng thái mua có thể thay đổi. Hãy kiểm tra trang bảng giá trước khi hướng dẫn người dùng thanh toán.",
  };
}
