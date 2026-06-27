import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const AVATAR_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type AvatarContentType = (typeof AVATAR_ALLOWED_TYPES)[number];
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024; // 5 MB

const EXT: Record<AvatarContentType, string> = {
  "image/jpeg": "jpg",
  "image/png":  "png",
  "image/webp": "webp",
};

export function avatarExt(contentType: string): string | undefined {
  return EXT[contentType as AvatarContentType];
}

let _s3: S3Client | undefined;

function getS3(): S3Client {
  if (_s3) return _s3;

  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = process.env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    throw new Error("R2 storage credentials are not configured.");
  }

  _s3 = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
  });
  return _s3;
}

export async function getPresignedPutUrl(key: string, contentType: string): Promise<string> {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) throw new Error("R2_BUCKET_NAME is not configured.");

  const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
  return getSignedUrl(getS3(), command, { expiresIn: 300 });
}
