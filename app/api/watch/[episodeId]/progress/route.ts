import { type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logEvent } from "@/lib/events";
import type { EventType } from "@prisma/client";

interface ProgressBody {
  positionSec?: unknown;
  durationSec?: unknown;
  completed?: unknown;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ episodeId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return new Response(null, { status: 401 });

  const { episodeId } = await params;

  let body: ProgressBody;
  try {
    body = (await req.json()) as ProgressBody;
  } catch {
    return new Response(null, { status: 400 });
  }

  const positionSec = typeof body.positionSec === "number" ? Math.floor(body.positionSec) : null;
  const durationSec = typeof body.durationSec === "number" ? Math.floor(body.durationSec) : null;
  const completed   = body.completed === true;

  if (positionSec === null || positionSec < 0) return new Response(null, { status: 400 });

  // Verify episode exists (protect against spoofed episodeIds).
  const episode = await db.episode.findUnique({
    where: { id: episodeId },
    select: { titleId: true },
  });
  if (!episode) return new Response(null, { status: 404 });

  // Upsert progress — one row per user/episode.
  await db.watchProgress.upsert({
    where:  { userId_episodeId: { userId: session.user.id, episodeId } },
    update: { positionSec, ...(durationSec !== null && { durationSec }), completed },
    create: { userId: session.user.id, episodeId, positionSec, durationSec, completed },
  });

  // Emit PLAY_PROGRESS event (feeds the recommender; separate from the state row).
  await logEvent({
    userId:    session.user.id,
    type:      "PLAY_PROGRESS" as EventType,
    episodeId,
    titleId:   episode.titleId,
    value:     durationSec && durationSec > 0 ? positionSec / durationSec : undefined,
    metadata:  { positionSec, durationSec, completed },
  });

  return new Response(null, { status: 204 });
}
