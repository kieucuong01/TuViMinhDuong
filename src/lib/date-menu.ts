export type DateMenuIcon =
  | "calendar"
  | "heart"
  | "hammer"
  | "map"
  | "home"
  | "car"
  | "flower"
  | "gift"
  | "ghost"
  | "tree"
  | "moon";

export type DateMenuLink = {
  href: string;
  label: string;
  icon: DateMenuIcon;
  description?: string;
};

export const dateTaskMenuLinks: DateMenuLink[] = [
  { href: "/xem-ngay", label: "Xem ngày tốt xấu", icon: "calendar", description: "Xem chi tiết một ngày" },
  { href: "/xem-ngay/cuoi-hoi", label: "Xem ngày kết hôn", icon: "heart", description: "Lọc ngày cưới hỏi" },
  { href: "/xem-ngay/dong-tho", label: "Xem ngày động thổ", icon: "hammer", description: "Lọc ngày khởi công" },
  { href: "/xem-ngay?mode=finder&task=travel#date-finder", label: "Xem ngày xuất hành", icon: "map", description: "Lọc ngày đi xa" },
  { href: "/xem-ngay?mode=finder&task=houseMoving#date-finder", label: "Xem ngày nhập trạch", icon: "home", description: "Lọc ngày về nhà mới" },
  { href: "/xem-ngay?mode=finder&task=vehiclePurchase#date-finder", label: "Xem ngày mua xe", icon: "car", description: "Lọc ngày mua, nhận xe" },
  { href: "/xem-ngay?mode=finder&task=funeral#date-finder", label: "Xem ngày an táng", icon: "flower", description: "Lọc ngày việc hiếu sự" },
];

export const dateCountdownMenuLinks: DateMenuLink[] = [
  { href: "/xem-ngay/bao-nhieu-ngay-nua-den-tet", label: "Bao nhiêu ngày nữa đến Tết", icon: "gift" },
  { href: "/xem-ngay/bao-nhieu-ngay-nua-den-halloween", label: "Bao nhiêu ngày nữa đến Halloween", icon: "ghost" },
  { href: "/xem-ngay/bao-nhieu-ngay-nua-den-giang-sinh", label: "Bao nhiêu ngày nữa đến Giáng sinh", icon: "tree" },
  { href: "/xem-ngay/bao-nhieu-ngay-nua-den-trung-thu", label: "Bao nhiêu ngày nữa đến Trung thu", icon: "moon" },
];
