import { type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getEntitlements, canAccessTitle } from "@/lib/entitlements";
import { getSignedPlaybackUrl } from "@/lib/bunny";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ episodeId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const { episodeId } = await params;

  const episode = await db.episode.findUnique({
    where: { id: episodeId, isDeleted: false },
    select: {
      status: true,
      bunnyVideoId: true,
      parentTitle: { select: { isPremium: true } },
    },
  });

  if (!episode || episode.status !== "READY" || !episode.bunnyVideoId) {
    return new Response("Not found", { status: 404 });
  }

  const entitlements = await getEntitlements(session.user.id);
  if (!canAccessTitle(entitlements, episode.parentTitle.isPremium)) {
    return new Response("Forbidden", { status: 403 });
  }

  return Response.json({ url: getSignedPlaybackUrl(episode.bunnyVideoId) });
}
