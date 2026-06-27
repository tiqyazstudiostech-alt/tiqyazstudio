import Link from "next/link";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui";
import { softDeleteCollectionAction } from "@/app/actions/collections";

const btnPrimary =
  "inline-flex items-center justify-center h-8 px-3 text-sm font-medium rounded-md " +
  "bg-gold text-gold-fg hover:bg-gold-hover transition-all duration-150";
const btnGhost =
  "inline-flex items-center justify-center h-8 px-3 text-sm font-medium rounded-md " +
  "bg-transparent text-ink border border-border hover:bg-surface-raised transition-all duration-150";

export default async function CollectionsPage() {
  const collections = await db.collection.findMany({
    where:   { isDeleted: false },
    include: { titles: { select: { id: true } } },
    orderBy: { displayOrder: "asc" },
  });

  const deleteAction = softDeleteCollectionAction.bind(null, null) as (formData: FormData) => void;

  return (
    <main className="px-6 py-8 max-w-4xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink">Collections</h1>
        <Link href="/admin/collections/new" className={btnPrimary}>New collection</Link>
      </div>

      {collections.length === 0 ? (
        <p className="text-sm text-ink-muted">No collections yet.</p>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-raised border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-ink-muted uppercase tracking-wide">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-ink-muted uppercase tracking-wide">Slug</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-ink-muted uppercase tracking-wide">Order</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-ink-muted uppercase tracking-wide">Titles</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-ink-muted uppercase tracking-wide">Active</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {collections.map((c) => (
                <tr key={c.id} className="hover:bg-surface-raised transition-colors">
                  <td className="px-4 py-3 font-medium text-ink">{c.name}</td>
                  <td className="px-4 py-3 text-ink-muted font-mono text-xs">{c.slug}</td>
                  <td className="px-4 py-3 text-ink-muted">{c.displayOrder}</td>
                  <td className="px-4 py-3 text-ink-muted">{c.titles.length}</td>
                  <td className="px-4 py-3">
                    <Badge variant={c.isActive ? "success" : "neutral"}>
                      {c.isActive ? "Yes" : "No"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-2 justify-end items-center">
                      <Link href={`/admin/collections/${c.id}/edit`} className={btnGhost}>
                        Edit
                      </Link>
                      <form action={deleteAction}>
                        <input type="hidden" name="id" value={c.id} />
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
