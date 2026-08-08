import type { Palace, StarBrightness, TuViChart } from "@/lib/chart";

export type YearlyFortuneAreaKey = "career" | "money" | "love" | "health" | "relations";

export type YearlyFortuneEvidence = {
  available: boolean;
  palace: string;
  branch: string;
  mainStars: string[];
  yearlyStars: string[];
  summary: string;
};

export type YearlyFortuneArea = {
  key: YearlyFortuneAreaKey;
  title: string;
  score: number;
  label: string;
  body: string;
  action: string;
  evidence: YearlyFortuneEvidence[];
};

export type YearlyFortuneSeason = {
  key: string;
  title: string;
  months: [number, number, number];
  tone: string;
  body: string;
  focus: string;
};

export type YearlyFortune2026Report = {
  year: 2026;
  yearLabel: "Bính Ngọ";
  lunarAge: number;
  overallScore: number;
  overallLabel: string;
  opening: string;
  areas: YearlyFortuneArea[];
  seasons: YearlyFortuneSeason[];
  actionPlan: { title: string; body: string }[];
  disclaimer: string;
};

const MIN_SCORE = 35;
const MAX_SCORE = 92;
const STATE_WEIGHT: Record<StarBrightness, number> = { M: 9, V: 7, "Đ": 5, B: 1, H: -7 };
const SUPPORT_PATTERN = /Lộc Tồn|Hóa Lộc|Hóa Quyền|Hóa Khoa|Tả Phù|Hữu Bật|Văn Xương|Văn Khúc|Thiên Khôi|Thiên Việt|Thiên Mã|Long Trì|Phượng Các|Ân Quang|Thiên Quý|Thiên Đức|Nguyệt Đức/;
const CAUTION_PATTERN = /Kình Dương|Đà La|Hỏa Tinh|Linh Tinh|Địa Không|Địa Kiếp|Hóa Kỵ|Tuần|Triệt|Thiên Hư|Thiên Khốc|Tang Môn|Bạch Hổ|Thái Tuế/;

type AreaConfig = {
  key: YearlyFortuneAreaKey;
  title: string;
  sources: { palace: string; weight: number }[];
  strength: string;
  balance: string;
  caution: string;
  action: string;
};

const AREA_CONFIGS: AreaConfig[] = [
  {
    key: "career",
    title: "Công việc và hướng phát triển",
    sources: [
      { palace: "Quan Lộc", weight: 0.5 },
      { palace: "Mệnh", weight: 0.25 },
      { palace: "Thiên Di", weight: 0.25 },
    ],
    strength: "Công việc có khoảng sáng để bạn nhận thêm trách nhiệm, làm rõ vai trò hoặc đưa một năng lực đã tích lũy vào đúng chỗ.",
    balance: "Công việc không thiếu cơ hội, nhưng kết quả phụ thuộc nhiều vào cách bạn sắp thứ tự, nói rõ kỳ vọng và giữ nhịp làm đều.",
    caution: "Áp lực dễ tăng khi bạn ôm quá nhiều đầu việc hoặc đổi hướng chỉ vì một tín hiệu nhất thời; năm nay hợp chỉnh nền hơn là chạy theo mọi lời mời.",
    action: "Chọn một năng lực tạo ra giá trị rõ nhất, đặt một mốc kiểm chứng trong 30 ngày và trao đổi thẳng về phạm vi trách nhiệm trước khi nhận thêm việc.",
  },
  {
    key: "money",
    title: "Tài chính và cách giữ nguồn lực",
    sources: [
      { palace: "Tài Bạch", weight: 0.5 },
      { palace: "Điền Trạch", weight: 0.25 },
      { palace: "Phúc Đức", weight: 0.25 },
    ],
    strength: "Dòng tiền có thể được cải thiện từ năng lực sẵn có, cách tổ chức lại nguồn thu hoặc một quyết định chi tiêu tỉnh táo hơn trước.",
    balance: "Tài chính thiên về quản trị hơn là may rủi: có khoản nên dùng để nuôi mục tiêu dài hạn, cũng có khoản cần giữ biên an toàn.",
    caution: "Điểm dễ hao nằm ở quyết định vội, tin vào thông tin chưa kiểm chứng hoặc để nghĩa tình làm mờ giới hạn cho vay, góp vốn và bảo lãnh.",
    action: "Tách riêng chi phí thiết yếu, quỹ dự phòng và khoản có thể thử; với quyết định lớn, ghi trước mức tổn thất tối đa và điều kiện buộc mình dừng lại.",
  },
  {
    key: "love",
    title: "Tình cảm và gia đạo",
    sources: [
      { palace: "Phu Thê", weight: 0.45 },
      { palace: "Phúc Đức", weight: 0.3 },
      { palace: "Tử Tức", weight: 0.25 },
    ],
    strength: "Các mối quan hệ quan trọng có cơ hội ấm lên khi hai bên cùng nói chuyện về điều thật sự cần, thay vì chỉ phản ứng với chuyện trước mắt.",
    balance: "Tình cảm trong năm cần sự hiện diện và nhất quán; một cuộc trò chuyện đúng lúc có giá trị hơn nhiều lời hứa đưa ra khi cảm xúc đang cao.",
    caution: "Sự im lặng kéo dài, suy đoán ý nhau hoặc mang áp lực công việc về nhà có thể khiến chuyện nhỏ thành khoảng cách khó gọi tên.",
    action: "Dành một khoảng cố định mỗi tuần để nghe nhau không ngắt lời, rồi thống nhất một việc cụ thể về thời gian, tiền bạc hoặc trách nhiệm gia đình.",
  },
  {
    key: "health",
    title: "Sức khỏe và nhịp sống",
    sources: [
      { palace: "Tật Ách", weight: 0.5 },
      { palace: "Mệnh", weight: 0.3 },
      { palace: "Phúc Đức", weight: 0.2 },
    ],
    strength: "Thể lực và tinh thần đáp lại khá tốt khi bạn giữ giờ nghỉ, vận động vừa sức và không để lịch làm việc lấn hết khoảng hồi phục.",
    balance: "Nhịp sống cần được xem như phần nền của mọi kế hoạch: khi ngủ nghỉ đều và biết ngắt quãng, bạn sẽ nhìn việc sáng hơn và bớt quyết định theo mệt mỏi.",
    caution: "Điều cần lưu ý không phải một dự báo bệnh tật, mà là xu hướng quá tải khi cố gắng kéo dài sức chịu đựng hoặc bỏ qua tín hiệu cơ thể lặp lại.",
    action: "Theo dõi giấc ngủ, vận động và mức năng lượng trong hai tuần; nếu có dấu hiệu bất thường hoặc kéo dài, hãy trao đổi với chuyên gia y tế phù hợp.",
  },
  {
    key: "relations",
    title: "Quan hệ, hợp tác và dịch chuyển",
    sources: [
      { palace: "Thiên Di", weight: 0.45 },
      { palace: "Nô Bộc", weight: 0.35 },
      { palace: "Quan Lộc", weight: 0.2 },
    ],
    strength: "Môi trường bên ngoài có thể đem tới người hỗ trợ, góc nhìn mới hoặc cơ hội bước ra khỏi một cách làm đã trở nên chật hẹp.",
    balance: "Hợp tác thuận khi vai trò, lợi ích và cách xử lý bất đồng được nói rõ từ đầu; sự dễ chịu ban đầu chưa đủ thay cho một thỏa thuận chắc chắn.",
    caution: "Bạn dễ hao sức nếu nhận lời vì nể, chia sẻ thông tin quá sớm hoặc bước vào một mối hợp tác mà quyền quyết định và trách nhiệm chưa cân xứng.",
    action: "Trước mỗi lời mời quan trọng, kiểm tra người đồng hành, phạm vi cam kết, giấy tờ và đường lui; bắt đầu bằng một thử nghiệm nhỏ nếu còn điều chưa rõ.",
  },
];

function clampScore(value: number) {
  return Math.max(MIN_SCORE, Math.min(MAX_SCORE, Math.round(value)));
}

function findPalace(chart: TuViChart, name: string) {
  if (name === "Mệnh") return chart.palaces.find((palace) => palace.isMenh);
  if (name === "Thân") return chart.palaces.find((palace) => palace.isThan);
  return chart.palaces.find((palace) => palace.name === name);
}

function allStars(palace: Palace) {
  return [...palace.mainStars, ...palace.supportStars, ...palace.yearlyStars];
}

function scorePalace(palace?: Palace) {
  if (!palace) return 50;
  const states = palace.mainStars
    .map((star) => palace.starStates[star])
    .filter((state): state is StarBrightness => Boolean(state));
  const stateAdjustment = states.length
    ? states.reduce((sum, state) => sum + STATE_WEIGHT[state], 0) / states.length
    : 0;
  const stars = allStars(palace);
  const support = stars.filter((star) => SUPPORT_PATTERN.test(star)).length * 2.5;
  const caution = stars.filter((star) => CAUTION_PATTERN.test(star)).length * -2.5;
  return clampScore(60 + stateAdjustment + support + caution);
}

function scoreArea(chart: TuViChart, config: AreaConfig) {
  return clampScore(config.sources.reduce((sum, source) => (
    sum + scorePalace(findPalace(chart, source.palace)) * source.weight
  ), 0));
}

function scoreLabel(score: number) {
  if (score >= 72) return "Có lực để chủ động";
  if (score >= 59) return "Thuận khi đi có nhịp";
  if (score >= 48) return "Cần vừa làm vừa chỉnh";
  return "Nên củng cố trước";
}

function evidenceFromPalace(chart: TuViChart, palaceName: string): YearlyFortuneEvidence {
  const palace = findPalace(chart, palaceName);
  if (!palace) {
    return {
      available: false,
      palace: palaceName,
      branch: "Chưa xác định",
      mainStars: [],
      yearlyStars: [],
      summary: `Chưa đủ dữ liệu cung ${palaceName}; phần luận không suy đoán thay cho dữ liệu thiếu.`,
    };
  }
  const mainStars = palace.mainStars.map((star) => {
    const state = palace.starStates[star];
    return state ? `${star} (${state})` : star;
  });
  const notable = [...palace.supportStars, ...palace.yearlyStars]
    .filter((star) => SUPPORT_PATTERN.test(star) || CAUTION_PATTERN.test(star))
    .slice(0, 5);
  return {
    available: true,
    palace: palace.name,
    branch: palace.branch,
    mainStars,
    yearlyStars: palace.yearlyStars,
    summary: `${palace.name} an tại ${palace.branch}; chính tinh ${mainStars.join(", ") || "Vô chính diệu"}${notable.length ? `; tín hiệu đi kèm ${notable.join(", ")}` : "; chưa có sao nổi bật trong nhóm theo dõi"}.`,
  };
}

function describeArea(chart: TuViChart, config: AreaConfig, score: number, evidence: YearlyFortuneEvidence[]) {
  const lead = score >= 68 ? config.strength : score >= 52 ? config.balance : config.caution;
  const available = evidence.filter((item) => item.available);
  const anchor = available[0];
  const secondary = available[1];
  const chartAnchor = anchor
    ? `Trên lá số này, cung ${anchor.palace} ở ${anchor.branch}${anchor.mainStars.length ? ` có ${anchor.mainStars.slice(0, 2).join(" và ")}` : " ở thế Vô chính diệu"}`
    : "Dữ liệu cung chính của phương diện này chưa đầy đủ";
  const secondAnchor = secondary
    ? `; khi đặt cạnh cung ${secondary.palace} ở ${secondary.branch}, điều đáng chú ý là phải nhìn cả hoàn cảnh lẫn cách bạn phản ứng`
    : "; vì vậy phần luận chỉ giữ ở mức định hướng có thể kiểm chứng";

  return `${lead} ${chartAnchor}${secondAnchor}. Điều này không có nghĩa mọi việc sẽ tự thuận hoặc tự xấu; nó cho thấy điểm nào dễ tạo lực và điểm nào cần thêm kỷ luật trong năm Bính Ngọ. Với ${chart.input.fullName}, cách dùng hữu ích nhất là đối chiếu nhận định này với việc đang diễn ra, chọn một thay đổi nhỏ rồi xem kết quả thực tế trước khi tăng cam kết. ${config.action}`;
}

function buildAreas(chart: TuViChart) {
  return AREA_CONFIGS.map((config): YearlyFortuneArea => {
    const score = scoreArea(chart, config);
    const evidence = config.sources.map((source) => evidenceFromPalace(chart, source.palace));
    return {
      key: config.key,
      title: config.title,
      score,
      label: scoreLabel(score),
      body: describeArea(chart, config, score, evidence),
      action: config.action,
      evidence,
    };
  });
}

function parseRangeStart(range: string) {
  const start = Number(range.match(/\d+/)?.[0]);
  return Number.isFinite(start) ? start : 0;
}

function currentMajorPeriod(chart: TuViChart, lunarAge: number) {
  return chart.daiVan.find((period) => {
    const [start, end] = period.range.split("-").map(Number);
    return lunarAge >= start && lunarAge <= end;
  }) ?? [...chart.daiVan].sort((a, b) => Math.abs(parseRangeStart(a.range) - lunarAge) - Math.abs(parseRangeStart(b.range) - lunarAge))[0];
}

function buildOpening(chart: TuViChart, areas: YearlyFortuneArea[], lunarAge: number) {
  const strongest = areas.reduce((best, area) => area.score > best.score ? area : best);
  const weakest = areas.reduce((lowest, area) => area.score < lowest.score ? area : lowest);
  const period = currentMajorPeriod(chart, lunarAge);
  const genderAddress = chart.input.gender === "female" ? "chị" : "anh";
  const periodText = period
    ? `Ở tuổi âm ${lunarAge}, ${genderAddress} đang đi trong đại vận ${period.range} tuổi tại cung ${period.palace}`
    : `Ở tuổi âm ${lunarAge}, ${genderAddress} đang bước vào một nhịp cần đọc kỹ cả nền lá số lẫn hoàn cảnh hiện tại`;

  return `Năm Bính Ngọ 2026 của ${chart.input.fullName} không nên được đọc như một lời phán tốt hay xấu gói gọn trong vài câu. ${periodText}, vì vậy câu chuyện của năm nằm ở cách dùng thế mạnh đúng lúc và giữ nhịp ở nơi dễ hao sức. Phần sáng hơn nghiêng về ${strongest.title.toLowerCase()}, còn ${weakest.title.toLowerCase()} là chỗ nên đi chậm, hỏi thêm dữ kiện và tránh quyết định chỉ vì nôn nóng. Khi đặt Mệnh ${chart.menh}, ${chart.than} và các sao lưu năm vào cùng một bức tranh, hướng phù hợp nhất là làm từng bước có thể kiểm chứng: chọn việc thật, đặt mốc xem lại và giữ quyền điều chỉnh khi thực tế khác với dự tính.`;
}

const SEASON_CONFIG = [
  {
    key: "opening",
    title: "Tháng 1–3: mở năm bằng việc sắp lại nhịp",
    months: [1, 2, 3] as [number, number, number],
    tone: "Khởi động và chọn trọng tâm",
    frame: "Ba tháng đầu hợp để nhìn lại việc đang dang dở, chọn một ưu tiên đủ rõ và tránh tự ép mình phải có kết quả lớn ngay từ đầu năm.",
  },
  {
    key: "building",
    title: "Tháng 4–6: đưa kế hoạch vào đời sống",
    months: [4, 5, 6] as [number, number, number],
    tone: "Làm thật và chỉnh thật",
    frame: "Khi nhịp năm đã rõ hơn, giai đoạn này cần biến dự định thành lịch làm, người chịu trách nhiệm và tiêu chí xem lại thay vì tiếp tục chuẩn bị vô hạn.",
  },
  {
    key: "reviewing",
    title: "Tháng 7–9: rà lại điều đang tiêu hao",
    months: [7, 8, 9] as [number, number, number],
    tone: "Sàng lọc và giữ sức",
    frame: "Giữa năm là lúc nhận ra việc nào đang tạo giá trị và việc nào chỉ làm phân tán; bỏ bớt một cam kết không còn phù hợp có thể quan trọng hơn mở thêm việc mới.",
  },
  {
    key: "closing",
    title: "Tháng 10–12: thu kết quả và chuẩn bị vòng mới",
    months: [10, 11, 12] as [number, number, number],
    tone: "Hoàn tất và tích lũy",
    frame: "Cuối năm phù hợp để khép các đầu việc có thể hoàn thành, ghi lại điều đã học và giữ một khoảng đệm cho tài chính, sức khỏe lẫn kế hoạch năm sau.",
  },
];

function buildSeasons(chart: TuViChart): YearlyFortuneSeason[] {
  const start = (chart.lunar.month + chart.input.birthHour + 2026) % chart.palaces.length;
  return SEASON_CONFIG.map((season, index) => {
    const palace = chart.palaces[(start + index * 3) % chart.palaces.length];
    const next = chart.palaces[(start + index * 3 + 1) % chart.palaces.length];
    const palaceSignal = palace
      ? `${palace.name} tại ${palace.branch}${palace.yearlyStars.length ? ` có sao lưu ${palace.yearlyStars.slice(0, 2).join(", ")}` : " không có sao lưu nổi bật trong nhóm theo dõi"}`
      : "dữ liệu cung theo chặng chưa đầy đủ";
    const nextSignal = next ? `cung ${next.name}` : "cung kế tiếp";
    return {
      ...season,
      body: `${season.frame} Nhịp tham khảo được neo ở ${palaceSignal}; khi chuyển sang ${nextSignal}, nên xem phản hồi thực tế rồi mới quyết định tăng tốc hay thu gọn.`,
      focus: index === 0
        ? "Viết ra một mục tiêu chính và một điều sẽ chủ động không làm."
        : index === 1
          ? "Kiểm tra tiến độ bằng kết quả quan sát được, không chỉ bằng cảm giác bận rộn."
          : index === 2
            ? "Giảm một nguồn phân tán và dành lại thời gian cho nền sức khỏe, gia đình hoặc tài chính."
            : "Tổng kết bằng dữ kiện, hoàn thành việc có thể khép và giữ khoảng trống cho năm mới.",
    };
  });
}

function overallLabel(score: number) {
  if (score >= 70) return "Năm có thể chủ động mở việc theo từng bước";
  if (score >= 58) return "Năm tiến đều khi biết chọn trọng tâm";
  if (score >= 48) return "Năm cần vừa đi vừa chỉnh";
  return "Năm nên củng cố nền và giữ biên an toàn";
}

function buildActionPlan(areas: YearlyFortuneArea[]) {
  const strongest = areas.reduce((best, area) => area.score > best.score ? area : best);
  const weakest = areas.reduce((lowest, area) => area.score < lowest.score ? area : lowest);
  return [
    {
      title: "Trong 7 ngày: chọn đúng việc cần soi",
      body: `Ghi ra một tình huống thật thuộc ${weakest.title.toLowerCase()}, điều bạn đã biết, điều còn đang đoán và giới hạn không muốn vượt qua.`,
    },
    {
      title: "Trong 30 ngày: dùng điểm mạnh để sửa điểm yếu",
      body: `Dùng ${strongest.title.toLowerCase()} làm lực đẩy cho một thay đổi nhỏ ở ${weakest.title.toLowerCase()}, có lịch xem lại mỗi tuần và tiêu chí dừng rõ ràng.`,
    },
    {
      title: "Cuối mỗi quý: đối chiếu lại lá số với đời sống",
      body: "Giữ lại điều đã được thực tế xác nhận, bỏ điều không còn đúng và tìm người có chuyên môn phù hợp khi quyết định liên quan đến sức khỏe, tài chính hoặc pháp lý.",
    },
  ];
}

export function buildYearlyFortune2026Report(chart: TuViChart): YearlyFortune2026Report {
  const areas = buildAreas(chart);
  const overallScore = clampScore(areas.reduce((sum, area) => sum + area.score, 0) / areas.length);
  const lunarAge = 2026 - chart.lunar.year + 1;
  return {
    year: 2026,
    yearLabel: "Bính Ngọ",
    lunarAge,
    overallScore,
    overallLabel: overallLabel(overallScore),
    opening: buildOpening(chart, areas, lunarAge),
    areas,
    seasons: buildSeasons(chart),
    actionPlan: buildActionPlan(areas),
    disclaimer: "Nội dung chỉ mang tính tham khảo theo hệ thống tử vi truyền thống. Không dùng kết quả này thay cho tư vấn y tế, tài chính, pháp lý hoặc quyết định quan trọng trong đời sống.",
  };
}
