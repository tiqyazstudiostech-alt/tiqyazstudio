"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui";
import { requestContentImageUploadAction } from "@/app/actions/titles";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

type Phase = "idle" | "uploading" | "error";

interface Props {
  name: string;
  label: string;
  currentUrl: string | null;
  field: "poster" | "backdrop" | "thumbnail";
}

export function ContentImageUpload({ name, label, currentUrl, field }: Props) {
  const [storedUrl, setStoredUrl]     = useState<string | null>(currentUrl);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview]         = useState<string | null>(null);
  const [phase, setPhase]             = useState<Phase>("idle");
  const [error, setError]             = useState<string | null>(null);
  const fileInputRef                  = useRef<HTMLInputElement>(null);

  const displayUrl  = preview ?? storedUrl;
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
      const urlResult = await requestContentImageUploadAction(selectedFile.type, field);
      if ("error" in urlResult) { setError(urlResult.error); setPhase("error"); return; }

      const uploadRes = await fetch(urlResult.uploadUrl, {
        method:  "PUT",
        body:    selectedFile,
        headers: { "Content-Type": selectedFile.type },
      });
      if (!uploadRes.ok) { setError("Upload failed. Please try again."); setPhase("error"); return; }

      setStoredUrl(urlResult.publicUrl);
      setPreview(null);
      setSelectedFile(null);
      setPhase("idle");
    } catch {
      setError("Something went wrong. Please try again.");
      setPhase("error");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-ink">{label}</span>

      {/* Preview */}
      <div className="w-32 h-32 rounded-lg overflow-hidden bg-surface-raised border border-border flex items-center justify-center shrink-0">
        {displayUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={displayUrl} alt={label} className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs text-ink-muted">No image</span>
        )}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {selectedFile ? "Change selection" : "Choose image"}
        </Button>
        {selectedFile && (
          <Button type="button" size="sm" loading={isUploading} onClick={handleUpload}>
            Upload
          </Button>
        )}
      </div>

      {selectedFile && !error && (
        <p className="text-xs text-ink-muted truncate max-w-xs">{selectedFile.name}</p>
      )}
      {error && <p className="text-xs text-error">{error}</p>}

      {/* Hidden input carries the URL into the parent form's FormData */}
      <input type="hidden" name={name} value={storedUrl ?? ""} />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileSelect}
        onClick={(e) => ((e.target as HTMLInputElement).value = "")}
      />
    </div>
  );
}
