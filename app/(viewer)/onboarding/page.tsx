import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const profile = await db.profile.findUnique({
    where: { userId: session.user.id },
    select: { onboardingCompleted: true },
  });
  if (profile?.onboardingCompleted) redirect("/watch");

  const [genres, languages] = await Promise.all([
    db.genre.findMany({ where: { isActive: true }, orderBy: { displayOrder: "asc" } }),
    db.language.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  return <OnboardingForm genres={genres} languages={languages} />;
}
