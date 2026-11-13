export const QUAN_STEPS = {
  teacher_click: "Bấm Xem Tử Vi",
  queue_wait: "Thấy màn hình chờ bàn",
  queue_leave: "Chủ động rời hàng chờ",
  seat_ready: "Có lời mời vào bàn",
  birth_view: "Thấy phần nhập thông tin sinh",
  birth_submit: "Gửi thông tin sinh",
  birth_ready: "Lập lá số thành công",
  birth_error: "Gửi thông tin sinh gặp lỗi",
  start_click: "Bấm Bắt đầu xem",
  start_error: "Bắt đầu xem gặp lỗi",
  question_send: "Gửi câu hỏi",
  answer_ready: "Nhận câu trả lời mới",
  question_error: "Câu hỏi gặp lỗi",
  mic_error: "Mở micro gặp lỗi",
  checkout_15: "Chọn gói 15 phút",
  checkout_30: "Chọn gói 30 phút",
  checkout_ready: "Nhận mã QR hoặc link PayOS",
  checkout_error: "Tạo đơn gặp lỗi",
  payment_link: "Bấm mở trang PayOS",
} as const;

export type QuanStep = keyof typeof QUAN_STEPS;
