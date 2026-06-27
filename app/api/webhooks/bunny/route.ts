import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { db } from "@/lib/db";
import { getThumbnailUrl } from "@/lib/bunny";

// Bunny Stream VideoStatus codes sent in webhook payloads
// https://docs.bunny.net/reference/get_-libraryid-videos-videoid
const STATUS_FINISHED = 4; // all resolutions encoded, video fully ready
const STATUS_FAILED   = 6; // encoding failed

interface BunnyWebhookPayload {
  VideoLibraryId?: number;
  VideoGuid?:      string;
  Status?:         number;
  Duration?:       number;
  MediaFileIndex?: number | null;
  ErrorMessage?:   string | null;
}

export async function POST(request: Request): Promise<NextResponse> {
  const rawBody = await request.text();

  // Verify shared-secret signature if configured.
  // Bunny sends SHA256(rawBody + secret) in the bunny-signature header.
  const secret = process.env.BUNNY_WEBHOOK_SECRET;
  if (secret) {
    const received = request.headers.get("bunny-signature") ?? "";
    const expected = crypto.createHash("sha256").update(rawBody + secret).digest("hex");
    if (received !== expected) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
  }

  let payload: BunnyWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as BunnyWebhookPayload;
  } catch {
    return new NextResponse("Bad Request", { status: 400 });
  }

  const { VideoGuid, Status, Duration } = payload;

  // Ignore events that don't concern us
  if (!VideoGuid || Status === undefined) {
    return new NextResponse("OK", { status: 200 });
  }

  // Idempotent: updateMany handles retries (Bunny may fire multiple times)
  if (Status === STATUS_FINISHED) {
    await db.episode.updateMany({
      where: { bunnyVideoId: VideoGuid },
      data:  {
        status:      "READY",
        thumbnailUrl: getThumbnailUrl(VideoGuid),
        ...(Duration ? { durationSec: Math.round(Duration) } : {}),
      },
    });
  } else if (Status === STATUS_FAILED) {
    await db.episode.updateMany({
      where: { bunnyVideoId: VideoGuid },
      data:  { status: "ERROR" },
    });
  }

  return new NextResponse("OK", { status: 200 });
}
