"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui";
import { setCollectionTitlesAction, type CollectionActionResult } from "@/app/actions/collections";
import type { TitleType, ContentStatus } from "@prisma/client";

interface TitleOption {
  id: string;
  title: string;
  type: TitleType;
  status: ContentStatus;
}

interface Props {
  collectionId: string;
  assignedIds: string[];
  allTitles: TitleOption[];
}

export function CollectionTitlesEditor({ collectionId, assignedIds, allTitles }: Props) {
  const [state, action, isPending] = useActionState<CollectionActionResult | null, FormData>(
    setCollectionTitlesAction,
    null,
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="collectionId" value={collectionId} />

      {state && "error" in state && <p className="text-sm text-error">{state.error}</p>}
      {state && "success" in state && <p className="text-sm text-success">{state.success}</p>}

      <div className="border border-border rounded-xl overflow-hidden max-h-96 overflow-y-auto">
        {allTitles.length === 0 && (
          <p className="p-4 text-sm text-ink-muted">No published titles available.</p>
        )}
        {allTitles.map((t) => (
          <label
            key={t.id}
            className="flex items-center gap-3 px-4 py-3 border-b last:border-0 border-border cursor-pointer hover:bg-surface-raised"
          >
            <input
              type="checkbox"
              name="titleIds"
              value={t.id}
              defaultChecked={assignedIds.includes(t.id)}
              className="accent-gold"
            />
            <div>
              <p className="text-sm text-ink">{t.title}</p>
              <p className="text-xs text-ink-muted">{t.type} · {t.status}</p>
            </div>
          </label>
        ))}
      </div>

      <div>
        <Button type="submit" size="sm" loading={isPending}>
          Save title selection
        </Button>
      </div>
    </form>
  );
}
