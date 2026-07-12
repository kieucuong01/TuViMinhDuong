import type { SpecificDateTaskKey } from "@/lib/date-fortune";

export type DatePurposePage = {
  slug: string;
  task: SpecificDateTaskKey;
  title: string;
  description: string;
  eyebrow: string;
  heading: string;
  intro: string;
  criteria: string[];
  changeFactors: string[];
  rangeTips: string[];
  tableRows: { label: string; meaning: string }[];
  faqs: { question: string; answer: string }[];
};

export const DATE_PURPOSE_PAGES: DatePurposePage[] = [
  {
    slug: "khai-truong",
    task: "opening",
    title: "Tìm ngày khai trương tốt trong khoảng thời gian",
    description:
      "So sánh ngày khai trương theo khoảng, xem điểm phù hợp, lý do thuận lợi, điểm cần lưu ý và giờ tốt để mở hàng hoặc ra mắt công việc mới.",
    eyebrow: "Xem ngày khai trương",
    heading: "Tìm ngày khai trương phù hợp nhất trong khoảng bạn chọn",
    intro:
      "Trang này mở sẵn chế độ tìm ngày cho việc khai trương. Hệ thống chấm từng ngày theo trực, hoàng đạo, nhị thập bát tú, sao tốt xấu và quan hệ tuổi nếu bạn nhập năm sinh người chủ sự.",
    criteria: [
      "Ưu tiên các ngày có trực Mãn, Định, Thành hoặc Khai vì phù hợp với việc mở đầu, đón khách và kích hoạt hoạt động kinh doanh.",
      "Cộng điểm khi ngày có hoàng đạo, sao tốt, nhị thập bát tú thuận cho mở hàng, giao dịch hoặc việc có tính công khai.",
      "Trừ điểm với các ngày mang tín hiệu phá, nguy, bế, xung tuổi hoặc có sao bất lợi cho khai trương.",
    ],
    changeFactors: [
      "Năm sinh người chủ sự có thể làm thay đổi điểm vì quan hệ tam hợp, lục hợp, lục xung, hình, hại, phá được xét riêng.",
      "Cùng một ngày có thể tốt cho xuất hành nhưng chưa chắc tốt cho khai trương, nên hãy xem đúng loại việc.",
      "Giờ tốt giúp chọn thời điểm thực hiện trong ngày, nhưng không biến một ngày rất xấu thành ngày lý tưởng.",
    ],
    rangeTips: [
      "Nên chọn khoảng 2-8 tuần để có đủ phương án thay thế.",
      "Nếu mặt bằng, nhân sự hoặc giấy phép đã cố định, hãy nhập khoảng thực tế thay vì khoảng quá rộng.",
      "Khi các ngày gần bằng điểm, ưu tiên ngày sớm hơn và giờ tốt thuận tiện vận hành.",
    ],
    tableRows: [
      { label: "Điểm khai trương", meaning: "Điểm riêng cho mục đích mở hàng, không phải điểm tốt xấu chung của ngày." },
      { label: "Lý do thuận", meaning: "Các tín hiệu đang hỗ trợ như trực tốt, sao tốt, giờ hoàng đạo hoặc hợp tuổi." },
      { label: "Điểm cần lưu ý", meaning: "Các yếu tố nên cân nhắc trước khi chốt lịch, nhất là khi phải làm việc lớn." },
    ],
    faqs: [
      {
        question: "Có cần nhập năm sinh khi xem ngày khai trương không?",
        answer:
          "Không bắt buộc, nhưng nên nhập năm sinh người chủ sự để hệ thống xét thêm xung hợp theo tuổi. Không cần nhập tên hay ngày sinh đầy đủ.",
      },
      {
        question: "Nếu không có ngày nào điểm cao trong khoảng đã chọn thì sao?",
        answer:
          "Bạn có thể mở rộng khoảng tìm kiếm, chọn ngày ít điểm xấu nhất, rồi ưu tiên giờ tốt và giảm các quyết định quan trọng vào ngày đó.",
      },
      {
        question: "Trang này có thay thế tư vấn phong thủy chi tiết không?",
        answer:
          "Không. Đây là công cụ tham khảo nhanh để lọc ngày theo quy tắc lịch và tuổi cơ bản, không thay thế việc cân nhắc vận hành, tài chính và pháp lý.",
      },
    ],
  },
  {
    slug: "cuoi-hoi",
    task: "wedding",
    title: "Tìm ngày cưới hỏi tốt trong khoảng thời gian",
    description:
      "Lọc các ngày phù hợp cho cưới hỏi theo khoảng, xem điểm, lý do thuận, điểm cần lưu ý, giờ tốt và liên kết xem chi tiết từng ngày.",
    eyebrow: "Xem ngày cưới hỏi",
    heading: "Tìm ngày cưới hỏi phù hợp để gia đình dễ đối chiếu",
    intro:
      "Trang này mở sẵn chế độ tìm ngày cho việc cưới hỏi. Kết quả giúp lọc nhanh các ngày đáng xem kỹ hơn, đặc biệt khi gia đình chỉ có một vài cuối tuần hoặc khoảng ngày thuận tiện.",
    criteria: [
      "Ưu tiên các ngày có trực Mãn, Định hoặc Thành vì hợp việc kết nối, ổn định và hoàn tất nghi lễ.",
      "Cộng điểm khi ngày có hoàng đạo, sao tốt, nhị thập bát tú thuận cho hôn lễ, gặp gỡ và việc gia đạo.",
      "Trừ điểm với ngày có tín hiệu phá, nguy, bế, trừ, xung tuổi hoặc sao bất lợi cho cưới hỏi.",
    ],
    changeFactors: [
      "Năm sinh người chủ sự giúp xét thêm quan hệ tuổi, nhưng công cụ không yêu cầu nhập thông tin cá nhân của cô dâu chú rể.",
      "Ngày thuận về lịch vẫn cần khớp với sức khỏe, thời tiết, địa điểm và khả năng tham dự của hai gia đình.",
      "Nếu cần chọn ngày ăn hỏi và ngày cưới riêng, nên tìm từng khoảng ngày thay vì dùng chung một kết quả.",
    ],
    rangeTips: [
      "Hãy chọn khoảng ngày gia đình thật sự có thể tổ chức để kết quả dễ dùng.",
      "Nếu ưu tiên cuối tuần, xem danh sách top ngày rồi mở chi tiết từng ngày để đối chiếu thứ trong tuần.",
      "Khi ngày đẹp bị kín địa điểm, chọn ngày điểm kế tiếp và giờ tốt phù hợp lịch nghi lễ.",
    ],
    tableRows: [
      { label: "Điểm cưới hỏi", meaning: "Điểm riêng cho nghi lễ hôn nhân, tách khỏi các mục đích như khai trương hay ký kết." },
      { label: "Giờ tốt", meaning: "Các khung giờ hoàng đạo có thể dùng để sắp xếp nghi lễ chính trong ngày." },
      { label: "Lưu ý theo tuổi", meaning: "Chỉ xuất hiện khi bạn nhập năm sinh và giúp thấy các quan hệ xung hợp cơ bản." },
    ],
    faqs: [
      {
        question: "Công cụ có cần ngày sinh đầy đủ của hai người không?",
        answer:
          "Không. Giai đoạn lọc ngày chỉ dùng loại việc, khoảng ngày và năm sinh tùy chọn. Không đưa tên hay ngày sinh đầy đủ vào URL.",
      },
      {
        question: "Có nên chỉ chọn ngày điểm cao nhất không?",
        answer:
          "Không nhất thiết. Ngày có điểm cao nên được ưu tiên xem kỹ, nhưng lịch gia đình, địa điểm và nghi lễ thực tế vẫn là điều kiện quan trọng.",
      },
      {
        question: "Vì sao ngày cưới hỏi khác ngày khai trương?",
        answer:
          "Mỗi loại việc được chấm theo nhóm tín hiệu khác nhau. Một ngày có thể thuận cho mở hàng nhưng chưa chắc hợp với nghi lễ gia đạo.",
      },
    ],
  },
  {
    slug: "dong-tho",
    task: "groundbreaking",
    title: "Tìm ngày động thổ tốt trong khoảng thời gian",
    description:
      "So sánh ngày động thổ theo khoảng, xem điểm phù hợp, yếu tố thuận lợi, điểm cần tránh, giờ tốt và hướng dẫn chọn lịch thực tế.",
    eyebrow: "Xem ngày động thổ",
    heading: "Tìm ngày động thổ phù hợp trước khi khởi công",
    intro:
      "Trang này mở sẵn chế độ tìm ngày cho việc động thổ. Kết quả giúp bạn lọc vài ngày đáng cân nhắc trước khi đối chiếu với đội thi công, giấy phép, thời tiết và người chủ sự.",
    criteria: [
      "Ưu tiên các ngày có trực Định, Thành hoặc Khai vì hợp việc bắt đầu công trình và đặt nền cho kế hoạch dài hạn.",
      "Cộng điểm khi ngày có hoàng đạo, sao tốt và nhị thập bát tú thuận cho xây dựng, khởi sự hoặc việc đất đai.",
      "Trừ điểm với ngày có tín hiệu phá, nguy, bế, xung tuổi hoặc các sao bất lợi cho động thổ.",
    ],
    changeFactors: [
      "Năm sinh người chủ sự có thể làm điểm thay đổi vì công cụ xét thêm quan hệ can chi theo tuổi.",
      "Điều kiện pháp lý, giấy phép, thời tiết và an toàn thi công luôn phải được ưu tiên cùng kết quả xem ngày.",
      "Nếu ngày động thổ chỉ là nghi lễ tượng trưng, vẫn nên chọn giờ tốt và giữ quy mô phù hợp.",
    ],
    rangeTips: [
      "Nên chọn khoảng bám sát lịch thi công đã thống nhất với đội xây dựng.",
      "Nếu mùa mưa hoặc công trình phụ thuộc vật tư, hãy giữ vài ngày dự phòng.",
      "Khi hai ngày ngang điểm, ưu tiên ngày ít rủi ro vận hành và dễ tập trung người chủ sự.",
    ],
    tableRows: [
      { label: "Điểm động thổ", meaning: "Điểm riêng cho việc khởi công, làm móng hoặc nghi lễ bắt đầu xây dựng." },
      { label: "Tín hiệu thuận", meaning: "Những yếu tố lịch pháp đang ủng hộ việc bắt đầu công trình." },
      { label: "Rủi ro cần cân nhắc", meaning: "Các điểm trừ để bạn biết khi nào nên đổi ngày hoặc giảm quy mô nghi lễ." },
    ],
    faqs: [
      {
        question: "Ngày động thổ có cần hợp tuổi chủ nhà không?",
        answer:
          "Nên xét nếu có thể. Bạn có thể nhập năm sinh người chủ sự để công cụ cộng trừ thêm theo quan hệ tuổi, không cần nhập dữ liệu cá nhân chi tiết.",
      },
      {
        question: "Công cụ có xem hướng nhà hoặc phong thủy công trình không?",
        answer:
          "Không. Công cụ chỉ lọc ngày theo lịch và tuổi cơ bản. Hướng nhà, thiết kế và phong thủy công trình là lớp tư vấn khác.",
      },
      {
        question: "Nếu đội thi công chỉ rảnh một ngày thì dùng kết quả thế nào?",
        answer:
          "Hãy mở chi tiết ngày đó, xem điểm cần lưu ý và chọn giờ tốt. Nếu điểm thấp, cân nhắc làm nghi lễ gọn hơn hoặc tách nghi lễ khỏi ngày thi công lớn.",
      },
    ],
  },
];

export function getDatePurposePage(slug: string) {
  return DATE_PURPOSE_PAGES.find((page) => page.slug === slug);
}
