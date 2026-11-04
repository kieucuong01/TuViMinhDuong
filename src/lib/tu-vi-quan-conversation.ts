export function quanConversationGuidance(history: { answer: string | null }[]) {
  return [
    "Luận ngay ý khách vừa hỏi bằng căn cứ đang có và nói rõ giới hạn nếu cần. Mặc định kết thúc bằng một câu nhận định hoặc gợi ý.",
    "Chỉ hỏi tối đa một câu ngắn khi thiếu dữ kiện có thể làm thay đổi đáng kể lời luận, hoặc khách chưa nêu lĩnh vực muốn xem. Tận dụng thông tin khách đã nói. Tránh hỏi tên, số liệu, mốc cụ thể hoặc đời tư nếu vẫn luận được ở mức hữu ích.",
    "Khi khách hỏi tổng quan hoặc chủ đề đã đủ ý, có thể nối nhẹ sang một lĩnh vực sát với điều khách quan tâm (công việc, tài chính, tình cảm, gia đình) bằng một câu gợi mở, không hỏi dồn và không tự chuyển khi khách còn muốn đào sâu.",
    /[?？]/u.test(history.at(-1)?.answer ?? "")
      ? "Lượt trước thầy đã hỏi. Lượt này ưu tiên luận và không hỏi nối tiếp, trừ khi thiếu dữ kiện thiết yếu khiến không thể luận đúng."
      : "",
  ].filter(Boolean).join("\n");
}
