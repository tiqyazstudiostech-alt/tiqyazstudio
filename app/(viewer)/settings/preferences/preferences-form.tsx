"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui";
import { PreferencesPicker } from "@/components/preferences-picker";
import { savePreferencesAction, type SettingsState } from "@/app/actions/settings";
import type { Genre, Language } from "@prisma/client";

interface Props {
  genres: Genre[];
  languages: Language[];
  initialGenreIds: string[];
  initialLanguageIds: string[];
}

export function PreferencesForm({ genres, languages, initialGenreIds, initialLanguageIds }: Props) {
  const [canSave, setCanSave] = useState(
    initialGenreIds.length >= 3 && initialLanguageIds.length >= 1,
  );

  const [state, action, isPending] = useActionState<SettingsState, FormData>(
    savePreferencesAction,
    null,
  );

  return (
    <form action={action} className="flex flex-col gap-8">
      <PreferencesPicker
        genres={genres}
        languages={languages}
        initialGenreIds={initialGenreIds}
        initialLanguageIds={initialLanguageIds}
        onValidityChange={(isValid) => setCanSave(isValid)}
      />

      <div className="flex flex-col gap-3">
        {state && "error" in state && (
          <p className="text-sm text-error">{state.error}</p>
        )}
        {state && "success" in state && (
          <p className="text-sm text-success">{state.success}</p>
        )}

        <p className="text-xs text-ink-muted">
          Changes apply to your recommendations immediately.
        </p>

        <Button type="submit" loading={isPending} disabled={!canSave} className="w-fit">
          Save preferences
        </Button>
      </div>
    </form>
  );
}
