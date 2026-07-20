"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X, Play } from "lucide-react";
import { cn } from "@/lib/utils";

export type MediaItem = { url: string; type: "image" | "video"; name?: string };

export function MediaUploader({
  value,
  onChange,
  className,
}: {
  value: MediaItem[];
  onChange: (items: MediaItem[]) => void;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError(null);
    const uploaded: MediaItem[] = [];
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (res.ok && data.url) uploaded.push(data);
        else setError(data.error || "Upload failed");
      } catch {
        setError("Upload failed");
      }
    }
    onChange([...value, ...uploaded]);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-xs font-medium text-muted hover:border-brand-400 hover:text-brand-600 transition-colors disabled:opacity-50"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
        {busy ? "Uploading…" : "Attach screenshots / video"}
      </button>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {value.map((m, i) => (
            <div key={i} className="relative group">
              <MediaThumb item={m} className="w-20 h-20" />
              <button
                type="button"
                onClick={() => onChange(value.filter((_, j) => j !== i))}
                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function MediaThumb({ item, className }: { item: MediaItem; className?: string }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noreferrer"
      className={cn("relative block rounded-lg overflow-hidden border border-border bg-slate-100", className)}
    >
      {item.type === "video" ? (
        <>
          <video src={item.url} className="w-full h-full object-cover" muted preload="metadata" />
          <span className="absolute inset-0 flex items-center justify-center bg-black/30">
            <Play className="w-5 h-5 text-white" fill="white" />
          </span>
        </>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.url} alt={item.name || "attachment"} className="w-full h-full object-cover" />
      )}
    </a>
  );
}

export function MediaGallery({ items }: { items: MediaItem[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {items.map((m, i) => (
        <MediaThumb key={i} item={m} className="w-24 h-24" />
      ))}
    </div>
  );
}
