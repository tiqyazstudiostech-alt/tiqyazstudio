"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { initiateVideoUploadAction } from "@/app/actions/video";
import type { VideoStatus } from "@prisma/client";

type Phase = "idle" | "requesting" | "uploading" | "done" | "error";

interface Props {
  episodeId:     string;
  videoTitle:    string;
  currentStatus: VideoStatus;
  bunnyVideoId:  string | null;
  thumbnailUrl:  string | null;
}

const STATUS_STYLE: Record<VideoStatus, { label: string; cls: string }> = {
  PROCESSING: { label: "Processing", cls: "text-warning"  },
  READY:      { label: "Ready",      cls: "text-success"  },
  ERROR:      { label: "Error",      cls: "text-error"    },
};

export function VideoUpload({
  episodeId,
  videoTitle,
  currentStatus,
  bunnyVideoId,
  thumbnailUrl,
}: Props) {
  const router  = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase]               = useState<Phase>("idle");
  const [progress, setProgress]         = useState(0);
  const [uploadError, setUploadError]   = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { label, cls } = STATUS_STYLE[currentStatus];

  async function handleUpload() {
    if (!selectedFile) return;
    setPhase("requesting");
    setUploadError(null);

    const result = await initiateVideoUploadAction(episodeId, videoTitle || "Untitled");
    if ("error" in result) {
      setUploadError(result.error);
      setPhase("error");
      return;
    }

    const { signature } = result;
    setPhase("uploading");
    setProgress(0);

    try {
      // Dynamic import keeps tus-js-client out of the SSR bundle
      const tus = await import("tus-js-client");

      const upload = new tus.Upload(selectedFile, {
        endpoint:    "https://video.bunnycdn.com/tusupload",
        retryDelays: [0, 3000, 5000, 10000, 20000],
        // Bunny TUS auth headers (not metadata)
        headers: {
          AuthorizationSignature: signature.signature,
          AuthorizationExpire:    String(signature.expirationTime),
          VideoId:                signature.videoId,
          LibraryId:              String(signature.libraryId),
        },
        metadata: {
          filetype: selectedFile.type,
          title:    videoTitle || "Untitled",
        },
        onError(err) {
          setUploadError(`Upload failed: ${err.message}`);
          setPhase("error");
        },
        onProgress(uploaded, total) {
          setProgress(Math.round((uploaded / total) * 100));
        },
        onSuccess() {
          setPhase("done");
          setSelectedFile(null);
          // Refresh server component so the episode row shows PROCESSING status
          router.refresh();
        },
      });

      // Resume interrupted uploads automatically
      const previous = await upload.findPreviousUploads();
      if (previous.length) upload.resumeFromPreviousUpload(previous[0]);
      upload.start();
    } catch (err) {
      setUploadError("Upload failed. Please try again.");
      setPhase("error");
    }
  }

  return (
    <div className="flex flex-col gap-2 pt-1">
      {/* Current status + thumbnail */}
      <div className="flex items-center gap-3">
        <span className={`text-xs font-medium ${cls}`}>Video: {label}</span>
        {currentStatus === "READY" && thumbnailUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbnailUrl} alt="thumbnail" className="h-10 rounded object-cover" />
        )}
      </div>

      {/* Upload UI */}
      {phase === "done" ? (
        <p className="text-xs text-success">Uploaded — transcoding in progress.</p>
      ) : phase === "uploading" ? (
        <div className="flex flex-col gap-1.5 max-w-xs">
          <p className="text-xs text-ink-muted">Uploading… {progress}%</p>
          <div className="h-1.5 bg-surface-raised rounded-full overflow-hidden">
            <div
              className="h-full bg-gold transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : phase === "requesting" ? (
        <p className="text-xs text-ink-muted">Preparing upload…</p>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {selectedFile ? (
            <>
              <span className="text-xs text-ink-muted truncate max-w-[160px]">
                {selectedFile.name}
              </span>
              <Button type="button" size="sm" onClick={handleUpload}>
                Upload
              </Button>
              <button
                type="button"
                className="text-xs text-ink-muted hover:text-ink"
                onClick={() => { setSelectedFile(null); setUploadError(null); }}
              >
                Cancel
              </button>
            </>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => fileRef.current?.click()}
            >
              {bunnyVideoId ? "Re-upload video" : "Upload video"}
            </Button>
          )}
        </div>
      )}

      {uploadError && <p className="text-xs text-error">{uploadError}</p>}

      <input
        ref={fileRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) { setSelectedFile(f); setUploadError(null); }
          (e.target as HTMLInputElement).value = "";
        }}
      />
    </div>
  );
}
