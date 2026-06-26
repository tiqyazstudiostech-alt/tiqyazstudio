import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function ViewerLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const pathname = (await headers()).get("x-pathname") ?? "";

  if (!pathname.startsWith("/onboarding")) {
    const profile = await db.profile.findUnique({
      where: { userId: session.user.id },
      select: { onboardingCompleted: true },
    });
    if (!profile?.onboardingCompleted) redirect("/onboarding");
  }

  return <>{children}</>;
}
