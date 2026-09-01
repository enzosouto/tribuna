"use client";

import { Camera, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { UserAvatar } from "@/components/user-avatar";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface AvatarUploadProps {
  name: string;
  value: string | null;
  onChange: (url: string | null) => void;
  size?: number;
}

export function AvatarUpload({ name, value, onChange, size = 88 }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(value);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API_URL}/uploads/avatar`, { method: "POST", body: formData });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message ?? "Falha ao enviar imagem");
      onChange(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao enviar imagem");
      setPreview(value);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="group relative rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        style={{ width: size, height: size }}
        aria-label="Escolher foto de perfil"
      >
        <UserAvatar user={{ name: name || "?", avatarUrl: preview }} size={size} />
        <span
          className={cn(
            "absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100",
            uploading && "opacity-100",
          )}
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          ) : (
            <Camera className="h-5 w-5 text-white" />
          )}
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={handleFile}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="text-xs font-medium text-primary hover:underline"
      >
        {preview ? "Trocar foto" : "Adicionar foto"}
      </button>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
