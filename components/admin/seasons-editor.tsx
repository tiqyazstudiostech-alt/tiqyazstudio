"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import {
  createSeasonAction,
  updateSeasonAction,
  softDeleteSeasonAction,
  createEpisodeAction,
  updateEpisodeAction,
  softDeleteEpisodeAction,
} from "@/app/actions/titles";
import { VideoUpload } from "./video-upload";
import type { VideoStatus } from "@prisma/client";

interface EpisodeRow {
  id:           string;
  number:       number;
  title:        string | null;
  synopsis:     string | null;
  durationSec:  number | null;
  thumbnailUrl: string | null;
  bunnyVideoId: string | null;
  status:       VideoStatus;
}

interface SeasonRow {
  id:       string;
  number:   number;
  name:     string | null;
  episodes: EpisodeRow[];
}

type Mode =
  | { type: "idle" }
  | { type: "add-season" }
  | { type: "edit-season";  seasonId: string }
  | { type: "add-episode";  seasonId: string }
  | { type: "edit-episode"; episodeId: string; seasonId: string };

const inputCls =
  "w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-ink " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-gold";

const STATUS_CLS: Record<VideoStatus, string> = {
  PROCESSING: "text-warning",
  READY:      "text-success",
  ERROR:      "text-error",
};

function durationLabel(sec: number | null) {
  if (!sec) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

interface Props {
  titleId: string;
  seasons: SeasonRow[];
}

export function SeasonsEditor({ titleId, seasons }: Props) {
  const router = useRouter();
  const [mode, setMode]       = useState<Mode>({ type: "idle" });
  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(
    action: (p: null, fd: FormData) => Promise<{ error: string } | { success: string; id?: string } | null>,
    fd: FormData,
  ) {
    setLoading(true);
    setError(null);
    const result = await action(null, fd);
    setLoading(false);
    if (result && "error" in result) { setError(result.error); return; }
    setMode({ type: "idle" });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-ink">Seasons & Episodes</h2>
        {mode.type === "idle" && (
          <Button type="button" size="sm" variant="ghost" onClick={() => setMode({ type: "add-season" })}>
            + Add season
          </Button>
        )}
      </div>

      {error && <p className="text-sm text-error">{error}</p>}

      {/* Add season form */}
      {mode.type === "add-season" && (
        <form
          className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            fd.set("titleId", titleId);
            submit(createSeasonAction, fd);
          }}
        >
          <p className="text-sm font-medium text-ink">New season</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-ink-muted">Season number</label>
              <input name="number" type="number" min={1} defaultValue={seasons.length + 1} className={inputCls} required />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-ink-muted">Name (optional)</label>
              <input name="name" type="text" placeholder="Into the Wild" className={inputCls} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" loading={loading}>Add season</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => { setMode({ type: "idle" }); setError(null); }}>Cancel</Button>
          </div>
        </form>
      )}

      {seasons.length === 0 && mode.type !== "add-season" && (
        <p className="text-sm text-ink-muted">No seasons yet.</p>
      )}

      {seasons.map((season) => (
        <div key={season.id} className="bg-surface border border-border rounded-xl overflow-hidden">
          {/* Season header */}
          {mode.type === "edit-season" && mode.seasonId === season.id ? (
            <form
              className="p-4 flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                fd.set("id", season.id);
                fd.set("titleId", titleId);
                submit(updateSeasonAction, fd);
              }}
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-ink-muted">Season number</label>
                  <input name="number" type="number" min={1} defaultValue={season.number} className={inputCls} required />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-ink-muted">Name (optional)</label>
                  <input name="name" type="text" defaultValue={season.name ?? ""} className={inputCls} />
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <Button type="submit" size="sm" loading={loading}>Save</Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => { setMode({ type: "idle" }); setError(null); }}>Cancel</Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-error ml-auto"
                  onClick={() => {
                    const fd = new FormData();
                    fd.set("id", season.id);
                    fd.set("titleId", titleId);
                    submit(softDeleteSeasonAction, fd);
                  }}
                >
                  Delete season
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-sm font-medium text-ink">
                Season {season.number}{season.name ? ` — ${season.name}` : ""}
              </span>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="ghost" onClick={() => setMode({ type: "edit-season", seasonId: season.id })}>
                  Edit
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setMode({ type: "add-episode", seasonId: season.id })}>
                  + Episode
                </Button>
              </div>
            </div>
          )}

          {/* Episodes */}
          <ul className="divide-y divide-border">
            {season.episodes.map((ep) => (
              <li key={ep.id}>
                {mode.type === "edit-episode" && mode.episodeId === ep.id ? (
                  <div className="p-4 flex flex-col gap-4">
                    <form
                      className="flex flex-col gap-3"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const fd = new FormData(e.currentTarget);
                        fd.set("id", ep.id);
                        fd.set("titleId", titleId);
                        fd.set("seasonId", season.id);
                        submit(updateEpisodeAction, fd);
                      }}
                    >
                      <EpisodeFields defaultValues={ep} />
                      <div className="flex gap-2 items-center">
                        <Button type="submit" size="sm" loading={loading}>Save</Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => { setMode({ type: "idle" }); setError(null); }}>Cancel</Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="text-error ml-auto"
                          onClick={() => {
                            const fd = new FormData();
                            fd.set("id", ep.id);
                            fd.set("titleId", titleId);
                            submit(softDeleteEpisodeAction, fd);
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </form>

                    {/* Video upload — only in edit mode */}
                    <div className="border-t border-border pt-3">
                      <VideoUpload
                        episodeId={ep.id}
                        videoTitle={ep.title ?? `Episode ${ep.number}`}
                        currentStatus={ep.status}
                        bunnyVideoId={ep.bunnyVideoId}
                        thumbnailUrl={ep.thumbnailUrl}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      {ep.status === "READY" && ep.thumbnailUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={ep.thumbnailUrl} alt="" className="h-9 w-16 rounded object-cover shrink-0" />
                      )}
                      <div>
                        <p className="text-sm text-ink">E{ep.number}. {ep.title ?? "(untitled)"}</p>
                        <p className="text-xs">
                          <span className="text-ink-muted">{durationLabel(ep.durationSec)}</span>
                          {" · "}
                          <span className={STATUS_CLS[ep.status]}>{ep.status}</span>
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setMode({ type: "edit-episode", episodeId: ep.id, seasonId: season.id })}
                    >
                      Edit
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>

          {/* Add episode form */}
          {mode.type === "add-episode" && mode.seasonId === season.id && (
            <form
              className="p-4 border-t border-border flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                fd.set("titleId", titleId);
                fd.set("seasonId", season.id);
                submit(createEpisodeAction, fd);
              }}
            >
              <p className="text-sm font-medium text-ink">New episode</p>
              <EpisodeFields defaultValues={{ number: season.episodes.length + 1 }} />
              <div className="flex gap-2">
                <Button type="submit" size="sm" loading={loading}>Add episode</Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => { setMode({ type: "idle" }); setError(null); }}>Cancel</Button>
              </div>
            </form>
          )}
        </div>
      ))}
    </div>
  );
}

function EpisodeFields({ defaultValues }: { defaultValues?: Partial<EpisodeRow & { number: number }> }) {
  const cls =
    "w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-ink " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-gold";

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-ink-muted">Episode number</label>
        <input name="number" type="number" min={1} defaultValue={defaultValues?.number ?? 1} className={cls} required />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-ink-muted">Episode title</label>
        <input name="title" type="text" defaultValue={defaultValues?.title ?? ""} placeholder="First Light" className={cls} />
      </div>
      <div className="col-span-2 flex flex-col gap-1">
        <label className="text-xs text-ink-muted">Synopsis</label>
        <textarea name="synopsis" rows={2} defaultValue={defaultValues?.synopsis ?? ""} className={cls} />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-ink-muted">Duration (seconds)</label>
        <input name="durationSec" type="number" min={1} defaultValue={defaultValues?.durationSec ?? ""} placeholder="2700" className={cls} />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-ink-muted">Thumbnail URL</label>
        <input name="thumbnailUrl" type="url" defaultValue={defaultValues?.thumbnailUrl ?? ""} placeholder="https://…" className={cls} />
      </div>
    </div>
  );
}
