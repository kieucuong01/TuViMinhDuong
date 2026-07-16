"use client";

import Link from "next/link";
import { AlertTriangle, CheckCircle2, MinusCircle } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import {
  analyzeKetHon,
  analyzeLamAn,
  analyzeLamNha,
  analyzeSinhCon,
  analyzeVoChong,
  analyzeXongDat,
  type AnalysisSummary,
  type CriterionStatus,
  type Gender,
  type LunarYearProfile,
} from "@/lib/age-compatibility";
import { getAgeToolPage, type AgeToolSlug } from "@/lib/age-tools";
import { trackOrganicToolEvent } from "@/lib/client-analytics";

type ToolResult = {
  title: string;
  profiles: { label: string; profile: LunarYearProfile }[];
  summary?: AnalysisSummary;
  years?: { year: number; profile: LunarYearProfile; summary: AnalysisSummary }[];
};

type FormState = {
  firstDate: string;
  secondDate: string;
  firstGender: Gender;
  secondGender: Gender;
  targetYear: number;
  startYear: number;
  endYear: number;
};

const STATUS_LABEL: Record<CriterionStatus, string> = {
  favorable: "Thuận",
  neutral: "Trung tính",
  caution: "Cần cân nhắc",
};

function StatusIcon({ status }: { status: CriterionStatus }) {
  if (status === "favorable") return <CheckCircle2 aria-hidden="true" />;
  if (status === "caution") return <AlertTriangle aria-hidden="true" />;
  return <MinusCircle aria-hidden="true" />;
}

function ResultSummary({ summary }: { summary: AnalysisSummary }) {
  return (
    <section className="age-result-summary" data-band={summary.band} aria-labelledby="age-result-summary-title">
      <div>
        <span>Kết luận tham khảo</span>
        <h3 id="age-result-summary-title">{summary.label}</h3>
      </div>
      <dl>
        <div><dt>Thuận</dt><dd>{summary.counts.favorable}</dd></div>
        <div><dt>Trung tính</dt><dd>{summary.counts.neutral}</dd></div>
        <div><dt>Cân nhắc</dt><dd>{summary.counts.caution}</dd></div>
      </dl>
      <div className="age-criteria-list">
        {summary.criteria.map((criterion) => (
          <article key={criterion.key} data-status={criterion.status}>
            <StatusIcon status={criterion.status} />
            <div>
              <div className="age-criterion-heading">
                <strong>{criterion.label}</strong>
                <span>{STATUS_LABEL[criterion.status]}</span>
              </div>
              <p>{criterion.explanation}</p>
              {criterion.role === "supporting" ? <small>Tiêu chí bổ trợ</small> : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function DateField({ id, label, value, max, onChange }: { id: string; label: string; value: string; max: string; onChange: (value: string) => void }) {
  return (
    <label className="age-field" htmlFor={id}>
      <span>{label}</span>
      <input id={id} type="date" min="1900-01-01" max={max} value={value} onChange={(event) => onChange(event.target.value)} required />
      <small>Dùng ngày sinh dương lịch; hệ thống tự đổi sang năm âm lịch.</small>
    </label>
  );
}

function GenderField({ id, label, value, onChange }: { id: string; label: string; value: Gender; onChange: (value: Gender) => void }) {
  return (
    <label className="age-field" htmlFor={id}>
      <span>{label}</span>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value as Gender)}>
        <option value="male">Nam</option>
        <option value="female">Nữ</option>
      </select>
      <small>Chỉ dùng để tính Cung Phi khi công cụ có tiêu chí này.</small>
    </label>
  );
}

function YearField({ id, label, value, min, max, onChange }: { id: string; label: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  return (
    <label className="age-field" htmlFor={id}>
      <span>{label}</span>
      <input id={id} type="number" inputMode="numeric" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} required />
    </label>
  );
}

export function AgeTool({ tool }: { tool: AgeToolSlug }) {
  const page = getAgeToolPage(tool);
  const currentYear = new Date().getFullYear();
  const maxDate = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState<FormState>({
    firstDate: "",
    secondDate: "",
    firstGender: "male",
    secondGender: "female",
    targetYear: currentYear,
    startYear: currentYear,
    endYear: currentYear + 5,
  });
  const [result, setResult] = useState<ToolResult>();
  const [error, setError] = useState("");

  useEffect(() => {
    trackOrganicToolEvent("age_tool_view", { tool });
  }, [tool]);

  if (!page) return null;

  function update<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    trackOrganicToolEvent("age_tool_submit", { tool });

    try {
      if (form.endYear < form.startYear) throw new Error("Năm kết thúc phải từ năm bắt đầu trở đi.");
      const nextResult: ToolResult = tool === "xong-dat"
        ? analyzeXongDat(form.firstDate, form.targetYear)
        : tool === "vo-chong"
          ? analyzeVoChong(form.firstDate, form.firstGender, form.secondDate, form.secondGender)
          : tool === "sinh-con"
            ? analyzeSinhCon(form.firstDate, form.secondDate, form.startYear, form.endYear)
            : tool === "ket-hon"
              ? analyzeKetHon(form.firstDate, form.firstGender, form.startYear, form.endYear)
              : tool === "lam-an"
                ? analyzeLamAn(form.firstDate, form.secondDate)
                : analyzeLamNha(form.firstDate, form.firstGender, form.startYear, form.endYear);
      setResult(nextResult);
      const resultBand = nextResult.summary?.band ?? nextResult.years?.[0]?.summary.band ?? "mixed";
      trackOrganicToolEvent("age_tool_result", { tool, result_band: resultBand });
      window.requestAnimationFrame(() => document.getElementById("age-tool-result")?.focus());
    } catch (caught) {
      setResult(undefined);
      setError(caught instanceof Error ? caught.message : "Không thể tính kết quả. Vui lòng kiểm tra dữ liệu đã nhập.");
    }
  }

  const needsSecondPerson = tool === "vo-chong" || tool === "sinh-con" || tool === "lam-an";
  const needsFirstGender = tool === "vo-chong" || tool === "ket-hon" || tool === "lam-nha";
  const needsSecondGender = tool === "vo-chong";
  const needsRange = tool === "sinh-con" || tool === "ket-hon" || tool === "lam-nha";

  const firstLabel = tool === "xong-dat" || tool === "lam-nha"
    ? "Ngày sinh gia chủ"
    : tool === "sinh-con"
      ? "Ngày sinh của cha"
      : tool === "ket-hon"
        ? "Ngày sinh người cần xem"
        : "Ngày sinh người thứ nhất";
  const secondLabel = tool === "sinh-con" ? "Ngày sinh của mẹ" : "Ngày sinh người thứ hai";

  return (
    <section className="age-tool-panel" aria-labelledby="age-tool-form-title">
      <div className="age-tool-form-head">
        <div>
          <span>Thông tin tra cứu</span>
          <h2 id="age-tool-form-title">Nhập dữ liệu để đối chiếu</h2>
        </div>
        <p>Ngày sinh chỉ được tính trên thiết bị này, không lưu và không gửi lên máy chủ.</p>
      </div>

      <form onSubmit={submit} className="age-tool-form">
        <div className="age-form-grid">
          <DateField id={`${tool}-first-date`} label={firstLabel} value={form.firstDate} max={maxDate} onChange={(value) => update("firstDate", value)} />
          {needsFirstGender ? <GenderField id={`${tool}-first-gender`} label="Giới tính người cần xem" value={form.firstGender} onChange={(value) => update("firstGender", value)} /> : null}
          {needsSecondPerson ? <DateField id={`${tool}-second-date`} label={secondLabel} value={form.secondDate} max={maxDate} onChange={(value) => update("secondDate", value)} /> : null}
          {needsSecondGender ? <GenderField id={`${tool}-second-gender`} label="Giới tính người thứ hai" value={form.secondGender} onChange={(value) => update("secondGender", value)} /> : null}
          {tool === "xong-dat" ? <YearField id={`${tool}-target-year`} label="Năm cần xem" value={form.targetYear} min={currentYear} max={currentYear + 20} onChange={(value) => update("targetYear", value)} /> : null}
          {needsRange ? (
            <>
              <YearField id={`${tool}-start-year`} label="Từ năm" value={form.startYear} min={currentYear} max={currentYear + 20} onChange={(value) => update("startYear", value)} />
              <YearField id={`${tool}-end-year`} label="Đến năm" value={form.endYear} min={form.startYear} max={currentYear + 20} onChange={(value) => update("endYear", value)} />
            </>
          ) : null}
        </div>
        {error ? <p className="age-form-error" role="alert">{error}</p> : null}
        <button className="btn btn-primary age-submit" type="submit">Xem kết quả</button>
      </form>

      {result ? (
        <section id="age-tool-result" className="age-tool-result" tabIndex={-1} aria-live="polite">
          <div className="age-result-head">
            <span>Kết quả tra cứu</span>
            <h2>{result.title}</h2>
            <p>Kết quả dựa trên năm âm lịch và các quy tắc được giải thích bên dưới; không phải dự báo chắc chắn.</p>
          </div>

          <div className="age-profile-grid">
            {result.profiles.map(({ label, profile }) => (
              <article key={label}>
                <span>{label}</span>
                <strong>{profile.canChi}</strong>
                <p>{profile.napAm} · {profile.polarity} {profile.napAmElement}</p>
                {profile.cungPhi ? <small>Cung Phi {profile.cungPhi.name} · {profile.cungPhi.group}</small> : null}
              </article>
            ))}
          </div>

          {result.summary ? <ResultSummary summary={result.summary} /> : null}
          {result.years ? (
            <div className="age-year-results">
              {result.years.map((yearResult, index) => (
                <article className="age-year-card" key={yearResult.year} data-band={yearResult.summary.band}>
                  <div className="age-year-card-head">
                    <div><span>{index < 3 ? `Gợi ý ${index + 1}` : "Năm tham khảo"}</span><h3>{yearResult.year} · {yearResult.profile.canChi}</h3></div>
                    <strong>{yearResult.summary.label}</strong>
                  </div>
                  <p>{yearResult.profile.napAm} · {yearResult.profile.napAmElement}</p>
                  <details>
                    <summary>Xem {yearResult.summary.criteria.length} tiêu chí</summary>
                    <div className="age-criteria-list">
                      {yearResult.summary.criteria.map((criterion) => (
                        <article key={criterion.key} data-status={criterion.status}>
                          <StatusIcon status={criterion.status} />
                          <div><div className="age-criterion-heading"><strong>{criterion.label}</strong><span>{STATUS_LABEL[criterion.status]}</span></div><p>{criterion.explanation}</p></div>
                        </article>
                      ))}
                    </div>
                  </details>
                </article>
              ))}
            </div>
          ) : null}

          <aside className="age-tool-disclaimer">
            <AlertTriangle aria-hidden="true" />
            <p>Chỉ dùng để tham khảo phong tục. Không dùng kết quả này thay cho quyết định y khoa, hôn nhân, tài chính, pháp lý hoặc an toàn xây dựng.</p>
          </aside>
        </section>
      ) : null}

      <div className="age-tool-next">
        <div>
          <span>Bước tiếp theo</span>
          <h2>{page.cta.label}</h2>
          <p>{page.cta.description}</p>
          <Link href={page.cta.href} className="btn btn-primary" onClick={() => trackOrganicToolEvent("age_tool_chart_cta", { tool, cta_position: "result_footer" })}>{page.cta.label}</Link>
        </div>
        <nav aria-label="Công cụ xem tuổi liên quan">
          <strong>Xem thêm</strong>
          {page.related.map((slug) => {
            const related = getAgeToolPage(slug);
            return related ? <Link key={slug} href={`/xem-tuoi/${slug}`} onClick={() => trackOrganicToolEvent("age_tool_related_click", { tool, target_tool: slug })}>{related.label}</Link> : null;
          })}
        </nav>
      </div>
    </section>
  );
}
