"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, HeartHandshake, RefreshCcw, Scale, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { buildChartCompatibilityReport, type ChartCompatibilityReport, type CompatibilityLevel } from "@/lib/chart-compatibility";
import type { CalendarType, ChartInput, Gender } from "@/lib/chart";
import { trackOrganicToolEvent } from "@/lib/client-analytics";

const days = Array.from({ length: 31 }, (_, index) => index + 1);
const months = Array.from({ length: 12 }, (_, index) => index + 1);
const currentYear = new Date().getFullYear();
const birthYears = Array.from({ length: currentYear - 1899 }, (_, index) => currentYear - index);
const hourOptions = [
  [0, "Tý: 23h - 1h"],
  [2, "Sửu: 1h - 3h"],
  [4, "Dần: 3h - 5h"],
  [6, "Mão: 5h - 7h"],
  [8, "Thìn: 7h - 9h"],
  [10, "Tỵ: 9h - 11h"],
  [12, "Ngọ: 11h - 13h"],
  [14, "Mùi: 13h - 15h"],
  [16, "Thân: 15h - 17h"],
  [18, "Dậu: 17h - 19h"],
  [20, "Tuất: 19h - 21h"],
  [22, "Hợi: 21h - 23h"],
] as const;

type PersonPrefix = "first" | "second";

function PersonFields({ prefix, title, hint }: { prefix: PersonPrefix; title: string; hint: string }) {
  return (
    <fieldset className="compatibility-person">
      <legend><span>{title}</span><small>{hint}</small></legend>
      <div className="compatibility-person-fields">
        <label className="compatibility-name-field" htmlFor={`${prefix}-name`}>
          <span>Tên gọi</span>
          <input id={`${prefix}-name`} name={`${prefix}Name`} type="text" maxLength={80} placeholder={prefix === "first" ? "Ví dụ: Minh" : "Ví dụ: An"} autoComplete="off" required />
        </label>

        <label htmlFor={`${prefix}-gender`}>
          <span>Giới tính</span>
          <select id={`${prefix}-gender`} name={`${prefix}Gender`} defaultValue={prefix === "first" ? "male" : "female"}>
            <option value="male">Nam</option>
            <option value="female">Nữ</option>
          </select>
        </label>

        <div className="compatibility-date-block">
          <span className="compatibility-field-label">Ngày sinh</span>
          <div className="compatibility-date-grid">
            <label htmlFor={`${prefix}-day`}><span>Ngày</span><select id={`${prefix}-day`} name={`${prefix}Day`} defaultValue="" required><option value="" disabled>Ngày</option>{days.map((day) => <option key={day} value={day}>{day}</option>)}</select></label>
            <label htmlFor={`${prefix}-month`}><span>Tháng</span><select id={`${prefix}-month`} name={`${prefix}Month`} defaultValue="" required><option value="" disabled>Tháng</option>{months.map((month) => <option key={month} value={month}>{month}</option>)}</select></label>
            <label htmlFor={`${prefix}-year`}><span>Năm</span><select id={`${prefix}-year`} name={`${prefix}Year`} defaultValue="" required><option value="" disabled>Năm sinh</option>{birthYears.map((year) => <option key={year} value={year}>{year}</option>)}</select></label>
            <label htmlFor={`${prefix}-calendar`}><span>Loại lịch</span><select id={`${prefix}-calendar`} name={`${prefix}Calendar`} defaultValue="solar"><option value="solar">Dương lịch</option><option value="lunar">Âm lịch</option></select></label>
          </div>
        </div>

        <label className="compatibility-hour-field" htmlFor={`${prefix}-hour`}>
          <span>Giờ sinh</span>
          <select id={`${prefix}-hour`} name={`${prefix}Hour`} defaultValue="" required>
            <option value="" disabled>Chọn khung giờ sinh</option>
            {hourOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <small>Giờ sinh ảnh hưởng vị trí Mệnh, Thân và cung sao.</small>
        </label>
      </div>
    </fieldset>
  );
}

function inputFromForm(formData: FormData, prefix: PersonPrefix): ChartInput {
  return {
    fullName: String(formData.get(`${prefix}Name`) || "").trim(),
    gender: String(formData.get(`${prefix}Gender`) || "male") as Gender,
    calendarType: String(formData.get(`${prefix}Calendar`) || "solar") as CalendarType,
    day: Number(formData.get(`${prefix}Day`)),
    month: Number(formData.get(`${prefix}Month`)),
    year: Number(formData.get(`${prefix}Year`)),
    birthHour: Number(formData.get(`${prefix}Hour`)),
    birthMinute: 0,
    viewYear: currentYear,
    timezone: "Asia/Bangkok",
  };
}

function errorMessage(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  if (code === "INVALID_NAME") return "Vui lòng nhập tên gọi ngắn gọn cho cả hai người.";
  if (code === "INVALID_BIRTH_DATE") return "Có ngày sinh chưa hợp lệ. Hãy kiểm tra lại ngày, tháng, năm và loại lịch.";
  if (code === "INVALID_BIRTH_HOUR") return "Vui lòng chọn khung giờ sinh cho cả hai người.";
  return "Chưa thể lập hai lá số với dữ liệu này. Hãy kiểm tra lại thông tin rồi thử lại.";
}

function levelIcon(level: CompatibilityLevel) {
  if (level === "flow") return <CheckCircle2 aria-hidden="true" size={18} />;
  if (level === "discuss") return <Scale aria-hidden="true" size={18} />;
  return <HeartHandshake aria-hidden="true" size={18} />;
}

function CompatibilityReportView({ report, onEdit }: { report: ChartCompatibilityReport; onEdit: () => void }) {
  return (
    <div className="compatibility-report-body">
      <div className="compatibility-report-heading">
        <div>
          <p>Kết quả đối chiếu hai lá số</p>
          <h2>{report.overview.title}</h2>
        </div>
        <button type="button" className="compatibility-edit-button" onClick={onEdit}><RefreshCcw aria-hidden="true" size={17} /> Sửa dữ liệu</button>
      </div>

      <div className="compatibility-people-strip" aria-label="Thông tin nền của hai lá số">
        {report.people.map((person) => (
          <article key={person.name}>
            <strong>{person.name}</strong>
            <span>{person.canChiYear} · {person.banMenh}</span>
            <small>Mệnh {person.menh} · Thân {person.than} · {person.cuc}</small>
          </article>
        ))}
      </div>

      <section className={`compatibility-overview level-${report.overview.level}`} aria-labelledby="compatibility-overview-title">
        <div className="compatibility-level">{levelIcon(report.overview.level)} {report.overview.levelLabel}</div>
        <h3 id="compatibility-overview-title">Bức tranh chung</h3>
        <p>{report.overview.summary}</p>
        <div className="compatibility-overview-columns">
          <div><h4>Điểm thuận nên nuôi dưỡng</h4><ul>{report.overview.strengths.map((item) => <li key={item}>{item}</li>)}</ul></div>
          <div><h4>Chủ đề nên nói rõ</h4><ul>{report.overview.attention.map((item) => <li key={item}>{item}</li>)}</ul></div>
        </div>
        <div className="compatibility-element-note"><strong>Ngũ hành bản mệnh:</strong> {report.elementReading}</div>
      </section>

      <section className="compatibility-themes" aria-labelledby="compatibility-themes-title">
        <div className="compatibility-section-title"><p>Luận giải theo từng lớp</p><h3 id="compatibility-themes-title">Sáu chủ đề cần đối chiếu</h3><span>Đọc phần gần với câu hỏi thật của hai người trước, rồi mở căn cứ cung sao khi muốn kiểm tra sâu hơn.</span></div>
        <div className="compatibility-theme-list">
          {report.themes.map((theme, index) => (
              <article key={theme.key} className={`compatibility-theme level-${theme.level}`}>
                <header><span>{String(index + 1).padStart(2, "0")}</span><div><h4>{theme.title}</h4><p className="compatibility-theme-level">{levelIcon(theme.level)} {theme.levelLabel}</p></div></header>
                <p className="compatibility-theme-prose">{theme.prose}</p>
                <details
                  className="compatibility-evidence"
                  onToggle={(event) => {
                    if (!event.currentTarget.open) return;
                    trackOrganicToolEvent("compatibility_evidence_open", {
                      theme_key: theme.key,
                      result_level: theme.level,
                    });
                  }}
                >
                  <summary>Căn cứ từ hai lá số</summary>
                  <div>{theme.evidence.map((evidence) => <section key={evidence.personName}><h5>{evidence.personName}</h5><ul>{evidence.details.map((detail) => <li key={detail}>{detail}</li>)}</ul></section>)}</div>
                </details>
            </article>
          ))}
        </div>
      </section>

      <section className="compatibility-next-conversation" aria-labelledby="compatibility-next-title">
        <Sparkles aria-hidden="true" size={23} />
        <div><h3 id="compatibility-next-title">Ba câu hỏi để biến luận giải thành cuộc trò chuyện</h3><ol>{report.sharedQuestions.map((question) => <li key={question}>{question}</li>)}</ol></div>
      </section>

      <section className="compatibility-method-note">
        <div><h3>Phương pháp đọc</h3><p>{report.methodology}</p></div>
        <div><h3><ShieldCheck aria-hidden="true" size={20} /> Giới hạn cần nhớ</h3><p>{report.disclaimer}</p></div>
      </section>

      <div className="compatibility-report-cta">
        <div><strong>Muốn hiểu từng người trước khi đặt cạnh nhau?</strong><span>Lập lá số riêng để đọc Mệnh–Thân và các cung trọng yếu đầy đủ hơn.</span></div>
        <Link
          href="/#lap-la-so"
          className="btn btn-primary"
          onClick={() => trackOrganicToolEvent("compatibility_chart_cta", { cta_position: "report_footer" })}
        >Lập lá số riêng <ArrowRight aria-hidden="true" size={18} /></Link>
      </div>
    </div>
  );
}

export function ChartCompatibilityTool() {
  const [report, setReport] = useState<ChartCompatibilityReport | null>(null);
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const resultRef = useRef<HTMLElement>(null);

  useEffect(() => {
    trackOrganicToolEvent("compatibility_tool_view");
  }, []);

  useEffect(() => {
    if (!report) return;
    resultRef.current?.focus();
    resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [report]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    trackOrganicToolEvent("compatibility_submit");
    setError("");
    try {
      const formData = new FormData(event.currentTarget);
      const nextReport = buildChartCompatibilityReport(inputFromForm(formData, "first"), inputFromForm(formData, "second"));
      setReport(nextReport);
      trackOrganicToolEvent("compatibility_result", { result_level: nextReport.overview.level });
    } catch (caught) {
      setReport(null);
      setError(errorMessage(caught));
    }
  }

  function editInputs() {
    trackOrganicToolEvent("compatibility_edit");
    setReport(null);
    window.requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      formRef.current?.querySelector<HTMLInputElement>("input")?.focus();
    });
  }

  return (
    <div className="compatibility-tool">
      <form ref={formRef} className="compatibility-form" onSubmit={handleSubmit} aria-describedby="compatibility-privacy-note">
        <div className="compatibility-form-heading"><HeartHandshake aria-hidden="true" size={24} /><div><p>Nhập đủ thông tin sinh</p><h2>Đặt hai lá số cạnh nhau</h2></div></div>
        <div className="compatibility-form-grid">
          <PersonFields prefix="first" title="Thông tin người thứ nhất" hint="Người đang xem hoặc người A" />
          <PersonFields prefix="second" title="Thông tin người thứ hai" hint="Người muốn đối chiếu hoặc người B" />
        </div>
        {error ? <p className="compatibility-form-error" role="alert">{error}</p> : null}
        <p id="compatibility-privacy-note" className="compatibility-privacy-note"><ShieldCheck aria-hidden="true" size={17} /> Dữ liệu chỉ được xử lý trên thiết bị này để tạo kết quả, không được lưu vào tài khoản hay gửi tới dịch vụ AI.</p>
        <button type="submit" className="btn btn-primary btn-large compatibility-submit"><Sparkles aria-hidden="true" size={19} /> Luận giải tương hợp hai lá số</button>
      </form>

      <section ref={resultRef} className="compatibility-report" tabIndex={-1} aria-live="polite" aria-label="Kết quả tương hợp hai lá số">
        {report ? <CompatibilityReportView report={report} onEdit={editInputs} /> : null}
      </section>
    </div>
  );
}
