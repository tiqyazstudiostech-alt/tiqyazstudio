"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  getPresignedPutUrl,
  avatarExt,
  AVATAR_ALLOWED_TYPES,
} from "@/lib/storage";
import bcrypt from "bcryptjs";
import { z } from "zod";
import crypto from "node:crypto";

export type ProfileState = { error: string } | { success: string } | null;

// ─── Avatar ─────────────────────────────────────────────────────────────────

export async function requestAvatarUploadAction(
  contentType: string,
): Promise<{ uploadUrl: string; publicUrl: string } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated." };

  if (!(AVATAR_ALLOWED_TYPES as readonly string[]).includes(contentType)) {
    return { error: "File type must be JPEG, PNG, or WebP." };
  }

  const ext = avatarExt(contentType);
  if (!ext) return { error: "Unsupported file type." };

  const key = `avatars/${session.user.id}/${crypto.randomUUID()}.${ext}`;

  try {
    const uploadUrl = await getPresignedPutUrl(key, contentType);
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;
    return { uploadUrl, publicUrl };
  } catch {
    return { error: "Storage is not configured. Contact support." };
  }
}

export async function saveAvatarUrlAction(avatarUrl: string): Promise<ProfileState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated." };

  await db.profile.upsert({
    where:  { userId: session.user.id },
    update: { avatarUrl },
    create: { userId: session.user.id, preferences: {}, avatarUrl },
  });

  return { success: "Avatar updated." };
}

// ─── Display name ───────────────────────────────────────────────────────────

const nameSchema = z.object({
  name: z.string().min(1, "Name is required.").max(100),
});

export async function updateDisplayNameAction(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated." };

  const parsed = nameSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await db.user.update({
    where: { id: session.user.id },
    data:  { name: parsed.data.name },
  });

  return { success: "Name updated." };
}

// ─── Password ───────────────────────────────────────────────────────────────

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword:     z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(1, "Please confirm your new password."),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export async function changePasswordAction(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated." };

  const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const user = await db.user.findUnique({
    where:  { id: session.user.id },
    select: { hashedPassword: true },
  });

  if (!user?.hashedPassword) {
    return { error: "No password is set on this account. Sign in via Google." };
  }

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.hashedPassword);
  if (!valid) return { error: "Current password is incorrect." };

  const newHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await db.user.update({
    where: { id: session.user.id },
    data:  { hashedPassword: newHash },
  });

  return { success: "Password changed successfully." };
}
