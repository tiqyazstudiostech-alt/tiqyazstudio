"use client";

import { useEffect, useRef, useState } from "react";
import type { Genre, Language } from "@prisma/client";

function ToggleChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "px-4 py-2 rounded-full text-sm font-medium border transition-all duration-150",
        selected
          ? "bg-gold text-gold-fg border-gold"
          : "bg-surface text-ink-muted border-border hover:border-border-strong hover:text-ink",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

interface Props {
  genres: Genre[];
  languages: Language[];
  initialGenreIds?: string[];
  initialLanguageIds?: string[];
  /** Called whenever selection changes. genresNeeded = how many more to reach the minimum 3. */
  onValidityChange?: (isValid: boolean, genresNeeded: number) => void;
}

export function PreferencesPicker({
  genres,
  languages,
  initialGenreIds = [],
  initialLanguageIds = [],
  onValidityChange,
}: Props) {
  const [selectedGenres, setSelectedGenres] = useState<Set<string>>(
    () => new Set(initialGenreIds),
  );
  const [selectedLanguages, setSelectedLanguages] = useState<Set<string>>(
    () => new Set(initialLanguageIds),
  );

  // Stable ref so callers don't need useCallback
  const callbackRef = useRef(onValidityChange);
  callbackRef.current = onValidityChange;

  useEffect(() => {
    const genresNeeded = Math.max(0, 3 - selectedGenres.size);
    callbackRef.current?.(genresNeeded === 0 && selectedLanguages.size >= 1, genresNeeded);
  }, [selectedGenres.size, selectedLanguages.size]);

  function toggleGenre(id: string) {
    setSelectedGenres((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleLanguage(id: string) {
    setSelectedLanguages((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const genresNeeded = Math.max(0, 3 - selectedGenres.size);

  return (
    <div className="flex flex-col gap-8">
      {/* Hidden inputs carry selected IDs to the server action */}
      {Array.from(selectedGenres).map((id) => (
        <input key={`g-${id}`} type="hidden" name="genreIds" value={id} />
      ))}
      {Array.from(selectedLanguages).map((id) => (
        <input key={`l-${id}`} type="hidden" name="languageIds" value={id} />
      ))}

      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xs font-semibold text-ink uppercase tracking-widest">Genres</h2>
          <span className="text-xs text-ink-muted">
            {genresNeeded > 0 ? `${genresNeeded} more to go` : "✓ Good to go"}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {genres.map((genre) => (
            <ToggleChip
              key={genre.id}
              label={genre.name}
              selected={selectedGenres.has(genre.id)}
              onClick={() => toggleGenre(genre.id)}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold text-ink uppercase tracking-widest">Languages</h2>
        <div className="flex flex-wrap gap-2">
          {languages.map((lang) => (
            <ToggleChip
              key={lang.id}
              label={lang.name}
              selected={selectedLanguages.has(lang.id)}
              onClick={() => toggleLanguage(lang.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
