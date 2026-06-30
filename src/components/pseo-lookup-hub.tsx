import Form from "next/form";
import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, Search } from "lucide-react";
import type { PseoEntityDefinition } from "@/lib/pseo-registry";

type LookupSection = {
  title: string;
  body: string;
};

type LookupFaq = {
  question: string;
  answer: string;
};

type PseoLookupHubProps = {
  title: string;
  description: string;
  actionPath: string;
  entities: PseoEntityDefinition[];
  selectedSlug?: string;
  formLabel: string;
  formHint: string;
  resultContext: string;
  guideTitle: string;
  guideIntro: string;
  steps: LookupSection[];
  principles: LookupSection[];
  faqs: LookupFaq[];
  indexTitle: string;
  indexIntro: string;
};

export function PseoLookupHub({
  title,
  description,
  actionPath,
  entities,
  selectedSlug,
  formLabel,
  formHint,
  resultContext,
  guideTitle,
  guideIntro,
  steps,
  principles,
  faqs,
  indexTitle,
  indexIntro,
}: PseoLookupHubProps) {
  const selected = entities.find((entity) => entity.slug === selectedSlug) || entities[0];

  if (!selected) return null;

  return (
    <main className="pseo-hub pseo-lookup-hub section">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="pseo-lookup-hero">
          <h1>{title}</h1>
          <p>{description}</p>
        </header>

        <section className="pseo-lookup-tool" aria-labelledby="lookup-form-heading">
          <div className="pseo-lookup-form-copy">
            <h2 id="lookup-form-heading">{formLabel}</h2>
            <p>{formHint}</p>
          </div>
          <Form action={actionPath} scroll={false} className="pseo-lookup-form">
            <label htmlFor="lookup-entity">{formLabel}</label>
            <div>
              <select id="lookup-entity" name="muc" defaultValue={selected.slug}>
                {entities.map((entity) => (
                  <option key={entity.slug} value={entity.slug}>
                    {entity.name}
                  </option>
                ))}
              </select>
              <button type="submit">
                <Search aria-hidden="true" size={20} />
                Tra cứu
              </button>
            </div>
          </Form>
        </section>

        <section className="pseo-lookup-result" aria-labelledby="lookup-result-heading" aria-live="polite">
          <div className="pseo-lookup-result-heading">
            <div>
              <span>Kết quả tra cứu</span>
              <h2 id="lookup-result-heading">{selected.name}</h2>
            </div>
            {selected.element ? <strong className="pseo-lookup-result-meta">{selected.element}</strong> : null}
          </div>
          <p className="pseo-lookup-summary">{selected.summary}.</p>
          <p className="pseo-lookup-context">{resultContext}</p>

          <div className="pseo-lookup-lists">
            <section>
              <h3>
                <CheckCircle2 aria-hidden="true" size={21} />
                Điểm nên phát huy
              </h3>
              <ul>
                {selected.strengths.map((strength) => (
                  <li key={strength}>{strength}</li>
                ))}
              </ul>
            </section>
            <section>
              <h3>
                <AlertTriangle aria-hidden="true" size={21} />
                Điều cần lưu ý
              </h3>
              <ul>
                {selected.cautions.map((caution) => (
                  <li key={caution}>{caution}</li>
                ))}
              </ul>
            </section>
          </div>

          {selected.canonicalPath ? (
            <Link className="pseo-lookup-detail-link" href={selected.canonicalPath}>
              Đọc trang phân tích riêng về {selected.name}
              <ArrowRight aria-hidden="true" size={18} />
            </Link>
          ) : null}
        </section>

        <section className="pseo-lookup-guide" aria-labelledby="lookup-guide-heading">
          <header>
            <span>Hướng dẫn thực hành</span>
            <h2 id="lookup-guide-heading">{guideTitle}</h2>
            <p>{guideIntro}</p>
          </header>
          <ol>
            {steps.map((step, index) => (
              <li key={step.title}>
                <span>{index + 1}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="pseo-lookup-principles" aria-labelledby="lookup-principles-heading">
          <h2 id="lookup-principles-heading">Nguyên tắc để tra cứu không bị hiểu sai</h2>
          <div>
            {principles.map((principle) => (
              <article key={principle.title}>
                <h3>{principle.title}</h3>
                <p>{principle.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="pseo-lookup-index" aria-labelledby="lookup-index-heading">
          <header>
            <h2 id="lookup-index-heading">{indexTitle}</h2>
            <p>{indexIntro}</p>
          </header>
          <ul>
            {entities.map((entity) => (
              <li key={entity.slug} className="pseo-index-row">
                <div>
                  <strong>{entity.name}</strong>
                  {entity.element ? <span>{entity.element}</span> : null}
                </div>
                <p>{entity.summary}.</p>
                {entity.canonicalPath ? <Link href={entity.canonicalPath}>Xem chi tiết</Link> : null}
              </li>
            ))}
          </ul>
        </section>

        <section className="pseo-lookup-faq" aria-labelledby="lookup-faq-heading">
          <h2 id="lookup-faq-heading">Câu hỏi thường gặp</h2>
          <div>
            {faqs.map((faq) => (
              <details key={faq.question}>
                <summary>{faq.question}</summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="pseo-hub-cta">
          <div>
            <h2>Muốn biết đối tượng này đang nằm ở đâu trong lá số của bạn?</h2>
            <p>Lập lá số trước, sau đó quay lại tra cứu theo đúng cung, sao và câu hỏi bạn đang quan tâm.</p>
          </div>
          <Link href="/#lap-la-so" className="btn btn-primary">
            Lập lá số miễn phí
          </Link>
        </section>
      </div>
    </main>
  );
}
