import { type TuViChart } from "@/lib/chart";
import { FEATURE_PRICES, type ReadingKey } from "@/lib/pricing";

function starsWithStates(chart: TuViChart, stars: string[], palaceName: string, fallback: string) {
  const palace = chart.palaces.find((item) => item.name === palaceName);
  if (!stars.length) return fallback;
  return stars.map((star) => {
    const state = palace?.starStates?.[star];
    return state ? `${star} (${state})` : star;
  }).join(", ");
}

function getFocusData(chart: TuViChart, type: ReadingKey, scopeKey: string) {
  const palace = chart.palaces.find((item) => item.name === scopeKey || item.branch === scopeKey);
  if (palace) {
    return {
      title: `${palace.name} tại ${palace.branch}`,
      evidence: [
        `Chính tinh: ${starsWithStates(chart, palace.mainStars, palace.name, "không có")}`,
        `Phụ tinh: ${starsWithStates(chart, palace.supportStars, palace.name, "bình hòa")}`,
        `Lưu niên: ${starsWithStates(chart, palace.yearlyStars, palace.name, "không nổi bật")}`,
        `Vòng trường sinh: ${palace.lifecycle}`,
      ],
    };
  }

  const currentDecade = chart.daiVan.find((item) => {
    const age = chart.input.viewYear - chart.solar.year;
    const [start, end] = item.range.split("-").map(Number);
    return age >= start && age <= end;
  });

  return {
    title: `${FEATURE_PRICES[type].label} - ${scopeKey}`,
    evidence: [
      `Mệnh: ${chart.menh}`,
      `Thân: ${chart.than}`,
      `Cục: ${chart.cuc}`,
      `Cân lượng cốt: ${chart.boneWeight?.label || "đang cập nhật"}`,
      `Lai nhân: ${chart.laiNhan || "đang cập nhật"}`,
      `Âm dương: ${chart.amDuong}`,
      currentDecade ? `Đại vận hiện tại: ${currentDecade.range} tuổi tại cung ${currentDecade.palace}` : `Năm xem: ${chart.input.viewYear}`,
    ],
  };
}

function fallbackReading(chart: TuViChart, type: ReadingKey, scopeKey: string) {
  const feature = FEATURE_PRICES[type];
  const focus = getFocusData(chart, type, scopeKey);

  return `# ${feature.label} cho ${chart.input.fullName}

## Thông tin lá số đã dùng
- ${focus.evidence.join("\n- ")}
- Phần luận giải dựa trên lá số đã lập, không tự ý đổi ngày giờ hay cung sao.

## Tổng quan
Trọng tâm của phần này là ${focus.title}. Lá số cho thấy ${chart.summary.join(" ")}

Nên đọc phần này như bản định hướng: hiểu xu hướng chính, biết việc nên ưu tiên và tránh quyết định vội trong năm ${chart.input.viewYear}.

## Điểm mạnh
- Có khả năng tích lũy từng bước, hợp với cách đi chắc và có kế hoạch.
- Khi mục tiêu rõ ràng, bạn dễ phát huy năng lực ổn định hơn là chạy theo cảm xúc nhất thời.
- Các cung/sao thuận lợi nên được xem là vùng có thể chủ động mở rộng.

## Điều cần lưu ý
- Không nên xem luận giải như kết luận tuyệt đối; các sao khó là tín hiệu để quản trị rủi ro.
- Tránh quyết định vội khi thông tin về tiền bạc, quan hệ hoặc công việc chưa đủ rõ.
- Khi áp lực tăng, nên giữ nhịp sinh hoạt ổn định trước khi mở rộng việc lớn.

## Công việc
- Nên chọn một mục tiêu chính trong 30 ngày tới và chia thành các bước nhỏ.
- Việc quan trọng nên có lịch kiểm tra lại, tránh làm theo cảm hứng rồi bỏ dở.
- Nếu đang đổi hướng nghề nghiệp, hãy ưu tiên học kỹ năng và xây uy tín trước.

## Tài chính
- Hợp với cách quản lý tiền có kế hoạch, ghi rõ thu chi và hạn mức rủi ro.
- Không nên đầu tư hoặc mua sắm lớn khi chỉ dựa vào cảm xúc nhất thời.
- Nếu có cơ hội mới, hãy kiểm tra dòng tiền và phương án dự phòng trước.

## Tình cảm
- Nên nói rõ nhu cầu và kỳ vọng, tránh để im lặng kéo dài thành hiểu nhầm.
- Với gia đình hoặc người thân, sự ổn định và trách nhiệm vẫn là điểm cần giữ.
- Khi có mâu thuẫn, nên xử lý bằng trao đổi chậm rãi hơn là phản ứng ngay.

## Sức khỏe
- Cần chú ý nhịp nghỉ ngơi, giấc ngủ và mức căng thẳng tinh thần.
- Nếu đang làm việc quá tải, nên giảm bớt việc phụ trước khi cơ thể lên tiếng.
- Luận giải chỉ mang tính tham khảo, không thay thế tư vấn y tế chuyên môn.

## Vận hạn năm
- Năm ${chart.input.viewYear} nên ưu tiên việc có nền tảng, có kiểm chứng và có người hỗ trợ.
- Các sao hãm, sát tinh hoặc lưu sát tinh nếu xuất hiện cần được xem là lời nhắc cẩn trọng, không phải điều để lo sợ.
- Cách tốt nhất là đi đều, kiểm tra rủi ro sớm và giữ một kế hoạch dự phòng.`;
}

export async function generateReading(chart: TuViChart, type: ReadingKey, scopeKey: string) {
  const model = process.env.AI_MODEL || "openai/gpt-5.4";
  const focus = getFocusData(chart, type, scopeKey);
  const prompt = `Bạn là chuyên gia tử vi Việt Nam. Viết luận giải tiếng Việt rõ ràng, dễ hiểu cho người đọc 30-60 tuổi, có trách nhiệm, không mê tín cực đoan.

Loại luận: ${FEATURE_PRICES[type].label}
Phạm vi: ${scopeKey}
Trọng tâm dữ liệu: ${focus.title}
Nguồn dữ liệu nổi bật:
- ${focus.evidence.join("\n- ")}

Dữ liệu lá số JSON:
${JSON.stringify(chart, null, 2)}

Yêu cầu bắt buộc:
- Không tự tính lại lá số, chỉ dùng dữ liệu JSON và nguồn dữ liệu nổi bật.
- Không khẳng định tuyệt đối, không dọa nạt, không hứa chắc kết quả.
- Khi sao có trạng thái (H), sát tinh hoặc lưu sát tinh như L.Kình Dương/L.Đà La/L.Tang Môn/L.Bạch Hổ/L.Thiên Khốc/L.Thiên Hư, phải xem là tín hiệu rủi ro cần quản trị; không được bỏ qua trong luận vận hạn.
- Viết theo đúng Markdown với các mục theo thứ tự, đoạn văn ngắn, tránh thuật ngữ kỹ thuật:
  1. # ${FEATURE_PRICES[type].label} cho ${chart.input.fullName}
  2. ## Thông tin lá số đã dùng
  3. ## Tổng quan
  4. ## Điểm mạnh
  5. ## Điều cần lưu ý
  6. ## Công việc
  7. ## Tài chính
  8. ## Tình cảm
  9. ## Sức khỏe
  10. ## Vận hạn năm
- Mỗi mục 2-4 bullet hoặc 1-2 đoạn ngắn, mỗi đoạn tối đa 3 dòng khi đọc trên điện thoại.
- Tránh viết thành một khối văn dài. Ưu tiên câu ngắn, rõ, thực tế, dễ hiểu cho người đọc 30-60 tuổi.
- Với luận cung, liên hệ rõ cung đang xét với sao chính/phụ tinh.
- Với đại vận/nguyệt vận/nhật vận, nêu rõ nhịp thời gian và việc nên ưu tiên.`;

  if (!process.env.VERCEL_OIDC_TOKEN && !process.env.AI_GATEWAY_API_KEY) {
    return { content: fallbackReading(chart, type, scopeKey), model: "template-fallback", prompt };
  }

  try {
    const { generateText } = await import("ai");
    const result = await generateText({ model, prompt });
    return { content: result.text, model, prompt };
  } catch {
    return { content: fallbackReading(chart, type, scopeKey), model: "template-fallback", prompt };
  }
}
