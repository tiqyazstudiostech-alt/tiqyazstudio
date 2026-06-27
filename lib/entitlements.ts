import { Plan } from "@prisma/client";
import { db } from "@/lib/db";

export interface Entitlements {
  plan: Plan;
  maxQuality: "SD" | "HD";
  catalogAccess: "LIMITED" | "FULL";
}

export async function getEntitlements(userId: string): Promise<Entitlements> {
  const subscription = await db.subscription.findUnique({
    where: { userId },
    select: { plan: true },
  });

  const plan = subscription?.plan ?? Plan.FREE;
  return plan === Plan.PREMIUM
    ? { plan, maxQuality: "HD", catalogAccess: "FULL" }
    : { plan, maxQuality: "SD", catalogAccess: "LIMITED" };
}

export function canAccessTitle(entitlements: Entitlements, isPremium: boolean): boolean {
  if (!isPremium) return true;
  return entitlements.catalogAccess === "FULL";
}

export function canStreamQuality(entitlements: Entitlements, required: "SD" | "HD"): boolean {
  if (required === "SD") return true;
  return entitlements.maxQuality === "HD";
}
