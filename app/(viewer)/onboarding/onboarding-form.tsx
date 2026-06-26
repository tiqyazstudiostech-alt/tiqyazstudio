"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui";
import { PreferencesPicker } from "@/components/preferences-picker";
import { completeOnboardingAction, type OnboardingState } from "@/app/actions/onboarding";
import type { Genre, Language } from "@prisma/client";

interface Props {
  genres: Genre[];
  languages: Language[];
}

const DEFAULT_LANGUAGE_CODE = "en";

export function OnboardingForm({ genres, languages }: Props) {
  const defaultLanguageIds = languages
    .filter((l) => l.code === DEFAULT_LANGUAGE_CODE)
    .map((l) => l.id);

  const [canContinue, setCanContinue] = useState(false);
  const [genresNeeded, setGenresNeeded] = useState(3);

  const [state, action, isPending] = useActionState<OnboardingState, FormData>(
    completeOnboardingAction,
    null,
  );

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-16">
      <form action={action} className="w-full max-w-2xl flex flex-col gap-10">
        <div>
          <h1 className="text-3xl font-bold text-ink">What do you love watching?</h1>
          <p className="mt-2 text-ink-muted">
            Pick your interests to personalise your Tiqyaz experience.
          </p>
        </div>

        <PreferencesPicker
          genres={genres}
          languages={languages}
          initialLanguageIds={defaultLanguageIds}
          onValidityChange={(isValid, needed) => {
            setCanContinue(isValid);
            setGenresNeeded(needed);
          }}
        />

        {state && "error" in state && (
          <p className="text-sm text-error">{state.error}</p>
        )}

        <p className="text-xs text-ink-muted">
          Your selections personalise your recommendations and can be changed anytime in Settings.
        </p>

        <Button type="submit" loading={isPending} disabled={!canContinue} className="w-full">
          {genresNeeded > 0
            ? `Pick ${genresNeeded} more genre${genresNeeded === 1 ? "" : "s"} to continue`
            : "Continue to Tiqyaz"}
        </Button>
      </form>
    </div>
  );
}
