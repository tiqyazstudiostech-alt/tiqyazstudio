import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { TitleForm } from "@/components/admin/title-form";
import { SeasonsEditor } from "@/components/admin/seasons-editor";
import { FilmEpisodeEditor } from "@/components/admin/film-episode-editor";

interface PageProps {
  params: Promise<{ titleId: string }>;
}

export default async function EditTitlePage({ params }: PageProps) {
  const { titleId } = await params;

  const title = await db.title.findUnique({
    where: { id: titleId, isDeleted: false },
    include: {
      genres:    { select: { id: true, name: true } },
      languages: { select: { id: true, code: true, name: true } },
      episodes: {
        where:   { isDeleted: false },
        orderBy: { number: "asc" },
        select: {
          id: true, number: true, title: true, synopsis: true,
          durationSec: true, thumbnailUrl: true, bunnyVideoId: true,
          status: true, seasonId: true,
        },
      },
      seasons: {
        where:   { isDeleted: false },
        orderBy: { number: "asc" },
        select:  { id: true, number: true, name: true },
      },
    },
  });

  if (!title) notFound();

  const [allGenres, allLanguages] = await Promise.all([
    db.genre.findMany({ where: { isActive: true }, orderBy: { displayOrder: "asc" }, select: { id: true, name: true } }),
    db.language.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, code: true, name: true } }),
  ]);

  // Attach episodes to their seasons for the SeasonsEditor
  const seasonsWithEpisodes = title.seasons.map((s) => ({
    ...s,
    episodes: title.episodes.filter((e) => e.seasonId === s.id),
  }));

  // Film: the single episode (seasonId null)
  const filmEpisode = title.type === "FILM"
    ? title.episodes.find((e) => e.seasonId === null)
    : null;

  return (
    <main className="px-6 py-8 max-w-3xl mx-auto flex flex-col gap-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-gold mb-1">Edit</p>
        <h1 className="font-display text-2xl text-ink">{title.title}</h1>
      </div>

      {/* Title metadata form */}
      <TitleForm
        titleId={title.id}
        initialData={{
          type:           title.type,
          title:          title.title,
          slug:           title.slug,
          synopsis:       title.synopsis,
          releaseYear:    title.releaseYear,
          maturityRating: title.maturityRating,
          isPremium:      title.isPremium,
          status:         title.status,
          posterUrl:      title.posterUrl,
          backdropUrl:    title.backdropUrl,
          trailerUrl:     title.trailerUrl,
          genreIds:       title.genres.map((g) => g.id),
          languageIds:    title.languages.map((l) => l.id),
        }}
        genres={allGenres}
        languages={allLanguages}
      />

      <hr className="border-border" />

      {/* FILM: inline episode editor */}
      {title.type === "FILM" && filmEpisode && (
        <FilmEpisodeEditor titleId={title.id} episode={filmEpisode} />
      )}

      {/* SERIES / PODCAST: seasons + episodes editor */}
      {(title.type === "SERIES" || title.type === "PODCAST") && (
        <SeasonsEditor titleId={title.id} seasons={seasonsWithEpisodes} />
      )}
    </main>
  );
}
