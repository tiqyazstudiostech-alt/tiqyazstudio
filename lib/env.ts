import { z } from "zod";

const envSchema = z.object({
  // Runtime
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  // Database
  DATABASE_URL: z.string().url(),

  // Auth (Auth.js v5)
  AUTH_SECRET: z.string().min(1),
  AUTH_URL: z.string().url().optional(),

  // Bunny Stream
  BUNNY_API_KEY: z.string().min(1),
  BUNNY_STREAM_LIBRARY_ID: z.string().min(1),
  BUNNY_STREAM_CDN_HOSTNAME: z.string().min(1),

  // Bunny Storage (images / attachments)
  BUNNY_STORAGE_ZONE: z.string().min(1),
  BUNNY_STORAGE_HOST: z.string().min(1),
  BUNNY_STORAGE_ACCESS_KEY: z.string().min(1),
  BUNNY_PUBLIC_CDN_URL: z.string().url(),

  // Cloudflare R2 (alternative object storage)
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_NAME: z.string().min(1),
  R2_PUBLIC_URL: z.string().url(),

  // Resend (email)
  RESEND_API_KEY: z.string().min(1),

  // Paystack (payments)
  PAYSTACK_SECRET_KEY: z.string().min(1),
  NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: z.string().min(1),

  // Anthropic (AI features)
  ANTHROPIC_API_KEY: z.string().min(1),
});

// Throws at startup if any required var is missing or malformed.
export const env = envSchema.parse(process.env);
