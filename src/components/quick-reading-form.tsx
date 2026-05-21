import { Mail, ShieldCheck, Sparkles } from "lucide-react";
import { quickReadingCheckoutAction } from "@/app/actions";
import { FEATURE_PRICES } from "@/lib/pricing";
import { formatVnd } from "@/lib/format";

export function QuickReadingForm() {
  const now = new Date();
  const price = FEATURE_PRICES.FULL.priceCoins * 1000;

  return (
    <section id="mua-nhanh" className="quick-reading-panel">
      <div className="quick-reading-copy">
        <p className="eyebrow">Mua nhanh qua email</p>
        <h2>Không cần đăng ký trước, vẫn lưu được bản luận giải</h2>
        <p>
          Nhập thông tin lá số và email nhận kết quả. Hệ thống tạo tài khoản ngầm bằng email đó, mở kết quả ngay sau thanh toán và bạn có thể đặt mật khẩu sau.
        </p>
        <div className="quick-reading-points">
          <span><Mail size={16} /> Email dùng để lưu và nhận link kết quả</span>
          <span><ShieldCheck size={16} /> Thanh toán xong xem lại trong lịch sử</span>
          <span><Sparkles size={16} /> Bản toàn bộ {formatVnd(price)}</span>
        </div>
      </div>

      <form action={quickReadingCheckoutAction} className="quick-reading-form">
        <div className="form-grid">
          <label className="md:col-span-2">
            <span>Email nhận kết quả</span>
            <input name="email" type="email" placeholder="ban@email.com" required />
          </label>
          <label className="md:col-span-2">
            <span>Họ và tên</span>
            <input name="fullName" placeholder="Nguyễn Minh Anh" required />
          </label>
          <label>
            <span>Giới tính</span>
            <select name="gender" defaultValue="male">
              <option value="male">Nam giới</option>
              <option value="female">Nữ giới</option>
            </select>
          </label>
          <label>
            <span>Lịch sinh</span>
            <select name="calendarType" defaultValue="solar">
              <option value="solar">Dương lịch</option>
              <option value="lunar">Âm lịch</option>
            </select>
          </label>
          <label>
            <span>Ngày</span>
            <input name="day" type="number" min="1" max="31" defaultValue="1" required />
          </label>
          <label>
            <span>Tháng</span>
            <input name="month" type="number" min="1" max="12" defaultValue="1" required />
          </label>
          <label>
            <span>Năm sinh</span>
            <input name="year" type="number" min="1900" max={now.getFullYear()} defaultValue="1990" required />
          </label>
          <label>
            <span>Giờ sinh</span>
            <select name="birthHour" defaultValue="0">
              <option value="0">23:00-00:59 (Tý)</option>
              <option value="2">01:00-02:59 (Sửu)</option>
              <option value="4">03:00-04:59 (Dần)</option>
              <option value="6">05:00-06:59 (Mão)</option>
              <option value="8">07:00-08:59 (Thìn)</option>
              <option value="10">09:00-10:59 (Tỵ)</option>
              <option value="12">11:00-12:59 (Ngọ)</option>
              <option value="14">13:00-14:59 (Mùi)</option>
              <option value="16">15:00-16:59 (Thân)</option>
              <option value="18">17:00-18:59 (Dậu)</option>
              <option value="20">19:00-20:59 (Tuất)</option>
              <option value="22">21:00-22:59 (Hợi)</option>
            </select>
          </label>
          <label>
            <span>Phút sinh</span>
            <input name="birthMinute" type="number" min="0" max="59" defaultValue="0" required />
          </label>
          <label>
            <span>Năm xem</span>
            <input name="viewYear" type="number" min="1900" max="2100" defaultValue={now.getFullYear()} required />
          </label>
        </div>
        <button className="btn btn-primary w-full text-base" type="submit">
          Mua luận giải toàn bộ - {formatVnd(price)}
        </button>
        <p className="text-center text-xs text-stone-500">
          Bạn không cần tạo mật khẩu ở bước này. Sau khi mua, tài khoản sẽ được gắn với email trên.
        </p>
      </form>
    </section>
  );
}
