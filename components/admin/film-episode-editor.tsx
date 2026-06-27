"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui";
import { updateEpisodeAction, type ContentActionResult } from "@/app/actions/titles";
import type { VideoStatus } from "@prisma/client";

interface Props {
  titleId: string;
  episode: {
    id: string;
    number: number;
    title: string | null;
    synopsis: string | null;
    durationSec: number | null;
    thumbnailUrl: string | null;
    status: VideoStatus;
  };
}

const inputCls =
  "w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-ink " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-gold";

export function FilmEpisodeEditor({ titleId, episode }: Props) {
  const [state, action, isPending] = useActionState<ContentActionResult | null, FormData>(
    updateEpisodeAction,
    null,
  );

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-base font-semibold text-ink">Feature film episode</h2>
      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="id" value={episode.id} />
        <input type="hidden" name="titleId" value={titleId} />
        <input type="hidden" name="number" value={episode.number} />
        <input type="hidden" name="seasonId" value="" />

        {state && "error" in state && <p className="text-sm text-error">{state.error}</p>}
        {state && "success" in state && <p className="text-sm text-success">{state.success}</p>}

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-ink-muted">Episode title (optional)</label>
            <input name="title" type="text" defaultValue={episode.title ?? ""} className={inputCls} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-ink-muted">Duration (seconds)</label>
            <input name="durationSec" type="number" min={1} defaultValue={episode.durationSec ?? ""} placeholder="5880" className={inputCls} />
          </div>
          <div className="col-span-2 flex flex-col gap-1">
            <label className="text-xs text-ink-muted">Synopsis</label>
            <textarea name="synopsis" rows={2} defaultValue={episode.synopsis ?? ""} className={inputCls} />
          </div>
          <div className="col-span-2 flex flex-col gap-1">
            <label className="text-xs text-ink-muted">Thumbnail URL</label>
            <input name="thumbnailUrl" type="url" defaultValue={episode.thumbnailUrl ?? ""} placeholder="https://…" className={inputCls} />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button type="submit" size="sm" loading={isPending}>Save episode</Button>
          <span className="text-xs text-ink-muted">Status: {episode.status}</span>
        </div>
      </form>
    </div>
  );
}
