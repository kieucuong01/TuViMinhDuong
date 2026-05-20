export type ReadingKey = "FULL" | "PALACE" | "DAI_VAN" | "NGUYET_VAN" | "NHAT_VAN";

// Production paywall mode: paid readings require coins unless the user is an admin.
export const TEMPORARY_FULL_ACCESS = false;

export const FEATURE_PRICES: Record<ReadingKey, { label: string; priceCoins: number }> = {
  FULL: { label: "Luận giải toàn bộ", priceCoins: 199 },
  PALACE: { label: "Luận cung", priceCoins: 29 },
  DAI_VAN: { label: "Luận đại vận", priceCoins: 49 },
  NGUYET_VAN: { label: "Luận nguyệt vận", priceCoins: 19 },
  NHAT_VAN: { label: "Luận nhật vận", priceCoins: 9 },
};

export const COIN_PACKAGES = [
  { key: "starter", label: "Gói khởi đầu", coins: 99, bonusCoins: 0, priceVnd: 99000 },
  { key: "full-reading", label: "Gói luận toàn bộ", coins: 199, bonusCoins: 10, priceVnd: 199000 },
  { key: "pro", label: "Gói chuyên sâu", coins: 499, bonusCoins: 60, priceVnd: 499000 },
];
