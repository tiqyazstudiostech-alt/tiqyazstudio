import { type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logEvent } from "@/lib/events";
import type { EventType } from "@prisma/client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ episodeId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return new Response(null, { status: 401 });

  const { episodeId } = await params;

  let body: { type?: string };
  try {
    body = (await req.json()) as { type?: string };
  } catch {
    return new Response(null, { status: 400 });
  }

  if (body.type !== "PLAY_ABANDON") return new Response(null, { status: 400 });

  const episode = await db.episode.findUnique({
    where: { id: episodeId },
    select: { titleId: true },
  });
  if (!episode) return new Response(null, { status: 404 });

  await logEvent({
    userId: session.user.id,
    type: "PLAY_ABANDON" as EventType,
    episodeId,
    titleId: episode.titleId,
  });

  return new Response(null, { status: 204 });
}
