"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Plan } from "@prisma/client";
import type { Role } from "@prisma/client";
import { z } from "zod";

export type AdminActionResult = { error: string } | { success: string };

const setPlanSchema = z.object({
  userId: z.string().min(1),
  plan: z.nativeEnum(Plan),
});

export async function setUserPlanAction(
  _prev: AdminActionResult | null,
  formData: FormData,
): Promise<AdminActionResult> {
  const session = await auth();
  if (!session?.user || (session.user as { role: Role }).role !== "ADMIN") {
    return { error: "Unauthorized." };
  }

  const parsed = setPlanSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { userId, plan } = parsed.data;

  await db.subscription.upsert({
    where: { userId },
    update: { plan },
    create: { userId, plan },
  });

  return { success: `Plan updated to ${plan}.` };
}
