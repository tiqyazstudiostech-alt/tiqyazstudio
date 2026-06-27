"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logEvent } from "@/lib/events";
import { revalidatePath } from "next/cache";
import type { EventType } from "@prisma/client";

export async function addToWatchlistAction(titleId: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await db.watchlistItem.upsert({
    where:  { userId_titleId: { userId: session.user.id, titleId } },
    update: {},
    create: { userId: session.user.id, titleId },
  });

  await logEvent({ userId: session.user.id, type: "WATCHLIST_ADD" as EventType, titleId });
  revalidatePath("/home");
  return {};
}

export async function removeFromWatchlistAction(titleId: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await db.watchlistItem.deleteMany({
    where: { userId: session.user.id, titleId },
  });

  await logEvent({ userId: session.user.id, type: "WATCHLIST_REMOVE" as EventType, titleId });
  revalidatePath("/home");
  return {};
}
