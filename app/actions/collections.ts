"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { type Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type CollectionActionResult = { error: string } | { success: string; id?: string } | null;

async function requireAdmin(): Promise<string | null> {
  const session = await auth();
  const role = (session?.user as { role: Role } | undefined)?.role;
  if (!session?.user || role !== "ADMIN") return "Unauthorized.";
  return null;
}

const collectionSchema = z.object({
  name:         z.string().min(1, "Name is required").max(100),
  slug:         z.string().min(1, "Slug is required").max(100)
                  .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  description:  z.preprocess((v) => (v === "" ? undefined : v), z.string().optional()),
  displayOrder: z.coerce.number().int().optional().default(0),
  isActive:     z.preprocess((v) => v === "on", z.boolean()),
});

export async function createCollectionAction(
  _prev: CollectionActionResult | null,
  formData: FormData,
): Promise<CollectionActionResult> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };

  const parsed = collectionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const existing = await db.collection.findUnique({ where: { slug: parsed.data.slug }, select: { id: true } });
  if (existing) return { error: "A collection with this slug already exists." };

  const collection = await db.collection.create({ data: parsed.data });
  revalidatePath("/admin/collections");
  redirect(`/admin/collections/${collection.id}/edit`);
}

export async function updateCollectionAction(
  _prev: CollectionActionResult | null,
  formData: FormData,
): Promise<CollectionActionResult> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };

  const id = formData.get("id") as string;
  if (!id) return { error: "Collection ID is required." };

  const parsed = collectionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const slugOwner = await db.collection.findUnique({ where: { slug: parsed.data.slug }, select: { id: true } });
  if (slugOwner && slugOwner.id !== id) return { error: "A collection with this slug already exists." };

  await db.collection.update({ where: { id }, data: parsed.data });
  revalidatePath(`/admin/collections/${id}/edit`);
  revalidatePath("/admin/collections");
  return { success: "Saved." };
}

export async function softDeleteCollectionAction(
  _prev: CollectionActionResult | null,
  formData: FormData,
): Promise<CollectionActionResult> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };

  const id = formData.get("id") as string;
  if (!id) return { error: "Collection ID is required." };

  await db.collection.update({ where: { id }, data: { isDeleted: true } });
  revalidatePath("/admin/collections");
  redirect("/admin/collections");
}

export async function setCollectionTitlesAction(
  _prev: CollectionActionResult | null,
  formData: FormData,
): Promise<CollectionActionResult> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };

  const id       = formData.get("collectionId") as string;
  if (!id) return { error: "Collection ID is required." };

  const titleIds = (formData.getAll("titleIds") as string[]).filter(Boolean);

  await db.collection.update({
    where: { id },
    data:  { titles: { set: titleIds.map((tid) => ({ id: tid })) } },
  });

  revalidatePath(`/admin/collections/${id}/edit`);
  return { success: "Titles updated." };
}
