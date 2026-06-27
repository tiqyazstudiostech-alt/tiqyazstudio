import { CollectionForm } from "@/components/admin/collection-form";

export default function NewCollectionPage() {
  return (
    <main className="px-6 py-8 max-w-lg mx-auto flex flex-col gap-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-gold mb-1">New</p>
        <h1 className="font-display text-2xl text-ink">Create collection</h1>
      </div>
      <CollectionForm />
    </main>
  );
}
