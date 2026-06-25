import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { PseoEntityDefinition } from "@/lib/pseo-registry";

export function PseoHub({
  title,
  description,
  entities,
}: {
  title: string;
  description: string;
  entities: PseoEntityDefinition[];
}) {
  return (
    <main className="pseo-hub section">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header>
          <h1>{title}</h1>
          <p>{description}</p>
        </header>
        <div className="pseo-hub-grid">
          {entities.map((entity) => (
            <article key={entity.slug}>
              <span>{entity.element}</span>
              <h2>{entity.name}</h2>
              <p>{entity.summary}</p>
              {entity.canonicalPath ? (
                <Link href={entity.canonicalPath}>Đọc ý nghĩa tổng quan <ArrowRight size={17} /></Link>
              ) : null}
            </article>
          ))}
        </div>
        <section className="pseo-hub-cta">
          <h2>Muốn xem đúng vị trí sao trong lá số của bạn?</h2>
          <Link href="/#lap-la-so" className="btn btn-primary">Lập lá số miễn phí</Link>
        </section>
      </div>
    </main>
  );
}
