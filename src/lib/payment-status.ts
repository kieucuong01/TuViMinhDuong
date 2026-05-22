export type PaymentStatusNotice = {
  tone: "success" | "warning" | "info";
  message: string;
};

export function paymentReturnNotice(status?: string | null, orderCode?: string | null): PaymentStatusNotice | null {
  if (!status) return null;
  const orderSuffix = orderCode ? ` Mã đơn: ${orderCode}.` : "";

  if (status === "demo-paid") {
    return {
      tone: "success",
      message: `Đã cộng xu vào phiên hiện tại.${orderSuffix}`,
    };
  }

  if (status === "success") {
    return {
      tone: "info",
      message: `Thanh toán đã được chuyển về website. Hệ thống sẽ cộng xu khi nhận webhook xác nhận từ PayOS.${orderSuffix}`,
    };
  }

  if (status === "cancelled") {
    return {
      tone: "warning",
      message: `Thanh toán đã bị hủy hoặc chưa hoàn tất. Xu chưa được cộng.${orderSuffix}`,
    };
  }

  if (status === "failed" || status === "expired") {
    return {
      tone: "warning",
      message: `Thanh toán không thành công hoặc đã hết hạn. Xu chưa được cộng.${orderSuffix}`,
    };
  }

  return null;
}
