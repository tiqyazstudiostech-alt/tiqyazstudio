import { type EventType, Prisma } from "@prisma/client";
import { db } from "@/lib/db";

interface LogEventParams {
  userId: string;
  type: EventType;
  titleId?: string;
  episodeId?: string;
  value?: number;
  metadata?: Prisma.InputJsonObject;
}

export async function logEvent(params: LogEventParams): Promise<void> {
  try {
    await db.watchEvent.create({ data: params });
  } catch (err) {
    console.error("[events] failed to log event", { type: params.type, userId: params.userId }, err);
  }
}
