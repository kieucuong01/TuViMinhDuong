import type { PseoPageDraft } from "./pseo-registry.ts";
import MANUAL_PSEO_BATCH_3 from "./pseo-manual-batch-3.json" with { type: "json" };
import { MANUAL_PSEO_BATCH_4 } from "./pseo-manual-batch-4.ts";
import { MANUAL_PSEO_BATCH_5 } from "./pseo-manual-batch-5.ts";

type ManualPseoBatchItem = {
  body: string;
  generation: {
    model: string;
    generatedAt: string;
  };
};

const MANUAL_BATCH_3 = MANUAL_PSEO_BATCH_3 as Record<string, ManualPseoBatchItem>;
const MANUAL_BATCH_4 = MANUAL_PSEO_BATCH_4 as Record<string, ManualPseoBatchItem>;
const MANUAL_BATCH_5 = MANUAL_PSEO_BATCH_5 as Record<string, ManualPseoBatchItem>;
export const MANUAL_PSEO_BATCH_3_SLUGS = Object.keys(MANUAL_BATCH_3);
export const MANUAL_PSEO_BATCH_4_SLUGS = Object.keys(MANUAL_BATCH_4);
export const MANUAL_PSEO_BATCH_5_SLUGS = Object.keys(MANUAL_BATCH_5);

export const CURATED_PSEO_SLUGS = [
  "sao-thai-am-cung-tai-bach",
  "sao-tu-vi-cung-menh",
  "sao-tu-vi-cung-quan-loc",
  "sao-tu-vi-cung-tai-bach",
  "sao-vu-khuc-cung-tai-bach",
  "sao-thai-duong-cung-quan-loc",
  "sao-thien-phu-cung-tai-bach",
  "sao-thien-co-cung-menh",
  "sao-thien-co-cung-quan-loc",
  "sao-thien-co-cung-tai-bach",
  "sao-thai-duong-cung-menh",
  "sao-thai-duong-cung-tai-bach",
  "sao-vu-khuc-cung-menh",
  "sao-vu-khuc-cung-quan-loc",
  "sao-thien-dong-cung-menh",
  "sao-thien-dong-cung-quan-loc",
  "sao-thien-dong-cung-tai-bach",
  "sao-liem-trinh-cung-menh",
  "sao-liem-trinh-cung-quan-loc",
  "sao-liem-trinh-cung-tai-bach",
  "sao-thien-phu-cung-menh",
  "sao-thien-phu-cung-quan-loc",
  "sao-thai-am-cung-menh",
  "sao-thai-am-cung-quan-loc",
  "sao-tham-lang-cung-menh",
  "sao-tham-lang-cung-quan-loc",
  "sao-tham-lang-cung-tai-bach",
  "sao-cu-mon-cung-menh",
  "sao-cu-mon-cung-quan-loc",
  "sao-cu-mon-cung-tai-bach",
  "sao-thien-tuong-cung-menh",
  "sao-thien-tuong-cung-quan-loc",
  "sao-thien-tuong-cung-tai-bach",
  "sao-thien-luong-cung-menh",
  "sao-thien-luong-cung-quan-loc",
  "sao-thien-luong-cung-tai-bach",
  "sao-that-sat-cung-menh",
  "sao-that-sat-cung-quan-loc",
  "sao-that-sat-cung-tai-bach",
  "sao-pha-quan-cung-menh",
  "sao-pha-quan-cung-quan-loc",
  "sao-pha-quan-cung-tai-bach",
  ...MANUAL_PSEO_BATCH_3_SLUGS,
  ...MANUAL_PSEO_BATCH_4_SLUGS,
  ...MANUAL_PSEO_BATCH_5_SLUGS,
] as const;

type CuratedSlug = string;

type CuratedPage = Partial<Pick<PseoPageDraft, "title" | "excerpt" | "body" | "metaTitle" | "metaDescription">> & {
  body: string;
};

export const CURATED_PSEO_CONTENT: Record<string, CuratedPage> = {
  "sao-thai-am-cung-tai-bach": {
    title: "Sao Thái Âm cung Tài Bạch: cách đọc tiền bạc, tích lũy và cảm giác an toàn",
    excerpt: "Thái Âm ở Tài Bạch nên được đọc như năng lực quan sát dòng tiền, nhu cầu an toàn và cách tích lũy bền hơn là lời đoán giàu nghèo.",
    metaTitle: "Thái Âm cung Tài Bạch: ý nghĩa tiền bạc và tích lũy",
    metaDescription: "Tra cứu Sao Thái Âm cung Tài Bạch: điểm mạnh, rủi ro, cách đọc dòng tiền, tích lũy, cảm giác an toàn và cách đối chiếu với lá số riêng.",
    body: `## Thái Âm ở Tài Bạch nói về kiểu quan hệ nào với tiền?

Khi Thái Âm nằm tại cung Tài Bạch, trọng tâm không phải là câu hỏi “có giàu không”, mà là người này thường cảm thấy an toàn về tiền bằng cách nào. Thái Âm là sao thiên về quan sát, tích lũy, cảm nhận tinh tế và nhu cầu giữ lại phần dự phòng. Cung Tài Bạch lại là nơi cho thấy cách tạo, dùng, giữ và đánh giá nguồn lực. Ghép hai lớp này lại, ta có một kiểu đọc khá thực tế: tiền bạc thường đi qua quá trình theo dõi kỹ, cân nhắc chậm, và cần cảm giác chắc trước khi quyết định.

Điểm dễ nhầm là xem Thái Âm như một nhãn “tài tinh” rồi kết luận quá nhanh. Trong lá số thật, Thái Âm còn phải xét miếu hãm, sáng tối, bộ sao đi cùng, Tuần Triệt, Hóa Lộc, Hóa Kỵ, đại vận và lưu niên. Một Thái Âm sáng, có bộ nâng đỡ, biểu hiện rất khác với Thái Âm bị nhiễu bởi sát tinh hoặc đặt trong vận nhiều áp lực. Vì vậy trang này chỉ là bản đồ đọc ban đầu, không thay thế việc [lập lá số tử vi miễn phí](/#lap-la-so) và xem toàn cục.

| Lớp cần đọc | Câu hỏi thực tế | Cách tự kiểm tra |
| --- | --- | --- |
| Thái Âm | Tôi có xu hướng giữ tiền bằng quan sát và dự phòng không? | Nhìn lại cách bạn quyết định khoản chi lớn |
| Tài Bạch | Nguồn lực đến từ đâu và đi về đâu? | Tách thu nhập, chi phí, khoản giữ lại |
| Bộ sao đi cùng | Dòng tiền ổn hay dễ bị cảm xúc kéo đi? | So với giai đoạn biến động trong đời |
| Vận hạn | Khi nào chủ đề tài chính được kích hoạt mạnh? | Đối chiếu đại vận, lưu niên và tháng quan trọng |

## Điểm thuận lợi: biết nhìn đường dài

Mặt thuận của Thái Âm tại Tài Bạch là khả năng nhìn tiền như một dòng chảy cần chăm sóc. Người có cách cục này thường không chỉ quan tâm số tiền trước mắt, mà còn để ý tính bền, khả năng dự phòng, sự ổn định của nơi làm việc hoặc tài sản có thể tích lũy dần. Nếu lá số có thêm các yếu tố hỗ trợ, đây là kiểu tư duy phù hợp với quản lý ngân sách gia đình, tích lũy tài sản, làm việc với dữ liệu tài chính, hoặc các mô hình cần sự kiên nhẫn.

Ở tầng hành vi, điểm mạnh không nhất thiết nằm ở việc kiếm nhanh. Nó thường nằm ở việc ít bỏ sót chi tiết, biết so sánh nhiều phương án và có trực giác với nhu cầu của người khác. Điều này hữu ích khi làm dịch vụ, tư vấn, chăm sóc khách hàng, sản phẩm cho nữ giới/gia đình, bất động sản ở tầng sử dụng thực, hoặc các công việc cần hiểu cảm xúc người mua. Nếu bạn đang đọc để chọn hướng nghề, nên đặt trang này cạnh [Sao Thái Âm](/tra-cuu/sao-thai-am), [Cung Tài Bạch](/tra-cuu/cung-tai-bach) và [cách đọc lá số cho người mới](/kien-thuc-tu-vi/cach-doc-la-so-tu-vi-cho-nguoi-moi).

- Ưu tiên ghi chép dòng tiền theo tháng, không chỉ nhớ bằng cảm giác.
- Tách rõ tiền dự phòng, tiền đầu tư, tiền tiêu dùng và tiền hỗ trợ người thân.
- Khi có cơ hội mới, kiểm tra cả lợi ích tài chính lẫn mức yên tâm tinh thần.
- Đừng đánh giá bản thân chỉ bằng tốc độ kiếm tiền; hãy nhìn độ bền của hệ thống.

## Điểm cần thận trọng: lo xa quá mức hoặc giữ tiền vì sợ

Thái Âm có chiều sâu nội tâm nên khi vào Tài Bạch có thể khiến chuyện tiền bạc gắn mạnh với cảm giác an toàn. Nếu tốt, đây là sự cẩn thận. Nếu lệch, người đọc dễ lo xa, ngại quyết định, hoặc giữ tiền vì sợ mất hơn là vì có chiến lược rõ. Một biểu hiện khác là dễ bị ảnh hưởng bởi tâm trạng gia đình: người thân lo thì mình lo theo, người khác cần hỗ trợ thì khó từ chối, hoặc quyết định tiền bạc dựa trên cảm giác thương hơn là dữ liệu.

Điều cần tránh là biến lá số thành lý do để né trách nhiệm tài chính. Tử vi chỉ giúp đặt câu hỏi tốt hơn. Nếu đang có khoản nợ, đầu tư lớn, tranh chấp tài sản hoặc vấn đề sức khỏe ảnh hưởng thu nhập, bạn vẫn cần chuyên gia phù hợp: kế toán, luật sư, bác sĩ hoặc cố vấn tài chính được cấp phép. Lá số không nên được dùng để thay thế quyết định chuyên môn.

## Cách đọc cùng cung và sao khác

Để hiểu rõ Tài Bạch, không nên chỉ đọc Thái Âm. Hãy so với các tổ hợp cùng cung như [Vũ Khúc cung Tài Bạch](/tra-cuu/sao-vu-khuc-cung-tai-bach) để thấy kiểu tiền kỷ luật hơn, hoặc [Thiên Phủ cung Tài Bạch](/tra-cuu/sao-thien-phu-cung-tai-bach) để thấy xu hướng bảo toàn và điều phối. Nếu muốn giữ cùng sao nhưng đổi bối cảnh, hãy đọc thêm [Cung Điền Trạch](/tra-cuu/cung-dien-trach) khi câu hỏi liên quan nhà cửa, hoặc [Cung Phu Thê](/tra-cuu/cung-phu-the) khi tiền bạc gắn với quan hệ.

So sánh như vậy giúp tránh lỗi “một sao nói tất cả”. Cùng là Thái Âm, khi đặt cạnh [Cung Điền Trạch](/tra-cuu/cung-dien-trach) nó nghiêng về nơi ở, tài sản, không gian sống; khi đặt cạnh [Cung Phu Thê](/tra-cuu/cung-phu-the) nó đi vào nhịp cảm xúc trong quan hệ. Cùng là Tài Bạch, mỗi chính tinh lại tạo một cách xử lý tiền khác nhau. Đây mới là lý do hệ Tra cứu được tách khỏi mục Kiến thức: người đọc cần đi từ hub, sang biến số, rồi xuống tổ hợp cụ thể.

## Checklist đối chiếu với đời sống thật

Trước khi kết luận, hãy lấy một tờ giấy và trả lời năm câu hỏi. Một, bạn thường thấy yên tâm hơn khi có khoản dự phòng bao nhiêu tháng? Hai, quyết định tài chính lớn của bạn thường đến từ dữ liệu, lời khuyên người thân hay cảm giác bên trong? Ba, bạn có dễ cho mượn, hỗ trợ hoặc chi vì thương không? Bốn, khi thu nhập tăng, bạn tăng tích lũy hay tăng chi tiêu trước? Năm, trong ba năm gần đây, giai đoạn nào khiến bạn lo về tiền nhất và khi đó lá số có vận nào kích hoạt?

Nếu phần lớn câu trả lời xoay quanh nhu cầu an toàn, tích lũy và quan sát chậm, Thái Âm tại Tài Bạch có thể là một lớp đọc đáng chú ý. Nếu câu trả lời lại nghiêng về hành động nhanh, chấp nhận rủi ro cao, hoặc tiền đến từ cạnh tranh mạnh, cần xem các sao khác trong cung, tam hợp và xung chiếu. Bạn có thể dùng công cụ [xem ngày](/xem-ngay) cho việc chọn thời điểm nhỏ, nhưng việc hiểu tiền bạc vẫn nên bắt đầu bằng lá số đầy đủ.

## Khi nào nên lập lá số để đọc sâu hơn?

Bạn nên [lập lá số miễn phí](/#lap-la-so) nếu đang hỏi về một quyết định cụ thể: đổi việc vì thu nhập, mua nhà, góp vốn, thay đổi mô hình kinh doanh, hoặc sắp bước vào năm có nhiều biến động tài chính. Khi có lá số, hãy đọc Tài Bạch cùng Mệnh, Quan Lộc, Điền Trạch và Phúc Đức. Mệnh cho biết cách bạn ra quyết định, Quan Lộc cho biết nguồn tạo giá trị, Điền Trạch cho biết tài sản/nền ổn định, còn Phúc Đức cho biết phần nâng đỡ tinh thần và gia đình.

Nội dung này nên được xem như bản hướng dẫn đọc, không phải lời hứa kết quả. Nếu muốn bản luận giải cá nhân hơn, hãy tạo lá số trước rồi đọc tiếp phần luận giải theo năm hiện hành trong hệ thống.`,
  },
  "sao-tu-vi-cung-menh": {
    body: `## Tử Vi ở Mệnh là trung tâm điều phối con người

Sao Tử Vi tại cung Mệnh thường được đọc như dấu hiệu của nhu cầu tổ chức, định vị vai trò và giữ trật tự trong đời sống. Nhưng “Tử Vi cư Mệnh” không tự động biến một người thành lãnh đạo hay người có quyền. Cách đọc đúng hơn là: người này thường cần cảm giác mình đang nắm một cấu trúc, hiểu vị trí của mình trong tập thể và có khả năng gom các mảnh rời thành một hệ thống. Cung Mệnh nói về khí chất, phản ứng và cách ra quyết định nền; Tử Vi thêm vào đó ý thức về vai trò, trách nhiệm và thứ bậc.

Điểm quan trọng là Tử Vi rất cần bối cảnh. Nếu được nhiều sao hỗ trợ, người có Tử Vi ở Mệnh dễ biểu hiện như người biết sắp xếp, gánh việc, nhìn đại cục. Nếu bị kéo bởi sát tinh, áp lực hoặc bộ sao làm cứng, cùng một năng lượng đó có thể biến thành kiểm soát, ôm việc, hoặc khó thừa nhận mình cần giúp đỡ. Vì vậy, khi đọc trang này, hãy xem nó như một khung đặt câu hỏi rồi đối chiếu với [lá số cá nhân](/#lap-la-so), không phải nhãn cố định.

| Phần cần quan sát | Biểu hiện lành mạnh | Biểu hiện lệch |
| --- | --- | --- |
| Vai trò | Biết nhận trách nhiệm vừa sức | Dễ tự buộc mình phải gánh hết |
| Trật tự | Sắp xếp việc và người rõ ràng | Khó chịu khi mọi thứ không theo ý |
| Đại cục | Nhìn được hệ thống | Bỏ qua cảm xúc cụ thể của người khác |
| Tự trọng | Có tiêu chuẩn cá nhân | Dễ sĩ diện hoặc ngại hỏi |

## Điểm mạnh: có nhu cầu xây hệ thống

Tử Vi ở Mệnh hợp với những môi trường cần người giữ nhịp: quản lý nhóm, điều phối dự án, xây quy trình, giữ tiêu chuẩn, hoặc đứng giữa nhiều bên để đưa ra quyết định. Ngay cả khi người này không giữ chức danh quản lý, họ vẫn có xu hướng nhìn việc theo cấu trúc: ai chịu trách nhiệm, mục tiêu là gì, việc nào trước việc nào sau, nguồn lực có đủ không. Đây là lợi thế lớn nếu được rèn thành kỹ năng.

Trong đời sống cá nhân, cách cục này cũng giúp người đọc nhận ra vì sao mình khó sống quá tùy hứng. Họ thường cần kế hoạch, cần một khung đạo lý hoặc tiêu chuẩn nội bộ. Khi trẻ, điều này có thể bị hiểu là nghiêm, chững hoặc khó gần. Khi trưởng thành, nếu biết mềm hóa, đây lại là năng lực tạo sự tin cậy. Nên đọc thêm [Sao Tử Vi](/tra-cuu/sao-tu-vi), [Cung Mệnh](/tra-cuu/cung-menh), [Tử Vi cung Quan Lộc](/tra-cuu/sao-tu-vi-cung-quan-loc) và bài nền [lá số tử vi là gì](/kien-thuc-tu-vi/la-so-tu-vi-la-gi) để không tách Mệnh khỏi toàn bàn.

- Ghi lại các tình huống bạn thường tự đứng ra sắp xếp dù không ai giao.
- Quan sát lúc bạn khó chịu: vì việc rối thật, hay vì người khác không theo cấu trúc của bạn?
- Tập phân quyền bằng tiêu chí rõ thay vì giữ mọi thứ trong đầu.
- Dùng vị thế để tạo an toàn cho nhóm, không chỉ để chứng minh năng lực.

## Rủi ro: ôm vai trò quá chặt

Mặt bóng của Tử Vi ở Mệnh là dễ đồng nhất bản thân với vai trò. Người này có thể thấy mình chỉ có giá trị khi đang làm tốt, đang đứng mũi chịu sào, đang được tin cậy, hoặc đang giữ hình ảnh ổn định. Khi thất bại, bị góp ý, mất quyền chủ động hoặc phải nhờ người khác, họ dễ thấy hụt hơn bình thường. Đây là điểm cần đọc kỹ, nhất là nếu lá số có thêm các yếu tố làm tăng tự trọng hoặc áp lực danh dự.

Một rủi ro khác là nghĩ mình đã nhìn đại cục nên bỏ qua tín hiệu nhỏ. Trong quan hệ thân mật, người có Tử Vi ở Mệnh có thể chăm lo bằng cách sắp xếp, nhưng người bên cạnh lại cần được lắng nghe cảm xúc. Trong công việc, họ có thể đưa ra quyết định hợp lý về cấu trúc nhưng thiếu sự đồng thuận. Vì vậy, bài học không phải là bớt trách nhiệm, mà là thêm khả năng nghe, hỏi và điều chỉnh.

## Cách đọc với Thân, Quan Lộc và Phúc Đức

Cung Mệnh chỉ là điểm khởi đầu. Nếu Thân cư Quan Lộc, năng lượng Tử Vi ở Mệnh có thể dồn mạnh vào sự nghiệp và trách nhiệm xã hội. Nếu Thân cư Phu Thê, bài học vai trò lại xuất hiện nhiều trong quan hệ đôi lứa. Nếu Phúc Đức yếu hoặc nhiều áp lực, người này có thể gánh trách nhiệm như một cách tự bảo vệ khỏi cảm giác bất an. Vì vậy, nên đọc Mệnh cùng [Cung Quan Lộc](/tra-cuu/cung-quan-loc), [Cung Phúc Đức](/tra-cuu/cung-phuc-duc) và các vận lớn.

Khi vào đại vận kích hoạt Mệnh hoặc Quan Lộc, Tử Vi ở Mệnh thường khiến người đọc quan tâm nhiều hơn đến vị trí, nghề nghiệp, danh tiếng hoặc việc “mình đang là ai”. Đây là giai đoạn tốt để chỉnh lại cấu trúc sống: bỏ vai trò không còn phù hợp, học cách giao việc, hoặc xây một hệ thống hỗ trợ quanh mình. Bạn có thể xem thêm [đại vận là gì](/kien-thuc-tu-vi/dai-van-la-gi) để hiểu vì sao một cách cục chỉ bộc lộ mạnh ở một số giai đoạn.

## Checklist tự đối chiếu

Hãy trả lời sáu câu hỏi sau. Bạn có thường được người khác nhờ quyết định hoặc sắp xếp không? Bạn có khó chịu khi nhóm thiếu người chịu trách nhiệm? Bạn có hay tự gánh việc vì nghĩ người khác làm không đạt chuẩn? Khi bị góp ý, bạn nghe nội dung trước hay thấy chạm tự trọng trước? Bạn có biết nói “tôi không biết” mà không thấy mất mặt không? Gần đây, vai trò nào trong đời sống làm bạn mệt nhất?

Nếu nhiều câu trả lời chạm vào trách nhiệm, tiêu chuẩn và vị thế, Tử Vi ở Mệnh đang là lớp đọc đáng chú ý. Nếu không, hãy xem lại giờ sinh, trạng thái sao và cung Thân. Lá số là một hệ liên kết; một sao ở Mệnh có thể mạnh hoặc yếu tùy toàn cục.

## Gợi ý hành động thực tế

Tử Vi ở Mệnh nên rèn ba năng lực: phân quyền, lắng nghe và cập nhật vai trò. Phân quyền giúp không ôm hết việc. Lắng nghe giúp vai trò không biến thành kiểm soát. Cập nhật vai trò giúp bạn không mắc kẹt trong hình ảnh cũ. Nếu muốn đọc theo trường hợp riêng, hãy [lập lá số miễn phí](/#lap-la-so), sau đó xem Mệnh, Thân, Quan Lộc, Phúc Đức và vận năm hiện hành trước khi kết luận.`,
  },
  "sao-tu-vi-cung-quan-loc": {
    body: `## Tử Vi ở Quan Lộc nói về nghề nghiệp theo nghĩa hệ thống

Khi Tử Vi nằm ở cung Quan Lộc, chủ đề chính là cách một người tạo giá trị thông qua vai trò, trách nhiệm và khả năng điều phối. Quan Lộc không chỉ là chức danh hay công việc hiện tại; nó là con đường tạo giá trị, kiểu trách nhiệm xã hội và cách một người muốn được công nhận qua việc làm. Tử Vi thêm vào đó nhu cầu xây cấu trúc, giữ chuẩn và nhìn tổng thể. Vì vậy, cách cục này thường hợp với câu hỏi: tôi nên đứng ở vị trí nào trong hệ thống để phát huy tốt nhất?

Không nên hiểu Tử Vi cung Quan Lộc là chắc chắn làm sếp. Một người có thể phát huy Tử Vi bằng cách làm trưởng nhóm, chuyên gia thiết kế quy trình, người giữ chuẩn chất lượng, quản lý vận hành, cố vấn nội bộ, hoặc đơn giản là người tạo trật tự trong một môi trường rối. Chức danh chỉ là bề mặt. Điều cần đọc là cơ chế làm việc: thích rõ vai trò, thích mục tiêu dài hạn, không hợp môi trường quá tùy tiện hoặc đổi hướng liên tục mà không có lý do.

| Lớp đọc | Câu hỏi nghề nghiệp | Tín hiệu cần kiểm tra |
| --- | --- | --- |
| Quan Lộc | Tôi tạo giá trị qua trách nhiệm nào? | Việc nào người khác thường giao cho bạn |
| Tử Vi | Tôi có cần cấu trúc và quyền điều phối không? | Mức khó chịu khi quy trình rối |
| Bộ sao đi cùng | Vai trò này mềm hay cứng? | Cách bạn xử lý mâu thuẫn trong nhóm |
| Vận hạn | Khi nào nghề nghiệp đổi nhịp? | Các năm đổi việc, lên vai trò, mất vai trò |

## Điểm mạnh: đứng được ở vị trí giữ nhịp

Ưu thế của Tử Vi tại Quan Lộc là khả năng nhìn công việc như một hệ thống có mục tiêu, người chịu trách nhiệm và tiêu chuẩn vận hành. Người này thường không thích chỉ làm phần vụn nếu không hiểu bức tranh lớn. Khi được trao quyền phù hợp, họ có thể kết nối nhiều nhóm, đặt lại quy trình, phân vai và giữ một nhịp ổn định. Đây là chất liệu tốt cho quản lý, vận hành, giáo dục, hành chính, tư vấn chiến lược, hoặc các công việc cần xây nền lâu dài.

Điểm đáng chú ý là Tử Vi không nhất thiết nhanh. Nó cần thời gian để dựng khung. Vì vậy, người có cách cục này nên tránh tự so sánh với kiểu nghề nghiệp tăng trưởng bằng tốc độ, bán hàng ngắn hạn hoặc đòn bẩy rủi ro cao nếu bản thân không hợp. Họ có thể phát triển tốt hơn khi chọn một lĩnh vực đủ rộng để tích lũy uy tín. Nên đọc cùng [Sao Tử Vi](/tra-cuu/sao-tu-vi), [Cung Quan Lộc](/tra-cuu/cung-quan-loc), [Tử Vi cung Mệnh](/tra-cuu/sao-tu-vi-cung-menh) và [Thái Dương cung Quan Lộc](/tra-cuu/sao-thai-duong-cung-quan-loc) để so sánh vai trò lãnh đạo và vai trò soi sáng.

- Chọn môi trường có tiêu chuẩn rõ, không chỉ lương cao trước mắt.
- Định nghĩa vai trò bằng trách nhiệm thật, không chỉ tên chức danh.
- Rèn kỹ năng giao việc, họp ngắn, viết quy trình và phản hồi.
- Đánh giá nghề nghiệp theo chu kỳ 3-5 năm, không chỉ cảm xúc vài tháng.

## Rủi ro: danh vị lấn át năng lực thật

Tử Vi ở Quan Lộc dễ bị kéo vào câu chuyện vị trí. Nếu chưa trưởng thành, người đọc có thể quan tâm nhiều đến chức danh, sự công nhận hoặc quyền quyết định, trong khi kỹ năng nền chưa đủ. Khi bị đặt vào vai trò cao quá sớm, họ dễ mệt vì phải giữ hình ảnh ổn định. Khi không được công nhận, họ dễ chán dù công việc vẫn có giá trị học hỏi. Đây là lý do cần phân biệt “muốn có vị trí” và “đủ năng lực giữ vị trí”.

Một rủi ro khác là khó làm việc trong môi trường ngang hàng nếu ai cũng có tiếng nói. Tử Vi thích trật tự, nhưng công việc hiện đại nhiều khi cần thử nghiệm, phản biện và chấp nhận sai nhanh. Nếu người này quá nặng kiểm soát, nhóm sẽ chậm. Nếu quá giữ thể diện, họ sẽ ít học từ phản hồi. Cách sửa là biến quyền lực thành trách nhiệm phục vụ hệ thống, không phải lá chắn cho cái tôi.

## Cách đọc khi đang đổi việc hoặc thăng chức

Nếu bạn đang cân nhắc đổi việc, hãy hỏi: nơi mới có cho bạn quyền xây hệ thống không, hay chỉ giao danh nghĩa mà không có nguồn lực? Nếu chuẩn bị thăng chức, hãy hỏi: bạn đã có người thay thế phần việc cũ chưa, có quy trình giao tiếp chưa, có biết đo hiệu quả bằng chỉ số nào không? Tử Vi ở Quan Lộc chỉ phát huy khi vai trò đi kèm cấu trúc. Nếu chỉ có kỳ vọng mà không có quyền hạn, cách cục này dễ thành áp lực.

Khi vận hạn kích hoạt Quan Lộc, người có Tử Vi tại đây thường gặp các sự kiện như đổi vai trò, được giao thêm trách nhiệm, phải đứng ra xử lý khủng hoảng, hoặc tự hỏi mình có đang đi đúng đường nghề nghiệp không. Bạn có thể dùng [xem ngày](/xem-ngay) cho việc chọn ngày ký kết nhỏ, nhưng quyết định nghề nghiệp nên dựa trên toàn lá số, dữ liệu thực tế và năng lực hiện tại.

## Checklist nghề nghiệp

Hãy liệt kê ba công việc gần nhất và trả lời: bạn được đánh giá cao vì chuyên môn, vì tổ chức, hay vì chịu trách nhiệm? Bạn mệt nhất khi thiếu quyền, thiếu người, thiếu quy trình hay thiếu ý nghĩa? Bạn có hay sửa hệ thống dù không được giao không? Bạn có đang giữ chức danh nhưng không có nguồn lực tương ứng không? Bạn có đang từ chối vai trò lớn vì sợ mất tự do không?

Các câu trả lời này giúp xác định Tử Vi ở Quan Lộc đang vận hành lành mạnh hay lệch. Nếu lành mạnh, bạn sẽ thấy mình xây được hệ thống tốt hơn qua thời gian. Nếu lệch, bạn sẽ thấy mình bị vai trò nuốt mất đời sống riêng.

## Đối chiếu với lá số cá nhân

Để đọc sâu, hãy [lập lá số miễn phí](/#lap-la-so), rồi xem Mệnh, Thân, Tài Bạch và Phúc Đức. Mệnh cho biết khí chất chịu trách nhiệm; Tài Bạch cho biết nguồn lực từ nghề; Phúc Đức cho biết nền tinh thần phía sau áp lực. Tử Vi ở Quan Lộc là một tín hiệu mạnh về vai trò, nhưng chỉ toàn lá số mới cho biết vai trò đó nên đi theo hướng quản lý, chuyên gia, cố vấn hay người xây nền phía sau.`,
  },
  "sao-vu-khuc-cung-tai-bach": {
    body: `## Vũ Khúc ở Tài Bạch là bài học về kỷ luật nguồn lực

Vũ Khúc tại cung Tài Bạch thường được đọc như năng lực quản trị tiền bạc bằng nguyên tắc, số liệu và hiệu quả. Nếu Thái Âm ở Tài Bạch thiên về cảm giác an toàn và tích lũy mềm, Vũ Khúc nghiêng về kỷ luật, quyết đoán, khả năng cắt giảm phần thừa và tập trung vào giá trị đo được. Cung Tài Bạch hỏi tiền đến từ đâu, dùng ra sao và giữ bằng cách nào; Vũ Khúc trả lời bằng thái độ thực tế: phải rõ dòng tiền, rõ trách nhiệm, rõ hiệu quả.

Điểm cần nhấn mạnh là Vũ Khúc không đồng nghĩa với giàu nhanh. Nó chỉ cho thấy cách tiếp cận nguồn lực có xu hướng nghiêm, thực dụng và chịu áp lực tốt hơn một số sao mềm. Nếu lá số thiếu hỗ trợ hoặc gặp vận xấu, chính sự cứng này có thể tạo căng thẳng: khó nhờ giúp đỡ, khó chia sẻ nỗi lo tiền bạc, hoặc biến mọi thứ thành bài toán lợi hại. Vì vậy, đọc Vũ Khúc ở Tài Bạch cần đi cùng bối cảnh nghề nghiệp, gia đình và mức chịu rủi ro thật.

| Chủ đề | Cách Vũ Khúc thường biểu hiện | Câu hỏi kiểm chứng |
| --- | --- | --- |
| Thu nhập | Thích nguồn thu rõ công sức hoặc chỉ số | Bạn có cần thấy kết quả đo được không? |
| Chi tiêu | Ưu tiên hiệu quả và độ bền | Bạn cắt khoản thừa có dễ không? |
| Tích lũy | Có thể kỷ luật nếu mục tiêu rõ | Bạn có kế hoạch hay chỉ ép mình tiết kiệm? |
| Rủi ro | Dám quyết khi dữ liệu đủ | Bạn có bỏ qua cảm xúc người liên quan không? |

## Điểm mạnh: biết biến tiền thành hệ thống

Vũ Khúc ở Tài Bạch hợp với việc tạo ngân sách, quản lý tài sản, vận hành kinh doanh, kiểm soát chi phí, tối ưu quy trình kiếm tiền hoặc làm các nghề cần sự chính xác về nguồn lực. Người có cách cục này thường không thích mơ hồ trong chuyện tiền. Họ muốn biết con số, hợp đồng, trách nhiệm, thời hạn và lợi ích cụ thể. Khi trưởng thành, đây là lợi thế lớn vì tiền bạc không bị để mặc cho cảm xúc nhất thời.

Ở tầng nghề nghiệp, Vũ Khúc có thể phát huy trong tài chính, kế toán, vận hành, kỹ thuật, quản trị dự án, bán hàng B2B, kinh doanh có hàng tồn/kho/vốn, hoặc những vai trò cần quyết định dựa trên hiệu quả. Nên đọc cùng [Cung Tài Bạch](/tra-cuu/cung-tai-bach), [Sao Vũ Khúc](/tra-cuu/sao-vu-khuc), [Thái Âm cung Tài Bạch](/tra-cuu/sao-thai-am-cung-tai-bach) và [Thiên Phủ cung Tài Bạch](/tra-cuu/sao-thien-phu-cung-tai-bach) để thấy ba kiểu quản trị tiền rất khác nhau.

- Viết mục tiêu tài chính thành con số, thời hạn và hành động kiểm tra.
- Dùng bảng thu chi thật, không chỉ ước lượng trong đầu.
- Tách quyết định đầu tư khỏi nhu cầu chứng minh bản lĩnh.
- Kiểm tra tác động lên quan hệ gia đình trước quyết định tiền lớn.

## Rủi ro: quá cứng với bản thân và người khác

Mặt khó của Vũ Khúc ở Tài Bạch là dễ xem tiền như thước đo năng lực. Khi tài chính tốt, người này thấy mình kiểm soát được đời sống. Khi tài chính bất ổn, họ dễ tự trách mạnh, trở nên khép kín hoặc phản ứng lạnh. Nếu quan hệ thân mật có người mềm hơn về tiền, sự khác biệt này có thể tạo mâu thuẫn: một bên cần an toàn cảm xúc, một bên cần con số và kỷ luật.

Một rủi ro khác là quyết định nhanh khi nghĩ dữ liệu đã đủ, nhưng lại chưa đọc hết yếu tố con người. Ví dụ, một khoản đầu tư có vẻ hợp lý nhưng ảnh hưởng sức khỏe, gia đình hoặc thời gian; một cơ hội kinh doanh có biên lợi nhuận tốt nhưng kéo theo áp lực vận hành quá lớn. Tử vi không nên được dùng để hợp thức hóa quyết định rủi ro. Nó chỉ giúp bạn nhìn thấy khuynh hướng của mình trước khi ra quyết định.

## Cách đọc với Quan Lộc và Điền Trạch

Tài Bạch cần đọc cùng Quan Lộc vì tiền thường đến từ cách tạo giá trị. Nếu Quan Lộc mạnh, Vũ Khúc ở Tài Bạch có đất để biến chuyên môn thành nguồn thu rõ. Nếu Quan Lộc rối, người này có thể rất muốn kỷ luật tiền nhưng nguồn thu lại chưa ổn. Điền Trạch cũng quan trọng vì Vũ Khúc thường cần tài sản, nền vật chất hoặc cấu trúc lưu trữ rõ. Hãy xem thêm [Cung Quan Lộc](/tra-cuu/cung-quan-loc), [Cung Điền Trạch](/tra-cuu/cung-dien-trach) và bài [Đại vận là gì](/kien-thuc-tu-vi/dai-van-la-gi) khi đọc quyết định dài hạn.

Trong vận thuận, Vũ Khúc ở Tài Bạch có thể giúp người đọc cắt lãng phí, xây quỹ, tăng kỹ năng kiếm tiền hoặc chuyển sang mô hình thu nhập rõ hơn. Trong vận áp lực, bài học lại là mềm hóa: biết hỏi chuyên gia, biết thừa nhận giới hạn và không dùng tiền để che cảm xúc bất an.

## Checklist tài chính

Bạn có biết chính xác chi phí cố định mỗi tháng không? Bạn có quỹ dự phòng hay chỉ có ý định tiết kiệm? Bạn có thường thấy khó chịu khi người khác chi tiền thiếu kế hoạch? Bạn có quyết định đầu tư vì hiểu mô hình hay vì muốn chứng minh mình quyết đoán? Bạn có đang đánh đổi sức khỏe và thời gian gia đình để đạt một mục tiêu tài chính chưa chắc phù hợp không?

Những câu hỏi này giúp Vũ Khúc trở thành công cụ tự hiểu, không phải nhãn tốt xấu. Nếu câu trả lời cho thấy bạn rất giỏi kỷ luật nhưng thiếu mềm mại, hãy thêm cơ chế trao đổi với người tin cậy trước các quyết định lớn.

## Đọc sâu theo lá số riêng

Muốn biết Vũ Khúc ở Tài Bạch có phải trọng tâm trong lá số của bạn không, hãy [lập lá số miễn phí](/#lap-la-so). Sau đó xem trạng thái Vũ Khúc, phụ tinh, tam hợp Tài Quan Mệnh và vận năm. Nếu câu hỏi liên quan đầu tư, nợ, thuế hoặc pháp lý, hãy dùng lá số như tài liệu tham khảo và vẫn hỏi chuyên gia phù hợp trước khi hành động.`,
  },
  "sao-thai-duong-cung-quan-loc": {
    body: `## Thái Dương ở Quan Lộc là nhu cầu làm việc có ánh sáng và trách nhiệm

Thái Dương tại cung Quan Lộc thường nói về cách một người tạo giá trị thông qua sự rõ ràng, trách nhiệm, khả năng đứng ra và làm sáng vấn đề. Quan Lộc là con đường nghề nghiệp; Thái Dương là năng lượng soi chiếu, công khai, cho đi và gánh phần trách nhiệm thấy được. Vì vậy, tổ hợp này hay gắn với câu hỏi: công việc nào cho phép tôi đóng góp rõ, được nhìn thấy đúng năng lực và dùng sự minh bạch để tạo giá trị?

Không nên đọc Thái Dương ở Quan Lộc thành lời đoán chắc về danh tiếng. Có người phát huy bằng vai trò lãnh đạo trực diện, có người bằng giảng dạy, truyền thông, tư vấn, kỹ thuật giải thích vấn đề, chăm sóc cộng đồng hoặc làm người chịu trách nhiệm cuối cùng cho một mảng. Điểm chung không phải là nổi tiếng, mà là nhu cầu làm việc trong ánh sáng: rõ mục tiêu, rõ tiêu chuẩn, rõ trách nhiệm và ít khuất tất.

| Lớp đọc | Biểu hiện cần quan sát | Câu hỏi thực tế |
| --- | --- | --- |
| Thái Dương | Muốn làm rõ và đứng ra | Bạn có hay nhận phần giải thích không? |
| Quan Lộc | Nghề nghiệp và trách nhiệm xã hội | Công việc hiện tại có minh bạch không? |
| Sáng tối | Mức tự tin và sức bền | Bạn đang tỏa sáng hay kiệt sức? |
| Vận hạn | Thời điểm được giao vai trò | Năm nào bạn phải đứng mũi chịu sào? |

## Điểm mạnh: truyền đạt và chịu trách nhiệm

Khi vận hành tốt, Thái Dương ở Quan Lộc giúp người đọc có khả năng làm cho việc khó trở nên rõ hơn. Họ có thể hợp với môi trường cần giải thích, dẫn dắt, đại diện, đào tạo, xử lý vấn đề công khai, quản lý chất lượng hoặc xây niềm tin bằng sự minh bạch. So với Tử Vi ở Quan Lộc, Thái Dương ít thiên về trật tự quyền lực hơn và thiên về trách nhiệm soi sáng: làm sao để mọi người hiểu, tin và hành động đúng.

Điểm mạnh này đặc biệt hữu ích trong các nghề cần giao tiếp với nhiều người: giáo dục, y tế ở vai trò truyền thông/chăm sóc, tư vấn, pháp lý, quản lý, truyền thông thương hiệu, sản phẩm, nhân sự, hoặc vị trí cầu nối giữa chuyên môn và người dùng. Nên đọc thêm [Sao Thái Dương](/tra-cuu/sao-thai-duong), [Cung Quan Lộc](/tra-cuu/cung-quan-loc), [Tử Vi cung Quan Lộc](/tra-cuu/sao-tu-vi-cung-quan-loc) và [cách đọc lá số cho người mới](/kien-thuc-tu-vi/cach-doc-la-so-tu-vi-cho-nguoi-moi).

- Tìm công việc có tiêu chuẩn minh bạch và phản hồi rõ.
- Rèn kỹ năng nói, viết, trình bày và giải thích quyết định.
- Đặt ranh giới cho phần trách nhiệm mình nhận.
- Đừng nhầm “được nhìn thấy” với “phải luôn mạnh mẽ”.

## Rủi ro: quá tải vì vai trò người soi đường

Thái Dương là năng lượng cho đi. Khi ở Quan Lộc, người này dễ được kỳ vọng đứng ra, giải quyết, nói rõ, làm gương hoặc chịu trách nhiệm khi nhóm thiếu người dẫn. Nếu không biết giới hạn, họ có thể kiệt sức vì luôn phải sáng, luôn phải đúng, luôn phải có câu trả lời. Đây là điểm rất thực tế: một người có năng lực truyền đạt thường bị kéo vào quá nhiều việc không tên.

Mặt khác, nếu Thái Dương bị tổn hoặc gặp môi trường thiếu minh bạch, người đọc có thể thấy công việc rất mệt vì mình phải soi vào những nơi người khác không muốn nhìn. Khi sự thật, dữ liệu hoặc trách nhiệm bị che mờ, Thái Dương ở Quan Lộc khó chịu mạnh. Lúc đó, câu hỏi không chỉ là đổi việc hay ở lại, mà là mình có đủ quyền, đồng minh và sức bền để làm rõ vấn đề không.

## Cách đọc theo nam nữ, ngày đêm và bối cảnh

Trong tử vi truyền thống, Thái Dương còn được xét theo độ sáng, vị trí ngày đêm và nhiều quy tắc khác. Ở đây, cách đọc thực dụng là kiểm tra sức bền của năng lượng “đứng ra”. Nếu bạn càng làm càng sáng, càng rõ, càng có người tin vì sự minh bạch, đó là biểu hiện thuận. Nếu bạn càng làm càng cạn, phải gồng hình ảnh, hoặc bị biến thành người chịu lỗi thay hệ thống, cần xem lại bộ sao và vận.

Quan Lộc cũng phải nối với Mệnh và Tài Bạch. Một người có Thái Dương ở Quan Lộc nhưng Mệnh thiên nội tâm vẫn có thể làm tốt vai trò soi sáng bằng văn bản, chuyên môn hoặc tư vấn một-một, không nhất thiết phải đứng sân khấu. Nếu Tài Bạch không ổn, công việc có ý nghĩa nhưng nguồn lực chưa tương xứng cũng gây áp lực. Hãy đối chiếu thêm [Cung Mệnh](/tra-cuu/cung-menh), [Cung Tài Bạch](/tra-cuu/cung-tai-bach) và [xem ngày](/xem-ngay) khi cần chọn thời điểm nhỏ cho việc công khai.

## Checklist nghề nghiệp

Bạn có thường là người giải thích phần khó cho nhóm không? Bạn có thấy mình cần công việc minh bạch hơn người khác? Bạn có đang chịu trách nhiệm cho lỗi hệ thống không thuộc quyền mình? Bạn có được ghi nhận đúng mức cho phần soi sáng và kết nối không? Bạn có đang mất năng lượng vì phải tỏ ra ổn?

Nếu nhiều câu trả lời là có, Thái Dương ở Quan Lộc có thể đang là lớp đọc chính. Điều cần làm không phải lúc nào cũng là bước ra nhiều hơn; đôi khi là đặt ranh giới, chọn môi trường sáng hơn, hoặc chuyển khả năng giải thích thành tài sản nghề nghiệp cụ thể.

## Đọc sâu theo lá số riêng

Hãy [lập lá số miễn phí](/#lap-la-so) nếu bạn đang ở giai đoạn đổi nghề, lên vai trò đại diện, mở thương hiệu cá nhân, hoặc phải xử lý một việc công khai. Khi có lá số, hãy xem thêm Mệnh, Thân, Tài Bạch, Phúc Đức và vận năm. Thái Dương ở Quan Lộc có thể là nguồn sáng tốt, nhưng nguồn sáng nào cũng cần nhiên liệu và giới hạn.`,
  },
  "sao-thien-phu-cung-tai-bach": {
    body: `## Thiên Phủ ở Tài Bạch là năng lực giữ kho và điều phối nguồn lực

Thiên Phủ tại cung Tài Bạch thường được đọc như khả năng bảo toàn, chứa đựng và điều phối nguồn lực. Nếu Vũ Khúc ở Tài Bạch giống người quản trị bằng kỷ luật và con số, Thiên Phủ giống người giữ kho: biết cái gì nên giữ, cái gì nên phân bổ, cái gì cần dự phòng để hệ thống không đứt gãy. Cung Tài Bạch nói về tiền và nguồn lực; Thiên Phủ thêm vào đó nhu cầu ổn định, bền vững và tránh phung phí.

Tuy nhiên, Thiên Phủ không phải giấy bảo đảm tài lộc. Nó chỉ cho thấy một kiểu xử lý nguồn lực thiên về giữ nền. Nếu gặp vận tốt và bộ sao hỗ trợ, người đọc có thể xây tài chính bền. Nếu gặp môi trường trì trệ, Thiên Phủ có thể thành quá thận trọng, chậm đổi mới hoặc giữ thứ không còn hiệu quả. Vì vậy, bài này nên được đọc như hướng dẫn quan sát, không phải lời kết luận về giàu nghèo.

| Góc đọc | Thiên Phủ thường hỏi | Dấu hiệu thực tế |
| --- | --- | --- |
| Bảo toàn | Nguồn lực nào cần giữ? | Quỹ dự phòng, tài sản, quan hệ hỗ trợ |
| Điều phối | Phân bổ thế nào cho bền? | Cách chia tiền cho gia đình/công việc |
| Tài Bạch | Tiền có hệ thống không? | Thu chi, nợ, khoản dài hạn |
| Rủi ro | Có giữ quá lâu không? | Ngại đổi mô hình dù dữ liệu đã thay đổi |

## Điểm mạnh: xây nền tài chính bền

Khi vận hành tốt, Thiên Phủ ở Tài Bạch giúp người đọc có tư duy bảo toàn trước khi mở rộng. Họ thường hợp với việc quản lý tài sản, ngân sách, vận hành ổn định, tích lũy dài hạn, hoặc giữ vai trò điều phối nguồn lực trong gia đình/doanh nghiệp. Người này có thể không thích cách kiếm tiền quá chụp giật. Họ cần thấy nền, kho, quỹ, tài sản hoặc hệ thống bảo vệ phía sau.

Điểm mạnh này rất phù hợp với các quyết định cần độ bền: mua nhà, xây quỹ gia đình, quản lý dòng tiền doanh nghiệp nhỏ, tích lũy cho con cái, hoặc phân bổ nguồn lực giữa nhiều mục tiêu. Nên đọc cùng [Cung Tài Bạch](/tra-cuu/cung-tai-bach), [Sao Thiên Phủ](/tra-cuu/sao-thien-phu), [Vũ Khúc cung Tài Bạch](/tra-cuu/sao-vu-khuc-cung-tai-bach) và [Thái Âm cung Tài Bạch](/tra-cuu/sao-thai-am-cung-tai-bach) để thấy khác biệt giữa giữ kho, kỷ luật và cảm giác an toàn.

- Xác định khoản nào là nền không được dùng tùy tiện.
- Phân bổ tiền theo mục tiêu: sống, dự phòng, đầu tư, học tập, hỗ trợ.
- Định kỳ kiểm tra tài sản đang giữ có còn phục vụ mục tiêu không.
- Tránh giữ mọi thứ chỉ vì sợ thay đổi.

## Rủi ro: an toàn trở thành trì hoãn

Mặt khó của Thiên Phủ ở Tài Bạch là dễ ưu tiên an toàn đến mức chậm hành động. Người này có thể giữ tiền tốt nhưng bỏ lỡ cơ hội học kỹ năng mới, đổi mô hình thu nhập hoặc đầu tư vào công cụ cần thiết. Trong gia đình, họ có thể trở thành người giữ kho quá chặt, khiến người khác thấy thiếu linh hoạt. Trong kinh doanh, họ có thể bảo toàn vốn nhưng chậm thích nghi khi thị trường đổi.

Rủi ro khác là gắn giá trị bản thân với khả năng “lo được cho mọi người”. Thiên Phủ có tính chứa đựng, nên người đọc dễ nhận vai trò bảo bọc. Nếu không có ranh giới, họ vừa giữ tiền vừa gánh nhu cầu của người khác, cuối cùng mệt mà vẫn thấy có lỗi khi từ chối. Vì vậy, Thiên Phủ ở Tài Bạch cần học cách phân bổ không chỉ tiền, mà cả trách nhiệm.

## Cách đọc khi liên quan nhà cửa và gia đình

Thiên Phủ tại Tài Bạch rất nên đọc cùng Điền Trạch và Phúc Đức. Điền Trạch cho biết nền tài sản, nơi ở và cảm giác ổn định vật chất. Phúc Đức cho biết gia đình, nền tinh thần và phần nâng đỡ phía sau. Nếu cả ba lớp này có liên kết tốt, người đọc thường quan tâm mạnh đến việc xây nền cho gia đình hoặc tích lũy dài hạn. Nếu có xung đột, tiền bạc có thể bị kéo vào trách nhiệm họ hàng, nhà cửa hoặc nghĩa vụ khó nói.

Khi vận hạn kích hoạt Tài Bạch, Thiên Phủ có thể đưa ra các chủ đề như mua tài sản, tái phân bổ tiền, lập quỹ dự phòng, xử lý khoản lớn, hoặc học cách không giữ mọi trách nhiệm một mình. Xem thêm [Cung Điền Trạch](/tra-cuu/cung-dien-trach), [Cung Phúc Đức](/tra-cuu/cung-phuc-duc) và [Đại vận là gì](/kien-thuc-tu-vi/dai-van-la-gi) để đặt quyết định vào chu kỳ dài hơn.

## Checklist quản trị nguồn lực

Bạn có biết tài sản nào là nền an toàn thật sự của mình không? Bạn có giữ quá nhiều tiền mặt vì sợ rủi ro không? Bạn có đang chi cho người thân mà không có giới hạn rõ không? Bạn có kế hoạch nâng cấp kỹ năng kiếm tiền hay chỉ tập trung giữ tiền? Bạn có thể nói “khoản này không dùng được” mà không thấy áy náy không?

Các câu hỏi này giúp Thiên Phủ trở thành năng lực điều phối thay vì nỗi sợ mất an toàn. Nếu câu trả lời cho thấy bạn có nền nhưng thiếu tăng trưởng, hãy thêm kế hoạch học tập, công cụ và thử nghiệm nhỏ có kiểm soát.

## Đọc sâu theo lá số riêng

Để biết Thiên Phủ ở Tài Bạch đang mạnh yếu ra sao, hãy [lập lá số miễn phí](/#lap-la-so), rồi xem trạng thái Thiên Phủ, bộ sao tài sản, tam hợp Tài Quan Mệnh và vận năm. Với các quyết định lớn như mua nhà, góp vốn hoặc vay nợ, hãy dùng lá số như một lớp tự hiểu, đồng thời kiểm tra dữ liệu tài chính và tư vấn chuyên môn trước khi hành động.`,
  },
};

type Batch2StarKey =
  | "tu-vi"
  | "thien-co"
  | "thai-duong"
  | "vu-khuc"
  | "thien-dong"
  | "liem-trinh"
  | "thien-phu"
  | "thai-am"
  | "tham-lang"
  | "cu-mon"
  | "thien-tuong"
  | "thien-luong"
  | "that-sat"
  | "pha-quan";

type Batch2PalaceKey = "menh" | "quan-loc" | "tai-bach";

const BATCH2_STARS: Record<Batch2StarKey, {
  name: string;
  element: string;
  temperament: string;
  gift: string;
  shadow: string;
  practice: string;
  image: string;
  nghề: string;
}> = {
  "tu-vi": {
    name: "Tử Vi",
    element: "Thổ",
    temperament: "cần vị trí trung tâm, trật tự và một cấu trúc đủ rõ để điều phối nguồn lực",
    gift: "gom người, việc và mục tiêu rời rạc thành một hệ thống có trách nhiệm",
    shadow: "dễ ôm vai trò quá chặt, đặt nặng vị thế hoặc nhầm kiểm soát với năng lực lãnh đạo",
    practice: "phân biệt việc mình cần quyết, việc nên giao và việc chỉ cần đặt nguyên tắc rồi để người khác vận hành",
    image: "người giữ bản đồ trong phòng họp: hữu ích khi giúp cả nhóm thấy đường đi, nặng nề nếu giữ bản đồ cho riêng mình",
    nghề: "quản lý, điều phối, xây hệ thống, cố vấn, vận hành tổ chức, sản phẩm hoặc vai trò cần nhìn đại cục",
  },
  "thien-co": {
    name: "Thiên Cơ",
    element: "Mộc",
    temperament: "ưa quan sát cơ chế, thích hiểu vì sao một việc vận hành rồi mới chọn cách can thiệp",
    gift: "biết đổi phương án khi dữ kiện thay đổi, giỏi nhìn ra con đường phụ mà người khác bỏ qua",
    shadow: "dễ nghĩ quá nhiều, đổi hướng liên tục hoặc biến sự linh hoạt thành thiếu cam kết",
    practice: "ghi lại giả thuyết, thời hạn thử nghiệm và tiêu chí dừng trước khi xoay phương án",
    image: "người tháo một chiếc đồng hồ cũ để xem bánh răng nào đang kẹt",
    nghề: "tư vấn, phân tích, sản phẩm, kỹ thuật, chiến lược, giáo dục hoặc các việc cần thiết kế quy trình",
  },
  "thai-duong": {
    name: "Thái Dương",
    element: "Hỏa",
    temperament: "cần sự rõ ràng, trách nhiệm và cảm giác mình đang làm sáng một vấn đề có ích",
    gift: "truyền đạt điều khó thành dễ hiểu, đứng ra khi tập thể cần một điểm tựa minh bạch",
    shadow: "dễ quá tải vì luôn phải sáng, phải đúng, phải gánh phần người khác chưa dám nhận",
    practice: "đặt ranh giới cho trách nhiệm, phân biệt việc cần mình soi sáng với việc mình đang gồng thay hệ thống",
    image: "ngọn đèn đặt trên bàn làm việc, không chói nhưng đủ để mọi người đọc được bản đồ",
    nghề: "đào tạo, quản lý, truyền thông, tư vấn, đại diện, chăm sóc cộng đồng hoặc vai trò giải thích chuyên môn",
  },
  "vu-khuc": {
    name: "Vũ Khúc",
    element: "Kim",
    temperament: "thực tế, coi trọng hiệu quả và muốn mọi nguồn lực được đo bằng việc làm cụ thể",
    gift: "quyết đoán, chịu áp lực, biết cắt phần thừa và biến mục tiêu thành kỷ luật",
    shadow: "dễ khô cứng, tự trách khi kết quả chưa đạt hoặc xem cảm xúc như chuyện gây nhiễu",
    practice: "đặt chỉ số rõ nhưng thêm một vòng kiểm tra tác động lên sức khỏe, quan hệ và thời gian",
    image: "người giữ sổ kho, cân từng khoản vào ra nhưng vẫn cần nhớ kho phục vụ đời sống",
    nghề: "tài chính, vận hành, kỹ thuật, quản trị dự án, kinh doanh, kiểm soát chi phí hoặc nghề cần quyết định chắc tay",
  },
  "thien-dong": {
    name: "Thiên Đồng",
    element: "Thủy",
    temperament: "mềm, dễ cảm thông và thường tìm cách làm cuộc sống bớt căng bằng sự thích nghi",
    gift: "biết hạ nhiệt, kết nối người khác và tìm niềm vui trong quá trình thay vì chỉ nhìn đích đến",
    shadow: "dễ trì hoãn, chiều theo hoàn cảnh hoặc né quyết định khó vì sợ mất sự yên ổn",
    practice: "chọn một nhịp nhỏ có thể lặp lại hằng tuần, rồi để sự mềm mại phục vụ cam kết thay vì thay thế cam kết",
    image: "dòng nước đổi hướng quanh tảng đá, không đối đầu nhưng vẫn cần biết mình chảy về đâu",
    nghề: "dịch vụ, chăm sóc khách hàng, giáo dục, sáng tạo, nhân sự, du lịch, cộng đồng hoặc các việc cần cảm xúc tinh tế",
  },
  "liem-trinh": {
    name: "Liêm Trinh",
    element: "Hỏa",
    temperament: "nhạy với ranh giới đúng sai, danh dự, hấp lực cá nhân và nhu cầu sống có nguyên tắc",
    gift: "giữ chuẩn mực, phát hiện điểm lệch và có sức hút khi biết dùng nguyên tắc để bảo vệ điều đáng quý",
    shadow: "dễ cực đoan, phản ứng nóng hoặc mắc kẹt giữa muốn tự do và muốn giữ hình ảnh sạch",
    practice: "viết rõ nguyên tắc nào là bất khả xâm phạm, nguyên tắc nào chỉ là thói quen cần cập nhật",
    image: "một lằn ranh bằng than đỏ: đủ sáng để cảnh báo, nhưng nếu đứng quá gần sẽ bỏng",
    nghề: "pháp lý, kiểm soát chất lượng, thương hiệu cá nhân, nghệ thuật, quản trị rủi ro, nhân sự hoặc vai trò giữ chuẩn",
  },
  "thien-phu": {
    name: "Thiên Phủ",
    element: "Thổ",
    temperament: "thiên về chứa đựng, bảo toàn và sắp xếp nguồn lực sao cho hệ thống không hụt nền",
    gift: "biết giữ kho, phân bổ, tạo cảm giác an toàn và không dễ bị cuốn vào nhịp quá gấp",
    shadow: "dễ thận trọng quá mức, giữ thứ đã cũ hoặc ôm vai trò bảo bọc cho quá nhiều người",
    practice: "định kỳ hỏi tài sản, vai trò hoặc trách nhiệm nào đang được giữ vì còn giá trị, cái nào chỉ được giữ vì sợ mất",
    image: "kho thóc sau nhà: quý vì nuôi được người, nhưng vẫn phải mở cửa, kiểm kê và thay hạt cũ",
    nghề: "quản trị, tài sản, vận hành, hậu cần, giáo dục, tài chính gia đình, tổ chức hoặc vị trí giữ nền cho tập thể",
  },
  "thai-am": {
    name: "Thái Âm",
    element: "Thủy",
    temperament: "sâu, kín, quan sát bằng cảm nhận và cần sự an toàn trước khi mở lòng hoặc quyết định",
    gift: "tinh tế với nhu cầu của người khác, biết tích lũy chậm và nhìn các lớp cảm xúc khó nói",
    shadow: "dễ lo xa, giữ trong lòng quá lâu hoặc quyết định theo cảm giác bất an thay vì dữ kiện đủ",
    practice: "tách cảm xúc, dữ kiện và ký ức cũ thành ba cột riêng trước khi kết luận",
    image: "ánh trăng trên mặt nước: giúp thấy điều ban ngày bỏ sót nhưng cũng dễ méo nếu nước động",
    nghề: "nghiên cứu, chăm sóc, tài chính bền, bất động sản, tư vấn, viết lách, sản phẩm cho gia đình hoặc dịch vụ cần thấu cảm",
  },
  "tham-lang": {
    name: "Tham Lang",
    element: "Thủy",
    temperament: "ham trải nghiệm, thích mở rộng quan hệ, học nhanh qua va chạm và có sức hút xã hội",
    gift: "linh hoạt, biết tạo cơ hội từ con người, thị trường, sở thích và nhu cầu đang thay đổi",
    shadow: "dễ quá tay, phân tán, ham nhiều hướng hoặc dùng sức hút để né phần kỷ luật cần làm",
    practice: "đặt giới hạn số dự án, số mối quan hệ và số khoản thử nghiệm được phép mở cùng lúc",
    image: "khu chợ đêm nhiều ánh đèn: giàu cơ hội nếu biết mình mua gì, dễ lạc nếu chỉ đi theo tiếng gọi",
    nghề: "kinh doanh, truyền thông, giải trí, sản phẩm, quan hệ khách hàng, thị trường, sáng tạo hoặc vai trò mở mạng lưới",
  },
  "cu-mon": {
    name: "Cự Môn",
    element: "Thủy",
    temperament: "đặt câu hỏi, phát hiện điểm chưa rõ và cần dùng ngôn ngữ để bóc tách vấn đề",
    gift: "phân tích tốt, nói ra điều người khác ngại nói và biến mâu thuẫn thành dữ liệu để hiểu sâu hơn",
    shadow: "dễ vướng thị phi, nói quá sắc hoặc nghi ngờ đến mức làm quan hệ và quyết định bị chậm",
    practice: "trước khi phản biện, viết mục tiêu của cuộc nói chuyện: làm rõ, thương lượng hay chỉ xả bức xúc",
    image: "chiếc chuông trong sương: âm thanh giúp định hướng, nhưng vang quá lâu sẽ thành nhiễu",
    nghề: "tư vấn, luật, nghiên cứu, nội dung, đàm phán, kiểm toán, đào tạo hoặc nghề cần hỏi đúng câu hỏi",
  },
  "thien-tuong": {
    name: "Thiên Tướng",
    element: "Thủy",
    temperament: "coi trọng sự công bằng, vai trò hỗ trợ và cách phối hợp để một hệ thống giữ được chuẩn",
    gift: "biết đứng giữa, bảo vệ tiêu chuẩn, làm dịu xung đột và giúp người khác vận hành đúng vai",
    shadow: "dễ lệ thuộc đánh giá, ngại quyết định dứt khoát hoặc nhận vai hỗ trợ quá lâu mà quên nhu cầu riêng",
    practice: "xác định mình đang hỗ trợ vì giá trị chung hay đang né việc bước lên vị trí chính",
    image: "người giữ cân trong phiên chợ: không bán hàng thay ai, nhưng giúp cuộc trao đổi bớt lệch",
    nghề: "quản lý nhân sự, pháp chế, điều phối, chăm sóc khách hàng, vận hành, cố vấn hoặc vai trò bảo vệ tiêu chuẩn",
  },
  "thien-luong": {
    name: "Thiên Lương",
    element: "Mộc",
    temperament: "thiên về bảo hộ, đạo lý, kinh nghiệm và nhu cầu làm việc có ích cho sự bền lành",
    gift: "nhìn hậu quả dài hạn, biết nâng đỡ người khác và đặt câu hỏi về ý nghĩa phía sau hành động",
    shadow: "dễ phán xét, tự đặt mình vào vai người đúng hoặc dùng đạo lý để tránh thay đổi thực tế",
    practice: "chuyển lời khuyên thành hành động nhỏ có thể đo được, thay vì chỉ nói điều nên làm",
    image: "cây lớn ở sân đình: cho bóng mát nhưng cũng cần cắt cành khô để không che hết ánh sáng",
    nghề: "giáo dục, y tế hỗ trợ, cố vấn, quản trị rủi ro, cộng đồng, pháp lý mềm hoặc nghề cần kinh nghiệm và trách nhiệm",
  },
  "that-sat": {
    name: "Thất Sát",
    element: "Kim",
    temperament: "mạnh, dứt khoát, chịu áp lực và thường bộc lộ rõ khi hoàn cảnh buộc phải quyết nhanh",
    gift: "hành động trong tình huống khó, cắt bế tắc, chịu trách nhiệm ở tuyến đầu và không sợ đổi thế trận",
    shadow: "dễ cứng, mạo hiểm, cô độc hoặc xem chậm lại là yếu trong khi thực ra cần thêm dữ kiện",
    practice: "trước quyết định lớn, bắt buộc có một bước kiểm tra hậu quả và một phương án rút lui",
    image: "lưỡi dao dùng để mở đường trong rừng rậm: cần sắc nhưng càng cần người biết cầm",
    nghề: "quản trị khủng hoảng, kinh doanh cạnh tranh, kỹ thuật, quân sự/an ninh, vận hành áp lực, thể thao hoặc vai trò phá bế tắc",
  },
  "pha-quan": {
    name: "Phá Quân",
    element: "Thủy",
    temperament: "thích tái cấu trúc, không chịu được hệ thống đã mục và thường học qua chu kỳ phá cũ lập mới",
    gift: "dám kết thúc điều không còn sống, mở đường đổi mới và chịu được giai đoạn chuyển tiếp lộn xộn",
    shadow: "dễ phá quá sớm, chán phần duy trì hoặc nhầm tự do với việc không cần cam kết",
    practice: "mỗi lần muốn thay đổi lớn, viết rõ điều gì phải giữ, điều gì được bỏ và chi phí chuyển đổi là gì",
    image: "con thuyền tháo ván cũ giữa bến: cần sửa để đi xa hơn, nhưng không nên tháo khi đang giữa bão",
    nghề: "chuyển đổi mô hình, startup, cải tổ, sản phẩm mới, xử lý khủng hoảng, nghệ thuật phá cách hoặc nghề cần dọn cái cũ",
  },
};

const BATCH2_PALACES: Record<Batch2PalaceKey, {
  name: string;
  question: string;
  lens: string;
  decision: string;
  related: string[];
}> = {
  "menh": {
    name: "Mệnh",
    question: "tôi thường phản ứng, chọn lựa và tự định nghĩa mình theo kiểu nào",
    lens: "khí chất, thói quen tự vệ, cách bước vào một tình huống mới và điều người khác cảm thấy ở bạn trước tiên",
    decision: "định hình vai trò sống, ranh giới cá nhân, cách giao tiếp và cách rèn thói quen nền",
    related: ["/tra-cuu/cung-menh", "/tra-cuu/sao-tu-vi-cung-menh", "/kien-thuc-tu-vi/cung-menh-cung-than"],
  },
  "quan-loc": {
    name: "Quan Lộc",
    question: "tôi tạo giá trị qua công việc, trách nhiệm và vai trò xã hội ra sao",
    lens: "nghề nghiệp, cách chịu trách nhiệm, môi trường làm việc hợp và kiểu đóng góp được người khác ghi nhận",
    decision: "chọn nghề, đổi vai trò, nhận dự án, xây uy tín và kiểm tra xem công việc có đang hút cạn sức không",
    related: ["/tra-cuu/cung-quan-loc", "/tra-cuu/sao-tu-vi-cung-quan-loc", "/kien-thuc-tu-vi/cung-quan-loc-trong-tu-vi"],
  },
  "tai-bach": {
    name: "Tài Bạch",
    question: "tôi tạo, giữ, dùng và đánh giá nguồn lực theo cơ chế nào",
    lens: "tiền bạc, tài sản, năng lực kiếm tiền, cách phân bổ nguồn lực và cảm giác an toàn vật chất",
    decision: "quản trị thu chi, đầu tư học tập, chọn nguồn thu, giới hạn rủi ro và xây nền tài chính bền hơn",
    related: ["/tra-cuu/cung-tai-bach", "/tra-cuu/sao-vu-khuc-cung-tai-bach", "/kien-thuc-tu-vi/cung-tai-bach-trong-tu-vi"],
  },
};

const BATCH2_SLUGS = new Set<string>(CURATED_PSEO_SLUGS);

function parseBatch2Slug(slug: string) {
  const match = slug.match(/^sao-(.+)-cung-(menh|quan-loc|tai-bach)$/);
  if (!match) return null;
  const starSlug = match[1] as Batch2StarKey;
  const palaceSlug = match[2] as Batch2PalaceKey;
  if (!BATCH2_STARS[starSlug] || !BATCH2_PALACES[palaceSlug]) return null;
  return { starSlug, palaceSlug };
}

function titleForBatch2(star: typeof BATCH2_STARS[Batch2StarKey], palace: typeof BATCH2_PALACES[Batch2PalaceKey]) {
  return `Sao ${star.name} cung ${palace.name}: ý nghĩa và cách tự đối chiếu`;
}

function buildBatch2Content(slug: string): CuratedPage | undefined {
  const parsed = parseBatch2Slug(slug);
  if (!parsed || !BATCH2_SLUGS.has(slug)) return undefined;
  const star = BATCH2_STARS[parsed.starSlug];
  const palace = BATCH2_PALACES[parsed.palaceSlug];
  const sameStarLinks = (["menh", "quan-loc", "tai-bach"] as Batch2PalaceKey[])
    .filter((item) => item !== parsed.palaceSlug)
    .map((item) => `[${star.name} cung ${BATCH2_PALACES[item].name}](/tra-cuu/sao-${parsed.starSlug}-cung-${item})`)
    .join(", ");
  const samePalaceLinks = Object.entries(BATCH2_STARS)
    .filter(([key]) => key !== parsed.starSlug)
    .slice(0, 4)
    .map(([key, item]) => `[${item.name} cung ${palace.name}](/tra-cuu/sao-${key}-cung-${parsed.palaceSlug})`)
    .join(", ");

  return {
    title: titleForBatch2(star, palace),
    excerpt: `Tra cứu ${star.name} tại cung ${palace.name}: cách hiểu ${palace.lens}, điểm mạnh, rủi ro và checklist tự đối chiếu trước khi luận sâu lá số.`,
    metaTitle: `${star.name} cung ${palace.name}: ý nghĩa và cách đọc`,
    metaDescription: `Hướng dẫn đọc ${star.name} ở cung ${palace.name}: trọng tâm luận giải, điểm thuận lợi, rủi ro, checklist đời sống và cách đối chiếu với lá số cá nhân.`,
    body: `## ${star.name} ở cung ${palace.name} nên được đọc từ câu hỏi nào?

Khi ${star.name} nằm tại cung ${palace.name}, câu hỏi đầu tiên không phải là tốt hay xấu, mà là: ${palace.question}. ${star.name} mang sắc thái ${star.temperament}; cung ${palace.name} lại mở ra lớp ${palace.lens}. Ghép hai phần này với nhau, người đọc có một bản đồ để tự quan sát thay vì vội dán nhãn vận mệnh.

Hình ảnh gần nhất cho tổ hợp này là ${star.image}. Nó cho thấy một năng lực có ích, nhưng năng lực đó chỉ đúng khi đặt vào hoàn cảnh thật. Một người có ${star.name} ở ${palace.name} có thể biểu hiện rất khác nhau tùy giờ sinh, trạng thái sao, bộ sao đi cùng, tam hợp, xung chiếu và vận đang kích hoạt. Vì vậy, phần dưới đây là bản đọc nền, không thay thế việc [lập lá số tử vi miễn phí](/#lap-la-so) để kiểm tra toàn cục.

| Lớp đọc | Việc cần quan sát | Câu hỏi kiểm chứng |
| --- | --- | --- |
| Sao ${star.name} | ${star.temperament} | Khi căng thẳng, bạn có quay về kiểu phản ứng này không? |
| Cung ${palace.name} | ${palace.lens} | Chủ đề này có lặp lại trong các quyết định lớn không? |
| Điểm mạnh | ${star.gift} | Người khác từng nhờ bạn ở phần việc nào tương tự? |
| Điểm lệch | ${star.shadow} | Khi mọi thứ không như ý, bạn lệch về hướng nào trước? |

## Điểm thuận lợi: ${star.gift}

Mặt thuận của ${star.name} tại ${palace.name} nằm ở khả năng ${star.gift}. Trong chủ đề ${palace.name}, điều này không nên hiểu như một lời hứa kết quả, mà là một kiểu năng lực có thể rèn. Nếu biết dùng đúng, người đọc sẽ thấy mình có một cách tiếp cận riêng với ${palace.decision}. Năng lực này càng rõ khi được đặt trong môi trường phù hợp, có phản hồi thật và có thời gian kiểm chứng.

Với riêng cung ${palace.name}, ${star.name} thường không phát huy bằng khẩu hiệu. Nó phát huy qua những hành vi nhỏ: cách bạn hỏi lại dữ kiện, cách bạn chọn người đồng hành, cách bạn giữ nhịp khi áp lực tăng, và cách bạn sửa sai sau một quyết định chưa trọn. Nếu đang đọc cho nghề nghiệp, tiền bạc hoặc bản thân, hãy so với những tình huống đã xảy ra trong ba năm gần nhất thay vì chỉ đọc như mô tả tính cách chung.

- Ghi ra một tình huống cụ thể liên quan đến ${palace.name} trong năm gần đây.
- Đánh dấu phần nào đến từ dữ kiện, phần nào đến từ cảm xúc, phần nào đến từ thói quen cũ.
- So với điểm mạnh của ${star.name}: ${star.gift}.
- Chọn một hành động nhỏ để kiểm chứng trong 30 ngày, không kết luận vội từ một sự kiện đơn lẻ.

## Điểm cần thận trọng: ${star.shadow}

Mặt khó của ${star.name} tại ${palace.name} là ${star.shadow}. Khi chủ đề ${palace.name} bị kích hoạt mạnh, người đọc dễ xem phản ứng quen thuộc của mình là sự thật khách quan. Ví dụ, một người đang lo về ${palace.name} có thể nghĩ mình đang phân tích rất tỉnh, trong khi thật ra đang tự vệ. Hoặc ngược lại, họ tưởng mình đang nhẫn nại, nhưng thực chất đang trì hoãn quyết định cần làm.

Điểm này đặc biệt quan trọng vì tử vi rất dễ bị dùng như lý do để hợp thức hóa thói quen. Nếu lá số nói bạn có một khuynh hướng, điều đó không có nghĩa khuynh hướng ấy luôn đúng. Nội dung tra cứu chỉ nên giúp bạn nhìn rõ cơ chế, còn quyết định về tiền bạc, sức khỏe, pháp lý, hôn nhân hay đầu tư vẫn cần dữ liệu thực tế và chuyên gia phù hợp khi vấn đề đủ lớn.

## Cách ứng dụng vào đời sống hiện tại

Với ${star.name} ở ${palace.name}, thực hành quan trọng nhất là: ${star.practice}. Câu này nghe đơn giản nhưng có thể thay đổi cách bạn dùng lá số. Thay vì đọc để tìm một kết luận cuối cùng, bạn đọc để biết mình nên kiểm tra điều gì trước khi hành động. Nếu chủ đề là Mệnh, đó là cách phản ứng và ranh giới. Nếu là Quan Lộc, đó là vai trò và môi trường làm việc. Nếu là Tài Bạch, đó là dòng tiền và nguồn lực.

Trong thực tế, ${star.name} thường hợp với các bối cảnh như ${star.nghề}. Nhưng không nên lấy danh sách nghề hoặc lĩnh vực làm đáp án đóng. Cùng một sao có thể đi vào nhiều nghề khác nhau; thứ cần giữ là cơ chế vận hành. Người có ${star.name} mạnh nên tìm môi trường cho phép cơ chế ấy trở thành năng lực hữu ích, không phải nơi liên tục đẩy nó sang mặt lệch.

## Liên kết để đọc tiếp đúng tầng

Để tránh đọc một trang rồi kết luận, hãy đi theo ba tầng. Tầng một là hub [Ý nghĩa 14 Chính Tinh](/tra-cuu/y-nghia-14-chinh-tinh) và [Ý nghĩa 12 Cung](/tra-cuu/y-nghia-12-cung). Tầng hai là trang entity như [Sao ${star.name}](/tra-cuu/sao-${parsed.starSlug}) và [Cung ${palace.name}](/tra-cuu/cung-${parsed.palaceSlug}). Tầng ba mới là tổ hợp cụ thể như trang bạn đang đọc.

Các tổ hợp liên quan nên đọc tiếp gồm: ${sameStarLinks}. Nếu muốn giữ cùng cung để so sánh cách các chính tinh khác biểu hiện, hãy đọc: ${samePalaceLinks}. Ngoài ra, các bài nền như [cách đọc lá số tử vi cho người mới](/kien-thuc-tu-vi/cach-doc-la-so-tu-vi-cho-nguoi-moi) và [đại vận là gì](/kien-thuc-tu-vi/dai-van-la-gi) giúp bạn không tách một tổ hợp khỏi toàn bộ lá số.

## Checklist tự đối chiếu trước khi tin vào phần luận

Hãy trả lời sáu câu hỏi sau bằng sự kiện thật. Một, chủ đề ${palace.name} đang xuất hiện trong quyết định nào của bạn? Hai, phản ứng đầu tiên của bạn có giống mô tả ${star.temperament} không? Ba, điểm mạnh ${star.gift} đã từng giúp bạn ở tình huống nào? Bốn, mặt lệch ${star.shadow} từng gây hệ quả gì? Năm, bạn có đang đọc lá số để hiểu mình hay để tìm một câu chắc chắn cho quyết định khó? Sáu, nếu hỏi một người thân đáng tin, họ sẽ xác nhận điểm nào và phản biện điểm nào?

Nếu câu trả lời còn mơ hồ, đừng vội kết luận. Hãy quay lại dữ kiện đời sống, sau đó mới đối chiếu lá số. Nếu câu trả lời khá rõ, bạn có thể dùng trang này như bản ghi chú để đọc sâu hơn trong lá số cá nhân. Điều quan trọng là không biến tử vi thành nhãn cố định; nó nên là ngôn ngữ để bạn quan sát bản thân có trật tự hơn.

## Khi nào cần xem lá số cá nhân?

Bạn nên [lập lá số miễn phí](/#lap-la-so) khi câu hỏi về ${palace.name} đang gắn với quyết định thật: đổi nghề, nhận vai trò mới, quản trị tiền, chọn hướng phát triển hoặc điều chỉnh cách sống. Khi có lá số, hãy kiểm tra thêm Mệnh, Thân, tam hợp, xung chiếu, phụ tinh và vận năm. ${star.name} ở ${palace.name} chỉ là một lớp; toàn bộ lá số mới cho biết lớp này đang là trung tâm hay chỉ là tín hiệu phụ trong giai đoạn hiện tại.`,
  };
}

export function getCuratedPseoContent(slug: string) {
  return CURATED_PSEO_CONTENT[slug as CuratedSlug]
    || (MANUAL_BATCH_3[slug] ? { body: MANUAL_BATCH_3[slug].body } : undefined)
    || (MANUAL_BATCH_4[slug] ? { body: MANUAL_BATCH_4[slug].body } : undefined)
    || (MANUAL_BATCH_5[slug] ? { body: MANUAL_BATCH_5[slug].body } : undefined)
    || buildBatch2Content(slug);
}

export function getCuratedPseoGenerationMeta(slug: string) {
  const item = MANUAL_BATCH_3[slug] || MANUAL_BATCH_4[slug] || MANUAL_BATCH_5[slug];
  return item
    ? {
      source: MANUAL_BATCH_5[slug]
        ? "manual-editorial-batch-5"
        : MANUAL_BATCH_4[slug] ? "manual-editorial-batch-4" : "manual-llm-batch-3",
      model: item.generation.model,
      generatedAt: item.generation.generatedAt,
    }
    : { source: "curated-matrix-v1" };
}
