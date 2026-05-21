import { BarChart3, CheckCircle2 } from "lucide-react";
import { requestReadingAction } from "@/app/actions";
import { analyzeDate, formatDate, monthDays, toInputDate } from "@/lib/date-fortune";
import type { TuViChart } from "@/lib/chart";
import { FEATURE_PRICES, type ReadingKey } from "@/lib/pricing";
import { formatCoins } from "@/lib/format";

function pseudoScore(seed: number, offset = 0) {
  return 24 + Math.abs(Math.sin(seed * 1.73 + offset) * 68);
}

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

function dateInBangkok(year: number, month: number, day: number) {
  return new Date(`${year}-${pad(month)}-${pad(day)}T12:00:00+07:00`);
}

function OpenButton({
  chartId,
  type,
  scopeKey,
  nextPath,
  label,
}: {
  chartId: string;
  type: ReadingKey;
  scopeKey: string;
  nextPath: string;
  label?: string;
}) {
  const buttonLabel = label || `Mở - ${formatCoins(FEATURE_PRICES[type].priceCoins)}`;

  return (
    <form action={requestReadingAction} data-loading-message="Đang mở phần luận giải..." data-loading-label="Đang mở...">
      <input type="hidden" name="chartId" value={chartId} />
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="scopeKey" value={scopeKey} />
      <input type="hidden" name="next" value={nextPath} />
      <button className="fate-open-button" type="submit">{buttonLabel}</button>
    </form>
  );
}

function TrendBars({ items, currentIndex }: { items: { label: string; good: number; challenge: number }[]; currentIndex?: number }) {
  return (
    <div className="fate-chart">
      <div className="fate-chart-legend">
        <span className="inline-flex items-center gap-1"><i className="bg-emerald-400" /> Tài lộc</span>
        <span className="inline-flex items-center gap-1"><i className="bg-slate-400" /> Thách thức</span>
      </div>
      <div className="fate-bars">
        {items.map((item, index) => (
          <div key={item.label} className="fate-bar-column">
            {currentIndex === index ? <span className="fate-current-line"><b>Chính vận</b></span> : null}
            <div className="fate-bar-pair">
              <span className="good" style={{ height: `${item.good}%` }} />
              <span className="challenge" style={{ height: `${item.challenge}%` }} />
            </div>
            <small className={currentIndex === index ? "active" : ""}>{item.label}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrendArea({ items, currentIndex, markerLabel }: { items: { label: string; good: number; challenge: number }[]; currentIndex?: number; markerLabel?: string }) {
  const pointsA = items.map((item, index) => `${(index / Math.max(1, items.length - 1)) * 100},${100 - item.good}`).join(" ");
  const pointsB = items.map((item, index) => `${(index / Math.max(1, items.length - 1)) * 100},${100 - item.challenge}`).join(" ");
  const markerX = currentIndex === undefined || currentIndex < 0 ? undefined : (currentIndex / Math.max(1, items.length - 1)) * 100;

  return (
    <div className="fate-area-chart">
      <div className="fate-chart-legend">
        <span className="inline-flex items-center gap-1"><i className="bg-emerald-400" /> Tài lộc</span>
        <span className="inline-flex items-center gap-1"><i className="bg-slate-400" /> Thách thức</span>
      </div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="fortuneA" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.62" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0.12" />
          </linearGradient>
          <linearGradient id="fortuneB" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#64748b" stopOpacity="0.58" />
            <stop offset="100%" stopColor="#64748b" stopOpacity="0.08" />
          </linearGradient>
        </defs>
        <polygon points={`0,100 ${pointsB} 100,100`} fill="url(#fortuneB)" />
        <polyline points={pointsB} fill="none" stroke="#64748b" strokeWidth="1.2" />
        <polygon points={`0,100 ${pointsA} 100,100`} fill="url(#fortuneA)" />
        <polyline points={pointsA} fill="none" stroke="#10b981" strokeWidth="1.3" />
        {markerX !== undefined ? <line x1={markerX} x2={markerX} y1="0" y2="100" stroke="#c2410c" strokeWidth="0.6" /> : null}
      </svg>
      {markerX !== undefined ? <span className="fate-area-marker" style={{ left: `${markerX}%` }}>{markerLabel || "Năm nay"}</span> : null}
      <div className="fate-area-axis">
        {items.filter((_, index) => index % Math.max(1, Math.ceil(items.length / 10)) === 0).map((item) => <span key={item.label}>{item.label}</span>)}
      </div>
    </div>
  );
}

function ExplainBox() {
  return (
    <section className="fate-explain">
      <h2>Biểu đồ của bạn nói gì</h2>
      <p>
        Biểu đồ phản ánh những thăng trầm tương quan giữa hai yếu tố “tài lộc” và “thách thức”.
        Có những giai đoạn thuận lợi để mở rộng, có giai đoạn nên ưu tiên giữ nhịp ổn định.
        Đây là lớp định hướng giúp bạn nhìn đường dài rõ hơn trước khi đọc luận giải chi tiết.
      </p>
    </section>
  );
}

const majorTexts = [
  "Giai đoạn này mở ra cơ hội xây nền, học hỏi và kết nối với những người có thể nâng đỡ đường dài.",
  "Trọng tâm chuyển sang phát triển năng lực, giữ kỷ luật và tránh nóng vội trước các lựa chọn lớn.",
  "Đây là giai đoạn chính vận, dễ có trách nhiệm mới và cũng là lúc cần quản trị sức bền tinh thần.",
  "Cần kiên nhẫn với nhịp tăng trưởng chậm, càng rõ kế hoạch càng dễ biến áp lực thành thành quả.",
  "Tài chính và quan hệ xã hội có dấu hiệu mở rộng, nhưng nên tránh đầu tư theo cảm xúc nhất thời.",
  "Phù hợp củng cố nền tảng, chuyển kinh nghiệm thành vị thế và xử lý dứt điểm việc tồn đọng.",
  "Giai đoạn ổn định hơn, tốt cho việc truyền kinh nghiệm, thu gọn rủi ro và chăm sóc sức khỏe.",
];

const palaceDescriptions: Record<string, string> = {
  "Mệnh": "Luận Mệnh - Thân giúp bạn thấu hiểu bản thân một cách sâu sắc, từ gốc rễ bên trong đến hành trình trưởng thành và phát triển trong cuộc sống. Đây là nơi phản ánh khí chất, lối sống, năng lực tự thân và cách bạn ra quyết định ở những bước ngoặt quan trọng.",
  "Tài Bạch": "Luận cung Tài Bạch giúp bạn tìm hiểu cách thức, năng lực kiếm tiền, khả năng quản lý tài chính và cách sử dụng tiền của bản thân. Đây cũng là nơi phản ánh góc nhìn của bạn đối với tiền bạc và các giá trị vật chất trong cuộc sống.",
  "Quan Lộc": "Luận cung Quan Lộc giúp bạn tìm hiểu con đường học tập, thi cử, công danh và sự nghiệp. Cung này cho thấy môi trường công việc phù hợp, cách phát triển vị thế và nhịp thăng tiến theo từng giai đoạn.",
  "Phụ Mẫu": "Luận cung Phụ Mẫu không chỉ giúp bạn hiểu về mối quan hệ giữa cha mẹ với nhau và với bạn, mà còn phản ánh nền nếp gia đình, sự nâng đỡ, kỳ vọng và những ảnh hưởng đầu đời lên quá trình trưởng thành.",
  "Phúc Đức": "Luận cung Phúc Đức giúp bạn tìm hiểu đời sống tinh thần, phúc phần dòng họ và nền tảng nâng đỡ bên trong. Cung này thể hiện mối liên kết gia tộc, khả năng hồi phục và nguồn lực âm thầm phía sau bạn.",
  "Nô Bộc": "Luận cung Nô Bộc giúp bạn hiểu về bạn bè, đồng nghiệp, người cộng tác và cấp dưới. Đây là nơi phản ánh cách bạn xây dựng, duy trì và phát triển các mối quan hệ trong đời sống xã hội và công việc.",
  "Thiên Di": "Luận cung Thiên Di giúp bạn hiểu về bản thân khi bước ra ngoài xã hội, từ thái độ, khả năng ứng xử đến mức độ thuận lợi hay khó khăn khi giao tiếp, di chuyển và mở rộng không gian sống.",
  "Huynh Đệ": "Luận cung Huynh Đệ giúp bạn hiểu mối quan hệ với anh chị em và những người đồng hành thân thiết. Cung này phản ánh sự gắn bó, hỗ trợ, cạnh tranh và chất lượng tương tác trong các mối quan hệ gần.",
  "Điền Trạch": "Luận cung Điền Trạch giúp bạn tìm hiểu nhà cửa, đất đai, tài sản, nền tảng gia đình và khả năng tích lũy chỗ ở. Đây cũng là nơi phản ánh sự ổn định của môi trường sống.",
  "Tử Tức": "Luận cung Tử Tức giúp bạn tìm hiểu vấn đề con cái, khả năng nuôi dưỡng, sáng tạo và những sản phẩm tinh thần bạn để lại trên hành trình của mình.",
  "Phu Thê": "Luận cung Phu Thê giúp bạn hiểu đời sống hôn nhân và người bạn đồng hành, từ tính cách, tài năng, dung mạo đến cách hai người gắn bó và cùng xây dựng mối quan hệ.",
  "Tật Ách": "Luận cung Tật Ách giúp bạn hiểu sức khỏe thể chất và nội tâm, các điểm dễ tổn hao, những căng thẳng tiềm ẩn và bài học cần chú ý để giữ cân bằng trong cuộc sống.",
};

function palaceTitle(name: string) {
  return name === "Mệnh" ? "Cung Mệnh + Thân" : `Cung ${name}`;
}

function palaceScore(chart: TuViChart, index: number) {
  return Math.round(12 + pseudoScore(chart.lunar.day + index * 3, chart.lunar.month) * 0.56);
}

export function PalaceFateView({ chartId, chart }: { chartId: string; chart: TuViChart }) {
  const preferredOrder = ["Mệnh", "Tài Bạch", "Quan Lộc", "Phụ Mẫu", "Phúc Đức", "Nô Bộc", "Thiên Di", "Huynh Đệ", "Điền Trạch", "Tử Tức", "Phu Thê", "Tật Ách"];
  const palaces = preferredOrder
    .map((name) => chart.palaces.find((palace) => palace.name === name))
    .filter(Boolean) as TuViChart["palaces"];

  return (
    <section className="fate-page">
      <h1>Luận cung lá số {chart.input.fullName}</h1>
      <div className="fate-list">
        {palaces.map((palace, index) => (
          <article key={palace.name} className="fate-row palace-reading-row">
            <div>
              <h2>
                <span className="fate-score">{palaceScore(chart, index)}</span>
                {palaceTitle(palace.name)}
              </h2>
              <p>{palaceDescriptions[palace.name] || "Luận cung này giúp bạn nhìn rõ một lĩnh vực quan trọng trong đời sống, từ nền tảng, cơ hội đến các điểm cần thận trọng khi ra quyết định."}</p>
            </div>
            <OpenButton chartId={chartId} type="PALACE" scopeKey={palace.name} nextPath={`/la-so/${chartId}?view=luan-cung`} />
          </article>
        ))}
      </div>
      <div className="fate-pager fate-next-actions">
        <span>‹</span>
        <a href={`/la-so/${chartId}?view=dai-van`}>Xem đại vận ›</a>
      </div>
    </section>
  );
}

export function MajorFateView({ chartId, chart }: { chartId: string; chart: TuViChart }) {
  const currentAge = Math.max(1, chart.input.viewYear - (chart.solar?.year || chart.input.year));
  const items = chart.daiVan.slice(0, 10).map((item, index) => ({
    label: item.range,
    good: pseudoScore(index + chart.lunar.day, 0),
    challenge: pseudoScore(index + chart.lunar.month, 2.5),
  }));
  const currentIndex = chart.daiVan.findIndex((item) => {
    const [start, end] = item.range.split("-").map(Number);
    return currentAge >= start && currentAge <= end;
  });

  return (
    <section className="fate-page">
      <h1>Đại vận của {chart.input.fullName}</h1>
      <span className="fate-kicker">Biểu đồ xu hướng đại vận</span>
      <TrendBars items={items} currentIndex={currentIndex === -1 ? undefined : currentIndex} />
      <ExplainBox />
      <div className="fate-list">
        {chart.daiVan.slice(0, 10).map((period, index) => (
          <article key={`${period.palace}-${period.range}`} className="fate-row">
            <div>
              <h2>
                <span className="fate-token" /> Đại vận {period.range} tuổi
                {index === currentIndex ? <b>Chính vận</b> : null}
              </h2>
              <p>{majorTexts[index % majorTexts.length]}</p>
            </div>
            <OpenButton chartId={chartId} type="DAI_VAN" scopeKey={period.range} nextPath={`/la-so/${chartId}?view=dai-van`} />
          </article>
        ))}
      </div>
    </section>
  );
}

export function MinorFateView({ chartId, chart }: { chartId: string; chart: TuViChart }) {
  const birthYear = chart.solar?.year || chart.input.year;
  const startAge = Math.max(1, chart.input.viewYear - birthYear - 8);
  const items = Array.from({ length: 25 }, (_, index) => {
    const age = startAge + index;
    return {
      age,
      year: birthYear + age,
      good: pseudoScore(age, 1),
      challenge: pseudoScore(age, 3),
    };
  });
  const currentIndex = items.findIndex((item) => item.year === chart.input.viewYear);

  return (
    <section className="fate-page">
      <h1>Tiểu vận của {chart.input.fullName}</h1>
      <span className="fate-kicker">Biểu đồ xu hướng tiểu vận</span>
      <TrendArea items={items.map((item) => ({ label: String(item.age), good: item.good, challenge: item.challenge }))} currentIndex={currentIndex} markerLabel="Năm nay" />
      <ExplainBox />
      <div className="fate-list">
        {items.slice(0, 10).map((item) => (
          <article key={item.year} className="fate-row">
            <div>
              <h2>
                <span className="fate-token" /> Tiểu vận {item.age} tuổi ({item.year})
                {item.year === chart.input.viewYear ? <b>Năm nay</b> : null}
              </h2>
              <p>{item.good > item.challenge ? "Năm này có nhiều điểm thuận lợi, dễ gặt hái thành quả nếu giữ được nhịp làm việc bền bỉ." : "Cần thận trọng hơn trong quyết định, ưu tiên sức khỏe và tránh để áp lực kéo dài."}</p>
            </div>
            <OpenButton chartId={chartId} type="DAI_VAN" scopeKey={`tieu-${item.year}`} nextPath={`/la-so/${chartId}?view=tieu-van`} />
          </article>
        ))}
      </div>
      <div className="fate-pager"><span>‹</span><b>1</b><b>2</b><b className="active">3</b><b>4</b><b>5</b><span>›</span></div>
    </section>
  );
}

const monthNames = ["Tháng Giêng", "Tháng Hai", "Tháng Ba", "Tháng Tư", "Tháng Năm", "Tháng Sáu", "Tháng Bảy", "Tháng Tám", "Tháng Chín", "Tháng Mười", "Tháng Mười Một", "Tháng Chạp"];

export function MonthlyFateView({ chartId, chart }: { chartId: string; chart: TuViChart }) {
  const months = monthNames.map((name, index) => {
    const start = dateInBangkok(chart.input.viewYear, index + 1, 17);
    const end = dateInBangkok(index === 11 ? chart.input.viewYear + 1 : chart.input.viewYear, index === 11 ? 1 : index + 2, 16);
    return {
      name,
      range: `${formatDate(start)} - ${formatDate(end)}`,
      good: pseudoScore(index + chart.lunar.day, 0.4),
    };
  });

  return (
    <section className="fate-page narrow">
      <h1>Nguyệt vận của {chart.input.fullName} năm {chart.input.viewYear}</h1>
      <div className="fate-list">
        {months.map((month) => (
          <article key={month.name} className="fate-row">
            <div>
              <h2><span className="fate-token" /> {month.name}</h2>
              <small>DL: {month.range}</small>
              <p>{month.good > 58 ? "Tháng này mọi việc hanh thông hơn, thuận lợi cho tài lộc, giao tiếp và những kế hoạch đã chuẩn bị kỹ." : "Tháng này cần cẩn trọng hơn với áp lực và những thay đổi bất ngờ, nên giữ nhịp ổn định."}</p>
            </div>
            <OpenButton chartId={chartId} type="NGUYET_VAN" scopeKey={month.name} nextPath={`/la-so/${chartId}?view=nguyet-van`} />
          </article>
        ))}
      </div>
    </section>
  );
}

function DailyPlans() {
  const plans = [
    { title: "Gói tuần", price: "59.000đ", note: "Dành cho học sinh/sinh viên" },
    { title: "Gói tháng", price: "219.000đ", note: "Tối ưu nhất dành cho bạn", popular: true },
    { title: "Gói năm", price: "2.099.000đ", note: "Dành cho người kinh doanh, lãnh đạo..." },
  ];

  return (
    <section className="fate-plans" aria-label="Gói xem ngày và tử vi">
      <h2>Mở khóa trải nghiệm xem ngày & tử vi đầy đủ</h2>
      <p>Truy cập toàn bộ ngày tốt xấu, giờ hoàng đạo và luận giải chi tiết với một gói phù hợp.</p>
      <div>
        {plans.map((plan) => (
          <article key={plan.title} className={plan.popular ? "fate-plan-card popular" : "fate-plan-card"}>
            {plan.popular ? <span>Phổ biến nhất</span> : null}
            <h3>{plan.title}</h3>
            <strong>{plan.price}</strong>
            <em>{plan.note}</em>
            <ul>
              <li><CheckCircle2 size={15} /> Thông tin của ngày</li>
              <li><CheckCircle2 size={15} /> Phân tích Nhật vận Tử Vi</li>
              <li><CheckCircle2 size={15} /> Lời khuyên theo bát tự hạ lạc</li>
              <li><CheckCircle2 size={15} /> Nhắc nhở, thông báo Nhật hạn</li>
            </ul>
            <button type="button">Đăng ký ngay</button>
          </article>
        ))}
      </div>
    </section>
  );
}

export function DailyFateView({ chartId, chart }: { chartId: string; chart: TuViChart }) {
  const now = new Date();
  const selected = analyzeDate(dateInBangkok(chart.input.viewYear, now.getMonth() + 1, now.getDate()));
  const days = monthDays(selected.solar.year, selected.solar.month).map((day) => ({
    label: String(day.solar.day),
    good: day.score,
    challenge: 100 - day.score * 0.72,
  }));

  return (
    <section className="fate-page narrow">
      <h1>Nhật vận</h1>
      <div className="fate-daily-chart">
        <h2><BarChart3 size={19} /> Biểu đồ xu hướng nhật vận tháng {selected.solar.month}, năm {selected.solar.year}</h2>
        <TrendArea items={days} currentIndex={selected.solar.day - 1} markerLabel={String(selected.solar.day)} />
      </div>

      <section className="fate-day-card">
        <div>
          <p>{selected.weekday}</p>
          <strong>{selected.solar.day}</strong>
          <span>Tháng {selected.solar.month} năm {selected.solar.year}</span>
        </div>
        <div className="fortune-gauge grid h-36 w-36 place-items-center rounded-full p-3" style={{ background: `conic-gradient(#34d399 ${selected.score * 3.6}deg, #bbf7d0 ${selected.score * 3.6}deg)` }}>
          <div className="grid h-full w-full place-items-center rounded-full bg-white/95 text-center shadow-inner">
            <strong className="text-4xl font-black text-emerald-600">{selected.score}<span className="text-xl">%</span></strong>
          </div>
        </div>
        <div>
          <p className="text-rose-600">Ngày sinh Chủ tịch Hồ Chí Minh</p>
          <span className="tag">Ngày {selected.status.label}</span>
          <strong>{selected.canChi.day}</strong>
        </div>
      </section>

      <section className="fate-premium-box">
        <h2>Tránh rủi ro, đón tài lộc: Giải mã ngày {selected.solar.day}/{selected.solar.month}/{selected.solar.year} được cá nhân hóa cho bạn</h2>
        <p>Lịch vạn niên chỉ nói cho số đông, nhưng dữ liệu Tử Vi sẽ nói cho riêng bạn. Hệ thống đã sẵn sàng đối chiếu năng lượng ngày hôm nay với lá số của bạn.</p>
        <ul>
          <li>✨ Tọa độ Cát Hung: mức độ hợp/khắc của ngày với lá số.</li>
          <li>🛡️ Cảnh báo Nhật Hạn: rủi ro thị phi, hao tài, tổn sức.</li>
          <li>🧭 Khung giờ cá nhân: giờ kích hoạt may mắn theo Mệnh và Thân.</li>
        </ul>
        <OpenButton chartId={chartId} type="NHAT_VAN" scopeKey={toInputDate(selected.date)} nextPath={`/la-so/${chartId}?view=nhat-van`} />
      </section>

      <DailyPlans />
    </section>
  );
}
