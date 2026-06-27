import Link from "next/link";
import { WatchlistButton } from "./watchlist-button";

interface TitleCardProps {
  titleId: string;
  href: string;
  title: string;
  imageUrl?: string;
  isPremium: boolean;
  isLocked: boolean;
  /** 0–100 — renders a progress bar when present */
  progressPct?: number;
  /** secondary line below the title */
  sublabel?: string;
  isInWatchlist: boolean;
}

export function TitleCard({
  titleId,
  href,
  title,
  imageUrl,
  isPremium,
  isLocked,
  progressPct,
  sublabel,
  isInWatchlist,
}: TitleCardProps) {
  const cardContent = (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-surface-raised group-hover:ring-1 group-hover:ring-gold/40 transition-all duration-200">
      {/* Poster / backdrop */}
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-surface-raised">
          <span className="text-ink-dim text-xs text-center px-3 leading-snug">{title}</span>
        </div>
      )}

      {/* Bottom gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

      {/* Premium lock badge */}
      {isPremium && (
        <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/70 rounded-full px-2 py-0.5 pointer-events-none">
          {isLocked && (
            <svg className="w-3 h-3 text-gold shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
            </svg>
          )}
          <span className="text-gold text-[10px] font-semibold leading-none">PREMIUM</span>
        </div>
      )}

      {/* Watchlist toggle */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <WatchlistButton titleId={titleId} initialInWatchlist={isInWatchlist} />
      </div>

      {/* Progress bar */}
      {progressPct !== undefined && progressPct > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 pointer-events-none">
          <div className="h-full bg-gold transition-[width]" style={{ width: `${progressPct}%` }} />
        </div>
      )}
    </div>
  );

  return (
    <div className="shrink-0 w-56 group">
      {isLocked ? (
        // Locked: link to subscription upgrade instead of playback
        <Link href="/settings/subscription" title="Upgrade to watch">{cardContent}</Link>
      ) : (
        <Link href={href}>{cardContent}</Link>
      )}
      <div className="mt-2 px-0.5">
        <p className="text-sm font-medium text-ink truncate">{title}</p>
        {sublabel && <p className="text-xs text-ink-muted truncate mt-0.5">{sublabel}</p>}
      </div>
    </div>
  );
}
