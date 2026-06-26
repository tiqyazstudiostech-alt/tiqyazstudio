import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { PreferencesForm } from "./preferences-form";

export default async function PreferencesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const [profile, genres, languages] = await Promise.all([
    db.profile.findUnique({
      where: { userId: session.user.id },
      select: {
        genres: { select: { id: true } },
        preferredLanguages: { select: { id: true } },
      },
    }),
    db.genre.findMany({ where: { isActive: true }, orderBy: { displayOrder: "asc" } }),
    db.language.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="min-h-screen bg-background px-4 py-16">
      <div className="mx-auto w-full max-w-2xl flex flex-col gap-10">
        <div>
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-widest mb-1">
            Settings
          </p>
          <h1 className="text-2xl font-bold text-ink">Preferences</h1>
          <p className="mt-2 text-ink-muted text-sm">
            Update the genres and languages that shape your recommendations.
          </p>
        </div>

        <div className="h-px bg-border" />

        <PreferencesForm
          genres={genres}
          languages={languages}
          initialGenreIds={profile?.genres.map((g) => g.id) ?? []}
          initialLanguageIds={profile?.preferredLanguages.map((l) => l.id) ?? []}
        />
      </div>
    </div>
  );
}
