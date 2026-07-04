"use client";

import { useState, useRef } from "react";
import { Upload, X, ImageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LogoUpload({
  onUploaded,
}: {
  onUploaded: (url: string | null) => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setErrorMsg("File harus berupa gambar");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg("Ukuran logo maksimal 2MB");
      return;
    }

    setErrorMsg(null);
    setUploading(true);
    setPreview(URL.createObjectURL(file));

    try {
      const ext = file.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;

      const { error } = await supabase.storage
        .from("logo-perusahaan")
        .upload(path, file, { upsert: false });

      if (error) {
        setErrorMsg("Gagal mengunggah logo");
        onUploaded(null);
        return;
      }

      const { data } = supabase.storage.from("logo-perusahaan").getPublicUrl(path);
      onUploaded(data.publicUrl);
    } catch {
      setErrorMsg("Gagal mengunggah logo");
      onUploaded(null);
    } finally {
      setUploading(false);
    }
  }

  function handleRemove() {
    setPreview(null);
    onUploaded(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {preview ? (
        <div className="flex items-center gap-3">
          <img
            src={preview}
            alt="Logo perusahaan"
            className="h-16 w-16 rounded-lg object-contain border border-slate-200 bg-white"
          />
          <div className="text-sm">
            {uploading ? (
              <span className="text-slate-500">Mengunggah...</span>
            ) : (
              <span className="text-green-600">Logo terunggah</span>
            )}
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="ml-auto text-slate-400 hover:text-red-600"
            aria-label="Hapus logo"
          >
            <X size={18} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 py-6 text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600 transition"
        >
          <ImageIcon size={18} />
          <span>Klik untuk unggah logo perusahaan</span>
          <Upload size={16} />
        </button>
      )}

      {errorMsg && <p className="text-xs text-red-600 mt-1">{errorMsg}</p>}
    </div>
  );
}