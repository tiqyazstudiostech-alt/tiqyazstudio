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

  return (
    <main className="min-h-screen bg-base py-10 flex flex-col gap-10">
      <div className="px-6">
        <h1 className="font-display text-3xl text-ink leading-tight">
          {session.user.name ? `Hi, ${session.user.name.split(" ")[0]}` : "Home"}
        </h1>
      </div>

      <Rail
        heading="Continue Watching"
        empty={
          continueWatching.length === 0
            ? "Nothing in progress yet — pick something to watch."
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
            ? "Your list is empty — add titles to watch later."
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
    </main>
  );
}
