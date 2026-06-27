"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addToWatchlistAction, removeFromWatchlistAction } from "@/app/actions/watchlist";

interface Props {
  titleId: string;
  initialInWatchlist: boolean;
}

export function WatchlistButton({ titleId, initialInWatchlist }: Props) {
  const router                   = useRouter();
  const [isPending, startTransition] = useTransition();
  const [inWatchlist, setInWatchlist] = useState(initialInWatchlist);

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = !inWatchlist;
    setInWatchlist(next); // optimistic
    startTransition(async () => {
      await (next ? addToWatchlistAction(titleId) : removeFromWatchlistAction(titleId));
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      aria-label={inWatchlist ? "Remove from My List" : "Add to My List"}
      className={
        "flex items-center justify-center w-7 h-7 rounded-full border transition-colors " +
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold " +
        (inWatchlist
          ? "bg-gold border-gold text-gold-fg hover:bg-gold-hover"
          : "bg-black/60 border-white/30 text-white hover:border-white")
      }
    >
      {inWatchlist ? (
        // Checkmark
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      ) : (
        // Plus
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      )}
    </button>
  );
}
