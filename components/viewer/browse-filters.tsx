"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface Genre {
  id: string;
  slug: string;
  name: string;
}

interface BrowseFiltersProps {
  genres: Genre[];
  currentGenre?: string;
  currentQ?: string;
}

export function BrowseFilters({ genres, currentGenre, currentQ }: BrowseFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      const qs = params.toString();
      router.push(`/browse${qs ? `?${qs}` : ""}`);
    },
    [router, searchParams],
  );

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = (new FormData(e.currentTarget).get("q") as string | null)?.trim() ?? "";
    updateParam("q", q || null);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <form onSubmit={handleSearch} className="relative max-w-sm">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-dim pointer-events-none"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1 0 4.85 4.85a7.5 7.5 0 0 0 11.8 11.8z" />
        </svg>
        <input
          name="q"
          type="search"
          placeholder="Search titles…"
          defaultValue={currentQ}
          className="w-full bg-surface border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-ink placeholder:text-ink-dim focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1 focus-visible:ring-offset-background focus-visible:border-gold hover:border-border-strong transition-colors"
        />
      </form>

      {/* Genre pills */}
      {genres.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <GenrePill
            label="All"
            active={!currentGenre}
            onClick={() => updateParam("genre", null)}
          />
          {genres.map((g) => (
            <GenrePill
              key={g.id}
              label={g.name}
              active={currentGenre === g.slug}
              onClick={() =>
                updateParam("genre", currentGenre === g.slug ? null : g.slug)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function GenrePill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "px-3 py-1 text-xs font-medium rounded-full border transition-colors duration-150 " +
        (active
          ? "bg-gold text-gold-fg border-gold"
          : "bg-transparent text-ink-muted border-border hover:border-border-strong hover:text-ink")
      }
    >
      {label}
    </button>
  );
}
