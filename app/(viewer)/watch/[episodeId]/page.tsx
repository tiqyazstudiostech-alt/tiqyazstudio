import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getEntitlements, canAccessTitle } from "@/lib/entitlements";
import { getSignedPlaybackUrl } from "@/lib/bunny";
import { HlsPlayer } from "@/components/player";

interface PageProps {
  params: Promise<{ episodeId: string }>;
}

export default async function WatchEpisodePage({ params }: PageProps) {
  const { episodeId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const episode = await db.episode.findUnique({
    where: { id: episodeId, isDeleted: false },
    select: {
      id: true,
      number: true,
      title: true,
      durationSec: true,
      status: true,
      bunnyVideoId: true,
      titleId: true,
      parentTitle: {
        select: {
          id: true,
          title: true,
          isPremium: true,
          backdropUrl: true,
        },
      },
    },
  });

  if (!episode) notFound();

  if (episode.status !== "READY" || !episode.bunnyVideoId) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center px-4">
          <p className="text-white/60 text-sm">
            &ldquo;{episode.parentTitle.title}&rdquo; is not available yet.
          </p>
          <p className="text-white/40 text-xs mt-1">
            It&rsquo;s still being processed — check back soon.
          </p>
        </div>
      </div>
    );
  }

  const entitlements = await getEntitlements(session.user.id);
  if (!canAccessTitle(entitlements, episode.parentTitle.isPremium)) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center max-w-xs">
          <p className="text-xs uppercase tracking-[0.3em] text-gold mb-3">Premium</p>
          <p className="text-white font-semibold text-lg mb-2">
            {episode.parentTitle.title}
          </p>
          <p className="text-white/50 text-sm mb-6">
            This title is only available to Premium members.
          </p>
          <a
            href="/settings/subscription"
            className="inline-flex items-center px-5 py-2.5 bg-gold text-gold-fg text-sm font-semibold rounded-lg hover:bg-gold-hover transition-colors"
          >
            Upgrade to Premium
          </a>
        </div>
      </div>
    );
  }

  // Entitlement gate passed — generate signed URL server-side only.
  const signedUrl = getSignedPlaybackUrl(episode.bunnyVideoId);

  // Load existing progress for resume-from-position.
  const savedProgress = await db.watchProgress.findUnique({
    where:  { userId_episodeId: { userId: session.user.id, episodeId: episode.id } },
    select: { positionSec: true, completed: true },
  });
  // Don't resume if already completed — start fresh.
  const resumePosition =
    savedProgress && !savedProgress.completed ? savedProgress.positionSec : undefined;

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center">
      <HlsPlayer
        src={signedUrl}
        episodeId={episode.id}
        titleId={episode.titleId}
        durationSec={episode.durationSec ?? undefined}
        seriesTitle={episode.parentTitle.title}
        episodeTitle={episode.title ?? undefined}
        episodeNumber={episode.number}
        backdropUrl={episode.parentTitle.backdropUrl ?? undefined}
        resumePosition={resumePosition}
      />
    </div>
  );
}
