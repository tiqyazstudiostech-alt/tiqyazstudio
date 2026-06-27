"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { TitleType, ContentStatus, VideoStatus, type Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  AVATAR_ALLOWED_TYPES,
  avatarExt,
  getPresignedPutUrl,
} from "@/lib/storage";
import { randomUUID } from "node:crypto";

export type ContentActionResult = { error: string } | { success: string; id?: string } | null;

async function requireAdmin(): Promise<string | null> {
  const session = await auth();
  const role = (session?.user as { role: Role } | undefined)?.role;
  if (!session?.user || role !== "ADMIN") return "Unauthorized.";
  return null;
}

// ─── Image upload ─────────────────────────────────────────────────────────────

export async function requestContentImageUploadAction(
  contentType: string,
  field: "poster" | "backdrop" | "thumbnail",
): Promise<{ uploadUrl: string; publicUrl: string } | { error: string }> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };

  if (!(AVATAR_ALLOWED_TYPES as readonly string[]).includes(contentType)) {
    return { error: "File must be JPEG, PNG, or WebP." };
  }

  const ext = avatarExt(contentType);
  if (!ext) return { error: "Unsupported file type." };

  const publicBase = process.env.R2_PUBLIC_URL;
  if (!publicBase) return { error: "R2 not configured." };

  const key = `content/${field}/${randomUUID()}.${ext}`;
  try {
    const uploadUrl = await getPresignedPutUrl(key, contentType);
    return { uploadUrl, publicUrl: `${publicBase}/${key}` };
  } catch {
    return { error: "Could not generate upload URL." };
  }
}

// ─── Title CRUD ───────────────────────────────────────────────────────────────

const titleInputSchema = z.object({
  type:          z.nativeEnum(TitleType),
  title:         z.string().min(1, "Title is required").max(200),
  slug:          z.string().min(1, "Slug is required").max(200)
                   .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  synopsis:      z.string().optional(),
  releaseYear:   z.preprocess(
    (v) => (v === "" || v === undefined ? undefined : Number(v)),
    z.number().int().min(1900).max(2100).optional(),
  ),
  maturityRating: z.string().optional(),
  isPremium:      z.preprocess((v) => v === "on", z.boolean()),
  status:         z.nativeEnum(ContentStatus),
  posterUrl:      z.preprocess((v) => (v === "" ? undefined : v), z.string().optional()),
  backdropUrl:    z.preprocess((v) => (v === "" ? undefined : v), z.string().optional()),
  trailerUrl:     z.preprocess((v) => (v === "" ? undefined : v), z.string().optional()),
});

export async function createTitleAction(
  _prev: ContentActionResult | null,
  formData: FormData,
): Promise<ContentActionResult> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };

  const parsed = titleInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const genreIds    = (formData.getAll("genreIds")    as string[]).filter(Boolean);
  const languageIds = (formData.getAll("languageIds") as string[]).filter(Boolean);

  const existing = await db.title.findUnique({ where: { slug: parsed.data.slug }, select: { id: true } });
  if (existing) return { error: "A title with this slug already exists." };

  const created = await db.title.create({
    data: {
      ...parsed.data,
      genres:    { connect: genreIds.map((id) => ({ id })) },
      languages: { connect: languageIds.map((id) => ({ id })) },
    },
  });

  if (created.type === TitleType.FILM) {
    await db.episode.create({
      data: { titleId: created.id, number: 1, title: created.title, status: VideoStatus.PROCESSING },
    });
  }

  revalidatePath("/admin/titles");
  redirect(`/admin/titles/${created.id}/edit`);
}

export async function updateTitleAction(
  _prev: ContentActionResult | null,
  formData: FormData,
): Promise<ContentActionResult> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };

  const id = formData.get("id") as string;
  if (!id) return { error: "Title ID is required." };

  const parsed = titleInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const genreIds    = (formData.getAll("genreIds")    as string[]).filter(Boolean);
  const languageIds = (formData.getAll("languageIds") as string[]).filter(Boolean);

  const slugOwner = await db.title.findUnique({ where: { slug: parsed.data.slug }, select: { id: true } });
  if (slugOwner && slugOwner.id !== id) return { error: "A title with this slug already exists." };

  await db.title.update({
    where: { id },
    data: {
      ...parsed.data,
      genres:    { set: genreIds.map((gid) => ({ id: gid })) },
      languages: { set: languageIds.map((lid) => ({ id: lid })) },
    },
  });

  revalidatePath(`/admin/titles/${id}/edit`);
  revalidatePath("/admin/titles");
  return { success: "Saved." };
}

export async function softDeleteTitleAction(
  _prev: ContentActionResult | null,
  formData: FormData,
): Promise<ContentActionResult> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };

  const id = formData.get("id") as string;
  if (!id) return { error: "Title ID is required." };

  await db.title.update({ where: { id }, data: { isDeleted: true } });
  revalidatePath("/admin/titles");
  redirect("/admin/titles");
}

// ─── Season CRUD ──────────────────────────────────────────────────────────────

const seasonSchema = z.object({
  titleId: z.string().min(1),
  number:  z.coerce.number().int().min(1),
  name:    z.string().optional(),
});

export async function createSeasonAction(
  _prev: ContentActionResult | null,
  formData: FormData,
): Promise<ContentActionResult> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };

  const parsed = seasonSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const season = await db.season.create({ data: parsed.data });
  revalidatePath(`/admin/titles/${parsed.data.titleId}/edit`);
  return { success: "Season added.", id: season.id };
}

export async function updateSeasonAction(
  _prev: ContentActionResult | null,
  formData: FormData,
): Promise<ContentActionResult> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };

  const id      = formData.get("id") as string;
  const titleId = formData.get("titleId") as string;
  if (!id || !titleId) return { error: "Missing required fields." };

  const parsed = seasonSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await db.season.update({ where: { id }, data: { number: parsed.data.number, name: parsed.data.name } });
  revalidatePath(`/admin/titles/${titleId}/edit`);
  return { success: "Season updated." };
}

export async function softDeleteSeasonAction(
  _prev: ContentActionResult | null,
  formData: FormData,
): Promise<ContentActionResult> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };

  const id      = formData.get("id") as string;
  const titleId = formData.get("titleId") as string;
  if (!id || !titleId) return { error: "Missing required fields." };

  await db.season.update({ where: { id }, data: { isDeleted: true } });
  revalidatePath(`/admin/titles/${titleId}/edit`);
  return { success: "Season deleted." };
}

// ─── Episode CRUD ─────────────────────────────────────────────────────────────

const episodeSchema = z.object({
  titleId:      z.string().min(1),
  seasonId:     z.preprocess((v) => (v === "" ? undefined : v), z.string().optional()),
  number:       z.coerce.number().int().min(1),
  title:        z.preprocess((v) => (v === "" ? undefined : v), z.string().optional()),
  synopsis:     z.preprocess((v) => (v === "" ? undefined : v), z.string().optional()),
  durationSec:  z.preprocess(
    (v) => (v === "" || v === undefined ? undefined : Number(v)),
    z.number().int().positive().optional(),
  ),
  thumbnailUrl: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional()),
});

export async function createEpisodeAction(
  _prev: ContentActionResult | null,
  formData: FormData,
): Promise<ContentActionResult> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };

  const parsed = episodeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const episode = await db.episode.create({
    data: { ...parsed.data, status: VideoStatus.PROCESSING },
  });
  revalidatePath(`/admin/titles/${parsed.data.titleId}/edit`);
  return { success: "Episode added.", id: episode.id };
}

export async function updateEpisodeAction(
  _prev: ContentActionResult | null,
  formData: FormData,
): Promise<ContentActionResult> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };

  const id      = formData.get("id") as string;
  const titleId = formData.get("titleId") as string;
  if (!id || !titleId) return { error: "Missing required fields." };

  const parsed = episodeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await db.episode.update({
    where: { id },
    data: {
      number:       parsed.data.number,
      title:        parsed.data.title,
      synopsis:     parsed.data.synopsis,
      durationSec:  parsed.data.durationSec,
      thumbnailUrl: parsed.data.thumbnailUrl,
    },
  });
  revalidatePath(`/admin/titles/${titleId}/edit`);
  return { success: "Episode updated." };
}

export async function softDeleteEpisodeAction(
  _prev: ContentActionResult | null,
  formData: FormData,
): Promise<ContentActionResult> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };

  const id      = formData.get("id") as string;
  const titleId = formData.get("titleId") as string;
  if (!id || !titleId) return { error: "Missing required fields." };

  await db.episode.update({ where: { id }, data: { isDeleted: true } });
  revalidatePath(`/admin/titles/${titleId}/edit`);
  return { success: "Episode deleted." };
}
