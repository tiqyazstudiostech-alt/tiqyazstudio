import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getEntitlements, canAccessTitle } from "@/lib/entitlements";
import { Rail } from "@/components/viewer/rail";
import { TitleCard } from "@/components/viewer/title-card";
import { PosterCard } from "@/components/viewer/poster-card";
import type { EventType } from "@prisma/client";

const POSTER_CARD_CLASS = "shrink-0 w-36";

export default async function ViewerHomePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const userId = session.user.id;

  // ── Step 1: all independent queries in parallel ──────────────────────────────
  const [
    continueWatching,
    watchlistItems,
    entitlements,
    trendingEvents,
    newReleases,
    userProfile,
  ] = await Promise.all([
    db.watchProgress.findMany({
      where: {
        userId,
        completed: false,
        episode: {
          isDeleted: false,
          status: "READY",
          parentTitle: { isDeleted: false, status: "PUBLISHED" },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: {
        positionSec: true,
        durationSec: true,
        episode: {
          select: {
            id: true,
            number: true,
            title: true,
            durationSec: true,
            titleId: true,
            parentTitle: {
              select: {
                id: true,
                title: true,
                isPremium: true,
                posterUrl: true,
                backdropUrl: true,
              },
            },
          },
        },
      },
    }),

    db.watchlistItem.findMany({
      where: { userId, title: { isDeleted: false, status: "PUBLISHED" } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        titleId: true,
        title: {
          select: {
            id: true,
            title: true,
            isPremium: true,
            posterUrl: true,
            backdropUrl: true,
            episodes: {
              where: { isDeleted: false, status: "READY" },
              orderBy: { number: "asc" },
              take: 1,
              select: { id: true },
            },
          },
        },
      },
    }),

    getEntitlements(userId),

    // Rank titles by PLAY_START count as a simple popularity proxy
    db.watchEvent.groupBy({
      by: ["titleId"],
      where: { type: "PLAY_START" as EventType, titleId: { not: null } },
      _count: { titleId: true },
      orderBy: { _count: { titleId: "desc" } },
      take: 20,
    }),

    db.title.findMany({
      where: { isDeleted: false, status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, type: true, title: true, slug: true, isPremium: true, posterUrl: true, backdropUrl: true },
    }),

    db.profile.findUnique({
      where: { userId },
      select: {
        genres: {
          select: { id: true, name: true },
          orderBy: { displayOrder: "asc" },
          take: 3,
        },
      },
    }),
  ]);

  // ── Step 2: fetch trending titles + genre rails in parallel ──────────────────
  const trendingIds = trendingEvents
    .map((e) => e.titleId)
    .filter((id): id is string => id !== null);

  const userGenres = userProfile?.genres ?? [];

  const [trendingTitlesRaw, genreTitleSets] = await Promise.all([
    trendingIds.length > 0
      ? db.title.findMany({
          where: { id: { in: trendingIds }, isDeleted: false, status: "PUBLISHED" },
          select: { id: true, type: true, title: true, slug: true, isPremium: true, posterUrl: true, backdropUrl: true },
        })
      : Promise.resolve([] as typeof newReleases),
    Promise.all(
      userGenres.map((g) =>
        db.title.findMany({
          where: {
            isDeleted: false,
            status: "PUBLISHED",
            genres: { some: { id: g.id } },
          },
          orderBy: { createdAt: "desc" },
          take: 12,
          select: { id: true, type: true, title: true, slug: true, isPremium: true, posterUrl: true, backdropUrl: true },
        }),
      ),
    ),
  ]);

  // Restore ranking order from event counts (findMany doesn't preserve in: order)
  const trendingMap = new Map(trendingTitlesRaw.map((t) => [t.id, t]));
  const trendingTitles = trendingIds
    .map((id) => trendingMap.get(id))
    .filter((t): t is NonNullable<typeof t> => t !== undefined);
  // Fall back to new releases if no play events recorded yet
  const trendingDisplay = trendingTitles.length > 0 ? trendingTitles : newReleases;

  const watchlistedTitleIds = new Set(watchlistItems.map((w) => w.titleId));
  const watchlistPlayable = watchlistItems.filter((item) => item.title.episodes.length > 0);

  const firstName = session.user.name?.split(" ")[0] ?? null;

  function posterProps(t: (typeof newReleases)[number]) {
    return {
      href:        `/title/${t.slug}`,
      title:       t.title,
      posterUrl:   t.posterUrl ?? undefined,
      backdropUrl: t.backdropUrl ?? undefined,
      type:        t.type,
      isPremium:   t.isPremium,
      className:   POSTER_CARD_CLASS,
    };
  }

  return (
    <main className="min-h-screen py-10 flex flex-col gap-10">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="px-6 flex items-center justify-between">
        <h1 className="font-display text-3xl text-ink leading-tight">
          {firstName ? `Hi, ${firstName}` : "Home"}
        </h1>
        <Link
          href="/browse"
          className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors"
        >
          Browse catalog
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* ── Continue Watching — only when there's history ───────────────────── */}
      {continueWatching.length > 0 && (
        <Rail heading="Continue Watching">
          {continueWatching.map(({ positionSec, durationSec, episode }) => {
            const effectiveDuration = durationSec ?? episode.durationSec;
            const progressPct =
              effectiveDuration && effectiveDuration > 0
                ? Math.round((positionSec / effectiveDuration) * 100)
                : undefined;
            const sublabel = episode.title
              ? `Ep ${episode.number}: ${episode.title}`
              : `Episode ${episode.number}`;
            return (
              <TitleCard
                key={episode.id}
                titleId={episode.titleId}
                href={`/watch/${episode.id}`}
                title={episode.parentTitle.title}
                imageUrl={(episode.parentTitle.backdropUrl ?? episode.parentTitle.posterUrl) ?? undefined}
                isPremium={episode.parentTitle.isPremium}
                isLocked={!canAccessTitle(entitlements, episode.parentTitle.isPremium)}
                progressPct={progressPct}
                sublabel={sublabel}
                isInWatchlist={watchlistedTitleIds.has(episode.titleId)}
              />
            );
          })}
        </Rail>
      )}

      {/* ── My List — only when populated ───────────────────────────────────── */}
      {watchlistPlayable.length > 0 && (
        <Rail heading="My List">
          {watchlistPlayable.map((item) => (
            <TitleCard
              key={item.titleId}
              titleId={item.titleId}
              href={`/watch/${item.title.episodes[0].id}`}
              title={item.title.title}
              imageUrl={(item.title.backdropUrl ?? item.title.posterUrl) ?? undefined}
              isPremium={item.title.isPremium}
              isLocked={!canAccessTitle(entitlements, item.title.isPremium)}
              isInWatchlist={true}
            />
          ))}
        </Rail>
      )}

      {/* ── Trending ─────────────────────────────────────────────────────────── */}
      {trendingDisplay.length > 0 && (
        <Rail heading={trendingTitles.length > 0 ? "Trending" : "Popular Titles"}>
          {trendingDisplay.map((t) => (
            <PosterCard key={t.id} {...posterProps(t)} />
          ))}
        </Rail>
      )}

      {/* ── New Releases ─────────────────────────────────────────────────────── */}
      {newReleases.length > 0 && (
        <Rail heading="New Releases">
          {newReleases.map((t) => (
            <PosterCard key={t.id} {...posterProps(t)} />
          ))}
        </Rail>
      )}

      {/* ── Genre rails from onboarding preferences ──────────────────────────── */}
      {userGenres.map((genre, i) => {
        const titles = genreTitleSets[i] ?? [];
        if (titles.length === 0) return null;
        return (
          <Rail key={genre.id} heading={`Because you like ${genre.name}`}>
            {titles.map((t) => (
              <PosterCard key={t.id} {...posterProps(t)} />
            ))}
          </Rail>
        );
      })}

      {/* ── Browse CTA — only when all personal rails are empty ──────────────── */}
      {continueWatching.length === 0 && watchlistPlayable.length === 0 && newReleases.length === 0 && (
        <div className="px-6">
          <Link
            href="/browse"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold text-gold-fg text-sm font-semibold rounded-lg hover:bg-gold-hover transition-colors"
          >
            Browse catalog
          </Link>
        </div>
      )}
    </main>
  );
}
