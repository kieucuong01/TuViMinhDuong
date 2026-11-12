import { generateTuViChart, type ChartInput, type Palace, type StarBrightness, type TuViChart } from "@/lib/chart";

export const QUAN_CONTENT_VERSION = "quan-2026-11-04-v1";
export const QUAN_DAILY_VERSION = "quan-daily-v2";
export type QuanTopic = "career" | "love" | "money";
export type QuanContent = { id: string; title: string; body: string; action: string; evidence: string[] };
export type QuanRandomInt = (maxExclusive: number) => number;
const DISCLAIMER = "Gợi ý chiêm nghiệm, không phải dự báo chắc chắn hay căn cứ cho quyết định y tế, pháp lý, tài chính.";

export function quanDayKey(date: Date = new Date()): string {
  if (!Number.isFinite(date.getTime())) throw new Error("Ngày không hợp lệ.");
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function pick(randomInt: QuanRandomInt, max: number) {
  const value = randomInt(max);
  if (!Number.isInteger(value) || value < 0 || value >= max) throw new Error("Nguồn ngẫu nhiên không hợp lệ.");
  return value;
}

const DAILY: Record<QuanTopic, [title: string, body: string, action: string, caution: string][]> = {
  career: [
    ["Chốt việc nào trước", "Nếu sáng ra đã thấy vài người cùng giục, nhìn xem việc nào đang khiến người khác phải chờ bạn.", "Nhắn cho người liên quan một mốc giờ cụ thể, rồi dành 25 phút làm phần họ cần trước.", "Đừng hứa “xong trong hôm nay” cho cả hai việc nếu lịch chỉ còn đủ chỗ cho một."],
    ["Hỏi lại một câu trước khi bắt tay", "Có người nhờ bạn “xem giúp” nhưng có thể họ chỉ cần góp ý, hoặc đang đợi bạn sửa luôn. Làm một lúc mới hỏi thì dễ mất công.", "Nhắn “Bạn cần mình góp ý hay gửi bản đã sửa? Khi nào bạn cần?” trước khi bắt đầu.", "Nếu hai người giao hai yêu cầu khác nhau, chốt với người quyết định trước khi sửa tiếp."],
    ["Việc đang kẹt thì báo sớm", "Nếu đang chờ một file, chữ ký hay phản hồi, người khác có thể vẫn nghĩ việc đang chạy bình thường.", "Báo rõ bạn đang chờ ai, cần gì và chậm nhất lúc mấy giờ thì tiến độ bị ảnh hưởng.", "Trong lúc đợi, làm phần không phụ thuộc. Đừng tự điền số hoặc đoán ý để kịp gửi."],
    ["Gửi một bản nháp sớm", "Nếu cứ sửa đi sửa lại vì sợ người nhận chê, có thể bạn đang chăm chút một phần họ chưa cần.", "Gửi bản nháp cho một người có quyền góp ý, kèm đúng một câu hỏi về phần bạn còn phân vân.", "Ghi rõ là bản nháp và kiểm tra quyền xem trước khi gửi tài liệu nội bộ."],
    ["Chừa một khoảng trong lịch", "Nếu hôm nay có hẹn nối tiếp, chỉ một cuộc kéo dài cũng đủ làm cả buổi trễ theo.", "Chừa 15 phút sau cuộc hẹn quan trọng nhất để ghi lại việc đã chốt và chuyển sang việc kế tiếp.", "Khi biết sẽ trễ, báo trước và đưa giờ mới. Đừng để người kia chờ đến lúc phải hỏi."],
    ["Đọc lại trước khi bấm gửi", "Cuối một việc gấp, lỗi thường nằm ở thứ nhỏ như tên người nhận, phiên bản file hay con số cũ.", "Trước khi gửi bản cuối, mở lại tệp đính kèm và kiểm tra tên, ngày, con số quan trọng nhất.", "Nếu đang bực vì một tin nhắn, để nháp vài phút rồi bỏ câu mang tính trách móc."],
    ["Xin góp ý vào đúng một chỗ", "Nếu bạn muốn biết mình làm ổn chưa, hỏi “thấy sao?” thường chỉ nhận được câu “ổn mà”.", "Chỉ ra một phần cụ thể và hỏi “Chỗ này cần sửa gì để bạn dùng được ngay?”", "Một góp ý về sản phẩm là thông tin để sửa việc. Đừng vội coi đó là đánh giá cả con người mình."],
    ["Thử một bước nhỏ", "Có cách làm cũ khiến bạn phải lặp lại cùng một thao tác mỗi ngày. Hôm nay có thể dành một khoảng ngắn thử cách khác.", "Chọn một phần ít rủi ro, thử trong 20 phút và so thời gian với cách cũ.", "Giữ bản gốc. Khoan áp dụng cho cả nhóm nếu bạn chưa biết có tiết kiệm công thật hay không."],
    ["Nhận thêm việc thì đổi ưu tiên", "Một lời nhờ “chỉ mất tí thôi” có thể chen vào đúng lúc bạn cần tập trung.", "Nói rõ việc nào đang làm và hỏi “Việc mới cần trước hay sau việc này?”", "Khi chưa thống nhất việc nào lùi, tránh nhận thêm một hạn chót chỉ vì ngại từ chối."],
    ["Gói lại việc trước khi nghỉ", "Có những việc hết giờ vẫn lởn vởn trong đầu vì bạn chưa biết mai bắt đầu từ đâu.", "Trước khi nghỉ, ghi một việc đã xong, một việc còn vướng và bước đầu tiên cho ngày làm việc tới.", "Việc còn dang dở chưa cần xử lý tối nay nếu đã có người phụ trách và mốc xử lý rõ."],
  ],
  love: [
    ["Tin nhắn chậm, khoan đoán", "Người bạn mong hồi âm có thể đang bận. Thấy họ im lâu dễ khiến bạn tự nghĩ mình đã nói gì sai.", "Nếu cần chốt một cuộc hẹn, nhắn rõ giờ bạn cần biết và cho họ một phương án khác.", "Đừng gửi dồn hoặc dựa vào trạng thái đã xem để kết luận người kia đang tránh mình."],
    ["Nói rõ điều bạn mong", "Có lúc bạn thất vọng vì người kia không làm một việc mà bạn chưa từng nhờ.", "Nói một câu cụ thể như “Tối nay mình muốn có 15 phút nói chuyện, bạn rảnh lúc nào?”", "Khi nghe “hôm nay không được”, hỏi xem có giờ khác phù hợp trước khi hiểu đó là từ chối bạn."],
    ["Hỏi họ muốn được nghe hay được góp ý", "Khi người thân kể một chuyện bực mình, đưa lời khuyên ngay đôi khi làm họ thấy chưa được lắng nghe.", "Hỏi “Bạn muốn mình nghe thôi hay cùng nghĩ cách xử lý?” rồi nghe hết câu chuyện.", "Nếu chưa rõ sự việc, đừng vội chê người trong câu chuyện hoặc kể sang chuyện của mình."],
    ["Hẹn một việc dễ làm", "Muốn gặp ai đó nhưng cứ nhắn “hôm nào gặp” thì lịch dễ trôi qua.", "Rủ một việc cụ thể như đi bộ 20 phút hoặc uống trà, đưa hai khung giờ để người kia chọn.", "Nếu họ chưa sẵn sàng, để họ có chỗ từ chối. Đừng đổi một lời mời thành lời trách."],
    ["Gỡ một chuyện nhỏ trước", "Có việc gần đây vẫn khiến bạn khó chịu, dù khi đó đã nói “thôi, không sao”.", "Chọn lúc cả hai rảnh và kể đúng một việc, cảm giác của bạn và điều muốn làm khác lần tới.", "Tránh kéo chuyện cũ vào hoặc dùng “lúc nào cũng vậy”. Nói càng cụ thể thì càng dễ sửa."],
    ["Tạm ngưng lúc đang nóng", "Một câu đùa qua tin nhắn đôi khi nghe nặng hơn người gửi định nói. Nếu đang căng, trả lời liền dễ làm chuyện đi xa.", "Nói “Mình hơi bực, để mình bình tĩnh rồi nói lại”, kèm giờ bạn có thể quay lại.", "Nếu đã hẹn nói sau, nhớ quay lại. Đừng để khoảng nghỉ thành im lặng nhiều ngày."],
    ["Để ý việc họ đã làm", "Có người vẫn quan tâm bằng những việc nhỏ như nhắc bạn mang áo mưa hoặc để phần cơm.", "Cảm ơn một việc cụ thể mà họ vừa làm. Nói thêm vì sao việc đó có ích cho bạn.", "Nếu còn một chuyện chưa vui, dành lúc khác để nói. Một lời cảm ơn không cần kèm nhắc lỗi."],
    ["Giữ lời hứa vừa sức", "Có thể bạn muốn giúp người thân nhưng hôm nay lịch hoặc sức mình không cho phép.", "Nói rõ phần bạn làm được, chẳng hạn gọi lại sau giờ làm hoặc giúp tìm người hỗ trợ.", "Tránh đồng ý ngay rồi hủy sát giờ. Một lời từ chối sớm giúp người kia kịp sắp xếp."],
    ["Đừng để người kia phải đoán", "Nếu hôm nay cần ở một mình, người kia có thể hiểu nhầm rằng bạn giận họ.", "Nhắn ngắn gọn “Hôm nay mình mệt, mình muốn nghỉ. Mai mình gọi lại nhé.”", "Chọn giờ liên lạc lại vừa sức. Nếu cần thêm thời gian, nhắn một câu thay vì mất hút."],
    ["Chủ động hỏi thăm", "Nếu hôm nay không có cuộc hẹn hay tin nhắn nào, bạn vẫn có thể chọn người mình thật sự muốn hỏi thăm.", "Nhắn cho một người bạn quý một câu có chi tiết thật, như hỏi buổi khám hoặc buổi làm việc họ từng kể.", "Một lời hỏi thăm có giá trị dù họ chưa trả lời ngay. Đừng tự ép mình phải giữ cuộc nói chuyện kéo dài."],
  ],
  money: [
    ["Coi lại ba khoản nhỏ", "Cà phê, phí giao hàng và đồ ăn vặt nhìn riêng đều ít. Cộng lại mới thấy khoản nào lặp nhiều.", "Mở ba giao dịch gần nhất và chọn một khoản có thể giảm lần sau mà vẫn thấy thoải mái.", "Nhìn tổng chi theo tuần trước khi cắt các khoản thiết yếu chỉ vì một ngày chi nhiều."],
    ["Xem số tiền cuối cùng", "Giá trên quảng cáo có thể chưa gồm phí giao, phụ phí hoặc điều kiện để nhận khuyến mãi.", "Đi đến bước xem tổng tiền, rồi so với giá mua ở một nơi khác trước khi bấm đặt.", "Nếu phải mua thêm đồ chỉ để lấy mã giảm, tính lại xem tổng tiền có thật sự giảm không."],
    ["Kiểm tra ngày tự gia hạn", "Có dịch vụ dùng thử ít khi mở lại nhưng vẫn trừ tiền vào cùng một ngày mỗi tháng.", "Mở lịch sử thanh toán, tìm một khoản định kỳ và đặt nhắc trước ngày gia hạn nếu còn phân vân.", "Kiểm tra điều kiện hủy và ngày hết quyền dùng. Khoan hủy dịch vụ người nhà đang dùng chung."],
    ["Tách tiền cần chi trước", "Nếu vừa nhận tiền hoặc sắp đến hạn hóa đơn, số dư hiện tại dễ khiến bạn tưởng còn nhiều tiền tùy ý dùng.", "Ghi ba khoản phải trả trước kỳ thu tiếp theo, kèm ngày đến hạn, rồi xem còn lại bao nhiêu.", "Khoản tiền người khác hứa gửi chưa nên tính vào số có thể chi hôm nay."],
    ["Người quen nhờ chuyển tiền cũng nên gọi lại", "Tin nhắn mượn tiền gấp có thể trông rất quen, kể cả khi gửi từ tài khoản của người bạn biết.", "Gọi qua số bạn đã lưu từ trước để xác nhận người nhờ, số tiền và thông tin nhận.", "Đừng dùng số điện thoại hay đường dẫn mới họ vừa nhắn. Không đọc mã OTP cho người khác."],
    ["Chốt cách chia trước khi đặt", "Đi ăn, đặt phòng hay mua chung dễ ngại nhắc tiền, đến lúc trả mới biết mỗi người hiểu một kiểu.", "Nhắn trước khoản dự kiến mỗi người trả và ai đứng ra thanh toán, nhất là khi phải đặt cọc.", "Hỏi thêm phí hủy và cách chia nếu một người đổi kế hoạch."],
    ["Để món ngoài kế hoạch qua một đêm", "Một món đang giảm giá có thể trông rất cần trong vài phút, nhất là lúc bạn đang lướt để giải khuây.", "Lưu món đó lại và thử ghi bạn sẽ dùng nó vào việc gì trong tuần này. Mai đọc lại rồi quyết.", "Nếu món đồ chỉ rẻ khi mua ngay, coi đó là một điều kiện của người bán trước khi xuống tiền."],
    ["Xem lại khoản đang chờ hoàn", "Nếu từng hủy đơn, trả hàng hoặc ứng tiền hộ, có thể bạn đã quên kiểm tra tiền có về chưa.", "Chọn một khoản, đối chiếu hóa đơn với sao kê và ghi ngày cần liên hệ nếu quá hẹn.", "Khi gửi chứng từ, che số tài khoản và thông tin cá nhân không liên quan."],
    ["So chi phí theo lần dùng", "Gói lớn nhìn rẻ theo đơn vị, nhưng tiền tiết kiệm mất đi nếu bạn dùng không hết.", "Lấy số tiền chia cho số lần bạn thực sự dùng trong một tháng rồi so với lựa chọn nhỏ hơn.", "Để ý thời hạn sử dụng, chỗ cất và công phải bỏ ra để tận dụng món đó."],
    ["Có khoản bất ngờ thì xem thứ tự", "Nếu phát sinh tiền sửa đồ, tiền thuốc hoặc một hóa đơn cao hơn dự tính, bạn chưa cần quyết hết mọi khoản trong một lúc.", "Ghi khoản nào phải xử lý hôm nay, khoản nào có thể hỏi thêm giá hoặc xin dời hạn.", "Trước khi đồng ý trả góp, xem cả số tiền phải trả, các khoản phí và ngày bị trừ."],
  ],
};

const DAILY_COLORS = ["Xanh lá", "Vàng nhạt", "Xanh lam", "Tím nhạt", "Trắng ngà", "Hồng đất", "Xanh ngọc", "Nâu nhạt", "Cam đất", "Xanh rêu"];
export type QuanDaily = QuanContent & { topic: QuanTopic; day: string; caution: string; personalized: boolean; color: string; number: number; disclaimer: string };
export function drawDaily(topic: QuanTopic, chart: TuViChart | null, profileId: string, day: string): QuanDaily {
  if (!Object.hasOwn(DAILY, topic)) throw new Error("Chủ đề không hợp lệ.");
  const palaceName = { career: "Quan Lộc", love: "Phu Thê", money: "Tài Bạch" }[topic];
  const palace = chart?.palaces.find((item) => item.name === palaceName);
  let hash = 2166136261;
  for (const char of `${profileId}:${topic}:${palace?.branch ?? ""}:${palace?.mainStars.join(",") ?? ""}`) {
    hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  }
  const elapsedDays = Math.floor(Date.parse(`${day}T00:00:00Z`) / 86_400_000);
  if (!Number.isFinite(elapsedDays)) throw new Error("Ngày không hợp lệ.");
  const index = ((hash >>> 0) + elapsedDays) % DAILY[topic].length;
  const [title, body, action, caution] = DAILY[topic][index];
  return {
    id: `daily-v2-${topic}-${index}`, topic, day, title, body, action, caution,
    color: DAILY_COLORS[index], number: index + 1, personalized: Boolean(palace),
    evidence: palace ? [`Cung ${palace.name} tại ${palace.branch}, chính tinh: ${palace.mainStars.join(", ") || "vô chính diệu"}.`] : [],
    disclaimer: "Lời quẻ là gợi ý để bạn tự đối chiếu với ngày của mình.",
  };
}
// Original short readings: title | reflection | practical step. No translated deck guide is used.
const TAROT_ROWS = [
  "Kẻ Lữ Hành|Bước đầu chưa cần chứng minh rằng cả con đường sẽ đúng. Điều đáng giữ là sự tò mò đi cùng khả năng quay lại khi thấy không phù hợp.|Thử một bước nhỏ, ghi giới hạn thời gian và chi phí trước khi bắt đầu.",
  "Nhà Kiến Tạo|Bạn có thể đang chờ một nguồn lực hoàn hảo trong khi vài công cụ cần thiết đã ở trong tay. Năng lực chỉ rõ hơn khi được đưa vào việc cụ thể.|Chọn một kỹ năng sẵn có và dùng nó để hoàn thành một đầu việc.",
  "Người Giữ Tĩnh Lặng|Không phải khoảng im lặng nào cũng cần lấp đầy bằng lời giải. Điều bạn quan sát được và điều bạn đoán nên được đặt ở hai chỗ riêng.|Viết hai cột: điều đã biết và điều cần hỏi thêm.",
  "Người Nuôi Dưỡng|Một việc lớn cần nền sinh hoạt đủ bền để nâng đỡ. Chăm sóc không chỉ là cho thêm mà còn là biết chỗ nào đang cạn sức.|Sắp lại một bữa ăn, giờ nghỉ hoặc góc sống để bạn dễ phục hồi.",
  "Người Giữ Nền|Trật tự hữu ích là thứ giúp mọi người biết mình có thể dựa vào đâu. Khi quy tắc quá cứng, hãy nhớ mục đích ban đầu của nó.|Làm rõ một trách nhiệm và cách kiểm tra tiến độ mà không kiểm soát quá mức.",
  "Người Truyền Dạy|Một nếp cũ có thể chứa kinh nghiệm quý, nhưng bạn vẫn cần hiểu vì sao nó phù hợp. Học hỏi không đòi hỏi từ bỏ quyền đặt câu hỏi.|Hỏi người có kinh nghiệm về lý do phía sau một lời khuyên.",
  "Đôi Bạn Đồng Hành|Lựa chọn gắn bó cần cả thiện chí lẫn sự thống nhất về điều quan trọng. Chỉ cảm thấy gần nhau chưa đủ để thay cho một cuộc trao đổi rõ.|Nói về một giá trị hoặc giới hạn bạn muốn cùng giữ.",
  "Cỗ Xe|Tiến lên dễ hơn khi các phần việc cùng hướng về một đích. Sự quyết liệt thiếu điều phối có thể khiến bạn tốn sức để sửa hướng.|Chọn một đích gần và bỏ bớt một việc đang kéo bạn lệch hướng.",
  "Sức Mạnh Mềm|Bình tĩnh trước phản ứng mạnh là một dạng sức bền. Bạn có thể đứng vững mà không cần thắng bằng lời nói gay gắt.|Tạm dừng một nhịp trước câu trả lời khó và nói rõ nhu cầu của mình.",
  "Ngọn Đèn Riêng|Ở một mình có chủ đích giúp bạn nghe lại suy nghĩ của mình. Nhưng khoảng lặng chỉ có ích khi không biến thành cắt đứt mọi hỗ trợ.|Dành một khoảng không màn hình rồi ghi câu hỏi bạn muốn làm rõ.",
  "Bánh Xe|Hoàn cảnh đổi có thể làm kế hoạch cũ mất chỗ dựa. Phần bạn kiểm soát là cách chuẩn bị và phản hồi, không phải mọi biến chuyển.|Lập một phương án dự phòng cho việc đang phụ thuộc người khác.",
  "Cán Cân|Một quyết định công bằng cần nhìn cả hành động lẫn hậu quả. Điều đúng với mình cũng cần được diễn đạt bằng tiêu chuẩn nhất quán với người khác.|Kiểm tra dữ kiện và cam kết trước khi đưa ra kết luận.",
  "Góc Nhìn Đảo|Chưa hành động ngay đôi khi giúp nhận ra giả định đã giữ mình quá lâu. Tạm dừng nên có mục đích, không phải trì hoãn vô hạn.|Đặt thời điểm xem lại và thử mô tả vấn đề từ phía người kia.",
  "Khép Một Chặng|Có điều đã hoàn thành vai trò và cần được khép lại. Biểu tượng này nói về chuyển giai đoạn, không phải dự báo cái chết.|Bỏ một cam kết đã hết ý nghĩa và giữ lại điều bạn học được.",
  "Điều Hòa|Hai cách làm khác nhau có thể cùng tồn tại nếu bạn điều chỉnh nhịp phù hợp. Sự cân bằng thường cần thử lại nhiều lần hơn là một quyết định duy nhất.|Giảm một việc đang quá mức và thêm một việc bạn đã bỏ quên.",
  "Sợi Dây Ràng|Một thói quen có thể đem lại dễ chịu trước mắt nhưng lấy mất quyền lựa chọn về sau. Nhìn thẳng sự lệ thuộc là bước đầu lấy lại khoảng tự do.|Gọi tên một điều khó dừng và nhờ người tin cậy hỗ trợ nếu cần.",
  "Tòa Tháp|Khi một giả định không còn đứng vững, phản ứng đầu tiên có thể là cố giữ nguyên mọi thứ. Điều cần giữ trước là sự an toàn và thông tin rõ ràng.|Kiểm tra việc thiết yếu, hoãn quyết định nóng và tìm dữ kiện mới.",
  "Ngôi Sao|Hy vọng bền thường nằm trong dấu hiệu nhỏ của hồi phục. Bạn không cần phủ nhận khó khăn để cho phép mình tin vào một bước tiến.|Ghi một điều đang khá hơn và chăm nó bằng hành động nhỏ.",
  "Ánh Trăng|Thông tin mờ dễ làm nỗi lo trở thành câu chuyện có vẻ rất thật. Cảm xúc cần được lắng nghe, còn kết luận cần thêm bằng chứng.|Chưa kết luận thay người khác; hỏi rõ điều khiến bạn băn khoăn.",
  "Mặt Trời|Niềm vui rõ ràng giúp ta nhận ra điều đang nuôi sống mình. Chia sẻ thành quả cũng là dịp ghi nhận những người đã góp sức.|Ăn mừng một kết quả vừa sức và nói lời cảm ơn cụ thể.",
  "Tiếng Gọi Thức Tỉnh|Nhìn lại không phải để xét tội bản thân mà để chọn cách sống phù hợp hơn. Bạn có thể nhận trách nhiệm mà vẫn cho mình cơ hội sửa đổi.|Viết một điều muốn đổi và bước sửa đầu tiên có thể làm hôm nay.",
  "Vòng Tròn Trọn Vẹn|Một chặng hoàn tất cần được ghi nhận trước khi bạn lao vào mục tiêu mới. Kết thúc rõ giúp công sức cũ trở thành nền cho bước tiếp theo.|Tổng kết điều đã xong, bàn giao phần còn lại và dành một khoảng nghỉ.",
  "Át Gậy|Một ý tưởng đang có sức hút nhưng chưa cần biến thành lời hứa lớn. Hãy để nhiệt tình gặp một lần thử thực tế.|Viết ý tưởng thành một thử nghiệm làm được trong tuần.",
  "Hai Gậy|Bạn đang nhìn xa hơn phạm vi quen thuộc. Bản đồ hữu ích khi ghi cả nguồn lực và những điều chưa biết.|So sánh hai hướng bằng thời gian, chi phí và sự hỗ trợ hiện có.",
  "Ba Gậy|Sau bước chuẩn bị là lúc chờ phản hồi từ thế giới thật. Đừng chỉ đợi dấu hiệu thuận ý mà bỏ qua dữ kiện cần sửa.|Hỏi một người dùng hoặc cộng sự về kết quả thử đầu tiên.",
  "Bốn Gậy|Một nền làm việc an tâm được tạo bởi những thỏa thuận nhỏ giữ đều. Niềm vui chung giúp nhắc rằng thành quả không chỉ thuộc một người.|Tổ chức một cuộc gặp giản dị để ghi nhận công sức chung.",
  "Năm Gậy|Khác ý có thể đem lại góc nhìn tốt nếu mọi người cùng hiểu mục tiêu. Tranh hơn thua dễ làm mất điều đáng bàn.|Thống nhất tiêu chí trước khi tranh luận cách làm.",
  "Sáu Gậy|Được công nhận là dịp nhìn lại điều thực sự có ích. Đừng để tiếng khen buộc bạn phải duy trì hình ảnh không thể mệt mỏi.|Ghi nhận người hỗ trợ và nói rõ giới hạn cho bước tiếp theo.",
  "Bảy Gậy|Giữ quan điểm cần phân biệt điều cốt lõi với chuyện có thể nhường. Bảo vệ mọi chi tiết sẽ làm bạn nhanh cạn sức.|Chọn một giới hạn quan trọng và giải thích bằng lý do cụ thể.",
  "Tám Gậy|Nhiều tin đến nhanh có thể tạo cảm giác phải đáp lại ngay. Tốc độ chỉ hữu ích khi người nhận hiểu đúng việc cần làm.|Xác nhận người phụ trách và hạn chót trong một tin nhắn ngắn.",
  "Chín Gậy|Sự dè chừng có lý do khi bạn từng gặp khó. Tuy vậy, kinh nghiệm cũ không nhất thiết mô tả đúng người và việc đang ở trước mặt.|Kiểm tra rủi ro hiện tại thay vì tự động phòng thủ với tất cả.",
  "Mười Gậy|Gánh quá nhiều dễ khiến cả việc yêu thích trở thành nặng nhọc. Chia tải là cách bảo vệ lời hứa chứ không làm giảm trách nhiệm.|Giao lại hoặc bỏ một việc không nhất thiết phải do bạn làm.",
  "Người Học Gậy|Ham khám phá giúp mở đường, còn tính đều đặn giúp đi tiếp. Một câu hỏi hay đáng giá hơn việc tỏ ra đã biết.|Hỏi một điều cơ bản và thử áp dụng ngay vào việc nhỏ.",
  "Kỵ Sĩ Gậy|Hăng hái có thể tạo bước tiến nhưng cũng khiến bạn bỏ qua hậu cần. Kiểm tra đường về giúp chuyến đi bớt tốn kém.|Xem lại thời gian, phương tiện và cam kết trước khi nhận lời.",
  "Nữ Chủ Gậy|Sự tự tin có sức lan khi để người khác cũng có chỗ thể hiện. Bạn không phải chiếm mọi khoảng sáng để giữ vai trò của mình.|Mời một người ít lên tiếng chia sẻ ý tưởng và nghe đến cùng.",
  "Vua Gậy|Tầm nhìn cần đi cùng trách nhiệm với người thực hiện. Nêu rõ hướng đi rồi cho họ khoảng chủ động sẽ tạo sức bền hơn thúc ép.|Nói rõ mục tiêu và thống nhất quyền quyết định của từng người.",
  "Át Cốc|Một cảm xúc mới xứng đáng được đón nhận trước khi bị gọi tên quá sớm. Sự mở lòng vẫn cần sự đồng thuận và an toàn.|Chia sẻ một cảm nhận chân thành mà không yêu cầu đáp lại ngay.",
  "Hai Cốc|Sự tương hỗ được nhìn thấy trong việc cả hai có thể nói và nghe. Gần gũi không có nghĩa là luôn muốn cùng một điều.|Hỏi người kia mong gì ở cuộc gặp và nói mong muốn của mình.",
  "Ba Cốc|Bạn bè có thể đem lại cảm giác được thuộc về trong ngày thường. Cuộc vui vừa sức tốt hơn nghĩa vụ phải luôn hòa đồng.|Rủ một người bạn gặp ngắn hoặc gửi lời hỏi thăm thật lòng.",
  "Bốn Cốc|Khi mệt, mọi lời mời đều có thể trông nhạt nhòa. Bạn có thể cần nghỉ trước khi biết mình thật sự không muốn điều gì.|Nghỉ một khoảng rồi xem lại một lựa chọn với tâm trí nhẹ hơn.",
  "Năm Cốc|Thất vọng cần được nhìn nhận mà không phủ kín mọi điều còn lại. Điều mất và điều còn có thể cùng là sự thật.|Viết điều khiến bạn buồn và một nguồn hỗ trợ vẫn còn bên cạnh.",
  "Sáu Cốc|Ký ức có thể nhắc bạn về sự ấm áp từng có. Hãy mang phẩm chất ấy về hiện tại thay vì buộc hôm nay giống hệt ngày cũ.|Làm lại một việc giản dị từng đem đến sự gần gũi.",
  "Bảy Cốc|Nhiều khả năng hấp dẫn dễ làm việc chọn lựa kéo dài. Một hình ảnh đẹp chưa nói lên công sức cần bỏ ra để đạt nó.|Chọn hai phương án và tìm một dữ kiện thực tế cho mỗi phương án.",
  "Tám Cốc|Rời một điều quen thuộc có thể đến từ việc nhu cầu đã đổi. Trước khi đi, hãy phân biệt sự mệt nhất thời với sự không còn phù hợp.|Nói rõ điều còn thiếu và xem có cách điều chỉnh trước khi khép lại.",
  "Chín Cốc|Biết đủ giúp niềm vui không luôn phải chờ một thành tựu khác. Điều làm bạn hài lòng nên xuất phát từ nhu cầu thật của mình.|Ghi ba điều đang đủ và chọn tận hưởng một điều không tốn thêm.",
  "Mười Cốc|Hạnh phúc chung không đòi một gia đình hay nhóm bạn hoàn hảo. Nó cần cách mọi người trở về trò chuyện sau bất đồng.|Tạo một thói quen chung nhỏ mà ai cũng có thể tham gia.",
  "Người Học Cốc|Một ý nghĩ mềm mại có thể mở cuộc đối thoại đang bị khô cứng. Tò mò về cảm xúc tốt hơn đoán hộ cảm xúc của người khác.|Hỏi hôm nay điều gì khiến người kia vui hoặc mệt.",
  "Kỵ Sĩ Cốc|Một lời mời đẹp cần đi cùng khả năng thực hiện. Sự lãng mạn có ích khi không che khuất những điều hai bên chưa thống nhất.|Đưa ra lời hẹn cụ thể và tôn trọng quyền từ chối.",
  "Nữ Chủ Cốc|Thấu cảm không có nghĩa là hấp thụ mọi nỗi buồn của người khác. Bạn có thể hiện diện và vẫn giữ phần nghỉ cho mình.|Hỏi người kia cần được nghe hay cần cùng tìm giải pháp.",
  "Vua Cốc|Giữ bình tĩnh giúp cảm xúc có chỗ được nói mà không làm tổn thương. Không cần giấu buồn để thể hiện mình vững vàng.|Gọi đúng cảm xúc và chọn một cách nói không đổ lỗi.",
  "Át Kiếm|Sự rõ ràng bắt đầu từ một câu hỏi đúng. Một kết luận sắc sảo chỉ có ích khi dữ kiện nâng đỡ được nó.|Viết vấn đề thành một câu và kiểm tra giả định lớn nhất.",
  "Hai Kiếm|Tạm chưa chọn có thể giúp giữ bình tĩnh nhưng không làm mâu thuẫn tự hết. Bạn cần biết thông tin nào thực sự còn thiếu.|Đặt hạn quyết định và hỏi bổ sung đúng một dữ kiện quan trọng.",
  "Ba Kiếm|Một lời nói hay sự thật đau lòng cần thời gian để tiêu hóa. Bạn không phải biến nỗi đau thành bài học ngay lập tức.|Tìm người an toàn để kể và tránh trả lời trong lúc quá kích động.",
  "Bốn Kiếm|Dừng nghỉ có chủ đích giúp bạn trở lại với sức tập trung tốt hơn. Nghỉ không phải phần thưởng chỉ được nhận khi mọi việc đã xong.|Đặt một khoảng nghỉ không thông báo và báo trước nếu cần.",
  "Năm Kiếm|Thắng một cuộc cãi có thể vẫn để lại mối quan hệ tổn thương. Trước câu trả lời tiếp theo, hãy hỏi kết quả nào đáng giữ lâu hơn.|Ngừng lời công kích và đề nghị quay lại vấn đề cụ thể.",
  "Sáu Kiếm|Chuyển sang hoàn cảnh dễ chịu hơn thường diễn ra từng bước. Bạn có thể mang theo kinh nghiệm mà không phải mang mọi gánh nặng cũ.|Chuẩn bị một bước chuyển cùng người có thể hỗ trợ thực tế.",
  "Bảy Kiếm|Giữ kín kế hoạch không đồng nghĩa với được phép làm người khác hiểu sai. Sự thận trọng cần đi cùng trách nhiệm và minh bạch đúng chỗ.|Kiểm tra điều cần bảo mật và điều người liên quan có quyền biết.",
  "Tám Kiếm|Cảm giác không còn lựa chọn đôi khi mạnh hơn giới hạn thực tế. Một người ngoài cuộc có thể giúp nhìn ra khoảng có thể hành động.|Liệt kê điều có thể đổi hôm nay và hỏi ý kiến người tin cậy.",
  "Chín Kiếm|Lo âu thường lớn hơn khi ta phải tự xoay xở vào đêm khuya. Suy nghĩ lặp lại chưa phải bằng chứng rằng điều xấu sẽ xảy ra.|Ghi nỗi lo để xem lại ban ngày; tìm hỗ trợ chuyên môn nếu kéo dài.",
  "Mười Kiếm|Một chặng mệt mỏi đã đến giới hạn cần được thừa nhận. Biểu tượng kết thúc không dự báo tai họa; nó nhắc bạn thôi ép mình chịu thêm.|Dừng phần việc đang quá sức và nhờ hỗ trợ cho nhu cầu thiết yếu.",
  "Người Học Kiếm|Tinh thần hỏi lại giúp tránh lan truyền điều chưa rõ. Nhưng liên tục nghi ngờ mà không kiểm tra cũng làm mọi người mệt.|Tìm nguồn gốc một thông tin trước khi chia sẻ tiếp.",
  "Kỵ Sĩ Kiếm|Phản hồi nhanh có thể bảo vệ điều đúng nhưng cũng bỏ sót bối cảnh. Sự thẳng thắn cần được dẫn đường bằng kiểm chứng.|Đọc lại toàn bộ trao đổi trước khi gửi câu trả lời mạnh.",
  "Nữ Chủ Kiếm|Nói rõ giới hạn giúp giảm hiểu lầm kéo dài. Bạn có thể dứt khoát mà không phủ nhận phẩm giá của người đối diện.|Nói điều bạn đồng ý, điều không đồng ý và lý do ngắn gọn.",
  "Vua Kiếm|Quyết định cần lý lẽ có thể giải thích cho người chịu tác động. Vị trí có thẩm quyền càng cần nghe thông tin trái ý.|Viết tiêu chí quyết định và mời một người chỉ ra điểm còn thiếu.",
  "Át Đồng|Một cơ hội thực tế cần được chăm bằng lịch làm và nguồn lực cụ thể. Hứa hẹn ban đầu chưa phải kết quả đã có.|Xác định bước đầu, người phụ trách và khoản chi tối đa.",
  "Hai Đồng|Cân hai trách nhiệm không nhất thiết là dành đều thời gian cho cả hai. Nhịp phù hợp cần dựa vào hạn chót và sức bạn có.|Xếp việc theo mức cấp thiết rồi chừa một khoảng đệm.",
  "Ba Đồng|Tay nghề phát triển tốt khi phản hồi đến từ người cùng làm thật. Hợp tác cần phân vai để đóng góp không bị chìm đi.|Thống nhất ai làm gì và xin phản hồi về một phần đã hoàn thành.",
  "Bốn Đồng|Giữ nguồn lực đem lại an tâm nhưng nắm quá chặt có thể khiến nhu cầu thiết yếu bị bỏ qua. Cần phân biệt tiết kiệm với sợ hãi.|Chia khoản giữ lại và khoản được phép dùng theo thực tế.",
  "Năm Đồng|Thiếu thốn dễ khiến ta ngại tìm giúp đỡ. Nhu cầu hỗ trợ không làm giảm giá trị của bạn và không cần được giải quyết một mình.|Liên hệ một người hoặc dịch vụ hỗ trợ đáng tin cho nhu cầu trước mắt.",
  "Sáu Đồng|Cho và nhận cần tôn trọng quyền tự quyết của người được giúp. Sự hỗ trợ phù hợp không tạo một món nợ tình cảm không nói ra.|Hỏi cần gì trước khi giúp và nêu rõ giới hạn bạn có thể hỗ trợ.",
  "Bảy Đồng|Kết quả chậm cần được xem bằng tiến độ thật thay vì cảm giác sốt ruột. Kiên nhẫn không bắt buộc phải tiếp tục một việc không còn phù hợp.|So sánh công sức bỏ ra với một dấu hiệu tiến bộ có thể kiểm tra.",
  "Tám Đồng|Sự khéo léo lớn lên qua các lần làm tập trung và sửa đúng lỗi. Làm nhiều hơn chưa chắc tốt hơn khi phản hồi không rõ.|Chọn một kỹ năng, luyện ngắn và ghi lỗi cần sửa lần sau.",
  "Chín Đồng|Tự chủ được xây từ những lựa chọn phù hợp khả năng, không phải hình ảnh đủ đầy trước mắt người khác. Bạn được hưởng điều mình đã vun đắp.|Ghi nhận một năng lực tự chăm lo và dùng nó vừa sức.",
  "Mười Đồng|Nguồn lực chung bền hơn khi mọi người hiểu trách nhiệm và quyền lợi. Chuyện gia đình vẫn cần sự rõ ràng về giấy tờ và mong muốn.|Trao đổi một kế hoạch dài hạn và lưu thông tin ở nơi người cần có thể tìm.",
  "Người Học Đồng|Một mục tiêu thực tế bắt đầu bằng việc sẵn lòng làm điều căn bản. Tiến bộ nhỏ có thể đo được giúp bạn duy trì việc học.|Chọn bài tập đầu tiên và hẹn thời gian xem lại trong tuần.",
  "Kỵ Sĩ Đồng|Đều đặn đem lại độ tin cậy khi mỗi bước đều được kiểm tra. Tuy nhiên, lịch cũ cần đổi nếu sức khỏe hoặc hoàn cảnh đã khác.|Làm việc ưu tiên theo nhịp vừa sức và cập nhật lại lịch khi cần.",
  "Nữ Chủ Đồng|Chăm lo thực tế thường nằm ở những chi tiết ít ai thấy. Người chăm sóc cũng cần phần tiện nghi và nguồn lực riêng.|Giảm một việc nhà hoặc nhờ chia sẻ để có thời gian nghỉ.",
  "Vua Đồng|Quản lý nguồn lực cần nhìn cả tính bền vững và người phụ thuộc vào quyết định. Kết quả trước mắt chưa đủ để đánh giá một kế hoạch dài.|Kiểm tra chi phí duy trì và phương án khi nguồn thu giảm.",
] as const;

export const QUAN_TAROT_CARDS: readonly QuanContent[] = TAROT_ROWS.map((row, index) => {
  const [title, body, action] = row.split("|");
  return { id: `tarot-${index}`, title, body, action, evidence: [index < 22 ? "Ẩn chính" : ["Bộ Gậy", "Bộ Cốc", "Bộ Kiếm", "Bộ Đồng"][Math.floor((index - 22) / 14)], "Nội dung chiêm nghiệm biên soạn riêng cho Tử Vi Quán."] };
});
export type QuanTarot = QuanContent & { cards: (QuanContent & { position: string })[]; disclaimer: string };
export function drawTarot(count: 1 | 3, randomInt: QuanRandomInt): QuanTarot {
  if (count !== 1 && count !== 3) throw new Error("Chỉ rút một hoặc ba lá.");
  const deck = [...QUAN_TAROT_CARDS];
  const cards = Array.from({ length: count }, (_, index) => ({ ...deck.splice(pick(randomInt, deck.length), 1)[0], position: count === 1 ? "Lời nhắc hôm nay" : ["Điều đang mang theo", "Điều cần nhìn rõ", "Bước có thể thử"][index] }));
  return { id: `tarot-${cards.map((card) => card.id.replace("tarot-", "")).join("-")}`, title: count === 1 ? "Một lá để chiêm nghiệm" : "Ba góc nhìn cho câu hỏi", body: cards.map((card) => `${card.position}: ${card.body}`).join("\n\n"), action: cards[cards.length - 1].action, evidence: [], cards, disclaimer: DISCLAIMER };
}

const TRIGRAMS = ["Khôn", "Chấn", "Khảm", "Đoài", "Cấn", "Ly", "Tốn", "Càn"];
// King Wen numbers. Rows are upper trigrams, columns are lower trigrams.
const KING_WEN = [
  [2, 24, 7, 19, 15, 36, 46, 11],
  [16, 51, 40, 54, 62, 55, 32, 34],
  [8, 3, 29, 60, 39, 63, 48, 5],
  [45, 17, 47, 58, 31, 49, 28, 43],
  [23, 27, 4, 41, 52, 22, 18, 26],
  [35, 21, 64, 38, 56, 30, 50, 14],
  [20, 42, 59, 61, 53, 37, 57, 9],
  [12, 25, 6, 10, 33, 13, 44, 1],
];

const HEXAGRAM_ROWS = [
  "Thuần Càn|Sức khởi đầu cần một hướng đủ rõ để không biến thành cố sức ở mọi việc.|Chọn một mục tiêu mà bạn có thể tự chịu trách nhiệm.",
  "Thuần Khôn|Tiếp nhận tốt là biết nâng đỡ điều đang lớn lên mà không giành phần quyết định của người khác.|Hỏi người đang làm việc chính xem họ cần bạn hỗ trợ ở đâu.",
  "Thủy Lôi Truân|Khởi sự có thể rối vì việc nền chưa xong và vai trò còn mờ.|Gỡ một nút thắt trước khi mở thêm đầu việc.",
  "Sơn Thủy Mông|Chỗ chưa biết là nơi nên học, không phải nơi cần giấu bằng lời đoán.|Mang một câu hỏi cụ thể đến người đã từng làm việc này.",
  "Thủy Thiên Nhu|Đợi điều kiện chín có ích khi bạn biết chuẩn bị gì trong lúc chờ.|Đặt một dấu hiệu để biết khi nào đủ điều kiện bắt đầu.",
  "Thiên Thủy Tụng|Tranh chấp dễ kéo dài khi mỗi bên dùng một cách hiểu khác nhau về lời hứa.|Đối chiếu thỏa thuận ban đầu và tìm người trung lập nếu cần.",
  "Địa Thủy Sư|Một nhóm vượt việc khó nhờ phân vai và nhịp phối hợp rõ ràng.|Chỉ định người giữ tiến độ và thống nhất cách báo khó khăn.",
  "Thủy Địa Tỷ|Gần nhau có ích khi sự gắn bó đi cùng tin cậy và trách nhiệm hai chiều.|Kiểm tra cả hai bên có đang giữ cam kết đã nói hay không.",
  "Phong Thiên Tiểu Súc|Những bước tích lũy nhỏ vẫn có giá trị khi chưa thể xoay chuyển cả tình thế.|Tích thêm một nguồn lực dùng được cho bước kế tiếp.",
  "Thiên Trạch Lý|Khi đi vào nơi có nhiều quy tắc, ý tốt cần đi cùng sự thận trọng.|Hỏi trước về giới hạn và phép lịch sự của nơi bạn sắp đến.",
  "Địa Thiên Thái|Khi các phần việc thông nhau, thuận lợi nên được dùng để củng cố quan hệ.|Tháo một điểm bàn giao đang cản dòng thông tin.",
  "Thiên Địa Bĩ|Khi đối thoại tắc, ép đồng thuận có thể làm hai phía càng xa.|Giữ việc thiết yếu và mở một kênh trao đổi nhỏ, rõ chủ đề.",
  "Thiên Hỏa Đồng Nhân|Cùng làm được việc khi mục đích chung rộng hơn lợi ích của một nhóm thân quen.|Mời người bị bỏ sót tham gia bàn về mục tiêu chung.",
  "Hỏa Thiên Đại Hữu|Nguồn lực nhiều đem thêm lựa chọn và thêm nghĩa vụ trông nom.|Xem một nguồn lực dư có thể dùng để củng cố phần nền nào.",
  "Địa Sơn Khiêm|Khiêm nhường giúp người khác góp ý mà không buộc bạn phủ nhận công sức của mình.|Nêu đúng phần đã làm tốt và phần bạn muốn học thêm.",
  "Lôi Địa Dự|Hứng khởi có thể gom người cùng làm, nhưng sẽ nguội nếu chưa có việc cụ thể.|Chuyển lời cổ vũ thành một lịch làm chung vừa sức.",
  "Trạch Lôi Tùy|Biết theo nhịp chung giúp phối hợp tốt, miễn bạn hiểu mình đang đồng ý điều gì.|Hỏi mục đích của thay đổi trước khi chọn hưởng ứng.",
  "Sơn Phong Cổ|Một lỗi lặp lại thường cần sửa cách vận hành đã tạo ra nó.|Tìm bước đầu tiên khiến lỗi cũ có thể tái diễn và sửa bước đó.",
  "Địa Trạch Lâm|Khi lại gần để hỗ trợ, người có trách nhiệm cần thấy việc thật ở tuyến đầu.|Hỏi trực tiếp người chịu tác động thay vì chỉ đọc báo cáo.",
  "Phong Địa Quan|Quan sát từ nhiều vị trí giúp thấy điều mà góc nhìn quen thuộc đã bỏ qua.|Dành một lượt nhìn toàn cảnh trước khi đưa ra nhận xét.",
  "Hỏa Lôi Phệ Hạp|Một điểm nghẽn cần được xử lý dứt khoát bằng nguyên tắc rõ ràng.|Xác minh chuyện đã xảy ra và áp dụng một quy tắc nhất quán.",
  "Sơn Hỏa Bí|Cách trình bày có thể làm nội dung dễ hiểu, nhưng hình thức không bù được phần thiếu.|Sửa phần thông tin cốt lõi trước khi trang trí.",
  "Sơn Địa Bác|Khi nền đã mòn, vá thêm bề mặt chỉ kéo dài công việc.|Giữ phần thiết yếu và bỏ một lớp thủ tục không còn tác dụng.",
  "Địa Lôi Phục|Sự trở lại thường bắt đầu bằng một tín hiệu nhỏ có thể nuôi đều.|Làm lại một thói quen có ích ở mức dễ duy trì nhất.",
  "Thiên Lôi Vô Vọng|Hành động ngay thẳng giúp bạn bớt phải xoay xở để giữ một câu chuyện đã dựng.|Nói đúng điều mình biết và nêu rõ phần còn chưa chắc.",
  "Sơn Thiên Đại Súc|Tích lũy lớn cần lúc giữ sức và rèn khả năng dùng nó đúng chỗ.|Chọn một kỹ năng làm nền và luyện đều trước thử thách lớn.",
  "Sơn Lôi Di|Điều bạn ăn, nghe và nói mỗi ngày đều góp phần nuôi dưỡng mình.|Thay một nguồn tiêu hao chú ý bằng một thói quen có ích.",
  "Trạch Phong Đại Quá|Khi sức nặng vượt quá khả năng chống đỡ, cố giữ mọi phần sẽ làm nền yếu thêm.|Giảm tải ở phần chịu lực nhiều nhất và tìm người chia việc.",
  "Thuần Khảm|Gặp khó lặp lại cần cách qua an toàn và có thể dùng nhiều lần.|Ghi quy trình xử lý sự cố và nhờ một người kiểm tra.",
  "Thuần Ly|Điều sáng rõ cần có chỗ nương như ngọn đèn cần nguồn sáng.|Tìm dữ kiện đáng tin để nâng đỡ điều bạn muốn nói.",
  "Trạch Sơn Hàm|Ảnh hưởng hai chiều bắt đầu khi bạn để ý phản hồi và tôn trọng khoảng cách.|Hỏi người đối diện họ cảm nhận thế nào thay vì đoán.",
  "Lôi Phong Hằng|Bền lâu đến từ việc lặp lại điều hữu ích ở nhịp chịu được.|Đặt một lịch làm đủ nhẹ để giữ cả tuần bận.",
  "Thiên Sơn Độn|Rút khỏi nơi xung đột có thể giữ sức cho việc quan trọng hơn.|Thoát một cuộc tranh luận đang lặp lại và hẹn lúc trao đổi có ích.",
  "Lôi Thiên Đại Tráng|Có sức tiến mạnh càng cần biết đâu là giới hạn của người khác.|Xin sự đồng thuận trước khi đẩy nhanh một quyết định chung.",
  "Hỏa Địa Tấn|Khi kết quả hiện rõ, tiến thêm bằng cách làm cho đóng góp dễ được kiểm chứng.|Đưa một ví dụ cụ thể về việc bạn đã hoàn thành.",
  "Địa Hỏa Minh Di|Ở môi trường khó nói hết, bảo vệ điều quan trọng có thể cần chọn đúng người và đúng lúc.|Chia sẻ thông tin nhạy cảm trong một cuộc nói chuyện riêng an toàn.",
  "Phong Hỏa Gia Nhân|Nếp nhà bền khi việc chăm sóc và trách nhiệm được nói ra rõ ràng.|Chia lại một việc nhà đang dồn vào một người.",
  "Hỏa Trạch Khuê|Khác biệt có thể giữ nguyên trong khi hai bên vẫn hợp tác ở phần giao nhau.|Tìm một điều nhỏ cùng đồng ý rồi làm thử.",
  "Thủy Sơn Kiển|Đường thẳng bị chặn không có nghĩa là không còn lối tiếp cận khác.|Tìm người có kinh nghiệm và hỏi về một đường vòng khả thi.",
  "Lôi Thủy Giải|Khi nút thắt đã lỏng, việc còn lại là tháo phần vướng và giảm gánh cũ.|Khép một việc tồn đọng vừa được mở đường giải quyết.",
  "Sơn Trạch Tổn|Bớt một phần có thể giúp giữ tổng thể nếu bạn biết cái gì cần bảo vệ trước.|Cắt một khoản hoặc việc ít giá trị để giữ nhu cầu thiết yếu.",
  "Phong Lôi Ích|Lợi ích tăng khi nguồn lực đến đúng chỗ có thể dùng nó.|Chuyển một phần thời gian hoặc công cụ cho người đang cần.",
  "Trạch Thiên Quải|Việc cần nói rõ có thể được nói công khai mà vẫn dựa trên bằng chứng và giữ phẩm giá.|Nêu vấn đề cùng cách sửa, tránh công kích cá nhân.",
  "Thiên Phong Cấu|Một cuộc gặp bất ngờ có thể mở lựa chọn nhưng chưa đủ để đặt niềm tin lớn.|Tìm hiểu cam kết thực tế trước khi nhận lời dài hạn.",
  "Trạch Địa Tụy|Tập hợp được nhiều người cần một mục đích chung và cách chia việc rõ.|Viết mục đích cuộc gặp và quyết định cần chốt ngay từ đầu.",
  "Địa Phong Thăng|Đi lên đều có thể bắt đầu từ một việc nhỏ được làm chắc.|Chọn một nấc vừa sức rồi xin phản hồi trước nấc tiếp theo.",
  "Trạch Thủy Khốn|Khi nguồn lực cạn, lời nói dài khó thay được hỗ trợ thiết thực.|Xác định nhu cầu trước mắt và xin giúp ở đúng phần.",
  "Thủy Phong Tỉnh|Một nguồn chung chỉ hữu ích lâu dài khi có người bảo dưỡng và mọi người tiếp cận được.|Sửa một công cụ dùng chung và ghi cách dùng ở nơi dễ thấy.",
  "Trạch Hỏa Cách|Thay đổi lớn dễ được tiếp nhận hơn khi lý do và thời điểm rõ ràng.|Giải thích điều đang không còn phù hợp và thử thay từng phần.",
  "Hỏa Phong Đỉnh|Điều thô có thể thành nguồn nuôi dưỡng khi được chế biến và trao đúng cách.|Biến một kinh nghiệm khó thành hướng dẫn cụ thể cho người sau.",
  "Thuần Chấn|Bất ngờ dễ kéo theo phản ứng vội. Một khoảng lấy lại bình tĩnh giúp chọn việc cần làm trước.|Kiểm tra an toàn và thông tin chính trước khi hành động.",
  "Thuần Cấn|Biết dừng giúp nhìn rõ điểm giới hạn của sức và của tình thế.|Chọn một thời điểm dừng rõ ràng cho việc đang kéo dài.",
  "Phong Sơn Tiệm|Thay đổi từ từ giúp những phần liên quan có thời gian thích nghi.|Chia mục tiêu thành các bước có thể xác nhận lần lượt.",
  "Lôi Trạch Quy Muội|Vai trò chưa cân xứng dễ làm một bên nhận nhiều nghĩa vụ hơn quyền quyết định.|Hỏi rõ quyền lựa chọn và điều kiện rút trước khi đồng ý.",
  "Lôi Hỏa Phong|Khi công việc đang ở lúc đầy nhất, cần dành sức để xử lý điều sẽ đổi sau đó.|Ghi lại quy trình và chuẩn bị cho lúc nguồn lực giảm.",
  "Hỏa Sơn Lữ|Ở nơi lạ, quan sát nếp sinh hoạt giúp bạn chọn cách ứng xử phù hợp.|Hỏi một người địa phương về quy tắc và phương án an toàn.",
  "Thuần Tốn|Tác động nhẹ nhưng lặp lại có thể tới nơi mệnh lệnh mạnh không tới được.|Gửi một lời góp ý riêng, cụ thể và có thể thực hiện.",
  "Thuần Đoài|Niềm vui trò chuyện sâu hơn khi mỗi người có thể nói thật và được nghe.|Tạo một cuộc gặp mà mọi người có lượt nói như nhau.",
  "Phong Thủy Hoán|Căng thẳng tích tụ có thể dịu đi khi các nhóm thôi giữ kín mục đích của mình.|Đưa hai phía về một nhu cầu chung có thể gọi tên.",
  "Thủy Trạch Tiết|Giới hạn hữu ích khi vừa đủ rõ để giữ nguồn lực và vừa đủ mềm để áp dụng.|Đặt một mức chi hoặc thời gian có thể tuân thủ thực tế.",
  "Phong Trạch Trung Phu|Tin cậy đi lên khi lời nói và hành động được thấy là nhất quán.|Thực hiện một lời hứa nhỏ và báo sớm nếu phải thay đổi.",
  "Lôi Sơn Tiểu Quá|Lúc việc lớn chưa chắc, để ý chi tiết nhỏ có thể tránh được tổn thất không cần thiết.|Kiểm tra phần nhỏ dễ sai trước khi mở rộng.",
  "Thủy Hỏa Ký Tế|Xong một việc lớn vẫn cần trông nom phần vận hành sau bàn giao.|Kiểm tra bước cuối, người giữ việc và cách xử lý khi trục trặc.",
  "Hỏa Thủy Vị Tế|Chặng gần xong dễ làm bạn bỏ qua bước khó cuối cùng. Nên giữ nhịp đến khi thật sự hoàn tất.|Xác nhận điều kiện hoàn thành trước khi tuyên bố đã xong.",
];

export type QuanHexagram = { number: number; title: string; body: string; action: string; lower: string; upper: string };
type CoinLine = 6 | 7 | 8 | 9;
export type QuanIChing = QuanContent & { lines: CoinLine[]; casts: number[][]; changingLines: number[]; primary: QuanHexagram; changed: QuanHexagram | null; disclaimer: string };

function hexagram(mask: number): QuanHexagram {
  const lower = mask & 7;
  const upper = mask >> 3;
  const number = KING_WEN[upper][lower];
  const [title, body, action] = HEXAGRAM_ROWS[number - 1].split("|");
  return { number, title, body, action, lower: TRIGRAMS[lower], upper: TRIGRAMS[upper] };
}

export function drawIChing(randomInt: QuanRandomInt): QuanIChing {
  const lines: CoinLine[] = [];
  const casts: number[][] = [];
  const changingLines: number[] = [];
  let primaryMask = 0;
  let changeMask = 0;
  // The first toss is the bottom line. Each line sums three independent coins (2 or 3).
  for (let index = 0; index < 6; index++) {
    const coins = Array.from({ length: 3 }, () => 2 + pick(randomInt, 2));
    casts.push(coins);
    const line = coins.reduce((sum, coin) => sum + coin, 0) as CoinLine;
    lines.push(line);
    primaryMask |= (line % 2) << index;
    if (line === 6 || line === 9) {
      changingLines.push(index + 1);
      changeMask |= 1 << index;
    }
  }
  const primary = hexagram(primaryMask);
  const changed = changeMask ? hexagram(primaryMask ^ changeMask) : null;
  return {
    id: `iching-${lines.join("")}`, title: primary.title, body: primary.body, action: primary.action,
    lines, casts, changingLines, primary, changed, disclaimer: DISCLAIMER,
    evidence: [`Hạ quái ${primary.lower}, thượng quái ${primary.upper}.`, changed ? `Hào động ${changingLines.join(", ")}. Quẻ biến ${changed.title}.` : "Không có hào động."],
  };
}

export type QuanCosmetic = {
  id: string;
  title: string;
  description: string;
  price: 0 | 60 | 120 | 300 | 600;
  slot: "robe" | "lantern" | "table" | "cardBack" | "aura" | "altar";
  value: string;
  unlockAt?: number;
};

export const QUAN_COSMETICS: readonly QuanCosmetic[] = [
  { id: "robe-jade", title: "Áo xanh ngọc", description: "Áo màu xanh của lá non.", price: 60, slot: "robe", value: "#6c9778" },
  { id: "robe-plum", title: "Áo tím mận", description: "Áo tím trầm dùng trong sân quán.", price: 120, slot: "robe", value: "#855f88" },
  { id: "robe-gold", title: "Áo vàng tơ", description: "Áo vàng ấm như tơ nhuộm.", price: 600, slot: "robe", value: "#c5a365" },
  { id: "lantern-amber", title: "Đèn hổ phách", description: "Ánh đèn vàng ấm.", price: 60, slot: "lantern", value: "#ffc56e" },
  { id: "lantern-lotus", title: "Đèn hồng sen", description: "Ánh hồng dịu như cánh sen.", price: 120, slot: "lantern", value: "#eca5b5" },
  { id: "table-walnut", title: "Bàn gỗ nâu", description: "Màu gỗ trầm cho bàn riêng.", price: 60, slot: "table", value: "#694938" },
  { id: "table-jade", title: "Bàn xanh ngọc", description: "Mặt bàn màu xanh ngọc dịu.", price: 300, slot: "table", value: "#598374" },
  { id: "card-indigo", title: "Lưng bài chàm", description: "Mặt lưng bài Tarot màu chàm.", price: 120, slot: "cardBack", value: "#394f80" },
  { id: "card-sun", title: "Lưng bài nắng", description: "Mặt lưng bài Tarot màu vàng mật.", price: 300, slot: "cardBack", value: "#c39749" },
  { id: "aura-mist", title: "Vầng sương", description: "Quầng sáng màu sương sớm.", price: 120, slot: "aura", value: "#b7c9c4" },
  { id: "aura-lotus", title: "Vầng sen", description: "Quầng sáng hồng nhẹ.", price: 300, slot: "aura", value: "#e8acbc" },
  { id: "aura-gold", title: "Vầng nắng", description: "Quầng sáng vàng quanh khách.", price: 600, slot: "aura", value: "#e7c780" },
  { id: "altar-lacquer", title: "Bàn thờ sơn son", description: "Sắc đỏ son cho bàn thờ Thần Tài trong sân của bạn.", price: 0, unlockAt: 100, slot: "altar", value: "#a33d31" },
  { id: "table-night", title: "Bàn luận đêm sao", description: "Mặt bàn xanh sẫm ở bàn thầy và góc riêng.", price: 0, unlockAt: 300, slot: "table", value: "#354e67" },
  { id: "card-constellation", title: "Bộ bài Trời Sao", description: "Mặt lưng xanh tím dành riêng cho bộ Tarot tại bàn.", price: 0, unlockAt: 700, slot: "cardBack", value: "#4b4d91" },
];

export { moderateWish } from "./tu-vi-quan-moderation.mjs";

const AREAS = [
  { key: "career", title: "Công việc", sources: [["Quan Lộc", .5], ["Mệnh", .25], ["Thiên Di", .25]], body: "Xem lại phạm vi công việc và năng lực muốn phát triển trong năm.", action: "Chọn một kỹ năng, đặt mốc thử trong 30 ngày và thống nhất kỳ vọng với người giao việc." },
  { key: "money", title: "Tài chính", sources: [["Tài Bạch", .5], ["Điền Trạch", .25], ["Phúc Đức", .25]], body: "Nhìn riêng dòng tiền thường xuyên và các quyết định chi lớn.", action: "Tách khoản thiết yếu, khoản dự phòng và khoản chi linh hoạt trước khi cam kết." },
  { key: "love", title: "Tình cảm", sources: [["Phu Thê", .45], ["Phúc Đức", .3], ["Tử Tức", .25]], body: "Để ý cách lắng nghe và chia sẻ trách nhiệm trong các mối quan hệ gần.", action: "Giữ một khoảng nói chuyện mỗi tuần và thống nhất một việc nhỏ cần làm cùng." },
  { key: "health", title: "Sức khỏe và nhịp sống", sources: [["Tật Ách", .5], ["Mệnh", .3], ["Phúc Đức", .2]], body: "Dùng phần này để nhìn lại thói quen nghỉ ngơi và cách bạn phân bổ sức lực.", action: "Theo dõi nhịp ngủ và vận động trong hai tuần. Trao đổi với chuyên gia y tế nếu có triệu chứng kéo dài." },
  { key: "luck", title: "May mắn", sources: [["Phúc Đức", .45], ["Thiên Di", .35], ["Mệnh", .2]], body: "Chỉ số tổng hợp các tín hiệu thuận và nghịch ở ba cung. Bạn có thể dùng để nghĩ về nguồn lực sẵn có trong năm.", action: "Xác định một người hoặc nguồn lực có thể giúp bạn và chủ động chuẩn bị trước khi cần." },
] as const;

const BRIGHTNESS: Record<StarBrightness, number> = { M: 9, V: 7, "Đ": 5, B: 1, H: -7 };
const SUPPORT = /Lộc Tồn|Hóa Lộc|Hóa Quyền|Hóa Khoa|Tả Phù|Hữu Bật|Văn Xương|Văn Khúc|Thiên Khôi|Thiên Việt|Thiên Mã|Long Trì|Phượng Các|Ân Quang|Thiên Quý|Thiên Đức|Nguyệt Đức/;
const CAUTION = /Kình Dương|Đà La|Hỏa Tinh|Linh Tinh|Địa Không|Địa Kiếp|Hóa Kỵ|Tuần|Triệt|Thiên Hư|Thiên Khốc|Tang Môn|Bạch Hổ|Thái Tuế/;
const YEAR_STEMS = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
const YEAR_BRANCHES = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];

function palaceEvidence(palace: Palace) {
  return `Cung ${palace.name} tại ${palace.branch}. Chính tinh: ${palace.mainStars.join(", ") || "vô chính diệu"}. Sao lưu: ${palace.yearlyStars.join(", ") || "không có trong cung"}.`;
}

function palaceScore(palace: Palace) {
  const states = palace.mainStars.map((star) => palace.starStates[star]).filter(Boolean);
  const brightness = states.reduce((sum, state) => sum + BRIGHTNESS[state], 0) / (states.length || 1);
  const stars = [...palace.mainStars, ...palace.supportStars, ...palace.yearlyStars];
  const support = stars.filter((star) => SUPPORT.test(star)).length;
  const caution = stars.filter((star) => CAUTION.test(star)).length;
  return Math.max(35, Math.min(92, Math.round(60 + brightness + 2.5 * (support - caution))));
}

export type QuanHoroscope = QuanContent & {
  year: number;
  yearLabel: string;
  areas: { key: (typeof AREAS)[number]["key"]; title: string; score: number | null; label: string; body: string; action: string; evidence: string[] }[];
  months: { month: number; title: string; body: string; action: string; evidence: string[] }[];
  mayMan: string[];
  disclaimer: string;
};

export function buildQuanHoroscope(input: ChartInput, year: number): QuanHoroscope {
  if (!Number.isInteger(year) || year < 1900 || year > 2100) throw new Error("Chọn năm từ 1900 đến 2100.");
  const chart = generateTuViChart({ ...input, viewYear: year });
  const yearLabel = `${YEAR_STEMS[(year - 4) % 10]} ${YEAR_BRANCHES[(year - 4) % 12]}`;
  const areas = AREAS.map(({ key, title, sources, body, action }) => {
    let weighted = 0;
    let availableWeight = 0;
    const evidence: string[] = [];
    for (const [name, weight] of sources) {
      const palace = chart.palaces.find((item) => item.name === name);
      if (!palace) continue;
      weighted += palaceScore(palace) * weight;
      availableWeight += weight;
      evidence.push(palaceEvidence(palace));
    }
    const score = availableWeight ? Math.round(weighted / availableWeight) : null;
    const label = score === null ? "Chưa đủ dữ liệu" : score >= 72 ? "Có lực để chủ động" : score >= 59 ? "Thuận khi đi có nhịp" : score >= 48 ? "Cần vừa làm vừa chỉnh" : "Nên củng cố trước";
    return { key, title, score, label, body, action, evidence };
  });

  // A planning calendar of the 12 annual chart palaces, not a monthly transit calculation.
  const monthPrompts: Record<string, [string, string]> = {
    Mệnh: ["Tự nhìn lại", "Ghi một điều bạn muốn duy trì và một điều muốn thay trong cách sống."],
    "Phụ Mẫu": ["Người đi trước", "Hỏi người lớn trong nhà về một nhu cầu bạn có thể giúp trong tháng."],
    "Phúc Đức": ["Nếp sống nâng đỡ", "Đặt lịch cho một cuộc gặp hoặc sinh hoạt giúp bạn thấy có chỗ dựa."],
    "Điền Trạch": ["Không gian sống", "Sắp lại một góc nhà và trao đổi trước về thay đổi liên quan đến cả gia đình."],
    "Quan Lộc": ["Công việc", "Chốt một đầu việc quan trọng cùng người chịu trách nhiệm và hạn cụ thể."],
    "Nô Bộc": ["Người cùng làm", "Ghi nhận một đóng góp và hỏi đồng đội có đang cần hỗ trợ không."],
    "Thiên Di": ["Môi trường mới", "Kiểm tra lịch, chi phí và đường về trước một chuyến đi hoặc cam kết mới."],
    "Tật Ách": ["Nhịp nghỉ", "Dành một khoảng nghỉ đều đặn và tìm tư vấn chuyên môn khi có dấu hiệu đáng lo."],
    "Tài Bạch": ["Chi tiêu", "Xem lại chi phí cố định và bỏ một khoản không còn phục vụ nhu cầu."],
    "Tử Tức": ["Điều cần chăm", "Dành thời gian lắng nghe người đang được bạn chăm sóc hoặc theo dõi một dự án còn non."],
    "Phu Thê": ["Gắn bó", "Hỏi rõ một mong muốn thay vì đợi người kia tự nhận ra."],
    "Huynh Đệ": ["Anh chị em và bạn thân", "Chủ động hỏi thăm một người bạn lâu chưa gặp."],
  };
  const start = Math.max(0, chart.palaces.findIndex((palace) => palace.isMenh));
  const months = chart.palaces.map((_, index) => {
    const palace = chart.palaces[(start + index) % chart.palaces.length];
    const [theme, action] = monthPrompts[palace.name];
    const signals = palace.yearlyStars.filter((star) => SUPPORT.test(star) || CAUTION.test(star));
    const body = signals.length
      ? `Lấy chủ đề ${theme.toLowerCase()} để nhìn lại cung ${palace.name}. Lá số năm ${year} có ${signals.join(", ")} ở cung này.`
      : `Dành tháng này để nhìn lại chủ đề ${theme.toLowerCase()} qua cung ${palace.name} của lá số năm ${year}.`;
    return { month: index + 1, title: `Tháng ${index + 1} · ${theme}`, body, action, evidence: [palaceEvidence(palace)] };
  });
  const mayMan = chart.palaces.flatMap((palace) => {
    const stars = palace.yearlyStars.filter((star) => SUPPORT.test(star));
    return stars.length ? [`Cung ${palace.name} tại ${palace.branch}: ${stars.join(", ")}.`] : [];
  });
  return {
    id: `horoscope-${year}`, year, yearLabel, title: `Tử vi năm ${year} · ${yearLabel}`,
    body: "Năm phương diện được đọc từ các cung và sao của lá số năm đã chọn. Các tháng là lịch tự nhìn lại theo 12 cung.",
    action: "Chọn một việc có thể làm trong tháng và hẹn ngày xem lại kết quả.",
    evidence: [`Năm xem ${year} (${yearLabel}). Bộ lập lá số ${chart.engine.version}.`, "Điểm là chỉ số tham chiếu từ cung, sao và trạng thái sao theo quy tắc của Quán. Các mục theo tháng dùng sao lưu năm để gợi ý chủ đề, không tính sao lưu tháng."],
    areas, months, mayMan, disclaimer: DISCLAIMER,
  };
}
