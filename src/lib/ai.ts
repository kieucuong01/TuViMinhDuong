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
Trọng tâm của phần này là ${focus.title}. Lá số cho thấy ${chart.summary.join(" ")} Vì vậy, phần luận giải nên được đọc như một bản định hướng: giúp nhận diện xu hướng, điểm mạnh, điểm cần thận trọng và nhịp hành động phù hợp trong năm ${chart.input.viewYear}.

## Điểm mạnh
- Có nền tảng để phát triển theo hướng bền bỉ, tích lũy qua từng giai đoạn.
- Các cung/sao hỗ trợ nên được xem là vùng thuận lợi để chủ động mở rộng.
- Khi có kế hoạch rõ ràng, lá số này dễ phát huy tốt hơn so với hành động theo cảm xúc nhất thời.

## Điểm cần lưu ý
- Không nên hiểu luận giải như một kết luận tuyệt đối; các sao khó nên được dùng như tín hiệu quản trị rủi ro.
- Cần tránh quyết định vội trong tài chính, quan hệ hoặc công việc khi dữ liệu thực tế chưa đủ rõ.
- Nếu gặp giai đoạn áp lực, nên ưu tiên nhịp ổn định, sức khỏe và khả năng phục hồi.

## Gợi ý hành động
1. Chọn một mục tiêu chính trong 30 ngày tới và chia thành các bước nhỏ có thể đo lường.
2. Với việc quan trọng, nên đối chiếu giữa mong muốn cá nhân, điều kiện thực tế và lời khuyên từ người có kinh nghiệm.
3. Ghi lại các dấu hiệu thuận lợi/khó khăn trong tháng để điều chỉnh nhịp hành động thay vì phản ứng vội.

## Mốc thời gian nên chú ý
- Ngắn hạn: tập trung xử lý việc tồn đọng và làm rõ ưu tiên.
- Trung hạn: củng cố kỹ năng, quan hệ hỗ trợ và kế hoạch tài chính.
- Dài hạn: xây nền ổn định trước khi mở rộng mạnh.

## Kết luận ngắn
Lá số này phù hợp với cách đi chắc, biết chọn thời điểm và tránh cực đoan. Bạn nên dùng bản luận giải như một phần tham khảo để hiểu mình hơn và ra quyết định tỉnh táo hơn.`;
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
  5. ## Điểm cần lưu ý
  6. ## Gợi ý hành động
  7. ## Mốc thời gian nên chú ý
  8. ## Kết luận ngắn
- Mỗi mục 1-3 đoạn ngắn hoặc 3-5 bullet, ưu tiên lời khuyên thực tế, dễ đọc trên điện thoại.
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
