import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { CollectionForm } from "@/components/admin/collection-form";
import { CollectionTitlesEditor } from "@/components/admin/collection-titles-editor";

interface PageProps {
  params: Promise<{ collectionId: string }>;
}

export default async function EditCollectionPage({ params }: PageProps) {
  const { collectionId } = await params;

  const [collection, allTitles] = await Promise.all([
    db.collection.findUnique({
      where:   { id: collectionId, isDeleted: false },
      include: { titles: { select: { id: true } } },
    }),
    db.title.findMany({
      where:   { isDeleted: false, status: "PUBLISHED" },
      select:  { id: true, title: true, type: true, status: true },
      orderBy: { title: "asc" },
    }),
  ]);

  if (!collection) notFound();

  const assignedIds = collection.titles.map((t) => t.id);

  return (
    <main className="px-6 py-8 max-w-3xl mx-auto flex flex-col gap-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-gold mb-1">Edit</p>
        <h1 className="font-display text-2xl text-ink">{collection.name}</h1>
      </div>

      {/* Collection metadata */}
      <CollectionForm
        collectionId={collection.id}
        initialData={{
          name:         collection.name,
          slug:         collection.slug,
          description:  collection.description,
          displayOrder: collection.displayOrder,
          isActive:     collection.isActive,
        }}
      />

      <hr className="border-border" />

      {/* Title assignment */}
      <div className="flex flex-col gap-4">
        <h2 className="text-base font-semibold text-ink">Titles in this collection</h2>
        <CollectionTitlesEditor
          collectionId={collection.id}
          assignedIds={assignedIds}
          allTitles={allTitles}
        />
      </div>
    </main>
  );
}
