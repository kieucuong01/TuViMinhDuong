import { createChartAction } from "@/app/actions";
import { LoadingSubmitButton } from "@/components/loading-submit-button";
import { Sparkles } from "lucide-react";

export function ChartForm({ compact = false }: { compact?: boolean }) {
  const now = new Date();

  return (
    <form
      action={createChartAction}
      className={compact ? "chart-form compact" : "chart-form"}
      data-testid="chart-form"
      data-loading-message="Đang lập lá số..."
      data-loading-label="Đang lập lá số..."
    >
      <div className="form-grid">
        <label className="chart-name-field md:col-span-2">
          <span>Họ và tên</span>
          <input name="fullName" placeholder="Ví dụ: Nguyễn Minh Anh" required data-testid="chart-full-name" />
        </label>

        <label>
          <span>Giới tính</span>
          <select name="gender" defaultValue="male" data-testid="chart-gender">
            <option value="male">Nam giới</option>
            <option value="female">Nữ giới</option>
          </select>
        </label>

        <label>
          <span>Lịch sinh</span>
          <select name="calendarType" defaultValue="solar" data-testid="chart-calendar-type">
            <option value="solar">Dương lịch</option>
            <option value="lunar">Âm lịch</option>
          </select>
        </label>

        <fieldset className="birth-date-group chart-birth-field md:col-span-2">
          <legend>Ngày sinh</legend>
          <div className="birth-date-grid">
            <label>
              <span>Ngày</span>
              <input name="day" type="number" inputMode="numeric" min="1" max="31" defaultValue="1" required data-testid="chart-day" />
            </label>
            <label>
              <span>Tháng</span>
              <input name="month" type="number" inputMode="numeric" min="1" max="12" defaultValue="1" required data-testid="chart-month" />
            </label>
            <label>
              <span>Năm</span>
              <input name="year" type="number" inputMode="numeric" min="1900" max={now.getFullYear()} defaultValue="1990" required data-testid="chart-year" />
            </label>
          </div>
        </fieldset>

        <label>
          <span>Giờ sinh</span>
          <select name="birthHour" defaultValue="0" data-testid="chart-birth-hour">
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
          <input name="viewYear" type="number" inputMode="numeric" min="1900" max="2100" defaultValue={now.getFullYear()} required data-testid="chart-view-year" />
        </label>
      </div>

      <LoadingSubmitButton className="btn btn-primary btn-large w-full" loadingText="Đang lập lá số...">
        <Sparkles size={19} /> An Lá Số Tử Vi
      </LoadingSubmitButton>
      <p className="text-center text-sm leading-6 text-stone-500">
        Chỉ cần chọn đúng khung giờ sinh. Nếu không chắc, hãy chọn khung giờ gần nhất.
      </p>
    </form>
  );
}
