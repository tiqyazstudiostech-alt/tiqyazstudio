import Link from "next/link";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui";
import { softDeleteTitleAction } from "@/app/actions/titles";
import type { TitleType, ContentStatus } from "@prisma/client";

const TYPE_LABELS: Record<TitleType, string> = {
  FILM:    "Film",
  SERIES:  "Series",
  PODCAST: "Podcast",
};

const STATUS_VARIANT: Record<ContentStatus, "success" | "warning" | "neutral"> = {
  PUBLISHED: "success",
  DRAFT:     "warning",
  ARCHIVED:  "neutral",
};

// Shared Tailwind classes for button-like links
const btnPrimary =
  "inline-flex items-center justify-center h-8 px-3 text-sm font-medium rounded-md " +
  "bg-gold text-gold-fg hover:bg-gold-hover transition-all duration-150";
const btnGhost =
  "inline-flex items-center justify-center h-8 px-3 text-sm font-medium rounded-md " +
  "bg-transparent text-ink border border-border hover:bg-surface-raised transition-all duration-150";

interface PageProps {
  searchParams: Promise<{ type?: string; status?: string }>;
}

export default async function TitlesPage({ searchParams }: PageProps) {
  const { type, status } = await searchParams;

  const titles = await db.title.findMany({
    where: {
      isDeleted: false,
      ...(type   ? { type:   type   as TitleType }   : {}),
      ...(status ? { status: status as ContentStatus } : {}),
    },
    select: {
      id:        true,
      title:     true,
      type:      true,
      status:    true,
      isPremium: true,
      genres:    { select: { name: true } },
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  const inputCls =
    "bg-surface border border-border rounded-lg px-3 py-2 text-sm text-ink " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-gold";

  const deleteAction = softDeleteTitleAction.bind(null, null) as (formData: FormData) => void;

  return (
    <main className="px-6 py-8 max-w-6xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink">Titles</h1>
        <Link href="/admin/titles/new" className={btnPrimary}>New title</Link>
      </div>

      {/* Filters */}
      <form method="GET" className="flex gap-3 items-center">
        <select name="type" defaultValue={type ?? ""} className={inputCls}>
          <option value="">All types</option>
          <option value="FILM">Film</option>
          <option value="SERIES">Series</option>
          <option value="PODCAST">Podcast</option>
        </select>
        <select name="status" defaultValue={status ?? ""} className={inputCls}>
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <button type="submit" className={btnGhost}>Filter</button>
        {(type || status) && (
          <Link href="/admin/titles" className="text-sm text-ink-muted hover:text-ink">
            Clear
          </Link>
        )}
      </form>

      {/* Table */}
      {titles.length === 0 ? (
        <p className="text-sm text-ink-muted">No titles found.</p>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-raised border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-ink-muted uppercase tracking-wide">Title</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-ink-muted uppercase tracking-wide">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-ink-muted uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-ink-muted uppercase tracking-wide">Genres</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {titles.map((t) => (
                <tr key={t.id} className="hover:bg-surface-raised transition-colors">
                  <td className="px-4 py-3 font-medium text-ink">
                    {t.title}
                    {t.isPremium && <span className="ml-2 text-xs text-gold">Premium</span>}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{TYPE_LABELS[t.type]}</td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[t.status]}>{t.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-ink-muted text-xs">
                    {t.genres.map((g) => g.name).join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-2 justify-end items-center">
                      <Link href={`/admin/titles/${t.id}/edit`} className={btnGhost}>
                        Edit
                      </Link>
                      <form action={deleteAction}>
                        <input type="hidden" name="id" value={t.id} />
                        <button
                          type="submit"
                          className="inline-flex items-center justify-center h-8 px-3 text-sm font-medium rounded-md bg-transparent text-error border border-border hover:bg-surface-raised transition-all duration-150"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
