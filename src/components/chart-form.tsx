import { createChartAction } from "@/app/actions";

export function ChartForm({ compact = false }: { compact?: boolean }) {
  const now = new Date();

  return (
    <form action={createChartAction} className={compact ? "chart-form compact" : "chart-form"}>
      <div className="form-grid">
        <label>
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
        Xem lá số
      </button>
      <p className="text-center text-xs text-stone-500">
        Giờ Tý 23:00-00:59 theo quy ước phổ thông Việt Nam.
      </p>
    </form>
  );
}
