"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

export type SettingsState = { error: string } | { success: string } | null;

const preferencesSchema = z.object({
  genreIds: z.array(z.string()).min(3, "Please select at least 3 genres."),
  languageIds: z.array(z.string()).min(1, "Please select at least one language."),
});

export async function savePreferencesAction(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated." };

  const parsed = preferencesSchema.safeParse({
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
      genres: { set: parsed.data.genreIds.map((id) => ({ id })) },
      preferredLanguages: { set: parsed.data.languageIds.map((id) => ({ id })) },
    },
  });

  return { success: "Preferences saved." };
}
