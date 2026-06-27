"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Role } from "@prisma/client";
import { createVideo, getUploadSignature, deleteVideo, type BunnyUploadSignature } from "@/lib/bunny";

export type VideoUploadResult =
  | { videoId: string; signature: BunnyUploadSignature }
  | { error: string };

async function requireAdmin(): Promise<string | null> {
  const session = await auth();
  const role = (session?.user as { role: Role } | undefined)?.role;
  if (!session?.user || role !== "ADMIN") return "Unauthorized.";
  return null;
}

export async function initiateVideoUploadAction(
  episodeId: string,
  videoTitle: string,
): Promise<VideoUploadResult> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };

  const episode = await db.episode.findUnique({
    where:  { id: episodeId, isDeleted: false },
    select: { id: true, bunnyVideoId: true },
  });
  if (!episode) return { error: "Episode not found." };

  // Delete the old Bunny video if one exists to avoid orphaned assets
  if (episode.bunnyVideoId) {
    await deleteVideo(episode.bunnyVideoId).catch(() => {});
  }

  let videoId: string;
  try {
    videoId = await createVideo(videoTitle || "Untitled");
  } catch (err) {
    console.error("[video] Bunny createVideo failed", err);
    return { error: "Could not create video on Bunny. Check BUNNY_* env vars." };
  }

  const signature = getUploadSignature(videoId);

  await db.episode.update({
    where: { id: episodeId },
    data:  { bunnyVideoId: videoId, status: "PROCESSING" },
  });

  return { videoId, signature };
}
