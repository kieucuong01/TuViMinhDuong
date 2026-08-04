export type CompatibilityNarrativeLevel = "flow" | "coordinate" | "discuss";
export type CompatibilityNarrativeThemeKey = "temperament" | "communication" | "commitment" | "finance" | "work" | "family";
export type NarrativeTrait = "leadership" | "analysis" | "action" | "expression" | "emotion" | "stability" | "change";
export type InteractionKind = "shared" | "complementary" | "contrast";

export type NarrativeProfile = {
  name: string;
  traits: NarrativeTrait[];
  primaryNeed: string;
  reassurance: string;
  contribution: string;
  friction: string;
};

export type NarrativeContext = {
  key: CompatibilityNarrativeThemeKey;
  level: CompatibilityNarrativeLevel;
  interaction: InteractionKind;
  seed: string;
  first: NarrativeProfile;
  second: NarrativeProfile;
};

export type NarrativeVariant<T> = {
  family: string;
  value: T;
};

export function stableHash(seed: string) {
  return [...seed].reduce((value, char) => ((value * 31) + char.charCodeAt(0)) >>> 0, 2166136261);
}

export function selectStableVariant<T>(variants: NarrativeVariant<T>[], seed: string, usedFamilies: Set<string>) {
  if (variants.length === 0) throw new Error("NARRATIVE_VARIANTS_REQUIRED");
  const available = variants.filter((variant) => !usedFamilies.has(variant.family));
  const pool = available.length ? available : variants;
  return pool[stableHash(seed) % pool.length];
}

export class NarrativeLedger {
  readonly openingFamilies = new Set<string>();
  readonly transitions = new Set<string>();
  readonly closingFamilies = new Set<string>();
  readonly normalizedSentences = new Set<string>();
  readonly profileTraitsByPerson = new Map<string, Set<NarrativeTrait>>();
  readonly profileTraitTheme = new Map<NarrativeTrait, CompatibilityNarrativeThemeKey>();
}

export type ThemeNarrative = {
  prose: string;
  summary: string;
  whyItMatters: string;
  possibleExpression: string;
  actions: string[];
  questions: string[];
  openingFamily: string;
  sceneFamily: string;
};

export type NarrativeTextBlock = Pick<ThemeNarrative, "prose">;

export type NarrativeUniquenessAudit = {
  duplicateSentences: string[];
  repeatedOpenings: string[];
  repeatedNgrams: string[];
};

type NarrativeWriter = (context: NarrativeContext) => string;

type ProseComposerInput = Pick<ThemeNarrative, "summary" | "whyItMatters" | "possibleExpression" | "actions" | "questions"> & {
  context: NarrativeContext;
};

type ProseClosingWriter = (input: ProseComposerInput, question: string) => string;

type ThemeNarrativeStrategy = {
  openings: Record<InteractionKind, NarrativeVariant<NarrativeWriter>[]>;
  summaryBridge: NarrativeWriter;
  whyItMatters: NarrativeWriter;
  scenes: Record<CompatibilityNarrativeLevel, NarrativeVariant<NarrativeWriter>[]>;
  actions: Record<CompatibilityNarrativeLevel, NarrativeWriter[]>;
  questions: Record<CompatibilityNarrativeLevel, NarrativeWriter[]>;
};

function contrastLine({ first, second, interaction }: NarrativeContext) {
  if (interaction === "shared") {
    return `${first.name} và ${second.name} nhận ra khá nhanh điều người kia đang cần, bởi cả hai có một phần nhịp ưu tiên tương tự nhau.`;
  }
  if (interaction === "complementary") {
    return `${first.name} mang vào mối quan hệ khả năng ${first.contribution}, trong khi ${second.name} thường bù lại bằng cách ${second.contribution}.`;
  }
  return `${first.name} dễ cần ${first.primaryNeed}, còn ${second.name} lại yên tâm hơn khi ${second.reassurance}; khoảng lệch này cần được nói thành lời thay vì để người kia tự đoán.`;
}

const THEME_STRATEGIES: Record<CompatibilityNarrativeThemeKey, ThemeNarrativeStrategy> = {
  temperament: {
    openings: {
      shared: [
        { family: "rhythm-portrait", value: ({ first, second }) => `Ở lớp tính cách, ${first.name} và ${second.name} có một nhịp phản ứng đủ gần để không phải giải thích mọi điều từ đầu.` },
        { family: "inside-first", value: ({ first, second }) => `Điểm dễ nhận thấy giữa ${first.name} và ${second.name} không nằm ở việc giống tính hoàn toàn, mà ở cách hai người cùng tìm lại trạng thái cân bằng.` },
      ],
      complementary: [
        { family: "two-tempos", value: ({ first, second }) => `${first.name} thường quan sát tình huống theo một nhịp riêng, còn ${second.name} đem đến một lực đẩy khác; đặt đúng chỗ, hai cách phản ứng này có thể đỡ nhau.` },
        { family: "balance-first", value: ({ first, second }) => `Sự cân bằng của cặp này đến từ hai chất khác nhau: ${first.name} thiên về ${first.contribution}, còn ${second.name} giúp câu chuyện chuyển động nhờ ${second.contribution}.` },
      ],
      contrast: [
        { family: "pressure-moment", value: ({ first, second }) => `Khi áp lực tăng, khác biệt giữa ${first.name} và ${second.name} hiện ra rõ hơn bình thường: một người cần ${first.primaryNeed}, người kia cần ${second.primaryNeed}.` },
        { family: "recovery-style", value: ({ first, second }) => `${first.name} và ${second.name} không lấy lại cân bằng theo cùng một cách; điều làm người này dịu xuống đôi khi lại khiến người kia thấy bị thúc ép.` },
      ],
    },
    summaryBridge: ({ first, second, interaction }) => interaction === "shared"
      ? `Nhờ vậy, ${first.name} có thể nhận ra lúc ${second.name} cần chậm lại mà không vội xem đó là lạnh nhạt. Điểm cần giữ là khoảng thở riêng, bởi cùng một nhịp cũng có thể khiến cả hai khuếch đại cảm xúc vào lúc mệt.`
      : `Điểm mạnh nằm ở việc một người giúp tình huống có thêm độ sâu, người kia đưa lại chuyển động. Muốn sự bổ sung này phát huy, hai bên cần báo trước mình đang cần khoảng lặng, lời trấn an hay một quyết định cụ thể.`,
    whyItMatters: ({ first, second }) => `Lớp này không cố gắn nhãn ai mạnh hay ai khó chiều. Điều đáng đọc là cách ${first.name} tìm sự an tâm qua việc ${first.reassurance}, còn ${second.name} thường ổn định hơn khi ${second.reassurance}. Hiểu đúng nhu cầu phía sau phản ứng sẽ giúp hai người bớt xem khác biệt là thái độ chống đối.`,
    scenes: {
      flow: [{ family: "temperament-everyday", value: (context) => `Khi nhịp sống bị xáo trộn, hai người thường bắt được tín hiệu của nhau trước khi căng thẳng thành lời. ${contrastLine(context)} Điểm thuận này đáng giữ bằng việc báo trước nhu cầu, thay vì mặc định rằng đối phương lúc nào cũng hiểu.` }],
      coordinate: [{ family: "temperament-pause", value: ({ first, second }) => `Khi nhịp sống bị xáo trộn, ${first.name} có thể ${first.friction}, đúng lúc ${second.name} lại ${second.friction}. Nếu thống nhất một khoảng dừng có thời hạn, hai người sẽ không phải chọn giữa thúc ép và im lặng kéo dài.` }],
      discuss: [{ family: "temperament-overload", value: ({ first, second }) => `Khi nhịp sống bị xáo trộn, phản xạ ${first.friction} của ${first.name} dễ chạm vào xu hướng ${second.friction} của ${second.name}. Đây là lúc nên hạ cường độ cuộc nói chuyện trước, rồi mới xử lý nội dung sau.` }],
    },
    actions: {
      flow: [({ first, second }) => `${first.name} và ${second.name} thử nói trước một dấu hiệu cho biết mình đang quá tải, dù lúc đó chưa cần giải thích dài.`, () => "Giữ một khoảng nghỉ ngắn trong tuần để mỗi người được trở về nhịp riêng mà không bị hiểu là xa cách."],
      coordinate: [() => "Thống nhất tín hiệu tạm dừng, thời lượng nghỉ và giờ quay lại cuộc nói chuyện; tránh khoảng lặng không có điểm kết.", ({ first, second }) => `${first.name} nói rõ điều giúp mình bình tĩnh, sau đó ${second.name} bổ sung điều mình cần để không thấy bị bỏ lại.`],
      discuss: [() => "Khi một người đã quá tải, dừng việc phân tích đúng sai và chuyển sang xác nhận: tôi đã nghe, chúng ta sẽ nói lại vào lúc nào.", () => "Chọn một bất đồng nhỏ để luyện cách tạm dừng trước, không đợi đến mâu thuẫn lớn mới thử quy ước."],
    },
    questions: {
      flow: [() => "Dấu hiệu nào cho thấy bạn đang cần được ở yên, và dấu hiệu nào cho thấy bạn thực sự cần được hỏi han?", () => "Điểm giống nào đang giúp hai người hiểu nhau nhưng cũng dễ khiến cả hai cùng phản ứng quá mạnh?"],
      coordinate: [() => "Khi có việc bất ngờ, ai muốn hành động trước và ai cần hiểu đủ mới yên tâm?", () => "Một khoảng dừng như thế nào vẫn khiến cả hai cảm thấy được tôn trọng?"],
      discuss: [() => "Phản ứng nào của đối phương thường khiến bạn lập tức phòng thủ, và nhu cầu thật phía sau phản ứng đó là gì?", () => "Hai người cần loại hỗ trợ nào để một cuộc nói chuyện căng thẳng vẫn an toàn?"],
    },
  },
  communication: {
    openings: {
      shared: [
        { family: "shared-language", value: ({ first, second }) => `Trong cách trò chuyện, ${first.name} và ${second.name} có một vùng ngôn ngữ chung: cách đặt vấn đề của người này thường không quá xa cách tiếp nhận của người kia.` },
        { family: "listening-door", value: ({ first, second }) => `Cuộc trò chuyện giữa ${first.name} và ${second.name} dễ mở ra khi cả hai cảm thấy mình được nghe trước khi bị yêu cầu thay đổi.` },
      ],
      complementary: [
        { family: "message-receiver", value: ({ first, second }) => `Qua lời nói hằng ngày, ${first.name} thường đóng góp bằng việc ${first.contribution}; ${second.name} lại giúp cuộc nói chuyện tiến về phía trước nhờ ${second.contribution}.` },
        { family: "content-tone", value: ({ first, second }) => `${first.name} và ${second.name} có thể cùng nói về một việc nhưng chú ý tới hai tầng khác nhau: một bên nghe nội dung, bên còn lại cảm nhận cả thái độ và thời điểm.` },
      ],
      contrast: [
        { family: "missed-message", value: ({ first, second }) => `Ở đầu gửi và nhận, vấn đề giữa ${first.name} và ${second.name} đôi khi không nằm ở ý định, mà ở chỗ thông điệp đi theo một cách người kia khó tiếp nhận.` },
        { family: "defensive-loop", value: ({ first, second }) => `Một câu nói ngắn của ${first.name} có thể làm ${second.name} nghe thành sự thúc ép; phản ứng tiếp theo lại khiến người nói ban đầu cảm thấy không được hiểu.` },
      ],
    },
    summaryBridge: ({ first, second, interaction }) => interaction === "shared"
      ? `Sự dễ hiểu nhau là lợi thế, nhưng cũng làm hai người có lúc bỏ qua bước xác nhận. Chỉ cần ${first.name} nhắc lại điều vừa nghe và ${second.name} sửa phần chưa đúng, nhiều hiểu nhầm nhỏ sẽ không phải đi xa hơn.`
      : `Mấu chốt không phải ai nói hay hơn, mà là nội dung có đến được với người nghe hay không. Khi một bên được nói trọn ý và bên kia có thời gian phản hồi, cuộc trao đổi sẽ bớt xoay quanh giọng điệu.`,
    whyItMatters: ({ first, second }) => `Giao tiếp của cặp này nên được đọc ở cả hai đầu: ${first.name} cần gì để nói rõ mà không phòng thủ, và ${second.name} cần gì để nghe mà không vội diễn giải. ${contrastLine({ ...baseForContrast(first, second), key: "communication" })}`,
    scenes: {
      flow: [{ family: "communication-check", value: ({ first, second }) => `Trong một cuộc trao đổi quan trọng, ${first.name} và ${second.name} thường sớm tìm được ý chính. Sự ăn ý sẽ bền hơn nếu một người nhắc lại điều mình vừa hiểu, để người kia có cơ hội sửa trước khi hai bên đi tiếp.` }],
      coordinate: [{ family: "communication-two-turns", value: ({ first, second }) => `Trong một cuộc trao đổi, ${first.name} dễ ưu tiên ${first.primaryNeed}, còn ${second.name} chờ cảm giác ${second.reassurance}. Chia thành hai lượt — nghe cho đủ rồi mới bàn giải pháp — sẽ giảm cảnh một người càng giải thích, người kia càng khép lại.` }],
      discuss: [{ family: "communication-heat", value: ({ first, second }) => `Trong một cuộc trao đổi đang nóng lên, ${first.name} có thể ${first.friction}; ${second.name} đáp lại bằng xu hướng ${second.friction}. Nếu tiếp tục nói ở cùng cường độ, bất đồng về một việc dễ biến thành đánh giá về con người.` }],
    },
    actions: {
      flow: [() => "Với quyết định lớn, mỗi người nhắc lại một câu mình đã hiểu về nhu cầu của đối phương trước khi đưa ý kiến.", () => "Giữ thói quen chốt phần đã đồng ý và phần còn mở, kể cả khi cuộc nói chuyện diễn ra khá thuận."],
      coordinate: [() => "Dùng bốn bước: sự việc — cảm nhận — điều cần — đề nghị cụ thể; bỏ các nhãn như lúc nào cũng hoặc không bao giờ.", () => "Hẹn thời điểm quay lại nếu chưa thể chốt, và ghi đúng một câu hỏi cần trả lời ở lần nói tiếp."],
      discuss: [() => "Dừng cuộc nói chuyện khi xuất hiện mỉa mai, đe dọa hoặc nhắc lại lỗi cũ để gây sức ép; chỉ quay lại khi cả hai có thể nói về việc hiện tại.", () => "Chọn một người nói trong hai phút, người còn lại chỉ nhắc lại điều đã nghe; đổi vai trước khi phản biện."],
    },
    questions: {
      flow: [() => "Điều gì khiến bạn thấy người kia thật sự đang nghe: ánh mắt, câu hỏi, thời gian hay hành động sau đó?", () => "Hai người đang đoán ý nhau ở chủ đề nào dù hoàn toàn có thể hỏi thẳng?"],
      coordinate: [() => "Khi chưa đồng ý, bạn muốn tiếp tục ngay hay cần một mốc hẹn cụ thể để suy nghĩ?", () => "Câu chữ hoặc giọng điệu nào thường làm thông điệp đúng bị tiếp nhận sai?"],
      discuss: [() => "Quy tắc nào cần có để bất đồng không biến thành xúc phạm hoặc im lặng trừng phạt?", () => "Nếu chỉ giải quyết một việc trong cuộc nói chuyện tới, hai người sẽ chọn việc nào?"],
    },
  },
  commitment: {
    openings: {
      shared: [
        { family: "commitment-proof", value: ({ first, second }) => `Ở chiều gắn bó, ${first.name} và ${second.name} có cơ hội cảm nhận tình cảm qua những việc nhỏ nhưng đều đặn hơn là lời hứa thật lớn.` },
        { family: "closeness-language", value: ({ first, second }) => `Sự gần gũi giữa ${first.name} và ${second.name} có một phần ngôn ngữ chung: ở bên ai đó nghĩa là có trách nhiệm và có mặt.` },
      ],
      complementary: [
        { family: "care-forms", value: ({ first, second }) => `Trong cách trao tình cảm, ${first.name} và ${second.name} không nhất thiết dùng cùng một kiểu; người này cho đi bằng ${first.contribution}, người kia đáp lại qua ${second.contribution}.` },
        { family: "distance-closeness", value: ({ first, second }) => `Cách ${first.name} tìm sự gần gũi và cách ${second.name} giữ cảm giác an toàn có thể bổ sung, miễn là cả hai gọi đúng tên điều mình mong đợi.` },
      ],
      contrast: [
        { family: "commitment-fear", value: ({ first, second }) => `Chạm tới chuyện cam kết, ${first.name} và ${second.name} dễ gặp hai nỗi lo khác nhau: bị bó buộc hoặc bị bỏ lại phía sau.` },
        { family: "care-mismatch", value: ({ first, second }) => `Điều ${first.name} xem là đã quan tâm đôi khi chưa phải điều khiến ${second.name} cảm thấy được chọn và được đồng hành.` },
      ],
    },
    summaryBridge: ({ first, second, interaction }) => interaction === "shared"
      ? `Điều đáng quý là cả hai dễ nhận ra giá trị của sự có mặt và trách nhiệm. Để điểm thuận thành nền bền, ${first.name} với ${second.name} vẫn cần gọi tên kỳ vọng thay vì thử lòng hoặc chờ đối phương tự chứng minh.`
      : `Sự quan tâm có thể đang tồn tại nhưng đi qua hai con đường khác nhau. Khi mỗi người chỉ dùng cách mình quen cho đi, người còn lại dễ nhận chưa đủ; dịch nhu cầu thành hành động cụ thể sẽ làm khoảng cách ngắn lại.`,
    whyItMatters: ({ first, second }) => `Lớp tình cảm không chỉ hỏi hai người có cảm xúc hay không, mà xem cảm xúc ấy được chuyển thành thời gian, trách nhiệm và cách sửa sai thế nào. ${first.name} thường cần ${first.primaryNeed}; ${second.name} lại đón nhận sự gắn bó rõ hơn khi ${second.reassurance}.`,
    scenes: {
      flow: [{ family: "commitment-presence", value: ({ first, second }) => `Cảm giác được đồng hành dễ lớn lên khi ${first.name} và ${second.name} cùng giữ những lời hứa vừa sức. Một lần có mặt đúng lúc, chủ động báo thay đổi hoặc nhận phần trách nhiệm của mình sẽ có giá trị hơn việc chỉ nói rằng cả hai vốn rất hợp.` }],
      coordinate: [{ family: "commitment-expectation", value: ({ first, second }) => `Cảm giác được đồng hành có thể đến với ${first.name} qua việc ${first.reassurance}, trong khi ${second.name} chờ ${second.reassurance}. Nếu không nói rõ, cả hai đều có thể đang cố gắng mà vẫn nghĩ mình nhận lại quá ít.` }],
      discuss: [{ family: "commitment-safety", value: ({ first, second }) => `Cảm giác được đồng hành suy giảm khi xu hướng ${first.friction} của ${first.name} gặp phản ứng ${second.friction} từ ${second.name}. Cần nhìn vào hành vi lặp lại và mức an toàn thực tế, không dùng lá số để hợp lý hóa kiểm soát hoặc né tránh trách nhiệm.` }],
    },
    actions: {
      flow: [() => "Mỗi người chọn một hành động nhỏ nhưng đều đặn thể hiện sự có mặt, rồi giữ đủ lâu để người kia thật sự cảm nhận được.", () => "Nói lại kỳ vọng trước mỗi giai đoạn mới thay vì cho rằng lời hứa cũ tự động phù hợp với hoàn cảnh mới."],
      coordinate: [() => "Viết riêng ba điều khiến mình cảm thấy được cam kết, sau đó so sánh để tìm phần giao nhau và phần cần học ngôn ngữ của nhau.", () => "Thống nhất ranh giới với bạn bè, công việc và gia đình hai bên bằng tình huống cụ thể, không chỉ bằng nguyên tắc chung."],
      discuss: [() => "Tách lời xin lỗi khỏi lời hứa thay đổi: sau khi nhận trách nhiệm, cần có một hành vi và mốc thời gian có thể quan sát.", () => "Nếu có kiểm soát, đe dọa hoặc làm tổn thương lặp lại, ưu tiên an toàn và hỗ trợ phù hợp trước mọi luận giải."],
    },
    questions: {
      flow: [() => "Việc nhỏ nào người kia đang làm đều đặn nhưng bạn chưa từng nói rằng mình trân trọng?", () => "Trong giai đoạn tới, lời hứa nào nên được điều chỉnh để vẫn thực tế với cả hai?"],
      coordinate: [() => "Bạn cảm nhận cam kết rõ nhất qua lời nói, thời gian, tài chính hay trách nhiệm cụ thể?", () => "Khoảng riêng tư nào giúp bạn ở lại trong quan hệ với nhiều năng lượng hơn?"],
      discuss: [() => "Hành vi nào đang làm bạn mất an toàn, và điều gì phải thay đổi để cuộc trao đổi có thể tiếp tục?", () => "Hai người đang bảo vệ mối quan hệ hay chỉ đang bảo vệ cách đúng của riêng mình?"],
    },
  },
  finance: {
    openings: {
      shared: [
        { family: "money-priority", value: () => "Với chuyện tiền bạc, cặp đôi này có một vùng ưu tiên tương đối gần nhau, nhờ vậy việc đặt mục tiêu chung không phải bắt đầu từ con số không." },
        { family: "resource-view", value: ({ first, second }) => `Cách ${first.name} và ${second.name} nhìn nguồn lực có điểm gặp: tiền cần phục vụ một nền sống rõ ràng, không chỉ là chuyện chi nhiều hay ít.` },
      ],
      complementary: [
        { family: "money-roles", value: ({ first, second }) => `Khi quản lý nguồn lực, ${first.name} có thể giữ vai trò ${first.contribution}, còn ${second.name} tạo thêm độ linh hoạt nhờ ${second.contribution}.` },
        { family: "safety-opportunity", value: () => "Một bên giúp cặp này nhìn thấy điều cần bảo toàn, bên kia nhạy hơn với cơ hội; lợi thế nằm ở quy tắc chung chứ không ở việc bên nào thắng." },
      ],
      contrast: [
        { family: "money-power", value: ({ first, second }) => `Ở các quyết định tiền bạc, khác biệt giữa ${first.name} và ${second.name} dễ thành khác biệt về quyền lực nếu thu nhập, khoản nợ và nghĩa vụ gia đình không được nói rõ.` },
        { family: "risk-threshold", value: ({ first, second }) => `Ngưỡng thấy an toàn của ${first.name} và ${second.name} không hoàn toàn giống nhau; cùng một con số có thể là cơ hội với người này nhưng là áp lực với người kia.` },
      ],
    },
    summaryBridge: ({ first, second, interaction }) => interaction === "shared"
      ? `Nền chung giúp ${first.name} và ${second.name} dễ thống nhất mục tiêu, song cảm giác đồng thuận không thay được ngân sách. Con số, giới hạn tự chủ và ngưỡng phải hỏi nhau là ba thứ biến thiện chí thành một kế hoạch dùng được.`
      : `Một người có thể nhìn thấy phần cần bảo toàn, người kia nhạy hơn với cơ hội. Cặp góc nhìn này hữu ích khi quyền chốt, mức rủi ro và cách rút lui được thỏa thuận trước lúc tiền thật đi ra.`,
    whyItMatters: ({ first, second }) => `Tiền chạm đồng thời vào cảm giác an toàn, quyền tự chủ và trách nhiệm. ${first.name} dễ đưa ra quyết định tốt hơn khi ${first.reassurance}; ${second.name} cần ${second.reassurance}. Vì vậy, sự minh bạch về con số quan trọng hơn cảm giác rằng hai người hiểu ý nhau.`,
    scenes: {
      flow: [{ family: "finance-budget", value: ({ first, second }) => `Trước một khoản chi đáng kể, ${first.name} và ${second.name} thường tìm được tiêu chí chung khá nhanh. Dù vậy, nên chốt bằng ba con số: số tiền tối đa, phần dự phòng còn lại và ai chịu trách nhiệm theo dõi sau quyết định.` }],
      coordinate: [{ family: "finance-three-funds", value: ({ first, second }) => `Trước một khoản chi, ${first.name} có thể ${first.friction}, còn ${second.name} lại ${second.friction}. Tách tiền chung bắt buộc, tiền cá nhân tự quyết và quỹ thử nghiệm sẽ giúp hai người không phải áp một khẩu vị rủi ro lên mọi quyết định.` }],
      discuss: [{ family: "finance-obligation", value: ({ first, second }) => `Trước một khoản chi, khoản vay hoặc đề nghị đứng tên, nhịp ${first.friction} của ${first.name} có thể va trực tiếp với ${second.friction} ở ${second.name}. Không chốt khi thông tin còn mơ hồ; mọi nghĩa vụ nên có số liệu, giấy tờ và phương án dừng.` }],
    },
    actions: {
      flow: [() => "Đặt lịch rà ngân sách ngắn mỗi tháng, kể cả khi tài chính đang thuận, để mục tiêu chung không trôi khỏi thực tế.", () => "Giữ một phần tiền cá nhân mà mỗi người được tự quyết trong giới hạn đã thống nhất."],
      coordinate: [() => "Chia tiền thành ba ngăn: bắt buộc, tự chủ và mục tiêu; ghi rõ ngưỡng phải hỏi nhau trước khi chi.", () => "Với kế hoạch đầu tư chung, thống nhất mức lỗ chấp nhận, thời gian nắm giữ và điều kiện dừng trước khi xuống tiền."],
      discuss: [() => "Liệt kê đầy đủ nợ, bảo lãnh, nghĩa vụ gia đình và tài sản đứng tên trước khi tạo thêm cam kết chung.", () => "Không dùng im lặng, giữ tiền hoặc ép ký giấy tờ để giành quyền quyết định; cần tư vấn độc lập nếu rủi ro lớn."],
    },
    questions: {
      flow: [() => "Mục tiêu nào thật sự là của cả hai, và mục tiêu nào chỉ đang được mặc định là chung?", () => "Mức tiền tự chủ nào giúp mỗi người thoải mái mà vẫn bảo vệ kế hoạch chung?"],
      coordinate: [() => "Khoản nào là trách nhiệm chung, khoản nào mỗi người có quyền tự quyết?", () => "Nếu thu nhập giảm trong sáu tháng, thứ tự ưu tiên sẽ thay đổi ra sao?"],
      discuss: [() => "Thông tin tài chính nào còn thiếu khiến một người chưa thể đồng ý an toàn?", () => "Nếu quyết định thất bại, ai chịu phần việc, phần nợ và quyền dừng như thế nào?"],
    },
  },
  work: {
    openings: {
      shared: [
        { family: "work-momentum", value: ({ first, second }) => `Khi cùng làm việc, ${first.name} và ${second.name} có khả năng bắt nhịp mục tiêu khá nhanh và nhận ra phần việc người kia làm tốt.` },
        { family: "work-standard", value: ({ first, second }) => `${first.name} và ${second.name} có một vùng tiêu chuẩn chung; đây là nền tốt để phối hợp nếu quyền quyết định cũng rõ như trách nhiệm.` },
      ],
      complementary: [
        { family: "work-handoff", value: ({ first, second }) => `Qua một lần bàn giao, ${first.name} đem tới khả năng ${first.contribution}; ${second.name} nối tiếp bằng việc ${second.contribution}. Cặp vai này có giá trị khi điểm chuyển việc được nói rõ.` },
        { family: "builder-checker", value: ({ first, second }) => `Một người hợp mở đường, người kia giúp kiểm tra và hoàn thiện; ${first.name} với ${second.name} có thể tạo thành nhịp làm việc như vậy thay vì cố làm giống nhau.` },
      ],
      contrast: [
        { family: "work-authority", value: ({ first, second }) => `Trong phần việc chung, điểm dễ vướng của ${first.name} và ${second.name} là trách nhiệm được chia nhưng quyền chốt lại không thuộc rõ về ai.` },
        { family: "work-speed", value: ({ first, second }) => `Tốc độ làm việc của ${first.name} và tiêu chuẩn hoàn tất của ${second.name} có thể kéo hai người về hai hướng nếu không có mốc kiểm tra giữa đường.` },
      ],
    },
    summaryBridge: ({ first, second, interaction }) => interaction === "shared"
      ? `Nhịp đồng thuận giúp công việc chạy nhanh, nhưng cũng dễ làm ranh giới vai trò mờ đi. ${first.name} và ${second.name} sẽ phối hợp tốt hơn khi mỗi đầu việc có một người chốt, một mốc kiểm tra và tiêu chuẩn hoàn thành nhìn thấy được.`
      : `Hai phong cách khác nhau có thể tạo thành một đường chuyền tốt thay vì cạnh tranh. Muốn vậy, phần mở việc, phần kiểm tra và quyền quyết định cuối phải thuộc về những người đã được gọi tên từ đầu.`,
    whyItMatters: ({ first, second }) => `Hợp tác tốt không đòi hỏi hai người cùng một phong cách. Cần nhìn xem phần ${first.name} làm tốt nhất — ${first.contribution} — có đi tiếp được vào phần ${second.name} mạnh — ${second.contribution} — hay bị mắc ở quyền hạn, thời hạn và tiêu chuẩn hoàn thành.`,
    scenes: {
      flow: [{ family: "work-checkpoint", value: ({ first, second }) => `Với một việc chung, ${first.name} và ${second.name} có thể vào guồng nhanh nếu mỗi người giữ đúng phần mạnh của mình. Một mốc kiểm tra giữa đường sẽ ngăn người làm nhanh vô tình gánh luôn quyền quyết định và phần sửa cuối.` }],
      coordinate: [{ family: "work-raci", value: ({ first, second }) => `Với một việc chung, ${first.name} dễ ${first.friction}, còn ${second.name} có thể ${second.friction}. Ghi rõ ai quyết định, ai thực hiện, ai được tham khảo sẽ hiệu quả hơn lời nhắc chung rằng cả hai phải phối hợp tốt hơn.` }],
      discuss: [{ family: "work-spillover", value: ({ first, second }) => `Với một việc chung đang trễ hoặc không đạt, phản ứng ${first.friction} của ${first.name} dễ kéo theo ${second.friction} từ ${second.name}. Cần đánh giá quy trình và dữ kiện trước khi quy thất bại thành lỗi tính cách.` }],
    },
    actions: {
      flow: [() => "Mỗi đầu việc có một người chốt cuối, một tiêu chuẩn hoàn thành và một mốc kiểm tra; người hỗ trợ không mặc nhiên chịu toàn bộ trách nhiệm.", () => "Kết thúc công việc bằng một lượt rút kinh nghiệm ngắn, kể cả khi kết quả tốt."],
      coordinate: [() => "Dùng ba cột: người quyết định, người thực hiện, người cần được hỏi; tránh ghi tên cả hai ở mọi cột.", () => "Chốt giờ dừng nói chuyện công việc để mâu thuẫn tiến độ không chiếm hết thời gian riêng."],
      discuss: [() => "Nếu cùng kinh doanh, dùng hợp đồng, sổ tiền và cơ chế xử lý bất đồng như với một đối tác độc lập.", () => "Khi có lỗi, truy lại bàn giao, dữ kiện và quyền hạn trước khi đánh giá động cơ của người làm."],
    },
    questions: {
      flow: [() => "Phần việc nào mỗi người làm tốt nhưng chưa được trao đủ quyền để hoàn thành?", () => "Mốc kiểm tra nào đủ sớm để sửa mà không biến thành giám sát liên tục?"],
      coordinate: [() => "Ai phù hợp mở việc, ai kiểm tra chi tiết và ai chốt quyết định cuối?", () => "Tiêu chuẩn hoàn thành nào hiện chỉ nằm trong đầu một người?"],
      discuss: [() => "Mâu thuẫn hiện tại đến từ năng lực, quy trình hay quyền hạn chưa rõ?", () => "Nếu bỏ quan hệ cá nhân sang một bên, một đối tác công bằng sẽ yêu cầu thỏa thuận gì?"],
    },
  },
  family: {
    openings: {
      shared: [
        { family: "family-foundation", value: ({ first, second }) => `Khi nghĩ về mái nhà, ${first.name} và ${second.name} cùng hình dung khá gần nhau: ổn định không chỉ là nơi ở mà còn là cách gánh trách nhiệm.` },
        { family: "home-rhythm", value: ({ first, second }) => `Đời sống chung của ${first.name} và ${second.name} sẽ dễ thành một nhịp thoải mái hơn khi các việc nhỏ được coi là trách nhiệm hữu hình, không phải sự giúp đỡ tùy hứng.` },
      ],
      complementary: [
        { family: "family-strengths", value: ({ first, second }) => `Trong đời sống chung, ${first.name} có thể giữ nền bằng khả năng ${first.contribution}; ${second.name} bổ sung cho không khí gia đình nhờ ${second.contribution}.` },
        { family: "roots-future", value: ({ first, second }) => `Hai người mang theo hai nền gia đình khác nhau, nhưng chính khác biệt ấy có thể giúp ${first.name} và ${second.name} chọn lọc điều muốn giữ cho mái nhà tương lai.` },
      ],
      contrast: [
        { family: "family-expectation", value: ({ first, second }) => `Dưới kỳ vọng của người thân, ${first.name} và ${second.name} có thể tưởng rằng mình đang bất đồng với nhau, trong khi mỗi người thực ra đang bảo vệ một nền nếp đã quen.` },
        { family: "care-burden", value: ({ first, second }) => `Trách nhiệm chăm sóc dễ lệch về một phía nếu ${first.name} và ${second.name} không gọi rõ việc nào là tự nguyện, việc nào là nghĩa vụ và giới hạn ở đâu.` },
      ],
    },
    summaryBridge: ({ first, second, interaction }) => interaction === "shared"
      ? `Điểm gặp giúp hai người dễ nói về nền sống mong muốn, nhưng việc nhà và trách nhiệm chăm sóc vẫn cần được nhìn thấy. Một lịch phân chia rõ sẽ bảo vệ cả ${first.name}, ${second.name} lẫn phần riêng của mối quan hệ.`
      : `Hai nền gia đình khác nhau không buộc cặp đôi phải chọn một bỏ một. Giá trị nằm ở việc cùng lọc điều muốn giữ, bỏ thói quen không còn phù hợp và dựng nguyên tắc mới cho từng giai đoạn sống.`,
    whyItMatters: ({ first, second }) => `Gia đình là nơi các ưu tiên trừu tượng trở thành lịch sống, tiền bạc và phần việc cụ thể. ${first.name} cần ${first.primaryNeed}; ${second.name} lại thấy yên hơn khi ${second.reassurance}. Nếu không bàn theo từng giai đoạn, kỳ vọng của người thân rất dễ nói thay tiếng nói của hai người.`,
    scenes: {
      flow: [{ family: "family-routine", value: ({ first, second }) => `Nếp sống chung dễ ổn định khi ${first.name} và ${second.name} biến thiện ý thành lịch và phần việc rõ. Điểm thuận không có nghĩa một người tự biết phải làm gì; nó cho phép hai người thống nhất nhanh hơn rồi cùng điều chỉnh khi hoàn cảnh đổi.` }],
      coordinate: [{ family: "family-stage", value: ({ first, second }) => `Nếp sống chung có thể làm ${first.name} thấy mình phải ${first.friction}, trong khi ${second.name} lại ${second.friction}. Nên bàn riêng từng việc — nơi ở, việc nhà, chăm cha mẹ, con cái — thay vì gói tất cả vào câu hỏi ai có trách nhiệm hơn.` }],
      discuss: [{ family: "family-boundary", value: ({ first, second }) => `Nếp sống chung trở nên nặng nề khi phản ứng ${first.friction} của ${first.name} gặp xu hướng ${second.friction} ở ${second.name}, nhất là dưới áp lực từ người thân. Hai người cần xác định điều có thể thương lượng và điều thuộc ranh giới an toàn riêng.` }],
    },
    actions: {
      flow: [() => "Lập một lịch trách nhiệm có thể nhìn thấy, rồi rà lại khi công việc, sức khỏe hoặc hoàn cảnh gia đình thay đổi.", () => "Giữ một khoảng thời gian và không gian riêng cho quan hệ, không để mọi năng lượng chỉ chảy vào nghĩa vụ."],
      coordinate: [() => "Tách trách nhiệm với hai bên gia đình theo ba nguồn lực: thời gian, tiền bạc và người trực tiếp xử lý.", () => "Bàn từng giai đoạn về nơi ở, việc nhà và kế hoạch con cái; không xem quyết định cũ là vĩnh viễn."],
      discuss: [() => "Mỗi người tự nói ranh giới với gia đình mình thay vì để đối phương phải đứng ra đối đầu thay.", () => "Nếu gánh chăm sóc đang lệch, liệt kê toàn bộ việc hữu hình lẫn việc tổ chức phía sau rồi phân lại bằng khả năng thực tế."],
    },
    questions: {
      flow: [() => "Nếp sống nào hai người muốn chủ động tạo ra thay vì chỉ lặp lại từ gia đình cũ?", () => "Việc chăm lo nào đang diễn ra tốt nhưng chưa được ghi nhận thành trách nhiệm chung?"],
      coordinate: [() => "Kỳ vọng nào đến từ chính hai người và kỳ vọng nào đến từ gia đình xung quanh?", () => "Khi trách nhiệm chăm sóc tăng, thời gian và tiền bạc sẽ được phân chia ra sao?"],
      discuss: [() => "Ranh giới nào với người thân phải được hai người bảo vệ nhất quán?", () => "Nếu chưa thể đồng ý về kế hoạch dài hạn, dữ kiện hoặc hỗ trợ nào còn thiếu?"],
    },
  },
};

const PROSE_CLOSINGS: Record<CompatibilityNarrativeThemeKey, NarrativeVariant<ProseClosingWriter>[]> = {
  temperament: [
    {
      family: "temperament-gentle-experiment",
      value: ({ actions, context }, question) => `Nếu phần này gần với trải nghiệm của hai người, điều đáng thử trước không cần quá lớn: ${actionAsClause(actions[0], context)}; đồng thời ${actionAsClause(actions[1], context)}. Có lẽ câu hỏi nên được giữ lại sau cùng là: ${question}`,
    },
    {
      family: "temperament-own-rhythm",
      value: ({ actions, context }, question) => `Thay vì buộc nhau phản ứng giống nhau, hai người có thể bắt đầu bằng việc ${actionAsClause(actions[0], context)}; rồi ${actionAsClause(actions[1], context)}. Khi đã bình tĩnh hơn, hãy cùng tự hỏi: ${question}`,
    },
  ],
  communication: [
    {
      family: "communication-next-conversation",
      value: ({ actions, context }, question) => `Trước cuộc trò chuyện kế tiếp, có lẽ hữu ích hơn cả là ${actionAsClause(actions[0], context)}; sau đó ${actionAsClause(actions[1], context)}. Thay vì cố tìm người nói đúng hơn, hai người có thể cùng nghĩ về câu hỏi này: ${question}`,
    },
    {
      family: "communication-more-air",
      value: ({ actions, context }, question) => `Một thay đổi nhỏ trong cách nói có thể mở ra nhiều khoảng thở: ${actionAsClause(actions[0], context)}; và ${actionAsClause(actions[1], context)}. Điều đáng hỏi nhau trước khi khép lại câu chuyện là: ${question}`,
    },
  ],
  commitment: [
    {
      family: "commitment-felt-care",
      value: ({ actions, context }, question) => `Để sự quan tâm trở thành điều người kia thật sự cảm nhận được, hai người có thể ${actionAsClause(actions[0], context)}; rồi ${actionAsClause(actions[1], context)}. Sau cùng, điều đáng ngồi lại với nhau là: ${question}`,
    },
    {
      family: "commitment-small-proof",
      value: ({ actions, context }, question) => `Hai người không cần chứng minh bằng một lời hứa lớn; có thể thử ${actionAsClause(actions[0], context)}; đồng thời ${actionAsClause(actions[1], context)}. Rồi cùng nhìn lại: ${question}`,
    },
  ],
  finance: [
    {
      family: "finance-safe-next-step",
      value: ({ actions, context }, question) => `Với tiền bạc, bước an toàn và thực tế nhất lúc này là ${actionAsClause(actions[0], context)}; kế đến ${actionAsClause(actions[1], context)}. Trước khi chốt một quyết định chung, hãy cùng trả lời: ${question}`,
    },
    {
      family: "finance-real-numbers",
      value: ({ actions, context }, question) => `Không cần giải quyết mọi khác biệt trong một lần; trước hết ${actionAsClause(actions[0], context)}; tiếp đó ${actionAsClause(actions[1], context)}. Câu hỏi cần có những con số thật để trả lời là: ${question}`,
    },
  ],
  work: [
    {
      family: "work-lighter-handoff",
      value: ({ actions, context }, question) => `Nếu muốn phối hợp nhẹ hơn, hai người có thể ${actionAsClause(actions[0], context)}; và ${actionAsClause(actions[1], context)}. Trước đầu việc kế tiếp, nên thống nhất câu trả lời cho: ${question}`,
    },
    {
      family: "work-different-strengths",
      value: ({ actions, context }, question) => `Điều đáng thử không phải là làm giống nhau, mà là ${actionAsClause(actions[0], context)}; rồi ${actionAsClause(actions[1], context)}. Sau một vòng công việc, hãy cùng nhìn lại: ${question}`,
    },
  ],
  family: [
    {
      family: "family-visible-care",
      value: ({ actions, context }, question) => `Để đời sống chung bớt dựa vào sự tự hiểu, hai người có thể ${actionAsClause(actions[0], context)}; đồng thời ${actionAsClause(actions[1], context)}. Trước một mốc mới, nên cùng tự hỏi: ${question}`,
    },
    {
      family: "family-concrete-home",
      value: ({ actions, context }, question) => `Một mái nhà dễ chịu thường bắt đầu từ những việc rất cụ thể: ${actionAsClause(actions[0], context)}; và ${actionAsClause(actions[1], context)}. Điều đáng bàn khi cả hai còn bình tĩnh là: ${question}`,
    },
  ],
};

function actionAsClause(value: string, context: NarrativeContext) {
  const trimmed = value.trim().replace(/[.!?]+$/u, "");
  if (!trimmed) return trimmed;
  const startsWithName = [context.first.name, context.second.name].some((name) => trimmed.startsWith(`${name} `));
  if (startsWithName) return trimmed;
  return `${trimmed[0].toLocaleLowerCase("vi")}${trimmed.slice(1)}`;
}

function withQuestionMark(value: string) {
  const trimmed = value.trim();
  return trimmed.endsWith("?") ? trimmed : `${trimmed.replace(/[.!]+$/u, "")}?`;
}

function composeThemeProse(input: ProseComposerInput, ledger: NarrativeLedger) {
  const { context } = input;
  const questionIndex = stableHash(`${context.seed}:${context.key}:question`) % input.questions.length;
  const question = withQuestionMark(input.questions[questionIndex]);
  const closing = selectStableVariant(
    PROSE_CLOSINGS[context.key],
    `${context.seed}:${context.key}:closing`,
    ledger.closingFamilies,
  );
  ledger.closingFamilies.add(closing.family);

  return [input.summary, input.whyItMatters, input.possibleExpression, closing.value(input, question)]
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function baseForContrast(first: NarrativeProfile, second: NarrativeProfile): NarrativeContext {
  return {
    key: "communication",
    level: "coordinate",
    interaction: "complementary",
    seed: `${first.name}:${second.name}`,
    first,
    second,
  };
}

function chooseWriter(
  variants: NarrativeVariant<NarrativeWriter>[],
  seed: string,
  usedFamilies: Set<string>,
  context: NarrativeContext,
) {
  const selected = selectStableVariant(variants, seed, usedFamilies);
  usedFamilies.add(selected.family);
  return { family: selected.family, text: selected.value(context) };
}

function normalizeNarrativeText(value: string) {
  return value
    .toLocaleLowerCase("vi")
    .replace(/[“”"'‘’—–:;,()[\]{}]/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sentencesOf(value: string) {
  return value.split(/[.!?]+/).map(normalizeNarrativeText).filter(Boolean);
}

function ngramsOf(value: string, size = 6) {
  const words = normalizeNarrativeText(value).split(" ").filter(Boolean);
  const ngrams = new Set<string>();
  for (let index = 0; index <= words.length - size; index += 1) {
    ngrams.add(words.slice(index, index + size).join(" "));
  }
  return ngrams;
}

function repeatedAcrossThemes(values: Map<string, Set<number>>) {
  return [...values.entries()]
    .filter(([, themeIndexes]) => themeIndexes.size > 1)
    .map(([value]) => value)
    .sort((left, right) => left.localeCompare(right, "vi"));
}

export function auditNarrativeUniqueness(themes: NarrativeTextBlock[]): NarrativeUniquenessAudit {
  const sentenceThemes = new Map<string, Set<number>>();
  const openingThemes = new Map<string, Set<number>>();
  const ngramThemes = new Map<string, Set<number>>();

  themes.forEach((theme, themeIndex) => {
    const blocks = [theme.prose];
    blocks.flatMap(sentencesOf).forEach((sentence) => {
      const indexes = sentenceThemes.get(sentence) || new Set<number>();
      indexes.add(themeIndex);
      sentenceThemes.set(sentence, indexes);
    });

    const opening = normalizeNarrativeText(theme.prose).split(" ").slice(0, 3).join(" ");
    const openingIndexes = openingThemes.get(opening) || new Set<number>();
    openingIndexes.add(themeIndex);
    openingThemes.set(opening, openingIndexes);

    const themeNgrams = new Set(blocks.flatMap((block) => [...ngramsOf(block)]));
    themeNgrams.forEach((ngram) => {
      const indexes = ngramThemes.get(ngram) || new Set<number>();
      indexes.add(themeIndex);
      ngramThemes.set(ngram, indexes);
    });
  });

  return {
    duplicateSentences: repeatedAcrossThemes(sentenceThemes),
    repeatedOpenings: repeatedAcrossThemes(openingThemes),
    repeatedNgrams: repeatedAcrossThemes(ngramThemes),
  };
}

export function buildThemeNarrative(context: NarrativeContext, ledger: NarrativeLedger): ThemeNarrative {
  const strategy = THEME_STRATEGIES[context.key];
  const opening = chooseWriter(strategy.openings[context.interaction], `${context.seed}:${context.key}:opening`, ledger.openingFamilies, context);
  const scene = chooseWriter(strategy.scenes[context.level], `${context.seed}:${context.key}:scene`, ledger.transitions, context);
  const summary = `${opening.text} ${strategy.summaryBridge(context)}`;
  const whyItMatters = strategy.whyItMatters(context);
  const possibleExpression = scene.text;
  const actions = strategy.actions[context.level].map((writer) => writer(context)).slice(0, 2);
  const questions = strategy.questions[context.level].map((writer) => writer(context)).slice(0, 2);
  const prose = composeThemeProse({
    context,
    summary,
    whyItMatters,
    possibleExpression,
    actions,
    questions,
  }, ledger);

  return {
    prose,
    summary,
    whyItMatters,
    possibleExpression,
    actions,
    questions,
    openingFamily: opening.family,
    sceneFamily: scene.family,
  };
}
