"use client";

import { useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { deleteArticleAction } from "@/app/actions";

type AdminArticleDeleteFormProps = {
  slug: string;
  title: string;
};

export function AdminArticleDeleteForm({ slug, title }: AdminArticleDeleteFormProps) {
  const [isPending, startTransition] = useTransition();

  function action(formData: FormData) {
    const ok = window.confirm(`Xóa bài "${title}" khỏi CMS? Bài sẽ không còn hiện ở admin và trang public.`);
    if (!ok) return;
    startTransition(() => deleteArticleAction(formData));
  }

  return (
    <form action={action} data-loading-message="Đang xóa bài viết..." data-loading-label="Đang xóa...">
      <input type="hidden" name="slug" value={slug} />
      <button className="btn btn-danger btn-small" type="submit" disabled={isPending} data-testid={`admin-article-delete-${slug}`}>
        {isPending ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
        Xóa
      </button>
    </form>
  );
}
