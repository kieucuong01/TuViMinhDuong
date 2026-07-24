import Link from "next/link";
import { BookOpenText, CalendarDays, Compass, Layers3, Search, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { historicalLifetimeCards } from "@/lib/lifetime-age-data";
import { routeMetadata } from "@/lib/metadata";
import { faqJsonLd, itemListJsonLd, webPageJsonLd } from "@/lib/seo";
import { LifetimeCardList, type LifetimeCardListItem } from "./lifetime-card-list";

export const revalidate = 300;

export const metadata = routeMetadata({
  title: "Tử vi trọn đời cho nam nữ theo từng tuổi",
  description:
    "Xem Tử vi trọn đời cho nam nữ theo từng tuổi, năm sinh và can chi. Có nội dung tổng quan, công việc, tiền bạc, tình cảm, gia đạo và lưu ý vận hạn.",
  path: "/xem-tu-vi-tron-doi",
  imageSubtitle: "Tử vi trọn đời cho nam nữ theo từng tuổi, năm sinh, can chi và vận hạn",
});

const updatedAt = "23/07/2026";

const readingLayers = [
  {
    title: "Nền tuổi",
    body: "Dùng năm sinh, can chi, ngũ hành nạp âm và giới tính để định hướng phần đọc nhanh.",
  },
  {
    title: "Trục đời sống",
    body: "Tách rõ công việc, tiền bạc, tình cảm, gia đạo và sức khỏe để người đọc tìm đúng phần cần xem.",
  },
  {
    title: "Giới hạn luận giải",
    body: "Luận theo tuổi là bản tổng quan. Giờ sinh và lá số cá nhân vẫn làm thay đổi nhiều chi tiết sâu.",
  },
];

type LifetimeCard = {
  id: string;
  detailsPath?: string;
  title: string;
  year: string;
  canChi: string;
  gender: string;
  overview: string;
  work: string;
  family: string;
  caution: string;
};

export const LIFETIME_CARDS_PER_PAGE = 6;

const baseLifetimeCards: LifetimeCard[] = [
  {
    id: "tu-vi-tron-doi-ky-dau-1969-nam-mang",
    detailsPath: "/tu-vi-tron-doi-tuoi-ky-dau-1969-nam-mang",
    title: "Tử vi trọn đời tuổi Kỷ Dậu 1969 nam mạng",
    year: "1969",
    canChi: "Kỷ Dậu",
    gender: "Nam mạng",
    overview: "Kỷ Dậu nam mạng thường có xu hướng sống nguyên tắc, trọng chữ tín và thích tự tay kiểm soát việc quan trọng. Giai đoạn trẻ dễ chịu áp lực về nghề nghiệp hoặc trách nhiệm gia đình, nhưng càng về sau càng hợp cách làm bền bỉ, tích lũy chậm và giữ uy tín.",
    work: "Công việc hợp môi trường cần kinh nghiệm, quy trình, kỹ thuật, quản lý vận hành hoặc vai trò cố vấn. Tiền bạc nên đi theo hướng chắc, tránh hùn hạp cảm tính và các quyết định đầu tư chỉ dựa vào lời rủ rê.",
    family: "Tình cảm và gia đạo cần mềm lời hơn khi góp ý. Người tuổi này dễ đúng lý nhưng khô cách nói; biết lắng nghe sẽ giảm xung đột với bạn đời và con cháu.",
    caution: "Vận trình nên tránh cố ôm mọi việc một mình. Sức khỏe cần để ý tiêu hóa, xương khớp, giấc ngủ và thói quen làm việc quá sức.",
  },
  {
    id: "tu-vi-tron-doi-ky-dau-1969-nu-mang",
    detailsPath: "/tu-vi-tron-doi-tuoi-ky-dau-1969-nu-mang",
    title: "Tử vi trọn đời tuổi Kỷ Dậu 1969 nữ mạng",
    year: "1969",
    canChi: "Kỷ Dậu",
    gender: "Nữ mạng",
    overview: "Kỷ Dậu nữ mạng thường tháo vát, biết lo xa và có khả năng giữ nếp nhà. Điểm mạnh là sự bền bỉ, biết tính toán, nhưng đôi lúc dễ tự đặt tiêu chuẩn cao khiến bản thân mệt.",
    work: "Công việc hợp các vai trò quản lý tài chính gia đình, kinh doanh nhỏ, dịch vụ, hành chính, chăm sóc khách hàng hoặc nghề cần sự tỉ mỉ. Tiền bạc tốt khi có sổ sách rõ, không nên cho vay vì nể tình.",
    family: "Gia đạo nên tránh ôm hết phần lo rồi sinh tủi thân. Khi phân chia trách nhiệm rõ, quan hệ vợ chồng và con cái nhẹ hơn.",
    caution: "Các giai đoạn đổi nhà, đổi việc hoặc lo chuyện con cái cần đi từng bước. Không nên lấy cảm giác bất an ngắn hạn làm quyết định dài hạn.",
  },
  ...historicalLifetimeCards,
  {
    id: "tu-vi-tron-doi-nham-thin-2012-nam-mang",
    title: "Tử vi trọn đời tuổi Nhâm Thìn 2012 nam mạng",
    year: "2012",
    canChi: "Nhâm Thìn",
    gender: "Nam mạng",
    overview: "Nhâm Thìn nam mạng có nền tính cách nhanh nhạy, tò mò và dễ bị cuốn vào những việc có tính khám phá. Khi được định hướng đúng, tuổi này phát triển tốt qua học tập, kỹ năng số và môi trường có kỷ luật vừa phải.",
    work: "Đường học tập nên ưu tiên tư duy logic, ngoại ngữ, công nghệ, nghiên cứu hoặc các môn cần quan sát. Về sau hợp nghề có không gian phát triển, không quá gò trong một khuôn cứng.",
    family: "Gia đình nên hướng dẫn bằng quy tắc rõ thay vì ép bằng áp lực. Trẻ tuổi này cần được giải thích lý do, nếu chỉ cấm đoán dễ phản ứng ngược.",
    caution: "Cần rèn sự kiên trì, quản lý thời gian và khả năng hoàn thành việc nhỏ. Tránh để thiết bị số làm giảm tập trung.",
  },
  {
    id: "tu-vi-tron-doi-nham-thin-2012-nu-mang",
    title: "Tử vi trọn đời tuổi Nhâm Thìn 2012 nữ mạng",
    year: "2012",
    canChi: "Nhâm Thìn",
    gender: "Nữ mạng",
    overview: "Nhâm Thìn nữ mạng thường có trực giác tốt, dễ học nhanh khi có cảm hứng và thích được công nhận. Nền tuổi này nên được nuôi dưỡng bằng sự tự tin, kỷ luật mềm và môi trường học tập có tính sáng tạo.",
    work: "Học tập hợp các nhóm môn ngôn ngữ, nghệ thuật ứng dụng, công nghệ, truyền thông hoặc phân tích. Khi lớn lên, nên chọn việc có cả tính chuyên môn lẫn giao tiếp.",
    family: "Gia đạo cần chú ý cách động viên. Lời so sánh quá nhiều dễ làm trẻ thu mình hoặc cố chứng minh bản thân quá mức.",
    caution: "Nên rèn thói quen ngủ nghỉ, vận động và tự quản cảm xúc từ sớm. Khi gặp áp lực học tập, cần chia nhỏ mục tiêu thay vì dồn nén.",
  },
  {
    id: "tu-vi-tron-doi-tan-mao-2011-nam-mang",
    title: "Tử vi trọn đời tuổi Tân Mão 2011 nam mạng",
    year: "2011",
    canChi: "Tân Mão",
    gender: "Nam mạng",
    overview: "Tân Mão nam mạng thường nhạy cảm, quan sát kỹ và phản ứng nhanh với môi trường xung quanh. Nếu được đặt vào nếp sinh hoạt ổn định, tuổi này dễ phát huy sự khéo léo và khả năng học từ chi tiết.",
    work: "Đường học tập nên chú trọng nền tảng, không ép nhảy quá nhanh. Về nghề nghiệp, hợp các việc cần thẩm mỹ, phân tích, kỹ năng mềm, công nghệ ứng dụng hoặc hỗ trợ chuyên môn.",
    family: "Trong gia đình, nên nói rõ kỳ vọng và ghi nhận tiến bộ nhỏ. Tuổi này không hợp cách dạy quá gay gắt hoặc thay đổi quy tắc liên tục.",
    caution: "Cần rèn sự quyết đoán và sức bền. Khi thiếu tự tin, dễ trì hoãn hoặc né việc khó.",
  },
  {
    id: "tu-vi-tron-doi-tan-mao-2011-nu-mang",
    title: "Tử vi trọn đời tuổi Tân Mão 2011 nữ mạng",
    year: "2011",
    canChi: "Tân Mão",
    gender: "Nữ mạng",
    overview: "Tân Mão nữ mạng có nét mềm, tinh tế và dễ để ý cảm xúc của người khác. Điểm mạnh nằm ở sự khéo léo, nhưng cần học cách đặt ranh giới để không bị cuốn vào kỳ vọng bên ngoài.",
    work: "Học tập và nghề nghiệp hợp các lĩnh vực cần giao tiếp, thẩm mỹ, chăm sóc, thiết kế, ngôn ngữ hoặc phân tích dữ liệu nhẹ. Thành tựu đến tốt hơn khi có lịch trình ổn định.",
    family: "Gia đạo nên khuyến khích bày tỏ suy nghĩ thật. Nếu bị chê nhiều, tuổi này dễ giữ trong lòng và mất động lực.",
    caution: "Cần tránh tâm lý làm vừa lòng mọi người. Sức khỏe nên chú ý mắt, giấc ngủ và vận động đều.",
  },
  {
    id: "tu-vi-tron-doi-at-hoi-1995-nam-mang",
    detailsPath: "/tu-vi-tron-doi-tuoi-at-hoi-1995-nam-mang",
    title: "Tử vi trọn đời tuổi Ất Hợi 1995 nam mạng",
    year: "1995",
    canChi: "Ất Hợi",
    gender: "Nam mạng",
    overview: "Ất Hợi nam mạng thường có lòng tự trọng, giàu tình nghĩa và không thích bị thúc ép. Tuổi này hợp cách đi đường dài: xây kỹ năng, giữ uy tín, chọn bạn đồng hành ít nhưng chắc.",
    work: "Sự nghiệp tốt khi có chuyên môn rõ, đặc biệt trong kinh doanh dịch vụ, công nghệ, vận hành, tài chính cá nhân hoặc nghề cần quan hệ bền. Tiền bạc cần tránh cả tin, nhất là khi người quen rủ góp vốn.",
    family: "Tình cảm cần sự thẳng thắn. Khi im lặng quá lâu, hiểu lầm dễ tích lại thành khoảng cách.",
    caution: "Giai đoạn lập nghiệp nên ưu tiên quỹ dự phòng, tránh tiêu vì sĩ diện. Sức khỏe cần để ý gan mật, tiêu hóa và thói quen thức khuya.",
  },
  {
    id: "tu-vi-tron-doi-at-hoi-1995-nu-mang",
    detailsPath: "/tu-vi-tron-doi-tuoi-at-hoi-1995-nu-mang",
    title: "Tử vi trọn đời tuổi Ất Hợi 1995 nữ mạng",
    year: "1995",
    canChi: "Ất Hợi",
    gender: "Nữ mạng",
    overview: "Ất Hợi nữ mạng thường sống tình cảm, có duyên với người xung quanh và dễ lo cho gia đình. Điểm cần cân bằng là đừng để sự nhường nhịn biến thành chịu đựng.",
    work: "Công việc hợp môi trường có tính chăm sóc, tư vấn, dịch vụ, sáng tạo nội dung, giáo dục hoặc kinh doanh cá nhân. Tài chính tốt hơn khi tách bạch tiền chung, tiền riêng và khoản dự phòng.",
    family: "Tình cảm thuận khi có người bạn đời biết chia sẻ trách nhiệm. Không nên tự ôm hết chuyện nhà rồi mong người khác tự hiểu.",
    caution: "Các năm đổi việc, sinh con, mua nhà hoặc đầu tư lớn cần tính dòng tiền trước. Đừng ra quyết định vì áp lực tuổi tác.",
  },
  {
    id: "tu-vi-tron-doi-at-suu-1985-nam-mang",
    detailsPath: "/tu-vi-tron-doi-tuoi-at-suu-1985-nam-mang",
    title: "Tử vi trọn đời tuổi Ất Sửu 1985 nam mạng",
    year: "1985",
    canChi: "Ất Sửu",
    gender: "Nam mạng",
    overview: "Ất Sửu nam mạng thường chịu khó, giữ trách nhiệm và có sức bền tốt. Đời sống dễ đi lên bằng tích lũy thực tế hơn là may mắn đột ngột.",
    work: "Sự nghiệp hợp các lĩnh vực vận hành, kỹ thuật, xây dựng, tài sản, quản lý đội nhóm hoặc kinh doanh có tài sản nền. Tiền bạc nên ưu tiên tài sản thật, kế hoạch dài hạn và hợp đồng rõ.",
    family: "Gia đạo cần tránh kiểu im lặng chịu đựng. Khi nói rõ nhu cầu và giới hạn, quan hệ thân gần sẽ bớt nặng.",
    caution: "Không nên cố chứng minh bằng cách làm quá sức. Cần giữ nhịp nghỉ, khám sức khỏe định kỳ và quản trị nợ.",
  },
  {
    id: "tu-vi-tron-doi-at-suu-1985-nu-mang",
    detailsPath: "/tu-vi-tron-doi-tuoi-at-suu-1985-nu-mang",
    title: "Tử vi trọn đời tuổi Ất Sửu 1985 nữ mạng",
    year: "1985",
    canChi: "Ất Sửu",
    gender: "Nữ mạng",
    overview: "Ất Sửu nữ mạng thường thực tế, bền bỉ và giỏi xoay xở. Nhiều việc trong nhà hoặc công việc có thể dựa vào người tuổi này, nhưng chính vì vậy dễ bị quá tải.",
    work: "Công việc hợp quản lý, tài chính, giáo dục, chăm sóc khách hàng, bất động sản, vận hành hoặc nghề cần uy tín lâu năm. Tiền bạc nên có kế hoạch riêng, không chỉ dựa vào gia đình.",
    family: "Tình cảm cần chia sẻ trách nhiệm rõ ràng. Người tuổi này càng biết nói nhu cầu, gia đạo càng bớt áp lực.",
    caution: "Nên tránh dồn việc, dồn cảm xúc và dồn tiền vào một chỗ. Sức khỏe cần chú ý xương khớp, nội tiết và giấc ngủ.",
  },
  {
    id: "tu-vi-tron-doi-at-mao-1975-nam-mang",
    detailsPath: "/tu-vi-tron-doi-tuoi-at-mao-1975-nam-mang",
    title: "Tử vi trọn đời tuổi Ất Mão 1975 nam mạng",
    year: "1975",
    canChi: "Ất Mão",
    gender: "Nam mạng",
    overview: "Ất Mão nam mạng có nét mềm trong ứng xử nhưng bên trong khá kiên định. Tuổi này thường thuận khi biết dùng kinh nghiệm, quan hệ và uy tín để tạo giá trị dài hạn.",
    work: "Công việc hợp vai trò cố vấn, quản lý, kinh doanh dịch vụ, giáo dục, pháp lý, tài sản hoặc những việc cần sự tin cậy. Tài chính nên ưu tiên bảo toàn và chuyển giao kinh nghiệm hơn là mạo hiểm lớn.",
    family: "Gia đạo cần sự hiện diện và lắng nghe. Đừng để công việc hoặc trách nhiệm bên ngoài làm xa cách người thân.",
    caution: "Giai đoạn sau trung niên nên giảm việc ôm đồm, để ý huyết áp, giấc ngủ và nhịp sinh hoạt.",
  },
  {
    id: "tu-vi-tron-doi-at-mao-1975-nu-mang",
    detailsPath: "/tu-vi-tron-doi-tuoi-at-mao-1975-nu-mang",
    title: "Tử vi trọn đời tuổi Ất Mão 1975 nữ mạng",
    year: "1975",
    canChi: "Ất Mão",
    gender: "Nữ mạng",
    overview: "Ất Mão nữ mạng thường tinh tế, biết giữ hòa khí và có khả năng quán xuyến gia đình. Điểm mạnh là sự mềm dẻo, nhưng cần tránh nhịn quá lâu rồi mệt trong lòng.",
    work: "Công việc hợp dịch vụ, tư vấn, giáo dục, kinh doanh gia đình hoặc vai trò kết nối. Tiền bạc tốt khi có kế hoạch bảo toàn, không nên đứng tên hoặc bảo lãnh vì nể.",
    family: "Tình cảm thuận khi có đối thoại đều đặn. Với con cái, nên chuyển từ kiểm soát sang đồng hành để giảm va chạm.",
    caution: "Nên dành thời gian cho sức khỏe, bạn bè và sở thích riêng. Vận sau tốt hơn khi biết buông bớt trách nhiệm không còn thuộc về mình.",
  },
  {
    id: "tu-vi-tron-doi-giap-ty-1984-nam-mang",
    detailsPath: "/tu-vi-tron-doi-tuoi-giap-ty-1984-nam-mang",
    title: "Tử vi trọn đời tuổi Giáp Tý 1984 nam mạng",
    year: "1984",
    canChi: "Giáp Tý",
    gender: "Nam mạng",
    overview: "Giáp Tý nam mạng thường nhanh trí, linh hoạt và có khả năng thích nghi tốt. Khi giữ được nguyên tắc, tuổi này tiến bền nhờ chuyên môn, uy tín và sự tỉnh táo hơn là nhờ may mắn ngắn hạn.",
    work: "Sự nghiệp hợp vận hành, kỹ thuật, kinh doanh dịch vụ, tài chính thực tế, logistics, sản phẩm số hoặc vai trò quản lý cần xử lý nhanh. Tiền bạc nên kỷ luật, tránh chia nhỏ sức vào quá nhiều cơ hội cùng lúc.",
    family: "Gia đạo thuận hơn khi người tuổi này chia sẻ kế hoạch và áp lực sớm. Thương bằng hành động là tốt, nhưng vẫn cần đối thoại rõ để tránh tích mệt thành khoảng cách.",
    caution: "Nên để ý giấc ngủ, stress kéo dài, tiêu hóa và thói quen làm việc phân tán. Mọi quyết định tài sản hoặc hùn hạp nên soi kỹ pháp lý và phương án xấu nhất.",
  },
  {
    id: "tu-vi-tron-doi-giap-ty-1984-nu-mang",
    detailsPath: "/tu-vi-tron-doi-tuoi-giap-ty-1984-nu-mang",
    title: "Tử vi trọn đời tuổi Giáp Tý 1984 nữ mạng",
    year: "1984",
    canChi: "Giáp Tý",
    gender: "Nữ mạng",
    overview: "Giáp Tý nữ mạng thường lanh, hiểu việc nhanh và có khả năng xoay xở tốt trong áp lực. Khi có nền nếp rõ, tuổi này tích lũy vững nhờ sự tỉ mỉ và đầu óc thực tế.",
    work: "Công việc hợp các vai trò cần quán xuyến, kỷ luật và thích nghi như kế toán, vận hành, dịch vụ, giáo dục, kinh doanh thực tế hoặc quản trị nội bộ. Tiền bạc tốt hơn khi tách quỹ rõ và giảm chi vì áp lực.",
    family: "Gia đạo nhẹ hơn khi trách nhiệm được chia đều. Người tuổi này dễ lo trước và làm trước, nên cần nói nhu cầu sớm thay vì ôm hết để giữ yên cửa nhà.",
    caution: "Sức khỏe cần chú ý giấc ngủ, nội tiết, stress âm thầm và đau mỏi kéo dài. Các mốc đổi việc, mua bán tài sản hay lo chuyện cha mẹ - con cái nên có quỹ dự phòng rõ.",
  },
];

const lifetimeArticleByPath = new Map(
  baseLifetimeCards
    .filter((item) => item.detailsPath)
    .map((item) => [
      item.detailsPath as string,
      {
        coverImage: `/articles/${item.detailsPath?.replace(/^\//, "")}.svg`,
      },
    ]),
);

export const lifetimeCards: LifetimeCardListItem[] = baseLifetimeCards.map((item) => {
  const articleAsset = item.detailsPath ? lifetimeArticleByPath.get(item.detailsPath) : null;

  return {
    ...item,
    coverImage: articleAsset?.coverImage || `/articles/${item.id}.svg`,
    coverAlt: `Minh họa ${item.title} theo năm sinh ${item.year} và ${item.gender.toLowerCase()}`,
  };
});

const relatedLinks = [
  ["/kien-thuc-tu-vi/la-so-tu-vi-tron-doi", "Lá số tử vi trọn đời là gì?", "Hiểu khác nhau giữa luận theo tuổi và luận theo lá số cá nhân."],
  ["/kien-thuc-tu-vi/cach-doc-la-so-tu-vi-cho-nguoi-moi", "Cách đọc lá số tử vi cho người mới", "Bắt đầu từ Mệnh, Thân, tam hợp, xung chiếu và các cung trọng tâm."],
  ["/kien-thuc-tu-vi/12-cung-trong-la-so-tu-vi", "12 cung trong lá số tử vi", "Bản đồ để đối chiếu công việc, tiền bạc, gia đình và quan hệ."],
  ["/kien-thuc-tu-vi/dai-van-la-gi", "Đại vận là gì?", "Cách nhìn các chặng vận dài hạn mà không phán tuyệt đối."],
] as const;

const futureTools = ["Xem Tử vi 2026", "Tử vi tài lộc & Đầu tư", "Tương hợp lá số"];

const faqs = [
  {
    question: "Có cần lập lá số mới xem được tử vi trọn đời không?",
    answer:
      "Không. Trang này có nội dung xem nhanh theo tuổi, năm sinh và nam nữ. Nếu muốn cá nhân hóa sâu hơn theo giờ sinh, cung Mệnh, cung Thân và đại vận riêng, bạn có thể lập lá số sau.",
  },
  {
    question: "Tử vi trọn đời theo tuổi có chính xác tuyệt đối không?",
    answer:
      "Không. Luận theo tuổi là lớp tổng quan, phù hợp để tham khảo xu hướng. Ngày sinh, giờ sinh, môi trường sống và lựa chọn cá nhân vẫn làm kết quả thực tế khác nhau.",
  },
  {
    question: "Nam mạng và nữ mạng cùng năm sinh khác nhau ở điểm nào?",
    answer:
      "Cùng năm sinh có chung can chi và nạp âm, nhưng cách nhìn cung mệnh, vai trò gia đình, nhịp đời sống và trọng tâm quyết định thường khác nhau nên cần tách nam mạng và nữ mạng.",
  },
];

export default function LifetimeTuViPage() {
  const pageLd = webPageJsonLd({
    name: "Tử vi trọn đời cho nam nữ theo từng tuổi",
    description: "Hub xem Tử vi trọn đời theo tuổi, năm sinh và giới tính, có nội dung đọc nhanh ngay trên trang.",
    url: "/xem-tu-vi-tron-doi",
    breadcrumb: [
      { name: "Trang chủ", url: "/" },
      { name: "Tử vi", url: "/xem-tu-vi-tron-doi" },
      { name: "Tử vi trọn đời cho nam nữ", url: "/xem-tu-vi-tron-doi" },
    ],
  });
  const listLd = itemListJsonLd(lifetimeCards.map((item) => ({ name: item.title, url: item.detailsPath || `/xem-tu-vi-tron-doi#${item.id}` })));

  return (
    <main>
      <script id="lifetime-tuvi-page-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageLd) }} />
      <script id="lifetime-tuvi-list-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(listLd) }} />
      <script id="lifetime-tuvi-faq-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(faqs)) }} />

      <section className="section bg-gradient-to-b from-white via-orange-50/70 to-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_0.85fr] lg:px-8">
          <div>
            <p className="eyebrow">Tử vi trọn đời cho nam nữ</p>
            <h1 className="section-title max-w-4xl">Tử vi trọn đời theo từng tuổi, có nội dung xem ngay</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-stone-600" data-answer-block="true">
              Tử vi trọn đời theo tuổi là phần luận nhanh dựa trên năm sinh, can chi, nam mạng hoặc nữ mạng để tham khảo tổng quan về tính cách, công việc, tiền bạc, tình cảm, gia đạo và sức khỏe. Bạn có thể đọc ngay từng tuổi bên dưới, không cần lập lá số trước.
            </p>
            <p className="mt-3 text-sm font-semibold text-stone-500">Cập nhật nội dung: {updatedAt}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="#danh-sach-tuoi" className="btn btn-primary btn-large">
                <Search size={20} /> Xem từng tuổi
              </Link>
              <Link href="#doc-sau-hon" className="btn btn-ghost btn-large">
                <Sparkles size={20} /> Đọc sâu hơn
              </Link>
            </div>
          </div>

          <aside className="panel">
            <div className="flex items-start gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-100 text-orange-700">
                <Layers3 size={24} />
              </span>
              <div>
                <h2 className="text-2xl font-black text-stone-950">Cách đọc trang này</h2>
                <p className="mt-2 text-stone-600">Đọc theo tuổi trước, sau đó đối chiếu thêm lá số nếu cần cá nhân hóa.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              {readingLayers.map((item, index) => (
                <article key={item.title} className="rounded-2xl border border-orange-100 bg-white/80 p-4">
                  <span className="text-sm font-black text-orange-600">Lớp {index + 1}</span>
                  <h3 className="mt-1 text-lg font-black text-stone-950">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-stone-600">{item.body}</p>
                </article>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section id="danh-sach-tuoi" className="section">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="section-heading">
            <p className="eyebrow">Luận chi tiết từng tuổi</p>
            <h2>Xem tử vi trọn đời theo năm sinh, can chi và nam nữ</h2>
            <p className="mt-4 text-stone-600">
              Mỗi tuổi có phần đọc ngay: tổng quan, công việc - tiền bạc, tình cảm - gia đạo và lưu ý vận hạn. Nội dung dùng để tham khảo, không thay thế quyết định cá nhân.
            </p>
          </div>
          <LifetimeCardList cards={lifetimeCards} itemsPerPage={LIFETIME_CARDS_PER_PAGE} />
          {false ? <div className="grid gap-5">
            {lifetimeCards.map((item) => (
              <article id={item.id} key={item.id} className="scroll-mt-24 rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-black text-orange-700">{item.year}</span>
                  <span className="rounded-full bg-stone-100 px-3 py-1 text-sm font-black text-stone-700">{item.canChi}</span>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-black text-emerald-700">{item.gender}</span>
                </div>
                <h3 className="mt-4 text-2xl font-black text-stone-950">{item.title}</h3>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl bg-orange-50/70 p-4">
                    <h4 className="font-black text-stone-950">Tổng quan trọn đời</h4>
                    <p className="mt-2 leading-7 text-stone-700">{item.overview}</p>
                  </div>
                  <div className="rounded-2xl bg-stone-50 p-4">
                    <h4 className="font-black text-stone-950">Công việc và tiền bạc</h4>
                    <p className="mt-2 leading-7 text-stone-700">{item.work}</p>
                  </div>
                  <div className="rounded-2xl bg-stone-50 p-4">
                    <h4 className="font-black text-stone-950">Tình cảm và gia đạo</h4>
                    <p className="mt-2 leading-7 text-stone-700">{item.family}</p>
                  </div>
                  <div className="rounded-2xl bg-amber-50 p-4">
                    <h4 className="font-black text-stone-950">Lưu ý vận hạn</h4>
                    <p className="mt-2 leading-7 text-stone-700">{item.caution}</p>
                  </div>
                </div>
                {item.detailsPath ? (
                  <Link href={item.detailsPath} className="btn btn-primary mt-5">
                    <BookOpenText size={18} /> Đọc bài chi tiết
                  </Link>
                ) : null}
              </article>
            ))}
          </div> : null}
        </div>
      </section>

      <section id="doc-sau-hon" className="section bg-white/70">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="eyebrow">Đọc sâu hơn</p>
              <h2 className="section-title">Luận theo tuổi là bản mở đầu, không phải lá số cá nhân</h2>
              <p className="mt-4 text-lg leading-8 text-stone-600">
                Nếu chỉ cần tra nhanh, các phần trên là đủ để đọc tổng quan. Khi cần xem kỹ vì sao cùng tuổi nhưng đời sống khác nhau, hãy đối chiếu thêm giờ sinh, cung Mệnh, cung Thân, đại vận và các sao trong 12 cung.
              </p>
              <Link href="/lap-la-so" className="btn btn-ghost mt-6">
                <UserRound size={18} /> Lập lá số cá nhân khi cần
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { icon: CalendarDays, title: "Năm sinh", body: "Cho nền can chi và nhóm tuổi để đọc nhanh." },
                { icon: UserRound, title: "Nam nữ", body: "Giúp tách trọng tâm đời sống theo giới tính." },
                { icon: Compass, title: "Lá số", body: "Dùng khi cần luận sâu theo 12 cung và đại vận." },
              ].map((item) => (
                <article key={item.title} className="feature-card">
                  <item.icon className="text-orange-600" size={24} />
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="section-heading">
            <p className="eyebrow">Đọc thêm</p>
            <h2>Chủ đề liên quan đến tử vi trọn đời</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {relatedLinks.map(([href, title, body]) => (
              <Link key={href} href={href} className="feature-card group">
                <BookOpenText className="text-orange-600" size={24} />
                <h3 className="group-hover:text-orange-700">{title}</h3>
                <p>{body}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-white/70">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-7">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 shrink-0 text-emerald-600" size={24} />
              <div>
                <p className="eyebrow">Làm sau</p>
                <h2 className="text-2xl font-black text-stone-950">Các mục còn lại đã đặt trong tab Tử vi, nhưng chưa mở route riêng</h2>
                <p className="mt-2 text-stone-600">Giữ trạng thái sắp làm để không sinh công cụ chưa có logic thật.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {futureTools.map((tool) => (
                <span key={tool} className="rounded-2xl bg-stone-50 p-4 font-black text-stone-600">
                  {tool}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section pt-0">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="section-heading">
            <p className="eyebrow">Câu hỏi thường gặp</p>
            <h2>Trước khi xem tử vi trọn đời theo tuổi</h2>
          </div>
          <div className="grid gap-3">
            {faqs.map((item) => (
              <details key={item.question} className="date-faq-item rounded-2xl border border-orange-100 bg-orange-50/50 p-4">
                <summary className="cursor-pointer text-base font-black text-stone-950">{item.question}</summary>
                <p className="mt-2 text-stone-600">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
