import { createChartAction } from "@/app/actions";
import { LoadingSubmitButton } from "@/components/loading-submit-button";
import { Sparkles } from "lucide-react";

const days = Array.from({ length: 31 }, (_, index) => index + 1);
const months = Array.from({ length: 12 }, (_, index) => index + 1);

function descendingYears(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, index) => end - index);
}

export function ChartForm({ compact = false }: { compact?: boolean }) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const birthYears = descendingYears(1900, currentYear);
  const viewYears = descendingYears(1900, 2100);

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
          <span className="chart-field-label">Họ và tên</span>
          <span className="chart-name-control">
            <input name="fullName" placeholder="Ví dụ: Nguyễn Minh Anh" required data-testid="chart-full-name" />
            <em>Thông tin bắt buộc</em>
          </span>
        </label>

        <fieldset className="birth-date-group chart-birth-field md:col-span-2">
          <legend>Ngày sinh</legend>
          <div className="birth-date-grid">
            <label>
              <span>Ngày</span>
              <select name="day" defaultValue="1" required data-testid="chart-day">
                {days.map((day) => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Tháng</span>
              <select name="month" defaultValue="1" required data-testid="chart-month">
                {months.map((month) => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Năm</span>
              <select name="year" defaultValue="1990" required data-testid="chart-year">
                {birthYears.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Lịch</span>
              <select name="calendarType" defaultValue="solar" data-testid="chart-calendar-type">
                <option value="solar">Dương lịch</option>
                <option value="lunar">Âm lịch</option>
              </select>
            </label>
          </div>
        </fieldset>

        <label className="chart-hour-field md:col-span-2">
          <span>Giờ sinh</span>
          <select name="birthHour" defaultValue="0" data-testid="chart-birth-hour">
            <option value="0">Tý: 23h - 1h</option>
            <option value="2">Sửu: 1h - 3h</option>
            <option value="4">Dần: 3h - 5h</option>
            <option value="6">Mão: 5h - 7h</option>
            <option value="8">Thìn: 7h - 9h</option>
            <option value="10">Tỵ: 9h - 11h</option>
            <option value="12">Ngọ: 11h - 13h</option>
            <option value="14">Mùi: 13h - 15h</option>
            <option value="16">Thân: 15h - 17h</option>
            <option value="18">Dậu: 17h - 19h</option>
            <option value="20">Tuất: 19h - 21h</option>
            <option value="22">Hợi: 21h - 23h</option>
          </select>
        </label>

        <label>
          <span>Giới tính</span>
          <select name="gender" defaultValue="male" data-testid="chart-gender">
            <option value="male">Nam giới</option>
            <option value="female">Nữ giới</option>
          </select>
        </label>

        <label>
          <span>Năm xem</span>
          <select name="viewYear" defaultValue={currentYear} required data-testid="chart-view-year">
            {viewYears.map((year) => (
              <option key={year} value={year}>Năm xem {year}</option>
            ))}
          </select>
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
