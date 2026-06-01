import { Mail, ShieldCheck, Sparkles } from "lucide-react";
import { quickReadingCheckoutAction } from "@/app/actions";
import { LoadingSubmitButton } from "@/components/loading-submit-button";

export function QuickReadingForm() {
  const now = new Date();

  return (
    <section id="luan-giai-nhanh" className="quick-reading-panel">
      <div className="quick-reading-copy">
        <p className="eyebrow">Luận giải nhanh qua email</p>
        <h2>Nhập email để nhận bản luận giải đầy đủ</h2>
        <p>
          Phù hợp khi bạn muốn đi thẳng tới phần đọc sâu mà chưa cần tạo tài khoản trước. Email dùng để lưu lá số và xem lại kết quả sau này.
        </p>
        <div className="quick-reading-points">
          <span><Mail size={17} /> Email dùng để lưu kết quả</span>
          <span><ShieldCheck size={17} /> Nội dung đã mở được lưu để xem lại</span>
          <span><Sparkles size={17} /> Bản đọc sâu, trình bày theo từng mục</span>
        </div>
      </div>

      <form
        action={quickReadingCheckoutAction}
        className="quick-reading-form"
        data-loading-message="Đang chuẩn bị bản luận giải..."
        data-loading-label="Đang chuẩn bị..."
      >
        <div className="form-grid">
          <label className="md:col-span-2">
            <span>Email nhận kết quả</span>
            <input name="email" type="email" placeholder="ban@email.com" required />
          </label>
          <label className="md:col-span-2">
            <span>Họ và tên</span>
            <input name="fullName" placeholder="Ví dụ: Nguyễn Minh Anh" required />
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

          <fieldset className="birth-date-group md:col-span-2">
            <legend>Ngày sinh</legend>
            <div className="birth-date-grid">
              <label>
                <span>Ngày</span>
                <input name="day" type="number" inputMode="numeric" min="1" max="31" defaultValue="1" required />
              </label>
              <label>
                <span>Tháng</span>
                <input name="month" type="number" inputMode="numeric" min="1" max="12" defaultValue="1" required />
              </label>
              <label>
                <span>Năm</span>
                <input name="year" type="number" inputMode="numeric" min="1900" max={now.getFullYear()} defaultValue="1990" required />
              </label>
            </div>
          </fieldset>

          <label>
            <span>Giờ sinh</span>
            <select name="birthHour" defaultValue="0">
              <option value="0">Tý: 23h - 00h59</option>
              <option value="2">Sửu: 01h - 02h59</option>
              <option value="4">Dần: 03h - 04h59</option>
              <option value="6">Mão: 05h - 06h59</option>
              <option value="8">Thìn: 07h - 08h59</option>
              <option value="10">Tỵ: 09h - 10h59</option>
              <option value="12">Ngọ: 11h - 12h59</option>
              <option value="14">Mùi: 13h - 14h59</option>
              <option value="16">Thân: 15h - 16h59</option>
              <option value="18">Dậu: 17h - 18h59</option>
              <option value="20">Tuất: 19h - 20h59</option>
              <option value="22">Hợi: 21h - 22h59</option>
            </select>
          </label>

          <label>
            <span>Năm muốn xem</span>
            <input name="viewYear" type="number" inputMode="numeric" min="1900" max="2100" defaultValue={now.getFullYear()} required />
          </label>
        </div>
        <LoadingSubmitButton className="btn btn-primary btn-large w-full" loadingText="Đang chuẩn bị...">
          Nhận luận giải toàn bộ
        </LoadingSubmitButton>
        <p className="text-center text-sm leading-6 text-stone-500">
          Sau khi hoàn tất, bạn có thể đăng nhập bằng email này để xem lại.
        </p>
      </form>
    </section>
  );
}
