import { db } from "@/lib/db";
import { TitleForm } from "@/components/admin/title-form";

export default async function NewTitlePage() {
  const [genres, languages] = await Promise.all([
    db.genre.findMany({ where: { isActive: true }, orderBy: { displayOrder: "asc" }, select: { id: true, name: true } }),
    db.language.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, code: true, name: true } }),
  ]);

  return (
    <main className="px-6 py-8 max-w-3xl mx-auto flex flex-col gap-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-gold mb-1">New</p>
        <h1 className="font-display text-2xl text-ink">Create title</h1>
      </div>
      <TitleForm genres={genres} languages={languages} />
    </main>
  );
}
