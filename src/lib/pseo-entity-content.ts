import type { PseoEntityDefinition, PseoEntityKind } from "@/lib/pseo-registry";

export type PseoEntityContent = {
  intent: string;
  intro: string[];
  contextRows: { label: string; value: string; howToRead: string }[];
  usefulSignals: { title: string; body: string }[];
  misreadRisks: { title: string; body: string }[];
  practiceSteps: string[];
  modifierNotes: string[];
  faqs: { question: string; answer: string }[];
};

type EntityProfile = {
  intent: string;
  core: string;
  lifeSignal: string;
  useful: string[];
  risks: string[];
  practice: string[];
  modifiers: string[];
  faqFocus: string;
};

const MAIN_STAR_PROFILES: Record<string, EntityProfile> = {
  "tu-vi": {
    intent: "hiểu vai trò điều phối, trách nhiệm và nhu cầu đứng ở vị trí trung tâm",
    core: "Tử Vi nên được đọc như năng lực tổ chức trục chính của lá số: muốn gom nguồn lực, lập trật tự và xác định ai chịu trách nhiệm việc gì. Sao này mạnh khi người xem biết đặt mình vào một cấu trúc rõ ràng; nó yếu khi biến trách nhiệm thành gánh nặng vị thế.",
    lifeSignal: "Dấu hiệu dễ thấy là xu hướng được người khác hỏi ý kiến khi cần phân xử, sắp xếp việc chung hoặc giữ nhịp cho một nhóm. Nhưng nếu lá số có nhiều áp lực đi kèm, cùng xu hướng đó có thể thành ôm việc, khó giao quyền và khó thừa nhận mình cũng cần được hỗ trợ.",
    useful: [
      "Khi cần xây hệ thống, phân vai, giữ chuẩn mực hoặc đưa một việc rối về trật tự.",
      "Khi người xem có đủ dữ kiện để chịu trách nhiệm thay vì chỉ muốn kiểm soát kết quả.",
      "Khi cung tọa thủ liên quan đến công việc, tài sản hoặc vai trò gia đình cần sự bền bỉ.",
    ],
    risks: [
      "Đọc thành 'số làm vua' hoặc mặc định quyền lực, trong khi thực tế chỉ là nhu cầu điều phối.",
      "Đánh giá thấp cảm xúc của người khác vì quá tập trung vào vai trò và hệ thống.",
      "Nhầm sự tự trọng với sĩ diện, đặc biệt khi gặp Tuần, Triệt hoặc sát tinh.",
    ],
    practice: [
      "Ghi lại một việc bạn thường phải đứng ra sắp xếp: việc nhà, công việc, tài chính hay quan hệ.",
      "Tách phần bạn thật sự có quyền quyết định khỏi phần bạn chỉ đang lo lắng thay người khác.",
      "Kiểm tra cung Tử Vi tọa thủ và các sao hội chiếu để biết trách nhiệm đó nên dùng mềm hay cứng.",
    ],
    modifiers: [
      "Gặp Thiên Phủ, Thiên Tướng hoặc Hóa Khoa, Tử Vi thiên về điều phối có nguyên tắc và dễ được tin cậy hơn.",
      "Gặp Kình, Đà, Hỏa, Linh hoặc Hóa Kỵ, cần đọc thêm áp lực phòng vệ, tranh quyền hoặc nỗi sợ mất kiểm soát.",
    ],
    faqFocus: "trách nhiệm và vị thế",
  },
  "thien-co": {
    intent: "hiểu tư duy xoay chuyển, khả năng tính toán và cách đổi phương án",
    core: "Thiên Cơ là sao của cơ chế suy nghĩ: quan sát chi tiết, thử phương án, điều chỉnh khi hoàn cảnh thay đổi. Nó không đơn giản là 'thông minh', mà là khả năng nhìn một việc như hệ thống nhiều bánh răng đang chuyển động.",
    lifeSignal: "Người có Thiên Cơ nổi bật thường hay đặt câu hỏi 'nếu đổi cách làm thì sao', dễ thấy đường vòng khi người khác chỉ thấy bế tắc. Điểm yếu xuất hiện khi suy nghĩ quá nhiều, thay đổi liên tục hoặc dùng phân tích để né quyết định.",
    useful: [
      "Khi cần lập kế hoạch, sửa quy trình, phân tích dữ kiện hoặc tìm hướng đi ít tốn lực hơn.",
      "Khi cung liên quan đến học hỏi, nghề nghiệp, dịch chuyển hoặc quan hệ cần sự linh hoạt.",
      "Khi người xem biết kiểm chứng giả thuyết bằng dữ kiện thay vì chỉ suy diễn.",
    ],
    risks: [
      "Đọc thành người chắc chắn mưu lược, trong khi Thiên Cơ xấu có thể rối và thiếu điểm dừng.",
      "Nhầm thay đổi là tiến bộ; có trường hợp đổi hướng chỉ vì bất an.",
      "Bỏ qua yếu tố cảm xúc vì quá tập trung vào phương án kỹ thuật.",
    ],
    practice: [
      "Chọn một quyết định gần đây và viết ra ba phương án bạn đã cân nhắc.",
      "Đánh dấu phương án nào dựa trên dữ kiện thật, phương án nào dựa trên nỗi lo.",
      "Xem cung có Thiên Cơ để biết tư duy này đang phục vụ lĩnh vực nào trong đời sống.",
    ],
    modifiers: [
      "Gặp Văn Xương, Văn Khúc hoặc Hóa Khoa, Thiên Cơ dễ thành năng lực học và giải thích.",
      "Gặp Hóa Kỵ, Không Kiếp hoặc quá nhiều sao động, cần đọc thêm vòng lặp lo nghĩ và đổi ý.",
    ],
    faqFocus: "tư duy và thay đổi",
  },
  "thai-duong": {
    intent: "hiểu trách nhiệm, sự rõ ràng và nhu cầu soi sáng vấn đề",
    core: "Thái Dương biểu thị ánh sáng, sự minh bạch và khả năng đứng ra chịu phần việc thấy rõ. Sao này không chỉ nói về nam giới hay cha; trong thực hành, nó cho biết cách một người dùng trách nhiệm, lý tưởng và sự công khai để tạo ảnh hưởng.",
    lifeSignal: "Khi vận hành tốt, Thái Dương giúp người xem nói thẳng, làm rõ vấn đề và bảo vệ điều đúng. Khi quá tải, nó dễ thành cảm giác phải gánh, phải chứng minh hoặc phải luôn là người sáng suốt.",
    useful: [
      "Khi cần công khai thông tin, dẫn dắt bằng lý lẽ hoặc đưa vấn đề ra ánh sáng.",
      "Khi cung tọa thủ liên quan đến sự nghiệp, quan hệ ngoài xã hội hoặc vai trò với người thân.",
      "Khi người xem có năng lượng cho đi nhưng vẫn biết giữ giới hạn nhận lại.",
    ],
    risks: [
      "Đọc thành luôn tốt, luôn sáng, bỏ qua trường hợp Thái Dương bị che, hãm hoặc quá tải.",
      "Gắn cứng với hình tượng nam giới mà quên ý nghĩa trách nhiệm và độ rõ ràng.",
      "Biến việc giúp người thành nghĩa vụ phải cứu mọi chuyện.",
    ],
    practice: [
      "Tự hỏi: trong lĩnh vực này, tôi đang muốn làm rõ điều gì và đang gánh phần nào quá mức?",
      "Đối chiếu lời nói với hành động: Thái Dương mạnh cần sự nhất quán, không chỉ ý định tốt.",
      "Kiểm tra cung đối xung và tam hợp để biết ánh sáng này đang được hỗ trợ hay bị tiêu hao.",
    ],
    modifiers: [
      "Gặp Thiên Lương, Hóa Khoa hoặc Tả Hữu, Thái Dương thiên về nâng đỡ và dẫn dắt có đạo lý.",
      "Gặp Hóa Kỵ, Đà La hoặc nhiều sao hao, cần đọc thêm áp lực danh dự, mệt mỏi và thất vọng.",
    ],
    faqFocus: "trách nhiệm và sự minh bạch",
  },
  "vu-khuc": {
    intent: "hiểu kỷ luật, năng lực quản trị nguồn lực và cách xử lý thực tế",
    core: "Vũ Khúc là sao của sự cô đọng: tiền bạc, kỹ năng, kỷ luật, quyết định và khả năng biến nguồn lực thành kết quả. Nó không hứa giàu có; nó chỉ cho thấy cách một người làm việc với giá trị, chi phí, hiệu quả và ranh giới.",
    lifeSignal: "Người có Vũ Khúc nổi bật thường thích sự rõ ràng: tiền ra tiền, việc ra việc, trách nhiệm ra trách nhiệm. Mặt khó là biểu đạt cảm xúc khô, khó nhờ vả hoặc xem sự mềm mỏng là thiếu hiệu quả.",
    useful: [
      "Khi cần quản lý tài chính, tài sản, quy trình, kỹ năng hoặc quyết định dựa trên số liệu.",
      "Khi cung tọa thủ đòi hỏi tính bền, tính chịu trách nhiệm và khả năng cắt bỏ lãng phí.",
      "Khi người xem biết dùng kỷ luật để bảo vệ giá trị thay vì ép mình thành máy móc.",
    ],
    risks: [
      "Đọc thành chắc chắn giàu hoặc chắc chắn cô độc; cả hai đều là kết luận quá mức.",
      "Quy mọi vấn đề về tiền/hiệu quả mà bỏ qua nhu cầu cảm xúc và mối quan hệ.",
      "Nhầm cứng rắn với trưởng thành, đặc biệt khi đang phòng vệ vì sợ mất mát.",
    ],
    practice: [
      "Liệt kê ba nguồn lực bạn đang quản: tiền, thời gian, kỹ năng, niềm tin hoặc mối quan hệ.",
      "Chọn một nguồn lực bị thất thoát và xác định nguyên nhân: thiếu luật, thiếu dữ kiện hay thiếu đối thoại.",
      "Đọc Vũ Khúc cùng cung để biết kỷ luật này nên áp vào lĩnh vực nào.",
    ],
    modifiers: [
      "Gặp Lộc Tồn, Hóa Lộc hoặc Thiên Phủ, Vũ Khúc dễ thành năng lực tích lũy và quản trị tài sản.",
      "Gặp Hóa Kỵ, Không Kiếp hoặc sát tinh mạnh, cần đọc thêm rủi ro cực đoan, mất cân bằng và quyết định quá lạnh.",
    ],
    faqFocus: "tài chính và kỷ luật",
  },
  "thien-dong": {
    intent: "hiểu sự mềm dẻo, nhu cầu trải nghiệm và khả năng thích nghi",
    core: "Thiên Đồng là sao của sự dễ hòa nhập, cảm giác sống và khả năng làm mềm tình huống. Nó không phải lười biếng mặc định; vấn đề là năng lượng này cần môi trường nuôi dưỡng, mục tiêu vừa sức và nhịp thay đổi không quá thô bạo.",
    lifeSignal: "Khi tốt, Thiên Đồng giúp người xem biết làm dịu căng thẳng, tìm niềm vui và thích nghi với người khác. Khi lệch, nó dễ trì hoãn, né áp lực hoặc chọn sự dễ chịu ngắn hạn thay vì việc cần làm.",
    useful: [
      "Khi cần hàn gắn, chăm sóc, trải nghiệm, thích nghi hoặc tạo không khí dễ thở.",
      "Khi cung tọa thủ liên quan đến gia đình, quan hệ, con cái hoặc đời sống tinh thần.",
      "Khi người xem biết biến sự mềm thành sức bền, không biến nó thành né tránh.",
    ],
    risks: [
      "Đọc thành vô lo hoặc thiếu trách nhiệm, bỏ qua khả năng làm dịu và phục hồi.",
      "Đánh đồng thích nghi với chiều lòng người khác.",
      "Không nhìn thấy nhu cầu mục tiêu rõ ràng để Thiên Đồng phát huy.",
    ],
    practice: [
      "Ghi lại nơi bạn thường chọn hòa hoãn thay vì đối thoại thẳng.",
      "Tự hỏi sự mềm dẻo đó giúp tình huống tốt lên hay chỉ kéo dài vấn đề.",
      "Đặt một mục tiêu nhỏ trong lĩnh vực của cung để Thiên Đồng có điểm tựa.",
    ],
    modifiers: [
      "Gặp Thiên Lương, Thái Âm hoặc Hóa Khoa, Thiên Đồng dễ thành sự chăm sóc có chiều sâu.",
      "Gặp Hóa Kỵ, Không Kiếp hoặc quá nhiều sao đào hoa, cần đọc thêm xu hướng trôi theo cảm xúc.",
    ],
    faqFocus: "thích nghi và cảm xúc",
  },
  "liem-trinh": {
    intent: "hiểu nguyên tắc, ranh giới và sức hút cá nhân",
    core: "Liêm Trinh đặt câu hỏi về điều gì là đúng, điều gì cần giữ ranh giới và điều gì đang hấp dẫn nhưng có giá phải trả. Sao này không chỉ nói về đào hoa; nó là năng lượng của chuẩn mực, phản ứng đạo đức và sự tự kiểm soát.",
    lifeSignal: "Khi tốt, Liêm Trinh giúp người xem giữ phẩm chất, biết nói không và có sức hút vì sống có nguyên tắc. Khi lệch, nó dễ thành cực đoan, nóng, tự trói trong chuẩn mực hoặc phản ứng mạnh trước điều mình cho là sai.",
    useful: [
      "Khi cần xác định ranh giới, luật chơi, trách nhiệm đạo đức hoặc sức hút cá nhân.",
      "Khi cung tọa thủ liên quan đến quan hệ, công việc, danh dự hoặc lựa chọn nhạy cảm.",
      "Khi người xem biết phân biệt nguyên tắc thật với phản ứng tự ái.",
    ],
    risks: [
      "Đọc thành tai tiếng hoặc đào hoa một chiều, bỏ qua mặt tự chủ và giữ chuẩn.",
      "Biến đúng-sai thành phán xét cứng, không xét hoàn cảnh.",
      "Không nhận ra ham muốn được công nhận đang đứng sau phản ứng mạnh.",
    ],
    practice: [
      "Viết ra một ranh giới bạn đang muốn giữ trong lĩnh vực của cung.",
      "Hỏi: ranh giới này bảo vệ giá trị thật hay chỉ bảo vệ hình ảnh của tôi?",
      "Xem bộ sao đi kèm để biết Liêm Trinh đang thiên về tự chủ, hấp dẫn hay xung đột.",
    ],
    modifiers: [
      "Gặp Tử Vi, Thiên Phủ hoặc Hóa Khoa, Liêm Trinh dễ thành nguyên tắc có tổ chức.",
      "Gặp Tham Lang, Hóa Kỵ, Kình Đà hoặc Hỏa Linh, cần đọc kỹ ham muốn, nóng nảy và rủi ro vượt ranh giới.",
    ],
    faqFocus: "ranh giới và chuẩn mực",
  },
  "thien-phu": {
    intent: "hiểu năng lực bảo toàn, tích lũy và điều phối nền tảng",
    core: "Thiên Phủ là kho chứa: giữ gìn, phân phối, bảo toàn và tạo nền an toàn. Sao này không chỉ nói về tiền hay kho tàng; nó cho biết cách một người giữ nguồn lực để đời sống không bị đứt gãy.",
    lifeSignal: "Khi tốt, Thiên Phủ làm người khác có cảm giác yên tâm vì mọi thứ có chỗ để đặt. Khi lệch, nó thành giữ quá chặt, chậm quyết định, sợ rủi ro hoặc muốn an toàn đến mức bỏ lỡ cơ hội.",
    useful: [
      "Khi cần xây nền, giữ tài sản, quản lý gia đình, bảo toàn kinh nghiệm hoặc điều phối hậu cần.",
      "Khi cung tọa thủ cần sự ổn định dài hạn hơn là bùng nổ ngắn hạn.",
      "Khi người xem biết dùng an toàn làm bệ phóng, không dùng nó làm lý do đứng yên.",
    ],
    risks: [
      "Đọc thành giàu sang mặc định, trong khi Thiên Phủ còn cần nguồn vào và cách quản trị.",
      "Nhầm thận trọng với sáng suốt nếu thực chất là sợ mất.",
      "Bỏ qua trách nhiệm phân phối: kho giữ mà không dùng đúng cũng thành trì trệ.",
    ],
    practice: [
      "Xác định thứ bạn đang giữ: tiền, nhà cửa, kiến thức, quan hệ hay uy tín.",
      "Hỏi thứ đó đang tạo an toàn hay đang khiến bạn không dám thay đổi.",
      "Đọc Thiên Phủ cùng cung để biết kho nguồn lực này phục vụ lĩnh vực nào.",
    ],
    modifiers: [
      "Gặp Vũ Khúc, Lộc Tồn hoặc Hóa Lộc, Thiên Phủ tăng màu quản trị tài sản và tích lũy.",
      "Gặp Không Kiếp, Tuần Triệt hoặc sát tinh, cần đọc thêm biến động kho, nỗi sợ thiếu và cách phục hồi.",
    ],
    faqFocus: "tích lũy và an toàn",
  },
  "thai-am": {
    intent: "hiểu chiều sâu nội tâm, tích lũy âm thầm và khả năng quan sát",
    core: "Thái Âm là ánh sáng dịu: nội tâm, quan sát, tích lũy, cảm nhận và nguồn lực âm thầm. Sao này không nên chỉ gắn với mẹ hay nữ giới; nó cho thấy cách một người nuôi dưỡng sự an toàn từ bên trong.",
    lifeSignal: "Khi tốt, Thái Âm giúp người xem biết nhìn xa, chăm chút chi tiết và nhận ra nhu cầu chưa nói thành lời. Khi lệch, nó dễ thành lo nghĩ, giữ trong lòng, quyết định theo bất an hoặc quá phụ thuộc vào cảm giác an toàn.",
    useful: [
      "Khi cần tích lũy, chăm sóc, phân tích mềm, đọc cảm xúc hoặc quản lý nguồn lực kín đáo.",
      "Khi cung tọa thủ liên quan đến tài chính, nhà cửa, gia đình, cảm xúc hoặc người cần được nâng đỡ.",
      "Khi người xem biết biến trực giác thành quan sát có kiểm chứng.",
    ],
    risks: [
      "Đọc thành may mắn tài sản hoặc hình tượng nữ giới một chiều.",
      "Nhầm lo xa với cẩn thận nếu không có dữ kiện cụ thể.",
      "Không nói nhu cầu thật rồi kỳ vọng người khác tự hiểu.",
    ],
    practice: [
      "Ghi lại một điều bạn đang lo và tách nó thành dữ kiện, giả định, cảm xúc.",
      "Kiểm tra xem sự tích lũy hiện tại đang giúp bạn an toàn hay khiến bạn đóng kín.",
      "Đọc Thái Âm theo cung để biết vùng đời sống nào cần chăm sóc chậm và sâu.",
    ],
    modifiers: [
      "Gặp Thiên Đồng, Thiên Lương hoặc Hóa Khoa, Thái Âm tăng khả năng nuôi dưỡng và chữa lành bằng hiểu biết.",
      "Gặp Hóa Kỵ, Đà La hoặc nhiều sao hao, cần đọc thêm lo âu, mất ngủ cảm xúc và rối tài sản.",
    ],
    faqFocus: "nội tâm và tích lũy",
  },
  "tham-lang": {
    intent: "hiểu ham muốn trải nghiệm, giao tiếp và sức hút mở rộng",
    core: "Tham Lang là năng lượng muốn nếm trải đời sống: học, giao tiếp, hấp dẫn, mở rộng quan hệ và thử điều mới. Nó không chỉ là sao ham vui; nó cho biết cách một người tiếp xúc với nhu cầu, cơ hội và giới hạn.",
    lifeSignal: "Khi tốt, Tham Lang làm người xem linh hoạt, có duyên xã hội và dễ học qua trải nghiệm. Khi lệch, nó dễ quá tay, phân tán, khó giữ cam kết hoặc bị kéo bởi ham muốn ngắn hạn.",
    useful: [
      "Khi cần mở quan hệ, học kỹ năng mới, làm truyền thông, bán hàng hoặc thay đổi môi trường.",
      "Khi cung tọa thủ cần sức sống, khả năng kết nối và độ nhạy với cơ hội.",
      "Khi người xem biết đặt giới hạn trước khi bước vào cuộc chơi mới.",
    ],
    risks: [
      "Đọc thành xấu vì ham muốn, trong khi ham muốn có thể là động lực học và sống.",
      "Nhầm sức hút với độ bền của quan hệ.",
      "Không phân biệt trải nghiệm giúp trưởng thành với trải nghiệm chỉ để thoát chán.",
    ],
    practice: [
      "Liệt kê ba điều đang hấp dẫn bạn trong lĩnh vực của cung.",
      "Đánh dấu điều nào tạo giá trị dài hạn, điều nào chỉ tạo kích thích ngắn hạn.",
      "Xem sao đi kèm để biết Tham Lang có được kỷ luật hóa hay đang bị kéo quá đà.",
    ],
    modifiers: [
      "Gặp Vũ Khúc, Hóa Lộc hoặc Văn tinh, Tham Lang dễ thành kỹ năng kiếm cơ hội và giao tiếp có giá trị.",
      "Gặp Liêm Trinh, Hóa Kỵ hoặc sát tinh, cần đọc kỹ ranh giới, dục vọng, danh tiếng và chi phí ẩn.",
    ],
    faqFocus: "ham muốn và giới hạn",
  },
  "cu-mon": {
    intent: "hiểu ngôn ngữ, tranh biện và khả năng phát hiện điểm mờ",
    core: "Cự Môn là cánh cửa của lời nói: phân tích, chất vấn, phản biện, nghi ngờ và làm rõ điều bị che. Sao này không chỉ là thị phi; nó là năng lực nhìn ra lỗ hổng trong thông tin.",
    lifeSignal: "Khi tốt, Cự Môn giúp người xem hỏi đúng câu, nói rõ vấn đề và bảo vệ sự thật. Khi lệch, nó dễ thành nói quá, nghi ngờ quá mức, vướng hiểu lầm hoặc biến mọi cuộc trao đổi thành tranh thắng thua.",
    useful: [
      "Khi cần đàm phán, phân tích hợp đồng, giảng giải, phản biện hoặc xử lý thông tin mập mờ.",
      "Khi cung tọa thủ liên quan đến giao tiếp, quan hệ, công việc trí óc hoặc các quyết định cần minh bạch.",
      "Khi người xem biết dùng câu hỏi để làm rõ, không dùng nó để công kích.",
    ],
    risks: [
      "Đọc thành chắc chắn thị phi mà bỏ qua khả năng phân tích và bảo vệ sự thật.",
      "Không phân biệt nghi ngờ có căn cứ với thói quen phòng vệ.",
      "Để cảm xúc điều khiển ngôn từ, làm vấn đề nhỏ thành lớn.",
    ],
    practice: [
      "Chọn một cuộc tranh luận gần đây và viết lại câu hỏi cốt lõi của nó.",
      "Kiểm tra xem bạn đang tìm sự thật, tìm an toàn hay tìm phần thắng.",
      "Đọc Cự Môn cùng cung để biết lời nói ảnh hưởng mạnh nhất tới lĩnh vực nào.",
    ],
    modifiers: [
      "Gặp Hóa Khoa, Văn Xương, Văn Khúc, Cự Môn dễ thành năng lực giải thích và biện luận sạch.",
      "Gặp Hóa Kỵ, Đà La hoặc Linh Hỏa, cần đọc thêm hiểu lầm, ám ảnh và lời nói gây tổn thương.",
    ],
    faqFocus: "lời nói và phản biện",
  },
  "thien-tuong": {
    intent: "hiểu năng lực hỗ trợ, cân bằng tiêu chuẩn và đứng giữa các bên",
    core: "Thiên Tướng là sao của vai trò phụ tá, bảo hộ tiêu chuẩn và giữ công bằng trong quan hệ. Nó không phải sao yếu; điểm mạnh của nó nằm ở khả năng phối hợp, nâng đỡ và khiến hệ thống vận hành đúng mực.",
    lifeSignal: "Khi tốt, Thiên Tướng giúp người xem biết bảo vệ người yếu thế, giữ lễ và đứng giữa để giảm xung đột. Khi lệch, nó dễ phụ thuộc đánh giá bên ngoài, sợ làm mất lòng hoặc chậm quyết định vì muốn mọi bên đều ổn.",
    useful: [
      "Khi cần phối hợp đội nhóm, làm dịch vụ, quản trị quan hệ hoặc giữ tiêu chuẩn công bằng.",
      "Khi cung tọa thủ liên quan đến hợp tác, hôn nhân, nghề nghiệp hoặc các vai trò đại diện.",
      "Khi người xem biết hỗ trợ mà không đánh mất quyền quyết định của mình.",
    ],
    risks: [
      "Đọc thành chỉ biết theo người khác, bỏ qua năng lực bảo vệ hệ thống.",
      "Dùng chữ công bằng để né lựa chọn khó.",
      "Quá cần được đánh giá là tử tế nên không dám đặt ranh giới.",
    ],
    practice: [
      "Xác định trong lĩnh vực của cung, bạn đang hỗ trợ ai và tiêu chuẩn nào cần giữ.",
      "Tự hỏi sự hỗ trợ đó có làm bạn mất tiếng nói hay không.",
      "Kiểm tra sao đi cùng để biết Thiên Tướng đang mềm dẻo, nguyên tắc hay bị kéo lệch.",
    ],
    modifiers: [
      "Gặp Tử Vi, Thiên Phủ hoặc Tả Hữu, Thiên Tướng tăng năng lực quản trị và phối hợp.",
      "Gặp Hóa Kỵ, Kình Đà hoặc nhiều sao hao, cần đọc thêm áp lực làm vừa lòng và rối vai trò.",
    ],
    faqFocus: "hỗ trợ và công bằng",
  },
  "thien-luong": {
    intent: "hiểu đạo lý, bảo hộ, kinh nghiệm và khả năng nhìn hậu quả dài hạn",
    core: "Thiên Lương là sao của sự nâng đỡ có nguyên tắc: bảo vệ, chữa lành, truyền kinh nghiệm và nhìn hệ quả lâu dài. Nó không chỉ là sao phúc; nó còn hỏi người xem đang dùng đạo lý để giúp hay để phán xét.",
    lifeSignal: "Khi tốt, Thiên Lương khiến người khác tin vì sự điềm đạm và kinh nghiệm. Khi lệch, nó dễ thành đạo đức hóa vấn đề, khó chấp nhận khác biệt hoặc muốn sửa người khác theo chuẩn của mình.",
    useful: [
      "Khi cần cố vấn, giáo dục, chăm sóc, hòa giải hoặc đánh giá hệ quả dài hạn.",
      "Khi cung tọa thủ liên quan đến gia đình, sức bền tinh thần, nghề giúp người hoặc trách nhiệm đạo lý.",
      "Khi người xem biết dùng kinh nghiệm như đèn soi, không như chiếc thước phán xét.",
    ],
    risks: [
      "Đọc thành luôn có phúc, bỏ qua trách nhiệm sống đúng với kinh nghiệm mình có.",
      "Nhầm bảo hộ với kiểm soát.",
      "Dùng lời khuyên để tránh lắng nghe hoàn cảnh thật của người khác.",
    ],
    practice: [
      "Ghi lại lời khuyên bạn hay đưa ra trong lĩnh vực của cung.",
      "Hỏi lời khuyên đó dựa trên kinh nghiệm thật hay dựa trên nỗi sợ lặp lại sai lầm cũ.",
      "Đối chiếu Thiên Lương với sao đi kèm để biết tính bảo hộ đang mềm hay cứng.",
    ],
    modifiers: [
      "Gặp Thái Dương, Thiên Đồng hoặc Hóa Khoa, Thiên Lương dễ thành năng lực cố vấn và chữa lành.",
      "Gặp sát tinh hoặc Hóa Kỵ, cần đọc thêm cảm giác bị gánh đạo lý, phán xét và áp lực trách nhiệm.",
    ],
    faqFocus: "đạo lý và bảo hộ",
  },
  "that-sat": {
    intent: "hiểu quyết đoán, áp lực, năng lực cắt đứt bế tắc và chịu trận",
    core: "Thất Sát là sao của quyết định trong hoàn cảnh khó: cắt, đổi, chịu áp lực và bước qua vùng không chắc chắn. Nó không phải dấu hiệu xấu mặc định; nó cho thấy nơi đời sống cần bản lĩnh và chiến lược quản trị rủi ro.",
    lifeSignal: "Khi tốt, Thất Sát giúp người xem hành động nhanh khi tình huống đã chín. Khi lệch, nó dễ hấp tấp, cực đoan, tự cô lập hoặc quen giải quyết bằng đứt đoạn thay vì thương lượng.",
    useful: [
      "Khi cần xử lý khủng hoảng, thay đổi mạnh, tái cấu trúc hoặc bảo vệ quyết định khó.",
      "Khi cung tọa thủ liên quan đến sự nghiệp, môi trường cạnh tranh, dịch chuyển hoặc quan hệ cần ranh giới rõ.",
      "Khi người xem có dữ kiện và kế hoạch dự phòng trước khi cắt bỏ.",
    ],
    risks: [
      "Đọc thành hung hiểm một chiều, khiến người xem sợ lá số thay vì hiểu cách dùng bản lĩnh.",
      "Nhầm nhanh với đúng.",
      "Không thấy nhu cầu phục hồi sau giai đoạn căng thẳng.",
    ],
    practice: [
      "Chọn một quyết định bạn muốn cắt bỏ hoặc thay đổi mạnh.",
      "Viết ra chi phí nếu hành động ngay, chi phí nếu trì hoãn và phương án phục hồi.",
      "Đọc Thất Sát cùng cung để biết vùng đời sống nào đang đòi hỏi bản lĩnh có kiểm soát.",
    ],
    modifiers: [
      "Gặp Tử Vi, Thiên Phủ hoặc Hóa Khoa, Thất Sát có thêm trục kiểm soát và chiến lược.",
      "Gặp Không Kiếp, Hỏa Linh hoặc Kình Đà mạnh, cần đọc thêm rủi ro nóng vội, đứt gãy và tai nạn quyết định.",
    ],
    faqFocus: "quyết đoán và rủi ro",
  },
  "pha-quan": {
    intent: "hiểu đổi mới, phá cấu trúc cũ và tái thiết sau biến động",
    core: "Phá Quân là năng lượng kết thúc một chu kỳ để mở đường cho cấu trúc mới. Nó không chỉ là phá hoại; nó cho biết nơi người xem khó chịu với khuôn cũ và cần học cách đổi mới có hậu quả được tính trước.",
    lifeSignal: "Khi tốt, Phá Quân giúp dám đổi, dám làm lại và không mắc kẹt trong mô hình đã hết tác dụng. Khi lệch, nó dễ phá quá sớm, chán nhanh, đốt cầu hoặc tạo biến động chỉ để thấy mình còn tự do.",
    useful: [
      "Khi cần tái cấu trúc, chuyển nghề, đổi mô hình sống, xử lý khủng hoảng hoặc bỏ thói quen cũ.",
      "Khi cung tọa thủ liên quan đến giai đoạn chuyển tiếp rõ rệt.",
      "Khi người xem có kế hoạch thay thế, không chỉ có mong muốn thoát ra.",
    ],
    risks: [
      "Đọc thành xấu vì phá, bỏ qua khả năng làm mới và dọn cái đã mục.",
      "Nhầm tự do với thiếu cam kết.",
      "Không tính chi phí sau khi phá cấu trúc cũ.",
    ],
    practice: [
      "Viết rõ điều gì trong lĩnh vực của cung đã hết tác dụng.",
      "Xác định thứ sẽ thay thế nó trong 30-90 ngày tới.",
      "Đọc Phá Quân cùng sao đi kèm để biết đổi mới này có kế hoạch hay đang phản ứng.",
    ],
    modifiers: [
      "Gặp Vũ Khúc, Tử Vi hoặc Hóa Quyền, Phá Quân dễ thành tái cấu trúc có lực quản trị.",
      "Gặp Không Kiếp, Hóa Kỵ hoặc nhiều sao hao, cần đọc thêm xu hướng bốc đồng, mất mát và thiếu điểm neo.",
    ],
    faqFocus: "đổi mới và tái cấu trúc",
  },
};

const PALACE_PROFILES: Record<string, EntityProfile> = {
  menh: {
    intent: "hiểu khí chất nền, cách phản ứng và trục tự nhận diện",
    core: "Cung Mệnh là điểm bắt đầu khi đọc lá số vì nó mô tả khí chất nền: cách một người phản ứng, chọn vai trò và cảm nhận mình là ai. Cung này không đủ để kết luận toàn bộ đời sống, nhưng nó cho biết lăng kính đầu tiên qua đó người xem xử lý mọi việc.",
    lifeSignal: "Những nhận định ở cung Mệnh nên được kiểm chứng bằng thói quen lâu dài: cách ra quyết định, cách đối diện áp lực, điều gì làm người xem thấy đúng với bản thân. Nếu chỉ dùng một sao ở Mệnh để dán nhãn tính cách, trang đọc sẽ rất dễ sai.",
    useful: [
      "Khi muốn hiểu phong cách sống nền trước khi đi vào tiền bạc, công việc hay quan hệ.",
      "Khi cần phân biệt bản chất ổn định với phản ứng nhất thời theo vận.",
      "Khi người xem đang hỏi 'vì sao tôi thường phản ứng như vậy'.",
    ],
    risks: [
      "Xem Mệnh như toàn bộ số phận và bỏ qua Thân, tam hợp, đại vận.",
      "Nhầm khí chất với hành vi không thể thay đổi.",
      "Dùng một câu mô tả để tự giới hạn lựa chọn của mình.",
    ],
    practice: [
      "Ghi ba phản ứng lặp lại khi bạn bị áp lực.",
      "Đối chiếu chúng với sao tại Mệnh và cung tam hợp.",
      "Tách điều thuộc khí chất nền khỏi điều chỉ xuất hiện trong một giai đoạn vận.",
    ],
    modifiers: [
      "Mệnh cần đọc cùng cung Thân để biết con người khi trưởng thành hành động khác gì khí chất ban đầu.",
      "Tam hợp Mệnh - Tài - Quan cho biết khí chất đó đi vào tiền bạc và công việc ra sao.",
    ],
    faqFocus: "khí chất nền",
  },
  "phu-mau": {
    intent: "hiểu quan hệ với cha mẹ, người lớn và nguồn nâng đỡ ban đầu",
    core: "Cung Phụ Mẫu nói về cách một người trải nghiệm sự nâng đỡ, kỳ vọng và khuôn mẫu từ thế hệ trước. Nó không dùng để phán xét cha mẹ tốt xấu, mà để hiểu ảnh hưởng của môi trường đầu đời lên cách người xem trưởng thành.",
    lifeSignal: "Nội dung cung này nên được đối chiếu với ký ức gia đình, cách nhận hỗ trợ, thái độ với quyền uy và những kỳ vọng người xem mang theo khi lớn lên. Một lá số mạnh ở cung này vẫn có thể có áp lực nếu kỳ vọng quá cao.",
    useful: [
      "Khi muốn hiểu quan hệ với cha mẹ, cấp trên, người đỡ đầu hoặc truyền thống gia đình.",
      "Khi đang lặp lại một khuôn mẫu cũ trong công việc hoặc hôn nhân.",
      "Khi cần phân biệt lòng biết ơn với cảm giác bị ràng buộc.",
    ],
    risks: [
      "Dùng cung này để kết luận đạo đức của cha mẹ.",
      "Bỏ qua hoàn cảnh lịch sử, kinh tế và văn hóa của gia đình.",
      "Nhầm hỗ trợ với kiểm soát hoặc nhầm độc lập với cắt đứt.",
    ],
    practice: [
      "Viết một kỳ vọng gia đình ảnh hưởng mạnh tới bạn.",
      "Xem kỳ vọng đó đang nâng đỡ hay đang làm bạn khó chọn đường riêng.",
      "Đọc sao tại Phụ Mẫu cùng cung Mệnh để biết bạn hấp thụ khuôn mẫu đó thế nào.",
    ],
    modifiers: [
      "Các sao mềm như Thiên Đồng, Thái Âm thường nhấn mạnh nhu cầu chăm sóc và cảm xúc.",
      "Các sao cứng như Vũ Khúc, Thất Sát thường yêu cầu đọc thêm kỷ luật, khoảng cách và áp lực kỳ vọng.",
    ],
    faqFocus: "gia đình và kỳ vọng",
  },
  "phuc-duc": {
    intent: "hiểu nền tinh thần, nếp nhà và sức bền bên trong",
    core: "Cung Phúc Đức là lớp nền sâu: nếp gia đình, đời sống tinh thần, cảm giác được nâng đỡ vô hình và sức bền khi gặp biến động. Đây không phải nơi để nói may rủi mơ hồ; nó cho biết người xem phục hồi bằng nguồn lực nào.",
    lifeSignal: "Khi đọc cung này, hãy quan sát những thứ lặp lại trong gia đình: cách xử lý khủng hoảng, niềm tin, thói quen chăm sóc nhau hoặc những điều không được nói ra. Phúc Đức tốt thường tạo nền phục hồi, nhưng vẫn cần hành động cụ thể.",
    useful: [
      "Khi muốn hiểu vì sao mình bền hoặc dễ kiệt sức trong một số hoàn cảnh.",
      "Khi cần đọc nếp nhà, niềm tin và nguồn nâng đỡ tinh thần.",
      "Khi đang tìm cách phục hồi sau biến động dài.",
    ],
    risks: [
      "Đọc thành phúc dày thì mọi việc tự tốt.",
      "Gắn mọi khó khăn cho tổ tiên hoặc nghiệp mà bỏ qua lựa chọn hiện tại.",
      "Không nhận ra sức bền tinh thần cũng cần được luyện bằng thói quen.",
    ],
    practice: [
      "Ghi lại điều trong gia đình giúp bạn vững hơn.",
      "Ghi thêm điều trong nếp cũ khiến bạn dễ lặp lại căng thẳng.",
      "Đối chiếu sao tại Phúc Đức với thói quen phục hồi hiện tại.",
    ],
    modifiers: [
      "Sao phúc thiện như Thiên Lương, Thiên Đồng giúp đọc về nâng đỡ và hồi phục.",
      "Sao biến động như Phá Quân, Thất Sát yêu cầu đọc thêm khả năng tái thiết nền tinh thần.",
    ],
    faqFocus: "nền tinh thần",
  },
  "dien-trach": {
    intent: "hiểu nhà cửa, không gian sống và cách tạo ổn định vật chất",
    core: "Cung Điền Trạch nói về nơi chốn, tài sản gắn với chỗ ở và cảm giác có nền để quay về. Nó không chỉ là có nhà hay không; nó còn mô tả cách người xem xây, giữ, đổi hoặc cảm nhận không gian sống.",
    lifeSignal: "Hãy kiểm chứng cung này qua cách bạn chọn nhà, giữ đồ, sửa chữa, đầu tư bất động sản hoặc tạo nếp sinh hoạt. Một cung Điền mạnh không miễn trừ rủi ro tài chính; nó chỉ cho thấy chủ đề ổn định vật chất có vai trò lớn.",
    useful: [
      "Khi đọc chuyện nhà cửa, tài sản cố định, nơi làm việc hoặc cảm giác an cư.",
      "Khi cần hiểu vì sao một người cần không gian riêng hoặc hay thay đổi chỗ ở.",
      "Khi đang cân nhắc sửa nhà, mua nhà, chuyển nơi sống hoặc phân chia tài sản.",
    ],
    risks: [
      "Đọc thành chắc chắn có nhiều nhà đất.",
      "Bỏ qua năng lực tài chính thực tế, pháp lý và chu kỳ thị trường.",
      "Nhầm nhu cầu an cư với nỗi sợ thay đổi.",
    ],
    practice: [
      "Viết ra ba tiêu chí khiến bạn thấy một nơi là 'nhà'.",
      "Tách tiêu chí cảm xúc khỏi tiêu chí tài chính.",
      "Đọc sao tại Điền Trạch cùng Tài Bạch để tránh quyết định nhà cửa thiếu cân đối.",
    ],
    modifiers: [
      "Thiên Phủ, Thái Âm, Vũ Khúc thường làm nổi bật tích lũy, giữ gìn và tài sản.",
      "Phá Quân, Thất Sát hoặc Không Kiếp yêu cầu đọc thêm biến động, sửa đổi và kế hoạch dự phòng.",
    ],
    faqFocus: "nhà cửa và tài sản",
  },
  "quan-loc": {
    intent: "hiểu nghề nghiệp, trách nhiệm và cách tạo giá trị xã hội",
    core: "Cung Quan Lộc nói về con đường tạo giá trị: nghề nghiệp, trách nhiệm, vị trí trong tổ chức và cách một người muốn được công nhận qua việc làm. Nó không phải danh sách nghề cố định; nó là logic vận hành trong công việc.",
    lifeSignal: "Khi đọc Quan Lộc, hãy nhìn cách người xem chọn việc, chịu trách nhiệm, xử lý cấp trên/cấp dưới và phản ứng với mục tiêu dài hạn. Một sao mạnh ở đây cần được đặt vào kỹ năng, thị trường và giai đoạn tuổi đời cụ thể.",
    useful: [
      "Khi muốn hiểu phong cách làm việc và loại trách nhiệm phù hợp.",
      "Khi đang đổi nghề, lên vai trò quản lý hoặc mất định hướng công việc.",
      "Khi cần nối Mệnh - Tài - Quan thành một bức tranh thực tế.",
    ],
    risks: [
      "Dùng cung này để phán chắc nghề nghiệp tương lai.",
      "Bỏ qua kỹ năng, học tập và điều kiện thị trường.",
      "Nhầm chức danh với giá trị thật người xem tạo ra.",
    ],
    practice: [
      "Ghi ba việc bạn làm tốt ngay cả khi không ai nhắc.",
      "Đối chiếu chúng với sao tại Quan Lộc và cung Mệnh.",
      "Xem Tài Bạch để biết công việc đó chuyển thành nguồn lực ra sao.",
    ],
    modifiers: [
      "Tử Vi, Thái Dương, Thiên Tướng thường nhấn mạnh vai trò tổ chức, trách nhiệm và đại diện.",
      "Thiên Cơ, Cự Môn, Tham Lang thường nhấn mạnh tư duy, giao tiếp và đổi mới cách làm.",
    ],
    faqFocus: "sự nghiệp",
  },
  "no-boc": {
    intent: "hiểu bạn bè, đồng nghiệp, đội nhóm và cách hợp tác",
    core: "Cung Nô Bộc mô tả quan hệ ngang/dưới trong môi trường xã hội: bạn bè, đồng nghiệp, cộng sự, khách hàng hoặc người hỗ trợ. Nó không nên đọc như số có người giúp hay phá một chiều; trọng tâm là cách người xem chọn và vận hành mạng lưới.",
    lifeSignal: "Hãy kiểm chứng bằng kiểu người bạn hay thu hút, cách bạn phân quyền, mức độ tin tưởng đội nhóm và phản ứng khi hợp tác không như kỳ vọng. Cung này đặc biệt quan trọng với người làm kinh doanh, quản lý hoặc nghề dịch vụ.",
    useful: [
      "Khi muốn hiểu chất lượng mạng lưới và cách làm việc với người khác.",
      "Khi gặp vấn đề về nhân sự, cộng sự hoặc bạn bè.",
      "Khi cần biết nên giữ khoảng cách, trao quyền hay tái cấu trúc nhóm.",
    ],
    risks: [
      "Đọc thành bạn bè tốt/xấu cố định.",
      "Không nhìn phần trách nhiệm của chính người xem trong cách chọn người.",
      "Nhầm thân thiết với hợp tác hiệu quả.",
    ],
    practice: [
      "Liệt kê ba kiểu người thường xuất hiện trong mạng lưới của bạn.",
      "Đánh dấu ai giúp bạn trưởng thành, ai chỉ tạo cảm giác quen thuộc.",
      "Đọc sao tại Nô Bộc để biết kiểu hợp tác cần luật rõ hay sự linh hoạt.",
    ],
    modifiers: [
      "Thiên Tướng, Thiên Đồng, Thiên Lương thường tăng nhu cầu hỗ trợ và quan hệ tử tế.",
      "Cự Môn, Thất Sát, Phá Quân yêu cầu đọc thêm xung đột, cạnh tranh và tái cấu trúc đội nhóm.",
    ],
    faqFocus: "đội nhóm và bạn bè",
  },
  "thien-di": {
    intent: "hiểu môi trường bên ngoài, dịch chuyển và cách thích nghi xã hội",
    core: "Cung Thiên Di nói về cách một người bước ra ngoài: môi trường xã hội, di chuyển, hình ảnh khi tiếp xúc với người lạ và cơ hội đến từ không gian ngoài vùng quen thuộc. Nó là cung của tương tác với thế giới.",
    lifeSignal: "Kiểm chứng cung này qua trải nghiệm đi xa, đổi môi trường, làm việc với người ngoài gia đình hoặc xuất hiện trước công chúng. Có người trong nhà rất khác nhưng ra ngoài lại bật lên rõ; đó là lý do Thiên Di cần đọc riêng.",
    useful: [
      "Khi xem chuyện đi xa, đổi nơi sống, giao tiếp xã hội hoặc cơ hội bên ngoài.",
      "Khi người xem thấy mình thay đổi mạnh tùy môi trường.",
      "Khi cần biết nên mở rộng hay củng cố vùng an toàn.",
    ],
    risks: [
      "Đọc thành chắc chắn xuất ngoại hoặc đi xa.",
      "Bỏ qua sự khác biệt giữa môi trường phù hợp và môi trường gây hao tổn.",
      "Nhầm hình ảnh xã hội với con người riêng tư.",
    ],
    practice: [
      "Ghi lại ba môi trường khiến bạn phát huy tốt nhất.",
      "Ghi thêm ba môi trường làm bạn mất năng lượng.",
      "Đối chiếu sao tại Thiên Di để biết bạn cần loại không gian nào để mở rộng.",
    ],
    modifiers: [
      "Thái Dương, Tham Lang, Thiên Cơ thường làm nổi bật giao tiếp, dịch chuyển và cơ hội ngoài xã hội.",
      "Thất Sát, Phá Quân hoặc Không Kiếp cần đọc thêm rủi ro khi đổi môi trường quá nhanh.",
    ],
    faqFocus: "môi trường bên ngoài",
  },
  "tat-ach": {
    intent: "hiểu áp lực, thói quen thân-tâm và tín hiệu cần chăm sóc",
    core: "Cung Tật Ách không dùng để chẩn đoán bệnh. Nó giúp người xem nhận diện kiểu áp lực, thói quen làm hao năng lượng và cách thân-tâm báo tín hiệu khi đời sống mất cân bằng. Mọi vấn đề y tế vẫn cần chuyên gia.",
    lifeSignal: "Hãy kiểm chứng bằng thói quen ngủ nghỉ, cách xử lý stress, vùng cơ thể dễ căng và kiểu cảm xúc lặp lại khi quá tải. Cung này hữu ích nhất khi được dùng để phòng ngừa bằng thói quen, không phải để gieo sợ hãi.",
    useful: [
      "Khi muốn hiểu cách mình phản ứng với áp lực và cần chăm sóc bản thân ra sao.",
      "Khi đang mất nhịp sống, kiệt sức hoặc có thói quen gây hao tổn.",
      "Khi cần đọc giới hạn thân-tâm trước các quyết định lớn.",
    ],
    risks: [
      "Dùng tử vi để tự chẩn đoán hoặc thay lời khuyên y tế.",
      "Gieo sợ hãi bằng các kết luận bệnh tật tuyệt đối.",
      "Bỏ qua thói quen hiện tại vì đổ hết cho lá số.",
    ],
    practice: [
      "Theo dõi một tuần ngủ, ăn, vận động và thời điểm căng thẳng.",
      "Xác định thói quen nào có thể điều chỉnh ngay mà không cần suy diễn.",
      "Đọc sao tại Tật Ách như gợi ý chăm sóc, không như kết luận bệnh.",
    ],
    modifiers: [
      "Thiên Lương, Thái Âm, Thiên Đồng thường gợi ý phục hồi bằng nhịp sống mềm và chăm sóc đều.",
      "Hỏa Linh, Kình Đà, Thất Sát hoặc Hóa Kỵ cần đọc thêm áp lực cao và yêu cầu kiểm tra thực tế.",
    ],
    faqFocus: "áp lực và chăm sóc bản thân",
  },
  "tai-bach": {
    intent: "hiểu cách tạo, dùng, giữ và nhìn nhận nguồn lực",
    core: "Cung Tài Bạch nói về nguồn lực: tiền, kỹ năng kiếm tiền, cách dùng tài sản, thái độ với thiếu đủ và khả năng chuyển công sức thành giá trị. Nó không phải lời hứa giàu nghèo; nó là bản đồ hành vi tài chính.",
    lifeSignal: "Kiểm chứng cung này qua cách người xem kiếm tiền, chi tiêu, tích lũy, đầu tư, định giá bản thân và phản ứng khi thiếu an toàn tài chính. Cùng một sao ở Tài Bạch có thể rất khác nếu kỹ năng và môi trường khác nhau.",
    useful: [
      "Khi muốn hiểu phong cách tài chính và cách quản trị nguồn lực.",
      "Khi đang đổi mô hình kiếm tiền, quản lý nợ, tiết kiệm hoặc đầu tư.",
      "Khi cần nối Tài Bạch với Quan Lộc để xem tiền đến từ giá trị nào.",
    ],
    risks: [
      "Đọc thành chắc chắn giàu/nghèo.",
      "Dùng tử vi thay cho kế hoạch tài chính, pháp lý hoặc tư vấn đầu tư.",
      "Không tách khả năng kiếm tiền khỏi thói quen giữ tiền.",
    ],
    practice: [
      "Ghi ba nguồn tiền hoặc nguồn lực chính của bạn.",
      "Tách nguồn tạo tiền, thói quen dùng tiền và cơ chế giữ tiền.",
      "Đọc sao tại Tài Bạch cùng Quan Lộc để biết nguồn lực đến từ kỹ năng nào.",
    ],
    modifiers: [
      "Vũ Khúc, Thiên Phủ, Thái Âm thường nhấn mạnh tích lũy, quản trị và tài sản.",
      "Tham Lang, Phá Quân, Thất Sát cần đọc thêm cơ hội lớn, biến động và kỷ luật rủi ro.",
    ],
    faqFocus: "tài chính và nguồn lực",
  },
  "tu-tuc": {
    intent: "hiểu con cái, dự án dài hạn và điều được nuôi dưỡng",
    core: "Cung Tử Tức nói về con cái, thế hệ sau, học trò, dự án được nuôi dưỡng và khả năng để lại điều gì tiếp nối. Nó không nên chỉ đọc như số lượng con; trọng tâm là quan hệ với quá trình nuôi lớn một điều ngoài bản thân.",
    lifeSignal: "Kiểm chứng cung này qua cách người xem chăm sóc, dạy dỗ, kiên nhẫn với dự án dài hạn hoặc phản ứng khi thành quả không đến ngay. Với người chưa/không có con, cung này vẫn có thể hiện qua sản phẩm, học trò hoặc trách nhiệm kế thừa.",
    useful: [
      "Khi muốn hiểu quan hệ với con cái, học trò hoặc dự án dài hạn.",
      "Khi cần đọc cách nuôi dưỡng, kỳ vọng và kiên nhẫn.",
      "Khi người xem đang hỏi điều gì mình muốn để lại sau nhiều năm.",
    ],
    risks: [
      "Đọc thành kết luận chắc chắn về có con, số con hoặc giới tính con.",
      "Áp kỳ vọng cá nhân lên con cái/dự án rồi gọi đó là trách nhiệm.",
      "Bỏ qua hoàn cảnh y tế, gia đình và lựa chọn cá nhân.",
    ],
    practice: [
      "Chọn một điều bạn đang nuôi dưỡng lâu dài.",
      "Ghi kỳ vọng của bạn và nhu cầu thật của điều/người được nuôi dưỡng.",
      "Đọc sao tại Tử Tức để biết bạn cần mềm, nghiêm hay linh hoạt hơn.",
    ],
    modifiers: [
      "Thiên Đồng, Thái Âm, Thiên Lương thường nhấn mạnh chăm sóc, nâng đỡ và kiên nhẫn.",
      "Vũ Khúc, Thất Sát, Phá Quân cần đọc thêm kỷ luật, áp lực và giai đoạn thay đổi mạnh.",
    ],
    faqFocus: "con cái và dự án dài hạn",
  },
  "phu-the": {
    intent: "hiểu quan hệ đôi lứa, kỳ vọng và cách cùng nhau quyết định",
    core: "Cung Phu Thê mô tả kiểu gắn kết, kỳ vọng trong quan hệ một-một và cách người xem hợp tác với người bạn đời/đối tác thân mật. Nó không phải công cụ phán chắc hôn nhân tốt xấu; nó giúp nhìn ra mô thức tương tác.",
    lifeSignal: "Kiểm chứng cung này qua cách bạn chọn người, phản ứng khi thân mật, cách bàn tiền, bàn tương lai và xử lý xung đột. Một cung Phu Thê có sao mạnh vẫn cần kỹ năng giao tiếp; sao đẹp không thay thế trưởng thành cảm xúc.",
    useful: [
      "Khi muốn hiểu kỳ vọng tình cảm, hôn nhân hoặc quan hệ một-một.",
      "Khi đang lặp lại cùng một kiểu xung đột với người thân mật.",
      "Khi cần phân biệt nhu cầu thật với hình mẫu bạn tưởng mình phải có.",
    ],
    risks: [
      "Đọc thành kết luận chắc chắn về ly hôn, kết hôn muộn hoặc người phối ngẫu.",
      "Dùng lá số để đổ lỗi cho đối phương.",
      "Bỏ qua kỹ năng đối thoại, trị liệu, pháp lý và lựa chọn hiện tại.",
    ],
    practice: [
      "Ghi ba kỳ vọng bạn mang vào quan hệ thân mật.",
      "Hỏi kỳ vọng nào đã được nói ra, kỳ vọng nào bạn đang bắt người kia tự hiểu.",
      "Đọc sao tại Phu Thê để biết bạn cần học thêm kỹ năng mềm, ranh giới hay cam kết.",
    ],
    modifiers: [
      "Thiên Tướng, Thiên Đồng, Thái Âm thường nhấn mạnh nhu cầu chăm sóc và hòa hợp.",
      "Liêm Trinh, Tham Lang, Thất Sát hoặc Phá Quân cần đọc kỹ ranh giới, hấp dẫn, xung đột và tự do.",
    ],
    faqFocus: "quan hệ đôi lứa",
  },
  "huynh-de": {
    intent: "hiểu anh chị em, người ngang hàng và mạng lưới gần",
    core: "Cung Huynh Đệ nói về quan hệ ngang hàng: anh chị em, bạn thân, đồng môn, đồng nghiệp gần và cảm giác có người cùng vai. Nó không chỉ là số anh em; nó mô tả cách người xem hợp tác với người cùng cấp.",
    lifeSignal: "Kiểm chứng cung này qua cách bạn chia sẻ nguồn lực với anh chị em, xử lý cạnh tranh, giữ liên lạc và tìm người đồng hành. Có người ít anh em ruột nhưng cung này vẫn thể hiện rất rõ trong nhóm bạn hoặc cộng sự thân.",
    useful: [
      "Khi muốn hiểu quan hệ anh chị em, bạn thân hoặc người ngang hàng.",
      "Khi có xung đột vì chia trách nhiệm, tiền bạc hoặc chăm sóc gia đình.",
      "Khi cần biết kiểu đồng hành nào giúp bạn phát triển.",
    ],
    risks: [
      "Đọc thành số lượng anh chị em thay vì chất lượng tương tác.",
      "Không nhìn thấy yếu tố cạnh tranh ngầm hoặc so sánh.",
      "Nhầm gần gũi huyết thống với khả năng hợp tác thực tế.",
    ],
    practice: [
      "Ghi một việc bạn đang chia sẻ trách nhiệm với người ngang hàng.",
      "Tách phần tình cảm, phần lợi ích và phần nghĩa vụ.",
      "Đọc sao tại Huynh Đệ để biết cần đối thoại mềm, luật rõ hay khoảng cách lành mạnh.",
    ],
    modifiers: [
      "Thiên Đồng, Thiên Lương, Thiên Tướng thường nhấn mạnh sự nâng đỡ và hòa giải.",
      "Cự Môn, Vũ Khúc, Thất Sát cần đọc thêm tranh luận, tiền bạc, ranh giới và cạnh tranh.",
    ],
    faqFocus: "người ngang hàng",
  },
};

function fallbackProfile(entity: PseoEntityDefinition): EntityProfile {
  return {
    intent: `hiểu ${entity.summary}`,
    core: `${entity.name} cần được đọc như một lớp dữ liệu trong toàn bộ lá số, không phải kết luận độc lập. Ý nghĩa nền của mục này là ${entity.summary}, nhưng kết quả thực tế còn phụ thuộc cung, sao đi cùng, trạng thái và vận.`,
    lifeSignal: `Hãy kiểm chứng ${entity.name} bằng sự kiện đời sống cụ thể thay vì chỉ chọn câu mô tả nghe hợp ý. Một nhận định có giá trị khi giúp người xem đặt câu hỏi tốt hơn và hành động tỉnh táo hơn.`,
    useful: entity.strengths,
    risks: entity.cautions,
    practice: [
      "Ghi một tình huống thực tế liên quan đến chủ đề này.",
      "Tách dữ kiện khỏi cảm xúc và giả định.",
      "Đọc thêm cung, sao đi kèm và vận để tránh kết luận một chiều.",
    ],
    modifiers: [
      "Cần đọc cùng tam hợp, xung chiếu và phụ tinh trước khi đưa ra nhận định cuối.",
      "Nếu nội dung không khớp trải nghiệm, hãy kiểm tra lại giờ sinh và bối cảnh câu hỏi.",
    ],
    faqFocus: entity.summary,
  };
}

export function getPseoEntityContent(kind: Extract<PseoEntityKind, "MAIN_STAR" | "PALACE">, entity: PseoEntityDefinition): PseoEntityContent {
  const profile =
    kind === "MAIN_STAR"
      ? MAIN_STAR_PROFILES[entity.slug] || fallbackProfile(entity)
      : PALACE_PROFILES[entity.slug] || fallbackProfile(entity);
  const subject = kind === "MAIN_STAR" ? `sao ${entity.name}` : `cung ${entity.name}`;

  return {
    intent: profile.intent,
    intro: [
      profile.core,
      profile.lifeSignal,
      `Khi đọc ${subject}, cách an toàn là đi từ câu hỏi thực tế, sau đó mới đối chiếu ngũ hành/chủ đề, điểm mạnh, điểm cần thận trọng và các tổ hợp liên quan. Làm theo thứ tự này giúp nội dung có ích cho người xem, đồng thời tránh biến tử vi thành kết luận tuyệt đối.`,
    ],
    contextRows: [
      {
        label: "Lớp nền",
        value: entity.element,
        howToRead: kind === "MAIN_STAR" ? "Cho biết kiểu năng lượng chính cần quan sát." : "Cho biết lĩnh vực đời sống đang được soi chiếu.",
      },
      {
        label: "Ý nghĩa cốt lõi",
        value: entity.summary,
        howToRead: "Dùng như khung đặt câu hỏi, không dùng như nhãn cố định.",
      },
      {
        label: "Bằng chứng cần đối chiếu",
        value: "sự kiện lặp lại, thói quen quyết định, bộ sao đi kèm và vận",
        howToRead: "Chỉ kết luận sau khi có ít nhất hai lớp dữ kiện khớp nhau.",
      },
    ],
    usefulSignals: profile.useful.map((body, index) => ({
      title: index === 0 ? "Khi dùng đúng chỗ" : index === 1 ? "Khi có dữ kiện hỗ trợ" : "Khi biết giữ giới hạn",
      body,
    })),
    misreadRisks: profile.risks.map((body, index) => ({
      title: index === 0 ? "Lỗi đọc một chiều" : index === 1 ? "Lỗi bỏ qua bối cảnh" : "Lỗi biến gợi ý thành kết luận",
      body,
    })),
    practiceSteps: profile.practice,
    modifierNotes: profile.modifiers,
    faqs: [
      {
        question: `${kind === "MAIN_STAR" ? `Sao ${entity.name}` : `Cung ${entity.name}`} có quyết định sẵn ${profile.faqFocus} không?`,
        answer: `Không. ${entity.name} chỉ là một lớp thông tin. Cần đọc cùng vị trí, bộ sao, tam hợp/xung chiếu, vận và dữ kiện đời sống trước khi rút ra nhận định.`,
      },
      {
        question: `Nên dùng trang ${subject} này như thế nào để tránh hiểu sai?`,
        answer: "Hãy dùng như bản hướng dẫn đặt câu hỏi: ghi sự kiện thật, kiểm tra điểm mạnh và điểm lệch, rồi đối chiếu với lá số cá nhân thay vì lấy một câu mô tả làm kết luận.",
      },
    ],
  };
}
