import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { BrowseFilters } from "@/components/viewer/browse-filters";
import { PosterCard } from "@/components/viewer/poster-card";

interface SearchParams {
  q?: string;
  genre?: string;
}

interface PageProps {
  searchParams: Promise<SearchParams>;
}

export default async function BrowsePage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const { q, genre } = await searchParams;

  const [genres, titles] = await Promise.all([
    db.genre.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
      select: { id: true, slug: true, name: true },
    }),
    db.title.findMany({
      where: {
        isDeleted: false,
        status: "PUBLISHED",
        ...(q && { title: { contains: q, mode: "insensitive" } }),
        ...(genre && { genres: { some: { slug: genre } } }),
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        type: true,
        title: true,
        slug: true,
        isPremium: true,
        posterUrl: true,
        backdropUrl: true,
      },
    }),
  ]);

  const activeGenreName = genre
    ? (genres.find((g) => g.slug === genre)?.name ?? genre)
    : null;

  return (
    <main className="min-h-screen py-8 px-6">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        <div>
          <h1 className="font-display text-3xl text-ink">Browse</h1>
          {(q || genre) && (
            <p className="text-sm text-ink-muted mt-1">
              {titles.length} result{titles.length !== 1 ? "s" : ""}
              {q ? ` for "${q}"` : ""}
              {activeGenreName ? ` in ${activeGenreName}` : ""}
            </p>
          )}
        </div>

        {/* BrowseFilters uses useSearchParams — needs Suspense boundary */}
        <Suspense>
          <BrowseFilters genres={genres} currentGenre={genre} currentQ={q} />
        </Suspense>

        {titles.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-ink-muted text-sm">No titles found.</p>
            {(q || genre) && (
              <a href="/browse" className="text-sm text-gold hover:text-gold-hover mt-2 inline-block transition-colors">
                Clear filters
              </a>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-6">
            {titles.map((title) => (
              <PosterCard
                key={title.id}
                href={`/title/${title.slug}`}
                title={title.title}
                posterUrl={title.posterUrl ?? undefined}
                backdropUrl={title.backdropUrl ?? undefined}
                type={title.type}
                isPremium={title.isPremium}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
