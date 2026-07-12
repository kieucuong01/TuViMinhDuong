"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Clock3, GitCompareArrows, Sparkles, TriangleAlert } from "lucide-react";
import { createChartAction } from "@/app/actions";
import { LoadingSubmitButton } from "@/components/loading-submit-button";
import { compareBirthHours, type BirthHourCandidate, type BirthHourComparisonResult } from "@/lib/birth-hour-comparison";
import { trackOrganicToolEvent } from "@/lib/client-analytics";
import type { CalendarType, Gender } from "@/lib/chart";

const days = Array.from({ length: 31 }, (_, index) => index + 1);
const months = Array.from({ length: 12 }, (_, index) => index + 1);

function descendingYears(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, index) => end - index);
}

function errorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message === "INVALID_BIRTH_DATE") return "Ngày sinh chưa hợp lệ. Bạn kiểm tra lại ngày, tháng và loại lịch.";
  if (message === "INVALID_BIRTH_YEAR") return "Năm sinh cần nằm trong khoảng 1900-2100.";
  if (message === "INVALID_VIEW_YEAR") return "Năm muốn xem cần nằm trong khoảng 1900-2100.";
  return "Chưa so sánh được 12 khung giờ. Bạn kiểm tra lại thông tin rồi thử lại.";
}

function CandidateCard({
  candidate,
  selected,
  chosen,
  disabled,
  onToggle,
  onChoose,
}: {
  candidate: BirthHourCandidate;
  selected: boolean;
  chosen: boolean;
  disabled: boolean;
  onToggle: () => void;
  onChoose: () => void;
}) {
  return (
    <article className="birth-hour-card" data-selected={selected} data-chosen={chosen}>
      <div className="birth-hour-card-head">
        <div>
          <span>{candidate.hourBranch}</span>
          <h3>{candidate.hourRange}</h3>
        </div>
        <strong>{candidate.canChiHour}</strong>
      </div>
      <p>{candidate.summary}</p>
      <ul>
        {candidate.highlights.slice(0, 3).map((highlight) => (
          <li key={highlight}>{highlight}</li>
        ))}
      </ul>
      <div className="birth-hour-card-actions">
        <button type="button" className="btn btn-ghost btn-small" onClick={onToggle} disabled={disabled && !selected}>
          {selected ? "Bỏ so sánh" : "Chọn so sánh"}
        </button>
        <button type="button" className="btn btn-primary btn-small" onClick={onChoose} disabled={!selected}>
          Dùng giờ này
        </button>
      </div>
    </article>
  );
}

export function BirthHourComparison() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const birthYears = useMemo(() => descendingYears(1900, currentYear), [currentYear]);
  const viewYears = useMemo(() => descendingYears(1900, 2100), []);
  const [gender, setGender] = useState<Gender>("male");
  const [calendarType, setCalendarType] = useState<CalendarType>("solar");
  const [day, setDay] = useState("1");
  const [month, setMonth] = useState("1");
  const [year, setYear] = useState("1990");
  const [viewYear, setViewYear] = useState(String(currentYear));
  const [result, setResult] = useState<BirthHourComparisonResult | null>(null);
  const [selectedHours, setSelectedHours] = useState<number[]>([]);
  const [chosenHour, setChosenHour] = useState<number | null>(null);
  const [error, setError] = useState("");

  const chosenCandidate = result?.candidates.find((candidate) => candidate.birthHour === chosenHour) || null;
  const selectedCandidates = result?.candidates.filter((candidate) => selectedHours.includes(candidate.birthHour)) || [];

  function runComparison(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      const comparison = compareBirthHours({
        gender,
        calendarType,
        day: Number(day),
        month: Number(month),
        year: Number(year),
        viewYear: Number(viewYear),
      });
      setResult(comparison);
      setSelectedHours([]);
      setChosenHour(null);
      trackOrganicToolEvent("birth_hour_compare_submitted");
    } catch (comparisonError) {
      setResult(null);
      setSelectedHours([]);
      setChosenHour(null);
      setError(errorMessage(comparisonError));
    }
  }

  function toggleCandidate(candidate: BirthHourCandidate) {
    setSelectedHours((current) => {
      if (current.includes(candidate.birthHour)) {
        const next = current.filter((hour) => hour !== candidate.birthHour);
        if (chosenHour === candidate.birthHour) setChosenHour(null);
        return next;
      }
      if (selectedHours.length >= 3) return current;
      trackOrganicToolEvent("birth_hour_candidate_selected", { hour_branch: candidate.hourBranch });
      return [...current, candidate.birthHour];
    });
  }

  function chooseCandidate(candidate: BirthHourCandidate) {
    if (!selectedHours.includes(candidate.birthHour)) return;
    setChosenHour(candidate.birthHour);
    trackOrganicToolEvent("birth_hour_candidate_selected", { hour_branch: candidate.hourBranch });
  }

  return (
    <div className="birth-hour-tool" data-testid="birth-hour-tool">
      <section className="birth-hour-intro panel">
        <p className="eyebrow">Beta không nhớ giờ sinh</p>
        <h1>So sánh 12 khung giờ sinh trước khi lập lá số</h1>
        <p>
          Công cụ này cho thấy phần nào của lá số giữ nguyên và phần nào thay đổi theo giờ. Kết quả không tự xác định giờ sinh chính xác.
        </p>
      </section>

      <form className="birth-hour-form panel" id="birth-hour-compare-form" data-testid="birth-hour-compare-form" onSubmit={runComparison}>
        <div className="birth-hour-form-grid">
          <label>
            <span>Ngày sinh</span>
            <select value={day} onChange={(event) => setDay(event.target.value)}>
              {days.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Tháng sinh</span>
            <select value={month} onChange={(event) => setMonth(event.target.value)}>
              {months.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Năm sinh</span>
            <select value={year} onChange={(event) => setYear(event.target.value)}>
              {birthYears.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Loại lịch</span>
            <select value={calendarType} onChange={(event) => setCalendarType(event.target.value as CalendarType)}>
              <option value="solar">Dương lịch</option>
              <option value="lunar">Âm lịch</option>
            </select>
          </label>
          <label>
            <span>Giới tính</span>
            <select value={gender} onChange={(event) => setGender(event.target.value as Gender)}>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
            </select>
          </label>
          <label>
            <span>Năm muốn xem</span>
            <select value={viewYear} onChange={(event) => setViewYear(event.target.value)}>
              {viewYears.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
        </div>
        <button className="btn btn-primary btn-large" type="submit">
          <GitCompareArrows size={20} /> So sánh 12 khung giờ
        </button>
        {error ? <p className="birth-hour-error">{error}</p> : null}
      </form>

      {result ? (
        <>
          <section className="birth-hour-summary panel" aria-labelledby="birth-hour-summary-title">
            <div>
              <p className="eyebrow">Ổn định và thay đổi</p>
              <h2 id="birth-hour-summary-title">Những trường nên xem trước khi chọn giờ</h2>
            </div>
            <div className="birth-hour-summary-grid">
              <article>
                <h3><CheckCircle2 size={20} /> Giữ nguyên</h3>
                <ul>
                  {result.stableFields.map((field) => (
                    <li key={field.key}><strong>{field.label}</strong><span>{field.value}</span></li>
                  ))}
                </ul>
              </article>
              <article>
                <h3><TriangleAlert size={20} /> Thay đổi theo giờ</h3>
                <ul>
                  {result.variableFields.map((field) => (
                    <li key={field.key}><strong>{field.label}</strong><span>{field.values?.length} phương án</span></li>
                  ))}
                </ul>
              </article>
            </div>
          </section>

          <section className="birth-hour-candidates" aria-labelledby="birth-hour-candidates-title">
            <div className="birth-hour-section-head">
              <div>
                <p className="eyebrow">12 ứng viên giờ sinh</p>
                <h2 id="birth-hour-candidates-title">Chọn tối đa 3 khung giờ để đặt cạnh nhau</h2>
              </div>
              <span>{selectedHours.length}/3 đã chọn</span>
            </div>
            <div className="birth-hour-grid">
              {result.candidates.map((candidate) => (
                <CandidateCard
                  key={candidate.birthHour}
                  candidate={candidate}
                  selected={selectedHours.includes(candidate.birthHour)}
                  chosen={chosenHour === candidate.birthHour}
                  disabled={selectedHours.length >= 3}
                  onToggle={() => toggleCandidate(candidate)}
                  onChoose={() => chooseCandidate(candidate)}
                />
              ))}
            </div>
          </section>

          {selectedCandidates.length ? (
            <section className="birth-hour-compare-panel panel" aria-labelledby="birth-hour-selected-title">
              <p className="eyebrow">Đặt cạnh nhau</p>
              <h2 id="birth-hour-selected-title">Các khung giờ bạn đang so sánh</h2>
              <div className="birth-hour-selected-grid">
                {selectedCandidates.map((candidate) => (
                  <article key={candidate.birthHour}>
                    <h3>{candidate.hourBranch} <span>{candidate.hourRange}</span></h3>
                    <dl>
                      <div><dt>Mệnh</dt><dd>{candidate.menh}</dd></div>
                      <div><dt>Thân</dt><dd>{candidate.than}</dd></div>
                      <div><dt>Cục</dt><dd>{candidate.cuc}</dd></div>
                      <div><dt>Cân lượng</dt><dd>{candidate.boneWeight}</dd></div>
                    </dl>
                    <ul>
                      {candidate.mainStarPlacements.slice(0, 5).map((placement) => (
                        <li key={placement}>{placement}</li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {chosenCandidate ? (
            <section className="birth-hour-confirm panel" aria-labelledby="birth-hour-confirm-title">
              <div>
                <p className="eyebrow">Xác nhận giờ để lập lá số</p>
                <h2 id="birth-hour-confirm-title">Bạn đang chọn giờ {chosenCandidate.hourBranch} ({chosenCandidate.hourRange})</h2>
                <p>Chỉ bước này mới yêu cầu tên và tạo lá số. 12 lá số thử ở trên không được lưu.</p>
              </div>
              <form action={createChartAction} className="birth-hour-confirm-form" data-loading-message="Đang lập lá số từ giờ đã chọn...">
                <input type="hidden" name="adSource" value="unknown_hour_tool" />
                <input type="hidden" name="gender" value={gender} />
                <input type="hidden" name="calendarType" value={calendarType} />
                <input type="hidden" name="day" value={day} />
                <input type="hidden" name="month" value={month} />
                <input type="hidden" name="year" value={year} />
                <input type="hidden" name="viewYear" value={viewYear} />
                <input type="hidden" name="birthHour" value={chosenCandidate.birthHour} />
                <input type="hidden" name="birthMinute" value="0" />
                <label>
                  <span>Họ và tên</span>
                  <input name="fullName" required placeholder="Nhập tên để lưu lá số" />
                </label>
                <LoadingSubmitButton className="btn btn-primary btn-large" loadingText="Đang lập lá số...">
                  <Sparkles size={19} /> Lập lá số với giờ đã chọn
                </LoadingSubmitButton>
              </form>
            </section>
          ) : null}
        </>
      ) : (
        <section className="birth-hour-empty panel">
          <Clock3 size={28} />
          <p>Nhập ngày sinh, loại lịch, giới tính và năm muốn xem để bắt đầu so sánh 12 khung giờ.</p>
        </section>
      )}
    </div>
  );
}
