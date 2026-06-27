import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getEntitlements, canAccessTitle } from "@/lib/entitlements";
import { Rail } from "@/components/viewer/rail";
import { TitleCard } from "@/components/viewer/title-card";

export default async function ViewerHomePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const userId = session.user.id;

  const [continueWatching, watchlistItems, entitlements] = await Promise.all([
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
      where: {
        userId,
        title: { isDeleted: false, status: "PUBLISHED" },
      },
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
  ]);

  const watchlistedTitleIds = new Set(watchlistItems.map((w) => w.titleId));

  const firstName = session.user.name?.split(" ")[0] ?? null;

  return (
    <main className="min-h-screen py-10 flex flex-col gap-10">
      {/* Header */}
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

      <Rail
        heading="Continue Watching"
        empty={
          continueWatching.length === 0
            ? "Nothing in progress yet."
            : undefined
        }
      >
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
              imageUrl={
                (episode.parentTitle.backdropUrl ?? episode.parentTitle.posterUrl) ?? undefined
              }
              isPremium={episode.parentTitle.isPremium}
              isLocked={!canAccessTitle(entitlements, episode.parentTitle.isPremium)}
              progressPct={progressPct}
              sublabel={sublabel}
              isInWatchlist={watchlistedTitleIds.has(episode.titleId)}
            />
          );
        })}
      </Rail>

      <Rail
        heading="My List"
        empty={
          watchlistItems.length === 0
            ? "Your list is empty — browse the catalog to find something to watch."
            : undefined
        }
      >
        {watchlistItems
          .filter((item) => item.title.episodes.length > 0)
          .map((item) => (
            <TitleCard
              key={item.titleId}
              titleId={item.titleId}
              href={`/watch/${item.title.episodes[0].id}`}
              title={item.title.title}
              imageUrl={
                (item.title.backdropUrl ?? item.title.posterUrl) ?? undefined
              }
              isPremium={item.title.isPremium}
              isLocked={!canAccessTitle(entitlements, item.title.isPremium)}
              isInWatchlist={true}
            />
          ))}
      </Rail>

      {/* Browse CTA — shown when both rails are empty */}
      {continueWatching.length === 0 && watchlistItems.length === 0 && (
        <div className="px-6">
          <Link
            href="/browse"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold text-gold-fg text-sm font-semibold rounded-lg hover:bg-gold-hover transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6zm0 9.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25zm9.75-9.75A2.25 2.25 0 0 1 15.75 3.75H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6zm0 9.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25z" />
            </svg>
            Browse catalog
          </Link>
        </div>
      )}
    </main>
  );
}
