import { NextResponse } from "next/server";
import { getChart } from "@/lib/data";
import { generateWithLlmRouter } from "@/lib/llm-router";

function fallbackAssistantAnswer(question: string, chartName: string, summary: string[]) {
  const normalized = question.toLowerCase();

  if (normalized.includes("quan") || normalized.includes("công việc") || normalized.includes("su nghiep") || normalized.includes("sự nghiệp")) {
    return `Với lá số của ${chartName}, phần nên xem trước là Cung Quan Lộc và Đại vận hiện tại. ${summary[0] || ""} Khi đọc về công việc, bạn nên đối chiếu thêm cung Mệnh, Tài Bạch và Thiên Di để tránh kết luận một chiều.`;
  }

  if (normalized.includes("năm") || normalized.includes("nam nay") || normalized.includes("năm nay")) {
    return `Năm xem nên được đọc như một lớp xu hướng, không phải kết luận tuyệt đối. Với ${chartName}, bạn có thể bắt đầu từ Tiểu vận, Nhật vận/Nguyệt vận và các cung đang có sao kích hoạt mạnh. ${summary[1] || summary[0] || ""}`;
  }

  if (normalized.includes("mạnh") || normalized.includes("diem manh") || normalized.includes("điểm mạnh")) {
    return `Điểm mạnh nên nhìn từ bộ Mệnh, Thân và các chính tinh sáng trong 12 cung. Với ${chartName}, phần tóm tắt hiện có cho thấy: ${summary.slice(0, 2).join(" ")} Mình gợi ý mở Luận cung Mệnh trước, sau đó xem Quan Lộc hoặc Tài Bạch tùy mục tiêu của bạn.`;
  }

  return `Mình đã đọc theo dữ liệu lá số hiện tại của ${chartName}. ${summary[0] || "Bạn có thể bắt đầu bằng phần tổng quan miễn phí, sau đó mở khóa luận cung để đi sâu từng lĩnh vực."} Nếu muốn câu trả lời cụ thể hơn, hãy hỏi về một cung như Mệnh, Quan Lộc, Tài Bạch hoặc một mốc vận hạn.`;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { chartId?: string; question?: string };
    const chartId = String(body.chartId || "").trim();
    const question = String(body.question || "").trim().slice(0, 600);

    if (!chartId || !question) {
      return NextResponse.json({ error: "Thiếu mã lá số hoặc câu hỏi." }, { status: 400 });
    }

    const record = await getChart(chartId);
    if (!record) {
      return NextResponse.json({ error: "Không tìm thấy lá số." }, { status: 404 });
    }

    const prompt = `Bạn là trợ lý tử vi Việt Nam trong một website lập lá số. Trả lời ngắn gọn, ấm, thực tế, không khẳng định tuyệt đối và chỉ dựa vào JSON lá số.

Câu hỏi: ${question}
Lá số JSON:
${JSON.stringify(record.chart, null, 2)}

Yêu cầu:
- Trả lời bằng tiếng Việt, tối đa 120 từ.
- Nếu cần luận sâu, gợi ý người dùng mở đúng mục: Luận cung, Đại vận, Nguyệt vận, Nhật vận hoặc Luận giải toàn bộ.
- Không tự tính lại lá số.`;

    const generated = await generateWithLlmRouter({
      prompt,
      temperature: 0.5,
      maxTokens: 500,
    });

    if (generated) {
      return NextResponse.json({ answer: generated.text, model: generated.model });
    }

    return NextResponse.json({
      answer: fallbackAssistantAnswer(question, record.chart.input.fullName, record.chart.summary),
      model: "template-fallback",
    });
  } catch {
    return NextResponse.json({ error: "Không thể xử lý câu hỏi lúc này." }, { status: 500 });
  }
}
