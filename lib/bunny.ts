import crypto from "node:crypto";
import { env } from "@/lib/env";

// ─── Internal helpers ─────────────────────────────────────────────────────────

function requireStream() {
  return {
    libraryId: env.BUNNY_LIBRARY_ID,
    apiKey:    env.BUNNY_API_KEY,
    cdnHost:   env.BUNNY_CDN_HOSTNAME,
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BunnyUploadSignature {
  libraryId:      number;
  videoId:        string;
  expirationTime: number;
  signature:      string; // SHA256(libraryId + apiKey + expirationTime + videoId)
}

// ─── Video API ────────────────────────────────────────────────────────────────

export async function createVideo(title: string): Promise<string> {
  const { libraryId, apiKey } = requireStream();
  const res = await fetch(
    `https://video.bunnycdn.com/library/${libraryId}/videos`,
    {
      method:  "POST",
      headers: { AccessKey: apiKey, "Content-Type": "application/json" },
      body:    JSON.stringify({ title }),
    },
  );
  if (!res.ok) throw new Error(`Bunny createVideo failed: ${res.status} ${res.statusText}`);
  const data = (await res.json()) as { guid: string };
  return data.guid;
}

// Returns the TUS auth payload — NEVER includes the raw API key.
export function getUploadSignature(videoId: string): BunnyUploadSignature {
  const { libraryId, apiKey } = requireStream();
  const expirationTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour
  const signature = crypto
    .createHash("sha256")
    .update(libraryId + apiKey + expirationTime + videoId)
    .digest("hex");
  return { libraryId: Number(libraryId), videoId, expirationTime, signature };
}

export async function deleteVideo(videoId: string): Promise<void> {
  const { libraryId, apiKey } = requireStream();
  await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`, {
    method:  "DELETE",
    headers: { AccessKey: apiKey },
  });
}

export function getThumbnailUrl(videoId: string): string {
  const { cdnHost } = requireStream();
  return `https://${cdnHost}/${videoId}/thumbnail.jpg`;
}

// Returns a token-signed HLS URL that covers the video's entire directory, so
// playlist.m3u8 AND every .ts segment are authorized by one token.
//
// Bunny directory-token algorithm:
//   hash  = Base64URL( SHA256( key + expires + tokenPath ) )
//   URL   = https://{host}/{videoId}/playlist.m3u8
//             ?token={hash}&expires={expires}&token_path={tokenPath}
//
// token_path restricts the token to any CDN path that starts with tokenPath,
// which covers /{videoId}/playlist.m3u8 and all /{videoId}/*.ts segments.
export function getSignedPlaybackUrl(videoId: string, expiresIn = 21600): string {
  const { cdnHost } = requireStream();
  const tokenKey  = env.BUNNY_TOKEN_AUTH_KEY;
  const expires   = Math.floor(Date.now() / 1000) + expiresIn;
  const tokenPath = `/${videoId}/`;

  const token = crypto
    .createHash("sha256")
    .update(tokenKey + expires + tokenPath)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  return (
    `https://${cdnHost}/${videoId}/playlist.m3u8` +
    `?token=${token}&expires=${expires}&token_path=${tokenPath}`
  );
}
