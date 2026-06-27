"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";
import { ContentImageUpload } from "./content-image-upload";
import {
  createTitleAction,
  updateTitleAction,
  type ContentActionResult,
} from "@/app/actions/titles";
import type { ContentStatus, TitleType } from "@prisma/client";

const inputCls =
  "w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-ink " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-gold " +
  "disabled:opacity-40 disabled:cursor-not-allowed";

function toSlug(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface TitleFormProps {
  titleId?: string;
  initialData?: {
    type: TitleType;
    title: string;
    slug: string;
    synopsis: string | null;
    releaseYear: number | null;
    maturityRating: string | null;
    isPremium: boolean;
    status: ContentStatus;
    posterUrl: string | null;
    backdropUrl: string | null;
    trailerUrl: string | null;
    genreIds: string[];
    languageIds: string[];
  };
  genres: { id: string; name: string }[];
  languages: { id: string; code: string; name: string }[];
}

export function TitleForm({ titleId, initialData, genres, languages }: TitleFormProps) {
  const router = useRouter();
  const isEdit = !!titleId;

  const action = isEdit ? updateTitleAction : createTitleAction;
  const [state, formAction, isPending] = useActionState<ContentActionResult | null, FormData>(
    action,
    null,
  );

  const [titleValue, setTitleValue] = useState(initialData?.title ?? "");
  const [slugValue, setSlugValue]   = useState(initialData?.slug ?? "");
  const [slugEdited, setSlugEdited]  = useState(isEdit);

  // After successful create, action redirects so this only fires on update success
  useEffect(() => {
    if (state && "id" in state && state.id) {
      router.push(`/admin/titles/${state.id}/edit`);
    }
  }, [state, router]);

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setTitleValue(val);
    if (!slugEdited) setSlugValue(toSlug(val));
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {isEdit && <input type="hidden" name="id" value={titleId} />}

      {/* Status feedback */}
      {state && "error" in state && (
        <p className="text-sm text-error">{state.error}</p>
      )}
      {state && "success" in state && (
        <p className="text-sm text-success">{state.success}</p>
      )}

      {/* Type + Status */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink">Type</label>
          <select name="type" defaultValue={initialData?.type ?? "FILM"} className={inputCls}>
            <option value="FILM">Film</option>
            <option value="SERIES">Series</option>
            <option value="PODCAST">Podcast</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink">Status</label>
          <select name="status" defaultValue={initialData?.status ?? "DRAFT"} className={inputCls}>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {/* Title + Slug */}
      <Input
        name="title"
        label="Title"
        value={titleValue}
        onChange={handleTitleChange}
        placeholder="Nairobi Noir"
        required
      />
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ink">Slug</label>
        <input
          name="slug"
          value={slugValue}
          onChange={(e) => { setSlugValue(e.target.value); setSlugEdited(true); }}
          placeholder="nairobi-noir"
          className={inputCls}
          required
        />
        <p className="text-xs text-ink-muted">Lowercase letters, numbers, and hyphens only.</p>
      </div>

      {/* Synopsis */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ink">Synopsis</label>
        <textarea
          name="synopsis"
          defaultValue={initialData?.synopsis ?? ""}
          rows={3}
          placeholder="A short description…"
          className={inputCls}
        />
      </div>

      {/* Release year + maturity rating + isPremium */}
      <div className="grid grid-cols-3 gap-4">
        <Input
          name="releaseYear"
          type="number"
          label="Release year"
          defaultValue={initialData?.releaseYear ?? ""}
          placeholder="2024"
          min={1900}
          max={2100}
        />
        <Input
          name="maturityRating"
          label="Maturity rating"
          defaultValue={initialData?.maturityRating ?? ""}
          placeholder="PG / 16+"
        />
        <div className="flex flex-col gap-1.5 justify-center pt-5">
          <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
            <input
              type="checkbox"
              name="isPremium"
              defaultChecked={initialData?.isPremium ?? false}
              className="accent-gold"
            />
            Premium only
          </label>
        </div>
      </div>

      {/* Images */}
      <div className="grid grid-cols-2 gap-6">
        <ContentImageUpload
          name="posterUrl"
          label="Poster (portrait)"
          currentUrl={initialData?.posterUrl ?? null}
          field="poster"
        />
        <ContentImageUpload
          name="backdropUrl"
          label="Backdrop (wide)"
          currentUrl={initialData?.backdropUrl ?? null}
          field="backdrop"
        />
      </div>

      <Input
        name="trailerUrl"
        label="Trailer URL"
        defaultValue={initialData?.trailerUrl ?? ""}
        placeholder="https://…"
        type="url"
      />

      {/* Genres */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-ink">Genres</span>
        <div className="grid grid-cols-3 gap-2 p-3 bg-surface rounded-lg border border-border max-h-48 overflow-y-auto">
          {genres.map((g) => (
            <label key={g.id} className="flex items-center gap-2 text-sm text-ink cursor-pointer">
              <input
                type="checkbox"
                name="genreIds"
                value={g.id}
                defaultChecked={initialData?.genreIds.includes(g.id) ?? false}
                className="accent-gold"
              />
              {g.name}
            </label>
          ))}
        </div>
      </div>

      {/* Languages */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-ink">Languages</span>
        <div className="grid grid-cols-4 gap-2 p-3 bg-surface rounded-lg border border-border">
          {languages.map((l) => (
            <label key={l.id} className="flex items-center gap-2 text-sm text-ink cursor-pointer">
              <input
                type="checkbox"
                name="languageIds"
                value={l.id}
                defaultChecked={initialData?.languageIds.includes(l.id) ?? false}
                className="accent-gold"
              />
              {l.name}
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" loading={isPending}>
          {isEdit ? "Save changes" : "Create title"}
        </Button>
      </div>
    </form>
  );
}
