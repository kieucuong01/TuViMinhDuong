import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { publicQuanShare, quanEcosystemEnabled } from "@/lib/tu-vi-quan-ecosystem";

export const metadata: Metadata = { title: "Một lời nhắn từ Tử Vi Quán", robots: { index: false, follow: false }, referrer: "no-referrer" };
export const dynamic = "force-dynamic";

export default async function QuanSharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const data = quanEcosystemEnabled() && db ? await publicQuanShare(db, id) : null;
  if (!data || typeof data !== "object" || Array.isArray(data) || typeof data.title !== "string") notFound();
  return <main className="mx-auto my-10 max-w-xl px-5">
    <article className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-amber-950 shadow-lg">
      <p className="mb-4 text-sm uppercase tracking-widest">Tử Vi Quán · Lời nhắn để chiêm nghiệm</p>
      <h1 className="mb-4 text-3xl font-semibold">{data.title}</h1>
      {typeof data.alias === "string" && <p className="mb-3">Gửi từ {data.alias}</p>}
      {typeof data.body === "string" && <p className="whitespace-pre-line">{data.body}</p>}
      {typeof data.action === "string" && <p className="my-4 font-medium">{data.action}</p>}
      <Link className="btn btn-primary mt-4" href={`/tu-vi-quan?tu-vi-share=${id}`}>Ghé Tử Vi Quán</Link>
    </article>
  </main>;
}
