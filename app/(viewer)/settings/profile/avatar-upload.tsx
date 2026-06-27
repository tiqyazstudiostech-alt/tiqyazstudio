"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui";
import {
  requestAvatarUploadAction,
  saveAvatarUrlAction,
} from "@/app/actions/profile";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

type Phase = "idle" | "uploading" | "error";

interface Props {
  currentAvatarUrl: string | null;
  name: string | null;
}

export function AvatarUpload({ currentAvatarUrl, name }: Props) {
  const [currentUrl, setCurrentUrl] = useState(currentAvatarUrl);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = (name ?? "?").slice(0, 2).toUpperCase();
  const displayUrl = preview ?? currentUrl;
  const isUploading = phase === "uploading";

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("File must be a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("File must be under 5 MB.");
      return;
    }

    setError(null);
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    setPhase("idle");
  }

  async function handleUpload() {
    if (!selectedFile) return;

    setPhase("uploading");
    setError(null);

    try {
      // 1. Request presigned PUT URL from the server
      const urlResult = await requestAvatarUploadAction(selectedFile.type);
      if ("error" in urlResult) {
        setError(urlResult.error);
        setPhase("error");
        return;
      }

      // 2. Upload directly from browser to R2 — file bytes never pass through app server
      const uploadRes = await fetch(urlResult.uploadUrl, {
        method: "PUT",
        body: selectedFile,
        headers: { "Content-Type": selectedFile.type },
      });

      if (!uploadRes.ok) {
        setError("Upload failed. Please try again.");
        setPhase("error");
        return;
      }

      // 3. Persist the public URL to the profile
      const saveResult = await saveAvatarUrlAction(urlResult.publicUrl);
      if (saveResult && "error" in saveResult) {
        setError(saveResult.error);
        setPhase("error");
        return;
      }

      setCurrentUrl(urlResult.publicUrl);
      setPreview(null);
      setSelectedFile(null);
      setPhase("idle");
    } catch {
      setError("Something went wrong. Please try again.");
      setPhase("error");
    }
  }

  return (
    <div className="flex items-center gap-6">
      {/* Avatar circle */}
      <div className="relative h-20 w-20 shrink-0 rounded-full overflow-hidden bg-surface-raised border border-border">
        {displayUrl ? (
          // Plain img — R2 domain not configured in next.config, unoptimized avoids that
          // eslint-disable-next-line @next/next/no-img-element
          <img src={displayUrl} alt="Avatar" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-ink-muted">
            {initials}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {selectedFile ? "Change selection" : "Choose photo"}
          </Button>

          {selectedFile && (
            <Button
              type="button"
              size="sm"
              loading={isUploading}
              onClick={handleUpload}
            >
              Upload
            </Button>
          )}
        </div>

        {selectedFile && !error && (
          <p className="text-xs text-ink-muted truncate max-w-[200px]">{selectedFile.name}</p>
        )}
        {error && <p className="text-xs text-error">{error}</p>}
        {!selectedFile && !error && (
          <p className="text-xs text-ink-muted">JPEG, PNG, or WebP · max 5 MB</p>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileSelect}
        // Reset value so re-selecting the same file fires onChange
        onClick={(e) => ((e.target as HTMLInputElement).value = "")}
      />
    </div>
  );
}
