import { PackageCheck } from "lucide-react";
import { requestReadingBundleAction } from "@/app/actions";
import { LoadingSubmitButton } from "@/components/loading-submit-button";
import { formatCoins } from "@/lib/format";
import { readingBundleItemPrice, readingBundleLabel, type ReadingBundleKey } from "@/lib/reading-bundles";

type ReadingBundleCtaProps = {
  chartId: string;
  type: ReadingBundleKey;
  nextPath: string;
  totalCount: number;
  unlockedCount: number;
  hasBundleAccess: boolean;
  unitPriceCoins: number;
};

export function ReadingBundleCta({ chartId, type, nextPath, totalCount, unlockedCount, hasBundleAccess, unitPriceCoins }: ReadingBundleCtaProps) {
  const remainingCount = Math.max(0, totalCount - unlockedCount);
  const label = readingBundleLabel(type);
  const bundlePrice = readingBundleItemPrice(unitPriceCoins, remainingCount);

  return (
    <section className="reading-bundle-cta" aria-label={`Gói trọn nhóm ${label}`}>
      <div>
        <p className="eyebrow">Mua 1 lần tiết kiệm</p>
        <h2>Trọn nhóm {label}</h2>
        <p>
          Mở toàn bộ {remainingCount || totalCount} phần còn lại trong nhóm này với giá bằng 50% so với mua từng phần.
          Sau khi mua, bấm từng mục để tạo bài luận chi tiết và không trừ xu thêm.
        </p>
      </div>
      <div className="reading-bundle-action">
        <span>
          <PackageCheck size={18} /> {hasBundleAccess || remainingCount === 0 ? "Đã mở gói" : formatCoins(bundlePrice)}
        </span>
        {hasBundleAccess || remainingCount === 0 ? (
          <small>Những mục trong nhóm này sẽ không trừ xu khi mở chi tiết.</small>
        ) : (
          <form action={requestReadingBundleAction} data-loading-message={`Đang mở trọn nhóm ${label}...`} data-loading-label="Đang mở gói...">
            <input type="hidden" name="chartId" value={chartId} />
            <input type="hidden" name="type" value={type} />
            <input type="hidden" name="next" value={nextPath} />
            <LoadingSubmitButton className="btn btn-primary w-full" loadingText="Đang mở gói...">
              Mua trọn nhóm - {formatCoins(bundlePrice)}
            </LoadingSubmitButton>
            <small>
              Đã mở {unlockedCount}/{totalCount}. Giá gói chỉ tính trên phần còn lại.
            </small>
          </form>
        )}
      </div>
    </section>
  );
}
