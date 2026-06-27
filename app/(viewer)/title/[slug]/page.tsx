import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getEntitlements, canAccessTitle } from "@/lib/entitlements";
import { WatchlistButton } from "@/components/viewer/watchlist-button";
import { Badge } from "@/components/ui";

interface PageProps {
  params: Promise<{ slug: string }>;
}

function fmtDuration(sec: number | null | undefined): string {
  if (!sec) return "";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default async function TitleDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const userId = session.user.id;

  const [title, entitlements] = await Promise.all([
    db.title.findUnique({
      where: { slug, isDeleted: false, status: "PUBLISHED" },
      select: {
        id: true,
        type: true,
        title: true,
        synopsis: true,
        releaseYear: true,
        maturityRating: true,
        isPremium: true,
        posterUrl: true,
        backdropUrl: true,
        genres: { select: { id: true, name: true } },
        languages: { select: { id: true, name: true } },
        seasons: {
          where: { isDeleted: false },
          orderBy: { number: "asc" },
          select: {
            id: true,
            number: true,
            name: true,
            episodes: {
              where: { isDeleted: false },
              orderBy: { number: "asc" },
              select: {
                id: true,
                number: true,
                title: true,
                status: true,
                durationSec: true,
              },
            },
          },
        },
        episodes: {
          where: { isDeleted: false },
          orderBy: { number: "asc" },
          select: { id: true, number: true, title: true, status: true, durationSec: true },
        },
        watchlistItems: {
          where: { userId },
          select: { id: true },
          take: 1,
        },
      },
    }),
    getEntitlements(userId),
  ]);

  if (!title) notFound();

  const isLocked = !canAccessTitle(entitlements, title.isPremium);
  const isInWatchlist = title.watchlistItems.length > 0;

  // For FILM: first READY episode across all direct episodes
  const playableFilmEpisode = title.episodes.find((e) => e.status === "READY");

  return (
    <div className="min-h-screen">
      {/* ── Backdrop hero ─────────────────────────────────────────────────────── */}
      <div className="relative w-full h-64 sm:h-80 md:h-96 overflow-hidden">
        {title.backdropUrl || title.posterUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={(title.backdropUrl ?? title.posterUrl)!}
            alt={title.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-surface-raised" />
        )}
        {/* Top-to-bottom and bottom gradient for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/60 to-transparent" />
      </div>

      {/* ── Content ───────────────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-6 -mt-20 relative z-10 pb-16 flex flex-col gap-6">
        {/* Title + badges row */}
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-3 flex-wrap">
            <h1 className="font-display text-headline text-ink leading-tight flex-1 min-w-0">
              {title.title}
            </h1>
            {title.isPremium && (
              <Badge variant="primary" className="shrink-0 mt-1">Premium</Badge>
            )}
          </div>

          {/* Metadata line */}
          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-sm text-ink-muted">
            <span className="text-xs font-medium text-ink-dim uppercase tracking-wide">
              {title.type === "FILM" ? "Film" : title.type === "SERIES" ? "Series" : "Podcast"}
            </span>
            {title.releaseYear && <span>{title.releaseYear}</span>}
            {title.maturityRating && (
              <span className="border border-border-strong rounded px-1.5 py-0.5 text-xs font-medium">
                {title.maturityRating}
              </span>
            )}
            {title.genres.map((g) => (
              <Link
                key={g.id}
                href={`/browse?genre=${encodeURIComponent(g.name.toLowerCase())}`}
                className="hover:text-ink transition-colors"
              >
                {g.name}
              </Link>
            ))}
            {title.languages.map((l) => (
              <span key={l.id}>{l.name}</span>
            ))}
          </div>
        </div>

        {/* Locked gate banner */}
        {isLocked && (
          <div className="flex items-center justify-between gap-4 bg-surface border border-gold/30 rounded-xl px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-gold">Premium title</p>
              <p className="text-xs text-ink-muted mt-0.5">
                Upgrade to Premium to watch this title.
              </p>
            </div>
            <Link
              href="/settings/subscription"
              className="shrink-0 px-4 py-2 bg-gold text-gold-fg text-sm font-semibold rounded-lg hover:bg-gold-hover transition-colors"
            >
              Upgrade
            </Link>
          </div>
        )}

        {/* CTA row — watchlist + play */}
        <div className="flex items-center gap-3 flex-wrap">
          {title.type === "FILM" && !isLocked && (
            playableFilmEpisode ? (
              <Link
                href={`/watch/${playableFilmEpisode.id}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold text-gold-fg text-sm font-semibold rounded-lg hover:bg-gold-hover transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M8 5.14v13.72L19 12 8 5.14z" />
                </svg>
                Play
                {playableFilmEpisode.durationSec && (
                  <span className="text-gold-fg/60 font-normal text-xs">
                    {fmtDuration(playableFilmEpisode.durationSec)}
                  </span>
                )}
              </Link>
            ) : (
              <span className="inline-flex items-center px-5 py-2.5 bg-surface border border-border rounded-lg text-sm text-ink-muted cursor-default">
                Coming soon
              </span>
            )
          )}

          <WatchlistButton titleId={title.id} initialInWatchlist={isInWatchlist} />
        </div>

        {/* Synopsis */}
        {title.synopsis && (
          <p className="text-sm text-ink-muted leading-relaxed max-w-2xl">{title.synopsis}</p>
        )}

        {/* ── SERIES episode list ──────────────────────────────────────────────── */}
        {title.type === "SERIES" && title.seasons.length > 0 && (
          <div className="flex flex-col gap-6 mt-2">
            {title.seasons.map((season) => (
              <section key={season.id}>
                <h2 className="text-base font-semibold text-ink mb-3">
                  {season.name ?? `Season ${season.number}`}
                </h2>
                <div className="flex flex-col divide-y divide-border">
                  {season.episodes.map((ep) => {
                    const ready = ep.status === "READY";
                    const canPlay = ready && !isLocked;

                    return (
                      <div key={ep.id} className="flex items-center gap-4 py-3">
                        <span className="text-sm text-ink-dim tabular-nums w-6 shrink-0 text-right">
                          {ep.number}
                        </span>

                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${canPlay ? "text-ink" : "text-ink-muted"}`}>
                            {ep.title ?? `Episode ${ep.number}`}
                          </p>
                          {ep.durationSec && (
                            <p className="text-xs text-ink-dim mt-0.5">{fmtDuration(ep.durationSec)}</p>
                          )}
                        </div>

                        {!ready ? (
                          <span className="text-[10px] font-medium text-ink-dim bg-surface-raised border border-border rounded-full px-2 py-0.5 shrink-0">
                            Soon
                          </span>
                        ) : isLocked ? (
                          <svg className="w-4 h-4 text-gold/60 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                          </svg>
                        ) : (
                          <Link
                            href={`/watch/${ep.id}`}
                            aria-label={`Play episode ${ep.number}`}
                            className="w-8 h-8 rounded-full flex items-center justify-center bg-surface-raised border border-border hover:border-gold hover:bg-gold/10 text-ink-muted hover:text-gold transition-colors shrink-0"
                          >
                            <svg className="w-4 h-4 translate-x-px" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                              <path d="M8 5.14v13.72L19 12 8 5.14z" />
                            </svg>
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* SERIES with no seasons but direct episodes (edge case) */}
        {title.type === "SERIES" && title.seasons.length === 0 && title.episodes.length > 0 && (
          <div className="flex flex-col gap-1 mt-2">
            <h2 className="text-base font-semibold text-ink mb-3">Episodes</h2>
            <div className="flex flex-col divide-y divide-border">
              {title.episodes.map((ep) => {
                const ready = ep.status === "READY";
                const canPlay = ready && !isLocked;

                return (
                  <div key={ep.id} className="flex items-center gap-4 py-3">
                    <span className="text-sm text-ink-dim tabular-nums w-6 shrink-0 text-right">
                      {ep.number}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${canPlay ? "text-ink" : "text-ink-muted"}`}>
                        {ep.title ?? `Episode ${ep.number}`}
                      </p>
                      {ep.durationSec && (
                        <p className="text-xs text-ink-dim mt-0.5">{fmtDuration(ep.durationSec)}</p>
                      )}
                    </div>
                    {!ready ? (
                      <span className="text-[10px] font-medium text-ink-dim bg-surface-raised border border-border rounded-full px-2 py-0.5 shrink-0">
                        Soon
                      </span>
                    ) : isLocked ? (
                      <svg className="w-4 h-4 text-gold/60 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                      </svg>
                    ) : (
                      <Link
                        href={`/watch/${ep.id}`}
                        aria-label={`Play episode ${ep.number}`}
                        className="w-8 h-8 rounded-full flex items-center justify-center bg-surface-raised border border-border hover:border-gold hover:bg-gold/10 text-ink-muted hover:text-gold transition-colors shrink-0"
                      >
                        <svg className="w-4 h-4 translate-x-px" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                          <path d="M8 5.14v13.72L19 12 8 5.14z" />
                        </svg>
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
