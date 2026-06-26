"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logEvent } from "@/lib/events";
import { redirect } from "next/navigation";
import { z } from "zod";

export type OnboardingState = { error: string } | null;

const schema = z.object({
  genreIds: z.array(z.string()).min(3, "Please select at least 3 genres to continue."),
  languageIds: z.array(z.string()).min(1, "Please select at least one language."),
});

export async function completeOnboardingAction(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated." };

  const parsed = schema.safeParse({
    genreIds: formData.getAll("genreIds").map(String),
    languageIds: formData.getAll("languageIds").map(String),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const profile = await db.profile.upsert({
    where:  { userId: session.user.id },
    update: {},
    create: { userId: session.user.id, preferences: {} },
    select: { id: true },
  });

  await db.profile.update({
    where: { id: profile.id },
    data: {
      onboardingCompleted: true,
      genres: { set: parsed.data.genreIds.map((id) => ({ id })) },
      preferredLanguages: { set: parsed.data.languageIds.map((id) => ({ id })) },
    },
  });

  await logEvent({ userId: session.user.id, type: "ONBOARDING_COMPLETED" });

  redirect("/watch");
}
