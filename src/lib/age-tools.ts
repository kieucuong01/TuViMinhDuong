export type AgeToolSlug = "xong-dat" | "vo-chong" | "sinh-con" | "ket-hon" | "lam-an" | "lam-nha";

export type AgeToolPage = {
  slug: AgeToolSlug;
  label: string;
  shortDescription: string;
  title: string;
  description: string;
  heading: string;
  intro: string;
  method: string[];
  readingTips: string[];
  example: string;
  faqs: { question: string; answer: string }[];
  related: AgeToolSlug[];
  cta: { href: string; label: string; description: string };
};

export const AGE_TOOL_PAGES: AgeToolPage[] = [
  {
    slug: "xong-dat",
    label: "Xem tuổi xông đất",
    shortDescription: "Gợi ý năm sinh người xông đất theo tuổi gia chủ và năm mới.",
    title: "Xem tuổi xông đất theo Can Chi, Ngũ hành",
    description: "Tra cứu tuổi xông đất phù hợp với gia chủ và năm mới bằng Can Chi, Nạp âm, Ngũ hành; xem rõ từng tiêu chí, không chấm điểm tùy ý.",
    heading: "Xem tuổi xông đất hợp gia chủ",
    intro: "Công cụ đối chiếu tuổi người xông đất với tuổi âm lịch của gia chủ, sau đó kiểm tra thêm quan hệ với Can Chi của năm mới. Kết quả là danh sách gợi ý để gia đình tham khảo, không thay thế sự tin cậy và hòa khí giữa người với người.",
    method: [
      "Đổi ngày sinh dương lịch của gia chủ sang năm âm lịch theo múi giờ Việt Nam.",
      "So Nạp âm Ngũ hành, Thiên Can và Địa Chi của từng năm sinh ứng viên với gia chủ.",
      "Dùng quan hệ với năm mới làm lớp tham khảo bổ trợ, rồi ưu tiên tuổi ít cảnh báo chính hơn.",
    ],
    readingTips: [
      "Ưu tiên người khỏe mạnh, vui vẻ, gia đạo ổn định và có quan hệ tốt với gia đình.",
      "Danh sách hiển thị năm sinh gợi ý; gia chủ vẫn nên xét hoàn cảnh thực tế và giờ đến nhà.",
      "Không có tuổi nào bảo đảm tài lộc hoặc thay đổi vận hạn của cả năm.",
    ],
    example: "Ví dụ: gia chủ nhập ngày sinh, chọn năm mới cần xem. Công cụ sẽ nêu rõ tuổi nào lục hợp hoặc tam hợp với gia chủ, tuổi nào có quan hệ xung, hại hay phá cần cân nhắc.",
    faqs: [
      { question: "Xem tuổi xông đất dựa vào tuổi ai?", answer: "Lấy tuổi âm lịch của gia chủ làm trọng tâm. Quan hệ với Can Chi năm mới chỉ là lớp bổ trợ để sắp xếp danh sách gợi ý." },
      { question: "Người trong nhà có thể tự xông đất không?", answer: "Có thể, nếu phù hợp phong tục của gia đình. Công cụ chỉ đối chiếu năm sinh, không bắt buộc người xông đất phải là khách bên ngoài." },
      { question: "Tuổi hợp nhưng đang có chuyện buồn có nên xông đất?", answer: "Phong tục dân gian thường coi trọng tinh thần vui vẻ và hoàn cảnh thực tế. Vì vậy không nên chỉ dựa vào tuổi hợp mà bỏ qua yếu tố này." },
    ],
    related: ["lam-nha", "lam-an"],
    cta: { href: "/xem-ngay", label: "Xem ngày đầu năm", description: "Kết hợp tra cứu ngày tốt và việc nên làm trong lịch ngày." },
  },
  {
    slug: "vo-chong",
    label: "Xem tuổi vợ chồng",
    shortDescription: "Đối chiếu hai người theo Nạp âm, Can Chi và Cung Phi.",
    title: "Xem tuổi vợ chồng theo Can Chi, Cung Phi",
    description: "Xem tuổi vợ chồng theo Nạp âm Ngũ hành, Thiên Can, Địa Chi và Cung Phi; giải thích từng lớp hợp khắc, không phán định hôn nhân.",
    heading: "Xem tuổi vợ chồng có hợp nhau không",
    intro: "Đây là phép đối chiếu các lớp tuổi truyền thống của hai người. Công cụ tách rõ tiêu chí chính và Cung Phi bổ trợ, không dùng một con số để kết luận chất lượng hay tương lai hôn nhân.",
    method: [
      "Đổi hai ngày sinh sang năm âm lịch để xác định Can Chi và Nạp âm.",
      "Đối chiếu quan hệ sinh, khắc, đồng hành của Nạp âm; tương hợp của Thiên Can; hợp, xung, hại, phá của Địa Chi.",
      "Tính Cung Phi theo năm âm lịch và giới tính như một lớp tham khảo bổ trợ.",
    ],
    readingTips: [
      "Đọc từng tiêu chí thay vì chỉ nhìn nhãn tổng quan.",
      "Một quan hệ xung không đủ để kết luận hai người không thể kết hôn.",
      "Giao tiếp, trách nhiệm, giá trị sống và cách giải quyết mâu thuẫn quan trọng hơn kết quả tra cứu tuổi.",
    ],
    example: "Ví dụ: hai người có Nạp âm tương sinh nhưng Địa Chi lục xung. Kết quả sẽ ghi cả điểm thuận lẫn điểm cần cân nhắc, thay vì cộng trừ thành phần trăm hợp nhau.",
    faqs: [
      { question: "Xem tuổi vợ chồng có quyết định hôn nhân không?", answer: "Không. Đây là dữ liệu tham khảo theo hệ quy chiếu dân gian; quyết định hôn nhân cần dựa trên sự tự nguyện, hiểu biết và trách nhiệm của hai người." },
      { question: "Cung Phi có phải tiêu chí chính không?", answer: "Công cụ xếp Cung Phi ở lớp bổ trợ. Nạp âm, Thiên Can và Địa Chi được trình bày trước để người đọc thấy rõ nền tảng đối chiếu." },
      { question: "Cùng con giáp có được tính là Tam Hợp không?", answer: "Không. Cùng một Địa Chi được ghi là đồng chi. Tam Hợp chỉ áp dụng khi hai Chi khác nhau cùng thuộc một nhóm Tam Hợp." },
    ],
    related: ["ket-hon", "sinh-con"],
    cta: { href: "/?source=xem_tuoi_vo_chong#lap-la-so", label: "Lập hai lá số", description: "Xem sâu hơn tính cách và các cung liên quan trên từng lá số." },
  },
  {
    slug: "sinh-con",
    label: "Xem tuổi sinh con",
    shortDescription: "Tham khảo các năm sinh con theo tuổi âm lịch của cha và mẹ.",
    title: "Xem tuổi sinh con hợp tuổi cha mẹ",
    description: "Gợi ý năm sinh con theo tuổi cha mẹ bằng Nạp âm, Thiên Can và Địa Chi; so sánh minh bạch từng năm trong khoảng lựa chọn.",
    heading: "Xem năm sinh con hợp tuổi cha mẹ",
    intro: "Công cụ so tuổi dự kiến của con với cả cha và mẹ trên cùng một hệ tiêu chí. Kết quả không phải lời khuyên y khoa và không nên được dùng để trì hoãn kế hoạch sức khỏe sinh sản.",
    method: [
      "Xác định năm âm lịch, Can Chi và Nạp âm của cha mẹ từ ngày sinh dương lịch.",
      "Tạo hồ sơ Can Chi cho từng năm dự kiến sinh con trong khoảng đã chọn.",
      "Đối chiếu riêng với cha và mẹ, sau đó ưu tiên năm có ít cảnh báo chính và nhiều quan hệ thuận hơn.",
    ],
    readingTips: [
      "Xem cả phần đối chiếu với cha và với mẹ; không chọn năm chỉ thuận một phía.",
      "Khoảng năm tối đa 20 năm giúp so sánh có giới hạn, không tạo hàng loạt trang năm mỏng.",
      "Sức khỏe, tuổi sinh sản và tư vấn chuyên môn phải được ưu tiên trước yếu tố hợp tuổi.",
    ],
    example: "Ví dụ: một năm có Nạp âm sinh cho mẹ nhưng Địa Chi xung với cha. Công cụ giữ nguyên hai tín hiệu đó để gia đình tự cân nhắc trong bối cảnh thực tế.",
    faqs: [
      { question: "Năm sinh con được tính theo năm dương hay âm lịch?", answer: "Hồ sơ tuổi dùng năm âm lịch. Với em bé sinh quanh Tết, Can Chi có thể vẫn thuộc năm âm lịch trước, vì vậy ngày sinh thực tế mới quyết định chính xác." },
      { question: "Có năm nào hợp tuyệt đối với cả cha mẹ không?", answer: "Không nên hiểu kết quả theo hướng tuyệt đối. Mỗi năm có thể đồng thời có lớp thuận, trung tính và lớp cần cân nhắc." },
      { question: "Kết quả này có thay cho tư vấn sinh sản không?", answer: "Không. Công cụ chỉ trình bày quan niệm tuổi truyền thống và không đưa ra dự báo hay chỉ dẫn y khoa." },
    ],
    related: ["vo-chong", "ket-hon"],
    cta: { href: "/?source=xem_tuoi_sinh_con#lap-la-so", label: "Lập lá số cha mẹ", description: "Xem bối cảnh gia đình trên từng lá số thay vì chỉ xét năm sinh." },
  },
  {
    slug: "ket-hon",
    label: "Xem tuổi kết hôn",
    shortDescription: "So sánh các năm cưới theo tuổi mụ, Kim Lâu, Tam Tai và Thái Tuế.",
    title: "Xem tuổi kết hôn, chọn năm cưới phù hợp",
    description: "Tra cứu năm kết hôn theo tuổi mụ, Kim Lâu, Tam Tai và quan hệ Thái Tuế; xem công thức và lý do của từng năm.",
    heading: "Xem năm kết hôn theo tuổi",
    intro: "Khác với công cụ vợ chồng, trang này không so hai người mà rà các năm dự kiến tổ chức hôn lễ cho một người. Kết quả dùng tuổi mụ và các hạn dân gian phổ biến, có giải thích công thức ngay trong từng năm.",
    method: [
      "Tính tuổi mụ bằng năm dự kiến trừ năm sinh âm lịch cộng một.",
      "Kiểm tra Kim Lâu theo số dư 1, 3, 6, 8 khi chia tuổi mụ cho 9.",
      "Kiểm tra Tam Tai và hai trường hợp Thái Tuế có thể xác định rõ bằng Địa Chi: đồng chi và lục xung với năm.",
    ],
    readingTips: [
      "Năm ít cảnh báo được đưa lên trước, nhưng toàn bộ năm trong khoảng vẫn được hiển thị.",
      "Không tự suy rộng sang các hệ sao Thái Tuế phức tạp khi công cụ không có đủ tháng, ngày và giờ.",
      "Sau khi chọn khoảng năm, nên xem tiếp ngày cưới phù hợp với điều kiện hai gia đình.",
    ],
    example: "Ví dụ: tuổi mụ 28 chia 9 dư 1 được ghi Kim Lâu Thân. Công cụ hiển thị phép tính này, cùng trạng thái Tam Tai và quan hệ Địa Chi với năm.",
    faqs: [
      { question: "Xem tuổi kết hôn khác xem tuổi vợ chồng thế nào?", answer: "Xem tuổi vợ chồng đối chiếu hai người. Xem tuổi kết hôn rà các năm dự kiến cưới cho một người theo tuổi mụ và hạn của năm." },
      { question: "Kim Lâu được tính ra sao?", answer: "Tuổi mụ chia 9; các số dư 1, 3, 6 và 8 lần lượt được gọi là Kim Lâu Thân, Thê, Tử và Súc trong cách tính dân gian phổ biến." },
      { question: "Phạm một tiêu chí có bắt buộc hoãn cưới không?", answer: "Không. Công cụ không đưa ra mệnh lệnh hay kết luận bắt buộc; gia đình cần cân nhắc hoàn cảnh, pháp lý, sức khỏe và sự đồng thuận thực tế." },
    ],
    related: ["vo-chong", "sinh-con"],
    cta: { href: "/xem-ngay/cuoi-hoi", label: "Xem ngày cưới hỏi", description: "Sau khi tham khảo năm, tra cứu ngày cưới hỏi trong lịch ngày." },
  },
  {
    slug: "lam-an",
    label: "Xem tuổi làm ăn",
    shortDescription: "Đối chiếu tuổi hai người khi hợp tác theo Nạp âm và Can Chi.",
    title: "Xem tuổi làm ăn, hợp tác kinh doanh",
    description: "Xem tuổi làm ăn giữa hai người theo Nạp âm Ngũ hành, Thiên Can và Địa Chi; kết quả tham khảo, không dự báo lợi nhuận.",
    heading: "Xem tuổi hợp tác làm ăn",
    intro: "Công cụ đối chiếu ba lớp tuổi truyền thống giữa hai người dự định hợp tác. Vì hiệu quả kinh doanh phụ thuộc năng lực, pháp lý, tài chính và cách quản trị, kết quả không dự báo doanh thu hay bảo đảm thành công.",
    method: [
      "Đổi ngày sinh của hai người sang năm âm lịch và xác định Nạp âm.",
      "Đối chiếu quan hệ sinh khắc Ngũ hành, cặp Thiên Can tương hợp và quan hệ Địa Chi.",
      "Không dùng giới tính hoặc Cung Phi cho bài toán hợp tác làm ăn.",
    ],
    readingTips: [
      "Xem tiêu chí như một góc tham khảo về cách phối hợp, không phải thẩm định đối tác.",
      "Luôn kiểm tra hợp đồng, quyền hạn, dòng tiền và cơ chế giải quyết tranh chấp.",
      "Không chuyển tiền hoặc đầu tư chỉ vì kết quả tuổi được xếp nhiều điểm thuận.",
    ],
    example: "Ví dụ: hai tuổi có Thiên Can tương hợp nhưng Nạp âm tương khắc. Công cụ trình bày cả hai lớp và giữ kết luận ở mức cần cân nhắc, không phán chắc lời lỗ.",
    faqs: [
      { question: "Xem tuổi làm ăn có dùng Cung Phi không?", answer: "Không trong công cụ này. Cung Phi gắn nhiều hơn với hướng và bát trạch; bài toán hợp tác chỉ dùng Nạp âm, Thiên Can và Địa Chi." },
      { question: "Tuổi không hợp có nên từ chối đối tác?", answer: "Không nên quyết định chỉ bằng tuổi. Hồ sơ pháp lý, uy tín, năng lực, vốn và điều khoản hợp đồng mới là căn cứ thực tế quan trọng." },
      { question: "Kết quả có dự báo lợi nhuận không?", answer: "Không. Công cụ không tính doanh thu, rủi ro thị trường hoặc khả năng thực hiện và tuyệt đối không bảo đảm lợi nhuận." },
    ],
    related: ["xong-dat", "lam-nha"],
    cta: { href: "/xem-ngay?mode=finder&task=contract#date-finder", label: "Xem ngày ký kết", description: "Tra cứu ngày phù hợp cho ký kết sau khi đã hoàn tất thẩm định thực tế." },
  },
  {
    slug: "lam-nha",
    label: "Xem tuổi làm nhà",
    shortDescription: "Rà năm làm nhà theo Tam Tai, Kim Lâu và Hoang Ốc.",
    title: "Xem tuổi làm nhà theo Tam Tai, Kim Lâu, Hoang Ốc",
    description: "Tra cứu năm làm nhà theo tuổi mụ, Tam Tai, Kim Lâu và Hoang Ốc; hiển thị rõ công thức của từng năm, không bán hóa giải.",
    heading: "Xem năm làm nhà theo tuổi gia chủ",
    intro: "Công cụ rà ba tiêu chí dân gian thường dùng khi chọn năm động thổ: Tam Tai, Kim Lâu và Hoang Ốc. Mỗi năm đều hiển thị tuổi mụ, số dư Kim Lâu và cung Hoang Ốc để người đọc tự kiểm tra.",
    method: [
      "Tính tuổi mụ của gia chủ cho từng năm trong khoảng lựa chọn.",
      "Kiểm tra Tam Tai theo bốn nhóm Tam Hợp và Kim Lâu theo số dư khi chia tuổi mụ cho 9.",
      "Chạy vòng sáu cung Hoang Ốc từ Nhất Cát đến Lục Hoang Ốc, rồi ưu tiên năm ít cảnh báo chính hơn.",
    ],
    readingTips: [
      "Kết quả chỉ xét năm; ngày động thổ cần được tra cứu riêng sau đó.",
      "Không có đề xuất mua vật phẩm, cúng giải hay cam kết hóa giải hạn.",
      "Pháp lý đất, thiết kế, ngân sách và an toàn thi công phải được giải quyết trước yếu tố tuổi.",
    ],
    example: "Ví dụ: gia chủ 31 tuổi mụ vào cung Tứ Tấn Tài. Kết quả vẫn kiểm tra độc lập Tam Tai và Kim Lâu, không dùng một cung thuận để xóa các cảnh báo khác.",
    faqs: [
      { question: "Hoang Ốc được tính như thế nào?", answer: "Công cụ chạy vòng sáu cung theo tuổi mụ: Nhất Cát, Nhì Nghi, Tam Địa Sát, Tứ Tấn Tài, Ngũ Thọ Tử, Lục Hoang Ốc; đến 70 tuổi quay lại Nhất Cát." },
      { question: "Năm không phạm cả ba tiêu chí có chắc làm nhà thuận lợi?", answer: "Không. Đây chỉ là lớp tham khảo phong tục; tiến độ thực tế còn phụ thuộc pháp lý, tài chính, thiết kế, nhà thầu, thời tiết và an toàn." },
      { question: "Công cụ có hướng dẫn mượn tuổi không?", answer: "Không tự động đề xuất mượn tuổi vì đây là quyết định gia đình có nhiều điều kiện thực tế. Kết quả chỉ minh bạch ba phép kiểm tra cho gia chủ đã nhập." },
    ],
    related: ["xong-dat", "lam-an"],
    cta: { href: "/xem-ngay/dong-tho", label: "Xem ngày động thổ", description: "Sau khi tham khảo năm, tra cứu ngày động thổ phù hợp." },
  },
];

export const AGE_TOOL_LINKS = AGE_TOOL_PAGES.map(({ slug, label, shortDescription }) => ({
  slug,
  href: `/xem-tuoi/${slug}`,
  label,
  description: shortDescription,
}));

export function getAgeToolPage(slug: string) {
  return AGE_TOOL_PAGES.find((page) => page.slug === slug);
}
