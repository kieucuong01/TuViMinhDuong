import { type TuViChart } from "@/lib/chart";
import { generateWithLlmRouter } from "@/lib/llm-router";
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

function compactStars(chart: TuViChart, palaceName: string, stars: string[], fallback: string, limit = 10) {
  if (!stars.length) return fallback;
  const visible = stars.slice(0, limit).map((star) => {
    const state = chart.palaces.find((item) => item.name === palaceName)?.starStates?.[star];
    return state ? `${star} (${state})` : star;
  });
  const remaining = stars.length - visible.length;
  return remaining > 0 ? `${visible.join(", ")} + ${remaining} sao khác` : visible.join(", ");
}

function compactPalaceContext(chart: TuViChart) {
  return chart.palaces
    .map((palace) => {
      const labels = [palace.isMenh ? "Mệnh" : "", palace.isThan ? "Thân" : ""].filter(Boolean).join(", ");
      return [
        `${palace.name}${labels ? ` [${labels}]` : ""} tại ${palace.branch}`,
        `đại vận ${palace.ageRange}`,
        `trường sinh ${palace.lifecycle}`,
        `chính tinh: ${compactStars(chart, palace.name, palace.mainStars, "vô chính diệu", 4)}`,
        `phụ tinh: ${compactStars(chart, palace.name, palace.supportStars, "không nổi bật", 9)}`,
        `sao lưu năm: ${compactStars(chart, palace.name, palace.yearlyStars, "không nổi bật", 7)}`,
      ].join("; ");
    })
    .join("\n");
}

function compactDecadeContext(chart: TuViChart) {
  const currentAge = chart.input.viewYear - chart.solar.year;
  const current = chart.daiVan.find((period) => {
    const [start, end] = period.range.split("-").map(Number);
    return currentAge >= start && currentAge <= end;
  });
  const allPeriods = chart.daiVan.map((period) => `${period.range} tuổi: ${period.palace} (${period.branch})`).join("; ");
  return {
    currentAge,
    current: current ? `${current.range} tuổi tại cung ${current.palace} (${current.branch})` : "không xác định",
    allPeriods,
  };
}

function freeOverviewPrompt(chart: TuViChart) {
  const menhPalace = chart.palaces.find((item) => item.name === "Mệnh");
  const thanPalace = chart.palaces.find((item) => item.name === chart.than?.replace("Thân cư ", ""));
  const decade = compactDecadeContext(chart);
  const mainEvidence = [
    `Họ tên: ${chart.input.fullName}`,
    `Giới tính: ${chart.input.gender === "male" ? "Nam" : "Nữ"}`,
    `Dương lịch: ${chart.solar.day}/${chart.solar.month}/${chart.solar.year}`,
    `Năm sinh: ${chart.solar.year} - ${chart.canChi.year}`,
    `Âm lịch: ${chart.lunar.day}/${chart.lunar.month}/${chart.lunar.year}`,
    `Can chi tháng/ngày/giờ: ${chart.canChi.month} / ${chart.canChi.day} / ${chart.canChi.hour}`,
    `Năm xem: ${chart.input.viewYear}, tuổi xem: ${decade.currentAge}`,
    `Mệnh: ${chart.menh}`,
    `Thân: ${chart.than}`,
    `Cục: ${chart.cuc}`,
    `Bản mệnh: ${chart.banMenh}`,
    `Mệnh chủ: ${chart.menhChu}`,
    `Thân chủ: ${chart.thanChu}`,
    `Mệnh cục: ${chart.menhCucRelation}`,
    `Âm dương: ${chart.amDuong}`,
    `Cân lượng: ${chart.boneWeight?.label || "đang cập nhật"}`,
    `Lai nhân cung: ${chart.laiNhan || "đang cập nhật"}`,
    `Đại vận hiện tại: ${decade.current}`,
    menhPalace ? `Cung Mệnh: ${starsWithStates(chart, menhPalace.mainStars, menhPalace.name, "vô chính diệu")}` : "",
    thanPalace ? `Cung Thân: ${starsWithStates(chart, thanPalace.mainStars, thanPalace.name, "vô chính diệu")}` : "",
    `Tóm tắt engine: ${chart.summary.join(" ")}`,
  ].filter(Boolean);

  return `Bạn là chuyên gia tử vi Việt Nam. Viết phần luận giải tổng quan MIỄN PHÍ cho người đọc 30-60 tuổi, rõ ràng, nhẹ nhàng, không mê tín cực đoan.

Dữ liệu được phép dùng:
- ${mainEvidence.join("\n- ")}

Dữ liệu 12 cung đã an sao, dùng để hiểu tổng quan nhưng KHÔNG luận chi tiết từng cung trong bản miễn phí:
${compactPalaceContext(chart)}

Đại vận toàn cục:
${decade.allPeriods}

Yêu cầu:
- Không tự tính lại lá số, chỉ dùng dữ liệu trên.
- Đây là 1 prompt duy nhất cho bản miễn phí; hãy tự tổng hợp đủ thông tin từ dữ liệu đã cấp, không yêu cầu gọi thêm API.
- Không hứa chắc kết quả, không dọa nạt.
- Viết khoảng 500-800 chữ, dễ đọc trên điện thoại.
- Đây là bản miễn phí: chỉ nêu tổng quan và gợi ý đọc lá số, không luận chi tiết đủ 12 cung, không thay thế bản chuyên sâu.
- Markdown đúng thứ tự:
  ## Tổng quan miễn phí
  ## Mệnh và Thân nói gì
  ## Điểm mạnh dễ phát huy
  ## Điều nên lưu ý
  ## Gợi ý cho năm ${chart.input.viewYear}
Mỗi mục 1-2 đoạn ngắn hoặc 2-3 bullet.`;
}

function fallbackFreeOverview(chart: TuViChart) {
  const menhPalace = chart.palaces.find((item) => item.name === "Mệnh");
  const thanName = chart.than?.replace("Thân cư ", "");
  const thanPalace = chart.palaces.find((item) => item.name === thanName);
  const menhStars = menhPalace ? starsWithStates(chart, menhPalace.mainStars, menhPalace.name, "vô chính diệu") : "đang cập nhật";
  const thanStars = thanPalace ? starsWithStates(chart, thanPalace.mainStars, thanPalace.name, "vô chính diệu") : "đang cập nhật";

  return `## Tổng quan miễn phí
Lá số của ${chart.input.fullName} được lập theo năm xem ${chart.input.viewYear}. Phần miễn phí này giúp bạn nắm hướng đọc chính trước khi đi sâu vào từng cung và từng vận.

${chart.summary.join(" ")}

## Mệnh và Thân nói gì
- Mệnh thuộc ${chart.menh}, cục là ${chart.cuc}, âm dương là ${chart.amDuong}.
- Cung Mệnh có ${menhStars}. Đây là nhóm tín hiệu dùng để đọc khí chất, cách phản ứng và xu hướng phát triển ban đầu.
- ${chart.than} có ${thanStars}. Thân thường cho thấy môi trường hành động rõ hơn khi trưởng thành.

## Điểm mạnh dễ phát huy
- Nên phát huy những việc có kế hoạch rõ, làm từng bước và có kiểm chứng.
- Khi đã chọn được hướng chính, bạn dễ ổn định hơn nếu giữ nhịp làm việc đều.
- Các cung sáng trong lá số nên được xem như vùng có thể chủ động mở rộng, đặc biệt khi có người hỗ trợ hoặc môi trường phù hợp.

## Điều nên lưu ý
- Tử vi nên được dùng như bản tham khảo để quản trị rủi ro, không phải kết luận tuyệt đối.
- Nếu gặp sao hãm, sát tinh hoặc vận khó, nên hiểu đó là lời nhắc để làm chậm lại, kiểm tra kỹ tiền bạc, giấy tờ và quan hệ.
- Tránh quyết định lớn khi cảm xúc đang mạnh hoặc thông tin chưa đủ rõ.

## Gợi ý cho năm ${chart.input.viewYear}
- Ưu tiên việc có nền tảng, có người hỗ trợ và có kế hoạch dự phòng.
- Việc mới nên thử nhỏ trước, sau đó mới mở rộng.
- Nếu muốn đọc sâu hơn, nên xem tiếp phần luận giải toàn bộ để nối Mệnh, Thân, 12 cung và vận hạn thành một bức tranh đầy đủ hơn.`;
}

export async function generateFreeOverview(chart: TuViChart) {
  const prompt = freeOverviewPrompt(chart);
  const routed = await generateWithLlmRouter({ prompt, maxTokens: 1500, temperature: 0.55 });
  if (routed) return { content: routed.text, model: routed.model, prompt };
  return { content: fallbackFreeOverview(chart), model: "template-fallback", prompt };
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

  const routed = await generateWithLlmRouter({ prompt, maxTokens: 2400, temperature: 0.55 });
  if (routed) return { content: routed.text, model: routed.model, prompt };

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
