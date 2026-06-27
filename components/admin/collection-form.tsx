"use client";

import { useActionState, useState } from "react";
import { Button, Input } from "@/components/ui";
import {
  createCollectionAction,
  updateCollectionAction,
  type CollectionActionResult,
} from "@/app/actions/collections";

function toSlug(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const inputCls =
  "w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-ink " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-gold";

interface CollectionFormProps {
  collectionId?: string;
  initialData?: {
    name: string;
    slug: string;
    description: string | null;
    displayOrder: number;
    isActive: boolean;
  };
}

export function CollectionForm({ collectionId, initialData }: CollectionFormProps) {
  const isEdit = !!collectionId;
  const action = isEdit ? updateCollectionAction : createCollectionAction;
  const [state, formAction, isPending] = useActionState<CollectionActionResult | null, FormData>(
    action,
    null,
  );

  const [nameValue, setNameValue] = useState(initialData?.name ?? "");
  const [slugValue, setSlugValue] = useState(initialData?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(isEdit);

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setNameValue(val);
    if (!slugEdited) setSlugValue(toSlug(val));
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {isEdit && <input type="hidden" name="id" value={collectionId} />}

      {state && "error" in state && <p className="text-sm text-error">{state.error}</p>}
      {state && "success" in state && <p className="text-sm text-success">{state.success}</p>}

      <Input
        name="name"
        label="Name"
        value={nameValue}
        onChange={handleNameChange}
        placeholder="Trending Now"
        required
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ink">Slug</label>
        <input
          name="slug"
          value={slugValue}
          onChange={(e) => { setSlugValue(e.target.value); setSlugEdited(true); }}
          placeholder="trending-now"
          className={inputCls}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ink">Description</label>
        <textarea
          name="description"
          rows={2}
          defaultValue={initialData?.description ?? ""}
          placeholder="Optional description…"
          className={inputCls}
        />
      </div>

      <Input
        name="displayOrder"
        label="Display order"
        type="number"
        defaultValue={initialData?.displayOrder ?? 0}
      />

      <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={initialData?.isActive ?? true}
          className="accent-gold"
        />
        Active (visible on site)
      </label>

      <div className="pt-1">
        <Button type="submit" loading={isPending}>
          {isEdit ? "Save changes" : "Create collection"}
        </Button>
      </div>
    </form>
  );
}
