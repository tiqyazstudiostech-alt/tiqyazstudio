"use server";

import { auth } from "@/lib/auth";
import { logEvent } from "@/lib/events";
import type { EventType } from "@prisma/client";

export async function logPlayStartAction(episodeId: string, titleId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;
  await logEvent({ userId: session.user.id, type: "PLAY_START" as EventType, episodeId, titleId });
}

export async function logPlayCompleteAction(episodeId: string, titleId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;
  await logEvent({ userId: session.user.id, type: "PLAY_COMPLETE" as EventType, episodeId, titleId });
}
